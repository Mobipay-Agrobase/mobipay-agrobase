import 'dart:async';
import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/components/empty_state.dart';
import 'package:mobipay_ekibbo/components/info_field.dart';
import 'package:mobipay_ekibbo/components/my_app_bar.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';
import 'package:mobipay_ekibbo/data/dairy_modules.dart';
import 'package:mobipay_ekibbo/data/dairy_repository.dart';
import 'package:mobipay_ekibbo/screens/dairy/dairy_form_dialog.dart';
import 'package:mobipay_ekibbo/screens/farmers/farmers_list_screen.dart'
    show AppSearchField;

/// Config-driven list screen — works for ALL 29 ZIWA360 dairy modules.
///
/// Receives a `DairyModule` config as its route argument, which declares:
///   - title        → AppBar title
///   - icon + color → AppBar accent + card highlights
///   - columns      → keys rendered in each list card's subtitle
///   - searchFields → keys used for in-memory filtering (when offline)
///   - fields       → drives the create/edit form dialog
///
/// Features:
///   - Pull-to-refresh — forces an API sync via the repository.
///   - Search bar (debounced 500ms).
///   - "+" FAB → opens `DairyFormDialog` for create.
///   - Tap a card → opens `DairyFormDialog` for edit (pre-filled with values).
///   - Long-press a card → shows the detail bottom sheet + delete action.
///   - Sync button in the app bar — replays queued offline writes.
///   - "Offline — cached data" banner when no network connectivity.
class DairyListScreen extends StatefulWidget {
  const DairyListScreen({super.key, required this.module});

  final DairyModule module;

  @override
  State<DairyListScreen> createState() => _DairyListScreenState();
}

