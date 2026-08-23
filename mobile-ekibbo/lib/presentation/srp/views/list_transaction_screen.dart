import 'package:flutter/material.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/date_helper.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/srp/srp_schedule_response.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';
import 'package:agrobase_ekibbo/presentation/srp/widgets/srp_item_view.dart';
import 'package:agrobase_ekibbo/domain/core/api_provider.dart';

class ListTransactionScreen extends StatefulWidget {
  const ListTransactionScreen({
    super.key,
    required this.date,
  });
  final DateTime date;
  @override
  State<ListTransactionScreen> createState() => _ListTransactionScreenState();
}

class _ListTransactionScreenState extends State<ListTransactionScreen> {
  List<SRPActionModel> _datas = [];
  @override
  void initState() {
    super.initState();
    _getData();
  }

  _getData() async {
    final res = await ApiProvider.instance.apiSRP
        .getSRPDate(DateHelper.convertDateToStr(widget.date));
    setState(() {
      _datas = res?.data ?? [];
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: AppLang.local.transaction,
        subTitle: Text(
          DateHelper.convertDateToStr(widget.date, format: 'EEEE, MMM dd yyyy'),
          style: TextStyleConstant.quicksandW400(
              fontSize: 12, color: ColorConstant.text79),
        ),
      ),
      body: ListView.builder(
        itemCount: _datas.length,
        shrinkWrap: true,
        padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
        itemBuilder: (_, index) {
          return SRPItemView(
            item: _datas[index],
            onTap: () => Navigator.of(context)
                .pushNamed(RouterName.transaction_detail, arguments: {
              'srp': _datas[index],
              'date': widget.date,
            }),
          );
        },
      ),
    );
  }
}
