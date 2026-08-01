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
      fetchProfile();
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
        await fetchProfile();
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
    double targetBand = 7.0,
    String? referralCode,
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
          'targetBand': targetBand,
          if (referralCode != null && referralCode.isNotEmpty) 'referralCode': referralCode,
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

  Future<bool> updateTargetBand(double targetBand) async {
    try {
      final response = await _apiService.request(
        path: '/auth/update-target-band',
        method: 'PUT',
        body: jsonEncode({'targetBand': targetBand}),
      );

      if (response.statusCode == 200) {
        if (state.user != null) {
          final updatedUser = Map<String, dynamic>.from(state.user!);
          updatedUser['targetBand'] = targetBand;
          
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('user', jsonEncode(updatedUser));
          
          state = state.copyWith(user: updatedUser);
        }
        return true;
      }
    } catch (_) {}
    return false;
  }

  Future<void> logout() async {
    await _apiService.clearTokens();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('user');
    state = AuthState(isAuthenticated: false);
  }

  Future<void> fetchProfile() async {
    try {
      final response = await _apiService.request(
        path: '/auth/profile',
        method: 'GET',
      );
      if (response.statusCode == 200) {
        var profile = jsonDecode(response.body);
        final prefs = await SharedPreferences.getInstance();
        
        // Sync pending onboarding details if any exist
        final pendingExam = prefs.getString('pendingOnboardingExam');
        if (pendingExam != null) {
          final pendingBand = prefs.getDouble('pendingOnboardingBand') ?? 7.0;
          final pendingLevel = prefs.getString('pendingOnboardingLevel') ?? 'INTERMEDIATE';
          final pendingWeaknesses = prefs.getStringList('pendingOnboardingWeaknesses') ?? [];
          final pendingCommitment = prefs.getString('pendingOnboardingCommitment') ?? '30m';
          final pendingHasBooked = prefs.getBool('pendingOnboardingHasBooked') ?? false;
          final pendingLang = prefs.getString('pendingOnboardingLang') ?? 'EN';

          final syncResponse = await _apiService.request(
            path: '/auth/onboarding',
            method: 'PUT',
            body: jsonEncode({
              'targetExam': pendingExam,
              'targetBand': pendingBand,
              'currentLevel': pendingLevel,
              'weaknesses': pendingWeaknesses,
              'studyTimeCommitment': pendingCommitment,
              'hasBookedTest': pendingHasBooked,
              'testDate': pendingHasBooked ? DateTime.now().add(const Duration(days: 60)).toIso8601String() : null,
              'preferredLanguage': pendingLang,
            }),
          );

          if (syncResponse.statusCode == 200 || syncResponse.statusCode == 201) {
            await prefs.remove('pendingOnboardingExam');
            await prefs.remove('pendingOnboardingBand');
            await prefs.remove('pendingOnboardingLevel');
            await prefs.remove('pendingOnboardingWeaknesses');
            await prefs.remove('pendingOnboardingCommitment');
            await prefs.remove('pendingOnboardingHasBooked');
            await prefs.remove('pendingOnboardingLang');

            final refetchedResponse = await _apiService.request(
              path: '/auth/profile',
              method: 'GET',
            );
            if (refetchedResponse.statusCode == 200) {
              profile = jsonDecode(refetchedResponse.body);
            }
          }
        }

        await prefs.setString('user', jsonEncode(profile));
        state = state.copyWith(user: profile);
      }
    } catch (_) {}
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
