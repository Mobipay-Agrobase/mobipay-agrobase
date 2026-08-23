import 'package:maps_toolkit/maps_toolkit.dart';

class MapToolKitHelper {
  static double getArea(List<List<double>> points) {
    List<LatLng> pointsMap = [];
    points.forEach((e) {
      pointsMap.add(LatLng(e.first, e.last));
    });
    return SphericalUtil.computeArea(pointsMap).toDouble();
  }
}
