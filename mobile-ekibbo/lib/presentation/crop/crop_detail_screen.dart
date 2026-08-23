import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/carbon_emission/emission_data_model.dart';
import 'package:agrobase_ekibbo/models/carbon_emission/product_data_loss_model.dart';
import 'package:agrobase_ekibbo/models/cultivation/cultivation_model.dart';
import 'package:agrobase_ekibbo/models/dropdown/dropdown_data_model.dart';
import 'package:agrobase_ekibbo/models/farm_land/farm_land_model.dart';
import 'package:agrobase_ekibbo/presentation/farmer_detail/widgets/menu_tab_view.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';

class CropDetailScreen extends StatefulWidget {
  const CropDetailScreen({
    super.key,
    required this.cropId,
  });
  final int cropId;
  @override
  State<CropDetailScreen> createState() => _CropDetailScreenState();
}

class _CropDetailScreenState extends State<CropDetailScreen> {
  CultivationModel? _crop;
  SeasonModel? _season;
  FarmLandModel? _farmland;
  DropdownMasterModel? _cropCulti;
  int _index = 0;
  EmissionDataModel? _emission;
  ProductDataLossModel? _productData;
  @override
  void initState() {
    _getCrop();
    super.initState();
  }

  _getCrop() async {
    final res = await ApiProvider.instance.apiCrop.getCrop(widget.cropId);
    if (res?.data != null) {
      setState(() {
        _crop = res!.data?.cultivationData;
        _season = res.data?.seasonMaster?.first;
        _farmland = res.data?.farmLand?.first;
        _cropCulti = res.data?.cropMaster?.first;
        if (res.data!.carbonEmissionId != null) {
          _getCarbonEmission(res.data!.carbonEmissionId ?? 0);
        }
      });
    }
  }

  _getCarbonEmission(int id) async {
    final res =
        await ApiProvider.instance.apiCarbon.getDetailCarbonEmission(id);
    if (res?.data != null) {
      setState(() {
        _emission = res?.data?.dataEmission;
        _productData = res?.data?.dataProductLoss;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: 'Crop: ${_season?.seasonName ?? ''}',
        subTitle: Text(
          'Harvest Season: ${_crop?.sowingDate ?? ''}',
          style: TextStyleConstant.quicksandW700(
            color: ColorConstant.text79,
            fontSize: 12,
          ),
        ),
      ),
      body: Column(
        children: [
          SizedBox(
            width: double.infinity,
            child: MenuTabView(
              datas: [
                AppLang.local.detail,
                'Carbon Emission',
                'Crop Monitor',
              ],
              onChanged: (v) {
                setState(() {
                  _index = v;
                });
              },
            ),
          ),
          _index == 2
              ? Expanded(
                  child: Stack(
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(top: 5),
                        child: GImage.asset(
                          name: 'satellite'.imgPNG,
                          width: double.infinity,
                        ),
                      ),
                      Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            SvgPicture.asset('ic_lock_big'.iconSvg),
                            const SizedBox(
                              height: 24,
                            ),
                            Text(
                              'Contact For Admin',
                              style: TextStyleConstant.quicksandW700(
                                  fontSize: 24, color: Colors.white),
                            )
                          ],
                        ),
                      )
                    ],
                  ),
                )
              : SingleChildScrollView(
                  child: _index == 0
                      ? _DetailView(
                          farmland: _farmland,
                          season: _season,
                          cropCulti: _cropCulti,
                          crop: _crop,
                        )
                      : _buildCarbonView(),
                )
        ],
      ),
    );
  }

  Column _buildCarbonView() {
    return Column(
      children: [
        _GradientMeasure(
          ghgEmission: _emission?.ghgEmission ?? 0,
        ),
        const SizedBox(
          height: 16,
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Condition:',
              style: TextStyleConstant.robotoW700(
                fontSize: 16,
                color: ColorConstant.text79,
              ),
            ),
            Text(
              ' Uncertain',
              style: TextStyleConstant.robotoW500(
                fontSize: 16,
                color: ColorConstant.redFF4A01,
              ),
            )
          ],
        ),
        const SizedBox(
          height: 33,
        ),
        Padding(
          padding: const EdgeInsets.only(
            right: 16,
            left: 16,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Summary',
                style: TextStyleConstant.robotoW500(fontSize: 16),
              ),
              const SizedBox(
                height: 16,
              ),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.only(
                  top: 24,
                  left: 16,
                  right: 16,
                  bottom: 24,
                ),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(15),
                  color: ColorConstant.grayF7F8FA,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildColumnInfo(
                      'Carbon footprint',
                      '${_emission?.carbonFootPrint ?? 0} gCO2e/kg product',
                    ),
                    const SizedBox(
                      height: 16,
                    ),
                    _buildColumnInfo(
                      'Total product',
                      '${_productData?.totalProductLoss ?? 0} tons',
                    ),
                    const SizedBox(
                      height: 16,
                    ),
                    _buildColumnInfo(
                      'GHG emissions',
                      '${_emission?.ghgEmission ?? 0} CO2e/ha',
                    ),
                    const SizedBox(
                      height: 16,
                    ),
                    _buildColumnInfo(
                      'Crop establishment',
                      '${_emission?.cropEstablish ?? 0}',
                    ),
                    const SizedBox(
                      height: 16,
                    ),
                    _buildColumnInfo(
                      'Water/Soil management',
                      '${_emission?.waterSoil ?? 0}',
                    ),
                  ],
                ),
              )
            ],
          ),
        )
      ],
    );
  }

  String getStatusTitle() {
    if ((_emission?.ghgEmission ?? 0) >= 4000) {
      return 'Extreme';
    }
    if ((_emission?.ghgEmission ?? 0) >= 2000) {
      return 'Average';
    }
    return 'Low';
  }

  Column _buildColumnInfo(String title, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyleConstant.robotoW700(
            fontSize: 16,
            color: ColorConstant.text79,
          ),
        ),
        const SizedBox(
          height: 8,
        ),
        Text(
          value,
          style: TextStyleConstant.robotoW400(
            fontSize: 12,
            color: ColorConstant.text79,
          ),
        ),
      ],
    );
  }
}

