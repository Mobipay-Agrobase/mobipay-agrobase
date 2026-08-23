import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:agrobase_ekibbo/components/app_dropdown_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/presentation/carbon/cubit/carbon_cubit.dart';
import 'package:agrobase_ekibbo/presentation/carbon/models/carbon_footprint_model.dart';
import 'package:agrobase_ekibbo/presentation/carbon/models/option_data.dart';
import 'package:agrobase_ekibbo/presentation/carbon/widgets/expansion_view.dart';

class CropExtabExpansion extends StatefulWidget {
  const CropExtabExpansion({super.key});

  @override
  State<CropExtabExpansion> createState() => _CropExtabExpansionState();
}

class _CropExtabExpansionState extends State<CropExtabExpansion> {
  CarbonCubit get _cubit => BlocProvider.of(context);
  @override
  void initState() {
    _cubit.request.cultiavtionPeriod = 102;
    _cubit.culPeriodCtrler.text = '102';
    _cubit.request.soilWet = _soils[0];
    _cubit.request.seedRate = _seedRates[0];
    _cubit.request.seedType = _seedTypes[0];
    _cubit.request.pesticideUser = _pesticides[0];
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return ExpansionView(
      title: CarbonFootprintType.cropEstab.title,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            children: [
              const SizedBox(
                height: 4,
              ),
              AppFormField(
                labelText: 'Cultivation period',
                keyboardType: TextInputType.number,
                controller: _cubit.culPeriodCtrler,
                onChanged: (v) {
                  _cubit.request.cultiavtionPeriod = double.tryParse(v);
                },
              ),
              const SizedBox(
                height: 24,
              ),
              AppDropdownButton(
                hintText: 'Soil wetting',
                items: _soils.map((e) => e.title).toList(),
                isShowInfo: true,
                description: _soilDes,
                itemSelected: _cubit.request.soilWet?.title,
                onChanged: (v) {
                  setState(() {
                    _cubit.request.soilWet = _soils[v];
                  });
                },
              ),
              const SizedBox(
                height: 24,
              ),
              AppDropdownButton(
                hintText: 'Seed rate',
                items: _seedRates.map((e) => e.title).toList(),
                isShowInfo: true,
                description: _seedRateDes,
                itemSelected: _cubit.request.seedRate?.title,
                onChanged: (v) {
                  setState(() {
                    _cubit.request.seedRate = _seedRates[v];
                  });
                },
              ),
              const SizedBox(
                height: 24,
              ),
              AppDropdownButton(
                hintText: 'Seed type',
                items: _seedTypes.map((e) => e.title).toList(),
                isShowInfo: true,
                description: _seedTypeDes,
                itemSelected: _cubit.request.seedType?.title,
                onChanged: (v) {
                  setState(() {
                    _cubit.request.seedType = _seedTypes[v];
                  });
                },
              ),
              const SizedBox(
                height: 24,
              ),
              AppDropdownButton(
                hintText: 'Pesticide use',
                items: _pesticides.map((e) => e.title).toList(),
                isShowInfo: true,
                description: _pesticideDes,
                itemSelected: _cubit.request.pesticideUser?.title,
                onChanged: (v) {
                  setState(() {
                    _cubit.request.pesticideUser = _pesticides[v];
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

final List<OptionData> _soils = [
  OptionData(
    title: 'Not considered',
    value: 0,
  ),
  OptionData(
    title: 'Default',
    value: 331,
  ),
];
final List<OptionData> _seedRates = [
  OptionData(
    title: 'Low',
    value: 40,
  ),
  OptionData(
    title: 'Average',
    value: 100,
  ),
  OptionData(
    title: 'High',
    value: 150,
  ),
];
final List<OptionData> _seedTypes = [
  OptionData(
    title: 'Conventional',
    value: 1.12,
  ),
  OptionData(
    title: 'Hybrid',
    value: 2.24,
  ),
];
final List<OptionData> _pesticides = [
  OptionData(
    title: 'No pesticides',
    value: 0,
  ),
  OptionData(
    title: 'Recommended',
    value: 66.3,
  ),
  OptionData(
    title: 'High intensity',
    value: 257,
  ),
];
const String _soilDes =
    'Amount of GHG emitted during the wetting period of land preparation.';
const String _seedRateDes =
    'Specify the seed rate for broadcasted or mechanically seeded rice only (does not include transplanted rice).';
const String _seedTypeDes =
    'Amount of GHG emitted to produce one kilogram of seed.';
const String _pesticideDes =
    'Amount of GHG emitted during pesticide production. The amount is considered in cultivation relative to level of pesticide use.';
