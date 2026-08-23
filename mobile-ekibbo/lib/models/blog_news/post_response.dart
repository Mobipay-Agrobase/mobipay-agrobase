class MPostResponse {
  final bool result;
  final String message;
  final MPost data;
  MPostResponse({
    required this.result,
    required this.message,
    required this.data,
  });

  factory MPostResponse.fromJson(Map<String, dynamic> map) {
    return MPostResponse(
      result: map['result'] ?? false,
      message: map['message'] ?? '',
      data: MPost.fromJson(
          (map['data'] ?? <String, dynamic>{}) as Map<String, dynamic>),
    );
  }
}

class MPost {
  final num blogId;
  final String slug;
  final num status;
  final String categoryName;
  final String categorySlug;
  final String lang;
  final String title;
  final String shortDescription;
  final String description;
  final String imageUrl;
  final String metaTitle;
  final String metaDescription;
  final String metaKeywords;
  final dynamic chartData;
  final String createdAt;
  final String updatedAt;

  MPost({
    required this.blogId,
    required this.slug,
    required this.status,
    required this.categoryName,
    required this.categorySlug,
    required this.lang,
    required this.title,
    required this.shortDescription,
    required this.description,
    required this.imageUrl,
    required this.metaTitle,
    required this.metaDescription,
    required this.metaKeywords,
    required this.chartData,
    required this.createdAt,
    required this.updatedAt,
  });

  factory MPost.fromJson(Map<String, dynamic> json) {
    return MPost(
      blogId: json['blog_id'] ?? 0,
      slug: json['slug'] ?? '',
      status: json['status'] ?? 0,
      categoryName: json['category_name'] ?? '',
      categorySlug: json['category_slug'] ?? '',
      lang: json['lang'] ?? '',
      title: json['title'] ?? '',
      shortDescription: json['short_description'] ?? '',
      description: json['description'] ?? '',
      imageUrl: json['image_url'] ?? '',
      metaTitle: json['meta_title'] ?? '',
      metaDescription: json['meta_description'] ?? '',
      metaKeywords: json['meta_keywords'] ?? '',
      chartData: json['chart_data'],
      createdAt: json['created_at'] ?? '',
      updatedAt: json['updated_at'] ?? '',
    );
  }
}
