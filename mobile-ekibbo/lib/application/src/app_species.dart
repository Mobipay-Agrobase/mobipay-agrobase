part of AppProvider;

class AppSpecies {
  Map<String, SpeciesInfoResponse>? _datas;

  AppSpecies();

  List<SpeciesInfoResponse> get datas =>
      _datas == null ? [] : _datas!.values.toList();

  init() async {
    if (_datas != null) return;
    final res = await BoxSpecies.getAll();
    _datas = {};
    res.forEach((e) {
      final data = SpeciesInfoResponse.fromJson(e.cast<String, dynamic>());
      _datas![data.id.toString()] = data;
    });
  }

  save(SpeciesInfoResponse data) async {
    if (data.id == 0) {
      data.id = DateTime.now().millisecondsSinceEpoch;
      data.tag = 'insert_${data.id}';
    } else {
      if (data.tag.isEmpty) {
        data.tag = 'update_${data.id}';
      }
    }
    await BoxSpecies.add(data);
    _datas![data.id.toString()] = data;
  }

  delete(String id) async {
    await BoxSpecies.delete(id);
    _datas!.remove(id);
  }
}
