import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../database/app_database.dart';
import 'package:drift/drift.dart' show Value;
import '../api/api_client.dart';
import '../connectivity/connectivity_manager.dart';
import '../sync/sync_engine.dart';

/// OfflineRepository — the single data access layer for all screens.
///
/// Every screen uses this instead of calling ApiClient directly.
/// When online: fetches from server API + caches locally.
/// When offline: reads from local SQLite cache + queues writes for sync.
///
/// Usage:
///   final repo = OfflineRepository(db, api, connectivity, syncEngine);
///   final farmers = await repo.getFarmers(); // works online + offline
///   await repo.createFarmer({...}); // works online + offline
class OfflineRepository {
  final AppDatabase _db;
  final ApiClient _api;
  final ConnectivityManager _connectivity;
  final SyncEngine _syncEngine;

  OfflineRepository(this._db, this._api, this._connectivity, this._syncEngine);

  bool get _isOnline => _connectivity.isOnline;

  // ════════════════════════════════════════════════════════════
  // FARMERS
  // ════════════════════════════════════════════════════════════

  Future<List<Map<String, dynamic>>> getFarmers({String? search, int limit = 200}) async {
    if (_isOnline) {
      try {
        final res = await _api.get('/api/farmers?limit=$limit${search != null ? '&search=$search' : ''}');
        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          final farmers = data['farmers'] as List<dynamic>? ?? [];
          // Cache for offline use
          for (final f in farmers) {
            await _db.upsertFarmer(FarmerCacheCompanion.insert(
              id: f['id'],
              tenantId: f['tenantId'] ?? '',
              firstName: f['firstName'] ?? '',
              lastName: f['lastName'] ?? '',
              phone: f['phone'] ?? '',
              farmerCode: Value(f['farmerCode']),
              gender: Value(f['gender']),
              email: Value(f['email']),
              villageName: Value(f['villageName'] ?? f['district']),
              district: Value(f['district']),
              country: Value(f['country']),
              isCertified: Value(f['isCertified'] ?? false),
              certificationType: Value(f['certificationType']),
              farmSize: Value(f['farmSize']?.toDouble()),
              status: Value(f['status'] ?? 'ACTIVE'),
              photoUrl: Value(f['photoUrl']),
              syncStatus: Value('synced'),
              lastSyncedAt: Value(DateTime.now()),
              updatedAt: Value(f['updatedAt'] != null ? DateTime.tryParse(f['updatedAt']) : null),
            ));
          }
          return farmers.cast<Map<String, dynamic>>();
        }
      } catch (e) {
        debugPrint('[OfflineRepo] Farmers API failed, falling back to cache: $e');
      }
    }

    // Offline: read from local cache
    final cached = await _db.getCachedFarmers();
    var results = cached.map((f) => {
      'id': f.id,
      'farmerCode': f.farmerCode,
      'firstName': f.firstName,
      'lastName': f.lastName,
      'phone': f.phone,
      'gender': f.gender,
      'email': f.email,
      'villageName': f.villageName,
      'district': f.district,
      'country': f.country,
      'isCertified': f.isCertified,
      'certificationType': f.certificationType,
      'farmSize': f.farmSize,
      'status': f.status,
      'photoUrl': f.photoUrl,
      'syncStatus': f.syncStatus,
    }).toList();

    // Filter by search
    if (search != null && search.isNotEmpty) {
      results = results.where((f) {
        final name = '${f['firstName']} ${f['lastName']}'.toLowerCase();
        return name.contains(search.toLowerCase()) ||
            (f['phone']?.toString() ?? '').contains(search) ||
            (f['farmerCode'] ?? '').toString().toLowerCase().contains(search.toLowerCase());
      }).toList();
    }

