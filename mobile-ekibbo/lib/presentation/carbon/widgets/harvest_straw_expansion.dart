import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:agrobase_ekibbo/components/app_dropdown_button.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/presentation/carbon/cubit/carbon_cubit.dart';
import 'package:agrobase_ekibbo/presentation/carbon/models/carbon_footprint_model.dart';
import 'package:agrobase_ekibbo/presentation/carbon/models/option_data.dart';
import 'package:agrobase_ekibbo/presentation/carbon/widgets/expansion_view.dart';

class HarvestStrawExpansion extends StatefulWidget {
  const HarvestStrawExpansion({super.key});

  @override
  State<HarvestStrawExpansion> createState() => _HarvestStrawExpansionState();
}

class _HarvestStrawExpansionState extends State<HarvestStrawExpansion> {
  CarbonCubit get _cubit => BlocProvider.of(context);
  @override
  void initState() {
    _cubit.request.harvestMethod = _harvests[0];
    _cubit.request.strawManagement = _strawManagements[0];
    _cubit.request.percentOfStraw = _percentages[0];
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return ExpansionView(
      title: CarbonFootprintType.harvestStraw.title,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Harvest',
                style: TextStyleConstant.robotoW500(
                  color: ColorConstant.text79,
                ),
              ),
              const SizedBox(
                height: 16,
              ),
              AppDropdownButton(
                hintText: 'Harvesting method',
                items: _harvests.map((e) => e.title).toList(),
                isShowInfo: true,
                description: _harvestDes,
                itemSelected: _cubit.request.harvestMethod?.title,
                onChanged: (v) {
                  setState(() {
                    _cubit.request.harvestMethod = _harvests[v];
                  });
                },
              ),
              const SizedBox(
                height: 24,
              ),
              Text(
                'Straw',
                style: TextStyleConstant.robotoW500(
                  color: ColorConstant.text79,
                ),
              ),
              const SizedBox(
                height: 16,
              ),
              AppDropdownButton(
                hintText: 'Straw management',
                items: _strawManagements.map((e) => e.title).toList(),
                isShowInfo: true,
                description: _strawDes,
                itemSelected: _cubit.request.strawManagement?.title,
                onChanged: (v) {
                  setState(() {
                    _cubit.request.strawManagement = _strawManagements[v];
                  });
                },
              ),
              const SizedBox(
                height: 24,
              ),
              AppDropdownButton(
                hintText: 'Percentage of total straw used',
                items: _percentages.map((e) => e.title).toList(),
                isShowInfo: true,
                description: _percentagesDes,
                itemSelected: _cubit.request.percentOfStraw?.title,
                onChanged: (v) {
                  setState(() {
                    _cubit.request.percentOfStraw = _percentages[v];
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

final List<OptionData> _harvests = [
  OptionData(
    title: 'Mechanized threshing',
    value: 230,
    subValues: [11.275],
  ),
  OptionData(
    title: 'Combine harvesting',
    value: 770,
    subValues: [1.3],
  )
];
final List<OptionData> _strawManagements = [
  OptionData(
    title: 'Not considered',
    value: 0,
  ),
  OptionData(
    title: 'Burning',
    value: 145,
  ),
  OptionData(
    title: 'Used as commodity',
    value: 0,
  ),
];
final List<OptionData> _percentages = [
  OptionData(
    title: '0',
    value: 0,
  ),
  OptionData(
    title: '50',
    value: 50,
  ),
  OptionData(
    title: '80',
    value: 80,
  ),
  OptionData(
    title: '100',
    value: 100,
  ),
];
const String _percentagesDes = 'Percentage of total straw used';
const String _harvestDes =
    'GHG emission and grain loss ratio from harvest operations';
const String _strawDes =
    'Amount of GHG emitted from straw processing.\nBurning: burn straw on the field after harvest\nUsed as commodity: straw is gathered and sold\nNot considered: the straw is removed or left on the field.';
