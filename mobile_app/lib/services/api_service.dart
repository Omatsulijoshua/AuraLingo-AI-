import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // Use 10.0.2.2 for Android Emulator, localhost for iOS simulator/web
  static const String _baseUrl = 'https://bandup-ielts.onrender.com/api';
  
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  String? _accessToken;
  String? _refreshToken;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _accessToken = prefs.getString('accessToken');
    _refreshToken = prefs.getString('refreshToken');
  }

  Future<void> setTokens(String access, String refresh) async {
    _accessToken = access;
    _refreshToken = refresh;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('accessToken', access);
    await prefs.setString('refreshToken', refresh);
  }

  Future<void> clearTokens() async {
    _accessToken = null;
    _refreshToken = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('accessToken');
    await prefs.remove('refreshToken');
    await prefs.remove('user');
  }

  Future<String?> getAccessToken() async {
    if (_accessToken == null) {
      final prefs = await SharedPreferences.getInstance();
      _accessToken = prefs.getString('accessToken');
    }
    return _accessToken;
  }

  Future<String?> getRefreshToken() async {
    if (_refreshToken == null) {
      final prefs = await SharedPreferences.getInstance();
      _refreshToken = prefs.getString('refreshToken');
    }
    return _refreshToken;
  }

  Future<bool> refreshTokens() async {
    final refresh = await getRefreshToken();
    if (refresh == null) return false;

    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/auth/refresh'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': refresh}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await setTokens(data['accessToken'], data['refreshToken']);
        return true;
      }
    } catch (_) {}
    
    await clearTokens();
    return false;
  }

  Future<http.Response> request({
    required String path,
    required String method,
    Map<String, String>? headers,
    Object? body,
    bool isRetry = false,
  }) async {
    final token = await getAccessToken();
    final Map<String, String> requestHeaders = {
      'Content-Type': 'application/json',
      ...?headers,
    };

    if (token != null) {
      requestHeaders['Authorization'] = 'Bearer $token';
    }

    final uri = Uri.parse('$_baseUrl$path');
    http.Response response;

    try {
      if (method.toUpperCase() == 'POST') {
        response = await http.post(uri, headers: requestHeaders, body: body);
      } else if (method.toUpperCase() == 'PUT') {
        response = await http.put(uri, headers: requestHeaders, body: body);
      } else if (method.toUpperCase() == 'DELETE') {
        response = await http.delete(uri, headers: requestHeaders, body: body);
      } else {
        response = await http.get(uri, headers: requestHeaders);
      }
    } catch (e) {
      throw SocketException('Network error occurred: $e');
    }

    if (response.statusCode == 401 && !isRetry) {
      final refreshed = await refreshTokens();
      if (refreshed) {
        return request(
          path: path,
          method: method,
          headers: headers,
          body: body,
          isRetry: true,
        );
      }
    }

    return response;
  }
}
