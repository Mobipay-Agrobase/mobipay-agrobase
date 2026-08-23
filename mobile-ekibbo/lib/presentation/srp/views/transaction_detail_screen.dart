import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:gap/gap.dart';
import 'package:agrobase_ekibbo/components/app_button.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/common_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/date_helper.dart';
import 'package:agrobase_ekibbo/models/srp/srp_schedule_response.dart';
import 'package:agrobase_ekibbo/presentation/srp/bloc/harvest_srp_screen/harvest_srp_cubit.dart';
import 'package:agrobase_ekibbo/presentation/srp/bloc/health_and_safety_screen/health_and_safety_cubit.dart';
import 'package:agrobase_ekibbo/presentation/srp/models/question_section_model.dart';
import 'package:agrobase_ekibbo/presentation/srp/views/fertilizer_application_screen.dart';
import 'package:agrobase_ekibbo/presentation/srp/views/field_visit_screen.dart';
import 'package:agrobase_ekibbo/presentation/srp/views/harvest_srp_screen.dart';
import 'package:agrobase_ekibbo/presentation/srp/views/health_and_safety_srp_screen.dart';
import 'package:agrobase_ekibbo/presentation/srp/views/integrated_pest_management_screen.dart';
import 'package:agrobase_ekibbo/presentation/srp/views/labour_right_screen.dart';
import 'package:agrobase_ekibbo/presentation/srp/views/land_preparation_screen.dart';
import 'package:agrobase_ekibbo/presentation/srp/views/nutrient_managment_screen.dart';
import 'package:agrobase_ekibbo/presentation/srp/views/pesticide_application_screen.dart';
import 'package:agrobase_ekibbo/presentation/srp/views/pre_planting_screen.dart';
import 'package:agrobase_ekibbo/presentation/srp/views/water_irrigation_screen.dart';
import 'package:agrobase_ekibbo/presentation/srp/views/water_management_screen.dart';
import 'package:agrobase_ekibbo/presentation/srp/views/training_survey_screen.dart';
import 'package:agrobase_ekibbo/presentation/srp/views/women_empowerment_screen.dart';
import 'package:agrobase_ekibbo/presentation/srp/widgets/dashed_line_vertical.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';

class TransactionDetailScreen extends StatefulWidget {
  const TransactionDetailScreen({
    super.key,
    required this.srp,
    required this.date,
  });
  final SRPActionModel srp;
  final DateTime date;
  @override
  State<TransactionDetailScreen> createState() =>
      _TransactionDetailScreenState();
}

class _TransactionDetailScreenState extends State<TransactionDetailScreen> {
  final List<SRPActionModel> _actions = [];
  late SrpScheduleModel _srp;
  bool _isLess = true;
  final List<SRPActionModel> _listWaterIrr = [];
  final List<SRPActionModel> _listFertilizers = [];
  final List<SRPActionModel> _listPes = [];

  @override
  void initState() {
    super.initState();
    _srp = widget.srp.srp!;
    _getSrp();
  }

