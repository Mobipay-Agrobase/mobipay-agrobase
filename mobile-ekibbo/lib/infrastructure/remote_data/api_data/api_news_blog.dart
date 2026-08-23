import 'dart:convert';
import 'package:agrobase_ekibbo/domain/config/env_config.dart';
import 'package:agrobase_ekibbo/domain/core/fetch_data/models/base_nextpage_model.dart';
import 'package:agrobase_ekibbo/domain/core/network/api_request.dart';
import 'package:agrobase_ekibbo/models/blog_news/post_cate_response.dart';
import 'package:agrobase_ekibbo/models/blog_news/post_response.dart';
import 'package:agrobase_ekibbo/models/blog_news/post_sub_response.dart';

class ApiNewsBlog {
  static Future<MPost?> fetchBlogDetail(String slug) async {
    try {
      String url = "${EnvConfig.sellerUrl(true)}/blog-detail/$slug?lang=en}";
      final response = await ApiRequest.get(url: url);
      final result = MPostResponse.fromJson(jsonDecode(response.body));
      return result.data;
    } catch (e) {
      print("fetchBlogDetail error: $e");
      return null;
    }
  }

  static Future<MBaseNextPage<MPostSub>?> fetchListBlog(
      String slug, String keySearch, int page) async {
    try {
      String param = '?page=$page&lang=en}';
      if (slug.isNotEmpty) param += '&category=$slug';
      if (keySearch.isNotEmpty) param += '&search=$keySearch';
      String url = "${EnvConfig.sellerUrl(true)}/blog-index$param";
      final response = await ApiRequest.get(url: url);
      final result = MPostSubResponse.fromJson(jsonDecode(response.body));
      return MBaseNextPage(
          totalPage: result.data.lastPage, datas: result.data.data);
    } catch (e) {
      print("fetchListBlog error: $e");
      return null;
    }
  }

  static Future<List<MCategoryPost>?> fetchCategoryBlog() async {
    try {
      String url = "${EnvConfig.sellerUrl(true)}/blog-categories";
      final response = await ApiRequest.get(url: url);
      final result = MCategoryPostResponse.fromJson(jsonDecode(response.body));
      return result.data;
    } catch (e) {
      print("fetchCategoryBlog error: $e");
      return null;
    }
  }

  static Future<MPost?> fetchNewsDetail(String slug) async {
    try {
      String url = "${EnvConfig.sellerUrl(true)}/news-detail/$slug?lang=en}";
      final response = await ApiRequest.get(url: url);
      final result = MPostResponse.fromJson(jsonDecode(response.body));
      return result.data;
    } catch (e) {
      print("fetchNewsDetail error: $e");
      return null;
    }
  }

  static Future<MBaseNextPage<MPostSub>?> fetchListNews(
      String slug, String keySearch, int page) async {
    try {
      String param = '?page=$page&lang=en}';
      if (slug.isNotEmpty) param += '&category=$slug';
      if (keySearch.isNotEmpty) param += '&search=$keySearch';
      String url = "${EnvConfig.sellerUrl(true)}/news-index$param";
      final response = await ApiRequest.get(url: url);
      final result = MPostSubResponse.fromJson(jsonDecode(response.body));
      return MBaseNextPage(
          totalPage: result.data.lastPage, datas: result.data.data);
    } catch (e) {
      print("fetchListNews error: $e");
      return null;
    }
  }

  static Future<List<MCategoryPost>?> fetchCategoryNews() async {
    try {
      String url = "${EnvConfig.sellerUrl(true)}/news-categories";
      final response = await ApiRequest.get(url: url);
      final result = MCategoryPostResponse.fromJson(jsonDecode(response.body));
      return result.data;
    } catch (e) {
      print("fetchCategoryNews error: $e");
      return null;
    }
  }

  static Future<MPost?> fetchMarketDetail(String slug) async {
    try {
      String url = "${EnvConfig.sellerUrl(true)}/market-detail/$slug?lang=en}";
      final response = await ApiRequest.get(url: url);
      final result = MPostResponse.fromJson(jsonDecode(response.body));
      return result.data;
    } catch (e) {
      print("fetchMarketDetail error: $e");
      return null;
    }
  }

  static Future<MBaseNextPage<MPostSub>?> fetchListMarket(
      String slug, String keySearch, int page) async {
    try {
      String param = '?page=$page&lang=en}';
      if (slug.isNotEmpty) param += '&category=$slug';
      if (keySearch.isNotEmpty) param += '&search=$keySearch';
      String url = "${EnvConfig.sellerUrl(true)}/market-index$param";
      final response = await ApiRequest.get(url: url);
      final result = MPostSubResponse.fromJson(jsonDecode(response.body));
      return MBaseNextPage(
          totalPage: result.data.lastPage, datas: result.data.data);
    } catch (e) {
      print("fetchListMarket error: $e");
      return null;
    }
  }

  static Future<List<MCategoryPost>?> fetchCategoryMarket() async {
    try {
      String url = "${EnvConfig.sellerUrl(true)}/market-categories";
      final response = await ApiRequest.get(url: url);
      final result = MCategoryPostResponse.fromJson(jsonDecode(response.body));
      return result.data;
    } catch (e) {
      print("fetchCategoryMarket error: $e");
      return null;
    }
  }
}
