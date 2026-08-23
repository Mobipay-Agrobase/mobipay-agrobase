import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/persistent_header.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';

class HeaderListFarmer extends StatelessWidget {
  const HeaderListFarmer({super.key});

  @override
  Widget build(BuildContext context) {
    return SliverPersistentHeader(
      pinned: true,
      floating: true,
      delegate: PersistentHeader(
        height: 52,
        widget: _buildHeaderListFarmer(context),
      ),
    );
  }

  _buildHeaderListFarmer(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              //Todo: lang
              AppLang.local.farmers,
              style: TextStyleConstant.robotoW600(fontSize: 16),
            ),
            InkWell(
              onTap: () =>
                  Navigator.of(context).pushNamed(RouterName.farmer_list),
              child: Text(
                AppLang.local.view_all_farmers,
                style: TextStyleConstant.robotoW400(
                  fontSize: 12,
                  color: ColorConstant.primary,
                ),
              ),
            )
          ],
        ),
      );
}
