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

/// EKiBBO Trainings list screen (Screen 9).
///
/// Fetches `/api/trainings?limit=100` and displays training cards:
///   - Topic (main topic or specific topic)
///   - Date, location, trainer name
///   - Attendee count (from `_count.attendance` if available, else from
///     `attendance.length`)
///   - Funder badge, main topic badge, status badge
///
/// Tapping a card opens the Training form screen in edit mode (passing the
/// trainingId). The bar-chart icon in the AppBar opens the Breakdowns
/// Dashboard.
///
/// Features:
///   - Search by topic (debounced 500ms)
///   - Pull-to-refresh
///   - Empty state with "Add Training" CTA
///   - 401 → clear session + go to /login
class TrainingsListScreen extends StatefulWidget {
  const TrainingsListScreen({super.key});

  @override
  State<TrainingsListScreen> createState() => _TrainingsListScreenState();
}

class _TrainingsListScreenState extends State<TrainingsListScreen> {
  final TextEditingController _searchCtrl = TextEditingController();
  final FocusNode _searchFocus = FocusNode();
  Timer? _debounce;

  List<Map<String, dynamic>> _trainings = [];
  bool _loading = true;
  String? _error;
  int _total = 0;

  @override
  void initState() {
    super.initState();
    _loadTrainings();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchCtrl.dispose();
    _searchFocus.dispose();
    super.dispose();
  }

