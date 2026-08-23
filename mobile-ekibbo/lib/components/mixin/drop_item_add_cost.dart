// ignore_for_file: public_member_api_docs, sort_constructors_first
class MItem {
  final int id;
  final String name;

  MItem({
    required this.id,
    required this.name,
  });
}

mixin DropItemAddCostMixin {
  List<MItem> items = [
    MItem(id: 1, name: "Labour"),
    MItem(id: 2, name: "Transport"),
    MItem(id: 3, name: "Fuel"),
    MItem(id: 4, name: "Machine"),
    MItem(id: 5, name: "Others")
  ];

  int itemId = 0;

  indexItem() {
    if (items.isEmpty || itemId == 0) return null;
    final index = items.indexWhere((element) => element.id == itemId);
    if (index == -1) return null;
    return index;
  }
}
