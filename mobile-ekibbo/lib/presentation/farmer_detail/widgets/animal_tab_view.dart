import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_circular_indicator.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/data_farmer_info.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/animal_husbandry/animal_husbandry_response.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';

class AnimalTabView extends StatelessWidget {
  const AnimalTabView({super.key, required this.farmerId});
  final int farmerId;

  fetchData() async {
    try {
      if (DFarmerInfo.instance.infoAnimals == null) {
        final res =
            await ApiProvider.instance.apiFarmer.getAnimalHusbandry(farmerId);
        DFarmerInfo.instance.infoAnimals = res?.data?.animalHusbandry ?? [];
      }
      return DFarmerInfo.instance.infoAnimals;
    } catch (e) {
      throw Exception();
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future: fetchData(),
      builder: ((context, snapshot) {
        switch (snapshot.connectionState) {
          case ConnectionState.waiting:
            return const Center(
              child: AppCircularIndicator(
                color: ColorConstant.primary,
              ),
            );
          default:
            if (snapshot.hasError) {
              return const Center(child: NoDataView());
            }
            if (snapshot.data == null) {
              return const Center(child: NoDataView());
            }
            final animals = snapshot.data as List<AnimalHusbandryModel>;
            return animals.isEmpty
                ? const NoDataView()
                : ListView.builder(
                    shrinkWrap: true,
                    itemCount: animals.length,
                    padding: const EdgeInsets.all(16),
                    physics: const NeverScrollableScrollPhysics(),
                    itemBuilder: (_, index) {
                      return _buildItemView(animals[index]);
                    },
                  );
        }
      }),
    );
  }

  Container _buildItemView(AnimalHusbandryModel animal) {
    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(15),
        color: ColorConstant.grayF7F8FA,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            AppLang.local.farm_animal,
            style: TextStyleConstant.robotoW700(
              color: ColorConstant.text79,
              fontSize: 16,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            animal.farmAnimal ?? 'N/A',
            style: TextStyleConstant.robotoW400(
              color: ColorConstant.text79,
              fontSize: 12,
            ),
          ),
          const SizedBox(
            height: 16,
          ),
          Text(
            AppLang.local.animal_count,
            style: TextStyleConstant.robotoW700(
              color: ColorConstant.text79,
              fontSize: 16,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            '${animal.animalCount ?? 'N/A'}',
            style: TextStyleConstant.robotoW400(
              color: ColorConstant.text79,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}
