import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:agrobase_ekibbo/components/app_inputtext_edit.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/constant/text_style_constant.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/domain/l10n/app_lang.dart';
import 'package:agrobase_ekibbo/models/crop/crop_harvest_model.dart';

// ignore: must_be_immutable
class ProductInformation extends StatefulWidget {
  const ProductInformation({super.key, required this.cropHarvest});
  final MCropHarvest? cropHarvest;

  @override
  State<ProductInformation> createState() => _ProductInformationState();
}

class _ProductInformationState extends State<ProductInformation> {
  @override
  Widget build(BuildContext context) {
    return widget.cropHarvest == null
        ? const SizedBox.shrink()
        : Container(
            decoration: BoxDecoration(
              color: ColorConstant.grayF7F8FA,
              borderRadius: BorderRadius.circular(15),
            ),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildItemInfo(
                          AppLang.local.harvest_id,
                          widget.cropHarvest!.id.toString(),
                        ),
                        Padding(
                          padding: const EdgeInsets.only(top: 15),
                          child: _buildItemInfo(
                            AppLang.local.variety,
                            widget.cropHarvest!.variety,
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.only(top: 15),
                          child: _buildItemInfo(
                            AppLang.local.loan_amount,
                            "${widget.cropHarvest!.loanAmount}đ",
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.only(top: 15),
                          child: _buildItemInfo(
                            AppLang.local.price_per_unit,
                            "${widget.cropHarvest!.pricePerUnit}đ",
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.only(top: 15),
                          child: _buildItemInfo(
                            AppLang.local.sub_total,
                            "${widget.cropHarvest!.subTotal}đ",
                          ),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(top: 0),
                          child: _buildItemInfo(
                            AppLang.local.crop,
                            widget.cropHarvest!.crop,
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.only(top: 15),
                          child: _buildItemInfo(
                            AppLang.local.farmer,
                            widget.cropHarvest!.farmerName,
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.only(top: 15),
                          child: _buildItemInfo(
                            AppLang.local.approx_harvest_qty,
                            "${widget.cropHarvest!.approxHarvestQty} MT",
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.only(top: 15),
                          child: _buildItemInfoCanEdit(AppLang.local.actual_qty,
                              widget.cropHarvest!.actualQty, context),
                        ),
                        Padding(
                          padding: const EdgeInsets.only(top: 15),
                          child: _buildItemInfo(
                            AppLang.local.farmer_payment,
                            "${widget.cropHarvest!.farmerPayment}đ",
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
  }

  _buildItemInfo(String key, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          key,
          style: TextStyleConstant.robotoW700(
            fontSize: 16,
            color: ColorConstant.text79,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          value,
          style: TextStyleConstant.robotoW400(
            fontSize: 12,
            color: ColorConstant.text79,
          ),
        )
      ],
    );
  }

  _buildItemInfoCanEdit(String key, double value, BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          key,
          style: TextStyleConstant.robotoW700(
            fontSize: 16,
            color: ColorConstant.text79,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Text(
              "$value MT",
              style: TextStyleConstant.robotoW400(
                fontSize: 12,
                color: ColorConstant.text79,
              ),
            ),
            InkWell(
              onTap: () {
                showModalBottomSheet(
                  context: context,
                  isDismissible: false,
                  isScrollControlled: true,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  builder: (_) => Padding(
                    padding: EdgeInsets.only(
                        bottom: MediaQuery.of(context).viewInsets.bottom),
                    child: AppInputTextEdit(
                      title: "Recieved Weight",
                      value: value.toString(),
                    ),
                  ),
                ).then((v) {
                  try {
                    setState(() {
                      widget.cropHarvest!.calculatorPrice(double.parse(v));
                    });
                  } catch (e) {
                    print(e);
                  }
                });
              },
              child: SizedBox(
                width: 50,
                height: 20,
                child: SvgPicture.asset('ic_edit_qty'.iconSvg),
              ),
            ),
          ],
        )
      ],
    );
  }
}
