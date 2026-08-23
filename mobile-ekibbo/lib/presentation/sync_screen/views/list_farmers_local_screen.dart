// ignore_for_file: use_build_context_synchronously

import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/svg.dart';
import 'package:http_parser/http_parser.dart';
import 'package:mime/mime.dart';
import 'package:agrobase_ekibbo/application/app_provider.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/components/option_bottom_dialog.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/helpers/dialog_helper.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_farmer.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/farmer_local/farmer_local_model.dart';
import 'package:agrobase_ekibbo/routes/navigator_manager.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';

class ListFarmerLocalScreen extends StatefulWidget {
  const ListFarmerLocalScreen({super.key});

  @override
  State<ListFarmerLocalScreen> createState() => _ListFarmerLocalScreenState();
}

class _ListFarmerLocalScreenState extends State<ListFarmerLocalScreen> {
  late AppProvider appProvider;

  _syncAll() {
    DialogHelper.showOkDialog(
      context,
      AppLang.local.ask_sync_all,
      okAction: () async {
        await _createMultiFarmer();
      },
      isCancel: true,
    );
  }

  _createMultiFarmer() async {
    final idSuccess = <int>[];
    DialogHelper.showLoading();
    for (var element
        in NavigatorManager.contextRoot.read<AppProvider>().appFarmer.datas) {
      final res = await _createFarmer(element);
      if (res) idSuccess.add(element.id);
    }
    for (var element in idSuccess) {
      NavigatorManager.contextRoot
          .read<AppProvider>()
          .updateState(AppEvent.appFarmerDeleteFromLocal, argument: element);
    }
    DialogHelper.hideLoading();
  }

  _createFarmer(MFarmerLocal farmer) async {
    var form = FormData.fromMap(farmer.toUpdate());
    form.files.addAll([
      if (farmer.farmer_photo.isNotEmpty)
        MapEntry(
          'farmer_photo[]',
          MultipartFile.fromFileSync(
            farmer.farmer_photo,
            contentType:
                MediaType.parse(lookupMimeType(farmer.farmer_photo) ?? ''),
          ),
        ),
      if (farmer.id_proof_photo_front.isNotEmpty)
        MapEntry(
          'id_proof_photo[]',
          MultipartFile.fromFileSync(
            farmer.id_proof_photo_front,
            contentType: MediaType.parse(
                lookupMimeType(farmer.id_proof_photo_front) ?? ''),
          ),
        ),
      if (farmer.id_proof_photo_back.isNotEmpty)
        MapEntry(
          'id_proof_photo[]',
          MultipartFile.fromFileSync(
            farmer.id_proof_photo_back,
            contentType: MediaType.parse(
                lookupMimeType(farmer.id_proof_photo_back) ?? ''),
          ),
        ),
    ]);

    try {
      final res = await ApiFarmer.registerFarmer(form);
      if (res.result == false) {
        if (res.message != null) {
          DialogHelper.showToast(context, res.message);
        }
      }
      return res.result;
    } catch (_) {
      DialogHelper.showToast(
          context, AppLang.local.farmer_save_local_successfully);
      return false;
    }
  }

  _onDelete(MFarmerLocal farmer) {
    DialogHelper.showOkDialog(
      context,
      'Delete farmer ${farmer.full_name}?',
      isCancel: true,
      okAction: () {
        context.read<AppProvider>().updateState(AppEvent.appFarmerDeleteFromLocal,
            argument: farmer.id);
        setState(() {});
      },
    );
  }

  _onEdit(MFarmerLocal farmer) {
    Navigator.of(context).pushNamed(RouterName.farmer_registration,
        arguments: {"farmerData": farmer.toMap()});
  }

  @override
  Widget build(BuildContext context) {
    appProvider = context.watch<AppProvider>();
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const CustomAppBar(
        title: 'Sync Data Farmer',
      ),
      body: appProvider.appFarmer.datas.isEmpty
          ? const NoDataView()
          : ListView(
              padding: const EdgeInsets.all(16),
              shrinkWrap: true,
              children: appProvider.appFarmer.datas
                  .map(
                    (item) => _FarmerLocalItemView(
                      farmer: item,
                      onEdit: () => _onEdit(item),
                      onDelete: () => _onDelete(item),
                    ),
                  )
                  .toList(),
            ),
    );
  }
}

class _FarmerLocalItemView extends StatelessWidget {
  const _FarmerLocalItemView({
    required this.farmer,
    this.onDelete,
    this.onEdit,
  });
  final MFarmerLocal farmer;
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
          farmer.farmer_photo.isNotEmpty
              ? ClipRRect(
                  borderRadius: BorderRadius.circular(30),
                  child: farmer.farmer_photo.contains('https://')
                      ? GInternetImage(
                          url: farmer.farmer_photo,
                          width: 60,
                          height: 60,
                        )
                      : GImage.file(
                          file: File(farmer.farmer_photo),
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
                        farmer.full_name,
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
                  'ic_location',
                  farmer.village,
                ),
                const SizedBox(
                  height: 14,
                ),
                Row(
                  children: [
                    Expanded(
                      child: _buildRowInfo(
                        'ic_calling',
                        farmer.phone_number,
                      ),
                    ),
                    Container(
                      height: 24,
                      width: 53,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(5),
                        color: ColorConstant.primary,
                      ),
                      child: Center(
                        child: Text(
                          AppLang.local.call,
                          style: TextStyleConstant.quicksandW500(
                            fontSize: 12,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    )
                  ],
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
