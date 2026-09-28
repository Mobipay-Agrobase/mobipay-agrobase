import 'package:flutter/material.dart';
import 'package:mobipay_ekibbo/constant/color_constant.dart';
import 'package:mobipay_ekibbo/constant/text_style_constant.dart';

/// Multi-select dropdown for the 12 official NSSF value chains.
/// Renders as a tappable "chip display" that opens a bottom-sheet with
/// checkboxes. Selected chips appear inline above the picker.
class ValueChainMultiSelect extends StatefulWidget {
  final List<String> selected;
  final ValueChanged<List<String>> onChanged;
  const ValueChainMultiSelect({super.key, required this.selected, required this.onChanged});

  @override
  State<ValueChainMultiSelect> createState() => _ValueChainMultiSelectState();
}

const List<String> kNssfValueChains = [
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

class _ValueChainMultiSelectState extends State<ValueChainMultiSelect> {
  void _openSheet() async {
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
                    itemCount: kNssfValueChains.length,
                    itemBuilder: (ctx, i) {
                      final vc = kNssfValueChains[i];
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
            Text(
              'Value Chain(s) *',
              style: TextStyleConstant.robotoW400(fontSize: 12, color: ColorConstant.text79),
            ),
            const SizedBox(height: 8),
            if (widget.selected.isEmpty)
              Text('Tap to select...', style: TextStyleConstant.robotoW400(fontSize: 14, color: ColorConstant.text79))
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
