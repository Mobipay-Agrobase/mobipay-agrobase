import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/models/question_srp/question_srp_model.dart';
import 'package:agrobase_ekibbo/models/srp/srp_schedule_response.dart';
import 'package:agrobase_ekibbo/presentation/srp/bloc/harvest_srp_screen/harvest_srp_cubit.dart';
import 'package:agrobase_ekibbo/presentation/srp/models/question_section_model.dart';
import 'package:agrobase_ekibbo/presentation/srp/widgets/survey_view.dart';

class HarvestSrpScreen extends StatefulWidget {
  const HarvestSrpScreen({super.key, required this.srp, required this.date});

  final SRPActionModel srp;
  final DateTime date;

  @override
  State<HarvestSrpScreen> createState() => _HarvestSrpScreenState();
}

class _HarvestSrpScreenState extends State<HarvestSrpScreen> {
  @override
  void initState() {
    super.initState();
    final harvestCubit = BlocProvider.of<HarvestSrpCubit>(context);
    if (widget.srp.is_finished == 1) {
      harvestCubit.getRemoteQuestions(
        widget.srp.date_action!,
        widget.srp.srp_id!,
      );
    } else {
      harvestCubit.getLocalQuestions();
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<HarvestSrpCubit, List<QuestionSrpModel>>(
      builder: (context, questions) {
        final harvestBloc = BlocProvider.of<HarvestSrpCubit>(context);
        return SurveyView(
          title: QuestionSectionType.harvest.title,
          questions: questions,
          onAdd: harvestBloc.onAddAnswer,
          onChangedDropdown: harvestBloc.onDropdownChanged,
          onChangedDate: harvestBloc.onChangedDateTime,
          onChangeRadio: harvestBloc.onChangedRadio,
          onChangedFile: harvestBloc.onChangedFile,
          onChangedTextField: harvestBloc.onChangedTextField,
          onSave: () => onSave(harvestBloc),
          hideSave: widget.srp.is_finished == 1,
        );
      },
    );
  }

  void onSave(HarvestSrpCubit harvestBloc) {
    harvestBloc.submitHarvestForm(widget.srp, widget.date).then((_) {
      Navigator.of(context).pop(true);
      DialogHelper.showToast(
        context,
        'SRP ${QuestionSectionType.harvest.title} Created Successfully',
      );
    }).catchError((error) => DialogHelper.showToast(
          context,
          'SRP ${QuestionSectionType.harvest.title} Created Failed: $error',
        ));
  }
}
