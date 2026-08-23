import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/presentation/farmer_news/news_detail.dart';

class ItemNews extends StatelessWidget {
  const ItemNews({super.key});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => const ScreenNewDetail(),
          ),
        );
      },
      child: Row(
        children: [
          const GInternetImage(
            url:
                'https://img.freepik.com/free-photo/painting-mountain-lake-with-mountain-background_188544-9126.jpg',
            height: 60,
            borderRadius: 5,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "This is the litle of the news",
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                  style: TextStyleConstant.quicksandW600(
                    fontSize: 16,
                  ),
                ),
                Text(
                  "March 31, 2024 - 12:03 pm",
                  textAlign: TextAlign.justify,
                  style: TextStyleConstant.quicksandW400(
                      fontSize: 12, color: ColorConstant.gray6C757D),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
