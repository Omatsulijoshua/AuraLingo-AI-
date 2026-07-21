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

    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FB), // Light Grey background
      appBar: AppBar(
        backgroundColor: isPractice ? Colors.white : const Color(0xFFF4F6FB),
        elevation: isPractice ? 1 : 0,
        shadowColor: isPractice ? Colors.black.withOpacity(0.1) : Colors.transparent,
        centerTitle: true,
        leadingWidth: 90,
        leading: TextButton.icon(
          onPressed: () {
            if (isPractice) {
              if (_timerActive) {
                _showExitConfirmation();
              } else {
                setState(() => _viewState = 'OVERVIEW');
              }
            } else if (isOverview) {
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
        title: isOverview
            ? Text(
                'IELTS Book $_selectedBook Test $_selectedTest',
                style: const TextStyle(
                  color: Color(0xFF1E293B),
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              )
            : (isPractice && _timerActive
                ? Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFE4E6),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFFECDD3)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.access_time_filled, color: Color(0xFFE11D48), size: 12),
                        const SizedBox(width: 4),
                        Text(
                          _formatTime(_timeLeft),
                          style: const TextStyle(
                            color: Color(0xFFE11D48),
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  )
                : null),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: _viewState == 'TESTS'
            ? _buildTestsView()
            : (_viewState == 'OVERVIEW' ? _buildOverviewView() : _buildPracticeView()),
      ),
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

  Widget _buildPracticeView() {
    // Mode Selection Card
    final modeCard = Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Select Practice Mode',
            style: TextStyle(color: Color(0xFF1E293B), fontWeight: FontWeight.bold, fontSize: 14),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: _timerActive ? null : () => setState(() => _mode = 'PRACTICE'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _mode == 'PRACTICE' ? const Color(0xFFEF4444) : const Color(0xFFF1F5F9),
                    foregroundColor: _mode == 'PRACTICE' ? Colors.white : const Color(0xFF64748B),
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: const Text('Practice', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: _timerActive ? null : () => setState(() => _mode = 'EXAM'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _mode == 'EXAM' ? const Color(0xFFEF4444) : const Color(0xFFF1F5F9),
                    foregroundColor: _mode == 'EXAM' ? Colors.white : const Color(0xFF64748B),
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: const Text('Exam Mode', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ],
      ),
    );

    if (_passages.isEmpty) {
      return Column(
        children: [
          modeCard,
          const SizedBox(height: 20),
          const Center(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 40.0),
              child: Text(
                'No reading passages found. Auto-spin some in the admin panel!',
                style: TextStyle(color: Color(0xFF64748B)),
              ),
            ),
          ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        modeCard,
        const SizedBox(height: 20),

        // Reading passage selector dropdown
        DropdownButtonFormField<dynamic>(
          value: _selectedPassage,
          decoration: const InputDecoration(
            labelText: 'Choose Reading Passage',
            labelStyle: TextStyle(color: Color(0xFF1E293B)),
            filled: true,
            fillColor: Colors.white,
            focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: Color(0xFFEF4444))),
            enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: Color(0xFFE2E8F0))),
          ),
          dropdownColor: Colors.white,
          items: _passages.map((p) {
            return DropdownMenuItem<dynamic>(
              value: p,
              child: SizedBox(
                width: 250,
                child: Text(
                  p['title'] ?? 'Reading Passage',
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: Color(0xFF1E293B), fontSize: 13),
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
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.02),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
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
                        style: const TextStyle(
                          color: Color(0xFF1E293B),
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    if (_timerActive)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFE4E6),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFFECDD3)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.access_time_filled, color: Color(0xFFE11D48), size: 12),
                            const SizedBox(width: 4),
                            Text(
                              _formatTime(_timeLeft),
                              style: const TextStyle(
                                color: Color(0xFFE11D48),
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 16),

                // Collapsible Tackle Steps Accordion
                Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFFBEB), // soft amber
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFFEF3C7)),
                  ),
                  child: Theme(
                    data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                    child: ExpansionTile(
                      iconColor: const Color(0xFFD97706),
                      collapsedIconColor: const Color(0xFFD97706),
                      title: const Row(
                        children: [
                          Icon(Icons.lightbulb_outline, color: Color(0xFFD97706), size: 16),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'How to Tackle this Reading Task (Steps)',
                              style: TextStyle(
                                color: Color(0xFFD97706),
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
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
                              _buildTackleStep(
                                '1. Skim Passage (2 Mins)',
                                'Quickly scan the title, subheadings, and first/last sentences of paragraphs to map the general structure first.',
                              ),
                              const SizedBox(height: 8),
                              _buildTackleStep(
                                '2. Analyze Questions',
                                'Read the questions first. Highlight key terms (dates, capitalized names, numbers) to act as visual anchors.',
                              ),
                              const SizedBox(height: 8),
                              _buildTackleStep(
                                '3. Scan & Locate',
                                'Scan the text to find the visual anchors. Read the surrounding sentences closely to extract details.',
                              ),
                              const SizedBox(height: 8),
                              _buildTackleStep(
                                '4. Spot Synonyms',
                                'Look out! The correct choices will almost always paraphrased or use synonyms of terms found in the text.',
                              ),
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
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: SingleChildScrollView(
                    child: Text(
                      _selectedPassage['text'] ?? '',
                      style: const TextStyle(color: Color(0xFF334155), fontSize: 12, height: 1.6),
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
                        backgroundColor: const Color(0xFFEF4444),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text(
                        _mode == 'EXAM' ? 'Start Exam Timer' : 'Start Practice',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
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
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.01),
                              blurRadius: 4,
                              offset: const Offset(0, 1),
                            ),
                          ],
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

                            // Answer Input options
                            if (q['questionType'] == 'MULTIPLE_CHOICE')
                              Column(
                                children: (q['options'] as List? ?? []).map((opt) {
                                  final letter = opt['optionLetter'] ?? '';
                                  final isSelected = _userAnswers[qId] == letter;
                                  return Card(
                                    color: isSelected ? const Color(0xFFFFE4E6) : Colors.white,
                                    elevation: 0,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      side: BorderSide(
                                        color: isSelected ? const Color(0xFFEF4444) : const Color(0xFFE2E8F0),
                                      ),
                                    ),
                                    margin: const EdgeInsets.only(bottom: 8),
                                    child: RadioListTile<String>(
                                      value: letter,
                                      groupValue: _userAnswers[qId],
                                      activeColor: const Color(0xFFEF4444),
                                      title: Text(
                                        '$letter. ${opt['optionText'] ?? ''}',
                                        style: const TextStyle(color: Color(0xFF1E293B), fontSize: 12),
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
                                style: const TextStyle(color: Color(0xFF1E293B), fontSize: 13),
                                enabled: _timerActive || _mode == 'PRACTICE',
                                decoration: const InputDecoration(
                                  labelText: 'Your Answer',
                                  labelStyle: TextStyle(color: Color(0xFF64748B)),
                                  filled: true,
                                  fillColor: Colors.white,
                                  focusedBorder: OutlineInputBorder(
                                    borderSide: BorderSide(color: Color(0xFFEF4444)),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderSide: BorderSide(color: Color(0xFFE2E8F0)),
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

          // Exam success display
          if (_examSuccess)
            Container(
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
        ],
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



