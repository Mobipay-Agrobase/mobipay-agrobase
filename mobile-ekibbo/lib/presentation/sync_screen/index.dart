import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:agrobase_ekibbo/application/app_provider.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/presentation/sync_screen/widgets/summary_item.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';

class ScreenSync extends StatefulWidget {
  static const route = '/sync_from_local';
  const ScreenSync({super.key});

  @override
  State<ScreenSync> createState() => _ScreenSyncState();
}

class _ScreenSyncState extends State<ScreenSync> {
  late AppProvider appProvider;

  @override
  Widget build(BuildContext context) {
    appProvider = context.watch<AppProvider>();
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const CustomAppBar(
        title: 'Sync Data',
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        child: Align(
          alignment: Alignment.topCenter,
          child: Wrap(
            spacing: 8,
            runSpacing: 8,
            alignment: WrapAlignment.center,
            children: [
              SummaryItem(
                  title: 'Sync Farmer',
                  value: appProvider.appFarmer.datas.length.toString(),
                  onPressed: () {
                    Navigator.of(context).pushNamed(RouterName.farmers_local);
                  }),
              SummaryItem(
                  title: 'Sync Pond',
                  value: appProvider.appPond.datas.length.toString(),
                  onPressed: () {
                    Navigator.of(context).pushNamed(RouterName.ponds_local);
                  }),
              SummaryItem(
                  title: 'Sync Species',
                  value: appProvider.appSpecies.datas.length.toString(),
                  onPressed: () {
                    Navigator.of(context).pushNamed(RouterName.species_local);
                  }),
            ],
          ),
        ),
      ),
    );
  }
}
