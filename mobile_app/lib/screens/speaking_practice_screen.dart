import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class SpeakingPracticeScreen extends StatefulWidget {
  const SpeakingPracticeScreen({super.key});

  @override
  State<SpeakingPracticeScreen> createState() => _SpeakingPracticeScreenState();
}

class _SpeakingPracticeScreenState extends State<SpeakingPracticeScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _transcriptController = TextEditingController();

  List<dynamic> _prompts = [];
  dynamic _selectedPrompt;
  String _mode = 'PRACTICE'; // PRACTICE or EXAM
  bool _loading = true;
  bool _submitting = false;
  dynamic _feedback;
  bool _examSuccess = false;

  // Timer variables
  int _timeLeft = 120; // 2 minutes
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
    _transcriptController.dispose();
    super.dispose();
  }

  Future<void> _fetchPrompts() async {
    try {
      final response = await _apiService.request(path: '/content/speaking/prompts', method: 'GET');
      if (response.statusCode == 200) {
        final List<dynamic> fetched = jsonDecode(response.body);
        final customOption = {
          'id': 'CUSTOM',
          'topic': '🎙️ Speak on my own Topic',
          'cueCardText': 'Type your custom speaking topic/cue card details in the box below to start practicing.',
          'difficulty': 'CUSTOM',
        };
        setState(() {
          _prompts = [...fetched, customOption];
          if (_prompts.isNotEmpty) {
            _selectedPrompt = _prompts[0];
          }
        });
      }
    } catch (e) {
      debugPrint('Error fetching speaking prompts: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  void _startTimer() {
    setState(() {
      _timeLeft = 120;
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
        _submitSpeaking();
      }
    });
  }

  Future<void> _submitSpeaking() async {
    if (_transcriptController.text.trim().isEmpty) return;
    setState(() {
      _submitting = true;
      _timerActive = false;
    });

    try {
      final response = await _apiService.request(
        path: '/content/speaking/submit',
        method: 'POST',
        body: jsonEncode({
          'promptId': _selectedPrompt['id'],
          'audioUrl': 'https://placeholder.url/audio.mp3',
          'transcription': _transcriptController.text.trim(),
          'mode': _mode,
          'customQuestionText': _selectedPrompt['id'] == 'CUSTOM' ? _selectedPrompt['cueCardText'] : null,
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
            _feedback = result['feedbackJson'];
          });
        }
      }
    } catch (e) {
      debugPrint('Error submitting speaking: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to submit speaking response.')),
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
        title: const Text('Speaking Practice', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
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

            if (_prompts.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 40.0),
                  child: Text('No speaking prompts found.', style: TextStyle(color: Colors.white60)),
                ),
              )
            else ...[
              // Prompt selector dropdown
              DropdownButtonFormField<dynamic>(
                value: _selectedPrompt,
                decoration: const InputDecoration(
                  labelText: 'Choose Prompt',
                  labelStyle: TextStyle(color: Color(0xFFD4AF37)),
                  filled: true,
                  fillColor: Color(0xFF0B1E36),
                  border: OutlineInputBorder(),
                ),
                dropdownColor: const Color(0xFF0B1E36),
                items: _prompts.map((p) {
                  return DropdownMenuItem<dynamic>(
                    value: p,
                    child: Text(
                      p['topic'] ?? 'Speaking Cue Card',
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  );
                }).toList(),
                onChanged: _timerActive
                    ? null
                    : (val) {
                        setState(() {
                          _selectedPrompt = val;
                          _transcriptController.clear();
                          _feedback = null;
                          _examSuccess = false;
                        });
                      },
              ),
              const SizedBox(height: 20),

              // Cue card details
              if (_selectedPrompt != null)
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
                          const Text('CUE CARD DESCRIPTION', style: TextStyle(color: Color(0xFFD4AF37), fontSize: 11, fontWeight: FontWeight.bold)),
                          if (_timerActive)
                            Text(
                              '⏱️ ${_formatTime(_timeLeft)}',
                              style: const TextStyle(color: Colors.redAccent, fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        _selectedPrompt['cueCardText'] ?? '',
                        style: const TextStyle(color: Colors.white70, fontSize: 12, height: 1.5, fontStyle: FontStyle.italic),
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
                                    'How to Tackle this Speaking Task (Steps)',
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
                                    _buildTackleStep('1. Prepare (1 Min)', 'Write brief outline keywords during your 1-minute prep time. Do not write full sentences; focus on main cues.'),
                                    const SizedBox(height: 8),
                                    _buildTackleStep('2. Speak Fluently', 'Keep speaking continuously until the examiner stops you. Use connectors ("In addition", "Consequently") naturally.'),
                                    const SizedBox(height: 8),
                                    _buildTackleStep('3. Range of Tenses', 'Use past, present, and conditional tenses. Rich grammar variation raises your score.'),
                                    const SizedBox(height: 8),
                                    _buildTackleStep('4. Pronunciation', 'Speak at a steady, natural pace. Enounce clearly and pause naturally instead of using fillers ("uhm", "like").'),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      if (_selectedPrompt['id'] == 'CUSTOM' && !_timerActive && _feedback == null && !_examSuccess) ...[
                        TextField(
                          maxLines: 3,
                          onChanged: (text) => setState(() => _selectedPrompt['cueCardText'] = text),
                          style: const TextStyle(color: Colors.white, fontSize: 12),
                          decoration: const InputDecoration(
                            hintText: 'Enter your custom speaking topic here...',
                            hintStyle: TextStyle(color: Colors.white38),
                            filled: true,
                            fillColor: Color(0xFF050E1A),
                            border: OutlineInputBorder(),
                          ),
                        ),
                        const SizedBox(height: 20),
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
                        TextField(
                          controller: _transcriptController,
                          maxLines: 6,
                          style: const TextStyle(color: Colors.white, fontSize: 13),
                          enabled: _timerActive || _mode == 'PRACTICE',
                          decoration: const InputDecoration(
                            labelText: 'Your Speaking Response / Transcription',
                            labelStyle: TextStyle(color: Colors.white60),
                            alignLabelWithHint: true,
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
                              onPressed: _submitting ? null : _submitSpeaking,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF10B981),
                                foregroundColor: const Color(0xFF050E1A),
                                padding: const EdgeInsets.symmetric(vertical: 14),
                              ),
                              child: Text(_submitting ? 'Evaluating...' : 'Submit Speaking', style: const TextStyle(fontWeight: FontWeight.bold)),
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
                      const Text(
                        'AI Speaking Band Score',
                        style: TextStyle(color: Color(0xFFD4AF37), fontSize: 14, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(color: const Color(0xFF050E1A), borderRadius: BorderRadius.circular(8)),
                              child: Column(
                                children: [
                                  const Text('EST. BAND', style: TextStyle(color: Colors.white54, fontSize: 9)),
                                  const SizedBox(height: 4),
                                  Text('Band ${_feedback['estimatedBand']}', style: const TextStyle(color: Color(0xFFD4AF37), fontSize: 16, fontWeight: FontWeight.w900)),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      const Text('⭐ What you did well:', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text(_feedback['wellDone'] ?? '', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                      
                      if (_feedback['mistakes'] != null && (_feedback['mistakes'] as List).isNotEmpty) ...[
                        const SizedBox(height: 16),
                        const Text('⚠️ Mistakes & Corrections:', style: TextStyle(color: Colors.redAccent, fontSize: 12, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: (_feedback['mistakes'] as List).map((m) => Text('- $m', style: const TextStyle(color: Colors.white70, fontSize: 12))).toList(),
                        ),
                      ],

                      const SizedBox(height: 16),
                      const Text('📝 High Band Model Answer:', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 6),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: const Color(0xFF050E1A), borderRadius: BorderRadius.circular(10)),
                        child: Text(
                          _feedback['improvedAnswer'] ?? '',
                          style: const TextStyle(color: Colors.white70, fontSize: 12, height: 1.5, fontStyle: FontStyle.italic),
                        ),
                      ),
                      
                      if (_feedback['practiceRecommendation'] != null) ...[
                        const SizedBox(height: 16),
                        const Text('📈 Recommendations:', style: TextStyle(color: Color(0xFFD4AF37), fontSize: 12, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Text(_feedback['practiceRecommendation'], style: const TextStyle(color: Colors.white70, fontSize: 12)),
                      ],
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
                        'Your response has been logged in Exam Mode for evaluation. You can check details in Attempt History later.',
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
