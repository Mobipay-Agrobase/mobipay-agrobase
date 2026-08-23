import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:agrobase_ekibbo/components/app_bar_base.dart';
import 'package:agrobase_ekibbo/components/app_form_field.dart';
import 'package:agrobase_ekibbo/components/common.dart';
import 'package:agrobase_ekibbo/components/constant/color_constant.dart';
import 'package:agrobase_ekibbo/components/g_image.dart';
import 'package:agrobase_ekibbo/models/blog_news/post_sub_response.dart';
import 'package:agrobase_ekibbo/models/blog_news/tab_tag_model.dart';
import 'package:agrobase_ekibbo/presentation/news_blog/components/detail_post.dart';
import 'package:agrobase_ekibbo/presentation/news_blog/components/listing_tag.dart';
import 'package:agrobase_ekibbo/presentation/news_blog/services/post_store.dart';

class PostListing extends StatefulWidget {
  final String title;
  final TypePost typePost;
  const PostListing({super.key, required this.title, required this.typePost});

  @override
  State<PostListing> createState() => _ListingPostState();
}

class _ListingPostState extends State<PostListing> {
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();
  List<MTabTag>? postCategories;
  MTabTag? currentTab;
  FBlogData? currentPost;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    fetchCategories();
    _scrollController.addListener(() {
      if (_scrollController.position.pixels ==
          _scrollController.position.maxScrollExtent) {
        fetchNextPage();
      }
    });
  }

  fetchCategories() async {
    postCategories =
        await StorePost.instance.fetchPostCategories(widget.typePost);
    setState(() {});
  }

  iniFetch() async {
    if (postCategories == null) return;
    if (postCategories!.isEmpty) return;
    currentTab ??= StorePost.instance.getPostCategories(widget.typePost)[0];
    await StorePost.instance.initFetch(widget.typePost, currentTab!.key);
    if (StorePost.instance.getPost(widget.typePost, currentTab!.key) == null) {
      return;
    }
    currentPost = StorePost.instance.getPost(widget.typePost, currentTab!.key);
    //_searchController.text = currentPost?.keySearch ?? '';
    setState(() {});
  }

  fetchNextPage() async {
    if (currentTab == null) return;
    if (StorePost.instance.getPost(widget.typePost, currentTab!.key) == null) {
      return;
    }
    await currentPost!.fetchNextPage();
    setState(() {});
  }

  search(String query) async {
    if (currentPost == null) return;
    await currentPost!.search(query);
    setState(() {});
  }

  _onSearchChanged(String query) {
    if (_debounce?.isActive ?? false) _debounce?.cancel();
    _debounce = Timer(const Duration(seconds: 1), () {
      search(query);
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: BaseAppBar(
        title: widget.title,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
            child: _buildSearchView(),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
              child: _buildNavigation(),
            ),
          ),
        ],
      ),
    );
  }

  _buildNavigation() {
    if (postCategories == null) {
      return const Center(child: CircularProgressIndicator());
    }
    if (postCategories!.isEmpty) return WidgetCommon.noDataView(context);
    iniFetch();
    return Column(
      children: [
        TabView(
          listTag: postCategories!,
          tagSelected: currentTab!,
          onChanged: (value) {
            currentTab = value;
            iniFetch();
          },
        ),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child:
                currentTab == null ? const SizedBox.shrink() : _buildListPost(),
          ),
        )
      ],
    );
  }

  _buildListPost() {
    if (currentPost == null) {
      return const Center(child: CircularProgressIndicator());
    }
    if ((currentPost!.datas?.length ?? 0) == 0) {
      return WidgetCommon.noDataView(context);
    }
    return ListView.builder(
        shrinkWrap: true,
        controller: _scrollController,
        itemCount: currentPost!.datas!.length,
        itemBuilder: (context, index) {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: _buildItemPost(currentPost!.datas![index]),
          );
        });
  }

  String get route => widget.typePost == TypePost.blog
      ? 'blog'
      : widget.typePost == TypePost.news
          ? 'news'
          : 'market-intelligence';

  _buildItemPost(MPostSub item) {
    return InkWell(
      onTap: () {
        Navigator.push(context, MaterialPageRoute(builder: (context) {
          return PostDetail(
            slug: '$route/${item.slug}',
          );
        }));
      },
      child: Container(
        height: 250,
        clipBehavior: Clip.hardEdge,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: ColorConstant.greyEBEBEB,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: GInternetImage(
                width: double.maxFinite,
                borderRadius: 10,
                url: item.imageUrl,
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Text(
                item.title,
                maxLines: 2,
                style:
                    const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Text(item.dateUpdated),
            ),
          ],
        ),
      ),
    );
  }

  _buildSearchView() {
    return AppFormField(
      onChanged: _onSearchChanged,
      hint: 'Search',
      contentPadding: const EdgeInsets.only(
        left: 12,
        top: 8,
        bottom: 8,
        right: 12,
      ),
      maxLines: 1,
      controller: _searchController,
      prefixIcon: Padding(
        padding: const EdgeInsets.only(
          left: 12,
          top: 10,
          bottom: 10,
          right: 12,
        ),
        child: SvgPicture.asset(
          'ic_search'.iconSvg,
        ),
      ),
    );
  }
}
