import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/persistent_header.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';

class HeaderListFarmer extends StatelessWidget {
  const HeaderListFarmer({
    super.key,
    this.isOfficerScoped = false,
    this.officerCount,
    this.totalCount,
  });

  /// True when the dashboard is scoped to the logged-in officer's assigned
  /// farmers — the section then reads "My Farmers (n)" so the list matches
  /// the KPI card (Ekibbo spec: officers see only their allocation).
  final bool isOfficerScoped;

  /// Officer's assigned-farmer count (shown when officer-scoped).
  final int? officerCount;

  /// Tenant-wide registry count — shown on the "View All" action so the
  /// jump from 3 → 1,979 is explicit, not surprising (consistency fix).
  final int? totalCount;

  String _fmt(int n) =>
      n.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');

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

  _buildHeaderListFarmer(BuildContext context) {
    final scopedTitle = isOfficerScoped
        ? (officerCount != null ? 'My Farmers ($officerCount)' : 'My Farmers')
        : (totalCount != null && totalCount! > 0
            ? 'Farmers (${_fmt(totalCount!)})'
            : AppLang.local.farmers);
    final viewAllLabel = isOfficerScoped && totalCount != null && totalCount! > 0
        ? '${AppLang.local.view_all_farmers} (${_fmt(totalCount!)})'
        : AppLang.local.view_all_farmers;
    return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                scopedTitle,
                overflow: TextOverflow.ellipsis,
                style: TextStyleConstant.robotoW600(fontSize: 16),
              ),
            ),
            InkWell(
              onTap: () =>
                  Navigator.of(context).pushNamed(RouterName.farmer_list),
              child: Text(
                viewAllLabel,
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
}
