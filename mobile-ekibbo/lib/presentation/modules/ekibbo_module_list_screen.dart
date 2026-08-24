import 'package:flutter/material.dart';

import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_ekibbo_modules.dart';
import 'package:agrobase_ekibbo/presentation/modules/ekibbo_farm_visit_form_screen.dart';
import 'package:agrobase_ekibbo/presentation/modules/ekibbo_loan_form_screen.dart';
import 'package:agrobase_ekibbo/presentation/modules/ekibbo_survey_form_screen.dart';
import 'package:agrobase_ekibbo/presentation/modules/ekibbo_training_form_screen.dart';

/// ─────────────────────────────────────────────────────────────────────────
/// Ekibbo Field-Officer module list — Trainings, Farmer Visits, Surveys and
/// Loans with FULL CRUD against the Agrobase platform tables
/// (/api/mobile/ekibbo-modules), tenant-scoped:
///   · FAB (+)        → create a new record
///   · Tap a card     → edit the record (delete inside the form)
///   · Pull to refresh
/// ─────────────────────────────────────────────────────────────────────────
class EkibboModuleListScreen extends StatefulWidget {
  const EkibboModuleListScreen({
    super.key,
    required this.type,
    required this.title,
  });

  final String type; // trainings | farm-visits | surveys | loans
  final String title;

  @override
  State<EkibboModuleListScreen> createState() => _EkibboModuleListScreenState();
}

class _EkibboModuleListScreenState extends State<EkibboModuleListScreen> {
  bool _loading = true;
  List<Map<String, dynamic>> _rows = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final rows = await ApiEkibboModules.list(widget.type);
    if (!mounted) return;
    setState(() {
      _rows = rows;
      _loading = false;
    });
  }

  /// Push the create/edit form for this module type; reload on save.
  Future<void> _openForm({int? id}) async {
    final changed = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (context) => _formFor(id)),
    );
    if (changed == true) _load();
  }

  Widget _formFor(int? id) {
    switch (widget.type) {
      case 'trainings':
        return EkibboTrainingFormScreen(id: id);
      case 'farm-visits':
        return EkibboFarmVisitFormScreen(id: id);
      case 'surveys':
        return EkibboSurveyFormScreen(id: id);
      case 'loans':
        return EkibboLoanFormScreen(id: id);
      default:
        return const SizedBox.shrink();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: widget.title,
        color: ColorConstant.primary,
        titleColor: Colors.white,
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: ColorConstant.primary,
        child: const Icon(Icons.add, color: Colors.white),
        onPressed: () => _openForm(),
      ),
      body: RefreshIndicator(
        color: ColorConstant.primary,
        onRefresh: _load,
        child: _loading
            ? const ListView(children: [
                Padding(
                  padding: EdgeInsets.only(top: 160),
                  child: Center(
                      child: CircularProgressIndicator(color: ColorConstant.primary)),
                ),
              ])
            : _rows.isEmpty
                ? ListView(children: const [
                    Padding(
                      padding: EdgeInsets.only(top: 120),
                      child: NoDataView(),
                    ),
                    Padding(
                      padding: EdgeInsets.symmetric(horizontal: 40, vertical: 12),
                      child: Text(
                        'Tap the + button to create your first record.',
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ])
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 88),
                    itemCount: _rows.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (_, i) => _card(_rows[i]),
                  ),
      ),
    );
  }

  Widget _card(Map<String, dynamic> r) {
    final status = (r['status'] ?? '').toString();
    return InkWell(
      onTap: () => _openForm(id: r['id'] as int),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: ColorConstant.grayF7F8FA,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    _titleOf(r),
                    style: TextStyleConstant.quicksandW600(fontSize: 15),
                  ),
                ),
                if (status.isNotEmpty)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: _statusColor(status).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      status,
                      style: TextStyleConstant.robotoW400(
                          fontSize: 10, color: _statusColor(status)),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              _subtitleOf(r),
              style: TextStyleConstant.robotoW400(
                  fontSize: 12, color: ColorConstant.text79),
            ),
          ],
        ),
      ),
    );
  }

  String _titleOf(Map<String, dynamic> r) {
    switch (widget.type) {
      case 'trainings':
        return '${r['topic']}';
      case 'farm-visits':
        return '${r['farmerName']} — ${r['topic']}';
      case 'surveys':
        return '${r['title']}';
      case 'loans':
        return '${r['farmerName']}';
      default:
        return '';
    }
  }

  String _subtitleOf(Map<String, dynamic> r) {
    switch (widget.type) {
      case 'trainings':
        return '${r['date']} · ${r['location'] ?? '—'} · ${r['trainer'] ?? '—'} · ${r['attendees'] ?? 0} attendees';
      case 'farm-visits':
        return '${r['visitDate']} · ${r['farmerCode'] ?? ''}';
      case 'surveys':
        return '${r['questions'] ?? 0} questions · ${r['responses'] ?? 0} responses';
      case 'loans':
        return 'UGX ${_fmtAmount(r['amount'])} · ${r['loan_product_name'] ?? ''} · ${r['date']}';
      default:
        return '';
    }
  }

  String _fmtAmount(dynamic n) {
    final v = num.tryParse((n ?? 0).toString());
    if (v == null) return '0';
    return v.toInt().toString().replaceAllMapped(
        RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => ',');
  }

  Color _statusColor(String s) {
    switch (s.toUpperCase()) {
      case 'COMPLETED':
      case 'ACTIVE':
      case 'APPROVED':
      case 'DISBURSED':
        return const Color(0xFF059669);
      case 'SCHEDULED':
      case 'ONGOING':
      case 'PENDING':
        return const Color(0xFFB45309);
      case 'CANCELLED':
      case 'REJECTED':
        return const Color(0xFFDC2626);
      default:
        return ColorConstant.primary;
    }
  }
}
