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

class PlanScreen extends ConsumerStatefulWidget {
  const PlanScreen({super.key});

  @override
  ConsumerState<PlanScreen> createState() => _PlanScreenState();
}

class _PlanScreenState extends ConsumerState<PlanScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  List<dynamic> _schedule = [];
  int _selectedDayIndex = 0;

  @override
  void initState() {
    super.initState();
    _fetchSchedule();
  }

  Future<void> _fetchSchedule() async {
    try {
      final response = await _apiService.request(
        path: '/content/schedule',
        method: 'GET',
      );
      if (response.statusCode == 200) {
        setState(() {
          _schedule = jsonDecode(response.body);
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() => _isLoading = false);
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

  int _getHistoryCount(dynamic history) {
    if (history == null) return 0;
    if (history is List) return history.length;
    if (history is String) {
      try {
        final decoded = jsonDecode(history);
        if (decoded is List) return decoded.length;
      } catch (_) {}
    }
    return 0;
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return 'Oct 11, 2026';
    try {
      final date = DateTime.parse(dateStr);
      final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return '${months[date.month - 1]} ${date.day}, ${date.year}';
    } catch (_) {
      return 'Oct 11, 2026';
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    
    // Calculate total and completed tasks from the schedule
    int totalTasksCount = 0;
    int completedTasksCount = 0;
    for (final day in _schedule) {
      final tasks = day['tasks'] as List? ?? [];
      for (final task in tasks) {
        totalTasksCount++;
        if (task['completed'] == true) {
          completedTasksCount++;
        }
      }
    }
    final int weekTotal = totalTasksCount > 0 ? totalTasksCount : 23;
    final int weekCompleted = completedTasksCount;
    final int weekPercent = weekTotal > 0 ? (weekCompleted * 100 ~/ weekTotal) : 0;

    // Get completed count per module from user stats
    final int listeningDone = _getHistoryCount(user?['progressStats']?['listeningHistory']);
    final int readingDone = _getHistoryCount(user?['progressStats']?['readingHistory']);
    final int writingDone = _getHistoryCount(user?['progressStats']?['writingHistory']);
    final int speakingDone = _getHistoryCount(user?['progressStats']?['speakingHistory']);

    final String targetBand = user?['targetBand']?.toString() ?? '7.0';
    final String examDateFormatted = _formatDate(user?['testDate']);

    return Scaffold(
      backgroundColor: const Color(0xFF050E1A),
      body: SafeArea(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: Color(0xFFD4AF37)))
            : SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header Row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Your Study Plan',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        // Refresh Button
                        GestureDetector(
                          onTap: () {
                            setState(() => _isLoading = true);
                            _fetchSchedule();
                          },
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: const Color(0xFF0B1E36),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFF1E3E6E)),
                            ),
                            child: const Icon(
                              Icons.refresh_rounded,
                              color: Colors.white70,
                              size: 20,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),

                    // Badges Row
                    Row(
                      children: [
                        Icon(Icons.track_changes_rounded, color: Colors.redAccent[200], size: 16),
                        const SizedBox(width: 6),
                        Text(
                          'Band $targetBand',
                          style: TextStyle(
                            color: Colors.redAccent[200],
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(width: 16),
                        const Icon(Icons.calendar_month_rounded, color: Colors.white38, size: 16),
                        const SizedBox(width: 6),
                        Text(
                          examDateFormatted,
                          style: const TextStyle(
                            color: Colors.white38,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // 1. Module Counters Card Grid
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0B1E36),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFF1E3E6E)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _buildModuleCounterColumn('Listening', listeningDone, Icons.headset_rounded, Colors.blueAccent, Colors.blue.withOpacity(0.08)),
                          _buildModuleCounterColumn('Reading', readingDone, Icons.menu_book_rounded, Colors.purpleAccent, Colors.purple.withOpacity(0.08)),
                          _buildModuleCounterColumn('Writing', writingDone, Icons.edit_rounded, Colors.amberAccent, Colors.amber.withOpacity(0.08)),
                          _buildModuleCounterColumn('Speaking', speakingDone, Icons.mic_rounded, Colors.greenAccent, Colors.green.withOpacity(0.08)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // 2. This Week Progress Card
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0B1E36),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFF1E3E6E)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'This Week',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '$weekCompleted/$weekTotal tasks done',
                                    style: const TextStyle(
                                      color: Colors.white38,
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                              Text(
                                '$weekPercent%',
                                style: const TextStyle(
                                  color: Color(0xFFD4AF37),
                                  fontSize: 22,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: weekTotal > 0 ? (weekCompleted / weekTotal) : 0.0,
                              backgroundColor: const Color(0xFF1E3E6E),
                              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFD4AF37)),
                              minHeight: 6,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // 3. Dynamic Progress Pace Card
                    (() {
                      final int dayOfWeek = DateTime.now().weekday; // 1 = Monday, 7 = Sunday
                      final double targetPercent = (dayOfWeek / 7.0) * 100;
                      final double actualPercent = weekPercent.toDouble();

                      String paceTitle = 'Ahead of Schedule';
                      String paceSubtitle = 'Great pace — keep it up!';
                      Color paceColor = Colors.greenAccent;
                      IconData paceIcon = Icons.arrow_upward_rounded;

                      if (weekCompleted == 0) {
                        if (dayOfWeek >= 3) {
                          paceTitle = 'Behind Schedule';
                          paceSubtitle = 'You haven\'t started your tasks for this week yet.';
                          paceColor = Colors.orangeAccent;
                          paceIcon = Icons.warning_rounded;
                        } else {
                          paceTitle = 'On Track';
                          paceSubtitle = 'Start your first task for this week!';
                          paceColor = Colors.blueAccent;
                          paceIcon = Icons.play_arrow_rounded;
                        }
                      } else if (actualPercent >= targetPercent + 15) {
                        paceTitle = 'Ahead of Schedule';
                        paceSubtitle = 'Great pace — keep it up!';
                        paceColor = Colors.greenAccent;
                        paceIcon = Icons.arrow_upward_rounded;
                      } else if (actualPercent < targetPercent - 15) {
                        paceTitle = 'Behind Schedule';
                        paceSubtitle = 'Catch up on your pending tasks to stay on track.';
                        paceColor = Colors.redAccent;
                        paceIcon = Icons.warning_rounded;
                      } else {
                        paceTitle = 'On Track';
                        paceSubtitle = 'Good progress — keep it up!';
                        paceColor = Colors.greenAccent;
                        paceIcon = Icons.check_circle_outline_rounded;
                      }

                      return Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0B1E36),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFF1E3E6E)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: paceColor.withOpacity(0.08),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                paceIcon,
                                color: paceColor,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    paceTitle,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    paceSubtitle,
                                    style: const TextStyle(
                                      color: Colors.white38,
                                      fontSize: 10,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    })(),
                    const SizedBox(height: 28),

                    // 4. Schedule Section Title
                    const Text(
                      'Your Schedule',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // 5. Vertical Timeline List
                    _schedule.isEmpty
                        ? const Center(child: Text('No schedule tasks found.', style: TextStyle(color: Colors.white38)))
                        : ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: _schedule.length,
                            itemBuilder: (context, dayIdx) {
                              final day = _schedule[dayIdx];
                              final dateStr = day['date'] as String;
                              final dayLabel = day['dayLabel'] as String;
                              final dayShort = dayLabel.substring(0, 3);
                              final dayNumber = dateStr.split('-').last;

                              final tasks = day['tasks'] as List? ?? [];
                              bool isToday = false;
                              try {
                                final parsedDate = DateTime.parse(dateStr);
                                final now = DateTime.now();
                                isToday = parsedDate.year == now.year &&
                                          parsedDate.month == now.month &&
                                          parsedDate.day == now.day;
                              } catch (_) {}

                              return IntrinsicHeight(
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    // Timeline Node Column
                                    Column(
                                      children: [
                                        // Circle Date Node
                                        Container(
                                          width: 48,
                                          height: 48,
                                          decoration: BoxDecoration(
                                            color: isToday ? const Color(0xFFC62828) : const Color(0xFF0B1E36),
                                            borderRadius: BorderRadius.circular(16),
                                            border: Border.all(
                                              color: isToday ? const Color(0xFFC62828) : const Color(0xFF1E3E6E),
                                            ),
                                          ),
                                          child: Column(
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: [
                                              Text(
                                                dayShort,
                                                style: TextStyle(
                                                  color: isToday ? Colors.white70 : Colors.white38,
                                                  fontSize: 9,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                              const SizedBox(height: 2),
                                              Text(
                                                dayNumber,
                                                style: const TextStyle(
                                                  color: Colors.white,
                                                  fontSize: 14,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        // Vertical connector line
                                        if (dayIdx < _schedule.length - 1)
                                          Expanded(
                                            child: Container(
                                              width: 2,
                                              color: const Color(0xFF1E3E6E),
                                              margin: const EdgeInsets.symmetric(vertical: 4),
                                            ),
                                          ),
                                      ],
                                    ),
                                    const SizedBox(width: 16),

                                    // Tasks List for this day
                                    Expanded(
                                      child: Padding(
                                        padding: const EdgeInsets.only(bottom: 20.0),
                                        child: Column(
                                          children: tasks.map<Widget>((task) {
                                            final isCompleted = task['completed'] ?? false;
                                            final module = task['module'] ?? '';

                                            IconData icon;
                                            Color iconColor;
                                            Color iconBg;
                                            if (module == 'LISTENING') {
                                              icon = Icons.headset_rounded;
                                              iconColor = Colors.blueAccent;
                                              iconBg = Colors.blue.withOpacity(0.08);
                                            } else if (module == 'READING') {
                                              icon = Icons.menu_book_rounded;
                                              iconColor = Colors.purpleAccent;
                                              iconBg = Colors.purple.withOpacity(0.08);
                                            } else if (module == 'WRITING') {
                                              icon = Icons.edit_rounded;
                                              iconColor = Colors.amberAccent;
                                              iconBg = Colors.amber.withOpacity(0.08);
                                            } else {
                                              icon = Icons.mic_rounded;
                                              iconColor = Colors.greenAccent;
                                              iconBg = Colors.green.withOpacity(0.08);
                                            }

                                            return Container(
                                              margin: const EdgeInsets.only(bottom: 8),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFF0B1E36),
                                                borderRadius: BorderRadius.circular(16),
                                                border: Border.all(color: const Color(0xFF1E3E6E)),
                                              ),
                                              child: Material(
                                                color: Colors.transparent,
                                                child: InkWell(
                                                  borderRadius: BorderRadius.circular(16),
                                                  onTap: () => _launchTask(task),
                                                  child: Padding(
                                                    padding: const EdgeInsets.all(12.0),
                                                    child: Row(
                                                      children: [
                                                        // Icon Box
                                                        Container(
                                                          width: 38,
                                                          height: 38,
                                                          decoration: BoxDecoration(
                                                            color: iconBg,
                                                            borderRadius: BorderRadius.circular(10),
                                                          ),
                                                          child: Icon(icon, color: iconColor, size: 18),
                                                        ),
                                                        const SizedBox(width: 12),

                                                        // Task title and tags
                                                        Expanded(
                                                          child: Column(
                                                            crossAxisAlignment: CrossAxisAlignment.start,
                                                            children: [
                                                              Text(
                                                                task['title'] ?? '',
                                                                style: const TextStyle(
                                                                  color: Colors.white,
                                                                  fontWeight: FontWeight.bold,
                                                                  fontSize: 12,
                                                                ),
                                                                maxLines: 2,
                                                                overflow: TextOverflow.ellipsis,
                                                              ),
                                                              const SizedBox(height: 4),
                                                              Text(
                                                                isToday ? "Today's Task" : 'Upcoming',
                                                                style: TextStyle(
                                                                  color: isToday ? Colors.redAccent[200] : Colors.white38,
                                                                  fontSize: 9,
                                                                  fontWeight: FontWeight.bold,
                                                                ),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                        const SizedBox(width: 8),

                                                        // Status dot indicator
                                                        Container(
                                                          width: 8,
                                                          height: 8,
                                                          decoration: BoxDecoration(
                                                            color: isCompleted ? Colors.green : Colors.redAccent[200],
                                                            shape: BoxShape.circle,
                                                          ),
                                                        ),
                                                        const SizedBox(width: 8),
                                                        const Icon(
                                                          Icons.arrow_forward_ios_rounded,
                                                          color: Colors.white24,
                                                          size: 12,
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            );
                                          }).toList(),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildModuleCounterColumn(String label, int val, IconData icon, Color color, Color bgColor) {
    return Column(
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(height: 8),
        Text(
          '$val',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white38,
            fontSize: 9,
          ),
        ),
      ],
    );
  }
}
