// ignore_for_file: use_build_context_synchronously

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:agrobase_ekibbo/application/app_provider.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/custom_appbar.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/components/no_data_view.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/all_farmer/farmer_model.dart';
import 'package:agrobase_ekibbo/presentation/farmer_list/widgets/farmer_item_view.dart';
import 'package:agrobase_ekibbo/routes/routes_manager.dart';

class FarmerListScreen extends StatefulWidget {
  const FarmerListScreen({super.key});

  @override
  State<FarmerListScreen> createState() => _FarmerListScreenState();
}

class _FarmerListScreenState extends State<FarmerListScreen> {
  final ctrlSearchFarmer = TextEditingController();
  final ctrlScroll = ScrollController();
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    context.read<AppProvider>().updateStateFuture(AppEvent.appListingInit);
    ctrlSearchFarmer.text =
        context.read<AppProvider>().appListingFarmer.searchParam;
    ctrlScroll.addListener(() {
      if (ctrlScroll.position.pixels == ctrlScroll.position.maxScrollExtent) {
        context
            .read<AppProvider>()
            .updateStateFuture(AppEvent.appListingFetchData);
      }
    });
  }

  @override
  void dispose() {
    ctrlSearchFarmer.dispose();
    ctrlScroll.dispose();
    super.dispose();
  }

  _onSearchChanged(String query) {
    if (_debounce?.isActive ?? false) _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      context.read<AppProvider>().updateStateFuture(
          AppEvent.appListingSearchFarmer,
          argument: ctrlSearchFarmer.text);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(
        title: AppLang.local.all_farmer,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              AppFormField(
                controller: ctrlSearchFarmer,
                onChanged: _onSearchChanged,
                prefixIcon: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: SvgPicture.asset(
                    'ic_search'.iconSvg,
                  ),
                ),
                suffixIcon: InkWell(
                  onTap: () async {
                    final value = await Navigator.of(context)
                        .pushNamed(RouterName.scan_qr);
                    if (value != null && value is String) {
                      final id = value.split('/').last;
                      Navigator.of(context).pushNamed(RouterName.farmer_detail,
                          arguments: int.tryParse(id));
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
              ),
              const SizedBox(
                height: 16,
              ),
              Expanded(
                child: _buildFarmerList(
                  context.watch<AppProvider>().appListingFarmer.farmers,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  _buildFarmerList(List<FarmerModel> farmers) {
    return farmers.isEmpty
        ? const NoDataView()
        : RefreshIndicator(
            onRefresh: () async {
              context.read<AppProvider>().updateState(
                  AppEvent.appListingSearchFarmer,
                  argument: ctrlSearchFarmer.text);
            },
            child: ListView.builder(
                controller: ctrlScroll,
                shrinkWrap: true,
                itemCount: farmers.length,
                itemBuilder: (context, index) {
                  return FarmerItemView(
                    farmer: farmers[index],
                  );
                }),
          );
  }
}
