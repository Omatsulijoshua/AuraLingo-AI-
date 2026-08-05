import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'screens/home_screen.dart';
import 'screens/voice_coach_screen.dart';
import 'screens/mistakes_screen.dart';
import 'screens/onboarding_screen.dart';

void main() {
  runApp(const AuraLingoApp());
}

class AuraLingoApp extends StatelessWidget {
  const AuraLingoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AuraLingo AI',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0F081D),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFFA855F7),
          surface: Color(0xFF180E29),
          secondary: Color(0xFFFF6B6B),
        ),
        textTheme: GoogleFonts.outfitTextTheme(ThemeData.dark().textTheme),
      ),
      home: const MainNavigationWrapper(),
    );
  }
}

class MainNavigationWrapper extends StatefulWidget {
  const MainNavigationWrapper({super.key});

  @override
  State<MainNavigationWrapper> createState() => _MainNavigationWrapperState();
}

class _MainNavigationWrapperState extends State<MainNavigationWrapper> {
  int _currentIndex = 0;

  final List<Widget> _pages = const [
    HomeScreen(),
    VoiceCoachScreen(),
    MistakesScreen(),
    OnboardingScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        backgroundColor: const Color(0xFF180E29),
        selectedItemColor: const Color(0xFFA855F7),
        unselectedItemColor: Colors.white38,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.mic), label: 'AI Voice'),
          BottomNavigationBarItem(icon: Icon(Icons.psychology), label: 'Mistakes'),
          BottomNavigationBarItem(icon: Icon(Icons.tune), label: 'Onboarding'),
        ],
      ),
    );
  }
}
