import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:agrobase_ekibbo/models/information/species_response.dart';

class BoxSpecies {
  static const String boxName = 'species';

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
      debugPrint('BoxPond getAll $e');
      return [];
    }
  }

  static Future add(SpeciesInfoResponse data) async {
    try {
      await _init();
      box!.put(data.id.toString(), data.toJson());
    } catch (e) {
      debugPrint('BoxSpecies add $e');
    }
  }

  static Future delete(String key) async {
    await _init();
    box!.delete(key);
  }
}
