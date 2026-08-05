import 'dart:async';
import 'package:flutter/material.dart';
import '../services/language_ai_service.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  int step = 1;
  String selectedTargetLang = 'Spanish';
  String selectedNativeLang = 'English';
  String selectedGoal = 'Career Advancement';
  String selectedLevel = 'B1';
  int dailyMinutes = 20;

  bool isGenerating = false;
  double genProgress = 0.0;

  final List<Map<String, String>> targetLanguages = [
    {'name': 'Spanish', 'flag': '🇪🇸', 'native': 'Español'},
    {'name': 'French', 'flag': '🇫🇷', 'native': 'Français'},
    {'name': 'German', 'flag': '🇩🇪', 'native': 'Deutsch'},
    {'name': 'Mandarin', 'flag': '🇨🇳', 'native': '中文'},
    {'name': 'English', 'flag': '🇬🇧', 'native': 'English'},
    {'name': 'Japanese', 'flag': '🇯🇵', 'native': '日本語'},
  ];

  final List<String> goals = [
    'Career Advancement',
    'Relocation & Living',
    'Travel & Exploration',
    'Language Certification',
    'Dating & Social',
    'Casual Fluency'
  ];

  final List<String> cefrLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  void _nextStep() {
    if (step < 5) {
      setState(() => step++);
    } else if (step == 5) {
      setState(() {
        step = 6;
        isGenerating = true;
      });

      Timer.periodic(const Duration(milliseconds: 400), (timer) {
        if (!mounted) {
          timer.cancel();
          return;
        }
        setState(() {
          genProgress += 0.2;
          if (genProgress >= 1.0) {
            timer.cancel();
            isGenerating = false;
            LanguageAIService.profile.targetLanguage = selectedTargetLang;
            LanguageAIService.profile.nativeLanguage = selectedNativeLang;
            LanguageAIService.profile.goal = selectedGoal;
            LanguageAIService.profile.cefrLevel = selectedLevel;
            LanguageAIService.profile.dailyMinutes = dailyMinutes;
            LanguageAIService.profile.isOnboarded = true;
          }
        });
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF050E1A),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFD4AF37),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Text(
                'LP',
                style: TextStyle(
                  color: Color(0xFF0B1E36),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(width: 10),
            const Text(
              'LinguaPulse AI',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ],
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            children: [
              if (step <= 5) ...[
                LinearProgressIndicator(
                  value: step / 5.0,
                  backgroundColor: const Color(0xFF1E3E6E),
                  valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFD4AF37)),
                ),
                const SizedBox(height: 20),
              ],
              Expanded(
                child: _buildStepContent(),
              ),
              if (step <= 5)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    if (step > 1)
                      TextButton(
                        onPressed: () => setState(() => step--),
                        child: const Text('Back', style: TextStyle(color: Colors.white70)),
                      )
                    else
                      const SizedBox(),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFD4AF37),
                        foregroundColor: const Color(0xFF0B1E36),
                        padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: _nextStep,
                      child: Text(
                        step == 5 ? 'Synthesize AI Curriculum ✨' : 'Continue →',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStepContent() {
    if (step == 1) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Target Language Goal',
            style: TextStyle(color: Color(0xFFD4AF37), fontWeight: FontWeight.bold, fontSize: 12),
          ),
          const SizedBox(height: 6),
          const Text(
            'Which language do you want to master?',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 22),
          ),
          const SizedBox(height: 20),
          Expanded(
            child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 1.3,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
              ),
              itemCount: targetLanguages.length,
              itemBuilder: (context, index) {
                final lang = targetLanguages[index];
                final isSelected = selectedTargetLang == lang['name'];
                return GestureDetector(
                  onTap: () => setState(() => selectedTargetLang = lang['name']!),
                  child: Container(
                    decoration: BoxDecoration(
                      color: isSelected ? const Color(0xFF1E3E6E) : const Color(0xFF0B1E36),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isSelected ? const Color(0xFFD4AF37) : Colors.white12,
                        width: isSelected ? 2 : 1,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(lang['flag']!, style: const TextStyle(fontSize: 32)),
                        const SizedBox(height: 6),
                        Text(
                          lang['name']!,
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          lang['native']!,
                          style: const TextStyle(color: Colors.white54, fontSize: 10),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      );
    } else if (step == 2) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Native Background',
            style: TextStyle(color: Color(0xFFD4AF37), fontWeight: FontWeight.bold, fontSize: 12),
          ),
          const SizedBox(height: 6),
          const Text(
            'What is your mother tongue?',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 22),
          ),
          const SizedBox(height: 20),
          Expanded(
            child: ListView.builder(
              itemCount: 6,
              itemBuilder: (context, index) {
                final langs = ['English', 'Spanish', 'French', 'German', 'Yoruba', 'Mandarin'];
                final lang = langs[index];
                final isSelected = selectedNativeLang == lang;
                return ListTile(
                  title: Text(lang, style: TextStyle(color: isSelected ? const Color(0xFFD4AF37) : Colors.white, fontWeight: FontWeight.bold)),
                  trailing: isSelected ? const Icon(Icons.check_circle, color: Color(0xFFD4AF37)) : null,
                  onTap: () => setState(() => selectedNativeLang = lang),
                );
              },
            ),
          ),
        ],
      );
    } else if (step == 3) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Learning Motivation',
            style: TextStyle(color: Color(0xFFD4AF37), fontWeight: FontWeight.bold, fontSize: 12),
          ),
          const SizedBox(height: 6),
          const Text(
            'What is your primary goal?',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 22),
          ),
          const SizedBox(height: 20),
          Expanded(
            child: ListView.builder(
              itemCount: goals.length,
              itemBuilder: (context, index) {
                final g = goals[index];
                final isSelected = selectedGoal == g;
                return Card(
                  color: isSelected ? const Color(0xFF1E3E6E) : const Color(0xFF0B1E36),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                    side: BorderSide(color: isSelected ? const Color(0xFFD4AF37) : Colors.white12),
                  ),
                  child: ListTile(
                    title: Text(g, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    trailing: isSelected ? const Icon(Icons.check_circle, color: Color(0xFFD4AF37)) : null,
                    onTap: () => setState(() => selectedGoal = g),
                  ),
                );
              },
            ),
          ),
        ],
      );
    } else if (step == 4) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'CEFR Level Self-Assessment',
            style: TextStyle(color: Color(0xFFD4AF37), fontWeight: FontWeight.bold, fontSize: 12),
          ),
          const SizedBox(height: 6),
          const Text(
            'Current proficiency level',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 22),
          ),
          const SizedBox(height: 20),
          Expanded(
            child: ListView.builder(
              itemCount: cefrLevels.length,
              itemBuilder: (context, index) {
                final lvl = cefrLevels[index];
                final isSelected = selectedLevel == lvl;
                return Card(
                  color: isSelected ? const Color(0xFFD4AF37) : const Color(0xFF0B1E36),
                  child: ListTile(
                    title: Text(
                      'CEFR Level $lvl',
                      style: TextStyle(color: isSelected ? const Color(0xFF0B1E36) : Colors.white, fontWeight: FontWeight.bold),
                    ),
                    onTap: () => setState(() => selectedLevel = lvl),
                  ),
                );
              },
            ),
          ),
        ],
      );
    } else if (step == 5) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Daily Routine',
            style: TextStyle(color: Color(0xFFD4AF37), fontWeight: FontWeight.bold, fontSize: 12),
          ),
          const SizedBox(height: 6),
          const Text(
            'Set your commitment',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 22),
          ),
          const SizedBox(height: 30),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [15, 20, 30].map((mins) {
              final isSel = dailyMinutes == mins;
              return ChoiceChip(
                label: Text('$mins mins/day', style: TextStyle(color: isSel ? const Color(0xFF0B1E36) : Colors.white)),
                selected: isSel,
                selectedColor: const Color(0xFFD4AF37),
                backgroundColor: const Color(0xFF0B1E36),
                onSelected: (_) => setState(() => dailyMinutes = mins),
              );
            }).toList(),
          ),
        ],
      );
    } else {
      return Center(
        child: isGenerating
            ? Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFD4AF37))),
                  const SizedBox(height: 20),
                  const Text('Synthesizing AI Language Curriculum...', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 10),
                  Text('${(genProgress * 100).toInt()}%', style: const TextStyle(color: Color(0xFFD4AF37), fontSize: 20, fontWeight: FontWeight.bold)),
                ],
              )
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.stars, color: Color(0xFF10B981), size: 64),
                  const SizedBox(height: 20),
                  const Text('AI Coach Ready!', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 24)),
                  const SizedBox(height: 10),
                  Text('Your 24/7 AI tutor in $selectedTargetLang ($selectedLevel) is configured.', textAlign: TextAlign.center, style: const TextStyle(color: Colors.white70)),
                  const SizedBox(height: 30),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFD4AF37),
                      foregroundColor: const Color(0xFF0B1E36),
                      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Enter AI Language Coach Hub →', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
      );
    }
  }
}
