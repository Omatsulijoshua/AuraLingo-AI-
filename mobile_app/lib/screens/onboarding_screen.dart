import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../services/localization.dart';
import 'dashboard_screen.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final ApiService _apiService = ApiService();
  final PageController _pageController = PageController();
  int _currentStep = 0;

  // Onboarding parameters
  double _targetBand = 7.0;
  String _testType = 'ACADEMIC'; // ACADEMIC or GENERAL
  bool _hasBookedTest = false;
  String _currentLevel = 'INTERMEDIATE'; // BEGINNER, INTERMEDIATE, ADVANCED
  final List<String> _selectedWeaknesses = [];
  String _studyTimeCommitment = '1h'; // 15m, 30m, 1h, 2h+
  String _selectedLang = 'EN';
  bool _isSubmitting = false;

  // Paywall plan selection
  String _selectedPlan = '12_MONTHS';

  final List<String> _weaknessesKeys = [
    'speaking_confidence',
    'reading_speed',
    'writing_structure',
    'listening_comprehension',
    'time_management',
    'vocabulary'
  ];

  @override
  void initState() {
    super.initState();
    _selectedLang = LocalizationService.currentLocale;
  }

  void _nextStep() {
    if (_currentStep < 10) {
      setState(() => _currentStep++);
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      _finishOnboarding();
    }
  }

  void _prevStep() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  Future<void> _finishOnboarding() async {
    setState(() => _isSubmitting = true);
    try {
      // 1. Submit onboarding profile settings to the backend
      await _apiService.request(
        path: '/auth/onboarding',
        method: 'PUT',
        body: jsonEncode({
          'targetExam': _testType,
          'targetBand': _targetBand,
          'currentLevel': _currentLevel,
          'weaknesses': _selectedWeaknesses,
          'studyTimeCommitment': _studyTimeCommitment,
          'hasBookedTest': _hasBookedTest,
          'testDate': _hasBookedTest ? DateTime.now().add(const Duration(days: 60)).toIso8601String() : null,
          'preferredLanguage': _selectedLang,
        }),
      );

      // 2. Lock active mock premium sub in SQLite / SharedPreferences
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('hasSeenOnboarding', true);
      await prefs.setBool('isPremium', true);

      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const DashboardScreen()),
      );
    } catch (e) {
      debugPrint('Onboarding submission failed: $e');
      // Fallback redirect if offline/development
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('hasSeenOnboarding', true);
      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const DashboardScreen()),
      );
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  // Translates keys using localization utility
  String _t(String key) => LocalizationService.translate(key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF050E1A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B1E36),
        elevation: 0,
        leading: _currentStep > 0
            ? IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.white70),
                onPressed: _prevStep,
              )
            : null,
        title: _currentStep > 0 && _currentStep < 10
            ? ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: _currentStep / 9.0,
                  backgroundColor: const Color(0xFF1E3E6E),
                  valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFD4AF37)),
                  minHeight: 6,
                ),
              )
            : const Text('IELTS Prep', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
        actions: [
          // Language picker dropdown
          if (_currentStep == 0)
            Padding(
              padding: const EdgeInsets.only(right: 8.0),
              child: DropdownButton<String>(
                value: _selectedLang,
                icon: const Icon(Icons.language, color: Color(0xFFD4AF37), size: 20),
                underline: const SizedBox(),
                dropdownColor: const Color(0xFF0B1E36),
                items: LocalizationService.languagesList.map((lang) {
                  return DropdownMenuItem<String>(
                    value: lang['code'],
                    child: Text(
                      lang['name'] ?? '',
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  );
                }).toList(),
                onChanged: (val) async {
                  if (val != null) {
                    await LocalizationService.setLocale(val);
                    setState(() => _selectedLang = val);
                  }
                },
              ),
            ),
          if (_currentStep < 10)
            TextButton(
              onPressed: _finishOnboarding,
              child: const Text('Skip', style: TextStyle(color: Colors.white54, fontSize: 12)),
            ),
        ],
      ),
      body: PageView(
        controller: _pageController,
        physics: const NeverScrollableScrollPhysics(),
        children: [
          _buildWelcomeStep(),
          _buildTargetScoreStep(),
          _buildTestTypeStep(),
          _buildTestDateStep(),
          _buildCurrentLevelStep(),
          _buildWeaknessesStep(),
          _buildStudyTimeStep(),
          _buildProjectedScoreStep(),
          _buildNotificationsStep(),
          _buildPersonalizeStep(),
          _buildPaywallStep(),
        ],
      ),
    );
  }

  // 1. Welcome Splash
  Widget _buildWelcomeStep() {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Spacer(),
          // App Logo Graphic
          Container(
            height: 120,
            width: 120,
            decoration: BoxDecoration(
              color: const Color(0xFFA3001E),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(color: const Color(0xFFA3001E).withOpacity(0.3), blurRadius: 20, spreadRadius: 5),
              ],
            ),
            alignment: Alignment.center,
            child: const Text(
              'IELTS',
              style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900),
            ),
          ),
          const SizedBox(height: 40),
          Text(
            _t('welcome_title'),
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          Text(
            _t('welcome_desc'),
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white60, fontSize: 13, height: 1.5),
          ),
          const Spacer(),
          // Rating details row card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF0B1E36),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF1E3E6E)),
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                Column(
                  children: [
                    Text('4.8 ★', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                    SizedBox(height: 4),
                    Text('Rating', style: TextStyle(color: Colors.white38, fontSize: 11)),
                  ],
                ),
                Column(
                  children: [
                    Text('300+', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                    SizedBox(height: 4),
                    Text('Mock Tests', style: TextStyle(color: Colors.white38, fontSize: 11)),
                  ],
                ),
                Column(
                  children: [
                    Text('+1.5', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                    SizedBox(height: 4),
                    Text('Avg. Band ↑', style: TextStyle(color: Colors.white38, fontSize: 11)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _nextStep,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFA3001E),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
              ),
              child: Text(_t('get_started'), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  // 2. Target Band Score Selection
  Widget _buildTargetScoreStep() {
    final List<double> bands = [5.5, 6.0, 6.5, 7.0, 7.5, 8.0];
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          Text(_t('target_score_title'), style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(_t('target_score_desc'), style: const TextStyle(color: Colors.white54, fontSize: 13)),
          const SizedBox(height: 40),
          Expanded(
            child: ListView.builder(
              itemCount: bands.length,
              itemBuilder: (context, idx) {
                final band = bands[idx];
                final isSelected = _targetBand == band;
                return GestureDetector(
                  onTap: () => setState(() => _targetBand = band),
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    decoration: BoxDecoration(
                      color: isSelected ? const Color(0xFFA3001E) : const Color(0xFF0B1E36),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: isSelected ? const Color(0xFFD4AF37) : const Color(0xFF1E3E6E)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Band $band', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                        Text(
                          band >= 7.5 ? 'Expert level' : (band >= 7.0 ? 'Very good user' : 'Competent user'),
                          style: TextStyle(color: isSelected ? Colors.white70 : Colors.white30, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _nextStep,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFA3001E),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
              ),
              child: Text(_t('continue_btn'), style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  // 3. Test Type (Academic vs General)
  Widget _buildTestTypeStep() {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          Text(_t('test_type_title'), style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(_t('test_type_desc'), style: const TextStyle(color: Colors.white54, fontSize: 13)),
          const SizedBox(height: 40),

          // Academic selection Card
          GestureDetector(
            onTap: () => setState(() => _testType = 'ACADEMIC'),
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF0B1E36),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: _testType == 'ACADEMIC' ? const Color(0xFFA3001E) : const Color(0xFF1E3E6E), width: 2),
              ),
              child: Row(
                children: [
                  const Icon(Icons.school, color: Colors.blueAccent, size: 36),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(_t('academic'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                        const SizedBox(height: 4),
                        Text(_t('academic_desc'), style: const TextStyle(color: Colors.white38, fontSize: 11)),
                      ],
                    ),
                  ),
                  Radio<String>(
                    value: 'ACADEMIC',
                    groupValue: _testType,
                    activeColor: const Color(0xFFA3001E),
                    onChanged: (val) => setState(() => _testType = val!),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // General selection Card
          GestureDetector(
            onTap: () => setState(() => _testType = 'GENERAL'),
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF0B1E36),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: _testType == 'GENERAL' ? const Color(0xFFA3001E) : const Color(0xFF1E3E6E), width: 2),
              ),
              child: Row(
                children: [
                  const Icon(Icons.work, color: Colors.orangeAccent, size: 36),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(_t('general'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                        const SizedBox(height: 4),
                        Text(_t('general_desc'), style: const TextStyle(color: Colors.white38, fontSize: 11)),
                      ],
                    ),
                  ),
                  Radio<String>(
                    value: 'GENERAL',
                    groupValue: _testType,
                    activeColor: const Color(0xFFA3001E),
                    onChanged: (val) => setState(() => _testType = val!),
                  ),
                ],
              ),
            ),
          ),

          const Spacer(),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _nextStep,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFA3001E),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
              ),
              child: Text(_t('continue_btn'), style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  // 4. Test Date status booking
  Widget _buildTestDateStep() {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          Text(_t('test_date_title'), style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(_t('test_date_desc'), style: const TextStyle(color: Colors.white54, fontSize: 13)),
          const SizedBox(height: 40),

          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF0B1E36),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF1E3E6E)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(_t('booked_switch'), style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                Switch(
                  value: _hasBookedTest,
                  activeColor: const Color(0xFFD4AF37),
                  onChanged: (val) => setState(() => _hasBookedTest = val),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Informative card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFF0B1E36).withOpacity(0.5),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                const Icon(Icons.calendar_today, color: Color(0xFFD4AF37), size: 40),
                const SizedBox(height: 16),
                Text(_t('no_worries'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 8),
                Text(
                  _t('flexible_plan'),
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white54, fontSize: 12, height: 1.4),
                ),
              ],
            ),
          ),

          const Spacer(),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _nextStep,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFA3001E),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
              ),
              child: Text(_t('continue_btn'), style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  // 5. English Level selection
  Widget _buildCurrentLevelStep() {
    final levels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          Text(_t('level_title'), style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(_t('level_desc'), style: const TextStyle(color: Colors.white54, fontSize: 13)),
          const SizedBox(height: 40),

          ...levels.map((lvl) {
            final isSelected = _currentLevel == lvl;
            final String titleKey = lvl == 'BEGINNER' ? 'level_beg' : (lvl == 'INTERMEDIATE' ? 'level_int' : 'level_adv');
            final String descKey = lvl == 'BEGINNER' ? 'level_beg_desc' : (lvl == 'INTERMEDIATE' ? 'level_int_desc' : 'level_adv_desc');
            final IconData icon = lvl == 'BEGINNER' ? Icons.spa : (lvl == 'INTERMEDIATE' ? 'level_int' == titleKey ? Icons.menu_book : Icons.auto_stories : Icons.explore);
            return GestureDetector(
              onTap: () => setState(() => _currentLevel = lvl),
              child: Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFFA3001E) : const Color(0xFF0B1E36),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: isSelected ? const Color(0xFFD4AF37) : const Color(0xFF1E3E6E)),
                ),
                child: Row(
                  children: [
                    Icon(icon, color: isSelected ? Colors.white : const Color(0xFFD4AF37), size: 24),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(_t(titleKey), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                          const SizedBox(height: 4),
                          Text(_t(descKey), style: const TextStyle(color: Colors.white54, fontSize: 10)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),

          const Spacer(),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _nextStep,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFA3001E),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
              ),
              child: Text(_t('continue_btn'), style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  // 6. Stoppers Checklist
  Widget _buildWeaknessesStep() {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          Text(_t('stoppers_title'), style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(_t('stoppers_desc'), style: const TextStyle(color: Colors.white54, fontSize: 13)),
          const SizedBox(height: 30),

          Expanded(
            child: ListView.builder(
              itemCount: _weaknessesKeys.length,
              itemBuilder: (context, idx) {
                final key = _weaknessesKeys[idx];
                final labelKey = 'stop_$key';
                final isSelected = _selectedWeaknesses.contains(key);
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: isSelected ? const Color(0xFFA3001E) : const Color(0xFF0B1E36),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: isSelected ? const Color(0xFFD4AF37) : const Color(0xFF1E3E6E)),
                  ),
                  child: CheckboxListTile(
                    value: isSelected,
                    activeColor: const Color(0xFFD4AF37),
                    checkColor: const Color(0xFF050E1A),
                    title: Text(
                      _t(labelKey).isEmpty ? key.replaceAll('_', ' ') : _t(labelKey),
                      style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                    onChanged: (val) {
                      setState(() {
                        if (val == true) {
                          _selectedWeaknesses.add(key);
                        } else {
                          _selectedWeaknesses.remove(key);
                        }
                      });
                    },
                  ),
                );
              },
            ),
          ),

          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _nextStep,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFA3001E),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
              ),
              child: Text(_t('continue_btn'), style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  // 7. Study Time Daily commitment
  Widget _buildStudyTimeStep() {
    final times = ['15m', '30m', '1h', '2h+'];
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          Text(_t('study_time_title'), style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(_t('study_time_desc'), style: const TextStyle(color: Colors.white54, fontSize: 13)),
          const SizedBox(height: 40),

          ...times.map((t) {
            final isSelected = _studyTimeCommitment == t;
            final labelKey = t == '15m' ? 'time_15' : (t == '30m' ? 'time_30' : (t == '1h' ? 'time_1h' : 'time_2h'));
            final descKey = t == '15m' ? 'time_15_desc' : (t == '30m' ? 'time_30_desc' : (t == '1h' ? 'time_1h_desc' : 'time_2h_desc'));
            final icon = t == '15m' ? Icons.flash_on : (t == '30m' ? Icons.coffee : (t == '1h' ? Icons.book : Icons.rocket_launch));
            return GestureDetector(
              onTap: () => setState(() => _studyTimeCommitment = t),
              child: Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFFA3001E) : const Color(0xFF0B1E36),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: isSelected ? const Color(0xFFD4AF37) : const Color(0xFF1E3E6E)),
                ),
                child: Row(
                  children: [
                    Icon(icon, color: isSelected ? Colors.white : const Color(0xFFD4AF37)),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(_t(labelKey), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                          const SizedBox(height: 4),
                          Text(_t(descKey), style: const TextStyle(color: Colors.white54, fontSize: 10)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),

          const Spacer(),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _nextStep,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFA3001E),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
              ),
              child: Text(_t('continue_btn'), style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  // 8. Projected Score Gauge
  Widget _buildProjectedScoreStep() {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          Text(_t('projected_title'), style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(_t('projected_desc'), style: const TextStyle(color: Colors.white54, fontSize: 13)),
          const SizedBox(height: 30),

          // Custom gauge radial circle representation
          Center(
            child: Container(
              width: 160,
              height: 160,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFFA3001E), width: 10),
              ),
              alignment: Alignment.center,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('Band', style: TextStyle(color: Colors.white54, fontSize: 11)),
                  const SizedBox(height: 4),
                  Text('$_targetBand', style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 4),
                  const Text('↗ +2.5', style: TextStyle(color: Colors.greenAccent, fontSize: 12, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 32),

          Text(_t('projected_by_skill'), style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),

          // Mapped skills grid list representation
          GridView.count(
            shrinkWrap: true,
            crossAxisCount: 2,
            childAspectRatio: 2.2,
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            children: [
              _buildSkillProjectItem('Listening', _targetBand.toString(), Icons.headphones),
              _buildSkillProjectItem('Reading', _targetBand.toString(), Icons.book),
              _buildSkillProjectItem('Writing', (_targetBand - 0.5).toString(), Icons.edit),
              _buildSkillProjectItem('Speaking', (_targetBand + 0.5).toString(), Icons.mic),
            ],
          ),

          const Spacer(),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _nextStep,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFA3001E),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
              ),
              child: Text(_t('continue_btn'), style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildSkillProjectItem(String skill, String score, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF0B1E36),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF1E3E6E)),
      ),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFFD4AF37), size: 20),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(skill, style: const TextStyle(color: Colors.white70, fontSize: 11)),
              const SizedBox(height: 2),
              Text(score, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
            ],
          ),
        ],
      ),
    );
  }

  // 9. Reminders iOS popups
  Widget _buildNotificationsStep() {
    return Center(
      child: Card(
        color: const Color(0xFF0B1E36),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        margin: const EdgeInsets.all(32),
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.notifications_active, color: Color(0xFFD4AF37), size: 48),
              const SizedBox(height: 16),
              Text(
                _t('notifications_dialog'),
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
              ),
              const SizedBox(height: 8),
              const Text(
                'Notifications may include alerts, sounds, and icon badges. These can be configured in Settings.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white54, fontSize: 11, height: 1.4),
              ),
              const SizedBox(height: 24),
              const Divider(color: Color(0xFF1E3E6E)),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  TextButton(
                    onPressed: _nextStep,
                    child: Text(_t('dont_allow'), style: const TextStyle(color: Colors.blueAccent, fontSize: 13)),
                  ),
                  TextButton(
                    onPressed: _nextStep,
                    child: Text(_t('allow'), style: const TextStyle(color: Colors.blueAccent, fontWeight: FontWeight.bold, fontSize: 13)),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // 10. Personal tracking permission
  Widget _buildPersonalizeStep() {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Spacer(),
          const Icon(Icons.stars, color: Color(0xFFD4AF37), size: 64),
          const SizedBox(height: 24),
          Text(_t('personal_title'), style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Text(
            _t('personal_desc'),
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white54, fontSize: 12, height: 1.4),
          ),
          const SizedBox(height: 32),

          _buildPersonalPointRow(_t('personal_opt1'), _t('personal_opt1_desc'), Icons.auto_graph),
          const SizedBox(height: 16),
          _buildPersonalPointRow(_t('personal_opt2'), _t('personal_opt2_desc'), Icons.trending_up),
          const SizedBox(height: 16),
          _buildPersonalPointRow(_t('personal_opt3'), _t('personal_opt3_desc'), Icons.favorite),

          const Spacer(),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _nextStep,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFA3001E),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
              ),
              child: Text(_t('continue_btn'), style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildPersonalPointRow(String title, String desc, IconData icon) {
    return Row(
      children: [
        Icon(icon, color: const Color(0xFFD4AF37), size: 24),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 2),
              Text(desc, style: const TextStyle(color: Colors.white38, fontSize: 10)),
            ],
          ),
        ),
      ],
    );
  }

  // 11. Premium Paywall Selection
  Widget _buildPaywallStep() {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Center(child: Icon(Icons.workspace_premium, color: Color(0xFFD4AF37), size: 54)),
          const SizedBox(height: 16),
          Center(
            child: Text(
              _t('paywall_title'),
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 24),

          // Plan 1: 12 months at 71% off
          GestureDetector(
            onTap: () => setState(() => _selectedPlan = '12_MONTHS'),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF0B1E36),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: _selectedPlan == '12_MONTHS' ? const Color(0xFFD4AF37) : const Color(0xFF1E3E6E), width: 2),
              ),
              child: Row(
                children: [
                  Icon(_selectedPlan == '12_MONTHS' ? Icons.radio_button_checked : Icons.radio_button_off, color: const Color(0xFFD4AF37)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(_t('paywall_sub1'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                          ],
                        ),
                        const SizedBox(height: 4),
                        const Text('Only ₦5,825.00/mo', style: TextStyle(color: Colors.white54, fontSize: 11)),
                      ],
                    ),
                  ),
                  const Text('₦ 69,900.00', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Plan 2: 1 Month
          GestureDetector(
            onTap: () => setState(() => _selectedPlan = '1_MONTH'),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF0B1E36),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: _selectedPlan == '1_MONTH' ? const Color(0xFFD4AF37) : const Color(0xFF1E3E6E), width: 2),
              ),
              child: Row(
                children: [
                  Icon(_selectedPlan == '1_MONTH' ? Icons.radio_button_checked : Icons.radio_button_off, color: const Color(0xFFD4AF37)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(_t('paywall_sub2'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                        const SizedBox(height: 4),
                        const Text('Only ₦19,900.00/mo', style: TextStyle(color: Colors.white54, fontSize: 11)),
                      ],
                    ),
                  ),
                  const Text('₦ 19,900.00', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          Text(_t('included_title'), style: const TextStyle(color: Colors.white54, fontSize: 11, fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),

          // List of features included
          Expanded(
            child: ListView(
              children: [
                _buildPaywallFeatureItem(_t('inc_speaking'), _t('inc_speaking_desc'), Icons.mic),
                _buildPaywallFeatureItem(_t('inc_mock'), _t('inc_mock_desc'), Icons.assignment),
                _buildPaywallFeatureItem(_t('inc_writing'), _t('inc_writing_desc'), Icons.edit),
                _buildPaywallFeatureItem(_t('inc_plan'), _t('inc_plan_desc'), Icons.calendar_today),
                _buildPaywallFeatureItem(_t('inc_track'), _t('inc_track_desc'), Icons.show_chart),
              ],
            ),
          ),

          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : _finishOnboarding,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFA3001E),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
              ),
              child: Text(_isSubmitting ? 'Loading...' : _t('continue_btn'), style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(height: 16),
          const Center(
            child: Text(
              'Restore Purchases    •    Terms    •    Privacy',
              style: TextStyle(color: Colors.white30, fontSize: 9),
            ),
          ),
          const SizedBox(height: 10),
        ],
      ),
    );
  }

  Widget _buildPaywallFeatureItem(String title, String desc, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: const Color(0xFFA3001E), size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                const SizedBox(height: 2),
                Text(desc, style: const TextStyle(color: Colors.white54, fontSize: 9.5, height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
