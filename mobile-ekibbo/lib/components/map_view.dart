import 'dart:math';

import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';

class MapView extends StatefulWidget {
  const MapView({
    super.key,
    this.latLng,
  });
  final LatLng? latLng;
  @override
  State<MapView> createState() => _MapViewState();
}

class _MapViewState extends State<MapView> {
  CameraPosition _initialCameraPosition = CameraPosition(
    target: LatLng(
      DataConstant.lat == 0 ? 10.773091745637778 : DataConstant.lat,
      DataConstant.lng == 0 ? 106.72806366508178 : DataConstant.lng,
    ),
    zoom: 18,
  );

  Set<Marker> _markers = {};
  LatLng? _current;
  @override
  void initState() {
    if (widget.latLng != null) {
      _initialCameraPosition = CameraPosition(
        target: LatLng(
          widget.latLng!.latitude,
          widget.latLng!.longitude,
        ),
        zoom: 18,
      );
      _current = widget.latLng;
      _onTapMap(_current!);
    }

    super.initState();
  }

  _onTapMap(LatLng e) {
    _current = e;
    _markers = {};

    _markers.add(Marker(
      draggable: true,
      markerId: MarkerId(e.toString()),
      position: e,
      // infoWindow: InfoWindow(title: e, snippet: 'snippet'),
      icon: BitmapDescriptor.defaultMarker,
      onDragEnd: (LatLng latLng) {
        print(latLng);
        print(latLng.toString());
      },
    ));
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: CustomAppBar(
        title: 'Choose your location',
        actions: [
          InkWell(
            onTap: () {
              _current ??= _initialCameraPosition.target;
              Navigator.of(context).pop(_current);
            },
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Text(
                AppLang.local.save,
                style: TextStyleConstant.quicksandW600(
                  color: ColorConstant.primary,
                  fontSize: 16,
                ),
              ),
            ),
          )
        ],
      ),
      body: GoogleMap(
        initialCameraPosition: _initialCameraPosition,
        mapType: MapType.hybrid,
        markers: _markers,
        zoomControlsEnabled: true,
        myLocationButtonEnabled: true,
        myLocationEnabled: true,
        onTap: (v) {
          if (_markers.isNotEmpty) {
            _markers.clear();
          }

          _onTapMap(v);
        },
      ),
    );
  }

  int randomId() {
    var rng = Random();
    int v = 0;
    for (var i = 0; i < 10; i++) {
      v = rng.nextInt(100);
    }
    return v;
  }
}
