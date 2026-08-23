import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/presentation/carbon/cubit/carbon_cubit.dart';
import 'package:agrobase_ekibbo/presentation/carbon/models/carbon_footprint_model.dart';
import 'package:agrobase_ekibbo/presentation/carbon/widgets/expansion_view.dart';

class TransportationExpansion extends StatefulWidget {
  const TransportationExpansion({super.key});

  @override
  State<TransportationExpansion> createState() =>
      _TransportationExpansionState();
}

class _TransportationExpansionState extends State<TransportationExpansion> {
  CarbonCubit get _cubit => BlocProvider.of(context);
  @override
  void initState() {
    _cubit.request.truck = 100;
    _cubit.truckCtrler.text = '100';
    _cubit.request.tractor = 50;
    _cubit.tractorCtrler.text = '50';
    _cubit.request.localBoat = 0;
    _cubit.localBoatCtrler.text = '0';
    _cubit.request.ship = 0;
    _cubit.shipCtrler.text = '0';
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return ExpansionView(
      title: CarbonFootprintType.transportation.title,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            children: [
              const SizedBox(
                height: 4,
              ),
              AppFormField(
                labelText: 'Truck',
                keyboardType: TextInputType.number,
                controller: _cubit.truckCtrler,
                onChanged: (v) {
                  _cubit.request.truck = double.tryParse(v);
                },
              ),
              const SizedBox(
                height: 24,
              ),
              AppFormField(
                labelText: 'Tractor',
                keyboardType: TextInputType.number,
                controller: _cubit.tractorCtrler,
                onChanged: (v) {
                  _cubit.request.tractor = double.tryParse(v);
                },
              ),
              const SizedBox(
                height: 24,
              ),
              AppFormField(
                labelText: 'Local boat (domestic)',
                keyboardType: TextInputType.number,
                controller: _cubit.localBoatCtrler,
                onChanged: (v) {
                  _cubit.request.localBoat = double.tryParse(v);
                },
              ),
              const SizedBox(
                height: 24,
              ),
              AppFormField(
                labelText: 'Ship (international)',
                keyboardType: TextInputType.number,
                controller: _cubit.shipCtrler,
                onChanged: (v) {
                  _cubit.request.ship = double.tryParse(v);
                },
              ),
            ],
          ),
        )
      ],
    );
  }
}
