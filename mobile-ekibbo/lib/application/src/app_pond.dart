part of AppProvider;

class AppPond {
  Map<String, FarmLandModel>? _datas;

  AppPond();

  List<FarmLandModel> get datas =>
      _datas == null ? [] : _datas!.values.toList();

  init() async {
    if (_datas != null) return;
    final res = await BoxPond.getAll();
    _datas = {};
    res.forEach((e) {
      final data = FarmLandModel.fromJson(e.cast<String, dynamic>());
      _datas![data.id.toString()] = data;
    });
  }

  save(FarmLandModel data) async {
    if (data.id == null) {
      data.id = DateTime.now().millisecondsSinceEpoch;
      data.tag = 'insert_${data.id}';
    } else {
      if (data.tag.isEmpty) {
        data.tag = 'update_${data.id}';
      }
    }
    await BoxPond.add(data);
    _datas![data.id.toString()] = data;
  }

  delete(String id) async {
    await BoxPond.delete(id);
    _datas!.remove(id);
  }
}
