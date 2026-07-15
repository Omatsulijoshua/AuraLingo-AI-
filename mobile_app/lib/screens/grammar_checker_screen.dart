import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class GrammarCheckerScreen extends StatefulWidget {
  const GrammarCheckerScreen({super.key});

  @override
  State<GrammarCheckerScreen> createState() => _GrammarCheckerScreenState();
}

class _GrammarCheckerScreenState extends State<GrammarCheckerScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _textController = TextEditingController();
  bool _submitting = false;
  dynamic _result;

  bool get _isCheckEnabled {
    return _textController.text.trim().isNotEmpty && !_submitting;
  }

  Future<void> _checkGrammar() async {
    if (!_isCheckEnabled) return;

    setState(() {
      _submitting = true;
      _result = null;
    });

    try {
      final response = await _apiService.request(
        path: '/content/grammar/check',
        method: 'POST',
        body: jsonEncode({
          'text': _textController.text.trim(),
        }),
      );

      if (response.statusCode == 201) {
        setState(() {
          _result = jsonDecode(response.body);
        });
      } else {
        throw Exception('Status code: ${response.statusCode}');
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to check grammar: $e')),
      );
    } finally {
      setState(() => _submitting = false);
    }
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
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
          'Grammar Checker',
          style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 10.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Your Text Label
            const Text(
              'Your Text',
              style: TextStyle(color: Colors.white60, fontSize: 11, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),

            // White textarea card
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              child: TextField(
                controller: _textController,
                maxLines: 6,
                style: const TextStyle(color: Colors.black87, fontSize: 14),
                decoration: const InputDecoration(
                  hintText: 'Type or paste text to check grammar...',
                  hintStyle: TextStyle(color: Colors.black26),
                  border: InputBorder.none,
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Check Grammar Button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: _isCheckEnabled ? _checkGrammar : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _isCheckEnabled ? const Color(0xFFC62828) : const Color(0xFFE2E8F0),
                  foregroundColor: _isCheckEnabled ? Colors.white : Colors.black38,
                  disabledBackgroundColor: const Color(0xFFE2E8F0),
                  disabledForegroundColor: Colors.black38,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: Icon(
                  Icons.verified,
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
                        'Check Grammar',
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

            // Analysis Results Card
            if (_result != null) ...[
              _buildGrammarResultWidget(),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildGrammarResultWidget() {
    final corrected = _result['correctedText'] ?? '';
    final corrections = _result['corrections'] as List? ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Corrected Text Section
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF0B1E36),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF1E3E6E)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Corrected Version',
                style: TextStyle(color: Color(0xFFD4AF37), fontSize: 13, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 10),
              SelectableText(
                corrected,
                style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.4),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // Mistakes list header
        Text(
          corrections.isEmpty ? 'No Grammar Errors Found!' : 'Identified Issues',
          style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),

        if (corrections.isEmpty) ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.green.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.green.withValues(alpha: 0.3)),
            ),
            child: const Row(
              children: [
                Icon(Icons.check_circle_outline, color: Colors.greenAccent, size: 20),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Perfect grammar! No mistakes detected in your text.',
                    style: TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                ),
              ],
            ),
          ),
        ] else ...[
          // Corrections List
          Column(
            children: corrections.map<Widget>((c) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 12.0),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0B1E36),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF1E3E6E)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Original: "${c['original'] ?? ''}"',
                        style: const TextStyle(color: Colors.white38, fontSize: 11, decoration: TextDecoration.lineThrough),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Correction: "${c['correction'] ?? ''}"',
                        style: const TextStyle(color: Colors.greenAccent, fontSize: 11, fontWeight: FontWeight.w600),
                      ),
                      if (c['explanation'] != null) ...[
                        const SizedBox(height: 6),
                        Text(
                          'Explanation: ${c['explanation']}',
                          style: const TextStyle(color: Colors.white70, fontSize: 11, height: 1.4),
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
    );
  }
}
