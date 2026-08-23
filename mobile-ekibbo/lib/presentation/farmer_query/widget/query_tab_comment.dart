import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/input/input_text_data.dart';
import 'package:agrobase_ekibbo/presentation/farmer_query/widget/item_comment.dart';

class QueryTabComment extends StatelessWidget {
  const QueryTabComment({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: ListView(
            shrinkWrap: true,
            children: [
              ItemComment(),
              ItemComment(),
              ItemComment(),
              ItemComment(),
              ItemCommentAdmin(),
              ItemComment(),
            ],
          ),
        ),
        const InputTextData(hintText: "Add Comment")
      ],
    );
  }
}
