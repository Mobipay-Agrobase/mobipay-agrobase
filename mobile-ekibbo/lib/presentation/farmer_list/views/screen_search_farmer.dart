// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:agrobase_ekibbo/application/app_provider.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/components/radio_button.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_farmer.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/all_farmer/farmer_model.dart';
import 'package:agrobase_ekibbo/routes/argument_model.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';

// ignore: must_be_immutable
class ScreenSearchFarmer extends StatefulWidget {
  const ScreenSearchFarmer({super.key, required this.argument});
  final ArgumentScreenSearchFarmer argument;

  @override
  State<ScreenSearchFarmer> createState() => _ScreenSearchFarmerState();
}

class _ScreenSearchFarmerState extends State<ScreenSearchFarmer> {
  String _value = '';
  Timer? _debounce;

  final ctrlScroll = ScrollController();

  @override
  void initState() {
    super.initState();
    _value = context.read<AppProvider>().appSearchFarmer.searchParam;
    context.read<AppProvider>().updateStateFuture(AppEvent.appSearchInit);
    ctrlScroll.addListener(() {
      if (ctrlScroll.position.pixels == ctrlScroll.position.maxScrollExtent) {
        context.read<AppProvider>().updateStateFuture(AppEvent.appSearchFetchData);
      }
    });
  }

  @override
  void dispose() {
    ctrlScroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: AppLang.local.search_farmer,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            _buildFormSearch(),
            Expanded(
              child: _buildListFarmer(
                  context.watch<AppProvider>().appSearchFarmer.farmers),
            ),
          ],
        ),
      ),
    );
  }

  _onSearchChanged(String query) {
    if (_debounce?.isActive ?? false) _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () async {
      context
          .read<AppProvider>()
          .updateStateFuture(AppEvent.appSearchFarmer, argument: query);
    });
  }

  _buildFormSearch() {
    return AppFormField(
      initialValue: _value,
      onChanged: _onSearchChanged,
      prefixIcon: Padding(
        padding: const EdgeInsets.all(16.0),
        child: SvgPicture.asset(
          'ic_search'.iconSvg,
        ),
      ),
      suffixIcon: InkWell(
        onTap: () async {
          final value =
              await Navigator.of(context).pushNamed(RouterName.scan_qr);
          if (value != null && value is String) {
            final id = value.split('/').last;
            final farmer = await ApiFarmer.getFarmerDetail(int.parse(id),
                has: widget.argument.hasData);
            if (farmer == null) {
              if (widget.argument.hasData == 1) {
                // ignore: use_build_context_synchronously
                DialogHelper.showOkDialog(
                    context, "This Farmer Don't Have Cutivation!");
                return;
              }
              // ignore: use_build_context_synchronously
              DialogHelper.showOkDialog(
                  context, AppLang.local.farmer_not_belong_to_you);
              return;
            }
            setDataToPop(farmer);
            // ignore: use_build_context_synchronously
            Navigator.of(context).pop(widget.argument);
          }
        },
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: SvgPicture.asset(
            'ic_qr'.iconSvg,
          ),
        ),
      ),
      hint: '${AppLang.local.search_farmer}...',
    );
  }

  setDataToPop(FarmerModel farmerModel) {
    widget.argument.farmerId = farmerModel.id ?? 0;
    widget.argument.farmerSelected = farmerModel.showInputName;
    widget.argument.cooperativeId = farmerModel.cooperativeId ?? 0;
    widget.argument.farmerPhone = farmerModel.phoneNumber ?? '0';
  }

  _buildListFarmer(List<FarmerModel> items) {
    final datas = items.map((e) => e.showInputName).toList();
    return datas.isEmpty
        ? const NoDataView()
        : ListView.builder(
            shrinkWrap: true,
            controller: ctrlScroll,
            itemCount: datas.length,
            padding: const EdgeInsets.symmetric(
              horizontal: 20,
            ),
            itemBuilder: (_, index) {
              return InkWell(
                onTap: () {
                  setDataToPop(items[index]);
                  Navigator.of(context).pop(widget.argument);
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  decoration: const BoxDecoration(
                      border: Border(
                    bottom: BorderSide(
                      color: ColorConstant.greyEBEBEB,
                    ),
                  )),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          datas[index],
                          style: const TextStyle(
                            fontSize: 16,
                            color: ColorConstant.heading,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                      SizedBox(
                        height: 20,
                        width: 20,
                        child: RadioButton<String>(
                          value: datas[index],
                          groupValue: widget.argument.farmerSelected,
                          onChanged: (v) {
                            setDataToPop(items[index]);
                            Navigator.of(context).pop(widget.argument);
                          },
                        ),
                      )
                    ],
                  ),
                ),
              );
            });
  }
}
