import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/components/empty_state.dart';
import 'package:mobipay_ekibbo/components/my_app_bar.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';
import 'package:mobipay_ekibbo/data/api_client.dart';
import 'package:mobipay_ekibbo/l10n/app_lang.dart';
import 'package:mobipay_ekibbo/routes/routes_manager.dart';

/// EKiBBO Farmers list screen (Screen 1).
///
/// Fetches `/api/farmers?limit=100&status=all` and displays farmer cards with
/// avatar (initials), name, code, phone, district, gender badge. Provides:
///   - Search bar (debounced 500ms) filtering by name / phone / farmerCode
///   - Filter chips: All / Male / Female / Certified
///   - Pull-to-refresh
///   - Infinite scroll pagination (loads next page when the user scrolls to end)
///   - Empty state when no farmers
///   - Add-farmer FAB → /farmer_registration route
///   - Tap card → /farmer_detail route with farmerId argument
class FarmersListScreen extends StatefulWidget {
  const FarmersListScreen({super.key});

  @override
  State<FarmersListScreen> createState() => _FarmersListScreenState();
}

class _FarmersListScreenState extends State<FarmersListScreen> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchCtrl = TextEditingController();
  final FocusNode _searchFocus = FocusNode();
  Timer? _debounce;

  List<Map<String, dynamic>> _farmers = [];
  bool _loading = true;
  bool _loadingMore = false;
  String? _error;
  int _page = 1;
  int _totalPages = 1;
  int _total = 0;

  /// Filter chip: 'all' / 'male' / 'female' / 'certified'
  String _filter = 'all';

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _loadFarmers(refresh: true);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchCtrl.dispose();
    _searchFocus.dispose();
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentScroll = _scrollController.position.pixels;
    // Trigger next page load when within 200px of bottom and not already loading
    if (maxScroll - currentScroll <= 200 &&
        !_loadingMore &&
        !_loading &&
        _page < _totalPages) {
      _loadMore();
    }
  }

  Future<void> _loadFarmers({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        _loading = true;
        _error = null;
        _page = 1;
      });
    }
    try {
      final query =
          '/api/farmers?limit=20&page=$_page&status=all&search=${Uri.encodeComponent(_searchCtrl.text.trim())}';
      final res = await ApiClient().get(query);
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
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      final list = (body['farmers'] as List?) ?? [];
      final parsed = list
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
      if (!mounted) return;
      setState(() {
        if (refresh) {
          _farmers = parsed;
        } else {
          _farmers.addAll(parsed);
        }
        _total = (body['total'] as num?)?.toInt() ?? _farmers.length;
        _totalPages = (body['totalPages'] as num?)?.toInt() ?? 1;
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

  Future<void> _loadMore() async {
    setState(() => _loadingMore = true);
    _page += 1;
    try {
      await _loadFarmers(refresh: false);
    } finally {
      if (mounted) setState(() => _loadingMore = false);
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

  Future<void> _onRefresh() async {
    await _loadFarmers(refresh: true);
  }

  void _onSearchChanged(String value) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      _loadFarmers(refresh: true);
    });
  }

  /// Apply the in-memory filter chip on top of fetched farmers (we still
  /// call the API, but also filter client-side to combine search + chip).
  List<Map<String, dynamic>> get _filteredFarmers {
    switch (_filter) {
      case 'male':
        return _farmers
            .where((f) => (f['gender'] ?? '').toString().toLowerCase() == 'male')
            .toList();
      case 'female':
        return _farmers
            .where(
                (f) => (f['gender'] ?? '').toString().toLowerCase() == 'female')
            .toList();
      case 'certified':
        return _farmers
            .where((f) => (f['isCertified'] as bool?) ?? false)
            .toList();
      default:
        return _farmers;
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorConstant.background,
      appBar: MyAppBar(
        title: AppLang.local.farmers_list,
        actions: [
          IconButton(
            icon: const Icon(Icons.search, color: Colors.white),
            tooltip: AppLang.local.search,
            onPressed: () {
              _searchFocus.requestFocus();
            },
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.filter_list, color: Colors.white),
            tooltip: AppLang.local.gender,
            onSelected: (v) {
              setState(() => _filter = v);
            },
            itemBuilder: (_) => [
              PopupMenuItem(value: 'all', child: Text(AppLang.local.filter_all)),
              PopupMenuItem(
                  value: 'male', child: Text(AppLang.local.filter_male)),
              PopupMenuItem(
                  value: 'female', child: Text(AppLang.local.filter_female)),
              PopupMenuItem(
                  value: 'certified',
                  child: Text(AppLang.local.filter_certified)),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          _buildSearchBar(),
          _buildFilterChips(),
          Expanded(child: _buildBody()),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: ColorConstant.primary,
        foregroundColor: Colors.white,
        onPressed: () {
          Navigator.of(context).pushNamed(RouterName.farmerRegistration);
        },
        child: const Icon(Icons.person_add),
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      color: ColorConstant.surface,
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
      child: AppSearchField(
        controller: _searchCtrl,
        focusNode: _searchFocus,
        onChanged: _onSearchChanged,
        hint: AppLang.local.search_farmers_hint,
      ),
    );
  }

  Widget _buildFilterChips() {
    final chips = <Map<String, dynamic>>[
      {'key': 'all', 'label': AppLang.local.filter_all},
      {'key': 'male', 'label': AppLang.local.filter_male},
      {'key': 'female', 'label': AppLang.local.filter_female},
      {'key': 'certified', 'label': AppLang.local.filter_certified},
    ];
    return SizedBox(
      height: 48,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        itemCount: chips.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) {
          final c = chips[i];
          final key = c['key'] as String;
          final label = c['label'] as String;
          final selected = _filter == key;
          return FilterChip(
            label: Text(label),
            selected: selected,
            onSelected: (_) {
              setState(() => _filter = key);
            },
            selectedColor: ColorConstant.primary,
            backgroundColor: ColorConstant.grayF6F7F9,
            labelStyle: TextStyleConstant.robotoW500(
              fontSize: 12,
              color: selected ? Colors.white : ColorConstant.textPrimary,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          );
        },
      ),
    );
  }

  Widget _buildBody() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return _buildErrorState();
    }
    final list = _filteredFarmers;
    if (list.isEmpty) {
      return RefreshIndicator(
        onRefresh: _onRefresh,
        child: ListView(
          children: [
            const SizedBox(height: 80),
            EmptyState(
              title: AppLang.local.no_farmers_title,
              description: AppLang.local.no_farmers_desc,
              icon: Icons.people_outline,
              actionTitle: AppLang.local.add_farmer,
              onAction: () =>
                  Navigator.of(context).pushNamed(RouterName.farmerRegistration),
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _onRefresh,
      child: ListView.builder(
        controller: _scrollController,
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 80),
        itemCount: list.length + 1, // +1 for footer
        itemBuilder: (_, i) {
          if (i == list.length) {
            if (_loadingMore) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Center(
                  child: SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                ),
              );
            }
            if (_page >= _totalPages) {
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Center(
                  child: Text(
                    '— ${_total} ${AppLang.local.farmers_list.toLowerCase()} —',
                    style: TextStyleConstant.robotoW400(
                      fontSize: 11,
                      color: ColorConstant.textSecondary,
                    ),
                  ),
                ),
              );
            }
            return const SizedBox.shrink();
          }
          return _buildFarmerCard(list[i]);
        },
      ),
    );
  }

  Widget _buildFarmerCard(Map<String, dynamic> f) {
    final first = (f['firstName'] ?? '').toString();
    final last = (f['lastName'] ?? '').toString();
    final name = '${first.isNotEmpty ? first : ''} ${last.isNotEmpty ? last : ''}'.trim();
    final code = (f['farmerCode'] ?? f['code'] ?? '').toString();
    final phone = (f['phone'] ?? '').toString();
    final district = (f['district'] ?? '').toString();
    final gender = (f['gender'] ?? '').toString();
    final certified = (f['isCertified'] as bool?) ?? false;
    final village = (f['villageName'] ?? f['village'] ?? '').toString();
    final id = (f['id'] ?? f['_id'] ?? '').toString();

    return Card(
      color: ColorConstant.surface,
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: ColorConstant.grayEB),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {
          Navigator.of(context).pushNamed(
            RouterName.farmerDetail,
            arguments: id,
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 24,
                backgroundColor: _avatarColor(name.isEmpty ? '?' : name),
                child: Text(
                  _initials(first, last).isEmpty ? '?' : _initials(first, last),
                  style: TextStyleConstant.quicksandW700(
                    fontSize: 16,
                    color: Colors.white,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            name.isEmpty ? '(Unknown)' : name,
                            style: TextStyleConstant.robotoW600(
                              fontSize: 14,
                              color: ColorConstant.heading,
                            ),
                          ),
                        ),
                        if (certified)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: ColorConstant.gold.withOpacity(0.18),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              AppLang.local.certified,
                              style: TextStyleConstant.robotoW500(
                                fontSize: 10,
                                color: ColorConstant.gold,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    if (code.isNotEmpty)
                      Text(
                        code,
                        style: TextStyleConstant.robotoW400(
                          fontSize: 11,
                          color: ColorConstant.textSecondary,
                        ),
                      ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.phone,
                            size: 12, color: ColorConstant.textSecondary),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            phone.isEmpty ? '—' : phone,
                            style: TextStyleConstant.robotoW400(
                              fontSize: 11,
                              color: ColorConstant.text79,
                            ),
                          ),
                        ),
                      ],
                    ),
                    if (district.isNotEmpty || village.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          const Icon(Icons.location_on_outlined,
                              size: 12, color: ColorConstant.textSecondary),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              [village, district]
                                  .where((e) => e.isNotEmpty)
                                  .join(', '),
                              style: TextStyleConstant.robotoW400(
                                fontSize: 11,
                                color: ColorConstant.text79,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 8),
              if (gender.isNotEmpty)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: (gender.toLowerCase() == 'female'
                            ? ColorConstant.secondary
                            : ColorConstant.info)
                        .withOpacity(0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    gender,
                    style: TextStyleConstant.robotoW500(
                      fontSize: 10,
                      color: gender.toLowerCase() == 'female'
                          ? ColorConstant.secondary
                          : ColorConstant.info,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 48, color: ColorConstant.danger),
            const SizedBox(height: 12),
            Text(
              _error ?? 'Unknown error',
              textAlign: TextAlign.center,
              style: TextStyleConstant.robotoW400(
                fontSize: 13,
                color: ColorConstant.text79,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => _loadFarmers(refresh: true),
              child: Text(AppLang.local.retry),
            ),
          ],
        ),
      ),
    );
  }
}

/// Small helper search field that matches the EKiBBO style.
class AppSearchField extends StatelessWidget {
  const AppSearchField({
    super.key,
    required this.controller,
    required this.onChanged,
    required this.hint,
    this.focusNode,
  });

  final TextEditingController controller;
  final ValueChanged<String> onChanged;
  final String hint;
  final FocusNode? focusNode;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      focusNode: focusNode,
      onChanged: onChanged,
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: const Icon(Icons.search, color: ColorConstant.textSecondary),
        filled: true,
        fillColor: ColorConstant.grayF6F7F9,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: BorderSide(color: ColorConstant.primary, width: 1.5),
        ),
      ),
    );
  }
}
