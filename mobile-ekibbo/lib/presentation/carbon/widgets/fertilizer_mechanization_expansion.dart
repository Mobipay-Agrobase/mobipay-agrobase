import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:agrobase_ekibbo/components/app_dropdown_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/presentation/carbon/cubit/carbon_cubit.dart';
import 'package:agrobase_ekibbo/presentation/carbon/models/carbon_footprint_model.dart';
import 'package:agrobase_ekibbo/presentation/carbon/models/option_data.dart';
import 'package:agrobase_ekibbo/presentation/carbon/widgets/expansion_view.dart';

class FertilizerMechanizationExpansion extends StatefulWidget {
  const FertilizerMechanizationExpansion({super.key});

  @override
  State<FertilizerMechanizationExpansion> createState() =>
      _FertilizerMechanizationExpansionState();
}

class _FertilizerMechanizationExpansionState
    extends State<FertilizerMechanizationExpansion> {
  CarbonCubit get _cubit => BlocProvider.of(context);
  @override
  void initState() {
    _cubit.request.nRate = 100;
    _cubit.request.co2FromNFetilizer = 5.68;
    _cubit.n2RateCtrler.text = '100';
    _cubit.co2FromCtrler.text = '5.68';
    _cubit.request.waterPump = _waterPumping[0];
    _cubit.request.filedOperation = _fieldOperations[0];
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return ExpansionView(
      title: CarbonFootprintType.fertilizerMechanization.title,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Fertilizer',
                style: TextStyleConstant.robotoW500(
                  color: ColorConstant.text79,
                ),
              ),
              const SizedBox(
                height: 16,
              ),
              AppFormField(
                labelText: 'Nitrogen fertilizer rate (kg N/ha)',
                isShowInfo: true,
                description: _nitrogenDes,
                keyboardType: TextInputType.number,
                controller: _cubit.n2RateCtrler,
                onChanged: (v) {
                  _cubit.request.nRate = double.tryParse(v);
                },
              ),
              const SizedBox(
                height: 24,
              ),
              AppFormField(
                labelText: 'Co2 from N fertilizer (kgCO2e/kg N)',
                isShowInfo: true,
                description: _co2Des,
                keyboardType: TextInputType.number,
                controller: _cubit.co2FromCtrler,
                onChanged: (v) {
                  _cubit.request.co2FromNFetilizer = double.tryParse(v);
                },
              ),
              const SizedBox(
                height: 24,
              ),
              Text(
                'Mechanization',
                style: TextStyleConstant.robotoW500(
                  color: ColorConstant.text79,
                ),
              ),
              const SizedBox(
                height: 16,
              ),
              AppDropdownButton(
                hintText: 'Water pumping (kg CO2e/ha)',
                items: _waterPumping.map((e) => e.title).toList(),
                isShowInfo: true,
                description: _waterDes,
                itemSelected: _cubit.request.waterPump?.title,
                onChanged: (v) {
                  setState(() {
                    _cubit.request.waterPump = _waterPumping[v];
                  });
                },
              ),
              const SizedBox(
                height: 24,
              ),
              AppDropdownButton(
                hintText: 'Field operations  (kg CO2e/ha)',
                items: _fieldOperations.map((e) => e.title).toList(),
                isShowInfo: true,
                description: _fieldDes,
                itemSelected: _cubit.request.filedOperation?.title,
                onChanged: (v) {
                  setState(() {
                    _cubit.request.filedOperation = _fieldOperations[v];
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

final List<OptionData> _waterPumping = [
  OptionData(title: 'No pumping', value: 0),
  OptionData(title: 'Solar powered pumps', value: 0),
  OptionData(title: 'Electric pumps', value: 43),
  OptionData(title: 'Diesel pumps', value: 97),
];
final List<OptionData> _fieldOperations = [
  OptionData(title: 'Mostly manual', value: 0),
  OptionData(title: 'Medium mechanization', value: 120),
  OptionData(title: 'High mechanization', value: 240),
];
const String _nitrogenDes =
    'Amount of pure nitrogen (N) per hectare per season. For example, low fertilizer rate is 80 and a high fertilizer rate is 140.';
const String _co2Des =
    'Amount of GHG emitted to produce one kilogram of nitrogen fertilizer';
const String _waterDes = 'Amount of GHG emitted from operation of water pumps';
const String _fieldDes =
    'Amount of GHG emitted from mechanized field-operations (not including harvesting).\nExample for mostly manual: No mechanization or very limited mechanized field operations\nExample for medium mechanization: Tillage operations\nExample for high mechanization: Tillage, laser land leveling, and/or straw baling';
