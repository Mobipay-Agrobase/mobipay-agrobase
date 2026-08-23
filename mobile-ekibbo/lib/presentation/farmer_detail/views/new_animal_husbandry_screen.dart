import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/app_dropdown_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/common_helper.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/animal_husbandry/animal_husbandry_response.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';

class NewAnimalHusbandryScreen extends StatefulWidget {
  const NewAnimalHusbandryScreen({
    super.key,
    this.animalRes,
    this.animal,
  });
  final AnimalHusbandryResponse? animalRes;
  final AnimalHusbandryModel? animal;
  @override
  State<NewAnimalHusbandryScreen> createState() =>
      _NewAnimalHusbandryScreenState();
}

class _NewAnimalHusbandryScreenState extends State<NewAnimalHusbandryScreen> {
  List<DropdownDataModel> _animalTypes = [];
  List<DropdownDataModel> _fodders = [];
  List<DropdownDataModel> _animalHousings = [];
  List<DropdownDataModel> _animalForGrowths = [];
  int? _animalIndex;
  int? _fodderIndex;
  int? _housingIndex;
  int? _growthIndex;
  final _countTxtController = TextEditingController();
  final _revenueTxtController = TextEditingController();
  final _breedTxtController = TextEditingController();
  @override
  void initState() {
    super.initState();
    if (widget.animalRes != null) {
      final res = widget.animalRes!;
      _animalTypes = res.dataFarmAnimal ?? [];
      _fodders = res.dataFodder ?? [];
      _animalHousings = res.dataAnimalHousing ?? [];
      _animalForGrowths = res.dataAnimalForGrowth ?? [];
    }
    _setData();
  }

  _setData() {
    if (widget.animal != null) {
      final animal = widget.animal!;
      _animalIndex =
          _animalTypes.getIndex((p0) => p0.name == animal.farmAnimal);
      _countTxtController.text = '${animal.animalCount ?? ''}';
      _fodderIndex = _fodders.getIndex((p0) => p0.name == animal.fodder);
      _housingIndex =
          _animalHousings.getIndex((p0) => p0.name == animal.animalHousing);
      _revenueTxtController.text = "${animal.revenue ?? ''}";
      _breedTxtController.text = animal.breedName ?? '';
      _growthIndex =
          _animalForGrowths.getIndex((p0) => p0.name == animal.animalForGrowth);
    }
  }

  _onSave() {
    final b = AnimalHusbandryModel();
    b.farmAnimal =
        _animalIndex != null ? _animalTypes[_animalIndex!].name : null;
    b.animalCount = int.tryParse(_countTxtController.text);
    b.fodder = _fodderIndex != null ? _fodders[_fodderIndex!].name : null;
    b.animalHousing =
        _housingIndex != null ? _animalHousings[_housingIndex!].name : null;
    b.revenue = double.tryParse(_revenueTxtController.text);
    b.breedName = _breedTxtController.text;
    b.animalForGrowth =
        _growthIndex != null ? _animalForGrowths[_growthIndex!].name : null;
    Navigator.of(context).pop(b);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusManager.instance.primaryFocus?.unfocus(),
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: CustomAppBar(
          title: AppLang.local.animal_husbandry,
          actions: _animalIndex == null
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
        body: Padding(
          padding: const EdgeInsets.all(16),
          child: SingleChildScrollView(
            child: Column(
              children: [
                AppDropdownButton(
                  items: _animalTypes.map((e) => e.name!).toList(),
                  hintText: AppLang.local.farm_animal,
                  itemSelected: _animalIndex != null
                      ? _animalTypes[_animalIndex!].name
                      : null,
                  onChanged: (p0) {
                    setState(() {
                      _animalIndex = p0;
                    });
                  },
                ),
                const SizedBox(
                  height: 24,
                ),
                AppFormField(
                  hint: AppLang.local.animal_count,
                  keyboardType: TextInputType.number,
                  controller: _countTxtController,
                ),
                const SizedBox(
                  height: 24,
                ),
                AppDropdownButton(
                  items: _fodders.map((e) => e.name!).toList(),
                  hintText: AppLang.local.fodder,
                  itemSelected: _fodderIndex != null
                      ? _fodders[_fodderIndex!].name
                      : null,
                  onChanged: (p0) {
                    setState(() {
                      _fodderIndex = p0;
                    });
                  },
                ),
                const SizedBox(
                  height: 24,
                ),
                AppDropdownButton(
                  items: _animalHousings.map((e) => e.name!).toList(),
                  hintText: AppLang.local.animal_housing,
                  itemSelected: _housingIndex != null
                      ? _animalHousings[_housingIndex!].name
                      : null,
                  onChanged: (p0) {
                    setState(() {
                      _housingIndex = p0;
                    });
                  },
                ),
                const SizedBox(
                  height: 24,
                ),
                AppFormField(
                  hint: AppLang.local.revenue,
                  keyboardType: TextInputType.number,
                  controller: _revenueTxtController,
                ),
                const SizedBox(
                  height: 24,
                ),
                AppFormField(
                  hint: AppLang.local.breed_name,
                  controller: _breedTxtController,
                ),
                const SizedBox(
                  height: 24,
                ),
                AppDropdownButton(
                  hintText: AppLang.local.animal_for_growth,
                  items: _animalForGrowths.map((e) => e.name!).toList(),
                  itemSelected: _growthIndex != null
                      ? _animalForGrowths[_growthIndex!].name
                      : null,
                  onChanged: (p0) {
                    setState(() {
                      _growthIndex = p0;
                    });
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
