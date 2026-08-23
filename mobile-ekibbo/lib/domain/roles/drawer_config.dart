import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/domain/roles/role_config.dart';

/// ─────────────────────────────────────────────────────────────────────────
/// Ekibbo side-drawer — mirrors the EKIBBO WEB platform sidebar for the
/// Field Officer role (same order, same labels):
///   Farmer Profiling · Farm Land Registry · Cultivations · Training &
///   Groups · Farm Visits · Purchases · Input Distribution · Carbon &
///   Compliance · Reports · Farmer Queries · News & Advisory · Settings
///
/// Farmer role mirrors the farmer-facing web menu.
/// ─────────────────────────────────────────────────────────────────────────
final List<MDDrawerMenu> drawerConfigs = [
  MDDrawerMenu(
    type: DrawerMenuType.profile,
    icon: 'ic_profile',
    title: AppLang.local.profile,
    roleAccessed: [EnumUserRole.staff, EnumUserRole.farmer],
  ),
  MDDrawerMenu(
    type: DrawerMenuType.farmerList,
    icon: 'ic_farmer',
    title: 'Farmer Profiling',
    roleAccessed: [EnumUserRole.staff],
  ),
  MDDrawerMenu(
    type: DrawerMenuType.listPlot,
    icon: 'ic_land_plot',
    title: 'Farm Land Registry',
    roleAccessed: [EnumUserRole.staff, EnumUserRole.farmer],
  ),
  MDDrawerMenu(
    type: DrawerMenuType.crops,
    icon: 'ic_agriculture',
    title: 'Cultivations',
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
    title: 'Input Distribution',
    roleAccessed: [EnumUserRole.staff],
  ),
  MDDrawerMenu(
    type: DrawerMenuType.carbon,
    icon: 'ic_carbon_agri',
    title: 'Carbon & Compliance',
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
    title: 'Farmer Queries',
    roleAccessed: [EnumUserRole.farmer],
  ),
  MDDrawerMenu(
    type: DrawerMenuType.newsAdvisory,
    icon: 'ic_news',
    title: 'News & Advisory',
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
  farmerList,
  listPlot,
  crops,
  saleIntention,
  distribution,
  vendorProcurement,
  procurement,
  cropHarvest,
  carbon,
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
