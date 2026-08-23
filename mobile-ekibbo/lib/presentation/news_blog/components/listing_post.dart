// import 'dart:async';
// import 'package:active_ecommerce_flutter/custom/widget_common.dart';
// import 'package:active_ecommerce_flutter/data_model/post/tab_tag_model.dart';
// import 'package:active_ecommerce_flutter/screens/news_blog/services/post_store.dart';
// import 'package:flutter/material.dart';

// class ListingPost extends StatefulWidget {
//   final MTabTag currentTab;
//   const ListingPost({super.key, required this.currentTab});

//   @override
//   State<ListingPost> createState() => _ListingPostState();
// }

// class _ListingPostState extends State<ListingPost> {
//   final _scrollController = ScrollController();
//   Timer? _debounce;
//   FBlogData? currentPost;

//   @override
//   void initState() {
//     super.initState();
//     iniFetch();
//     _scrollController.addListener(() {
//       if (_scrollController.position.pixels ==
//           _scrollController.position.maxScrollExtent) {
//         fetchNextPage();
//       }
//     });
//   }

//   iniFetch() async {
//     await StorePost.instance.initFetch(TypePost.blog, widget.currentTab.key);
//     if (StorePost.instance.getPost(TypePost.blog, widget.currentTab.key) ==
//         null) return;
//     currentPost =
//         StorePost.instance.getPost(TypePost.blog, widget.currentTab.key);
//     setState(() {});
//   }

//   fetchNextPage() async {
//     if (StorePost.instance.getPost(TypePost.blog, widget.currentTab.key) ==
//         null) return;
//     await currentPost!.fetchNextPage();
//     setState(() {});
//   }

//   _onSearchChanged(String query) {
//     if (_debounce?.isActive ?? false) _debounce?.cancel();
//     _debounce = Timer(const Duration(milliseconds: 500), () {});
//   }

//   @override
//   void dispose() {
//     _scrollController.dispose();
//     super.dispose();
//   }

//   @override
//   Widget build(BuildContext context) {
//     if (currentPost == null) return CircularProgressIndicator();
//     if ((currentPost!.datas?.length ?? 0) == 0)
//       return WidgetCommon.noDataView(context);
//     return ListView.builder(
//         shrinkWrap: true,
//         controller: _scrollController,
//         itemCount: currentPost!.datas!.length,
//         itemBuilder: (context, index) {
//           return Text(currentPost!.datas![index].title);
//         });
//   }
// }
