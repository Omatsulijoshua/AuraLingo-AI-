import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:audioplayers/audioplayers.dart';
import '../services/api_service.dart';

class ListeningPracticeScreen extends StatefulWidget {
  const ListeningPracticeScreen({super.key});

  @override
  State<ListeningPracticeScreen> createState() => _ListeningPracticeScreenState();
}

class _ListeningPracticeScreenState extends State<ListeningPracticeScreen> {
  final ApiService _apiService = ApiService();
  
  // Audio Player variables
  final AudioPlayer _audioPlayer = AudioPlayer();
  PlayerState _playerState = PlayerState.stopped;
  Duration _duration = Duration.zero;
  Duration _position = Duration.zero;
  StreamSubscription? _playerStateSubscription;
  StreamSubscription? _durationSubscription;
  StreamSubscription? _positionSubscription;

  List<dynamic> _audios = [];
  dynamic _selectedAudio;
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
    _initAudioPlayer();
    _fetchAudios();
  }

  void _initAudioPlayer() {
    _playerStateSubscription = _audioPlayer.onPlayerStateChanged.listen((state) {
      if (mounted) {
        setState(() => _playerState = state);
      }
    });

    _durationSubscription = _audioPlayer.onDurationChanged.listen((d) {
      if (mounted) {
        setState(() => _duration = d);
      }
    });

    _positionSubscription = _audioPlayer.onPositionChanged.listen((p) {
      if (mounted) {
        setState(() => _position = p);
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _playerStateSubscription?.cancel();
    _durationSubscription?.cancel();
    _positionSubscription?.cancel();
    _audioPlayer.dispose();
    super.dispose();
  }

  Future<void> _fetchAudios() async {
    try {
      final response = await _apiService.request(
        path: '/content/audios',
        method: 'GET',
      );
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        setState(() {
          _audios = data;
          if (_audios.isNotEmpty) {
            _selectedAudio = _audios[0];
          }
        });
      }
    } catch (e) {
      debugPrint('Error fetching listening audios: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  void _startTimer() {
    _audioPlayer.stop();
    setState(() {
      _timeLeft = 1800;
      _timerActive = true;
      _feedback = null;
      _examSuccess = false;
      _userAnswers.clear();
      _position = Duration.zero;
      _duration = Duration.zero;
    });
    
    // Play the audio automatically when timer starts
    _playAudio();

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

  Future<void> _playAudio() async {
    if (_selectedAudio == null || _selectedAudio['audioUrl'] == null) return;
    String rawUrl = _selectedAudio['audioUrl'].toString();
    String fullUrl = rawUrl.startsWith('/uploads/') 
        ? '${_apiService.assetBaseUrl}$rawUrl' 
        : rawUrl;
    
    try {
      await _audioPlayer.play(UrlSource(fullUrl));
    } catch (e) {
      debugPrint('Error playing audio: $e');
    }
  }

  Future<void> _pauseAudio() async {
    await _audioPlayer.pause();
  }

  Future<void> _submitAnswers() async {
    if (_selectedAudio == null) return;
    final questions = _selectedAudio['practiceQuestions'] as List? ?? [];
    if (questions.isEmpty) return;

    setState(() {
      _submitting = true;
      _timerActive = false;
    });
    _timer?.cancel();
    _audioPlayer.stop();

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

  String _formatDuration(Duration d) {
    final minutes = d.inMinutes;
    final seconds = d.inSeconds % 60;
    return '$minutes:${seconds < 10 ? '0' : ''}$seconds';
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

            if (_audios.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 40.0),
                  child: Text('No listening tracks found. Auto-spin some in the admin panel!', style: TextStyle(color: Colors.white60)),
                ),
              )
            else ...[
              // Audio track selector dropdown
              DropdownButtonFormField<dynamic>(
                value: _selectedAudio,
                decoration: const InputDecoration(
                  labelText: 'Choose Listening Track',
                  labelStyle: TextStyle(color: Color(0xFFD4AF37)),
                  filled: true,
                  fillColor: Color(0xFF0B1E36),
                  border: OutlineInputBorder(),
                ),
                dropdownColor: const Color(0xFF0B1E36),
                items: _audios.map((a) {
                  return DropdownMenuItem<dynamic>(
                    value: a,
                    child: SizedBox(
                      width: 250,
                      child: Text(
                        a['title'] ?? 'Listening Track',
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                      ),
                    ),
                  );
                }).toList(),
                onChanged: _timerActive
                    ? null
                    : (val) {
                        _audioPlayer.stop();
                        setState(() {
                          _selectedAudio = val;
                          _userAnswers.clear();
                          _feedback = null;
                          _examSuccess = false;
                          _position = Duration.zero;
                          _duration = Duration.zero;
                        });
                      },
              ),
              const SizedBox(height: 20),

              // Track Detail Card
              if (_selectedAudio != null) ...[
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
                              _selectedAudio['title'] ?? 'Listening Track',
                              style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                            ),
                          ),
                          if (_timerActive)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.red.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.redAccent.withValues(alpha: 0.3)),
                              ),
                              child: Text(
                                '⏱️ ${_formatTime(_timeLeft)}',
                                style: const TextStyle(color: Colors.redAccent, fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 20),

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
                                    'How to Tackle this Listening Task (Steps)',
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
                                    _buildTackleStep('1. Read Ahead (30 Secs)', 'Scan the questions and choices before the audio starts. Highlight key terms to anticipate names, dates, numbers, or specific terms.'),
                                    const SizedBox(height: 8),
                                    _buildTackleStep('2. Listen & Note', 'Focus on synonyms and paraphrasing. Speakers will often use different words than what you see in the questions.'),
                                    const SizedBox(height: 8),
                                    _buildTackleStep('3. Check Spelling', 'Watch out for word count rules (e.g., "NO MORE THAN TWO WORDS"). Ensure singular/plural nouns are matching correctly.'),
                                    const SizedBox(height: 8),
                                    _buildTackleStep('4. Guess & Write', 'Never leave blanks. There is no negative marking in the IELTS exam, so guess if you are unsure of the correct answer.'),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Premium Custom Seekable Audio Player UI
                      if (_selectedAudio['audioUrl'] != null)
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFF050E1A),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFF1E3E6E)),
                          ),
                          child: Column(
                            children: [
                              Row(
                                children: [
                                  IconButton(
                                    icon: Icon(
                                      _playerState == PlayerState.playing
                                          ? Icons.pause_circle_filled_rounded
                                          : Icons.play_circle_filled_rounded,
                                      color: const Color(0xFFD4AF37),
                                      size: 40,
                                    ),
                                    onPressed: _playerState == PlayerState.playing
                                        ? _pauseAudio
                                        : _playAudio,
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: const [
                                        Text('AUDIO TRACK PLAYER', style: TextStyle(color: Color(0xFFD4AF37), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.2)),
                                        SizedBox(height: 2),
                                        Text('Tap play to start listening', style: TextStyle(color: Colors.white60, fontSize: 11)),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              SliderTheme(
                                data: SliderTheme.of(context).copyWith(
                                  activeTrackColor: const Color(0xFFD4AF37),
                                  inactiveTrackColor: const Color(0xFF1E3E6E),
                                  thumbColor: const Color(0xFFD4AF37),
                                  overlayColor: const Color(0xFFD4AF37).withOpacity(0.2),
                                  trackHeight: 4.0,
                                  thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6.0),
                                ),
                                child: Slider(
                                  min: 0.0,
                                  max: _duration.inMilliseconds.toDouble(),
                                  value: _position.inMilliseconds.toDouble().clamp(0.0, _duration.inMilliseconds.toDouble()),
                                  onChanged: (val) async {
                                    final position = Duration(milliseconds: val.toInt());
                                    await _audioPlayer.seek(position);
                                  },
                                ),
                              ),
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(_formatDuration(_position), style: const TextStyle(color: Colors.white70, fontSize: 10, fontFamily: 'monospace')),
                                    Text(_formatDuration(_duration), style: const TextStyle(color: Colors.white70, fontSize: 10, fontFamily: 'monospace')),
                                  ],
                                ),
                              ),
                            ],
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
                          itemCount: (_selectedAudio['practiceQuestions'] as List? ?? []).length,
                          itemBuilder: (context, index) {
                            final q = _selectedAudio['practiceQuestions'][index];
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
