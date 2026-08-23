import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:agrobase_ekibbo/components/app_dropdown_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/presentation/carbon/cubit/carbon_cubit.dart';
import 'package:agrobase_ekibbo/presentation/carbon/models/carbon_footprint_model.dart';
import 'package:agrobase_ekibbo/presentation/carbon/models/option_data.dart';
import 'package:agrobase_ekibbo/presentation/carbon/widgets/expansion_view.dart';

class GeneralInfoExpansion extends StatefulWidget {
  const GeneralInfoExpansion({super.key});

  @override
  State<GeneralInfoExpansion> createState() => _GeneralInfoExpansionState();
}

class _GeneralInfoExpansionState extends State<GeneralInfoExpansion> {
  CarbonCubit get _cubit => BlocProvider.of(context);
  @override
  void initState() {
    _cubit.request.moisureContent = _moistures[0];
    _cubit.request.methaneEmissionFactor = _methanes[0];
    _cubit.getAllFarmer();
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<CarbonCubit, CarbonState>(
      buildWhen: (prev, curr) =>
          curr is GeneralChangedState ||
          curr is CarbonValidateFarmlandState ||
          curr is CarbonValidateCropState,
      builder: (_, state) {
        print(state);
        String? errLand;
        String? errCrop;
        if (state is CarbonValidateFarmlandState) {
          errLand = state.error;
        }
        if (state is CarbonValidateCropState) {
          errCrop = state.error;
        }
        return ExpansionView(
          initiallyExpanded: true,
          title: CarbonFootprintType.generalInfo.title,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                children: [
                  AppDropdownButton(
                    items: _cubit.farmers.map((e) => e.fullName ?? '').toList(),
                    hintText: AppLang.local.farmer,
                    itemSelected: _cubit.request.farmer != null
                        ? _cubit.request.farmer!.fullName
                        : '',
                    onChanged: (v) {
                      _cubit.request.farmer = _cubit.farmers[v];
                      _cubit.getFarmlands();
                    },
                  ),
                  const SizedBox(
                    height: 24,
                  ),
                  AppDropdownButton(
                    items:
                        _cubit.farmlands.map((e) => e.farmName ?? '').toList(),
                    hintText: AppLang.local.plot,
                    itemSelected: _cubit.request.farmLand != null
                        ? _cubit.request.farmLand!.farmName
                        : '',
                    onChanged: (v) {
                      _cubit.request.farmLand = _cubit.farmlands[v];
                      _cubit.getCrops();
                    },
                    error: errLand,
                  ),
                  const SizedBox(
                    height: 24,
                  ),
                  AppDropdownButton(
                    items: _cubit.crops
                        .map((e) =>
                            '${e.season?.seasonName ?? ''}(${e.id ?? ''})')
                        .toList(),
                    hintText: AppLang.local.crops,
                    itemSelected: _cubit.request.cultivation != null
                        ? '${_cubit.request.cultivation!.season?.seasonName ?? ''}(${_cubit.request.cultivation!.id ?? ''})'
                        : '',
                    onChanged: (v) {
                      _cubit.cultivationChanged(v);
                    },
                    error: errCrop,
                  ),
                  const SizedBox(
                    height: 24,
                  ),
                  AppFormField(
                    labelText: AppLang.local.est_yield,
                    controller: _cubit.estYieldTxtCtrler,
                    readOnly: true,
                  ),
                  const SizedBox(
                    height: 24,
                  ),
                  AppDropdownButton(
                    items: _moistures.map((e) => e.title).toList(),
                    hintText: 'Moisture content *',
                    isShowInfo: true,
                    description: _moistureDes,
                    itemSelected: _cubit.request.moisureContent?.title,
                    onChanged: (v) {
                      setState(() {
                        _cubit.request.moisureContent = _moistures[v];
                      });
                    },
                  ),
                  const SizedBox(
                    height: 24,
                  ),
                  AppDropdownButton(
                    items: _methanes.map((e) => e.title).toList(),
                    hintText: 'Methane emission factor *',
                    isShowInfo: true,
                    description: _methaneDes,
                    itemSelected: _cubit.request.methaneEmissionFactor?.title,
                    onChanged: (v) {
                      setState(() {
                        _cubit.request.methaneEmissionFactor = _methanes[v];
                      });
                    },
                  ),
                ],
              ),
            )
          ],
        );
      },
    );
  }
}

List<OptionData> _moistures = [
  OptionData(
    title: 'Already normalized',
    value: 14,
  )
];

List<OptionData> _gwpMethanes = [
  OptionData(
    title: 'IPCC 1995',
    value: 21,
  ),
  OptionData(
    title: 'IPCC 2007',
    value: 25,
  ),
  OptionData(
    title: 'IPCC 2014',
    value: 28,
  ),
];

List<OptionData> _gwpN2Os = [
  OptionData(
    title: 'IPCC 1995',
    value: 310,
  ),
  OptionData(
    title: 'IPCC 2007',
    value: 298,
  ),
  OptionData(
    title: 'IPCC 2014',
    value: 265,
  ),
];
List<OptionData> _methanes = [
  OptionData(
    title: 'Southeast Asia',
    value: 1.22,
  ),
  OptionData(
    title: 'South Asia',
    value: 0.85,
  ),
  OptionData(
    title: 'East Asia',
    value: 1.32,
  ),
  OptionData(
    title: 'Africa',
    value: 1.19,
  ),
  OptionData(
    title: 'Europe',
    value: 1.56,
  ),
  OptionData(
    title: 'North America',
    value: 0.65,
  ),
  OptionData(
    title: 'South America',
    value: 1.27,
  ),
  OptionData(
    title: 'Mean global default',
    value: 1.19,
  ),
];
const String _moistureDes =
    'Please enter the moisture content for your fresh paddy rice.\nIf the yield has been corrected to 14% moisture content already, then please select ‘already normalized’ moisture content,\nIf you do not know the moisture content of the paddy, you can use either of two defaults, namely 27% if the harvest was in a period of rainy weather (typically in the wet season) or 23% if the weather was dry (typically in the dry season).';
const String _methaneDes =
    'Please be reminded that you can use your own field data on emission factors instead of the default values listed below. The unit is the amount of methane (kg CH4) emitted per hectare per day.';
const String _gwpMethaneDes =
    'The 100-year time horizon global warming potentials (GWP) of methane (CH4) relative to CO2.';
const String _gwpN2ODes =
    'The 100-year time horizon global warming potentials (GWP) of nitrous oxide (N2O) relative to CO2';
