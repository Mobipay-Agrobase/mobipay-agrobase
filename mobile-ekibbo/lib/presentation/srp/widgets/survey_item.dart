import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:agrobase_ekibbo/components/app_dropdown_button.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/date_form_field.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/radio_button.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/date_helper.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/question_srp/question_srp_model.dart';

class SurveyItem extends StatefulWidget {
  const SurveyItem({
    super.key,
    required this.item,
    required this.hideSave,
    required this.onChangedTextField,
    required this.onDropDownButtonChanged,
    required this.onDateChanged,
    required this.onUploadFile,
    required this.onAdd,
    required this.onChangeRadio,
  });

  final bool hideSave;
  final QuestionSrpModel item;
  final Function(String)? onChangedTextField;
  final Function(int)? onDropDownButtonChanged;
  final Function(DateTime)? onDateChanged;
  final Function()? onUploadFile;
  final Function()? onAdd;
  final Function(String)? onChangeRadio;

  @override
  State<SurveyItem> createState() => _SurveyItemState();
}

class _SurveyItemState extends State<SurveyItem> {
  final textController = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (widget.item.type == QuestionType.text_box.name) {
      textController.text = widget.item.answer?.answer ?? '';
    }
  }

  @override
  void didUpdateWidget(covariant SurveyItem oldWidget) {
    if (widget.item.type == QuestionType.text_box.name) {
      final answer = widget.item.answer?.answer ?? '';
      if (textController.text != answer) {
        textController.text = answer;
      }
    } else {
      if (widget.item.type != oldWidget.item.type) {
        textController.clear();
      }
    }
    super.didUpdateWidget(oldWidget);
  }

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      ignoring: widget.hideSave,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.item.questionTitle ?? '',
            style: TextStyleConstant.robotoW700(
              color: ColorConstant.text79,
            ),
          ),
          if (widget.item.type == QuestionType.text_box.name)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: AppFormField(
                controller: textController,
                onChanged: widget.onChangedTextField,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(5),
                  borderSide: const BorderSide(color: ColorConstant.grayDDDDDD),
                ),
              ),
            ),
          if (widget.item.type == QuestionType.radio.name) _buildRowRadio,
          if (widget.item.type == QuestionType.dropdown.name)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: AppDropdownButton(
                key: UniqueKey(),
                hintText:
                    widget.item.answer?.answer == null ? 'Choose option' : null,
                itemSelected: widget.item.answer?.answer,
                onChanged: widget.onDropDownButtonChanged,
                items:
                    (widget.item.options ?? []).map((e) => e.title!).toList(),
              ),
            ),
          if (widget.item.type == QuestionType.date_picker.name ||
              widget.item.type == QuestionType.time_picker.name)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: DateFormField(
                initialTime: widget.item.type == QuestionType.time_picker.name
                    ? widget.item.answer?.answer
                    : null,
                isTimePicker: widget.item.type == QuestionType.time_picker.name,
                initialDate: (widget.item.type ==
                            QuestionType.date_picker.name &&
                        widget.item.answer?.answer != null)
                    ? DateHelper.convertStrToDate(widget.item.answer!.answer!)
                    : DateTime.now(),
                onChanged: widget.onDateChanged,
              ),
            ),
          if (widget.item.type == QuestionType.upload.name) _buildUploadFile,
          if (widget.item.type == QuestionType.auto_fill.name)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Container(
                height: 52,
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border.all(color: ColorConstant.grayDDDDDD),
                  borderRadius: BorderRadius.circular(5),
                  color: ColorConstant.greyEBEBEB,
                ),
                child: Text(
                  widget.item.answer?.answer ?? '',
                  style: TextStyleConstant.worksansW500(
                    color: ColorConstant.heading,
                  ),
                ),
              ),
            ),
          if (widget.item.isMultiple == true)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: InkWell(
                onTap: widget.onAdd,
                child: Row(
                  children: [
                    const Icon(Icons.add, color: ColorConstant.primary),
                    const SizedBox(width: 8),
                    Text(
                      'Add',
                      style: TextStyleConstant.quicksandW600(
                        fontSize: 16,
                        color: ColorConstant.primary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget get _buildRowRadio {
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Row(
        children: [
          Expanded(
            child: InkWell(
              onTap: () => _onRadioButtonTap('yes'),
              child: Row(
                children: [
                  RadioButton<String?>(
                    groupValue: widget.item.answer?.answer,
                    value: 'yes',
                    onChanged: (v) => _onRadioButtonTap('yes'),
                  ),
                  const SizedBox(
                    width: 8,
                  ),
                  Text(
                    'Yes',
                    style: TextStyleConstant.robotoW400(
                      color: ColorConstant.text79,
                    ),
                  )
                ],
              ),
            ),
          ),
          Expanded(
            child: InkWell(
              onTap: () => _onRadioButtonTap('no'),
              child: Row(
                children: [
                  RadioButton<String?>(
                    groupValue: widget.item.answer?.answer,
                    value: 'no',
                    onChanged: (v) => _onRadioButtonTap('no'),
                  ),
                  const SizedBox(
                    width: 8,
                  ),
                  Text(
                    'No',
                    style: TextStyleConstant.robotoW400(
                      color: ColorConstant.text79,
                    ),
                  )
                ],
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget get _buildUploadFile {
    return InkWell(
      onTap: widget.onUploadFile,
      child: Container(
        margin: const EdgeInsets.only(top: 8),
        height: 94,
        width: 160,
        clipBehavior: Clip.hardEdge,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          color: ColorConstant.grayF6F7F9,
        ),
        child: widget.item.answer?.answer != null
            ? GInternetImage(
                url: widget.item.answer?.answer,
              )
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SvgPicture.asset('ic_bold_camera'.iconSvg),
                  const SizedBox(height: 4),
                  Text(
                    AppLang.local.crop_photos,
                    style: TextStyleConstant.quicksandW600(
                      color: ColorConstant.text79,
                    ),
                  )
                ],
              ),
      ),
    );
  }

  void _onRadioButtonTap(String value) {
    if (widget.item.answer?.answer != value) {
      widget.onChangeRadio?.call(value);
    }
  }
}
