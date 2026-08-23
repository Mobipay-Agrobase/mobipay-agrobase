import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/presentation/carbon/cubit/carbon_cubit.dart';
import 'package:agrobase_ekibbo/presentation/carbon/models/carbon_footprint_model.dart';
import 'package:agrobase_ekibbo/presentation/carbon/widgets/expansion_view.dart';

class SaleExpansion extends StatefulWidget {
  const SaleExpansion({super.key});

  @override
  State<SaleExpansion> createState() => _SaleExpansionState();
}

class _SaleExpansionState extends State<SaleExpansion> {
  CarbonCubit get _cubit => BlocProvider.of(context);
  @override
  void initState() {
    _cubit.request.saleMilRice = 900;
    _cubit.milledRiceCtrler.text = '900';
    _cubit.request.saleRiceHusk = 36;
    _cubit.riceHuskCtrler.text = '36';
    _cubit.request.saleRiceBran = 100;
    _cubit.riceBranCtrler.text = '100';
    _cubit.request.saleRiceStraw = 0;
    _cubit.riceStrawCtrler.text = '0';
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return ExpansionView(
      title: CarbonFootprintType.sale.title,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            children: [
              const SizedBox(
                height: 4,
              ),
              AppFormField(
                labelText: 'Milled rice',
                keyboardType: TextInputType.number,
                controller: _cubit.milledRiceCtrler,
                onChanged: (v) {
                  _cubit.request.saleMilRice = double.tryParse(v);
                },
              ),
              const SizedBox(
                height: 24,
              ),
              AppFormField(
                labelText: 'Rice husk',
                keyboardType: TextInputType.number,
                controller: _cubit.riceHuskCtrler,
                onChanged: (v) {
                  _cubit.request.saleRiceHusk = double.tryParse(v);
                },
              ),
              const SizedBox(
                height: 24,
              ),
              AppFormField(
                labelText: 'Rice bran',
                keyboardType: TextInputType.number,
                controller: _cubit.riceBranCtrler,
                onChanged: (v) {
                  _cubit.request.saleRiceBran = double.tryParse(v);
                },
              ),
              const SizedBox(
                height: 24,
              ),
              AppFormField(
                labelText: 'Rice straw',
                keyboardType: TextInputType.number,
                controller: _cubit.riceStrawCtrler,
                onChanged: (v) {
                  _cubit.request.saleRiceStraw = double.tryParse(v);
                },
              ),
              const SizedBox(
                height: 16,
              ),
            ],
          ),
        )
      ],
    );
  }
}
