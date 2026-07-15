import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class VocabularyBuilderScreen extends StatefulWidget {
  const VocabularyBuilderScreen({super.key});

  @override
  State<VocabularyBuilderScreen> createState() => _VocabularyBuilderScreenState();
}

class _VocabularyBuilderScreenState extends State<VocabularyBuilderScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _customTopicController = TextEditingController();

  final List<String> _predefinedTopics = [
    'Education',
    'Technology',
    'Environment',
    'Health',
    'Globalization',
    'Culture',
    'Crime',
    'Media',
    'Work & Career',
    'Tourism',
    'Urban Life',
    'Science'
  ];

  int _selectedTopicIndex = 0; // default to 'Education'
  bool _submitting = false;
  List<dynamic>? _words;
  String _activeTopicTitle = '';
  int _freeUses = 3;

  @override
  void initState() {
    super.initState();
    _customTopicController.addListener(() {
      if (_customTopicController.text.trim().isNotEmpty) {
        setState(() {
          _selectedTopicIndex = -1; // Unselect predefined buttons
        });
      }
    });
  }

  @override
  void dispose() {
    _customTopicController.dispose();
    super.dispose();
  }

  String get _currentTopic {
    if (_selectedTopicIndex == -1) {
      return _customTopicController.text.trim();
    }
    return _predefinedTopics[_selectedTopicIndex];
  }

  bool get _isGenerateEnabled {
    return _currentTopic.isNotEmpty && !_submitting;
  }

  Future<void> _generateVocabulary() async {
    if (!_isGenerateEnabled) return;

    setState(() {
      _submitting = true;
      _words = null;
    });

    final topicToSubmit = _currentTopic;

    try {
      final response = await _apiService.request(
        path: '/content/vocabulary/generate',
        method: 'POST',
        body: jsonEncode({
          'topic': topicToSubmit,
        }),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        setState(() {
          _words = data['words'] as List?;
          _activeTopicTitle = topicToSubmit;
          if (_freeUses > 0) _freeUses--;
        });
      } else {
        throw Exception('Status code: ${response.statusCode}');
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to generate vocabulary: $e')),
      );
    } finally {
      setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Determine button position based on whether results are generated
    final bool showResults = _words != null && _words!.isNotEmpty;

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
          'Vocabulary Builder',
          style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 10.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // If results are shown, the generation button sits at the top (like Screenshot 3)
            if (showResults) ...[
              _buildGenerateButton(),
              const SizedBox(height: 12),
              Center(
                child: Text(
                  '$_freeUses free uses remaining',
                  style: const TextStyle(color: Colors.white38, fontSize: 11),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                '$_activeTopicTitle Vocabulary',
                style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              _buildWordsList(),
            ] else ...[
              // Choose a Topic
              const Text(
                'Choose a Topic',
                style: TextStyle(color: Colors.white60, fontSize: 11, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),

              // 3-Column Topics Grid
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  crossAxisSpacing: 8,
                  mainAxisSpacing: 8,
                  childAspectRatio: 2.8,
                ),
                itemCount: _predefinedTopics.length,
                itemBuilder: (context, index) {
                  final topic = _predefinedTopics[index];
                  final isSelected = _selectedTopicIndex == index;
                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedTopicIndex = index;
                        _customTopicController.clear();
                      });
                    },
                    child: Container(
                      decoration: BoxDecoration(
                        color: isSelected ? const Color(0xFFC62828) : Colors.white,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        topic,
                        style: TextStyle(
                          color: isSelected ? Colors.white : Colors.black54,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 16),

              // Custom topic input field
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.edit, color: Color(0xFFC62828), size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _customTopicController,
                        style: const TextStyle(color: Colors.black87, fontSize: 12),
                        decoration: const InputDecoration(
                          hintText: 'Or type your own topic...',
                          hintStyle: TextStyle(color: Colors.black26),
                          border: InputBorder.none,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Generate Vocabulary Button
              _buildGenerateButton(),
              const SizedBox(height: 12),
              Center(
                child: Text(
                  '$_freeUses free uses remaining',
                  style: const TextStyle(color: Colors.white38, fontSize: 11),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildGenerateButton() {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton.icon(
        onPressed: _isGenerateEnabled ? _generateVocabulary : null,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFFC62828),
          foregroundColor: Colors.white,
          disabledBackgroundColor: const Color(0xFF1E3E6E),
          disabledForegroundColor: Colors.white54,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        icon: _submitting
            ? const SizedBox.shrink()
            : const Icon(Icons.auto_awesome, size: 16),
        label: _submitting
            ? const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                  ),
                  SizedBox(width: 10),
                  Text(
                    'Generating...',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                  ),
                ],
              )
            : const Text(
                'Generate Vocabulary',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
              ),
      ),
    );
  }

  Widget _buildWordsList() {
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _words!.length,
      itemBuilder: (context, index) {
        final w = _words![index];
        final String word = w['word'] ?? '';
        final String partOfSpeech = w['partOfSpeech'] ?? '';
        final String band = w['band'] ?? 'Band 7+';
        final String definition = w['definition'] ?? '';
        final String example = w['example'] ?? '';
        final List<dynamic> synonyms = w['synonyms'] as List? ?? [];

        // Determine Band badge color: Green for Band 7/8+, Orange/Amber for lower
        final bool isHighBand = band.contains('7+') || band.contains('8+') || band.contains('9');
        final Color badgeBg = isHighBand ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7);
        final Color badgeText = isHighBand ? const Color(0xFF16A34A) : const Color(0xFFD97706);

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF0B1E36),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF1E3E6E)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Word, POS and Band Row
              Row(
                children: [
                  Text(
                    word,
                    style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEE2E2),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      partOfSpeech,
                      style: const TextStyle(color: Color(0xFFEF4444), fontSize: 9, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: badgeBg,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      band,
                      style: TextStyle(color: badgeText, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // Definition text
              Text(
                definition,
                style: const TextStyle(color: Colors.white70, fontSize: 12, height: 1.4),
              ),
              const SizedBox(height: 12),

              // Example block
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFC62828).withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFC62828).withValues(alpha: 0.1)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.format_quote, color: Color(0xFFC62828), size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        example,
                        style: const TextStyle(color: Colors.white70, fontSize: 11, fontStyle: FontStyle.italic, height: 1.4),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Synonyms Row
              if (synonyms.isNotEmpty) ...[
                Row(
                  children: [
                    const Text(
                      'Synonyms: ',
                      style: TextStyle(color: Colors.white38, fontSize: 10),
                    ),
                    Expanded(
                      child: Wrap(
                        spacing: 6,
                        children: synonyms.map<Widget>((s) {
                          return Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF1F5F9).withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              s.toString(),
                              style: const TextStyle(color: Colors.white70, fontSize: 9),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}
