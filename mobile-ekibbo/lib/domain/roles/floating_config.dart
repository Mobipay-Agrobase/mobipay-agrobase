import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/domain/roles/role_config.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';

/// ─────────────────────────────────────────────────────────────────────────
/// Ekibbo FAB quick actions — EXACTLY the Ekibbo team's Field Officer list:
///   1. Add Farmer   (register farmer + 7-level location, web datapoints)
///   2. Add Plot     (farm land + polygon capture)
///   3. Add Crop     (cultivation on a plot)
///   4. Purchase     (record produce purchase)
///   5. Training     (record training)
///   6. Inputs       (input distribution)
///   7. Loan         (loans management)
///   8. Farmer Visit (farm visit)
///   9. Survey       (impact assessment surveys / internal inspections)
///
/// Removed per feedback: Farmer Registry (duplicate of Add Farmer list),
/// Crop Harvest, Sale Intention, Carbon Footprint.
/// ─────────────────────────────────────────────────────────────────────────
final List<MActionButton> floatingConfigs = [
  MActionButton(
    routeName: RouterName.farmer_registration,
    icon: "ic_farmer",
    title: "Add Farmer",
    roleAccessed: [EnumUserRole.staff],
  ),
  MActionButton(
    routeName: RouterName.add_plot,
    icon: "ic_land_plot",
    title: "Add Plot",
    roleAccessed: [EnumUserRole.staff],
  ),
  MActionButton(
    routeName: RouterName.add_crop,
    icon: "ic_agriculture",
    title: "Add Crop",
    roleAccessed: [EnumUserRole.staff],
  ),
  MActionButton(
    routeName: RouterName.procurement,
    icon: "ic_procurement",
    title: "Purchase",
    roleAccessed: [EnumUserRole.staff],
  ),
  MActionButton(
    routeName: RouterName.distribution,
    icon: "ic_distribution",
    title: "Inputs",
    roleAccessed: [EnumUserRole.staff],
  ),
  MActionButton(
    routeName: RouterName.farmer_queries,
    icon: "ic_queries",
    title: "Farmer Visit",
    roleAccessed: [EnumUserRole.staff],
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
