class CatalogueValueResponse {
  final num id;
  final String code;
  final String name;

  CatalogueValueResponse({
    required this.id,
    required this.code,
    required this.name,
  });

  factory CatalogueValueResponse.fromJson(Map<String, dynamic> json) {
    return CatalogueValueResponse(
      id: json['id'] ?? 0,
      code: json['code'] ?? '',
      name: json['name'] ?? '',
    );
  }
}