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
import 'package:mobipay_ekibbo/screens/farmers/farmers_list_screen.dart'
    show AppSearchField;

/// EKiBBO Transactions list screen (Screen 14).
///
/// Tries several ledger endpoints in order:
///   1. `/api/farmer-ledger?limit=100`
///   2. `/api/farmer-ledger/entries?limit=100`
///   3. Falls back to fetching the current user's farmer profile
///      (`/api/auth/me` → `farmerId`) then `/api/farmers/<id>/ledger`
///
/// Each entry shows: date, type badge, description, amount (color-coded),
/// balance after. Entries are grouped by month (YYYY-MM header). A summary
/// card at the top shows total credits, total debits, and net balance.
///
/// Features:
///   - Search by description (debounced 500ms, in-memory filter)
///   - Pull-to-refresh
///   - Empty state
///   - 401 → clear session + go to /login
class TransactionsListScreen extends StatefulWidget {
  const TransactionsListScreen({super.key});

  @override
  State<TransactionsListScreen> createState() =>
      _TransactionsListScreenState();
}

class _TransactionsListScreenState extends State<TransactionsListScreen> {
  final TextEditingController _searchCtrl = TextEditingController();
  final FocusNode _searchFocus = FocusNode();
  Timer? _debounce;

  List<Map<String, dynamic>> _entries = [];
  bool _loading = true;
  String? _error;

  double _totalCredits = 0.0;
  double _totalDebits = 0.0;
  double _netBalance = 0.0;

  @override
  void initState() {
    super.initState();
    _loadEntries();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchCtrl.dispose();
    _searchFocus.dispose();
    super.dispose();
  }

