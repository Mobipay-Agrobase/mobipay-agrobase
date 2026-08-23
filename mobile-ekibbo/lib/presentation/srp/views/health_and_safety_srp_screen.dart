import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/models/question_srp/question_srp_model.dart';
import 'package:agrobase_ekibbo/models/srp/srp_schedule_response.dart';
import 'package:agrobase_ekibbo/presentation/srp/bloc/health_and_safety_screen/health_and_safety_cubit.dart';
import 'package:agrobase_ekibbo/presentation/srp/models/question_section_model.dart';
import 'package:agrobase_ekibbo/presentation/srp/widgets/survey_view.dart';

class HealthAndSafetySrpScreen extends StatefulWidget {
  const HealthAndSafetySrpScreen({
    super.key,
    required this.srp,
    required this.date,
  });

  final SRPActionModel srp;
  final DateTime date;

  @override
  State<HealthAndSafetySrpScreen> createState() =>
      _HealthAndSafetySrpScreenState();
}

class _HealthAndSafetySrpScreenState extends State<HealthAndSafetySrpScreen> {
  @override
  void initState() {
    super.initState();
    final healthSafetyCubit = BlocProvider.of<HealthAndSafetyCubit>(context);
    if (widget.srp.is_finished == 1) {
      healthSafetyCubit.getRemoteQuestions(
        widget.srp.date_action!,
        widget.srp.srp_id!,
      );
    } else {
      healthSafetyCubit.getLocalQuestions();
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<HealthAndSafetyCubit, List<QuestionSrpModel>>(
      builder: (context, questions) {
        final healthSafetyCubit =
            BlocProvider.of<HealthAndSafetyCubit>(context);
        return SurveyView(
          title: QuestionSectionType.healthSafety.title,
          questions: questions,
          onChangedDropdown: healthSafetyCubit.onDropdownChanged,
          onChangeRadio: healthSafetyCubit.onChangedRadio,
          onSave: () => onSave(healthSafetyCubit),
          hideSave: widget.srp.is_finished == 1,
        );
      },
    );
  }

  void onSave(HealthAndSafetyCubit healthSafetyCubit) {
    healthSafetyCubit.submitForm(widget.srp, widget.date).then((_) {
      Navigator.of(context).pop(true);
      DialogHelper.showToast(
        context,
        'SRP ${QuestionSectionType.healthSafety.title} Created Successfully',
      );
    }).catchError((error) => DialogHelper.showToast(
          context,
          'SRP ${QuestionSectionType.healthSafety.title} Created Failed: $error',
        ));
  }
}