  Future<void> _loadTrainings() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final query = '/api/trainings?limit=100'
          '&search=${Uri.encodeComponent(_searchCtrl.text.trim())}';
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
      final list = (body['data'] ?? body['trainings']) as List? ?? [];
      final parsed = list
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
      if (!mounted) return;
      setState(() {
        _trainings = parsed;
        _total = (body['total'] as num?)?.toInt() ?? parsed.length;
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

  void _onSearchChanged(String value) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), _loadTrainings);
  }

  Future<void> _onRefresh() => _loadTrainings();

  // ─── Field accessors ─────────────────────────────────────────────────────
  String _str(dynamic v) => v == null ? '' : v.toString();

  String _id(Map<String, dynamic> t) => _str(t['id'] ?? t['_id']);

  String _topic(Map<String, dynamic> t) =>
      _str(t['specificTopic'] ?? t['topic'] ?? t['mainTopic']);

  String _mainTopic(Map<String, dynamic> t) => _str(t['mainTopic']);

  String _date(Map<String, dynamic> t) =>
      _str(t['date'] ?? t['trainingDate']);

  String _location(Map<String, dynamic> t) => _str(t['location']);

  String _trainer(Map<String, dynamic> t) =>
      _str(t['trainerName'] ?? t['trainer']);

  String _funder(Map<String, dynamic> t) => _str(t['funder']);

  String _status(Map<String, dynamic> t) => _str(t['status']);

  int _attendeeCount(Map<String, dynamic> t) {
    // Preferred: server-side _count.attendance (Prisma include)
    final count = t['_count'];
    if (count is Map) {
      final att = count['attendance'];
      if (att is num) return att.toInt();
    }
    // Fallback: full attendance array length
    final att = t['attendance'];
    if (att is List) return att.length;
    return (t['attendeeCount'] as num?)?.toInt() ?? 0;
  }

  String _formatDate(String iso) {
    if (iso.isEmpty) return '—';
    try {
      final d = DateTime.parse(iso);
      return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
    } catch (_) {
      return iso;
    }
  }

  Color _statusColor(String s) {
    final lower = s.toLowerCase();
    switch (lower) {
      case 'completed':
        return ColorConstant.success;
      case 'scheduled':
        return ColorConstant.info;
      case 'cancelled':
        return ColorConstant.danger;
      case 'planned':
      default:
        return ColorConstant.warning;
    }
  }

  Color _funderColor(String f) {
    switch (f.toUpperCase()) {
      case 'EKIBBO':
        return ColorConstant.primary;
      case 'ETG':
        return ColorConstant.secondary;
      case 'ENABEL':
        return ColorConstant.info;
      case 'DOEN':
        return ColorConstant.gold;
      default:
        return ColorConstant.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorConstant.background,
      appBar: MyAppBar(
        title: AppLang.local.trainings,
        actions: [
          IconButton(
            icon: const Icon(Icons.bar_chart, color: Colors.white),
            tooltip: AppLang.local.breakdowns_dashboard,
            onPressed: () => Navigator.of(context)
                .pushNamed(RouterName.breakdownsDashboard),
          ),
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
      floatingActionButton: FloatingActionButton(
        backgroundColor: ColorConstant.primary,
        foregroundColor: Colors.white,
        onPressed: () {
          Navigator.of(context).pushNamed(RouterName.trainingForm);
        },
        child: const Icon(Icons.add),
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
        hint: AppLang.local.search_trainings_hint,
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
    if (_trainings.isEmpty) {
      return RefreshIndicator(
        onRefresh: _onRefresh,
        child: ListView(
          children: [
            const SizedBox(height: 80),
            EmptyState(
              title: AppLang.local.no_trainings_title,
              description: AppLang.local.no_trainings_desc,
              icon: Icons.school_outlined,
              color: ColorConstant.gold,
              actionTitle: AppLang.local.add_training,
              onAction: () =>
                  Navigator.of(context).pushNamed(RouterName.trainingForm),
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _onRefresh,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 80),
        itemCount: _trainings.length,
        itemBuilder: (_, i) => _buildTrainingCard(_trainings[i]),
      ),
    );
  }

  Widget _buildTrainingCard(Map<String, dynamic> t) {
    final id = _id(t);
    final topic = _topic(t);
    final mainTopic = _mainTopic(t);
    final date = _formatDate(_date(t));
    final location = _location(t);
    final trainer = _trainer(t);
    final funder = _funder(t);
    final status = _status(t);
    final count = _attendeeCount(t);

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
            RouterName.trainingForm,
            arguments: id,
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: ColorConstant.gold.withOpacity(0.14),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.school,
                        color: ColorConstant.gold, size: 22),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          topic.isEmpty
                              ? (mainTopic.isEmpty
                                  ? '(Untitled training)'
                                  : mainTopic)
                              : topic,
                          style: TextStyleConstant.robotoW600(
                            fontSize: 14,
                            color: ColorConstant.heading,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Wrap(
                          spacing: 6,
                          runSpacing: 4,
                          children: [
                            _badge(
                              date,
                              ColorConstant.primary,
                              icon: Icons.calendar_today_outlined,
                            ),
                            if (funder.isNotEmpty)
                              _badge(funder, _funderColor(funder)),
                            if (mainTopic.isNotEmpty)
                              _badge(mainTopic, ColorConstant.secondary),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 6),
                  if (status.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _statusColor(status).withOpacity(0.14),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        status[0].toUpperCase() + status.substring(1).toLowerCase(),
                        style: TextStyleConstant.robotoW500(
                          fontSize: 10,
                          color: _statusColor(status),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  const Icon(Icons.location_on_outlined,
                      size: 14, color: ColorConstant.textSecondary),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      location.isEmpty ? '—' : location,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyleConstant.robotoW400(
                        fontSize: 12,
                        color: ColorConstant.text79,
                      ),
                    ),
                  ),
                ],
              ),
              if (trainer.isNotEmpty) ...[
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.person_outline,
                        size: 14, color: ColorConstant.textSecondary),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        trainer,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyleConstant.robotoW400(
                          fontSize: 12,
                          color: ColorConstant.text79,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.people_outline,
                      size: 14, color: ColorConstant.textSecondary),
                  const SizedBox(width: 4),
                  Text(
                    '$count ${AppLang.local.attendees.toLowerCase()}',
                    style: TextStyleConstant.robotoW500(
                      fontSize: 12,
                      color: ColorConstant.primary,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    AppLang.local.edit,
                    style: TextStyleConstant.robotoW500(
                      fontSize: 12,
                      color: ColorConstant.primary,
                    ),
                  ),
                  const Icon(Icons.chevron_right,
                      size: 16, color: ColorConstant.primary),
                ],
              ),
            ],
          ),
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
              onPressed: _loadTrainings,
              child: Text(AppLang.local.retry),
            ),
          ],
        ),
      ),
    );
  }
}
