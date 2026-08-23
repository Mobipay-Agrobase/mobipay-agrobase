import 'package:intl/intl.dart';
import 'package:agrobase_ekibbo/components/helpers/date_helper.dart';
import 'package:agrobase_ekibbo/components/helpers/time_zone_local.dart';

class MPostSubResponse {
  final bool result;
  final String message;
  final MPostSubPage data;
  MPostSubResponse({
    required this.result,
    required this.message,
    required this.data,
  });

  factory MPostSubResponse.fromJson(Map<String, dynamic> map) {
    return MPostSubResponse(
      result: map['result'] ?? false,
      message: map['message'] ?? '',
      data: MPostSubPage.fromJson(
          (map['data'] ?? <String, dynamic>{}) as Map<String, dynamic>),
    );
  }
}

class MPostSubPage {
  final List<MPostSub> data;
  final int total;
  final int currentPage;
  final int lastPage;

  MPostSubPage({
    required this.data,
    required this.total,
    required this.currentPage,
    required this.lastPage,
  });

  factory MPostSubPage.fromJson(Map<String, dynamic> map) {
    return MPostSubPage(
      data: List<MPostSub>.from(
        (map['data'] as List<dynamic>).map<MPostSub>(
          (x) => MPostSub.fromJson(x as Map<String, dynamic>),
        ),
      ),
      total: map['total'] as int,
      currentPage: map['current_page'] as int,
      lastPage: map['last_page'] as int,
    );
  }
}

class MPostSub {
  final num id;
  final String lang;
  final String slug;
  final String title;
  final String imageUrl;
  final String createdAt;
  final String updatedAt;

  late String dateUpdated;

  MPostSub({
    required this.id,
    required this.lang,
    required this.slug,
    required this.title,
    required this.imageUrl,
    required this.createdAt,
    required this.updatedAt,
  }) {
    dateUpdated = DateFormat.yMMMMd().format(DateHelper.convertTimestampToDate(
        DateTime.parse(updatedAt).millisecondsSinceEpoch +
            (TimezoneLocal.isOffsetPlus
                ? TimezoneLocal.getOffsetMilliseconds
                : -TimezoneLocal.getOffsetMilliseconds)));
  }

  factory MPostSub.fromJson(Map<String, dynamic> json) {
    return MPostSub(
      id: json['id'] ?? 0,
      lang: json['lang'] ?? '',
      slug: json['slug'] ?? '',
      title: json['title'] ?? '',
      imageUrl: json['image_url'] ?? '',
      createdAt: json['created_at'] ?? '',
      updatedAt: json['updated_at'] ?? '',
    );
  }
}
