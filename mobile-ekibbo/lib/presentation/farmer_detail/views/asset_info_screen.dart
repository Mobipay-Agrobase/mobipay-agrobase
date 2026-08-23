// ignore_for_file: use_build_context_synchronously

import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_dropdown_button.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/multiple_choices_view.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/common_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/asset_info/asset_info_model.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';

class AssetInfoScreen extends StatefulWidget {
  const AssetInfoScreen({
    super.key,
    required this.farmerId,
  });
  final int farmerId;
  @override
  State<AssetInfoScreen> createState() => _AssetInfoScreenState();
}

class _AssetInfoScreenState extends State<AssetInfoScreen> {
  List<DropdownDataModel> _consumerElectronics = [];
  List<String> _consumerSelecteds = [];
  List<DropdownDataModel> _vehicles = [];
  List<String> _vehiclesSelected = [];
  AssetInfoModel? _assetInfo;
  List<DropdownDataModel> _housingOwnerShip = [];
  int? _housingIndex;
  List<DropdownDataModel> _houseTypes = [];
  int? _houseTypeIndex;
  @override
  void initState() {
    _getAssetInfo();
    super.initState();
  }

  _getAssetInfo() async {
    final res =
        await ApiProvider.instance.apiFarmer.getAssetInfo(widget.farmerId);
    if (res?.data != null) {
      setState(() {
        _consumerElectronics = res!.data!.dataConsumerElectronic ?? [];
        _vehicles = res.data!.dataVehicle ?? [];
        _housingOwnerShip = res.data!.dataHousingOwner ?? [];
        _houseTypes = res.data!.dataHouseType ?? [];
        _assetInfo = res.data!.assetInfo;
        _setData();
      });
    }
  }

  _setData() {
    if (_assetInfo != null) {
      _consumerSelecteds = _assetInfo!.consumerElectronic != null
          ? _assetInfo!.consumerElectronic!.split(',')
          : [];
      _vehiclesSelected =
          _assetInfo!.vehicle != null ? _assetInfo!.vehicle!.split(',') : [];
      _housingIndex = _housingOwnerShip
          .getIndex((e) => e.name == _assetInfo!.housingOwnership);
      _houseTypeIndex =
          _houseTypes.getIndex((e) => e.name == _assetInfo!.houseType);
    }
  }

  _onSave() async {
    DialogHelper.showLoading();
    final data = {
      "data_asset": {
        "housing_ownership":
            _housingIndex != null ? _housingOwnerShip[_housingIndex!].name : '',
        "house_type":
            _houseTypeIndex != null ? _houseTypes[_houseTypeIndex!].name : '',
        "consumer_electronic": _consumerSelecteds.join(','),
        "vehicle": _vehiclesSelected.join(','),
        "staff_lat": DataConstant.lat,
        "staff_lng": DataConstant.lat,
      }
    };
    final res = await ApiProvider.instance.apiFarmer
        .updateAssetInfo(widget.farmerId, data);
    DialogHelper.hideLoading();
    if (res?.result == true) {
      Navigator.of(context).pop();
      DialogHelper.showToast(
        context,
        AppLang.local.update_asset_information_successfully,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: AppLang.local.asset_info,
        actions: [
          InkWell(
            onTap: _onSave,
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
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            AppDropdownButton(
              items: _housingOwnerShip.map((e) => e.name ?? '').toList(),
              itemSelected: _housingIndex != null
                  ? _housingOwnerShip[_housingIndex!].name
                  : null,
              hintText: AppLang.local.housing_ownership,
              onChanged: (v) {
                setState(() {
                  _housingIndex = v;
                });
              },
            ),
            const SizedBox(
              height: 24,
            ),
            AppDropdownButton(
              items: _houseTypes.map((e) => e.name ?? '').toList(),
              itemSelected: _houseTypeIndex != null
                  ? _houseTypes[_houseTypeIndex!].name
                  : null,
              hintText: AppLang.local.house_type,
              onChanged: (v) {
                setState(() {
                  _houseTypeIndex = v;
                });
              },
            ),
            const SizedBox(
              height: 24,
            ),
            MultipleChoicesView(
              title: AppLang.local.consumer_electronics,
              datas: _consumerElectronics.map((e) => e.name!).toList(),
              itemsSelected: _consumerSelecteds,
              onChanged: (v) {
                setState(() {
                  if (_consumerSelecteds.contains(v)) {
                    _consumerSelecteds.remove(v);
                  } else {
                    _consumerSelecteds.add(v);
                  }
                });
              },
            ),
            const SizedBox(
              height: 24,
            ),
            MultipleChoicesView(
              title: AppLang.local.vehicle,
              datas: _vehicles.map((e) => e.name!).toList(),
              itemsSelected: _vehiclesSelected,
              onChanged: (v) {
                setState(() {
                  if (_vehiclesSelected.contains(v)) {
                    _vehiclesSelected.remove(v);
                  } else {
                    _vehiclesSelected.add(v);
                  }
                });
              },
            ),
          ],
        ),
      ),
    );
  }
}