class _GradientMeasure extends StatelessWidget {
  const _GradientMeasure({
    super.key,
    this.ghgEmission = 0,
  });
  final double ghgEmission;
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 40,
      width: 282,
      margin: const EdgeInsets.only(top: 32),
      child: Stack(
        children: [
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            bottom: 4,
            child: Container(
              clipBehavior: Clip.hardEdge,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                gradient: const LinearGradient(
                  colors: [
                    Color(0xffC2C2C2),
                    Color(0xffE6E6E6),
                  ],
                ),
              ),
              child: Container(
                margin: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(7),
                  gradient: const LinearGradient(
                    colors: [
                      Color(0xffE6E6E6),
                      Color(0xffC2C2C2),
                    ],
                  ),
                ),
                child: Container(
                  margin: const EdgeInsets.all(3),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(4),
                    gradient: const LinearGradient(
                      colors: [
                        Color(0xff800300),
                        Color(0xffFF1B00),
                        Color(0xffFF7F00),
                        Color(0xffFFC500),
                        Color(0xffA5F700),
                        Color(0xff62A300),
                      ],
                    ),
                  ),
                  child: Row(
                    children: [
                      _buildSquare(),
                      _buildSquare(),
                      _buildSquare(),
                      _buildSquare(),
                      _buildSquare(),
                      _buildSquare(),
                      _buildSquare(),
                      _buildSquare(),
                      _buildSquare(),
                      _buildSquare(),
                      _buildSquare(),
                      _buildSquare(isBorder: false),
                    ],
                  ),
                ),
              ),
            ),
          ),
          Positioned(
            bottom: 0,
            left: 23 * _getRange() + 8,
            child: SvgPicture.asset('ic_joy'.iconSvg),
          ),
        ],
      ),
    );
  }

  int _getRange() {
    if (ghgEmission >= 6000) {
      return 0;
    }
    return (6000 - ghgEmission) ~/ 500;
  }

  Widget _buildSquare({bool isBorder = true}) {
    return Expanded(
      child: Container(
        decoration: BoxDecoration(
          border: isBorder
              ? const Border(
                  right: BorderSide(
                    color: Color(0xffE6E6E6),
                  ),
                )
              : null,
        ),
      ),
    );
  }
}

class _DetailView extends StatelessWidget {
  const _DetailView({
    super.key,
    required FarmLandModel? farmland,
    required SeasonModel? season,
    required DropdownMasterModel? cropCulti,
    required CultivationModel? crop,
  })  : _farmland = farmland,
        _season = season,
        _cropCulti = cropCulti,
        _crop = crop;

  final FarmLandModel? _farmland;
  final SeasonModel? _season;
  final DropdownMasterModel? _cropCulti;
  final CultivationModel? _crop;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.only(
        top: 24,
        left: 16,
        right: 16,
        bottom: 24,
      ),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(15),
        color: ColorConstant.grayF7F8FA,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            AppLang.local.plot_name,
            style: TextStyleConstant.robotoW700(
              fontSize: 16,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            _farmland?.farmName ?? '',
            style: TextStyleConstant.robotoW400(
              fontSize: 12,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 16,
          ),
          Text(
            AppLang.local.harvest_season,
            style: TextStyleConstant.robotoW700(
              fontSize: 16,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            _season?.seasonName ?? '',
            style: TextStyleConstant.robotoW400(
              fontSize: 12,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 16,
          ),
          Text(
            AppLang.local.crop_cultivated,
            style: TextStyleConstant.robotoW700(
              fontSize: 16,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            _cropCulti?.name ?? '',
            style: TextStyleConstant.robotoW400(
              fontSize: 12,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 16,
          ),
          Text(
            AppLang.local.crop_variety,
            style: TextStyleConstant.robotoW700(
              fontSize: 16,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            _crop?.cropVariety ?? '',
            style: TextStyleConstant.robotoW400(
              fontSize: 12,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 16,
          ),
          Text(
            AppLang.local.sowing_date,
            style: TextStyleConstant.robotoW700(
              fontSize: 16,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            _crop?.sowingDate ?? '',
            style: TextStyleConstant.robotoW400(
              fontSize: 12,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 16,
          ),
          Text(
            AppLang.local.est_yield,
            style: TextStyleConstant.robotoW700(
              fontSize: 16,
              color: ColorConstant.text79,
            ),
          ),
          const SizedBox(
            height: 8,
          ),
          Text(
            _crop?.estYield ?? '',
            style: TextStyleConstant.robotoW400(
              fontSize: 12,
              color: ColorConstant.text79,
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(top: 16),
            child: GInternetImage(
              width: 148,
              height: 86,
              url: _crop?.photoUrl,
              borderRadius: 8,
            ),
          )
        ],
      ),
    );
  }
}
