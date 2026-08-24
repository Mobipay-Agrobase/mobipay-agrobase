import 'package:flutter/material.dart';

import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';

/// Shared widgets for the Ekibbo module CRUD forms
/// (Trainings / Farm Visits / Surveys / Loans).

/// Compact dropdown used by the module forms.
class EkibboDropdown extends StatelessWidget {
  const EkibboDropdown({
    super.key,
    required this.items,
    required this.selectedIndex,
    required this.onChanged,
  });

  final List<String> items;
  final int selectedIndex;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: ColorConstant.grayF6F7F9,
        borderRadius: BorderRadius.circular(8),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<int>(
          value: selectedIndex < 0 ? 0 : selectedIndex.clamp(0, items.length - 1),
          isExpanded: true,
          items: items
              .asMap()
              .entries
              .map((e) => DropdownMenuItem<int>(
                    value: e.key,
                    child: Text(
                      e.value,
                      style: TextStyleConstant.robotoW400(fontSize: 14),
                    ),
                  ))
              .toList(),
          onChanged: (v) {
            if (v != null) onChanged(v);
          },
        ),
      ),
    );
  }
}

/// Form field label.
class EkibboLabel extends StatelessWidget {
  const EkibboLabel(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        text,
        style: TextStyleConstant.quicksandW600(fontSize: 13),
      ),
    );
  }
}

/// Section title inside a form.
class EkibboSectionTitle extends StatelessWidget {
  const EkibboSectionTitle(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: TextStyleConstant.quicksandW700(fontSize: 15),
    );
  }
}
