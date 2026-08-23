import 'package:flutter/foundation.dart';

extension StringParsing on String {
  List<String> subText() {
    List<String> result = [];
    int idxStart = 0;
    int idxEnd = length % 3;
    idxEnd = idxEnd == 0 ? 3 : idxEnd;
    for (;;) {
      result.add(substring(idxStart, idxEnd));
      idxStart = idxEnd;
      idxEnd += 3;
      if (idxEnd > length) break;
    }
    return result;
  }

  void printWrapped() {
    final pattern = RegExp('.{1,800}'); // 800 is the size of each chunk
    pattern.allMatches(this).forEach((match) => debugPrint(match.group(0)));
  }
}
