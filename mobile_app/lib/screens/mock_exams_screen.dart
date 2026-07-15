import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'package:url_launcher/url_launcher.dart';

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
                    '🏆 Mock Exam Result',
                    style: TextStyle(color: Color(0xFFD4AF37), fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'All sections graded successfully!',
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
                          'OVERALL BAND SCORE',
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
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('✍️ Writing (Est.):', style: TextStyle(color: Colors.white70, fontSize: 12)),
                      Text('Band ${attempt?['writingScore'] ?? 6.5}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('🎙️ Speaking (Est.):', style: TextStyle(color: Colors.white70, fontSize: 12)),
                      Text('Band ${attempt?['speakingScore'] ?? 6.5}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                    ],
                  ),
                ],
              ),
              actions: [
                Center(
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFD4AF37),
                      foregroundColor: const Color(0xFF050E1A),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: const Text('Return to List', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
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
