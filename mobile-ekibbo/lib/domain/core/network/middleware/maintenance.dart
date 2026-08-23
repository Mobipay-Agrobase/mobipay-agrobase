// import 'dart:convert';
// import 'package:flutter/material.dart';
// // ignore: depend_on_referenced_packages
// import 'package:http/http.dart' as http;
// import 'package:agrobase_ekibbo/components/constant/color_constant.dart';

// import 'middleware.dart';

// class MaintenanceMiddleware extends Middleware {
//   @override
//   bool next(http.Response response) {
//     try {
//       var jsonData = jsonDecode(response.body);
//       if (jsonData.runtimeType != List &&
//           jsonData['result'] != null &&
//           !jsonData['result']) {
//         if (jsonData.containsKey("status") &&
//             jsonData['status'] == "maintenance") {
//           OneContext().addOverlay(
//               overlayId: "maintenance",
//               builder: (context) => Scaffold(
//                     body: Container(
//                       padding: const EdgeInsets.symmetric(horizontal: 24),
//                       height: double.maxFinite,
//                       child: Column(
//                           mainAxisAlignment: MainAxisAlignment.center,
//                           children: [
//                             Image.asset(
//                               "assets/maintenance.png",
//                             ),
//                             const SizedBox(height: 14),
//                             Text(
//                               jsonData['message'],
//                               style: const TextStyle(
//                                   fontSize: 20,
//                                   fontWeight: FontWeight.bold,
//                                   color: ColorConstant.fontGrey),
//                             )
//                           ]),
//                     ),
//                   ));
//           return false;
//         }
//       }
//     } catch (e) {
//       debugPrint("MaintenanceMiddleware");
//     }
//     return true;
//   }
// }
