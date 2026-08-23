import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:agrobase_ekibbo/components/app_dropdown_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/presentation/carbon/cubit/carbon_cubit.dart';
import 'package:agrobase_ekibbo/presentation/carbon/models/carbon_footprint_model.dart';
import 'package:agrobase_ekibbo/presentation/carbon/models/option_data.dart';
import 'package:agrobase_ekibbo/presentation/carbon/widgets/expansion_view.dart';

class WaterSoilExpansion extends StatefulWidget {
  const WaterSoilExpansion({super.key});

  @override
  State<WaterSoilExpansion> createState() => _WaterSoilExpansionState();
}

class _WaterSoilExpansionState extends State<WaterSoilExpansion> {
  CarbonCubit get _cubit => BlocProvider.of(context);
  @override
  void initState() {
    _cubit.request.amountOfStawInco = 0;
    _cubit.request.amountOrganic = 0;
    _cubit.request.preSeasonWater = _preSeasonWaters[0];
    _cubit.request.inSeasonWater = _inSeasonWaters[0];
    _cubit.request.timingOfStawInco = _timings[0];
    _cubit.request.typeOrganic = _typesOrganic[0];

    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return ExpansionView(
      title: CarbonFootprintType.waterSoilMangement.title,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            children: [
              AppDropdownButton(
                items: _preSeasonWaters.map((e) => e.title).toList(),
                hintText: 'Pre-season water regime',
                isShowInfo: true,
                description: _preSeasonDes,
                itemSelected: _cubit.request.preSeasonWater?.title,
                onChanged: (v) {
                  setState(() {
                    _cubit.request.preSeasonWater = _preSeasonWaters[v];
                  });
                },
              ),
              const SizedBox(
                height: 24,
              ),
              AppDropdownButton(
                items: _inSeasonWaters.map((e) => e.title).toList(),
                hintText: 'In-season water regime',
                isShowInfo: true,
                description: _inSeasonDes,
                itemSelected: _cubit.request.inSeasonWater?.title,
                onChanged: (v) {
                  setState(() {
                    _cubit.request.inSeasonWater = _inSeasonWaters[v];
                  });
                },
              ),
              const SizedBox(
                height: 24,
              ),
              AppDropdownButton(
                items: _timings.map((e) => e.title).toList(),
                hintText: 'Timing of straw incorporation',
                isShowInfo: true,
                description: _timingDes,
                itemSelected: _cubit.request.timingOfStawInco?.title,
                onChanged: (v) {
                  setState(() {
                    _cubit.request.timingOfStawInco = _timings[v];
                  });
                },
              ),
              const SizedBox(
                height: 24,
              ),
              AppFormField(
                labelText: 'Amount of straw incorporation (ton/ha)',
                isShowInfo: true,
                description: _amountStrawDes,
                keyboardType: TextInputType.number,
                controller: _cubit.amountStrawCtrler,
                hint: '0',
                onChanged: (v) {
                  _cubit.request.amountOfStawInco = double.tryParse(v);
                },
              ),
              const SizedBox(
                height: 24,
              ),
              AppDropdownButton(
                items: _typesOrganic.map((e) => e.title).toList(),
                hintText: 'Type of organic amendment',
                isShowInfo: true,
                description: _organicDes,
                itemSelected: _cubit.request.typeOrganic?.title,
                onChanged: (v) {
                  setState(() {
                    _cubit.request.typeOrganic = _typesOrganic[v];
                  });
                },
              ),
              const SizedBox(
                height: 24,
              ),
              AppFormField(
                key: UniqueKey(),
                labelText: 'Amount of organic amendment',
                isShowInfo: true,
                description: _amountOrganic,
                keyboardType: TextInputType.number,
                controller: _cubit.amountOrganicCtrler,
                hint: '0',
                onChanged: (v) {
                  _cubit.request.amountOrganic = double.tryParse(v);
                },
              ),
            ],
          ),
        )
      ],
    );
  }
}

final List<OptionData> _preSeasonWaters = [
  OptionData(
    title: 'Non-flooded <= 180 days',
    value: 1,
  ),
  OptionData(
    title: 'Non-flooded > 180 days',
    value: 0.89,
  ),
  OptionData(
    title: 'Flooded > 30 days',
    value: 2.41,
  ),
  OptionData(
    title: 'Non-flooded > 365 days',
    value: 0.59,
  ),
];
final List<OptionData> _inSeasonWaters = [
  OptionData(
    title: 'Irrigated / continuous flooding',
    value: 1,
  ),
  OptionData(
    title: 'Irrigated / single drainage period',
    value: 0.71,
  ),
  OptionData(
    title: 'Irrigated / multiple drainage periods',
    value: 0.55,
  ),
  OptionData(
    title: 'Rainfed / regular',
    value: 0.54,
  ),
  OptionData(
    title: 'Rainfed/ drought prone',
    value: 0.16,
  ),
  OptionData(
    title: 'Deepwater',
    value: 0.06,
  ),
];
final List<OptionData> _timings = [
  OptionData(
    title: 'Less than or equal 30 days',
    value: 1,
  ),
  OptionData(
    title: 'More than 30 days',
    value: 0.19,
  ),
];
final List<OptionData> _typesOrganic = [
  OptionData(
    title: 'Compost',
    value: 0.17,
  ),
  OptionData(
    title: 'Farm yard manure',
    value: 0.21,
  ),
  OptionData(
    title: 'Green manure',
    value: 0.45,
  ),
];
const String _preSeasonDes =
    'Scaling factor for water regime before the crop season. Shorter flooding periods (for plowing) are not considered\nIf your field is dry for less than 6 months please select “Non-flooded <= 180 days” This often occurs under double cropping of rice.\nIf your field is dry for more than 6 months please select ”Non-flooded > 180 days” For example, single rice crop following a dry fallow period.\nIf your field is flooded more than 30 days please select “Flooded > 30 days”. This is a rare case.\nIf your field is dry for over a year please select “Non-flooded > 365 days” For example, if you have upland crop , paddy rotation, or fallow without flooding in the previous year.';
const String _inSeasonDes =
    'Scaling factor for water management during the crop season:\nIrrigated - continuously flooded: Fields have standing water throughout the rice growing season and may only dry out for harvest (end-season drainage)\nIrrigated - single drainage period: Fields have a single drainage event and period during the cropping season at any growth stage, in addition to the end of season drainage\nIrrigated - multiple drainage periods: Fields have more than one drainage event and period of time without flooded conditions during the cropping season, in addition to an end of season drainage, including alternate wetting and drying (AWD)\nDeep water: Water level rises to more than 50 cm above the soil for a significant period of time during the cropping season\nRainfed - regular rainfed: The water level may rise up to 50 cm during the cropping season\nRainfed - drought proneI: Drought periods occur during every cropping season';
const String _timingDes =
    'Conversion factor for duration of straw incorporation before cultivation.\nShort: Straw incorporated shortly (<=30 days) before cultivation\nLong: Straw incorporated long (>30 days) before cultivation';
const String _amountStrawDes =
    'Rice straw harvested, usually 60% of grain yield. Stubble incorporation is already included in the calculations.';
const String _organicDes = 'Conversion factor for type of organic amendment';
const String _amountOrganic =
    'Enter the amount of organic matter selected above in t/ha (not including rice straw unless it’s in the form on compost)';
