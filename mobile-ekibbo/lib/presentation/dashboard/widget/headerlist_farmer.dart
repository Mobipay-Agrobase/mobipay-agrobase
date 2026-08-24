import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/persistent_header.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';

class HeaderListFarmer extends StatelessWidget {
  const HeaderListFarmer({super.key, this.isOfficerScoped = false});

  /// True when the dashboard is scoped to the logged-in officer's assigned
  /// farmers — the section then reads "My Farmers" so the list matches the
  /// KPI card (Ekibbo spec: officers see only their allocation).
  final bool isOfficerScoped;

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
              isOfficerScoped ? 'My Farmers' : AppLang.local.farmers,
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
