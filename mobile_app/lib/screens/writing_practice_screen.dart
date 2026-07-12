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
  final TextEditingController _customQuestionController = TextEditingController();
  final TextEditingController _draft2Controller = TextEditingController();
  String _customTaskType = 'TASK_2';
  String _customExamType = 'ACADEMIC';

  List<dynamic> _prompts = [];
  dynamic _selectedPrompt;
  String _mode = 'PRACTICE'; // PRACTICE, EXAM, or EXAMINER
  bool _loading = true;
  bool _submitting = false;
  dynamic _feedback;
  bool _examSuccess = false;

  // AI Examiner Mode states
  dynamic _examinerFeedback;
  dynamic _selectedSentence;
  dynamic _comparisonResult;
  bool _comparing = false;

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
    _customQuestionController.dispose();
    _draft2Controller.dispose();
    super.dispose();
  }

  Future<void> _fetchPrompts() async {
    try {
      final response = await _apiService.request(
        path: '/content/writing/prompts',
        method: 'GET',
      );
      if (response.statusCode == 200) {
        final List<dynamic> fetched = jsonDecode(response.body);
        final customOption = {
          'id': 'CUSTOM',
          'title': '✍️ Write on my own Topic',
          'promptText': 'Type your custom question topic in the input box below to start practicing.',
          'taskType': 'TASK_2',
          'difficulty': 'CUSTOM',
          'examType': 'ACADEMIC'
        };
        setState(() {
          _prompts = [...fetched, customOption];
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
          'customQuestionText': _selectedPrompt['id'] == 'CUSTOM' ? _customQuestionController.text.trim() : null,
          'customTaskType': _selectedPrompt['id'] == 'CUSTOM' ? _customTaskType : null,
          'customExamType': _selectedPrompt['id'] == 'CUSTOM' ? _customExamType : null,
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

  Future<void> _submitDraft1() async {
    if (_textController.text.trim().isEmpty) return;
    setState(() {
      _submitting = true;
    });

    try {
      final response = await _apiService.request(
        path: '/content/writing/submit-examiner',
        method: 'POST',
        body: jsonEncode({
          'promptId': _selectedPrompt['id'],
          'userText': _textController.text,
          'customQuestionText': _selectedPrompt['id'] == 'CUSTOM' ? _customQuestionController.text.trim() : null,
          'customTaskType': _selectedPrompt['id'] == 'CUSTOM' ? _customTaskType : null,
          'customExamType': _selectedPrompt['id'] == 'CUSTOM' ? _customExamType : null,
        }),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        setState(() {
          _examinerFeedback = data['feedbackJson'];
          _draft2Controller.text = _textController.text;
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Examiner Analysis failed: $e')),
      );
    } finally {
      setState(() => _submitting = false);
    }
  }

  Future<void> _submitDraft2() async {
    if (_draft2Controller.text.trim().isEmpty) return;
    setState(() {
      _comparing = true;
    });

    try {
      final response = await _apiService.request(
        path: '/content/writing/compare-drafts',
        method: 'POST',
        body: jsonEncode({
          'promptId': _selectedPrompt['id'],
          'draft1Text': _textController.text,
          'draft2Text': _draft2Controller.text,
        }),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        setState(() {
          _comparisonResult = data['feedbackJson'];
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Draft Comparison failed: $e')),
      );
    } finally {
      setState(() => _comparing = false);
    }
  }

  void _applySentenceRewrite(dynamic sentence) {
    if (sentence == null || sentence['rewrite'] == null) return;
    final original = sentence['text'] as String;
    final rewrite = sentence['rewrite'] as String;
    
    final currentText = _draft2Controller.text;
    if (currentText.contains(original)) {
      setState(() {
        _draft2Controller.text = currentText.replaceFirst(original, rewrite);
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Applied rewrite suggestion to Draft 2!')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not find original sentence in Draft 2.')),
      );
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
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          onPressed: _timerActive ? null : () => setState(() => _mode = 'PRACTICE'),
                          child: const Text('Practice', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _mode == 'EXAMINER' ? const Color(0xFFF59E0B) : const Color(0xFF0B1E36),
                            foregroundColor: _mode == 'EXAMINER' ? const Color(0xFF050E1A) : Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          onPressed: _timerActive ? null : () => setState(() {
                            _mode = 'EXAMINER';
                            _examinerFeedback = null;
                            _comparisonResult = null;
                            _selectedSentence = null;
                          }),
                          child: const Text('🤖 Examiner', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _mode == 'EXAM' ? const Color(0xFFD4AF37) : const Color(0xFF0B1E36),
                            foregroundColor: _mode == 'EXAM' ? const Color(0xFF050E1A) : Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          onPressed: _timerActive ? null : () => setState(() => _mode = 'EXAM'),
                          child: const Text('Exam', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
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

                    if (_selectedPrompt['id'] == 'CUSTOM' && !_timerActive && _feedback == null && !_examSuccess) ...[
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0B1E36),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFF1E3E6E)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const Text(
                              'Custom Essay Specifications',
                              style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: DropdownButtonFormField<String>(
                                    dropdownColor: const Color(0xFF0B1E36),
                                    value: _customTaskType,
                                    decoration: const InputDecoration(
                                      labelText: 'Task Type',
                                      labelStyle: TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                                    ),
                                    style: const TextStyle(color: Colors.white, fontSize: 12),
                                    items: const [
                                      DropdownMenuItem(value: 'TASK_1', child: Text('Task 1 (Report/Letter)')),
                                      DropdownMenuItem(value: 'TASK_2', child: Text('Task 2 (Essay)')),
                                    ],
                                    onChanged: (val) {
                                      if (val != null) setState(() => _customTaskType = val);
                                    },
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: DropdownButtonFormField<String>(
                                    dropdownColor: const Color(0xFF0B1E36),
                                    value: _customExamType,
                                    decoration: const InputDecoration(
                                      labelText: 'Exam Format',
                                      labelStyle: TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                                    ),
                                    style: const TextStyle(color: Colors.white, fontSize: 12),
                                    items: const [
                                      DropdownMenuItem(value: 'ACADEMIC', child: Text('Academic')),
                                      DropdownMenuItem(value: 'GENERAL', child: Text('General')),
                                    ],
                                    onChanged: (val) {
                                      if (val != null) setState(() => _customExamType = val);
                                    },
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            TextField(
                              controller: _customQuestionController,
                              maxLines: 3,
                              style: const TextStyle(color: Colors.white, fontSize: 12),
                              decoration: const InputDecoration(
                                hintText: 'Enter your custom writing question topic here...',
                                hintStyle: TextStyle(color: Color(0xFF475569)),
                                border: OutlineInputBorder(),
                              ),
                              onChanged: (val) {
                                setState(() {}); // Refresh start button disabled state
                              },
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],

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

                    if (_mode != 'EXAMINER' || _examinerFeedback == null) ...[
                      TextField(
                        controller: _textController,
                        maxLines: 12,
                        style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.5),
                        decoration: InputDecoration(
                          hintText: _mode == 'EXAMINER'
                              ? 'Write Draft 1 response here under examiner conditions...'
                              : 'Type your essay response here...',
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
                          if (_mode == 'EXAMINER')
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF59E0B)),
                              onPressed: (_submitting || (_selectedPrompt['id'] == 'CUSTOM' && _customQuestionController.text.trim().isEmpty))
                                  ? null
                                  : _submitDraft1,
                              child: Text(_submitting ? 'Analyzing...' : '🤖 Analyze Draft 1', style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                            )
                          else if (!_timerActive && _mode == 'EXAM')
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFD4AF37)),
                              onPressed: (_selectedPrompt['id'] == 'CUSTOM' && _customQuestionController.text.trim().isEmpty) ? null : _startTimer,
                              child: const Text('Start Exam Timer', style: TextStyle(color: Colors.black)),
                            )
                          else
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981)),
                              onPressed: (_submitting || (_selectedPrompt['id'] == 'CUSTOM' && _customQuestionController.text.trim().isEmpty)) ? null : _submitEssay,
                              child: Text(_submitting ? 'Submitting...' : 'Submit Essay', style: const TextStyle(color: Colors.black)),
                            ),
                        ],
                      ),
                    ],
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

                  // AI Examiner - Draft 1 Feedback & Draft 2 Workspace
                  if (_mode == 'EXAMINER' && _examinerFeedback != null && _comparisonResult == null) ...[
                    const SizedBox(height: 24),
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
                          const Row(
                            children: [
                              Icon(Icons.psychology_rounded, color: Color(0xFFF59E0B)),
                              SizedBox(width: 8),
                              Text('AI Examiner Draft 1 Evaluation', style: TextStyle(color: Color(0xFFF59E0B), fontSize: 15, fontWeight: FontWeight.bold)),
                            ],
                          ),
                          const Divider(color: Color(0xFF1E3E6E), height: 24),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Estimated Band:', style: TextStyle(color: Colors.white, fontSize: 13)),
                              Text('Band ${_examinerFeedback['estimatedBand']}', style: const TextStyle(color: Color(0xFFF59E0B), fontSize: 16, fontWeight: FontWeight.w900)),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              _buildMetricItem('Task Resp.', '${_examinerFeedback['breakdown']?['taskAchievement'] ?? 6.0}'),
                              _buildMetricItem('Coherence', '${_examinerFeedback['breakdown']?['coherenceCohesion'] ?? 6.0}'),
                              _buildMetricItem('Lexical', '${_examinerFeedback['breakdown']?['lexicalResource'] ?? 6.0}'),
                              _buildMetricItem('Grammar', '${_examinerFeedback['breakdown']?['grammarAccuracy'] ?? 6.0}'),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.amber.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: Colors.amber.withValues(alpha: 0.2)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('💡 Coaching Tip for Draft 2:', style: TextStyle(color: Color(0xFFF59E0B), fontWeight: FontWeight.bold, fontSize: 12)),
                                const SizedBox(height: 4),
                                Text(_examinerFeedback['coachingTip'] ?? '', style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 11, height: 1.4)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Sentence analysis wrap
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
                          const Text('Sentence Breakdown', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 6),
                          const Text('Tap any colored sentence to view improvement details.', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 4,
                            runSpacing: 4,
                            children: (_examinerFeedback['sentences'] as List<dynamic>).map<Widget>((s) {
                              Color textColor = Colors.greenAccent;
                              Color bgColor = Colors.green.withValues(alpha: 0.1);
                              if (s['strength'] == 'OKAY') {
                                textColor = Colors.amberAccent;
                                bgColor = Colors.amber.withValues(alpha: 0.1);
                              } else if (s['strength'] == 'WEAK') {
                                textColor = Colors.redAccent;
                                bgColor = Colors.red.withValues(alpha: 0.1);
                              }
                              return GestureDetector(
                                onTap: () => setState(() => _selectedSentence = s),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: bgColor,
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: textColor.withValues(alpha: 0.2)),
                                  ),
                                  child: Text(s['text'] ?? '', style: TextStyle(color: textColor, fontSize: 11, height: 1.3)),
                                ),
                              );
                            }).toList(),
                          ),

                          // Sentence details card
                          if (_selectedSentence != null) ...[
                            const SizedBox(height: 16),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: const Color(0xFF050E1A),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: const Color(0xFF1E3E6E)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '${_selectedSentence['strength']} SENTENCE',
                                    style: TextStyle(
                                      color: _selectedSentence['strength'] == 'STRONG' ? Colors.green :
                                             _selectedSentence['strength'] == 'OKAY' ? Colors.amber : Colors.red,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 10,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  const Text('Critique:', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.bold)),
                                  Text(_selectedSentence['critique'] ?? '', style: const TextStyle(color: Colors.white, fontSize: 12, height: 1.4)),
                                  const SizedBox(height: 8),
                                  const Text('Suggested Rewrite:', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.bold)),
                                  Text(_selectedSentence['rewrite'] ?? '', style: const TextStyle(color: Color(0xFFF59E0B), fontSize: 12, fontStyle: FontStyle.italic, height: 1.4)),
                                  const SizedBox(height: 12),
                                  ElevatedButton(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFFF59E0B),
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                    ),
                                    onPressed: () => _applySentenceRewrite(_selectedSentence),
                                    child: const Text('Apply Rewrite to Draft 2', style: TextStyle(color: Colors.black, fontSize: 11, fontWeight: FontWeight.bold)),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Draft 2 Workspace
                    const Text('Draft 2 Workspace', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _draft2Controller,
                      maxLines: 12,
                      style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.5),
                      decoration: InputDecoration(
                        hintText: 'Improve your essay here... You can apply rewrites from weak sentences above.',
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
                        Text('Words: ${_draft2Controller.text.trim().isEmpty ? 0 : _draft2Controller.text.trim().split(RegExp(r"\s+")).length}', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981)),
                          onPressed: _comparing ? null : _submitDraft2,
                          child: Text(_comparing ? 'Comparing...' : 'Submit Draft 2', style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  ],

                  // AI Examiner Mode - Draft 1 vs Draft 2 comparison
                  if (_mode == 'EXAMINER' && _comparisonResult != null) ...[
                    const SizedBox(height: 24),
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
                          const Row(
                            children: [
                              Icon(Icons.trending_up_rounded, color: Color(0xFF10B981)),
                              SizedBox(width: 8),
                              Text('Progress Comparison Result', style: TextStyle(color: Color(0xFF10B981), fontSize: 15, fontWeight: FontWeight.bold)),
                            ],
                          ),
                          const Divider(color: Color(0xFF1E3E6E), height: 24),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Draft 1 Band Score:', style: TextStyle(color: Colors.white70, fontSize: 12)),
                              Text('Band ${_comparisonResult['draft1Band']}', style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Draft 2 Band Score:', style: TextStyle(color: Colors.white70, fontSize: 12)),
                              Text('Band ${_comparisonResult['draft2Band']}', style: const TextStyle(color: Color(0xFF10B981), fontSize: 14, fontWeight: FontWeight.bold)),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Center(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              decoration: BoxDecoration(
                                color: Colors.green.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.green.withValues(alpha: 0.2)),
                              ),
                              child: Text(
                                '+${_comparisonResult['improvement']} Band Score Improvement! 🎉',
                                style: const TextStyle(color: Colors.greenAccent, fontSize: 13, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ),
                          const Divider(color: Color(0xFF1E3E6E), height: 24),
                          const Text('Lexical Improvements:', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                          const SizedBox(height: 4),
                          Text(_comparisonResult['lexicalImprovements'] ?? '', style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 11, height: 1.4)),
                          const SizedBox(height: 12),
                          const Text('Grammatical Improvements:', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                          const SizedBox(height: 4),
                          Text(_comparisonResult['grammarImprovements'] ?? '', style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 11, height: 1.4)),
                          const SizedBox(height: 12),
                          const Text('Coherence Improvements:', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                          const SizedBox(height: 4),
                          Text(_comparisonResult['coherenceImprovements'] ?? '', style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 11, height: 1.4)),
                          const SizedBox(height: 12),
                          const Text('Examiner Summary:', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                          const SizedBox(height: 4),
                          Text(_comparisonResult['summary'] ?? '', style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 11, height: 1.4)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFD4AF37)),
                      onPressed: () {
                        setState(() {
                          _textController.clear();
                          _draft2Controller.clear();
                          _examinerFeedback = null;
                          _comparisonResult = null;
                          _selectedSentence = null;
                        });
                      },
                      child: const Text('Start New Session', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ],
              ),
            ),
    );
  }

  Widget _buildMetricItem(String label, String score) {
    return Column(
      children: [
        Text(label, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text(score, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
      ],
    );
  }
}
