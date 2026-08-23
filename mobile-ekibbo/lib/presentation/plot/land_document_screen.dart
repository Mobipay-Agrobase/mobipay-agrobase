import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';

class LandDocumentScreen extends StatelessWidget {
  const LandDocumentScreen({
    super.key,
    this.landDocument,
  });
  final String? landDocument;
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: AppLang.local.land_document,
      ),
      body: landDocument == null || landDocument == ''
          ? const NoDataView()
          : ListView.builder(
              itemCount: 10,
              shrinkWrap: true,
              padding: const EdgeInsets.all(16),
              itemBuilder: (_, index) {
                return Container(
                  clipBehavior: Clip.hardEdge,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(15),
                  ),
                  child: const GInternetImage(
                    url:
                        'https://vcdn1-dulich.vnecdn.net/2023/06/23/MD1-1872-1687513752.jpg?w=0&h=0&q=100&dpr=1&fit=crop&s=uvi2oM1aN8cUUypRnPdLqw',
                    height: 200,
                  ),
                );
              },
            ),
    );
  }
}
