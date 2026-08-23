import '_extension_string.dart';

extension NumberParsing on num {
  String format() {
    return toStringAsFixed(truncateToDouble() == this ? 0 : 2);
  }

  String formatPrice() {
    final a = toStringAsFixed(1).split('.');
    if (a[0].length <= 3) {
      return a.join(".");
    }
    final b = a[0].subText().join(",");
    if (a.length == 1) return b;
    return "$b.${a[1]}";
  }
}
