import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'package:url_launcher/url_launcher.dart';
import '../widgets/times_up_dialog.dart';

class MockExamsScreen extends StatefulWidget {
  const MockExamsScreen({super.key});

  @override
  State<MockExamsScreen> createState() => _MockExamsScreenState();
}

class _MockExamsScreenState extends State<MockExamsScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _responseController = TextEditingController();
  final TextEditingController _aiInputController = TextEditingController();

  List<dynamic> _mockTests = [];
  bool _loading = true;
  dynamic _activeAttempt;
  int _timeLeft = 0;
  Timer? _timer;
  bool _timerActive = false;
  bool _submitting = false;
  int _currentSectionIndex = 0;

  // Real-time AI Assistant Panel state
  final List<Map<String, String>> _aiHistory = [];
  bool _aiLoading = false;

  // Detailed Corrections view state
  bool _viewingCorrections = false;
  dynamic _correctionsData;
  int _correctionsSectionIndex = 0;
  String _correctionsTab = 'QUESTIONS'; // QUESTIONS or AI_REPORT

  String _timeSetting = 'STANDARD';

  @override
  void initState() {
    super.initState();
    _fetchMockTests();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _responseController.dispose();
    _aiInputController.dispose();
    super.dispose();
  }

  Future<void> _fetchMockTests() async {
    try {
      final response = await _apiService.request(path: '/mock-tests', method: 'GET');
      if (response.statusCode == 200) {
        setState(() {
          _mockTests = jsonDecode(response.body);
        });
      }
    } catch (e) {
      debugPrint('Error fetching mock tests: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _startTest(String testId, String mode) async {
    setState(() => _loading = true);
    _aiHistory.clear();
    try {
      final response = await _apiService.request(
        path: '/mock-tests/$testId/start',
        method: 'POST',
        body: jsonEncode({
          'mode': mode,
        }),
      );
      if (response.statusCode == 201 || response.statusCode == 200) {
        final attempt = jsonDecode(response.body);
        setState(() {
          _activeAttempt = attempt;
          _currentSectionIndex = 0;
          _responseController.clear();
          _timeSetting = 'STANDARD';
          
          final end = DateTime.parse(attempt['completedAt'] ?? DateTime.now().add(const Duration(minutes: 160)).toString());
          _timeLeft = end.difference(DateTime.now()).inSeconds;
          _timerActive = true;
        });
        _startTimer();
      }
    } catch (e) {
      debugPrint('Error starting test: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _startPracticeTest(
    String testId, 
    String difficulty, 
    String timeLimit, 
    bool aiAssist, 
    int baseDuration
  ) async {
    setState(() => _loading = true);
    _aiHistory.clear();
    
    int customDuration = baseDuration;
    if (timeLimit == 'EXTRA') customDuration = (baseDuration * 1.5).round();
    if (timeLimit == 'DOUBLE') customDuration = baseDuration * 2;
    if (timeLimit == 'UNTIMED') customDuration = 9999;

    try {
      final response = await _apiService.request(
        path: '/mock-tests/$testId/start',
        method: 'POST',
        body: jsonEncode({
          'customDuration': customDuration,
          'mode': 'PRACTICE',
          'difficulty': difficulty,
          'aiAssist': aiAssist,
        }),
      );
      if (response.statusCode == 201 || response.statusCode == 200) {
        final attempt = jsonDecode(response.body);
        setState(() {
          _activeAttempt = attempt;
          _currentSectionIndex = 0;
          _responseController.clear();
          _timeSetting = timeLimit;
          
          final end = DateTime.parse(attempt['completedAt'] ?? DateTime.now().add(Duration(minutes: customDuration)).toString());
          _timeLeft = end.difference(DateTime.now()).inSeconds;
          _timerActive = timeLimit != 'UNTIMED';
        });
        if (timeLimit != 'UNTIMED') {
          _startTimer();
        }
      }
    } catch (e) {
      debugPrint('Error starting practice test: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_timeLeft > 0) {
        setState(() => _timeLeft--);
      } else {
        _timer?.cancel();
        setState(() => _timerActive = false);
        showTimesUpDialog(context, _submitSection);
      }
    });
  }

  Future<void> _submitSection() async {
    if (_activeAttempt == null) return;
    setState(() => _submitting = true);

    try {
      final sections = _activeAttempt['mockTest']?['sections'] as List?;
      if (sections == null || sections.isEmpty) return;
      final section = sections[_currentSectionIndex];

      final response = await _apiService.request(
        path: '/mock-tests/attempts/${_activeAttempt['id']}/submit-section',
        method: 'POST',
        body: jsonEncode({
          'sectionId': section['id'],
          'answers': [
            {'questionId': 'section_responses', 'answerText': _responseController.text.trim()}
          ]
        }),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        if (_currentSectionIndex + 1 < sections.length) {
          setState(() {
            _currentSectionIndex++;
            _responseController.clear();
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Section submitted! Moving to next section.')),
          );
        } else {
          _timer?.cancel();
          final result = jsonDecode(response.body);
          final attempt = result['attempt'];
          final overall = result['overallBandScore'] ?? attempt?['overallBandEstimate'] ?? 6.0;

          setState(() {
            _timerActive = false;
            _activeAttempt = null;
          });

          showDialog(
            context: context,
            barrierDismissible: false,
            builder: (_) => AlertDialog(
              backgroundColor: const Color(0xFF0B1E36),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: const BorderSide(color: Color(0xFF1E3E6E)),
              ),
              title: Column(
                children: const [
                  Text(
                    '🏆 Mock Exam Completed',
                    style: TextStyle(color: Color(0xFFD4AF37), fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Your answers have been graded successfully.',
                    style: TextStyle(color: Colors.white70, fontSize: 11),
                  ),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF050E1A),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        const Text(
                          'ESTIMATED BAND SCORE',
                          style: TextStyle(color: Colors.white54, fontSize: 9, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Band $overall',
                          style: const TextStyle(color: Color(0xFFD4AF37), fontSize: 22, fontWeight: FontWeight.w900),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('🎧 Listening:', style: TextStyle(color: Colors.white70, fontSize: 12)),
                      Text('Band ${attempt?['listeningScore'] ?? 6.0}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('📖 Reading:', style: TextStyle(color: Colors.white70, fontSize: 12)),
                      Text('Band ${attempt?['readingScore'] ?? 6.0}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                    ],
                  ),
                ],
              ),
              actions: [
                Column(
                  children: [
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.pop(context);
                          _fetchCorrections(attempt['id']);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF6366F1),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        child: const Text('Review Detailed Corrections', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                      ),
                    ),
                    const SizedBox(height: 4),
                    TextButton(
                      onPressed: () {
                        Navigator.pop(context);
                        _fetchMockTests();
                      },
                      child: const Text('Return to List', style: TextStyle(color: Colors.white60, fontSize: 11)),
                    ),
                  ],
                ),
              ],
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('Error submitting section: $e');
    } finally {
      setState(() => _submitting = false);
    }
  }

  Future<void> _fetchCorrections(String attemptId) async {
    setState(() => _loading = true);
    try {
      final response = await _apiService.request(
        path: '/mock-tests/attempts/$attemptId',
        method: 'GET',
      );
      if (response.statusCode == 200) {
        setState(() {
          _correctionsData = jsonDecode(response.body);
          _viewingCorrections = true;
          _correctionsSectionIndex = 0;
          _correctionsTab = 'QUESTIONS';
        });
      }
    } catch (e) {
      debugPrint('Error fetching corrections: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _callAiAssist(String queryKey, String label) async {
    if (_activeAttempt == null) return;
    final sections = _activeAttempt['mockTest']?['sections'] as List?;
    if (sections == null || sections.isEmpty) return;
    final section = sections[_currentSectionIndex];

    setState(() {
      _aiLoading = true;
      _aiHistory.add({'role': 'user', 'text': label});
    });

    try {
      final response = await _apiService.request(
        path: '/mock-tests/attempts/${_activeAttempt['id']}/ai-assist',
        method: 'POST',
        body: jsonEncode({
          'sectionId': section['id'],
          'query': queryKey,
        }),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final result = jsonDecode(response.body);
        final responseText = '💡 ${result['tip']}\n\n👉 ${result['suggestion']}';
        setState(() {
          _aiHistory.add({'role': 'assistant', 'text': responseText});
        });
      } else {
        setState(() {
          _aiHistory.add({'role': 'assistant', 'text': 'Error: Failed to connect to AI assistant.'});
        });
      }
    } catch (e) {
      setState(() {
        _aiHistory.add({'role': 'assistant', 'text': 'Error: Failed to connect to AI assistant.'});
      });
    } finally {
      setState(() => _aiLoading = false);
    }
  }

  void _showPracticeConfigBottomSheet(String testId, String title, int baseDuration) {
    String selectedDifficulty = 'INTERMEDIATE';
    String selectedTime = 'STANDARD';
    bool isAiAssistEnabled = true;

    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF0F172A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (BuildContext bc) {
        return StatefulBuilder(
          builder: (BuildContext context, StateSetter setModalState) {
            return Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Practice Mock: $title',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Configure your practice environment options.',
                    style: TextStyle(color: Colors.white54, fontSize: 10),
                  ),
                  const SizedBox(height: 18),
                  
                  // Difficulty Selector
                  const Text('Difficulty Level', style: TextStyle(color: Color(0xFFD4AF37), fontSize: 10, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  Row(
                    children: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((d) {
                      final isSelected = selectedDifficulty == d;
                      return Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 4.0),
                          child: ChoiceChip(
                            label: Text(d.toLowerCase(), style: TextStyle(color: isSelected ? const Color(0xFF050E1A) : Colors.white70, fontSize: 10)),
                            selected: isSelected,
                            selectedColor: const Color(0xFFD4AF37),
                            backgroundColor: const Color(0xFF1E293B),
                            onSelected: (val) {
                              if (val) setModalState(() => selectedDifficulty = d);
                            },
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 14),

                  // Time limit Selector
                  const Text('Time Constraint', style: TextStyle(color: Color(0xFFD4AF37), fontSize: 10, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    dropdownColor: const Color(0xFF0F172A),
                    value: selectedTime,
                    style: const TextStyle(color: Colors.white, fontSize: 11),
                    decoration: const InputDecoration(
                      filled: true,
                      fillColor: Color(0xFF1E293B),
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      border: OutlineInputBorder(borderSide: BorderSide.none),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'STANDARD', child: Text('Standard Time')),
                      DropdownMenuItem(value: 'EXTRA', child: Text('Extra Time (+50%)')),
                      DropdownMenuItem(value: 'DOUBLE', child: Text('Double Time (2x)')),
                      DropdownMenuItem(value: 'UNTIMED', child: Text('Untimed Practice')),
                    ],
                    onChanged: (val) {
                      if (val != null) setModalState(() => selectedTime = val);
                    },
                  ),
                  const SizedBox(height: 14),

                  // AI Assist Switch
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text('Enable AI Assistant', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          SizedBox(height: 2),
                          Text('Real-time brainstorms & pacing tips', style: TextStyle(color: Colors.white54, fontSize: 9)),
                        ],
                      ),
                      Switch(
                        value: isAiAssistEnabled,
                        activeColor: const Color(0xFFD4AF37),
                        onChanged: (val) {
                          setModalState(() => isAiAssistEnabled = val);
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Launch Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        _startPracticeTest(testId, selectedDifficulty, selectedTime, isAiAssistEnabled, baseDuration);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFD4AF37),
                        foregroundColor: const Color(0xFF050E1A),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: const Text('Launch Practice Mock', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showAiAssistPanel() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF0B1E36),
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (BuildContext bc) {
        return StatefulBuilder(
          builder: (BuildContext context, StateSetter setPanelState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
                left: 20,
                right: 20,
                top: 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Text('🤖 AI Study Assistant', style: TextStyle(color: Color(0xFFD4AF37), fontWeight: FontWeight.bold, fontSize: 14)),
                      const Spacer(),
                      IconButton(
                        icon: const Icon(Icons.close, color: Colors.white54, size: 18),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Messages Area
                  Container(
                    height: 200,
                    decoration: BoxDecoration(
                      color: const Color(0xFF050E1A),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.all(10),
                    child: _aiHistory.isEmpty
                        ? const Center(
                            child: Text(
                              'Click a quick assist chip below to start!',
                              style: TextStyle(color: Colors.white54, fontSize: 10),
                            ),
                          )
                        : ListView.builder(
                            itemCount: _aiHistory.length,
                            itemBuilder: (context, index) {
                              final msg = _aiHistory[index];
                              final isUser = msg['role'] == 'user';
                              return Container(
                                margin: const EdgeInsets.only(bottom: 10),
                                alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                                child: Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: isUser ? const Color(0xFFD4AF37).withOpacity(0.15) : const Color(0xFF1E3E6E),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    msg['text'] ?? '',
                                    style: TextStyle(color: isUser ? const Color(0xFFD4AF37) : Colors.white, fontSize: 10),
                                  ),
                                ),
                              );
                            },
                          ),
                  ),
                  if (_aiLoading)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 4.0),
                      child: Text('AI is thinking...', style: TextStyle(color: Colors.white54, fontSize: 9, fontStyle: FontStyle.italic)),
                    ),
                  const SizedBox(height: 10),

                  // Quick chips
                  Wrap(
                    spacing: 8,
                    runSpacing: 4,
                    children: [
                      ActionChip(
                        backgroundColor: const Color(0xFF1E293B),
                        label: const Text('🧠 Ideas', style: TextStyle(color: Colors.white, fontSize: 9)),
                        onPressed: _aiLoading ? null : () async {
                          await _callAiAssist('brainstorm', 'Brainstorm Ideas');
                          setPanelState(() {});
                        },
                      ),
                      ActionChip(
                        backgroundColor: const Color(0xFF1E293B),
                        label: const Text('💡 Strategy', style: TextStyle(color: Colors.white, fontSize: 9)),
                        onPressed: _aiLoading ? null : () async {
                          await _callAiAssist('tackle', 'Tackle Strategy');
                          setPanelState(() {});
                        },
                      ),
                      ActionChip(
                        backgroundColor: const Color(0xFF1E293B),
                        label: const Text('🎯 Weakness', style: TextStyle(color: Colors.white, fontSize: 9)),
                        onPressed: _aiLoading ? null : () async {
                          await _callAiAssist('weakness', 'Target Weakness');
                          setPanelState(() {});
                        },
                      ),
                      ActionChip(
                        backgroundColor: const Color(0xFF1E293B),
                        label: const Text('⏱️ Pacing', style: TextStyle(color: Colors.white, fontSize: 9)),
                        onPressed: _aiLoading ? null : () async {
                          await _callAiAssist('time', 'Pacing Tip');
                          setPanelState(() {});
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Custom text query input
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _aiInputController,
                          style: const TextStyle(color: Colors.white, fontSize: 11),
                          decoration: const InputDecoration(
                            hintText: 'Ask AI custom question...',
                            hintStyle: TextStyle(color: Colors.white30),
                            isDense: true,
                            contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: _aiLoading ? null : () async {
                          final text = _aiInputController.text.trim();
                          if (text.isNotEmpty) {
                            _aiInputController.clear();
                            await _callAiAssist(text, text);
                            setPanelState(() {});
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFD4AF37),
                          foregroundColor: const Color(0xFF050E1A),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                        child: const Text('Ask', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            );
          },
        );
      },
    );
  }

  String _formatTime(int seconds) {
    if (_timeSetting == 'UNTIMED' || seconds > 5000 * 60) return 'Untimed';
    final h = seconds ~/ 3600;
    final m = (seconds % 3600) ~/ 60;
    final s = seconds % 60;
    return '${h > 0 ? '$h:' : ''}${m < 10 && h > 0 ? '0' : ''}$m:${s < 10 ? '0' : ''}$s';
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: Color(0xFF050E1A),
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFFD4AF37)),
        ),
      );
    }

    // --- VIEW DETAILED CORRECTIONS REPORT SCREEN ---
    if (_viewingCorrections && _correctionsData != null) {
      final attempt = _correctionsData;
      final mockTest = attempt['mockTest'];
      final sections = mockTest?['sections'] as List? ?? [];
      final answers = attempt['answers'] as List? ?? [];
      final currentSection = _correctionsSectionIndex < sections.length ? sections[_correctionsSectionIndex] : null;

      final isPractice = attempt['mode'] != null && attempt['mode'].toString().startsWith('PRACTICE');

      // Filter answers matching current selected section questions
      List<dynamic> sectionQuestions = [];
      if (currentSection != null) {
        if (currentSection['readingPassageId'] != null) {
          sectionQuestions = answers.where((a) => a['question']?['readingPassageId'] == currentSection['readingPassageId']).toList();
        } else if (currentSection['listeningAudioId'] != null) {
          sectionQuestions = answers.where((a) => a['question']?['listeningAudioId'] == currentSection['listeningAudioId']).toList();
        }
      }

      return Scaffold(
        backgroundColor: const Color(0xFF050E1A),
        appBar: AppBar(
          backgroundColor: const Color(0xFF0B1E36),
          title: const Text('Corrections Report', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () {
              setState(() {
                _viewingCorrections = false;
                _correctionsData = null;
              });
              _fetchMockTests();
            },
          ),
        ),
        body: Column(
          children: [
            // Overview Header Band
            Container(
              padding: const EdgeInsets.all(16),
              color: const Color(0xFF0B1E36),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(mockTest?['title'] ?? 'Mock Test Details', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                          const SizedBox(height: 2),
                          Text(isPractice ? 'Format: Practice Mock' : 'Format: Strict Exam Mock', style: const TextStyle(color: Colors.white54, fontSize: 10)),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF050E1A),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFD4AF37).withOpacity(0.2)),
                        ),
                        child: Text(
                          'Band ${attempt['overallBandEstimate'] ?? '6.0'}',
                          style: const TextStyle(color: Color(0xFFD4AF37), fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Scores details
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('🎧 Listen: Band ${attempt['listeningScore'] ?? '6.0'}', style: const TextStyle(color: Colors.white70, fontSize: 10)),
                      Text('📖 Read: Band ${attempt['readingScore'] ?? '6.0'}', style: const TextStyle(color: Colors.white70, fontSize: 10)),
                      Text('✍️ Write: Band ${attempt['writingScore'] ?? '6.5'}', style: const TextStyle(color: Colors.white70, fontSize: 10)),
                      Text('🎙️ Speak: Band ${attempt['speakingScore'] ?? '6.5'}', style: const TextStyle(color: Colors.white70, fontSize: 10)),
                    ],
                  ),
                ],
              ),
            ),

            // Tab bar selector
            Container(
              height: 42,
              color: const Color(0xFF0B1E36).withOpacity(0.5),
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                children: [
                  ...List.generate(sections.length, (idx) {
                    final isSelected = _correctionsSectionIndex == idx && _correctionsTab == 'QUESTIONS';
                    return Padding(
                      padding: const EdgeInsets.only(right: 6.0),
                      child: ActionChip(
                        backgroundColor: isSelected ? const Color(0xFFD4AF37) : const Color(0xFF1E3E6E),
                        padding: EdgeInsets.zero,
                        label: Text(
                          sections[idx]['title'] ?? '',
                          style: TextStyle(color: isSelected ? const Color(0xFF050E1A) : Colors.white70, fontSize: 9, fontWeight: FontWeight.bold),
                        ),
                        onPressed: () {
                          setState(() {
                            _correctionsSectionIndex = idx;
                            _correctionsTab = 'QUESTIONS';
                          });
                        },
                      ),
                    );
                  }),
                  if (isPractice)
                    Padding(
                      padding: const EdgeInsets.only(right: 6.0),
                      child: ActionChip(
                        backgroundColor: _correctionsTab == 'AI_REPORT' ? const Color(0xFF6366F1) : const Color(0xFF1E3E6E),
                        padding: EdgeInsets.zero,
                        label: const Text(
                          '🤖 AI Coach Report',
                          style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                        ),
                        onPressed: () {
                          setState(() {
                            _correctionsTab = 'AI_REPORT';
                          });
                        },
                      ),
                    ),
                ],
              ),
            ),

            // Correction contents
            Expanded(
              child: _correctionsTab == 'AI_REPORT'
                  ? SingleChildScrollView(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: const Color(0xFF6366F1).withOpacity(0.05),
                              border: Border.all(color: const Color(0xFF6366F1).withOpacity(0.2)),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: const [
                                    Icon(Icons.psychology, color: Color(0xFF6366F1), size: 20),
                                    SizedBox(width: 10),
                                    Text('AI Weakness Diagnosis', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                const Text(
                                  'Based on your Practice Mock, you show excellent grammatical range but lack vocabulary diversity under timed constraints. For library conversations, prioritize spelling spelling details.',
                                  style: TextStyle(color: Colors.white70, fontSize: 10, height: 1.4),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.blue.withOpacity(0.05),
                              border: Border.all(color: Colors.blue.withOpacity(0.2)),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: const [
                                    Icon(Icons.lightbulb, color: Colors.blue, size: 20),
                                    SizedBox(width: 10),
                                    Text('Tackle Strategies', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                const Text(
                                  '1. Skim the text structure before reading details.\n2. Note qualifiers like "only", "always", or "rarely" in questions.\n3. Budget exactly 1 minute per question.',
                                  style: TextStyle(color: Colors.white70, fontSize: 10, height: 1.4),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    )
                  : ListView(
                      padding: const EdgeInsets.all(20),
                      children: [
                        // Passage or transcript header
                        if (currentSection != null && currentSection['readingPassage'] != null) ...[
                          Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: const Color(0xFF0B1E36),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  currentSection['readingPassage']['title'] ?? '',
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  currentSection['readingPassage']['text'] ?? '',
                                  style: const TextStyle(color: Colors.white54, fontSize: 9, height: 1.4),
                                  maxLines: 4,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],

                        if (sectionQuestions.isEmpty)
                          const Center(
                            child: Padding(
                              padding: EdgeInsets.symmetric(vertical: 36.0),
                              child: Text('No answers recorded for this section.', style: TextStyle(color: Colors.white30, fontSize: 10)),
                            ),
                          )
                        else
                          ...List.generate(sectionQuestions.length, (idx) {
                            final ans = sectionQuestions[idx];
                            final q = ans['question'];
                            final isCorrect = ans['isCorrect'] == true;

                            final correctChoice = q['options']?.firstWhere((o) => o['isCorrect'] == true, orElse: () => null);
                            final correctTextValue = correctChoice != null 
                              ? '${correctChoice['optionLetter'] ?? ''} - ${correctChoice['optionText']}'
                              : (q['answers'] != null && q['answers'].isNotEmpty ? q['answers'][0]['correctText'] : 'N/A');

                            return Container(
                              margin: const EdgeInsets.only(bottom: 16),
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: isCorrect ? const Color(0xFF10B981).withOpacity(0.04) : const Color(0xFFEF4444).withOpacity(0.04),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: isCorrect ? const Color(0xFF10B981).withOpacity(0.15) : const Color(0xFFEF4444).withOpacity(0.15),
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text('Question ${idx + 1}', style: const TextStyle(color: Colors.white60, fontSize: 10, fontWeight: FontWeight.bold)),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: isCorrect ? const Color(0xFF10B981).withOpacity(0.1) : const Color(0xFFEF4444).withOpacity(0.1),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          isCorrect ? 'CORRECT' : 'INCORRECT',
                                          style: TextStyle(color: isCorrect ? const Color(0xFF10B981) : const Color(0xFFEF4444), fontSize: 8, fontWeight: FontWeight.bold),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Text(q['questionText'] ?? '', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                                  const SizedBox(height: 12),
                                  
                                  // Answers comparison
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            const Text('YOUR ANSWER', style: TextStyle(color: Colors.white54, fontSize: 8)),
                                            const SizedBox(height: 2),
                                            Text(ans['answerText'] ?? '[No Answer]', style: TextStyle(color: isCorrect ? const Color(0xFF10B981) : const Color(0xFFEF4444), fontSize: 10, fontWeight: FontWeight.bold)),
                                          ],
                                        ),
                                      ),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            const Text('CORRECT ANSWER', style: TextStyle(color: Colors.white54, fontSize: 8)),
                                            const SizedBox(height: 2),
                                            Text(correctTextValue, style: const TextStyle(color: Color(0xFFD4AF37), fontSize: 10, fontWeight: FontWeight.bold)),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                  
                                  if (q['explanation'] != null && q['explanation'].toString().isNotEmpty) ...[
                                    const SizedBox(height: 12),
                                    const Divider(color: Colors.white10),
                                    const SizedBox(height: 4),
                                    const Text('EXPLANATION / METHOD', style: TextStyle(color: Colors.white30, fontSize: 8, fontWeight: FontWeight.bold)),
                                    const SizedBox(height: 4),
                                    Text(q['explanation'], style: const TextStyle(color: Colors.white70, fontSize: 10, height: 1.4)),
                                  ],
                                ],
                              ),
                            );
                          }),
                      ],
                    ),
            ),
          ],
        ),
      );
    }

    // --- ACTIVE SIMULATOR VIEW ---
    if (_activeAttempt != null) {
      final test = _activeAttempt['mockTest'];
      final sections = test?['sections'] as List?;
      final section = sections != null && _currentSectionIndex < sections.length ? sections[_currentSectionIndex] : null;

      final isPractice = _activeAttempt['mode'] != null && _activeAttempt['mode'].toString().startsWith('PRACTICE');
      final isAiAssistEnabled = isPractice && _activeAttempt['mode'].toString().contains('AI:TRUE');

      return Scaffold(
        backgroundColor: const Color(0xFF050E1A),
        appBar: AppBar(
          backgroundColor: const Color(0xFF0B1E36),
          title: Text(test['title'] ?? 'Mock Exam', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
          actions: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              margin: const EdgeInsets.only(right: 12),
              alignment: Alignment.center,
              child: Text(
                '⏱️ ${_formatTime(_timeLeft)}',
                style: const TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 12),
              ),
            ),
          ],
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (section != null) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: const Color(0xFF0B1E36), borderRadius: BorderRadius.circular(12)),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        section['title'] ?? 'Exam Section',
                        style: const TextStyle(color: Color(0xFFD4AF37), fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        section['instructions'] ?? '',
                        style: const TextStyle(color: Colors.white70, fontSize: 10, fontStyle: FontStyle.italic),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Passage details
                if (section['readingPassage'] != null) ...[
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: const Color(0xFF0B1E36), borderRadius: BorderRadius.circular(12)),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          section['readingPassage']['title'] ?? 'Reading Passage',
                          style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          section['readingPassage']['text'] ?? '',
                          style: const TextStyle(color: Colors.white70, fontSize: 10, height: 1.5),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                ],

                if (section['listeningAudio'] != null) ...[
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: const Color(0xFF0B1E36), borderRadius: BorderRadius.circular(12)),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          section['listeningAudio']['title'] ?? 'Audio Track',
                          style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 12),
                        const Text('🎧 Play audio from web browser or simulator.', style: TextStyle(color: Colors.white54, fontSize: 10)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                ],

                TextField(
                  controller: _responseController,
                  maxLines: 10,
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                  decoration: const InputDecoration(
                    labelText: 'Type your answers to all questions in this section here (e.g. 1. A, 2. B)...',
                    labelStyle: TextStyle(color: Colors.white54, fontSize: 11),
                    alignLabelWithHint: true,
                    filled: true,
                    fillColor: Color(0xFF0B1E36),
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 24),

                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _submitting ? null : _submitSection,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF10B981),
                          foregroundColor: const Color(0xFF050E1A),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                        child: Text(_submitting ? 'Submitting...' : 'Submit Section', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                      ),
                    ),
                    if (isAiAssistEnabled) ...[
                      const SizedBox(width: 10),
                      ElevatedButton.icon(
                        onPressed: _showAiAssistPanel,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF6366F1),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        ),
                        icon: const Icon(Icons.psychology, size: 16),
                        label: const Text('AI Assist', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                      ),
                    ],
                  ],
                ),
                
                const SizedBox(height: 12),
                Center(
                  child: TextButton(
                    onPressed: () {
                      showDialog(
                        context: context,
                        builder: (_) => AlertDialog(
                          backgroundColor: const Color(0xFF0B1E36),
                          title: const Text('Abort Exam?', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                          content: const Text('Are you sure you want to exit the exam? Current progress will be lost.', style: TextStyle(color: Colors.white70, fontSize: 11)),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(context),
                              child: const Text('Cancel', style: TextStyle(color: Colors.white60)),
                            ),
                            TextButton(
                              onPressed: () {
                                Navigator.pop(context);
                                setState(() {
                                  _activeAttempt = null;
                                  _timer?.cancel();
                                });
                                _fetchMockTests();
                              },
                              child: const Text('Abort', style: TextStyle(color: Colors.redAccent)),
                            ),
                          ],
                        ),
                      );
                    },
                    child: const Text('Abort Exam', style: TextStyle(color: Colors.redAccent, fontSize: 11)),
                  ),
                ),
              ],
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF050E1A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B1E36),
        title: const Text('Mock Exams', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildWebRecommendationCard(),
          Expanded(
            child: _mockTests.isEmpty
                ? const Center(child: Text('No mock tests published yet.', style: TextStyle(color: Colors.white60)))
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    itemCount: _mockTests.length,
                    itemBuilder: (context, idx) {
                      final test = _mockTests[idx];
                      return Card(
                        color: const Color(0xFF0B1E36),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                          side: const BorderSide(color: Color(0xFF1E3E6E)),
                        ),
                        margin: const EdgeInsets.only(bottom: 16),
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          test['title'] ?? 'Mock Test',
                                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                                        ),
                                        const SizedBox(height: 6),
                                        Row(
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                              decoration: BoxDecoration(color: const Color(0xFF1E3E6E), borderRadius: BorderRadius.circular(4)),
                                              child: Text(
                                                test['examType'] ?? 'ACADEMIC',
                                                style: const TextStyle(color: Color(0xFFD4AF37), fontSize: 8, fontWeight: FontWeight.bold),
                                              ),
                                            ),
                                            const SizedBox(width: 10),
                                            Text(
                                              '${test['duration'] ?? 160} mins',
                                              style: const TextStyle(color: Colors.white54, fontSize: 10),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: ElevatedButton(
                                      onPressed: () => _startTest(test['id'], 'EXAM'),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: const Color(0xFFD4AF37), 
                                        foregroundColor: const Color(0xFF050E1A),
                                        padding: const EdgeInsets.symmetric(vertical: 8),
                                      ),
                                      child: const Text('Exam Mock', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: ElevatedButton(
                                      onPressed: () => _showPracticeConfigBottomSheet(test['id'], test['title'] ?? 'Mock Test', test['duration'] ?? 160),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: const Color(0xFF6366F1), 
                                        foregroundColor: Colors.white,
                                        padding: const EdgeInsets.symmetric(vertical: 8),
                                      ),
                                      child: const Text('Practice Mock', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildWebRecommendationCard() {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 20, 20, 4),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFD4AF37).withValues(alpha: 0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.15),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.computer_rounded,
                color: Color(0xFFD4AF37),
                size: 24,
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'Practice on a PC/Laptop',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFFD4AF37).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: const Color(0xFFD4AF37).withValues(alpha: 0.3)),
                ),
                child: const Text(
                  'Recommended',
                  style: TextStyle(
                    color: Color(0xFFD4AF37),
                    fontSize: 8,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text(
            'The real IELTS exam is computer-based. Practicing on a PC or laptop web browser provides a much better and more realistic simulation of the actual exam interface. You can log in using your same mobile account credentials!',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 11,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () async {
                final Uri url = Uri.parse('https://bandup-ielts-prep.vercel.app/dashboard/mock-exam');
                if (await canLaunchUrl(url)) {
                  await launchUrl(url, mode: LaunchMode.externalApplication);
                } else {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Could not open web link.')),
                    );
                  }
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFD4AF37),
                foregroundColor: const Color(0xFF0F172A),
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                padding: const EdgeInsets.symmetric(vertical: 10),
              ),
              icon: const Icon(Icons.open_in_new_rounded, size: 14),
              label: const Text(
                'Open Website Version',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
