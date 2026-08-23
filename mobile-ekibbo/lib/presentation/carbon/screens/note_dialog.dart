import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';

class NoteDialog extends StatelessWidget {
  const NoteDialog({
    super.key,
    required this.title,
    required this.description,
  });
  final String title;
  final String description;
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Center(
        child: Container(
          height: MediaQuery.of(context).size.height / 3,
          margin: const EdgeInsets.symmetric(horizontal: 16),
          padding: const EdgeInsets.only(
            left: 16,
            right: 16,
            bottom: 20,
            top: 27,
          ),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(5),
          ),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: TextStyleConstant.quicksandW600(fontSize: 16),
                      ),
                    ),
                    InkWell(
                      onTap: Navigator.of(context).pop,
                      child: SvgPicture.asset(
                        'ic_close2'.iconSvg,
                        color: ColorConstant.text79,
                      ),
                    )
                  ],
                ),
                const SizedBox(
                  height: 24,
                ),
                Text(
                  description,
                  maxLines: null,
                  style: TextStyleConstant.robotoW400(
                    color: ColorConstant.text79,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
