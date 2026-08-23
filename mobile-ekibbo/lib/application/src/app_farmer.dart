part of AppProvider;

class AppFarmer {
  Map<String, MFarmerLocal>? _datas;

  AppFarmer();

  List<MFarmerLocal> get datas => _datas == null ? [] : _datas!.values.toList();

  Future init() async {
    if (_datas != null) return;
    final res = await BoxFarmer.getAll();
    _datas = {};
    res.forEach((e) {
      final data = MFarmerLocal.fromMap(e.cast<String, dynamic>());
      _datas![data.id.toString()] = data;
    });
  }

  save(MFarmerLocal data) async {
    await BoxFarmer.add(data);
    _datas![data.id.toString()] = data;
  }

  delete(String id) async {
    await BoxFarmer.delete(id);
    _datas!.remove(id);
  }
}
