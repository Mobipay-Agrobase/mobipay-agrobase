import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:location/location.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/common_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/map_toolkit_helper.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/infrastructure/local_data/shared_manager.dart';

class AddFarmPlotting extends StatefulWidget {
  const AddFarmPlotting({
    super.key,
    this.points,
    this.isEnable = true,
  });
  final List<LatLng>? points;
  final bool isEnable;
  @override
  State<AddFarmPlotting> createState() => _AddFarmPlottingState();
}

class _AddFarmPlottingState extends State<AddFarmPlotting> {
  CameraPosition _initialCameraPosition = CameraPosition(
    target: LatLng(
      DataConstant.lat == 0 ? 10.773091745637778 : DataConstant.lat,
      DataConstant.lng == 0 ? 106.72806366508178 : DataConstant.lng,
    ),
    zoom: 18,
  );
  Map<PolygonId, Polygon> mapsPolygons = <PolygonId, Polygon>{};
  Set<Marker> _markers = {};
  List<LatLng> points = [];
  double distance = 0;
  bool _isDraw = true;
  GoogleMapController? _controller;
  @override
  void initState() {
    super.initState();
    if (widget.points != null && widget.points!.isNotEmpty) {
      _initialCameraPosition = CameraPosition(
        target: LatLng(
          widget.points!.first.latitude,
          widget.points!.first.longitude,
        ),
        zoom: 18,
      );
      for (var i = 0; i < widget.points!.length; i++) {
        points.add(widget.points![i]);
      }
    }
    _drawMap();
  }

  _onSave() {
    if (points.length >= 3) {
      Navigator.of(context).pop(points);
    }
  }

  _drawMap() {
    _markers = {};
    mapsPolygons = {};
    for (var e in points) {
      final PolygonId polygonId = PolygonId(randomId().toString());
      final Polygon polygon = Polygon(
        polygonId: polygonId,
        strokeColor: Colors.red,
        strokeWidth: 5,
        fillColor: Colors.red.withOpacity(0.3),
        points: points,
      );
      _markers.add(Marker(
        draggable: true,
        markerId: MarkerId(e.toString()),
        position: e,
        // infoWindow: InfoWindow(title: 'title', snippet: 'snippet'),
        icon: BitmapDescriptor.defaultMarker,
        onDragEnd: (LatLng latLng) {
          print(latLng);
          print(latLng.toString());
        },
      ));
      mapsPolygons[polygonId] = polygon;
      distance = MapToolKitHelper.getArea(
          points.map((e) => [e.latitude, e.longitude]).toList());
    }
  }

  _clear() {
    distance = 0;
    points.clear();
    mapsPolygons = {};
    _markers = {};
  }

