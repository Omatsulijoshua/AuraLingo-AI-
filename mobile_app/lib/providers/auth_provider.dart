import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

class AuthState {
  final bool isAuthenticated;
  final bool isLoading;
  final String? errorMessage;
  final Map<String, dynamic>? user;

  AuthState({
    this.isAuthenticated = false,
    this.isLoading = false,
    this.errorMessage,
    this.user,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isLoading,
    String? errorMessage,
    Map<String, dynamic>? user,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
      user: user ?? this.user,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiService _apiService = ApiService();

  AuthNotifier() : super(AuthState()) {
    _loadUser();
  }

  Future<void> _loadUser() async {
    state = state.copyWith(isLoading: true);
    await _apiService.init();
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    
    final accessToken = await _apiService.getAccessToken();
    if (userStr != null && accessToken != null) {
      state = AuthState(
        isAuthenticated: true,
        user: jsonDecode(userStr),
      );
    } else {
      state = AuthState(isAuthenticated: false);
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final response = await _apiService.request(
        path: '/auth/login',
        method: 'POST',
        body: jsonEncode({'email': email, 'password': password}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await _apiService.setTokens(data['accessToken'], data['refreshToken']);
        
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('user', jsonEncode(data['user']));
        
        state = AuthState(
          isAuthenticated: true,
          user: data['user'],
        );
        return true;
      } else {
        final data = jsonDecode(response.body);
        state = state.copyWith(
          isLoading: false,
          errorMessage: data['message'] ?? 'Login failed',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Network error. Please try again.',
      );
      return false;
    }
  }

  Future<bool> register({
    required String name,
    required String email,
    required String password,
    required String targetExam,
  }) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final response = await _apiService.request(
        path: '/auth/register',
        method: 'POST',
        body: jsonEncode({
          'name': name,
          'email': email,
          'password': password,
          'targetExam': targetExam,
        }),
      );

      if (response.statusCode == 201) {
        state = state.copyWith(isLoading: false);
        return true;
      } else {
        final data = jsonDecode(response.body);
        state = state.copyWith(
          isLoading: false,
          errorMessage: data['message'] ?? 'Registration failed',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Network error. Please try again.',
      );
      return false;
    }
  }

  Future<void> logout() async {
    await _apiService.clearTokens();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('user');
    state = AuthState(isAuthenticated: false);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
