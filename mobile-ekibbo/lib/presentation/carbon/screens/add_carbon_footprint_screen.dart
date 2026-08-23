import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/presentation/carbon/cubit/carbon_cubit.dart';
import 'package:agrobase_ekibbo/presentation/carbon/widgets/crop_estab_expansion.dart';
import 'package:agrobase_ekibbo/presentation/carbon/widgets/dry_storing_expansion.dart';
import 'package:agrobase_ekibbo/presentation/carbon/widgets/fertilizer_mechanization_expansion.dart';
import 'package:agrobase_ekibbo/presentation/carbon/widgets/general_info_expansion.dart';
import 'package:agrobase_ekibbo/presentation/carbon/widgets/harvest_straw_expansion.dart';
import 'package:agrobase_ekibbo/presentation/carbon/widgets/milling_packaging_expansion.dart';
import 'package:agrobase_ekibbo/presentation/carbon/widgets/sale_expansion.dart';
import 'package:agrobase_ekibbo/presentation/carbon/widgets/transportation_expansion.dart';
import 'package:agrobase_ekibbo/presentation/carbon/widgets/water_soil_expansion.dart';

class AddCarbonFootprintScreen extends StatefulWidget {
  const AddCarbonFootprintScreen({super.key});

  @override
  State<AddCarbonFootprintScreen> createState() =>
      _AddCarbonFootprintScreenState();
}

class _AddCarbonFootprintScreenState extends State<AddCarbonFootprintScreen> {
  CarbonCubit get _cubit => BlocProvider.of(context);
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusManager.instance.primaryFocus?.unfocus(),
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: CustomAppBar(
          title: 'Add Carbon Footprint',
          actions: [
            InkWell(
              onTap: _cubit.onSave,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Text(
                  AppLang.local.save,
                  style: TextStyleConstant.quicksandW600(
                    color: ColorConstant.primary,
                    fontSize: 16,
                  ),
                ),
              ),
            )
          ],
        ),
        body: SingleChildScrollView(
          child: Column(
            children: [
              GeneralInfoExpansion(),
              const SizedBox(
                height: 8,
              ),
              CropExtabExpansion(),
              const SizedBox(
                height: 8,
              ),
              WaterSoilExpansion(),
              const SizedBox(
                height: 8,
              ),
              FertilizerMechanizationExpansion(),
              const SizedBox(
                height: 8,
              ),
              HarvestStrawExpansion(),
              const SizedBox(
                height: 8,
              ),
              DryStoringExpansion(),
              const SizedBox(
                height: 8,
              ),
              MillingPackaginExpansion(),
              const SizedBox(
                height: 8,
              ),
              TransportationExpansion(),
              const SizedBox(
                height: 8,
              ),
              SaleExpansion(),
            ],
          ),
        ),
      ),
    );
  }
}
