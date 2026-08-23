import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_circular_indicator.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/infrastructure/store_data/data_farmer_info.dart';
import 'package:agrobase_ekibbo/models/farm_equipment/farm_equipment_response.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';

class EquipmentTabView extends StatelessWidget {
  const EquipmentTabView({super.key, required this.farmerId});
  final int farmerId;

  fetchData() async {
    try {
      if (DFarmerInfo.instance.infoEquipments == null) {
        final res =
            await ApiProvider.instance.apiFarmer.getFarmEquipment(farmerId);
        DFarmerInfo.instance.infoEquipments = res?.data?.farmEquipment ?? [];
      }
      return DFarmerInfo.instance.infoEquipments;
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
            final equipments = snapshot.data as List<FarmEquipmentModel>;
            return equipments.isEmpty
                ? const NoDataView()
                : ListView.builder(
                    itemCount: equipments.length,
                    shrinkWrap: true,
                    padding: const EdgeInsets.all(16),
                    physics: const NeverScrollableScrollPhysics(),
                    itemBuilder: (_, index) {
                      return _buildItemView(equipments[index]);
                    },
                  );
        }
      }),
    );
  }

  Container _buildItemView(FarmEquipmentModel equipment) {
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
            equipment.farmEquipmentItems ?? 'N/A',
            style: TextStyleConstant.robotoW700(
              color: ColorConstant.text79,
              fontSize: 16,
            ),
          ),
          const SizedBox(
            height: 16,
          ),
          Text(
            'Item count ${equipment.farmEquipmentItemsCount ?? 'N/A'}',
            style: TextStyleConstant.robotoW400(
              color: ColorConstant.text79,
              fontSize: 14,
            ),
          ),
          const SizedBox(
            height: 16,
          ),
          Text(
            'Year of Manufacture: ${equipment.yearOfManufacture ?? ''}',
            style: TextStyleConstant.robotoW400(
              color: ColorConstant.text79,
              fontSize: 14,
            ),
          ),
          const SizedBox(
            height: 16,
          ),
          Text(
            'Year of purchase: ${equipment.yearOfPurchase ?? ''}',
            style: TextStyleConstant.robotoW400(
              color: ColorConstant.text79,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}
