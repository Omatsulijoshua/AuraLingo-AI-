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

  String _viewState = 'TESTS'; // TESTS, DETAILS, PRACTICE, RESULTS
  int _selectedBook = 10;
  int _selectedTest = 1;
  bool _enableAudioControls = false;
  bool _showAnswers = false;
  int _selectedPartTab = 1; // 1, 2, 3, or 4

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

    // Part 1 Questions
    final part1Questions = [
      "Address: 24 ___ Road",
      "Heard about company from: ___",
      "Trip One - Los Angeles: customer wants to visit some ___ parks with her children",
      "Trip One - Yosemite Park: customer wants to stay in a lodge, not a ___",
      "Trip Two: customer wants to see the ___ on the way to Cambria",
      "Trip Two - At San Diego: wants to spend time on the ___",
      "Trip One (12 days) - Total distance: ___ km",
      "Trip One (£525) - Includes: accommodation, car, one ___",
      "Trip Two (9 days, 980 km) - Price per person: £___",
      "Trip Two - Includes: accommodation, car, ___"
    ];
    final part1Answers = [
      "Ardleigh", "newspaper", "theme", "tent", "castle", "beach", "2020", "flight", "429", "dinner"
    ];
    final part1Explanations = [
      "'24, Ardleigh Road.' - spelled out as A-R-D-L-E-I-G-H.",
      "'No, I read about you in the newspaper.' Not a friend and not an advert.",
      "'The first one begins in Los Angeles and there's plenty of time to visit some of the theme parks there.'",
      "'We wanted to stay in a lodge, but they were full, so we decided on a tent instead.'",
      "'She really wants to stop off and see the Hearst Castle on the way.'",
      "'Then in San Diego, we'll spend most of our time at the beach.'",
      "'The total distance for Trip One is about two thousand and twenty kilometers.'",
      "'The price includes accommodation, car hire, and one internal flight.'",
      "'It is four hundred and twenty-nine pounds per person.'",
      "'This trip includes accommodation, car hire, and dinner.'"
    ];

    for (int i = 0; i < 10; i++) {
      list.add({
        'id': 'b10t1l_q${i+1}',
        'questionType': 'SHORT_ANSWER',
        'difficulty': 'BEGINNER',
        'instruction': i < 6
            ? 'Note Completion (Write ONE WORD for each answer)'
            : 'Table Completion (Write ONE WORD AND/OR A NUMBER for each answer)',
        'questionText': part1Questions[i],
        'correctAnswer': part1Answers[i],
        'explanation': part1Explanations[i]
      });
    }

    // Part 2 Questions
    final part2Questions = [
      "Which facility at the leisure club has recently been improved first?",
      "Which other facility at the leisure club has recently been improved?",
      "Personal Assessment: New members should describe any ___",
      "The ___ will be explained to you before you use the equipment.",
      "You will be given a six-week ___",
      "Types of membership: There is a compulsory £90 ___ fee for members.",
      "Gold members are given ___ to all the LP clubs.",
      "Premier members are given priority during ___ hours.",
      "Premier members can bring some ___ every month.",
      "Members should always take their ___ with them."
    ];
    final part2Options = [
      [
        {'optionLetter': 'A', 'optionText': 'the gym'},
        {'optionLetter': 'B', 'optionText': 'the tracks'},
        {'optionLetter': 'C', 'optionText': 'the outdoor pool'},
        {'optionLetter': 'D', 'optionText': 'the sports training for children'}
      ],
      [
        {'optionLetter': 'A', 'optionText': 'the gym'},
        {'optionLetter': 'B', 'optionText': 'the tracks'},
        {'optionLetter': 'C', 'optionText': 'the indoor pool'},
        {'optionLetter': 'D', 'optionText': 'the sports training for children'}
      ]
    ];
    final part2Answers = [
      "A", "C", "health problems", "safety rules", "plan", "joining", "free entry", "peak", "guests", "photo card"
    ];
    final part2Explanations = [
      "The gym has been refurbished with state-of-the-art machines.",
      "We've also upgraded the indoor pool with a brand-new heating system.",
      "New members should describe any health problems they have.",
      "The safety rules will be explained to you before you use any equipment.",
      "You will be given a six-week personal fitness plan.",
      "There is a compulsory ninety pounds joining fee for new members.",
      "Gold membership gives you free entry to all the other LP clubs.",
      "Premier members get priority booking during peak hours.",
      "Premier members are allowed to bring some guests every month.",
      "All members must carry their photo card at all times."
    ];

    for (int i = 0; i < 10; i++) {
      final isMCQ = i < 2;
      list.add({
        'id': 'b10t1l_q${i+11}',
        'questionType': isMCQ ? 'MULTIPLE_CHOICE' : 'SHORT_ANSWER',
        'difficulty': 'INTERMEDIATE',
        'instruction': isMCQ ? 'Choose the correct letter, A, B, C or D.' : 'Complete the notes below. Write NO MORE THAN TWO WORDS for each answer.',
        'questionText': part2Questions[i],
        if (isMCQ) 'options': part2Options[i],
        'correctAnswer': part2Answers[i],
        'explanation': part2Explanations[i]
      });
    }

    // Part 3 Questions
    final part3Questions = [
      "What is the main focus of this year’s design competition?",
      "Which aspect of the appliance should the design focus on?",
      "What is the problem with the current kitchen appliance?",
      "What is the requirement for the new design?",
      "What is the benefit of the competition for students?",
      "The students must submit a ___",
      "They also need to provide a ___",
      "They should specify the ___ used.",
      "The winning design will receive a ___",
      "The focus of the evaluation will be ___"
    ];
    final part3Options = [
      [
        {'optionLetter': 'A', 'optionText': 'a new kitchen appliance'},
        {'optionLetter': 'B', 'optionText': 'a more energy-efficient design'},
        {'optionLetter': 'C', 'optionText': 'a new use for current technology'}
      ],
      [
        {'optionLetter': 'A', 'optionText': 'ease of use'},
        {'optionLetter': 'B', 'optionText': 'aesthetic appeal'},
        {'optionLetter': 'C', 'optionText': 'low manufacturing cost'}
      ],
      [
        {'optionLetter': 'A', 'optionText': 'it is too expensive'},
        {'optionLetter': 'B', 'optionText': 'it is too complicated'},
        {'optionLetter': 'C', 'optionText': 'it is difficult to clean'}
      ],
      [
        {'optionLetter': 'A', 'optionText': 'it must be attractive'},
        {'optionLetter': 'B', 'optionText': 'it must be made of recyclable materials'},
        {'optionLetter': 'C', 'optionText': 'it must be compact'}
      ],
      [
        {'optionLetter': 'A', 'optionText': 'winning a cash prize'},
        {'optionLetter': 'B', 'optionText': 'meeting industry experts'},
        {'optionLetter': 'C', 'optionText': 'gaining practical experience'}
      ]
    ];
    final part3Answers = [
      "C", "A", "B", "A", "C", "presentation", "model", "material", "grant", "technical"
    ];
    final part3Explanations = [
      "The competition focus is finding a new use for existing household technology.",
      "The appliance must be extremely easy to use for elderly people.",
      "The biggest problem is that it is too complicated with too many buttons.",
      "The design brief specifies that the design must look attractive.",
      "The biggest advantage is gaining practical work experience.",
      "Students must submit a detailed presentation of their concept.",
      "They are also required to build a physical model.",
      "The design report must list all the materials used.",
      "The winning design will be awarded a research grant.",
      "The panel's evaluation will be heavily technical."
    ];

    for (int i = 0; i < 10; i++) {
      final isMCQ = i < 5;
      list.add({
        'id': 'b10t1l_q${i+21}',
        'questionType': isMCQ ? 'MULTIPLE_CHOICE' : 'SHORT_ANSWER',
        'difficulty': 'INTERMEDIATE',
        'instruction': isMCQ ? 'Choose the correct letter, A, B or C.' : 'Complete the notes below. Write NO MORE THAN TWO WORDS for each answer.',
        'questionText': part3Questions[i],
        if (isMCQ) 'options': part3Options[i],
        'correctAnswer': part3Answers[i],
        'explanation': part3Explanations[i]
      });
    }

    // Part 4 Questions
    final part4Questions = [
      "Its colour comes from an uncommon ___",
      "Local people believe that it has unusual ___",
      "They protect the bear from ___",
      "The surrounding landscape is affected by ___",
      "Bears are often found on ___",
      "The habitats are threatened by the construction of ___",
      "The bears' diet often consists of ___",
      "A key factor in the bear's survival is ___",
      "Researchers use a specific ___ to study the bears.",
      "Future efforts will focus on habitat ___"
    ];
    final part4Answers = [
      "gene", "power", "strangers", "erosion", "islands", "roads", "fishing", "reproduction", "method", "expansion"
    ];
    final part4Explanations = [
      "The white fur color is due to an uncommon recessive gene.",
      "Local tribes believe the bear has unusual spiritual power.",
      "The local community protects the bear from strangers coming into the area.",
      "Deforestation of the landscape has led to soil erosion.",
      "Bears are most frequently found on the nearby islands.",
      "The habitat is being destroyed by the construction of logging roads.",
      "During autumn, their diet consists primarily of salmon fishing.",
      "A key factor in the species' survival is successful reproduction.",
      "Researchers use a specific non-invasive method to collect hair samples.",
      "Future conservation efforts will focus on habitat expansion."
    ];

    for (int i = 0; i < 10; i++) {
      list.add({
        'id': 'b10t1l_q${i+31}',
        'questionType': 'SHORT_ANSWER',
        'difficulty': 'ADVANCED',
        'instruction': 'Complete the notes below. Write ONE WORD ONLY for each answer.',
        'questionText': part4Questions[i],
        'correctAnswer': part4Answers[i],
        'explanation': part4Explanations[i]
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
        _audios.removeWhere((item) => item['id'] == 'b10t1_listening');
        _audios.insert(0, {
          'id': 'b10t1_listening',
          'title': 'IELTS Book 10 Test 1',
          'audioUrl': 'https://bandup-ielts-prep.vercel.app/audio/b10t1_listening.mpeg',
          'practiceQuestions': _getMockQuestions(),
        });
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
    } else if (_viewState == 'RESULTS') {
      return _buildResultsView();
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
    final allQuestions = _selectedAudio != null ? (_selectedAudio['practiceQuestions'] as List? ?? []) : [];
    // Filter questions for the selected part (e.g. 1-10 for Part 1, 11-20 for Part 2)
    final int startIndex = (_selectedPartTab - 1) * 10;
    final int endIndex = startIndex + 10;
    final questions = allQuestions.sublist(
      startIndex.clamp(0, allQuestions.length),
      endIndex.clamp(0, allQuestions.length),
    );

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
          Row(
            children: [
              const Text(
                'Answers',
                style: TextStyle(color: Color(0xFF64748B), fontSize: 12.5, fontWeight: FontWeight.bold),
              ),
              const SizedBox(width: 4),
              Switch(
                value: _showAnswers,
                activeColor: Colors.white,
                activeTrackColor: const Color(0xFFEF4444),
                inactiveThumbColor: Colors.white,
                inactiveTrackColor: const Color(0xFFCBD5E1),
                onChanged: (val) {
                  setState(() {
                    _showAnswers = val;
                  });
                },
              ),
              const SizedBox(width: 16),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Horizontal navigation pills
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _buildPartTabButton(1, 'Part 1'),
                        _buildPartTabButton(2, 'Part 2'),
                        _buildPartTabButton(3, 'Part 3'),
                        _buildPartTabButton(4, 'Part 4'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Questions list
                  ...questions.asMap().entries.map((entry) {
                    final int idx = entry.key;
                    final q = entry.value;
                    return _buildQuestionCard(startIndex + idx, q);
                  }).toList(),

                  const SizedBox(height: 16),

                  // Bottom action buttons
                  OutlinedButton.icon(
                    icon: const Icon(Icons.assignment_turned_in_outlined, color: Color(0xFFEF4444), size: 18),
                    label: const Text(
                      'See Results',
                      style: TextStyle(
                        color: Color(0xFFEF4444),
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      backgroundColor: const Color(0xFFFEE2E2),
                      side: const BorderSide(color: Color(0xFFFCA5A5)),
                      minimumSize: const Size(double.infinity, 50),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    onPressed: () {
                      setState(() {
                        _viewState = 'RESULTS';
                      });
                    },
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFEF4444),
                      foregroundColor: Colors.white,
                      minimumSize: const Size(double.infinity, 50),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    onPressed: () {
                      if (_selectedPartTab < 4) {
                        setState(() {
                          _selectedPartTab += 1;
                        });
                      } else {
                        setState(() {
                          _viewState = 'RESULTS';
                        });
                      }
                    },
                    child: Text(
                      _selectedPartTab < 4 ? 'Next Part ➔' : 'Finish Test ➔',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),

          // Bottom Player Progress Bar
          _buildBottomPlayer(),
        ],
      ),
    );
  }

  Widget _buildPartTabButton(int partNum, String label) {
    final bool isSelected = _selectedPartTab == partNum;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedPartTab = partNum;
        });
      },
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFEF4444) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFFEF4444) : const Color(0xFFE2E8F0),
            width: 1,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : const Color(0xFF64748B),
            fontWeight: FontWeight.bold,
            fontSize: 13,
          ),
        ),
      ),
    );
  }

  Widget _buildQuestionCard(int index, Map<String, dynamic> q) {
    final qId = q['id'];
    final questionText = q['questionText'] ?? '';
    final String instruction = q['instruction'] ?? '';
    
    // Check if we need to show instruction header
    bool showInstructionHeader = false;
    if (index == 0 && _selectedPartTab == 1) showInstructionHeader = true;
    if (index == 6 && _selectedPartTab == 1) showInstructionHeader = true;
    if (index == (_selectedPartTab - 1) * 10 && _selectedPartTab > 1) showInstructionHeader = true;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (showInstructionHeader) ...[
          Padding(
            padding: const EdgeInsets.only(top: 8, bottom: 12),
            child: Text(
              instruction,
              style: const TextStyle(
                color: Color(0xFF64748B),
                fontSize: 13.5,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
        Container(
          width: double.infinity,
          margin: const EdgeInsets.only(bottom: 16),
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
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${index + 1}. ',
                    style: const TextStyle(
                      color: Color(0xFFEF4444),
                      fontSize: 14.5,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      questionText,
                      style: const TextStyle(
                        color: Color(0xFF1E293B),
                        fontSize: 14.5,
                        fontWeight: FontWeight.w500,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
              if (_showAnswers) ...[
                const SizedBox(height: 12),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFDCFCE7),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFBBF7D0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Correct: ${q['correctAnswer'] ?? ''}',
                        style: const TextStyle(
                          color: Color(0xFF15803D),
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                      if (q['explanation'] != null && q['explanation']!.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          q['explanation'] ?? '',
                          style: const TextStyle(
                            color: Color(0xFF15803D),
                            fontStyle: FontStyle.italic,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 12),
              TextFormField(
                key: ValueKey(qId),
                initialValue: _userAnswers[qId] ?? '',
                onChanged: (val) {
                  setState(() {
                    _userAnswers[qId] = val;
                  });
                },
                style: const TextStyle(color: Color(0xFF1E293B), fontSize: 13.5),
                decoration: InputDecoration(
                  hintText: 'Your answer',
                  hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
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
  }

  Widget _buildBottomPlayer() {
    if (_enableAudioControls) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: const Color(0xFFE2E8F0))),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
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
      );
    }

    // Default Player layout when Audio Controls is OFF (Matches Image 1-3)
    final double maxSecs = _duration.inSeconds > 0 ? _duration.inSeconds.toDouble() : 400.0;
    final double currSecs = _duration.inSeconds > 0
        ? _position.inSeconds.toDouble().clamp(0.0, maxSecs)
        : _position.inSeconds.toDouble().clamp(0.0, 400.0);
    final String currStr = _formatDuration(_position);
    final String totalStr = _duration.inSeconds > 0 ? _formatDuration(_duration) : '06:40';

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.only(left: 20, right: 20, top: 12, bottom: 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SliderTheme(
            data: SliderTheme.of(context).copyWith(
              activeTrackColor: const Color(0xFFEF4444),
              inactiveTrackColor: const Color(0xFFE2E8F0),
              thumbShape: SliderComponentShape.noThumb,
              trackHeight: 3.0,
            ),
            child: Slider(
              min: 0.0,
              max: maxSecs,
              value: currSecs,
              onChanged: null,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                currStr,
                style: const TextStyle(color: Color(0xFF64748B), fontSize: 11, fontWeight: FontWeight.bold),
              ),
              Text(
                totalStr,
                style: const TextStyle(color: Color(0xFF64748B), fontSize: 11, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildResultsView() {
    final allQuestions = _selectedAudio != null ? (_selectedAudio['practiceQuestions'] as List? ?? []) : [];
    // Calculate stats for current part (e.g. Questions 1-10)
    final int startIndex = (_selectedPartTab - 1) * 10;
    final int endIndex = startIndex + 10;
    final questions = allQuestions.sublist(
      startIndex.clamp(0, allQuestions.length),
      endIndex.clamp(0, allQuestions.length),
    );

    int correct = 0;
    int wrong = 0;
    int skipped = 0;

    for (var q in questions) {
      final qId = q['id'];
      final userAns = (_userAnswers[qId] ?? '').trim().toLowerCase();
      final correctAns = (q['correctAnswer'] ?? '').toString().trim().toLowerCase();

      if (userAns.isEmpty) {
        skipped++;
      } else if (userAns == correctAns) {
        correct++;
      } else {
        wrong++;
      }
    }

    final int accuracy = questions.isEmpty ? 0 : ((correct / questions.length) * 100).round();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        centerTitle: true,
        title: Text(
          'Part $_selectedPartTab Results',
          style: const TextStyle(color: Color(0xFF1E293B), fontWeight: FontWeight.bold, fontSize: 16),
        ),
        leading: IconButton(
          icon: const Icon(Icons.close_rounded, color: Color(0xFF1E293B)),
          onPressed: () => setState(() => _viewState = 'TESTS'),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                children: [
                  const SizedBox(height: 12),
                  // Accuracy gauge (Image 5)
                  Container(
                    width: 140,
                    height: 140,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white,
                      border: Border.all(color: const Color(0xFFF1F5F9), width: 8),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.02),
                          blurRadius: 10,
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          '$accuracy%',
                          style: const TextStyle(
                            color: Color(0xFF1E293B),
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Accuracy',
                          style: TextStyle(
                            color: Color(0xFF64748B),
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 28),

                  // Metrics Cards Row (Image 5)
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          decoration: BoxDecoration(
                            color: const Color(0xFFE8F5E9),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Column(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(4),
                                decoration: const BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: Color(0xFF4CAF50),
                                ),
                                child: const Icon(Icons.check_rounded, color: Colors.white, size: 14),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                '$correct',
                                style: const TextStyle(color: Color(0xFF1E293B), fontSize: 18, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 2),
                              const Text('Correct', style: TextStyle(color: Color(0xFF64748B), fontSize: 11)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFEBEE),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Column(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(4),
                                decoration: const BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: Color(0xFFF44336),
                                ),
                                child: const Icon(Icons.close_rounded, color: Colors.white, size: 14),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                '$wrong',
                                style: const TextStyle(color: Color(0xFF1E293B), fontSize: 18, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 2),
                              const Text('Wrong', style: TextStyle(color: Color(0xFF64748B), fontSize: 11)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Column(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(4),
                                decoration: const BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: Color(0xFF94A3B8),
                                ),
                                child: const Icon(Icons.remove_rounded, color: Colors.white, size: 14),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                '$skipped',
                                style: const TextStyle(color: Color(0xFF1E293B), fontSize: 18, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 2),
                              const Text('Skipped', style: TextStyle(color: Color(0xFF64748B), fontSize: 11)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Dots indicator Row (Image 5)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _buildResultsPartDot(1, 'Part 1'),
                      const SizedBox(width: 16),
                      _buildResultsPartDot(2, 'Part 2'),
                      const SizedBox(width: 16),
                      _buildResultsPartDot(3, 'Part 3'),
                      const SizedBox(width: 16),
                      _buildResultsPartDot(4, 'Part 4'),
                    ],
                  ),
                  const SizedBox(height: 28),

                  // Question Breakdown header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Question Breakdown',
                        style: TextStyle(color: Color(0xFF1E293B), fontSize: 15, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        '$correct/10',
                        style: const TextStyle(color: Color(0xFFEF4444), fontSize: 15, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Cards breakdown list (Image 5)
                  ...questions.asMap().entries.map((entry) {
                    final int idx = entry.key;
                    final q = entry.value;
                    final qId = q['id'];
                    final userAns = (_userAnswers[qId] ?? '').trim().toLowerCase();
                    final correctAns = (q['correctAnswer'] ?? '').toString().trim().toLowerCase();

                    final isCorrect = userAns.isNotEmpty && userAns == correctAns;
                    final isSkipped = userAns.isEmpty;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: isSkipped
                                  ? const Color(0xFFF1F5F9)
                                  : (isCorrect ? const Color(0xFFE8F5E9) : const Color(0xFFFFEBEE)),
                            ),
                            child: Center(
                              child: isSkipped
                                  ? const Text('--', style: TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.bold))
                                  : Icon(
                                      isCorrect ? Icons.check_rounded : Icons.close_rounded,
                                      color: isCorrect ? const Color(0xFF4CAF50) : const Color(0xFFF44336),
                                      size: 16,
                                    ),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Question ${startIndex + idx + 1}',
                                  style: const TextStyle(color: Color(0xFF64748B), fontSize: 13, fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '✓ ${q['correctAnswer']}',
                                  style: const TextStyle(color: Color(0xFF4CAF50), fontSize: 13, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              'Q${startIndex + idx + 1}',
                              style: const TextStyle(color: Color(0xFF64748B), fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ],
              ),
            ),
          ),
          // Continue Button fixed at bottom
          Container(
            color: Colors.white,
            padding: const EdgeInsets.all(16.0),
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFEF4444),
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 50),
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              onPressed: () {
                if (_selectedPartTab < 4) {
                  setState(() {
                    _selectedPartTab += 1;
                    _viewState = 'PRACTICE';
                  });
                } else {
                  setState(() {
                    _viewState = 'TESTS';
                  });
                }
              },
              child: Text(
                _selectedPartTab < 4 ? 'Continue to Part ${_selectedPartTab + 1} ➔' : 'Return to Tests ➔',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResultsPartDot(int partNum, String label) {
    final bool isCurrent = partNum == _selectedPartTab;
    final color = isCurrent ? const Color(0xFF15803D) : const Color(0xFF94A3B8);
    return Row(
      children: [
        Container(
          width: 6,
          height: 6,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: color,
          ),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(
            color: color,
            fontSize: 12,
            fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ],
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
