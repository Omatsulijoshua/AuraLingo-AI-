import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../widgets/premium_paywall.dart';
import '../widgets/times_up_dialog.dart';

class ReadingPracticeScreen extends StatefulWidget {
  const ReadingPracticeScreen({super.key});

  @override
  State<ReadingPracticeScreen> createState() => _ReadingPracticeScreenState();
}

class _ReadingPracticeScreenState extends State<ReadingPracticeScreen> {
  final ApiService _apiService = ApiService();

  String _viewState = 'TESTS'; // TESTS, OVERVIEW, PRACTICE
  int _selectedBook = 10;
  int _selectedTest = 1;
  int _selectedPartTab = 1; // 1, 2, or 3
  String _activeTab = 'Passage'; // Passage, Questions
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
        showTimesUpDialog(context, _submitAnswers);
      }
    });
  }

  Future<void> _submitAnswers() async {
    final questions = _getQuestionsForCurrentTest();
    if (questions.isEmpty) return;

    setState(() {
      _submitting = true;
      _timerActive = false;
    });
    _timer?.cancel();

    if (_selectedBook == 10 && _selectedTest == 1) {
      await Future.delayed(const Duration(milliseconds: 600));

      int correctCount = 0;
      final resultsList = [];

      for (var q in questions) {
        final qId = q['id'];
        final userAnswer = (_userAnswers[qId] ?? '').trim().toUpperCase();
        final correctAnswer = q['correctAnswer'].toString().trim().toUpperCase();
        final isCorrect = userAnswer == correctAnswer;

        if (isCorrect) correctCount++;

        resultsList.add({
          'questionId': qId,
          'questionText': q['questionText'],
          'userAnswer': userAnswer.isEmpty ? '(No Answer)' : userAnswer,
          'correctAnswerStr': correctAnswer,
          'isCorrect': isCorrect,
          'explanation': q['explanation'] ?? 'No explanation available.'
        });
      }

      setState(() {
        _submitting = false;
        if (_mode == 'EXAM') {
          _examSuccess = true;
        } else {
          _feedback = {
            'correctCount': correctCount,
            'totalCount': questions.length,
            'results': resultsList,
          };
        }
      });
      return;
    }

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

  void _showPremiumDialog() {
    showPremiumPaywall(context);
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
                  color: Color(0xFFFFF3E0), // light orange
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.warning_amber_rounded,
                  color: Color(0xFFFF9800), // solid orange
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
                          backgroundColor: const Color(0xFFFFE4E6), // light pink/red
                          foregroundColor: const Color(0xFFE11D48), // red text
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        onPressed: () {
                          Navigator.pop(context); // Close dialog
                          setState(() {
                            _timerActive = false;
                            _timer?.cancel();
                            _viewState = 'TESTS';
                          });
                        },
                        child: const Text(
                          'End Test',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
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
                          backgroundColor: const Color(0xFFC62828), // solid red
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        onPressed: () => Navigator.pop(context),
                        child: const Text(
                          'Continue',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
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

  String _formatTime(int seconds) {
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '$m:${s < 10 ? '0' : ''}$s';
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: Color(0xFFF4F6FB),
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFFEF4444)),
        ),
      );
    }

    final bool isPractice = _viewState == 'PRACTICE';
    final bool isOverview = _viewState == 'OVERVIEW';

    final int totalQuestions = _selectedPassage != null
        ? (_selectedPassage['practiceQuestions'] as List? ?? []).length
        : 13;
    final int answeredCount = _userAnswers.keys.where((k) => _userAnswers[k] != null && _userAnswers[k]!.isNotEmpty).length;

    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FB), // Light Grey background
      appBar: AppBar(
        backgroundColor: const Color(0xFFF4F6FB),
        elevation: 0,
        centerTitle: true,
        leading: isPractice
            ? IconButton(
                icon: const Icon(Icons.close, color: Color(0xFF1E293B)),
                onPressed: () {
                  if (_timerActive) {
                    _showExitConfirmation();
                  } else {
                    setState(() => _viewState = 'OVERVIEW');
                  }
                },
              )
            : TextButton.icon(
                onPressed: () {
                  if (isOverview) {
                    setState(() => _viewState = 'TESTS');
                  } else {
                    Navigator.pop(context);
                  }
                },
                icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFFEF4444), size: 14),
                label: const Text(
                  'Back',
                  style: TextStyle(color: Color(0xFFEF4444), fontSize: 13, fontWeight: FontWeight.bold),
                ),
              ),
        leadingWidth: isPractice ? 56 : 90,
        title: isOverview
            ? Text(
                'IELTS Book $_selectedBook Test $_selectedTest',
                style: const TextStyle(
                  color: Color(0xFF1E293B),
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              )
            : (isPractice
                ? Text(
                    _selectedPassage?['title'] ?? 'Reading Passage',
                    style: const TextStyle(
                      color: Color(0xFF1E293B),
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  )
                : null),
        actions: isPractice
            ? [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFE4E6),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.access_time_rounded, color: Color(0xFFE11D48), size: 12),
                      const SizedBox(width: 4),
                      Text(
                        _formatTime(_timeLeft),
                        style: const TextStyle(
                          color: Color(0xFFE11D48),
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFE4E6),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '$answeredCount/$totalQuestions',
                    style: const TextStyle(
                      color: Color(0xFFE11D48),
                      fontWeight: FontWeight.bold,
                      fontSize: 11,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
              ]
            : null,
      ),
      body: _viewState == 'TESTS'
          ? SingleChildScrollView(
              padding: const EdgeInsets.all(20.0),
              child: _buildTestsView(),
            )
          : (_viewState == 'OVERVIEW'
              ? SingleChildScrollView(
                  padding: const EdgeInsets.all(20.0),
                  child: _buildOverviewView(),
                )
              : _buildPracticeView()),
    );
  }

  Widget _buildTestsView() {
    final List<Map<String, int>> allTests = [];
    for (int book = 10; book <= 21; book++) {
      for (int test = 1; test <= 4; test++) {
        allTests.add({'book': book, 'test': test});
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 12),
        const Text(
          'Reading Practice',
          style: TextStyle(
            color: Color(0xFF1E293B),
            fontSize: 28,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Real IELTS Reading Tests',
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
                    _viewState = 'OVERVIEW';
                    _selectedBook = bookNum;
                    _selectedTest = testNum;
                    _selectedPartTab = 1;
                    _userAnswers.clear();
                    _feedback = null;
                    _examSuccess = false;
                  });
                } else {
                  _showPremiumDialog();
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
                          isUnlocked ? Icons.menu_book_rounded : Icons.lock_outline_rounded,
                          color: isUnlocked ? const Color(0xFFE11D48) : const Color(0xFF94A3B8),
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
                          isUnlocked
                              ? const Row(
                                  children: [
                                    Icon(Icons.description_outlined, color: Color(0xFF64748B), size: 12),
                                    SizedBox(width: 4),
                                    Text(
                                      '3 Passages',
                                      style: TextStyle(color: Color(0xFF64748B), fontSize: 11),
                                    ),
                                    SizedBox(width: 12),
                                    Icon(Icons.check_circle_outline_rounded, color: Color(0xFF64748B), size: 12),
                                    SizedBox(width: 4),
                                    Text(
                                      '0/3 Completed',
                                      style: TextStyle(color: Color(0xFF64748B), fontSize: 11),
                                    ),
                                  ],
                                )
                              : const Text(
                                  'Premium Content',
                                  style: TextStyle(
                                    color: Color(0xFF94A3B8),
                                    fontSize: 11,
                                  ),
                                ),
                        ],
                      ),
                    ),
                    const Icon(
                      Icons.chevron_right_rounded,
                      color: Color(0xFF64748B),
                      size: 20,
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildOverviewView() {
    final partTitle = _selectedPartTab == 1
        ? "Stepwells"
        : (_selectedPartTab == 2 ? "European Transport Systems 1990-2010" : "The psychology of innovation");

    final partBadge = _selectedPartTab == 1
        ? "History/Architecture"
        : (_selectedPartTab == 2 ? "Transportation/Economics" : "Psychology/Business");

    final partQuestions = _selectedPartTab == 1
        ? "13 Questions"
        : (_selectedPartTab == 2 ? "13 Questions" : "14 Questions");

    final partDescription = _selectedPartTab == 1
        ? "Passage 1 usually contains a factual text with questions like finding specific information, True/False/Not Given, or short answers. It is generally the easiest passage."
        : (_selectedPartTab == 2
            ? "Passage 2 contains a discursive text, often with arguments and opinions. Questions may match headings, information, or complete summaries. It is moderately difficult."
            : "Passage 3 contains a long text about a complex or abstract topic. Questions test detailed understanding, logical argument, and writer's opinion. It is the most difficult passage.");

    final List<Map<String, dynamic>> questionTypes = _selectedPartTab == 1
        ? [
            {'type': 'Sentence Completion', 'count': 5},
            {'type': 'Short Answer', 'count': 3},
            {'type': 'True/False/Not Given', 'count': 5},
          ]
        : (_selectedPartTab == 2
            ? [
                {'type': 'Matching Headings', 'count': 8},
                {'type': 'True/False/Not Given', 'count': 5},
              ]
            : [
                {'type': 'Matching Information', 'count': 5},
                {'type': 'Multiple Choice', 'count': 4},
                {'type': 'Yes/No/Not Given', 'count': 5},
              ]);

    final partPreview = _selectedPartTab == 1
        ? "A millennium ago, stepwells were fundamental to life in the driest parts of India. Although many have been neglected, recent restoration has returned them to their former glory. Richard Cox travelled to north-we..."
        : (_selectedPartTab == 2
            ? "It is difficult to conceive of vigorous economic growth without an efficient transport system. Although modern information technologies can reduce the demand for physical transport by facilitating telewor..."
            : "Innovation is key to business survival, and companies put substantial resources into inspiring employees to develop new ideas. There are, nevertheless, people working in luxurious, state-of-the-art centres design...");

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 8),
        Container(
          height: 48,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          padding: const EdgeInsets.all(4),
          child: Row(
            children: [
              Expanded(
                child: _buildPartTabButton(
                  part: 1,
                  title: 'Part 1',
                  subtitle: 'Beginner',
                ),
              ),
              Expanded(
                child: _buildPartTabButton(
                  part: 2,
                  title: 'Part 2',
                  subtitle: 'Intermediate',
                ),
              ),
              Expanded(
                child: _buildPartTabButton(
                  part: 3,
                  title: 'Part 3',
                  subtitle: 'Advanced',
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Text(
          partTitle,
          style: const TextStyle(
            color: Color(0xFF1E293B),
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            const Icon(Icons.local_offer_outlined, color: Color(0xFFEF4444), size: 14),
            const SizedBox(width: 4),
            Text(
              partBadge,
              style: const TextStyle(
                color: Color(0xFFEF4444),
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(width: 8),
            const Text('•', style: TextStyle(color: Color(0xFF94A3B8))),
            const SizedBox(width: 8),
            const Icon(Icons.help_outline_rounded, color: Color(0xFF64748B), size: 14),
            const SizedBox(width: 4),
            Text(
              partQuestions,
              style: const TextStyle(
                color: Color(0xFF64748B),
                fontSize: 12,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Text(
          partDescription,
          style: const TextStyle(
            color: Color(0xFF64748B),
            fontSize: 13,
            height: 1.5,
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          'Question Types',
          style: TextStyle(
            color: Color(0xFF1E293B),
            fontSize: 15,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        ...questionTypes.map((qt) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 12.0),
            child: Row(
              children: [
                Container(
                  width: 6,
                  height: 6,
                  decoration: const BoxDecoration(
                    color: Color(0xFFFECDD3),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  qt['type'],
                  style: const TextStyle(
                    color: Color(0xFF475569),
                    fontSize: 13,
                  ),
                ),
                const Spacer(),
                Text(
                  qt['count'].toString(),
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          );
        }),
        const SizedBox(height: 16),
        const Text(
          'Preview',
          style: TextStyle(
            color: Color(0xFF1E293B),
            fontSize: 15,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Text(
            partPreview,
            style: const TextStyle(
              color: Color(0xFF64748B),
              fontSize: 12,
              height: 1.6,
              fontStyle: FontStyle.italic,
            ),
          ),
        ),
        const SizedBox(height: 32),
        SizedBox(
          height: 48,
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
              dynamic matchingPassage;
              final String searchTitle = _selectedPartTab == 1
                  ? "stepwell"
                  : (_selectedPartTab == 2 ? "transport" : "psychology");

              for (var p in _passages) {
                final title = (p['title'] ?? '').toString().toLowerCase();
                if (title.contains(searchTitle)) {
                  matchingPassage = p;
                  break;
                }
              }

              setState(() {
                if (matchingPassage != null) {
                  _selectedPassage = matchingPassage;
                } else if (_passages.isNotEmpty) {
                  _selectedPassage = _passages[0];
                }
                _viewState = 'PRACTICE';
                _startTimer();
              });
            },
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.menu_book_rounded, size: 18),
                SizedBox(width: 8),
                Text(
                  'Start Test',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildPartTabButton({
    required int part,
    required String title,
    required String subtitle,
  }) {
    final bool isSelected = _selectedPartTab == part;
    return InkWell(
      onTap: () {
        setState(() {
          _selectedPartTab = part;
        });
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFC62828) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              title,
              style: TextStyle(
                color: isSelected ? Colors.white : const Color(0xFF475569),
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 1),
            Text(
              subtitle,
              style: TextStyle(
                color: isSelected ? Colors.white.withOpacity(0.8) : const Color(0xFF94A3B8),
                fontSize: 9,
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<String> _getParagraphsForCurrentTest() {
    if (_selectedBook == 10 && _selectedTest == 1) {
      if (_selectedPartTab == 1) {
        return [
          "A millennium ago, stepwells were fundamental to life in the driest parts of India. Although many have been neglected, recent restoration has returned them to their former glory. Richard Cox travelled to north-western India to document these spectacular monuments from a bygone era.",
          "During the sixth and seventh centuries, the inhabitants of the modern-day states of Gujarat and Rajasthan in North-western India developed a method of gaining access to clean, fresh groundwater during the dry season for drinking, bathing, watering animals and irrigation. However, the significance of this invention – the stepwell – goes beyond its utilitarian application.",
          "Unique to the region, stepwells are often architecturally complex and vary widely in size and shape. During their heyday, they were places of gathering, of leisure, of relaxation and of worship for villagers of all but the lowest castes. Most stepwells are found dotted around the desert areas of Gujarat (where they are called vav) and Rajasthan (where they are known as baori), while a few also survive in Delhi. Some were located in or near villages as public spaces for the community; others were positioned beside roads as resting places for travellers.",
          "As their name suggests, stepwells comprise a series of stone steps descending from ground level to the water source (normally an underground aquifer) as it recedes following the rains. When the water level was high, the user needed only to descend a few steps to reach it; when it was low, several levels would have to be negotiated.",
          "Some wells are vast, open craters with hundreds of steps paving each sloping side, often in tiers. Others are more elaborate, with long stepped passages leading to the water via several storeys. Built from stone and supported by pillars, they also included pavilions that sheltered visitors from the relentless heat. But perhaps the most impressive features are the intricate decorative sculptures that embellish many stepwells, showing activities from fighting and dancing to everyday acts such as women combing their hair and churning butter.",
          "Down the centuries, thousands of wells were constructed throughout northwestern India, but the majority have now fallen into disuse; many are derelict and dry, as groundwater has been diverted for industrial use and the wells no longer reach the water table. Their condition hasn't been helped by recent dry spells: southern Rajasthan suffered an eight-year drought between 1996 and 2004.",
          "However, some important sites in Gujarat have recently undergone major restoration, and the state government announced in June last year that it plans to restore the stepwells throughout the state.",
          "In Patan, the state's ancient capital, the stepwell of Rani Ki Vav (Queen's Stepwell) is perhaps the finest current example. It was built by Queen Udayamati during the late 11th century, but became silted up following a flood during the 13th century. But the Archaeological Survey of India began restoring it in the 1960s, and today it's in pristine condition. At 65 metres long, 20 metres wide and 27 metres deep, Rani Ki Vav features 500 distinct sculptures carved into niches throughout the monument, depicting gods such as Vishnu and Parvati in various incarnations. Incredibly, in January 2001, this ancient structure survived a devastating earthquake that measured 7.6 on the Richter scale.",
          "Another example is the Surya Kund in Modhera, northern Gujarat, next to the Sun Temple, built by King Bhima I in 1026 to honour the sun god Surya. It actually resembles a tank (kund means reservoir or pond) rather than a well, but displays the hallmarks of stepwell architecture, including four sides of steps that descend to the bottom in a stunning geometrical formation. The terraces house 108 small, intricately carved shrines between the sets of steps.",
          "Rajasthan also has a wealth of wells. The ancient city of Bundi, 200 kilometres south of Jaipur, is renowned for its architecture, including its stepwells. One of the larger examples is Raniji Ki Baori, which was built by the queen of the region, Nathavatji, in 1699. At 46 metres deep, 20 metres wide and 40 metres long, the intricately carved monument is one of 21 baoris commissioned in the Bundi area by Nathavatji.",
          "In the old ruined town of Abhaneri, about 95 kilometres east of Jaipur, is Chand Baori, one of India's oldest and deepest wells; aesthetically, it's perhaps one of the most dramatic. Built in around 850 AD next to the temple of Harshat Mata, the baori comprises hundreds of zigzagging steps that run along three of its sides, steeply descending 11 storeys, resulting in a striking geometric pattern when seen from afar. On the fourth side, verandas which are supported by ornate pillars overlook the steps.",
          "Still in public use is Neemrana Ki Baori, located just off the Jaipur–Dehli highway. Constructed in around 1700, it's nine storeys deep, with the last two being underwater. At ground level, there are 86 colonnaded openings from where the visitor descends 170 steps to the deepest water source.",
          "Today, following years of neglect, many of these monuments to medieval engineering have been saved by the Archaeological Survey of India, which has recognised the importance of preserving them as part of the country's rich history. Tourists flock to wells in far-flung corners of northwestern India to gaze in wonder at these architectural marvels from 1,000 years ago, which serve as a reminder of both the ingenuity and artistry of ancient civilisations and of the value of water to human existence."
        ];
      } else if (_selectedPartTab == 2) {
        return [
          "It is difficult to conceive of vigorous economic growth without an efficient transport system. Although modern information technologies can reduce the demand for physical transport by facilitating teleworking and teleservices, the requirement for transport continues to increase.",
          "The growth in road haulage has been fueled by changes in the European economy and its system of production. In the last twenty years, internal borders have been abolished, causing traffic flows to intensify.",
          "The current distribution of transport modes is unbalanced. Road transport accounts for the vast majority of goods and passenger movements, leading to severe congestion and pollution.",
          "The European Union aims to achieve a policy of modal split integration. This involves encouraging rail, inland waterways, and maritime transport to relieve the overburdened road network.",
          "Investing in infrastructure projects like the Trans-European Transport Network (TEN-T) is essential to improve connectivity across Member States and facilitate smooth transit.",
          "New technologies and intelligent transport systems (ITS) will play a crucial role in optimizing traffic management, reducing emissions, and improving safety on European roads.",
          "Ultimately, achieving a sustainable transport system requires a combination of pricing mechanisms, infrastructure investment, and technological innovation."
        ];
      } else {
        return [
          "Innovation is key to business survival, and companies put substantial resources into inspiring employees to develop new ideas. There are, nevertheless, people working in luxurious, state-of-the-art centres designed to stimulate innovation who find that their environment doesn't make them creative.",
          "Research suggests that individual creativity is influenced by a range of personal and situational factors. These include personality traits, cognitive styles, intrinsic motivation, and the level of support from leaders.",
          "One key factor is the concept of psychological safety. Employees need to feel that they can take risks, share unusual ideas, and make mistakes without fear of negative consequences or ridicule.",
          "Furthermore, team dynamics play a critical role in the innovation process. Diverse teams with members from different backgrounds and disciplines tend to generate a wider range of ideas.",
          "However, diversity can also lead to conflict and communication barriers. Effective collaboration requires mutual respect, clear communication channels, and shared goals.",
          "Leaders also have a significant impact on innovation. They can foster creativity by providing resources, encouraging experimentation, and recognizing innovative efforts.",
          "In conclusion, fostering innovation in organizations is a complex challenge that requires a holistic approach, addressing individual, team, and organizational factors."
        ];
      }
    }
    final rawText = _selectedPassage?['text'] ?? '';
    final List<String> rawParagraphs = rawText.toString().split(RegExp(r'\r?\n\s*\r?\n'));
    return rawParagraphs.where((p) => p.trim().isNotEmpty).toList();
  }

  List<dynamic> _getQuestionsForCurrentTest() {
    if (_selectedBook == 10 && _selectedTest == 1) {
      if (_selectedPartTab == 1) {
        return [
          {
            'id': 'b10t1p1q1',
            'questionType': 'MULTIPLE_CHOICE',
            'difficulty': 'BEGINNER',
            'instruction': 'Classify the statement as TRUE, FALSE or NOT GIVEN based on the passage.',
            'questionText': 'The number of steps above the water level in a stepwell altered during the course of a year.',
            'options': [
              {'optionLetter': 'A', 'optionText': 'TRUE'},
              {'optionLetter': 'B', 'optionText': 'FALSE'},
              {'optionLetter': 'C', 'optionText': 'NOT GIVEN'},
            ],
            'correctAnswer': 'A',
            'explanation': 'Paragraph D states: "When the water level was high, the user needed only to descend a few steps to reach it; when it was low, several levels would have to be negotiated." This implies the number of steps above the water level altered during the year.'
          },
          {
            'id': 'b10t1p1q2',
            'questionType': 'MULTIPLE_CHOICE',
            'difficulty': 'BEGINNER',
            'instruction': 'Classify the statement as TRUE, FALSE or NOT GIVEN based on the passage.',
            'questionText': 'Stepwells were first built in the 6th century.',
            'options': [
              {'optionLetter': 'A', 'optionText': 'TRUE'},
              {'optionLetter': 'B', 'optionText': 'FALSE'},
              {'optionLetter': 'C', 'optionText': 'NOT GIVEN'},
            ],
            'correctAnswer': 'B',
            'explanation': 'Paragraph B mentions stepwells were developed in the sixth and seventh centuries, but there is no evidence that they were "first" built during this period.'
          },
          {
            'id': 'b10t1p1q3',
            'questionType': 'MULTIPLE_CHOICE',
            'difficulty': 'BEGINNER',
            'instruction': 'Classify the statement as TRUE, FALSE or NOT GIVEN based on the passage.',
            'questionText': 'The stepwells had a range of uses in addition to providing water.',
            'options': [
              {'optionLetter': 'A', 'optionText': 'TRUE'},
              {'optionLetter': 'B', 'optionText': 'FALSE'},
              {'optionLetter': 'C', 'optionText': 'NOT GIVEN'},
            ],
            'correctAnswer': 'A',
            'explanation': 'Paragraph C states stepwells were places of gathering, leisure, relaxation, and worship.'
          },
          {
            'id': 'b10t1p1q4',
            'questionType': 'MULTIPLE_CHOICE',
            'difficulty': 'BEGINNER',
            'instruction': 'Classify the statement as TRUE, FALSE or NOT GIVEN based on the passage.',
            'questionText': 'The few stepwells that exist today are in excellent condition.',
            'options': [
              {'optionLetter': 'A', 'optionText': 'TRUE'},
              {'optionLetter': 'B', 'optionText': 'FALSE'},
              {'optionLetter': 'C', 'optionText': 'NOT GIVEN'},
            ],
            'correctAnswer': 'B',
            'explanation': 'Paragraph F states that the majority of stepwells have fallen into disuse, and many are derelict and dry.'
          },
          {
            'id': 'b10t1p1q5',
            'questionType': 'MULTIPLE_CHOICE',
            'difficulty': 'BEGINNER',
            'instruction': 'Classify the statement as TRUE, FALSE or NOT GIVEN based on the passage.',
            'questionText': 'Frequent droughts in central India have made the situation worse.',
            'options': [
              {'optionLetter': 'A', 'optionText': 'TRUE'},
              {'optionLetter': 'B', 'optionText': 'FALSE'},
              {'optionLetter': 'C', 'optionText': 'NOT GIVEN'},
            ],
            'correctAnswer': 'C',
            'explanation': 'The passage mentions drought in southern Rajasthan, but not "central India". Therefore, the information is not given.'
          },
          {
            'id': 'b10t1p1q6',
            'questionType': 'SHORT_ANSWER',
            'difficulty': 'BEGINNER',
            'instruction': 'Answer the question below with NO MORE THAN TWO WORDS from the passage.',
            'questionText': 'What type of serious climatic event, which took place in southern Rajasthan, is mentioned in the article?',
            'correctAnswer': 'drought',
            'explanation': 'Paragraph F mentions: "southern Rajasthan suffered an eight-year drought".'
          },
          {
            'id': 'b10t1p1q7',
            'questionType': 'SHORT_ANSWER',
            'difficulty': 'BEGINNER',
            'instruction': 'Answer the question below with NO MORE THAN TWO WORDS from the passage.',
            'questionText': 'Who commissioned the Raniji Ki Baori?',
            'correctAnswer': 'Nathavatji',
            'explanation': 'Paragraph J states: "commissioned in the Bundi area by Nathavatji".'
          },
          {
            'id': 'b10t1p1q8',
            'questionType': 'SHORT_ANSWER',
            'difficulty': 'BEGINNER',
            'instruction': 'Answer the question below with NO MORE THAN TWO WORDS from the passage.',
            'questionText': 'Where is the Rani Ki Vav located?',
            'correctAnswer': 'Patan',
            'explanation': 'Paragraph H states: "In Patan, the state\'s ancient capital, the stepwell of Rani Ki Vav".'
          },
          {
            'id': 'b10t1p1q9',
            'questionType': 'MULTIPLE_CHOICE',
            'difficulty': 'BEGINNER',
            'instruction': 'Classify the statement as TRUE, FALSE or NOT GIVEN based on the passage.',
            'questionText': 'Rani Ki Vav was built by Queen Udayamati.',
            'options': [
              {'optionLetter': 'A', 'optionText': 'TRUE'},
              {'optionLetter': 'B', 'optionText': 'FALSE'},
              {'optionLetter': 'C', 'optionText': 'NOT GIVEN'},
            ],
            'correctAnswer': 'A',
            'explanation': 'Paragraph H states: "It was built by Queen Udayamati during the late 11th century".'
          },
          {
            'id': 'b10t1p1q10',
            'questionType': 'MULTIPLE_CHOICE',
            'difficulty': 'BEGINNER',
            'instruction': 'Classify the statement as TRUE, FALSE or NOT GIVEN based on the passage.',
            'questionText': 'The earthquake of 2001 destroyed the Rani Ki Vav.',
            'options': [
              {'optionLetter': 'A', 'optionText': 'TRUE'},
              {'optionLetter': 'B', 'optionText': 'FALSE'},
              {'optionLetter': 'C', 'optionText': 'NOT GIVEN'},
            ],
            'correctAnswer': 'B',
            'explanation': 'Paragraph H states: "Incredibly, in January 2001, this ancient structure survived a devastating earthquake".'
          },
          {
            'id': 'b10t1p1q11',
            'questionType': 'MULTIPLE_CHOICE',
            'difficulty': 'BEGINNER',
            'instruction': 'Classify the statement as TRUE, FALSE or NOT GIVEN based on the passage.',
            'questionText': 'Surya Kund resembles a tank rather than a well.',
            'options': [
              {'optionLetter': 'A', 'optionText': 'TRUE'},
              {'optionLetter': 'B', 'optionText': 'FALSE'},
              {'optionLetter': 'C', 'optionText': 'NOT GIVEN'},
            ],
            'correctAnswer': 'A',
            'explanation': 'Paragraph I states: "It actually resembles a tank (kund means reservoir or pond) rather than a well".'
          },
          {
            'id': 'b10t1p1q12',
            'questionType': 'MULTIPLE_CHOICE',
            'difficulty': 'BEGINNER',
            'instruction': 'Classify the statement as TRUE, FALSE or NOT GIVEN based on the passage.',
            'questionText': 'Chand Baori is one of India\'s oldest and deepest wells.',
            'options': [
              {'optionLetter': 'A', 'optionText': 'TRUE'},
              {'optionLetter': 'B', 'optionText': 'FALSE'},
              {'optionLetter': 'C', 'optionText': 'NOT GIVEN'},
            ],
            'correctAnswer': 'A',
            'explanation': 'Paragraph K states: "is Chand Baori, one of India\'s oldest and deepest wells".'
          },
          {
            'id': 'b10t1p1q13',
            'questionType': 'MULTIPLE_CHOICE',
            'difficulty': 'BEGINNER',
            'instruction': 'Classify the statement as TRUE, FALSE or NOT GIVEN based on the passage.',
            'questionText': 'Neemrana Ki Baori has 170 steps to the deepest water source.',
            'options': [
              {'optionLetter': 'A', 'optionText': 'TRUE'},
              {'optionLetter': 'B', 'optionText': 'FALSE'},
              {'optionLetter': 'C', 'optionText': 'NOT GIVEN'},
            ],
            'correctAnswer': 'A',
            'explanation': 'Paragraph L states: "descends 170 steps to the deepest water source".'
          }
        ];
      } else if (_selectedPartTab == 2) {
        return List.generate(13, (i) => {
          'id': 'b10t1p2q${i+1}',
          'questionType': 'MULTIPLE_CHOICE',
          'difficulty': 'INTERMEDIATE',
          'instruction': 'Classify the statement as TRUE, FALSE or NOT GIVEN based on the passage.',
          'questionText': 'Road transport accounts for the majority of passenger movements in Europe (Question ${i+1}).',
          'options': [
            {'optionLetter': 'A', 'optionText': 'TRUE'},
            {'optionLetter': 'B', 'optionText': 'FALSE'},
            {'optionLetter': 'C', 'optionText': 'NOT GIVEN'},
          ],
          'correctAnswer': 'A',
          'explanation': 'Paragraph C states road transport accounts for the vast majority of goods and passenger movements.'
        });
      } else {
        return List.generate(14, (i) => {
          'id': 'b10t1p3q${i+1}',
          'questionType': 'MULTIPLE_CHOICE',
          'difficulty': 'ADVANCED',
          'instruction': 'Classify the statement as TRUE, FALSE or NOT GIVEN based on the passage.',
          'questionText': 'Creativity is purely determined by the physical design of the workplace (Question ${i+1}).',
          'options': [
            {'optionLetter': 'A', 'optionText': 'TRUE'},
            {'optionLetter': 'B', 'optionText': 'FALSE'},
            {'optionLetter': 'C', 'optionText': 'NOT GIVEN'},
          ],
          'correctAnswer': 'B',
          'explanation': 'Paragraph A says that some people in luxurious creative offices find environment does not make them creative.'
        });
      }
    }
    return _selectedPassage?['practiceQuestions'] ?? [];
  }

  Widget _buildPracticeView() {
    final paragraphs = _getParagraphsForCurrentTest();
    final questions = _getQuestionsForCurrentTest();

    final bool isPassageSelected = _activeTab == 'Passage';
    final bool isQuestionsSelected = _activeTab == 'Questions';

    Widget tabSelector = Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: Color(0xFFE2E8F0)),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          Expanded(
            child: InkWell(
              onTap: () => setState(() => _activeTab = 'Passage'),
              child: Container(
                alignment: Alignment.center,
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: isPassageSelected ? const Color(0xFFC62828) : Colors.transparent,
                      width: 2.5,
                    ),
                  ),
                ),
                child: Text(
                  'Passage',
                  style: TextStyle(
                    color: isPassageSelected ? const Color(0xFFC62828) : const Color(0xFF64748B),
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            child: InkWell(
              onTap: () => setState(() => _activeTab = 'Questions'),
              child: Container(
                alignment: Alignment.center,
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: isQuestionsSelected ? const Color(0xFFC62828) : Colors.transparent,
                      width: 2.5,
                    ),
                  ),
                ),
                child: Text(
                  'Questions',
                  style: TextStyle(
                    color: isQuestionsSelected ? const Color(0xFFC62828) : const Color(0xFF64748B),
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        tabSelector,
        Expanded(
          child: SingleChildScrollView(
            child: isPassageSelected
                ? Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Padding(
                        padding: EdgeInsets.fromLTRB(20, 16, 20, 12),
                        child: Text(
                          "Read the passage carefully. Paragraphs are labeled A, B, C, etc.",
                          style: TextStyle(
                            color: Color(0xFF64748B),
                            fontSize: 12,
                          ),
                        ),
                      ),
                      if (paragraphs.isEmpty)
                        const Center(
                          child: Padding(
                            padding: EdgeInsets.symmetric(vertical: 40.0),
                            child: Text(
                              'No paragraphs found for this passage.',
                              style: TextStyle(color: Color(0xFF64748B)),
                            ),
                          ),
                        )
                      else
                        ...paragraphs.asMap().entries.map((entry) {
                          final int index = entry.key;
                          final String paragraphText = entry.value;
                          final String label = String.fromCharCode(65 + index); // A, B, C...
                          return Container(
                            margin: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                            padding: const EdgeInsets.all(16.0),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  label,
                                  style: const TextStyle(
                                    color: Color(0xFFC62828),
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Text(
                                    paragraphText,
                                    style: const TextStyle(
                                      color: Color(0xFF334155),
                                      fontSize: 13,
                                      height: 1.6,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        }),
                    ],
                  )
                : Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 16),
                          child: Text(
                            "Choose the correct answer for each question below.",
                            style: TextStyle(
                              color: Color(0xFF64748B),
                              fontSize: 12,
                            ),
                          ),
                        ),
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
                        ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: questions.length,
                          itemBuilder: (context, index) {
                            final q = questions[index];
                            final qId = q['id'];
                            return Container(
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
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        'QUESTION ${index + 1}',
                                        style: const TextStyle(
                                          color: Color(0xFFEF4444),
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      Text(
                                        q['difficulty'] ?? '',
                                        style: const TextStyle(color: Color(0xFF64748B), fontSize: 10),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    q['instruction'] ?? '',
                                    style: const TextStyle(
                                      color: Color(0xFF475569),
                                      fontSize: 11,
                                      fontStyle: FontStyle.italic,
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    q['questionText'] ?? '',
                                    style: const TextStyle(
                                      color: Color(0xFF1E293B),
                                      fontSize: 13,
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
                                    TextField(
                                      onChanged: (val) => _userAnswers[qId] = val,
                                      style: const TextStyle(color: Color(0xFF1E293B), fontSize: 13),
                                      decoration: InputDecoration(
                                        labelText: 'Your Answer',
                                        labelStyle: const TextStyle(color: Color(0xFF64748B)),
                                        filled: true,
                                        fillColor: Colors.white,
                                        focusedBorder: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(12),
                                          borderSide: const BorderSide(color: Color(0xFFEF4444)),
                                        ),
                                        enabledBorder: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(12),
                                          borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                                        ),
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
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: Text(
                              _submitting ? 'Submitting...' : 'Submit All Answers',
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                        const SizedBox(height: 40),
                      ],
                    ),
                  ),
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
          style: const TextStyle(color: Color(0xFFB45309), fontSize: 10, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 2),
        Text(
          body,
          style: const TextStyle(color: Color(0xFF78350F), fontSize: 9, height: 1.4),
        ),
      ],
    );
  }
}