class _DairyListScreenState extends State<DairyListScreen> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchCtrl = TextEditingController();
  final FocusNode _searchFocus = FocusNode();
  Timer? _debounce;

  List<Map<String, dynamic>> _rows = const [];
  bool _loading = true;
  bool _loadingMore = false;
  String? _error;
  int _page = 1;
  int _totalPages = 1;
  int _total = 0;

  /// True when the last fetch came from the local cache (i.e. no network).
  bool _offline = false;

  int _pendingCount = 0;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _load(refresh: true);
    _refreshPendingCount();
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
    if (maxScroll - currentScroll <= 200 &&
        !_loadingMore &&
        !_loading &&
        _page < _totalPages &&
        !_offline) {
      _loadMore();
    }
  }

  Future<void> _refreshPendingCount() async {
    final n = await DairyRepository().pendingCount();
    if (!mounted) return;
    setState(() => _pendingCount = n);
  }

  Future<void> _load({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        _loading = true;
        _error = null;
        _page = 1;
      });
    }
    try {
      final online = await DairyRepository().isOnline();
      final rows = await DairyRepository().list(
        widget.module.key,
        search: _searchCtrl.text.trim(),
        page: _page,
        limit: 200,
        forceApi: refresh,
      );
      // Detect total/page info is lost when offline (cache returns all rows).
      final total = rows.length;
      if (!mounted) return;
      setState(() {
        if (refresh) {
          _rows = rows;
        } else {
          _rows = [..._rows, ...rows];
        }
        _total = total;
        _totalPages = online ? 1 : 1; // cache returns all rows → 1 page
        _offline = !online;
        _loading = false;
      });
      await _refreshPendingCount();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Failed to load ${widget.module.title}: $e';
        _loading = false;
      });
    }
  }

  Future<void> _loadMore() async {
    setState(() => _loadingMore = true);
    _page++;
    try {
      final rows = await DairyRepository().list(
        widget.module.key,
        search: _searchCtrl.text.trim(),
        page: _page,
        limit: 50,
      );
      if (!mounted) return;
      setState(() {
        _rows = [..._rows, ...rows];
        _loadingMore = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loadingMore = false);
    }
  }

  void _onSearchChanged(String value) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () => _load(refresh: true));
  }

  Future<void> _onRefresh() => _load(refresh: true);

  Future<void> _onSyncPressed() async {
    final n = await DairyRepository().syncPending();
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          n > 0 ? 'Synced $n pending ${n == 1 ? 'record' : 'records'}' : 'Nothing to sync',
        ),
        backgroundColor: n > 0 ? ColorConstant.success : ColorConstant.info,
      ),
    );
    await _load(refresh: true);
  }

  Future<void> _onAdd() async {
    final values = await DairyFormDialog.show(
      context,
      module: widget.module,
    );
    if (values == null) return;
    try {
      await DairyRepository().create(widget.module.key, values);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${widget.module.title} created'),
          backgroundColor: ColorConstant.success,
        ),
      );
      await _load(refresh: true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Create failed: $e'),
          backgroundColor: ColorConstant.danger,
        ),
      );
    }
  }

  Future<void> _onEdit(Map<String, dynamic> row) async {
    final id = _idOf(row);
    if (id.isEmpty) return;
    final values = await DairyFormDialog.show(
      context,
      module: widget.module,
      values: row,
    );
    if (values == null) return;
    try {
      await DairyRepository().update(widget.module.key, id, values);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${widget.module.title} updated'),
          backgroundColor: ColorConstant.success,
        ),
      );
      await _load(refresh: true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Update failed: $e'),
          backgroundColor: ColorConstant.danger,
        ),
      );
    }
  }

  Future<void> _onDelete(Map<String, dynamic> row) async {
    final id = _idOf(row);
    if (id.isEmpty) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: const Text('Delete record?'),
        content: Text(
          'This ${widget.module.title.toLowerCase()} record will be permanently '
          'deleted. Continue?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            style: TextButton.styleFrom(foregroundColor: ColorConstant.danger),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await DairyRepository().remove(widget.module.key, id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Record deleted'),
          backgroundColor: ColorConstant.success,
        ),
      );
      await _load(refresh: true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Delete failed: $e'),
          backgroundColor: ColorConstant.danger,
        ),
      );
    }
  }

  Future<void> _onShowDetail(Map<String, dynamic> row) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: ConstrainedBox(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.7,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(top: 10, bottom: 8),
                  decoration: BoxDecoration(
                    color: ColorConstant.grayEB,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 4, 8, 4),
                  child: Row(
                    children: [
                      Icon(widget.module.icon,
                          color: widget.module.color, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _titleOf(row),
                          style: TextStyleConstant.quicksandW700(
                            fontSize: 16,
                            color: ColorConstant.heading,
                          ),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.edit_outlined,
                            color: ColorConstant.primary),
                        onPressed: () {
                          Navigator.of(ctx).pop();
                          _onEdit(row);
                        },
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete_outline,
                            color: ColorConstant.danger),
                        onPressed: () {
                          Navigator.of(ctx).pop();
                          _onDelete(row);
                        },
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1),
                Flexible(
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    shrinkWrap: true,
                    children: widget.module.fields
                        .where((f) => f.type != DairyFieldType.switch_)
                        .map((f) => InfoField(
                              label: f.label,
                              value: _pretty(row[f.key]),
                              icon: _iconFor(f),
                            ))
                        .toList(),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // ─── Helpers (defensive JSON casting) ─────────────────────────────────────

  String _idOf(Map<String, dynamic> row) {
    final v = row['id'] ?? row['_id'];
    return v?.toString() ?? '';
  }

  String _titleOf(Map<String, dynamic> row) {
    // Prefer the first column key, fall back to a generic "Record #<id>".
    for (final col in widget.module.columns) {
      final v = row[col];
      if (v != null && v.toString().trim().isNotEmpty) {
        return v.toString();
      }
    }
    final id = _idOf(row);
    return id.isEmpty ? widget.module.title : 'Record $id';
  }

  String _pretty(dynamic v) {
    if (v == null) return '';
    if (v is bool) return v ? 'Yes' : 'No';
    final s = v.toString();
    // Strip ISO time from dates.
    if (s.length >= 10 && s.contains('-') && s.contains('T')) {
      return s.substring(0, 10);
    }
    return s;
  }

  IconData _iconFor(DairyField f) {
    switch (f.type) {
      case DairyFieldType.date:
        return Icons.calendar_today_outlined;
      case DairyFieldType.number:
        return Icons.numbers_outlined;
      case DairyFieldType.dropdown:
        return Icons.arrow_drop_down_circle_outlined;
      case DairyFieldType.textarea:
        return Icons.notes;
      case DairyFieldType.switch_:
        return Icons.toggle_on_outlined;
      case DairyFieldType.text:
        return Icons.text_fields;
    }
  }

  String _subtitleOf(Map<String, dynamic> row) {
    final parts = <String>[];
    for (final col in widget.module.columns) {
      if (col == 'id' || col == '_id') continue;
      final v = row[col];
      if (v == null) continue;
      final s = _pretty(v);
      if (s.isEmpty) continue;
      parts.add(s);
      if (parts.length >= 3) break;
    }
    return parts.join(' · ');
  }

  bool _isPending(Map<String, dynamic> row) {
    final pending = row['_pending'];
    return pending == true || pending == 'true';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorConstant.background,
      appBar: MyAppBar(
        title: widget.module.title,
        actions: [
          if (_pendingCount > 0)
            Padding(
              padding: const EdgeInsets.only(right: 4),
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: ColorConstant.warning,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '$_pendingCount',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
            ),
          IconButton(
            icon: const Icon(Icons.sync, color: Colors.white),
            tooltip: 'Sync pending',
            onPressed: _onSyncPressed,
          ),
        ],
      ),
      body: Column(
        children: [
          if (_offline) _buildOfflineBanner(),
          _buildSearchBar(),
          Expanded(child: _buildBody()),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: widget.module.color,
        foregroundColor: Colors.white,
        onPressed: _onAdd,
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildOfflineBanner() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      color: ColorConstant.warning.withOpacity(0.18),
      child: Row(
        children: [
          const Icon(Icons.cloud_off_outlined,
              size: 16, color: ColorConstant.warning),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              _pendingCount > 0
                  ? 'Offline — cached data · $_pendingCount pending sync'
                  : 'Offline — cached data',
              style: TextStyleConstant.robotoW500(
                fontSize: 11,
                color: ColorConstant.textPrimary,
              ),
            ),
          ),
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
        hint: 'Search ${widget.module.title.toLowerCase()}',
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
    if (_rows.isEmpty) {
      return RefreshIndicator(
        onRefresh: _onRefresh,
        child: ListView(
          children: [
            const SizedBox(height: 80),
            EmptyState(
              title: 'No ${widget.module.title.toLowerCase()} yet',
              description: widget.module.description ??
                  'Add your first ${widget.module.title.toLowerCase()} to get started',
              icon: widget.module.icon,
              color: widget.module.color,
              actionTitle: 'Add ${widget.module.title}',
              onAction: _onAdd,
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
        itemCount: _rows.length + (_loadingMore ? 1 : 0),
        itemBuilder: (_, i) {
          if (i >= _rows.length) {
            return const Padding(
              padding: EdgeInsets.all(16),
              child: Center(child: CircularProgressIndicator()),
            );
          }
          return _buildRowCard(_rows[i]);
        },
      ),
    );
  }

  Widget _buildRowCard(Map<String, dynamic> row) {
    final title = _titleOf(row);
    final subtitle = _subtitleOf(row);
    final pending = _isPending(row);
    return Card(
      color: ColorConstant.surface,
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: pending
              ? ColorConstant.warning.withOpacity(0.5)
              : ColorConstant.grayEB,
          width: pending ? 1.4 : 1,
        ),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => _onShowDetail(row),
        onLongPress: () => _onShowDetail(row),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: widget.module.color.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(widget.module.icon,
                    color: widget.module.color, size: 22),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title.isEmpty ? '(Unnamed)' : title,
                      style: TextStyleConstant.robotoW600(
                        fontSize: 14,
                        color: ColorConstant.heading,
                      ),
                    ),
                    if (subtitle.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        subtitle,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyleConstant.robotoW400(
                          fontSize: 11,
                          color: ColorConstant.text79,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (pending) ...[
                const SizedBox(width: 6),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: ColorConstant.warning.withOpacity(0.18),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'PENDING',
                    style: TextStyleConstant.robotoW500(
                      fontSize: 9,
                      color: ColorConstant.warning,
                    ),
                  ),
                ),
              ],
              const SizedBox(width: 4),
              PopupMenuButton<String>(
                icon: const Icon(Icons.more_vert,
                    color: ColorConstant.textSecondary, size: 20),
                onSelected: (v) {
                  if (v == 'edit') _onEdit(row);
                  if (v == 'delete') _onDelete(row);
                },
                itemBuilder: (_) => const [
                  PopupMenuItem(value: 'edit', child: Text('Edit')),
                  PopupMenuItem(value: 'delete', child: Text('Delete')),
                ],
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
              onPressed: _onRefresh,
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
