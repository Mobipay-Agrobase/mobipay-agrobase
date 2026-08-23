import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/domain/roles/role_config.dart';

/// ─────────────────────────────────────────────────────────────────────────
/// Ekibbo side-drawer — EXACTLY the Ekibbo team's Field Officer menu:
///   Farmer Registry · Purchases · Inputs · Trainings · Loans ·
///   Farmer Visits · Surveys · News & Advisory · Settings · Profile
///
/// Removed per feedback: Carbon & Compliance, Sale Intentions, Crop
/// Harvest, Cultivations (covered by Add Crop), Farm Land Registry
/// (covered by Add Plot), duplicate entries.
/// Farmer role: Dashboard, Farmer Queries, News & Advisory, Settings.
/// ─────────────────────────────────────────────────────────────────────────
final List<MDDrawerMenu> drawerConfigs = [
  MDDrawerMenu(
    type: DrawerMenuType.farmerList,
    icon: 'ic_farmer',
    title: 'Farmer Registry',
    roleAccessed: [EnumUserRole.staff],
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
    title: 'Inputs',
    roleAccessed: [EnumUserRole.staff],
  ),
  MDDrawerMenu(
    type: DrawerMenuType.loans,
    icon: 'ic_dollar',
    title: 'Loans',
    roleAccessed: [EnumUserRole.staff],
  ),
  MDDrawerMenu(
    type: DrawerMenuType.training,
    icon: 'ic_agriculture',
    title: 'Trainings',
    roleAccessed: [EnumUserRole.staff],
  ),
  MDDrawerMenu(
    type: DrawerMenuType.farmerVisits,
    icon: 'ic_queries',
    title: 'Farmer Visits',
    roleAccessed: [EnumUserRole.staff],
  ),
  MDDrawerMenu(
    type: DrawerMenuType.surveys,
    icon: 'ic_blog',
    title: 'Surveys',
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
  MDDrawerMenu(
    type: DrawerMenuType.profile,
    icon: 'ic_profile',
    title: AppLang.local.profile,
    roleAccessed: [EnumUserRole.staff, EnumUserRole.farmer],
  ),
];

enum DrawerMenuType {
  loans,
  profile,
  farmerList,
  training,
  farmerVisits,
  surveys,
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
  listPlot,
  crops,
  carbon,
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
