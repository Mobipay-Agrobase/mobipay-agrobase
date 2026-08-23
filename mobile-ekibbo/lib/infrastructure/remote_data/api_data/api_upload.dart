import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';

class ApiUpload {
  static Future<Map<String, dynamic>?> uploads(Map<String, XFile> files) async {
    try {
      var formFile = FormData();
      formFile.files.addAll([
        for (var entry in files.entries)
          MapEntry(
            entry.key,
            MultipartFile.fromFileSync(entry.value.path,
                filename: entry.value.name),
          ),
      ]);
      final res = await ApiProvider.instance.apiUpload.upload(formFile);
      if (res == null) {
        throw const FormatException('ApiUpload response null');
      }
      if (res.data == null) {
        throw const FormatException('ApiUpload data null');
      }
      return res.data!;
    } catch (e) {
      return null;
    }
  }
}
