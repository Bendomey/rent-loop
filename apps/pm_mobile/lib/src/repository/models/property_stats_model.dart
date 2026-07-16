class PropertyStats {
  const PropertyStats({
    this.unitsTotal = 0,
    this.unitsOccupied = 0,
    this.unitsAvailable = 0,
    this.unitsMaintenance = 0,
    this.unitsDraft = 0,
    this.unitsPartiallyOccupied = 0,
    this.monthlyRevenuePesewas = 0,
    this.activeLeases = 0,
    this.activeBookings = 0,
    this.pendingApplications = 0,
  });

  final int unitsTotal;
  final int unitsOccupied;
  final int unitsAvailable;
  final int unitsMaintenance;
  final int unitsDraft;
  final int unitsPartiallyOccupied;
  final int monthlyRevenuePesewas;
  final int activeLeases;
  final int activeBookings;
  final int pendingApplications;

  /// Percentage of units occupied, 0-100. 0 when there are no units yet,
  /// rather than dividing by zero.
  double get occupancyPercent =>
      unitsTotal == 0 ? 0 : (unitsOccupied / unitsTotal) * 100;
}
