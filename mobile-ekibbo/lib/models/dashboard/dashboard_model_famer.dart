class MDashboardFarmer {
  final int farmerId;
  final double totalHectares;
  final int totalPlots;
  final double estYieldQuantity;
  final double loanAmmount;
  final double repayAmmount;
  //final List<MFarmLands> farmLands;

  MDashboardFarmer({
    required this.farmerId,
    required this.totalHectares,
    required this.totalPlots,
    required this.estYieldQuantity,
    required this.loanAmmount,
    required this.repayAmmount,
    //required this.farmLands,
  });

  factory MDashboardFarmer.fromJson(Map<String, dynamic> json) {
    return MDashboardFarmer(
      farmerId: json['farmer_id'] ?? 0,
      totalHectares: ((json['total_hectares'] ?? 0) as num).toDouble(),
      totalPlots: json['total_plots'] ?? 0,
      estYieldQuantity: ((json['est_yield_quantity'] ?? 0) as num).toDouble(),
      loanAmmount: ((json['loan_ammount'] ?? 0.0) as num).toDouble(),
      repayAmmount: ((json['repay_ammount'] ?? 0.0) as num).toDouble(),
      // farmLands: List<MFarmLands>.from(
      //   ((json['farm_lands'] ?? []) as List<dynamic>).map<MFarmLands>(
      //     (x) => MFarmLands.fromJson(x as Map<String, dynamic>),
      //   ),
      // ),
    );
  }
}