  _onStart() async {
    Location location = Location();
    final locationData = await location.getLocation();
    if (locationData.latitude != null) {
      tapMap(LatLng(locationData.latitude!, locationData.longitude!));
      CameraPosition cameraPosition = CameraPosition(
        target: LatLng(locationData.latitude!, locationData.longitude!),
        zoom: 18,
      );
      _controller
          ?.animateCamera(CameraUpdate.newCameraPosition(cameraPosition));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: AppLang.local.farm_land_plotting,
        actions: widget.isEnable
            ? [
                InkWell(
                  onTap: _onSave,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      AppLang.local.save,
                      style: TextStyleConstant.quicksandW600(
                        fontSize: 16,
                        color: points.length < 3
                            ? ColorConstant.text79
                            : ColorConstant.primary,
                      ),
                    ),
                  ),
                ),
              ]
            : null,
      ),
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: _initialCameraPosition,
            polygons: Set<Polygon>.of(mapsPolygons.values),
            onTap: widget.isEnable && _isDraw ? tapMap : null,
            mapType: MapType.hybrid,
            markers: _markers,
            myLocationEnabled: true,
            onMapCreated: (GoogleMapController controller) {
              _controller = controller;
            },
          ),
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                widget.isEnable
                    ? Padding(
                        padding: const EdgeInsets.only(bottom: 16, right: 16),
                        child: Column(
                          children: [
                            InkWell(
                              onTap: () {
                                setState(() {
                                  _clear();
                                  _isDraw = true;
                                });
                              },
                              child: Container(
                                height: 48,
                                width: 48,
                                decoration: BoxDecoration(
                                  color: _isDraw
                                      ? ColorConstant.primary
                                      : Colors.white,
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      offset: const Offset(4, 4),
                                      blurRadius: 4,
                                      color: Colors.black.withOpacity(0.25),
                                    ),
                                  ],
                                ),
                                child: Center(
                                  child: SvgPicture.asset('ic_draw'.iconSvg,
                                      color: _isDraw
                                          ? null
                                          : ColorConstant.text79),
                                ),
                              ),
                            ),
                            const SizedBox(
                              height: 16,
                            ),
                            InkWell(
                              onTap: () {
                                setState(() {
                                  _clear();
                                  _isDraw = false;
                                });
                              },
                              child: Container(
                                height: 48,
                                width: 48,
                                decoration: BoxDecoration(
                                  color: _isDraw
                                      ? Colors.white
                                      : ColorConstant.primary,
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      offset: const Offset(4, 4),
                                      blurRadius: 4,
                                      color: Colors.black.withOpacity(0.25),
                                    ),
                                  ],
                                ),
                                child: Center(
                                  child: SvgPicture.asset(
                                    'ic_walk'.iconSvg,
                                    color: _isDraw
                                        ? ColorConstant.text79
                                        : Colors.white,
                                  ),
                                ),
                              ),
                            )
                          ],
                        ),
                      )
                    : const SizedBox.shrink(),
                _SlideUpPanel(
                  isEdit: widget.isEnable,
                  area: distance,
                  points: points,
                  isDraw: _isDraw,
                  onPin: _onStart,
                  undo: () {
                    if (points.isNotEmpty) {
                      points.removeLast();
                      _drawMap();
                      setState(() {});
                    }
                  },
                  clear: () {
                    _clear();
                    setState(() {});
                  },
                ),
              ],
            ),
          )
        ],
      ),
    );
  }

  void tapMap(LatLng pos) {
    points.add(pos);
    final PolygonId polygonId = PolygonId(randomId().toString());
    final Polygon polygon = Polygon(
      polygonId: polygonId,
      strokeColor: Colors.red,
      strokeWidth: 5,
      fillColor: Colors.red.withOpacity(0.3),
      points: points,
    );
    _markers.add(Marker(
      draggable: true,
      markerId: MarkerId(pos.toString()),
      position: pos,
      // infoWindow: InfoWindow(title: 'title', snippet: 'snippet'),
      icon: BitmapDescriptor.defaultMarker,
      onDragEnd: (LatLng latLng) {
        print(latLng);
        print(latLng.toString());
      },
    ));
    mapsPolygons[polygonId] = polygon;
    // double areaInSquareMeters = calculateEnclosedArea(points);
    // double areaInHectares = convertToHectares(areaInSquareMeters);

    // distance = GsonViHelper.getArea(points);

    distance = MapToolKitHelper.getArea(
        points.map((e) => [e.latitude, e.longitude]).toList());

    print(distance);
    setState(() {});
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

class _SlideUpPanel extends StatefulWidget {
  const _SlideUpPanel({
    super.key,
    this.undo,
    this.clear,
    this.points = const [],
    this.area = 0,
    this.isEdit = true,
    this.isDraw = true,
    this.onPin,
  });
  final Function()? undo;
  final Function()? clear;
  final List<LatLng> points;
  final double area;
  final bool isEdit;
  final bool isDraw;
  final Function()? onPin;

  @override
  State<_SlideUpPanel> createState() => _SlideUpPanelState();
}

class _SlideUpPanelState extends State<_SlideUpPanel> {
  double? height = 120;
  bool _isFull = false;
  @override
  void initState() {
    super.initState();
  }

  bool _isStarting = false;
  bool _isPause = false;
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onVerticalDragEnd: (v) {
        print(v.primaryVelocity);
        if (widget.points.isEmpty) {
          return;
        }
        if (v.primaryVelocity! > 0) {
          _isFull = false;
        } else {
          _isFull = true;
        }
        setState(() {});
      },
      child: Container(
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
            Center(
              child: Container(
                height: 4,
                width: 20,
                decoration: BoxDecoration(
                  color: ColorConstant.grayd9d9d9,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(
              height: 8,
            ),
            Text(
              '${AppLang.local.total_plot_area}: ${CommonHelper.convertSquaresMetToHec(widget.area).toStringAsFixed(2)}ha',
              style: TextStyleConstant.robotoW500(
                fontSize: 14,
                color: ColorConstant.text79,
              ),
            ),
            if (widget.points.isNotEmpty) _buildText(),
            const SizedBox(
              height: 24,
            ),
            if (widget.isEdit)
              (widget.isDraw ? _buildRowButtonDraw() : _buildRowButtonWalk()),
          ],
        ),
      ),
    );
  }

  Column _buildText() {
    List<Widget> _children = [];
    if (!_isFull) {
      _children = [
        _buildLatLngText(
          0,
          widget.points.first,
        ),
      ];
    } else {
      for (var i = 0; i < widget.points.length; i++) {
        _children.add(
          _buildLatLngText(
            i,
            widget.points[i],
          ),
        );
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: _children,
    );
  }

  Row _buildRowButtonDraw() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Expanded(
          child: InkWell(
            onTap: widget.undo,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SvgPicture.asset(
                  'ic_undo'.iconSvg,
                ),
                const SizedBox(
                  height: 4,
                ),
                Text(
                  'Undo',
                  style: TextStyleConstant.quicksandW600(
                    color: ColorConstant.primary,
                    fontSize: 10,
                  ),
                )
              ],
            ),
          ),
        ),
        Expanded(
          child: InkWell(
            onTap: widget.clear,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SvgPicture.asset(
                  'ic_eraser'.iconSvg,
                ),
                const SizedBox(
                  height: 4,
                ),
                Text(
                  'Clear',
                  style: TextStyleConstant.quicksandW600(
                    color: ColorConstant.primary,
                    fontSize: 10,
                  ),
                )
              ],
            ),
          ),
        )
      ],
    );
  }

  Row _buildRowButtonWalk() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Expanded(
          child: InkWell(
            onTap: () {
              setState(() {
                if (_isStarting) {
                  _isPause = !_isPause;
                }
                if (!_isStarting) {
                  _isStarting = true;
                  widget.onPin?.call();
                }
              });
            },
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SvgPicture.asset(
                  (!_isStarting
                          ? 'ic_play'
                          : (_isPause ? 'ic_play' : 'ic_pause'))
                      .iconSvg,
                ),
                const SizedBox(
                  height: 4,
                ),
                Text(
                  !_isStarting ? 'Start' : (_isPause ? 'Resume' : 'Pause'),
                  style: TextStyleConstant.quicksandW600(
                    color: ColorConstant.primary,
                    fontSize: 10,
                  ),
                )
              ],
            ),
          ),
        ),
        if (_isStarting && _isPause == false)
          Expanded(
            child: InkWell(
              onTap: () => widget.onPin?.call(),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SvgPicture.asset(
                    'ic_location'.iconSvg,
                    color: ColorConstant.primary,
                    height: 24,
                    width: 24,
                  ),
                  const SizedBox(
                    height: 4,
                  ),
                  Text(
                    'Pin',
                    style: TextStyleConstant.quicksandW600(
                      color: ColorConstant.primary,
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),
          ),
        if (_isStarting)
          Expanded(
            child: InkWell(
              onTap: widget.clear,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SvgPicture.asset(
                    'ic_reset'.iconSvg,
                    color: ColorConstant.primary,
                    height: 24,
                    width: 24,
                  ),
                  const SizedBox(
                    height: 4,
                  ),
                  Text(
                    'Reset',
                    style: TextStyleConstant.quicksandW600(
                      color: ColorConstant.primary,
                      fontSize: 10,
                    ),
                  )
                ],
              ),
            ),
          )
      ],
    );
  }

  Padding _buildLatLngText(
    int index,
    LatLng latlng,
  ) {
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: RichText(
        text: TextSpan(
          children: [
            TextSpan(
              text: 'Point ${index + 1}: ',
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
