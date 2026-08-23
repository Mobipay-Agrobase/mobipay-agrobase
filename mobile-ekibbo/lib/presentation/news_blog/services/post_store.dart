import 'package:agrobase_ekibbo/domain/core/fetch_data/fetching_next_page.dart';
import 'package:agrobase_ekibbo/domain/core/fetch_data/models/base_nextpage_model.dart';
import 'package:agrobase_ekibbo/infrastructure/remote_data/api_data/api_news_blog.dart';
import 'package:agrobase_ekibbo/models/blog_news/post_sub_response.dart';
import 'package:agrobase_ekibbo/models/blog_news/tab_tag_model.dart';

enum TypePost { blog, news, market }

class StorePost {
  StorePost._privateConstructor();
  static final StorePost instance = StorePost._privateConstructor();

  final postBlogs = <String, FBlogData>{};
  final postNews = <String, FBlogData>{};
  final postMarket = <String, FBlogData>{};

  List<MTabTag>? blogCategories;
  List<MTabTag>? newsCategories;
  List<MTabTag>? marketCategories;

  initFetch(TypePost typePost, String key) async {
    switch (typePost) {
      case TypePost.blog:
        if (postBlogs[key] == null) {
          postBlogs[key] = FBlogData(slug: key, type: typePost);
        }
        await postBlogs[key]!.initFetch();
      case TypePost.news:
        if (postNews[key] == null) {
          postNews[key] = FBlogData(slug: key, type: typePost);
        }
        await postNews[key]!.initFetch();
      case TypePost.market:
        if (postMarket[key] == null) {
          postMarket[key] = FBlogData(slug: key, type: typePost);
        }
        await postMarket[key]!.initFetch();
      default:
        return null;
    }
  }

  FBlogData? getPost(TypePost typePost, String key) {
    switch (typePost) {
      case TypePost.blog:
        if (postBlogs[key] == null) return null;
        return postBlogs[key];
      case TypePost.news:
        if (postNews[key] == null) return null;
        return postNews[key];
      case TypePost.market:
        if (postMarket[key] == null) return null;
        return postMarket[key];
      default:
        return null;
    }
  }

  List<MTabTag> getPostCategories(TypePost typePost) {
    switch (typePost) {
      case TypePost.blog:
        return blogCategories ?? [];
      case TypePost.news:
        return newsCategories ?? [];
      case TypePost.market:
        return marketCategories ?? [];
      default:
        return [];
    }
  }

  Future<List<MTabTag>> fetchPostCategories(TypePost typePost) async {
    switch (typePost) {
      case TypePost.blog:
        return fetchBlogCategories();
      case TypePost.news:
        return fetchNewsCategories();
      case TypePost.market:
        return fetchMarketCategories();
      default:
        return [];
    }
  }

  Future<List<MTabTag>> fetchBlogCategories() async {
    if (blogCategories == null) {
      final res = await ApiNewsBlog.fetchCategoryBlog();
      if (res != null) {
        blogCategories = res.map((e) => MTabTag(e.slug, e.name)).toList();
      }
    }
    return blogCategories ?? [];
  }

  Future<List<MTabTag>> fetchNewsCategories() async {
    if (newsCategories == null) {
      final res = await ApiNewsBlog.fetchCategoryNews();
      if (res != null) {
        newsCategories = res.map((e) => MTabTag(e.slug, e.name)).toList();
      }
    }
    return newsCategories ?? [];
  }

  Future<List<MTabTag>> fetchMarketCategories() async {
    if (marketCategories == null) {
      final res = await ApiNewsBlog.fetchCategoryMarket();
      if (res != null) {
        marketCategories = res.map((e) => MTabTag(e.slug, e.name)).toList();
      }
    }
    return marketCategories ?? [];
  }
}

class FBlogData extends FetchingNextPage<MPostSub> {
  final String slug;
  final TypePost type;
  String keySearch = '';

  FBlogData({required this.slug, required this.type});

  search(String query) async {
    keySearch = query;
    clear();
    await initFetch();
  }

  @override
  Future<MBaseNextPage<MPostSub>?> getApiNextPage() async {
    switch (type) {
      case TypePost.blog:
        return await ApiNewsBlog.fetchListBlog(slug, keySearch, ++currentPage);
      case TypePost.news:
        return await ApiNewsBlog.fetchListNews(slug, keySearch, ++currentPage);
      case TypePost.market:
        return await ApiNewsBlog.fetchListMarket(
            slug, keySearch, ++currentPage);
      default:
        return null;
    }
  }
}
