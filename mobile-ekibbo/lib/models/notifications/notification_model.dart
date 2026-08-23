// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'package:json_annotation/json_annotation.dart';

part 'notification_model.g.dart';

@JsonSerializable(genericArgumentFactories: true)
class MNotification<T> {
  @JsonKey(defaultValue: '')
  String id;
  @JsonKey(defaultValue: '')
  String type;
  @JsonKey(name: 'read_at', defaultValue: '')
  String readAt;
  @JsonKey(name: 'created_at', defaultValue: '')
  String createdAt;
  @JsonKey(defaultValue: null)
  T? data;

  MNotification({
    required this.id,
    required this.type,
    required this.readAt,
    required this.createdAt,
    this.data,
  });

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'id': id,
      'type': type,
      'readAt': readAt,
      'createdAt': createdAt,
    };
  }

  factory MNotification.fromJson(
    Map<String, dynamic> json,
    T Function(Object? json) fromJsonT,
  ) =>
      _$MNotificationFromJson(json, fromJsonT);
}
