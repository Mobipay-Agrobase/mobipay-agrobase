class OptionData {
  final String title;
  final double value;
  final List<double>? subValues;

  OptionData({
    required this.title,
    required this.value,
    this.subValues,
  });
}
