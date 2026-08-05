import 'package:flutter/material.dart';
import '../services/language_ai_service.dart';

class MistakesScreen extends StatelessWidget {
  const MistakesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final mistakes = LanguageAIService.mistakes;

    return Scaffold(
      backgroundColor: const Color(0xFF0F081D),
      appBar: AppBar(
        backgroundColor: const Color(0xFF180E29),
        title: const Text('Persistent Error Memory', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: mistakes.length,
        itemBuilder: (context, index) {
          final m = mistakes[index];
          return Card(
            color: const Color(0xFF180E29),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: Colors.white12)),
            margin: const EdgeInsets.only(bottom: 12),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(m.category, style: TextStyle(color: const Color(0xFFFF6B6B), fontWeight: FontWeight.bold, fontSize: 11)),
                      Text('Made ${m.recurrenceCount}x', style: const TextStyle(color: Colors.white54, fontSize: 11)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text('Original: ${m.originalPhrase}', style: const TextStyle(color: Colors.redAccent, decoration: TextDecoration.lineThrough, fontSize: 12)),
                  const SizedBox(height: 4),
                  Text('✓ Fix: ${m.correctedPhrase}', style: TextStyle(color: const Color(0xFF10B981), fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 8),
                  Text(m.explanation, style: const TextStyle(color: Colors.white70, fontSize: 11)),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
