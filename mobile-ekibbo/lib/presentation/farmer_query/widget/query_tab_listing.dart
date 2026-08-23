import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/presentation/farmer_query/widget/item_query_listing.dart';

class QueryTabListing extends StatelessWidget {
  const QueryTabListing({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: const [
        Padding(
          padding: EdgeInsets.symmetric(vertical: 5),
          child: ItemQueryListing(),
        ),
        Padding(
          padding: EdgeInsets.symmetric(vertical: 5),
          child: ItemQueryListing(),
        ),
        Padding(
          padding: EdgeInsets.symmetric(vertical: 5),
          child: ItemQueryListing(),
        ),
        Padding(
          padding: EdgeInsets.symmetric(vertical: 5),
          child: ItemQueryListing(),
        ),
        Padding(
          padding: EdgeInsets.symmetric(vertical: 5),
          child: ItemQueryListing(),
        ),
      ],
    );
  }
}
