// ignore_for_file: use_build_context_synchronously

import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_circular_indicator.dart';
import 'package:agrobase_ekibbo/components/app_dropdown_button.dart';
import 'package:agrobase_ekibbo/components/app_toast.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';
import 'package:agrobase_ekibbo/domain/roles/role_config.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/user_info.dart';
import 'package:agrobase_ekibbo/models/processing/model_processing_batch.dart';

/// Second review (L — Processing): mobile Processing module.
///
/// Shows the cooperative's post-harvest processing batches with the
/// approval workflow — new batches arrive as PENDING, an approver
/// approves/rejects them, the facility starts (APPROVED → IN_PROGRESS) and
/// completes them with the output quantity + quality grade. The server
/// validates permissions + transitions on every action.
class ScreenProcessing extends StatefulWidget {
  const ScreenProcessing({super.key});

  @override
  State<ScreenProcessing> createState() => _ScreenProcessingState();
}

class _ScreenProcessingState extends State<ScreenProcessing> {
  List<MProcessingBatch> _batches = [];
  MProcessingSummary? _summary;
  bool _loading = true;
  bool _busy = false;

  bool get _isStaff =>
      DUserInfo.instance.user?.roleUser == EnumUserRole.staff ||
      DUserInfo.instance.user?.roleUser == EnumUserRole.super_admin;

  static const _processTypes = [
    'Washing', 'Drying', 'Hulling', 'Grading', 'Roasting', 'Packaging'
  ];
  static const _commodities = [
    'Arabica Coffee', 'Robusta Coffee', 'Cocoa', 'Vanilla',
    'Sunflower Seeds', 'Maize', 'Sesame'
  ];
  static const _grades = [
    'Premium', 'Grade 1', 'Grade 2', 'Grade 3', 'Below Standard'
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await ApiProvider.instance.apiProcessing.getBatches();
      if (res?.data == null) {
        throw const FormatException('getBatches data null');
      }
      if (!mounted) return;
      setState(() {
        _batches = res!.data!.batches;
        _summary = res.data!.summary;
      });
    } catch (e) {
      debugPrint('Error loading processing batches: $e');
      if (mounted) {
        setState(() => _batches = []);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<bool> _submit(Map<String, dynamic> body) async {
    if (_busy) return false;
    setState(() => _busy = true);
    try {
      final res =
          await ApiProvider.instance.apiProcessing.submit(body);
      if (res?.result == true) {
        await _load();
        return true;
      }
      AppToast.showDialog(
          (res?.message ?? 'Action failed').toString());
      return false;
    } catch (e) {
      debugPrint('Error processing action: $e');
      AppToast.showDialog('Action failed');
      return false;
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'PENDING':
        return const Color(0xFFF59E0B);
      case 'APPROVED':
        return const Color(0xFF14B8A6);
      case 'IN_PROGRESS':
        return const Color(0xFF3B82F6);
      case 'COMPLETED':
        return const Color(0xFF10B981);
      case 'REJECTED':
      case 'FAILED':
        return const Color(0xFFEF4444);
      default:
        return ColorConstant.text79;
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'PENDING':
        return 'PENDING APPROVAL';
      case 'IN_PROGRESS':
        return 'IN PROGRESS';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(title: 'Processing'),
      floatingActionButton: _isStaff && !_loading
          ? FloatingActionButton(
              backgroundColor: ColorConstant.primary,
              onPressed: _showCreateDialog,
              tooltip: 'New processing batch',
              child: const Icon(Icons.add, color: Colors.white),
            )
          : null,
      body: SafeArea(
        child: RefreshIndicator(
          color: ColorConstant.primary,
          onRefresh: _load,
          child: _loading
              ? const Center(
                  child: AppCircularIndicator(color: ColorConstant.primary),
                )
              : _batches.isEmpty
                  ? ListView(children: const [
                      SizedBox(height: 200, child: NoDataView()),
                    ])
                  : ListView(
                      padding: const EdgeInsets.all(16),
                      children: [
                        if (_summary != null) _buildSummaryRow(_summary!),
                        const SizedBox(height: 12),
                        ..._batches.map(_buildBatchCard),
                      ],
                    ),
        ),
      ),
    );
  }

  Widget _buildSummaryRow(MProcessingSummary s) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ColorConstant.grayF7F8FA,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Processing Summary',
            style: TextStyleConstant.robotoW700(
              fontSize: 14,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _summaryCell(
                    'Pending', '${s.pending}', const Color(0xFFF59E0B)),
              ),
              Expanded(
                child: _summaryCell(
                    'Approved', '${s.approved}', const Color(0xFF14B8A6)),
              ),
              Expanded(
                child: _summaryCell(
                    'In Progress', '${s.inProgress}', const Color(0xFF3B82F6)),
              ),
              Expanded(
                child: _summaryCell(
                    'Completed', '${s.completed}', const Color(0xFF10B981)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _summaryCell(String label, String value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyleConstant.robotoW400(
            fontSize: 10,
            color: ColorConstant.text79,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyleConstant.robotoW700(fontSize: 16, color: color),
        ),
      ],
    );
  }

  Widget _buildBatchCard(MProcessingBatch b) {
    final canAct = _isStaff && !_busy;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: ColorConstant.grayF7F8FA,
        borderRadius: BorderRadius.circular(15),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  b.batchNumber,
                  style: TextStyleConstant.robotoW700(
                    fontSize: 15,
                    color: ColorConstant.text79,
                  ),
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: _statusColor(b.status).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  _statusLabel(b.status),
                  style: TextStyleConstant.robotoW700(
                    fontSize: 9,
                    color: _statusColor(b.status),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            '${b.inputCommodity} — ${b.processType}',
            style: TextStyleConstant.robotoW400(
              fontSize: 13,
              color: ColorConstant.text79,
            ),
          ),
          if ((b.outputProduct ?? '').isNotEmpty) ...[
            const SizedBox(height: 2),
            Text(
              'Output: ${b.outputProduct}',
              style: TextStyleConstant.robotoW400(
                fontSize: 11,
                color: ColorConstant.text79,
              ),
            ),
          ],
          const SizedBox(height: 4),
          Text(
            'Input: ${_fmt(b.inputQuantity)} ${b.inputUnit}'
            '${b.outputQuantity > 0 ? '  →  Output: ${_fmt(b.outputQuantity)} ${b.outputUnit}' : ''}',
            style: TextStyleConstant.robotoW400(
              fontSize: 11,
              color: ColorConstant.text79,
            ),
          ),
          if (b.facility.isNotEmpty) ...[
            const SizedBox(height: 2),
            Text(
              b.facility,
              style: TextStyleConstant.robotoW400(
                fontSize: 11,
                color: ColorConstant.text79,
              ),
            ),
          ],
          if (b.notes.isNotEmpty) ...[
            const SizedBox(height: 2),
            Text(
              b.notes,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyleConstant.robotoW400(
                fontSize: 10,
                color: ColorConstant.text79,
              ),
            ),
          ],
          // ── Workflow actions (server re-validates permissions) ──
          if (canAct && ['PENDING', 'APPROVED', 'IN_PROGRESS'].contains(b.status)) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                if (b.status == 'PENDING') ...[
                  Expanded(
                    child: _actionBtn('Approve', const Color(0xFF10B981),
                        () => _submit({'batch_id': b.id, 'action': 'approve'})),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _actionBtn('Reject', const Color(0xFFEF4444),
                        () => _showRejectDialog(b)),
                  ),
                ],
                if (b.status == 'APPROVED')
                  Expanded(
                    child: _actionBtn('Start', const Color(0xFF3B82F6),
                        () => _submit({'batch_id': b.id, 'action': 'start'})),
                  ),
                if (b.status == 'IN_PROGRESS')
                  Expanded(
                    child: _actionBtn('Complete', const Color(0xFF10B981),
                        () => _showCompleteDialog(b)),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _actionBtn(String label, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: _busy ? null : onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        height: 36,
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withOpacity(0.4)),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyleConstant.robotoW700(fontSize: 12, color: color),
        ),
      ),
    );
  }

