import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../services/localization.dart';
import 'listening_practice_screen.dart';
import 'reading_practice_screen.dart';
import 'writing_practice_screen.dart';
import 'speaking_practice_screen.dart';
import 'onboarding_screen.dart';
import 'plan_screen.dart';
import 'tools_screen.dart';
import 'history_screen.dart';
import 'settings_screen.dart';
import 'support_screen.dart';
import 'mock_exams_screen.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const HomeTabView(),
    const PlanScreen(),
    const ToolsScreen(),
    const HistoryScreen(),
    const SettingsScreen(),
  ];

  String _t(String key) => LocalizationService.translate(key);

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    if (user != null && user['currentLevel'] == null) {
      return const OnboardingScreen();
    }

    final bool isLightTheme = _currentIndex == 0 || _currentIndex == 2;

    return Scaffold(
      backgroundColor: isLightTheme ? const Color(0xFFF4F6FB) : const Color(0xFF050E1A),
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        type: BottomNavigationBarType.fixed,
        backgroundColor: isLightTheme ? Colors.white : const Color(0xFF0B1E36),
        selectedItemColor: isLightTheme ? const Color(0xFFC62828) : const Color(0xFFD4AF37),
        unselectedItemColor: isLightTheme ? Colors.black38 : Colors.white54,
        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 10),
        unselectedLabelStyle: const TextStyle(fontSize: 10),
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        items: [
          BottomNavigationBarItem(icon: const Icon(Icons.home), label: _t('menu_home')),
          BottomNavigationBarItem(icon: const Icon(Icons.calendar_month), label: _t('menu_plan')),
          BottomNavigationBarItem(icon: const Icon(Icons.construction), label: _t('menu_tools')),
          BottomNavigationBarItem(icon: const Icon(Icons.history), label: _t('menu_history')),
          BottomNavigationBarItem(icon: const Icon(Icons.settings), label: _t('menu_settings')),
        ],
      ),
    );
  }
}

class HomeTabView extends ConsumerStatefulWidget {
  const HomeTabView({super.key});

  @override
  ConsumerState<HomeTabView> createState() => _HomeTabViewState();
}

class _HomeTabViewState extends ConsumerState<HomeTabView> {
  final ApiService _apiService = ApiService();
  List<dynamic> _todayTasks = [];
  bool _isLoadingTasks = true;

  @override
  void initState() {
    super.initState();
    _fetchTodayTasks();
  }

  Future<void> _fetchTodayTasks() async {
    try {
      final response = await _apiService.request(
        path: '/content/schedule',
        method: 'GET',
      );
      if (response.statusCode == 200) {
        final schedule = jsonDecode(response.body);
        if (schedule.isNotEmpty && mounted) {
          setState(() {
            _todayTasks = schedule[0]['tasks'] ?? [];
            _isLoadingTasks = false;
          });
        }
      }
    } catch (_) {
      setState(() => _isLoadingTasks = false);
    }
  }

  String _t(String key) => LocalizationService.translate(key);

  void _launchTask(Map<String, dynamic> task) {
    final module = task['module'];
    final entityId = task['entityId'];

    if (entityId == 'practice-session') return;

    Widget targetScreen;
    if (module == 'LISTENING') {
      targetScreen = const ListeningPracticeScreen();
    } else if (module == 'READING') {
      targetScreen = const ReadingPracticeScreen();
    } else if (module == 'WRITING') {
      targetScreen = const WritingPracticeScreen();
    } else if (module == 'SPEAKING') {
      targetScreen = const SpeakingPracticeScreen();
    } else {
      return;
    }

    _navigateToPractice(targetScreen);
  }

  Future<void> _navigateToPractice(Widget screen) async {
    final dashboardState = context.findAncestorStateOfType<_DashboardScreenState>();
    final result = await Navigator.push<int>(
      context,
      MaterialPageRoute(builder: (_) => screen),
    );
    if (result != null && dashboardState != null) {
      dashboardState.setState(() {
        dashboardState._currentIndex = result;
      });
    }
  }

