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
import 'package:agrobase_ekibbo/models/information/species_response.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';

class ListSpeciesLocalScreen extends StatefulWidget {
  const ListSpeciesLocalScreen({super.key});

  @override
  State<ListSpeciesLocalScreen> createState() => _ListPondLocalScreenState();
}

class _ListPondLocalScreenState extends State<ListSpeciesLocalScreen> {
  late AppProvider appProvider;

  _onDelete(SpeciesInfoResponse data) {
    DialogHelper.showOkDialog(
      context,
      'Delete species ${data.speciesName}?',
      isCancel: true,
      okAction: () {
        context.read<AppProvider>().updateStateFuture(
            AppEvent.appSpeciesDeleteFromLocal,
            argument: data.id.toString());
      },
    );
  }

  _onEdit(SpeciesInfoResponse data) {
    Navigator.of(context)
        .pushNamed(RouterName.add_species_info, arguments: {"params": data});
  }

  @override
  Widget build(BuildContext context) {
    appProvider = context.watch<AppProvider>();
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const CustomAppBar(
        title: 'Sync Data Species',
      ),
      body: appProvider.appSpecies.datas.isEmpty
          ? const NoDataView()
          : ListView(
              padding: const EdgeInsets.all(16),
              shrinkWrap: true,
              children: appProvider.appSpecies.datas
                  .map(
                    (item) => _PondLocalItemView(
                      data: item,
                      onEdit: () => _onEdit(item),
                      onDelete: () => _onDelete(item),
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
  final SpeciesInfoResponse data;
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
          data.photo.isNotEmpty
              ? ClipRRect(
                  borderRadius: BorderRadius.circular(30),
                  child: data.photo.contains('https://')
                      ? GInternetImage(
                          url: data.photo,
                          width: 60,
                          height: 60,
                        )
                      : GImage.file(
                          file: File(data.photo),
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
                        data.farmerName.isNotEmpty ? data.farmerName : 'NAN',
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
                  data.speciesName.toString(),
                ),
                const SizedBox(
                  height: 14,
                ),
                _buildRowInfo(
                  'ic_info',
                  data.expectedHarvestQty.toString(),
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
