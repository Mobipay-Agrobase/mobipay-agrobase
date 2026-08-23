import 'package:flutter/material.dart';

import 'item_news.dart';

class NewsTab extends StatelessWidget {
  const NewsTab({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: const [
        Padding(
          padding: EdgeInsets.symmetric(vertical: 5),
          child: ItemNews(),
        ),
        Padding(
          padding: EdgeInsets.symmetric(vertical: 5),
          child: ItemNews(),
        ),
        Padding(
          padding: EdgeInsets.symmetric(vertical: 5),
          child: ItemNews(),
        ),
        Padding(
          padding: EdgeInsets.symmetric(vertical: 5),
          child: ItemNews(),
        ),
        Padding(
          padding: EdgeInsets.symmetric(vertical: 5),
          child: ItemNews(),
        ),
      ],
    );
  }
}
