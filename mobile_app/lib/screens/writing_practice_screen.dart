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

  String _viewState = 'BOOKS'; // BOOKS, BOOK_DETAIL, PRACTICE
  int _selectedBook = 10;
  int _selectedTestNum = 1;
  String _selectedTaskType = 'TASK_1'; // TASK_1 or TASK_2
  int _currentPart = 1;
  String _part1Text = '';
  String _part2Text = '';

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
      if (_prompts.isEmpty) {
        final customOption = {
          'id': 'CUSTOM',
          'title': '✍️ Write on my own Topic',
          'promptText': 'Type your custom question topic in the input box below to start practicing.',
          'taskType': 'TASK_2',
          'difficulty': 'CUSTOM',
          'examType': 'ACADEMIC'
        };
        final fallbackW1 = {
          'id': 'academic-w1',
          'title': 'Australian Household Energy Use',
          'promptText': 'The first chart above shows how energy is used in an average Australian household. The second chart shows the greenhouse gas emissions which result from this energy use. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
          'imageUrl': '/assets/australian_household_energy_use.png',
          'taskType': 'TASK_1',
          'difficulty': 'INTERMEDIATE',
          'examType': 'ACADEMIC'
        };
        final fallbackW2 = {
          'id': 'academic-w2',
          'title': 'Children Discipline & Punishment',
          'promptText': 'It is important for children to learn the difference between right and wrong at an early age. Punishment is necessary to help them learn this distinction. To what extent do you agree or disagree with this opinion? What sort of punishment should parents and teachers be allowed to use to teach good behaviour to children?',
          'taskType': 'TASK_2',
          'difficulty': 'ADVANCED',
          'examType': 'ACADEMIC'
        };
        setState(() {
          _prompts = [fallbackW1, fallbackW2, customOption];
          _selectedPrompt = fallbackW1;
        });
      }
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

  void _showPremiumDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF0B1E36),
        title: const Text('Premium Content', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: const Text('Please upgrade your subscription to access all IELTS Books and Practice Tests.', style: TextStyle(color: Color(0xFFCBD5E1))),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK', style: TextStyle(color: Color(0xFFD4AF37))),
          ),
        ],
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
                            _viewState = 'BOOK_DETAIL';
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

  Widget _buildVisualDataCard(dynamic prompt) {
    if (prompt['imageUrl'] == null && prompt['id'] != 'academic-w1') {
      return const SizedBox.shrink();
    }
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
            ),
            child: const Text(
              'Visual Data',
              style: TextStyle(color: Color(0xFF1E293B), fontSize: 13, fontWeight: FontWeight.bold),
            ),
          ),
          ClipRRect(
            borderRadius: const BorderRadius.only(
              bottomLeft: Radius.circular(16),
              bottomRight: Radius.circular(16),
            ),
            child: Container(
              color: Colors.white,
              padding: const EdgeInsets.all(16),
              child: Image.asset(
                'assets/australian_household_energy_use.png',
                fit: BoxFit.contain,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuestionCard(dynamic prompt) {
    final isTask1 = prompt['taskType'] == 'TASK_1';
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Question',
                style: TextStyle(color: Color(0xFF1E293B), fontSize: 14, fontWeight: FontWeight.bold),
              ),
              Row(
                children: [
                  const Icon(Icons.description_outlined, color: Color(0xFF64748B), size: 13),
                  const SizedBox(width: 4),
                  Text(
                    isTask1 ? '150+ words' : '250+ words',
                    style: const TextStyle(color: Color(0xFF64748B), fontSize: 11),
                  ),
                  const SizedBox(width: 12),
                  const Icon(Icons.access_time, color: Color(0xFF64748B), size: 13),
                  const SizedBox(width: 4),
                  Text(
                    isTask1 ? '20 min' : '40 min',
                    style: const TextStyle(color: Color(0xFF64748B), fontSize: 11),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            prompt['promptText'],
            style: const TextStyle(
              color: Color(0xFF334155),
              fontSize: 13,
              height: 1.55,
              fontWeight: FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWritingTipsCard(dynamic prompt) {
    List<String> tips = [];
    if (prompt['id'] == 'academic-w1') {
      tips = [
        'Connect energy use with emissions',
        'Compare the proportions in both charts',
        'Highlight key disparities'
      ];
    } else if (prompt['id'] == 'academic-w2') {
      tips = [
        'Address both parts of the question',
        'Give clear reasons for your opinion',
        'Include relevant examples'
      ];
    } else {
      tips = [
        'Outline your main ideas before writing',
        'Maintain a formal academic tone',
        'Check grammar and spelling'
      ];
    }

    return Container(
      margin: const EdgeInsets.only(top: 20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Writing Tips',
            style: TextStyle(color: Color(0xFF1E293B), fontSize: 13, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          ...tips.map((tip) => Padding(
            padding: const EdgeInsets.only(bottom: 8.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('💡 ', style: TextStyle(fontSize: 12)),
                Expanded(
                  child: Text(
                    tip,
                    style: const TextStyle(color: Color(0xFF475569), fontSize: 12, height: 1.45),
                  ),
                ),
              ],
            ),
          )),
        ],
      ),
    );
  }

  Widget _buildYourAnswerHeader(dynamic prompt) {
    final isTask1 = prompt['taskType'] == 'TASK_1';
    final targetWordCount = isTask1 ? 150 : 250;
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        const Text(
          'Your Answer',
          style: TextStyle(color: Color(0xFF1E293B), fontSize: 14, fontWeight: FontWeight.bold),
        ),
        Text(
          '$_wordCount / $targetWordCount words',
          style: const TextStyle(color: Color(0xFFF97316), fontSize: 12, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }

  void _submitOrFinish() {
    if (_textController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please write your response first.')),
      );
      return;
    }

    if (_currentPart == 1) {
      _part1Text = _textController.text;
      setState(() {
        _currentPart = 2;
        final matching = _prompts.where((p) => p['taskType'] == 'TASK_2').toList();
        _selectedPrompt = matching.isNotEmpty ? matching[0] : null;
        _textController.text = _part2Text;
        _feedback = null;
      });
      _startTimerForPart(2);
    } else {
      _part2Text = _textController.text;
      if (_mode == 'EXAMINER') {
        if (_examinerFeedback == null) {
          _submitDraft1();
        } else {
          _submitDraft2();
        }
      } else {
        _submitEssay();
      }
    }
  }

  void _startTimerForPart(int part) {
    _timer?.cancel();
    setState(() {
      _timeLeft = part == 1 ? 1200 : 2400;
      _timerActive = true;
      _feedback = null;
      _examSuccess = false;
    });
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_timeLeft > 0) {
        if (mounted) {
          setState(() => _timeLeft--);
        }
      } else {
        _timer?.cancel();
        if (mounted) {
          setState(() => _timerActive = false);
          _submitOrFinish();
        }
      }
    });
  }

  void _startPracticeForTest(int bookNum, String taskType, int testNum) {
    if (testNum != 1) {
      _showPremiumDialog();
      return;
    }

    setState(() {
      _currentPart = taskType == 'TASK_1' ? 1 : 2;
      _part1Text = '';
      _part2Text = '';
      _textController.clear();
      _viewState = 'PRACTICE';
      _feedback = null;
      _examSuccess = false;
      _examinerFeedback = null;
      _comparisonResult = null;
      _selectedSentence = null;

      final matching = _prompts.where((p) => p['taskType'] == (taskType == 'TASK_1' ? 'TASK_1' : 'TASK_2')).toList();
      _selectedPrompt = matching.isNotEmpty ? matching[0] : null;
    });

    _startTimerForPart(_currentPart);
  }

  Widget _buildBooksView() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 12),
        const Text(
          'Writing Lab',
          style: TextStyle(
            color: Color(0xFF1E293B),
            fontSize: 28,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Practice IELTS Academic Writing Tasks',
          style: TextStyle(color: Color(0xFF64748B), fontSize: 13),
        ),
        const SizedBox(height: 24),
        const Text(
          'Available Books',
          style: TextStyle(color: Color(0xFF1E293B), fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: 11,
          separatorBuilder: (context, index) => const SizedBox(height: 16),
          itemBuilder: (context, index) {
            final bookNum = 10 + index;
            final isUnlocked = bookNum == 10;

            return InkWell(
              onTap: () {
                setState(() {
                  _selectedBook = bookNum;
                  _viewState = 'BOOK_DETAIL';
                  _selectedTaskType = 'TASK_1';
                });
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
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 8,
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
                            'IELTS Book $bookNum',
                            style: TextStyle(
                              color: isUnlocked ? const Color(0xFF1E293B) : const Color(0xFF64748B),
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            isUnlocked ? '4 Tests  •  0/8 Tasks' : 'Premium Content',
                            style: const TextStyle(
                              color: Color(0xFF64748B),
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
        const SizedBox(height: 24),
        InkWell(
          onTap: () {
            final customPrompt = _prompts.firstWhere((p) => p['id'] == 'CUSTOM', orElse: () => null);
            if (customPrompt != null) {
              setState(() {
                _selectedPrompt = customPrompt;
                _viewState = 'PRACTICE';
                _textController.clear();
                _feedback = null;
                _examSuccess = false;
                _examinerFeedback = null;
                _comparisonResult = null;
                _selectedSentence = null;
              });
            }
          },
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: const BoxDecoration(
                    color: Color(0xFFFEF08A),
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Text('✍️', style: TextStyle(fontSize: 18)),
                  ),
                ),
                const SizedBox(width: 16),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Write on my own Topic',
                        style: TextStyle(
                          color: Color(0xFF1E293B),
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Practice with custom prompt & AI scoring',
                        style: TextStyle(
                          color: Color(0xFF64748B),
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
        ),
      ],
    );
  }

  Widget _buildBookDetailView() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 12),
        Text(
          'IELTS Book $_selectedBook',
          style: const TextStyle(
            color: Color(0xFF1E293B),
            fontSize: 28,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Select a task to practice',
          style: TextStyle(color: Color(0xFF64748B), fontSize: 13),
        ),
        const SizedBox(height: 20),
        Container(
          height: 48,
          decoration: BoxDecoration(
            color: const Color(0xFFE2E8F0),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _selectedTaskType = 'TASK_1'),
                  child: Container(
                    decoration: BoxDecoration(
                      color: _selectedTaskType == 'TASK_1' ? const Color(0xFFEF4444) : Colors.transparent,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      'Task 1\nGraph/Chart',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: _selectedTaskType == 'TASK_1' ? Colors.white : const Color(0xFF64748B),
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        height: 1.2,
                      ),
                    ),
                  ),
                ),
              ),
              Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _selectedTaskType = 'TASK_2'),
                  child: Container(
                    decoration: BoxDecoration(
                      color: _selectedTaskType == 'TASK_2' ? const Color(0xFFEF4444) : Colors.transparent,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      'Task 2\nEssay',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: _selectedTaskType == 'TASK_2' ? Colors.white : const Color(0xFF64748B),
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        height: 1.2,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Text(
          _selectedTaskType == 'TASK_1' ? 'Task 1: Describe Visual Data' : 'Task 2: Essay Writing',
          style: const TextStyle(color: Color(0xFF1E293B), fontSize: 15, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 6),
        Text(
          _selectedTaskType == 'TASK_1'
              ? 'Describe graphs, charts, tables, or diagrams. Write at least 150 words in about 20 minutes.'
              : 'Write an essay responding to a point of view or argument. Write at least 250 words in about 40 minutes.',
          style: const TextStyle(color: Color(0xFF64748B), fontSize: 11, height: 1.4),
        ),
        const SizedBox(height: 20),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: 4,
          separatorBuilder: (context, index) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final testNum = index + 1;
            final isUnlocked = testNum == 1;

            return InkWell(
              onTap: () {
                if (testNum != 1) {
                  _showPremiumDialog();
                  return;
                }
                setState(() {
                  _selectedTestNum = testNum;
                  _viewState = 'TASK_DETAILS';
                });
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
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: isUnlocked ? const Color(0xFFFFE4E6) : const Color(0xFFF1F5F9),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Icon(
                          isUnlocked
                              ? (_selectedTaskType == 'TASK_1' ? Icons.pie_chart : Icons.chat_bubble_rounded)
                              : Icons.lock_outline_rounded,
                          color: isUnlocked ? const Color(0xFFEF4444) : const Color(0xFF64748B),
                          size: 18,
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Test $testNum',
                            style: TextStyle(
                              color: isUnlocked ? const Color(0xFF1E293B) : const Color(0xFF64748B),
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            isUnlocked
                                ? (_selectedTaskType == 'TASK_1' ? '150+ words • 20 min' : '250+ words • 40 min')
                                : 'Premium Content',
                            style: const TextStyle(
                              color: Color(0xFF64748B),
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

  Widget _buildTaskDetailsView() {
    final isTask1 = _selectedTaskType == 'TASK_1';
    final taskName = isTask1 ? 'Task 1' : 'Task 2';
    final taskFormat = isTask1 ? 'Pie Chart' : 'Opinion Essay';
    final timeStr = isTask1 ? '20 minutes' : '40 minutes';
    final wordsStr = isTask1 ? 'at least 150 words' : 'at least 250 words';
    
    final tips = isTask1
        ? [
            'Connect energy use with emissions',
            'Compare the proportions in both charts',
            'Highlight key disparities'
          ]
        : [
            'Address both parts of the question',
            'Give clear reasons for your opinion',
            'Include relevant examples'
          ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 8),
        Text(
          'Test $_selectedTestNum',
          style: const TextStyle(
            color: Color(0xFF1E293B),
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            const Icon(Icons.track_changes, color: Color(0xFFEF4444), size: 16),
            const SizedBox(width: 6),
            Text(
              taskName,
              style: const TextStyle(
                color: Color(0xFFEF4444),
                fontSize: 13,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(width: 8),
            const Text('•', style: TextStyle(color: Color(0xFF94A3B8))),
            const SizedBox(width: 8),
            Icon(
              isTask1 ? Icons.pie_chart : Icons.chat_bubble_rounded,
              color: const Color(0xFF64748B),
              size: 16,
            ),
            const SizedBox(width: 6),
            Text(
              taskFormat,
              style: const TextStyle(
                color: Color(0xFF64748B),
                fontSize: 13,
              ),
            ),
          ],
        ),
        const SizedBox(height: 28),
        const Text(
          'Instructions',
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
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.02),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            children: [
              Row(
                children: [
                  const Icon(Icons.access_time, color: Color(0xFFEF4444), size: 18),
                  const SizedBox(width: 12),
                  Expanded(
                    child: RichText(
                      text: TextSpan(
                        style: const TextStyle(color: Color(0xFF475569), fontSize: 13, height: 1.4),
                        children: [
                          const TextSpan(text: 'You should spend about '),
                          TextSpan(
                            text: timeStr,
                            style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                          ),
                          const TextSpan(text: ' on this task.'),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(Icons.align_horizontal_left_rounded, color: Color(0xFFEF4444), size: 18),
                  const SizedBox(width: 12),
                  Expanded(
                    child: RichText(
                      text: TextSpan(
                        style: const TextStyle(color: Color(0xFF475569), fontSize: 13, height: 1.4),
                        children: [
                          const TextSpan(text: 'Write '),
                          TextSpan(
                            text: wordsStr,
                            style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                          ),
                          const TextSpan(text: '.'),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          'Pro Tips',
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
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.02),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            children: tips
                .map((tip) => Padding(
                      padding: const EdgeInsets.only(bottom: 10.0),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('💡 ', style: TextStyle(fontSize: 13)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              tip,
                              style: const TextStyle(
                                color: Color(0xFF475569),
                                fontSize: 13,
                                height: 1.4,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ))
                .toList(),
          ),
        ),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFFFF1F2),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFFECDD3)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.shield_outlined, color: Color(0xFFE11D48), size: 24),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Test Security',
                      style: TextStyle(
                        color: Color(0xFF1E293B),
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'The prompt is hidden until you start the test to simulate real exam conditions.',
                      style: TextStyle(
                        color: Color(0xFF475569),
                        fontSize: 12,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 36),
        SizedBox(
          height: 52,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(26),
              ),
            ),
            onPressed: () => _startPracticeForTest(_selectedBook, _selectedTaskType, _selectedTestNum),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.edit, size: 16),
                SizedBox(width: 8),
                Text(
                  'Start Test',
                  style: TextStyle(
                    fontSize: 15,
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

  int get _wordCount => _textController.text.trim().isEmpty
      ? 0
      : _textController.text.trim().split(RegExp(r'\s+')).length;

  @override
  Widget build(BuildContext context) {
    final bool isPractice = _viewState == 'PRACTICE';
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6FB), // Light Grey background
      appBar: AppBar(
        backgroundColor: isPractice ? Colors.white : const Color(0xFFF4F6FB),
        elevation: isPractice ? 1 : 0,
        shadowColor: isPractice ? Colors.black.withOpacity(0.1) : Colors.transparent,
        centerTitle: true,
        leadingWidth: isPractice ? 180 : 90,
        leading: isPractice
            ? Row(
                children: [
                  const SizedBox(width: 12),
                  GestureDetector(
                    onTap: () {
                      if (_timerActive) {
                        _showExitConfirmation();
                      } else {
                        setState(() => _viewState = 'BOOK_DETAIL');
                      }
                    },
                    child: const Row(
                      children: [
                        Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFFEF4444), size: 14),
                        SizedBox(width: 4),
                        Text(
                          'Back',
                          style: TextStyle(color: Color(0xFFEF4444), fontSize: 13, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        _currentPart == 1 ? 'Part 1' : 'Part 2',
                        style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      Text(
                        _selectedPrompt?['id'] == 'academic-w1' ? 'Pie Chart' : 'Opinion Essay',
                        style: const TextStyle(color: Color(0xFF64748B), fontSize: 9),
                      ),
                    ],
                  ),
                ],
              )
            : TextButton.icon(
                onPressed: () {
                  if (_viewState == 'TASK_DETAILS') {
                    setState(() => _viewState = 'BOOK_DETAIL');
                  } else if (_viewState == 'BOOK_DETAIL') {
                    setState(() => _viewState = 'BOOKS');
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
        title: isPractice && _timerActive
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
            : (_viewState == 'TASK_DETAILS'
                ? const Text(
                    'Task Details',
                    style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 16),
                  )
                : null),
        actions: isPractice && _selectedPrompt != null
            ? [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 8.0),
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF475569),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(18),
                      ),
                    ),
                    onPressed: _submitting ? null : _submitOrFinish,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          _currentPart == 1 ? '→ Next' : '→ Finish Test',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ),
              ]
            : null,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFD4AF37)))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20.0),
              child: _viewState == 'BOOKS'
                  ? _buildBooksView()
                  : _viewState == 'BOOK_DETAIL'
                      ? _buildBookDetailView()
                      : _viewState == 'TASK_DETAILS'
                          ? _buildTaskDetailsView()
                          : Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                  // Mode Selection
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _mode == 'PRACTICE' ? const Color(0xFFEF4444) : const Color(0xFFE2E8F0),
                            foregroundColor: _mode == 'PRACTICE' ? Colors.white : const Color(0xFF64748B),
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            elevation: 0,
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
                            backgroundColor: _mode == 'EXAMINER' ? const Color(0xFFEF4444) : const Color(0xFFE2E8F0),
                            foregroundColor: _mode == 'EXAMINER' ? Colors.white : const Color(0xFF64748B),
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            elevation: 0,
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
                            backgroundColor: _mode == 'EXAM' ? const Color(0xFFEF4444) : const Color(0xFFE2E8F0),
                            foregroundColor: _mode == 'EXAM' ? Colors.white : const Color(0xFF64748B),
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          onPressed: _timerActive ? null : () => setState(() => _mode = 'EXAM'),
                          child: const Text('Exam', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  if (_selectedPrompt != null && _selectedPrompt['id'] == 'CUSTOM') ...[
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
                  ],

                  if (_selectedPrompt != null) ...[
                    // Visual Data (if has image)
                    _buildVisualDataCard(_selectedPrompt),

                    // Question Card
                    _buildQuestionCard(_selectedPrompt),

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
                            color: Colors.red.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.red.withOpacity(0.2)),
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
                      // Your Answer Header
                      _buildYourAnswerHeader(_selectedPrompt),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _textController,
                        maxLines: 12,
                        autocorrect: true,
                        enableSuggestions: true,
                        style: const TextStyle(color: Color(0xFF0F172A), fontSize: 13, height: 1.5),
                        cursorColor: const Color(0xFFEF4444),
                        decoration: InputDecoration(
                          hintText: 'Start writing your response here...',
                          hintStyle: const TextStyle(color: Color(0xFF94A3B8)),
                          filled: true,
                          fillColor: Colors.white,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: const BorderSide(color: Color(0xFFEF4444), width: 1.5),
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
                      _buildWritingTipsCard(_selectedPrompt),
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
                      autocorrect: true,
                      enableSuggestions: true,
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
