import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'providers/auth_provider.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';

void main() {
  runApp(
    const ProviderScope(
      child: MyApp(),
    ),
  );
}

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return MaterialApp(
      title: 'BandUp IELTS',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xFF0B1E36),
        scaffoldBackgroundColor: const Color(0xFF050E1A),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFD4AF37),
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      home: authState.isAuthenticated 
          ? const DashboardScreen() 
          : const LoginScreen(),
    );
  }
}