  String _fmt(double v) =>
      v == v.roundToDouble() ? '${v.toInt()}' : v.toStringAsFixed(1);

  // ── Dialogs ────────────────────────────────────────────────────────────

  Future<void> _showRejectDialog(MProcessingBatch b) async {
    final reasonCtrl = TextEditingController();
    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Reject ${b.batchNumber}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '${b.inputCommodity} — ${b.processType} (${_fmt(b.inputQuantity)} ${b.inputUnit})',
              style: TextStyleConstant.robotoW400(
                  fontSize: 12, color: ColorConstant.text79),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: reasonCtrl,
              decoration: const InputDecoration(
                hintText: 'Rejection reason (required)',
                border: OutlineInputBorder(),
                isDense: true,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              final reason = reasonCtrl.text.trim();
              if (reason.isEmpty) {
                AppToast.showDialog('Enter a rejection reason');
                return;
              }
              Navigator.of(ctx).pop();
              await _submit(
                  {'batch_id': b.id, 'action': 'reject', 'reason': reason});
            },
            child: const Text('Reject'),
          ),
        ],
      ),
    );
  }

  Future<void> _showCompleteDialog(MProcessingBatch b) async {
    final qtyCtrl = TextEditingController();
    final unitCtrl = TextEditingController(text: b.outputUnit);
    String? grade = b.qualityGrade.isNotEmpty ? b.qualityGrade : 'Grade 1';
    final scoreCtrl = TextEditingController();
    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialog) => AlertDialog(
          title: Text('Complete ${b.batchNumber}'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${b.inputCommodity} — ${b.processType} · input ${_fmt(b.inputQuantity)} ${b.inputUnit}',
                  style: TextStyleConstant.robotoW400(
                      fontSize: 12, color: ColorConstant.text79),
                ),
                const SizedBox(height: 12),
                Text('Output Quantity *',
                    style: TextStyleConstant.robotoW700(
                        fontSize: 13, color: ColorConstant.text79)),
                const SizedBox(height: 6),
                TextField(
                  controller: qtyCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    hintText: 'e.g. 4200',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
                const SizedBox(height: 12),
                Text('Output Unit',
                    style: TextStyleConstant.robotoW700(
                        fontSize: 13, color: ColorConstant.text79)),
                const SizedBox(height: 6),
                TextField(
                  controller: unitCtrl,
                  decoration: const InputDecoration(
                    hintText: 'kg',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
                const SizedBox(height: 12),
                Text('Quality Grade',
                    style: TextStyleConstant.robotoW700(
                        fontSize: 13, color: ColorConstant.text79)),
                const SizedBox(height: 6),
                AppDropdownButton(
                  hintText: 'Select grade',
                  items: _grades,
                  itemSelected: grade,
                  onChanged: (i) => setDialog(() => grade = _grades[i]),
                ),
                const SizedBox(height: 12),
                Text('Quality Score (0-100)',
                    style: TextStyleConstant.robotoW700(
                        fontSize: 13, color: ColorConstant.text79)),
                const SizedBox(height: 6),
                TextField(
                  controller: scoreCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    hintText: 'e.g. 88',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () async {
                final qty = double.tryParse(qtyCtrl.text.trim());
                if (qty == null || qty <= 0) {
                  AppToast.showDialog('Enter a valid output quantity');
                  return;
                }
                Navigator.of(ctx).pop();
                await _submit({
                  'batch_id': b.id,
                  'action': 'complete',
                  'output_quantity': qty,
                  if (unitCtrl.text.trim().isNotEmpty)
                    'output_unit': unitCtrl.text.trim(),
                  if (grade != null) 'quality_grade': grade,
                  if (double.tryParse(scoreCtrl.text.trim()) != null)
                    'quality_score': double.tryParse(scoreCtrl.text.trim()),
                });
              },
              child: const Text('Complete'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showCreateDialog() async {
    String? commodity;
    String? processType;
    final outputCtrl = TextEditingController();
    final qtyCtrl = TextEditingController();
    final facilityCtrl = TextEditingController();
    final notesCtrl = TextEditingController();
    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialog) => AlertDialog(
          title: const Text('New Processing Batch'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Input Commodity *',
                    style: TextStyleConstant.robotoW700(
                        fontSize: 13, color: ColorConstant.text79)),
                const SizedBox(height: 6),
                AppDropdownButton(
                  hintText: 'Select commodity',
                  items: _commodities,
                  itemSelected: commodity,
                  onChanged: (i) => setDialog(() => commodity = _commodities[i]),
                ),
                const SizedBox(height: 12),
                Text('Process Type *',
                    style: TextStyleConstant.robotoW700(
                        fontSize: 13, color: ColorConstant.text79)),
                const SizedBox(height: 6),
                AppDropdownButton(
                  hintText: 'Select process',
                  items: _processTypes,
                  itemSelected: processType,
                  onChanged: (i) =>
                      setDialog(() => processType = _processTypes[i]),
                ),
                const SizedBox(height: 12),
                Text('Output Product *',
                    style: TextStyleConstant.robotoW700(
                        fontSize: 13, color: ColorConstant.text79)),
                const SizedBox(height: 6),
                TextField(
                  controller: outputCtrl,
                  decoration: const InputDecoration(
                    hintText: 'e.g. Washed Arabica Parchment',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
                const SizedBox(height: 12),
                Text('Input Quantity (kg) *',
                    style: TextStyleConstant.robotoW700(
                        fontSize: 13, color: ColorConstant.text79)),
                const SizedBox(height: 6),
                TextField(
                  controller: qtyCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    hintText: 'e.g. 5000',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
                const SizedBox(height: 12),
                Text('Facility *',
                    style: TextStyleConstant.robotoW700(
                        fontSize: 13, color: ColorConstant.text79)),
                const SizedBox(height: 6),
                TextField(
                  controller: facilityCtrl,
                  decoration: const InputDecoration(
                    hintText: 'Processing center name',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
                const SizedBox(height: 12),
                Text('Notes',
                    style: TextStyleConstant.robotoW700(
                        fontSize: 13, color: ColorConstant.text79)),
                const SizedBox(height: 6),
                TextField(
                  controller: notesCtrl,
                  decoration: const InputDecoration(
                    hintText: 'Optional notes',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () async {
                final qty = double.tryParse(qtyCtrl.text.trim());
                if (commodity == null ||
                    processType == null ||
                    outputCtrl.text.trim().isEmpty ||
                    facilityCtrl.text.trim().isEmpty ||
                    qty == null ||
                    qty <= 0) {
                  AppToast.showDialog('Fill all required fields');
                  return;
                }
                Navigator.of(ctx).pop();
                await _submit({
                  'input_commodity': commodity,
                  'process_type': processType,
                  'output_product': outputCtrl.text.trim(),
                  'input_quantity': qty,
                  'facility': facilityCtrl.text.trim(),
                  if (notesCtrl.text.trim().isNotEmpty)
                    'notes': notesCtrl.text.trim(),
                });
              },
              child: const Text('Create'),
            ),
          ],
        ),
      ),
    );
  }
}