    return results;
  }

  Future<Map<String, dynamic>?> getFarmerById(String id) async {
    if (_isOnline) {
      try {
        final res = await _api.get('/api/farmers?farmerId=$id');
        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          return data['farmer'] ?? data;
        }
      } catch (e) {
        debugPrint('[OfflineRepo] Farmer detail API failed: $e');
      }
    }

    // Offline: read from cache
    final cached = await _db.getCachedFarmers();
    try {
      final farmer = cached.firstWhere((f) => f.id == id);
      return {
        'id': farmer.id,
        'farmerCode': farmer.farmerCode,
        'firstName': farmer.firstName,
        'lastName': farmer.lastName,
        'phone': farmer.phone,
        'gender': farmer.gender,
        'email': farmer.email,
        'villageName': farmer.villageName,
        'district': farmer.district,
        'country': farmer.country,
        'isCertified': farmer.isCertified,
        'certificationType': farmer.certificationType,
        'farmSize': farmer.farmSize,
        'status': farmer.status,
        'photoUrl': farmer.photoUrl,
      };
    } catch (_) {
      return null;
    }
  }

  Future<Map<String, dynamic>?> createFarmer(Map<String, dynamic> data) async {
    final localId = DateTime.now().millisecondsSinceEpoch.toString();
    data['id'] = localId;

    if (_isOnline) {
      try {
        final res = await _api.post('/api/farmers', body: data);
        if (res.statusCode == 201) {
          final farmer = jsonDecode(res.body);
          // Cache the server-created farmer
          await _db.upsertFarmer(FarmerCacheCompanion.insert(
            id: farmer['id'],
            tenantId: farmer['tenantId'] ?? '',
            firstName: farmer['firstName'] ?? '',
            lastName: farmer['lastName'] ?? '',
            phone: farmer['phone'] ?? '',
            syncStatus: Value('synced'),
            lastSyncedAt: Value(DateTime.now()),
          ));
          return farmer;
        }
      } catch (e) {
        debugPrint('[OfflineRepo] Create farmer API failed, queuing: $e');
      }
    }

    // Offline: save locally + queue for sync
    await _db.upsertFarmer(FarmerCacheCompanion.insert(
      id: localId,
      tenantId: data['tenantId'] ?? '',
      firstName: data['firstName'] ?? '',
      lastName: data['lastName'] ?? '',
      phone: data['phone'] ?? '',
      gender: Value(data['gender']),
      email: Value(data['email']),
      villageName: Value(data['villageName']),
      district: Value(data['district']),
      country: Value(data['country']),
      farmSize: Value(data['farmSize']?.toDouble()),
      syncStatus: Value('pending'),
    ));

    await _syncEngine.queueWrite(
      entityType: 'farmer',
      entityId: localId,
      operation: 'create',
      payload: data,
    );

    return data;
  }

  // ════════════════════════════════════════════════════════════
  // FARM LANDS
  // ════════════════════════════════════════════════════════════

  FarmLandCacheCompanion _farmLandCompanion(Map<String, dynamic> f, {String syncStatus = 'synced'}) {
    return FarmLandCacheCompanion.insert(
      id: f['id'] ?? '',
      farmerId: f['farmerId'] ?? '',
      name: f['name'] ?? '',
      sizeHectares: Value(_toDouble(f['sizeHectares'])),
      latitude: Value(_toDouble(f['latitude'])),
      longitude: Value(_toDouble(f['longitude'])),
      landOwnership: Value(_toStr(f['landOwnership'])),
      waterSource: Value(_toStr(f['waterSource'])),
      soilFertility: Value(_toStr(f['soilFertility'])),
      boundaryGeoJson: Value(f['boundaryGeoJson'] != null ? jsonEncode(f['boundaryGeoJson']) : null),
      landSurveyNo: Value(_toStr(f['landSurveyNo'])),
      approachRoad: Value(_joinList(f['approachRoad'])),
      landTopology: Value(_toStr(f['landTopology'])),
      landGradient: Value(_joinList(f['landGradient'])),
      landDocumentUrl: Value(_toStr(f['landDocumentUrl'])),
      powerSource: Value(_toStr(f['powerSource'])),
      farmPhotoUrl: Value(_toStr(f['farmPhotoUrl'])),
      irrigationSource: Value(_joinList(f['irrigationSource'])),
      irrigationType: Value(_toStr(f['irrigationType'])),
      fullTimeWorkers: Value(_toDouble(f['fullTimeWorkers'])),
      partTimeWorkers: Value(_toDouble(f['partTimeWorkers'])),
      seasonalWorkers: Value(_toDouble(f['seasonalWorkers'])),
      familyWorkers: Value(_toDouble(f['familyWorkers'])),
      lastChemicalApplicationDate: Value(_toDate(f['lastChemicalApplicationDate'])),
      conventionalLands: Value(_toStr(f['conventionalLands'])),
      fallowPastureLand: Value(_toStr(f['fallowPastureLand'])),
      conventionalCrops: Value(_toStr(f['conventionalCrops'])),
      estYieldKg: Value(_toDouble(f['estYieldKg'])),
      certType: Value(_toStr(f['certType'])),
      conversionStatus: Value(_toStr(f['conversionStatus'])),
      conversionDate: Value(_toDate(f['conversionDate'])),
      inspectorName: Value(_toStr(f['inspectorName'])),
      conversionQualified: Value(f['conversionQualified'] == null ? null : (f['conversionQualified'] == true || f['conversionQualified'] == 'Yes')),
      conversionRemarks: Value(_toStr(f['conversionRemarks'])),
      soilCollectionDate: Value(_toDate(f['soilCollectionDate'])),
      soilLabTestingDate: Value(_toDate(f['soilLabTestingDate'])),
      soilResultDate: Value(_toDate(f['soilResultDate'])),
      soilReportUrl: Value(_toStr(f['soilReportUrl'])),
      soilSamplesInfo: Value(_toStr(f['soilSamplesInfo'])),
      soilCriteria: Value(f['soilCriteria'] != null ? jsonEncode(f['soilCriteria']) : null),
      syncStatus: Value(syncStatus),
      lastSyncedAt: Value(syncStatus == 'synced' ? DateTime.now() : null),
      updatedAt: Value(DateTime.now()),
    );
  }

  Map<String, dynamic> _farmLandMap(FarmLandCacheData f) {
    return {
      'id': f.id,
      'farmerId': f.farmerId,
      'name': f.name,
      'sizeHectares': f.sizeHectares,
      'latitude': f.latitude,
      'longitude': f.longitude,
      'landOwnership': f.landOwnership,
      'waterSource': f.waterSource,
      'soilFertility': f.soilFertility,
      'boundaryGeoJson': f.boundaryGeoJson != null ? jsonDecode(f.boundaryGeoJson!) : null,
      'landSurveyNo': f.landSurveyNo,
      'approachRoad': f.approachRoad,
      'landTopology': f.landTopology,
      'landGradient': f.landGradient,
      'landDocumentUrl': f.landDocumentUrl,
      'powerSource': f.powerSource,
      'farmPhotoUrl': f.farmPhotoUrl,
      'irrigationSource': f.irrigationSource,
      'irrigationType': f.irrigationType,
      'fullTimeWorkers': f.fullTimeWorkers,
      'partTimeWorkers': f.partTimeWorkers,
      'seasonalWorkers': f.seasonalWorkers,
      'familyWorkers': f.familyWorkers,
      'lastChemicalApplicationDate': f.lastChemicalApplicationDate?.toIso8601String(),
      'conventionalLands': f.conventionalLands,
      'fallowPastureLand': f.fallowPastureLand,
      'conventionalCrops': f.conventionalCrops,
      'estYieldKg': f.estYieldKg,
      'certType': f.certType,
      'conversionStatus': f.conversionStatus,
      'conversionDate': f.conversionDate?.toIso8601String(),
      'inspectorName': f.inspectorName,
      'conversionQualified': f.conversionQualified,
      'conversionRemarks': f.conversionRemarks,
      'soilCollectionDate': f.soilCollectionDate?.toIso8601String(),
      'soilLabTestingDate': f.soilLabTestingDate?.toIso8601String(),
      'soilResultDate': f.soilResultDate?.toIso8601String(),
      'soilReportUrl': f.soilReportUrl,
      'soilSamplesInfo': f.soilSamplesInfo,
      'soilCriteria': f.soilCriteria != null ? jsonDecode(f.soilCriteria!) : null,
      'syncStatus': f.syncStatus,
    };
  }

  Future<List<Map<String, dynamic>>> getFarmLands({String? farmerId}) async {
    if (_isOnline) {
      try {
        final res = await _api.get('/api/farm-lands${farmerId != null ? '?farmerId=$farmerId' : ''}');
        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          final farms = data['farms'] as List<dynamic>? ?? [];
          for (final f in farms) {
            await _db.upsertFarmLand(_farmLandCompanion(f.cast<String, dynamic>()));
          }
          return farms.cast<Map<String, dynamic>>().toList();
        }
      } catch (e) {
        debugPrint('[OfflineRepo] Farm lands API failed: $e');
      }
    }

    // Offline
    final cached = await _db.getCachedFarmLands(farmerId: farmerId);
    return cached.map(_farmLandMap).toList();
  }

  Future<Map<String, dynamic>?> getFarmLandById(String id) async {
    if (_isOnline) {
      try {
        final res = await _api.get('/api/farm-lands/$id');
        if (res.statusCode == 200) {
          final farm = (jsonDecode(res.body)['farm'] as Map<String, dynamic>?) ?? {};
          if (farm.isNotEmpty) {
            await _db.upsertFarmLand(_farmLandCompanion(farm));
          }
          return farm;
        }
      } catch (e) {
        debugPrint('[OfflineRepo] Farm land detail API failed: $e');
      }
    }
    final cached = await _db.getCachedFarmLands();
    final match = cached.where((f) => f.id == id).toList();
    if (match.isEmpty) return null;
    return _farmLandMap(match.first);
  }

  Future<Map<String, dynamic>?> createFarmLand(Map<String, dynamic> data) async {
    final localId = DateTime.now().millisecondsSinceEpoch.toString();
    data['id'] = localId;

    if (_isOnline) {
      try {
        final res = await _api.post('/api/farm-lands', body: data);
        if (res.statusCode == 201) {
          final farm = (jsonDecode(res.body)['farm'] as Map<String, dynamic>?) ?? {};
          if (farm.isNotEmpty) {
            await _db.upsertFarmLand(_farmLandCompanion(farm));
          }
          return farm;
        }
      } catch (e) {
        debugPrint('[OfflineRepo] Create farm land API failed, queuing: $e');
      }
    }

    // Offline
    await _db.upsertFarmLand(_farmLandCompanion(data, syncStatus: 'pending'));
    await _syncEngine.queueWrite(
      entityType: 'farm_land',
      entityId: localId,
      operation: 'create',
      payload: data,
    );
    return data;
  }

  Future<Map<String, dynamic>?> updateFarmLand(String id, Map<String, dynamic> data) async {
    data['id'] = id;
    if (_isOnline) {
      try {
        final res = await _api.put('/api/farm-lands/$id', body: data);
        if (res.statusCode == 200) {
          final farm = (jsonDecode(res.body)['farm'] as Map<String, dynamic>?) ?? {};
          if (farm.isNotEmpty) {
            await _db.upsertFarmLand(_farmLandCompanion(farm));
          }
          return farm;
        }
      } catch (e) {
        debugPrint('[OfflineRepo] Update farm land API failed, queuing: $e');
      }
    }
    // Offline — update local then queue
    await _db.upsertFarmLand(_farmLandCompanion(data, syncStatus: 'pending'));
    await _syncEngine.queueWrite(
      entityType: 'farm_land',
      entityId: id,
      operation: 'update',
      payload: data,
    );
    return data;
  }

  Future<void> deleteFarmLand(String id) async {
    if (_isOnline) {
      try {
        final res = await _api.delete('/api/farm-lands/$id');
        if (res.statusCode == 200) {
          await _db.deleteFarmLand(id);
          return;
        }
      } catch (e) {
        debugPrint('[OfflineRepo] Delete farm land API failed, queuing: $e');
      }
    }
    await _db.upsertFarmLand(FarmLandCacheCompanion.insert(
      id: id,
      farmerId: '',
      name: 'deleted',
      syncStatus: Value('pending'),
    ));
    await _syncEngine.queueWrite(
      entityType: 'farm_land',
      entityId: id,
      operation: 'delete',
      payload: {'id': id},
    );
  }

  // ════════════════════════════════════════════════════════════
  // CULTIVATIONS
  // ════════════════════════════════════════════════════════════

  CultivationCacheCompanion _cultivationCompanion(Map<String, dynamic> c, {String syncStatus = 'synced'}) {
    return CultivationCacheCompanion.insert(
      id: c['id'] ?? '',
      farmId: c['farmId'] ?? '',
      cropName: c['cropName'] ?? '',
      variety: Value(_toStr(c['variety'])),
      season: Value(_toStr(c['season'])),
      cultivationAreaHa: Value(_toDouble(c['cultivationAreaHa'])),
      sowingDate: Value(_toDate(c['sowingDate'])),
      estimatedYield: Value(_toDouble(c['estimatedYield'])),
      actualYield: Value(_toDouble(c['actualYield'])),
      seedCost: Value(_toDouble(c['seedCost'])),
      sowingCost: Value(_toDouble(c['sowingCost'])),
      status: Value(_toStr(c['status']) ?? 'ACTIVE'),
      cropCategory: Value(_toStr(c['cropCategory'])),
      cropCalendarId: Value(_toStr(c['cropCalendarId'])),
      cultivationGeoJson: Value(c['cultivationGeoJson'] != null ? jsonEncode(c['cultivationGeoJson']) : null),
      photoUrl: Value(_toStr(c['photoUrl'])),
      seedSource: Value(_toStr(c['seedSource'])),
      isSeedTreated: Value(c['isSeedTreated'] == null ? null : (c['isSeedTreated'] == true || c['isSeedTreated'] == 'Yes')),
      seedType: Value(_toStr(c['seedType'])),
      seedQuantity: Value(_toDouble(c['seedQuantity'])),
      seedPrice: Value(_toDouble(c['seedPrice'])),
      sowingType: Value(_toStr(c['sowingType'])),
      sowingChargesBy: Value(_toStr(c['sowingChargesBy'])),
      sowingCharges: Value(_toDouble(c['sowingCharges'])),
      bambooVariety: Value(_toStr(c['bambooVariety'])),
      seedlingCount: Value(_toDouble(c['seedlingCount'])),
      syncStatus: Value(syncStatus),
      lastSyncedAt: Value(syncStatus == 'synced' ? DateTime.now() : null),
      updatedAt: Value(DateTime.now()),
    );
  }

  Map<String, dynamic> _cultivationMap(CultivationCacheData c) {
    return {
      'id': c.id,
      'farmId': c.farmId,
      'cropName': c.cropName,
      'variety': c.variety,
      'season': c.season,
      'cultivationAreaHa': c.cultivationAreaHa,
      'sowingDate': c.sowingDate?.toIso8601String(),
      'estimatedYield': c.estimatedYield,
      'actualYield': c.actualYield,
      'seedCost': c.seedCost,
      'sowingCost': c.sowingCost,
      'status': c.status,
      'cropCategory': c.cropCategory,
      'cropCalendarId': c.cropCalendarId,
      'cultivationGeoJson': c.cultivationGeoJson != null ? jsonDecode(c.cultivationGeoJson!) : null,
      'photoUrl': c.photoUrl,
      'seedSource': c.seedSource,
      'isSeedTreated': c.isSeedTreated,
      'seedType': c.seedType,
      'seedQuantity': c.seedQuantity,
      'seedPrice': c.seedPrice,
      'sowingType': c.sowingType,
      'sowingChargesBy': c.sowingChargesBy,
      'sowingCharges': c.sowingCharges,
      'bambooVariety': c.bambooVariety,
      'seedlingCount': c.seedlingCount,
      'syncStatus': c.syncStatus,
    };
  }

  Future<List<Map<String, dynamic>>> getCultivations({String? farmId}) async {
    if (_isOnline) {
      try {
        final res = await _api.get('/api/cultivations${farmId != null ? '?farmId=$farmId' : ''}');
        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          final cultivations = data['cultivations'] as List<dynamic>? ?? [];
          for (final c in cultivations) {
            await _db.upsertCultivation(_cultivationCompanion(c.cast<String, dynamic>()));
          }
          return cultivations.cast<Map<String, dynamic>>().toList();
        }
      } catch (e) {
        debugPrint('[OfflineRepo] Cultivations API failed: $e');
      }
    }

    // Offline
    final cached = await _db.getCachedCultivations(farmId: farmId);
    return cached.map(_cultivationMap).toList();
  }

  Future<Map<String, dynamic>?> getCultivationById(String id) async {
    if (_isOnline) {
      try {
        final res = await _api.get('/api/cultivations/$id');
        if (res.statusCode == 200) {
          final c = (jsonDecode(res.body)['data'] as Map<String, dynamic>?) ?? {};
          if (c.isNotEmpty) {
            await _db.upsertCultivation(_cultivationCompanion(c));
          }
          return c;
        }
      } catch (e) {
        debugPrint('[OfflineRepo] Cultivation detail API failed: $e');
      }
    }
    final cached = await _db.getCachedCultivationById(id);
    if (cached == null) return null;
    return _cultivationMap(cached);
  }

  Future<Map<String, dynamic>?> createCultivation(Map<String, dynamic> data) async {
    final localId = DateTime.now().millisecondsSinceEpoch.toString();
    data['id'] = localId;

    if (_isOnline) {
      try {
        final res = await _api.post('/api/cultivations', body: data);
        if (res.statusCode == 201) {
          final c = (jsonDecode(res.body)['cultivation'] as Map<String, dynamic>?) ?? {};
          if (c.isNotEmpty) {
            await _db.upsertCultivation(_cultivationCompanion(c));
          }
          return c;
        }
      } catch (e) {
        debugPrint('[OfflineRepo] Create cultivation API failed, queuing: $e');
      }
    }

    // Offline
    await _db.upsertCultivation(_cultivationCompanion(data, syncStatus: 'pending'));
    await _syncEngine.queueWrite(
      entityType: 'cultivation',
      entityId: localId,
      operation: 'create',
      payload: data,
    );
    return data;
  }

  Future<Map<String, dynamic>?> updateCultivation(String id, Map<String, dynamic> data) async {
    data['id'] = id;
    if (_isOnline) {
      try {
        final res = await _api.put('/api/cultivations/$id', body: data);
        if (res.statusCode == 200) {
          final c = (jsonDecode(res.body)['data'] as Map<String, dynamic>?) ?? {};
          if (c.isNotEmpty) {
            await _db.upsertCultivation(_cultivationCompanion(c));
          }
          return c;
        }
      } catch (e) {
        debugPrint('[OfflineRepo] Update cultivation API failed, queuing: $e');
      }
    }
    await _db.upsertCultivation(_cultivationCompanion(data, syncStatus: 'pending'));
    await _syncEngine.queueWrite(
      entityType: 'cultivation',
      entityId: id,
      operation: 'update',
      payload: data,
    );
    return data;
  }

  Future<void> deleteCultivation(String id) async {
    if (_isOnline) {
      try {
        final res = await _api.delete('/api/cultivations/$id');
        if (res.statusCode == 200) {
          await _db.deleteCultivation(id);
          return;
        }
      } catch (e) {
        debugPrint('[OfflineRepo] Delete cultivation API failed, queuing: $e');
      }
    }
    await _db.upsertCultivation(CultivationCacheCompanion.insert(
      id: id,
      farmId: '',
      cropName: 'deleted',
      syncStatus: Value('pending'),
    ));
    await _syncEngine.queueWrite(
      entityType: 'cultivation',
      entityId: id,
      operation: 'delete',
      payload: {'id': id},
    );
  }

  // ════════════════════════════════════════════════════════════
  // VSLA GROUPS
  // ════════════════════════════════════════════════════════════

  Future<List<Map<String, dynamic>>> getVslaGroups() async {
    if (_isOnline) {
      try {
        final res = await _api.get('/api/vsla/groups');
        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          final groups = data['groups'] as List<dynamic>? ?? data as List? ?? [];
          for (final g in groups) {
            await _db.upsertVslaGroups([
              VslaGroupCacheCompanion.insert(
                id: g['id'],
                name: g['name'] ?? '',
                shareValue: Value(g['shareValue']?.toDouble()),
                loanRate: Value(g['loanRate']?.toDouble()),
                maxLoanAmount: Value(g['maxLoanAmount']?.toDouble()),
                                syncStatus: Value('synced'),
                lastSyncedAt: Value(DateTime.now()),
              ),
            ]);
          }
          return groups.cast<Map<String, dynamic>>();
        }
      } catch (e) {
        debugPrint('[OfflineRepo] VSLA groups API failed: $e');
      }
    }

    // Offline
    final cached = await _db.getCachedVslaGroups();
    return cached.map((g) => {
      'id': g.id,
      'name': g.name,
      'shareValue': g.shareValue,
      'loanRate': g.loanRate,
      'maxLoanAmount': g.maxLoanAmount,
      'isActive': g.isActive ?? false,
    }).toList();
  }

  // ════════════════════════════════════════════════════════════
  // TRAININGS
  // ════════════════════════════════════════════════════════════

  Future<List<Map<String, dynamic>>> getTrainings() async {
    if (_isOnline) {
      try {
        final res = await _api.get('/api/trainings');
        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          final trainings = data['trainings'] as List<dynamic>? ?? data as List? ?? [];
          for (final t in trainings) {
            await _db.upsertTrainings([
              TrainingCacheCompanion.insert(
                id: t['id'],
                topic: t['topic'] ?? '',
                date: Value(t['date'] != null ? DateTime.tryParse(t['date']) : null),
                location: Value(t['location']),
                trainerName: Value(t['trainerName']),
                description: Value(t['description']),
                syncStatus: Value('synced'),
                lastSyncedAt: Value(DateTime.now()),
              ),
            ]);
          }
          return trainings.cast<Map<String, dynamic>>();
        }
      } catch (e) {
        debugPrint('[OfflineRepo] Trainings API failed: $e');
      }
    }

    // Offline
    final cached = await _db.getCachedTrainings();
    return cached.map((t) => {
      'id': t.id,
      'topic': t.topic,
      'date': t.date?.toIso8601String(),
      'location': t.location,
      'trainerName': t.trainerName,
      'description': t.description,
    }).toList();
  }

  // ════════════════════════════════════════════════════════════
  // FARM VISITS
  // ════════════════════════════════════════════════════════════

  Future<List<Map<String, dynamic>>> getFarmVisits({String? farmerId}) async {
    if (_isOnline) {
      try {
        final res = await _api.get('/api/farm-visits${farmerId != null ? '?farmerId=$farmerId' : ''}');
        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          final visits = data['visits'] as List<dynamic>? ?? data as List? ?? [];
          return visits.cast<Map<String, dynamic>>();
        }
      } catch (e) {
        debugPrint('[OfflineRepo] Farm visits API failed: $e');
      }
    }

    // Offline
    final cached = await _db.getCachedFarmVisits(farmerId: farmerId);
    return cached.map((v) => {
      'id': v.id,
      'farmerId': v.farmerId,
      'visitDate': v.visitDate.toIso8601String(),
      'topic': v.topic,
      'observations': v.observations,
      'recommendations': v.recommendations,
      'status': v.status,
      'syncStatus': v.syncStatus,
    }).toList();
  }

  Future<Map<String, dynamic>?> createFarmVisit(Map<String, dynamic> data) async {
    final localId = DateTime.now().millisecondsSinceEpoch.toString();
    data['id'] = localId;

    // Always save locally first (even if online — for instant UI feedback)
    await _db.insertFarmVisit(FarmVisitCacheCompanion.insert(
      id: localId,
      farmerId: data['farmerId'] ?? '',
      visitDate: data['visitDate'] != null ? DateTime.parse(data['visitDate']) : DateTime.now(),
      topic: data['topic'] ?? '',
      observations: Value(data['observations']),
      recommendations: Value(data['recommendations']),
      status: Value(data['status'] ?? 'SCHEDULED'),
      latitude: Value(data['latitude']?.toDouble()),
      longitude: Value(data['longitude']?.toDouble()),
      syncStatus: Value('pending'),
    ));

    if (_isOnline) {
      try {
        final res = await _api.post('/api/farm-visits', body: data);
        if (res.statusCode == 201 || res.statusCode == 200) {
          return jsonDecode(res.body);
        }
      } catch (e) {
        debugPrint('[OfflineRepo] Create farm visit API failed, queued: $e');
      }
    }

    // Queue for sync
    await _syncEngine.queueWrite(
      entityType: 'farm_visit',
      entityId: localId,
      operation: 'create',
      payload: data,
    );

    return data;
  }

  // ════════════════════════════════════════════════════════════
  // SALES
  // ════════════════════════════════════════════════════════════

  Future<List<Map<String, dynamic>>> getSales({String? farmerId}) async {
    if (_isOnline) {
      try {
        final res = await _api.get('/api/sales${farmerId != null ? '?farmerId=$farmerId' : ''}');
        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          final sales = data['sales'] as List<dynamic>? ?? data as List? ?? [];
          return sales.cast<Map<String, dynamic>>();
        }
      } catch (e) {
        debugPrint('[OfflineRepo] Sales API failed: $e');
      }
    }

    // Offline
    final cached = await _db.getCachedSales(farmerId: farmerId);
    return cached.map((s) => {
      'id': s.id,
      'farmerId': s.farmerId,
      'product': s.product,
      'category': s.category,
      'quantity': s.quantity,
      'unitPrice': s.unitPrice,
      'totalAmount': s.totalAmount,
      'status': s.status,
      'syncStatus': s.syncStatus,
    }).toList();
  }

  Future<Map<String, dynamic>?> createSale(Map<String, dynamic> data) async {
    final localId = DateTime.now().millisecondsSinceEpoch.toString();
    data['id'] = localId;

    // Auto-calc: totalAmount = quantity × unitPrice
    if (data['unitPrice'] != null && data['quantity'] != null) {
      final qty = double.tryParse(data['quantity'].toString()) ?? 0;
      final price = (data['unitPrice'] as num).toDouble();
      data['totalAmount'] = qty * price;

      // Auto-calc: netAmount = totalAmount - charges - taxAmount
      final charges = (data['charges'] as num?)?.toDouble() ?? 0;
      final tax = (data['taxAmount'] as num?)?.toDouble() ?? 0;
      data['netAmount'] = data['totalAmount'] - charges - tax;
    }

    // Save locally
    await _db.insertSale(SaleCacheCompanion.insert(
      id: localId,
      farmerId: Value(data['farmerId']),
      product: data['product'] ?? '',
      category: Value(data['category'] ?? 'PRODUCE'),
      quantity: data['quantity']?.toString() ?? '',
      unitPrice: Value((data['unitPrice'] as num?)?.toDouble()),
      totalAmount: Value((data['totalAmount'] as num?)?.toDouble()),
      charges: Value((data['charges'] as num?)?.toDouble()),
      taxAmount: Value((data['taxAmount'] as num?)?.toDouble()),
      netAmount: Value((data['netAmount'] as num?)?.toDouble()),
      status: Value(data['status'] ?? 'COMPLETED'),
      syncStatus: Value('pending'),
    ));

    if (_isOnline) {
      try {
        final res = await _api.post('/api/sales', body: data);
        if (res.statusCode == 201 || res.statusCode == 200) {
          return jsonDecode(res.body);
        }
      } catch (e) {
        debugPrint('[OfflineRepo] Create sale API failed, queued: $e');
      }
    }

    await _syncEngine.queueWrite(
      entityType: 'sale',
      entityId: localId,
      operation: 'create',
      payload: data,
    );

    return data;
  }

  // ════════════════════════════════════════════════════════════
  // CROP STAGE EVENTS
  // ════════════════════════════════════════════════════════════

  Future<List<Map<String, dynamic>>> getStageEvents(String cultivationId) async {
    if (_isOnline) {
      try {
        final res = await _api.get('/api/crop-stages?cultivationId=$cultivationId');
        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          final events = data['events'] as List<dynamic>? ?? [];
          return events.cast<Map<String, dynamic>>();
        }
      } catch (e) {
        debugPrint('[OfflineRepo] Stage events API failed: $e');
      }
    }

    // Offline
    final cached = await _db.getCachedStageEvents(cultivationId: cultivationId);
    return cached.map((e) => {
      'id': e.id,
      'cultivationId': e.cultivationId,
      'cropVertical': e.cropVertical,
      'stageNumber': e.stageNumber,
      'stageName': e.stageName,
      'eventType': e.eventType,
      'eventData': e.eventData,
      'inputCostTotal': e.inputCostTotal,
      'carbonKgCO2e': e.carbonKgCO2e,
      'farm5xPractice': e.farm5xPractice,
      'syncStatus': e.syncStatus,
    }).toList();
  }

  Future<Map<String, dynamic>?> createStageEvent(Map<String, dynamic> data) async {
    final localId = DateTime.now().millisecondsSinceEpoch.toString();
    data['id'] = localId;

    // Save locally
    await _db.insertStageEvent(CropStageEventCacheCompanion.insert(
      id: localId,
      cultivationId: data['cultivationId'] ?? '',
      cropVertical: data['cropVertical'] ?? 'CROPCORE',
      stageNumber: data['stageNumber'] ?? 1,
      stageName: data['stageName'] ?? '',
      eventType: data['eventType'] ?? '',
      eventData: data['eventData'] != null ? jsonEncode(data['eventData']) : '{}',
      inputCostTotal: Value((data['inputCostTotal'] as num?)?.toDouble() ?? 0),
      carbonKgCO2e: Value((data['carbonKgCO2e'] as num?)?.toDouble() ?? 0),
      farm5xPractice: Value(data['farm5xPractice']),
      farm5xVariant: Value(data['farm5xVariant']),
      syncStatus: Value('pending'),
    ));

    if (_isOnline) {
      try {
        final res = await _api.post('/api/crop-stages', body: data);
        if (res.statusCode == 201) {
          return jsonDecode(res.body)['event'];
        }
      } catch (e) {
        debugPrint('[OfflineRepo] Create stage event API failed, queued: $e');
      }
    }

    await _syncEngine.queueWrite(
      entityType: 'crop_stage_event',
      entityId: localId,
      operation: 'create',
      payload: data,
    );

    return data;
  }

  // ─── Helpers ────────────────────────────────────────────────

  double? _toDouble(dynamic v) {
    if (v == null) return null;
    if (v is num) return v.toDouble();
    if (v is String && v.isNotEmpty) return double.tryParse(v);
    return null;
  }

  String? _toStr(dynamic v) {
    if (v == null) return null;
    if (v is String) return v.isEmpty ? null : v;
    return v.toString();
  }

  DateTime? _toDate(dynamic v) {
    if (v == null) return null;
    if (v is DateTime) return v;
    if (v is String && v.isNotEmpty) return DateTime.tryParse(v);
    return null;
  }

  String? _joinList(dynamic v) {
    if (v == null) return null;
    if (v is List) return v.join(', ');
    if (v is String) return v.isEmpty ? null : v;
    return v.toString();
  }
}
