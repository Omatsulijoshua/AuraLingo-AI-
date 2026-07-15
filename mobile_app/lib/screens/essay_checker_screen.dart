import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class EssayCheckerScreen extends StatefulWidget {
  const EssayCheckerScreen({super.key});

  @override
  State<EssayCheckerScreen> createState() => _EssayCheckerScreenState();
}

class _EssayCheckerScreenState extends State<EssayCheckerScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _essayController = TextEditingController();

  // Task type selection: 0 = Task 1 (Academic), 1 = Task 1 (General), 2 = Task 2
  int _selectedTaskTypeIndex = 0;
  bool _submitting = false;
  dynamic _feedback;
  int _wordCount = 0;

  // Mock upload chart image path/name
  String? _selectedImagePath;

  @override
  void initState() {
    super.initState();
    _essayController.addListener(_updateWordCount);
  }

  @override
  void dispose() {
    _essayController.removeListener(_updateWordCount);
    _essayController.dispose();
    super.dispose();
  }

  void _updateWordCount() {
    final text = _essayController.text.trim();
    if (text.isEmpty) {
      setState(() => _wordCount = 0);
      return;
    }
    setState(() {
      _wordCount = text.split(RegExp(r'\s+')).length;
    });
  }

  int get _minWordsRequired {
    return _selectedTaskTypeIndex == 2 ? 250 : 150;
  }

  String get _taskTypeName {
    if (_selectedTaskTypeIndex == 0) return 'Task 1 (Academic)';
    if (_selectedTaskTypeIndex == 1) return 'Task 1 (General)';
    return 'Task 2';
  }

  bool get _isCheckEnabled {
    return _wordCount >= _minWordsRequired && !_submitting;
  }

  Future<void> _checkEssay() async {
    if (!_isCheckEnabled) return;

    setState(() {
      _submitting = true;
      _feedback = null;
    });

    try {
      final String taskTypeParam = _selectedTaskTypeIndex == 2 ? 'TASK2' : 'TASK1';
      final String examTypeParam = _selectedTaskTypeIndex == 0 ? 'ACADEMIC' : 'GENERAL';

      final response = await _apiService.request(
        path: '/content/writing/submit-examiner',
        method: 'POST',
        body: jsonEncode({
          'promptId': 'CUSTOM',
          'userText': _essayController.text,
          'customQuestionText': 'Essay Checker practice essay',
          'customTaskType': taskTypeParam,
          'customExamType': examTypeParam,
        }),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        setState(() {
          _feedback = data['feedbackJson'];
        });
      } else {
        throw Exception('Status code: ${response.statusCode}');
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to check essay: $e')),
      );
    } finally {
      setState(() => _submitting = false);
    }
  }

  void _mockImageUpload() {
    setState(() {
      _selectedImagePath = 'uploaded_chart_mock.png';
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Graph or Chart uploaded successfully (Mock).')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF050E1A),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leadingWidth: 100,
        leading: TextButton.icon(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.arrow_back_ios, color: Color(0xFFC62828), size: 16),
          label: const Text(
            'Back',
            style: TextStyle(color: Color(0xFFC62828), fontSize: 14, fontWeight: FontWeight.bold),
          ),
        ),
        title: const Text(
          'Essay Checker',
          style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 10.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Task Type Label
            const Text(
              'Task Type',
              style: TextStyle(color: Colors.white60, fontSize: 11, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),

            // Segmented Task Type Tabs
            Row(
              children: [
                Expanded(child: _buildTaskTabButton(0, 'Task 1 (Academic)')),
                const SizedBox(width: 8),
                Expanded(child: _buildTaskTabButton(1, 'Task 1 (General)')),
                const SizedBox(width: 8),
                Expanded(child: _buildTaskTabButton(2, 'Task 2')),
              ],
            ),
            const SizedBox(height: 20),

            // Upload Graph Section (Academic Task 1 only)
            if (_selectedTaskTypeIndex == 0) ...[
              const Text(
                'Graph/Chart Image (Optional)',
                style: TextStyle(color: Colors.white60, fontSize: 11, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 10),
              GestureDetector(
                onTap: _mockImageUpload,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFC62828).withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFC62828).withValues(alpha: 0.2), style: BorderStyle.solid),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        _selectedImagePath != null ? Icons.check_circle : Icons.image,
                        color: _selectedImagePath != null ? Colors.greenAccent : const Color(0xFFC62828),
                        size: 18,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _selectedImagePath != null ? 'Chart Uploaded' : 'Upload Graph or Chart',
                        style: TextStyle(
                          color: _selectedImagePath != null ? Colors.greenAccent : const Color(0xFFC62828),
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
            ],

            // Textarea input
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              child: TextField(
                controller: _essayController,
                maxLines: 8,
                style: const TextStyle(color: Colors.black87, fontSize: 14),
                decoration: const InputDecoration(
                  hintText: 'Paste or type your essay here...',
                  hintStyle: TextStyle(color: Colors.black26),
                  border: InputBorder.none,
                ),
              ),
            ),
            const SizedBox(height: 8),

            // Word counter and validation row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '$_wordCount words',
                  style: const TextStyle(color: Color(0xFFD4AF37), fontSize: 12, fontWeight: FontWeight.bold),
                ),
                Text(
                  'Min. $_minWordsRequired words for $_taskTypeName',
                  style: const TextStyle(color: Colors.white38, fontSize: 11),
                ),
              ],
            ),
            const SizedBox(height: 30),

            // Check My Essay Button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: _isCheckEnabled ? _checkEssay : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _isCheckEnabled ? const Color(0xFFC62828) : const Color(0xFFE2E8F0),
                  foregroundColor: _isCheckEnabled ? Colors.white : Colors.black38,
                  disabledBackgroundColor: const Color(0xFFE2E8F0),
                  disabledForegroundColor: Colors.black38,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: Icon(
                  Icons.auto_awesome,
                  size: 18,
                  color: _isCheckEnabled ? Colors.white : Colors.black26,
                ),
                label: _submitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Text(
                        'Check My Essay',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                      ),
              ),
            ),
            const SizedBox(height: 12),

            // Free uses indicator
            const Center(
              child: Text(
                '3 free uses remaining',
                style: TextStyle(color: Colors.white38, fontSize: 11),
              ),
            ),
            const SizedBox(height: 30),

            // Feedback Results Card
            if (_feedback != null) ...[
              _buildFeedbackCard(),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildTaskTabButton(int index, String title) {
    final bool isActive = _selectedTaskTypeIndex == index;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedTaskTypeIndex = index;
          _feedback = null;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: isActive ? const Color(0xFFC62828) : Colors.white,
          borderRadius: BorderRadius.circular(10),
        ),
        alignment: Alignment.center,
        child: Text(
          title,
          style: TextStyle(
            color: isActive ? Colors.white : Colors.black54,
            fontSize: 11,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget _buildFeedbackCard() {
    final breakdown = _feedback['breakdown'] ?? {};
    final double band = (_feedback['estimatedBand'] ?? 6.0).toDouble();

    return Container(
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
              const Text(
                'AI Analysis Result',
                style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFD4AF37).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFD4AF37).withValues(alpha: 0.3)),
                ),
                child: Text(
                  'Band $band',
                  style: const TextStyle(color: Color(0xFFD4AF37), fontSize: 13, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Score Breakdown Grid
          Row(
            children: [
              Expanded(child: _buildMetricItem('Task Ach.', '${breakdown['taskAchievement'] ?? breakdown['taskResponse'] ?? 6.0}')),
              const SizedBox(width: 8),
              Expanded(child: _buildMetricItem('Coherence', '${breakdown['coherenceCohesion'] ?? 6.0}')),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(child: _buildMetricItem('Lexical', '${breakdown['lexicalResource'] ?? 6.0}')),
              const SizedBox(width: 8),
              Expanded(child: _buildMetricItem('Grammar', '${breakdown['grammarAccuracy'] ?? 6.0}')),
            ],
          ),
          const SizedBox(height: 20),

          // Coaching Tip
          const Text(
            'Coaching Tip',
            style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 6),
          Text(
            _feedback['coachingTip'] ?? 'Focus on expanding your supporting arguments and checking grammar consistency.',
            style: const TextStyle(color: Colors.white54, fontSize: 11, height: 1.4),
          ),
          const SizedBox(height: 20),

          // Detailed Sentence Corrections
          if (_feedback['sentences'] != null && (_feedback['sentences'] as List).isNotEmpty) ...[
            const Text(
              'Detailed Corrections',
              style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            Column(
              children: (_feedback['sentences'] as List).map<Widget>((s) {
                final bool hasError = s['hasError'] ?? false;
                if (!hasError) return const SizedBox.shrink();

                return Padding(
                  padding: const EdgeInsets.only(bottom: 12.0),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF050E1A),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.redAccent.withValues(alpha: 0.2)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Original: "${s['original'] ?? ''}"',
                          style: const TextStyle(color: Colors.white38, fontSize: 11, decoration: TextDecoration.lineThrough),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Correction: "${s['correction'] ?? ''}"',
                          style: const TextStyle(color: Colors.greenAccent, fontSize: 11, fontWeight: FontWeight.w600),
                        ),
                        if (s['explanation'] != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            'Why: ${s['explanation']}',
                            style: const TextStyle(color: Colors.white54, fontSize: 10),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildMetricItem(String label, String score) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFF050E1A),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFF1E3E6E)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: Colors.white38, fontSize: 9)),
          const SizedBox(height: 2),
          Text(score, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
