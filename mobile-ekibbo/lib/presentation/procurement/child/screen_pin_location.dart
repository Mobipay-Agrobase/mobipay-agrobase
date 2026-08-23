import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';

// ignore: must_be_immutable
class ScreenPinLocation extends StatefulWidget {
  ScreenPinLocation({
    super.key,
    this.point,
  });
  LatLng? point;
  @override
  State<ScreenPinLocation> createState() => _ScreenPinLocationState();
}

class _ScreenPinLocationState extends State<ScreenPinLocation> {
  CameraPosition _initialCameraPosition = CameraPosition(
    target: LatLng(
      DataConstant.lat == 0 ? 10.773091745637778 : DataConstant.lat,
      DataConstant.lng == 0 ? 106.72806366508178 : DataConstant.lng,
    ),
    zoom: 18,
  );
  Map<PolygonId, Polygon> mapsPolygons = <PolygonId, Polygon>{};
  final Set<Marker> _markers = {};
  @override
  void initState() {
    super.initState();
    if (widget.point == null) return;
    _initialCameraPosition = CameraPosition(
      target: LatLng(
        widget.point!.latitude,
        widget.point!.longitude,
      ),
      zoom: 18,
    );
    setMarker();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(title: AppLang.local.pin_location, actions: [
        InkWell(
          onTap: () {
            if (widget.point == null) return;
            Navigator.of(context).pop(widget.point);
          },
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              AppLang.local.save,
              style: TextStyleConstant.quicksandW600(
                fontSize: 16,
                color: widget.point == null
                    ? ColorConstant.text79
                    : ColorConstant.primary,
              ),
            ),
          ),
        ),
      ]),
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: _initialCameraPosition,
            polygons: Set<Polygon>.of(mapsPolygons.values),
            onTap: tapMap,
            mapType: MapType.hybrid,
            markers: _markers,
            myLocationEnabled: true,
            onMapCreated: (GoogleMapController controller) {},
          ),
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                _SlideUpPanel(
                  point: widget.point,
                ),
              ],
            ),
          )
        ],
      ),
    );
  }

  void tapMap(LatLng pos) {
    widget.point = pos;
    setMarker();
  }

  setMarker() {
    _markers.clear();
    _markers.add(
      Marker(
        draggable: true,
        markerId: MarkerId(widget.point.toString()),
        position: widget.point!,
        icon: BitmapDescriptor.defaultMarker,
        onDragEnd: (LatLng latLng) {
          //print(latLng);
          //print(latLng.toString());
        },
      ),
    );
    setState(() {});
  }
}

class _SlideUpPanel extends StatefulWidget {
  const _SlideUpPanel({
    required this.point,
  });
  final LatLng? point;

  @override
  State<_SlideUpPanel> createState() => _SlideUpPanelState();
}

class _SlideUpPanelState extends State<_SlideUpPanel> {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.only(
        top: 4,
        right: 16,
        left: 16,
        bottom: 16,
      ),
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (widget.point != null) _buildLatLngText(widget.point!),
          const SizedBox(
            height: 24,
          ),
        ],
      ),
    );
  }

  Padding _buildLatLngText(
    LatLng latlng,
  ) {
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: RichText(
        text: TextSpan(
          children: [
            TextSpan(
              text: '${AppLang.local.pin_location}: ',
              style: TextStyleConstant.robotoW700(
                fontSize: 12,
                color: ColorConstant.text79,
              ),
            ),
            TextSpan(
              text:
                  '(${AppLang.local.latitude}) ${latlng.latitude} | (${AppLang.local.longtitude}) ${latlng.longitude}',
              style: TextStyleConstant.robotoW400(
                fontSize: 12,
                color: ColorConstant.text79,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
