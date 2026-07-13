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
import 'plan_screen.dart';
import 'tools_screen.dart';
import 'history_screen.dart';
import 'settings_screen.dart';

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
    return Scaffold(
      backgroundColor: const Color(0xFF050E1A),
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        type: BottomNavigationBarType.fixed,
        backgroundColor: const Color(0xFF0B1E36),
        selectedItemColor: const Color(0xFFA3001E),
        unselectedItemColor: Colors.white54,
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

    Navigator.push(context, MaterialPageRoute(builder: (_) => targetScreen));
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final String greeting = DateTime.now().hour < 12 ? _t('dashboard_greeting_morning') : _t('dashboard_greeting_night');
    final double targetBand = (user?['targetBand'] ?? 7.0) as double;
    final String level = user?['currentLevel'] ?? 'INTERMEDIATE';
    final String levelName = level == 'BEGINNER' ? _t('level_beg') : (level == 'ADVANCED' ? _t('level_adv') : 'Advance');

    return Scaffold(
      backgroundColor: const Color(0xFF050E1A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B1E36),
        elevation: 0,
        title: Row(
          children: [
            const Icon(Icons.waving_hand, color: Color(0xFFD4AF37), size: 20),
            const SizedBox(width: 8),
            Text(
              '$greeting, ${user?['name'] ?? 'User'}',
              style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Current Level Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF0B1E36),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF1E3E6E)),
              ),
              child: Row(
                children: [
                  // Circle gauge widget
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFFA3001E), width: 6),
                    ),
                    alignment: Alignment.center,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('$targetBand', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900)),
                        const Text('Band', style: TextStyle(color: Colors.white54, fontSize: 8)),
                      ],
                    ),
                  ),
                  const SizedBox(width: 20),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Current Level', style: TextStyle(color: Colors.white54, fontSize: 10)),
                        const SizedBox(height: 4),
                        Text(
                          levelName,
                          style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          _t('level_sub'),
                          style: const TextStyle(color: Colors.white38, fontSize: 9),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.arrow_forward_ios, color: Colors.white24, size: 14),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Practice Area Title
            Text(_t('practice_area'), style: const TextStyle(color: Color(0xFFD4AF37), fontSize: 11, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),

            // 4-Grid practices area widget
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              childAspectRatio: 1.5,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              children: [
                _buildPracticeGridItem('Speaking', Icons.mic, const Color(0xFFA3001E), () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const SpeakingPracticeScreen()));
                }),
                _buildPracticeGridItem('Writing', Icons.edit, Colors.amberAccent, () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const WritingPracticeScreen()));
                }),
                _buildPracticeGridItem('Reading', Icons.menu_book, Colors.blueAccent, () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const ReadingPracticeScreen()));
                }),
                _buildPracticeGridItem('Listening', Icons.headphones, Colors.greenAccent, () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const ListeningPracticeScreen()));
                }),
              ],
            ),

            const SizedBox(height: 28),

            // Continue Learning Title
            Text(_t('continue_learning'), style: const TextStyle(color: Color(0xFFD4AF37), fontSize: 11, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),

            // Today's dynamic planner task entries
            _isLoadingTasks
                ? const Center(child: CircularProgressIndicator(color: Color(0xFFD4AF37)))
                : _todayTasks.isEmpty
                    ? const Center(child: Text('No daily tasks found.', style: TextStyle(color: Colors.white30, fontSize: 11)))
                    : Column(
                        children: _todayTasks.map<Widget>((t) {
                          final task = Map<String, dynamic>.from(t);
                          final module = task['module'] ?? '';

                          IconData icon;
                          Color iconColor;
                          if (module == 'LISTENING') {
                            icon = Icons.headphones;
                            iconColor = Colors.greenAccent;
                          } else if (module == 'READING') {
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
                              color: const Color(0xFF0B1E36),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFF1E3E6E)),
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
                                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 2),
                                      const Text('Daily Practice Task', style: TextStyle(color: Colors.white38, fontSize: 9)),
                                    ],
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.arrow_forward_ios, color: Colors.white24, size: 14),
                                  onPressed: () => _launchTask(task),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildPracticeGridItem(String title, IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF0B1E36),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF1E3E6E)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 10),
            Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(height: 4),
            const Text('Start Practice', style: TextStyle(color: Colors.white30, fontSize: 9)),
          ],
        ),
      ),
    );
  }
}
