import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:http_parser/http_parser.dart';
import 'package:mime/mime.dart';
import 'package:agrobase_ekibbo/components/app_button.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/common_helper.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/question_srp/question_srp_model.dart';
import 'package:agrobase_ekibbo/presentation/srp/widgets/survey_item.dart';

class SurveyView extends StatelessWidget {
  const SurveyView({
    super.key,
    this.questions = const [],
    required this.title,
    this.onChangeRadio,
    this.onChangedDropdown,
    this.onChangedDate,
    this.onAdd,
    this.onChangedTextField,
    this.onSave,
    this.onChangedFile,
    this.hideSave = false,
    this.optionWidget,
  });

  final List<QuestionSrpModel> questions;
  final String title;
  final Function(String, int)? onChangeRadio;
  final Function(String, int)? onChangedDropdown;
  final Function(int)? onAdd;
  final Function(DateTime, int)? onChangedDate;
  final Function(String, int)? onChangedTextField;
  final Function()? onSave;
  final Function(String, int)? onChangedFile;
  final bool hideSave;
  final Widget? optionWidget;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusManager.instance.primaryFocus?.unfocus(),
      child: Scaffold(
        body: Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(5),
              topRight: Radius.circular(5),
            ),
          ),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      title,
                      style: TextStyleConstant.quicksandW600(
                        fontSize: 16,
                      ),
                    ),
                    InkWell(
                      onTap: () => Navigator.of(context).pop(),
                      child: SvgPicture.asset(
                        'ic_close'.iconSvg,
                        color: ColorConstant.text79,
                        width: 24,
                        height: 24,
                      ),
                    )
                  ],
                ),
              ),
              Container(
                height: 1,
                color: ColorConstant.greyEBEBEB,
              ),
              if (optionWidget != null) optionWidget!,
              Expanded(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: questions.length,
                  padding: const EdgeInsets.only(bottom: 16),
                  itemBuilder: (_, index) {
                    final item = questions[index];
                    return Padding(
                      padding: const EdgeInsets.only(
                        top: 24,
                        left: 16,
                        right: 16,
                      ),
                      child: SurveyItem(
                        item: item,
                        hideSave: hideSave,
                        onChangedTextField: (v) =>
                            onChangedTextField?.call(v, index),
                        onDropDownButtonChanged: (v) =>
                            _onDropDownButtonChanged(item, v, index),
                        onDateChanged: (v) => _onDateChanged(v, index),
                        onUploadFile: () => _onUploadFile(index),
                        onAdd: () => onAdd?.call(index),
                        onChangeRadio: (v) => _onRadioButtonTap(v, index),
                      ),
                    );
                  },
                ),
              ),
              if (!hideSave)
                Padding(
                  padding:
                      const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
                  child: AppButton(
                    onTap: questions.isValid() ? onSave : null,
                    title: AppLang.local.save,
                    height: 46,
                    color:
                        questions.isValid() ? null : ColorConstant.greyEBEBEB,
                  ),
                )
            ],
          ),
        ),
      ),
    );
  }

  void _onUploadFile(int index) async {
    final img = await CommonHelper.chooseImg();
    if (img != null) {
      var form = FormData.fromMap({});

      form.files.addAll([
        MapEntry(
          'photo',
          MultipartFile.fromFileSync(
            img.path,
            contentType: MediaType.parse(lookupMimeType(img.path) ?? ''),
          ),
        ),
      ]);
      final res = await ApiProvider.instance.apiSRP.uploadImage(form);
      if (res?.data?.url != null) {
        onChangedFile?.call(res!.data!.url!, index);
      }
    }
  }

  void _onRadioButtonTap(String value, int index) {
    FocusManager.instance.primaryFocus?.unfocus();
    onChangeRadio?.call(value, index);
  }

  void _onDropDownButtonChanged(
    QuestionSrpModel question,
    int value,
    int index,
  ) {
    FocusManager.instance.primaryFocus?.unfocus();
    onChangedDropdown?.call(question.options![value].title!, index);
  }

  void _onDateChanged(DateTime value, int index) {
    FocusManager.instance.primaryFocus?.unfocus();
    onChangedDate?.call(value, index);
  }
}
