import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:agrobase_ekibbo/models/farmer_local/farmer_local_model.dart';

class BoxFarmer {
  static const String boxName = 'farmers';

  static Box? box;

  static Future _init() async {
    if (box != null) return;
    box = await Hive.openBox(boxName);
  }

  static Future<List<dynamic>> getAll() async {
    try {
      await _init();
      return box!.values.toList();
    } catch (e) {
      debugPrint('BoxFarmer getAll $e');
      return [];
    }
  }

  static Future add(MFarmerLocal data) async {
    await _init();
    box!.put(data.id.toString(), data.toMap());
  }

  static Future delete(String key) async {
    await _init();
    box!.delete(key);
  }
}
