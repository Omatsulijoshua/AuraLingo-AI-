import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/localization.dart';
import 'listening_practice_screen.dart';
import 'reading_practice_screen.dart';
import 'writing_practice_screen.dart';
import 'speaking_practice_screen.dart';

class PlanScreen extends StatefulWidget {
  const PlanScreen({super.key});

  @override
  State<PlanScreen> createState() => _PlanScreenState();
}

class _PlanScreenState extends State<PlanScreen> {
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF050E1A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B1E36),
        title: Text(_t('schedule_title'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFD4AF37)))
          : _schedule.isEmpty
              ? const Center(child: Text('No study schedule generated yet.', style: TextStyle(color: Colors.white30)))
              : Column(
                  children: [
                    // Horizontal Weekday Selector
                    Container(
                      color: const Color(0xFF0B1E36),
                      height: 80,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: _schedule.length,
                        itemBuilder: (context, idx) {
                          final day = _schedule[idx];
                          final isSelected = _selectedDayIndex == idx;
                          final dateStr = day['date'] as String;
                          final dayLabel = day['dayLabel'] as String;
                          final dayShort = dayLabel.substring(0, 3);
                          final dayNumber = dateStr.split('-').last;

                          return GestureDetector(
                            onTap: () => setState(() => _selectedDayIndex = idx),
                            child: Container(
                              width: 60,
                              margin: const EdgeInsets.symmetric(horizontal: 6, vertical: 10),
                              decoration: BoxDecoration(
                                color: isSelected ? const Color(0xFFA3001E) : Colors.transparent,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isSelected ? const Color(0xFFD4AF37) : const Color(0xFF1E3E6E),
                                ),
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(dayShort, style: TextStyle(color: isSelected ? Colors.white : Colors.white60, fontSize: 10)),
                                  const SizedBox(height: 4),
                                  Text(dayNumber, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Tasks list for selected day
                    Expanded(
                      child: (() {
                        final selectedDay = _schedule[_selectedDayIndex];
                        final tasks = selectedDay['tasks'] as List;
                        return ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: tasks.length,
                          itemBuilder: (context, idx) {
                            final task = Map<String, dynamic>.from(tasks[idx]);
                            final isCompleted = task['completed'] ?? false;
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
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: const Color(0xFF0B1E36),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: const Color(0xFF1E3E6E)),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: iconColor.withOpacity(0.1),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(icon, color: iconColor, size: 20),
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          task['title'] ?? '',
                                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 4),
                                        Row(
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: Colors.white10,
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: Text(
                                                task['type'] ?? 'Practice',
                                                style: const TextStyle(color: Colors.white70, fontSize: 9),
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            if (isCompleted)
                                              const Row(
                                                children: [
                                                  Icon(Icons.check_circle, color: Colors.green, size: 12),
                                                  SizedBox(width: 4),
                                                  Text('Completed', style: TextStyle(color: Colors.green, fontSize: 9)),
                                                ],
                                              ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.arrow_forward_ios, color: Colors.white30, size: 16),
                                    onPressed: () => _launchTask(task),
                                  ),
                                ],
                              ),
                            );
                          },
                        );
                      })(),
                    ),
                  ],
                ),
    );
  }
}
