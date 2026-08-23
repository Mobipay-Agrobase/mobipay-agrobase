// import 'dart:io';

// import 'package:flutter/material.dart';
// import 'package:qr_code_scanner/qr_code_scanner.dart';
// import 'package:agrobase_ekibbo/components/custom_appbar.dart';
// import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
// import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';

// class ScanQrScreen extends StatefulWidget {
//   const ScanQrScreen({super.key});

//   @override
//   State<ScanQrScreen> createState() => _ScanQrScreenState();
// }

// class _ScanQrScreenState extends State<ScanQrScreen> {
//   final GlobalKey qrKey = GlobalKey(debugLabel: 'QR');
//   Barcode? result;
//   QRViewController? controller;
//   @override
//   void reassemble() {
//     super.reassemble();
//     if (Platform.isAndroid) {
//       controller!.pauseCamera();
//     } else if (Platform.isIOS) {
//       controller!.resumeCamera();
//     }
//   }

//   void _onQRViewCreated(QRViewController controller) {
//     this.controller = controller;
//     controller.scannedDataStream.listen((scanData) {
//       if (scanData.code != null) {
//         controller.stopCamera();
//         Navigator.of(context).pop(scanData.code);
//       }
//     });
//   }

//   @override
//   void dispose() {
//     controller?.dispose();
//     super.dispose();
//   }

//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       appBar: CustomAppBar(
//         title: AppLang.local.qr_scan,
//       ),
//       body: QRView(
//         key: qrKey,
//         onQRViewCreated: _onQRViewCreated,
//         overlay: QrScannerOverlayShape(
//           borderColor: ColorConstant.primary,
//           borderWidth: 8,
//           cutOutSize: 200,
//         ),
//       ),
//     );
//   }
// }
