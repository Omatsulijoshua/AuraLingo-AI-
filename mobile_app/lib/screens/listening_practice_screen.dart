import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ListeningPracticeScreen extends StatefulWidget {
  const ListeningPracticeScreen({super.key});

  @override
  State<ListeningPracticeScreen> createState() => _ListeningPracticeScreenState();
}

class _ListeningPracticeScreenState extends State<ListeningPracticeScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _answerController = TextEditingController();

  List<dynamic> _questions = [];
  dynamic _selectedQuestion;
  String _mode = 'PRACTICE'; // PRACTICE or EXAM
  bool _loading = true;
  bool _submitting = false;
  dynamic _feedback;
  bool _examSuccess = false;
  String _selectedOption = '';

  // Timer variables
  int _timeLeft = 1800; // 30 minutes
  Timer? _timer;
  bool _timerActive = false;

  @override
  void initState() {
    super.initState();
    _fetchQuestions();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _answerController.dispose();
    super.dispose();
  }

  Future<void> _fetchQuestions() async {
    try {
      // 1. Fetch modules to get Listening Module ID
      final modResponse = await _apiService.request(path: '/content/modules', method: 'GET');
      if (modResponse.statusCode == 200) {
        final List<dynamic> modules = jsonDecode(modResponse.body);
        final listeningMod = modules.firstWhere(
          (m) => m['name'].toString().toUpperCase() == 'LISTENING',
          orElse: () => null,
        );

        if (listeningMod != null) {
          // 2. Fetch questions for this module
          final response = await _apiService.request(
            path: '/content/questions?moduleId=${listeningMod['id']}',
            method: 'GET',
          );
          if (response.statusCode == 200) {
            setState(() {
              _questions = jsonDecode(response.body);
              if (_questions.isNotEmpty) {
                _selectedQuestion = _questions[0];
              }
            });
          }
        }
      }
    } catch (e) {
      debugPrint('Error fetching listening questions: $e');
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
    });
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_timeLeft > 0) {
        setState(() => _timeLeft--);
      } else {
        _timer?.cancel();
        setState(() => _timerActive = false);
        _submitAnswer();
      }
    });
  }

  Future<void> _submitAnswer() async {
    final ans = _selectedQuestion['questionType'] == 'MULTIPLE_CHOICE' ? _selectedOption : _answerController.text.trim();
    if (ans.isEmpty) return;

    setState(() {
      _submitting = true;
      _timerActive = false;
    });

    try {
      final response = await _apiService.request(
        path: '/content/questions/${_selectedQuestion['id']}/submit',
        method: 'POST',
        body: jsonEncode({
          'answerText': ans,
          'mode': _mode,
        }),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final result = jsonDecode(response.body);
        if (_mode == 'EXAM') {
          setState(() {
            _examSuccess = true;
          });
        } else {
          setState(() {
            _feedback = {
              'isCorrect': result['isCorrect'],
              'correctText': result['correctAnswerStr'] ?? 'Correct Answer',
              'explanation': result['feedback'] ?? 'No explanation available',
            };
          });
        }
      }
    } catch (e) {
      debugPrint('Error submitting answer: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to submit answer.')),
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
        title: const Text('Listening Practice', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
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

            if (_questions.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 40.0),
                  child: Text('No listening questions found. Auto-spin some in the admin panel!', style: TextStyle(color: Colors.white60)),
                ),
              )
            else ...[
              // Question selector dropdown
              DropdownButtonFormField<dynamic>(
                value: _selectedQuestion,
                decoration: const InputDecoration(
                  labelText: 'Choose Question',
                  labelStyle: TextStyle(color: Color(0xFFD4AF37)),
                  filled: true,
                  fillColor: Color(0xFF0B1E36),
                  border: OutlineInputBorder(),
                ),
                dropdownColor: const Color(0xFF0B1E36),
                items: _questions.map((q) {
                  return DropdownMenuItem<dynamic>(
                    value: q,
                    child: Text(
                      q['instruction'] ?? 'Listen and answer',
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  );
                }).toList(),
                onChanged: _timerActive
                    ? null
                    : (val) {
                        setState(() {
                          _selectedQuestion = val;
                          _selectedOption = '';
                          _answerController.clear();
                          _feedback = null;
                          _examSuccess = false;
                        });
                      },
              ),
              const SizedBox(height: 20),

              // Question Detail Card
              if (_selectedQuestion != null)
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
                          Text(
                            _selectedQuestion['questionType'] == 'MULTIPLE_CHOICE' ? 'MULTIPLE CHOICE' : 'FILL IN THE BLANKS',
                            style: const TextStyle(color: Color(0xFFD4AF37), fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                          if (_timerActive)
                            Text(
                              '⏱️ ${_formatTime(_timeLeft)}',
                              style: const TextStyle(color: Colors.redAccent, fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        _selectedQuestion['instruction'] ?? '',
                        style: const TextStyle(color: Colors.white70, fontSize: 12, fontStyle: FontStyle.italic),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        _selectedQuestion['questionText'] ?? '',
                        style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 24),

                      // Audio info if listeningAudio is linked
                      if (_selectedQuestion['listeningAudio'] != null) ...[
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFF050E1A),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            children: const [
                              Icon(Icons.headphones_rounded, color: Color(0xFFD4AF37)),
                              SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'Listening audio file is loaded. Tap submit to begin the evaluation.',
                                  style: TextStyle(color: Colors.white70, fontSize: 11),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),
                      ],

                      // Practice / Exam Workspace Inputs
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
                        if (_selectedQuestion['questionType'] == 'MULTIPLE_CHOICE')
                          Column(
                            children: (_selectedQuestion['options'] as List? ?? []).map((opt) {
                              final letter = opt['optionLetter'] ?? '';
                              return Card(
                                color: _selectedOption == letter ? const Color(0xFF1E3E6E) : const Color(0xFF050E1A),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  side: BorderSide(color: _selectedOption == letter ? const Color(0xFFD4AF37) : const Color(0xFF1E3E6E)),
                                ),
                                margin: const EdgeInsets.only(bottom: 12),
                                child: RadioListTile<String>(
                                  value: letter,
                                  groupValue: _selectedOption,
                                  activeColor: const Color(0xFFD4AF37),
                                  title: Text(
                                    '$letter. ${opt['optionText'] ?? ''}',
                                    style: const TextStyle(color: Colors.white, fontSize: 13),
                                  ),
                                  onChanged: !_timerActive && _mode == 'EXAM'
                                      ? null
                                      : (val) {
                                          if (val != null) setState(() => _selectedOption = val);
                                        },
                                ),
                              );
                            }).toList(),
                          )
                        else
                          TextField(
                            controller: _answerController,
                            style: const TextStyle(color: Colors.white, fontSize: 13),
                            enabled: _timerActive || _mode == 'PRACTICE',
                            decoration: const InputDecoration(
                              labelText: 'Your Answer',
                              labelStyle: TextStyle(color: Colors.white60),
                              filled: true,
                              fillColor: Color(0xFF050E1A),
                              border: OutlineInputBorder(),
                            ),
                          ),
                        const SizedBox(height: 20),

                        if (_timerActive)
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: _submitting ? null : _submitAnswer,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF10B981),
                                foregroundColor: const Color(0xFF050E1A),
                                padding: const EdgeInsets.symmetric(vertical: 14),
                              ),
                              child: Text(_submitting ? 'Submitting...' : 'Submit Answer', style: const TextStyle(fontWeight: FontWeight.bold)),
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
                    border: Border.all(color: _feedback['isCorrect'] ? const Color(0xFF10B981) : Colors.redAccent),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            _feedback['isCorrect'] ? Icons.check_circle_rounded : Icons.cancel_rounded,
                            color: _feedback['isCorrect'] ? const Color(0xFF10B981) : Colors.redAccent,
                          ),
                          const SizedBox(width: 10),
                          Text(
                            _feedback['isCorrect'] ? 'Correct!' : 'Incorrect',
                            style: TextStyle(
                              color: _feedback['isCorrect'] ? const Color(0xFF10B981) : Colors.redAccent,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text('Correct Answer: ${_feedback['correctText']}', style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.bold)),
                      const Divider(color: Color(0xFF1E3E6E), height: 24),
                      const Text('💡 AI Explanation & Tips:', style: TextStyle(color: Color(0xFFD4AF37), fontSize: 12, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      Text(
                        _feedback['explanation'] ?? '',
                        style: const TextStyle(color: Colors.white70, fontSize: 12, height: 1.5),
                      ),
                    ],
                  ),
                ),

              // Exam success display
              if (_examSuccess)
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.3)),
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
                        'Your answer has been logged in Exam Mode for evaluation. You can check details in Attempt History later.',
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
        ),
      ),
    );
  }
}
