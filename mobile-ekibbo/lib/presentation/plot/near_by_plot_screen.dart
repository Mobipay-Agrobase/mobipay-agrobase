import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/models/farm_land/farm_land_model.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';

class NearByPlotScreen extends StatefulWidget {
  const NearByPlotScreen({super.key});

  @override
  State<NearByPlotScreen> createState() => _NearByPlotScreenState();
}

class _NearByPlotScreenState extends State<NearByPlotScreen> {
  Set<Marker> _markers = {};
  final CameraPosition _initialCameraPosition = CameraPosition(
    target: LatLng(
      DataConstant.lat == 0 ? 10.773091745637778 : DataConstant.lat,
      DataConstant.lng == 0 ? 106.72806366508178 : DataConstant.lng,
    ),
    zoom: 6,
  );
  List<FarmLandModel> _farmlands = [];

  @override
  void initState() {
    super.initState();
    _getFarmLands();
  }

  _getFarmLands() async {
    DialogHelper.showLoading();
    final res = await ApiProvider.instance.apiFarmland.getNearByPlot();
    DialogHelper.hideLoading();
    if (res?.data != null) {
      _farmlands = res?.data?.farmLandData ?? [];
      _drawMap();
    }
  }

  _drawMap() {
    _markers = {};
    for (var e in _farmlands) {
      _markers.add(Marker(
        draggable: false,
        markerId: MarkerId(e.id.toString()),
        position: LatLng(double.tryParse(e.lat ?? '') ?? 0,
            double.tryParse(e.lng ?? '') ?? 0),
        infoWindow: InfoWindow(
            title: e.farmName,
            snippet: e.farmerDetails?.farmerCode ?? '',
            onTap: () {
              Navigator.of(context)
                  .pushNamed(RouterName.farmer_detail, arguments: e.farmerId);
            }),
        icon: BitmapDescriptor.defaultMarkerWithHue(5),
      ));
    }
    print(_markers);
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: 'Near By Plots',
      ),
      body: GoogleMap(
        initialCameraPosition: _initialCameraPosition,
        mapType: MapType.hybrid,
        markers: _markers,
        zoomControlsEnabled: true,
        myLocationButtonEnabled: true,
        myLocationEnabled: true,
        // onTap: (v) {
        //   if (_markers.isNotEmpty) {
        //     _markers.clear();
        //   }

        //   _onTapMap(v);
        // },
      ),
    );
  }
}
