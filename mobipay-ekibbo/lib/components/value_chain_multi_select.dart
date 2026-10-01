import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';
import 'package:mobipay_ekibbo/data/api_client.dart';

/// Multi-select dropdown for NSSF value chains.
///
/// The list of value chains is DYNAMIC — fetched from /api/nssf/value-chains,
/// which reads from the CatalogMaster DB table (category='nssf_value_chains').
/// This means the NSSF admin can add new value chains (e.g. "Honey",
/// "Vanilla") via the web Dashboard → Master Data → Dropdown Catalog screen,
/// and the mobile app picks them up automatically on the next enrollment —
/// no code change or app redeploy required.
///
/// Selected value chains are shown as indigo chips above the picker.
/// Tapping the picker opens a bottom-sheet with checkboxes.
class ValueChainMultiSelect extends StatefulWidget {
  final List<String> selected;
  final ValueChanged<List<String>> onChanged;
  const ValueChainMultiSelect({super.key, required this.selected, required this.onChanged});

  @override
  State<ValueChainMultiSelect> createState() => _ValueChainMultiSelectState();
}

class _ValueChainMultiSelectState extends State<ValueChainMultiSelect> {
  /// Cache of available value chains, keyed by value (e.g. "Maize").
  /// Populated once on init via /api/nssf/value-chains.
  /// Falls back to a hardcoded list if the API is unreachable (offline-first).
  List<String> _availableValueChains = [];
  bool _loading = false;
  String? _loadError;

  @override
  void initState() {
    super.initState();
    _loadValueChains();
  }

  Future<void> _loadValueChains() async {
    setState(() {
      _loading = true;
      _loadError = null;
    });
    try {
      final res = await ApiClient().get('/api/nssf/value-chains');
      if (res.statusCode == 200) {
        final d = jsonDecode(res.body);
        final list = (d['valueChains'] as List?) ?? [];
        setState(() {
          // Use `value` (the canonical string stored in the DB) — NOT `label`,
          // because the mobile app submits `value` to the API and the web
          // admin's catalog screen is the source of truth for the strings.
          _availableValueChains = list
              .map<String>((item) => (item['value'] ?? item['label'] ?? '').toString())
              .where((s) => s.isNotEmpty)
              .toList();
          _loading = false;
        });
      } else {
        // Fall back to the hardcoded list (offline-first)
        setState(() {
          _availableValueChains = _fallbackValueChains;
          _loading = false;
          _loadError = null;  // suppress — fallback is fine
        });
      }
    } catch (_) {
      // Network error — fall back to the hardcoded list so the officer can
      // still enroll farmers offline.
      setState(() {
        _availableValueChains = _fallbackValueChains;
        _loading = false;
        _loadError = null;
      });
    }
  }

  void _openSheet() async {
    if (_availableValueChains.isEmpty) {
      // If the list is empty (e.g. NSSF admin disabled all value chains),
      // show a helpful message and offer to reload.
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('No value chains available. Tap to retry.'),
          backgroundColor: ColorConstant.warning,
          action: SnackBarAction(
            label: 'Retry',
            textColor: Colors.white,
            onPressed: _loadValueChains,
          ),
        ),
      );
      return;
    }

    final temp = List<String>.from(widget.selected);
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) {
        return StatefulBuilder(builder: (ctx, setSheetState) {
          return Container(
            constraints: BoxConstraints(maxHeight: MediaQuery.of(ctx).size.height * 0.75),
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Select Value Chain(s)', style: TextStyleConstant.quicksandW700(fontSize: 16)),
                    TextButton(
                      onPressed: () => Navigator.pop(ctx),
                      child: const Text('Done'),
                    ),
                  ],
                ),
                const Divider(),
                Flexible(
                  child: ListView.builder(
                    shrinkWrap: true,
                    itemCount: _availableValueChains.length,
                    itemBuilder: (ctx, i) {
                      final vc = _availableValueChains[i];
                      final checked = temp.contains(vc);
                      return CheckboxListTile(
                        value: checked,
                        title: Text(vc, style: TextStyleConstant.robotoW400(fontSize: 14)),
                        controlAffinity: ListTileControlAffinity.leading,
                        activeColor: ColorConstant.primary,
                        onChanged: (v) {
                          setSheetState(() {
                            if (v == true) {
                              temp.add(vc);
                            } else {
                              temp.remove(vc);
                            }
                          });
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          );
        });
      },
    );
    widget.onChanged(temp);
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: _openSheet,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        decoration: BoxDecoration(
          border: Border.all(color: ColorConstant.grayEB),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  'Value Chain(s) *',
                  style: TextStyleConstant.robotoW400(fontSize: 12, color: ColorConstant.text79),
                ),
                const Spacer(),
                if (_loading)
                  const SizedBox(
                    width: 12, height: 12,
                    child: CircularProgressIndicator(strokeWidth: 1.5, color: ColorConstant.primary),
                  )
                else
                  InkWell(
                    onTap: _loadValueChains,
                    child: const Padding(
                      padding: EdgeInsets.all(4),
                      child: Icon(Icons.refresh, size: 14, color: ColorConstant.text79),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            if (widget.selected.isEmpty)
              Text(
                _loading ? 'Loading value chains...' : 'Tap to select...',
                style: TextStyleConstant.robotoW400(fontSize: 14, color: ColorConstant.text79),
              )
            else
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: widget.selected.map((vc) {
                  return Chip(
                    label: Text(vc, style: TextStyleConstant.robotoW400(fontSize: 12, color: Colors.white)),
                    backgroundColor: ColorConstant.primary,
                    padding: EdgeInsets.zero,
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    deleteIcon: const Icon(Icons.close, size: 14, color: Colors.white),
                    onDeleted: () {
                      final next = List<String>.from(widget.selected)..remove(vc);
                      widget.onChanged(next);
                    },
                  );
                }).toList(),
              ),
          ],
        ),
      ),
    );
  }
}

/// Fallback list of NSSF value chains — used when the device is offline
/// or the /api/nssf/value-chains endpoint is unreachable. The official
/// list is seeded into CatalogMaster by scripts/seed-nssf-value-chains.ts.
const List<String> _fallbackValueChains = [
  'Maize',
  'Rice',
  'Banana (matooke)',
  'Cassava',
  'Irish potato',
  'Beans',
  'Fruits and vegetables',
  'Coffee',
  'Tea',
  'Dairy cattle',
  'Beef cattle / meat',
  'Fish / Aquaculture',
];
