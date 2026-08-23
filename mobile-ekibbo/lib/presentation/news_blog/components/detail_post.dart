import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
//import 'package:social_share/social_share.dart';
import 'package:agrobase_ekibbo/components/app_bar_base.dart';
import 'package:agrobase_ekibbo/components/app_toast.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/domain/config/env_config.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_wkwebview/webview_flutter_wkwebview.dart';

class PostDetail extends StatefulWidget {
  final String slug;
  const PostDetail({super.key, required this.slug});

  @override
  State<PostDetail> createState() => _PostDetailState();
}

class _PostDetailState extends State<PostDetail> {
  late final WebViewController _controller;
  late final String linkPost;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    linkPost = "${EnvConfig.domainContent}/${widget.slug}";
    late final PlatformWebViewControllerCreationParams params;
    if (WebViewPlatform.instance is WebKitWebViewPlatform) {
      params = WebKitWebViewControllerCreationParams(
        allowsInlineMediaPlayback: true,
        mediaTypesRequiringUserAction: const <PlaybackMediaTypes>{},
      );
    } else {
      params = const PlatformWebViewControllerCreationParams();
    }

    final WebViewController controller =
        WebViewController.fromPlatformCreationParams(params);

    controller
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0x00000000))
      ..setNavigationDelegate(NavigationDelegate(
        onPageFinished: (String url) async {
          await injectJavascript(controller);
          setState(() {
            isLoading = false;
          });
        },
      ))
      ..loadRequest(Uri.parse(linkPost));
    _controller = controller;
  }

  injectJavascript(WebViewController controller) async {
    try {
      await controller.runJavaScript('''
      document.getElementsByClassName('hearder-wrapper')[0].style.display='none';
      document.getElementsByClassName('top-navbar')[0].style.display='none';
      document.getElementsByClassName('footer-wrapper')[0].style.display='none';
      document.getElementsByClassName('post-breadcrumb')[0].style.display='none';
    ''');
    } catch (e) {
      print("error when find class name");
    }
  }

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: BaseAppBar(
        title: 'Article',
        actions: [
          IconButton(
            onPressed: () {
              onPressShare(context);
            },
            icon: SvgPicture.asset(
              'ic_share'.iconSvg,
              color: Colors.black,
            ),
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 16),
              child: WebViewWidget(
                controller: _controller,
              ),
            ),
    );
  }

  onPressShare(context) {
    return showDialog(
        context: context,
        builder: (BuildContext context) {
          return StatefulBuilder(builder: (context, StateSetter setState) {
            return AlertDialog(
              insetPadding: const EdgeInsets.symmetric(horizontal: 10),
              contentPadding: const EdgeInsets.only(
                  top: 36.0, left: 36.0, right: 36.0, bottom: 2.0),
              content: SizedBox(
                width: 400,
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8.0),
                        child: TextButton(
                          child: const Text(
                            "Copy link",
                            style: TextStyle(
                              color: ColorConstant.mediumGrey,
                            ),
                          ),
                          onPressed: () {
                            Clipboard.setData(ClipboardData(text: linkPost))
                                .then((value) {
                              AppToast.showDialog('Copies');
                            });
                          },
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8.0),
                        child: TextButton(
                          child: const Text(
                            'Share link',
                            style: TextStyle(color: Colors.blue),
                          ),
                          onPressed: () async {
                            //await SocialShare.shareOptions(linkPost);
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              actions: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    TextButton(
                      child: const Text(
                        "CLOSE",
                        style: TextStyle(
                          color: ColorConstant.fontGrey,
                        ),
                      ),
                      onPressed: () {
                        Navigator.of(context, rootNavigator: true).pop();
                      },
                    ),
                  ],
                )
              ],
            );
          });
        });
  }
}
