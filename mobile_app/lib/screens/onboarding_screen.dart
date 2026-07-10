import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'login_screen.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<OnboardingSlide> _slides = [
    OnboardingSlide(
      title: 'Welcome to BandUp',
      description: 'Your premium IELTS preparation partner. Access rich lessons, structured modules, and progress reports in one place.',
      icon: Icons.auto_stories_rounded,
      iconColor: const Color(0xFFD4AF37), // Gold
    ),
    OnboardingSlide(
      title: 'Real-Time AI Grading',
      description: 'Submit essays and voice recordings. Get immediate grading, detailed lexical breakdowns, and Band 9.0 rewrites.',
      icon: Icons.psychology_rounded,
      iconColor: const Color(0xFF10B981), // Emerald
    ),
    OnboardingSlide(
      title: 'Refer Friends, Earn Cash',
      description: 'Share your unique code. Earn ₦1,000 for each friend who signs up and joins our premium study plans!',
      icon: Icons.monetization_on_rounded,
      iconColor: const Color(0xFFD4AF37), // Gold
    ),
  ];

  Future<void> _completeOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('hasSeenOnboarding', true);
    if (!mounted) return;
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF050E1A), // Deep Navy
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          TextButton(
            onPressed: _completeOnboarding,
            child: const Text(
              'Skip',
              style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: PageView.builder(
              controller: _pageController,
              onPageChanged: (index) {
                setState(() => _currentPage = index);
              },
              itemCount: _slides.length,
              itemBuilder: (context, index) {
                final slide = _slides[index];
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 40.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Smooth Card for Icon
                      Container(
                        padding: const EdgeInsets.all(32),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0B1E36),
                          borderRadius: BorderRadius.circular(32),
                          border: Border.all(color: const Color(0xFF1E3E6E).withValues(alpha: 0.5)),
                          boxShadow: [
                            BoxShadow(
                              color: slide.iconColor.withValues(alpha: 0.08),
                              blurRadius: 24,
                              spreadRadius: 4,
                            ),
                          ],
                        ),
                        child: Icon(
                          slide.icon,
                          size: 72,
                          color: slide.iconColor,
                        ),
                      ),
                      const SizedBox(height: 48),
                      // Slide Title
                      Text(
                        slide.title,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.5,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      // Slide Description
                      Text(
                        slide.description,
                        style: const TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 13,
                          height: 1.6,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                );
              },
            ),
          ),

          // Bottom Bar containing page control indicators and navigations
          Padding(
            padding: const EdgeInsets.all(32.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Page Indicator Dots
                Row(
                  children: List.generate(_slides.length, (index) {
                    final isSelected = _currentPage == index;
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 250),
                      margin: const EdgeInsets.only(right: 8.0),
                      height: 8.0,
                      width: isSelected ? 24.0 : 8.0,
                      decoration: BoxDecoration(
                        color: isSelected ? const Color(0xFFD4AF37) : const Color(0xFF1E3E6E),
                        borderRadius: BorderRadius.circular(4.0),
                      ),
                    );
                  }),
                ),

                // Next / Get Started Action Button
                ElevatedButton(
                  onPressed: () {
                    if (_currentPage == _slides.length - 1) {
                      _completeOnboarding();
                    } else {
                      _pageController.nextPage(
                        duration: const Duration(milliseconds: 300),
                        curve: Curves.easeInOut,
                      );
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFD4AF37), // Gold
                    foregroundColor: const Color(0xFF050E1A),
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 4,
                  ),
                  child: Text(
                    _currentPage == _slides.length - 1 ? 'Get Started' : 'Next',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class OnboardingSlide {
  final String title;
  final String description;
  final IconData icon;
  final Color iconColor;

  OnboardingSlide({
    required this.title,
    required this.description,
    required this.icon,
    required this.iconColor,
  });
}
