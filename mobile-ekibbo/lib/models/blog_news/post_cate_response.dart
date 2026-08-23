class MCategoryPostResponse {
  final bool result;
  final String message;
  final List<MCategoryPost> data;
  MCategoryPostResponse({
    required this.result,
    required this.message,
    required this.data,
  });

  factory MCategoryPostResponse.fromJson(Map<String, dynamic> map) {
    return MCategoryPostResponse(
      result: map['result'] ?? false,
      message: map['message'] ?? '',
      data: ((map['data'] ?? []) as List)
          .map((e) => MCategoryPost.fromJson(e))
          .toList(),
    );
  }
}

class MCategoryPost {
  final String name;
  final String slug;

  MCategoryPost({required this.name, required this.slug});

  factory MCategoryPost.fromJson(Map<String, dynamic> json) {
    return MCategoryPost(name: json['name'] ?? '', slug: json['slug'] ?? '');
  }
}
