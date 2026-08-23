import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';

class ItemComment extends StatelessWidget {
  const ItemComment({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 80,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const GInternetImage(
                url: '',
                width: 40,
                height: 40,
                borderRadius: 20,
              ),
              const SizedBox(width: 20),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Le Van Do",
                    style: TextStyleConstant.quicksandW600(
                      fontSize: 16,
                    ),
                  ),
                  Text(
                    "March 31, 2024 - 12:03 pm",
                    style: TextStyleConstant.quicksandW400(
                        fontSize: 12, color: ColorConstant.gray6C757D),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 5),
          Expanded(
            child: Text(
              "Working as intention now?",
              style: TextStyleConstant.quicksandW400(
                fontSize: 14,
              ),
            ),
          ),
          const Divider(),
        ],
      ),
    );
  }
}

class ItemCommentAdmin extends StatelessWidget {
  const ItemCommentAdmin({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Container(
        height: 80,
        decoration: BoxDecoration(
          color: ColorConstant.grayF7F8FA,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Padding(
          padding: const EdgeInsets.all(10.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    "Le Van Do",
                    style: TextStyleConstant.quicksandW600(
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    "March 31, 2024 - 12:03 pm",
                    style: TextStyleConstant.quicksandW400(
                        fontSize: 12, color: ColorConstant.gray6C757D),
                  ),
                ],
              ),
              const SizedBox(height: 5),
              Expanded(
                child: Text(
                  "Working as intention now?",
                  style: TextStyleConstant.quicksandW400(
                    fontSize: 14,
                  ),
                ),
              ),
              const SizedBox(height: 5),
            ],
          ),
        ),
      ),
    );
  }
}
