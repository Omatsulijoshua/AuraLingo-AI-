import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class MockExamsScreen extends StatefulWidget {
  const MockExamsScreen({super.key});

  @override
  State<MockExamsScreen> createState() => _MockExamsScreenState();
}

class _MockExamsScreenState extends State<MockExamsScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _responseController = TextEditingController();

  List<dynamic> _mockTests = [];
  bool _loading = true;
  dynamic _activeAttempt;
  int _timeLeft = 0;
  Timer? _timer;
  bool _timerActive = false;
  bool _submitting = false;
  int _currentSectionIndex = 0;

  @override
  void initState() {
    super.initState();
    _fetchMockTests();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _responseController.dispose();
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

  Future<void> _startTest(String testId) async {
    setState(() => _loading = true);
    try {
      final response = await _apiService.request(
        path: '/mock-tests/$testId/start',
        method: 'POST',
      );
      if (response.statusCode == 201 || response.statusCode == 200) {
        final attempt = jsonDecode(response.body);
        setState(() {
          _activeAttempt = attempt;
          _currentSectionIndex = 0;
          _responseController.clear();
          
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

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_timeLeft > 0) {
        setState(() => _timeLeft--);
      } else {
        _timer?.cancel();
        setState(() => _timerActive = false);
        _submitSection();
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
          setState(() {
            _timerActive = false;
            _activeAttempt = null;
          });
          showDialog(
            context: context,
            builder: (_) => AlertDialog(
              title: const Text('🎉 Exam Completed!'),
              content: const Text('Your full mock exam has been submitted successfully. Grading is in progress.'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('OK'),
                ),
              ],
            ),
          );
          _fetchMockTests();
        }
      }
    } catch (e) {
      debugPrint('Error submitting section: $e');
    } finally {
      setState(() => _submitting = false);
    }
  }

  String _formatTime(int seconds) {
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

    if (_activeAttempt != null) {
      final test = _activeAttempt['mockTest'];
      final sections = test?['sections'] as List?;
      final section = sections != null && _currentSectionIndex < sections.length ? sections[_currentSectionIndex] : null;

      return Scaffold(
        backgroundColor: const Color(0xFF050E1A),
        appBar: AppBar(
          backgroundColor: const Color(0xFF0B1E36),
          title: Text(test['title'] ?? 'Mock Exam', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
          actions: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              margin: const EdgeInsets.only(right: 12),
              alignment: Alignment.center,
              child: Text(
                '⏱️ ${_formatTime(_timeLeft)}',
                style: const TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 13),
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
                        style: const TextStyle(color: Color(0xFFD4AF37), fontSize: 14, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        section['instructions'] ?? '',
                        style: const TextStyle(color: Colors.white70, fontSize: 11, fontStyle: FontStyle.italic),
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
                          style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          section['readingPassage']['text'] ?? '',
                          style: const TextStyle(color: Colors.white70, fontSize: 11, height: 1.5),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                ],

                TextField(
                  controller: _responseController,
                  maxLines: 8,
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  decoration: const InputDecoration(
                    labelText: 'Type your answers to all questions in this section here...',
                    labelStyle: TextStyle(color: Colors.white54),
                    alignLabelWithHint: true,
                    filled: true,
                    fillColor: Color(0xFF0B1E36),
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 24),

                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _submitting ? null : _submitSection,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      foregroundColor: const Color(0xFF050E1A),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: Text(_submitting ? 'Submitting...' : 'Submit Section', style: const TextStyle(fontWeight: FontWeight.bold)),
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
        title: const Text('Mock Exams', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: _mockTests.isEmpty
          ? const Center(child: Text('No mock tests published yet.', style: TextStyle(color: Colors.white60)))
          : ListView.builder(
              padding: const EdgeInsets.all(20),
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
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                test['title'] ?? 'Mock Test',
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(color: const Color(0xFF1E3E6E), borderRadius: BorderRadius.circular(4)),
                                    child: Text(
                                      test['examType'] ?? 'ACADEMIC',
                                      style: const TextStyle(color: Color(0xFFD4AF37), fontSize: 9, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Text(
                                    '${test['duration'] ?? 160} mins',
                                    style: const TextStyle(color: Colors.white54, fontSize: 11),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        ElevatedButton(
                          onPressed: () => _startTest(test['id']),
                          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFD4AF37), foregroundColor: const Color(0xFF050E1A)),
                          child: const Text('Start'),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