  String _getGreetingText() {
    final hour = DateTime.now().hour;
    if (hour < 12) {
      return 'Good Morning';
    } else if (hour < 17) {
      return 'Good Afternoon';
    } else {
      return 'Good Evening';
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final double targetBand = (user?['targetBand'] ?? 7.0) as double;
    final String level = user?['currentLevel'] ?? 'INTERMEDIATE';
    final String levelName = level == 'BEGINNER' ? _t('level_beg') : (level == 'ADVANCED' ? _t('level_adv') : 'Advance');

    // Monthly practice counter from all activities
    final int completedCount = user?['monthlyPracticesCount'] ?? 0;

    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FB),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Greeting and Chat Row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            _getGreetingText(),
                            style: const TextStyle(
                              color: Color(0xFF0F172A),
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Text(
                            '👋',
                            style: TextStyle(fontSize: 22),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        "Let's reach your goal today!",
                        style: TextStyle(
                          color: Color(0xFF64748B),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(
                      Icons.chat_bubble_outline_rounded,
                      color: Color(0xFF475569),
                      size: 24,
                    ),
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const SupportScreen()),
                      );
                    },
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Current Level Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.black.withOpacity(0.04)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.02),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    // Circle gauge widget
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        SizedBox(
                          width: 76,
                          height: 76,
                          child: CircularProgressIndicator(
                            value: 0.65, // Static matching estimation visually
                            strokeWidth: 6,
                            backgroundColor: Colors.black.withOpacity(0.05),
                            valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFC62828)), // Red/pinkish
                          ),
                        ),
                        Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              targetBand.toStringAsFixed(0),
                              style: const TextStyle(
                                color: Color(0xFF0F172A),
                                fontSize: 22,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                            const Text(
                              'Band',
                              style: TextStyle(
                                color: Color(0xFF64748B),
                                fontSize: 8,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Current Level',
                            style: TextStyle(
                              color: Color(0xFF64748B),
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            levelName,
                            style: const TextStyle(
                              color: Color(0xFF0F172A),
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Start practicing to track your level!',
                            style: TextStyle(
                              color: Color(0xFFC62828),
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 10),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: (completedCount / 308.0).clamp(0.0, 1.0),
                              minHeight: 5,
                              backgroundColor: Colors.black.withOpacity(0.05),
                              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFC62828)),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '$completedCount/308 practices',
                            style: const TextStyle(
                              color: Color(0xFF64748B),
                              fontSize: 10,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.arrow_forward_ios, color: Colors.black26, size: 14),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Mock Exam Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF0F172A).withOpacity(0.15),
                      blurRadius: 15,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFD4AF37).withOpacity(0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(
                            Icons.assignment_turned_in_rounded,
                            color: Color(0xFFD4AF37),
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'IELTS Mock Exam',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'Full Timed Simulation',
                                style: TextStyle(
                                  color: Color(0xFFD4AF37),
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    const Text(
                      'Experience the real exam environment. Complete timed Listening, Reading, Writing, and Speaking modules with direct AI band grading.',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFD4AF37),
                          foregroundColor: const Color(0xFF0F172A),
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const MockExamsScreen(),
                            ),
                          );
                        },
                        child: const Text(
                          'Start Mock Exam',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Practice Area Title
              const Text(
                'Practice Area',
                style: TextStyle(
                  color: Color(0xFF0F172A),
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),

              // 4-Grid practices area widget
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                childAspectRatio: 1.3,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                children: [
                  _buildPracticeGridItem('Speaking', Icons.mic, const Color(0xFFD4AF37), () {
                    _navigateToPractice(const SpeakingPracticeScreen());
                  }),
                  _buildPracticeGridItem('Writing', Icons.edit, Colors.amberAccent, () {
                    _navigateToPractice(const WritingPracticeScreen());
                  }),
                  _buildPracticeGridItem('Reading', Icons.book, Colors.blueAccent, () {
                    _navigateToPractice(const ReadingPracticeScreen());
                  }),
                  _buildPracticeGridItem('Listening', Icons.headset, Colors.greenAccent, () {
                    _navigateToPractice(const ListeningPracticeScreen());
                  }),
                ],
              ),
              const SizedBox(height: 24),

              // Daily practice task title widget (if available)
              if (user != null && user['dailyTasks'] != null && (user['dailyTasks'] as List).isNotEmpty) ...[
                const Text(
                  'Daily Tasks',
                  style: TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Column(
                  children: (user['dailyTasks'] as List).map<Widget>((task) {
                    IconData icon;
                    Color iconColor;
                    final String module = task['module'] ?? 'READING';
                    if (module == 'READING') {
                      icon = Icons.book;
                      iconColor = Colors.blueAccent;
                    } else if (module == 'WRITING') {
                      icon = Icons.edit;
                      iconColor = Colors.amberAccent;
                    } else {
                      icon = Icons.mic;
                      iconColor = Colors.redAccent;
                    }

                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.black.withOpacity(0.04)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.02),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Icon(icon, color: iconColor, size: 20),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  task['title'] ?? '',
                                  style: const TextStyle(
                                    color: Color(0xFF0F172A),
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 2),
                                const Text(
                                  'Daily Practice Task',
                                  style: TextStyle(
                                    color: Color(0xFF64748B),
                                    fontSize: 9,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.arrow_forward_ios, color: Colors.black26, size: 14),
                            onPressed: () => _launchTask(task),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 24),
              ],

              // Continue Learning
              const Text(
                'Continue Learning',
                style: TextStyle(
                  color: Color(0xFF0F172A),
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              _buildContinueCard(
                module: 'Listening',
                title: 'IELTS Book 10 Test 1',
                progressText: '0/44 tests completed',
                progressValue: 0.0,
                icon: Icons.headset_rounded,
                iconColor: Colors.blueAccent,
                bgColor: Colors.blue.withOpacity(0.08),
                onTap: () {
                  _navigateToPractice(const ListeningPracticeScreen());
                },
              ),
              _buildContinueCard(
                module: 'Reading',
                title: 'History/Architecture',
                progressText: '0/132 passages completed',
                progressValue: 0.0,
                icon: Icons.menu_book_rounded,
                iconColor: Colors.purpleAccent,
                bgColor: Colors.purple.withOpacity(0.08),
                onTap: () {
                  _navigateToPractice(const ReadingPracticeScreen());
                },
              ),
              _buildContinueCard(
                module: 'Writing',
                title: 'Test 1 Task 1',
                progressText: '0/88 tasks completed',
                progressValue: 0.0,
                icon: Icons.edit_rounded,
                iconColor: Colors.amberAccent,
                bgColor: Colors.amber.withOpacity(0.08),
                onTap: () {
                  _navigateToPractice(const WritingPracticeScreen());
                },
              ),
              _buildContinueCard(
                module: 'Speaking',
                title: 'IELTS Book 10 Test 1',
                progressText: '0/44 tests completed',
                progressValue: 0.0,
                icon: Icons.mic_rounded,
                iconColor: Colors.greenAccent,
                bgColor: Colors.green.withOpacity(0.08),
                onTap: () {
                  _navigateToPractice(const SpeakingPracticeScreen());
                },
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPracticeGridItem(String title, IconData icon, Color color, VoidCallback onTap) {
    Color iconColor;
    Color badgeBg;
    if (title == 'Speaking') {
      iconColor = const Color(0xFF1D4ED8);
      badgeBg = const Color(0xFFEFF6FF);
    } else if (title == 'Writing') {
      iconColor = const Color(0xFFD97706);
      badgeBg = const Color(0xFFFEF3C7);
    } else if (title == 'Reading') {
      iconColor = const Color(0xFF7C3AED);
      badgeBg = const Color(0xFFF5F3FF);
    } else {
      iconColor = const Color(0xFF059669);
      badgeBg = const Color(0xFFECFDF5);
    }

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.black.withOpacity(0.04)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: badgeBg,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: iconColor, size: 20),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 2),
                const Text(
                  'Start Practice',
                  style: TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContinueCard({
    required String module,
    required String title,
    required String progressText,
    required double progressValue,
    required IconData icon,
    required Color iconColor,
    required Color bgColor,
    required VoidCallback onTap,
  }) {
    Color badgeText;
    Color badgeBg;
    if (module == 'Speaking') {
      badgeText = const Color(0xFF1D4ED8);
      badgeBg = const Color(0xFFEFF6FF);
    } else if (module == 'Writing') {
      badgeText = const Color(0xFFD97706);
      badgeBg = const Color(0xFFFEF3C7);
    } else if (module == 'Reading') {
      badgeText = const Color(0xFF7C3AED);
      badgeBg = const Color(0xFFF5F3FF);
    } else {
      badgeText = const Color(0xFF059669);
      badgeBg = const Color(0xFFECFDF5);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.black.withOpacity(0.04)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: badgeBg,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(icon, color: badgeText, size: 22),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: badgeBg,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          module,
                          style: TextStyle(
                            color: badgeText,
                            fontSize: 8,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        title,
                        style: const TextStyle(
                          color: Color(0xFF0F172A),
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.arrow_forward_ios, color: Colors.black26, size: 14),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
