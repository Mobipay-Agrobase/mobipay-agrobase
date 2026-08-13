// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_database.dart';

// ignore_for_file: type=lint
class $SyncQueueEntriesTable extends SyncQueueEntries
    with TableInfo<$SyncQueueEntriesTable, SyncQueueEntry> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SyncQueueEntriesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _entityTypeMeta = const VerificationMeta(
    'entityType',
  );
  @override
  late final GeneratedColumn<String> entityType = GeneratedColumn<String>(
    'entity_type',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _entityIdMeta = const VerificationMeta(
    'entityId',
  );
  @override
  late final GeneratedColumn<String> entityId = GeneratedColumn<String>(
    'entity_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _operationMeta = const VerificationMeta(
    'operation',
  );
  @override
  late final GeneratedColumn<String> operation = GeneratedColumn<String>(
    'operation',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _payloadMeta = const VerificationMeta(
    'payload',
  );
  @override
  late final GeneratedColumn<String> payload = GeneratedColumn<String>(
    'payload',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  static const VerificationMeta _retryCountMeta = const VerificationMeta(
    'retryCount',
  );
  @override
  late final GeneratedColumn<int> retryCount = GeneratedColumn<int>(
    'retry_count',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _lastErrorMeta = const VerificationMeta(
    'lastError',
  );
  @override
  late final GeneratedColumn<String> lastError = GeneratedColumn<String>(
    'last_error',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    entityType,
    entityId,
    operation,
    payload,
    createdAt,
    retryCount,
    lastError,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'sync_queue_entries';
  @override
  VerificationContext validateIntegrity(
    Insertable<SyncQueueEntry> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('entity_type')) {
      context.handle(
        _entityTypeMeta,
        entityType.isAcceptableOrUnknown(data['entity_type']!, _entityTypeMeta),
      );
    } else if (isInserting) {
      context.missing(_entityTypeMeta);
    }
    if (data.containsKey('entity_id')) {
      context.handle(
        _entityIdMeta,
        entityId.isAcceptableOrUnknown(data['entity_id']!, _entityIdMeta),
      );
    } else if (isInserting) {
      context.missing(_entityIdMeta);
    }
    if (data.containsKey('operation')) {
      context.handle(
        _operationMeta,
        operation.isAcceptableOrUnknown(data['operation']!, _operationMeta),
      );
    } else if (isInserting) {
      context.missing(_operationMeta);
    }
    if (data.containsKey('payload')) {
      context.handle(
        _payloadMeta,
        payload.isAcceptableOrUnknown(data['payload']!, _payloadMeta),
      );
    } else if (isInserting) {
      context.missing(_payloadMeta);
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    }
    if (data.containsKey('retry_count')) {
      context.handle(
        _retryCountMeta,
        retryCount.isAcceptableOrUnknown(data['retry_count']!, _retryCountMeta),
      );
    }
    if (data.containsKey('last_error')) {
      context.handle(
        _lastErrorMeta,
        lastError.isAcceptableOrUnknown(data['last_error']!, _lastErrorMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  SyncQueueEntry map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return SyncQueueEntry(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      entityType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}entity_type'],
      )!,
      entityId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}entity_id'],
      )!,
      operation: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}operation'],
      )!,
      payload: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}payload'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      retryCount: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}retry_count'],
      )!,
      lastError: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}last_error'],
      ),
    );
  }

  @override
  $SyncQueueEntriesTable createAlias(String alias) {
    return $SyncQueueEntriesTable(attachedDatabase, alias);
  }
}

class SyncQueueEntry extends DataClass implements Insertable<SyncQueueEntry> {
  final String id;
  final String entityType;
  final String entityId;
  final String operation;
  final String payload;
  final DateTime createdAt;
  final int retryCount;
  final String? lastError;
  const SyncQueueEntry({
    required this.id,
    required this.entityType,
    required this.entityId,
    required this.operation,
    required this.payload,
    required this.createdAt,
    required this.retryCount,
    this.lastError,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['entity_type'] = Variable<String>(entityType);
    map['entity_id'] = Variable<String>(entityId);
    map['operation'] = Variable<String>(operation);
    map['payload'] = Variable<String>(payload);
    map['created_at'] = Variable<DateTime>(createdAt);
    map['retry_count'] = Variable<int>(retryCount);
    if (!nullToAbsent || lastError != null) {
      map['last_error'] = Variable<String>(lastError);
    }
    return map;
  }

  SyncQueueEntriesCompanion toCompanion(bool nullToAbsent) {
    return SyncQueueEntriesCompanion(
      id: Value(id),
      entityType: Value(entityType),
      entityId: Value(entityId),
      operation: Value(operation),
      payload: Value(payload),
      createdAt: Value(createdAt),
      retryCount: Value(retryCount),
      lastError: lastError == null && nullToAbsent
          ? const Value.absent()
          : Value(lastError),
    );
  }

  factory SyncQueueEntry.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return SyncQueueEntry(
      id: serializer.fromJson<String>(json['id']),
      entityType: serializer.fromJson<String>(json['entityType']),
      entityId: serializer.fromJson<String>(json['entityId']),
      operation: serializer.fromJson<String>(json['operation']),
      payload: serializer.fromJson<String>(json['payload']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      retryCount: serializer.fromJson<int>(json['retryCount']),
      lastError: serializer.fromJson<String?>(json['lastError']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'entityType': serializer.toJson<String>(entityType),
      'entityId': serializer.toJson<String>(entityId),
      'operation': serializer.toJson<String>(operation),
      'payload': serializer.toJson<String>(payload),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'retryCount': serializer.toJson<int>(retryCount),
      'lastError': serializer.toJson<String?>(lastError),
    };
  }

  SyncQueueEntry copyWith({
    String? id,
    String? entityType,
    String? entityId,
    String? operation,
    String? payload,
    DateTime? createdAt,
    int? retryCount,
    Value<String?> lastError = const Value.absent(),
  }) => SyncQueueEntry(
    id: id ?? this.id,
    entityType: entityType ?? this.entityType,
    entityId: entityId ?? this.entityId,
    operation: operation ?? this.operation,
    payload: payload ?? this.payload,
    createdAt: createdAt ?? this.createdAt,
    retryCount: retryCount ?? this.retryCount,
    lastError: lastError.present ? lastError.value : this.lastError,
  );
  SyncQueueEntry copyWithCompanion(SyncQueueEntriesCompanion data) {
    return SyncQueueEntry(
      id: data.id.present ? data.id.value : this.id,
      entityType: data.entityType.present
          ? data.entityType.value
          : this.entityType,
      entityId: data.entityId.present ? data.entityId.value : this.entityId,
      operation: data.operation.present ? data.operation.value : this.operation,
      payload: data.payload.present ? data.payload.value : this.payload,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      retryCount: data.retryCount.present
          ? data.retryCount.value
          : this.retryCount,
      lastError: data.lastError.present ? data.lastError.value : this.lastError,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SyncQueueEntry(')
          ..write('id: $id, ')
          ..write('entityType: $entityType, ')
          ..write('entityId: $entityId, ')
          ..write('operation: $operation, ')
          ..write('payload: $payload, ')
          ..write('createdAt: $createdAt, ')
          ..write('retryCount: $retryCount, ')
          ..write('lastError: $lastError')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    entityType,
    entityId,
    operation,
    payload,
    createdAt,
    retryCount,
    lastError,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SyncQueueEntry &&
          other.id == this.id &&
          other.entityType == this.entityType &&
          other.entityId == this.entityId &&
          other.operation == this.operation &&
          other.payload == this.payload &&
          other.createdAt == this.createdAt &&
          other.retryCount == this.retryCount &&
          other.lastError == this.lastError);
}

class SyncQueueEntriesCompanion extends UpdateCompanion<SyncQueueEntry> {
  final Value<String> id;
  final Value<String> entityType;
  final Value<String> entityId;
  final Value<String> operation;
  final Value<String> payload;
  final Value<DateTime> createdAt;
  final Value<int> retryCount;
  final Value<String?> lastError;
  final Value<int> rowid;
  const SyncQueueEntriesCompanion({
    this.id = const Value.absent(),
    this.entityType = const Value.absent(),
    this.entityId = const Value.absent(),
    this.operation = const Value.absent(),
    this.payload = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.retryCount = const Value.absent(),
    this.lastError = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  SyncQueueEntriesCompanion.insert({
    required String id,
    required String entityType,
    required String entityId,
    required String operation,
    required String payload,
    this.createdAt = const Value.absent(),
    this.retryCount = const Value.absent(),
    this.lastError = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       entityType = Value(entityType),
       entityId = Value(entityId),
       operation = Value(operation),
       payload = Value(payload);
  static Insertable<SyncQueueEntry> custom({
    Expression<String>? id,
    Expression<String>? entityType,
    Expression<String>? entityId,
    Expression<String>? operation,
    Expression<String>? payload,
    Expression<DateTime>? createdAt,
    Expression<int>? retryCount,
    Expression<String>? lastError,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (entityType != null) 'entity_type': entityType,
      if (entityId != null) 'entity_id': entityId,
      if (operation != null) 'operation': operation,
      if (payload != null) 'payload': payload,
      if (createdAt != null) 'created_at': createdAt,
      if (retryCount != null) 'retry_count': retryCount,
      if (lastError != null) 'last_error': lastError,
      if (rowid != null) 'rowid': rowid,
    });
  }

  SyncQueueEntriesCompanion copyWith({
    Value<String>? id,
    Value<String>? entityType,
    Value<String>? entityId,
    Value<String>? operation,
    Value<String>? payload,
    Value<DateTime>? createdAt,
    Value<int>? retryCount,
    Value<String?>? lastError,
    Value<int>? rowid,
  }) {
    return SyncQueueEntriesCompanion(
      id: id ?? this.id,
      entityType: entityType ?? this.entityType,
      entityId: entityId ?? this.entityId,
      operation: operation ?? this.operation,
      payload: payload ?? this.payload,
      createdAt: createdAt ?? this.createdAt,
      retryCount: retryCount ?? this.retryCount,
      lastError: lastError ?? this.lastError,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (entityType.present) {
      map['entity_type'] = Variable<String>(entityType.value);
    }
    if (entityId.present) {
      map['entity_id'] = Variable<String>(entityId.value);
    }
    if (operation.present) {
      map['operation'] = Variable<String>(operation.value);
    }
    if (payload.present) {
      map['payload'] = Variable<String>(payload.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (retryCount.present) {
      map['retry_count'] = Variable<int>(retryCount.value);
    }
    if (lastError.present) {
      map['last_error'] = Variable<String>(lastError.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SyncQueueEntriesCompanion(')
          ..write('id: $id, ')
          ..write('entityType: $entityType, ')
          ..write('entityId: $entityId, ')
          ..write('operation: $operation, ')
          ..write('payload: $payload, ')
          ..write('createdAt: $createdAt, ')
          ..write('retryCount: $retryCount, ')
          ..write('lastError: $lastError, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $FarmerCacheTable extends FarmerCache
    with TableInfo<$FarmerCacheTable, FarmerCacheData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $FarmerCacheTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _tenantIdMeta = const VerificationMeta(
    'tenantId',
  );
  @override
  late final GeneratedColumn<String> tenantId = GeneratedColumn<String>(
    'tenant_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _farmerCodeMeta = const VerificationMeta(
    'farmerCode',
  );
  @override
  late final GeneratedColumn<String> farmerCode = GeneratedColumn<String>(
    'farmer_code',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _firstNameMeta = const VerificationMeta(
    'firstName',
  );
  @override
  late final GeneratedColumn<String> firstName = GeneratedColumn<String>(
    'first_name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _lastNameMeta = const VerificationMeta(
    'lastName',
  );
  @override
  late final GeneratedColumn<String> lastName = GeneratedColumn<String>(
    'last_name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _phoneMeta = const VerificationMeta('phone');
  @override
  late final GeneratedColumn<String> phone = GeneratedColumn<String>(
    'phone',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _genderMeta = const VerificationMeta('gender');
  @override
  late final GeneratedColumn<String> gender = GeneratedColumn<String>(
    'gender',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _emailMeta = const VerificationMeta('email');
  @override
  late final GeneratedColumn<String> email = GeneratedColumn<String>(
    'email',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _villageNameMeta = const VerificationMeta(
    'villageName',
  );
  @override
  late final GeneratedColumn<String> villageName = GeneratedColumn<String>(
    'village_name',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _districtMeta = const VerificationMeta(
    'district',
  );
  @override
  late final GeneratedColumn<String> district = GeneratedColumn<String>(
    'district',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _countryMeta = const VerificationMeta(
    'country',
  );
  @override
  late final GeneratedColumn<String> country = GeneratedColumn<String>(
    'country',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _isCertifiedMeta = const VerificationMeta(
    'isCertified',
  );
  @override
  late final GeneratedColumn<bool> isCertified = GeneratedColumn<bool>(
    'is_certified',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_certified" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _certificationTypeMeta = const VerificationMeta(
    'certificationType',
  );
  @override
  late final GeneratedColumn<String> certificationType =
      GeneratedColumn<String>(
        'certification_type',
        aliasedName,
        true,
        type: DriftSqlType.string,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _farmSizeMeta = const VerificationMeta(
    'farmSize',
  );
  @override
  late final GeneratedColumn<double> farmSize = GeneratedColumn<double>(
    'farm_size',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
    'status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('ACTIVE'),
  );
  static const VerificationMeta _photoUrlMeta = const VerificationMeta(
    'photoUrl',
  );
  @override
  late final GeneratedColumn<String> photoUrl = GeneratedColumn<String>(
    'photo_url',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _syncStatusMeta = const VerificationMeta(
    'syncStatus',
  );
  @override
  late final GeneratedColumn<String> syncStatus = GeneratedColumn<String>(
    'sync_status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('synced'),
  );
  static const VerificationMeta _lastSyncedAtMeta = const VerificationMeta(
    'lastSyncedAt',
  );
  @override
  late final GeneratedColumn<DateTime> lastSyncedAt = GeneratedColumn<DateTime>(
    'last_synced_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    tenantId,
    farmerCode,
    firstName,
    lastName,
    phone,
    gender,
    email,
    villageName,
    district,
    country,
    isCertified,
    certificationType,
    farmSize,
    status,
    photoUrl,
    syncStatus,
    lastSyncedAt,
    updatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'farmer_cache';
  @override
  VerificationContext validateIntegrity(
    Insertable<FarmerCacheData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('tenant_id')) {
      context.handle(
        _tenantIdMeta,
        tenantId.isAcceptableOrUnknown(data['tenant_id']!, _tenantIdMeta),
      );
    } else if (isInserting) {
      context.missing(_tenantIdMeta);
    }
    if (data.containsKey('farmer_code')) {
      context.handle(
        _farmerCodeMeta,
        farmerCode.isAcceptableOrUnknown(data['farmer_code']!, _farmerCodeMeta),
      );
    }
    if (data.containsKey('first_name')) {
      context.handle(
        _firstNameMeta,
        firstName.isAcceptableOrUnknown(data['first_name']!, _firstNameMeta),
      );
    } else if (isInserting) {
      context.missing(_firstNameMeta);
    }
    if (data.containsKey('last_name')) {
      context.handle(
        _lastNameMeta,
        lastName.isAcceptableOrUnknown(data['last_name']!, _lastNameMeta),
      );
    } else if (isInserting) {
      context.missing(_lastNameMeta);
    }
    if (data.containsKey('phone')) {
      context.handle(
        _phoneMeta,
        phone.isAcceptableOrUnknown(data['phone']!, _phoneMeta),
      );
    } else if (isInserting) {
      context.missing(_phoneMeta);
    }
    if (data.containsKey('gender')) {
      context.handle(
        _genderMeta,
        gender.isAcceptableOrUnknown(data['gender']!, _genderMeta),
      );
    }
    if (data.containsKey('email')) {
      context.handle(
        _emailMeta,
        email.isAcceptableOrUnknown(data['email']!, _emailMeta),
      );
    }
    if (data.containsKey('village_name')) {
      context.handle(
        _villageNameMeta,
        villageName.isAcceptableOrUnknown(
          data['village_name']!,
          _villageNameMeta,
        ),
      );
    }
    if (data.containsKey('district')) {
      context.handle(
        _districtMeta,
        district.isAcceptableOrUnknown(data['district']!, _districtMeta),
      );
    }
    if (data.containsKey('country')) {
      context.handle(
        _countryMeta,
        country.isAcceptableOrUnknown(data['country']!, _countryMeta),
      );
    }
    if (data.containsKey('is_certified')) {
      context.handle(
        _isCertifiedMeta,
        isCertified.isAcceptableOrUnknown(
          data['is_certified']!,
          _isCertifiedMeta,
        ),
      );
    }
    if (data.containsKey('certification_type')) {
      context.handle(
        _certificationTypeMeta,
        certificationType.isAcceptableOrUnknown(
          data['certification_type']!,
          _certificationTypeMeta,
        ),
      );
    }
    if (data.containsKey('farm_size')) {
      context.handle(
        _farmSizeMeta,
        farmSize.isAcceptableOrUnknown(data['farm_size']!, _farmSizeMeta),
      );
    }
    if (data.containsKey('status')) {
      context.handle(
        _statusMeta,
        status.isAcceptableOrUnknown(data['status']!, _statusMeta),
      );
    }
    if (data.containsKey('photo_url')) {
      context.handle(
        _photoUrlMeta,
        photoUrl.isAcceptableOrUnknown(data['photo_url']!, _photoUrlMeta),
      );
    }
    if (data.containsKey('sync_status')) {
      context.handle(
        _syncStatusMeta,
        syncStatus.isAcceptableOrUnknown(data['sync_status']!, _syncStatusMeta),
      );
    }
    if (data.containsKey('last_synced_at')) {
      context.handle(
        _lastSyncedAtMeta,
        lastSyncedAt.isAcceptableOrUnknown(
          data['last_synced_at']!,
          _lastSyncedAtMeta,
        ),
      );
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  FarmerCacheData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return FarmerCacheData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      tenantId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}tenant_id'],
      )!,
      farmerCode: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}farmer_code'],
      ),
      firstName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}first_name'],
      )!,
      lastName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}last_name'],
      )!,
      phone: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}phone'],
      )!,
      gender: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}gender'],
      ),
      email: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}email'],
      ),
      villageName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}village_name'],
      ),
      district: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}district'],
      ),
      country: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}country'],
      ),
      isCertified: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_certified'],
      )!,
      certificationType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}certification_type'],
      ),
      farmSize: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}farm_size'],
      ),
      status: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}status'],
      )!,
      photoUrl: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}photo_url'],
      ),
      syncStatus: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}sync_status'],
      )!,
      lastSyncedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}last_synced_at'],
      ),
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      ),
    );
  }

  @override
  $FarmerCacheTable createAlias(String alias) {
    return $FarmerCacheTable(attachedDatabase, alias);
  }
}

class FarmerCacheData extends DataClass implements Insertable<FarmerCacheData> {
  final String id;
  final String tenantId;
  final String? farmerCode;
  final String firstName;
  final String lastName;
  final String phone;
  final String? gender;
  final String? email;
  final String? villageName;
  final String? district;
  final String? country;
  final bool isCertified;
  final String? certificationType;
  final double? farmSize;
  final String status;
  final String? photoUrl;
  final String syncStatus;
  final DateTime? lastSyncedAt;
  final DateTime? updatedAt;
  const FarmerCacheData({
    required this.id,
    required this.tenantId,
    this.farmerCode,
    required this.firstName,
    required this.lastName,
    required this.phone,
    this.gender,
    this.email,
    this.villageName,
    this.district,
    this.country,
    required this.isCertified,
    this.certificationType,
    this.farmSize,
    required this.status,
    this.photoUrl,
    required this.syncStatus,
    this.lastSyncedAt,
    this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['tenant_id'] = Variable<String>(tenantId);
    if (!nullToAbsent || farmerCode != null) {
      map['farmer_code'] = Variable<String>(farmerCode);
    }
    map['first_name'] = Variable<String>(firstName);
    map['last_name'] = Variable<String>(lastName);
    map['phone'] = Variable<String>(phone);
    if (!nullToAbsent || gender != null) {
      map['gender'] = Variable<String>(gender);
    }
    if (!nullToAbsent || email != null) {
      map['email'] = Variable<String>(email);
    }
    if (!nullToAbsent || villageName != null) {
      map['village_name'] = Variable<String>(villageName);
    }
    if (!nullToAbsent || district != null) {
      map['district'] = Variable<String>(district);
    }
    if (!nullToAbsent || country != null) {
      map['country'] = Variable<String>(country);
    }
    map['is_certified'] = Variable<bool>(isCertified);
    if (!nullToAbsent || certificationType != null) {
      map['certification_type'] = Variable<String>(certificationType);
    }
    if (!nullToAbsent || farmSize != null) {
      map['farm_size'] = Variable<double>(farmSize);
    }
    map['status'] = Variable<String>(status);
    if (!nullToAbsent || photoUrl != null) {
      map['photo_url'] = Variable<String>(photoUrl);
    }
    map['sync_status'] = Variable<String>(syncStatus);
    if (!nullToAbsent || lastSyncedAt != null) {
      map['last_synced_at'] = Variable<DateTime>(lastSyncedAt);
    }
    if (!nullToAbsent || updatedAt != null) {
      map['updated_at'] = Variable<DateTime>(updatedAt);
    }
    return map;
  }

  FarmerCacheCompanion toCompanion(bool nullToAbsent) {
    return FarmerCacheCompanion(
      id: Value(id),
      tenantId: Value(tenantId),
      farmerCode: farmerCode == null && nullToAbsent
          ? const Value.absent()
          : Value(farmerCode),
      firstName: Value(firstName),
      lastName: Value(lastName),
      phone: Value(phone),
      gender: gender == null && nullToAbsent
          ? const Value.absent()
          : Value(gender),
      email: email == null && nullToAbsent
          ? const Value.absent()
          : Value(email),
      villageName: villageName == null && nullToAbsent
          ? const Value.absent()
          : Value(villageName),
      district: district == null && nullToAbsent
          ? const Value.absent()
          : Value(district),
      country: country == null && nullToAbsent
          ? const Value.absent()
          : Value(country),
      isCertified: Value(isCertified),
      certificationType: certificationType == null && nullToAbsent
          ? const Value.absent()
          : Value(certificationType),
      farmSize: farmSize == null && nullToAbsent
          ? const Value.absent()
          : Value(farmSize),
      status: Value(status),
      photoUrl: photoUrl == null && nullToAbsent
          ? const Value.absent()
          : Value(photoUrl),
      syncStatus: Value(syncStatus),
      lastSyncedAt: lastSyncedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(lastSyncedAt),
      updatedAt: updatedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(updatedAt),
    );
  }

  factory FarmerCacheData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return FarmerCacheData(
      id: serializer.fromJson<String>(json['id']),
      tenantId: serializer.fromJson<String>(json['tenantId']),
      farmerCode: serializer.fromJson<String?>(json['farmerCode']),
      firstName: serializer.fromJson<String>(json['firstName']),
      lastName: serializer.fromJson<String>(json['lastName']),
      phone: serializer.fromJson<String>(json['phone']),
      gender: serializer.fromJson<String?>(json['gender']),
      email: serializer.fromJson<String?>(json['email']),
      villageName: serializer.fromJson<String?>(json['villageName']),
      district: serializer.fromJson<String?>(json['district']),
      country: serializer.fromJson<String?>(json['country']),
      isCertified: serializer.fromJson<bool>(json['isCertified']),
      certificationType: serializer.fromJson<String?>(
        json['certificationType'],
      ),
      farmSize: serializer.fromJson<double?>(json['farmSize']),
      status: serializer.fromJson<String>(json['status']),
      photoUrl: serializer.fromJson<String?>(json['photoUrl']),
      syncStatus: serializer.fromJson<String>(json['syncStatus']),
      lastSyncedAt: serializer.fromJson<DateTime?>(json['lastSyncedAt']),
      updatedAt: serializer.fromJson<DateTime?>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'tenantId': serializer.toJson<String>(tenantId),
      'farmerCode': serializer.toJson<String?>(farmerCode),
      'firstName': serializer.toJson<String>(firstName),
      'lastName': serializer.toJson<String>(lastName),
      'phone': serializer.toJson<String>(phone),
      'gender': serializer.toJson<String?>(gender),
      'email': serializer.toJson<String?>(email),
      'villageName': serializer.toJson<String?>(villageName),
      'district': serializer.toJson<String?>(district),
      'country': serializer.toJson<String?>(country),
      'isCertified': serializer.toJson<bool>(isCertified),
      'certificationType': serializer.toJson<String?>(certificationType),
      'farmSize': serializer.toJson<double?>(farmSize),
      'status': serializer.toJson<String>(status),
      'photoUrl': serializer.toJson<String?>(photoUrl),
      'syncStatus': serializer.toJson<String>(syncStatus),
      'lastSyncedAt': serializer.toJson<DateTime?>(lastSyncedAt),
      'updatedAt': serializer.toJson<DateTime?>(updatedAt),
    };
  }

  FarmerCacheData copyWith({
    String? id,
    String? tenantId,
    Value<String?> farmerCode = const Value.absent(),
    String? firstName,
    String? lastName,
    String? phone,
    Value<String?> gender = const Value.absent(),
    Value<String?> email = const Value.absent(),
    Value<String?> villageName = const Value.absent(),
    Value<String?> district = const Value.absent(),
    Value<String?> country = const Value.absent(),
    bool? isCertified,
    Value<String?> certificationType = const Value.absent(),
    Value<double?> farmSize = const Value.absent(),
    String? status,
    Value<String?> photoUrl = const Value.absent(),
    String? syncStatus,
    Value<DateTime?> lastSyncedAt = const Value.absent(),
    Value<DateTime?> updatedAt = const Value.absent(),
  }) => FarmerCacheData(
    id: id ?? this.id,
    tenantId: tenantId ?? this.tenantId,
    farmerCode: farmerCode.present ? farmerCode.value : this.farmerCode,
    firstName: firstName ?? this.firstName,
    lastName: lastName ?? this.lastName,
    phone: phone ?? this.phone,
    gender: gender.present ? gender.value : this.gender,
    email: email.present ? email.value : this.email,
    villageName: villageName.present ? villageName.value : this.villageName,
    district: district.present ? district.value : this.district,
    country: country.present ? country.value : this.country,
    isCertified: isCertified ?? this.isCertified,
    certificationType: certificationType.present
        ? certificationType.value
        : this.certificationType,
    farmSize: farmSize.present ? farmSize.value : this.farmSize,
    status: status ?? this.status,
    photoUrl: photoUrl.present ? photoUrl.value : this.photoUrl,
    syncStatus: syncStatus ?? this.syncStatus,
    lastSyncedAt: lastSyncedAt.present ? lastSyncedAt.value : this.lastSyncedAt,
    updatedAt: updatedAt.present ? updatedAt.value : this.updatedAt,
  );
  FarmerCacheData copyWithCompanion(FarmerCacheCompanion data) {
    return FarmerCacheData(
      id: data.id.present ? data.id.value : this.id,
      tenantId: data.tenantId.present ? data.tenantId.value : this.tenantId,
      farmerCode: data.farmerCode.present
          ? data.farmerCode.value
          : this.farmerCode,
      firstName: data.firstName.present ? data.firstName.value : this.firstName,
      lastName: data.lastName.present ? data.lastName.value : this.lastName,
      phone: data.phone.present ? data.phone.value : this.phone,
      gender: data.gender.present ? data.gender.value : this.gender,
      email: data.email.present ? data.email.value : this.email,
      villageName: data.villageName.present
          ? data.villageName.value
          : this.villageName,
      district: data.district.present ? data.district.value : this.district,
      country: data.country.present ? data.country.value : this.country,
      isCertified: data.isCertified.present
          ? data.isCertified.value
          : this.isCertified,
      certificationType: data.certificationType.present
          ? data.certificationType.value
          : this.certificationType,
      farmSize: data.farmSize.present ? data.farmSize.value : this.farmSize,
      status: data.status.present ? data.status.value : this.status,
      photoUrl: data.photoUrl.present ? data.photoUrl.value : this.photoUrl,
      syncStatus: data.syncStatus.present
          ? data.syncStatus.value
          : this.syncStatus,
      lastSyncedAt: data.lastSyncedAt.present
          ? data.lastSyncedAt.value
          : this.lastSyncedAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('FarmerCacheData(')
          ..write('id: $id, ')
          ..write('tenantId: $tenantId, ')
          ..write('farmerCode: $farmerCode, ')
          ..write('firstName: $firstName, ')
          ..write('lastName: $lastName, ')
          ..write('phone: $phone, ')
          ..write('gender: $gender, ')
          ..write('email: $email, ')
          ..write('villageName: $villageName, ')
          ..write('district: $district, ')
          ..write('country: $country, ')
          ..write('isCertified: $isCertified, ')
          ..write('certificationType: $certificationType, ')
          ..write('farmSize: $farmSize, ')
          ..write('status: $status, ')
          ..write('photoUrl: $photoUrl, ')
          ..write('syncStatus: $syncStatus, ')
          ..write('lastSyncedAt: $lastSyncedAt, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    tenantId,
    farmerCode,
    firstName,
    lastName,
    phone,
    gender,
    email,
    villageName,
    district,
    country,
    isCertified,
    certificationType,
    farmSize,
    status,
    photoUrl,
    syncStatus,
    lastSyncedAt,
    updatedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is FarmerCacheData &&
          other.id == this.id &&
          other.tenantId == this.tenantId &&
          other.farmerCode == this.farmerCode &&
          other.firstName == this.firstName &&
          other.lastName == this.lastName &&
          other.phone == this.phone &&
          other.gender == this.gender &&
          other.email == this.email &&
          other.villageName == this.villageName &&
          other.district == this.district &&
          other.country == this.country &&
          other.isCertified == this.isCertified &&
          other.certificationType == this.certificationType &&
          other.farmSize == this.farmSize &&
          other.status == this.status &&
          other.photoUrl == this.photoUrl &&
          other.syncStatus == this.syncStatus &&
          other.lastSyncedAt == this.lastSyncedAt &&
          other.updatedAt == this.updatedAt);
}

class FarmerCacheCompanion extends UpdateCompanion<FarmerCacheData> {
  final Value<String> id;
  final Value<String> tenantId;
  final Value<String?> farmerCode;
  final Value<String> firstName;
  final Value<String> lastName;
  final Value<String> phone;
  final Value<String?> gender;
  final Value<String?> email;
  final Value<String?> villageName;
  final Value<String?> district;
  final Value<String?> country;
  final Value<bool> isCertified;
  final Value<String?> certificationType;
  final Value<double?> farmSize;
  final Value<String> status;
  final Value<String?> photoUrl;
  final Value<String> syncStatus;
  final Value<DateTime?> lastSyncedAt;
  final Value<DateTime?> updatedAt;
  final Value<int> rowid;
  const FarmerCacheCompanion({
    this.id = const Value.absent(),
    this.tenantId = const Value.absent(),
    this.farmerCode = const Value.absent(),
    this.firstName = const Value.absent(),
    this.lastName = const Value.absent(),
    this.phone = const Value.absent(),
    this.gender = const Value.absent(),
    this.email = const Value.absent(),
    this.villageName = const Value.absent(),
    this.district = const Value.absent(),
    this.country = const Value.absent(),
    this.isCertified = const Value.absent(),
    this.certificationType = const Value.absent(),
    this.farmSize = const Value.absent(),
    this.status = const Value.absent(),
    this.photoUrl = const Value.absent(),
    this.syncStatus = const Value.absent(),
    this.lastSyncedAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  FarmerCacheCompanion.insert({
    required String id,
    required String tenantId,
    this.farmerCode = const Value.absent(),
    required String firstName,
    required String lastName,
    required String phone,
    this.gender = const Value.absent(),
    this.email = const Value.absent(),
    this.villageName = const Value.absent(),
    this.district = const Value.absent(),
    this.country = const Value.absent(),
    this.isCertified = const Value.absent(),
    this.certificationType = const Value.absent(),
    this.farmSize = const Value.absent(),
    this.status = const Value.absent(),
    this.photoUrl = const Value.absent(),
    this.syncStatus = const Value.absent(),
    this.lastSyncedAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       tenantId = Value(tenantId),
       firstName = Value(firstName),
       lastName = Value(lastName),
       phone = Value(phone);
  static Insertable<FarmerCacheData> custom({
    Expression<String>? id,
    Expression<String>? tenantId,
    Expression<String>? farmerCode,
    Expression<String>? firstName,
    Expression<String>? lastName,
    Expression<String>? phone,
    Expression<String>? gender,
    Expression<String>? email,
    Expression<String>? villageName,
    Expression<String>? district,
    Expression<String>? country,
    Expression<bool>? isCertified,
    Expression<String>? certificationType,
    Expression<double>? farmSize,
    Expression<String>? status,
    Expression<String>? photoUrl,
    Expression<String>? syncStatus,
    Expression<DateTime>? lastSyncedAt,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (tenantId != null) 'tenant_id': tenantId,
      if (farmerCode != null) 'farmer_code': farmerCode,
      if (firstName != null) 'first_name': firstName,
      if (lastName != null) 'last_name': lastName,
      if (phone != null) 'phone': phone,
      if (gender != null) 'gender': gender,
      if (email != null) 'email': email,
      if (villageName != null) 'village_name': villageName,
      if (district != null) 'district': district,
      if (country != null) 'country': country,
      if (isCertified != null) 'is_certified': isCertified,
      if (certificationType != null) 'certification_type': certificationType,
      if (farmSize != null) 'farm_size': farmSize,
      if (status != null) 'status': status,
      if (photoUrl != null) 'photo_url': photoUrl,
      if (syncStatus != null) 'sync_status': syncStatus,
      if (lastSyncedAt != null) 'last_synced_at': lastSyncedAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  FarmerCacheCompanion copyWith({
    Value<String>? id,
    Value<String>? tenantId,
    Value<String?>? farmerCode,
    Value<String>? firstName,
    Value<String>? lastName,
    Value<String>? phone,
    Value<String?>? gender,
    Value<String?>? email,
    Value<String?>? villageName,
    Value<String?>? district,
    Value<String?>? country,
    Value<bool>? isCertified,
    Value<String?>? certificationType,
    Value<double?>? farmSize,
    Value<String>? status,
    Value<String?>? photoUrl,
    Value<String>? syncStatus,
    Value<DateTime?>? lastSyncedAt,
    Value<DateTime?>? updatedAt,
    Value<int>? rowid,
  }) {
    return FarmerCacheCompanion(
      id: id ?? this.id,
      tenantId: tenantId ?? this.tenantId,
      farmerCode: farmerCode ?? this.farmerCode,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      phone: phone ?? this.phone,
      gender: gender ?? this.gender,
      email: email ?? this.email,
      villageName: villageName ?? this.villageName,
      district: district ?? this.district,
      country: country ?? this.country,
      isCertified: isCertified ?? this.isCertified,
      certificationType: certificationType ?? this.certificationType,
      farmSize: farmSize ?? this.farmSize,
      status: status ?? this.status,
      photoUrl: photoUrl ?? this.photoUrl,
      syncStatus: syncStatus ?? this.syncStatus,
      lastSyncedAt: lastSyncedAt ?? this.lastSyncedAt,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (tenantId.present) {
      map['tenant_id'] = Variable<String>(tenantId.value);
    }
    if (farmerCode.present) {
      map['farmer_code'] = Variable<String>(farmerCode.value);
    }
    if (firstName.present) {
      map['first_name'] = Variable<String>(firstName.value);
    }
    if (lastName.present) {
      map['last_name'] = Variable<String>(lastName.value);
    }
    if (phone.present) {
      map['phone'] = Variable<String>(phone.value);
    }
    if (gender.present) {
      map['gender'] = Variable<String>(gender.value);
    }
    if (email.present) {
      map['email'] = Variable<String>(email.value);
    }
    if (villageName.present) {
      map['village_name'] = Variable<String>(villageName.value);
    }
    if (district.present) {
      map['district'] = Variable<String>(district.value);
    }
    if (country.present) {
      map['country'] = Variable<String>(country.value);
    }
    if (isCertified.present) {
      map['is_certified'] = Variable<bool>(isCertified.value);
    }
    if (certificationType.present) {
      map['certification_type'] = Variable<String>(certificationType.value);
    }
    if (farmSize.present) {
      map['farm_size'] = Variable<double>(farmSize.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (photoUrl.present) {
      map['photo_url'] = Variable<String>(photoUrl.value);
    }
    if (syncStatus.present) {
      map['sync_status'] = Variable<String>(syncStatus.value);
    }
    if (lastSyncedAt.present) {
      map['last_synced_at'] = Variable<DateTime>(lastSyncedAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('FarmerCacheCompanion(')
          ..write('id: $id, ')
          ..write('tenantId: $tenantId, ')
          ..write('farmerCode: $farmerCode, ')
          ..write('firstName: $firstName, ')
          ..write('lastName: $lastName, ')
          ..write('phone: $phone, ')
          ..write('gender: $gender, ')
          ..write('email: $email, ')
          ..write('villageName: $villageName, ')
          ..write('district: $district, ')
          ..write('country: $country, ')
          ..write('isCertified: $isCertified, ')
          ..write('certificationType: $certificationType, ')
          ..write('farmSize: $farmSize, ')
          ..write('status: $status, ')
          ..write('photoUrl: $photoUrl, ')
          ..write('syncStatus: $syncStatus, ')
          ..write('lastSyncedAt: $lastSyncedAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $FarmLandCacheTable extends FarmLandCache
    with TableInfo<$FarmLandCacheTable, FarmLandCacheData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $FarmLandCacheTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _farmerIdMeta = const VerificationMeta(
    'farmerId',
  );
  @override
  late final GeneratedColumn<String> farmerId = GeneratedColumn<String>(
    'farmer_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
    'name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _sizeHectaresMeta = const VerificationMeta(
    'sizeHectares',
  );
  @override
  late final GeneratedColumn<double> sizeHectares = GeneratedColumn<double>(
    'size_hectares',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _latitudeMeta = const VerificationMeta(
    'latitude',
  );
  @override
  late final GeneratedColumn<double> latitude = GeneratedColumn<double>(
    'latitude',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _longitudeMeta = const VerificationMeta(
    'longitude',
  );
  @override
  late final GeneratedColumn<double> longitude = GeneratedColumn<double>(
    'longitude',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _landOwnershipMeta = const VerificationMeta(
    'landOwnership',
  );
  @override
  late final GeneratedColumn<String> landOwnership = GeneratedColumn<String>(
    'land_ownership',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _waterSourceMeta = const VerificationMeta(
    'waterSource',
  );
  @override
  late final GeneratedColumn<String> waterSource = GeneratedColumn<String>(
    'water_source',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _soilFertilityMeta = const VerificationMeta(
    'soilFertility',
  );
  @override
  late final GeneratedColumn<String> soilFertility = GeneratedColumn<String>(
    'soil_fertility',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _boundaryGeoJsonMeta = const VerificationMeta(
    'boundaryGeoJson',
  );
  @override
  late final GeneratedColumn<String> boundaryGeoJson = GeneratedColumn<String>(
    'boundary_geo_json',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _landSurveyNoMeta = const VerificationMeta(
    'landSurveyNo',
  );
  @override
  late final GeneratedColumn<String> landSurveyNo = GeneratedColumn<String>(
    'land_survey_no',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _approachRoadMeta = const VerificationMeta(
    'approachRoad',
  );
  @override
  late final GeneratedColumn<String> approachRoad = GeneratedColumn<String>(
    'approach_road',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _landTopologyMeta = const VerificationMeta(
    'landTopology',
  );
  @override
  late final GeneratedColumn<String> landTopology = GeneratedColumn<String>(
    'land_topology',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _landGradientMeta = const VerificationMeta(
    'landGradient',
  );
  @override
  late final GeneratedColumn<String> landGradient = GeneratedColumn<String>(
    'land_gradient',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _landDocumentUrlMeta = const VerificationMeta(
    'landDocumentUrl',
  );
  @override
  late final GeneratedColumn<String> landDocumentUrl = GeneratedColumn<String>(
    'land_document_url',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _powerSourceMeta = const VerificationMeta(
    'powerSource',
  );
  @override
  late final GeneratedColumn<String> powerSource = GeneratedColumn<String>(
    'power_source',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _farmPhotoUrlMeta = const VerificationMeta(
    'farmPhotoUrl',
  );
  @override
  late final GeneratedColumn<String> farmPhotoUrl = GeneratedColumn<String>(
    'farm_photo_url',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _irrigationSourceMeta = const VerificationMeta(
    'irrigationSource',
  );
  @override
  late final GeneratedColumn<String> irrigationSource = GeneratedColumn<String>(
    'irrigation_source',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _irrigationTypeMeta = const VerificationMeta(
    'irrigationType',
  );
  @override
  late final GeneratedColumn<String> irrigationType = GeneratedColumn<String>(
    'irrigation_type',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _fullTimeWorkersMeta = const VerificationMeta(
    'fullTimeWorkers',
  );
  @override
  late final GeneratedColumn<double> fullTimeWorkers = GeneratedColumn<double>(
    'full_time_workers',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _partTimeWorkersMeta = const VerificationMeta(
    'partTimeWorkers',
  );
  @override
  late final GeneratedColumn<double> partTimeWorkers = GeneratedColumn<double>(
    'part_time_workers',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _seasonalWorkersMeta = const VerificationMeta(
    'seasonalWorkers',
  );
  @override
  late final GeneratedColumn<double> seasonalWorkers = GeneratedColumn<double>(
    'seasonal_workers',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _familyWorkersMeta = const VerificationMeta(
    'familyWorkers',
  );
  @override
  late final GeneratedColumn<double> familyWorkers = GeneratedColumn<double>(
    'family_workers',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _lastChemicalApplicationDateMeta =
      const VerificationMeta('lastChemicalApplicationDate');
  @override
  late final GeneratedColumn<DateTime> lastChemicalApplicationDate =
      GeneratedColumn<DateTime>(
        'last_chemical_application_date',
        aliasedName,
        true,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _conventionalLandsMeta = const VerificationMeta(
    'conventionalLands',
  );
  @override
  late final GeneratedColumn<String> conventionalLands =
      GeneratedColumn<String>(
        'conventional_lands',
        aliasedName,
        true,
        type: DriftSqlType.string,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _fallowPastureLandMeta = const VerificationMeta(
    'fallowPastureLand',
  );
  @override
  late final GeneratedColumn<String> fallowPastureLand =
      GeneratedColumn<String>(
        'fallow_pasture_land',
        aliasedName,
        true,
        type: DriftSqlType.string,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _conventionalCropsMeta = const VerificationMeta(
    'conventionalCrops',
  );
  @override
  late final GeneratedColumn<String> conventionalCrops =
      GeneratedColumn<String>(
        'conventional_crops',
        aliasedName,
        true,
        type: DriftSqlType.string,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _estYieldKgMeta = const VerificationMeta(
    'estYieldKg',
  );
  @override
  late final GeneratedColumn<double> estYieldKg = GeneratedColumn<double>(
    'est_yield_kg',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _certTypeMeta = const VerificationMeta(
    'certType',
  );
  @override
  late final GeneratedColumn<String> certType = GeneratedColumn<String>(
    'cert_type',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _conversionStatusMeta = const VerificationMeta(
    'conversionStatus',
  );
  @override
  late final GeneratedColumn<String> conversionStatus = GeneratedColumn<String>(
    'conversion_status',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _conversionDateMeta = const VerificationMeta(
    'conversionDate',
  );
  @override
  late final GeneratedColumn<DateTime> conversionDate =
      GeneratedColumn<DateTime>(
        'conversion_date',
        aliasedName,
        true,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _inspectorNameMeta = const VerificationMeta(
    'inspectorName',
  );
  @override
  late final GeneratedColumn<String> inspectorName = GeneratedColumn<String>(
    'inspector_name',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _conversionQualifiedMeta =
      const VerificationMeta('conversionQualified');
  @override
  late final GeneratedColumn<bool> conversionQualified = GeneratedColumn<bool>(
    'conversion_qualified',
    aliasedName,
    true,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("conversion_qualified" IN (0, 1))',
    ),
  );
  static const VerificationMeta _conversionRemarksMeta = const VerificationMeta(
    'conversionRemarks',
  );
  @override
  late final GeneratedColumn<String> conversionRemarks =
      GeneratedColumn<String>(
        'conversion_remarks',
        aliasedName,
        true,
        type: DriftSqlType.string,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _soilCollectionDateMeta =
      const VerificationMeta('soilCollectionDate');
  @override
  late final GeneratedColumn<DateTime> soilCollectionDate =
      GeneratedColumn<DateTime>(
        'soil_collection_date',
        aliasedName,
        true,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _soilLabTestingDateMeta =
      const VerificationMeta('soilLabTestingDate');
  @override
  late final GeneratedColumn<DateTime> soilLabTestingDate =
      GeneratedColumn<DateTime>(
        'soil_lab_testing_date',
        aliasedName,
        true,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _soilResultDateMeta = const VerificationMeta(
    'soilResultDate',
  );
  @override
  late final GeneratedColumn<DateTime> soilResultDate =
      GeneratedColumn<DateTime>(
        'soil_result_date',
        aliasedName,
        true,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _soilReportUrlMeta = const VerificationMeta(
    'soilReportUrl',
  );
  @override
  late final GeneratedColumn<String> soilReportUrl = GeneratedColumn<String>(
    'soil_report_url',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _soilSamplesInfoMeta = const VerificationMeta(
    'soilSamplesInfo',
  );
  @override
  late final GeneratedColumn<String> soilSamplesInfo = GeneratedColumn<String>(
    'soil_samples_info',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _soilCriteriaMeta = const VerificationMeta(
    'soilCriteria',
  );
  @override
  late final GeneratedColumn<String> soilCriteria = GeneratedColumn<String>(
    'soil_criteria',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _syncStatusMeta = const VerificationMeta(
    'syncStatus',
  );
  @override
  late final GeneratedColumn<String> syncStatus = GeneratedColumn<String>(
    'sync_status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('synced'),
  );
  static const VerificationMeta _lastSyncedAtMeta = const VerificationMeta(
    'lastSyncedAt',
  );
  @override
  late final GeneratedColumn<DateTime> lastSyncedAt = GeneratedColumn<DateTime>(
    'last_synced_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    farmerId,
    name,
    sizeHectares,
    latitude,
    longitude,
    landOwnership,
    waterSource,
    soilFertility,
    boundaryGeoJson,
    landSurveyNo,
    approachRoad,
    landTopology,
    landGradient,
    landDocumentUrl,
    powerSource,
    farmPhotoUrl,
    irrigationSource,
    irrigationType,
    fullTimeWorkers,
    partTimeWorkers,
    seasonalWorkers,
    familyWorkers,
    lastChemicalApplicationDate,
    conventionalLands,
    fallowPastureLand,
    conventionalCrops,
    estYieldKg,
    certType,
    conversionStatus,
    conversionDate,
    inspectorName,
    conversionQualified,
    conversionRemarks,
    soilCollectionDate,
    soilLabTestingDate,
    soilResultDate,
    soilReportUrl,
    soilSamplesInfo,
    soilCriteria,
    syncStatus,
    lastSyncedAt,
    updatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'farm_land_cache';
  @override
  VerificationContext validateIntegrity(
    Insertable<FarmLandCacheData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('farmer_id')) {
      context.handle(
        _farmerIdMeta,
        farmerId.isAcceptableOrUnknown(data['farmer_id']!, _farmerIdMeta),
      );
    } else if (isInserting) {
      context.missing(_farmerIdMeta);
    }
    if (data.containsKey('name')) {
      context.handle(
        _nameMeta,
        name.isAcceptableOrUnknown(data['name']!, _nameMeta),
      );
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('size_hectares')) {
      context.handle(
        _sizeHectaresMeta,
        sizeHectares.isAcceptableOrUnknown(
          data['size_hectares']!,
          _sizeHectaresMeta,
        ),
      );
    }
    if (data.containsKey('latitude')) {
      context.handle(
        _latitudeMeta,
        latitude.isAcceptableOrUnknown(data['latitude']!, _latitudeMeta),
      );
    }
    if (data.containsKey('longitude')) {
      context.handle(
        _longitudeMeta,
        longitude.isAcceptableOrUnknown(data['longitude']!, _longitudeMeta),
      );
    }
    if (data.containsKey('land_ownership')) {
      context.handle(
        _landOwnershipMeta,
        landOwnership.isAcceptableOrUnknown(
          data['land_ownership']!,
          _landOwnershipMeta,
        ),
      );
    }
    if (data.containsKey('water_source')) {
      context.handle(
        _waterSourceMeta,
        waterSource.isAcceptableOrUnknown(
          data['water_source']!,
          _waterSourceMeta,
        ),
      );
    }
    if (data.containsKey('soil_fertility')) {
      context.handle(
        _soilFertilityMeta,
        soilFertility.isAcceptableOrUnknown(
          data['soil_fertility']!,
          _soilFertilityMeta,
        ),
      );
    }
    if (data.containsKey('boundary_geo_json')) {
      context.handle(
        _boundaryGeoJsonMeta,
        boundaryGeoJson.isAcceptableOrUnknown(
          data['boundary_geo_json']!,
          _boundaryGeoJsonMeta,
        ),
      );
    }
    if (data.containsKey('land_survey_no')) {
      context.handle(
        _landSurveyNoMeta,
        landSurveyNo.isAcceptableOrUnknown(
          data['land_survey_no']!,
          _landSurveyNoMeta,
        ),
      );
    }
    if (data.containsKey('approach_road')) {
      context.handle(
        _approachRoadMeta,
        approachRoad.isAcceptableOrUnknown(
          data['approach_road']!,
          _approachRoadMeta,
        ),
      );
    }
    if (data.containsKey('land_topology')) {
      context.handle(
        _landTopologyMeta,
        landTopology.isAcceptableOrUnknown(
          data['land_topology']!,
          _landTopologyMeta,
        ),
      );
    }
    if (data.containsKey('land_gradient')) {
      context.handle(
        _landGradientMeta,
        landGradient.isAcceptableOrUnknown(
          data['land_gradient']!,
          _landGradientMeta,
        ),
      );
    }
    if (data.containsKey('land_document_url')) {
      context.handle(
        _landDocumentUrlMeta,
        landDocumentUrl.isAcceptableOrUnknown(
          data['land_document_url']!,
          _landDocumentUrlMeta,
        ),
      );
    }
    if (data.containsKey('power_source')) {
      context.handle(
        _powerSourceMeta,
        powerSource.isAcceptableOrUnknown(
          data['power_source']!,
          _powerSourceMeta,
        ),
      );
    }
    if (data.containsKey('farm_photo_url')) {
      context.handle(
        _farmPhotoUrlMeta,
        farmPhotoUrl.isAcceptableOrUnknown(
          data['farm_photo_url']!,
          _farmPhotoUrlMeta,
        ),
      );
    }
    if (data.containsKey('irrigation_source')) {
      context.handle(
        _irrigationSourceMeta,
        irrigationSource.isAcceptableOrUnknown(
          data['irrigation_source']!,
          _irrigationSourceMeta,
        ),
      );
    }
    if (data.containsKey('irrigation_type')) {
      context.handle(
        _irrigationTypeMeta,
        irrigationType.isAcceptableOrUnknown(
          data['irrigation_type']!,
          _irrigationTypeMeta,
        ),
      );
    }
    if (data.containsKey('full_time_workers')) {
      context.handle(
        _fullTimeWorkersMeta,
        fullTimeWorkers.isAcceptableOrUnknown(
          data['full_time_workers']!,
          _fullTimeWorkersMeta,
        ),
      );
    }
    if (data.containsKey('part_time_workers')) {
      context.handle(
        _partTimeWorkersMeta,
        partTimeWorkers.isAcceptableOrUnknown(
          data['part_time_workers']!,
          _partTimeWorkersMeta,
        ),
      );
    }
    if (data.containsKey('seasonal_workers')) {
      context.handle(
        _seasonalWorkersMeta,
        seasonalWorkers.isAcceptableOrUnknown(
          data['seasonal_workers']!,
          _seasonalWorkersMeta,
        ),
      );
    }
    if (data.containsKey('family_workers')) {
      context.handle(
        _familyWorkersMeta,
        familyWorkers.isAcceptableOrUnknown(
          data['family_workers']!,
          _familyWorkersMeta,
        ),
      );
    }
    if (data.containsKey('last_chemical_application_date')) {
      context.handle(
        _lastChemicalApplicationDateMeta,
        lastChemicalApplicationDate.isAcceptableOrUnknown(
          data['last_chemical_application_date']!,
          _lastChemicalApplicationDateMeta,
        ),
      );
    }
    if (data.containsKey('conventional_lands')) {
      context.handle(
        _conventionalLandsMeta,
        conventionalLands.isAcceptableOrUnknown(
          data['conventional_lands']!,
          _conventionalLandsMeta,
        ),
      );
    }
    if (data.containsKey('fallow_pasture_land')) {
      context.handle(
        _fallowPastureLandMeta,
        fallowPastureLand.isAcceptableOrUnknown(
          data['fallow_pasture_land']!,
          _fallowPastureLandMeta,
        ),
      );
    }
    if (data.containsKey('conventional_crops')) {
      context.handle(
        _conventionalCropsMeta,
        conventionalCrops.isAcceptableOrUnknown(
          data['conventional_crops']!,
          _conventionalCropsMeta,
        ),
      );
    }
    if (data.containsKey('est_yield_kg')) {
      context.handle(
        _estYieldKgMeta,
        estYieldKg.isAcceptableOrUnknown(
          data['est_yield_kg']!,
          _estYieldKgMeta,
        ),
      );
    }
    if (data.containsKey('cert_type')) {
      context.handle(
        _certTypeMeta,
        certType.isAcceptableOrUnknown(data['cert_type']!, _certTypeMeta),
      );
    }
    if (data.containsKey('conversion_status')) {
      context.handle(
        _conversionStatusMeta,
        conversionStatus.isAcceptableOrUnknown(
          data['conversion_status']!,
          _conversionStatusMeta,
        ),
      );
    }
    if (data.containsKey('conversion_date')) {
      context.handle(
        _conversionDateMeta,
        conversionDate.isAcceptableOrUnknown(
          data['conversion_date']!,
          _conversionDateMeta,
        ),
      );
    }
    if (data.containsKey('inspector_name')) {
      context.handle(
        _inspectorNameMeta,
        inspectorName.isAcceptableOrUnknown(
          data['inspector_name']!,
          _inspectorNameMeta,
        ),
      );
    }
    if (data.containsKey('conversion_qualified')) {
      context.handle(
        _conversionQualifiedMeta,
        conversionQualified.isAcceptableOrUnknown(
          data['conversion_qualified']!,
          _conversionQualifiedMeta,
        ),
      );
    }
    if (data.containsKey('conversion_remarks')) {
      context.handle(
        _conversionRemarksMeta,
        conversionRemarks.isAcceptableOrUnknown(
          data['conversion_remarks']!,
          _conversionRemarksMeta,
        ),
      );
    }
    if (data.containsKey('soil_collection_date')) {
      context.handle(
        _soilCollectionDateMeta,
        soilCollectionDate.isAcceptableOrUnknown(
          data['soil_collection_date']!,
          _soilCollectionDateMeta,
        ),
      );
    }
    if (data.containsKey('soil_lab_testing_date')) {
      context.handle(
        _soilLabTestingDateMeta,
        soilLabTestingDate.isAcceptableOrUnknown(
          data['soil_lab_testing_date']!,
          _soilLabTestingDateMeta,
        ),
      );
    }
    if (data.containsKey('soil_result_date')) {
      context.handle(
        _soilResultDateMeta,
        soilResultDate.isAcceptableOrUnknown(
          data['soil_result_date']!,
          _soilResultDateMeta,
        ),
      );
    }
    if (data.containsKey('soil_report_url')) {
      context.handle(
        _soilReportUrlMeta,
        soilReportUrl.isAcceptableOrUnknown(
          data['soil_report_url']!,
          _soilReportUrlMeta,
        ),
      );
    }
    if (data.containsKey('soil_samples_info')) {
      context.handle(
        _soilSamplesInfoMeta,
        soilSamplesInfo.isAcceptableOrUnknown(
          data['soil_samples_info']!,
          _soilSamplesInfoMeta,
        ),
      );
    }
    if (data.containsKey('soil_criteria')) {
      context.handle(
        _soilCriteriaMeta,
        soilCriteria.isAcceptableOrUnknown(
          data['soil_criteria']!,
          _soilCriteriaMeta,
        ),
      );
    }
    if (data.containsKey('sync_status')) {
      context.handle(
        _syncStatusMeta,
        syncStatus.isAcceptableOrUnknown(data['sync_status']!, _syncStatusMeta),
      );
    }
    if (data.containsKey('last_synced_at')) {
      context.handle(
        _lastSyncedAtMeta,
        lastSyncedAt.isAcceptableOrUnknown(
          data['last_synced_at']!,
          _lastSyncedAtMeta,
        ),
      );
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  FarmLandCacheData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return FarmLandCacheData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      farmerId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}farmer_id'],
      )!,
      name: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}name'],
      )!,
      sizeHectares: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}size_hectares'],
      ),
      latitude: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}latitude'],
      ),
      longitude: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}longitude'],
      ),
      landOwnership: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}land_ownership'],
      ),
      waterSource: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}water_source'],
      ),
      soilFertility: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}soil_fertility'],
      ),
      boundaryGeoJson: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}boundary_geo_json'],
      ),
      landSurveyNo: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}land_survey_no'],
      ),
      approachRoad: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}approach_road'],
      ),
      landTopology: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}land_topology'],
      ),
      landGradient: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}land_gradient'],
      ),
      landDocumentUrl: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}land_document_url'],
      ),
      powerSource: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}power_source'],
      ),
      farmPhotoUrl: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}farm_photo_url'],
      ),
      irrigationSource: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}irrigation_source'],
      ),
      irrigationType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}irrigation_type'],
      ),
      fullTimeWorkers: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}full_time_workers'],
      ),
      partTimeWorkers: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}part_time_workers'],
      ),
      seasonalWorkers: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}seasonal_workers'],
      ),
      familyWorkers: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}family_workers'],
      ),
      lastChemicalApplicationDate: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}last_chemical_application_date'],
      ),
      conventionalLands: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}conventional_lands'],
      ),
      fallowPastureLand: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}fallow_pasture_land'],
      ),
      conventionalCrops: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}conventional_crops'],
      ),
      estYieldKg: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}est_yield_kg'],
      ),
      certType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}cert_type'],
      ),
      conversionStatus: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}conversion_status'],
      ),
      conversionDate: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}conversion_date'],
      ),
      inspectorName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}inspector_name'],
      ),
      conversionQualified: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}conversion_qualified'],
      ),
      conversionRemarks: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}conversion_remarks'],
      ),
      soilCollectionDate: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}soil_collection_date'],
      ),
      soilLabTestingDate: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}soil_lab_testing_date'],
      ),
      soilResultDate: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}soil_result_date'],
      ),
      soilReportUrl: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}soil_report_url'],
      ),
      soilSamplesInfo: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}soil_samples_info'],
      ),
      soilCriteria: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}soil_criteria'],
      ),
      syncStatus: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}sync_status'],
      )!,
      lastSyncedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}last_synced_at'],
      ),
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      ),
    );
  }

  @override
  $FarmLandCacheTable createAlias(String alias) {
    return $FarmLandCacheTable(attachedDatabase, alias);
  }
}

class FarmLandCacheData extends DataClass
    implements Insertable<FarmLandCacheData> {
  final String id;
  final String farmerId;
  final String name;
  final double? sizeHectares;
  final double? latitude;
  final double? longitude;
  final String? landOwnership;
  final String? waterSource;
  final String? soilFertility;
  final String? boundaryGeoJson;
  final String? landSurveyNo;
  final String? approachRoad;
  final String? landTopology;
  final String? landGradient;
  final String? landDocumentUrl;
  final String? powerSource;
  final String? farmPhotoUrl;
  final String? irrigationSource;
  final String? irrigationType;
  final double? fullTimeWorkers;
  final double? partTimeWorkers;
  final double? seasonalWorkers;
  final double? familyWorkers;
  final DateTime? lastChemicalApplicationDate;
  final String? conventionalLands;
  final String? fallowPastureLand;
  final String? conventionalCrops;
  final double? estYieldKg;
  final String? certType;
  final String? conversionStatus;
  final DateTime? conversionDate;
  final String? inspectorName;
  final bool? conversionQualified;
  final String? conversionRemarks;
  final DateTime? soilCollectionDate;
  final DateTime? soilLabTestingDate;
  final DateTime? soilResultDate;
  final String? soilReportUrl;
  final String? soilSamplesInfo;
  final String? soilCriteria;
  final String syncStatus;
  final DateTime? lastSyncedAt;
  final DateTime? updatedAt;
  const FarmLandCacheData({
    required this.id,
    required this.farmerId,
    required this.name,
    this.sizeHectares,
    this.latitude,
    this.longitude,
    this.landOwnership,
    this.waterSource,
    this.soilFertility,
    this.boundaryGeoJson,
    this.landSurveyNo,
    this.approachRoad,
    this.landTopology,
    this.landGradient,
    this.landDocumentUrl,
    this.powerSource,
    this.farmPhotoUrl,
    this.irrigationSource,
    this.irrigationType,
    this.fullTimeWorkers,
    this.partTimeWorkers,
    this.seasonalWorkers,
    this.familyWorkers,
    this.lastChemicalApplicationDate,
    this.conventionalLands,
    this.fallowPastureLand,
    this.conventionalCrops,
    this.estYieldKg,
    this.certType,
    this.conversionStatus,
    this.conversionDate,
    this.inspectorName,
    this.conversionQualified,
    this.conversionRemarks,
    this.soilCollectionDate,
    this.soilLabTestingDate,
    this.soilResultDate,
    this.soilReportUrl,
    this.soilSamplesInfo,
    this.soilCriteria,
    required this.syncStatus,
    this.lastSyncedAt,
    this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['farmer_id'] = Variable<String>(farmerId);
    map['name'] = Variable<String>(name);
    if (!nullToAbsent || sizeHectares != null) {
      map['size_hectares'] = Variable<double>(sizeHectares);
    }
    if (!nullToAbsent || latitude != null) {
      map['latitude'] = Variable<double>(latitude);
    }
    if (!nullToAbsent || longitude != null) {
      map['longitude'] = Variable<double>(longitude);
    }
    if (!nullToAbsent || landOwnership != null) {
      map['land_ownership'] = Variable<String>(landOwnership);
    }
    if (!nullToAbsent || waterSource != null) {
      map['water_source'] = Variable<String>(waterSource);
    }
    if (!nullToAbsent || soilFertility != null) {
      map['soil_fertility'] = Variable<String>(soilFertility);
    }
    if (!nullToAbsent || boundaryGeoJson != null) {
      map['boundary_geo_json'] = Variable<String>(boundaryGeoJson);
    }
    if (!nullToAbsent || landSurveyNo != null) {
      map['land_survey_no'] = Variable<String>(landSurveyNo);
    }
    if (!nullToAbsent || approachRoad != null) {
      map['approach_road'] = Variable<String>(approachRoad);
    }
    if (!nullToAbsent || landTopology != null) {
      map['land_topology'] = Variable<String>(landTopology);
    }
    if (!nullToAbsent || landGradient != null) {
      map['land_gradient'] = Variable<String>(landGradient);
    }
    if (!nullToAbsent || landDocumentUrl != null) {
      map['land_document_url'] = Variable<String>(landDocumentUrl);
    }
    if (!nullToAbsent || powerSource != null) {
      map['power_source'] = Variable<String>(powerSource);
    }
    if (!nullToAbsent || farmPhotoUrl != null) {
      map['farm_photo_url'] = Variable<String>(farmPhotoUrl);
    }
    if (!nullToAbsent || irrigationSource != null) {
      map['irrigation_source'] = Variable<String>(irrigationSource);
    }
    if (!nullToAbsent || irrigationType != null) {
      map['irrigation_type'] = Variable<String>(irrigationType);
    }
    if (!nullToAbsent || fullTimeWorkers != null) {
      map['full_time_workers'] = Variable<double>(fullTimeWorkers);
    }
    if (!nullToAbsent || partTimeWorkers != null) {
      map['part_time_workers'] = Variable<double>(partTimeWorkers);
    }
    if (!nullToAbsent || seasonalWorkers != null) {
      map['seasonal_workers'] = Variable<double>(seasonalWorkers);
    }
    if (!nullToAbsent || familyWorkers != null) {
      map['family_workers'] = Variable<double>(familyWorkers);
    }
    if (!nullToAbsent || lastChemicalApplicationDate != null) {
      map['last_chemical_application_date'] = Variable<DateTime>(
        lastChemicalApplicationDate,
      );
    }
    if (!nullToAbsent || conventionalLands != null) {
      map['conventional_lands'] = Variable<String>(conventionalLands);
    }
    if (!nullToAbsent || fallowPastureLand != null) {
      map['fallow_pasture_land'] = Variable<String>(fallowPastureLand);
    }
    if (!nullToAbsent || conventionalCrops != null) {
      map['conventional_crops'] = Variable<String>(conventionalCrops);
    }
    if (!nullToAbsent || estYieldKg != null) {
      map['est_yield_kg'] = Variable<double>(estYieldKg);
    }
    if (!nullToAbsent || certType != null) {
      map['cert_type'] = Variable<String>(certType);
    }
    if (!nullToAbsent || conversionStatus != null) {
      map['conversion_status'] = Variable<String>(conversionStatus);
    }
    if (!nullToAbsent || conversionDate != null) {
      map['conversion_date'] = Variable<DateTime>(conversionDate);
    }
    if (!nullToAbsent || inspectorName != null) {
      map['inspector_name'] = Variable<String>(inspectorName);
    }
    if (!nullToAbsent || conversionQualified != null) {
      map['conversion_qualified'] = Variable<bool>(conversionQualified);
    }
    if (!nullToAbsent || conversionRemarks != null) {
      map['conversion_remarks'] = Variable<String>(conversionRemarks);
    }
    if (!nullToAbsent || soilCollectionDate != null) {
      map['soil_collection_date'] = Variable<DateTime>(soilCollectionDate);
    }
    if (!nullToAbsent || soilLabTestingDate != null) {
      map['soil_lab_testing_date'] = Variable<DateTime>(soilLabTestingDate);
    }
    if (!nullToAbsent || soilResultDate != null) {
      map['soil_result_date'] = Variable<DateTime>(soilResultDate);
    }
    if (!nullToAbsent || soilReportUrl != null) {
      map['soil_report_url'] = Variable<String>(soilReportUrl);
    }
    if (!nullToAbsent || soilSamplesInfo != null) {
      map['soil_samples_info'] = Variable<String>(soilSamplesInfo);
    }
    if (!nullToAbsent || soilCriteria != null) {
      map['soil_criteria'] = Variable<String>(soilCriteria);
    }
    map['sync_status'] = Variable<String>(syncStatus);
    if (!nullToAbsent || lastSyncedAt != null) {
      map['last_synced_at'] = Variable<DateTime>(lastSyncedAt);
    }
    if (!nullToAbsent || updatedAt != null) {
      map['updated_at'] = Variable<DateTime>(updatedAt);
    }
    return map;
  }

  FarmLandCacheCompanion toCompanion(bool nullToAbsent) {
    return FarmLandCacheCompanion(
      id: Value(id),
      farmerId: Value(farmerId),
      name: Value(name),
      sizeHectares: sizeHectares == null && nullToAbsent
          ? const Value.absent()
          : Value(sizeHectares),
      latitude: latitude == null && nullToAbsent
          ? const Value.absent()
          : Value(latitude),
      longitude: longitude == null && nullToAbsent
          ? const Value.absent()
          : Value(longitude),
      landOwnership: landOwnership == null && nullToAbsent
          ? const Value.absent()
          : Value(landOwnership),
      waterSource: waterSource == null && nullToAbsent
          ? const Value.absent()
          : Value(waterSource),
      soilFertility: soilFertility == null && nullToAbsent
          ? const Value.absent()
          : Value(soilFertility),
      boundaryGeoJson: boundaryGeoJson == null && nullToAbsent
          ? const Value.absent()
          : Value(boundaryGeoJson),
      landSurveyNo: landSurveyNo == null && nullToAbsent
          ? const Value.absent()
          : Value(landSurveyNo),
      approachRoad: approachRoad == null && nullToAbsent
          ? const Value.absent()
          : Value(approachRoad),
      landTopology: landTopology == null && nullToAbsent
          ? const Value.absent()
          : Value(landTopology),
      landGradient: landGradient == null && nullToAbsent
          ? const Value.absent()
          : Value(landGradient),
      landDocumentUrl: landDocumentUrl == null && nullToAbsent
          ? const Value.absent()
          : Value(landDocumentUrl),
      powerSource: powerSource == null && nullToAbsent
          ? const Value.absent()
          : Value(powerSource),
      farmPhotoUrl: farmPhotoUrl == null && nullToAbsent
          ? const Value.absent()
          : Value(farmPhotoUrl),
      irrigationSource: irrigationSource == null && nullToAbsent
          ? const Value.absent()
          : Value(irrigationSource),
      irrigationType: irrigationType == null && nullToAbsent
          ? const Value.absent()
          : Value(irrigationType),
      fullTimeWorkers: fullTimeWorkers == null && nullToAbsent
          ? const Value.absent()
          : Value(fullTimeWorkers),
      partTimeWorkers: partTimeWorkers == null && nullToAbsent
          ? const Value.absent()
          : Value(partTimeWorkers),
      seasonalWorkers: seasonalWorkers == null && nullToAbsent
          ? const Value.absent()
          : Value(seasonalWorkers),
      familyWorkers: familyWorkers == null && nullToAbsent
          ? const Value.absent()
          : Value(familyWorkers),
      lastChemicalApplicationDate:
          lastChemicalApplicationDate == null && nullToAbsent
          ? const Value.absent()
          : Value(lastChemicalApplicationDate),
      conventionalLands: conventionalLands == null && nullToAbsent
          ? const Value.absent()
          : Value(conventionalLands),
      fallowPastureLand: fallowPastureLand == null && nullToAbsent
          ? const Value.absent()
          : Value(fallowPastureLand),
      conventionalCrops: conventionalCrops == null && nullToAbsent
          ? const Value.absent()
          : Value(conventionalCrops),
      estYieldKg: estYieldKg == null && nullToAbsent
          ? const Value.absent()
          : Value(estYieldKg),
      certType: certType == null && nullToAbsent
          ? const Value.absent()
          : Value(certType),
      conversionStatus: conversionStatus == null && nullToAbsent
          ? const Value.absent()
          : Value(conversionStatus),
      conversionDate: conversionDate == null && nullToAbsent
          ? const Value.absent()
          : Value(conversionDate),
      inspectorName: inspectorName == null && nullToAbsent
          ? const Value.absent()
          : Value(inspectorName),
      conversionQualified: conversionQualified == null && nullToAbsent
          ? const Value.absent()
          : Value(conversionQualified),
      conversionRemarks: conversionRemarks == null && nullToAbsent
          ? const Value.absent()
          : Value(conversionRemarks),
      soilCollectionDate: soilCollectionDate == null && nullToAbsent
          ? const Value.absent()
          : Value(soilCollectionDate),
      soilLabTestingDate: soilLabTestingDate == null && nullToAbsent
          ? const Value.absent()
          : Value(soilLabTestingDate),
      soilResultDate: soilResultDate == null && nullToAbsent
          ? const Value.absent()
          : Value(soilResultDate),
      soilReportUrl: soilReportUrl == null && nullToAbsent
          ? const Value.absent()
          : Value(soilReportUrl),
      soilSamplesInfo: soilSamplesInfo == null && nullToAbsent
          ? const Value.absent()
          : Value(soilSamplesInfo),
      soilCriteria: soilCriteria == null && nullToAbsent
          ? const Value.absent()
          : Value(soilCriteria),
      syncStatus: Value(syncStatus),
      lastSyncedAt: lastSyncedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(lastSyncedAt),
      updatedAt: updatedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(updatedAt),
    );
  }

  factory FarmLandCacheData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return FarmLandCacheData(
      id: serializer.fromJson<String>(json['id']),
      farmerId: serializer.fromJson<String>(json['farmerId']),
      name: serializer.fromJson<String>(json['name']),
      sizeHectares: serializer.fromJson<double?>(json['sizeHectares']),
      latitude: serializer.fromJson<double?>(json['latitude']),
      longitude: serializer.fromJson<double?>(json['longitude']),
      landOwnership: serializer.fromJson<String?>(json['landOwnership']),
      waterSource: serializer.fromJson<String?>(json['waterSource']),
      soilFertility: serializer.fromJson<String?>(json['soilFertility']),
      boundaryGeoJson: serializer.fromJson<String?>(json['boundaryGeoJson']),
      landSurveyNo: serializer.fromJson<String?>(json['landSurveyNo']),
      approachRoad: serializer.fromJson<String?>(json['approachRoad']),
      landTopology: serializer.fromJson<String?>(json['landTopology']),
      landGradient: serializer.fromJson<String?>(json['landGradient']),
      landDocumentUrl: serializer.fromJson<String?>(json['landDocumentUrl']),
      powerSource: serializer.fromJson<String?>(json['powerSource']),
      farmPhotoUrl: serializer.fromJson<String?>(json['farmPhotoUrl']),
      irrigationSource: serializer.fromJson<String?>(json['irrigationSource']),
      irrigationType: serializer.fromJson<String?>(json['irrigationType']),
      fullTimeWorkers: serializer.fromJson<double?>(json['fullTimeWorkers']),
      partTimeWorkers: serializer.fromJson<double?>(json['partTimeWorkers']),
      seasonalWorkers: serializer.fromJson<double?>(json['seasonalWorkers']),
      familyWorkers: serializer.fromJson<double?>(json['familyWorkers']),
      lastChemicalApplicationDate: serializer.fromJson<DateTime?>(
        json['lastChemicalApplicationDate'],
      ),
      conventionalLands: serializer.fromJson<String?>(
        json['conventionalLands'],
      ),
      fallowPastureLand: serializer.fromJson<String?>(
        json['fallowPastureLand'],
      ),
      conventionalCrops: serializer.fromJson<String?>(
        json['conventionalCrops'],
      ),
      estYieldKg: serializer.fromJson<double?>(json['estYieldKg']),
      certType: serializer.fromJson<String?>(json['certType']),
      conversionStatus: serializer.fromJson<String?>(json['conversionStatus']),
      conversionDate: serializer.fromJson<DateTime?>(json['conversionDate']),
      inspectorName: serializer.fromJson<String?>(json['inspectorName']),
      conversionQualified: serializer.fromJson<bool?>(
        json['conversionQualified'],
      ),
      conversionRemarks: serializer.fromJson<String?>(
        json['conversionRemarks'],
      ),
      soilCollectionDate: serializer.fromJson<DateTime?>(
        json['soilCollectionDate'],
      ),
      soilLabTestingDate: serializer.fromJson<DateTime?>(
        json['soilLabTestingDate'],
      ),
      soilResultDate: serializer.fromJson<DateTime?>(json['soilResultDate']),
      soilReportUrl: serializer.fromJson<String?>(json['soilReportUrl']),
      soilSamplesInfo: serializer.fromJson<String?>(json['soilSamplesInfo']),
      soilCriteria: serializer.fromJson<String?>(json['soilCriteria']),
      syncStatus: serializer.fromJson<String>(json['syncStatus']),
      lastSyncedAt: serializer.fromJson<DateTime?>(json['lastSyncedAt']),
      updatedAt: serializer.fromJson<DateTime?>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'farmerId': serializer.toJson<String>(farmerId),
      'name': serializer.toJson<String>(name),
      'sizeHectares': serializer.toJson<double?>(sizeHectares),
      'latitude': serializer.toJson<double?>(latitude),
      'longitude': serializer.toJson<double?>(longitude),
      'landOwnership': serializer.toJson<String?>(landOwnership),
      'waterSource': serializer.toJson<String?>(waterSource),
      'soilFertility': serializer.toJson<String?>(soilFertility),
      'boundaryGeoJson': serializer.toJson<String?>(boundaryGeoJson),
      'landSurveyNo': serializer.toJson<String?>(landSurveyNo),
      'approachRoad': serializer.toJson<String?>(approachRoad),
      'landTopology': serializer.toJson<String?>(landTopology),
      'landGradient': serializer.toJson<String?>(landGradient),
      'landDocumentUrl': serializer.toJson<String?>(landDocumentUrl),
      'powerSource': serializer.toJson<String?>(powerSource),
      'farmPhotoUrl': serializer.toJson<String?>(farmPhotoUrl),
      'irrigationSource': serializer.toJson<String?>(irrigationSource),
      'irrigationType': serializer.toJson<String?>(irrigationType),
      'fullTimeWorkers': serializer.toJson<double?>(fullTimeWorkers),
      'partTimeWorkers': serializer.toJson<double?>(partTimeWorkers),
      'seasonalWorkers': serializer.toJson<double?>(seasonalWorkers),
      'familyWorkers': serializer.toJson<double?>(familyWorkers),
      'lastChemicalApplicationDate': serializer.toJson<DateTime?>(
        lastChemicalApplicationDate,
      ),
      'conventionalLands': serializer.toJson<String?>(conventionalLands),
      'fallowPastureLand': serializer.toJson<String?>(fallowPastureLand),
      'conventionalCrops': serializer.toJson<String?>(conventionalCrops),
      'estYieldKg': serializer.toJson<double?>(estYieldKg),
      'certType': serializer.toJson<String?>(certType),
      'conversionStatus': serializer.toJson<String?>(conversionStatus),
      'conversionDate': serializer.toJson<DateTime?>(conversionDate),
      'inspectorName': serializer.toJson<String?>(inspectorName),
      'conversionQualified': serializer.toJson<bool?>(conversionQualified),
      'conversionRemarks': serializer.toJson<String?>(conversionRemarks),
      'soilCollectionDate': serializer.toJson<DateTime?>(soilCollectionDate),
      'soilLabTestingDate': serializer.toJson<DateTime?>(soilLabTestingDate),
      'soilResultDate': serializer.toJson<DateTime?>(soilResultDate),
      'soilReportUrl': serializer.toJson<String?>(soilReportUrl),
      'soilSamplesInfo': serializer.toJson<String?>(soilSamplesInfo),
      'soilCriteria': serializer.toJson<String?>(soilCriteria),
      'syncStatus': serializer.toJson<String>(syncStatus),
      'lastSyncedAt': serializer.toJson<DateTime?>(lastSyncedAt),
      'updatedAt': serializer.toJson<DateTime?>(updatedAt),
    };
  }

  FarmLandCacheData copyWith({
    String? id,
    String? farmerId,
    String? name,
    Value<double?> sizeHectares = const Value.absent(),
    Value<double?> latitude = const Value.absent(),
    Value<double?> longitude = const Value.absent(),
    Value<String?> landOwnership = const Value.absent(),
    Value<String?> waterSource = const Value.absent(),
    Value<String?> soilFertility = const Value.absent(),
    Value<String?> boundaryGeoJson = const Value.absent(),
    Value<String?> landSurveyNo = const Value.absent(),
    Value<String?> approachRoad = const Value.absent(),
    Value<String?> landTopology = const Value.absent(),
    Value<String?> landGradient = const Value.absent(),
    Value<String?> landDocumentUrl = const Value.absent(),
    Value<String?> powerSource = const Value.absent(),
    Value<String?> farmPhotoUrl = const Value.absent(),
    Value<String?> irrigationSource = const Value.absent(),
    Value<String?> irrigationType = const Value.absent(),
    Value<double?> fullTimeWorkers = const Value.absent(),
    Value<double?> partTimeWorkers = const Value.absent(),
    Value<double?> seasonalWorkers = const Value.absent(),
    Value<double?> familyWorkers = const Value.absent(),
    Value<DateTime?> lastChemicalApplicationDate = const Value.absent(),
    Value<String?> conventionalLands = const Value.absent(),
    Value<String?> fallowPastureLand = const Value.absent(),
    Value<String?> conventionalCrops = const Value.absent(),
    Value<double?> estYieldKg = const Value.absent(),
    Value<String?> certType = const Value.absent(),
    Value<String?> conversionStatus = const Value.absent(),
    Value<DateTime?> conversionDate = const Value.absent(),
    Value<String?> inspectorName = const Value.absent(),
    Value<bool?> conversionQualified = const Value.absent(),
    Value<String?> conversionRemarks = const Value.absent(),
    Value<DateTime?> soilCollectionDate = const Value.absent(),
    Value<DateTime?> soilLabTestingDate = const Value.absent(),
    Value<DateTime?> soilResultDate = const Value.absent(),
    Value<String?> soilReportUrl = const Value.absent(),
    Value<String?> soilSamplesInfo = const Value.absent(),
    Value<String?> soilCriteria = const Value.absent(),
    String? syncStatus,
    Value<DateTime?> lastSyncedAt = const Value.absent(),
    Value<DateTime?> updatedAt = const Value.absent(),
  }) => FarmLandCacheData(
    id: id ?? this.id,
    farmerId: farmerId ?? this.farmerId,
    name: name ?? this.name,
    sizeHectares: sizeHectares.present ? sizeHectares.value : this.sizeHectares,
    latitude: latitude.present ? latitude.value : this.latitude,
    longitude: longitude.present ? longitude.value : this.longitude,
    landOwnership: landOwnership.present
        ? landOwnership.value
        : this.landOwnership,
    waterSource: waterSource.present ? waterSource.value : this.waterSource,
    soilFertility: soilFertility.present
        ? soilFertility.value
        : this.soilFertility,
    boundaryGeoJson: boundaryGeoJson.present
        ? boundaryGeoJson.value
        : this.boundaryGeoJson,
    landSurveyNo: landSurveyNo.present ? landSurveyNo.value : this.landSurveyNo,
    approachRoad: approachRoad.present ? approachRoad.value : this.approachRoad,
    landTopology: landTopology.present ? landTopology.value : this.landTopology,
    landGradient: landGradient.present ? landGradient.value : this.landGradient,
    landDocumentUrl: landDocumentUrl.present
        ? landDocumentUrl.value
        : this.landDocumentUrl,
    powerSource: powerSource.present ? powerSource.value : this.powerSource,
    farmPhotoUrl: farmPhotoUrl.present ? farmPhotoUrl.value : this.farmPhotoUrl,
    irrigationSource: irrigationSource.present
        ? irrigationSource.value
        : this.irrigationSource,
    irrigationType: irrigationType.present
        ? irrigationType.value
        : this.irrigationType,
    fullTimeWorkers: fullTimeWorkers.present
        ? fullTimeWorkers.value
        : this.fullTimeWorkers,
    partTimeWorkers: partTimeWorkers.present
        ? partTimeWorkers.value
        : this.partTimeWorkers,
    seasonalWorkers: seasonalWorkers.present
        ? seasonalWorkers.value
        : this.seasonalWorkers,
    familyWorkers: familyWorkers.present
        ? familyWorkers.value
        : this.familyWorkers,
    lastChemicalApplicationDate: lastChemicalApplicationDate.present
        ? lastChemicalApplicationDate.value
        : this.lastChemicalApplicationDate,
    conventionalLands: conventionalLands.present
        ? conventionalLands.value
        : this.conventionalLands,
    fallowPastureLand: fallowPastureLand.present
        ? fallowPastureLand.value
        : this.fallowPastureLand,
    conventionalCrops: conventionalCrops.present
        ? conventionalCrops.value
        : this.conventionalCrops,
    estYieldKg: estYieldKg.present ? estYieldKg.value : this.estYieldKg,
    certType: certType.present ? certType.value : this.certType,
    conversionStatus: conversionStatus.present
        ? conversionStatus.value
        : this.conversionStatus,
    conversionDate: conversionDate.present
        ? conversionDate.value
        : this.conversionDate,
    inspectorName: inspectorName.present
        ? inspectorName.value
        : this.inspectorName,
    conversionQualified: conversionQualified.present
        ? conversionQualified.value
        : this.conversionQualified,
    conversionRemarks: conversionRemarks.present
        ? conversionRemarks.value
        : this.conversionRemarks,
    soilCollectionDate: soilCollectionDate.present
        ? soilCollectionDate.value
        : this.soilCollectionDate,
    soilLabTestingDate: soilLabTestingDate.present
        ? soilLabTestingDate.value
        : this.soilLabTestingDate,
    soilResultDate: soilResultDate.present
        ? soilResultDate.value
        : this.soilResultDate,
    soilReportUrl: soilReportUrl.present
        ? soilReportUrl.value
        : this.soilReportUrl,
    soilSamplesInfo: soilSamplesInfo.present
        ? soilSamplesInfo.value
        : this.soilSamplesInfo,
    soilCriteria: soilCriteria.present ? soilCriteria.value : this.soilCriteria,
    syncStatus: syncStatus ?? this.syncStatus,
    lastSyncedAt: lastSyncedAt.present ? lastSyncedAt.value : this.lastSyncedAt,
    updatedAt: updatedAt.present ? updatedAt.value : this.updatedAt,
  );
  FarmLandCacheData copyWithCompanion(FarmLandCacheCompanion data) {
    return FarmLandCacheData(
      id: data.id.present ? data.id.value : this.id,
      farmerId: data.farmerId.present ? data.farmerId.value : this.farmerId,
      name: data.name.present ? data.name.value : this.name,
      sizeHectares: data.sizeHectares.present
          ? data.sizeHectares.value
          : this.sizeHectares,
      latitude: data.latitude.present ? data.latitude.value : this.latitude,
      longitude: data.longitude.present ? data.longitude.value : this.longitude,
      landOwnership: data.landOwnership.present
          ? data.landOwnership.value
          : this.landOwnership,
      waterSource: data.waterSource.present
          ? data.waterSource.value
          : this.waterSource,
      soilFertility: data.soilFertility.present
          ? data.soilFertility.value
          : this.soilFertility,
      boundaryGeoJson: data.boundaryGeoJson.present
          ? data.boundaryGeoJson.value
          : this.boundaryGeoJson,
      landSurveyNo: data.landSurveyNo.present
          ? data.landSurveyNo.value
          : this.landSurveyNo,
      approachRoad: data.approachRoad.present
          ? data.approachRoad.value
          : this.approachRoad,
      landTopology: data.landTopology.present
          ? data.landTopology.value
          : this.landTopology,
      landGradient: data.landGradient.present
          ? data.landGradient.value
          : this.landGradient,
      landDocumentUrl: data.landDocumentUrl.present
          ? data.landDocumentUrl.value
          : this.landDocumentUrl,
      powerSource: data.powerSource.present
          ? data.powerSource.value
          : this.powerSource,
      farmPhotoUrl: data.farmPhotoUrl.present
          ? data.farmPhotoUrl.value
          : this.farmPhotoUrl,
      irrigationSource: data.irrigationSource.present
          ? data.irrigationSource.value
          : this.irrigationSource,
      irrigationType: data.irrigationType.present
          ? data.irrigationType.value
          : this.irrigationType,
      fullTimeWorkers: data.fullTimeWorkers.present
          ? data.fullTimeWorkers.value
          : this.fullTimeWorkers,
      partTimeWorkers: data.partTimeWorkers.present
          ? data.partTimeWorkers.value
          : this.partTimeWorkers,
      seasonalWorkers: data.seasonalWorkers.present
          ? data.seasonalWorkers.value
          : this.seasonalWorkers,
      familyWorkers: data.familyWorkers.present
          ? data.familyWorkers.value
          : this.familyWorkers,
      lastChemicalApplicationDate: data.lastChemicalApplicationDate.present
          ? data.lastChemicalApplicationDate.value
          : this.lastChemicalApplicationDate,
      conventionalLands: data.conventionalLands.present
          ? data.conventionalLands.value
          : this.conventionalLands,
      fallowPastureLand: data.fallowPastureLand.present
          ? data.fallowPastureLand.value
          : this.fallowPastureLand,
      conventionalCrops: data.conventionalCrops.present
          ? data.conventionalCrops.value
          : this.conventionalCrops,
      estYieldKg: data.estYieldKg.present
          ? data.estYieldKg.value
          : this.estYieldKg,
      certType: data.certType.present ? data.certType.value : this.certType,
      conversionStatus: data.conversionStatus.present
          ? data.conversionStatus.value
          : this.conversionStatus,
      conversionDate: data.conversionDate.present
          ? data.conversionDate.value
          : this.conversionDate,
      inspectorName: data.inspectorName.present
          ? data.inspectorName.value
          : this.inspectorName,
      conversionQualified: data.conversionQualified.present
          ? data.conversionQualified.value
          : this.conversionQualified,
      conversionRemarks: data.conversionRemarks.present
          ? data.conversionRemarks.value
          : this.conversionRemarks,
      soilCollectionDate: data.soilCollectionDate.present
          ? data.soilCollectionDate.value
          : this.soilCollectionDate,
      soilLabTestingDate: data.soilLabTestingDate.present
          ? data.soilLabTestingDate.value
          : this.soilLabTestingDate,
      soilResultDate: data.soilResultDate.present
          ? data.soilResultDate.value
          : this.soilResultDate,
      soilReportUrl: data.soilReportUrl.present
          ? data.soilReportUrl.value
          : this.soilReportUrl,
      soilSamplesInfo: data.soilSamplesInfo.present
          ? data.soilSamplesInfo.value
          : this.soilSamplesInfo,
      soilCriteria: data.soilCriteria.present
          ? data.soilCriteria.value
          : this.soilCriteria,
      syncStatus: data.syncStatus.present
          ? data.syncStatus.value
          : this.syncStatus,
      lastSyncedAt: data.lastSyncedAt.present
          ? data.lastSyncedAt.value
          : this.lastSyncedAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('FarmLandCacheData(')
          ..write('id: $id, ')
          ..write('farmerId: $farmerId, ')
          ..write('name: $name, ')
          ..write('sizeHectares: $sizeHectares, ')
          ..write('latitude: $latitude, ')
          ..write('longitude: $longitude, ')
          ..write('landOwnership: $landOwnership, ')
          ..write('waterSource: $waterSource, ')
          ..write('soilFertility: $soilFertility, ')
          ..write('boundaryGeoJson: $boundaryGeoJson, ')
          ..write('landSurveyNo: $landSurveyNo, ')
          ..write('approachRoad: $approachRoad, ')
          ..write('landTopology: $landTopology, ')
          ..write('landGradient: $landGradient, ')
          ..write('landDocumentUrl: $landDocumentUrl, ')
          ..write('powerSource: $powerSource, ')
          ..write('farmPhotoUrl: $farmPhotoUrl, ')
          ..write('irrigationSource: $irrigationSource, ')
          ..write('irrigationType: $irrigationType, ')
          ..write('fullTimeWorkers: $fullTimeWorkers, ')
          ..write('partTimeWorkers: $partTimeWorkers, ')
          ..write('seasonalWorkers: $seasonalWorkers, ')
          ..write('familyWorkers: $familyWorkers, ')
          ..write('lastChemicalApplicationDate: $lastChemicalApplicationDate, ')
          ..write('conventionalLands: $conventionalLands, ')
          ..write('fallowPastureLand: $fallowPastureLand, ')
          ..write('conventionalCrops: $conventionalCrops, ')
          ..write('estYieldKg: $estYieldKg, ')
          ..write('certType: $certType, ')
          ..write('conversionStatus: $conversionStatus, ')
          ..write('conversionDate: $conversionDate, ')
          ..write('inspectorName: $inspectorName, ')
          ..write('conversionQualified: $conversionQualified, ')
          ..write('conversionRemarks: $conversionRemarks, ')
          ..write('soilCollectionDate: $soilCollectionDate, ')
          ..write('soilLabTestingDate: $soilLabTestingDate, ')
          ..write('soilResultDate: $soilResultDate, ')
          ..write('soilReportUrl: $soilReportUrl, ')
          ..write('soilSamplesInfo: $soilSamplesInfo, ')
          ..write('soilCriteria: $soilCriteria, ')
          ..write('syncStatus: $syncStatus, ')
          ..write('lastSyncedAt: $lastSyncedAt, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hashAll([
    id,
    farmerId,
    name,
    sizeHectares,
    latitude,
    longitude,
    landOwnership,
    waterSource,
    soilFertility,
    boundaryGeoJson,
    landSurveyNo,
    approachRoad,
    landTopology,
    landGradient,
    landDocumentUrl,
    powerSource,
    farmPhotoUrl,
    irrigationSource,
    irrigationType,
    fullTimeWorkers,
    partTimeWorkers,
    seasonalWorkers,
    familyWorkers,
    lastChemicalApplicationDate,
    conventionalLands,
    fallowPastureLand,
    conventionalCrops,
    estYieldKg,
    certType,
    conversionStatus,
    conversionDate,
    inspectorName,
    conversionQualified,
    conversionRemarks,
    soilCollectionDate,
    soilLabTestingDate,
    soilResultDate,
    soilReportUrl,
    soilSamplesInfo,
    soilCriteria,
    syncStatus,
    lastSyncedAt,
    updatedAt,
  ]);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is FarmLandCacheData &&
          other.id == this.id &&
          other.farmerId == this.farmerId &&
          other.name == this.name &&
          other.sizeHectares == this.sizeHectares &&
          other.latitude == this.latitude &&
          other.longitude == this.longitude &&
          other.landOwnership == this.landOwnership &&
          other.waterSource == this.waterSource &&
          other.soilFertility == this.soilFertility &&
          other.boundaryGeoJson == this.boundaryGeoJson &&
          other.landSurveyNo == this.landSurveyNo &&
          other.approachRoad == this.approachRoad &&
          other.landTopology == this.landTopology &&
          other.landGradient == this.landGradient &&
          other.landDocumentUrl == this.landDocumentUrl &&
          other.powerSource == this.powerSource &&
          other.farmPhotoUrl == this.farmPhotoUrl &&
          other.irrigationSource == this.irrigationSource &&
          other.irrigationType == this.irrigationType &&
          other.fullTimeWorkers == this.fullTimeWorkers &&
          other.partTimeWorkers == this.partTimeWorkers &&
          other.seasonalWorkers == this.seasonalWorkers &&
          other.familyWorkers == this.familyWorkers &&
          other.lastChemicalApplicationDate ==
              this.lastChemicalApplicationDate &&
          other.conventionalLands == this.conventionalLands &&
          other.fallowPastureLand == this.fallowPastureLand &&
          other.conventionalCrops == this.conventionalCrops &&
          other.estYieldKg == this.estYieldKg &&
          other.certType == this.certType &&
          other.conversionStatus == this.conversionStatus &&
          other.conversionDate == this.conversionDate &&
          other.inspectorName == this.inspectorName &&
          other.conversionQualified == this.conversionQualified &&
          other.conversionRemarks == this.conversionRemarks &&
          other.soilCollectionDate == this.soilCollectionDate &&
          other.soilLabTestingDate == this.soilLabTestingDate &&
          other.soilResultDate == this.soilResultDate &&
          other.soilReportUrl == this.soilReportUrl &&
          other.soilSamplesInfo == this.soilSamplesInfo &&
          other.soilCriteria == this.soilCriteria &&
          other.syncStatus == this.syncStatus &&
          other.lastSyncedAt == this.lastSyncedAt &&
          other.updatedAt == this.updatedAt);
}

class FarmLandCacheCompanion extends UpdateCompanion<FarmLandCacheData> {
  final Value<String> id;
  final Value<String> farmerId;
  final Value<String> name;
  final Value<double?> sizeHectares;
  final Value<double?> latitude;
  final Value<double?> longitude;
  final Value<String?> landOwnership;
  final Value<String?> waterSource;
  final Value<String?> soilFertility;
  final Value<String?> boundaryGeoJson;
  final Value<String?> landSurveyNo;
  final Value<String?> approachRoad;
  final Value<String?> landTopology;
  final Value<String?> landGradient;
  final Value<String?> landDocumentUrl;
  final Value<String?> powerSource;
  final Value<String?> farmPhotoUrl;
  final Value<String?> irrigationSource;
  final Value<String?> irrigationType;
  final Value<double?> fullTimeWorkers;
  final Value<double?> partTimeWorkers;
  final Value<double?> seasonalWorkers;
  final Value<double?> familyWorkers;
  final Value<DateTime?> lastChemicalApplicationDate;
  final Value<String?> conventionalLands;
  final Value<String?> fallowPastureLand;
  final Value<String?> conventionalCrops;
  final Value<double?> estYieldKg;
  final Value<String?> certType;
  final Value<String?> conversionStatus;
  final Value<DateTime?> conversionDate;
  final Value<String?> inspectorName;
  final Value<bool?> conversionQualified;
  final Value<String?> conversionRemarks;
  final Value<DateTime?> soilCollectionDate;
  final Value<DateTime?> soilLabTestingDate;
  final Value<DateTime?> soilResultDate;
  final Value<String?> soilReportUrl;
  final Value<String?> soilSamplesInfo;
  final Value<String?> soilCriteria;
  final Value<String> syncStatus;
  final Value<DateTime?> lastSyncedAt;
  final Value<DateTime?> updatedAt;
  final Value<int> rowid;
  const FarmLandCacheCompanion({
    this.id = const Value.absent(),
    this.farmerId = const Value.absent(),
    this.name = const Value.absent(),
    this.sizeHectares = const Value.absent(),
    this.latitude = const Value.absent(),
    this.longitude = const Value.absent(),
    this.landOwnership = const Value.absent(),
    this.waterSource = const Value.absent(),
    this.soilFertility = const Value.absent(),
    this.boundaryGeoJson = const Value.absent(),
    this.landSurveyNo = const Value.absent(),
    this.approachRoad = const Value.absent(),
    this.landTopology = const Value.absent(),
    this.landGradient = const Value.absent(),
    this.landDocumentUrl = const Value.absent(),
    this.powerSource = const Value.absent(),
    this.farmPhotoUrl = const Value.absent(),
    this.irrigationSource = const Value.absent(),
    this.irrigationType = const Value.absent(),
    this.fullTimeWorkers = const Value.absent(),
    this.partTimeWorkers = const Value.absent(),
    this.seasonalWorkers = const Value.absent(),
    this.familyWorkers = const Value.absent(),
    this.lastChemicalApplicationDate = const Value.absent(),
    this.conventionalLands = const Value.absent(),
    this.fallowPastureLand = const Value.absent(),
    this.conventionalCrops = const Value.absent(),
    this.estYieldKg = const Value.absent(),
    this.certType = const Value.absent(),
    this.conversionStatus = const Value.absent(),
    this.conversionDate = const Value.absent(),
    this.inspectorName = const Value.absent(),
    this.conversionQualified = const Value.absent(),
    this.conversionRemarks = const Value.absent(),
    this.soilCollectionDate = const Value.absent(),
    this.soilLabTestingDate = const Value.absent(),
    this.soilResultDate = const Value.absent(),
    this.soilReportUrl = const Value.absent(),
    this.soilSamplesInfo = const Value.absent(),
    this.soilCriteria = const Value.absent(),
    this.syncStatus = const Value.absent(),
    this.lastSyncedAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  FarmLandCacheCompanion.insert({
    required String id,
    required String farmerId,
    required String name,
    this.sizeHectares = const Value.absent(),
    this.latitude = const Value.absent(),
    this.longitude = const Value.absent(),
    this.landOwnership = const Value.absent(),
    this.waterSource = const Value.absent(),
    this.soilFertility = const Value.absent(),
    this.boundaryGeoJson = const Value.absent(),
    this.landSurveyNo = const Value.absent(),
    this.approachRoad = const Value.absent(),
    this.landTopology = const Value.absent(),
    this.landGradient = const Value.absent(),
    this.landDocumentUrl = const Value.absent(),
    this.powerSource = const Value.absent(),
    this.farmPhotoUrl = const Value.absent(),
    this.irrigationSource = const Value.absent(),
    this.irrigationType = const Value.absent(),
    this.fullTimeWorkers = const Value.absent(),
    this.partTimeWorkers = const Value.absent(),
    this.seasonalWorkers = const Value.absent(),
    this.familyWorkers = const Value.absent(),
    this.lastChemicalApplicationDate = const Value.absent(),
    this.conventionalLands = const Value.absent(),
    this.fallowPastureLand = const Value.absent(),
    this.conventionalCrops = const Value.absent(),
    this.estYieldKg = const Value.absent(),
    this.certType = const Value.absent(),
    this.conversionStatus = const Value.absent(),
    this.conversionDate = const Value.absent(),
    this.inspectorName = const Value.absent(),
    this.conversionQualified = const Value.absent(),
    this.conversionRemarks = const Value.absent(),
    this.soilCollectionDate = const Value.absent(),
    this.soilLabTestingDate = const Value.absent(),
    this.soilResultDate = const Value.absent(),
    this.soilReportUrl = const Value.absent(),
    this.soilSamplesInfo = const Value.absent(),
    this.soilCriteria = const Value.absent(),
    this.syncStatus = const Value.absent(),
    this.lastSyncedAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       farmerId = Value(farmerId),
       name = Value(name);
  static Insertable<FarmLandCacheData> custom({
    Expression<String>? id,
    Expression<String>? farmerId,
    Expression<String>? name,
    Expression<double>? sizeHectares,
    Expression<double>? latitude,
    Expression<double>? longitude,
    Expression<String>? landOwnership,
    Expression<String>? waterSource,
    Expression<String>? soilFertility,
    Expression<String>? boundaryGeoJson,
    Expression<String>? landSurveyNo,
    Expression<String>? approachRoad,
    Expression<String>? landTopology,
    Expression<String>? landGradient,
    Expression<String>? landDocumentUrl,
    Expression<String>? powerSource,
    Expression<String>? farmPhotoUrl,
    Expression<String>? irrigationSource,
    Expression<String>? irrigationType,
    Expression<double>? fullTimeWorkers,
    Expression<double>? partTimeWorkers,
    Expression<double>? seasonalWorkers,
    Expression<double>? familyWorkers,
    Expression<DateTime>? lastChemicalApplicationDate,
    Expression<String>? conventionalLands,
    Expression<String>? fallowPastureLand,
    Expression<String>? conventionalCrops,
    Expression<double>? estYieldKg,
    Expression<String>? certType,
    Expression<String>? conversionStatus,
    Expression<DateTime>? conversionDate,
    Expression<String>? inspectorName,
    Expression<bool>? conversionQualified,
    Expression<String>? conversionRemarks,
    Expression<DateTime>? soilCollectionDate,
    Expression<DateTime>? soilLabTestingDate,
    Expression<DateTime>? soilResultDate,
    Expression<String>? soilReportUrl,
    Expression<String>? soilSamplesInfo,
    Expression<String>? soilCriteria,
    Expression<String>? syncStatus,
    Expression<DateTime>? lastSyncedAt,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (farmerId != null) 'farmer_id': farmerId,
      if (name != null) 'name': name,
      if (sizeHectares != null) 'size_hectares': sizeHectares,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (landOwnership != null) 'land_ownership': landOwnership,
      if (waterSource != null) 'water_source': waterSource,
      if (soilFertility != null) 'soil_fertility': soilFertility,
      if (boundaryGeoJson != null) 'boundary_geo_json': boundaryGeoJson,
      if (landSurveyNo != null) 'land_survey_no': landSurveyNo,
      if (approachRoad != null) 'approach_road': approachRoad,
      if (landTopology != null) 'land_topology': landTopology,
      if (landGradient != null) 'land_gradient': landGradient,
      if (landDocumentUrl != null) 'land_document_url': landDocumentUrl,
      if (powerSource != null) 'power_source': powerSource,
      if (farmPhotoUrl != null) 'farm_photo_url': farmPhotoUrl,
      if (irrigationSource != null) 'irrigation_source': irrigationSource,
      if (irrigationType != null) 'irrigation_type': irrigationType,
      if (fullTimeWorkers != null) 'full_time_workers': fullTimeWorkers,
      if (partTimeWorkers != null) 'part_time_workers': partTimeWorkers,
      if (seasonalWorkers != null) 'seasonal_workers': seasonalWorkers,
      if (familyWorkers != null) 'family_workers': familyWorkers,
      if (lastChemicalApplicationDate != null)
        'last_chemical_application_date': lastChemicalApplicationDate,
      if (conventionalLands != null) 'conventional_lands': conventionalLands,
      if (fallowPastureLand != null) 'fallow_pasture_land': fallowPastureLand,
      if (conventionalCrops != null) 'conventional_crops': conventionalCrops,
      if (estYieldKg != null) 'est_yield_kg': estYieldKg,
      if (certType != null) 'cert_type': certType,
      if (conversionStatus != null) 'conversion_status': conversionStatus,
      if (conversionDate != null) 'conversion_date': conversionDate,
      if (inspectorName != null) 'inspector_name': inspectorName,
      if (conversionQualified != null)
        'conversion_qualified': conversionQualified,
      if (conversionRemarks != null) 'conversion_remarks': conversionRemarks,
      if (soilCollectionDate != null)
        'soil_collection_date': soilCollectionDate,
      if (soilLabTestingDate != null)
        'soil_lab_testing_date': soilLabTestingDate,
      if (soilResultDate != null) 'soil_result_date': soilResultDate,
      if (soilReportUrl != null) 'soil_report_url': soilReportUrl,
      if (soilSamplesInfo != null) 'soil_samples_info': soilSamplesInfo,
      if (soilCriteria != null) 'soil_criteria': soilCriteria,
      if (syncStatus != null) 'sync_status': syncStatus,
      if (lastSyncedAt != null) 'last_synced_at': lastSyncedAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  FarmLandCacheCompanion copyWith({
    Value<String>? id,
    Value<String>? farmerId,
    Value<String>? name,
    Value<double?>? sizeHectares,
    Value<double?>? latitude,
    Value<double?>? longitude,
    Value<String?>? landOwnership,
    Value<String?>? waterSource,
    Value<String?>? soilFertility,
    Value<String?>? boundaryGeoJson,
    Value<String?>? landSurveyNo,
    Value<String?>? approachRoad,
    Value<String?>? landTopology,
    Value<String?>? landGradient,
    Value<String?>? landDocumentUrl,
    Value<String?>? powerSource,
    Value<String?>? farmPhotoUrl,
    Value<String?>? irrigationSource,
    Value<String?>? irrigationType,
    Value<double?>? fullTimeWorkers,
    Value<double?>? partTimeWorkers,
    Value<double?>? seasonalWorkers,
    Value<double?>? familyWorkers,
    Value<DateTime?>? lastChemicalApplicationDate,
    Value<String?>? conventionalLands,
    Value<String?>? fallowPastureLand,
    Value<String?>? conventionalCrops,
    Value<double?>? estYieldKg,
    Value<String?>? certType,
    Value<String?>? conversionStatus,
    Value<DateTime?>? conversionDate,
    Value<String?>? inspectorName,
    Value<bool?>? conversionQualified,
    Value<String?>? conversionRemarks,
    Value<DateTime?>? soilCollectionDate,
    Value<DateTime?>? soilLabTestingDate,
    Value<DateTime?>? soilResultDate,
    Value<String?>? soilReportUrl,
    Value<String?>? soilSamplesInfo,
    Value<String?>? soilCriteria,
    Value<String>? syncStatus,
    Value<DateTime?>? lastSyncedAt,
    Value<DateTime?>? updatedAt,
    Value<int>? rowid,
  }) {
    return FarmLandCacheCompanion(
      id: id ?? this.id,
      farmerId: farmerId ?? this.farmerId,
      name: name ?? this.name,
      sizeHectares: sizeHectares ?? this.sizeHectares,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      landOwnership: landOwnership ?? this.landOwnership,
      waterSource: waterSource ?? this.waterSource,
      soilFertility: soilFertility ?? this.soilFertility,
      boundaryGeoJson: boundaryGeoJson ?? this.boundaryGeoJson,
      landSurveyNo: landSurveyNo ?? this.landSurveyNo,
      approachRoad: approachRoad ?? this.approachRoad,
      landTopology: landTopology ?? this.landTopology,
      landGradient: landGradient ?? this.landGradient,
      landDocumentUrl: landDocumentUrl ?? this.landDocumentUrl,
      powerSource: powerSource ?? this.powerSource,
      farmPhotoUrl: farmPhotoUrl ?? this.farmPhotoUrl,
      irrigationSource: irrigationSource ?? this.irrigationSource,
      irrigationType: irrigationType ?? this.irrigationType,
      fullTimeWorkers: fullTimeWorkers ?? this.fullTimeWorkers,
      partTimeWorkers: partTimeWorkers ?? this.partTimeWorkers,
      seasonalWorkers: seasonalWorkers ?? this.seasonalWorkers,
      familyWorkers: familyWorkers ?? this.familyWorkers,
      lastChemicalApplicationDate:
          lastChemicalApplicationDate ?? this.lastChemicalApplicationDate,
      conventionalLands: conventionalLands ?? this.conventionalLands,
      fallowPastureLand: fallowPastureLand ?? this.fallowPastureLand,
      conventionalCrops: conventionalCrops ?? this.conventionalCrops,
      estYieldKg: estYieldKg ?? this.estYieldKg,
      certType: certType ?? this.certType,
      conversionStatus: conversionStatus ?? this.conversionStatus,
      conversionDate: conversionDate ?? this.conversionDate,
      inspectorName: inspectorName ?? this.inspectorName,
      conversionQualified: conversionQualified ?? this.conversionQualified,
      conversionRemarks: conversionRemarks ?? this.conversionRemarks,
      soilCollectionDate: soilCollectionDate ?? this.soilCollectionDate,
      soilLabTestingDate: soilLabTestingDate ?? this.soilLabTestingDate,
      soilResultDate: soilResultDate ?? this.soilResultDate,
      soilReportUrl: soilReportUrl ?? this.soilReportUrl,
      soilSamplesInfo: soilSamplesInfo ?? this.soilSamplesInfo,
      soilCriteria: soilCriteria ?? this.soilCriteria,
      syncStatus: syncStatus ?? this.syncStatus,
      lastSyncedAt: lastSyncedAt ?? this.lastSyncedAt,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (farmerId.present) {
      map['farmer_id'] = Variable<String>(farmerId.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (sizeHectares.present) {
      map['size_hectares'] = Variable<double>(sizeHectares.value);
    }
    if (latitude.present) {
      map['latitude'] = Variable<double>(latitude.value);
    }
    if (longitude.present) {
      map['longitude'] = Variable<double>(longitude.value);
    }
    if (landOwnership.present) {
      map['land_ownership'] = Variable<String>(landOwnership.value);
    }
    if (waterSource.present) {
      map['water_source'] = Variable<String>(waterSource.value);
    }
    if (soilFertility.present) {
      map['soil_fertility'] = Variable<String>(soilFertility.value);
    }
    if (boundaryGeoJson.present) {
      map['boundary_geo_json'] = Variable<String>(boundaryGeoJson.value);
    }
    if (landSurveyNo.present) {
      map['land_survey_no'] = Variable<String>(landSurveyNo.value);
    }
    if (approachRoad.present) {
      map['approach_road'] = Variable<String>(approachRoad.value);
    }
    if (landTopology.present) {
      map['land_topology'] = Variable<String>(landTopology.value);
    }
    if (landGradient.present) {
      map['land_gradient'] = Variable<String>(landGradient.value);
    }
    if (landDocumentUrl.present) {
      map['land_document_url'] = Variable<String>(landDocumentUrl.value);
    }
    if (powerSource.present) {
      map['power_source'] = Variable<String>(powerSource.value);
    }
    if (farmPhotoUrl.present) {
      map['farm_photo_url'] = Variable<String>(farmPhotoUrl.value);
    }
    if (irrigationSource.present) {
      map['irrigation_source'] = Variable<String>(irrigationSource.value);
    }
    if (irrigationType.present) {
      map['irrigation_type'] = Variable<String>(irrigationType.value);
    }
    if (fullTimeWorkers.present) {
      map['full_time_workers'] = Variable<double>(fullTimeWorkers.value);
    }
    if (partTimeWorkers.present) {
      map['part_time_workers'] = Variable<double>(partTimeWorkers.value);
    }
    if (seasonalWorkers.present) {
      map['seasonal_workers'] = Variable<double>(seasonalWorkers.value);
    }
    if (familyWorkers.present) {
      map['family_workers'] = Variable<double>(familyWorkers.value);
    }
    if (lastChemicalApplicationDate.present) {
      map['last_chemical_application_date'] = Variable<DateTime>(
        lastChemicalApplicationDate.value,
      );
    }
    if (conventionalLands.present) {
      map['conventional_lands'] = Variable<String>(conventionalLands.value);
    }
    if (fallowPastureLand.present) {
      map['fallow_pasture_land'] = Variable<String>(fallowPastureLand.value);
    }
    if (conventionalCrops.present) {
      map['conventional_crops'] = Variable<String>(conventionalCrops.value);
    }
    if (estYieldKg.present) {
      map['est_yield_kg'] = Variable<double>(estYieldKg.value);
    }
    if (certType.present) {
      map['cert_type'] = Variable<String>(certType.value);
    }
    if (conversionStatus.present) {
      map['conversion_status'] = Variable<String>(conversionStatus.value);
    }
    if (conversionDate.present) {
      map['conversion_date'] = Variable<DateTime>(conversionDate.value);
    }
    if (inspectorName.present) {
      map['inspector_name'] = Variable<String>(inspectorName.value);
    }
    if (conversionQualified.present) {
      map['conversion_qualified'] = Variable<bool>(conversionQualified.value);
    }
    if (conversionRemarks.present) {
      map['conversion_remarks'] = Variable<String>(conversionRemarks.value);
    }
    if (soilCollectionDate.present) {
      map['soil_collection_date'] = Variable<DateTime>(
        soilCollectionDate.value,
      );
    }
    if (soilLabTestingDate.present) {
      map['soil_lab_testing_date'] = Variable<DateTime>(
        soilLabTestingDate.value,
      );
    }
    if (soilResultDate.present) {
      map['soil_result_date'] = Variable<DateTime>(soilResultDate.value);
    }
    if (soilReportUrl.present) {
      map['soil_report_url'] = Variable<String>(soilReportUrl.value);
    }
    if (soilSamplesInfo.present) {
      map['soil_samples_info'] = Variable<String>(soilSamplesInfo.value);
    }
    if (soilCriteria.present) {
      map['soil_criteria'] = Variable<String>(soilCriteria.value);
    }
    if (syncStatus.present) {
      map['sync_status'] = Variable<String>(syncStatus.value);
    }
    if (lastSyncedAt.present) {
      map['last_synced_at'] = Variable<DateTime>(lastSyncedAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('FarmLandCacheCompanion(')
          ..write('id: $id, ')
          ..write('farmerId: $farmerId, ')
          ..write('name: $name, ')
          ..write('sizeHectares: $sizeHectares, ')
          ..write('latitude: $latitude, ')
          ..write('longitude: $longitude, ')
          ..write('landOwnership: $landOwnership, ')
          ..write('waterSource: $waterSource, ')
          ..write('soilFertility: $soilFertility, ')
          ..write('boundaryGeoJson: $boundaryGeoJson, ')
          ..write('landSurveyNo: $landSurveyNo, ')
          ..write('approachRoad: $approachRoad, ')
          ..write('landTopology: $landTopology, ')
          ..write('landGradient: $landGradient, ')
          ..write('landDocumentUrl: $landDocumentUrl, ')
          ..write('powerSource: $powerSource, ')
          ..write('farmPhotoUrl: $farmPhotoUrl, ')
          ..write('irrigationSource: $irrigationSource, ')
          ..write('irrigationType: $irrigationType, ')
          ..write('fullTimeWorkers: $fullTimeWorkers, ')
          ..write('partTimeWorkers: $partTimeWorkers, ')
          ..write('seasonalWorkers: $seasonalWorkers, ')
          ..write('familyWorkers: $familyWorkers, ')
          ..write('lastChemicalApplicationDate: $lastChemicalApplicationDate, ')
          ..write('conventionalLands: $conventionalLands, ')
          ..write('fallowPastureLand: $fallowPastureLand, ')
          ..write('conventionalCrops: $conventionalCrops, ')
          ..write('estYieldKg: $estYieldKg, ')
          ..write('certType: $certType, ')
          ..write('conversionStatus: $conversionStatus, ')
          ..write('conversionDate: $conversionDate, ')
          ..write('inspectorName: $inspectorName, ')
          ..write('conversionQualified: $conversionQualified, ')
          ..write('conversionRemarks: $conversionRemarks, ')
          ..write('soilCollectionDate: $soilCollectionDate, ')
          ..write('soilLabTestingDate: $soilLabTestingDate, ')
          ..write('soilResultDate: $soilResultDate, ')
          ..write('soilReportUrl: $soilReportUrl, ')
          ..write('soilSamplesInfo: $soilSamplesInfo, ')
          ..write('soilCriteria: $soilCriteria, ')
          ..write('syncStatus: $syncStatus, ')
          ..write('lastSyncedAt: $lastSyncedAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $CultivationCacheTable extends CultivationCache
    with TableInfo<$CultivationCacheTable, CultivationCacheData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CultivationCacheTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _farmIdMeta = const VerificationMeta('farmId');
  @override
  late final GeneratedColumn<String> farmId = GeneratedColumn<String>(
    'farm_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _cropNameMeta = const VerificationMeta(
    'cropName',
  );
  @override
  late final GeneratedColumn<String> cropName = GeneratedColumn<String>(
    'crop_name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _varietyMeta = const VerificationMeta(
    'variety',
  );
  @override
  late final GeneratedColumn<String> variety = GeneratedColumn<String>(
    'variety',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _seasonMeta = const VerificationMeta('season');
  @override
  late final GeneratedColumn<String> season = GeneratedColumn<String>(
    'season',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _cultivationAreaHaMeta = const VerificationMeta(
    'cultivationAreaHa',
  );
  @override
  late final GeneratedColumn<double> cultivationAreaHa =
      GeneratedColumn<double>(
        'cultivation_area_ha',
        aliasedName,
        true,
        type: DriftSqlType.double,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _sowingDateMeta = const VerificationMeta(
    'sowingDate',
  );
  @override
  late final GeneratedColumn<DateTime> sowingDate = GeneratedColumn<DateTime>(
    'sowing_date',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _estimatedYieldMeta = const VerificationMeta(
    'estimatedYield',
  );
  @override
  late final GeneratedColumn<double> estimatedYield = GeneratedColumn<double>(
    'estimated_yield',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _actualYieldMeta = const VerificationMeta(
    'actualYield',
  );
  @override
  late final GeneratedColumn<double> actualYield = GeneratedColumn<double>(
    'actual_yield',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _seedCostMeta = const VerificationMeta(
    'seedCost',
  );
  @override
  late final GeneratedColumn<double> seedCost = GeneratedColumn<double>(
    'seed_cost',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _sowingCostMeta = const VerificationMeta(
    'sowingCost',
  );
  @override
  late final GeneratedColumn<double> sowingCost = GeneratedColumn<double>(
    'sowing_cost',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
    'status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('ACTIVE'),
  );
  static const VerificationMeta _cropCategoryMeta = const VerificationMeta(
    'cropCategory',
  );
  @override
  late final GeneratedColumn<String> cropCategory = GeneratedColumn<String>(
    'crop_category',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _cropCalendarIdMeta = const VerificationMeta(
    'cropCalendarId',
  );
  @override
  late final GeneratedColumn<String> cropCalendarId = GeneratedColumn<String>(
    'crop_calendar_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _cultivationGeoJsonMeta =
      const VerificationMeta('cultivationGeoJson');
  @override
  late final GeneratedColumn<String> cultivationGeoJson =
      GeneratedColumn<String>(
        'cultivation_geo_json',
        aliasedName,
        true,
        type: DriftSqlType.string,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _photoUrlMeta = const VerificationMeta(
    'photoUrl',
  );
  @override
  late final GeneratedColumn<String> photoUrl = GeneratedColumn<String>(
    'photo_url',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _seedSourceMeta = const VerificationMeta(
    'seedSource',
  );
  @override
  late final GeneratedColumn<String> seedSource = GeneratedColumn<String>(
    'seed_source',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _isSeedTreatedMeta = const VerificationMeta(
    'isSeedTreated',
  );
  @override
  late final GeneratedColumn<bool> isSeedTreated = GeneratedColumn<bool>(
    'is_seed_treated',
    aliasedName,
    true,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_seed_treated" IN (0, 1))',
    ),
  );
  static const VerificationMeta _seedTypeMeta = const VerificationMeta(
    'seedType',
  );
  @override
  late final GeneratedColumn<String> seedType = GeneratedColumn<String>(
    'seed_type',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _seedQuantityMeta = const VerificationMeta(
    'seedQuantity',
  );
  @override
  late final GeneratedColumn<double> seedQuantity = GeneratedColumn<double>(
    'seed_quantity',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _seedPriceMeta = const VerificationMeta(
    'seedPrice',
  );
  @override
  late final GeneratedColumn<double> seedPrice = GeneratedColumn<double>(
    'seed_price',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _sowingTypeMeta = const VerificationMeta(
    'sowingType',
  );
  @override
  late final GeneratedColumn<String> sowingType = GeneratedColumn<String>(
    'sowing_type',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _sowingChargesByMeta = const VerificationMeta(
    'sowingChargesBy',
  );
  @override
  late final GeneratedColumn<String> sowingChargesBy = GeneratedColumn<String>(
    'sowing_charges_by',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _sowingChargesMeta = const VerificationMeta(
    'sowingCharges',
  );
  @override
  late final GeneratedColumn<double> sowingCharges = GeneratedColumn<double>(
    'sowing_charges',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _bambooVarietyMeta = const VerificationMeta(
    'bambooVariety',
  );
  @override
  late final GeneratedColumn<String> bambooVariety = GeneratedColumn<String>(
    'bamboo_variety',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _seedlingCountMeta = const VerificationMeta(
    'seedlingCount',
  );
  @override
  late final GeneratedColumn<double> seedlingCount = GeneratedColumn<double>(
    'seedling_count',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _syncStatusMeta = const VerificationMeta(
    'syncStatus',
  );
  @override
  late final GeneratedColumn<String> syncStatus = GeneratedColumn<String>(
    'sync_status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('synced'),
  );
  static const VerificationMeta _lastSyncedAtMeta = const VerificationMeta(
    'lastSyncedAt',
  );
  @override
  late final GeneratedColumn<DateTime> lastSyncedAt = GeneratedColumn<DateTime>(
    'last_synced_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    farmId,
    cropName,
    variety,
    season,
    cultivationAreaHa,
    sowingDate,
    estimatedYield,
    actualYield,
    seedCost,
    sowingCost,
    status,
    cropCategory,
    cropCalendarId,
    cultivationGeoJson,
    photoUrl,
    seedSource,
    isSeedTreated,
    seedType,
    seedQuantity,
    seedPrice,
    sowingType,
    sowingChargesBy,
    sowingCharges,
    bambooVariety,
    seedlingCount,
    syncStatus,
    lastSyncedAt,
    updatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cultivation_cache';
  @override
  VerificationContext validateIntegrity(
    Insertable<CultivationCacheData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('farm_id')) {
      context.handle(
        _farmIdMeta,
        farmId.isAcceptableOrUnknown(data['farm_id']!, _farmIdMeta),
      );
    } else if (isInserting) {
      context.missing(_farmIdMeta);
    }
    if (data.containsKey('crop_name')) {
      context.handle(
        _cropNameMeta,
        cropName.isAcceptableOrUnknown(data['crop_name']!, _cropNameMeta),
      );
    } else if (isInserting) {
      context.missing(_cropNameMeta);
    }
    if (data.containsKey('variety')) {
      context.handle(
        _varietyMeta,
        variety.isAcceptableOrUnknown(data['variety']!, _varietyMeta),
      );
    }
    if (data.containsKey('season')) {
      context.handle(
        _seasonMeta,
        season.isAcceptableOrUnknown(data['season']!, _seasonMeta),
      );
    }
    if (data.containsKey('cultivation_area_ha')) {
      context.handle(
        _cultivationAreaHaMeta,
        cultivationAreaHa.isAcceptableOrUnknown(
          data['cultivation_area_ha']!,
          _cultivationAreaHaMeta,
        ),
      );
    }
    if (data.containsKey('sowing_date')) {
      context.handle(
        _sowingDateMeta,
        sowingDate.isAcceptableOrUnknown(data['sowing_date']!, _sowingDateMeta),
      );
    }
    if (data.containsKey('estimated_yield')) {
      context.handle(
        _estimatedYieldMeta,
        estimatedYield.isAcceptableOrUnknown(
          data['estimated_yield']!,
          _estimatedYieldMeta,
        ),
      );
    }
    if (data.containsKey('actual_yield')) {
      context.handle(
        _actualYieldMeta,
        actualYield.isAcceptableOrUnknown(
          data['actual_yield']!,
          _actualYieldMeta,
        ),
      );
    }
    if (data.containsKey('seed_cost')) {
      context.handle(
        _seedCostMeta,
        seedCost.isAcceptableOrUnknown(data['seed_cost']!, _seedCostMeta),
      );
    }
    if (data.containsKey('sowing_cost')) {
      context.handle(
        _sowingCostMeta,
        sowingCost.isAcceptableOrUnknown(data['sowing_cost']!, _sowingCostMeta),
      );
    }
    if (data.containsKey('status')) {
      context.handle(
        _statusMeta,
        status.isAcceptableOrUnknown(data['status']!, _statusMeta),
      );
    }
    if (data.containsKey('crop_category')) {
      context.handle(
        _cropCategoryMeta,
        cropCategory.isAcceptableOrUnknown(
          data['crop_category']!,
          _cropCategoryMeta,
        ),
      );
    }
    if (data.containsKey('crop_calendar_id')) {
      context.handle(
        _cropCalendarIdMeta,
        cropCalendarId.isAcceptableOrUnknown(
          data['crop_calendar_id']!,
          _cropCalendarIdMeta,
        ),
      );
    }
    if (data.containsKey('cultivation_geo_json')) {
      context.handle(
        _cultivationGeoJsonMeta,
        cultivationGeoJson.isAcceptableOrUnknown(
          data['cultivation_geo_json']!,
          _cultivationGeoJsonMeta,
        ),
      );
    }
    if (data.containsKey('photo_url')) {
      context.handle(
        _photoUrlMeta,
        photoUrl.isAcceptableOrUnknown(data['photo_url']!, _photoUrlMeta),
      );
    }
    if (data.containsKey('seed_source')) {
      context.handle(
        _seedSourceMeta,
        seedSource.isAcceptableOrUnknown(data['seed_source']!, _seedSourceMeta),
      );
    }
    if (data.containsKey('is_seed_treated')) {
      context.handle(
        _isSeedTreatedMeta,
        isSeedTreated.isAcceptableOrUnknown(
          data['is_seed_treated']!,
          _isSeedTreatedMeta,
        ),
      );
    }
    if (data.containsKey('seed_type')) {
      context.handle(
        _seedTypeMeta,
        seedType.isAcceptableOrUnknown(data['seed_type']!, _seedTypeMeta),
      );
    }
    if (data.containsKey('seed_quantity')) {
      context.handle(
        _seedQuantityMeta,
        seedQuantity.isAcceptableOrUnknown(
          data['seed_quantity']!,
          _seedQuantityMeta,
        ),
      );
    }
    if (data.containsKey('seed_price')) {
      context.handle(
        _seedPriceMeta,
        seedPrice.isAcceptableOrUnknown(data['seed_price']!, _seedPriceMeta),
      );
    }
    if (data.containsKey('sowing_type')) {
      context.handle(
        _sowingTypeMeta,
        sowingType.isAcceptableOrUnknown(data['sowing_type']!, _sowingTypeMeta),
      );
    }
    if (data.containsKey('sowing_charges_by')) {
      context.handle(
        _sowingChargesByMeta,
        sowingChargesBy.isAcceptableOrUnknown(
          data['sowing_charges_by']!,
          _sowingChargesByMeta,
        ),
      );
    }
    if (data.containsKey('sowing_charges')) {
      context.handle(
        _sowingChargesMeta,
        sowingCharges.isAcceptableOrUnknown(
          data['sowing_charges']!,
          _sowingChargesMeta,
        ),
      );
    }
    if (data.containsKey('bamboo_variety')) {
      context.handle(
        _bambooVarietyMeta,
        bambooVariety.isAcceptableOrUnknown(
          data['bamboo_variety']!,
          _bambooVarietyMeta,
        ),
      );
    }
    if (data.containsKey('seedling_count')) {
      context.handle(
        _seedlingCountMeta,
        seedlingCount.isAcceptableOrUnknown(
          data['seedling_count']!,
          _seedlingCountMeta,
        ),
      );
    }
    if (data.containsKey('sync_status')) {
      context.handle(
        _syncStatusMeta,
        syncStatus.isAcceptableOrUnknown(data['sync_status']!, _syncStatusMeta),
      );
    }
    if (data.containsKey('last_synced_at')) {
      context.handle(
        _lastSyncedAtMeta,
        lastSyncedAt.isAcceptableOrUnknown(
          data['last_synced_at']!,
          _lastSyncedAtMeta,
        ),
      );
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  CultivationCacheData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CultivationCacheData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      farmId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}farm_id'],
      )!,
      cropName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}crop_name'],
      )!,
      variety: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}variety'],
      ),
      season: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}season'],
      ),
      cultivationAreaHa: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}cultivation_area_ha'],
      ),
      sowingDate: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}sowing_date'],
      ),
      estimatedYield: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}estimated_yield'],
      ),
      actualYield: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}actual_yield'],
      ),
      seedCost: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}seed_cost'],
      ),
      sowingCost: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}sowing_cost'],
      ),
      status: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}status'],
      )!,
      cropCategory: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}crop_category'],
      ),
      cropCalendarId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}crop_calendar_id'],
      ),
      cultivationGeoJson: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}cultivation_geo_json'],
      ),
      photoUrl: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}photo_url'],
      ),
      seedSource: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}seed_source'],
      ),
      isSeedTreated: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_seed_treated'],
      ),
      seedType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}seed_type'],
      ),
      seedQuantity: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}seed_quantity'],
      ),
      seedPrice: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}seed_price'],
      ),
      sowingType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}sowing_type'],
      ),
      sowingChargesBy: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}sowing_charges_by'],
      ),
      sowingCharges: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}sowing_charges'],
      ),
      bambooVariety: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}bamboo_variety'],
      ),
      seedlingCount: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}seedling_count'],
      ),
      syncStatus: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}sync_status'],
      )!,
      lastSyncedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}last_synced_at'],
      ),
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      ),
    );
  }

  @override
  $CultivationCacheTable createAlias(String alias) {
    return $CultivationCacheTable(attachedDatabase, alias);
  }
}

class CultivationCacheData extends DataClass
    implements Insertable<CultivationCacheData> {
  final String id;
  final String farmId;
  final String cropName;
  final String? variety;
  final String? season;
  final double? cultivationAreaHa;
  final DateTime? sowingDate;
  final double? estimatedYield;
  final double? actualYield;
  final double? seedCost;
  final double? sowingCost;
  final String status;
  final String? cropCategory;
  final String? cropCalendarId;
  final String? cultivationGeoJson;
  final String? photoUrl;
  final String? seedSource;
  final bool? isSeedTreated;
  final String? seedType;
  final double? seedQuantity;
  final double? seedPrice;
  final String? sowingType;
  final String? sowingChargesBy;
  final double? sowingCharges;
  final String? bambooVariety;
  final double? seedlingCount;
  final String syncStatus;
  final DateTime? lastSyncedAt;
  final DateTime? updatedAt;
  const CultivationCacheData({
    required this.id,
    required this.farmId,
    required this.cropName,
    this.variety,
    this.season,
    this.cultivationAreaHa,
    this.sowingDate,
    this.estimatedYield,
    this.actualYield,
    this.seedCost,
    this.sowingCost,
    required this.status,
    this.cropCategory,
    this.cropCalendarId,
    this.cultivationGeoJson,
    this.photoUrl,
    this.seedSource,
    this.isSeedTreated,
    this.seedType,
    this.seedQuantity,
    this.seedPrice,
    this.sowingType,
    this.sowingChargesBy,
    this.sowingCharges,
    this.bambooVariety,
    this.seedlingCount,
    required this.syncStatus,
    this.lastSyncedAt,
    this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['farm_id'] = Variable<String>(farmId);
    map['crop_name'] = Variable<String>(cropName);
    if (!nullToAbsent || variety != null) {
      map['variety'] = Variable<String>(variety);
    }
    if (!nullToAbsent || season != null) {
      map['season'] = Variable<String>(season);
    }
    if (!nullToAbsent || cultivationAreaHa != null) {
      map['cultivation_area_ha'] = Variable<double>(cultivationAreaHa);
    }
    if (!nullToAbsent || sowingDate != null) {
      map['sowing_date'] = Variable<DateTime>(sowingDate);
    }
    if (!nullToAbsent || estimatedYield != null) {
      map['estimated_yield'] = Variable<double>(estimatedYield);
    }
    if (!nullToAbsent || actualYield != null) {
      map['actual_yield'] = Variable<double>(actualYield);
    }
    if (!nullToAbsent || seedCost != null) {
      map['seed_cost'] = Variable<double>(seedCost);
    }
    if (!nullToAbsent || sowingCost != null) {
      map['sowing_cost'] = Variable<double>(sowingCost);
    }
    map['status'] = Variable<String>(status);
    if (!nullToAbsent || cropCategory != null) {
      map['crop_category'] = Variable<String>(cropCategory);
    }
    if (!nullToAbsent || cropCalendarId != null) {
      map['crop_calendar_id'] = Variable<String>(cropCalendarId);
    }
    if (!nullToAbsent || cultivationGeoJson != null) {
      map['cultivation_geo_json'] = Variable<String>(cultivationGeoJson);
    }
    if (!nullToAbsent || photoUrl != null) {
      map['photo_url'] = Variable<String>(photoUrl);
    }
    if (!nullToAbsent || seedSource != null) {
      map['seed_source'] = Variable<String>(seedSource);
    }
    if (!nullToAbsent || isSeedTreated != null) {
      map['is_seed_treated'] = Variable<bool>(isSeedTreated);
    }
    if (!nullToAbsent || seedType != null) {
      map['seed_type'] = Variable<String>(seedType);
    }
    if (!nullToAbsent || seedQuantity != null) {
      map['seed_quantity'] = Variable<double>(seedQuantity);
    }
    if (!nullToAbsent || seedPrice != null) {
      map['seed_price'] = Variable<double>(seedPrice);
    }
    if (!nullToAbsent || sowingType != null) {
      map['sowing_type'] = Variable<String>(sowingType);
    }
    if (!nullToAbsent || sowingChargesBy != null) {
      map['sowing_charges_by'] = Variable<String>(sowingChargesBy);
    }
    if (!nullToAbsent || sowingCharges != null) {
      map['sowing_charges'] = Variable<double>(sowingCharges);
    }
    if (!nullToAbsent || bambooVariety != null) {
      map['bamboo_variety'] = Variable<String>(bambooVariety);
    }
    if (!nullToAbsent || seedlingCount != null) {
      map['seedling_count'] = Variable<double>(seedlingCount);
    }
    map['sync_status'] = Variable<String>(syncStatus);
    if (!nullToAbsent || lastSyncedAt != null) {
      map['last_synced_at'] = Variable<DateTime>(lastSyncedAt);
    }
    if (!nullToAbsent || updatedAt != null) {
      map['updated_at'] = Variable<DateTime>(updatedAt);
    }
    return map;
  }

  CultivationCacheCompanion toCompanion(bool nullToAbsent) {
    return CultivationCacheCompanion(
      id: Value(id),
      farmId: Value(farmId),
      cropName: Value(cropName),
      variety: variety == null && nullToAbsent
          ? const Value.absent()
          : Value(variety),
      season: season == null && nullToAbsent
          ? const Value.absent()
          : Value(season),
      cultivationAreaHa: cultivationAreaHa == null && nullToAbsent
          ? const Value.absent()
          : Value(cultivationAreaHa),
      sowingDate: sowingDate == null && nullToAbsent
          ? const Value.absent()
          : Value(sowingDate),
      estimatedYield: estimatedYield == null && nullToAbsent
          ? const Value.absent()
          : Value(estimatedYield),
      actualYield: actualYield == null && nullToAbsent
          ? const Value.absent()
          : Value(actualYield),
      seedCost: seedCost == null && nullToAbsent
          ? const Value.absent()
          : Value(seedCost),
      sowingCost: sowingCost == null && nullToAbsent
          ? const Value.absent()
          : Value(sowingCost),
      status: Value(status),
      cropCategory: cropCategory == null && nullToAbsent
          ? const Value.absent()
          : Value(cropCategory),
      cropCalendarId: cropCalendarId == null && nullToAbsent
          ? const Value.absent()
          : Value(cropCalendarId),
      cultivationGeoJson: cultivationGeoJson == null && nullToAbsent
          ? const Value.absent()
          : Value(cultivationGeoJson),
      photoUrl: photoUrl == null && nullToAbsent
          ? const Value.absent()
          : Value(photoUrl),
      seedSource: seedSource == null && nullToAbsent
          ? const Value.absent()
          : Value(seedSource),
      isSeedTreated: isSeedTreated == null && nullToAbsent
          ? const Value.absent()
          : Value(isSeedTreated),
      seedType: seedType == null && nullToAbsent
          ? const Value.absent()
          : Value(seedType),
      seedQuantity: seedQuantity == null && nullToAbsent
          ? const Value.absent()
          : Value(seedQuantity),
      seedPrice: seedPrice == null && nullToAbsent
          ? const Value.absent()
          : Value(seedPrice),
      sowingType: sowingType == null && nullToAbsent
          ? const Value.absent()
          : Value(sowingType),
      sowingChargesBy: sowingChargesBy == null && nullToAbsent
          ? const Value.absent()
          : Value(sowingChargesBy),
      sowingCharges: sowingCharges == null && nullToAbsent
          ? const Value.absent()
          : Value(sowingCharges),
      bambooVariety: bambooVariety == null && nullToAbsent
          ? const Value.absent()
          : Value(bambooVariety),
      seedlingCount: seedlingCount == null && nullToAbsent
          ? const Value.absent()
          : Value(seedlingCount),
      syncStatus: Value(syncStatus),
      lastSyncedAt: lastSyncedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(lastSyncedAt),
      updatedAt: updatedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(updatedAt),
    );
  }

  factory CultivationCacheData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CultivationCacheData(
      id: serializer.fromJson<String>(json['id']),
      farmId: serializer.fromJson<String>(json['farmId']),
      cropName: serializer.fromJson<String>(json['cropName']),
      variety: serializer.fromJson<String?>(json['variety']),
      season: serializer.fromJson<String?>(json['season']),
      cultivationAreaHa: serializer.fromJson<double?>(
        json['cultivationAreaHa'],
      ),
      sowingDate: serializer.fromJson<DateTime?>(json['sowingDate']),
      estimatedYield: serializer.fromJson<double?>(json['estimatedYield']),
      actualYield: serializer.fromJson<double?>(json['actualYield']),
      seedCost: serializer.fromJson<double?>(json['seedCost']),
      sowingCost: serializer.fromJson<double?>(json['sowingCost']),
      status: serializer.fromJson<String>(json['status']),
      cropCategory: serializer.fromJson<String?>(json['cropCategory']),
      cropCalendarId: serializer.fromJson<String?>(json['cropCalendarId']),
      cultivationGeoJson: serializer.fromJson<String?>(
        json['cultivationGeoJson'],
      ),
      photoUrl: serializer.fromJson<String?>(json['photoUrl']),
      seedSource: serializer.fromJson<String?>(json['seedSource']),
      isSeedTreated: serializer.fromJson<bool?>(json['isSeedTreated']),
      seedType: serializer.fromJson<String?>(json['seedType']),
      seedQuantity: serializer.fromJson<double?>(json['seedQuantity']),
      seedPrice: serializer.fromJson<double?>(json['seedPrice']),
      sowingType: serializer.fromJson<String?>(json['sowingType']),
      sowingChargesBy: serializer.fromJson<String?>(json['sowingChargesBy']),
      sowingCharges: serializer.fromJson<double?>(json['sowingCharges']),
      bambooVariety: serializer.fromJson<String?>(json['bambooVariety']),
      seedlingCount: serializer.fromJson<double?>(json['seedlingCount']),
      syncStatus: serializer.fromJson<String>(json['syncStatus']),
      lastSyncedAt: serializer.fromJson<DateTime?>(json['lastSyncedAt']),
      updatedAt: serializer.fromJson<DateTime?>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'farmId': serializer.toJson<String>(farmId),
      'cropName': serializer.toJson<String>(cropName),
      'variety': serializer.toJson<String?>(variety),
      'season': serializer.toJson<String?>(season),
      'cultivationAreaHa': serializer.toJson<double?>(cultivationAreaHa),
      'sowingDate': serializer.toJson<DateTime?>(sowingDate),
      'estimatedYield': serializer.toJson<double?>(estimatedYield),
      'actualYield': serializer.toJson<double?>(actualYield),
      'seedCost': serializer.toJson<double?>(seedCost),
      'sowingCost': serializer.toJson<double?>(sowingCost),
      'status': serializer.toJson<String>(status),
      'cropCategory': serializer.toJson<String?>(cropCategory),
      'cropCalendarId': serializer.toJson<String?>(cropCalendarId),
      'cultivationGeoJson': serializer.toJson<String?>(cultivationGeoJson),
      'photoUrl': serializer.toJson<String?>(photoUrl),
      'seedSource': serializer.toJson<String?>(seedSource),
      'isSeedTreated': serializer.toJson<bool?>(isSeedTreated),
      'seedType': serializer.toJson<String?>(seedType),
      'seedQuantity': serializer.toJson<double?>(seedQuantity),
      'seedPrice': serializer.toJson<double?>(seedPrice),
      'sowingType': serializer.toJson<String?>(sowingType),
      'sowingChargesBy': serializer.toJson<String?>(sowingChargesBy),
      'sowingCharges': serializer.toJson<double?>(sowingCharges),
      'bambooVariety': serializer.toJson<String?>(bambooVariety),
      'seedlingCount': serializer.toJson<double?>(seedlingCount),
      'syncStatus': serializer.toJson<String>(syncStatus),
      'lastSyncedAt': serializer.toJson<DateTime?>(lastSyncedAt),
      'updatedAt': serializer.toJson<DateTime?>(updatedAt),
    };
  }

  CultivationCacheData copyWith({
    String? id,
    String? farmId,
    String? cropName,
    Value<String?> variety = const Value.absent(),
    Value<String?> season = const Value.absent(),
    Value<double?> cultivationAreaHa = const Value.absent(),
    Value<DateTime?> sowingDate = const Value.absent(),
    Value<double?> estimatedYield = const Value.absent(),
    Value<double?> actualYield = const Value.absent(),
    Value<double?> seedCost = const Value.absent(),
    Value<double?> sowingCost = const Value.absent(),
    String? status,
    Value<String?> cropCategory = const Value.absent(),
    Value<String?> cropCalendarId = const Value.absent(),
    Value<String?> cultivationGeoJson = const Value.absent(),
    Value<String?> photoUrl = const Value.absent(),
    Value<String?> seedSource = const Value.absent(),
    Value<bool?> isSeedTreated = const Value.absent(),
    Value<String?> seedType = const Value.absent(),
    Value<double?> seedQuantity = const Value.absent(),
    Value<double?> seedPrice = const Value.absent(),
    Value<String?> sowingType = const Value.absent(),
    Value<String?> sowingChargesBy = const Value.absent(),
    Value<double?> sowingCharges = const Value.absent(),
    Value<String?> bambooVariety = const Value.absent(),
    Value<double?> seedlingCount = const Value.absent(),
    String? syncStatus,
    Value<DateTime?> lastSyncedAt = const Value.absent(),
    Value<DateTime?> updatedAt = const Value.absent(),
  }) => CultivationCacheData(
    id: id ?? this.id,
    farmId: farmId ?? this.farmId,
    cropName: cropName ?? this.cropName,
    variety: variety.present ? variety.value : this.variety,
    season: season.present ? season.value : this.season,
    cultivationAreaHa: cultivationAreaHa.present
        ? cultivationAreaHa.value
        : this.cultivationAreaHa,
    sowingDate: sowingDate.present ? sowingDate.value : this.sowingDate,
    estimatedYield: estimatedYield.present
        ? estimatedYield.value
        : this.estimatedYield,
    actualYield: actualYield.present ? actualYield.value : this.actualYield,
    seedCost: seedCost.present ? seedCost.value : this.seedCost,
    sowingCost: sowingCost.present ? sowingCost.value : this.sowingCost,
    status: status ?? this.status,
    cropCategory: cropCategory.present ? cropCategory.value : this.cropCategory,
    cropCalendarId: cropCalendarId.present
        ? cropCalendarId.value
        : this.cropCalendarId,
    cultivationGeoJson: cultivationGeoJson.present
        ? cultivationGeoJson.value
        : this.cultivationGeoJson,
    photoUrl: photoUrl.present ? photoUrl.value : this.photoUrl,
    seedSource: seedSource.present ? seedSource.value : this.seedSource,
    isSeedTreated: isSeedTreated.present
        ? isSeedTreated.value
        : this.isSeedTreated,
    seedType: seedType.present ? seedType.value : this.seedType,
    seedQuantity: seedQuantity.present ? seedQuantity.value : this.seedQuantity,
    seedPrice: seedPrice.present ? seedPrice.value : this.seedPrice,
    sowingType: sowingType.present ? sowingType.value : this.sowingType,
    sowingChargesBy: sowingChargesBy.present
        ? sowingChargesBy.value
        : this.sowingChargesBy,
    sowingCharges: sowingCharges.present
        ? sowingCharges.value
        : this.sowingCharges,
    bambooVariety: bambooVariety.present
        ? bambooVariety.value
        : this.bambooVariety,
    seedlingCount: seedlingCount.present
        ? seedlingCount.value
        : this.seedlingCount,
    syncStatus: syncStatus ?? this.syncStatus,
    lastSyncedAt: lastSyncedAt.present ? lastSyncedAt.value : this.lastSyncedAt,
    updatedAt: updatedAt.present ? updatedAt.value : this.updatedAt,
  );
  CultivationCacheData copyWithCompanion(CultivationCacheCompanion data) {
    return CultivationCacheData(
      id: data.id.present ? data.id.value : this.id,
      farmId: data.farmId.present ? data.farmId.value : this.farmId,
      cropName: data.cropName.present ? data.cropName.value : this.cropName,
      variety: data.variety.present ? data.variety.value : this.variety,
      season: data.season.present ? data.season.value : this.season,
      cultivationAreaHa: data.cultivationAreaHa.present
          ? data.cultivationAreaHa.value
          : this.cultivationAreaHa,
      sowingDate: data.sowingDate.present
          ? data.sowingDate.value
          : this.sowingDate,
      estimatedYield: data.estimatedYield.present
          ? data.estimatedYield.value
          : this.estimatedYield,
      actualYield: data.actualYield.present
          ? data.actualYield.value
          : this.actualYield,
      seedCost: data.seedCost.present ? data.seedCost.value : this.seedCost,
      sowingCost: data.sowingCost.present
          ? data.sowingCost.value
          : this.sowingCost,
      status: data.status.present ? data.status.value : this.status,
      cropCategory: data.cropCategory.present
          ? data.cropCategory.value
          : this.cropCategory,
      cropCalendarId: data.cropCalendarId.present
          ? data.cropCalendarId.value
          : this.cropCalendarId,
      cultivationGeoJson: data.cultivationGeoJson.present
          ? data.cultivationGeoJson.value
          : this.cultivationGeoJson,
      photoUrl: data.photoUrl.present ? data.photoUrl.value : this.photoUrl,
      seedSource: data.seedSource.present
          ? data.seedSource.value
          : this.seedSource,
      isSeedTreated: data.isSeedTreated.present
          ? data.isSeedTreated.value
          : this.isSeedTreated,
      seedType: data.seedType.present ? data.seedType.value : this.seedType,
      seedQuantity: data.seedQuantity.present
          ? data.seedQuantity.value
          : this.seedQuantity,
      seedPrice: data.seedPrice.present ? data.seedPrice.value : this.seedPrice,
      sowingType: data.sowingType.present
          ? data.sowingType.value
          : this.sowingType,
      sowingChargesBy: data.sowingChargesBy.present
          ? data.sowingChargesBy.value
          : this.sowingChargesBy,
      sowingCharges: data.sowingCharges.present
          ? data.sowingCharges.value
          : this.sowingCharges,
      bambooVariety: data.bambooVariety.present
          ? data.bambooVariety.value
          : this.bambooVariety,
      seedlingCount: data.seedlingCount.present
          ? data.seedlingCount.value
          : this.seedlingCount,
      syncStatus: data.syncStatus.present
          ? data.syncStatus.value
          : this.syncStatus,
      lastSyncedAt: data.lastSyncedAt.present
          ? data.lastSyncedAt.value
          : this.lastSyncedAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CultivationCacheData(')
          ..write('id: $id, ')
          ..write('farmId: $farmId, ')
          ..write('cropName: $cropName, ')
          ..write('variety: $variety, ')
          ..write('season: $season, ')
          ..write('cultivationAreaHa: $cultivationAreaHa, ')
          ..write('sowingDate: $sowingDate, ')
          ..write('estimatedYield: $estimatedYield, ')
          ..write('actualYield: $actualYield, ')
          ..write('seedCost: $seedCost, ')
          ..write('sowingCost: $sowingCost, ')
          ..write('status: $status, ')
          ..write('cropCategory: $cropCategory, ')
          ..write('cropCalendarId: $cropCalendarId, ')
          ..write('cultivationGeoJson: $cultivationGeoJson, ')
          ..write('photoUrl: $photoUrl, ')
          ..write('seedSource: $seedSource, ')
          ..write('isSeedTreated: $isSeedTreated, ')
          ..write('seedType: $seedType, ')
          ..write('seedQuantity: $seedQuantity, ')
          ..write('seedPrice: $seedPrice, ')
          ..write('sowingType: $sowingType, ')
          ..write('sowingChargesBy: $sowingChargesBy, ')
          ..write('sowingCharges: $sowingCharges, ')
          ..write('bambooVariety: $bambooVariety, ')
          ..write('seedlingCount: $seedlingCount, ')
          ..write('syncStatus: $syncStatus, ')
          ..write('lastSyncedAt: $lastSyncedAt, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hashAll([
    id,
    farmId,
    cropName,
    variety,
    season,
    cultivationAreaHa,
    sowingDate,
    estimatedYield,
    actualYield,
    seedCost,
    sowingCost,
    status,
    cropCategory,
    cropCalendarId,
    cultivationGeoJson,
    photoUrl,
    seedSource,
    isSeedTreated,
    seedType,
    seedQuantity,
    seedPrice,
    sowingType,
    sowingChargesBy,
    sowingCharges,
    bambooVariety,
    seedlingCount,
    syncStatus,
    lastSyncedAt,
    updatedAt,
  ]);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CultivationCacheData &&
          other.id == this.id &&
          other.farmId == this.farmId &&
          other.cropName == this.cropName &&
          other.variety == this.variety &&
          other.season == this.season &&
          other.cultivationAreaHa == this.cultivationAreaHa &&
          other.sowingDate == this.sowingDate &&
          other.estimatedYield == this.estimatedYield &&
          other.actualYield == this.actualYield &&
          other.seedCost == this.seedCost &&
          other.sowingCost == this.sowingCost &&
          other.status == this.status &&
          other.cropCategory == this.cropCategory &&
          other.cropCalendarId == this.cropCalendarId &&
          other.cultivationGeoJson == this.cultivationGeoJson &&
          other.photoUrl == this.photoUrl &&
          other.seedSource == this.seedSource &&
          other.isSeedTreated == this.isSeedTreated &&
          other.seedType == this.seedType &&
          other.seedQuantity == this.seedQuantity &&
          other.seedPrice == this.seedPrice &&
          other.sowingType == this.sowingType &&
          other.sowingChargesBy == this.sowingChargesBy &&
          other.sowingCharges == this.sowingCharges &&
          other.bambooVariety == this.bambooVariety &&
          other.seedlingCount == this.seedlingCount &&
          other.syncStatus == this.syncStatus &&
          other.lastSyncedAt == this.lastSyncedAt &&
          other.updatedAt == this.updatedAt);
}

class CultivationCacheCompanion extends UpdateCompanion<CultivationCacheData> {
  final Value<String> id;
  final Value<String> farmId;
  final Value<String> cropName;
  final Value<String?> variety;
  final Value<String?> season;
  final Value<double?> cultivationAreaHa;
  final Value<DateTime?> sowingDate;
  final Value<double?> estimatedYield;
  final Value<double?> actualYield;
  final Value<double?> seedCost;
  final Value<double?> sowingCost;
  final Value<String> status;
  final Value<String?> cropCategory;
  final Value<String?> cropCalendarId;
  final Value<String?> cultivationGeoJson;
  final Value<String?> photoUrl;
  final Value<String?> seedSource;
  final Value<bool?> isSeedTreated;
  final Value<String?> seedType;
  final Value<double?> seedQuantity;
  final Value<double?> seedPrice;
  final Value<String?> sowingType;
  final Value<String?> sowingChargesBy;
  final Value<double?> sowingCharges;
  final Value<String?> bambooVariety;
  final Value<double?> seedlingCount;
  final Value<String> syncStatus;
  final Value<DateTime?> lastSyncedAt;
  final Value<DateTime?> updatedAt;
  final Value<int> rowid;
  const CultivationCacheCompanion({
    this.id = const Value.absent(),
    this.farmId = const Value.absent(),
    this.cropName = const Value.absent(),
    this.variety = const Value.absent(),
    this.season = const Value.absent(),
    this.cultivationAreaHa = const Value.absent(),
    this.sowingDate = const Value.absent(),
    this.estimatedYield = const Value.absent(),
    this.actualYield = const Value.absent(),
    this.seedCost = const Value.absent(),
    this.sowingCost = const Value.absent(),
    this.status = const Value.absent(),
    this.cropCategory = const Value.absent(),
    this.cropCalendarId = const Value.absent(),
    this.cultivationGeoJson = const Value.absent(),
    this.photoUrl = const Value.absent(),
    this.seedSource = const Value.absent(),
    this.isSeedTreated = const Value.absent(),
    this.seedType = const Value.absent(),
    this.seedQuantity = const Value.absent(),
    this.seedPrice = const Value.absent(),
    this.sowingType = const Value.absent(),
    this.sowingChargesBy = const Value.absent(),
    this.sowingCharges = const Value.absent(),
    this.bambooVariety = const Value.absent(),
    this.seedlingCount = const Value.absent(),
    this.syncStatus = const Value.absent(),
    this.lastSyncedAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CultivationCacheCompanion.insert({
    required String id,
    required String farmId,
    required String cropName,
    this.variety = const Value.absent(),
    this.season = const Value.absent(),
    this.cultivationAreaHa = const Value.absent(),
    this.sowingDate = const Value.absent(),
    this.estimatedYield = const Value.absent(),
    this.actualYield = const Value.absent(),
    this.seedCost = const Value.absent(),
    this.sowingCost = const Value.absent(),
    this.status = const Value.absent(),
    this.cropCategory = const Value.absent(),
    this.cropCalendarId = const Value.absent(),
    this.cultivationGeoJson = const Value.absent(),
    this.photoUrl = const Value.absent(),
    this.seedSource = const Value.absent(),
    this.isSeedTreated = const Value.absent(),
    this.seedType = const Value.absent(),
    this.seedQuantity = const Value.absent(),
    this.seedPrice = const Value.absent(),
    this.sowingType = const Value.absent(),
    this.sowingChargesBy = const Value.absent(),
    this.sowingCharges = const Value.absent(),
    this.bambooVariety = const Value.absent(),
    this.seedlingCount = const Value.absent(),
    this.syncStatus = const Value.absent(),
    this.lastSyncedAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       farmId = Value(farmId),
       cropName = Value(cropName);
  static Insertable<CultivationCacheData> custom({
    Expression<String>? id,
    Expression<String>? farmId,
    Expression<String>? cropName,
    Expression<String>? variety,
    Expression<String>? season,
    Expression<double>? cultivationAreaHa,
    Expression<DateTime>? sowingDate,
    Expression<double>? estimatedYield,
    Expression<double>? actualYield,
    Expression<double>? seedCost,
    Expression<double>? sowingCost,
    Expression<String>? status,
    Expression<String>? cropCategory,
    Expression<String>? cropCalendarId,
    Expression<String>? cultivationGeoJson,
    Expression<String>? photoUrl,
    Expression<String>? seedSource,
    Expression<bool>? isSeedTreated,
    Expression<String>? seedType,
    Expression<double>? seedQuantity,
    Expression<double>? seedPrice,
    Expression<String>? sowingType,
    Expression<String>? sowingChargesBy,
    Expression<double>? sowingCharges,
    Expression<String>? bambooVariety,
    Expression<double>? seedlingCount,
    Expression<String>? syncStatus,
    Expression<DateTime>? lastSyncedAt,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (farmId != null) 'farm_id': farmId,
      if (cropName != null) 'crop_name': cropName,
      if (variety != null) 'variety': variety,
      if (season != null) 'season': season,
      if (cultivationAreaHa != null) 'cultivation_area_ha': cultivationAreaHa,
      if (sowingDate != null) 'sowing_date': sowingDate,
      if (estimatedYield != null) 'estimated_yield': estimatedYield,
      if (actualYield != null) 'actual_yield': actualYield,
      if (seedCost != null) 'seed_cost': seedCost,
      if (sowingCost != null) 'sowing_cost': sowingCost,
      if (status != null) 'status': status,
      if (cropCategory != null) 'crop_category': cropCategory,
      if (cropCalendarId != null) 'crop_calendar_id': cropCalendarId,
      if (cultivationGeoJson != null)
        'cultivation_geo_json': cultivationGeoJson,
      if (photoUrl != null) 'photo_url': photoUrl,
      if (seedSource != null) 'seed_source': seedSource,
      if (isSeedTreated != null) 'is_seed_treated': isSeedTreated,
      if (seedType != null) 'seed_type': seedType,
      if (seedQuantity != null) 'seed_quantity': seedQuantity,
      if (seedPrice != null) 'seed_price': seedPrice,
      if (sowingType != null) 'sowing_type': sowingType,
      if (sowingChargesBy != null) 'sowing_charges_by': sowingChargesBy,
      if (sowingCharges != null) 'sowing_charges': sowingCharges,
      if (bambooVariety != null) 'bamboo_variety': bambooVariety,
      if (seedlingCount != null) 'seedling_count': seedlingCount,
      if (syncStatus != null) 'sync_status': syncStatus,
      if (lastSyncedAt != null) 'last_synced_at': lastSyncedAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CultivationCacheCompanion copyWith({
    Value<String>? id,
    Value<String>? farmId,
    Value<String>? cropName,
    Value<String?>? variety,
    Value<String?>? season,
    Value<double?>? cultivationAreaHa,
    Value<DateTime?>? sowingDate,
    Value<double?>? estimatedYield,
    Value<double?>? actualYield,
    Value<double?>? seedCost,
    Value<double?>? sowingCost,
    Value<String>? status,
    Value<String?>? cropCategory,
    Value<String?>? cropCalendarId,
    Value<String?>? cultivationGeoJson,
    Value<String?>? photoUrl,
    Value<String?>? seedSource,
    Value<bool?>? isSeedTreated,
    Value<String?>? seedType,
    Value<double?>? seedQuantity,
    Value<double?>? seedPrice,
    Value<String?>? sowingType,
    Value<String?>? sowingChargesBy,
    Value<double?>? sowingCharges,
    Value<String?>? bambooVariety,
    Value<double?>? seedlingCount,
    Value<String>? syncStatus,
    Value<DateTime?>? lastSyncedAt,
    Value<DateTime?>? updatedAt,
    Value<int>? rowid,
  }) {
    return CultivationCacheCompanion(
      id: id ?? this.id,
      farmId: farmId ?? this.farmId,
      cropName: cropName ?? this.cropName,
      variety: variety ?? this.variety,
      season: season ?? this.season,
      cultivationAreaHa: cultivationAreaHa ?? this.cultivationAreaHa,
      sowingDate: sowingDate ?? this.sowingDate,
      estimatedYield: estimatedYield ?? this.estimatedYield,
      actualYield: actualYield ?? this.actualYield,
      seedCost: seedCost ?? this.seedCost,
      sowingCost: sowingCost ?? this.sowingCost,
      status: status ?? this.status,
      cropCategory: cropCategory ?? this.cropCategory,
      cropCalendarId: cropCalendarId ?? this.cropCalendarId,
      cultivationGeoJson: cultivationGeoJson ?? this.cultivationGeoJson,
      photoUrl: photoUrl ?? this.photoUrl,
      seedSource: seedSource ?? this.seedSource,
      isSeedTreated: isSeedTreated ?? this.isSeedTreated,
      seedType: seedType ?? this.seedType,
      seedQuantity: seedQuantity ?? this.seedQuantity,
      seedPrice: seedPrice ?? this.seedPrice,
      sowingType: sowingType ?? this.sowingType,
      sowingChargesBy: sowingChargesBy ?? this.sowingChargesBy,
      sowingCharges: sowingCharges ?? this.sowingCharges,
      bambooVariety: bambooVariety ?? this.bambooVariety,
      seedlingCount: seedlingCount ?? this.seedlingCount,
      syncStatus: syncStatus ?? this.syncStatus,
      lastSyncedAt: lastSyncedAt ?? this.lastSyncedAt,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (farmId.present) {
      map['farm_id'] = Variable<String>(farmId.value);
    }
    if (cropName.present) {
      map['crop_name'] = Variable<String>(cropName.value);
    }
    if (variety.present) {
      map['variety'] = Variable<String>(variety.value);
    }
    if (season.present) {
      map['season'] = Variable<String>(season.value);
    }
    if (cultivationAreaHa.present) {
      map['cultivation_area_ha'] = Variable<double>(cultivationAreaHa.value);
    }
    if (sowingDate.present) {
      map['sowing_date'] = Variable<DateTime>(sowingDate.value);
    }
    if (estimatedYield.present) {
      map['estimated_yield'] = Variable<double>(estimatedYield.value);
    }
    if (actualYield.present) {
      map['actual_yield'] = Variable<double>(actualYield.value);
    }
    if (seedCost.present) {
      map['seed_cost'] = Variable<double>(seedCost.value);
    }
    if (sowingCost.present) {
      map['sowing_cost'] = Variable<double>(sowingCost.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (cropCategory.present) {
      map['crop_category'] = Variable<String>(cropCategory.value);
    }
    if (cropCalendarId.present) {
      map['crop_calendar_id'] = Variable<String>(cropCalendarId.value);
    }
    if (cultivationGeoJson.present) {
      map['cultivation_geo_json'] = Variable<String>(cultivationGeoJson.value);
    }
    if (photoUrl.present) {
      map['photo_url'] = Variable<String>(photoUrl.value);
    }
    if (seedSource.present) {
      map['seed_source'] = Variable<String>(seedSource.value);
    }
    if (isSeedTreated.present) {
      map['is_seed_treated'] = Variable<bool>(isSeedTreated.value);
    }
    if (seedType.present) {
      map['seed_type'] = Variable<String>(seedType.value);
    }
    if (seedQuantity.present) {
      map['seed_quantity'] = Variable<double>(seedQuantity.value);
    }
    if (seedPrice.present) {
      map['seed_price'] = Variable<double>(seedPrice.value);
    }
    if (sowingType.present) {
      map['sowing_type'] = Variable<String>(sowingType.value);
    }
    if (sowingChargesBy.present) {
      map['sowing_charges_by'] = Variable<String>(sowingChargesBy.value);
    }
    if (sowingCharges.present) {
      map['sowing_charges'] = Variable<double>(sowingCharges.value);
    }
    if (bambooVariety.present) {
      map['bamboo_variety'] = Variable<String>(bambooVariety.value);
    }
    if (seedlingCount.present) {
      map['seedling_count'] = Variable<double>(seedlingCount.value);
    }
    if (syncStatus.present) {
      map['sync_status'] = Variable<String>(syncStatus.value);
    }
    if (lastSyncedAt.present) {
      map['last_synced_at'] = Variable<DateTime>(lastSyncedAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CultivationCacheCompanion(')
          ..write('id: $id, ')
          ..write('farmId: $farmId, ')
          ..write('cropName: $cropName, ')
          ..write('variety: $variety, ')
          ..write('season: $season, ')
          ..write('cultivationAreaHa: $cultivationAreaHa, ')
          ..write('sowingDate: $sowingDate, ')
          ..write('estimatedYield: $estimatedYield, ')
          ..write('actualYield: $actualYield, ')
          ..write('seedCost: $seedCost, ')
          ..write('sowingCost: $sowingCost, ')
          ..write('status: $status, ')
          ..write('cropCategory: $cropCategory, ')
          ..write('cropCalendarId: $cropCalendarId, ')
          ..write('cultivationGeoJson: $cultivationGeoJson, ')
          ..write('photoUrl: $photoUrl, ')
          ..write('seedSource: $seedSource, ')
          ..write('isSeedTreated: $isSeedTreated, ')
          ..write('seedType: $seedType, ')
          ..write('seedQuantity: $seedQuantity, ')
          ..write('seedPrice: $seedPrice, ')
          ..write('sowingType: $sowingType, ')
          ..write('sowingChargesBy: $sowingChargesBy, ')
          ..write('sowingCharges: $sowingCharges, ')
          ..write('bambooVariety: $bambooVariety, ')
          ..write('seedlingCount: $seedlingCount, ')
          ..write('syncStatus: $syncStatus, ')
          ..write('lastSyncedAt: $lastSyncedAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $VslaGroupCacheTable extends VslaGroupCache
    with TableInfo<$VslaGroupCacheTable, VslaGroupCacheData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $VslaGroupCacheTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
    'name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _shareValueMeta = const VerificationMeta(
    'shareValue',
  );
  @override
  late final GeneratedColumn<double> shareValue = GeneratedColumn<double>(
    'share_value',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _loanRateMeta = const VerificationMeta(
    'loanRate',
  );
  @override
  late final GeneratedColumn<double> loanRate = GeneratedColumn<double>(
    'loan_rate',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _maxLoanAmountMeta = const VerificationMeta(
    'maxLoanAmount',
  );
  @override
  late final GeneratedColumn<double> maxLoanAmount = GeneratedColumn<double>(
    'max_loan_amount',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _isActiveMeta = const VerificationMeta(
    'isActive',
  );
  @override
  late final GeneratedColumn<bool> isActive = GeneratedColumn<bool>(
    'is_active',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_active" IN (0, 1))',
    ),
    defaultValue: const Constant(true),
  );
  static const VerificationMeta _syncStatusMeta = const VerificationMeta(
    'syncStatus',
  );
  @override
  late final GeneratedColumn<String> syncStatus = GeneratedColumn<String>(
    'sync_status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('synced'),
  );
  static const VerificationMeta _lastSyncedAtMeta = const VerificationMeta(
    'lastSyncedAt',
  );
  @override
  late final GeneratedColumn<DateTime> lastSyncedAt = GeneratedColumn<DateTime>(
    'last_synced_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    name,
    shareValue,
    loanRate,
    maxLoanAmount,
    isActive,
    syncStatus,
    lastSyncedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'vsla_group_cache';
  @override
  VerificationContext validateIntegrity(
    Insertable<VslaGroupCacheData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('name')) {
      context.handle(
        _nameMeta,
        name.isAcceptableOrUnknown(data['name']!, _nameMeta),
      );
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('share_value')) {
      context.handle(
        _shareValueMeta,
        shareValue.isAcceptableOrUnknown(data['share_value']!, _shareValueMeta),
      );
    }
    if (data.containsKey('loan_rate')) {
      context.handle(
        _loanRateMeta,
        loanRate.isAcceptableOrUnknown(data['loan_rate']!, _loanRateMeta),
      );
    }
    if (data.containsKey('max_loan_amount')) {
      context.handle(
        _maxLoanAmountMeta,
        maxLoanAmount.isAcceptableOrUnknown(
          data['max_loan_amount']!,
          _maxLoanAmountMeta,
        ),
      );
    }
    if (data.containsKey('is_active')) {
      context.handle(
        _isActiveMeta,
        isActive.isAcceptableOrUnknown(data['is_active']!, _isActiveMeta),
      );
    }
    if (data.containsKey('sync_status')) {
      context.handle(
        _syncStatusMeta,
        syncStatus.isAcceptableOrUnknown(data['sync_status']!, _syncStatusMeta),
      );
    }
    if (data.containsKey('last_synced_at')) {
      context.handle(
        _lastSyncedAtMeta,
        lastSyncedAt.isAcceptableOrUnknown(
          data['last_synced_at']!,
          _lastSyncedAtMeta,
        ),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  VslaGroupCacheData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return VslaGroupCacheData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      name: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}name'],
      )!,
      shareValue: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}share_value'],
      ),
      loanRate: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}loan_rate'],
      ),
      maxLoanAmount: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}max_loan_amount'],
      ),
      isActive: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_active'],
      )!,
      syncStatus: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}sync_status'],
      )!,
      lastSyncedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}last_synced_at'],
      ),
    );
  }

  @override
  $VslaGroupCacheTable createAlias(String alias) {
    return $VslaGroupCacheTable(attachedDatabase, alias);
  }
}

class VslaGroupCacheData extends DataClass
    implements Insertable<VslaGroupCacheData> {
  final String id;
  final String name;
  final double? shareValue;
  final double? loanRate;
  final double? maxLoanAmount;
  final bool isActive;
  final String syncStatus;
  final DateTime? lastSyncedAt;
  const VslaGroupCacheData({
    required this.id,
    required this.name,
    this.shareValue,
    this.loanRate,
    this.maxLoanAmount,
    required this.isActive,
    required this.syncStatus,
    this.lastSyncedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['name'] = Variable<String>(name);
    if (!nullToAbsent || shareValue != null) {
      map['share_value'] = Variable<double>(shareValue);
    }
    if (!nullToAbsent || loanRate != null) {
      map['loan_rate'] = Variable<double>(loanRate);
    }
    if (!nullToAbsent || maxLoanAmount != null) {
      map['max_loan_amount'] = Variable<double>(maxLoanAmount);
    }
    map['is_active'] = Variable<bool>(isActive);
    map['sync_status'] = Variable<String>(syncStatus);
    if (!nullToAbsent || lastSyncedAt != null) {
      map['last_synced_at'] = Variable<DateTime>(lastSyncedAt);
    }
    return map;
  }

  VslaGroupCacheCompanion toCompanion(bool nullToAbsent) {
    return VslaGroupCacheCompanion(
      id: Value(id),
      name: Value(name),
      shareValue: shareValue == null && nullToAbsent
          ? const Value.absent()
          : Value(shareValue),
      loanRate: loanRate == null && nullToAbsent
          ? const Value.absent()
          : Value(loanRate),
      maxLoanAmount: maxLoanAmount == null && nullToAbsent
          ? const Value.absent()
          : Value(maxLoanAmount),
      isActive: Value(isActive),
      syncStatus: Value(syncStatus),
      lastSyncedAt: lastSyncedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(lastSyncedAt),
    );
  }

  factory VslaGroupCacheData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return VslaGroupCacheData(
      id: serializer.fromJson<String>(json['id']),
      name: serializer.fromJson<String>(json['name']),
      shareValue: serializer.fromJson<double?>(json['shareValue']),
      loanRate: serializer.fromJson<double?>(json['loanRate']),
      maxLoanAmount: serializer.fromJson<double?>(json['maxLoanAmount']),
      isActive: serializer.fromJson<bool>(json['isActive']),
      syncStatus: serializer.fromJson<String>(json['syncStatus']),
      lastSyncedAt: serializer.fromJson<DateTime?>(json['lastSyncedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'name': serializer.toJson<String>(name),
      'shareValue': serializer.toJson<double?>(shareValue),
      'loanRate': serializer.toJson<double?>(loanRate),
      'maxLoanAmount': serializer.toJson<double?>(maxLoanAmount),
      'isActive': serializer.toJson<bool>(isActive),
      'syncStatus': serializer.toJson<String>(syncStatus),
      'lastSyncedAt': serializer.toJson<DateTime?>(lastSyncedAt),
    };
  }

  VslaGroupCacheData copyWith({
    String? id,
    String? name,
    Value<double?> shareValue = const Value.absent(),
    Value<double?> loanRate = const Value.absent(),
    Value<double?> maxLoanAmount = const Value.absent(),
    bool? isActive,
    String? syncStatus,
    Value<DateTime?> lastSyncedAt = const Value.absent(),
  }) => VslaGroupCacheData(
    id: id ?? this.id,
    name: name ?? this.name,
    shareValue: shareValue.present ? shareValue.value : this.shareValue,
    loanRate: loanRate.present ? loanRate.value : this.loanRate,
    maxLoanAmount: maxLoanAmount.present
        ? maxLoanAmount.value
        : this.maxLoanAmount,
    isActive: isActive ?? this.isActive,
    syncStatus: syncStatus ?? this.syncStatus,
    lastSyncedAt: lastSyncedAt.present ? lastSyncedAt.value : this.lastSyncedAt,
  );
  VslaGroupCacheData copyWithCompanion(VslaGroupCacheCompanion data) {
    return VslaGroupCacheData(
      id: data.id.present ? data.id.value : this.id,
      name: data.name.present ? data.name.value : this.name,
      shareValue: data.shareValue.present
          ? data.shareValue.value
          : this.shareValue,
      loanRate: data.loanRate.present ? data.loanRate.value : this.loanRate,
      maxLoanAmount: data.maxLoanAmount.present
          ? data.maxLoanAmount.value
          : this.maxLoanAmount,
      isActive: data.isActive.present ? data.isActive.value : this.isActive,
      syncStatus: data.syncStatus.present
          ? data.syncStatus.value
          : this.syncStatus,
      lastSyncedAt: data.lastSyncedAt.present
          ? data.lastSyncedAt.value
          : this.lastSyncedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('VslaGroupCacheData(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('shareValue: $shareValue, ')
          ..write('loanRate: $loanRate, ')
          ..write('maxLoanAmount: $maxLoanAmount, ')
          ..write('isActive: $isActive, ')
          ..write('syncStatus: $syncStatus, ')
          ..write('lastSyncedAt: $lastSyncedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    name,
    shareValue,
    loanRate,
    maxLoanAmount,
    isActive,
    syncStatus,
    lastSyncedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is VslaGroupCacheData &&
          other.id == this.id &&
          other.name == this.name &&
          other.shareValue == this.shareValue &&
          other.loanRate == this.loanRate &&
          other.maxLoanAmount == this.maxLoanAmount &&
          other.isActive == this.isActive &&
          other.syncStatus == this.syncStatus &&
          other.lastSyncedAt == this.lastSyncedAt);
}

class VslaGroupCacheCompanion extends UpdateCompanion<VslaGroupCacheData> {
  final Value<String> id;
  final Value<String> name;
  final Value<double?> shareValue;
  final Value<double?> loanRate;
  final Value<double?> maxLoanAmount;
  final Value<bool> isActive;
  final Value<String> syncStatus;
  final Value<DateTime?> lastSyncedAt;
  final Value<int> rowid;
  const VslaGroupCacheCompanion({
    this.id = const Value.absent(),
    this.name = const Value.absent(),
    this.shareValue = const Value.absent(),
    this.loanRate = const Value.absent(),
    this.maxLoanAmount = const Value.absent(),
    this.isActive = const Value.absent(),
    this.syncStatus = const Value.absent(),
    this.lastSyncedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  VslaGroupCacheCompanion.insert({
    required String id,
    required String name,
    this.shareValue = const Value.absent(),
    this.loanRate = const Value.absent(),
    this.maxLoanAmount = const Value.absent(),
    this.isActive = const Value.absent(),
    this.syncStatus = const Value.absent(),
    this.lastSyncedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       name = Value(name);
  static Insertable<VslaGroupCacheData> custom({
    Expression<String>? id,
    Expression<String>? name,
    Expression<double>? shareValue,
    Expression<double>? loanRate,
    Expression<double>? maxLoanAmount,
    Expression<bool>? isActive,
    Expression<String>? syncStatus,
    Expression<DateTime>? lastSyncedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (shareValue != null) 'share_value': shareValue,
      if (loanRate != null) 'loan_rate': loanRate,
      if (maxLoanAmount != null) 'max_loan_amount': maxLoanAmount,
      if (isActive != null) 'is_active': isActive,
      if (syncStatus != null) 'sync_status': syncStatus,
      if (lastSyncedAt != null) 'last_synced_at': lastSyncedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  VslaGroupCacheCompanion copyWith({
    Value<String>? id,
    Value<String>? name,
    Value<double?>? shareValue,
    Value<double?>? loanRate,
    Value<double?>? maxLoanAmount,
    Value<bool>? isActive,
    Value<String>? syncStatus,
    Value<DateTime?>? lastSyncedAt,
    Value<int>? rowid,
  }) {
    return VslaGroupCacheCompanion(
      id: id ?? this.id,
      name: name ?? this.name,
      shareValue: shareValue ?? this.shareValue,
      loanRate: loanRate ?? this.loanRate,
      maxLoanAmount: maxLoanAmount ?? this.maxLoanAmount,
      isActive: isActive ?? this.isActive,
      syncStatus: syncStatus ?? this.syncStatus,
      lastSyncedAt: lastSyncedAt ?? this.lastSyncedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (shareValue.present) {
      map['share_value'] = Variable<double>(shareValue.value);
    }
    if (loanRate.present) {
      map['loan_rate'] = Variable<double>(loanRate.value);
    }
    if (maxLoanAmount.present) {
      map['max_loan_amount'] = Variable<double>(maxLoanAmount.value);
    }
    if (isActive.present) {
      map['is_active'] = Variable<bool>(isActive.value);
    }
    if (syncStatus.present) {
      map['sync_status'] = Variable<String>(syncStatus.value);
    }
    if (lastSyncedAt.present) {
      map['last_synced_at'] = Variable<DateTime>(lastSyncedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('VslaGroupCacheCompanion(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('shareValue: $shareValue, ')
          ..write('loanRate: $loanRate, ')
          ..write('maxLoanAmount: $maxLoanAmount, ')
          ..write('isActive: $isActive, ')
          ..write('syncStatus: $syncStatus, ')
          ..write('lastSyncedAt: $lastSyncedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $VslaSavingCacheTable extends VslaSavingCache
    with TableInfo<$VslaSavingCacheTable, VslaSavingCacheData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $VslaSavingCacheTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _vslaGroupIdMeta = const VerificationMeta(
    'vslaGroupId',
  );
  @override
  late final GeneratedColumn<String> vslaGroupId = GeneratedColumn<String>(
    'vsla_group_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _farmerIdMeta = const VerificationMeta(
    'farmerId',
  );
  @override
  late final GeneratedColumn<String> farmerId = GeneratedColumn<String>(
    'farmer_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _amountMeta = const VerificationMeta('amount');
  @override
  late final GeneratedColumn<double> amount = GeneratedColumn<double>(
    'amount',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _savingTypeMeta = const VerificationMeta(
    'savingType',
  );
  @override
  late final GeneratedColumn<String> savingType = GeneratedColumn<String>(
    'saving_type',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _savingDateMeta = const VerificationMeta(
    'savingDate',
  );
  @override
  late final GeneratedColumn<DateTime> savingDate = GeneratedColumn<DateTime>(
    'saving_date',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  static const VerificationMeta _syncStatusMeta = const VerificationMeta(
    'syncStatus',
  );
  @override
  late final GeneratedColumn<String> syncStatus = GeneratedColumn<String>(
    'sync_status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('pending'),
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    vslaGroupId,
    farmerId,
    amount,
    savingType,
    savingDate,
    syncStatus,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'vsla_saving_cache';
  @override
  VerificationContext validateIntegrity(
    Insertable<VslaSavingCacheData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('vsla_group_id')) {
      context.handle(
        _vslaGroupIdMeta,
        vslaGroupId.isAcceptableOrUnknown(
          data['vsla_group_id']!,
          _vslaGroupIdMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_vslaGroupIdMeta);
    }
    if (data.containsKey('farmer_id')) {
      context.handle(
        _farmerIdMeta,
        farmerId.isAcceptableOrUnknown(data['farmer_id']!, _farmerIdMeta),
      );
    } else if (isInserting) {
      context.missing(_farmerIdMeta);
    }
    if (data.containsKey('amount')) {
      context.handle(
        _amountMeta,
        amount.isAcceptableOrUnknown(data['amount']!, _amountMeta),
      );
    } else if (isInserting) {
      context.missing(_amountMeta);
    }
    if (data.containsKey('saving_type')) {
      context.handle(
        _savingTypeMeta,
        savingType.isAcceptableOrUnknown(data['saving_type']!, _savingTypeMeta),
      );
    }
    if (data.containsKey('saving_date')) {
      context.handle(
        _savingDateMeta,
        savingDate.isAcceptableOrUnknown(data['saving_date']!, _savingDateMeta),
      );
    }
    if (data.containsKey('sync_status')) {
      context.handle(
        _syncStatusMeta,
        syncStatus.isAcceptableOrUnknown(data['sync_status']!, _syncStatusMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  VslaSavingCacheData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return VslaSavingCacheData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      vslaGroupId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}vsla_group_id'],
      )!,
      farmerId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}farmer_id'],
      )!,
      amount: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}amount'],
      )!,
      savingType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}saving_type'],
      ),
      savingDate: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}saving_date'],
      )!,
      syncStatus: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}sync_status'],
      )!,
    );
  }

  @override
  $VslaSavingCacheTable createAlias(String alias) {
    return $VslaSavingCacheTable(attachedDatabase, alias);
  }
}

class VslaSavingCacheData extends DataClass
    implements Insertable<VslaSavingCacheData> {
  final String id;
  final String vslaGroupId;
  final String farmerId;
  final double amount;
  final String? savingType;
  final DateTime savingDate;
  final String syncStatus;
  const VslaSavingCacheData({
    required this.id,
    required this.vslaGroupId,
    required this.farmerId,
    required this.amount,
    this.savingType,
    required this.savingDate,
    required this.syncStatus,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['vsla_group_id'] = Variable<String>(vslaGroupId);
    map['farmer_id'] = Variable<String>(farmerId);
    map['amount'] = Variable<double>(amount);
    if (!nullToAbsent || savingType != null) {
      map['saving_type'] = Variable<String>(savingType);
    }
    map['saving_date'] = Variable<DateTime>(savingDate);
    map['sync_status'] = Variable<String>(syncStatus);
    return map;
  }

  VslaSavingCacheCompanion toCompanion(bool nullToAbsent) {
    return VslaSavingCacheCompanion(
      id: Value(id),
      vslaGroupId: Value(vslaGroupId),
      farmerId: Value(farmerId),
      amount: Value(amount),
      savingType: savingType == null && nullToAbsent
          ? const Value.absent()
          : Value(savingType),
      savingDate: Value(savingDate),
      syncStatus: Value(syncStatus),
    );
  }

  factory VslaSavingCacheData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return VslaSavingCacheData(
      id: serializer.fromJson<String>(json['id']),
      vslaGroupId: serializer.fromJson<String>(json['vslaGroupId']),
      farmerId: serializer.fromJson<String>(json['farmerId']),
      amount: serializer.fromJson<double>(json['amount']),
      savingType: serializer.fromJson<String?>(json['savingType']),
      savingDate: serializer.fromJson<DateTime>(json['savingDate']),
      syncStatus: serializer.fromJson<String>(json['syncStatus']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'vslaGroupId': serializer.toJson<String>(vslaGroupId),
      'farmerId': serializer.toJson<String>(farmerId),
      'amount': serializer.toJson<double>(amount),
      'savingType': serializer.toJson<String?>(savingType),
      'savingDate': serializer.toJson<DateTime>(savingDate),
      'syncStatus': serializer.toJson<String>(syncStatus),
    };
  }

  VslaSavingCacheData copyWith({
    String? id,
    String? vslaGroupId,
    String? farmerId,
    double? amount,
    Value<String?> savingType = const Value.absent(),
    DateTime? savingDate,
    String? syncStatus,
  }) => VslaSavingCacheData(
    id: id ?? this.id,
    vslaGroupId: vslaGroupId ?? this.vslaGroupId,
    farmerId: farmerId ?? this.farmerId,
    amount: amount ?? this.amount,
    savingType: savingType.present ? savingType.value : this.savingType,
    savingDate: savingDate ?? this.savingDate,
    syncStatus: syncStatus ?? this.syncStatus,
  );
  VslaSavingCacheData copyWithCompanion(VslaSavingCacheCompanion data) {
    return VslaSavingCacheData(
      id: data.id.present ? data.id.value : this.id,
      vslaGroupId: data.vslaGroupId.present
          ? data.vslaGroupId.value
          : this.vslaGroupId,
      farmerId: data.farmerId.present ? data.farmerId.value : this.farmerId,
      amount: data.amount.present ? data.amount.value : this.amount,
      savingType: data.savingType.present
          ? data.savingType.value
          : this.savingType,
      savingDate: data.savingDate.present
          ? data.savingDate.value
          : this.savingDate,
      syncStatus: data.syncStatus.present
          ? data.syncStatus.value
          : this.syncStatus,
    );
  }

  @override
  String toString() {
    return (StringBuffer('VslaSavingCacheData(')
          ..write('id: $id, ')
          ..write('vslaGroupId: $vslaGroupId, ')
          ..write('farmerId: $farmerId, ')
          ..write('amount: $amount, ')
          ..write('savingType: $savingType, ')
          ..write('savingDate: $savingDate, ')
          ..write('syncStatus: $syncStatus')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    vslaGroupId,
    farmerId,
    amount,
    savingType,
    savingDate,
    syncStatus,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is VslaSavingCacheData &&
          other.id == this.id &&
          other.vslaGroupId == this.vslaGroupId &&
          other.farmerId == this.farmerId &&
          other.amount == this.amount &&
          other.savingType == this.savingType &&
          other.savingDate == this.savingDate &&
          other.syncStatus == this.syncStatus);
}

class VslaSavingCacheCompanion extends UpdateCompanion<VslaSavingCacheData> {
  final Value<String> id;
  final Value<String> vslaGroupId;
  final Value<String> farmerId;
  final Value<double> amount;
  final Value<String?> savingType;
  final Value<DateTime> savingDate;
  final Value<String> syncStatus;
  final Value<int> rowid;
  const VslaSavingCacheCompanion({
    this.id = const Value.absent(),
    this.vslaGroupId = const Value.absent(),
    this.farmerId = const Value.absent(),
    this.amount = const Value.absent(),
    this.savingType = const Value.absent(),
    this.savingDate = const Value.absent(),
    this.syncStatus = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  VslaSavingCacheCompanion.insert({
    required String id,
    required String vslaGroupId,
    required String farmerId,
    required double amount,
    this.savingType = const Value.absent(),
    this.savingDate = const Value.absent(),
    this.syncStatus = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       vslaGroupId = Value(vslaGroupId),
       farmerId = Value(farmerId),
       amount = Value(amount);
  static Insertable<VslaSavingCacheData> custom({
    Expression<String>? id,
    Expression<String>? vslaGroupId,
    Expression<String>? farmerId,
    Expression<double>? amount,
    Expression<String>? savingType,
    Expression<DateTime>? savingDate,
    Expression<String>? syncStatus,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (vslaGroupId != null) 'vsla_group_id': vslaGroupId,
      if (farmerId != null) 'farmer_id': farmerId,
      if (amount != null) 'amount': amount,
      if (savingType != null) 'saving_type': savingType,
      if (savingDate != null) 'saving_date': savingDate,
      if (syncStatus != null) 'sync_status': syncStatus,
      if (rowid != null) 'rowid': rowid,
    });
  }

  VslaSavingCacheCompanion copyWith({
    Value<String>? id,
    Value<String>? vslaGroupId,
    Value<String>? farmerId,
    Value<double>? amount,
    Value<String?>? savingType,
    Value<DateTime>? savingDate,
    Value<String>? syncStatus,
    Value<int>? rowid,
  }) {
    return VslaSavingCacheCompanion(
      id: id ?? this.id,
      vslaGroupId: vslaGroupId ?? this.vslaGroupId,
      farmerId: farmerId ?? this.farmerId,
      amount: amount ?? this.amount,
      savingType: savingType ?? this.savingType,
      savingDate: savingDate ?? this.savingDate,
      syncStatus: syncStatus ?? this.syncStatus,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (vslaGroupId.present) {
      map['vsla_group_id'] = Variable<String>(vslaGroupId.value);
    }
    if (farmerId.present) {
      map['farmer_id'] = Variable<String>(farmerId.value);
    }
    if (amount.present) {
      map['amount'] = Variable<double>(amount.value);
    }
    if (savingType.present) {
      map['saving_type'] = Variable<String>(savingType.value);
    }
    if (savingDate.present) {
      map['saving_date'] = Variable<DateTime>(savingDate.value);
    }
    if (syncStatus.present) {
      map['sync_status'] = Variable<String>(syncStatus.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('VslaSavingCacheCompanion(')
          ..write('id: $id, ')
          ..write('vslaGroupId: $vslaGroupId, ')
          ..write('farmerId: $farmerId, ')
          ..write('amount: $amount, ')
          ..write('savingType: $savingType, ')
          ..write('savingDate: $savingDate, ')
          ..write('syncStatus: $syncStatus, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $VslaLoanCacheTable extends VslaLoanCache
    with TableInfo<$VslaLoanCacheTable, VslaLoanCacheData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $VslaLoanCacheTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _vslaGroupIdMeta = const VerificationMeta(
    'vslaGroupId',
  );
  @override
  late final GeneratedColumn<String> vslaGroupId = GeneratedColumn<String>(
    'vsla_group_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _farmerIdMeta = const VerificationMeta(
    'farmerId',
  );
  @override
  late final GeneratedColumn<String> farmerId = GeneratedColumn<String>(
    'farmer_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _amountMeta = const VerificationMeta('amount');
  @override
  late final GeneratedColumn<double> amount = GeneratedColumn<double>(
    'amount',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _interestRateMeta = const VerificationMeta(
    'interestRate',
  );
  @override
  late final GeneratedColumn<double> interestRate = GeneratedColumn<double>(
    'interest_rate',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _repaidAmountMeta = const VerificationMeta(
    'repaidAmount',
  );
  @override
  late final GeneratedColumn<double> repaidAmount = GeneratedColumn<double>(
    'repaid_amount',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
    'status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('PENDING'),
  );
  static const VerificationMeta _loanDateMeta = const VerificationMeta(
    'loanDate',
  );
  @override
  late final GeneratedColumn<DateTime> loanDate = GeneratedColumn<DateTime>(
    'loan_date',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  static const VerificationMeta _syncStatusMeta = const VerificationMeta(
    'syncStatus',
  );
  @override
  late final GeneratedColumn<String> syncStatus = GeneratedColumn<String>(
    'sync_status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('pending'),
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    vslaGroupId,
    farmerId,
    amount,
    interestRate,
    repaidAmount,
    status,
    loanDate,
    syncStatus,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'vsla_loan_cache';
  @override
  VerificationContext validateIntegrity(
    Insertable<VslaLoanCacheData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('vsla_group_id')) {
      context.handle(
        _vslaGroupIdMeta,
        vslaGroupId.isAcceptableOrUnknown(
          data['vsla_group_id']!,
          _vslaGroupIdMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_vslaGroupIdMeta);
    }
    if (data.containsKey('farmer_id')) {
      context.handle(
        _farmerIdMeta,
        farmerId.isAcceptableOrUnknown(data['farmer_id']!, _farmerIdMeta),
      );
    } else if (isInserting) {
      context.missing(_farmerIdMeta);
    }
    if (data.containsKey('amount')) {
      context.handle(
        _amountMeta,
        amount.isAcceptableOrUnknown(data['amount']!, _amountMeta),
      );
    } else if (isInserting) {
      context.missing(_amountMeta);
    }
    if (data.containsKey('interest_rate')) {
      context.handle(
        _interestRateMeta,
        interestRate.isAcceptableOrUnknown(
          data['interest_rate']!,
          _interestRateMeta,
        ),
      );
    }
    if (data.containsKey('repaid_amount')) {
      context.handle(
        _repaidAmountMeta,
        repaidAmount.isAcceptableOrUnknown(
          data['repaid_amount']!,
          _repaidAmountMeta,
        ),
      );
    }
    if (data.containsKey('status')) {
      context.handle(
        _statusMeta,
        status.isAcceptableOrUnknown(data['status']!, _statusMeta),
      );
    }
    if (data.containsKey('loan_date')) {
      context.handle(
        _loanDateMeta,
        loanDate.isAcceptableOrUnknown(data['loan_date']!, _loanDateMeta),
      );
    }
    if (data.containsKey('sync_status')) {
      context.handle(
        _syncStatusMeta,
        syncStatus.isAcceptableOrUnknown(data['sync_status']!, _syncStatusMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  VslaLoanCacheData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return VslaLoanCacheData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      vslaGroupId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}vsla_group_id'],
      )!,
      farmerId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}farmer_id'],
      )!,
      amount: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}amount'],
      )!,
      interestRate: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}interest_rate'],
      ),
      repaidAmount: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}repaid_amount'],
      )!,
      status: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}status'],
      )!,
      loanDate: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}loan_date'],
      )!,
      syncStatus: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}sync_status'],
      )!,
    );
  }

  @override
  $VslaLoanCacheTable createAlias(String alias) {
    return $VslaLoanCacheTable(attachedDatabase, alias);
  }
}

class VslaLoanCacheData extends DataClass
    implements Insertable<VslaLoanCacheData> {
  final String id;
  final String vslaGroupId;
  final String farmerId;
  final double amount;
  final double? interestRate;
  final double repaidAmount;
  final String status;
  final DateTime loanDate;
  final String syncStatus;
  const VslaLoanCacheData({
    required this.id,
    required this.vslaGroupId,
    required this.farmerId,
    required this.amount,
    this.interestRate,
    required this.repaidAmount,
    required this.status,
    required this.loanDate,
    required this.syncStatus,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['vsla_group_id'] = Variable<String>(vslaGroupId);
    map['farmer_id'] = Variable<String>(farmerId);
    map['amount'] = Variable<double>(amount);
    if (!nullToAbsent || interestRate != null) {
      map['interest_rate'] = Variable<double>(interestRate);
    }
    map['repaid_amount'] = Variable<double>(repaidAmount);
    map['status'] = Variable<String>(status);
    map['loan_date'] = Variable<DateTime>(loanDate);
    map['sync_status'] = Variable<String>(syncStatus);
    return map;
  }

  VslaLoanCacheCompanion toCompanion(bool nullToAbsent) {
    return VslaLoanCacheCompanion(
      id: Value(id),
      vslaGroupId: Value(vslaGroupId),
      farmerId: Value(farmerId),
      amount: Value(amount),
      interestRate: interestRate == null && nullToAbsent
          ? const Value.absent()
          : Value(interestRate),
      repaidAmount: Value(repaidAmount),
      status: Value(status),
      loanDate: Value(loanDate),
      syncStatus: Value(syncStatus),
    );
  }

  factory VslaLoanCacheData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return VslaLoanCacheData(
      id: serializer.fromJson<String>(json['id']),
      vslaGroupId: serializer.fromJson<String>(json['vslaGroupId']),
      farmerId: serializer.fromJson<String>(json['farmerId']),
      amount: serializer.fromJson<double>(json['amount']),
      interestRate: serializer.fromJson<double?>(json['interestRate']),
      repaidAmount: serializer.fromJson<double>(json['repaidAmount']),
      status: serializer.fromJson<String>(json['status']),
      loanDate: serializer.fromJson<DateTime>(json['loanDate']),
      syncStatus: serializer.fromJson<String>(json['syncStatus']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'vslaGroupId': serializer.toJson<String>(vslaGroupId),
      'farmerId': serializer.toJson<String>(farmerId),
      'amount': serializer.toJson<double>(amount),
      'interestRate': serializer.toJson<double?>(interestRate),
      'repaidAmount': serializer.toJson<double>(repaidAmount),
      'status': serializer.toJson<String>(status),
      'loanDate': serializer.toJson<DateTime>(loanDate),
      'syncStatus': serializer.toJson<String>(syncStatus),
    };
  }

  VslaLoanCacheData copyWith({
    String? id,
    String? vslaGroupId,
    String? farmerId,
    double? amount,
    Value<double?> interestRate = const Value.absent(),
    double? repaidAmount,
    String? status,
    DateTime? loanDate,
    String? syncStatus,
  }) => VslaLoanCacheData(
    id: id ?? this.id,
    vslaGroupId: vslaGroupId ?? this.vslaGroupId,
    farmerId: farmerId ?? this.farmerId,
    amount: amount ?? this.amount,
    interestRate: interestRate.present ? interestRate.value : this.interestRate,
    repaidAmount: repaidAmount ?? this.repaidAmount,
    status: status ?? this.status,
    loanDate: loanDate ?? this.loanDate,
    syncStatus: syncStatus ?? this.syncStatus,
  );
  VslaLoanCacheData copyWithCompanion(VslaLoanCacheCompanion data) {
    return VslaLoanCacheData(
      id: data.id.present ? data.id.value : this.id,
      vslaGroupId: data.vslaGroupId.present
          ? data.vslaGroupId.value
          : this.vslaGroupId,
      farmerId: data.farmerId.present ? data.farmerId.value : this.farmerId,
      amount: data.amount.present ? data.amount.value : this.amount,
      interestRate: data.interestRate.present
          ? data.interestRate.value
          : this.interestRate,
      repaidAmount: data.repaidAmount.present
          ? data.repaidAmount.value
          : this.repaidAmount,
      status: data.status.present ? data.status.value : this.status,
      loanDate: data.loanDate.present ? data.loanDate.value : this.loanDate,
      syncStatus: data.syncStatus.present
          ? data.syncStatus.value
          : this.syncStatus,
    );
  }

  @override
  String toString() {
    return (StringBuffer('VslaLoanCacheData(')
          ..write('id: $id, ')
          ..write('vslaGroupId: $vslaGroupId, ')
          ..write('farmerId: $farmerId, ')
          ..write('amount: $amount, ')
          ..write('interestRate: $interestRate, ')
          ..write('repaidAmount: $repaidAmount, ')
          ..write('status: $status, ')
          ..write('loanDate: $loanDate, ')
          ..write('syncStatus: $syncStatus')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    vslaGroupId,
    farmerId,
    amount,
    interestRate,
    repaidAmount,
    status,
    loanDate,
    syncStatus,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is VslaLoanCacheData &&
          other.id == this.id &&
          other.vslaGroupId == this.vslaGroupId &&
          other.farmerId == this.farmerId &&
          other.amount == this.amount &&
          other.interestRate == this.interestRate &&
          other.repaidAmount == this.repaidAmount &&
          other.status == this.status &&
          other.loanDate == this.loanDate &&
          other.syncStatus == this.syncStatus);
}

class VslaLoanCacheCompanion extends UpdateCompanion<VslaLoanCacheData> {
  final Value<String> id;
  final Value<String> vslaGroupId;
  final Value<String> farmerId;
  final Value<double> amount;
  final Value<double?> interestRate;
  final Value<double> repaidAmount;
  final Value<String> status;
  final Value<DateTime> loanDate;
  final Value<String> syncStatus;
  final Value<int> rowid;
  const VslaLoanCacheCompanion({
    this.id = const Value.absent(),
    this.vslaGroupId = const Value.absent(),
    this.farmerId = const Value.absent(),
    this.amount = const Value.absent(),
    this.interestRate = const Value.absent(),
    this.repaidAmount = const Value.absent(),
    this.status = const Value.absent(),
    this.loanDate = const Value.absent(),
    this.syncStatus = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  VslaLoanCacheCompanion.insert({
    required String id,
    required String vslaGroupId,
    required String farmerId,
    required double amount,
    this.interestRate = const Value.absent(),
    this.repaidAmount = const Value.absent(),
    this.status = const Value.absent(),
    this.loanDate = const Value.absent(),
    this.syncStatus = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       vslaGroupId = Value(vslaGroupId),
       farmerId = Value(farmerId),
       amount = Value(amount);
  static Insertable<VslaLoanCacheData> custom({
    Expression<String>? id,
    Expression<String>? vslaGroupId,
    Expression<String>? farmerId,
    Expression<double>? amount,
    Expression<double>? interestRate,
    Expression<double>? repaidAmount,
    Expression<String>? status,
    Expression<DateTime>? loanDate,
    Expression<String>? syncStatus,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (vslaGroupId != null) 'vsla_group_id': vslaGroupId,
      if (farmerId != null) 'farmer_id': farmerId,
      if (amount != null) 'amount': amount,
      if (interestRate != null) 'interest_rate': interestRate,
      if (repaidAmount != null) 'repaid_amount': repaidAmount,
      if (status != null) 'status': status,
      if (loanDate != null) 'loan_date': loanDate,
      if (syncStatus != null) 'sync_status': syncStatus,
      if (rowid != null) 'rowid': rowid,
    });
  }

  VslaLoanCacheCompanion copyWith({
    Value<String>? id,
    Value<String>? vslaGroupId,
    Value<String>? farmerId,
    Value<double>? amount,
    Value<double?>? interestRate,
    Value<double>? repaidAmount,
    Value<String>? status,
    Value<DateTime>? loanDate,
    Value<String>? syncStatus,
    Value<int>? rowid,
  }) {
    return VslaLoanCacheCompanion(
      id: id ?? this.id,
      vslaGroupId: vslaGroupId ?? this.vslaGroupId,
      farmerId: farmerId ?? this.farmerId,
      amount: amount ?? this.amount,
      interestRate: interestRate ?? this.interestRate,
      repaidAmount: repaidAmount ?? this.repaidAmount,
      status: status ?? this.status,
      loanDate: loanDate ?? this.loanDate,
      syncStatus: syncStatus ?? this.syncStatus,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (vslaGroupId.present) {
      map['vsla_group_id'] = Variable<String>(vslaGroupId.value);
    }
    if (farmerId.present) {
      map['farmer_id'] = Variable<String>(farmerId.value);
    }
    if (amount.present) {
      map['amount'] = Variable<double>(amount.value);
    }
    if (interestRate.present) {
      map['interest_rate'] = Variable<double>(interestRate.value);
    }
    if (repaidAmount.present) {
      map['repaid_amount'] = Variable<double>(repaidAmount.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (loanDate.present) {
      map['loan_date'] = Variable<DateTime>(loanDate.value);
    }
    if (syncStatus.present) {
      map['sync_status'] = Variable<String>(syncStatus.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('VslaLoanCacheCompanion(')
          ..write('id: $id, ')
          ..write('vslaGroupId: $vslaGroupId, ')
          ..write('farmerId: $farmerId, ')
          ..write('amount: $amount, ')
          ..write('interestRate: $interestRate, ')
          ..write('repaidAmount: $repaidAmount, ')
          ..write('status: $status, ')
          ..write('loanDate: $loanDate, ')
          ..write('syncStatus: $syncStatus, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $TrainingCacheTable extends TrainingCache
    with TableInfo<$TrainingCacheTable, TrainingCacheData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $TrainingCacheTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _topicMeta = const VerificationMeta('topic');
  @override
  late final GeneratedColumn<String> topic = GeneratedColumn<String>(
    'topic',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _dateMeta = const VerificationMeta('date');
  @override
  late final GeneratedColumn<DateTime> date = GeneratedColumn<DateTime>(
    'date',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _locationMeta = const VerificationMeta(
    'location',
  );
  @override
  late final GeneratedColumn<String> location = GeneratedColumn<String>(
    'location',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _trainerNameMeta = const VerificationMeta(
    'trainerName',
  );
  @override
  late final GeneratedColumn<String> trainerName = GeneratedColumn<String>(
    'trainer_name',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _descriptionMeta = const VerificationMeta(
    'description',
  );
  @override
  late final GeneratedColumn<String> description = GeneratedColumn<String>(
    'description',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _syncStatusMeta = const VerificationMeta(
    'syncStatus',
  );
  @override
  late final GeneratedColumn<String> syncStatus = GeneratedColumn<String>(
    'sync_status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('synced'),
  );
  static const VerificationMeta _lastSyncedAtMeta = const VerificationMeta(
    'lastSyncedAt',
  );
  @override
  late final GeneratedColumn<DateTime> lastSyncedAt = GeneratedColumn<DateTime>(
    'last_synced_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    topic,
    date,
    location,
    trainerName,
    description,
    syncStatus,
    lastSyncedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'training_cache';
  @override
  VerificationContext validateIntegrity(
    Insertable<TrainingCacheData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('topic')) {
      context.handle(
        _topicMeta,
        topic.isAcceptableOrUnknown(data['topic']!, _topicMeta),
      );
    } else if (isInserting) {
      context.missing(_topicMeta);
    }
    if (data.containsKey('date')) {
      context.handle(
        _dateMeta,
        date.isAcceptableOrUnknown(data['date']!, _dateMeta),
      );
    }
    if (data.containsKey('location')) {
      context.handle(
        _locationMeta,
        location.isAcceptableOrUnknown(data['location']!, _locationMeta),
      );
    }
    if (data.containsKey('trainer_name')) {
      context.handle(
        _trainerNameMeta,
        trainerName.isAcceptableOrUnknown(
          data['trainer_name']!,
          _trainerNameMeta,
        ),
      );
    }
    if (data.containsKey('description')) {
      context.handle(
        _descriptionMeta,
        description.isAcceptableOrUnknown(
          data['description']!,
          _descriptionMeta,
        ),
      );
    }
    if (data.containsKey('sync_status')) {
      context.handle(
        _syncStatusMeta,
        syncStatus.isAcceptableOrUnknown(data['sync_status']!, _syncStatusMeta),
      );
    }
    if (data.containsKey('last_synced_at')) {
      context.handle(
        _lastSyncedAtMeta,
        lastSyncedAt.isAcceptableOrUnknown(
          data['last_synced_at']!,
          _lastSyncedAtMeta,
        ),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  TrainingCacheData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return TrainingCacheData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      topic: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}topic'],
      )!,
      date: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}date'],
      ),
      location: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}location'],
      ),
      trainerName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}trainer_name'],
      ),
      description: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}description'],
      ),
      syncStatus: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}sync_status'],
      )!,
      lastSyncedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}last_synced_at'],
      ),
    );
  }

  @override
  $TrainingCacheTable createAlias(String alias) {
    return $TrainingCacheTable(attachedDatabase, alias);
  }
}

class TrainingCacheData extends DataClass
    implements Insertable<TrainingCacheData> {
  final String id;
  final String topic;
  final DateTime? date;
  final String? location;
  final String? trainerName;
  final String? description;
  final String syncStatus;
  final DateTime? lastSyncedAt;
  const TrainingCacheData({
    required this.id,
    required this.topic,
    this.date,
    this.location,
    this.trainerName,
    this.description,
    required this.syncStatus,
    this.lastSyncedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['topic'] = Variable<String>(topic);
    if (!nullToAbsent || date != null) {
      map['date'] = Variable<DateTime>(date);
    }
    if (!nullToAbsent || location != null) {
      map['location'] = Variable<String>(location);
    }
    if (!nullToAbsent || trainerName != null) {
      map['trainer_name'] = Variable<String>(trainerName);
    }
    if (!nullToAbsent || description != null) {
      map['description'] = Variable<String>(description);
    }
    map['sync_status'] = Variable<String>(syncStatus);
    if (!nullToAbsent || lastSyncedAt != null) {
      map['last_synced_at'] = Variable<DateTime>(lastSyncedAt);
    }
    return map;
  }

  TrainingCacheCompanion toCompanion(bool nullToAbsent) {
    return TrainingCacheCompanion(
      id: Value(id),
      topic: Value(topic),
      date: date == null && nullToAbsent ? const Value.absent() : Value(date),
      location: location == null && nullToAbsent
          ? const Value.absent()
          : Value(location),
      trainerName: trainerName == null && nullToAbsent
          ? const Value.absent()
          : Value(trainerName),
      description: description == null && nullToAbsent
          ? const Value.absent()
          : Value(description),
      syncStatus: Value(syncStatus),
      lastSyncedAt: lastSyncedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(lastSyncedAt),
    );
  }

  factory TrainingCacheData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return TrainingCacheData(
      id: serializer.fromJson<String>(json['id']),
      topic: serializer.fromJson<String>(json['topic']),
      date: serializer.fromJson<DateTime?>(json['date']),
      location: serializer.fromJson<String?>(json['location']),
      trainerName: serializer.fromJson<String?>(json['trainerName']),
      description: serializer.fromJson<String?>(json['description']),
      syncStatus: serializer.fromJson<String>(json['syncStatus']),
      lastSyncedAt: serializer.fromJson<DateTime?>(json['lastSyncedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'topic': serializer.toJson<String>(topic),
      'date': serializer.toJson<DateTime?>(date),
      'location': serializer.toJson<String?>(location),
      'trainerName': serializer.toJson<String?>(trainerName),
      'description': serializer.toJson<String?>(description),
      'syncStatus': serializer.toJson<String>(syncStatus),
      'lastSyncedAt': serializer.toJson<DateTime?>(lastSyncedAt),
    };
  }

  TrainingCacheData copyWith({
    String? id,
    String? topic,
    Value<DateTime?> date = const Value.absent(),
    Value<String?> location = const Value.absent(),
    Value<String?> trainerName = const Value.absent(),
    Value<String?> description = const Value.absent(),
    String? syncStatus,
    Value<DateTime?> lastSyncedAt = const Value.absent(),
  }) => TrainingCacheData(
    id: id ?? this.id,
    topic: topic ?? this.topic,
    date: date.present ? date.value : this.date,
    location: location.present ? location.value : this.location,
    trainerName: trainerName.present ? trainerName.value : this.trainerName,
    description: description.present ? description.value : this.description,
    syncStatus: syncStatus ?? this.syncStatus,
    lastSyncedAt: lastSyncedAt.present ? lastSyncedAt.value : this.lastSyncedAt,
  );
  TrainingCacheData copyWithCompanion(TrainingCacheCompanion data) {
    return TrainingCacheData(
      id: data.id.present ? data.id.value : this.id,
      topic: data.topic.present ? data.topic.value : this.topic,
      date: data.date.present ? data.date.value : this.date,
      location: data.location.present ? data.location.value : this.location,
      trainerName: data.trainerName.present
          ? data.trainerName.value
          : this.trainerName,
      description: data.description.present
          ? data.description.value
          : this.description,
      syncStatus: data.syncStatus.present
          ? data.syncStatus.value
          : this.syncStatus,
      lastSyncedAt: data.lastSyncedAt.present
          ? data.lastSyncedAt.value
          : this.lastSyncedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('TrainingCacheData(')
          ..write('id: $id, ')
          ..write('topic: $topic, ')
          ..write('date: $date, ')
          ..write('location: $location, ')
          ..write('trainerName: $trainerName, ')
          ..write('description: $description, ')
          ..write('syncStatus: $syncStatus, ')
          ..write('lastSyncedAt: $lastSyncedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    topic,
    date,
    location,
    trainerName,
    description,
    syncStatus,
    lastSyncedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is TrainingCacheData &&
          other.id == this.id &&
          other.topic == this.topic &&
          other.date == this.date &&
          other.location == this.location &&
          other.trainerName == this.trainerName &&
          other.description == this.description &&
          other.syncStatus == this.syncStatus &&
          other.lastSyncedAt == this.lastSyncedAt);
}

class TrainingCacheCompanion extends UpdateCompanion<TrainingCacheData> {
  final Value<String> id;
  final Value<String> topic;
  final Value<DateTime?> date;
  final Value<String?> location;
  final Value<String?> trainerName;
  final Value<String?> description;
  final Value<String> syncStatus;
  final Value<DateTime?> lastSyncedAt;
  final Value<int> rowid;
  const TrainingCacheCompanion({
    this.id = const Value.absent(),
    this.topic = const Value.absent(),
    this.date = const Value.absent(),
    this.location = const Value.absent(),
    this.trainerName = const Value.absent(),
    this.description = const Value.absent(),
    this.syncStatus = const Value.absent(),
    this.lastSyncedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  TrainingCacheCompanion.insert({
    required String id,
    required String topic,
    this.date = const Value.absent(),
    this.location = const Value.absent(),
    this.trainerName = const Value.absent(),
    this.description = const Value.absent(),
    this.syncStatus = const Value.absent(),
    this.lastSyncedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       topic = Value(topic);
  static Insertable<TrainingCacheData> custom({
    Expression<String>? id,
    Expression<String>? topic,
    Expression<DateTime>? date,
    Expression<String>? location,
    Expression<String>? trainerName,
    Expression<String>? description,
    Expression<String>? syncStatus,
    Expression<DateTime>? lastSyncedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (topic != null) 'topic': topic,
      if (date != null) 'date': date,
      if (location != null) 'location': location,
      if (trainerName != null) 'trainer_name': trainerName,
      if (description != null) 'description': description,
      if (syncStatus != null) 'sync_status': syncStatus,
      if (lastSyncedAt != null) 'last_synced_at': lastSyncedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  TrainingCacheCompanion copyWith({
    Value<String>? id,
    Value<String>? topic,
    Value<DateTime?>? date,
    Value<String?>? location,
    Value<String?>? trainerName,
    Value<String?>? description,
    Value<String>? syncStatus,
    Value<DateTime?>? lastSyncedAt,
    Value<int>? rowid,
  }) {
    return TrainingCacheCompanion(
      id: id ?? this.id,
      topic: topic ?? this.topic,
      date: date ?? this.date,
      location: location ?? this.location,
      trainerName: trainerName ?? this.trainerName,
      description: description ?? this.description,
      syncStatus: syncStatus ?? this.syncStatus,
      lastSyncedAt: lastSyncedAt ?? this.lastSyncedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (topic.present) {
      map['topic'] = Variable<String>(topic.value);
    }
    if (date.present) {
      map['date'] = Variable<DateTime>(date.value);
    }
    if (location.present) {
      map['location'] = Variable<String>(location.value);
    }
    if (trainerName.present) {
      map['trainer_name'] = Variable<String>(trainerName.value);
    }
    if (description.present) {
      map['description'] = Variable<String>(description.value);
    }
    if (syncStatus.present) {
      map['sync_status'] = Variable<String>(syncStatus.value);
    }
    if (lastSyncedAt.present) {
      map['last_synced_at'] = Variable<DateTime>(lastSyncedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('TrainingCacheCompanion(')
          ..write('id: $id, ')
          ..write('topic: $topic, ')
          ..write('date: $date, ')
          ..write('location: $location, ')
          ..write('trainerName: $trainerName, ')
          ..write('description: $description, ')
          ..write('syncStatus: $syncStatus, ')
          ..write('lastSyncedAt: $lastSyncedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $TrainingAttendanceCacheTable extends TrainingAttendanceCache
    with TableInfo<$TrainingAttendanceCacheTable, TrainingAttendanceCacheData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $TrainingAttendanceCacheTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _trainingIdMeta = const VerificationMeta(
    'trainingId',
  );
  @override
  late final GeneratedColumn<String> trainingId = GeneratedColumn<String>(
    'training_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _farmerIdMeta = const VerificationMeta(
    'farmerId',
  );
  @override
  late final GeneratedColumn<String> farmerId = GeneratedColumn<String>(
    'farmer_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _attendedMeta = const VerificationMeta(
    'attended',
  );
  @override
  late final GeneratedColumn<bool> attended = GeneratedColumn<bool>(
    'attended',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("attended" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  static const VerificationMeta _syncStatusMeta = const VerificationMeta(
    'syncStatus',
  );
  @override
  late final GeneratedColumn<String> syncStatus = GeneratedColumn<String>(
    'sync_status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('pending'),
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    trainingId,
    farmerId,
    attended,
    createdAt,
    syncStatus,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'training_attendance_cache';
  @override
  VerificationContext validateIntegrity(
    Insertable<TrainingAttendanceCacheData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('training_id')) {
      context.handle(
        _trainingIdMeta,
        trainingId.isAcceptableOrUnknown(data['training_id']!, _trainingIdMeta),
      );
    } else if (isInserting) {
      context.missing(_trainingIdMeta);
    }
    if (data.containsKey('farmer_id')) {
      context.handle(
        _farmerIdMeta,
        farmerId.isAcceptableOrUnknown(data['farmer_id']!, _farmerIdMeta),
      );
    } else if (isInserting) {
      context.missing(_farmerIdMeta);
    }
    if (data.containsKey('attended')) {
      context.handle(
        _attendedMeta,
        attended.isAcceptableOrUnknown(data['attended']!, _attendedMeta),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    }
    if (data.containsKey('sync_status')) {
      context.handle(
        _syncStatusMeta,
        syncStatus.isAcceptableOrUnknown(data['sync_status']!, _syncStatusMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  TrainingAttendanceCacheData map(
    Map<String, dynamic> data, {
    String? tablePrefix,
  }) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return TrainingAttendanceCacheData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      trainingId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}training_id'],
      )!,
      farmerId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}farmer_id'],
      )!,
      attended: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}attended'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      syncStatus: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}sync_status'],
      )!,
    );
  }

  @override
  $TrainingAttendanceCacheTable createAlias(String alias) {
    return $TrainingAttendanceCacheTable(attachedDatabase, alias);
  }
}

class TrainingAttendanceCacheData extends DataClass
    implements Insertable<TrainingAttendanceCacheData> {
  final String id;
  final String trainingId;
  final String farmerId;
  final bool attended;
  final DateTime createdAt;
  final String syncStatus;
  const TrainingAttendanceCacheData({
    required this.id,
    required this.trainingId,
    required this.farmerId,
    required this.attended,
    required this.createdAt,
    required this.syncStatus,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['training_id'] = Variable<String>(trainingId);
    map['farmer_id'] = Variable<String>(farmerId);
    map['attended'] = Variable<bool>(attended);
    map['created_at'] = Variable<DateTime>(createdAt);
    map['sync_status'] = Variable<String>(syncStatus);
    return map;
  }

  TrainingAttendanceCacheCompanion toCompanion(bool nullToAbsent) {
    return TrainingAttendanceCacheCompanion(
      id: Value(id),
      trainingId: Value(trainingId),
      farmerId: Value(farmerId),
      attended: Value(attended),
      createdAt: Value(createdAt),
      syncStatus: Value(syncStatus),
    );
  }

  factory TrainingAttendanceCacheData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return TrainingAttendanceCacheData(
      id: serializer.fromJson<String>(json['id']),
      trainingId: serializer.fromJson<String>(json['trainingId']),
      farmerId: serializer.fromJson<String>(json['farmerId']),
      attended: serializer.fromJson<bool>(json['attended']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      syncStatus: serializer.fromJson<String>(json['syncStatus']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'trainingId': serializer.toJson<String>(trainingId),
      'farmerId': serializer.toJson<String>(farmerId),
      'attended': serializer.toJson<bool>(attended),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'syncStatus': serializer.toJson<String>(syncStatus),
    };
  }

  TrainingAttendanceCacheData copyWith({
    String? id,
    String? trainingId,
    String? farmerId,
    bool? attended,
    DateTime? createdAt,
    String? syncStatus,
  }) => TrainingAttendanceCacheData(
    id: id ?? this.id,
    trainingId: trainingId ?? this.trainingId,
    farmerId: farmerId ?? this.farmerId,
    attended: attended ?? this.attended,
    createdAt: createdAt ?? this.createdAt,
    syncStatus: syncStatus ?? this.syncStatus,
  );
  TrainingAttendanceCacheData copyWithCompanion(
    TrainingAttendanceCacheCompanion data,
  ) {
    return TrainingAttendanceCacheData(
      id: data.id.present ? data.id.value : this.id,
      trainingId: data.trainingId.present
          ? data.trainingId.value
          : this.trainingId,
      farmerId: data.farmerId.present ? data.farmerId.value : this.farmerId,
      attended: data.attended.present ? data.attended.value : this.attended,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      syncStatus: data.syncStatus.present
          ? data.syncStatus.value
          : this.syncStatus,
    );
  }

  @override
  String toString() {
    return (StringBuffer('TrainingAttendanceCacheData(')
          ..write('id: $id, ')
          ..write('trainingId: $trainingId, ')
          ..write('farmerId: $farmerId, ')
          ..write('attended: $attended, ')
          ..write('createdAt: $createdAt, ')
          ..write('syncStatus: $syncStatus')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(id, trainingId, farmerId, attended, createdAt, syncStatus);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is TrainingAttendanceCacheData &&
          other.id == this.id &&
          other.trainingId == this.trainingId &&
          other.farmerId == this.farmerId &&
          other.attended == this.attended &&
          other.createdAt == this.createdAt &&
          other.syncStatus == this.syncStatus);
}

class TrainingAttendanceCacheCompanion
    extends UpdateCompanion<TrainingAttendanceCacheData> {
  final Value<String> id;
  final Value<String> trainingId;
  final Value<String> farmerId;
  final Value<bool> attended;
  final Value<DateTime> createdAt;
  final Value<String> syncStatus;
  final Value<int> rowid;
  const TrainingAttendanceCacheCompanion({
    this.id = const Value.absent(),
    this.trainingId = const Value.absent(),
    this.farmerId = const Value.absent(),
    this.attended = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.syncStatus = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  TrainingAttendanceCacheCompanion.insert({
    required String id,
    required String trainingId,
    required String farmerId,
    this.attended = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.syncStatus = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       trainingId = Value(trainingId),
       farmerId = Value(farmerId);
  static Insertable<TrainingAttendanceCacheData> custom({
    Expression<String>? id,
    Expression<String>? trainingId,
    Expression<String>? farmerId,
    Expression<bool>? attended,
    Expression<DateTime>? createdAt,
    Expression<String>? syncStatus,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (trainingId != null) 'training_id': trainingId,
      if (farmerId != null) 'farmer_id': farmerId,
      if (attended != null) 'attended': attended,
      if (createdAt != null) 'created_at': createdAt,
      if (syncStatus != null) 'sync_status': syncStatus,
      if (rowid != null) 'rowid': rowid,
    });
  }

  TrainingAttendanceCacheCompanion copyWith({
    Value<String>? id,
    Value<String>? trainingId,
    Value<String>? farmerId,
    Value<bool>? attended,
    Value<DateTime>? createdAt,
    Value<String>? syncStatus,
    Value<int>? rowid,
  }) {
    return TrainingAttendanceCacheCompanion(
      id: id ?? this.id,
      trainingId: trainingId ?? this.trainingId,
      farmerId: farmerId ?? this.farmerId,
      attended: attended ?? this.attended,
      createdAt: createdAt ?? this.createdAt,
      syncStatus: syncStatus ?? this.syncStatus,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (trainingId.present) {
      map['training_id'] = Variable<String>(trainingId.value);
    }
    if (farmerId.present) {
      map['farmer_id'] = Variable<String>(farmerId.value);
    }
    if (attended.present) {
      map['attended'] = Variable<bool>(attended.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (syncStatus.present) {
      map['sync_status'] = Variable<String>(syncStatus.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('TrainingAttendanceCacheCompanion(')
          ..write('id: $id, ')
          ..write('trainingId: $trainingId, ')
          ..write('farmerId: $farmerId, ')
          ..write('attended: $attended, ')
          ..write('createdAt: $createdAt, ')
          ..write('syncStatus: $syncStatus, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $FarmVisitCacheTable extends FarmVisitCache
    with TableInfo<$FarmVisitCacheTable, FarmVisitCacheData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $FarmVisitCacheTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _farmerIdMeta = const VerificationMeta(
    'farmerId',
  );
  @override
  late final GeneratedColumn<String> farmerId = GeneratedColumn<String>(
    'farmer_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _visitDateMeta = const VerificationMeta(
    'visitDate',
  );
  @override
  late final GeneratedColumn<DateTime> visitDate = GeneratedColumn<DateTime>(
    'visit_date',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _topicMeta = const VerificationMeta('topic');
  @override
  late final GeneratedColumn<String> topic = GeneratedColumn<String>(
    'topic',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _observationsMeta = const VerificationMeta(
    'observations',
  );
  @override
  late final GeneratedColumn<String> observations = GeneratedColumn<String>(
    'observations',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _recommendationsMeta = const VerificationMeta(
    'recommendations',
  );
  @override
  late final GeneratedColumn<String> recommendations = GeneratedColumn<String>(
    'recommendations',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
    'status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('SCHEDULED'),
  );
  static const VerificationMeta _latitudeMeta = const VerificationMeta(
    'latitude',
  );
  @override
  late final GeneratedColumn<double> latitude = GeneratedColumn<double>(
    'latitude',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _longitudeMeta = const VerificationMeta(
    'longitude',
  );
  @override
  late final GeneratedColumn<double> longitude = GeneratedColumn<double>(
    'longitude',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _syncStatusMeta = const VerificationMeta(
    'syncStatus',
  );
  @override
  late final GeneratedColumn<String> syncStatus = GeneratedColumn<String>(
    'sync_status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('pending'),
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    farmerId,
    visitDate,
    topic,
    observations,
    recommendations,
    status,
    latitude,
    longitude,
    syncStatus,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'farm_visit_cache';
  @override
  VerificationContext validateIntegrity(
    Insertable<FarmVisitCacheData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('farmer_id')) {
      context.handle(
        _farmerIdMeta,
        farmerId.isAcceptableOrUnknown(data['farmer_id']!, _farmerIdMeta),
      );
    } else if (isInserting) {
      context.missing(_farmerIdMeta);
    }
    if (data.containsKey('visit_date')) {
      context.handle(
        _visitDateMeta,
        visitDate.isAcceptableOrUnknown(data['visit_date']!, _visitDateMeta),
      );
    } else if (isInserting) {
      context.missing(_visitDateMeta);
    }
    if (data.containsKey('topic')) {
      context.handle(
        _topicMeta,
        topic.isAcceptableOrUnknown(data['topic']!, _topicMeta),
      );
    } else if (isInserting) {
      context.missing(_topicMeta);
    }
    if (data.containsKey('observations')) {
      context.handle(
        _observationsMeta,
        observations.isAcceptableOrUnknown(
          data['observations']!,
          _observationsMeta,
        ),
      );
    }
    if (data.containsKey('recommendations')) {
      context.handle(
        _recommendationsMeta,
        recommendations.isAcceptableOrUnknown(
          data['recommendations']!,
          _recommendationsMeta,
        ),
      );
    }
    if (data.containsKey('status')) {
      context.handle(
        _statusMeta,
        status.isAcceptableOrUnknown(data['status']!, _statusMeta),
      );
    }
    if (data.containsKey('latitude')) {
      context.handle(
        _latitudeMeta,
        latitude.isAcceptableOrUnknown(data['latitude']!, _latitudeMeta),
      );
    }
    if (data.containsKey('longitude')) {
      context.handle(
        _longitudeMeta,
        longitude.isAcceptableOrUnknown(data['longitude']!, _longitudeMeta),
      );
    }
    if (data.containsKey('sync_status')) {
      context.handle(
        _syncStatusMeta,
        syncStatus.isAcceptableOrUnknown(data['sync_status']!, _syncStatusMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  FarmVisitCacheData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return FarmVisitCacheData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      farmerId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}farmer_id'],
      )!,
      visitDate: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}visit_date'],
      )!,
      topic: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}topic'],
      )!,
      observations: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}observations'],
      ),
      recommendations: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}recommendations'],
      ),
      status: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}status'],
      )!,
      latitude: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}latitude'],
      ),
      longitude: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}longitude'],
      ),
      syncStatus: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}sync_status'],
      )!,
    );
  }

  @override
  $FarmVisitCacheTable createAlias(String alias) {
    return $FarmVisitCacheTable(attachedDatabase, alias);
  }
}

class FarmVisitCacheData extends DataClass
    implements Insertable<FarmVisitCacheData> {
  final String id;
  final String farmerId;
  final DateTime visitDate;
  final String topic;
  final String? observations;
  final String? recommendations;
  final String status;
  final double? latitude;
  final double? longitude;
  final String syncStatus;
  const FarmVisitCacheData({
    required this.id,
    required this.farmerId,
    required this.visitDate,
    required this.topic,
    this.observations,
    this.recommendations,
    required this.status,
    this.latitude,
    this.longitude,
    required this.syncStatus,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['farmer_id'] = Variable<String>(farmerId);
    map['visit_date'] = Variable<DateTime>(visitDate);
    map['topic'] = Variable<String>(topic);
    if (!nullToAbsent || observations != null) {
      map['observations'] = Variable<String>(observations);
    }
    if (!nullToAbsent || recommendations != null) {
      map['recommendations'] = Variable<String>(recommendations);
    }
    map['status'] = Variable<String>(status);
    if (!nullToAbsent || latitude != null) {
      map['latitude'] = Variable<double>(latitude);
    }
    if (!nullToAbsent || longitude != null) {
      map['longitude'] = Variable<double>(longitude);
    }
    map['sync_status'] = Variable<String>(syncStatus);
    return map;
  }

  FarmVisitCacheCompanion toCompanion(bool nullToAbsent) {
    return FarmVisitCacheCompanion(
      id: Value(id),
      farmerId: Value(farmerId),
      visitDate: Value(visitDate),
      topic: Value(topic),
      observations: observations == null && nullToAbsent
          ? const Value.absent()
          : Value(observations),
      recommendations: recommendations == null && nullToAbsent
          ? const Value.absent()
          : Value(recommendations),
      status: Value(status),
      latitude: latitude == null && nullToAbsent
          ? const Value.absent()
          : Value(latitude),
      longitude: longitude == null && nullToAbsent
          ? const Value.absent()
          : Value(longitude),
      syncStatus: Value(syncStatus),
    );
  }

  factory FarmVisitCacheData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return FarmVisitCacheData(
      id: serializer.fromJson<String>(json['id']),
      farmerId: serializer.fromJson<String>(json['farmerId']),
      visitDate: serializer.fromJson<DateTime>(json['visitDate']),
      topic: serializer.fromJson<String>(json['topic']),
      observations: serializer.fromJson<String?>(json['observations']),
      recommendations: serializer.fromJson<String?>(json['recommendations']),
      status: serializer.fromJson<String>(json['status']),
      latitude: serializer.fromJson<double?>(json['latitude']),
      longitude: serializer.fromJson<double?>(json['longitude']),
      syncStatus: serializer.fromJson<String>(json['syncStatus']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'farmerId': serializer.toJson<String>(farmerId),
      'visitDate': serializer.toJson<DateTime>(visitDate),
      'topic': serializer.toJson<String>(topic),
      'observations': serializer.toJson<String?>(observations),
      'recommendations': serializer.toJson<String?>(recommendations),
      'status': serializer.toJson<String>(status),
      'latitude': serializer.toJson<double?>(latitude),
      'longitude': serializer.toJson<double?>(longitude),
      'syncStatus': serializer.toJson<String>(syncStatus),
    };
  }

  FarmVisitCacheData copyWith({
    String? id,
    String? farmerId,
    DateTime? visitDate,
    String? topic,
    Value<String?> observations = const Value.absent(),
    Value<String?> recommendations = const Value.absent(),
    String? status,
    Value<double?> latitude = const Value.absent(),
    Value<double?> longitude = const Value.absent(),
    String? syncStatus,
  }) => FarmVisitCacheData(
    id: id ?? this.id,
    farmerId: farmerId ?? this.farmerId,
    visitDate: visitDate ?? this.visitDate,
    topic: topic ?? this.topic,
    observations: observations.present ? observations.value : this.observations,
    recommendations: recommendations.present
        ? recommendations.value
        : this.recommendations,
    status: status ?? this.status,
    latitude: latitude.present ? latitude.value : this.latitude,
    longitude: longitude.present ? longitude.value : this.longitude,
    syncStatus: syncStatus ?? this.syncStatus,
  );
  FarmVisitCacheData copyWithCompanion(FarmVisitCacheCompanion data) {
    return FarmVisitCacheData(
      id: data.id.present ? data.id.value : this.id,
      farmerId: data.farmerId.present ? data.farmerId.value : this.farmerId,
      visitDate: data.visitDate.present ? data.visitDate.value : this.visitDate,
      topic: data.topic.present ? data.topic.value : this.topic,
      observations: data.observations.present
          ? data.observations.value
          : this.observations,
      recommendations: data.recommendations.present
          ? data.recommendations.value
          : this.recommendations,
      status: data.status.present ? data.status.value : this.status,
      latitude: data.latitude.present ? data.latitude.value : this.latitude,
      longitude: data.longitude.present ? data.longitude.value : this.longitude,
      syncStatus: data.syncStatus.present
          ? data.syncStatus.value
          : this.syncStatus,
    );
  }

  @override
  String toString() {
    return (StringBuffer('FarmVisitCacheData(')
          ..write('id: $id, ')
          ..write('farmerId: $farmerId, ')
          ..write('visitDate: $visitDate, ')
          ..write('topic: $topic, ')
          ..write('observations: $observations, ')
          ..write('recommendations: $recommendations, ')
          ..write('status: $status, ')
          ..write('latitude: $latitude, ')
          ..write('longitude: $longitude, ')
          ..write('syncStatus: $syncStatus')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    farmerId,
    visitDate,
    topic,
    observations,
    recommendations,
    status,
    latitude,
    longitude,
    syncStatus,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is FarmVisitCacheData &&
          other.id == this.id &&
          other.farmerId == this.farmerId &&
          other.visitDate == this.visitDate &&
          other.topic == this.topic &&
          other.observations == this.observations &&
          other.recommendations == this.recommendations &&
          other.status == this.status &&
          other.latitude == this.latitude &&
          other.longitude == this.longitude &&
          other.syncStatus == this.syncStatus);
}

class FarmVisitCacheCompanion extends UpdateCompanion<FarmVisitCacheData> {
  final Value<String> id;
  final Value<String> farmerId;
  final Value<DateTime> visitDate;
  final Value<String> topic;
  final Value<String?> observations;
  final Value<String?> recommendations;
  final Value<String> status;
  final Value<double?> latitude;
  final Value<double?> longitude;
  final Value<String> syncStatus;
  final Value<int> rowid;
  const FarmVisitCacheCompanion({
    this.id = const Value.absent(),
    this.farmerId = const Value.absent(),
    this.visitDate = const Value.absent(),
    this.topic = const Value.absent(),
    this.observations = const Value.absent(),
    this.recommendations = const Value.absent(),
    this.status = const Value.absent(),
    this.latitude = const Value.absent(),
    this.longitude = const Value.absent(),
    this.syncStatus = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  FarmVisitCacheCompanion.insert({
    required String id,
    required String farmerId,
    required DateTime visitDate,
    required String topic,
    this.observations = const Value.absent(),
    this.recommendations = const Value.absent(),
    this.status = const Value.absent(),
    this.latitude = const Value.absent(),
    this.longitude = const Value.absent(),
    this.syncStatus = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       farmerId = Value(farmerId),
       visitDate = Value(visitDate),
       topic = Value(topic);
  static Insertable<FarmVisitCacheData> custom({
    Expression<String>? id,
    Expression<String>? farmerId,
    Expression<DateTime>? visitDate,
    Expression<String>? topic,
    Expression<String>? observations,
    Expression<String>? recommendations,
    Expression<String>? status,
    Expression<double>? latitude,
    Expression<double>? longitude,
    Expression<String>? syncStatus,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (farmerId != null) 'farmer_id': farmerId,
      if (visitDate != null) 'visit_date': visitDate,
      if (topic != null) 'topic': topic,
      if (observations != null) 'observations': observations,
      if (recommendations != null) 'recommendations': recommendations,
      if (status != null) 'status': status,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (syncStatus != null) 'sync_status': syncStatus,
      if (rowid != null) 'rowid': rowid,
    });
  }

  FarmVisitCacheCompanion copyWith({
    Value<String>? id,
    Value<String>? farmerId,
    Value<DateTime>? visitDate,
    Value<String>? topic,
    Value<String?>? observations,
    Value<String?>? recommendations,
    Value<String>? status,
    Value<double?>? latitude,
    Value<double?>? longitude,
    Value<String>? syncStatus,
    Value<int>? rowid,
  }) {
    return FarmVisitCacheCompanion(
      id: id ?? this.id,
      farmerId: farmerId ?? this.farmerId,
      visitDate: visitDate ?? this.visitDate,
      topic: topic ?? this.topic,
      observations: observations ?? this.observations,
      recommendations: recommendations ?? this.recommendations,
      status: status ?? this.status,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      syncStatus: syncStatus ?? this.syncStatus,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (farmerId.present) {
      map['farmer_id'] = Variable<String>(farmerId.value);
    }
    if (visitDate.present) {
      map['visit_date'] = Variable<DateTime>(visitDate.value);
    }
    if (topic.present) {
      map['topic'] = Variable<String>(topic.value);
    }
    if (observations.present) {
      map['observations'] = Variable<String>(observations.value);
    }
    if (recommendations.present) {
      map['recommendations'] = Variable<String>(recommendations.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (latitude.present) {
      map['latitude'] = Variable<double>(latitude.value);
    }
    if (longitude.present) {
      map['longitude'] = Variable<double>(longitude.value);
    }
    if (syncStatus.present) {
      map['sync_status'] = Variable<String>(syncStatus.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('FarmVisitCacheCompanion(')
          ..write('id: $id, ')
          ..write('farmerId: $farmerId, ')
          ..write('visitDate: $visitDate, ')
          ..write('topic: $topic, ')
          ..write('observations: $observations, ')
          ..write('recommendations: $recommendations, ')
          ..write('status: $status, ')
          ..write('latitude: $latitude, ')
          ..write('longitude: $longitude, ')
          ..write('syncStatus: $syncStatus, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $SaleCacheTable extends SaleCache
    with TableInfo<$SaleCacheTable, SaleCacheData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SaleCacheTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _farmerIdMeta = const VerificationMeta(
    'farmerId',
  );
  @override
  late final GeneratedColumn<String> farmerId = GeneratedColumn<String>(
    'farmer_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _productMeta = const VerificationMeta(
    'product',
  );
  @override
  late final GeneratedColumn<String> product = GeneratedColumn<String>(
    'product',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _categoryMeta = const VerificationMeta(
    'category',
  );
  @override
  late final GeneratedColumn<String> category = GeneratedColumn<String>(
    'category',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('PRODUCE'),
  );
  static const VerificationMeta _quantityMeta = const VerificationMeta(
    'quantity',
  );
  @override
  late final GeneratedColumn<String> quantity = GeneratedColumn<String>(
    'quantity',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _unitPriceMeta = const VerificationMeta(
    'unitPrice',
  );
  @override
  late final GeneratedColumn<double> unitPrice = GeneratedColumn<double>(
    'unit_price',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _totalAmountMeta = const VerificationMeta(
    'totalAmount',
  );
  @override
  late final GeneratedColumn<double> totalAmount = GeneratedColumn<double>(
    'total_amount',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _chargesMeta = const VerificationMeta(
    'charges',
  );
  @override
  late final GeneratedColumn<double> charges = GeneratedColumn<double>(
    'charges',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _taxAmountMeta = const VerificationMeta(
    'taxAmount',
  );
  @override
  late final GeneratedColumn<double> taxAmount = GeneratedColumn<double>(
    'tax_amount',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _netAmountMeta = const VerificationMeta(
    'netAmount',
  );
  @override
  late final GeneratedColumn<double> netAmount = GeneratedColumn<double>(
    'net_amount',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
    'status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('COMPLETED'),
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  static const VerificationMeta _syncStatusMeta = const VerificationMeta(
    'syncStatus',
  );
  @override
  late final GeneratedColumn<String> syncStatus = GeneratedColumn<String>(
    'sync_status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('pending'),
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    farmerId,
    product,
    category,
    quantity,
    unitPrice,
    totalAmount,
    charges,
    taxAmount,
    netAmount,
    status,
    createdAt,
    syncStatus,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'sale_cache';
  @override
  VerificationContext validateIntegrity(
    Insertable<SaleCacheData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('farmer_id')) {
      context.handle(
        _farmerIdMeta,
        farmerId.isAcceptableOrUnknown(data['farmer_id']!, _farmerIdMeta),
      );
    }
    if (data.containsKey('product')) {
      context.handle(
        _productMeta,
        product.isAcceptableOrUnknown(data['product']!, _productMeta),
      );
    } else if (isInserting) {
      context.missing(_productMeta);
    }
    if (data.containsKey('category')) {
      context.handle(
        _categoryMeta,
        category.isAcceptableOrUnknown(data['category']!, _categoryMeta),
      );
    }
    if (data.containsKey('quantity')) {
      context.handle(
        _quantityMeta,
        quantity.isAcceptableOrUnknown(data['quantity']!, _quantityMeta),
      );
    } else if (isInserting) {
      context.missing(_quantityMeta);
    }
    if (data.containsKey('unit_price')) {
      context.handle(
        _unitPriceMeta,
        unitPrice.isAcceptableOrUnknown(data['unit_price']!, _unitPriceMeta),
      );
    }
    if (data.containsKey('total_amount')) {
      context.handle(
        _totalAmountMeta,
        totalAmount.isAcceptableOrUnknown(
          data['total_amount']!,
          _totalAmountMeta,
        ),
      );
    }
    if (data.containsKey('charges')) {
      context.handle(
        _chargesMeta,
        charges.isAcceptableOrUnknown(data['charges']!, _chargesMeta),
      );
    }
    if (data.containsKey('tax_amount')) {
      context.handle(
        _taxAmountMeta,
        taxAmount.isAcceptableOrUnknown(data['tax_amount']!, _taxAmountMeta),
      );
    }
    if (data.containsKey('net_amount')) {
      context.handle(
        _netAmountMeta,
        netAmount.isAcceptableOrUnknown(data['net_amount']!, _netAmountMeta),
      );
    }
    if (data.containsKey('status')) {
      context.handle(
        _statusMeta,
        status.isAcceptableOrUnknown(data['status']!, _statusMeta),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    }
    if (data.containsKey('sync_status')) {
      context.handle(
        _syncStatusMeta,
        syncStatus.isAcceptableOrUnknown(data['sync_status']!, _syncStatusMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  SaleCacheData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return SaleCacheData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      farmerId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}farmer_id'],
      ),
      product: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}product'],
      )!,
      category: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}category'],
      )!,
      quantity: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}quantity'],
      )!,
      unitPrice: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}unit_price'],
      ),
      totalAmount: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}total_amount'],
      ),
      charges: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}charges'],
      ),
      taxAmount: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}tax_amount'],
      ),
      netAmount: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}net_amount'],
      ),
      status: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}status'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      syncStatus: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}sync_status'],
      )!,
    );
  }

  @override
  $SaleCacheTable createAlias(String alias) {
    return $SaleCacheTable(attachedDatabase, alias);
  }
}

class SaleCacheData extends DataClass implements Insertable<SaleCacheData> {
  final String id;
  final String? farmerId;
  final String product;
  final String category;
  final String quantity;
  final double? unitPrice;
  final double? totalAmount;
  final double? charges;
  final double? taxAmount;
  final double? netAmount;
  final String status;
  final DateTime createdAt;
  final String syncStatus;
  const SaleCacheData({
    required this.id,
    this.farmerId,
    required this.product,
    required this.category,
    required this.quantity,
    this.unitPrice,
    this.totalAmount,
    this.charges,
    this.taxAmount,
    this.netAmount,
    required this.status,
    required this.createdAt,
    required this.syncStatus,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    if (!nullToAbsent || farmerId != null) {
      map['farmer_id'] = Variable<String>(farmerId);
    }
    map['product'] = Variable<String>(product);
    map['category'] = Variable<String>(category);
    map['quantity'] = Variable<String>(quantity);
    if (!nullToAbsent || unitPrice != null) {
      map['unit_price'] = Variable<double>(unitPrice);
    }
    if (!nullToAbsent || totalAmount != null) {
      map['total_amount'] = Variable<double>(totalAmount);
    }
    if (!nullToAbsent || charges != null) {
      map['charges'] = Variable<double>(charges);
    }
    if (!nullToAbsent || taxAmount != null) {
      map['tax_amount'] = Variable<double>(taxAmount);
    }
    if (!nullToAbsent || netAmount != null) {
      map['net_amount'] = Variable<double>(netAmount);
    }
    map['status'] = Variable<String>(status);
    map['created_at'] = Variable<DateTime>(createdAt);
    map['sync_status'] = Variable<String>(syncStatus);
    return map;
  }

  SaleCacheCompanion toCompanion(bool nullToAbsent) {
    return SaleCacheCompanion(
      id: Value(id),
      farmerId: farmerId == null && nullToAbsent
          ? const Value.absent()
          : Value(farmerId),
      product: Value(product),
      category: Value(category),
      quantity: Value(quantity),
      unitPrice: unitPrice == null && nullToAbsent
          ? const Value.absent()
          : Value(unitPrice),
      totalAmount: totalAmount == null && nullToAbsent
          ? const Value.absent()
          : Value(totalAmount),
      charges: charges == null && nullToAbsent
          ? const Value.absent()
          : Value(charges),
      taxAmount: taxAmount == null && nullToAbsent
          ? const Value.absent()
          : Value(taxAmount),
      netAmount: netAmount == null && nullToAbsent
          ? const Value.absent()
          : Value(netAmount),
      status: Value(status),
      createdAt: Value(createdAt),
      syncStatus: Value(syncStatus),
    );
  }

  factory SaleCacheData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return SaleCacheData(
      id: serializer.fromJson<String>(json['id']),
      farmerId: serializer.fromJson<String?>(json['farmerId']),
      product: serializer.fromJson<String>(json['product']),
      category: serializer.fromJson<String>(json['category']),
      quantity: serializer.fromJson<String>(json['quantity']),
      unitPrice: serializer.fromJson<double?>(json['unitPrice']),
      totalAmount: serializer.fromJson<double?>(json['totalAmount']),
      charges: serializer.fromJson<double?>(json['charges']),
      taxAmount: serializer.fromJson<double?>(json['taxAmount']),
      netAmount: serializer.fromJson<double?>(json['netAmount']),
      status: serializer.fromJson<String>(json['status']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      syncStatus: serializer.fromJson<String>(json['syncStatus']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'farmerId': serializer.toJson<String?>(farmerId),
      'product': serializer.toJson<String>(product),
      'category': serializer.toJson<String>(category),
      'quantity': serializer.toJson<String>(quantity),
      'unitPrice': serializer.toJson<double?>(unitPrice),
      'totalAmount': serializer.toJson<double?>(totalAmount),
      'charges': serializer.toJson<double?>(charges),
      'taxAmount': serializer.toJson<double?>(taxAmount),
      'netAmount': serializer.toJson<double?>(netAmount),
      'status': serializer.toJson<String>(status),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'syncStatus': serializer.toJson<String>(syncStatus),
    };
  }

  SaleCacheData copyWith({
    String? id,
    Value<String?> farmerId = const Value.absent(),
    String? product,
    String? category,
    String? quantity,
    Value<double?> unitPrice = const Value.absent(),
    Value<double?> totalAmount = const Value.absent(),
    Value<double?> charges = const Value.absent(),
    Value<double?> taxAmount = const Value.absent(),
    Value<double?> netAmount = const Value.absent(),
    String? status,
    DateTime? createdAt,
    String? syncStatus,
  }) => SaleCacheData(
    id: id ?? this.id,
    farmerId: farmerId.present ? farmerId.value : this.farmerId,
    product: product ?? this.product,
    category: category ?? this.category,
    quantity: quantity ?? this.quantity,
    unitPrice: unitPrice.present ? unitPrice.value : this.unitPrice,
    totalAmount: totalAmount.present ? totalAmount.value : this.totalAmount,
    charges: charges.present ? charges.value : this.charges,
    taxAmount: taxAmount.present ? taxAmount.value : this.taxAmount,
    netAmount: netAmount.present ? netAmount.value : this.netAmount,
    status: status ?? this.status,
    createdAt: createdAt ?? this.createdAt,
    syncStatus: syncStatus ?? this.syncStatus,
  );
  SaleCacheData copyWithCompanion(SaleCacheCompanion data) {
    return SaleCacheData(
      id: data.id.present ? data.id.value : this.id,
      farmerId: data.farmerId.present ? data.farmerId.value : this.farmerId,
      product: data.product.present ? data.product.value : this.product,
      category: data.category.present ? data.category.value : this.category,
      quantity: data.quantity.present ? data.quantity.value : this.quantity,
      unitPrice: data.unitPrice.present ? data.unitPrice.value : this.unitPrice,
      totalAmount: data.totalAmount.present
          ? data.totalAmount.value
          : this.totalAmount,
      charges: data.charges.present ? data.charges.value : this.charges,
      taxAmount: data.taxAmount.present ? data.taxAmount.value : this.taxAmount,
      netAmount: data.netAmount.present ? data.netAmount.value : this.netAmount,
      status: data.status.present ? data.status.value : this.status,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      syncStatus: data.syncStatus.present
          ? data.syncStatus.value
          : this.syncStatus,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SaleCacheData(')
          ..write('id: $id, ')
          ..write('farmerId: $farmerId, ')
          ..write('product: $product, ')
          ..write('category: $category, ')
          ..write('quantity: $quantity, ')
          ..write('unitPrice: $unitPrice, ')
          ..write('totalAmount: $totalAmount, ')
          ..write('charges: $charges, ')
          ..write('taxAmount: $taxAmount, ')
          ..write('netAmount: $netAmount, ')
          ..write('status: $status, ')
          ..write('createdAt: $createdAt, ')
          ..write('syncStatus: $syncStatus')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    farmerId,
    product,
    category,
    quantity,
    unitPrice,
    totalAmount,
    charges,
    taxAmount,
    netAmount,
    status,
    createdAt,
    syncStatus,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SaleCacheData &&
          other.id == this.id &&
          other.farmerId == this.farmerId &&
          other.product == this.product &&
          other.category == this.category &&
          other.quantity == this.quantity &&
          other.unitPrice == this.unitPrice &&
          other.totalAmount == this.totalAmount &&
          other.charges == this.charges &&
          other.taxAmount == this.taxAmount &&
          other.netAmount == this.netAmount &&
          other.status == this.status &&
          other.createdAt == this.createdAt &&
          other.syncStatus == this.syncStatus);
}

class SaleCacheCompanion extends UpdateCompanion<SaleCacheData> {
  final Value<String> id;
  final Value<String?> farmerId;
  final Value<String> product;
  final Value<String> category;
  final Value<String> quantity;
  final Value<double?> unitPrice;
  final Value<double?> totalAmount;
  final Value<double?> charges;
  final Value<double?> taxAmount;
  final Value<double?> netAmount;
  final Value<String> status;
  final Value<DateTime> createdAt;
  final Value<String> syncStatus;
  final Value<int> rowid;
  const SaleCacheCompanion({
    this.id = const Value.absent(),
    this.farmerId = const Value.absent(),
    this.product = const Value.absent(),
    this.category = const Value.absent(),
    this.quantity = const Value.absent(),
    this.unitPrice = const Value.absent(),
    this.totalAmount = const Value.absent(),
    this.charges = const Value.absent(),
    this.taxAmount = const Value.absent(),
    this.netAmount = const Value.absent(),
    this.status = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.syncStatus = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  SaleCacheCompanion.insert({
    required String id,
    this.farmerId = const Value.absent(),
    required String product,
    this.category = const Value.absent(),
    required String quantity,
    this.unitPrice = const Value.absent(),
    this.totalAmount = const Value.absent(),
    this.charges = const Value.absent(),
    this.taxAmount = const Value.absent(),
    this.netAmount = const Value.absent(),
    this.status = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.syncStatus = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       product = Value(product),
       quantity = Value(quantity);
  static Insertable<SaleCacheData> custom({
    Expression<String>? id,
    Expression<String>? farmerId,
    Expression<String>? product,
    Expression<String>? category,
    Expression<String>? quantity,
    Expression<double>? unitPrice,
    Expression<double>? totalAmount,
    Expression<double>? charges,
    Expression<double>? taxAmount,
    Expression<double>? netAmount,
    Expression<String>? status,
    Expression<DateTime>? createdAt,
    Expression<String>? syncStatus,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (farmerId != null) 'farmer_id': farmerId,
      if (product != null) 'product': product,
      if (category != null) 'category': category,
      if (quantity != null) 'quantity': quantity,
      if (unitPrice != null) 'unit_price': unitPrice,
      if (totalAmount != null) 'total_amount': totalAmount,
      if (charges != null) 'charges': charges,
      if (taxAmount != null) 'tax_amount': taxAmount,
      if (netAmount != null) 'net_amount': netAmount,
      if (status != null) 'status': status,
      if (createdAt != null) 'created_at': createdAt,
      if (syncStatus != null) 'sync_status': syncStatus,
      if (rowid != null) 'rowid': rowid,
    });
  }

  SaleCacheCompanion copyWith({
    Value<String>? id,
    Value<String?>? farmerId,
    Value<String>? product,
    Value<String>? category,
    Value<String>? quantity,
    Value<double?>? unitPrice,
    Value<double?>? totalAmount,
    Value<double?>? charges,
    Value<double?>? taxAmount,
    Value<double?>? netAmount,
    Value<String>? status,
    Value<DateTime>? createdAt,
    Value<String>? syncStatus,
    Value<int>? rowid,
  }) {
    return SaleCacheCompanion(
      id: id ?? this.id,
      farmerId: farmerId ?? this.farmerId,
      product: product ?? this.product,
      category: category ?? this.category,
      quantity: quantity ?? this.quantity,
      unitPrice: unitPrice ?? this.unitPrice,
      totalAmount: totalAmount ?? this.totalAmount,
      charges: charges ?? this.charges,
      taxAmount: taxAmount ?? this.taxAmount,
      netAmount: netAmount ?? this.netAmount,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      syncStatus: syncStatus ?? this.syncStatus,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (farmerId.present) {
      map['farmer_id'] = Variable<String>(farmerId.value);
    }
    if (product.present) {
      map['product'] = Variable<String>(product.value);
    }
    if (category.present) {
      map['category'] = Variable<String>(category.value);
    }
    if (quantity.present) {
      map['quantity'] = Variable<String>(quantity.value);
    }
    if (unitPrice.present) {
      map['unit_price'] = Variable<double>(unitPrice.value);
    }
    if (totalAmount.present) {
      map['total_amount'] = Variable<double>(totalAmount.value);
    }
    if (charges.present) {
      map['charges'] = Variable<double>(charges.value);
    }
    if (taxAmount.present) {
      map['tax_amount'] = Variable<double>(taxAmount.value);
    }
    if (netAmount.present) {
      map['net_amount'] = Variable<double>(netAmount.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (syncStatus.present) {
      map['sync_status'] = Variable<String>(syncStatus.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SaleCacheCompanion(')
          ..write('id: $id, ')
          ..write('farmerId: $farmerId, ')
          ..write('product: $product, ')
          ..write('category: $category, ')
          ..write('quantity: $quantity, ')
          ..write('unitPrice: $unitPrice, ')
          ..write('totalAmount: $totalAmount, ')
          ..write('charges: $charges, ')
          ..write('taxAmount: $taxAmount, ')
          ..write('netAmount: $netAmount, ')
          ..write('status: $status, ')
          ..write('createdAt: $createdAt, ')
          ..write('syncStatus: $syncStatus, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $CropStageEventCacheTable extends CropStageEventCache
    with TableInfo<$CropStageEventCacheTable, CropStageEventCacheData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CropStageEventCacheTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _cultivationIdMeta = const VerificationMeta(
    'cultivationId',
  );
  @override
  late final GeneratedColumn<String> cultivationId = GeneratedColumn<String>(
    'cultivation_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _cropVerticalMeta = const VerificationMeta(
    'cropVertical',
  );
  @override
  late final GeneratedColumn<String> cropVertical = GeneratedColumn<String>(
    'crop_vertical',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _stageNumberMeta = const VerificationMeta(
    'stageNumber',
  );
  @override
  late final GeneratedColumn<int> stageNumber = GeneratedColumn<int>(
    'stage_number',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _stageNameMeta = const VerificationMeta(
    'stageName',
  );
  @override
  late final GeneratedColumn<String> stageName = GeneratedColumn<String>(
    'stage_name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _eventTypeMeta = const VerificationMeta(
    'eventType',
  );
  @override
  late final GeneratedColumn<String> eventType = GeneratedColumn<String>(
    'event_type',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _eventDataMeta = const VerificationMeta(
    'eventData',
  );
  @override
  late final GeneratedColumn<String> eventData = GeneratedColumn<String>(
    'event_data',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _inputCostTotalMeta = const VerificationMeta(
    'inputCostTotal',
  );
  @override
  late final GeneratedColumn<double> inputCostTotal = GeneratedColumn<double>(
    'input_cost_total',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _carbonKgCO2eMeta = const VerificationMeta(
    'carbonKgCO2e',
  );
  @override
  late final GeneratedColumn<double> carbonKgCO2e = GeneratedColumn<double>(
    'carbon_kg_c_o2e',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _eventDateMeta = const VerificationMeta(
    'eventDate',
  );
  @override
  late final GeneratedColumn<DateTime> eventDate = GeneratedColumn<DateTime>(
    'event_date',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  static const VerificationMeta _farm5xPracticeMeta = const VerificationMeta(
    'farm5xPractice',
  );
  @override
  late final GeneratedColumn<String> farm5xPractice = GeneratedColumn<String>(
    'farm5x_practice',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _farm5xVariantMeta = const VerificationMeta(
    'farm5xVariant',
  );
  @override
  late final GeneratedColumn<String> farm5xVariant = GeneratedColumn<String>(
    'farm5x_variant',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _syncStatusMeta = const VerificationMeta(
    'syncStatus',
  );
  @override
  late final GeneratedColumn<String> syncStatus = GeneratedColumn<String>(
    'sync_status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('pending'),
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    cultivationId,
    cropVertical,
    stageNumber,
    stageName,
    eventType,
    eventData,
    inputCostTotal,
    carbonKgCO2e,
    eventDate,
    farm5xPractice,
    farm5xVariant,
    syncStatus,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'crop_stage_event_cache';
  @override
  VerificationContext validateIntegrity(
    Insertable<CropStageEventCacheData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('cultivation_id')) {
      context.handle(
        _cultivationIdMeta,
        cultivationId.isAcceptableOrUnknown(
          data['cultivation_id']!,
          _cultivationIdMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_cultivationIdMeta);
    }
    if (data.containsKey('crop_vertical')) {
      context.handle(
        _cropVerticalMeta,
        cropVertical.isAcceptableOrUnknown(
          data['crop_vertical']!,
          _cropVerticalMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_cropVerticalMeta);
    }
    if (data.containsKey('stage_number')) {
      context.handle(
        _stageNumberMeta,
        stageNumber.isAcceptableOrUnknown(
          data['stage_number']!,
          _stageNumberMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_stageNumberMeta);
    }
    if (data.containsKey('stage_name')) {
      context.handle(
        _stageNameMeta,
        stageName.isAcceptableOrUnknown(data['stage_name']!, _stageNameMeta),
      );
    } else if (isInserting) {
      context.missing(_stageNameMeta);
    }
    if (data.containsKey('event_type')) {
      context.handle(
        _eventTypeMeta,
        eventType.isAcceptableOrUnknown(data['event_type']!, _eventTypeMeta),
      );
    } else if (isInserting) {
      context.missing(_eventTypeMeta);
    }
    if (data.containsKey('event_data')) {
      context.handle(
        _eventDataMeta,
        eventData.isAcceptableOrUnknown(data['event_data']!, _eventDataMeta),
      );
    } else if (isInserting) {
      context.missing(_eventDataMeta);
    }
    if (data.containsKey('input_cost_total')) {
      context.handle(
        _inputCostTotalMeta,
        inputCostTotal.isAcceptableOrUnknown(
          data['input_cost_total']!,
          _inputCostTotalMeta,
        ),
      );
    }
    if (data.containsKey('carbon_kg_c_o2e')) {
      context.handle(
        _carbonKgCO2eMeta,
        carbonKgCO2e.isAcceptableOrUnknown(
          data['carbon_kg_c_o2e']!,
          _carbonKgCO2eMeta,
        ),
      );
    }
    if (data.containsKey('event_date')) {
      context.handle(
        _eventDateMeta,
        eventDate.isAcceptableOrUnknown(data['event_date']!, _eventDateMeta),
      );
    }
    if (data.containsKey('farm5x_practice')) {
      context.handle(
        _farm5xPracticeMeta,
        farm5xPractice.isAcceptableOrUnknown(
          data['farm5x_practice']!,
          _farm5xPracticeMeta,
        ),
      );
    }
    if (data.containsKey('farm5x_variant')) {
      context.handle(
        _farm5xVariantMeta,
        farm5xVariant.isAcceptableOrUnknown(
          data['farm5x_variant']!,
          _farm5xVariantMeta,
        ),
      );
    }
    if (data.containsKey('sync_status')) {
      context.handle(
        _syncStatusMeta,
        syncStatus.isAcceptableOrUnknown(data['sync_status']!, _syncStatusMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  CropStageEventCacheData map(
    Map<String, dynamic> data, {
    String? tablePrefix,
  }) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CropStageEventCacheData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      cultivationId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}cultivation_id'],
      )!,
      cropVertical: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}crop_vertical'],
      )!,
      stageNumber: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}stage_number'],
      )!,
      stageName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}stage_name'],
      )!,
      eventType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}event_type'],
      )!,
      eventData: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}event_data'],
      )!,
      inputCostTotal: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}input_cost_total'],
      )!,
      carbonKgCO2e: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}carbon_kg_c_o2e'],
      )!,
      eventDate: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}event_date'],
      )!,
      farm5xPractice: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}farm5x_practice'],
      ),
      farm5xVariant: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}farm5x_variant'],
      ),
      syncStatus: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}sync_status'],
      )!,
    );
  }

  @override
  $CropStageEventCacheTable createAlias(String alias) {
    return $CropStageEventCacheTable(attachedDatabase, alias);
  }
}

class CropStageEventCacheData extends DataClass
    implements Insertable<CropStageEventCacheData> {
  final String id;
  final String cultivationId;
  final String cropVertical;
  final int stageNumber;
  final String stageName;
  final String eventType;
  final String eventData;
  final double inputCostTotal;
  final double carbonKgCO2e;
  final DateTime eventDate;
  final String? farm5xPractice;
  final String? farm5xVariant;
  final String syncStatus;
  const CropStageEventCacheData({
    required this.id,
    required this.cultivationId,
    required this.cropVertical,
    required this.stageNumber,
    required this.stageName,
    required this.eventType,
    required this.eventData,
    required this.inputCostTotal,
    required this.carbonKgCO2e,
    required this.eventDate,
    this.farm5xPractice,
    this.farm5xVariant,
    required this.syncStatus,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['cultivation_id'] = Variable<String>(cultivationId);
    map['crop_vertical'] = Variable<String>(cropVertical);
    map['stage_number'] = Variable<int>(stageNumber);
    map['stage_name'] = Variable<String>(stageName);
    map['event_type'] = Variable<String>(eventType);
    map['event_data'] = Variable<String>(eventData);
    map['input_cost_total'] = Variable<double>(inputCostTotal);
    map['carbon_kg_c_o2e'] = Variable<double>(carbonKgCO2e);
    map['event_date'] = Variable<DateTime>(eventDate);
    if (!nullToAbsent || farm5xPractice != null) {
      map['farm5x_practice'] = Variable<String>(farm5xPractice);
    }
    if (!nullToAbsent || farm5xVariant != null) {
      map['farm5x_variant'] = Variable<String>(farm5xVariant);
    }
    map['sync_status'] = Variable<String>(syncStatus);
    return map;
  }

  CropStageEventCacheCompanion toCompanion(bool nullToAbsent) {
    return CropStageEventCacheCompanion(
      id: Value(id),
      cultivationId: Value(cultivationId),
      cropVertical: Value(cropVertical),
      stageNumber: Value(stageNumber),
      stageName: Value(stageName),
      eventType: Value(eventType),
      eventData: Value(eventData),
      inputCostTotal: Value(inputCostTotal),
      carbonKgCO2e: Value(carbonKgCO2e),
      eventDate: Value(eventDate),
      farm5xPractice: farm5xPractice == null && nullToAbsent
          ? const Value.absent()
          : Value(farm5xPractice),
      farm5xVariant: farm5xVariant == null && nullToAbsent
          ? const Value.absent()
          : Value(farm5xVariant),
      syncStatus: Value(syncStatus),
    );
  }

  factory CropStageEventCacheData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CropStageEventCacheData(
      id: serializer.fromJson<String>(json['id']),
      cultivationId: serializer.fromJson<String>(json['cultivationId']),
      cropVertical: serializer.fromJson<String>(json['cropVertical']),
      stageNumber: serializer.fromJson<int>(json['stageNumber']),
      stageName: serializer.fromJson<String>(json['stageName']),
      eventType: serializer.fromJson<String>(json['eventType']),
      eventData: serializer.fromJson<String>(json['eventData']),
      inputCostTotal: serializer.fromJson<double>(json['inputCostTotal']),
      carbonKgCO2e: serializer.fromJson<double>(json['carbonKgCO2e']),
      eventDate: serializer.fromJson<DateTime>(json['eventDate']),
      farm5xPractice: serializer.fromJson<String?>(json['farm5xPractice']),
      farm5xVariant: serializer.fromJson<String?>(json['farm5xVariant']),
      syncStatus: serializer.fromJson<String>(json['syncStatus']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'cultivationId': serializer.toJson<String>(cultivationId),
      'cropVertical': serializer.toJson<String>(cropVertical),
      'stageNumber': serializer.toJson<int>(stageNumber),
      'stageName': serializer.toJson<String>(stageName),
      'eventType': serializer.toJson<String>(eventType),
      'eventData': serializer.toJson<String>(eventData),
      'inputCostTotal': serializer.toJson<double>(inputCostTotal),
      'carbonKgCO2e': serializer.toJson<double>(carbonKgCO2e),
      'eventDate': serializer.toJson<DateTime>(eventDate),
      'farm5xPractice': serializer.toJson<String?>(farm5xPractice),
      'farm5xVariant': serializer.toJson<String?>(farm5xVariant),
      'syncStatus': serializer.toJson<String>(syncStatus),
    };
  }

  CropStageEventCacheData copyWith({
    String? id,
    String? cultivationId,
    String? cropVertical,
    int? stageNumber,
    String? stageName,
    String? eventType,
    String? eventData,
    double? inputCostTotal,
    double? carbonKgCO2e,
    DateTime? eventDate,
    Value<String?> farm5xPractice = const Value.absent(),
    Value<String?> farm5xVariant = const Value.absent(),
    String? syncStatus,
  }) => CropStageEventCacheData(
    id: id ?? this.id,
    cultivationId: cultivationId ?? this.cultivationId,
    cropVertical: cropVertical ?? this.cropVertical,
    stageNumber: stageNumber ?? this.stageNumber,
    stageName: stageName ?? this.stageName,
    eventType: eventType ?? this.eventType,
    eventData: eventData ?? this.eventData,
    inputCostTotal: inputCostTotal ?? this.inputCostTotal,
    carbonKgCO2e: carbonKgCO2e ?? this.carbonKgCO2e,
    eventDate: eventDate ?? this.eventDate,
    farm5xPractice: farm5xPractice.present
        ? farm5xPractice.value
        : this.farm5xPractice,
    farm5xVariant: farm5xVariant.present
        ? farm5xVariant.value
        : this.farm5xVariant,
    syncStatus: syncStatus ?? this.syncStatus,
  );
  CropStageEventCacheData copyWithCompanion(CropStageEventCacheCompanion data) {
    return CropStageEventCacheData(
      id: data.id.present ? data.id.value : this.id,
      cultivationId: data.cultivationId.present
          ? data.cultivationId.value
          : this.cultivationId,
      cropVertical: data.cropVertical.present
          ? data.cropVertical.value
          : this.cropVertical,
      stageNumber: data.stageNumber.present
          ? data.stageNumber.value
          : this.stageNumber,
      stageName: data.stageName.present ? data.stageName.value : this.stageName,
      eventType: data.eventType.present ? data.eventType.value : this.eventType,
      eventData: data.eventData.present ? data.eventData.value : this.eventData,
      inputCostTotal: data.inputCostTotal.present
          ? data.inputCostTotal.value
          : this.inputCostTotal,
      carbonKgCO2e: data.carbonKgCO2e.present
          ? data.carbonKgCO2e.value
          : this.carbonKgCO2e,
      eventDate: data.eventDate.present ? data.eventDate.value : this.eventDate,
      farm5xPractice: data.farm5xPractice.present
          ? data.farm5xPractice.value
          : this.farm5xPractice,
      farm5xVariant: data.farm5xVariant.present
          ? data.farm5xVariant.value
          : this.farm5xVariant,
      syncStatus: data.syncStatus.present
          ? data.syncStatus.value
          : this.syncStatus,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CropStageEventCacheData(')
          ..write('id: $id, ')
          ..write('cultivationId: $cultivationId, ')
          ..write('cropVertical: $cropVertical, ')
          ..write('stageNumber: $stageNumber, ')
          ..write('stageName: $stageName, ')
          ..write('eventType: $eventType, ')
          ..write('eventData: $eventData, ')
          ..write('inputCostTotal: $inputCostTotal, ')
          ..write('carbonKgCO2e: $carbonKgCO2e, ')
          ..write('eventDate: $eventDate, ')
          ..write('farm5xPractice: $farm5xPractice, ')
          ..write('farm5xVariant: $farm5xVariant, ')
          ..write('syncStatus: $syncStatus')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    cultivationId,
    cropVertical,
    stageNumber,
    stageName,
    eventType,
    eventData,
    inputCostTotal,
    carbonKgCO2e,
    eventDate,
    farm5xPractice,
    farm5xVariant,
    syncStatus,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CropStageEventCacheData &&
          other.id == this.id &&
          other.cultivationId == this.cultivationId &&
          other.cropVertical == this.cropVertical &&
          other.stageNumber == this.stageNumber &&
          other.stageName == this.stageName &&
          other.eventType == this.eventType &&
          other.eventData == this.eventData &&
          other.inputCostTotal == this.inputCostTotal &&
          other.carbonKgCO2e == this.carbonKgCO2e &&
          other.eventDate == this.eventDate &&
          other.farm5xPractice == this.farm5xPractice &&
          other.farm5xVariant == this.farm5xVariant &&
          other.syncStatus == this.syncStatus);
}

class CropStageEventCacheCompanion
    extends UpdateCompanion<CropStageEventCacheData> {
  final Value<String> id;
  final Value<String> cultivationId;
  final Value<String> cropVertical;
  final Value<int> stageNumber;
  final Value<String> stageName;
  final Value<String> eventType;
  final Value<String> eventData;
  final Value<double> inputCostTotal;
  final Value<double> carbonKgCO2e;
  final Value<DateTime> eventDate;
  final Value<String?> farm5xPractice;
  final Value<String?> farm5xVariant;
  final Value<String> syncStatus;
  final Value<int> rowid;
  const CropStageEventCacheCompanion({
    this.id = const Value.absent(),
    this.cultivationId = const Value.absent(),
    this.cropVertical = const Value.absent(),
    this.stageNumber = const Value.absent(),
    this.stageName = const Value.absent(),
    this.eventType = const Value.absent(),
    this.eventData = const Value.absent(),
    this.inputCostTotal = const Value.absent(),
    this.carbonKgCO2e = const Value.absent(),
    this.eventDate = const Value.absent(),
    this.farm5xPractice = const Value.absent(),
    this.farm5xVariant = const Value.absent(),
    this.syncStatus = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CropStageEventCacheCompanion.insert({
    required String id,
    required String cultivationId,
    required String cropVertical,
    required int stageNumber,
    required String stageName,
    required String eventType,
    required String eventData,
    this.inputCostTotal = const Value.absent(),
    this.carbonKgCO2e = const Value.absent(),
    this.eventDate = const Value.absent(),
    this.farm5xPractice = const Value.absent(),
    this.farm5xVariant = const Value.absent(),
    this.syncStatus = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       cultivationId = Value(cultivationId),
       cropVertical = Value(cropVertical),
       stageNumber = Value(stageNumber),
       stageName = Value(stageName),
       eventType = Value(eventType),
       eventData = Value(eventData);
  static Insertable<CropStageEventCacheData> custom({
    Expression<String>? id,
    Expression<String>? cultivationId,
    Expression<String>? cropVertical,
    Expression<int>? stageNumber,
    Expression<String>? stageName,
    Expression<String>? eventType,
    Expression<String>? eventData,
    Expression<double>? inputCostTotal,
    Expression<double>? carbonKgCO2e,
    Expression<DateTime>? eventDate,
    Expression<String>? farm5xPractice,
    Expression<String>? farm5xVariant,
    Expression<String>? syncStatus,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (cultivationId != null) 'cultivation_id': cultivationId,
      if (cropVertical != null) 'crop_vertical': cropVertical,
      if (stageNumber != null) 'stage_number': stageNumber,
      if (stageName != null) 'stage_name': stageName,
      if (eventType != null) 'event_type': eventType,
      if (eventData != null) 'event_data': eventData,
      if (inputCostTotal != null) 'input_cost_total': inputCostTotal,
      if (carbonKgCO2e != null) 'carbon_kg_c_o2e': carbonKgCO2e,
      if (eventDate != null) 'event_date': eventDate,
      if (farm5xPractice != null) 'farm5x_practice': farm5xPractice,
      if (farm5xVariant != null) 'farm5x_variant': farm5xVariant,
      if (syncStatus != null) 'sync_status': syncStatus,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CropStageEventCacheCompanion copyWith({
    Value<String>? id,
    Value<String>? cultivationId,
    Value<String>? cropVertical,
    Value<int>? stageNumber,
    Value<String>? stageName,
    Value<String>? eventType,
    Value<String>? eventData,
    Value<double>? inputCostTotal,
    Value<double>? carbonKgCO2e,
    Value<DateTime>? eventDate,
    Value<String?>? farm5xPractice,
    Value<String?>? farm5xVariant,
    Value<String>? syncStatus,
    Value<int>? rowid,
  }) {
    return CropStageEventCacheCompanion(
      id: id ?? this.id,
      cultivationId: cultivationId ?? this.cultivationId,
      cropVertical: cropVertical ?? this.cropVertical,
      stageNumber: stageNumber ?? this.stageNumber,
      stageName: stageName ?? this.stageName,
      eventType: eventType ?? this.eventType,
      eventData: eventData ?? this.eventData,
      inputCostTotal: inputCostTotal ?? this.inputCostTotal,
      carbonKgCO2e: carbonKgCO2e ?? this.carbonKgCO2e,
      eventDate: eventDate ?? this.eventDate,
      farm5xPractice: farm5xPractice ?? this.farm5xPractice,
      farm5xVariant: farm5xVariant ?? this.farm5xVariant,
      syncStatus: syncStatus ?? this.syncStatus,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (cultivationId.present) {
      map['cultivation_id'] = Variable<String>(cultivationId.value);
    }
    if (cropVertical.present) {
      map['crop_vertical'] = Variable<String>(cropVertical.value);
    }
    if (stageNumber.present) {
      map['stage_number'] = Variable<int>(stageNumber.value);
    }
    if (stageName.present) {
      map['stage_name'] = Variable<String>(stageName.value);
    }
    if (eventType.present) {
      map['event_type'] = Variable<String>(eventType.value);
    }
    if (eventData.present) {
      map['event_data'] = Variable<String>(eventData.value);
    }
    if (inputCostTotal.present) {
      map['input_cost_total'] = Variable<double>(inputCostTotal.value);
    }
    if (carbonKgCO2e.present) {
      map['carbon_kg_c_o2e'] = Variable<double>(carbonKgCO2e.value);
    }
    if (eventDate.present) {
      map['event_date'] = Variable<DateTime>(eventDate.value);
    }
    if (farm5xPractice.present) {
      map['farm5x_practice'] = Variable<String>(farm5xPractice.value);
    }
    if (farm5xVariant.present) {
      map['farm5x_variant'] = Variable<String>(farm5xVariant.value);
    }
    if (syncStatus.present) {
      map['sync_status'] = Variable<String>(syncStatus.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CropStageEventCacheCompanion(')
          ..write('id: $id, ')
          ..write('cultivationId: $cultivationId, ')
          ..write('cropVertical: $cropVertical, ')
          ..write('stageNumber: $stageNumber, ')
          ..write('stageName: $stageName, ')
          ..write('eventType: $eventType, ')
          ..write('eventData: $eventData, ')
          ..write('inputCostTotal: $inputCostTotal, ')
          ..write('carbonKgCO2e: $carbonKgCO2e, ')
          ..write('eventDate: $eventDate, ')
          ..write('farm5xPractice: $farm5xPractice, ')
          ..write('farm5xVariant: $farm5xVariant, ')
          ..write('syncStatus: $syncStatus, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $PracticeAdoptionCacheTable extends PracticeAdoptionCache
    with TableInfo<$PracticeAdoptionCacheTable, PracticeAdoptionCacheData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $PracticeAdoptionCacheTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _farmerIdMeta = const VerificationMeta(
    'farmerId',
  );
  @override
  late final GeneratedColumn<String> farmerId = GeneratedColumn<String>(
    'farmer_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _practiceCodeMeta = const VerificationMeta(
    'practiceCode',
  );
  @override
  late final GeneratedColumn<String> practiceCode = GeneratedColumn<String>(
    'practice_code',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _cropTypeMeta = const VerificationMeta(
    'cropType',
  );
  @override
  late final GeneratedColumn<String> cropType = GeneratedColumn<String>(
    'crop_type',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _frameworkVariantMeta = const VerificationMeta(
    'frameworkVariant',
  );
  @override
  late final GeneratedColumn<String> frameworkVariant = GeneratedColumn<String>(
    'framework_variant',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _isMandatoryMeta = const VerificationMeta(
    'isMandatory',
  );
  @override
  late final GeneratedColumn<bool> isMandatory = GeneratedColumn<bool>(
    'is_mandatory',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_mandatory" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _adoptedAtMeta = const VerificationMeta(
    'adoptedAt',
  );
  @override
  late final GeneratedColumn<DateTime> adoptedAt = GeneratedColumn<DateTime>(
    'adopted_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  static const VerificationMeta _verificationStatusMeta =
      const VerificationMeta('verificationStatus');
  @override
  late final GeneratedColumn<String> verificationStatus =
      GeneratedColumn<String>(
        'verification_status',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: false,
        defaultValue: const Constant('PENDING'),
      );
  static const VerificationMeta _syncStatusMeta = const VerificationMeta(
    'syncStatus',
  );
  @override
  late final GeneratedColumn<String> syncStatus = GeneratedColumn<String>(
    'sync_status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('pending'),
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    farmerId,
    practiceCode,
    cropType,
    frameworkVariant,
    isMandatory,
    adoptedAt,
    verificationStatus,
    syncStatus,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'practice_adoption_cache';
  @override
  VerificationContext validateIntegrity(
    Insertable<PracticeAdoptionCacheData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('farmer_id')) {
      context.handle(
        _farmerIdMeta,
        farmerId.isAcceptableOrUnknown(data['farmer_id']!, _farmerIdMeta),
      );
    } else if (isInserting) {
      context.missing(_farmerIdMeta);
    }
    if (data.containsKey('practice_code')) {
      context.handle(
        _practiceCodeMeta,
        practiceCode.isAcceptableOrUnknown(
          data['practice_code']!,
          _practiceCodeMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_practiceCodeMeta);
    }
    if (data.containsKey('crop_type')) {
      context.handle(
        _cropTypeMeta,
        cropType.isAcceptableOrUnknown(data['crop_type']!, _cropTypeMeta),
      );
    } else if (isInserting) {
      context.missing(_cropTypeMeta);
    }
    if (data.containsKey('framework_variant')) {
      context.handle(
        _frameworkVariantMeta,
        frameworkVariant.isAcceptableOrUnknown(
          data['framework_variant']!,
          _frameworkVariantMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_frameworkVariantMeta);
    }
    if (data.containsKey('is_mandatory')) {
      context.handle(
        _isMandatoryMeta,
        isMandatory.isAcceptableOrUnknown(
          data['is_mandatory']!,
          _isMandatoryMeta,
        ),
      );
    }
    if (data.containsKey('adopted_at')) {
      context.handle(
        _adoptedAtMeta,
        adoptedAt.isAcceptableOrUnknown(data['adopted_at']!, _adoptedAtMeta),
      );
    }
    if (data.containsKey('verification_status')) {
      context.handle(
        _verificationStatusMeta,
        verificationStatus.isAcceptableOrUnknown(
          data['verification_status']!,
          _verificationStatusMeta,
        ),
      );
    }
    if (data.containsKey('sync_status')) {
      context.handle(
        _syncStatusMeta,
        syncStatus.isAcceptableOrUnknown(data['sync_status']!, _syncStatusMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  PracticeAdoptionCacheData map(
    Map<String, dynamic> data, {
    String? tablePrefix,
  }) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return PracticeAdoptionCacheData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      farmerId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}farmer_id'],
      )!,
      practiceCode: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}practice_code'],
      )!,
      cropType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}crop_type'],
      )!,
      frameworkVariant: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}framework_variant'],
      )!,
      isMandatory: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_mandatory'],
      )!,
      adoptedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}adopted_at'],
      )!,
      verificationStatus: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}verification_status'],
      )!,
      syncStatus: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}sync_status'],
      )!,
    );
  }

  @override
  $PracticeAdoptionCacheTable createAlias(String alias) {
    return $PracticeAdoptionCacheTable(attachedDatabase, alias);
  }
}

class PracticeAdoptionCacheData extends DataClass
    implements Insertable<PracticeAdoptionCacheData> {
  final String id;
  final String farmerId;
  final String practiceCode;
  final String cropType;
  final String frameworkVariant;
  final bool isMandatory;
  final DateTime adoptedAt;
  final String verificationStatus;
  final String syncStatus;
  const PracticeAdoptionCacheData({
    required this.id,
    required this.farmerId,
    required this.practiceCode,
    required this.cropType,
    required this.frameworkVariant,
    required this.isMandatory,
    required this.adoptedAt,
    required this.verificationStatus,
    required this.syncStatus,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['farmer_id'] = Variable<String>(farmerId);
    map['practice_code'] = Variable<String>(practiceCode);
    map['crop_type'] = Variable<String>(cropType);
    map['framework_variant'] = Variable<String>(frameworkVariant);
    map['is_mandatory'] = Variable<bool>(isMandatory);
    map['adopted_at'] = Variable<DateTime>(adoptedAt);
    map['verification_status'] = Variable<String>(verificationStatus);
    map['sync_status'] = Variable<String>(syncStatus);
    return map;
  }

  PracticeAdoptionCacheCompanion toCompanion(bool nullToAbsent) {
    return PracticeAdoptionCacheCompanion(
      id: Value(id),
      farmerId: Value(farmerId),
      practiceCode: Value(practiceCode),
      cropType: Value(cropType),
      frameworkVariant: Value(frameworkVariant),
      isMandatory: Value(isMandatory),
      adoptedAt: Value(adoptedAt),
      verificationStatus: Value(verificationStatus),
      syncStatus: Value(syncStatus),
    );
  }

  factory PracticeAdoptionCacheData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return PracticeAdoptionCacheData(
      id: serializer.fromJson<String>(json['id']),
      farmerId: serializer.fromJson<String>(json['farmerId']),
      practiceCode: serializer.fromJson<String>(json['practiceCode']),
      cropType: serializer.fromJson<String>(json['cropType']),
      frameworkVariant: serializer.fromJson<String>(json['frameworkVariant']),
      isMandatory: serializer.fromJson<bool>(json['isMandatory']),
      adoptedAt: serializer.fromJson<DateTime>(json['adoptedAt']),
      verificationStatus: serializer.fromJson<String>(
        json['verificationStatus'],
      ),
      syncStatus: serializer.fromJson<String>(json['syncStatus']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'farmerId': serializer.toJson<String>(farmerId),
      'practiceCode': serializer.toJson<String>(practiceCode),
      'cropType': serializer.toJson<String>(cropType),
      'frameworkVariant': serializer.toJson<String>(frameworkVariant),
      'isMandatory': serializer.toJson<bool>(isMandatory),
      'adoptedAt': serializer.toJson<DateTime>(adoptedAt),
      'verificationStatus': serializer.toJson<String>(verificationStatus),
      'syncStatus': serializer.toJson<String>(syncStatus),
    };
  }

  PracticeAdoptionCacheData copyWith({
    String? id,
    String? farmerId,
    String? practiceCode,
    String? cropType,
    String? frameworkVariant,
    bool? isMandatory,
    DateTime? adoptedAt,
    String? verificationStatus,
    String? syncStatus,
  }) => PracticeAdoptionCacheData(
    id: id ?? this.id,
    farmerId: farmerId ?? this.farmerId,
    practiceCode: practiceCode ?? this.practiceCode,
    cropType: cropType ?? this.cropType,
    frameworkVariant: frameworkVariant ?? this.frameworkVariant,
    isMandatory: isMandatory ?? this.isMandatory,
    adoptedAt: adoptedAt ?? this.adoptedAt,
    verificationStatus: verificationStatus ?? this.verificationStatus,
    syncStatus: syncStatus ?? this.syncStatus,
  );
  PracticeAdoptionCacheData copyWithCompanion(
    PracticeAdoptionCacheCompanion data,
  ) {
    return PracticeAdoptionCacheData(
      id: data.id.present ? data.id.value : this.id,
      farmerId: data.farmerId.present ? data.farmerId.value : this.farmerId,
      practiceCode: data.practiceCode.present
          ? data.practiceCode.value
          : this.practiceCode,
      cropType: data.cropType.present ? data.cropType.value : this.cropType,
      frameworkVariant: data.frameworkVariant.present
          ? data.frameworkVariant.value
          : this.frameworkVariant,
      isMandatory: data.isMandatory.present
          ? data.isMandatory.value
          : this.isMandatory,
      adoptedAt: data.adoptedAt.present ? data.adoptedAt.value : this.adoptedAt,
      verificationStatus: data.verificationStatus.present
          ? data.verificationStatus.value
          : this.verificationStatus,
      syncStatus: data.syncStatus.present
          ? data.syncStatus.value
          : this.syncStatus,
    );
  }

  @override
  String toString() {
    return (StringBuffer('PracticeAdoptionCacheData(')
          ..write('id: $id, ')
          ..write('farmerId: $farmerId, ')
          ..write('practiceCode: $practiceCode, ')
          ..write('cropType: $cropType, ')
          ..write('frameworkVariant: $frameworkVariant, ')
          ..write('isMandatory: $isMandatory, ')
          ..write('adoptedAt: $adoptedAt, ')
          ..write('verificationStatus: $verificationStatus, ')
          ..write('syncStatus: $syncStatus')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    farmerId,
    practiceCode,
    cropType,
    frameworkVariant,
    isMandatory,
    adoptedAt,
    verificationStatus,
    syncStatus,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is PracticeAdoptionCacheData &&
          other.id == this.id &&
          other.farmerId == this.farmerId &&
          other.practiceCode == this.practiceCode &&
          other.cropType == this.cropType &&
          other.frameworkVariant == this.frameworkVariant &&
          other.isMandatory == this.isMandatory &&
          other.adoptedAt == this.adoptedAt &&
          other.verificationStatus == this.verificationStatus &&
          other.syncStatus == this.syncStatus);
}

class PracticeAdoptionCacheCompanion
    extends UpdateCompanion<PracticeAdoptionCacheData> {
  final Value<String> id;
  final Value<String> farmerId;
  final Value<String> practiceCode;
  final Value<String> cropType;
  final Value<String> frameworkVariant;
  final Value<bool> isMandatory;
  final Value<DateTime> adoptedAt;
  final Value<String> verificationStatus;
  final Value<String> syncStatus;
  final Value<int> rowid;
  const PracticeAdoptionCacheCompanion({
    this.id = const Value.absent(),
    this.farmerId = const Value.absent(),
    this.practiceCode = const Value.absent(),
    this.cropType = const Value.absent(),
    this.frameworkVariant = const Value.absent(),
    this.isMandatory = const Value.absent(),
    this.adoptedAt = const Value.absent(),
    this.verificationStatus = const Value.absent(),
    this.syncStatus = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  PracticeAdoptionCacheCompanion.insert({
    required String id,
    required String farmerId,
    required String practiceCode,
    required String cropType,
    required String frameworkVariant,
    this.isMandatory = const Value.absent(),
    this.adoptedAt = const Value.absent(),
    this.verificationStatus = const Value.absent(),
    this.syncStatus = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       farmerId = Value(farmerId),
       practiceCode = Value(practiceCode),
       cropType = Value(cropType),
       frameworkVariant = Value(frameworkVariant);
  static Insertable<PracticeAdoptionCacheData> custom({
    Expression<String>? id,
    Expression<String>? farmerId,
    Expression<String>? practiceCode,
    Expression<String>? cropType,
    Expression<String>? frameworkVariant,
    Expression<bool>? isMandatory,
    Expression<DateTime>? adoptedAt,
    Expression<String>? verificationStatus,
    Expression<String>? syncStatus,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (farmerId != null) 'farmer_id': farmerId,
      if (practiceCode != null) 'practice_code': practiceCode,
      if (cropType != null) 'crop_type': cropType,
      if (frameworkVariant != null) 'framework_variant': frameworkVariant,
      if (isMandatory != null) 'is_mandatory': isMandatory,
      if (adoptedAt != null) 'adopted_at': adoptedAt,
      if (verificationStatus != null) 'verification_status': verificationStatus,
      if (syncStatus != null) 'sync_status': syncStatus,
      if (rowid != null) 'rowid': rowid,
    });
  }

  PracticeAdoptionCacheCompanion copyWith({
    Value<String>? id,
    Value<String>? farmerId,
    Value<String>? practiceCode,
    Value<String>? cropType,
    Value<String>? frameworkVariant,
    Value<bool>? isMandatory,
    Value<DateTime>? adoptedAt,
    Value<String>? verificationStatus,
    Value<String>? syncStatus,
    Value<int>? rowid,
  }) {
    return PracticeAdoptionCacheCompanion(
      id: id ?? this.id,
      farmerId: farmerId ?? this.farmerId,
      practiceCode: practiceCode ?? this.practiceCode,
      cropType: cropType ?? this.cropType,
      frameworkVariant: frameworkVariant ?? this.frameworkVariant,
      isMandatory: isMandatory ?? this.isMandatory,
      adoptedAt: adoptedAt ?? this.adoptedAt,
      verificationStatus: verificationStatus ?? this.verificationStatus,
      syncStatus: syncStatus ?? this.syncStatus,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (farmerId.present) {
      map['farmer_id'] = Variable<String>(farmerId.value);
    }
    if (practiceCode.present) {
      map['practice_code'] = Variable<String>(practiceCode.value);
    }
    if (cropType.present) {
      map['crop_type'] = Variable<String>(cropType.value);
    }
    if (frameworkVariant.present) {
      map['framework_variant'] = Variable<String>(frameworkVariant.value);
    }
    if (isMandatory.present) {
      map['is_mandatory'] = Variable<bool>(isMandatory.value);
    }
    if (adoptedAt.present) {
      map['adopted_at'] = Variable<DateTime>(adoptedAt.value);
    }
    if (verificationStatus.present) {
      map['verification_status'] = Variable<String>(verificationStatus.value);
    }
    if (syncStatus.present) {
      map['sync_status'] = Variable<String>(syncStatus.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('PracticeAdoptionCacheCompanion(')
          ..write('id: $id, ')
          ..write('farmerId: $farmerId, ')
          ..write('practiceCode: $practiceCode, ')
          ..write('cropType: $cropType, ')
          ..write('frameworkVariant: $frameworkVariant, ')
          ..write('isMandatory: $isMandatory, ')
          ..write('adoptedAt: $adoptedAt, ')
          ..write('verificationStatus: $verificationStatus, ')
          ..write('syncStatus: $syncStatus, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $AppSettingsCacheTable extends AppSettingsCache
    with TableInfo<$AppSettingsCacheTable, AppSettingsCacheData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $AppSettingsCacheTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _keyMeta = const VerificationMeta('key');
  @override
  late final GeneratedColumn<String> key = GeneratedColumn<String>(
    'key',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _valueMeta = const VerificationMeta('value');
  @override
  late final GeneratedColumn<String> value = GeneratedColumn<String>(
    'value',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [key, value];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'app_settings_cache';
  @override
  VerificationContext validateIntegrity(
    Insertable<AppSettingsCacheData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('key')) {
      context.handle(
        _keyMeta,
        key.isAcceptableOrUnknown(data['key']!, _keyMeta),
      );
    } else if (isInserting) {
      context.missing(_keyMeta);
    }
    if (data.containsKey('value')) {
      context.handle(
        _valueMeta,
        value.isAcceptableOrUnknown(data['value']!, _valueMeta),
      );
    } else if (isInserting) {
      context.missing(_valueMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {key};
  @override
  AppSettingsCacheData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return AppSettingsCacheData(
      key: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}key'],
      )!,
      value: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}value'],
      )!,
    );
  }

  @override
  $AppSettingsCacheTable createAlias(String alias) {
    return $AppSettingsCacheTable(attachedDatabase, alias);
  }
}

class AppSettingsCacheData extends DataClass
    implements Insertable<AppSettingsCacheData> {
  final String key;
  final String value;
  const AppSettingsCacheData({required this.key, required this.value});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['key'] = Variable<String>(key);
    map['value'] = Variable<String>(value);
    return map;
  }

  AppSettingsCacheCompanion toCompanion(bool nullToAbsent) {
    return AppSettingsCacheCompanion(key: Value(key), value: Value(value));
  }

  factory AppSettingsCacheData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return AppSettingsCacheData(
      key: serializer.fromJson<String>(json['key']),
      value: serializer.fromJson<String>(json['value']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'key': serializer.toJson<String>(key),
      'value': serializer.toJson<String>(value),
    };
  }

  AppSettingsCacheData copyWith({String? key, String? value}) =>
      AppSettingsCacheData(key: key ?? this.key, value: value ?? this.value);
  AppSettingsCacheData copyWithCompanion(AppSettingsCacheCompanion data) {
    return AppSettingsCacheData(
      key: data.key.present ? data.key.value : this.key,
      value: data.value.present ? data.value.value : this.value,
    );
  }

  @override
  String toString() {
    return (StringBuffer('AppSettingsCacheData(')
          ..write('key: $key, ')
          ..write('value: $value')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(key, value);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is AppSettingsCacheData &&
          other.key == this.key &&
          other.value == this.value);
}

class AppSettingsCacheCompanion extends UpdateCompanion<AppSettingsCacheData> {
  final Value<String> key;
  final Value<String> value;
  final Value<int> rowid;
  const AppSettingsCacheCompanion({
    this.key = const Value.absent(),
    this.value = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  AppSettingsCacheCompanion.insert({
    required String key,
    required String value,
    this.rowid = const Value.absent(),
  }) : key = Value(key),
       value = Value(value);
  static Insertable<AppSettingsCacheData> custom({
    Expression<String>? key,
    Expression<String>? value,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (key != null) 'key': key,
      if (value != null) 'value': value,
      if (rowid != null) 'rowid': rowid,
    });
  }

  AppSettingsCacheCompanion copyWith({
    Value<String>? key,
    Value<String>? value,
    Value<int>? rowid,
  }) {
    return AppSettingsCacheCompanion(
      key: key ?? this.key,
      value: value ?? this.value,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (key.present) {
      map['key'] = Variable<String>(key.value);
    }
    if (value.present) {
      map['value'] = Variable<String>(value.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('AppSettingsCacheCompanion(')
          ..write('key: $key, ')
          ..write('value: $value, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $SyncQueueEntriesTable syncQueueEntries = $SyncQueueEntriesTable(
    this,
  );
  late final $FarmerCacheTable farmerCache = $FarmerCacheTable(this);
  late final $FarmLandCacheTable farmLandCache = $FarmLandCacheTable(this);
  late final $CultivationCacheTable cultivationCache = $CultivationCacheTable(
    this,
  );
  late final $VslaGroupCacheTable vslaGroupCache = $VslaGroupCacheTable(this);
  late final $VslaSavingCacheTable vslaSavingCache = $VslaSavingCacheTable(
    this,
  );
  late final $VslaLoanCacheTable vslaLoanCache = $VslaLoanCacheTable(this);
  late final $TrainingCacheTable trainingCache = $TrainingCacheTable(this);
  late final $TrainingAttendanceCacheTable trainingAttendanceCache =
      $TrainingAttendanceCacheTable(this);
  late final $FarmVisitCacheTable farmVisitCache = $FarmVisitCacheTable(this);
  late final $SaleCacheTable saleCache = $SaleCacheTable(this);
  late final $CropStageEventCacheTable cropStageEventCache =
      $CropStageEventCacheTable(this);
  late final $PracticeAdoptionCacheTable practiceAdoptionCache =
      $PracticeAdoptionCacheTable(this);
  late final $AppSettingsCacheTable appSettingsCache = $AppSettingsCacheTable(
    this,
  );
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
    syncQueueEntries,
    farmerCache,
    farmLandCache,
    cultivationCache,
    vslaGroupCache,
    vslaSavingCache,
    vslaLoanCache,
    trainingCache,
    trainingAttendanceCache,
    farmVisitCache,
    saleCache,
    cropStageEventCache,
    practiceAdoptionCache,
    appSettingsCache,
  ];
}

typedef $$SyncQueueEntriesTableCreateCompanionBuilder =
    SyncQueueEntriesCompanion Function({
      required String id,
      required String entityType,
      required String entityId,
      required String operation,
      required String payload,
      Value<DateTime> createdAt,
      Value<int> retryCount,
      Value<String?> lastError,
      Value<int> rowid,
    });
typedef $$SyncQueueEntriesTableUpdateCompanionBuilder =
    SyncQueueEntriesCompanion Function({
      Value<String> id,
      Value<String> entityType,
      Value<String> entityId,
      Value<String> operation,
      Value<String> payload,
      Value<DateTime> createdAt,
      Value<int> retryCount,
      Value<String?> lastError,
      Value<int> rowid,
    });

class $$SyncQueueEntriesTableFilterComposer
    extends Composer<_$AppDatabase, $SyncQueueEntriesTable> {
  $$SyncQueueEntriesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get entityType => $composableBuilder(
    column: $table.entityType,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get entityId => $composableBuilder(
    column: $table.entityId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get operation => $composableBuilder(
    column: $table.operation,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get payload => $composableBuilder(
    column: $table.payload,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get retryCount => $composableBuilder(
    column: $table.retryCount,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get lastError => $composableBuilder(
    column: $table.lastError,
    builder: (column) => ColumnFilters(column),
  );
}

class $$SyncQueueEntriesTableOrderingComposer
    extends Composer<_$AppDatabase, $SyncQueueEntriesTable> {
  $$SyncQueueEntriesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get entityType => $composableBuilder(
    column: $table.entityType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get entityId => $composableBuilder(
    column: $table.entityId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get operation => $composableBuilder(
    column: $table.operation,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get payload => $composableBuilder(
    column: $table.payload,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get retryCount => $composableBuilder(
    column: $table.retryCount,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get lastError => $composableBuilder(
    column: $table.lastError,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$SyncQueueEntriesTableAnnotationComposer
    extends Composer<_$AppDatabase, $SyncQueueEntriesTable> {
  $$SyncQueueEntriesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get entityType => $composableBuilder(
    column: $table.entityType,
    builder: (column) => column,
  );

  GeneratedColumn<String> get entityId =>
      $composableBuilder(column: $table.entityId, builder: (column) => column);

  GeneratedColumn<String> get operation =>
      $composableBuilder(column: $table.operation, builder: (column) => column);

  GeneratedColumn<String> get payload =>
      $composableBuilder(column: $table.payload, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<int> get retryCount => $composableBuilder(
    column: $table.retryCount,
    builder: (column) => column,
  );

  GeneratedColumn<String> get lastError =>
      $composableBuilder(column: $table.lastError, builder: (column) => column);
}

class $$SyncQueueEntriesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $SyncQueueEntriesTable,
          SyncQueueEntry,
          $$SyncQueueEntriesTableFilterComposer,
          $$SyncQueueEntriesTableOrderingComposer,
          $$SyncQueueEntriesTableAnnotationComposer,
          $$SyncQueueEntriesTableCreateCompanionBuilder,
          $$SyncQueueEntriesTableUpdateCompanionBuilder,
          (
            SyncQueueEntry,
            BaseReferences<
              _$AppDatabase,
              $SyncQueueEntriesTable,
              SyncQueueEntry
            >,
          ),
          SyncQueueEntry,
          PrefetchHooks Function()
        > {
  $$SyncQueueEntriesTableTableManager(
    _$AppDatabase db,
    $SyncQueueEntriesTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$SyncQueueEntriesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$SyncQueueEntriesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$SyncQueueEntriesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> entityType = const Value.absent(),
                Value<String> entityId = const Value.absent(),
                Value<String> operation = const Value.absent(),
                Value<String> payload = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<int> retryCount = const Value.absent(),
                Value<String?> lastError = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => SyncQueueEntriesCompanion(
                id: id,
                entityType: entityType,
                entityId: entityId,
                operation: operation,
                payload: payload,
                createdAt: createdAt,
                retryCount: retryCount,
                lastError: lastError,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String entityType,
                required String entityId,
                required String operation,
                required String payload,
                Value<DateTime> createdAt = const Value.absent(),
                Value<int> retryCount = const Value.absent(),
                Value<String?> lastError = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => SyncQueueEntriesCompanion.insert(
                id: id,
                entityType: entityType,
                entityId: entityId,
                operation: operation,
                payload: payload,
                createdAt: createdAt,
                retryCount: retryCount,
                lastError: lastError,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$SyncQueueEntriesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $SyncQueueEntriesTable,
      SyncQueueEntry,
      $$SyncQueueEntriesTableFilterComposer,
      $$SyncQueueEntriesTableOrderingComposer,
      $$SyncQueueEntriesTableAnnotationComposer,
      $$SyncQueueEntriesTableCreateCompanionBuilder,
      $$SyncQueueEntriesTableUpdateCompanionBuilder,
      (
        SyncQueueEntry,
        BaseReferences<_$AppDatabase, $SyncQueueEntriesTable, SyncQueueEntry>,
      ),
      SyncQueueEntry,
      PrefetchHooks Function()
    >;
typedef $$FarmerCacheTableCreateCompanionBuilder =
    FarmerCacheCompanion Function({
      required String id,
      required String tenantId,
      Value<String?> farmerCode,
      required String firstName,
      required String lastName,
      required String phone,
      Value<String?> gender,
      Value<String?> email,
      Value<String?> villageName,
      Value<String?> district,
      Value<String?> country,
      Value<bool> isCertified,
      Value<String?> certificationType,
      Value<double?> farmSize,
      Value<String> status,
      Value<String?> photoUrl,
      Value<String> syncStatus,
      Value<DateTime?> lastSyncedAt,
      Value<DateTime?> updatedAt,
      Value<int> rowid,
    });
typedef $$FarmerCacheTableUpdateCompanionBuilder =
    FarmerCacheCompanion Function({
      Value<String> id,
      Value<String> tenantId,
      Value<String?> farmerCode,
      Value<String> firstName,
      Value<String> lastName,
      Value<String> phone,
      Value<String?> gender,
      Value<String?> email,
      Value<String?> villageName,
      Value<String?> district,
      Value<String?> country,
      Value<bool> isCertified,
      Value<String?> certificationType,
      Value<double?> farmSize,
      Value<String> status,
      Value<String?> photoUrl,
      Value<String> syncStatus,
      Value<DateTime?> lastSyncedAt,
      Value<DateTime?> updatedAt,
      Value<int> rowid,
    });

class $$FarmerCacheTableFilterComposer
    extends Composer<_$AppDatabase, $FarmerCacheTable> {
  $$FarmerCacheTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get tenantId => $composableBuilder(
    column: $table.tenantId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get farmerCode => $composableBuilder(
    column: $table.farmerCode,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get firstName => $composableBuilder(
    column: $table.firstName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get lastName => $composableBuilder(
    column: $table.lastName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get phone => $composableBuilder(
    column: $table.phone,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get gender => $composableBuilder(
    column: $table.gender,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get email => $composableBuilder(
    column: $table.email,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get villageName => $composableBuilder(
    column: $table.villageName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get district => $composableBuilder(
    column: $table.district,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get country => $composableBuilder(
    column: $table.country,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get isCertified => $composableBuilder(
    column: $table.isCertified,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get certificationType => $composableBuilder(
    column: $table.certificationType,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get farmSize => $composableBuilder(
    column: $table.farmSize,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get photoUrl => $composableBuilder(
    column: $table.photoUrl,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get lastSyncedAt => $composableBuilder(
    column: $table.lastSyncedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$FarmerCacheTableOrderingComposer
    extends Composer<_$AppDatabase, $FarmerCacheTable> {
  $$FarmerCacheTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get tenantId => $composableBuilder(
    column: $table.tenantId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get farmerCode => $composableBuilder(
    column: $table.farmerCode,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get firstName => $composableBuilder(
    column: $table.firstName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get lastName => $composableBuilder(
    column: $table.lastName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get phone => $composableBuilder(
    column: $table.phone,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get gender => $composableBuilder(
    column: $table.gender,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get email => $composableBuilder(
    column: $table.email,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get villageName => $composableBuilder(
    column: $table.villageName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get district => $composableBuilder(
    column: $table.district,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get country => $composableBuilder(
    column: $table.country,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get isCertified => $composableBuilder(
    column: $table.isCertified,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get certificationType => $composableBuilder(
    column: $table.certificationType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get farmSize => $composableBuilder(
    column: $table.farmSize,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get photoUrl => $composableBuilder(
    column: $table.photoUrl,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get lastSyncedAt => $composableBuilder(
    column: $table.lastSyncedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$FarmerCacheTableAnnotationComposer
    extends Composer<_$AppDatabase, $FarmerCacheTable> {
  $$FarmerCacheTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get tenantId =>
      $composableBuilder(column: $table.tenantId, builder: (column) => column);

  GeneratedColumn<String> get farmerCode => $composableBuilder(
    column: $table.farmerCode,
    builder: (column) => column,
  );

  GeneratedColumn<String> get firstName =>
      $composableBuilder(column: $table.firstName, builder: (column) => column);

  GeneratedColumn<String> get lastName =>
      $composableBuilder(column: $table.lastName, builder: (column) => column);

  GeneratedColumn<String> get phone =>
      $composableBuilder(column: $table.phone, builder: (column) => column);

  GeneratedColumn<String> get gender =>
      $composableBuilder(column: $table.gender, builder: (column) => column);

  GeneratedColumn<String> get email =>
      $composableBuilder(column: $table.email, builder: (column) => column);

  GeneratedColumn<String> get villageName => $composableBuilder(
    column: $table.villageName,
    builder: (column) => column,
  );

  GeneratedColumn<String> get district =>
      $composableBuilder(column: $table.district, builder: (column) => column);

  GeneratedColumn<String> get country =>
      $composableBuilder(column: $table.country, builder: (column) => column);

  GeneratedColumn<bool> get isCertified => $composableBuilder(
    column: $table.isCertified,
    builder: (column) => column,
  );

  GeneratedColumn<String> get certificationType => $composableBuilder(
    column: $table.certificationType,
    builder: (column) => column,
  );

  GeneratedColumn<double> get farmSize =>
      $composableBuilder(column: $table.farmSize, builder: (column) => column);

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<String> get photoUrl =>
      $composableBuilder(column: $table.photoUrl, builder: (column) => column);

  GeneratedColumn<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get lastSyncedAt => $composableBuilder(
    column: $table.lastSyncedAt,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$FarmerCacheTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $FarmerCacheTable,
          FarmerCacheData,
          $$FarmerCacheTableFilterComposer,
          $$FarmerCacheTableOrderingComposer,
          $$FarmerCacheTableAnnotationComposer,
          $$FarmerCacheTableCreateCompanionBuilder,
          $$FarmerCacheTableUpdateCompanionBuilder,
          (
            FarmerCacheData,
            BaseReferences<_$AppDatabase, $FarmerCacheTable, FarmerCacheData>,
          ),
          FarmerCacheData,
          PrefetchHooks Function()
        > {
  $$FarmerCacheTableTableManager(_$AppDatabase db, $FarmerCacheTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$FarmerCacheTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$FarmerCacheTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$FarmerCacheTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> tenantId = const Value.absent(),
                Value<String?> farmerCode = const Value.absent(),
                Value<String> firstName = const Value.absent(),
                Value<String> lastName = const Value.absent(),
                Value<String> phone = const Value.absent(),
                Value<String?> gender = const Value.absent(),
                Value<String?> email = const Value.absent(),
                Value<String?> villageName = const Value.absent(),
                Value<String?> district = const Value.absent(),
                Value<String?> country = const Value.absent(),
                Value<bool> isCertified = const Value.absent(),
                Value<String?> certificationType = const Value.absent(),
                Value<double?> farmSize = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<String?> photoUrl = const Value.absent(),
                Value<String> syncStatus = const Value.absent(),
                Value<DateTime?> lastSyncedAt = const Value.absent(),
                Value<DateTime?> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => FarmerCacheCompanion(
                id: id,
                tenantId: tenantId,
                farmerCode: farmerCode,
                firstName: firstName,
                lastName: lastName,
                phone: phone,
                gender: gender,
                email: email,
                villageName: villageName,
                district: district,
                country: country,
                isCertified: isCertified,
                certificationType: certificationType,
                farmSize: farmSize,
                status: status,
                photoUrl: photoUrl,
                syncStatus: syncStatus,
                lastSyncedAt: lastSyncedAt,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String tenantId,
                Value<String?> farmerCode = const Value.absent(),
                required String firstName,
                required String lastName,
                required String phone,
                Value<String?> gender = const Value.absent(),
                Value<String?> email = const Value.absent(),
                Value<String?> villageName = const Value.absent(),
                Value<String?> district = const Value.absent(),
                Value<String?> country = const Value.absent(),
                Value<bool> isCertified = const Value.absent(),
                Value<String?> certificationType = const Value.absent(),
                Value<double?> farmSize = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<String?> photoUrl = const Value.absent(),
                Value<String> syncStatus = const Value.absent(),
                Value<DateTime?> lastSyncedAt = const Value.absent(),
                Value<DateTime?> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => FarmerCacheCompanion.insert(
                id: id,
                tenantId: tenantId,
                farmerCode: farmerCode,
                firstName: firstName,
                lastName: lastName,
                phone: phone,
                gender: gender,
                email: email,
                villageName: villageName,
                district: district,
                country: country,
                isCertified: isCertified,
                certificationType: certificationType,
                farmSize: farmSize,
                status: status,
                photoUrl: photoUrl,
                syncStatus: syncStatus,
                lastSyncedAt: lastSyncedAt,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$FarmerCacheTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $FarmerCacheTable,
      FarmerCacheData,
      $$FarmerCacheTableFilterComposer,
      $$FarmerCacheTableOrderingComposer,
      $$FarmerCacheTableAnnotationComposer,
      $$FarmerCacheTableCreateCompanionBuilder,
      $$FarmerCacheTableUpdateCompanionBuilder,
      (
        FarmerCacheData,
        BaseReferences<_$AppDatabase, $FarmerCacheTable, FarmerCacheData>,
      ),
      FarmerCacheData,
      PrefetchHooks Function()
    >;
typedef $$FarmLandCacheTableCreateCompanionBuilder =
    FarmLandCacheCompanion Function({
      required String id,
      required String farmerId,
      required String name,
      Value<double?> sizeHectares,
      Value<double?> latitude,
      Value<double?> longitude,
      Value<String?> landOwnership,
      Value<String?> waterSource,
      Value<String?> soilFertility,
      Value<String?> boundaryGeoJson,
      Value<String?> landSurveyNo,
      Value<String?> approachRoad,
      Value<String?> landTopology,
      Value<String?> landGradient,
      Value<String?> landDocumentUrl,
      Value<String?> powerSource,
      Value<String?> farmPhotoUrl,
      Value<String?> irrigationSource,
      Value<String?> irrigationType,
      Value<double?> fullTimeWorkers,
      Value<double?> partTimeWorkers,
      Value<double?> seasonalWorkers,
      Value<double?> familyWorkers,
      Value<DateTime?> lastChemicalApplicationDate,
      Value<String?> conventionalLands,
      Value<String?> fallowPastureLand,
      Value<String?> conventionalCrops,
      Value<double?> estYieldKg,
      Value<String?> certType,
      Value<String?> conversionStatus,
      Value<DateTime?> conversionDate,
      Value<String?> inspectorName,
      Value<bool?> conversionQualified,
      Value<String?> conversionRemarks,
      Value<DateTime?> soilCollectionDate,
      Value<DateTime?> soilLabTestingDate,
      Value<DateTime?> soilResultDate,
      Value<String?> soilReportUrl,
      Value<String?> soilSamplesInfo,
      Value<String?> soilCriteria,
      Value<String> syncStatus,
      Value<DateTime?> lastSyncedAt,
      Value<DateTime?> updatedAt,
      Value<int> rowid,
    });
typedef $$FarmLandCacheTableUpdateCompanionBuilder =
    FarmLandCacheCompanion Function({
      Value<String> id,
      Value<String> farmerId,
      Value<String> name,
      Value<double?> sizeHectares,
      Value<double?> latitude,
      Value<double?> longitude,
      Value<String?> landOwnership,
      Value<String?> waterSource,
      Value<String?> soilFertility,
      Value<String?> boundaryGeoJson,
      Value<String?> landSurveyNo,
      Value<String?> approachRoad,
      Value<String?> landTopology,
      Value<String?> landGradient,
      Value<String?> landDocumentUrl,
      Value<String?> powerSource,
      Value<String?> farmPhotoUrl,
      Value<String?> irrigationSource,
      Value<String?> irrigationType,
      Value<double?> fullTimeWorkers,
      Value<double?> partTimeWorkers,
      Value<double?> seasonalWorkers,
      Value<double?> familyWorkers,
      Value<DateTime?> lastChemicalApplicationDate,
      Value<String?> conventionalLands,
      Value<String?> fallowPastureLand,
      Value<String?> conventionalCrops,
      Value<double?> estYieldKg,
      Value<String?> certType,
      Value<String?> conversionStatus,
      Value<DateTime?> conversionDate,
      Value<String?> inspectorName,
      Value<bool?> conversionQualified,
      Value<String?> conversionRemarks,
      Value<DateTime?> soilCollectionDate,
      Value<DateTime?> soilLabTestingDate,
      Value<DateTime?> soilResultDate,
      Value<String?> soilReportUrl,
      Value<String?> soilSamplesInfo,
      Value<String?> soilCriteria,
      Value<String> syncStatus,
      Value<DateTime?> lastSyncedAt,
      Value<DateTime?> updatedAt,
      Value<int> rowid,
    });

class $$FarmLandCacheTableFilterComposer
    extends Composer<_$AppDatabase, $FarmLandCacheTable> {
  $$FarmLandCacheTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get farmerId => $composableBuilder(
    column: $table.farmerId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get sizeHectares => $composableBuilder(
    column: $table.sizeHectares,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get latitude => $composableBuilder(
    column: $table.latitude,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get longitude => $composableBuilder(
    column: $table.longitude,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get landOwnership => $composableBuilder(
    column: $table.landOwnership,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get waterSource => $composableBuilder(
    column: $table.waterSource,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get soilFertility => $composableBuilder(
    column: $table.soilFertility,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get boundaryGeoJson => $composableBuilder(
    column: $table.boundaryGeoJson,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get landSurveyNo => $composableBuilder(
    column: $table.landSurveyNo,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get approachRoad => $composableBuilder(
    column: $table.approachRoad,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get landTopology => $composableBuilder(
    column: $table.landTopology,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get landGradient => $composableBuilder(
    column: $table.landGradient,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get landDocumentUrl => $composableBuilder(
    column: $table.landDocumentUrl,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get powerSource => $composableBuilder(
    column: $table.powerSource,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get farmPhotoUrl => $composableBuilder(
    column: $table.farmPhotoUrl,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get irrigationSource => $composableBuilder(
    column: $table.irrigationSource,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get irrigationType => $composableBuilder(
    column: $table.irrigationType,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get fullTimeWorkers => $composableBuilder(
    column: $table.fullTimeWorkers,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get partTimeWorkers => $composableBuilder(
    column: $table.partTimeWorkers,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get seasonalWorkers => $composableBuilder(
    column: $table.seasonalWorkers,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get familyWorkers => $composableBuilder(
    column: $table.familyWorkers,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get lastChemicalApplicationDate => $composableBuilder(
    column: $table.lastChemicalApplicationDate,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get conventionalLands => $composableBuilder(
    column: $table.conventionalLands,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get fallowPastureLand => $composableBuilder(
    column: $table.fallowPastureLand,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get conventionalCrops => $composableBuilder(
    column: $table.conventionalCrops,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get estYieldKg => $composableBuilder(
    column: $table.estYieldKg,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get certType => $composableBuilder(
    column: $table.certType,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get conversionStatus => $composableBuilder(
    column: $table.conversionStatus,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get conversionDate => $composableBuilder(
    column: $table.conversionDate,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get inspectorName => $composableBuilder(
    column: $table.inspectorName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get conversionQualified => $composableBuilder(
    column: $table.conversionQualified,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get conversionRemarks => $composableBuilder(
    column: $table.conversionRemarks,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get soilCollectionDate => $composableBuilder(
    column: $table.soilCollectionDate,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get soilLabTestingDate => $composableBuilder(
    column: $table.soilLabTestingDate,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get soilResultDate => $composableBuilder(
    column: $table.soilResultDate,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get soilReportUrl => $composableBuilder(
    column: $table.soilReportUrl,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get soilSamplesInfo => $composableBuilder(
    column: $table.soilSamplesInfo,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get soilCriteria => $composableBuilder(
    column: $table.soilCriteria,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get lastSyncedAt => $composableBuilder(
    column: $table.lastSyncedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$FarmLandCacheTableOrderingComposer
    extends Composer<_$AppDatabase, $FarmLandCacheTable> {
  $$FarmLandCacheTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get farmerId => $composableBuilder(
    column: $table.farmerId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get sizeHectares => $composableBuilder(
    column: $table.sizeHectares,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get latitude => $composableBuilder(
    column: $table.latitude,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get longitude => $composableBuilder(
    column: $table.longitude,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get landOwnership => $composableBuilder(
    column: $table.landOwnership,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get waterSource => $composableBuilder(
    column: $table.waterSource,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get soilFertility => $composableBuilder(
    column: $table.soilFertility,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get boundaryGeoJson => $composableBuilder(
    column: $table.boundaryGeoJson,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get landSurveyNo => $composableBuilder(
    column: $table.landSurveyNo,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get approachRoad => $composableBuilder(
    column: $table.approachRoad,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get landTopology => $composableBuilder(
    column: $table.landTopology,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get landGradient => $composableBuilder(
    column: $table.landGradient,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get landDocumentUrl => $composableBuilder(
    column: $table.landDocumentUrl,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get powerSource => $composableBuilder(
    column: $table.powerSource,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get farmPhotoUrl => $composableBuilder(
    column: $table.farmPhotoUrl,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get irrigationSource => $composableBuilder(
    column: $table.irrigationSource,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get irrigationType => $composableBuilder(
    column: $table.irrigationType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get fullTimeWorkers => $composableBuilder(
    column: $table.fullTimeWorkers,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get partTimeWorkers => $composableBuilder(
    column: $table.partTimeWorkers,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get seasonalWorkers => $composableBuilder(
    column: $table.seasonalWorkers,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get familyWorkers => $composableBuilder(
    column: $table.familyWorkers,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get lastChemicalApplicationDate =>
      $composableBuilder(
        column: $table.lastChemicalApplicationDate,
        builder: (column) => ColumnOrderings(column),
      );

  ColumnOrderings<String> get conventionalLands => $composableBuilder(
    column: $table.conventionalLands,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get fallowPastureLand => $composableBuilder(
    column: $table.fallowPastureLand,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get conventionalCrops => $composableBuilder(
    column: $table.conventionalCrops,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get estYieldKg => $composableBuilder(
    column: $table.estYieldKg,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get certType => $composableBuilder(
    column: $table.certType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get conversionStatus => $composableBuilder(
    column: $table.conversionStatus,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get conversionDate => $composableBuilder(
    column: $table.conversionDate,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get inspectorName => $composableBuilder(
    column: $table.inspectorName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get conversionQualified => $composableBuilder(
    column: $table.conversionQualified,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get conversionRemarks => $composableBuilder(
    column: $table.conversionRemarks,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get soilCollectionDate => $composableBuilder(
    column: $table.soilCollectionDate,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get soilLabTestingDate => $composableBuilder(
    column: $table.soilLabTestingDate,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get soilResultDate => $composableBuilder(
    column: $table.soilResultDate,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get soilReportUrl => $composableBuilder(
    column: $table.soilReportUrl,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get soilSamplesInfo => $composableBuilder(
    column: $table.soilSamplesInfo,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get soilCriteria => $composableBuilder(
    column: $table.soilCriteria,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get lastSyncedAt => $composableBuilder(
    column: $table.lastSyncedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$FarmLandCacheTableAnnotationComposer
    extends Composer<_$AppDatabase, $FarmLandCacheTable> {
  $$FarmLandCacheTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get farmerId =>
      $composableBuilder(column: $table.farmerId, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<double> get sizeHectares => $composableBuilder(
    column: $table.sizeHectares,
    builder: (column) => column,
  );

  GeneratedColumn<double> get latitude =>
      $composableBuilder(column: $table.latitude, builder: (column) => column);

  GeneratedColumn<double> get longitude =>
      $composableBuilder(column: $table.longitude, builder: (column) => column);

  GeneratedColumn<String> get landOwnership => $composableBuilder(
    column: $table.landOwnership,
    builder: (column) => column,
  );

  GeneratedColumn<String> get waterSource => $composableBuilder(
    column: $table.waterSource,
    builder: (column) => column,
  );

  GeneratedColumn<String> get soilFertility => $composableBuilder(
    column: $table.soilFertility,
    builder: (column) => column,
  );

  GeneratedColumn<String> get boundaryGeoJson => $composableBuilder(
    column: $table.boundaryGeoJson,
    builder: (column) => column,
  );

  GeneratedColumn<String> get landSurveyNo => $composableBuilder(
    column: $table.landSurveyNo,
    builder: (column) => column,
  );

  GeneratedColumn<String> get approachRoad => $composableBuilder(
    column: $table.approachRoad,
    builder: (column) => column,
  );

  GeneratedColumn<String> get landTopology => $composableBuilder(
    column: $table.landTopology,
    builder: (column) => column,
  );

  GeneratedColumn<String> get landGradient => $composableBuilder(
    column: $table.landGradient,
    builder: (column) => column,
  );

  GeneratedColumn<String> get landDocumentUrl => $composableBuilder(
    column: $table.landDocumentUrl,
    builder: (column) => column,
  );

  GeneratedColumn<String> get powerSource => $composableBuilder(
    column: $table.powerSource,
    builder: (column) => column,
  );

  GeneratedColumn<String> get farmPhotoUrl => $composableBuilder(
    column: $table.farmPhotoUrl,
    builder: (column) => column,
  );

  GeneratedColumn<String> get irrigationSource => $composableBuilder(
    column: $table.irrigationSource,
    builder: (column) => column,
  );

  GeneratedColumn<String> get irrigationType => $composableBuilder(
    column: $table.irrigationType,
    builder: (column) => column,
  );

  GeneratedColumn<double> get fullTimeWorkers => $composableBuilder(
    column: $table.fullTimeWorkers,
    builder: (column) => column,
  );

  GeneratedColumn<double> get partTimeWorkers => $composableBuilder(
    column: $table.partTimeWorkers,
    builder: (column) => column,
  );

  GeneratedColumn<double> get seasonalWorkers => $composableBuilder(
    column: $table.seasonalWorkers,
    builder: (column) => column,
  );

  GeneratedColumn<double> get familyWorkers => $composableBuilder(
    column: $table.familyWorkers,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get lastChemicalApplicationDate =>
      $composableBuilder(
        column: $table.lastChemicalApplicationDate,
        builder: (column) => column,
      );

  GeneratedColumn<String> get conventionalLands => $composableBuilder(
    column: $table.conventionalLands,
    builder: (column) => column,
  );

  GeneratedColumn<String> get fallowPastureLand => $composableBuilder(
    column: $table.fallowPastureLand,
    builder: (column) => column,
  );

  GeneratedColumn<String> get conventionalCrops => $composableBuilder(
    column: $table.conventionalCrops,
    builder: (column) => column,
  );

  GeneratedColumn<double> get estYieldKg => $composableBuilder(
    column: $table.estYieldKg,
    builder: (column) => column,
  );

  GeneratedColumn<String> get certType =>
      $composableBuilder(column: $table.certType, builder: (column) => column);

  GeneratedColumn<String> get conversionStatus => $composableBuilder(
    column: $table.conversionStatus,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get conversionDate => $composableBuilder(
    column: $table.conversionDate,
    builder: (column) => column,
  );

  GeneratedColumn<String> get inspectorName => $composableBuilder(
    column: $table.inspectorName,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get conversionQualified => $composableBuilder(
    column: $table.conversionQualified,
    builder: (column) => column,
  );

  GeneratedColumn<String> get conversionRemarks => $composableBuilder(
    column: $table.conversionRemarks,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get soilCollectionDate => $composableBuilder(
    column: $table.soilCollectionDate,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get soilLabTestingDate => $composableBuilder(
    column: $table.soilLabTestingDate,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get soilResultDate => $composableBuilder(
    column: $table.soilResultDate,
    builder: (column) => column,
  );

  GeneratedColumn<String> get soilReportUrl => $composableBuilder(
    column: $table.soilReportUrl,
    builder: (column) => column,
  );

  GeneratedColumn<String> get soilSamplesInfo => $composableBuilder(
    column: $table.soilSamplesInfo,
    builder: (column) => column,
  );

  GeneratedColumn<String> get soilCriteria => $composableBuilder(
    column: $table.soilCriteria,
    builder: (column) => column,
  );

  GeneratedColumn<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get lastSyncedAt => $composableBuilder(
    column: $table.lastSyncedAt,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$FarmLandCacheTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $FarmLandCacheTable,
          FarmLandCacheData,
          $$FarmLandCacheTableFilterComposer,
          $$FarmLandCacheTableOrderingComposer,
          $$FarmLandCacheTableAnnotationComposer,
          $$FarmLandCacheTableCreateCompanionBuilder,
          $$FarmLandCacheTableUpdateCompanionBuilder,
          (
            FarmLandCacheData,
            BaseReferences<
              _$AppDatabase,
              $FarmLandCacheTable,
              FarmLandCacheData
            >,
          ),
          FarmLandCacheData,
          PrefetchHooks Function()
        > {
  $$FarmLandCacheTableTableManager(_$AppDatabase db, $FarmLandCacheTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$FarmLandCacheTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$FarmLandCacheTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$FarmLandCacheTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> farmerId = const Value.absent(),
                Value<String> name = const Value.absent(),
                Value<double?> sizeHectares = const Value.absent(),
                Value<double?> latitude = const Value.absent(),
                Value<double?> longitude = const Value.absent(),
                Value<String?> landOwnership = const Value.absent(),
                Value<String?> waterSource = const Value.absent(),
                Value<String?> soilFertility = const Value.absent(),
                Value<String?> boundaryGeoJson = const Value.absent(),
                Value<String?> landSurveyNo = const Value.absent(),
                Value<String?> approachRoad = const Value.absent(),
                Value<String?> landTopology = const Value.absent(),
                Value<String?> landGradient = const Value.absent(),
                Value<String?> landDocumentUrl = const Value.absent(),
                Value<String?> powerSource = const Value.absent(),
                Value<String?> farmPhotoUrl = const Value.absent(),
                Value<String?> irrigationSource = const Value.absent(),
                Value<String?> irrigationType = const Value.absent(),
                Value<double?> fullTimeWorkers = const Value.absent(),
                Value<double?> partTimeWorkers = const Value.absent(),
                Value<double?> seasonalWorkers = const Value.absent(),
                Value<double?> familyWorkers = const Value.absent(),
                Value<DateTime?> lastChemicalApplicationDate =
                    const Value.absent(),
                Value<String?> conventionalLands = const Value.absent(),
                Value<String?> fallowPastureLand = const Value.absent(),
                Value<String?> conventionalCrops = const Value.absent(),
                Value<double?> estYieldKg = const Value.absent(),
                Value<String?> certType = const Value.absent(),
                Value<String?> conversionStatus = const Value.absent(),
                Value<DateTime?> conversionDate = const Value.absent(),
                Value<String?> inspectorName = const Value.absent(),
                Value<bool?> conversionQualified = const Value.absent(),
                Value<String?> conversionRemarks = const Value.absent(),
                Value<DateTime?> soilCollectionDate = const Value.absent(),
                Value<DateTime?> soilLabTestingDate = const Value.absent(),
                Value<DateTime?> soilResultDate = const Value.absent(),
                Value<String?> soilReportUrl = const Value.absent(),
                Value<String?> soilSamplesInfo = const Value.absent(),
                Value<String?> soilCriteria = const Value.absent(),
                Value<String> syncStatus = const Value.absent(),
                Value<DateTime?> lastSyncedAt = const Value.absent(),
                Value<DateTime?> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => FarmLandCacheCompanion(
                id: id,
                farmerId: farmerId,
                name: name,
                sizeHectares: sizeHectares,
                latitude: latitude,
                longitude: longitude,
                landOwnership: landOwnership,
                waterSource: waterSource,
                soilFertility: soilFertility,
                boundaryGeoJson: boundaryGeoJson,
                landSurveyNo: landSurveyNo,
                approachRoad: approachRoad,
                landTopology: landTopology,
                landGradient: landGradient,
                landDocumentUrl: landDocumentUrl,
                powerSource: powerSource,
                farmPhotoUrl: farmPhotoUrl,
                irrigationSource: irrigationSource,
                irrigationType: irrigationType,
                fullTimeWorkers: fullTimeWorkers,
                partTimeWorkers: partTimeWorkers,
                seasonalWorkers: seasonalWorkers,
                familyWorkers: familyWorkers,
                lastChemicalApplicationDate: lastChemicalApplicationDate,
                conventionalLands: conventionalLands,
                fallowPastureLand: fallowPastureLand,
                conventionalCrops: conventionalCrops,
                estYieldKg: estYieldKg,
                certType: certType,
                conversionStatus: conversionStatus,
                conversionDate: conversionDate,
                inspectorName: inspectorName,
                conversionQualified: conversionQualified,
                conversionRemarks: conversionRemarks,
                soilCollectionDate: soilCollectionDate,
                soilLabTestingDate: soilLabTestingDate,
                soilResultDate: soilResultDate,
                soilReportUrl: soilReportUrl,
                soilSamplesInfo: soilSamplesInfo,
                soilCriteria: soilCriteria,
                syncStatus: syncStatus,
                lastSyncedAt: lastSyncedAt,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String farmerId,
                required String name,
                Value<double?> sizeHectares = const Value.absent(),
                Value<double?> latitude = const Value.absent(),
                Value<double?> longitude = const Value.absent(),
                Value<String?> landOwnership = const Value.absent(),
                Value<String?> waterSource = const Value.absent(),
                Value<String?> soilFertility = const Value.absent(),
                Value<String?> boundaryGeoJson = const Value.absent(),
                Value<String?> landSurveyNo = const Value.absent(),
                Value<String?> approachRoad = const Value.absent(),
                Value<String?> landTopology = const Value.absent(),
                Value<String?> landGradient = const Value.absent(),
                Value<String?> landDocumentUrl = const Value.absent(),
                Value<String?> powerSource = const Value.absent(),
                Value<String?> farmPhotoUrl = const Value.absent(),
                Value<String?> irrigationSource = const Value.absent(),
                Value<String?> irrigationType = const Value.absent(),
                Value<double?> fullTimeWorkers = const Value.absent(),
                Value<double?> partTimeWorkers = const Value.absent(),
                Value<double?> seasonalWorkers = const Value.absent(),
                Value<double?> familyWorkers = const Value.absent(),
                Value<DateTime?> lastChemicalApplicationDate =
                    const Value.absent(),
                Value<String?> conventionalLands = const Value.absent(),
                Value<String?> fallowPastureLand = const Value.absent(),
                Value<String?> conventionalCrops = const Value.absent(),
                Value<double?> estYieldKg = const Value.absent(),
                Value<String?> certType = const Value.absent(),
                Value<String?> conversionStatus = const Value.absent(),
                Value<DateTime?> conversionDate = const Value.absent(),
                Value<String?> inspectorName = const Value.absent(),
                Value<bool?> conversionQualified = const Value.absent(),
                Value<String?> conversionRemarks = const Value.absent(),
                Value<DateTime?> soilCollectionDate = const Value.absent(),
                Value<DateTime?> soilLabTestingDate = const Value.absent(),
                Value<DateTime?> soilResultDate = const Value.absent(),
                Value<String?> soilReportUrl = const Value.absent(),
                Value<String?> soilSamplesInfo = const Value.absent(),
                Value<String?> soilCriteria = const Value.absent(),
                Value<String> syncStatus = const Value.absent(),
                Value<DateTime?> lastSyncedAt = const Value.absent(),
                Value<DateTime?> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => FarmLandCacheCompanion.insert(
                id: id,
                farmerId: farmerId,
                name: name,
                sizeHectares: sizeHectares,
                latitude: latitude,
                longitude: longitude,
                landOwnership: landOwnership,
                waterSource: waterSource,
                soilFertility: soilFertility,
                boundaryGeoJson: boundaryGeoJson,
                landSurveyNo: landSurveyNo,
                approachRoad: approachRoad,
                landTopology: landTopology,
                landGradient: landGradient,
                landDocumentUrl: landDocumentUrl,
                powerSource: powerSource,
                farmPhotoUrl: farmPhotoUrl,
                irrigationSource: irrigationSource,
                irrigationType: irrigationType,
                fullTimeWorkers: fullTimeWorkers,
                partTimeWorkers: partTimeWorkers,
                seasonalWorkers: seasonalWorkers,
                familyWorkers: familyWorkers,
                lastChemicalApplicationDate: lastChemicalApplicationDate,
                conventionalLands: conventionalLands,
                fallowPastureLand: fallowPastureLand,
                conventionalCrops: conventionalCrops,
                estYieldKg: estYieldKg,
                certType: certType,
                conversionStatus: conversionStatus,
                conversionDate: conversionDate,
                inspectorName: inspectorName,
                conversionQualified: conversionQualified,
                conversionRemarks: conversionRemarks,
                soilCollectionDate: soilCollectionDate,
                soilLabTestingDate: soilLabTestingDate,
                soilResultDate: soilResultDate,
                soilReportUrl: soilReportUrl,
                soilSamplesInfo: soilSamplesInfo,
                soilCriteria: soilCriteria,
                syncStatus: syncStatus,
                lastSyncedAt: lastSyncedAt,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$FarmLandCacheTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $FarmLandCacheTable,
      FarmLandCacheData,
      $$FarmLandCacheTableFilterComposer,
      $$FarmLandCacheTableOrderingComposer,
      $$FarmLandCacheTableAnnotationComposer,
      $$FarmLandCacheTableCreateCompanionBuilder,
      $$FarmLandCacheTableUpdateCompanionBuilder,
      (
        FarmLandCacheData,
        BaseReferences<_$AppDatabase, $FarmLandCacheTable, FarmLandCacheData>,
      ),
      FarmLandCacheData,
      PrefetchHooks Function()
    >;
typedef $$CultivationCacheTableCreateCompanionBuilder =
    CultivationCacheCompanion Function({
      required String id,
      required String farmId,
      required String cropName,
      Value<String?> variety,
      Value<String?> season,
      Value<double?> cultivationAreaHa,
      Value<DateTime?> sowingDate,
      Value<double?> estimatedYield,
      Value<double?> actualYield,
      Value<double?> seedCost,
      Value<double?> sowingCost,
      Value<String> status,
      Value<String?> cropCategory,
      Value<String?> cropCalendarId,
      Value<String?> cultivationGeoJson,
      Value<String?> photoUrl,
      Value<String?> seedSource,
      Value<bool?> isSeedTreated,
      Value<String?> seedType,
      Value<double?> seedQuantity,
      Value<double?> seedPrice,
      Value<String?> sowingType,
      Value<String?> sowingChargesBy,
      Value<double?> sowingCharges,
      Value<String?> bambooVariety,
      Value<double?> seedlingCount,
      Value<String> syncStatus,
      Value<DateTime?> lastSyncedAt,
      Value<DateTime?> updatedAt,
      Value<int> rowid,
    });
typedef $$CultivationCacheTableUpdateCompanionBuilder =
    CultivationCacheCompanion Function({
      Value<String> id,
      Value<String> farmId,
      Value<String> cropName,
      Value<String?> variety,
      Value<String?> season,
      Value<double?> cultivationAreaHa,
      Value<DateTime?> sowingDate,
      Value<double?> estimatedYield,
      Value<double?> actualYield,
      Value<double?> seedCost,
      Value<double?> sowingCost,
      Value<String> status,
      Value<String?> cropCategory,
      Value<String?> cropCalendarId,
      Value<String?> cultivationGeoJson,
      Value<String?> photoUrl,
      Value<String?> seedSource,
      Value<bool?> isSeedTreated,
      Value<String?> seedType,
      Value<double?> seedQuantity,
      Value<double?> seedPrice,
      Value<String?> sowingType,
      Value<String?> sowingChargesBy,
      Value<double?> sowingCharges,
      Value<String?> bambooVariety,
      Value<double?> seedlingCount,
      Value<String> syncStatus,
      Value<DateTime?> lastSyncedAt,
      Value<DateTime?> updatedAt,
      Value<int> rowid,
    });

class $$CultivationCacheTableFilterComposer
    extends Composer<_$AppDatabase, $CultivationCacheTable> {
  $$CultivationCacheTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get farmId => $composableBuilder(
    column: $table.farmId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get cropName => $composableBuilder(
    column: $table.cropName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get variety => $composableBuilder(
    column: $table.variety,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get season => $composableBuilder(
    column: $table.season,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get cultivationAreaHa => $composableBuilder(
    column: $table.cultivationAreaHa,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get sowingDate => $composableBuilder(
    column: $table.sowingDate,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get estimatedYield => $composableBuilder(
    column: $table.estimatedYield,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get actualYield => $composableBuilder(
    column: $table.actualYield,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get seedCost => $composableBuilder(
    column: $table.seedCost,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get sowingCost => $composableBuilder(
    column: $table.sowingCost,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get cropCategory => $composableBuilder(
    column: $table.cropCategory,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get cropCalendarId => $composableBuilder(
    column: $table.cropCalendarId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get cultivationGeoJson => $composableBuilder(
    column: $table.cultivationGeoJson,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get photoUrl => $composableBuilder(
    column: $table.photoUrl,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get seedSource => $composableBuilder(
    column: $table.seedSource,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get isSeedTreated => $composableBuilder(
    column: $table.isSeedTreated,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get seedType => $composableBuilder(
    column: $table.seedType,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get seedQuantity => $composableBuilder(
    column: $table.seedQuantity,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get seedPrice => $composableBuilder(
    column: $table.seedPrice,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get sowingType => $composableBuilder(
    column: $table.sowingType,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get sowingChargesBy => $composableBuilder(
    column: $table.sowingChargesBy,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get sowingCharges => $composableBuilder(
    column: $table.sowingCharges,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get bambooVariety => $composableBuilder(
    column: $table.bambooVariety,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get seedlingCount => $composableBuilder(
    column: $table.seedlingCount,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get lastSyncedAt => $composableBuilder(
    column: $table.lastSyncedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$CultivationCacheTableOrderingComposer
    extends Composer<_$AppDatabase, $CultivationCacheTable> {
  $$CultivationCacheTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get farmId => $composableBuilder(
    column: $table.farmId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get cropName => $composableBuilder(
    column: $table.cropName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get variety => $composableBuilder(
    column: $table.variety,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get season => $composableBuilder(
    column: $table.season,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get cultivationAreaHa => $composableBuilder(
    column: $table.cultivationAreaHa,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get sowingDate => $composableBuilder(
    column: $table.sowingDate,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get estimatedYield => $composableBuilder(
    column: $table.estimatedYield,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get actualYield => $composableBuilder(
    column: $table.actualYield,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get seedCost => $composableBuilder(
    column: $table.seedCost,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get sowingCost => $composableBuilder(
    column: $table.sowingCost,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get cropCategory => $composableBuilder(
    column: $table.cropCategory,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get cropCalendarId => $composableBuilder(
    column: $table.cropCalendarId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get cultivationGeoJson => $composableBuilder(
    column: $table.cultivationGeoJson,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get photoUrl => $composableBuilder(
    column: $table.photoUrl,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get seedSource => $composableBuilder(
    column: $table.seedSource,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get isSeedTreated => $composableBuilder(
    column: $table.isSeedTreated,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get seedType => $composableBuilder(
    column: $table.seedType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get seedQuantity => $composableBuilder(
    column: $table.seedQuantity,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get seedPrice => $composableBuilder(
    column: $table.seedPrice,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get sowingType => $composableBuilder(
    column: $table.sowingType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get sowingChargesBy => $composableBuilder(
    column: $table.sowingChargesBy,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get sowingCharges => $composableBuilder(
    column: $table.sowingCharges,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get bambooVariety => $composableBuilder(
    column: $table.bambooVariety,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get seedlingCount => $composableBuilder(
    column: $table.seedlingCount,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get lastSyncedAt => $composableBuilder(
    column: $table.lastSyncedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$CultivationCacheTableAnnotationComposer
    extends Composer<_$AppDatabase, $CultivationCacheTable> {
  $$CultivationCacheTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get farmId =>
      $composableBuilder(column: $table.farmId, builder: (column) => column);

  GeneratedColumn<String> get cropName =>
      $composableBuilder(column: $table.cropName, builder: (column) => column);

  GeneratedColumn<String> get variety =>
      $composableBuilder(column: $table.variety, builder: (column) => column);

  GeneratedColumn<String> get season =>
      $composableBuilder(column: $table.season, builder: (column) => column);

  GeneratedColumn<double> get cultivationAreaHa => $composableBuilder(
    column: $table.cultivationAreaHa,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get sowingDate => $composableBuilder(
    column: $table.sowingDate,
    builder: (column) => column,
  );

  GeneratedColumn<double> get estimatedYield => $composableBuilder(
    column: $table.estimatedYield,
    builder: (column) => column,
  );

  GeneratedColumn<double> get actualYield => $composableBuilder(
    column: $table.actualYield,
    builder: (column) => column,
  );

  GeneratedColumn<double> get seedCost =>
      $composableBuilder(column: $table.seedCost, builder: (column) => column);

  GeneratedColumn<double> get sowingCost => $composableBuilder(
    column: $table.sowingCost,
    builder: (column) => column,
  );

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<String> get cropCategory => $composableBuilder(
    column: $table.cropCategory,
    builder: (column) => column,
  );

  GeneratedColumn<String> get cropCalendarId => $composableBuilder(
    column: $table.cropCalendarId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get cultivationGeoJson => $composableBuilder(
    column: $table.cultivationGeoJson,
    builder: (column) => column,
  );

  GeneratedColumn<String> get photoUrl =>
      $composableBuilder(column: $table.photoUrl, builder: (column) => column);

  GeneratedColumn<String> get seedSource => $composableBuilder(
    column: $table.seedSource,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get isSeedTreated => $composableBuilder(
    column: $table.isSeedTreated,
    builder: (column) => column,
  );

  GeneratedColumn<String> get seedType =>
      $composableBuilder(column: $table.seedType, builder: (column) => column);

  GeneratedColumn<double> get seedQuantity => $composableBuilder(
    column: $table.seedQuantity,
    builder: (column) => column,
  );

  GeneratedColumn<double> get seedPrice =>
      $composableBuilder(column: $table.seedPrice, builder: (column) => column);

  GeneratedColumn<String> get sowingType => $composableBuilder(
    column: $table.sowingType,
    builder: (column) => column,
  );

  GeneratedColumn<String> get sowingChargesBy => $composableBuilder(
    column: $table.sowingChargesBy,
    builder: (column) => column,
  );

  GeneratedColumn<double> get sowingCharges => $composableBuilder(
    column: $table.sowingCharges,
    builder: (column) => column,
  );

  GeneratedColumn<String> get bambooVariety => $composableBuilder(
    column: $table.bambooVariety,
    builder: (column) => column,
  );

  GeneratedColumn<double> get seedlingCount => $composableBuilder(
    column: $table.seedlingCount,
    builder: (column) => column,
  );

  GeneratedColumn<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get lastSyncedAt => $composableBuilder(
    column: $table.lastSyncedAt,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$CultivationCacheTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $CultivationCacheTable,
          CultivationCacheData,
          $$CultivationCacheTableFilterComposer,
          $$CultivationCacheTableOrderingComposer,
          $$CultivationCacheTableAnnotationComposer,
          $$CultivationCacheTableCreateCompanionBuilder,
          $$CultivationCacheTableUpdateCompanionBuilder,
          (
            CultivationCacheData,
            BaseReferences<
              _$AppDatabase,
              $CultivationCacheTable,
              CultivationCacheData
            >,
          ),
          CultivationCacheData,
          PrefetchHooks Function()
        > {
  $$CultivationCacheTableTableManager(
    _$AppDatabase db,
    $CultivationCacheTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CultivationCacheTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CultivationCacheTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$CultivationCacheTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> farmId = const Value.absent(),
                Value<String> cropName = const Value.absent(),
                Value<String?> variety = const Value.absent(),
                Value<String?> season = const Value.absent(),
                Value<double?> cultivationAreaHa = const Value.absent(),
                Value<DateTime?> sowingDate = const Value.absent(),
                Value<double?> estimatedYield = const Value.absent(),
                Value<double?> actualYield = const Value.absent(),
                Value<double?> seedCost = const Value.absent(),
                Value<double?> sowingCost = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<String?> cropCategory = const Value.absent(),
                Value<String?> cropCalendarId = const Value.absent(),
                Value<String?> cultivationGeoJson = const Value.absent(),
                Value<String?> photoUrl = const Value.absent(),
                Value<String?> seedSource = const Value.absent(),
                Value<bool?> isSeedTreated = const Value.absent(),
                Value<String?> seedType = const Value.absent(),
                Value<double?> seedQuantity = const Value.absent(),
                Value<double?> seedPrice = const Value.absent(),
                Value<String?> sowingType = const Value.absent(),
                Value<String?> sowingChargesBy = const Value.absent(),
                Value<double?> sowingCharges = const Value.absent(),
                Value<String?> bambooVariety = const Value.absent(),
                Value<double?> seedlingCount = const Value.absent(),
                Value<String> syncStatus = const Value.absent(),
                Value<DateTime?> lastSyncedAt = const Value.absent(),
                Value<DateTime?> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => CultivationCacheCompanion(
                id: id,
                farmId: farmId,
                cropName: cropName,
                variety: variety,
                season: season,
                cultivationAreaHa: cultivationAreaHa,
                sowingDate: sowingDate,
                estimatedYield: estimatedYield,
                actualYield: actualYield,
                seedCost: seedCost,
                sowingCost: sowingCost,
                status: status,
                cropCategory: cropCategory,
                cropCalendarId: cropCalendarId,
                cultivationGeoJson: cultivationGeoJson,
                photoUrl: photoUrl,
                seedSource: seedSource,
                isSeedTreated: isSeedTreated,
                seedType: seedType,
                seedQuantity: seedQuantity,
                seedPrice: seedPrice,
                sowingType: sowingType,
                sowingChargesBy: sowingChargesBy,
                sowingCharges: sowingCharges,
                bambooVariety: bambooVariety,
                seedlingCount: seedlingCount,
                syncStatus: syncStatus,
                lastSyncedAt: lastSyncedAt,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String farmId,
                required String cropName,
                Value<String?> variety = const Value.absent(),
                Value<String?> season = const Value.absent(),
                Value<double?> cultivationAreaHa = const Value.absent(),
                Value<DateTime?> sowingDate = const Value.absent(),
                Value<double?> estimatedYield = const Value.absent(),
                Value<double?> actualYield = const Value.absent(),
                Value<double?> seedCost = const Value.absent(),
                Value<double?> sowingCost = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<String?> cropCategory = const Value.absent(),
                Value<String?> cropCalendarId = const Value.absent(),
                Value<String?> cultivationGeoJson = const Value.absent(),
                Value<String?> photoUrl = const Value.absent(),
                Value<String?> seedSource = const Value.absent(),
                Value<bool?> isSeedTreated = const Value.absent(),
                Value<String?> seedType = const Value.absent(),
                Value<double?> seedQuantity = const Value.absent(),
                Value<double?> seedPrice = const Value.absent(),
                Value<String?> sowingType = const Value.absent(),
                Value<String?> sowingChargesBy = const Value.absent(),
                Value<double?> sowingCharges = const Value.absent(),
                Value<String?> bambooVariety = const Value.absent(),
                Value<double?> seedlingCount = const Value.absent(),
                Value<String> syncStatus = const Value.absent(),
                Value<DateTime?> lastSyncedAt = const Value.absent(),
                Value<DateTime?> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => CultivationCacheCompanion.insert(
                id: id,
                farmId: farmId,
                cropName: cropName,
                variety: variety,
                season: season,
                cultivationAreaHa: cultivationAreaHa,
                sowingDate: sowingDate,
                estimatedYield: estimatedYield,
                actualYield: actualYield,
                seedCost: seedCost,
                sowingCost: sowingCost,
                status: status,
                cropCategory: cropCategory,
                cropCalendarId: cropCalendarId,
                cultivationGeoJson: cultivationGeoJson,
                photoUrl: photoUrl,
                seedSource: seedSource,
                isSeedTreated: isSeedTreated,
                seedType: seedType,
                seedQuantity: seedQuantity,
                seedPrice: seedPrice,
                sowingType: sowingType,
                sowingChargesBy: sowingChargesBy,
                sowingCharges: sowingCharges,
                bambooVariety: bambooVariety,
                seedlingCount: seedlingCount,
                syncStatus: syncStatus,
                lastSyncedAt: lastSyncedAt,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$CultivationCacheTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $CultivationCacheTable,
      CultivationCacheData,
      $$CultivationCacheTableFilterComposer,
      $$CultivationCacheTableOrderingComposer,
      $$CultivationCacheTableAnnotationComposer,
      $$CultivationCacheTableCreateCompanionBuilder,
      $$CultivationCacheTableUpdateCompanionBuilder,
      (
        CultivationCacheData,
        BaseReferences<
          _$AppDatabase,
          $CultivationCacheTable,
          CultivationCacheData
        >,
      ),
      CultivationCacheData,
      PrefetchHooks Function()
    >;
typedef $$VslaGroupCacheTableCreateCompanionBuilder =
    VslaGroupCacheCompanion Function({
      required String id,
      required String name,
      Value<double?> shareValue,
      Value<double?> loanRate,
      Value<double?> maxLoanAmount,
      Value<bool> isActive,
      Value<String> syncStatus,
      Value<DateTime?> lastSyncedAt,
      Value<int> rowid,
    });
typedef $$VslaGroupCacheTableUpdateCompanionBuilder =
    VslaGroupCacheCompanion Function({
      Value<String> id,
      Value<String> name,
      Value<double?> shareValue,
      Value<double?> loanRate,
      Value<double?> maxLoanAmount,
      Value<bool> isActive,
      Value<String> syncStatus,
      Value<DateTime?> lastSyncedAt,
      Value<int> rowid,
    });

class $$VslaGroupCacheTableFilterComposer
    extends Composer<_$AppDatabase, $VslaGroupCacheTable> {
  $$VslaGroupCacheTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get shareValue => $composableBuilder(
    column: $table.shareValue,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get loanRate => $composableBuilder(
    column: $table.loanRate,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get maxLoanAmount => $composableBuilder(
    column: $table.maxLoanAmount,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get isActive => $composableBuilder(
    column: $table.isActive,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get lastSyncedAt => $composableBuilder(
    column: $table.lastSyncedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$VslaGroupCacheTableOrderingComposer
    extends Composer<_$AppDatabase, $VslaGroupCacheTable> {
  $$VslaGroupCacheTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get shareValue => $composableBuilder(
    column: $table.shareValue,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get loanRate => $composableBuilder(
    column: $table.loanRate,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get maxLoanAmount => $composableBuilder(
    column: $table.maxLoanAmount,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get isActive => $composableBuilder(
    column: $table.isActive,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get lastSyncedAt => $composableBuilder(
    column: $table.lastSyncedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$VslaGroupCacheTableAnnotationComposer
    extends Composer<_$AppDatabase, $VslaGroupCacheTable> {
  $$VslaGroupCacheTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<double> get shareValue => $composableBuilder(
    column: $table.shareValue,
    builder: (column) => column,
  );

  GeneratedColumn<double> get loanRate =>
      $composableBuilder(column: $table.loanRate, builder: (column) => column);

  GeneratedColumn<double> get maxLoanAmount => $composableBuilder(
    column: $table.maxLoanAmount,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get isActive =>
      $composableBuilder(column: $table.isActive, builder: (column) => column);

  GeneratedColumn<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get lastSyncedAt => $composableBuilder(
    column: $table.lastSyncedAt,
    builder: (column) => column,
  );
}

class $$VslaGroupCacheTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $VslaGroupCacheTable,
          VslaGroupCacheData,
          $$VslaGroupCacheTableFilterComposer,
          $$VslaGroupCacheTableOrderingComposer,
          $$VslaGroupCacheTableAnnotationComposer,
          $$VslaGroupCacheTableCreateCompanionBuilder,
          $$VslaGroupCacheTableUpdateCompanionBuilder,
          (
            VslaGroupCacheData,
            BaseReferences<
              _$AppDatabase,
              $VslaGroupCacheTable,
              VslaGroupCacheData
            >,
          ),
          VslaGroupCacheData,
          PrefetchHooks Function()
        > {
  $$VslaGroupCacheTableTableManager(
    _$AppDatabase db,
    $VslaGroupCacheTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$VslaGroupCacheTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$VslaGroupCacheTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$VslaGroupCacheTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> name = const Value.absent(),
                Value<double?> shareValue = const Value.absent(),
                Value<double?> loanRate = const Value.absent(),
                Value<double?> maxLoanAmount = const Value.absent(),
                Value<bool> isActive = const Value.absent(),
                Value<String> syncStatus = const Value.absent(),
                Value<DateTime?> lastSyncedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => VslaGroupCacheCompanion(
                id: id,
                name: name,
                shareValue: shareValue,
                loanRate: loanRate,
                maxLoanAmount: maxLoanAmount,
                isActive: isActive,
                syncStatus: syncStatus,
                lastSyncedAt: lastSyncedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String name,
                Value<double?> shareValue = const Value.absent(),
                Value<double?> loanRate = const Value.absent(),
                Value<double?> maxLoanAmount = const Value.absent(),
                Value<bool> isActive = const Value.absent(),
                Value<String> syncStatus = const Value.absent(),
                Value<DateTime?> lastSyncedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => VslaGroupCacheCompanion.insert(
                id: id,
                name: name,
                shareValue: shareValue,
                loanRate: loanRate,
                maxLoanAmount: maxLoanAmount,
                isActive: isActive,
                syncStatus: syncStatus,
                lastSyncedAt: lastSyncedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$VslaGroupCacheTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $VslaGroupCacheTable,
      VslaGroupCacheData,
      $$VslaGroupCacheTableFilterComposer,
      $$VslaGroupCacheTableOrderingComposer,
      $$VslaGroupCacheTableAnnotationComposer,
      $$VslaGroupCacheTableCreateCompanionBuilder,
      $$VslaGroupCacheTableUpdateCompanionBuilder,
      (
        VslaGroupCacheData,
        BaseReferences<_$AppDatabase, $VslaGroupCacheTable, VslaGroupCacheData>,
      ),
      VslaGroupCacheData,
      PrefetchHooks Function()
    >;
typedef $$VslaSavingCacheTableCreateCompanionBuilder =
    VslaSavingCacheCompanion Function({
      required String id,
      required String vslaGroupId,
      required String farmerId,
      required double amount,
      Value<String?> savingType,
      Value<DateTime> savingDate,
      Value<String> syncStatus,
      Value<int> rowid,
    });
typedef $$VslaSavingCacheTableUpdateCompanionBuilder =
    VslaSavingCacheCompanion Function({
      Value<String> id,
      Value<String> vslaGroupId,
      Value<String> farmerId,
      Value<double> amount,
      Value<String?> savingType,
      Value<DateTime> savingDate,
      Value<String> syncStatus,
      Value<int> rowid,
    });

class $$VslaSavingCacheTableFilterComposer
    extends Composer<_$AppDatabase, $VslaSavingCacheTable> {
  $$VslaSavingCacheTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get vslaGroupId => $composableBuilder(
    column: $table.vslaGroupId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get farmerId => $composableBuilder(
    column: $table.farmerId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get amount => $composableBuilder(
    column: $table.amount,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get savingType => $composableBuilder(
    column: $table.savingType,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get savingDate => $composableBuilder(
    column: $table.savingDate,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => ColumnFilters(column),
  );
}

class $$VslaSavingCacheTableOrderingComposer
    extends Composer<_$AppDatabase, $VslaSavingCacheTable> {
  $$VslaSavingCacheTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get vslaGroupId => $composableBuilder(
    column: $table.vslaGroupId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get farmerId => $composableBuilder(
    column: $table.farmerId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get amount => $composableBuilder(
    column: $table.amount,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get savingType => $composableBuilder(
    column: $table.savingType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get savingDate => $composableBuilder(
    column: $table.savingDate,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$VslaSavingCacheTableAnnotationComposer
    extends Composer<_$AppDatabase, $VslaSavingCacheTable> {
  $$VslaSavingCacheTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get vslaGroupId => $composableBuilder(
    column: $table.vslaGroupId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get farmerId =>
      $composableBuilder(column: $table.farmerId, builder: (column) => column);

  GeneratedColumn<double> get amount =>
      $composableBuilder(column: $table.amount, builder: (column) => column);

  GeneratedColumn<String> get savingType => $composableBuilder(
    column: $table.savingType,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get savingDate => $composableBuilder(
    column: $table.savingDate,
    builder: (column) => column,
  );

  GeneratedColumn<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => column,
  );
}

class $$VslaSavingCacheTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $VslaSavingCacheTable,
          VslaSavingCacheData,
          $$VslaSavingCacheTableFilterComposer,
          $$VslaSavingCacheTableOrderingComposer,
          $$VslaSavingCacheTableAnnotationComposer,
          $$VslaSavingCacheTableCreateCompanionBuilder,
          $$VslaSavingCacheTableUpdateCompanionBuilder,
          (
            VslaSavingCacheData,
            BaseReferences<
              _$AppDatabase,
              $VslaSavingCacheTable,
              VslaSavingCacheData
            >,
          ),
          VslaSavingCacheData,
          PrefetchHooks Function()
        > {
  $$VslaSavingCacheTableTableManager(
    _$AppDatabase db,
    $VslaSavingCacheTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$VslaSavingCacheTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$VslaSavingCacheTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$VslaSavingCacheTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> vslaGroupId = const Value.absent(),
                Value<String> farmerId = const Value.absent(),
                Value<double> amount = const Value.absent(),
                Value<String?> savingType = const Value.absent(),
                Value<DateTime> savingDate = const Value.absent(),
                Value<String> syncStatus = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => VslaSavingCacheCompanion(
                id: id,
                vslaGroupId: vslaGroupId,
                farmerId: farmerId,
                amount: amount,
                savingType: savingType,
                savingDate: savingDate,
                syncStatus: syncStatus,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String vslaGroupId,
                required String farmerId,
                required double amount,
                Value<String?> savingType = const Value.absent(),
                Value<DateTime> savingDate = const Value.absent(),
                Value<String> syncStatus = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => VslaSavingCacheCompanion.insert(
                id: id,
                vslaGroupId: vslaGroupId,
                farmerId: farmerId,
                amount: amount,
                savingType: savingType,
                savingDate: savingDate,
                syncStatus: syncStatus,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$VslaSavingCacheTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $VslaSavingCacheTable,
      VslaSavingCacheData,
      $$VslaSavingCacheTableFilterComposer,
      $$VslaSavingCacheTableOrderingComposer,
      $$VslaSavingCacheTableAnnotationComposer,
      $$VslaSavingCacheTableCreateCompanionBuilder,
      $$VslaSavingCacheTableUpdateCompanionBuilder,
      (
        VslaSavingCacheData,
        BaseReferences<
          _$AppDatabase,
          $VslaSavingCacheTable,
          VslaSavingCacheData
        >,
      ),
      VslaSavingCacheData,
      PrefetchHooks Function()
    >;
typedef $$VslaLoanCacheTableCreateCompanionBuilder =
    VslaLoanCacheCompanion Function({
      required String id,
      required String vslaGroupId,
      required String farmerId,
      required double amount,
      Value<double?> interestRate,
      Value<double> repaidAmount,
      Value<String> status,
      Value<DateTime> loanDate,
      Value<String> syncStatus,
      Value<int> rowid,
    });
typedef $$VslaLoanCacheTableUpdateCompanionBuilder =
    VslaLoanCacheCompanion Function({
      Value<String> id,
      Value<String> vslaGroupId,
      Value<String> farmerId,
      Value<double> amount,
      Value<double?> interestRate,
      Value<double> repaidAmount,
      Value<String> status,
      Value<DateTime> loanDate,
      Value<String> syncStatus,
      Value<int> rowid,
    });

class $$VslaLoanCacheTableFilterComposer
    extends Composer<_$AppDatabase, $VslaLoanCacheTable> {
  $$VslaLoanCacheTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get vslaGroupId => $composableBuilder(
    column: $table.vslaGroupId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get farmerId => $composableBuilder(
    column: $table.farmerId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get amount => $composableBuilder(
    column: $table.amount,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get interestRate => $composableBuilder(
    column: $table.interestRate,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get repaidAmount => $composableBuilder(
    column: $table.repaidAmount,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get loanDate => $composableBuilder(
    column: $table.loanDate,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => ColumnFilters(column),
  );
}

class $$VslaLoanCacheTableOrderingComposer
    extends Composer<_$AppDatabase, $VslaLoanCacheTable> {
  $$VslaLoanCacheTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get vslaGroupId => $composableBuilder(
    column: $table.vslaGroupId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get farmerId => $composableBuilder(
    column: $table.farmerId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get amount => $composableBuilder(
    column: $table.amount,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get interestRate => $composableBuilder(
    column: $table.interestRate,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get repaidAmount => $composableBuilder(
    column: $table.repaidAmount,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get loanDate => $composableBuilder(
    column: $table.loanDate,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$VslaLoanCacheTableAnnotationComposer
    extends Composer<_$AppDatabase, $VslaLoanCacheTable> {
  $$VslaLoanCacheTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get vslaGroupId => $composableBuilder(
    column: $table.vslaGroupId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get farmerId =>
      $composableBuilder(column: $table.farmerId, builder: (column) => column);

  GeneratedColumn<double> get amount =>
      $composableBuilder(column: $table.amount, builder: (column) => column);

  GeneratedColumn<double> get interestRate => $composableBuilder(
    column: $table.interestRate,
    builder: (column) => column,
  );

  GeneratedColumn<double> get repaidAmount => $composableBuilder(
    column: $table.repaidAmount,
    builder: (column) => column,
  );

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<DateTime> get loanDate =>
      $composableBuilder(column: $table.loanDate, builder: (column) => column);

  GeneratedColumn<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => column,
  );
}

class $$VslaLoanCacheTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $VslaLoanCacheTable,
          VslaLoanCacheData,
          $$VslaLoanCacheTableFilterComposer,
          $$VslaLoanCacheTableOrderingComposer,
          $$VslaLoanCacheTableAnnotationComposer,
          $$VslaLoanCacheTableCreateCompanionBuilder,
          $$VslaLoanCacheTableUpdateCompanionBuilder,
          (
            VslaLoanCacheData,
            BaseReferences<
              _$AppDatabase,
              $VslaLoanCacheTable,
              VslaLoanCacheData
            >,
          ),
          VslaLoanCacheData,
          PrefetchHooks Function()
        > {
  $$VslaLoanCacheTableTableManager(_$AppDatabase db, $VslaLoanCacheTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$VslaLoanCacheTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$VslaLoanCacheTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$VslaLoanCacheTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> vslaGroupId = const Value.absent(),
                Value<String> farmerId = const Value.absent(),
                Value<double> amount = const Value.absent(),
                Value<double?> interestRate = const Value.absent(),
                Value<double> repaidAmount = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<DateTime> loanDate = const Value.absent(),
                Value<String> syncStatus = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => VslaLoanCacheCompanion(
                id: id,
                vslaGroupId: vslaGroupId,
                farmerId: farmerId,
                amount: amount,
                interestRate: interestRate,
                repaidAmount: repaidAmount,
                status: status,
                loanDate: loanDate,
                syncStatus: syncStatus,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String vslaGroupId,
                required String farmerId,
                required double amount,
                Value<double?> interestRate = const Value.absent(),
                Value<double> repaidAmount = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<DateTime> loanDate = const Value.absent(),
                Value<String> syncStatus = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => VslaLoanCacheCompanion.insert(
                id: id,
                vslaGroupId: vslaGroupId,
                farmerId: farmerId,
                amount: amount,
                interestRate: interestRate,
                repaidAmount: repaidAmount,
                status: status,
                loanDate: loanDate,
                syncStatus: syncStatus,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$VslaLoanCacheTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $VslaLoanCacheTable,
      VslaLoanCacheData,
      $$VslaLoanCacheTableFilterComposer,
      $$VslaLoanCacheTableOrderingComposer,
      $$VslaLoanCacheTableAnnotationComposer,
      $$VslaLoanCacheTableCreateCompanionBuilder,
      $$VslaLoanCacheTableUpdateCompanionBuilder,
      (
        VslaLoanCacheData,
        BaseReferences<_$AppDatabase, $VslaLoanCacheTable, VslaLoanCacheData>,
      ),
      VslaLoanCacheData,
      PrefetchHooks Function()
    >;
typedef $$TrainingCacheTableCreateCompanionBuilder =
    TrainingCacheCompanion Function({
      required String id,
      required String topic,
      Value<DateTime?> date,
      Value<String?> location,
      Value<String?> trainerName,
      Value<String?> description,
      Value<String> syncStatus,
      Value<DateTime?> lastSyncedAt,
      Value<int> rowid,
    });
typedef $$TrainingCacheTableUpdateCompanionBuilder =
    TrainingCacheCompanion Function({
      Value<String> id,
      Value<String> topic,
      Value<DateTime?> date,
      Value<String?> location,
      Value<String?> trainerName,
      Value<String?> description,
      Value<String> syncStatus,
      Value<DateTime?> lastSyncedAt,
      Value<int> rowid,
    });

class $$TrainingCacheTableFilterComposer
    extends Composer<_$AppDatabase, $TrainingCacheTable> {
  $$TrainingCacheTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get topic => $composableBuilder(
    column: $table.topic,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get date => $composableBuilder(
    column: $table.date,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get location => $composableBuilder(
    column: $table.location,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get trainerName => $composableBuilder(
    column: $table.trainerName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get description => $composableBuilder(
    column: $table.description,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get lastSyncedAt => $composableBuilder(
    column: $table.lastSyncedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$TrainingCacheTableOrderingComposer
    extends Composer<_$AppDatabase, $TrainingCacheTable> {
  $$TrainingCacheTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get topic => $composableBuilder(
    column: $table.topic,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get date => $composableBuilder(
    column: $table.date,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get location => $composableBuilder(
    column: $table.location,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get trainerName => $composableBuilder(
    column: $table.trainerName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get description => $composableBuilder(
    column: $table.description,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get lastSyncedAt => $composableBuilder(
    column: $table.lastSyncedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$TrainingCacheTableAnnotationComposer
    extends Composer<_$AppDatabase, $TrainingCacheTable> {
  $$TrainingCacheTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get topic =>
      $composableBuilder(column: $table.topic, builder: (column) => column);

  GeneratedColumn<DateTime> get date =>
      $composableBuilder(column: $table.date, builder: (column) => column);

  GeneratedColumn<String> get location =>
      $composableBuilder(column: $table.location, builder: (column) => column);

  GeneratedColumn<String> get trainerName => $composableBuilder(
    column: $table.trainerName,
    builder: (column) => column,
  );

  GeneratedColumn<String> get description => $composableBuilder(
    column: $table.description,
    builder: (column) => column,
  );

  GeneratedColumn<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get lastSyncedAt => $composableBuilder(
    column: $table.lastSyncedAt,
    builder: (column) => column,
  );
}

class $$TrainingCacheTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $TrainingCacheTable,
          TrainingCacheData,
          $$TrainingCacheTableFilterComposer,
          $$TrainingCacheTableOrderingComposer,
          $$TrainingCacheTableAnnotationComposer,
          $$TrainingCacheTableCreateCompanionBuilder,
          $$TrainingCacheTableUpdateCompanionBuilder,
          (
            TrainingCacheData,
            BaseReferences<
              _$AppDatabase,
              $TrainingCacheTable,
              TrainingCacheData
            >,
          ),
          TrainingCacheData,
          PrefetchHooks Function()
        > {
  $$TrainingCacheTableTableManager(_$AppDatabase db, $TrainingCacheTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$TrainingCacheTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$TrainingCacheTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$TrainingCacheTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> topic = const Value.absent(),
                Value<DateTime?> date = const Value.absent(),
                Value<String?> location = const Value.absent(),
                Value<String?> trainerName = const Value.absent(),
                Value<String?> description = const Value.absent(),
                Value<String> syncStatus = const Value.absent(),
                Value<DateTime?> lastSyncedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => TrainingCacheCompanion(
                id: id,
                topic: topic,
                date: date,
                location: location,
                trainerName: trainerName,
                description: description,
                syncStatus: syncStatus,
                lastSyncedAt: lastSyncedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String topic,
                Value<DateTime?> date = const Value.absent(),
                Value<String?> location = const Value.absent(),
                Value<String?> trainerName = const Value.absent(),
                Value<String?> description = const Value.absent(),
                Value<String> syncStatus = const Value.absent(),
                Value<DateTime?> lastSyncedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => TrainingCacheCompanion.insert(
                id: id,
                topic: topic,
                date: date,
                location: location,
                trainerName: trainerName,
                description: description,
                syncStatus: syncStatus,
                lastSyncedAt: lastSyncedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$TrainingCacheTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $TrainingCacheTable,
      TrainingCacheData,
      $$TrainingCacheTableFilterComposer,
      $$TrainingCacheTableOrderingComposer,
      $$TrainingCacheTableAnnotationComposer,
      $$TrainingCacheTableCreateCompanionBuilder,
      $$TrainingCacheTableUpdateCompanionBuilder,
      (
        TrainingCacheData,
        BaseReferences<_$AppDatabase, $TrainingCacheTable, TrainingCacheData>,
      ),
      TrainingCacheData,
      PrefetchHooks Function()
    >;
typedef $$TrainingAttendanceCacheTableCreateCompanionBuilder =
    TrainingAttendanceCacheCompanion Function({
      required String id,
      required String trainingId,
      required String farmerId,
      Value<bool> attended,
      Value<DateTime> createdAt,
      Value<String> syncStatus,
      Value<int> rowid,
    });
typedef $$TrainingAttendanceCacheTableUpdateCompanionBuilder =
    TrainingAttendanceCacheCompanion Function({
      Value<String> id,
      Value<String> trainingId,
      Value<String> farmerId,
      Value<bool> attended,
      Value<DateTime> createdAt,
      Value<String> syncStatus,
      Value<int> rowid,
    });

class $$TrainingAttendanceCacheTableFilterComposer
    extends Composer<_$AppDatabase, $TrainingAttendanceCacheTable> {
  $$TrainingAttendanceCacheTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get trainingId => $composableBuilder(
    column: $table.trainingId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get farmerId => $composableBuilder(
    column: $table.farmerId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get attended => $composableBuilder(
    column: $table.attended,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => ColumnFilters(column),
  );
}

class $$TrainingAttendanceCacheTableOrderingComposer
    extends Composer<_$AppDatabase, $TrainingAttendanceCacheTable> {
  $$TrainingAttendanceCacheTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get trainingId => $composableBuilder(
    column: $table.trainingId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get farmerId => $composableBuilder(
    column: $table.farmerId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get attended => $composableBuilder(
    column: $table.attended,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$TrainingAttendanceCacheTableAnnotationComposer
    extends Composer<_$AppDatabase, $TrainingAttendanceCacheTable> {
  $$TrainingAttendanceCacheTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get trainingId => $composableBuilder(
    column: $table.trainingId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get farmerId =>
      $composableBuilder(column: $table.farmerId, builder: (column) => column);

  GeneratedColumn<bool> get attended =>
      $composableBuilder(column: $table.attended, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => column,
  );
}

class $$TrainingAttendanceCacheTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $TrainingAttendanceCacheTable,
          TrainingAttendanceCacheData,
          $$TrainingAttendanceCacheTableFilterComposer,
          $$TrainingAttendanceCacheTableOrderingComposer,
          $$TrainingAttendanceCacheTableAnnotationComposer,
          $$TrainingAttendanceCacheTableCreateCompanionBuilder,
          $$TrainingAttendanceCacheTableUpdateCompanionBuilder,
          (
            TrainingAttendanceCacheData,
            BaseReferences<
              _$AppDatabase,
              $TrainingAttendanceCacheTable,
              TrainingAttendanceCacheData
            >,
          ),
          TrainingAttendanceCacheData,
          PrefetchHooks Function()
        > {
  $$TrainingAttendanceCacheTableTableManager(
    _$AppDatabase db,
    $TrainingAttendanceCacheTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$TrainingAttendanceCacheTableFilterComposer(
                $db: db,
                $table: table,
              ),
          createOrderingComposer: () =>
              $$TrainingAttendanceCacheTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              $$TrainingAttendanceCacheTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> trainingId = const Value.absent(),
                Value<String> farmerId = const Value.absent(),
                Value<bool> attended = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<String> syncStatus = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => TrainingAttendanceCacheCompanion(
                id: id,
                trainingId: trainingId,
                farmerId: farmerId,
                attended: attended,
                createdAt: createdAt,
                syncStatus: syncStatus,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String trainingId,
                required String farmerId,
                Value<bool> attended = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<String> syncStatus = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => TrainingAttendanceCacheCompanion.insert(
                id: id,
                trainingId: trainingId,
                farmerId: farmerId,
                attended: attended,
                createdAt: createdAt,
                syncStatus: syncStatus,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$TrainingAttendanceCacheTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $TrainingAttendanceCacheTable,
      TrainingAttendanceCacheData,
      $$TrainingAttendanceCacheTableFilterComposer,
      $$TrainingAttendanceCacheTableOrderingComposer,
      $$TrainingAttendanceCacheTableAnnotationComposer,
      $$TrainingAttendanceCacheTableCreateCompanionBuilder,
      $$TrainingAttendanceCacheTableUpdateCompanionBuilder,
      (
        TrainingAttendanceCacheData,
        BaseReferences<
          _$AppDatabase,
          $TrainingAttendanceCacheTable,
          TrainingAttendanceCacheData
        >,
      ),
      TrainingAttendanceCacheData,
      PrefetchHooks Function()
    >;
typedef $$FarmVisitCacheTableCreateCompanionBuilder =
    FarmVisitCacheCompanion Function({
      required String id,
      required String farmerId,
      required DateTime visitDate,
      required String topic,
      Value<String?> observations,
      Value<String?> recommendations,
      Value<String> status,
      Value<double?> latitude,
      Value<double?> longitude,
      Value<String> syncStatus,
      Value<int> rowid,
    });
typedef $$FarmVisitCacheTableUpdateCompanionBuilder =
    FarmVisitCacheCompanion Function({
      Value<String> id,
      Value<String> farmerId,
      Value<DateTime> visitDate,
      Value<String> topic,
      Value<String?> observations,
      Value<String?> recommendations,
      Value<String> status,
      Value<double?> latitude,
      Value<double?> longitude,
      Value<String> syncStatus,
      Value<int> rowid,
    });

class $$FarmVisitCacheTableFilterComposer
    extends Composer<_$AppDatabase, $FarmVisitCacheTable> {
  $$FarmVisitCacheTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get farmerId => $composableBuilder(
    column: $table.farmerId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get visitDate => $composableBuilder(
    column: $table.visitDate,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get topic => $composableBuilder(
    column: $table.topic,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get observations => $composableBuilder(
    column: $table.observations,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get recommendations => $composableBuilder(
    column: $table.recommendations,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get latitude => $composableBuilder(
    column: $table.latitude,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get longitude => $composableBuilder(
    column: $table.longitude,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => ColumnFilters(column),
  );
}

class $$FarmVisitCacheTableOrderingComposer
    extends Composer<_$AppDatabase, $FarmVisitCacheTable> {
  $$FarmVisitCacheTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get farmerId => $composableBuilder(
    column: $table.farmerId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get visitDate => $composableBuilder(
    column: $table.visitDate,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get topic => $composableBuilder(
    column: $table.topic,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get observations => $composableBuilder(
    column: $table.observations,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get recommendations => $composableBuilder(
    column: $table.recommendations,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get latitude => $composableBuilder(
    column: $table.latitude,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get longitude => $composableBuilder(
    column: $table.longitude,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$FarmVisitCacheTableAnnotationComposer
    extends Composer<_$AppDatabase, $FarmVisitCacheTable> {
  $$FarmVisitCacheTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get farmerId =>
      $composableBuilder(column: $table.farmerId, builder: (column) => column);

  GeneratedColumn<DateTime> get visitDate =>
      $composableBuilder(column: $table.visitDate, builder: (column) => column);

  GeneratedColumn<String> get topic =>
      $composableBuilder(column: $table.topic, builder: (column) => column);

  GeneratedColumn<String> get observations => $composableBuilder(
    column: $table.observations,
    builder: (column) => column,
  );

  GeneratedColumn<String> get recommendations => $composableBuilder(
    column: $table.recommendations,
    builder: (column) => column,
  );

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<double> get latitude =>
      $composableBuilder(column: $table.latitude, builder: (column) => column);

  GeneratedColumn<double> get longitude =>
      $composableBuilder(column: $table.longitude, builder: (column) => column);

  GeneratedColumn<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => column,
  );
}

class $$FarmVisitCacheTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $FarmVisitCacheTable,
          FarmVisitCacheData,
          $$FarmVisitCacheTableFilterComposer,
          $$FarmVisitCacheTableOrderingComposer,
          $$FarmVisitCacheTableAnnotationComposer,
          $$FarmVisitCacheTableCreateCompanionBuilder,
          $$FarmVisitCacheTableUpdateCompanionBuilder,
          (
            FarmVisitCacheData,
            BaseReferences<
              _$AppDatabase,
              $FarmVisitCacheTable,
              FarmVisitCacheData
            >,
          ),
          FarmVisitCacheData,
          PrefetchHooks Function()
        > {
  $$FarmVisitCacheTableTableManager(
    _$AppDatabase db,
    $FarmVisitCacheTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$FarmVisitCacheTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$FarmVisitCacheTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$FarmVisitCacheTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> farmerId = const Value.absent(),
                Value<DateTime> visitDate = const Value.absent(),
                Value<String> topic = const Value.absent(),
                Value<String?> observations = const Value.absent(),
                Value<String?> recommendations = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<double?> latitude = const Value.absent(),
                Value<double?> longitude = const Value.absent(),
                Value<String> syncStatus = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => FarmVisitCacheCompanion(
                id: id,
                farmerId: farmerId,
                visitDate: visitDate,
                topic: topic,
                observations: observations,
                recommendations: recommendations,
                status: status,
                latitude: latitude,
                longitude: longitude,
                syncStatus: syncStatus,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String farmerId,
                required DateTime visitDate,
                required String topic,
                Value<String?> observations = const Value.absent(),
                Value<String?> recommendations = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<double?> latitude = const Value.absent(),
                Value<double?> longitude = const Value.absent(),
                Value<String> syncStatus = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => FarmVisitCacheCompanion.insert(
                id: id,
                farmerId: farmerId,
                visitDate: visitDate,
                topic: topic,
                observations: observations,
                recommendations: recommendations,
                status: status,
                latitude: latitude,
                longitude: longitude,
                syncStatus: syncStatus,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$FarmVisitCacheTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $FarmVisitCacheTable,
      FarmVisitCacheData,
      $$FarmVisitCacheTableFilterComposer,
      $$FarmVisitCacheTableOrderingComposer,
      $$FarmVisitCacheTableAnnotationComposer,
      $$FarmVisitCacheTableCreateCompanionBuilder,
      $$FarmVisitCacheTableUpdateCompanionBuilder,
      (
        FarmVisitCacheData,
        BaseReferences<_$AppDatabase, $FarmVisitCacheTable, FarmVisitCacheData>,
      ),
      FarmVisitCacheData,
      PrefetchHooks Function()
    >;
typedef $$SaleCacheTableCreateCompanionBuilder =
    SaleCacheCompanion Function({
      required String id,
      Value<String?> farmerId,
      required String product,
      Value<String> category,
      required String quantity,
      Value<double?> unitPrice,
      Value<double?> totalAmount,
      Value<double?> charges,
      Value<double?> taxAmount,
      Value<double?> netAmount,
      Value<String> status,
      Value<DateTime> createdAt,
      Value<String> syncStatus,
      Value<int> rowid,
    });
typedef $$SaleCacheTableUpdateCompanionBuilder =
    SaleCacheCompanion Function({
      Value<String> id,
      Value<String?> farmerId,
      Value<String> product,
      Value<String> category,
      Value<String> quantity,
      Value<double?> unitPrice,
      Value<double?> totalAmount,
      Value<double?> charges,
      Value<double?> taxAmount,
      Value<double?> netAmount,
      Value<String> status,
      Value<DateTime> createdAt,
      Value<String> syncStatus,
      Value<int> rowid,
    });

class $$SaleCacheTableFilterComposer
    extends Composer<_$AppDatabase, $SaleCacheTable> {
  $$SaleCacheTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get farmerId => $composableBuilder(
    column: $table.farmerId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get product => $composableBuilder(
    column: $table.product,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get category => $composableBuilder(
    column: $table.category,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get quantity => $composableBuilder(
    column: $table.quantity,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get unitPrice => $composableBuilder(
    column: $table.unitPrice,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get totalAmount => $composableBuilder(
    column: $table.totalAmount,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get charges => $composableBuilder(
    column: $table.charges,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get taxAmount => $composableBuilder(
    column: $table.taxAmount,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get netAmount => $composableBuilder(
    column: $table.netAmount,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => ColumnFilters(column),
  );
}

class $$SaleCacheTableOrderingComposer
    extends Composer<_$AppDatabase, $SaleCacheTable> {
  $$SaleCacheTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get farmerId => $composableBuilder(
    column: $table.farmerId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get product => $composableBuilder(
    column: $table.product,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get category => $composableBuilder(
    column: $table.category,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get quantity => $composableBuilder(
    column: $table.quantity,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get unitPrice => $composableBuilder(
    column: $table.unitPrice,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get totalAmount => $composableBuilder(
    column: $table.totalAmount,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get charges => $composableBuilder(
    column: $table.charges,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get taxAmount => $composableBuilder(
    column: $table.taxAmount,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get netAmount => $composableBuilder(
    column: $table.netAmount,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$SaleCacheTableAnnotationComposer
    extends Composer<_$AppDatabase, $SaleCacheTable> {
  $$SaleCacheTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get farmerId =>
      $composableBuilder(column: $table.farmerId, builder: (column) => column);

  GeneratedColumn<String> get product =>
      $composableBuilder(column: $table.product, builder: (column) => column);

  GeneratedColumn<String> get category =>
      $composableBuilder(column: $table.category, builder: (column) => column);

  GeneratedColumn<String> get quantity =>
      $composableBuilder(column: $table.quantity, builder: (column) => column);

  GeneratedColumn<double> get unitPrice =>
      $composableBuilder(column: $table.unitPrice, builder: (column) => column);

  GeneratedColumn<double> get totalAmount => $composableBuilder(
    column: $table.totalAmount,
    builder: (column) => column,
  );

  GeneratedColumn<double> get charges =>
      $composableBuilder(column: $table.charges, builder: (column) => column);

  GeneratedColumn<double> get taxAmount =>
      $composableBuilder(column: $table.taxAmount, builder: (column) => column);

  GeneratedColumn<double> get netAmount =>
      $composableBuilder(column: $table.netAmount, builder: (column) => column);

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => column,
  );
}

class $$SaleCacheTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $SaleCacheTable,
          SaleCacheData,
          $$SaleCacheTableFilterComposer,
          $$SaleCacheTableOrderingComposer,
          $$SaleCacheTableAnnotationComposer,
          $$SaleCacheTableCreateCompanionBuilder,
          $$SaleCacheTableUpdateCompanionBuilder,
          (
            SaleCacheData,
            BaseReferences<_$AppDatabase, $SaleCacheTable, SaleCacheData>,
          ),
          SaleCacheData,
          PrefetchHooks Function()
        > {
  $$SaleCacheTableTableManager(_$AppDatabase db, $SaleCacheTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$SaleCacheTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$SaleCacheTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$SaleCacheTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String?> farmerId = const Value.absent(),
                Value<String> product = const Value.absent(),
                Value<String> category = const Value.absent(),
                Value<String> quantity = const Value.absent(),
                Value<double?> unitPrice = const Value.absent(),
                Value<double?> totalAmount = const Value.absent(),
                Value<double?> charges = const Value.absent(),
                Value<double?> taxAmount = const Value.absent(),
                Value<double?> netAmount = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<String> syncStatus = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => SaleCacheCompanion(
                id: id,
                farmerId: farmerId,
                product: product,
                category: category,
                quantity: quantity,
                unitPrice: unitPrice,
                totalAmount: totalAmount,
                charges: charges,
                taxAmount: taxAmount,
                netAmount: netAmount,
                status: status,
                createdAt: createdAt,
                syncStatus: syncStatus,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                Value<String?> farmerId = const Value.absent(),
                required String product,
                Value<String> category = const Value.absent(),
                required String quantity,
                Value<double?> unitPrice = const Value.absent(),
                Value<double?> totalAmount = const Value.absent(),
                Value<double?> charges = const Value.absent(),
                Value<double?> taxAmount = const Value.absent(),
                Value<double?> netAmount = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<String> syncStatus = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => SaleCacheCompanion.insert(
                id: id,
                farmerId: farmerId,
                product: product,
                category: category,
                quantity: quantity,
                unitPrice: unitPrice,
                totalAmount: totalAmount,
                charges: charges,
                taxAmount: taxAmount,
                netAmount: netAmount,
                status: status,
                createdAt: createdAt,
                syncStatus: syncStatus,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$SaleCacheTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $SaleCacheTable,
      SaleCacheData,
      $$SaleCacheTableFilterComposer,
      $$SaleCacheTableOrderingComposer,
      $$SaleCacheTableAnnotationComposer,
      $$SaleCacheTableCreateCompanionBuilder,
      $$SaleCacheTableUpdateCompanionBuilder,
      (
        SaleCacheData,
        BaseReferences<_$AppDatabase, $SaleCacheTable, SaleCacheData>,
      ),
      SaleCacheData,
      PrefetchHooks Function()
    >;
typedef $$CropStageEventCacheTableCreateCompanionBuilder =
    CropStageEventCacheCompanion Function({
      required String id,
      required String cultivationId,
      required String cropVertical,
      required int stageNumber,
      required String stageName,
      required String eventType,
      required String eventData,
      Value<double> inputCostTotal,
      Value<double> carbonKgCO2e,
      Value<DateTime> eventDate,
      Value<String?> farm5xPractice,
      Value<String?> farm5xVariant,
      Value<String> syncStatus,
      Value<int> rowid,
    });
typedef $$CropStageEventCacheTableUpdateCompanionBuilder =
    CropStageEventCacheCompanion Function({
      Value<String> id,
      Value<String> cultivationId,
      Value<String> cropVertical,
      Value<int> stageNumber,
      Value<String> stageName,
      Value<String> eventType,
      Value<String> eventData,
      Value<double> inputCostTotal,
      Value<double> carbonKgCO2e,
      Value<DateTime> eventDate,
      Value<String?> farm5xPractice,
      Value<String?> farm5xVariant,
      Value<String> syncStatus,
      Value<int> rowid,
    });

class $$CropStageEventCacheTableFilterComposer
    extends Composer<_$AppDatabase, $CropStageEventCacheTable> {
  $$CropStageEventCacheTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get cultivationId => $composableBuilder(
    column: $table.cultivationId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get cropVertical => $composableBuilder(
    column: $table.cropVertical,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get stageNumber => $composableBuilder(
    column: $table.stageNumber,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get stageName => $composableBuilder(
    column: $table.stageName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get eventType => $composableBuilder(
    column: $table.eventType,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get eventData => $composableBuilder(
    column: $table.eventData,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get inputCostTotal => $composableBuilder(
    column: $table.inputCostTotal,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get carbonKgCO2e => $composableBuilder(
    column: $table.carbonKgCO2e,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get eventDate => $composableBuilder(
    column: $table.eventDate,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get farm5xPractice => $composableBuilder(
    column: $table.farm5xPractice,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get farm5xVariant => $composableBuilder(
    column: $table.farm5xVariant,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => ColumnFilters(column),
  );
}

class $$CropStageEventCacheTableOrderingComposer
    extends Composer<_$AppDatabase, $CropStageEventCacheTable> {
  $$CropStageEventCacheTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get cultivationId => $composableBuilder(
    column: $table.cultivationId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get cropVertical => $composableBuilder(
    column: $table.cropVertical,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get stageNumber => $composableBuilder(
    column: $table.stageNumber,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get stageName => $composableBuilder(
    column: $table.stageName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get eventType => $composableBuilder(
    column: $table.eventType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get eventData => $composableBuilder(
    column: $table.eventData,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get inputCostTotal => $composableBuilder(
    column: $table.inputCostTotal,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get carbonKgCO2e => $composableBuilder(
    column: $table.carbonKgCO2e,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get eventDate => $composableBuilder(
    column: $table.eventDate,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get farm5xPractice => $composableBuilder(
    column: $table.farm5xPractice,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get farm5xVariant => $composableBuilder(
    column: $table.farm5xVariant,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$CropStageEventCacheTableAnnotationComposer
    extends Composer<_$AppDatabase, $CropStageEventCacheTable> {
  $$CropStageEventCacheTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get cultivationId => $composableBuilder(
    column: $table.cultivationId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get cropVertical => $composableBuilder(
    column: $table.cropVertical,
    builder: (column) => column,
  );

  GeneratedColumn<int> get stageNumber => $composableBuilder(
    column: $table.stageNumber,
    builder: (column) => column,
  );

  GeneratedColumn<String> get stageName =>
      $composableBuilder(column: $table.stageName, builder: (column) => column);

  GeneratedColumn<String> get eventType =>
      $composableBuilder(column: $table.eventType, builder: (column) => column);

  GeneratedColumn<String> get eventData =>
      $composableBuilder(column: $table.eventData, builder: (column) => column);

  GeneratedColumn<double> get inputCostTotal => $composableBuilder(
    column: $table.inputCostTotal,
    builder: (column) => column,
  );

  GeneratedColumn<double> get carbonKgCO2e => $composableBuilder(
    column: $table.carbonKgCO2e,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get eventDate =>
      $composableBuilder(column: $table.eventDate, builder: (column) => column);

  GeneratedColumn<String> get farm5xPractice => $composableBuilder(
    column: $table.farm5xPractice,
    builder: (column) => column,
  );

  GeneratedColumn<String> get farm5xVariant => $composableBuilder(
    column: $table.farm5xVariant,
    builder: (column) => column,
  );

  GeneratedColumn<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => column,
  );
}

class $$CropStageEventCacheTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $CropStageEventCacheTable,
          CropStageEventCacheData,
          $$CropStageEventCacheTableFilterComposer,
          $$CropStageEventCacheTableOrderingComposer,
          $$CropStageEventCacheTableAnnotationComposer,
          $$CropStageEventCacheTableCreateCompanionBuilder,
          $$CropStageEventCacheTableUpdateCompanionBuilder,
          (
            CropStageEventCacheData,
            BaseReferences<
              _$AppDatabase,
              $CropStageEventCacheTable,
              CropStageEventCacheData
            >,
          ),
          CropStageEventCacheData,
          PrefetchHooks Function()
        > {
  $$CropStageEventCacheTableTableManager(
    _$AppDatabase db,
    $CropStageEventCacheTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CropStageEventCacheTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CropStageEventCacheTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              $$CropStageEventCacheTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> cultivationId = const Value.absent(),
                Value<String> cropVertical = const Value.absent(),
                Value<int> stageNumber = const Value.absent(),
                Value<String> stageName = const Value.absent(),
                Value<String> eventType = const Value.absent(),
                Value<String> eventData = const Value.absent(),
                Value<double> inputCostTotal = const Value.absent(),
                Value<double> carbonKgCO2e = const Value.absent(),
                Value<DateTime> eventDate = const Value.absent(),
                Value<String?> farm5xPractice = const Value.absent(),
                Value<String?> farm5xVariant = const Value.absent(),
                Value<String> syncStatus = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => CropStageEventCacheCompanion(
                id: id,
                cultivationId: cultivationId,
                cropVertical: cropVertical,
                stageNumber: stageNumber,
                stageName: stageName,
                eventType: eventType,
                eventData: eventData,
                inputCostTotal: inputCostTotal,
                carbonKgCO2e: carbonKgCO2e,
                eventDate: eventDate,
                farm5xPractice: farm5xPractice,
                farm5xVariant: farm5xVariant,
                syncStatus: syncStatus,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String cultivationId,
                required String cropVertical,
                required int stageNumber,
                required String stageName,
                required String eventType,
                required String eventData,
                Value<double> inputCostTotal = const Value.absent(),
                Value<double> carbonKgCO2e = const Value.absent(),
                Value<DateTime> eventDate = const Value.absent(),
                Value<String?> farm5xPractice = const Value.absent(),
                Value<String?> farm5xVariant = const Value.absent(),
                Value<String> syncStatus = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => CropStageEventCacheCompanion.insert(
                id: id,
                cultivationId: cultivationId,
                cropVertical: cropVertical,
                stageNumber: stageNumber,
                stageName: stageName,
                eventType: eventType,
                eventData: eventData,
                inputCostTotal: inputCostTotal,
                carbonKgCO2e: carbonKgCO2e,
                eventDate: eventDate,
                farm5xPractice: farm5xPractice,
                farm5xVariant: farm5xVariant,
                syncStatus: syncStatus,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$CropStageEventCacheTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $CropStageEventCacheTable,
      CropStageEventCacheData,
      $$CropStageEventCacheTableFilterComposer,
      $$CropStageEventCacheTableOrderingComposer,
      $$CropStageEventCacheTableAnnotationComposer,
      $$CropStageEventCacheTableCreateCompanionBuilder,
      $$CropStageEventCacheTableUpdateCompanionBuilder,
      (
        CropStageEventCacheData,
        BaseReferences<
          _$AppDatabase,
          $CropStageEventCacheTable,
          CropStageEventCacheData
        >,
      ),
      CropStageEventCacheData,
      PrefetchHooks Function()
    >;
typedef $$PracticeAdoptionCacheTableCreateCompanionBuilder =
    PracticeAdoptionCacheCompanion Function({
      required String id,
      required String farmerId,
      required String practiceCode,
      required String cropType,
      required String frameworkVariant,
      Value<bool> isMandatory,
      Value<DateTime> adoptedAt,
      Value<String> verificationStatus,
      Value<String> syncStatus,
      Value<int> rowid,
    });
typedef $$PracticeAdoptionCacheTableUpdateCompanionBuilder =
    PracticeAdoptionCacheCompanion Function({
      Value<String> id,
      Value<String> farmerId,
      Value<String> practiceCode,
      Value<String> cropType,
      Value<String> frameworkVariant,
      Value<bool> isMandatory,
      Value<DateTime> adoptedAt,
      Value<String> verificationStatus,
      Value<String> syncStatus,
      Value<int> rowid,
    });

class $$PracticeAdoptionCacheTableFilterComposer
    extends Composer<_$AppDatabase, $PracticeAdoptionCacheTable> {
  $$PracticeAdoptionCacheTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get farmerId => $composableBuilder(
    column: $table.farmerId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get practiceCode => $composableBuilder(
    column: $table.practiceCode,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get cropType => $composableBuilder(
    column: $table.cropType,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get frameworkVariant => $composableBuilder(
    column: $table.frameworkVariant,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get isMandatory => $composableBuilder(
    column: $table.isMandatory,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get adoptedAt => $composableBuilder(
    column: $table.adoptedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get verificationStatus => $composableBuilder(
    column: $table.verificationStatus,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => ColumnFilters(column),
  );
}

class $$PracticeAdoptionCacheTableOrderingComposer
    extends Composer<_$AppDatabase, $PracticeAdoptionCacheTable> {
  $$PracticeAdoptionCacheTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get farmerId => $composableBuilder(
    column: $table.farmerId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get practiceCode => $composableBuilder(
    column: $table.practiceCode,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get cropType => $composableBuilder(
    column: $table.cropType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get frameworkVariant => $composableBuilder(
    column: $table.frameworkVariant,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get isMandatory => $composableBuilder(
    column: $table.isMandatory,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get adoptedAt => $composableBuilder(
    column: $table.adoptedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get verificationStatus => $composableBuilder(
    column: $table.verificationStatus,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$PracticeAdoptionCacheTableAnnotationComposer
    extends Composer<_$AppDatabase, $PracticeAdoptionCacheTable> {
  $$PracticeAdoptionCacheTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get farmerId =>
      $composableBuilder(column: $table.farmerId, builder: (column) => column);

  GeneratedColumn<String> get practiceCode => $composableBuilder(
    column: $table.practiceCode,
    builder: (column) => column,
  );

  GeneratedColumn<String> get cropType =>
      $composableBuilder(column: $table.cropType, builder: (column) => column);

  GeneratedColumn<String> get frameworkVariant => $composableBuilder(
    column: $table.frameworkVariant,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get isMandatory => $composableBuilder(
    column: $table.isMandatory,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get adoptedAt =>
      $composableBuilder(column: $table.adoptedAt, builder: (column) => column);

  GeneratedColumn<String> get verificationStatus => $composableBuilder(
    column: $table.verificationStatus,
    builder: (column) => column,
  );

  GeneratedColumn<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => column,
  );
}

class $$PracticeAdoptionCacheTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $PracticeAdoptionCacheTable,
          PracticeAdoptionCacheData,
          $$PracticeAdoptionCacheTableFilterComposer,
          $$PracticeAdoptionCacheTableOrderingComposer,
          $$PracticeAdoptionCacheTableAnnotationComposer,
          $$PracticeAdoptionCacheTableCreateCompanionBuilder,
          $$PracticeAdoptionCacheTableUpdateCompanionBuilder,
          (
            PracticeAdoptionCacheData,
            BaseReferences<
              _$AppDatabase,
              $PracticeAdoptionCacheTable,
              PracticeAdoptionCacheData
            >,
          ),
          PracticeAdoptionCacheData,
          PrefetchHooks Function()
        > {
  $$PracticeAdoptionCacheTableTableManager(
    _$AppDatabase db,
    $PracticeAdoptionCacheTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$PracticeAdoptionCacheTableFilterComposer(
                $db: db,
                $table: table,
              ),
          createOrderingComposer: () =>
              $$PracticeAdoptionCacheTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              $$PracticeAdoptionCacheTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> farmerId = const Value.absent(),
                Value<String> practiceCode = const Value.absent(),
                Value<String> cropType = const Value.absent(),
                Value<String> frameworkVariant = const Value.absent(),
                Value<bool> isMandatory = const Value.absent(),
                Value<DateTime> adoptedAt = const Value.absent(),
                Value<String> verificationStatus = const Value.absent(),
                Value<String> syncStatus = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => PracticeAdoptionCacheCompanion(
                id: id,
                farmerId: farmerId,
                practiceCode: practiceCode,
                cropType: cropType,
                frameworkVariant: frameworkVariant,
                isMandatory: isMandatory,
                adoptedAt: adoptedAt,
                verificationStatus: verificationStatus,
                syncStatus: syncStatus,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String farmerId,
                required String practiceCode,
                required String cropType,
                required String frameworkVariant,
                Value<bool> isMandatory = const Value.absent(),
                Value<DateTime> adoptedAt = const Value.absent(),
                Value<String> verificationStatus = const Value.absent(),
                Value<String> syncStatus = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => PracticeAdoptionCacheCompanion.insert(
                id: id,
                farmerId: farmerId,
                practiceCode: practiceCode,
                cropType: cropType,
                frameworkVariant: frameworkVariant,
                isMandatory: isMandatory,
                adoptedAt: adoptedAt,
                verificationStatus: verificationStatus,
                syncStatus: syncStatus,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$PracticeAdoptionCacheTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $PracticeAdoptionCacheTable,
      PracticeAdoptionCacheData,
      $$PracticeAdoptionCacheTableFilterComposer,
      $$PracticeAdoptionCacheTableOrderingComposer,
      $$PracticeAdoptionCacheTableAnnotationComposer,
      $$PracticeAdoptionCacheTableCreateCompanionBuilder,
      $$PracticeAdoptionCacheTableUpdateCompanionBuilder,
      (
        PracticeAdoptionCacheData,
        BaseReferences<
          _$AppDatabase,
          $PracticeAdoptionCacheTable,
          PracticeAdoptionCacheData
        >,
      ),
      PracticeAdoptionCacheData,
      PrefetchHooks Function()
    >;
typedef $$AppSettingsCacheTableCreateCompanionBuilder =
    AppSettingsCacheCompanion Function({
      required String key,
      required String value,
      Value<int> rowid,
    });
typedef $$AppSettingsCacheTableUpdateCompanionBuilder =
    AppSettingsCacheCompanion Function({
      Value<String> key,
      Value<String> value,
      Value<int> rowid,
    });

class $$AppSettingsCacheTableFilterComposer
    extends Composer<_$AppDatabase, $AppSettingsCacheTable> {
  $$AppSettingsCacheTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get key => $composableBuilder(
    column: $table.key,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get value => $composableBuilder(
    column: $table.value,
    builder: (column) => ColumnFilters(column),
  );
}

class $$AppSettingsCacheTableOrderingComposer
    extends Composer<_$AppDatabase, $AppSettingsCacheTable> {
  $$AppSettingsCacheTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get key => $composableBuilder(
    column: $table.key,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get value => $composableBuilder(
    column: $table.value,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$AppSettingsCacheTableAnnotationComposer
    extends Composer<_$AppDatabase, $AppSettingsCacheTable> {
  $$AppSettingsCacheTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get key =>
      $composableBuilder(column: $table.key, builder: (column) => column);

  GeneratedColumn<String> get value =>
      $composableBuilder(column: $table.value, builder: (column) => column);
}

class $$AppSettingsCacheTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $AppSettingsCacheTable,
          AppSettingsCacheData,
          $$AppSettingsCacheTableFilterComposer,
          $$AppSettingsCacheTableOrderingComposer,
          $$AppSettingsCacheTableAnnotationComposer,
          $$AppSettingsCacheTableCreateCompanionBuilder,
          $$AppSettingsCacheTableUpdateCompanionBuilder,
          (
            AppSettingsCacheData,
            BaseReferences<
              _$AppDatabase,
              $AppSettingsCacheTable,
              AppSettingsCacheData
            >,
          ),
          AppSettingsCacheData,
          PrefetchHooks Function()
        > {
  $$AppSettingsCacheTableTableManager(
    _$AppDatabase db,
    $AppSettingsCacheTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$AppSettingsCacheTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$AppSettingsCacheTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$AppSettingsCacheTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> key = const Value.absent(),
                Value<String> value = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => AppSettingsCacheCompanion(
                key: key,
                value: value,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String key,
                required String value,
                Value<int> rowid = const Value.absent(),
              }) => AppSettingsCacheCompanion.insert(
                key: key,
                value: value,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$AppSettingsCacheTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $AppSettingsCacheTable,
      AppSettingsCacheData,
      $$AppSettingsCacheTableFilterComposer,
      $$AppSettingsCacheTableOrderingComposer,
      $$AppSettingsCacheTableAnnotationComposer,
      $$AppSettingsCacheTableCreateCompanionBuilder,
      $$AppSettingsCacheTableUpdateCompanionBuilder,
      (
        AppSettingsCacheData,
        BaseReferences<
          _$AppDatabase,
          $AppSettingsCacheTable,
          AppSettingsCacheData
        >,
      ),
      AppSettingsCacheData,
      PrefetchHooks Function()
    >;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$SyncQueueEntriesTableTableManager get syncQueueEntries =>
      $$SyncQueueEntriesTableTableManager(_db, _db.syncQueueEntries);
  $$FarmerCacheTableTableManager get farmerCache =>
      $$FarmerCacheTableTableManager(_db, _db.farmerCache);
  $$FarmLandCacheTableTableManager get farmLandCache =>
      $$FarmLandCacheTableTableManager(_db, _db.farmLandCache);
  $$CultivationCacheTableTableManager get cultivationCache =>
      $$CultivationCacheTableTableManager(_db, _db.cultivationCache);
  $$VslaGroupCacheTableTableManager get vslaGroupCache =>
      $$VslaGroupCacheTableTableManager(_db, _db.vslaGroupCache);
  $$VslaSavingCacheTableTableManager get vslaSavingCache =>
      $$VslaSavingCacheTableTableManager(_db, _db.vslaSavingCache);
  $$VslaLoanCacheTableTableManager get vslaLoanCache =>
      $$VslaLoanCacheTableTableManager(_db, _db.vslaLoanCache);
  $$TrainingCacheTableTableManager get trainingCache =>
      $$TrainingCacheTableTableManager(_db, _db.trainingCache);
  $$TrainingAttendanceCacheTableTableManager get trainingAttendanceCache =>
      $$TrainingAttendanceCacheTableTableManager(
        _db,
        _db.trainingAttendanceCache,
      );
  $$FarmVisitCacheTableTableManager get farmVisitCache =>
      $$FarmVisitCacheTableTableManager(_db, _db.farmVisitCache);
  $$SaleCacheTableTableManager get saleCache =>
      $$SaleCacheTableTableManager(_db, _db.saleCache);
  $$CropStageEventCacheTableTableManager get cropStageEventCache =>
      $$CropStageEventCacheTableTableManager(_db, _db.cropStageEventCache);
  $$PracticeAdoptionCacheTableTableManager get practiceAdoptionCache =>
      $$PracticeAdoptionCacheTableTableManager(_db, _db.practiceAdoptionCache);
  $$AppSettingsCacheTableTableManager get appSettingsCache =>
      $$AppSettingsCacheTableTableManager(_db, _db.appSettingsCache);
}
