// ignore_for_file: use_build_context_synchronously

import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_button.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/animal_husbandry/animal_husbandry_response.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';

class AnimalHusbandryScreen extends StatefulWidget {
  const AnimalHusbandryScreen({
    super.key,
    required this.farmerId,
  });
  final int farmerId;
  @override
  State<AnimalHusbandryScreen> createState() => _AnimalHusbandryScreenState();
}

class _AnimalHusbandryScreenState extends State<AnimalHusbandryScreen> {
  List<AnimalHusbandryModel> _animals = [];
  AnimalHusbandryResponse? _animalRes;
  @override
  void initState() {
    _getAnimalHusbandry();
    super.initState();
  }

  _getAnimalHusbandry() async {
    final res = await ApiProvider.instance.apiFarmer
        .getAnimalHusbandry(widget.farmerId);
    if (!mounted) return;
    if (res?.data != null) {
      setState(() {
        _animalRes = res?.data;
        _animals = res!.data!.animalHusbandry ?? [];
      });
    }
  }

  _onSave() async {
    DialogHelper.showLoading();
    final data = {
      'data_animal_husbandry': _animals.map((e) => e.toJson()).toList(),
    };
    final res = await ApiProvider.instance.apiFarmer
        .updateAnimalHusbandry(widget.farmerId, data);
    DialogHelper.hideLoading();
    if (res?.result == true) {
      Navigator.of(context).pop();
      DialogHelper.showToast(context, AppLang.local.update_animal_successfully);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: AppLang.local.animal_husbandry,
        actions: _animals.isEmpty
            ? null
            : [
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
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _animals.isEmpty
                ? const NoDataView()
                : ListView.builder(
                      itemCount: _animals.length,
                      shrinkWrap: true,
                      itemBuilder: (_, index) {
                        final item = _animals[index];
                        return Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(3),
                            color: ColorConstant.grayEDEFF4,
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.farmAnimal ?? '',
                                style: TextStyleConstant.robotoW600(),
                              ),
                              const SizedBox(
                                height: 10,
                              ),
                              Text(
                                '${AppLang.local.animal_count}: ${item.animalCount ?? ''}',
                                style: TextStyleConstant.robotoW400(
                                  color: ColorConstant.text79,
                                ),
                              ),
                              const SizedBox(
                                height: 4,
                              ),
                              Text(
                                '${AppLang.local.revenue}: ${item.revenue ?? ''}',
                                style: TextStyleConstant.robotoW400(
                                  color: ColorConstant.text79,
                                ),
                              ),
                              const SizedBox(
                                height: 16,
                              ),
                              Row(
                                children: [
                                  InkWell(
                                    onTap: () {
                                      Navigator.of(context).pushNamed(
                                        RouterName.new_animal,
                                        arguments: {
                                          'animal_res': _animalRes,
                                          'animal': item,
                                        },
                                      ).then((value) {
                                        if (value != null &&
                                            value is AnimalHusbandryModel) {
                                          _animals[index] = value;
                                          setState(() {});
                                        }
                                      });
                                    },
                                    child: Text(
                                      AppLang.local.edit,
                                      style: TextStyleConstant.robotoW400(
                                        fontSize: 12,
                                        color: ColorConstant.primary,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(
                                    width: 16,
                                  ),
                                  InkWell(
                                    onTap: () {
                                      setState(() {
                                        _animals.removeAt(index);
                                      });
                                    },
                                    child: Text(
                                      AppLang.local.remove,
                                      style: TextStyleConstant.robotoW400(
                                        fontSize: 12,
                                        color: ColorConstant.redFF1A21,
                                      ),
                                    ),
                                  )
                                ],
                              )
                            ],
                          ),
                        );
                      },
                    ),
            AppButton(
              onTap: () {
                Navigator.of(context).pushNamed(
                  RouterName.new_animal,
                  arguments: {'animal_res': _animalRes},
                ).then((value) {
                  if (value != null && value is AnimalHusbandryModel) {
                    _animals.add(value);
                    setState(() {});
                  }
                });
              },
              height: 40,
              radius: 8,
              title: AppLang.local.add_new_animal_husbandry,
              color: Colors.white,
              borderColor: ColorConstant.primary,
              titleStyle: TextStyleConstant.quicksandW600(
                fontSize: 16,
                color: ColorConstant.primary,
              ),
            )
          ],
        ),
      ),
    );
  }
}
