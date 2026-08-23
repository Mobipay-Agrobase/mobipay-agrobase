import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

class GInternetImage extends StatelessWidget {
  const GInternetImage({
    Key? key,
    required this.url,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.borderRadius = 0,
    this.placeHolder,
  }) : super(key: key);

  final String? url;
  final double? width;
  final double? height;
  final double borderRadius;
  final BoxFit fit;
  final String? placeHolder;

  @override
  Widget build(BuildContext context) {
    return borderRadius == 0
        ? CachedNetworkImage(
            imageUrl: url ?? '',
            width: width,
            height: height,
            fit: fit,
            errorWidget: (_, __, ___) {
              return Container(
                width: width,
                height: height,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(borderRadius),
                  // color: kNeutral2,
                ),
                child: GImage.asset(name: 'assets/images/avt_placeholder.png'),
              );
            },
            placeholder: (BuildContext context, String url) {
              ///replace animation or loading widget
              return GImage.asset(name: 'assets/images/avt_placeholder.png');
            },
          )
        : ClipRRect(
            borderRadius: BorderRadius.circular(borderRadius),
            child: CachedNetworkImage(
              imageUrl: url ?? '',
              width: width,
              height: height,
              fit: fit,
              errorWidget: (_, __, ___) {
                return Container(
                  width: width,
                  height: height,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(borderRadius),
                    // color: kNeutral2,
                  ),
                  child:
                      GImage.asset(name: 'assets/images/avt_placeholder.png'),
                );
              },
              placeholder: (BuildContext context, String url) {
                ///replace animation or loading widget
                return GImage.asset(name: 'assets/images/avt_placeholder.png');
              },
            ),
          );
  }
}

class GImage extends Image {
  GImage.asset({
    Key? key,
    required String name,
    double? width,
    double? height,
    Color? color,
    BoxFit boxFit = BoxFit.cover,
  }) : super(
          key: key,
          image: ResizeImage.resizeIfNeeded(
            null,
            null,
            AssetImage(name),
          ),
          width: width,
          height: height,
          color: color,
          fit: boxFit,
        );

  GImage.file({
    Key? key,
    required File file,
    double? width,
    double? height,
    Color? color,
    BoxFit boxFit = BoxFit.cover,
  }) : super(
          key: key,
          image: ResizeImage.resizeIfNeeded(
            null,
            null,
            FileImage(file),
          ),
          width: width,
          height: height,
          color: color,
          fit: boxFit,
        );
}

extension GetIcon on String {
  String get iconSvg {
    return 'assets/icons/$this.svg';
  }

  String get iconImg {
    return 'assets/icons/$this.png';
  }

  String get iconJPG {
    return 'assets/icons/$this.jpg';
  }

  String get iconGIF {
    return 'assets/icons/$this.gif';
  }

  String get imgGIF {
    return 'assets/images/$this.gif';
  }

  String get imgPNG {
    return 'assets/images/$this.png';
  }
}