  Future<void> _loadEntries() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      List<Map<String, dynamic>> entries = [];
      // Strategy 1: top-level farmer-ledger endpoint.
      var res = await ApiClient().get('/api/farmer-ledger?limit=100');
      if (res.statusCode == 401) {
        await _handleUnauthorized();
        return;
      }
      if (res.statusCode != 200) {
        // Strategy 2: try the /entries sub-path.
        res = await ApiClient().get('/api/farmer-ledger/entries?limit=100');
        if (res.statusCode == 401) {
          await _handleUnauthorized();
          return;
        }
      }
      if (res.statusCode != 200) {
        // Strategy 3: try current user → farmerId → per-farmer ledger.
        final farmerId = await _fetchCurrentFarmerId();
        if (farmerId.isNotEmpty) {
          res = await ApiClient()
              .get('/api/farmers/$farmerId/ledger?limit=100');
          if (res.statusCode == 401) {
            await _handleUnauthorized();
            return;
          }
        }
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
      // Backend may return either `{data: [...]}`, `{entries: [...]}`,
      // `{transactions: [...]}` or an unwrapped list.
      List<dynamic> list;
      if (body is List) {
        list = body;
      } else if (body is Map) {
        final raw = body['data'] ??
            body['entries'] ??
            body['transactions'] ??
            body['ledger'] ??
            [];
        list = raw is List ? raw : [];
      } else {
        list = [];
      }
      entries = list
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
      _recomputeTotals(entries);
      if (!mounted) return;
      setState(() {
        _entries = entries;
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

  /// Fetches the current user's farmerId from `/api/auth/me`.
  /// Returns an empty string on any failure.
  Future<String> _fetchCurrentFarmerId() async {
    try {
      final res = await ApiClient().get('/api/auth/me');
      if (res.statusCode != 200) return '';
      final body = jsonDecode(res.body);
      if (body is! Map) return '';
      final farmer = body['farmer'];
      if (farmer is Map) {
        return _str(farmer['id'] ?? farmer['_id']);
      }
      return _str(body['farmerId']);
    } catch (_) {
      return '';
    }
  }

  void _recomputeTotals(List<Map<String, dynamic>> entries) {
    double credits = 0;
    double debits = 0;
    for (final e in entries) {
      final amt = _amount(e['amount']);
      if (amt >= 0) {
        credits += amt;
      } else {
        debits += amt.abs();
      }
    }
    _totalCredits = credits;
    _totalDebits = debits;
    _netBalance = credits - debits;
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

  void _onSearchChanged(String value) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      if (mounted) setState(() {});
    });
  }

  Future<void> _onRefresh() => _loadEntries();

  // ─── Field accessors (defensive JSON casting) ────────────────────────────
  String _str(dynamic v) => v == null ? '' : v.toString();

  double _amount(dynamic v) {
    if (v is num) return v.toDouble();
    return double.tryParse(_str(v)) ?? 0.0;
  }

  String _type(Map<String, dynamic> e) =>
      _str(e['type'] ?? e['entryType'] ?? e['transactionType']).toUpperCase();

  String _description(Map<String, dynamic> e) =>
      _str(e['description'] ?? e['narration'] ?? e['note'] ?? e['remarks']);

  String _date(Map<String, dynamic> e) =>
      _str(e['date'] ?? e['entryDate'] ?? e['createdAt']);

  double _entryAmount(Map<String, dynamic> e) => _amount(e['amount']);

  double _balance(Map<String, dynamic> e) =>
      _amount(e['balanceAfter'] ?? e['balance'] ?? e['runningBalance']);

  String _formatDate(String iso) {
    if (iso.isEmpty) return '—';
    try {
      final d = DateTime.parse(iso);
      return '${d.day.toString().padLeft(2, '0')}/'
          '${d.month.toString().padLeft(2, '0')}/${d.year}';
    } catch (_) {
      return iso;
    }
  }

  String _monthKey(String iso) {
    if (iso.isEmpty) return 'unknown';
    try {
      final d = DateTime.parse(iso);
      return '${d.year}-${d.month.toString().padLeft(2, '0')}';
    } catch (_) {
      return 'unknown';
    }
  }

  String _monthLabel(String key) {
    if (key == 'unknown') return 'Unknown';
    try {
      final parts = key.split('-');
      final year = int.parse(parts[0]);
      final month = int.parse(parts[1]);
      const months = <String>[
        '',
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      if (month < 1 || month > 12) return key;
      return '${months[month]} $year';
    } catch (_) {
      return key;
    }
  }

  String _formatUgx(double v) {
    final s = v.toInt().abs().toString();
    final buf = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write(',');
      buf.write(s[i]);
    }
    final prefix = v < 0 ? '-' : '';
    return '$prefix${buf.toString()}';
  }

  Color _typeColor(String t) {
    switch (t) {
      case 'PURCHASE':
        return ColorConstant.primary;
      case 'SALE':
      case 'PAYMENT':
        return ColorConstant.success;
      case 'LOAN_DISBURSE':
      case 'LOAN_REPAY':
        return ColorConstant.gold;
      case 'INPUT_DIST':
      case 'INPUT_REPAY':
        return ColorConstant.info;
      case 'TRAINING':
        return ColorConstant.secondary;
      case 'INSURANCE':
        return ColorConstant.warning;
      case 'CHARGE':
        return ColorConstant.danger;
      case 'ADJUSTMENT':
      default:
        return ColorConstant.textSecondary;
    }
  }

  /// Returns entries filtered by the search bar text (description contains).
  List<Map<String, dynamic>> get _filteredEntries {
    final q = _searchCtrl.text.trim().toLowerCase();
    if (q.isEmpty) return _entries;
    return _entries.where((e) {
      return _description(e).toLowerCase().contains(q) ||
          _type(e).toLowerCase().contains(q);
    }).toList();
  }

  /// Groups entries by month (sorted desc), returning a list of
  /// `{key, label, items}` maps.
  List<Map<String, dynamic>> _groupedByMonth(
      List<Map<String, dynamic>> entries) {
    final groups = <String, List<Map<String, dynamic>>>{};
    for (final e in entries) {
      final key = _monthKey(_date(e));
      groups.putIfAbsent(key, () => []).add(e);
    }
    // Sort keys descending (newest month first).
    final keys = groups.keys.toList()
      ..sort((a, b) {
        if (a == 'unknown') return 1;
        if (b == 'unknown') return -1;
        return b.compareTo(a);
      });
    return keys.map((k) {
      final items = groups[k]!;
      // Sort items within group: newest first.
      items.sort((a, b) => _date(b).compareTo(_date(a)));
      return <String, dynamic>{
        'key': k,
        'label': _monthLabel(k),
        'items': items,
      };
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorConstant.background,
      appBar: MyAppBar(
        title: AppLang.local.transactions_list,
        actions: [
          IconButton(
            icon: const Icon(Icons.search, color: Colors.white),
            tooltip: AppLang.local.search,
            onPressed: () => _searchFocus.requestFocus(),
          ),
        ],
      ),
      body: Column(
        children: [
          _buildSearchBar(),
          Expanded(child: _buildBody()),
        ],
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
        hint: AppLang.local.search_transactions_hint,
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
    final filtered = _filteredEntries;
    if (filtered.isEmpty) {
      return RefreshIndicator(
        onRefresh: _onRefresh,
        child: ListView(
          children: [
            const SizedBox(height: 80),
            EmptyState(
              title: AppLang.local.no_transactions_title,
              description: AppLang.local.no_transactions_desc,
              icon: Icons.receipt_long_outlined,
              color: ColorConstant.gold,
            ),
          ],
        ),
      );
    }
    final groups = _groupedByMonth(filtered);
    final slivers = <Widget>[
      SliverToBoxAdapter(child: _buildSummaryCard()),
    ];
    for (final g in groups) {
      final label = g['label'] as String;
      final items = g['items'] as List<Map<String, dynamic>>;
      slivers.add(SliverToBoxAdapter(
        child: _buildMonthHeader(label),
      ));
      slivers.add(SliverList(
        delegate: SliverChildBuilderDelegate(
          (ctx, i) => _buildEntryCard(items[i]),
          childCount: items.length,
        ),
      ));
    }
    return RefreshIndicator(
      onRefresh: _onRefresh,
      child: CustomScrollView(
        slivers: slivers,
      ),
    );
  }

  Widget _buildSummaryCard() {
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 8, 12, 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: ColorConstant.primary,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.account_balance_wallet,
                  color: Colors.white, size: 18),
              const SizedBox(width: 6),
              Text(
                AppLang.local.net_balance,
                style: TextStyleConstant.robotoW500(
                  fontSize: 11,
                  color: Colors.white.withOpacity(0.85),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'UGX ${_formatUgx(_netBalance)}',
            style: TextStyleConstant.quicksandW700(
              fontSize: 22,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildSummaryTile(
                  AppLang.local.total_credits,
                  _formatUgx(_totalCredits),
                  ColorConstant.success,
                  Icons.south_west,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildSummaryTile(
                  AppLang.local.total_debits,
                  _formatUgx(_totalDebits),
                  ColorConstant.danger,
                  Icons.north_east,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryTile(
      String label, String value, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.12),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 12, color: color),
              const SizedBox(width: 4),
              Text(
                label,
                style: TextStyleConstant.robotoW500(
                  fontSize: 10,
                  color: Colors.white.withOpacity(0.85),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyleConstant.robotoW600(
              fontSize: 13,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMonthHeader(String label) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
      child: Text(
        label,
        style: TextStyleConstant.robotoW600(
          fontSize: 12,
          color: ColorConstant.textSecondary,
        ),
      ),
    );
  }

  Widget _buildEntryCard(Map<String, dynamic> e) {
    final type = _type(e);
    final desc = _description(e);
    final amt = _entryAmount(e);
    final bal = _balance(e);
    final date = _formatDate(_date(e));
    final isCredit = amt >= 0;
    final typeColor = _typeColor(type);

    return Card(
      color: ColorConstant.surface,
      elevation: 0,
      margin: const EdgeInsets.fromLTRB(12, 0, 12, 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: ColorConstant.grayEB),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: typeColor.withOpacity(0.14),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                isCredit ? Icons.south_west : Icons.north_east,
                color: typeColor,
                size: 18,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          desc.isEmpty ? type : desc,
                          style: TextStyleConstant.robotoW600(
                            fontSize: 13,
                            color: ColorConstant.heading,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Wrap(
                    spacing: 6,
                    runSpacing: 4,
                    children: [
                      if (type.isNotEmpty) _badge(type, typeColor),
                      _badge(date, ColorConstant.textSecondary,
                          icon: Icons.calendar_today_outlined),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${isCredit ? '+' : '-'}${_formatUgx(amt.abs())}',
                  style: TextStyleConstant.robotoW600(
                    fontSize: 13,
                    color: isCredit ? ColorConstant.success : ColorConstant.danger,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'UGX ${_formatUgx(bal)}',
                  style: TextStyleConstant.robotoW400(
                    fontSize: 10,
                    color: ColorConstant.textSecondary,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _badge(String text, Color color, {IconData? icon}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 10, color: color),
            const SizedBox(width: 2),
          ],
          Text(
            text,
            style: TextStyleConstant.robotoW500(
              fontSize: 10,
              color: color,
            ),
          ),
        ],
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
            const Icon(Icons.error_outline,
                size: 48, color: ColorConstant.danger),
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
              onPressed: _loadEntries,
              child: Text(AppLang.local.retry),
            ),
          ],
        ),
      ),
    );
  }
}
