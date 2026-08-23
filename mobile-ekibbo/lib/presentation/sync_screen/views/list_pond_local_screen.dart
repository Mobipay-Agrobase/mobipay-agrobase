// ignore_for_file: use_build_context_synchronously
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/svg.dart';
import 'package:agrobase_ekibbo/application/app_provider.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/components/option_bottom_dialog.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/farm_land/farm_land_model.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';

class ListPondLocalScreen extends StatefulWidget {
  const ListPondLocalScreen({super.key});

  @override
  State<ListPondLocalScreen> createState() => _ListPondLocalScreenState();
}

class _ListPondLocalScreenState extends State<ListPondLocalScreen> {
  late AppProvider appProvider;

  _onDelete(FarmLandModel data) {
    DialogHelper.showOkDialog(
      context,
      'Delete pond ${data.farmName}?', // Use localized string if available
      isCancel: true,
      okAction: () {
        context.read<AppProvider>().updateStateFuture(
            AppEvent.appPondDeleteFromLocal,
            argument: data.id.toString());
      },
    );
  }

  _onEdit(FarmLandModel data) {
    Navigator.of(context)
        .pushNamed(RouterName.add_plot, arguments: {"farmland": data});
  }

  @override
  Widget build(BuildContext context) {
    appProvider = context.watch<AppProvider>();
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const CustomAppBar(
        title: 'Sync Data Pond',
      ),
      body: appProvider.appPond.datas.isEmpty
          ? const NoDataView()
          : ListView(
              padding: const EdgeInsets.all(16),
              shrinkWrap: true,
              children: appProvider.appPond.datas
                  .map(
                    (item) => _PondLocalItemView(
                      data: item,
                      onDelete: () => _onDelete(item),
                      onEdit: () => _onEdit(item),
                    ),
                  )
                  .toList(),
            ),
    );
  }
}

class _PondLocalItemView extends StatelessWidget {
  const _PondLocalItemView({
    required this.data,
    this.onDelete,
    this.onEdit,
  });
  final FarmLandModel data;
  final Function()? onDelete;
  final Function()? onEdit;
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.only(
        left: 20,
        right: 16,
        top: 24,
        bottom: 18,
      ),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: ColorConstant.grayF7F8FA,
        borderRadius: BorderRadius.circular(15),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          data.farmPhoto!.isNotEmpty
              ? ClipRRect(
                  borderRadius: BorderRadius.circular(30),
                  child: data.farmPhoto!.contains('https://')
                      ? GInternetImage(
                          url: data.farmPhoto,
                          width: 60,
                          height: 60,
                        )
                      : GImage.file(
                          file: File(data.farmPhoto!),
                          width: 60,
                          height: 60,
                        ),
                )
              : GImage.asset(
                  name: 'avt_placeholder'.imgPNG,
                  width: 60,
                  height: 60,
                ),
          const SizedBox(
            width: 16,
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        data.farmName ?? '',
                        style: TextStyleConstant.quicksandW600(
                          fontSize: 18,
                        ),
                      ),
                    ),
                    InkWell(
                      onTap: () async {
                        final r = await showModalBottomSheet(
                          context: context,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          builder: (_) => OptionBottomDialog(
                            title: AppLang.local.options,
                            datas: [
                              AppLang.local.edit,
                              AppLang.local.delete,
                            ],
                            itemSelected: '',
                          ),
                        );
                        if (r == 0) {
                          onEdit?.call();
                        } else if (r == 1) {
                          onDelete?.call();
                        }
                      },
                      child: const Icon(
                        Icons.more_horiz,
                        color: ColorConstant.text79,
                      ),
                    ),
                  ],
                ),
                const SizedBox(
                  height: 16,
                ),
                _buildRowInfo(
                  'ic_info',
                  data.landOwnership.toString(),
                ),
                const SizedBox(
                  height: 14,
                ),
                _buildRowInfo(
                  'ic_info',
                  data.totalLandHolding.toString(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Row _buildRowInfo(
    String icon,
    String title,
  ) {
    return Row(
      children: [
        SvgPicture.asset(
          icon.iconSvg,
          width: 16,
          height: 16,
          color: ColorConstant.text79,
        ),
        const SizedBox(
          width: 10,
        ),
        Text(
          title,
          style: TextStyleConstant.robotoW400(
            fontSize: 12,
            color: ColorConstant.text79,
          ),
        )
      ],
    );
  }
}

class _LoadingPercentView extends StatefulWidget {
  const _LoadingPercentView({super.key});

  @override
  State<_LoadingPercentView> createState() => __LoadingPercentViewState();
}

class __LoadingPercentViewState extends State<_LoadingPercentView> {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black.withOpacity(0.3),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            LinearProgressIndicator(
              minHeight: 10,
              color: ColorConstant.primary,
              backgroundColor: ColorConstant.greyEBEBEB,
              borderRadius: BorderRadius.circular(5),
            ),
            const SizedBox(
              height: 16,
            ),
            Text(
              AppLang.local.process_take_time,
              style: TextStyleConstant.robotoW600(
                color: Colors.white,
              ),
            )
          ],
        ),
      ),
    );
  }
}
