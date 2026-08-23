// ignore_for_file: public_member_api_docs, sort_constructors_first
class MBaseResponse {
  final bool result;
  final String message;
  final dynamic data;
  MBaseResponse({
    required this.result,
    required this.message,
    required this.data,
  });

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'result': result,
      'message': message,
      'data': data,
    };
  }

  factory MBaseResponse.fromJson(Map<String, dynamic> map) {
    return MBaseResponse(
      result: map['result'] ?? false,
      message: map['message'] ?? 'Something went wrong!',
      data: map['data'] ?? null,
    );
  }
}
