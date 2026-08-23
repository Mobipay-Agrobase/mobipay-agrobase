import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/domain/roles/role_config.dart';

/// ─────────────────────────────────────────────────────────────────────────
/// Ekibbo side-drawer configuration (role-aware)
///
/// Field Officer (staff): profile, purchases (procurement), input
///   distributions, sale intentions, farmer queries, news & advisory,
///   settings.
/// Farmer: profile, farmer queries, news & advisory, settings.
///
/// Aqua-specific menus (feeding, mortalities, water quality, check fishing,
/// stock creation/transfer) are intentionally excluded from the Ekibbo
/// deployment.
/// ─────────────────────────────────────────────────────────────────────────
final List<MDDrawerMenu> drawerConfigs = [
  MDDrawerMenu(
    type: DrawerMenuType.profile,
    icon: 'ic_profile',
    title: AppLang.local.profile,
    roleAccessed: [EnumUserRole.staff, EnumUserRole.farmer],
  ),
  MDDrawerMenu(
    type: DrawerMenuType.procurement,
    icon: 'ic_procurement',
    title: 'Purchases',
    roleAccessed: [EnumUserRole.staff],
  ),
  MDDrawerMenu(
    type: DrawerMenuType.distribution,
    icon: 'ic_distribution',
    title: 'Input Distributions',
    roleAccessed: [EnumUserRole.staff],
  ),
  MDDrawerMenu(
    type: DrawerMenuType.saleIntention,
    icon: 'ic_dollar',
    title: 'Sale Intentions',
    roleAccessed: [EnumUserRole.staff],
  ),
  MDDrawerMenu(
    type: DrawerMenuType.farmerQueries,
    icon: 'ic_queries',
    title: "Farmer Queries",
    roleAccessed: [EnumUserRole.staff, EnumUserRole.farmer],
  ),
  MDDrawerMenu(
    type: DrawerMenuType.newsAdvisory,
    icon: 'ic_news',
    title: "News & Advisory",
    roleAccessed: [EnumUserRole.staff, EnumUserRole.farmer],
  ),
  MDDrawerMenu(
    type: DrawerMenuType.settings,
    icon: 'ic_setting',
    title: AppLang.local.settings,
    roleAccessed: [EnumUserRole.staff, EnumUserRole.farmer],
  ),
];

enum DrawerMenuType {
  profile,
  saleIntention,
  distribution,
  vendorProcurement,
  procurement,
  cropHarvest,
  appLang,
  settings,
  version,
  farmerQueries,
  newsAdvisory,
  blog,
  feeding,
  mortalities,
  waterQuality,
  checkFishing,
  stockCreation,
  stockTransfer
}

class MDDrawerMenu {
  final DrawerMenuType type;
  final String icon;
  final String title;
  final List<EnumUserRole> roleAccessed;
  MDDrawerMenu({
    required this.type,
    required this.icon,
    required this.title,
    required this.roleAccessed,
  });
}
