import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/domain/roles/role_config.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';

/// ─────────────────────────────────────────────────────────────────────────
/// Ekibbo quick-action FAB menu (role-aware)
///
/// Field Officer (staff): register farmer, add plot (polygon capture),
///   record purchase (procurement), distribute inputs, add crop, add crop
///   harvest, sale intention, carbon footprint.
/// Farmer: raise a farmer query.
///
/// Aqua-specific actions (ponds, species, feeding, mortalities, water
/// quality, check fishing, stock) are excluded from the Ekibbo deployment.
/// ─────────────────────────────────────────────────────────────────────────
final List<MActionButton> floatingConfigs = [
  // ── Field Officer daily workflow (order matches the Ekibbo web quick actions) ──
  MActionButton(
    routeName: RouterName.farmer_registration,
    icon: "ic_farmer",
    title: "Register Farmer",
    roleAccessed: [EnumUserRole.staff],
  ),
  MActionButton(
    routeName: RouterName.farmer_list,
    icon: "ic_profile",
    title: "Farmer Registry",
    roleAccessed: [EnumUserRole.staff],
  ),
  MActionButton(
    routeName: RouterName.add_plot,
    icon: "ic_land_plot",
    title: AppLang.local.add_plot,
    roleAccessed: [EnumUserRole.staff],
  ),
  MActionButton(
    routeName: RouterName.procurement,
    icon: "ic_procurement",
    title: "Add Purchase",
    roleAccessed: [EnumUserRole.staff],
  ),
  MActionButton(
    routeName: RouterName.add_distribution,
    icon: "ic_distribution",
    title: AppLang.local.input_distribution,
    roleAccessed: [EnumUserRole.staff],
  ),
  MActionButton(
    routeName: RouterName.add_crop,
    icon: "ic_agriculture",
    title: AppLang.local.add_crop,
    roleAccessed: [EnumUserRole.staff],
  ),
  MActionButton(
    routeName: RouterName.crop_harvest,
    icon: "ic_crop_harvest",
    title: "Add Crop Harvest",
    roleAccessed: [EnumUserRole.staff],
  ),
  MActionButton(
    routeName: RouterName.add_sale_intention,
    icon: "ic_dollar",
    title: AppLang.local.add_sale_intention,
    roleAccessed: [EnumUserRole.staff],
  ),
  MActionButton(
    routeName: RouterName.add_carbon_footprint,
    icon: "ic_carbon_agri",
    title: "Add Carbon Footprint",
    roleAccessed: [EnumUserRole.staff],
  ),

  // ── Farmer self-service ──
  MActionButton(
    routeName: RouterName.add_farmer_queries,
    icon: "ic_queries",
    title: "Add Farmer Queries",
    roleAccessed: [EnumUserRole.farmer],
  ),
];

class MActionButton {
  final String routeName;
  final String icon;
  final String title;
  final List<EnumUserRole> roleAccessed;
  MActionButton({
    required this.routeName,
    required this.icon,
    required this.title,
    required this.roleAccessed,
  });
}
