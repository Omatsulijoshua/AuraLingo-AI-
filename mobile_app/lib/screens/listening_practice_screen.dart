import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:audioplayers/audioplayers.dart';
import '../services/api_service.dart';
import '../widgets/times_up_dialog.dart';
import '../widgets/premium_paywall.dart';
import '../services/localization.dart';

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

  String _viewState = 'TESTS'; // TESTS, DETAILS, PRACTICE
  int _selectedBook = 10;
  int _selectedTest = 1;
  bool _enableAudioControls = false;

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

  List<dynamic> _getMockQuestions() {
    final List<dynamic> list = [];
    final part1Questions = [
      "Name of clerk: ___",
      "Survey start time: ___",
      "Most frequent transport mode used: ___",
      "Nearest train ___ is 2 miles away.",
      "Primary purpose of travel: ___",
      "The trains are generally ___ and tidy.",
      "Customer complains about the ___'s attitude.",
      "Wants to submit an official ___.",
      "Usually gets a ___ easily in the morning.",
      "Believes the ticket ___ is too high."
    ];
    final part1Answers = [
      "Sarah", "1:30", "bus", "station", "shopping", "clean", "driver", "complaint", "seat", "price"
    ];

    for (int i = 0; i < 10; i++) {
      list.add({
        'id': 'b10t1l_q${i+1}',
        'questionType': 'SHORT_ANSWER',
        'difficulty': 'BEGINNER',
        'instruction': 'Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
        'questionText': part1Questions[i],
        'correctAnswer': part1Answers[i],
        'explanation': 'Based on the recording conversation in Part 1.'
      });
    }

    final part2Questions = [
      "The recreation center expansion was funded mainly by:",
      "The new swimming pool will open on:",
      "Who will cut the ribbon during the ceremony?",
      "The fitness gym entrance fee for members is:",
      "The new yoga studio is located on the:",
      "Which facility requires advance reservation?",
      "The main café now offers more choices of:",
      "The children's play area has been moved next to the:",
      "Parking capacity has been increased by:",
      "The center is now closed on which day?"
    ];
    final part2Options = [
      [
        {'optionLetter': 'A', 'optionText': 'Local council grants'},
        {'optionLetter': 'B', 'optionText': 'Private member donations'},
        {'optionLetter': 'C', 'optionText': 'National lottery funding'}
      ],
      [
        {'optionLetter': 'A', 'optionText': 'First Monday of July'},
        {'optionLetter': 'B', 'optionText': 'Second Saturday of August'},
        {'optionLetter': 'C', 'optionText': 'Last Friday of September'}
      ],
      [
        {'optionLetter': 'A', 'optionText': 'The Mayor'},
        {'optionLetter': 'B', 'optionText': 'A local Olympic athlete'},
        {'optionLetter': 'C', 'optionText': 'The center director'}
      ],
      [
        {'optionLetter': 'A', 'optionText': 'Totally free of charge'},
        {'optionLetter': 'B', 'optionText': 'Half price on weekdays'},
        {'optionLetter': 'C', 'optionText': 'Standard entry fee'}
      ],
      [
        {'optionLetter': 'A', 'optionText': 'Ground floor'},
        {'optionLetter': 'B', 'optionText': 'First floor'},
        {'optionLetter': 'C', 'optionText': 'Basement level'}
      ],
      [
        {'optionLetter': 'A', 'optionText': 'Squash courts'},
        {'optionLetter': 'B', 'optionText': 'Sauna room'},
        {'optionLetter': 'C', 'optionText': 'Tennis courts'}
      ],
      [
        {'optionLetter': 'A', 'optionText': 'Hot meals'},
        {'optionLetter': 'B', 'optionText': 'Organic beverages'},
        {'optionLetter': 'C', 'optionText': 'Gluten-free snacks'}
      ],
      [
        {'optionLetter': 'A', 'optionText': 'Reception lobby'},
        {'optionLetter': 'B', 'optionText': 'Outdoor courtyard'},
        {'optionLetter': 'C', 'optionText': 'Swimming pool view area'}
      ],
      [
        {'optionLetter': 'A', 'optionText': '50 spaces'},
        {'optionLetter': 'B', 'optionText': '100 spaces'},
        {'optionLetter': 'C', 'optionText': '150 spaces'}
      ],
      [
        {'optionLetter': 'A', 'optionText': 'Sundays'},
        {'optionLetter': 'B', 'optionText': 'Mondays'},
        {'optionLetter': 'C', 'optionText': 'Tuesdays'}
      ],
    ];
    final part2Answers = [
      "C", "A", "B", "A", "B", "C", "C", "A", "B", "B"
    ];

    for (int i = 0; i < 10; i++) {
      list.add({
        'id': 'b10t1l_q${i+11}',
        'questionType': 'MULTIPLE_CHOICE',
        'difficulty': 'INTERMEDIATE',
        'instruction': 'Choose the correct letter, A, B or C.',
        'questionText': part2Questions[i],
        'options': part2Options[i],
        'correctAnswer': part2Answers[i],
        'explanation': 'Based on the monologue in Part 2.'
      });
    }

    final part3Questions = [
      "The students chose the marketing topic because:",
      "Which database did the professor recommend first?",
      "The primary issue with the first case study was:",
      "How did they collect the survey questionnaires?",
      "The response rate of the survey was approximately:",
      "What surprised the students about the survey results?",
      "The students decide to shorten their presentation because:",
      "Who will present the statistics slide?",
      "The professor advised them to add more:",
      "Their final draft needs to be submitted by:"
    ];
    final part3Options = [
      [
        {'optionLetter': 'A', 'optionText': 'It was easy to find data'},
        {'optionLetter': 'B', 'optionText': 'They both had interest in retail'},
        {'optionLetter': 'C', 'optionText': 'It was suggested by a senior'}
      ],
      [
        {'optionLetter': 'A', 'optionText': 'Business Source Complete'},
        {'optionLetter': 'B', 'optionText': 'Emerald Insight'},
        {'optionLetter': 'C', 'optionText': 'Google Scholar'}
      ],
      [
        {'optionLetter': 'A', 'optionText': 'Outdated statistics'},
        {'optionLetter': 'B', 'optionText': 'Irrelevant conclusion'},
        {'optionLetter': 'C', 'optionText': 'Lack of detail'}
      ],
      [
        {'optionLetter': 'A', 'optionText': 'Sent via email list'},
        {'optionLetter': 'B', 'optionText': 'Handed out in library lobby'},
        {'optionLetter': 'C', 'optionText': 'Posted on social media group'}
      ],
      [
        {'optionLetter': 'A', 'optionText': '35%'},
        {'optionLetter': 'B', 'optionText': '60%'},
        {'optionLetter': 'C', 'optionText': '85%'}
      ],
      [
        {'optionLetter': 'A', 'optionText': 'A high degree of customer loyalty'},
        {'optionLetter': 'B', 'optionText': 'Preference for online delivery'},
        {'optionLetter': 'C', 'optionText': 'Dislike of automated checkout'}
      ],
      [
        {'optionLetter': 'A', 'optionText': 'Strict 10-minute limit'},
        {'optionLetter': 'B', 'optionText': 'Two slides were redundant'},
        {'optionLetter': 'C', 'optionText': 'They want more time for Q&A'}
      ],
      [
        {'optionLetter': 'A', 'optionText': 'Jack'},
        {'optionLetter': 'B', 'optionText': 'Lisa'},
        {'optionLetter': 'C', 'optionText': 'Both of them'}
      ],
      [
        {'optionLetter': 'A', 'optionText': 'Visual charts'},
        {'optionLetter': 'B', 'optionText': 'Academic references'},
        {'optionLetter': 'C', 'optionText': 'Critical analysis'}
      ],
      [
        {'optionLetter': 'A', 'optionText': 'Next Wednesday'},
        {'optionLetter': 'B', 'optionText': 'Next Friday'},
        {'optionLetter': 'C', 'optionText': 'End of the month'}
      ],
    ];
    final part3Answers = [
      "B", "A", "A", "B", "B", "A", "A", "C", "C", "B"
    ];

    for (int i = 0; i < 10; i++) {
      list.add({
        'id': 'b10t1l_q${i+21}',
        'questionType': 'MULTIPLE_CHOICE',
        'difficulty': 'INTERMEDIATE',
        'instruction': 'Choose the correct letter, A, B or C.',
        'questionText': part3Questions[i],
        'options': part3Options[i],
        'correctAnswer': part3Answers[i],
        'explanation': 'Based on the academic discussion in Part 3.'
      });
    }

    final part4Questions = [
      "Sleep patterns are regulated by a ___ clock.",
      "Most mammals sleep for a ___ of their day.",
      "Birds can sleep while flying due to unihemispheric ___ activity.",
      "Predator species tend to sleep more ___ than prey species.",
      "Prey species have developed ___ sleep cycles to stay alert.",
      "Lack of sleep reduces the efficiency of the animal's ___ system.",
      "Slower brainwaves during deep sleep help in memory ___.",
      "Sea lions sleep in water to escape land-based ___.",
      "Dolphins keep one ___ open while sleeping.",
      "The study concluded that sleep is essential for brain ___."
    ];
    final part4Answers = [
      "biological", "third", "brain", "deeply", "short", "immune", "consolidation", "predators", "eye", "recovery"
    ];

    for (int i = 0; i < 10; i++) {
      list.add({
        'id': 'b10t1l_q${i+31}',
        'questionType': 'SHORT_ANSWER',
        'difficulty': 'ADVANCED',
        'instruction': 'Write NO MORE THAN ONE WORD for each answer.',
        'questionText': part4Questions[i],
        'correctAnswer': part4Answers[i],
        'explanation': 'Based on the lecture recording in Part 4.'
      });
    }

    return list;
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
        });
      }
    } catch (e) {
      debugPrint('Error fetching listening audios: $e');
    } finally {
      setState(() {
        if (_audios.isEmpty) {
          _audios = [
            {
              'id': 'b10t1_listening',
              'title': 'IELTS Book 10 Test 1',
              'audioUrl': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
              'practiceQuestions': _getMockQuestions(),
            }
          ];
        }
        _selectedAudio = _audios[0];
        _loading = false;
      });
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
        showTimesUpDialog(context, _submitAnswers);
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

  void _startListeningTest() {
    setState(() {
      _viewState = 'PRACTICE';
    });
    _startTimer();
  }

  Future<void> _seekRelative(int seconds) async {
    final target = _position + Duration(seconds: seconds);
    final clamped = target < Duration.zero 
        ? Duration.zero 
        : (target > _duration ? _duration : target);
    await _audioPlayer.seek(clamped);
  }

  void _showAudioControlsWarning() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
        ),
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: const BoxDecoration(
                  color: Color(0xFFFFF3E0),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.warning_amber_rounded,
                  color: Color(0xFFFF9800),
                  size: 36,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Warning',
                style: TextStyle(
                  color: Color(0xFF1E293B),
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'In the real IELTS test, you cannot pause, rewind, or fast-forward the audio once it begins. Are you sure you want to enable controls for practice?',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Color(0xFF64748B),
                  fontSize: 13,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: SizedBox(
                      height: 44,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFF1F5F9),
                          foregroundColor: const Color(0xFF475569),
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        onPressed: () => Navigator.pop(context),
                        child: const Text(
                          'Cancel',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: SizedBox(
                      height: 44,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFC62828),
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        onPressed: () {
                          Navigator.pop(context);
                          setState(() {
                            _enableAudioControls = true;
                          });
                        },
                        child: const Text(
                          'Enable',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showExitConfirmation() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
        ),
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: const BoxDecoration(
                  color: Color(0xFFFFF3E0),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.warning_amber_rounded,
                  color: Color(0xFFFF9800),
                  size: 36,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'End Test?',
                style: TextStyle(
                  color: Color(0xFF1E293B),
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Are you sure you want to end this test?\nYour progress will be lost.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Color(0xFF64748B),
                  fontSize: 13,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: SizedBox(
                      height: 44,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFFFE4E6),
                          foregroundColor: const Color(0xFFE11D48),
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        onPressed: () {
                          Navigator.pop(context);
                          _audioPlayer.stop();
                          _timer?.cancel();
                          setState(() {
                            _timerActive = false;
                            _viewState = 'DETAILS';
                          });
                        },
                        child: const Text(
                          'End Test',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: SizedBox(
                      height: 44,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFC62828),
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        onPressed: () => Navigator.pop(context),
                        child: const Text(
                          'Cancel',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showIncompleteAnswersDialog(int answeredCount, int totalQuestions) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
        ),
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: const BoxDecoration(
                  color: Color(0xFFFFF3E0),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.warning_amber_rounded,
                  color: Color(0xFFFF9800),
                  size: 36,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Incomplete Answers',
                style: TextStyle(
                  color: Color(0xFF1E293B),
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'You have answered $answeredCount out of $totalQuestions questions.\nAre you sure you want to proceed?',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Color(0xFF64748B),
                  fontSize: 13,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: SizedBox(
                      height: 44,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFF1F5F9),
                          foregroundColor: const Color(0xFF475569),
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        onPressed: () => Navigator.pop(context),
                        child: const Text(
                          'Cancel',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: SizedBox(
                      height: 44,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFC62828),
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        onPressed: () {
                          Navigator.pop(context);
                          _submitAnswers();
                        },
                        child: const Text(
                          'Proceed',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String range, String type, String instruction) {
    return Padding(
      padding: const EdgeInsets.only(top: 16.0, bottom: 12.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            range,
            style: const TextStyle(
              color: Color(0xFF1E293B),
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            type,
            style: const TextStyle(
              color: Color(0xFFEF4444),
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            instruction,
            style: const TextStyle(
              color: Color(0xFF64748B),
              fontSize: 12.5,
              fontStyle: FontStyle.italic,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: Color(0xFFF8FAFC),
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFFEF4444)),
        ),
      );
    }

    if (_viewState == 'TESTS') {
      return _buildTestsView();
    } else if (_viewState == 'DETAILS') {
      return _buildDetailsView();
    } else {
      return _buildPracticeView();
    }
  }

  Widget _buildTestsView() {
    final List<Map<String, int>> allTests = [];
    for (int book = 10; book <= 21; book++) {
      for (int test = 1; test <= 4; test++) {
        allTests.add({'book': book, 'test': test});
      }
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF8FAFC),
        elevation: 0,
        leadingWidth: 80,
        leading: TextButton.icon(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFFEF4444), size: 16),
          label: const Text('Back', style: TextStyle(color: Color(0xFFEF4444), fontWeight: FontWeight.bold, fontSize: 14)),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Listening Practice',
              style: TextStyle(
                color: Color(0xFF1E293B),
                fontSize: 28,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Improve your listening comprehension',
              style: TextStyle(color: Color(0xFF64748B), fontSize: 13),
            ),
            const SizedBox(height: 24),
            const Text(
              'Available Tests',
              style: TextStyle(color: Color(0xFF1E293B), fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: allTests.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final testItem = allTests[index];
                final bookNum = testItem['book']!;
                final testNum = testItem['test']!;
                final isUnlocked = bookNum == 10 && testNum == 1;

                return InkWell(
                  onTap: () {
                    if (isUnlocked) {
                      setState(() {
                        _selectedBook = bookNum;
                        _selectedTest = testNum;
                        _viewState = 'DETAILS';
                        _enableAudioControls = false;
                        _userAnswers.clear();
                        _feedback = null;
                        _examSuccess = false;
                      });
                    } else {
                      showPremiumPaywall(context);
                    }
                  },
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: const Color(0xFFE2E8F0),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.02),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: isUnlocked ? const Color(0xFFFFE4E6) : const Color(0xFFF1F5F9),
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Icon(
                              isUnlocked ? Icons.headphones_rounded : Icons.lock_outline_rounded,
                              color: isUnlocked ? const Color(0xFFEF4444) : const Color(0xFF64748B),
                              size: 20,
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'IELTS Book $bookNum Test $testNum',
                                style: TextStyle(
                                  color: isUnlocked ? const Color(0xFF1E293B) : const Color(0xFF64748B),
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                isUnlocked ? '4 Sections • 40 Questions' : 'Premium Content',
                                style: const TextStyle(
                                  color: Color(0xFF94A3B8),
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Icon(
                          Icons.chevron_right_rounded,
                          color: Color(0xFF94A3B8),
                          size: 20,
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.white,
        selectedItemColor: const Color(0xFFC62828),
        unselectedItemColor: Colors.black38,
        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 10),
        unselectedLabelStyle: const TextStyle(fontSize: 10),
        onTap: (index) {
          if (index != 0) {
            Navigator.pop(context, index);
          }
        },
        items: [
          BottomNavigationBarItem(icon: const Icon(Icons.home), label: LocalizationService.translate('menu_home')),
          BottomNavigationBarItem(icon: const Icon(Icons.calendar_month), label: LocalizationService.translate('menu_plan')),
          BottomNavigationBarItem(icon: const Icon(Icons.construction), label: LocalizationService.translate('menu_tools')),
          BottomNavigationBarItem(icon: const Icon(Icons.history), label: LocalizationService.translate('menu_history')),
          BottomNavigationBarItem(icon: const Icon(Icons.settings), label: LocalizationService.translate('menu_settings')),
        ],
      ),
    );
  }

  Widget _buildDetailsView() {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        centerTitle: true,
        title: const Text(
          'Test Details',
          style: TextStyle(color: Color(0xFF1E293B), fontWeight: FontWeight.bold, fontSize: 16),
        ),
        leadingWidth: 80,
        leading: TextButton.icon(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFFEF4444), size: 16),
          label: const Text('Back', style: TextStyle(color: Color(0xFFEF4444), fontWeight: FontWeight.bold, fontSize: 14)),
          onPressed: () => setState(() => _viewState = 'TESTS'),
        ),
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20.0, 20.0, 20.0, 100.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'IELTS Book $_selectedBook Test $_selectedTest',
                  style: const TextStyle(
                    color: Color(0xFF1E293B),
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Icon(Icons.format_list_bulleted_rounded, color: Color(0xFFEF4444), size: 16),
                    const SizedBox(width: 6),
                    const Text(
                      '4 Sections',
                      style: TextStyle(color: Color(0xFFEF4444), fontWeight: FontWeight.bold, fontSize: 12.5),
                    ),
                    const SizedBox(width: 16),
                    const Icon(Icons.help_outline_rounded, color: Color(0xFF64748B), size: 16),
                    const SizedBox(width: 6),
                    const Text(
                      '40 Questions',
                      style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.bold, fontSize: 12.5),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Text(
                  'The Listening test takes approximately 30-40 minutes. You will hear four recordings of native English speakers and then write your answers to a series of questions.',
                  style: TextStyle(color: Color(0xFF64748B), fontSize: 13, height: 1.5),
                ),
                const SizedBox(height: 24),

                // Enable Audio Controls Switch Card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Enable Audio Controls',
                              style: TextStyle(
                                color: Color(0xFF1E293B),
                                fontSize: 14.5,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Allow pausing, rewinding, and fast-forwarding.',
                              style: TextStyle(
                                color: Color(0xFF64748B),
                                fontSize: 11.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Switch(
                        value: _enableAudioControls,
                        activeColor: Colors.white,
                        activeTrackColor: const Color(0xFFEF4444),
                        inactiveThumbColor: Colors.white,
                        inactiveTrackColor: const Color(0xFFCBD5E1),
                        onChanged: (val) {
                          if (val) {
                            _showAudioControlsWarning();
                          } else {
                            setState(() {
                              _enableAudioControls = false;
                            });
                          }
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 28),

                const Text(
                  'Test Structure',
                  style: TextStyle(color: Color(0xFF1E293B), fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),

                // Parts List
                _buildPartCard(
                  'Part 1',
                  '10 Questions',
                  'A conversation between two people set in an everyday social context.',
                ),
                const SizedBox(height: 12),
                _buildPartCard(
                  'Part 2',
                  '10 Questions',
                  'A monologue set in an everyday social context, e.g. a speech about local facilities.',
                ),
                const SizedBox(height: 12),
                _buildPartCard(
                  'Part 3',
                  '10 Questions',
                  'A conversation between up to four people set in an educational or training context.',
                ),
                const SizedBox(height: 12),
                _buildPartCard(
                  'Part 4',
                  '10 Questions',
                  'A monologue on an academic subject, e.g. a university lecture.',
                ),
                const SizedBox(height: 16),

                // Hidden prompt card
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    children: [
                      Icon(Icons.lock_rounded, color: const Color(0xFF64748B).withOpacity(0.5), size: 32),
                      const SizedBox(height: 12),
                      const Text(
                        'Questions and audio will remain hidden until you start the test to simulate real exam conditions.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Color(0xFF64748B),
                          fontSize: 12.5,
                          height: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Positioned(
            left: 20,
            right: 20,
            bottom: 20,
            child: SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                icon: const Icon(Icons.headphones_rounded, color: Colors.white, size: 18),
                label: const Text(
                  'Start Test',
                  style: TextStyle(
                    fontSize: 15,
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFC62828),
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                onPressed: _startListeningTest,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPartCard(String part, String questionCount, String description) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                part,
                style: const TextStyle(
                  color: Color(0xFF1E293B),
                  fontWeight: FontWeight.bold,
                  fontSize: 14.5,
                ),
              ),
              Text(
                questionCount,
                style: const TextStyle(
                  color: Color(0xFF64748B),
                  fontSize: 12.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            description,
            style: const TextStyle(
              color: Color(0xFF64748B),
              fontSize: 12.5,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPracticeView() {
    final questions = _selectedAudio != null ? (_selectedAudio['practiceQuestions'] as List? ?? []) : [];
    final int answeredCount = _userAnswers.keys.where((k) => _userAnswers[k] != null && _userAnswers[k]!.isNotEmpty).length;
    final int totalQuestions = questions.length;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded, color: Color(0xFF1E293B)),
          onPressed: _showExitConfirmation,
        ),
        title: Text(
          'IELTS Book $_selectedBook Test $_selectedTest',
          style: const TextStyle(color: Color(0xFF1E293B), fontWeight: FontWeight.bold, fontSize: 15),
        ),
        actions: [
          if (_timerActive) ...[
            Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFFEE2E2),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  const Icon(Icons.timer_outlined, color: Color(0xFFEF4444), size: 14),
                  const SizedBox(width: 4),
                  Text(
                    _formatTime(_timeLeft),
                    style: const TextStyle(color: Color(0xFFEF4444), fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
            Container(
              margin: const EdgeInsets.only(right: 16),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFFEE2E2),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '$answeredCount/$totalQuestions',
                style: const TextStyle(color: Color(0xFFEF4444), fontSize: 11, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (_selectedAudio != null && _selectedAudio['audioUrl'] != null) ...[
              if (_enableAudioControls)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.replay_10_rounded, color: Color(0xFFEF4444), size: 28),
                            onPressed: () => _seekRelative(-10),
                          ),
                          const SizedBox(width: 16),
                          IconButton(
                            icon: Icon(
                              _playerState == PlayerState.playing
                                  ? Icons.pause_circle_filled_rounded
                                  : Icons.play_circle_filled_rounded,
                              color: const Color(0xFFEF4444),
                              size: 48,
                            ),
                            onPressed: _playerState == PlayerState.playing ? _pauseAudio : _playAudio,
                          ),
                          const SizedBox(width: 16),
                          IconButton(
                            icon: const Icon(Icons.forward_10_rounded, color: Color(0xFFEF4444), size: 28),
                            onPressed: () => _seekRelative(10),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      SliderTheme(
                        data: SliderTheme.of(context).copyWith(
                          activeTrackColor: const Color(0xFFEF4444),
                          inactiveTrackColor: const Color(0xFFE2E8F0),
                          thumbColor: const Color(0xFFEF4444),
                          overlayColor: const Color(0xFFEF4444).withOpacity(0.2),
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
                            Text(_formatDuration(_position), style: const TextStyle(color: Color(0xFF64748B), fontSize: 10, fontFamily: 'monospace')),
                            Text(_formatDuration(_duration), style: const TextStyle(color: Color(0xFF64748B), fontSize: 10, fontFamily: 'monospace')),
                          ],
                        ),
                      ),
                    ],
                  ),
                )
              else
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    children: [
                      const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.headphones_rounded, color: Color(0xFFEF4444), size: 20),
                          SizedBox(width: 8),
                          Text(
                            'EXAM MODE',
                            style: TextStyle(
                              color: Color(0xFFEF4444),
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                              letterSpacing: 1.1,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Audio plays continuously once. Seek and pause controls are disabled to simulate actual IELTS exam conditions.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Color(0xFF64748B), fontSize: 11.5, height: 1.4),
                      ),
                      const SizedBox(height: 12),
                      SliderTheme(
                        data: SliderTheme.of(context).copyWith(
                          activeTrackColor: const Color(0xFFEF4444),
                          inactiveTrackColor: const Color(0xFFCBD5E1),
                          thumbShape: SliderComponentShape.noThumb,
                          trackHeight: 3.0,
                        ),
                        child: Slider(
                          min: 0.0,
                          max: _duration.inMilliseconds.toDouble(),
                          value: _position.inMilliseconds.toDouble().clamp(0.0, _duration.inMilliseconds.toDouble()),
                          onChanged: null,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
            const SizedBox(height: 24),

            if (_feedback != null)
              Container(
                margin: const EdgeInsets.only(bottom: 20),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Practice Results',
                          style: TextStyle(
                            color: Color(0xFF1E293B),
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDCFCE7),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'Score: ${_feedback['correctCount']} / ${_feedback['totalCount']}',
                            style: const TextStyle(
                              color: Color(0xFF15803D),
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const Divider(color: Color(0xFFE2E8F0), height: 32),
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
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: isCorrect ? const Color(0xFFBBF7D0) : const Color(0xFFFECDD3),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'Question ${idx + 1}',
                                    style: const TextStyle(
                                      color: Color(0xFF64748B),
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  Text(
                                    isCorrect ? 'Correct' : 'Incorrect',
                                    style: TextStyle(
                                      color: isCorrect ? const Color(0xFF15803D) : const Color(0xFFB91C1C),
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                res['questionText'] ?? '',
                                style: const TextStyle(
                                  color: Color(0xFF1E293B),
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 10),
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      'Your Answer: ${res['userAnswer']}',
                                      style: TextStyle(
                                        color: isCorrect ? const Color(0xFF15803D) : const Color(0xFFB91C1C),
                                        fontSize: 11,
                                      ),
                                    ),
                                  ),
                                  Expanded(
                                    child: Text(
                                      'Correct: ${res['correctAnswerStr']}',
                                      style: const TextStyle(
                                        color: Color(0xFFEF4444),
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              const Text(
                                'Explanation:',
                                style: TextStyle(
                                  color: Color(0xFF64748B),
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                res['explanation'] ?? '',
                                style: const TextStyle(
                                  color: Color(0xFF475569),
                                  fontSize: 11,
                                  fontStyle: FontStyle.italic,
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),

            if (_examSuccess)
              Container(
                margin: const EdgeInsets.only(bottom: 20),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFBBF7D0)),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.stars_rounded, color: Color(0xFF15803D), size: 40),
                    const SizedBox(height: 12),
                    const Text(
                      'Exam Submitted Successfully!',
                      style: TextStyle(
                        color: Color(0xFF15803D),
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Your answers have been logged in Exam Mode for evaluation. You can check details in Attempt History later.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Color(0xFF15803D), fontSize: 12),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => setState(() => _examSuccess = false),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF15803D),
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Practice Again'),
                    ),
                  ],
                ),
              ),

            ...questions.asMap().entries.map((entry) {
              final int index = entry.key;
              final q = entry.value;
              final qId = q['id'];
              final String qTypeStr = q['questionType'] == 'MULTIPLE_CHOICE'
                  ? 'Choose the Correct Letter'
                  : 'Short Answer';

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (index == 0)
                    _buildSectionHeader(
                      'Questions 1-10',
                      'Part 1: Social Conversation',
                      q['instruction'] ?? 'Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
                    ),
                  if (index == 10)
                    _buildSectionHeader(
                      'Questions 11-20',
                      'Part 2: Social Monologue',
                      q['instruction'] ?? 'Choose the correct letter, A, B or C.',
                    ),
                  if (index == 20)
                    _buildSectionHeader(
                      'Questions 21-30',
                      'Part 3: Educational Conversation',
                      q['instruction'] ?? 'Choose the correct letter, A, B or C.',
                    ),
                  if (index == 30)
                    _buildSectionHeader(
                      'Questions 31-40',
                      'Part 4: Academic Monologue',
                      q['instruction'] ?? 'Write NO MORE THAN ONE WORD for each answer.',
                    ),

                  Container(
                    margin: const EdgeInsets.only(bottom: 20),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                color: const Color(0xFFC62828),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                'Q${index + 1}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              qTypeStr,
                              style: const TextStyle(
                                color: Color(0xFF64748B),
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          q['questionText'] ?? '',
                          style: const TextStyle(
                            color: Color(0xFF1E293B),
                            fontSize: 13.5,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 16),
                        if (q['questionType'] == 'MULTIPLE_CHOICE')
                          Column(
                            children: (q['options'] as List? ?? []).map((opt) {
                              final letter = opt['optionLetter'] ?? '';
                              final optionText = opt['optionText'] ?? '';
                              final isSelected = _userAnswers[qId] == letter;
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 8.0),
                                child: InkWell(
                                  onTap: () {
                                    setState(() {
                                      _userAnswers[qId] = letter;
                                    });
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                    decoration: BoxDecoration(
                                      color: isSelected ? const Color(0xFFFFE4E6) : Colors.white,
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                        color: isSelected ? const Color(0xFFEF4444) : const Color(0xFFE2E8F0),
                                        width: 1.5,
                                      ),
                                    ),
                                    child: Row(
                                      children: [
                                        Container(
                                          width: 18,
                                          height: 18,
                                          decoration: BoxDecoration(
                                            shape: BoxShape.circle,
                                            border: Border.all(
                                              color: isSelected ? const Color(0xFFEF4444) : const Color(0xFF94A3B8),
                                              width: 1.5,
                                            ),
                                          ),
                                          child: isSelected
                                              ? const Center(
                                                  child: Icon(Icons.circle, color: Color(0xFFEF4444), size: 10),
                                                )
                                              : null,
                                        ),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: Text(
                                            "$letter. $optionText",
                                            style: const TextStyle(
                                              color: Color(0xFF1E293B),
                                              fontSize: 12.5,
                                          ),
                                        ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            }).toList(),
                          )
                        else
                          TextFormField(
                            key: ValueKey(qId),
                            initialValue: _userAnswers[qId] ?? '',
                            onChanged: (val) {
                              setState(() {
                                _userAnswers[qId] = val;
                              });
                            },
                            style: const TextStyle(color: Color(0xFF1E293B), fontSize: 13),
                            decoration: InputDecoration(
                              hintText: 'Type your answer',
                              hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12.5),
                              filled: true,
                              fillColor: const Color(0xFFF8FAFC),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: Color(0xFFEF4444)),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              );
            }).toList(),
            const SizedBox(height: 16),

            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton.icon(
                icon: const Icon(Icons.assignment_turned_in_outlined, color: Color(0xFFC62828), size: 18),
                label: const Text(
                  'See Results',
                  style: TextStyle(
                    color: Color(0xFFC62828),
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                style: OutlinedButton.styleFrom(
                  backgroundColor: const Color(0xFFFFE4E6),
                  side: const BorderSide(color: Color(0xFFFECDD3)),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                onPressed: () {
                  if (answeredCount < totalQuestions) {
                    _showIncompleteAnswersDialog(answeredCount, totalQuestions);
                  } else {
                    _submitAnswers();
                  }
                },
              ),
            ),
            const SizedBox(height: 40),
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
