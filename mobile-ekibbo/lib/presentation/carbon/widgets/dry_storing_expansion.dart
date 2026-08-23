import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:agrobase_ekibbo/components/app_dropdown_button.dart';
import 'package:agrobase_ekibbo/presentation/carbon/cubit/carbon_cubit.dart';
import 'package:agrobase_ekibbo/presentation/carbon/models/carbon_footprint_model.dart';
import 'package:agrobase_ekibbo/presentation/carbon/models/option_data.dart';
import 'package:agrobase_ekibbo/presentation/carbon/widgets/expansion_view.dart';

class DryStoringExpansion extends StatefulWidget {
  const DryStoringExpansion({super.key});

  @override
  State<DryStoringExpansion> createState() => _DryStoringExpansionState();
}

class _DryStoringExpansionState extends State<DryStoringExpansion> {
  CarbonCubit get _cubit => BlocProvider.of(context);
  @override
  void initState() {
    _cubit.request.dryingMethod = _dryings[0];
    _cubit.request.storingMethod = _storings[0];
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return ExpansionView(
      title: CarbonFootprintType.dryingStoring.title,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            children: [
              AppDropdownButton(
                items: _dryings.map((e) => e.title).toList(),
                hintText: 'Drying method',
                isShowInfo: true,
                description: _dryingDes,
                itemSelected: _cubit.request.dryingMethod?.title,
                onChanged: (v) {
                  setState(() {
                    _cubit.request.dryingMethod = _dryings[v];
                  });
                },
              ),
              const SizedBox(
                height: 24,
              ),
              AppDropdownButton(
                items: _storings.map((e) => e.title).toList(),
                hintText: 'Storing method',
                isShowInfo: true,
                description: _storingDes,
                itemSelected: _cubit.request.storingMethod?.title,
                onChanged: (v) {
                  setState(() {
                    _cubit.request.storingMethod = _storings[v];
                  });
                },
              ),
            ],
          ),
        )
      ],
    );
  }
}

final List<OptionData> _dryings = [
  OptionData(
    title: 'Sun drying',
    value: 0,
    subValues: [4],
  ),
  OptionData(
    title: 'Solar bubble dryer',
    value: 6,
    subValues: [1.5],
  ),
  OptionData(
    title: 'Flatbed dryer',
    value: 168,
    subValues: [1.5],
  ),
  OptionData(
    title: 'Recirculating columnar dryer',
    value: 168,
    subValues: [1.5],
  ),
];
final List<OptionData> _storings = [
  OptionData(
    title: 'Farmer-granary storage',
    value: 11,
    subValues: [7.5],
  ),
  OptionData(
    title: 'Hermetic bag storage',
    value: 16,
    subValues: [0],
  ),
  OptionData(
    title: 'Back stacking - warehouse',
    value: 24.4,
    subValues: [1.5],
  ),
  OptionData(
    title: 'Bulk-stacking warehouse',
    value: 9.4,
    subValues: [1.5],
  ),
];
const String _dryingDes =
    'Grain loss ratio and amount of GHG emitted from fuel consumed for drying operations';
const String _storingDes =
    'Grain loss ratio and amount of GHG emitted from fuel consumed for storing operations';