  void _getSrp() async {
    _actions.clear();
    _listWaterIrr.clear();
    _listFertilizers.clear();
    _listPes.clear();
    final res = await ApiProvider.instance.apiSRP.getSRPByFarmer(
          _srp.farmer_id!,
          _srp.cultivation_id!,
          _srp.season_id!,
        );
    if (res?.data != null) {
      for (var e in res!.data!) {
        if (RegExp(r'^[a-zA-Z_]+$').hasMatch(e.name_action!)) {
          _actions.add(e);
        }
        if (e.name_action!.contains('srp_water_irrigation') &&
            DateTime.now().compareTo(e.date_action!) != -1) {
          _listWaterIrr.add(e);
        } else if (e.name_action!.contains('srp_fertilizer_application') &&
            DateTime.now().compareTo(e.date_action!) != -1) {
          _listFertilizers.add(e);
        } else if (e.name_action!.contains('srp_pesticide_application') &&
            DateTime.now().compareTo(e.date_action!) != -1) {
          _listPes.add(e);
        }
      }
    }
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: 'Transaction Detail',
        subTitle: Text(
          DateHelper.convertDateToStr(widget.date, format: 'EEEE, MMM dd yyyy'),
          style: TextStyleConstant.quicksandW400(
            fontSize: 12,
            color: ColorConstant.text79,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Container(
          padding: const EdgeInsets.all(16),
          margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(15),
            color: ColorConstant.grayF7F8FA,
          ),
          child: Column(
            children: [
              Row(
                children: [
                  GInternetImage(
                    url: _srp.farmer?.image ?? '',
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                  ),
                  const Gap(16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _srp.farmer?.fullName ?? '',
                        style: TextStyleConstant.quicksandW600(
                          fontSize: 18,
                        ),
                      ),
                      const Gap(8),
                      Row(
                        children: [
                          SvgPicture.asset('ic_#'.iconSvg),
                          const Gap(4),
                          Text(
                            _srp.farmer?.farmerCode ?? '',
                            style: TextStyleConstant.robotoW400(
                                color: ColorConstant.text79),
                          ),
                        ],
                      ),
                      const Gap(8),
                      Row(
                        children: [
                          SvgPicture.asset('ic_calling'.iconSvg),
                          const Gap(4),
                          Text(
                            _srp.farmer?.phoneNumber ?? '',
                            style: TextStyleConstant.robotoW400(
                                color: ColorConstant.text79),
                          ),
                        ],
                      ),
                    ],
                  )
                ],
              ),
              const Gap(16.0),
              const Divider(color: ColorConstant.greyEBEBEB, thickness: 1.0),
              const Gap(16.0),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Crop',
                          style: TextStyleConstant.robotoW700(
                            color: ColorConstant.text79,
                          ),
                        ),
                        const Gap(8),
                        Text(
                          _srp.cultivation?.cropVariety ?? '',
                          style: TextStyleConstant.robotoW400(
                            fontSize: 12,
                            color: ColorConstant.text79,
                          ),
                        )
                      ],
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Schedule',
                          style: TextStyleConstant.robotoW700(
                            color: ColorConstant.text79,
                          ),
                        ),
                        const Gap(8),
                        Text(
                          widget.srp.getNameAction().toTitleCase(),
                          style: TextStyleConstant.robotoW400(
                            fontSize: 12,
                            color: ColorConstant.text79,
                          ),
                        )
                      ],
                    ),
                  )
                ],
              ),
              const Gap(20),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Harvest Season',
                          style: TextStyleConstant.robotoW700(
                            color: ColorConstant.text79,
                          ),
                        ),
                        const Gap(8),
                        Text(
                          _srp.season ?? '',
                          style: TextStyleConstant.robotoW400(
                            fontSize: 12,
                            color: ColorConstant.text79,
                          ),
                        )
                      ],
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Sowing Date',
                          style: TextStyleConstant.robotoW700(
                            color: ColorConstant.text79,
                          ),
                        ),
                        const Gap(8),
                        Text(
                          _srp.sowing_date ?? '',
                          style: TextStyleConstant.robotoW400(
                            fontSize: 12,
                            color: ColorConstant.text79,
                          ),
                        )
                      ],
                    ),
                  )
                ],
              ),
              const Gap(16.0),
              const Divider(color: ColorConstant.greyEBEBEB, thickness: 1.0),
              const Gap(12.0),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  AppButton(
                    onTap: () {
                      setState(() {
                        _isLess = !_isLess;
                      });
                    },
                    title: _isLess ? 'View more' : 'View less',
                    height: 32,
                    width: 93,
                    radius: 5,
                    titleStyle: TextStyleConstant.quicksandW500(
                      fontSize: 12,
                      color: Colors.white,
                    ),
                  )
                ],
              ),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 250),
                transitionBuilder: (child, animation) =>
                    SizeTransition(sizeFactor: animation, child: child),
                child: _isLess
                    ? const SizedBox.shrink()
                    : Column(
                        children: [
                          const Gap(24),
                          for (var i = 0; i < _actions.length; i++)
                            _buildItemSurvey(
                              _actions[i],
                              i,
                              isLast: i == _actions.length - 1,
                            )
                        ],
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildItemSurvey(
    SRPActionModel value,
    int index, {
    bool isLast = false,
  }) {
    final item = QuestionSectionType.values
        .firstWhere((e) => e.title.toLowerCase() == value.getNameAction());
    return InkWell(
      onTap: () => _handleClick(item, index, value),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 0),
            child: Column(
              children: [
                Container(
                  height: 24,
                  width: 24,
                  decoration: BoxDecoration(
                    color: value.is_finished == 0
                        ? ColorConstant.greyEBEBEB
                        : ColorConstant.primary,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Container(
                      height: 12,
                      width: 12,
                      decoration: BoxDecoration(
                        color: value.is_finished == 0
                            ? ColorConstant.greyEBEBEB
                            : Colors.white,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                ),
                if (!isLast)
                  value.is_finished == 0
                      ? Container(
                          width: 1,
                          height: 45,
                          color: ColorConstant.greyEBEBEB,
                        )
                      : CustomPaint(
                          size: const Size(1, 45),
                          painter: DashedLineVerticalPainter(),
                        )
              ],
            ),
          ),
          const Gap(12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  style: TextStyleConstant.robotoW700(
                    fontSize: 16,
                    color: ColorConstant.text79,
                  ),
                ),
                if (item.title.toLowerCase() == widget.srp.getNameAction() &&
                    value.is_finished == 0)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      'Task to do',
                      style: TextStyleConstant.quicksandW500(
                        fontSize: 14,
                        color: Colors.orange,
                      ),
                    ),
                  ),
                const Gap(8),
                if (value.is_finished == 1)
                  Text(
                    'Completed: ${DateHelper.convertDateToStr(value.date_action!, format: 'MMM dd, yyyy')}',
                    style: TextStyleConstant.robotoW400(
                      fontSize: 12,
                      color: ColorConstant.text79,
                    ),
                  )
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  'Score',
                  style: TextStyleConstant.robotoW600(
                    fontSize: 12,
                    color: ColorConstant.text79,
                  ),
                ),
                Text(
                  '${value.score ?? 0}',
                  style: TextStyleConstant.robotoW400(
                    fontSize: 12,
                    color: ColorConstant.text79,
                  ),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }

  void _handleClick(
    QuestionSectionType item,
    index,
    SRPActionModel value,
  ) {
    if (item.title.toLowerCase() != widget.srp.getNameAction()) {
      return;
    }
    Widget view = Container();
    switch (item) {
      case QuestionSectionType.training:
        view = TrainingSurvenScreen(srp: widget.srp, date: widget.date);
      case QuestionSectionType.prePlating:
        view = PrePlantingScreen(srp: widget.srp, date: widget.date);
      case QuestionSectionType.landPreparation:
        view = LandPreparationScreen(srp: widget.srp, date: widget.date);
      case QuestionSectionType.waterManagement:
        view = WaterManagementScreen(srp: widget.srp, date: widget.date);
      case QuestionSectionType.waterIrrigation:
        view = WaterIrrigationScreen(
          srp: widget.srp,
          date: widget.date,
          listWaterIrr: _listWaterIrr,
        );
      case QuestionSectionType.nutrientManagement:
        view = NutrientManagementScreen(srp: widget.srp, date: widget.date);
      case QuestionSectionType.fertilizerApplication:
        view = FertilizerApplicationScreen(
          srp: widget.srp,
          date: widget.date,
          listDatas: _listFertilizers,
        );
      case QuestionSectionType.integratedPestManagement:
        view =
            IntegratedPestManagmentScreen(srp: widget.srp, date: widget.date);
      case QuestionSectionType.pesticideApplication:
        view = PesticideApplicationScreen(
          srp: widget.srp,
          date: widget.date,
          listDatas: _listPes,
        );
      case QuestionSectionType.labourRights:
        view = LabourRightScreen(srp: widget.srp, date: widget.date);
      case QuestionSectionType.womenEmpowerment:
        view = WomenEmpowermentScreen(srp: widget.srp, date: widget.date);
      case QuestionSectionType.fieldVisit:
        view = FieldVisitScreen(srp: widget.srp, date: widget.date);
      case QuestionSectionType.harvest:
        view = BlocProvider<HarvestSrpCubit>(
          create: (context) => HarvestSrpCubit(ApiProvider.instance.apiSRP),
          child: HarvestSrpScreen(
            srp: widget.srp,
            date: widget.date,
          ),
        );
      case QuestionSectionType.healthSafety:
        view = BlocProvider<HealthAndSafetyCubit>(
          create: (context) =>
              HealthAndSafetyCubit(ApiProvider.instance.apiSRP),
          child: HealthAndSafetySrpScreen(
            srp: widget.srp,
            date: widget.date,
          ),
        );
    }
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => SizedBox(
        height: MediaQuery.sizeOf(context).height * 9 / 10,
        child: view,
      ),
    ).then((value) {
      if (value != null) {
        _getSrp();
      }
    });
  }
}
