import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class WritingPracticeScreen extends StatefulWidget {
  const WritingPracticeScreen({super.key});

  @override
  State<WritingPracticeScreen> createState() => _WritingPracticeScreenState();
}

class _WritingPracticeScreenState extends State<WritingPracticeScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _textController = TextEditingController();

  List<dynamic> _prompts = [];
  dynamic _selectedPrompt;
  String _mode = 'PRACTICE'; // PRACTICE or EXAM
  bool _loading = true;
  bool _submitting = false;
  dynamic _feedback;
  bool _examSuccess = false;

  // Timer variables
  int _timeLeft = 2400; // 40 minutes
  Timer? _timer;
  bool _timerActive = false;

  @override
  void initState() {
    super.initState();
    _fetchPrompts();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _textController.dispose();
    super.dispose();
  }

  Future<void> _fetchPrompts() async {
    try {
      final response = await _apiService.request(
        path: '/content/writing/prompts',
        method: 'GET',
      );
      if (response.statusCode == 200) {
        setState(() {
          _prompts = jsonDecode(response.body);
          if (_prompts.isNotEmpty) {
            _selectedPrompt = _prompts[0];
          }
        });
      }
    } catch (e) {
      debugPrint('Error fetching prompts: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  void _startTimer() {
    setState(() {
      _timeLeft = 2400;
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
        _submitEssay();
      }
    });
  }

  Future<void> _submitEssay() async {
    if (_textController.text.trim().isEmpty) return;
    setState(() {
      _submitting = true;
      _timerActive = false;
    });
    _timer?.cancel();

    try {
      final response = await _apiService.request(
        path: '/content/writing/submit',
        method: 'POST',
        body: jsonEncode({
          'promptId': _selectedPrompt['id'],
          'userText': _textController.text,
          'mode': _mode,
        }),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        if (_mode == 'EXAM') {
          setState(() => _examSuccess = true);
        } else {
          setState(() => _feedback = data['feedbackJson']);
        }
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Submission failed: $e')),
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

  int get _wordCount => _textController.text.trim().isEmpty
      ? 0
      : _textController.text.trim().split(RegExp(r'\s+')).length;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF050E1A), // Deep Navy
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B1E36),
        title: const Text('Writing Correction', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFD4AF37)))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Mode Selection
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _mode == 'PRACTICE' ? const Color(0xFFD4AF37) : const Color(0xFF0B1E36),
                            foregroundColor: _mode == 'PRACTICE' ? const Color(0xFF050E1A) : Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          onPressed: _timerActive ? null : () => setState(() => _mode = 'PRACTICE'),
                          child: const Text('Practice Mode', style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _mode == 'EXAM' ? const Color(0xFFD4AF37) : const Color(0xFF0B1E36),
                            foregroundColor: _mode == 'EXAM' ? const Color(0xFF050E1A) : Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          onPressed: _timerActive ? null : () => setState(() => _mode = 'EXAM'),
                          child: const Text('Exam Mode', style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Prompts Dropdown
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0B1E36),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF1E3E6E)),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<dynamic>(
                        dropdownColor: const Color(0xFF0B1E36),
                        value: _selectedPrompt,
                        items: _prompts.map((p) {
                          return DropdownMenuItem<dynamic>(
                            value: p,
                            child: Text(
                              p['title'],
                              style: const TextStyle(color: Colors.white, fontSize: 13),
                            ),
                          );
                        }).toList(),
                        onChanged: _timerActive
                            ? null
                            : (val) {
                                setState(() {
                                  _selectedPrompt = val;
                                  _textController.clear();
                                  _feedback = null;
                                  _examSuccess = false;
                                });
                              },
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  if (_selectedPrompt != null) ...[
                    // Prompt Box
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0B1E36).withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFF1E3E6E)),
                      ),
                      child: Text(
                        _selectedPrompt['promptText'],
                        style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 12, height: 1.5, fontStyle: FontStyle.italic),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Timer Banner for Exam Mode
                    if (_timerActive && _mode == 'EXAM') ...[
                      Center(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.red.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.red.withValues(alpha: 0.2)),
                          ),
                          child: Text(
                            '⏱️ Timer: ${_formatTime(_timeLeft)}',
                            style: const TextStyle(color: Colors.redAccent, fontSize: 14, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Text Field
                    TextField(
                      controller: _textController,
                      maxLines: 12,
                      style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.5),
                      decoration: InputDecoration(
                        hintText: 'Type your essay response here...',
                        hintStyle: const TextStyle(color: Color(0xFF475569)),
                        filled: true,
                        fillColor: const Color(0xFF0B1E36),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: const BorderSide(color: Color(0xFF1E3E6E)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Words: $_wordCount', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                        if (!_timerActive && _mode == 'EXAM')
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFD4AF37)),
                            onPressed: _startTimer,
                            child: const Text('Start Exam Timer', style: TextStyle(color: Colors.black)),
                          )
                        else
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981)),
                            onPressed: _submitting ? null : _submitEssay,
                            child: Text(_submitting ? 'Submitting...' : 'Submit Essay', style: const TextStyle(color: Colors.black)),
                          ),
                      ],
                    ),
                  ],

                  // Practice Feedback Panel
                  if (_feedback != null && _mode == 'PRACTICE') ...[
                    const SizedBox(height: 32),
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
                          const Text('AI Detailed Feedback', style: TextStyle(color: Color(0xFFD4AF37), fontSize: 16, fontWeight: FontWeight.bold)),
                          const Divider(color: Color(0xFF1E3E6E), height: 24),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Estimated Band Score:', style: TextStyle(color: Colors.white, fontSize: 13)),
                              Text('Band ${_feedback['estimatedBand']}', style: const TextStyle(color: Color(0xFFD4AF37), fontSize: 16, fontWeight: FontWeight.w900)),
                            ],
                          ),
                          const SizedBox(height: 16),
                          const Text('Strengths:', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                          const SizedBox(height: 4),
                          Text(_feedback['wellDone'] ?? '', style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 12, height: 1.4)),
                          const SizedBox(height: 16),
                          const Text('Answering & Time Strategy Strategy:', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                          const SizedBox(height: 4),
                          const Text('Task 1 target duration: 20 minutes. Spend 3 minutes brainstorming, 15 minutes drafting, and 2 minutes correcting subject-verb agreements.', style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 12, height: 1.4)),
                          const SizedBox(height: 16),
                          const Text('Model Essay Rewrite:', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xFF050E1A),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(_feedback['improvedAnswer'] ?? '', style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 11, height: 1.5)),
                          ),
                        ],
                      ),
                    ),
                  ],

                  // Exam Mode success
                  if (_examSuccess && _mode == 'EXAM') ...[
                    const SizedBox(height: 32),
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.green.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.green.withValues(alpha: 0.2)),
                      ),
                      child: const Column(
                        children: [
                          Icon(Icons.check_circle_rounded, color: Colors.green, size: 40),
                          SizedBox(height: 12),
                          Text('Exam Submitted Successfully!', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                          SizedBox(height: 8),
                          Text(
                            'Your writing response has been saved under Exam Mode. Official tutor grades will be logged shortly.',
                            style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, height: 1.4),
                            textAlign: TextAlign.center,
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
