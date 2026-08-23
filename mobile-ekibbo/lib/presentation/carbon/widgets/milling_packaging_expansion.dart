import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:agrobase_ekibbo/components/app_dropdown_button.dart';
import 'package:agrobase_ekibbo/presentation/carbon/cubit/carbon_cubit.dart';
import 'package:agrobase_ekibbo/presentation/carbon/models/carbon_footprint_model.dart';
import 'package:agrobase_ekibbo/presentation/carbon/models/option_data.dart';
import 'package:agrobase_ekibbo/presentation/carbon/widgets/expansion_view.dart';

class MillingPackaginExpansion extends StatefulWidget {
  const MillingPackaginExpansion({super.key});

  @override
  State<MillingPackaginExpansion> createState() =>
      _MillingPackaginExpansionState();
}

class _MillingPackaginExpansionState extends State<MillingPackaginExpansion> {
  CarbonCubit get _cubit => BlocProvider.of(context);
  @override
  void initState() {
    _cubit.request.millingMethod = _millings[0];
    _cubit.request.ricePackaging = _packagings[0];
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return ExpansionView(
      title: CarbonFootprintType.millingPackaging.title,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            children: [
              AppDropdownButton(
                items: _millings.map((e) => e.title).toList(),
                hintText: 'Milling method',
                isShowInfo: true,
                description: _millingDes,
                itemSelected: _cubit.request.millingMethod?.title,
                onChanged: (v) {
                  setState(() {
                    _cubit.request.millingMethod = _millings[v];
                  });
                },
              ),
              const SizedBox(
                height: 24,
              ),
              AppDropdownButton(
                items: _packagings.map((e) => e.title).toList(),
                hintText: 'Rice packaging',
                isShowInfo: true,
                description: _packagingDes,
                itemSelected: _cubit.request.ricePackaging?.title,
                onChanged: (v) {
                  setState(() {
                    _cubit.request.ricePackaging = _packagings[v];
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

final List<OptionData> _millings = [
  OptionData(
    title: 'Low tech',
    value: 23,
    subValues: [8, 20, 10],
  ),
  OptionData(
    title: 'High tech',
    value: 23,
    subValues: [4, 20, 10],
  ),
  OptionData(
    title: 'Brown rice',
    value: 11.5,
    subValues: [4, 20, 0],
  ),
];

final List<OptionData> _packagings = [
  OptionData(title: 'Default', value: 2),
];
const String _millingDes =
    'Grain loss ratio and amount of GHG emitted from fuel consumed for milling operations\nBasic technology (diesel or gasoline)/White rice\nModern technology (electrical)/White rice\nModern technology (electrical)/Brown rice';
const String _packagingDes =
    'Amount of GHG emitted from fuel consumed for packaging operations';
