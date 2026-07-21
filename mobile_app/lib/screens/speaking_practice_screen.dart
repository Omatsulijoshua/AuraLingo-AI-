import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../widgets/premium_paywall.dart';

class SpeakingPracticeScreen extends StatefulWidget {
  const SpeakingPracticeScreen({super.key});

  @override
  State<SpeakingPracticeScreen> createState() => _SpeakingPracticeScreenState();
}

class _SpeakingPracticeScreenState extends State<SpeakingPracticeScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _transcriptController = TextEditingController();

  // Screen routing states: 'HOME', 'TALK_WITH_AI', 'TEST_DETAIL', 'PRACTICE_WORKSPACE'
  String _currentScreen = 'HOME';

  // Talk with AI States
  bool _isAiSpeaking = true;
  int _freeMessagesLeft = 3;
  Timer? _aiSpeakingTimer;
  final List<Map<String, dynamic>> _chatMessages = [
    {
      'role': 'ai',
      'content': "Hello! I'm your IELTS speaking practice partner. What would you like to work on today?"
    }
  ];

  // Test Detail States
  int _selectedPart = 1;

  // Practice/Exam Workspace States
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
    _startAiSpeechSimulation("Hello! I'm your IELTS speaking practice partner. What would you like to work on today?");
  }

  @override
  void dispose() {
    _timer?.cancel();
    _aiSpeakingTimer?.cancel();
    _transcriptController.dispose();
    super.dispose();
  }

  void _startAiSpeechSimulation(String initialText) {
    setState(() {
      _isAiSpeaking = true;
    });
    _aiSpeakingTimer?.cancel();
    _aiSpeakingTimer = Timer(const Duration(seconds: 4), () {
      if (mounted) {
        setState(() {
          _isAiSpeaking = false;
        });
      }
    });
  }

  void _sendUserMessage(String text) {
    if (_freeMessagesLeft <= 0) return;
    setState(() {
      _chatMessages.add({'role': 'user', 'content': text});
      _freeMessagesLeft--;
      _isAiSpeaking = true;
    });

    _aiSpeakingTimer?.cancel();
    _aiSpeakingTimer = Timer(const Duration(seconds: 3), () {
      if (mounted) {
        setState(() {
          _chatMessages.add({
            'role': 'ai',
            'content': "That's a very interesting point. In the IELTS Speaking test, expanding on this with concrete examples will help boost your coherence score. Let's try another cue card prompt."
          });
          _isAiSpeaking = false;
        });
      }
    });
  }

  void _resetChat() {
    setState(() {
      _chatMessages.clear();
      _chatMessages.add({
        'role': 'ai',
        'content': "Hello! I'm your IELTS speaking practice partner. What would you like to work on today?"
      });
      _isAiSpeaking = false;
      _freeMessagesLeft = 3;
    });
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

    if (_currentScreen == 'TALK_WITH_AI') {
      return _buildTalkWithAiScreen();
    } else if (_currentScreen == 'TEST_DETAIL') {
      return _buildTestDetailScreen();
    } else if (_currentScreen == 'PRACTICE_WORKSPACE') {
      return _buildPracticeWorkspaceScreen();
    }

    return _buildHomeScreen();
  }

  // --- SCREEN 1: SPEAKING HOME PAGE (Image 1) ---
  Widget _buildHomeScreen() {
    return Scaffold(
      backgroundColor: const Color(0xFF050E1A),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leadingWidth: 100,
        leading: TextButton.icon(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.arrow_back_ios, color: Color(0xFFC62828), size: 16),
          label: const Text('Back', style: TextStyle(color: Color(0xFFC62828), fontSize: 14, fontWeight: FontWeight.bold)),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Speaking Practice',
              style: TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            const Text(
              'Real IELTS Speaking Tests',
              style: TextStyle(color: Colors.white70, fontSize: 13),
            ),
            const SizedBox(height: 24),

            // AI Powered Talk with AI Card
            InkWell(
              onTap: () {
                setState(() {
                  _currentScreen = 'TALK_WITH_AI';
                  _isAiSpeaking = true;
                });
                _startAiSpeechSimulation("Hello! I'm your IELTS speaking practice partner. What would you like to work on today?");
              },
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFC62828), Color(0xFF880E4F)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFC62828).withValues(alpha: 0.3),
                      blurRadius: 12,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.auto_awesome, color: Colors.white, size: 10),
                              SizedBox(width: 4),
                              Text(
                                'AI POWERED',
                                style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.15),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.waves, color: Colors.white, size: 20),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Talk with AI',
                      style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Practice free conversation with human-like AI voice',
                      style: TextStyle(color: Colors.white70, fontSize: 12),
                    ),
                    const SizedBox(height: 16),
                    const Divider(color: Colors.white24),
                    const SizedBox(height: 8),
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.mic, color: Colors.white70, size: 14),
                            SizedBox(width: 4),
                            Text('Voice Chat', style: TextStyle(color: Colors.white70, fontSize: 11)),
                          ],
                        ),
                        Row(
                          children: [
                            Icon(Icons.volume_up, color: Colors.white70, size: 14),
                            SizedBox(width: 4),
                            Text('AI Voice', style: TextStyle(color: Colors.white70, fontSize: 11)),
                          ],
                        ),
                        Row(
                          children: [
                            Icon(Icons.psychology, color: Colors.white70, size: 14),
                            SizedBox(width: 4),
                            Text('Smart AI', style: TextStyle(color: Colors.white70, fontSize: 11)),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 28),

            const Text(
              'Available Tests',
              style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),

            // Loop through Books 10 to 20 with 4 tests each dynamically
            ...List.generate(11, (bookIndex) {
              final bookNum = 10 + bookIndex;
              return Column(
                mainAxisSize: MainAxisSize.min,
                children: List.generate(4, (testIndex) {
                  final testNum = 1 + testIndex;
                  final isFirstTest = (bookNum == 10 && testNum == 1);
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12.0),
                    child: _buildTestListItem(
                      title: 'IELTS Book $bookNum Test $testNum',
                      subtitle: isFirstTest ? '3 Parts  |  0/3 Completed' : 'Premium Content',
                      isLocked: !isFirstTest,
                      iconData: isFirstTest ? Icons.mic : Icons.lock,
                      onTap: () {
                        if (isFirstTest) {
                          setState(() {
                            _currentScreen = 'TEST_DETAIL';
                            _selectedPart = 1;
                          });
                        } else {
                          showPremiumPaywall(context);
                        }
                      },
                    ),
                  );
                }),
              );
            }),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _buildTestListItem({
    required String title,
    required String subtitle,
    required bool isLocked,
    required IconData iconData,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(
          color: const Color(0xFF0B1E36),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF1E3E6E).withValues(alpha: 0.5)),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: isLocked ? const Color(0xFF1E3E6E).withValues(alpha: 0.3) : const Color(0xFFC62828).withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                iconData,
                color: isLocked ? const Color(0xFF94A3B8) : const Color(0xFFC62828),
                size: 20,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      color: isLocked ? const Color(0xFF94A3B8) : Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      color: Color(0xFF94A3B8),
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              isLocked ? Icons.lock_outline : Icons.chevron_right,
              color: const Color(0xFF1E3E6E),
              size: 20,
            ),
          ],
        ),
      ),
    );
  }

  // --- SCREEN 2 & 3: TALK WITH AI (Image 2 & 3) ---
  Widget _buildTalkWithAiScreen() {
    return Scaffold(
      backgroundColor: const Color(0xFF050E1A),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.white, size: 24),
          onPressed: () {
            _aiSpeakingTimer?.cancel();
            setState(() {
              _currentScreen = 'HOME';
            });
          },
        ),
        title: const Text(
          'Talk with AI',
          style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          // Messages list
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: _chatMessages.length,
              itemBuilder: (context, index) {
                final msg = _chatMessages[index];
                final isAi = msg['role'] == 'ai';
                return Padding(
                  padding: const EdgeInsets.only(bottom: 16.0),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: isAi ? MainAxisAlignment.start : MainAxisAlignment.end,
                    children: [
                      if (isAi) ...[
                        Container(
                          width: 32,
                          height: 32,
                          decoration: const BoxDecoration(
                            color: Color(0xFFC62828),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.psychology, color: Colors.white, size: 18),
                        ),
                        const SizedBox(width: 8),
                      ],
                      Flexible(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(
                            color: isAi ? Colors.white : const Color(0xFF0B1E36),
                            borderRadius: BorderRadius.circular(16),
                            border: isAi ? null : Border.all(color: const Color(0xFF1E3E6E)),
                          ),
                          child: Text(
                            msg['content'],
                            style: TextStyle(
                              color: isAi ? Colors.black87 : Colors.white,
                              fontSize: 13,
                              height: 1.4,
                            ),
                          ),
                        ),
                      ),
                      if (!isAi) ...[
                        const SizedBox(width: 8),
                        Container(
                          width: 32,
                          height: 32,
                          decoration: const BoxDecoration(
                            color: Color(0xFF1E3E6E),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.person, color: Colors.white, size: 18),
                        ),
                      ],
                    ],
                  ),
                );
              },
            ),
          ),

          // Speaking Status Indicators & Control Buttons
          Container(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 30),
            decoration: const BoxDecoration(
              color: Color(0xFF0B1E36),
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(24),
                topRight: Radius.circular(24),
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Status Text
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: _isAiSpeaking ? const Color(0xFFC62828) : const Color(0xFF94A3B8),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      _isAiSpeaking ? 'AI is speaking...' : 'Tap microphone to speak',
                      style: TextStyle(
                        color: _isAiSpeaking ? Colors.white : const Color(0xFF94A3B8),
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Controls Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Stop button on left (Only visible when AI is speaking)
                    if (_isAiSpeaking) ...[
                      InkWell(
                        onTap: () {
                          _aiSpeakingTimer?.cancel();
                          setState(() {
                            _isAiSpeaking = false;
                          });
                        },
                        customBorder: const CircleBorder(),
                        child: Container(
                          width: 50,
                          height: 50,
                          decoration: const BoxDecoration(
                            color: Color(0xFFE65100),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.stop, color: Colors.white, size: 20),
                        ),
                      ),
                      const SizedBox(width: 24),
                    ] else ...[
                      const SizedBox(width: 74), // Placeholder spacing to center the mic
                    ],

                    // Microphone button in center
                    InkWell(
                      onTap: _isAiSpeaking
                          ? null
                          : () {
                              _sendUserMessage("I want to practice Part 2 Cue Card topics about describing a childhood memory.");
                            },
                      customBorder: const CircleBorder(),
                      child: Container(
                        width: 70,
                        height: 70,
                        decoration: BoxDecoration(
                          color: _isAiSpeaking ? const Color(0xFF1E3E6E) : const Color(0xFFC62828),
                          shape: BoxShape.circle,
                          boxShadow: _isAiSpeaking
                              ? null
                              : [
                                  BoxShadow(
                                    color: const Color(0xFFC62828).withValues(alpha: 0.4),
                                    blurRadius: 16,
                                    spreadRadius: 2,
                                  ),
                                ],
                        ),
                        child: const Icon(Icons.mic, color: Colors.white, size: 28),
                      ),
                    ),
                    const SizedBox(width: 24),

                    // Reset button on right
                    InkWell(
                      onTap: _resetChat,
                      customBorder: const CircleBorder(),
                      child: Container(
                        width: 50,
                        height: 50,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white24),
                        ),
                        child: const Icon(Icons.replay, color: Colors.white, size: 20),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Free limit counter
                Text(
                  '$_freeMessagesLeft free messages remaining',
                  style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // --- SCREEN 4 & 5: TEST DETAIL PAGE (Image 4 & 5) ---
  Widget _buildTestDetailScreen() {
    return Scaffold(
      backgroundColor: const Color(0xFF050E1A),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leadingWidth: 100,
        leading: TextButton.icon(
          onPressed: () => setState(() => _currentScreen = 'HOME'),
          icon: const Icon(Icons.arrow_back_ios, color: Color(0xFFC62828), size: 16),
          label: const Text('Back', style: TextStyle(color: Color(0xFFC62828), fontSize: 14, fontWeight: FontWeight.bold)),
        ),
        title: const Text(
          'IELTS Book 10 Test 1',
          style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          // Segmented Tabs control row
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 10),
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: const Color(0xFF0B1E36),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Expanded(child: _buildPartTabButton(1, 'Part 1', 'Interview')),
                  Expanded(child: _buildPartTabButton(2, 'Part 2', 'Cue Card')),
                  Expanded(child: _buildPartTabButton(3, 'Part 3', 'Discussion')),
                ],
              ),
            ),
          ),

          // Detail Content Cards
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Topic Headers based on selection
                  Text(
                    _selectedPart == 1
                        ? 'Part 1: Questions 1-4'
                        : _selectedPart == 2
                            ? 'Part 2: Question 5'
                            : 'Part 3: Questions 6-11',
                    style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _selectedPart == 1
                        ? '4-5 minutes'
                        : _selectedPart == 2
                            ? '3-4 minutes'
                            : '4-5 minutes',
                    style: const TextStyle(color: Color(0xFFC62828), fontSize: 13, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),

                  Text(
                    _selectedPart == 1
                        ? 'The examiner asks general questions about familiar topics like home, family, work, studies, and interests.'
                        : _selectedPart == 2
                            ? 'You receive a task card with a topic. You have 1 minute to prepare, then speak for 1-2 minutes.'
                            : 'The examiner asks deeper questions related to Part 2 topic. These require more abstract thinking and opinions.',
                    style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.5),
                  ),
                  const SizedBox(height: 24),

                  const Text(
                    'Pro Tips',
                    style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),

                  // Dynamic list of tips with lightbulb icons
                  ..._buildPartTipsList(),
                  const SizedBox(height: 24),

                  // Test Security Info banner Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFC62828).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFC62828).withValues(alpha: 0.2)),
                    ),
                    child: const Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.security, color: Color(0xFFC62828), size: 20),
                        SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Questions are hidden until you start the speaking session to simulate real test conditions.',
                            style: TextStyle(color: Colors.white70, fontSize: 12, height: 1.5),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),

          // Sticky Start Speaking Button
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 30),
            child: SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: () {
                  setState(() {
                    _currentScreen = 'PRACTICE_WORKSPACE';
                    _timerActive = false;
                    _feedback = null;
                    _examSuccess = false;
                  });
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFC62828),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(Icons.mic, size: 20),
                label: const Text(
                  'Start Speaking',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPartTabButton(int partNum, String title, String subtitle) {
    final isSelected = _selectedPart == partNum;
    return InkWell(
      onTap: () => setState(() => _selectedPart = partNum),
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFC62828) : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          children: [
            Text(
              title,
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.white70,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              subtitle,
              style: TextStyle(
                color: isSelected ? Colors.white70 : const Color(0xFF94A3B8),
                fontSize: 9,
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildPartTipsList() {
    List<String> tips = [];
    if (_selectedPart == 1) {
      tips = [
        'Speak naturally and confidently.',
        'Expand on your answers but keep them relevant.',
        'Don\'t worry if the examiner interrupts you to move on.'
      ];
    } else if (_selectedPart == 2) {
      tips = [
        'Use your 1 minute preparation time effectively to make notes.',
        'Try to use the bullet points on the card to structure your talk.',
        'Keep speaking until the examiner stops you.'
      ];
    } else {
      tips = [
        'Express and justify your opinions clearly.',
        'Discuss topics generally rather than focusing on personal experiences.',
        'Ask for clarification if you don\'t understand a question.'
      ];
    }

    return tips.map((tip) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 8.0),
        child: Row(
          children: [
            const Icon(Icons.lightbulb, color: Color(0xFFEAB308), size: 16),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                tip,
                style: const TextStyle(color: Colors.white70, fontSize: 12),
              ),
            ),
          ],
        ),
      );
    }).toList();
  }

  // --- SCREEN 6: ORIGINAL INTEGRATED WORKSPACE SCREEN ---
  Widget _buildPracticeWorkspaceScreen() {
    return Scaffold(
      backgroundColor: const Color(0xFF050E1A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B1E36),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () {
            _timer?.cancel();
            setState(() {
              _currentScreen = 'TEST_DETAIL';
            });
          },
        ),
        title: const Text('Speaking Workspace', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
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

