import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ReadingPracticeScreen extends StatefulWidget {
  const ReadingPracticeScreen({super.key});

  @override
  State<ReadingPracticeScreen> createState() => _ReadingPracticeScreenState();
}

class _ReadingPracticeScreenState extends State<ReadingPracticeScreen> {
  final ApiService _apiService = ApiService();

  List<dynamic> _passages = [];
  dynamic _selectedPassage;
  final Map<String, String> _userAnswers = {};
  String _mode = 'PRACTICE'; // PRACTICE or EXAM
  bool _loading = true;
  bool _submitting = false;
  dynamic _feedback;
  bool _examSuccess = false;

  // Timer variables
  int _timeLeft = 1800; // 30 minutes
  Timer? _timer;
  bool _timerActive = false;

  @override
  void initState() {
    super.initState();
    _fetchPassages();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _fetchPassages() async {
    try {
      final response = await _apiService.request(
        path: '/content/passages',
        method: 'GET',
      );
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        setState(() {
          _passages = data;
          if (_passages.isNotEmpty) {
            _selectedPassage = _passages[0];
          }
        });
      }
    } catch (e) {
      debugPrint('Error fetching reading passages: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  void _startTimer() {
    setState(() {
      _timeLeft = 1800;
      _timerActive = true;
      _feedback = null;
      _examSuccess = false;
      _userAnswers.clear();
    });

    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_timeLeft > 0) {
        setState(() => _timeLeft--);
      } else {
        _timer?.cancel();
        setState(() => _timerActive = false);
        _submitAnswers();
      }
    });
  }

  Future<void> _submitAnswers() async {
    if (_selectedPassage == null) return;
    final questions = _selectedPassage['practiceQuestions'] as List? ?? [];
    if (questions.isEmpty) return;

    setState(() {
      _submitting = true;
      _timerActive = false;
    });
    _timer?.cancel();

    try {
      List<dynamic> results = [];
      int correctCount = 0;

      for (var q in questions) {
        final qId = q['id'];
        final answer = _userAnswers[qId] ?? '';
        final response = await _apiService.request(
          path: '/content/questions/$qId/submit',
          method: 'POST',
          body: jsonEncode({
            'answerText': answer.trim(),
            'mode': _mode,
          }),
        );

        if (response.statusCode == 201 || response.statusCode == 200) {
          final result = jsonDecode(response.body);
          results.add({
            'questionId': qId,
            'questionText': q['questionText'] ?? '',
            'isCorrect': result['isCorrect'],
            'correctAnswerStr': result['correctAnswerStr'] ?? q['options']?.firstWhere((o) => o['isCorrect'] == true, orElse: () => null)?['optionLetter'] ?? 'Correct',
            'explanation': q['explanation'] ?? 'No explanation available',
            'userAnswer': answer,
          });
          if (result['isCorrect'] == true) {
            correctCount++;
          }
        }
      }

      if (_mode == 'EXAM') {
        setState(() {
          _examSuccess = true;
        });
      } else {
        setState(() {
          _feedback = {
            'correctCount': correctCount,
            'totalCount': questions.length,
            'results': results,
          };
        });
      }
    } catch (e) {
      debugPrint('Error submitting answers: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to submit answers.')),
      );
    } finally {
      setState(() => _submitting = false);
    }
  }

  String _formatTime(int seconds) {
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '$m:${s < 10 ? '0' : ''}$s';
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

    return Scaffold(
      backgroundColor: const Color(0xFF050E1A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B1E36),
        title: const Text('Reading Practice', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Mode selector card
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
                  const Text('Select Practice Mode', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _timerActive ? null : () => setState(() => _mode = 'PRACTICE'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _mode == 'PRACTICE' ? const Color(0xFFD4AF37) : const Color(0xFF050E1A),
                            foregroundColor: _mode == 'PRACTICE' ? const Color(0xFF050E1A) : Colors.white,
                            side: const BorderSide(color: Color(0xFF1E3E6E)),
                          ),
                          child: const Text('Practice'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _timerActive ? null : () => setState(() => _mode = 'EXAM'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _mode == 'EXAM' ? const Color(0xFFD4AF37) : const Color(0xFF050E1A),
                            foregroundColor: _mode == 'EXAM' ? const Color(0xFF050E1A) : Colors.white,
                            side: const BorderSide(color: Color(0xFF1E3E6E)),
                          ),
                          child: const Text('Exam Mode'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            if (_passages.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 40.0),
                  child: Text('No reading passages found. Auto-spin some in the admin panel!', style: TextStyle(color: Colors.white60)),
                ),
              )
            else ...[
              // Reading passage selector dropdown
              DropdownButtonFormField<dynamic>(
                value: _selectedPassage,
                decoration: const InputDecoration(
                  labelText: 'Choose Reading Passage',
                  labelStyle: TextStyle(color: Color(0xFFD4AF37)),
                  filled: true,
                  fillColor: Color(0xFF0B1E36),
                  border: OutlineInputBorder(),
                ),
                dropdownColor: const Color(0xFF0B1E36),
                items: _passages.map((p) {
                  return DropdownMenuItem<dynamic>(
                    value: p,
                    child: SizedBox(
                      width: 250,
                      child: Text(
                        p['title'] ?? 'Reading Passage',
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                      ),
                    ),
                  );
                }).toList(),
                onChanged: _timerActive
                    ? null
                    : (val) {
                        setState(() {
                          _selectedPassage = val;
                          _userAnswers.clear();
                          _feedback = null;
                          _examSuccess = false;
                        });
                      },
              ),
              const SizedBox(height: 20),

              // Passage Detail Card
              if (_selectedPassage != null) ...[
                Container(
                  padding: const EdgeInsets.all(20),
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
                          Expanded(
                            child: Text(
                              _selectedPassage['title'] ?? 'Reading Passage',
                              style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                            ),
                          ),
                          if (_timerActive)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.red.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.redAccent.withOpacity(0.3)),
                              ),
                              child: Text(
                                '⏱️ ${_formatTime(_timeLeft)}',
                                style: const TextStyle(color: Colors.redAccent, fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Collapsible Tackle Steps Accordion
                      Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFF050E1A),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFF1E3E6E).withValues(alpha: 0.5)),
                        ),
                        child: Theme(
                          data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                          child: ExpansionTile(
                            iconColor: const Color(0xFFEAB308),
                            collapsedIconColor: const Color(0xFFEAB308),
                            title: const Row(
                              children: [
                                Icon(Icons.lightbulb_outline, color: Color(0xFFEAB308), size: 16),
                                SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    'How to Tackle this Reading Task (Steps)',
                                    style: TextStyle(color: Color(0xFFEAB308), fontSize: 11, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ],
                            ),
                            children: [
                              Padding(
                                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    _buildTackleStep('1. Skim Passage (2 Mins)', 'Quickly scan the title, subheadings, and first/last sentences of paragraphs to map the general structure first.'),
                                    const SizedBox(height: 8),
                                    _buildTackleStep('2. Analyze Questions', 'Read the questions first. Highlight key terms (dates, capitalized names, numbers) to act as visual anchors.'),
                                    const SizedBox(height: 8),
                                    _buildTackleStep('3. Scan & Locate', 'Scan the text to find the visual anchors. Read the surrounding sentences closely to extract details.'),
                                    const SizedBox(height: 8),
                                    _buildTackleStep('4. Spot Synonyms', 'Look out! The correct choices will almost always paraphrased or use synonyms of terms found in the text.'),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Scrollable Passage Body
                      Container(
                        constraints: const BoxConstraints(maxHeight: 250),
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFF050E1A),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFF1E3E6E)),
                        ),
                        child: SingleChildScrollView(
                          child: Text(
                            _selectedPassage['text'] ?? '',
                            style: const TextStyle(color: Colors.white70, fontSize: 12, height: 1.6),
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Questions list
                      if (!_timerActive && _feedback == null && !_examSuccess)
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _startTimer,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFD4AF37),
                              foregroundColor: const Color(0xFF050E1A),
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: Text(_mode == 'EXAM' ? 'Start Exam Timer' : 'Start Practice', style: const TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        )
                      else ...[
                        ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: (_selectedPassage['practiceQuestions'] as List? ?? []).length,
                          itemBuilder: (context, index) {
                            final q = _selectedPassage['practiceQuestions'][index];
                            final qId = q['id'];
                            return Container(
                              margin: const EdgeInsets.only(bottom: 20),
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: const Color(0xFF050E1A),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: const Color(0xFF1E3E6E)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        'QUESTION ${index + 1}',
                                        style: const TextStyle(color: Color(0xFFD4AF37), fontSize: 11, fontWeight: FontWeight.bold),
                                      ),
                                      Text(
                                        q['difficulty'] ?? '',
                                        style: const TextStyle(color: Colors.white38, fontSize: 10),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    q['instruction'] ?? '',
                                    style: const TextStyle(color: Colors.white70, fontSize: 11, fontStyle: FontStyle.italic),
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    q['questionText'] ?? '',
                                    style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                                  ),
                                  const SizedBox(height: 16),

                                  // Answer Input options
                                  if (q['questionType'] == 'MULTIPLE_CHOICE')
                                    Column(
                                      children: (q['options'] as List? ?? []).map((opt) {
                                        final letter = opt['optionLetter'] ?? '';
                                        final isSelected = _userAnswers[qId] == letter;
                                        return Card(
                                          color: isSelected ? const Color(0xFF1E3E6E) : const Color(0xFF050E1A),
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(12),
                                            side: BorderSide(color: isSelected ? const Color(0xFFD4AF37) : const Color(0xFF1E3E6E)),
                                          ),
                                          margin: const EdgeInsets.only(bottom: 8),
                                          child: RadioListTile<String>(
                                            value: letter,
                                            groupValue: _userAnswers[qId],
                                            activeColor: const Color(0xFFD4AF37),
                                            title: Text(
                                              '$letter. ${opt['optionText'] ?? ''}',
                                              style: const TextStyle(color: Colors.white, fontSize: 12),
                                            ),
                                            onChanged: !_timerActive && _mode == 'EXAM'
                                                ? null
                                                : (val) {
                                                    if (val != null) {
                                                      setState(() => _userAnswers[qId] = val);
                                                    }
                                                  },
                                          ),
                                        );
                                      }).toList(),
                                    )
                                  else
                                    TextField(
                                      onChanged: (val) => _userAnswers[qId] = val,
                                      style: const TextStyle(color: Colors.white, fontSize: 13),
                                      enabled: _timerActive || _mode == 'PRACTICE',
                                      decoration: const InputDecoration(
                                        labelText: 'Your Answer',
                                        labelStyle: TextStyle(color: Colors.white60),
                                        filled: true,
                                        fillColor: Color(0xFF050E1A),
                                        focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: Color(0xFFD4AF37))),
                                        enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: Color(0xFF1E3E6E))),
                                      ),
                                    ),
                                ],
                              ),
                            );
                          },
                        ),
                        const SizedBox(height: 12),

                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _submitting ? null : _submitAnswers,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF10B981),
                              foregroundColor: const Color(0xFF050E1A),
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: Text(_submitting ? 'Submitting...' : 'Submit All Answers', style: const TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Practice AI Feedback display
                if (_feedback != null && _mode == 'PRACTICE')
                  Container(
                    padding: const EdgeInsets.all(20),
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
                            const Text('Practice Results', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFF10B981).withOpacity(0.1),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                'Score: ${_feedback['correctCount']} / ${_feedback['totalCount']}',
                                style: const TextStyle(color: Color(0xFF10B981), fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                        const Divider(color: Color(0xFF1E3E6E), height: 32),
                        ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: (_feedback['results'] as List? ?? []).length,
                          itemBuilder: (context, idx) {
                            final res = _feedback['results'][idx];
                            final isCorrect = res['isCorrect'] == true;
                            return Container(
                              margin: const EdgeInsets.only(bottom: 16),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: const Color(0xFF050E1A),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: isCorrect ? const Color(0xFF10B981).withOpacity(0.3) : Colors.redAccent.withOpacity(0.3)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text('Question ${idx + 1}', style: const TextStyle(color: Colors.white54, fontSize: 10, fontWeight: FontWeight.bold)),
                                      Text(
                                        isCorrect ? 'Correct' : 'Incorrect',
                                        style: TextStyle(color: isCorrect ? const Color(0xFF10B981) : Colors.redAccent, fontSize: 11, fontWeight: FontWeight.bold),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Text(res['questionText'] ?? '', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                                  const SizedBox(height: 10),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text('Your Answer: ${res['userAnswer']}', style: TextStyle(color: isCorrect ? const Color(0xFF10B981) : Colors.redAccent, fontSize: 11)),
                                      ),
                                      Expanded(
                                        child: Text('Correct: ${res['correctAnswerStr']}', style: const TextStyle(color: Color(0xFFD4AF37), fontSize: 11, fontWeight: FontWeight.bold)),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  const Text('Explanation:', style: TextStyle(color: Colors.white60, fontSize: 10, fontWeight: FontWeight.bold)),
                                  const SizedBox(height: 2),
                                  Text(res['explanation'] ?? '', style: const TextStyle(color: Colors.white70, fontSize: 11, fontStyle: FontStyle.italic)),
                                ],
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                  ),

                // Exam success display
                if (_examSuccess)
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
                    ),
                    child: Column(
                      children: [
                        const Icon(Icons.stars_rounded, color: Color(0xFF10B981), size: 40),
                        const SizedBox(height: 12),
                        const Text(
                          'Exam Submitted Successfully!',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Your answers have been logged in Exam Mode for evaluation. You can check details in Attempt History later.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () => setState(() => _examSuccess = false),
                          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), foregroundColor: const Color(0xFF050E1A)),
                          child: const Text('Practice Again'),
                        ),
                      ],
                    ),
                  ),
              ],
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildTackleStep(String title, String body) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(color: Color(0xFFEAB308), fontSize: 10, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 2),
        Text(
          body,
          style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 9, height: 1.4),
        ),
      ],
    );
  }
}
