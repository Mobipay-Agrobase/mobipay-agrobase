import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/components/info_field.dart';
import 'package:mobipay_ekibbo/components/my_app_bar.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';
import 'package:mobipay_ekibbo/data/api_client.dart';
import 'package:mobipay_ekibbo/l10n/app_lang.dart';
import 'package:mobipay_ekibbo/routes/routes_manager.dart';
import 'package:url_launcher/url_launcher.dart';

/// EKiBBO Farmer detail screen (Screen 2).
///
/// Fetches `/api/farmers/<id>` and displays the farmer profile across 9 tabs:
///   1. Basic Info    6. Equipment
///   2. Family       7. Animal Husbandry
///   3. Asset        8. Certificate
///   4. Bank         9. Finance
///   5. Insurance
///
/// Hero card shows avatar (initials), name, farmer code, phone (with call
/// button via url_launcher), village, district, and certified badge. Edit
/// button → /farmer_registration (existing form). Delete button → confirmation
/// dialog → DELETE /api/farmers/<id>.
class FarmerDetailScreen extends StatefulWidget {
  const FarmerDetailScreen({super.key, required this.farmerId});

  final String farmerId;

  @override
  State<FarmerDetailScreen> createState() => _FarmerDetailScreenState();
}

class _FarmerDetailScreenState extends State<FarmerDetailScreen>
    with TickerProviderStateMixin {
  Map<String, dynamic>? _farmer;
  bool _loading = true;
  String? _error;
  bool _deleting = false;
  late TabController _tabController;

  static const _tabKeys = <String>[
    'basic_info',
    'family',
    'asset',
    'bank',
    'insurance_information',
    'equipments',
    'animal_husbandry_items',
    'certification',
    'finance_information',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 9, vsync: this);
    _loadFarmer();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadFarmer() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await ApiClient().get('/api/farmers/${widget.farmerId}');
      if (res.statusCode == 401) {
        await _handleUnauthorized();
        return;
      }
      if (res.statusCode != 200) {
        if (!mounted) return;
        setState(() {
          _error = '${AppLang.local.load_failed} (HTTP ${res.statusCode})';
          _loading = false;
        });
        return;
      }
      final body = jsonDecode(res.body);
      // API may return either the farmer directly or wrapped as {farmer: {...}}
      final farmer =
          body is Map ? (body['farmer'] ?? body) : <String, dynamic>{};
      if (!mounted) return;
      setState(() {
        _farmer = farmer is Map ? Map<String, dynamic>.from(farmer) : null;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = '${AppLang.local.load_failed} ($e)';
        _loading = false;
      });
    }
  }

  Future<void> _handleUnauthorized() async {
    await ApiClient().clearSession();
    ApiClient().clearAuth();
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(AppLang.local.session_expired),
        backgroundColor: ColorConstant.danger,
      ),
    );
    navigatorKey.currentState?.pushReplacementNamed(RouterName.login);
  }

  Future<void> _callFarmer(String phone) async {
    final cleaned = phone.replaceAll(RegExp(r'[^\d+]'), '');
    if (cleaned.isEmpty) return;
    final uri = Uri.parse('tel:$cleaned');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not launch dialer')),
      );
    }
  }

  Future<void> _confirmDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(AppLang.local.confirm_delete),
        content: Text(AppLang.local.confirm_delete_farmer_msg),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text(AppLang.local.cancel),
          ),
          TextButton(
            style: TextButton.styleFrom(foregroundColor: ColorConstant.danger),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(AppLang.local.delete),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    if (!mounted) return;
    setState(() => _deleting = true);
    try {
      final res =
          await ApiClient().delete('/api/farmers/${widget.farmerId}');
      if (res.statusCode == 401) {
        await _handleUnauthorized();
        return;
      }
      if (res.statusCode == 200 || res.statusCode == 204) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppLang.local.farmer_deleted_success),
            backgroundColor: ColorConstant.success,
          ),
        );
        Navigator.of(context).pop();
      } else {
        String err = AppLang.local.delete_failed;
        try {
          final d = jsonDecode(res.body);
          err = d['error'] ?? err;
        } catch (_) {}
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(err), backgroundColor: ColorConstant.danger),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${AppLang.local.delete_failed}: $e'),
          backgroundColor: ColorConstant.danger,
        ),
      );
    } finally {
      if (mounted) setState(() => _deleting = false);
    }
  }

  Color _avatarColor(String name) {
    final palette = [
      ColorConstant.primary,
      ColorConstant.secondary,
      ColorConstant.gold,
      ColorConstant.info,
    ];
    final code = name.isEmpty ? 0 : name.codeUnitAt(0);
    return palette[code % palette.length];
  }

  String _initials(String first, String last) {
    final f = first.isEmpty ? '' : first[0].toUpperCase();
    final l = last.isEmpty ? '' : last[0].toUpperCase();
    return '$f$l';
  }

  String _str(dynamic v) => v == null ? '' : v.toString();

  String _tabLabel(String key) {
    switch (key) {
      case 'basic_info':
        return AppLang.local.basic_info;
      case 'family':
        return AppLang.local.family;
      case 'asset':
        return AppLang.local.asset;
      case 'bank':
        return AppLang.local.bank;
      case 'insurance_information':
        return AppLang.local.insurance_information;
      case 'equipments':
        return AppLang.local.equipments;
      case 'animal_husbandry_items':
        return AppLang.local.animal_husbandry_items;
      case 'certification':
        return AppLang.local.certification;
      case 'finance_information':
        return AppLang.local.finance_information;
      default:
        return key;
    }
  }

  @override
  Widget build(BuildContext context) {
    final f = _farmer;
    final first = f == null ? '' : _str(f['firstName']);
    final last = f == null ? '' : _str(f['lastName']);
    final name = '$first $last'.trim();

    return Scaffold(
      backgroundColor: ColorConstant.background,
      appBar: MyAppBar(
        title: name.isEmpty ? AppLang.local.farmer : name,
        actions: [
          IconButton(
            icon: _deleting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white),
                  )
                : const Icon(Icons.edit_outlined, color: Colors.white),
            tooltip: AppLang.local.edit,
            onPressed: _deleting
                ? null
                : () => Navigator.of(context).pushNamed(RouterName.farmerRegistration),
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline, color: Colors.white),
            tooltip: AppLang.local.delete,
            onPressed: _deleting ? null : _confirmDelete,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildErrorState()
              : f == null
                  ? _buildErrorState(empty: true)
                  : Column(
                      children: [
                        _buildHeroCard(f, first, last, name),
                        Container(
                          color: ColorConstant.surface,
                          child: TabBar(
                            controller: _tabController,
                            isScrollable: true,
                            labelColor: ColorConstant.primary,
                            unselectedLabelColor: ColorConstant.textSecondary,
                            indicatorColor: ColorConstant.primary,
                            indicatorSize: TabBarIndicatorSize.label,
                            tabs: _tabKeys
                                .map((k) => Tab(text: _tabLabel(k)))
                                .toList(),
                          ),
                        ),
                        Expanded(
                          child: TabBarView(
                            controller: _tabController,
                            children: [
                              _buildBasicInfoTab(f),
                              _buildFamilyTab(f),
                              _buildAssetTab(f),
                              _buildBankTab(f),
                              _buildInsuranceTab(f),
                              _buildEquipmentTab(f),
                              _buildAnimalHusbandryTab(f),
                              _buildCertificateTab(f),
                              _buildFinanceTab(f),
                            ],
                          ),
                        ),
                      ],
                    ),
    );
  }

  Widget _buildHeroCard(Map<String, dynamic> f, String first, String last, String name) {
    final code = _str(f['farmerCode']);
    final phone = _str(f['phone']);
    final village = _str(f['villageName'] ?? f['village']);
    final district = _str(f['district']);
    final certified = (f['isCertified'] as bool?) ?? false;
    final initials =
        _initials(first, last).isEmpty ? '?' : _initials(first, last);

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.all(12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [ColorConstant.primary, ColorConstant.primaryDark],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: Colors.white.withOpacity(0.18),
                child: Text(
                  initials,
                  style: TextStyleConstant.quicksandW700(
                    fontSize: 20,
                    color: Colors.white,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name.isEmpty ? '(Unknown)' : name,
                      style: TextStyleConstant.quicksandW700(
                        fontSize: 18,
                        color: Colors.white,
                      ),
                    ),
                    if (code.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        code,
                        style: TextStyleConstant.robotoW400(
                          fontSize: 12,
                          color: Colors.white.withOpacity(0.85),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (certified)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: ColorConstant.gold,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    AppLang.local.certified,
                    style: TextStyleConstant.robotoW600(
                      fontSize: 10,
                      color: Colors.white,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _heroMeta(Icons.phone, phone.isEmpty ? '—' : phone),
              ),
              if (phone.isNotEmpty) ...[
                const SizedBox(width: 8),
                InkWell(
                  onTap: () => _callFarmer(phone),
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.call,
                        color: ColorConstant.secondary, size: 18),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _heroMeta(
                    Icons.location_on_outlined,
                    [village, district]
                        .where((e) => e.isNotEmpty)
                        .join(', ')),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _heroMeta(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.white.withOpacity(0.85)),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            text.isEmpty ? '—' : text,
            style: TextStyleConstant.robotoW500(
              fontSize: 12,
              color: Colors.white,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  // ─── Tab builders ───────────────────────────────────────────────────────

  Widget _tabScaffold(String title, List<Widget> children) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _sectionHeader(title),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: ColorConstant.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: ColorConstant.grayEB),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: children,
          ),
        ),
      ],
    );
  }

  Widget _sectionHeader(String title) {
    return Row(
      children: [
        Text(
          title.toUpperCase(),
          style: TextStyleConstant.robotoW800(
            fontSize: 12,
            color: ColorConstant.text79,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(child: Container(height: 1, color: ColorConstant.grayEB)),
      ],
    );
  }

  Widget _buildBasicInfoTab(Map<String, dynamic> f) {
    return _tabScaffold(AppLang.local.basic_info, [
      InfoField(
          label: AppLang.local.enrollment_date, value: _str(f['enrollmentDate'])),
      InfoField(label: AppLang.local.farmer_code, value: _str(f['farmerCode'])),
      InfoField(
          label: AppLang.local.group_name_code,
          value: _str(f['groupName'] ?? f['groupId'])),
      InfoField(
          label: 'Field Officer',
          value: _str(f['extensionOfficer'] ?? f['fieldOfficer'])),
      InfoField(label: AppLang.local.gender, value: _str(f['gender'])),
      InfoField(label: AppLang.local.date_of_birth, value: _str(f['dateOfBirth'])),
      InfoField(
          label: AppLang.local.identity_proof, value: _str(f['nationalIdType'])),
      InfoField(label: AppLang.local.id_number, value: _str(f['nationalIdNo'])),
    ]);
  }

  Widget _buildFamilyTab(Map<String, dynamic> f) {
    return _tabScaffold(AppLang.local.family_information, [
      InfoField(
          label: AppLang.local.next_of_kin_alt_phone,
          value: _str(f['spouseName'])),
      InfoField(
          label: AppLang.local.household_size,
          value: _intStr(f['familyMembers'])),
      InfoField(
          label: AppLang.local.total_children_below_18,
          value: _intStr(f['childrenUnder18'])),
      InfoField(
          label: AppLang.local.total_school_going_children,
          value: _intStr(f['schoolGoingChildren'])),
    ]);
  }

  Widget _buildAssetTab(Map<String, dynamic> f) {
    return _tabScaffold(AppLang.local.asset_information, [
      InfoField(
          label: AppLang.local.housing_ownership,
          value: _str(f['housingOwnership'])),
      InfoField(label: AppLang.local.house_type, value: _str(f['houseType'])),
      InfoField(
          label: AppLang.local.consumer_electronics,
          value: _str(f['electronics'])),
      InfoField(label: AppLang.local.vehicle, value: _str(f['vehicle'])),
    ]);
  }

  Widget _buildBankTab(Map<String, dynamic> f) {
    final banks = _listOf(f['bankAccounts'] ?? f['banks']);
    if (banks.isEmpty) {
      return _tabScaffold(AppLang.local.bank_information, [
        Text(
          AppLang.local.no_data_for_tab,
          style: TextStyleConstant.robotoW400(
              fontSize: 12, color: ColorConstant.textSecondary),
        ),
      ]);
    }
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _sectionHeader(AppLang.local.bank_accounts),
        const SizedBox(height: 12),
        ...banks.map((b) => _buildSubCard(
              AppLang.local.bank_information,
              [
                InfoField(
                    label: AppLang.local.account_type, value: _str(b['accountType'])),
                InfoField(
                    label: AppLang.local.account_number,
                    value: _str(b['accountNumber'])),
                InfoField(label: AppLang.local.bank_name, value: _str(b['bankName'])),
                InfoField(label: AppLang.local.branch, value: _str(b['branch'])),
                InfoField(
                    label: AppLang.local.sort_code, value: _str(b['sortCode'])),
              ],
            )),
      ],
    );
  }

  Widget _buildInsuranceTab(Map<String, dynamic> f) {
    final insurances = _listOf(f['insurances']);
    if (insurances.isEmpty) {
      return _tabScaffold(AppLang.local.insurance_information, [
        Text(
          AppLang.local.no_data_for_tab,
          style: TextStyleConstant.robotoW400(
              fontSize: 12, color: ColorConstant.textSecondary),
        ),
      ]);
    }
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _sectionHeader(AppLang.local.insurance_policies),
        const SizedBox(height: 12),
        ...insurances.map((i) => _buildSubCard(
              AppLang.local.insurance_information,
              [
                InfoField(
                    label: AppLang.local.insurance_type,
                    value: _str(i['insuranceType'])),
                InfoField(label: AppLang.local.provider, value: _str(i['provider'])),
                InfoField(
                    label: AppLang.local.policy_number,
                    value: _str(i['policyNumber'])),
                InfoField(
                    label: AppLang.local.amount, value: _numStr(i['amount'])),
                InfoField(
                    label: AppLang.local.start_date, value: _str(i['startDate'])),
                InfoField(
                    label: AppLang.local.end_date, value: _str(i['endDate'])),
              ],
            )),
      ],
    );
  }

  Widget _buildEquipmentTab(Map<String, dynamic> f) {
    final items = _listOf(f['equipment'] ?? f['equipments']);
    if (items.isEmpty) {
      return _tabScaffold(AppLang.local.farm_equipment, [
        Text(
          AppLang.local.no_data_for_tab,
          style: TextStyleConstant.robotoW400(
              fontSize: 12, color: ColorConstant.textSecondary),
        ),
      ]);
    }
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _sectionHeader(AppLang.local.equipments),
        const SizedBox(height: 12),
        ...items.map((e) => _buildSubCard(
              AppLang.local.equipment_item,
              [
                InfoField(
                    label: AppLang.local.equipment_item,
                    value: _str(e['equipmentItem'] ?? e['name'])),
                InfoField(label: AppLang.local.count, value: _intStr(e['count'])),
                InfoField(
                    label: AppLang.local.year_of_manufacture,
                    value: _intStr(e['yearOfManufacture'])),
                InfoField(
                    label: AppLang.local.year_of_purchase,
                    value: _intStr(e['yearOfPurchase'])),
              ],
            )),
      ],
    );
  }

  Widget _buildAnimalHusbandryTab(Map<String, dynamic> f) {
    final items = _listOf(f['animalHusbandry'] ?? f['animals']);
    if (items.isEmpty) {
      return _tabScaffold(AppLang.local.animal_husbandry, [
        Text(
          AppLang.local.no_data_for_tab,
          style: TextStyleConstant.robotoW400(
              fontSize: 12, color: ColorConstant.textSecondary),
        ),
      ]);
    }
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _sectionHeader(AppLang.local.animal_husbandry_items),
        const SizedBox(height: 12),
        ...items.map((a) => _buildSubCard(
              AppLang.local.animal_type,
              [
                InfoField(
                    label: AppLang.local.animal_type, value: _str(a['animalType'])),
                InfoField(label: AppLang.local.count, value: _intStr(a['count'])),
                InfoField(label: AppLang.local.fodder, value: _str(a['fodder'])),
                InfoField(
                    label: AppLang.local.housing_type, value: _str(a['housing'])),
                InfoField(
                    label: AppLang.local.revenue, value: _numStr(a['revenue'])),
                InfoField(label: AppLang.local.breed, value: _str(a['breed'])),
                InfoField(
                    label: AppLang.local.for_growth, value: _str(a['forGrowth'])),
              ],
            )),
      ],
    );
  }

  Widget _buildCertificateTab(Map<String, dynamic> f) {
    final certified = (f['isCertified'] as bool?) ?? false;
    return _tabScaffold(AppLang.local.certificate_information, [
      InfoField(
        label: AppLang.local.is_certified,
        value: certified ? AppLang.local.certified : AppLang.local.not_certified,
      ),
      InfoField(
          label: AppLang.local.certification_type,
          value: _str(f['certificationType'])),
      InfoField(
          label: AppLang.local.ics_year, value: _str(f['icsYear'])),
    ]);
  }

  Widget _buildFinanceTab(Map<String, dynamic> f) {
    final loanTaken = (f['loanTakenLastYear'] as bool?) ?? false;
    return _tabScaffold(AppLang.local.finance_information, [
      InfoField(
        label: AppLang.local.loan_taken_last_year,
        value: loanTaken ? 'Yes' : 'No',
      ),
      if (loanTaken) ...[
        InfoField(
            label: AppLang.local.loan_source,
            value: _str(f['loanTakenFrom'] ?? f['loanSource'])),
        InfoField(
            label: AppLang.local.loan_amount, value: _numStr(f['loanAmount'])),
        InfoField(label: AppLang.local.purpose, value: _str(f['loanPurpose'])),
        InfoField(
            label: AppLang.local.interest_rate,
            value: _numStr(f['loanInterest'])),
        InfoField(
            label: AppLang.local.repayment_period,
            value: _str(f['loanRepaymentPeriod'])),
      ],
    ]);
  }

  Widget _buildSubCard(String title, List<Widget> children) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: ColorConstant.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: ColorConstant.grayEB),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            title.toUpperCase(),
            style: TextStyleConstant.robotoW600(
              fontSize: 11,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(height: 6),
          ...children,
        ],
      ),
    );
  }

  Widget _buildErrorState({bool empty = false}) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              empty ? Icons.person_off_outlined : Icons.error_outline,
              size: 48,
              color: ColorConstant.danger,
            ),
            const SizedBox(height: 12),
            Text(
              empty
                  ? AppLang.local.no_farmers_title
                  : (_error ?? 'Unknown error'),
              textAlign: TextAlign.center,
              style: TextStyleConstant.robotoW400(
                fontSize: 13,
                color: ColorConstant.text79,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadFarmer,
              child: Text(AppLang.local.retry),
            ),
          ],
        ),
      ),
    );
  }

  // ─── JSON helpers ───────────────────────────────────────────────────────

  String _intStr(dynamic v) {
    if (v == null) return '';
    if (v is num) return v.toInt().toString();
    return v.toString();
  }

  String _numStr(dynamic v) {
    if (v == null) return '';
    if (v is num) return v.toString();
    return v.toString();
  }

  List<Map<String, dynamic>> _listOf(dynamic v) {
    if (v is! List) return const [];
    return v
        .map((e) => e is Map ? Map<String, dynamic>.from(e) : <String, dynamic>{})
        .where((e) => e.isNotEmpty)
        .toList();
  }
}
