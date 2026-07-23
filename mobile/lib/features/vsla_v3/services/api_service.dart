// API service — single client for all backend calls

import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'config.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  String? _token;
  Map<String, dynamic>? _user;

  String? get token => _token;
  Map<String, dynamic>? get user => _user;
  bool get isAuthenticated => _token != null;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('token');
    final userStr = prefs.getString('user');
    if (userStr != null) {
      _user = jsonDecode(userStr) as Map<String, dynamic>;
    }
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await http.post(
      Uri.parse('${Config.baseUrl}/api/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    if (res.statusCode != 200) {
      final err = jsonDecode(res.body) as Map<String, dynamic>;
      throw Exception(err['error'] ?? 'Login failed');
    }
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    _token = data['token'] as String;
    _user = data['user'] as Map<String, dynamic>;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', _token!);
    await prefs.setString('user', jsonEncode(_user));
    return data;
  }

  Future<void> logout() async {
    _token = null;
    _user = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('user');
  }

  Future<dynamic> get(String path) async {
    final res = await http.get(
      Uri.parse('${Config.baseUrl}$path'),
      headers: {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      },
    );
    return _handle(res);
  }

  Future<dynamic> post(String path, {Map<String, dynamic>? body}) async {
    final res = await http.post(
      Uri.parse('${Config.baseUrl}$path'),
      headers: {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      },
      body: body != null ? jsonEncode(body) : null,
    );
    return _handle(res);
  }

  Future<dynamic> put(String path, {Map<String, dynamic>? body}) async {
    final res = await http.put(
      Uri.parse('${Config.baseUrl}$path'),
      headers: {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      },
      body: body != null ? jsonEncode(body) : null,
    );
    return _handle(res);
  }

  Future<dynamic> delete(String path) async {
    final res = await http.delete(
      Uri.parse('${Config.baseUrl}$path'),
      headers: {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      },
    );
    return _handle(res);
  }

  dynamic _handle(http.Response res) {
    if (res.statusCode >= 400) {
      try {
        final err = jsonDecode(res.body) as Map<String, dynamic>;
        throw Exception(err['error'] ?? 'Request failed (${res.statusCode})');
      } catch (e) {
        throw Exception('Request failed (${res.statusCode})');
      }
    }
    if (res.body.isEmpty) return {};
    return jsonDecode(res.body);
  }
}
