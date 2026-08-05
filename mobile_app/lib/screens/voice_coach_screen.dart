import 'package:flutter/material.dart';
import '../models/language_ai_models.dart';
import '../services/language_ai_service.dart';

class VoiceCoachScreen extends StatefulWidget {
  final Scenario? initialScenario;

  const VoiceCoachScreen({super.key, this.initialScenario});

  @override
  State<VoiceCoachScreen> createState() => _VoiceCoachScreenState();
}

class _VoiceCoachScreenState extends State<VoiceCoachScreen> {
  late Scenario activeScenario;
  final List<ConversationTurn> turns = [];
  final TextEditingController textController = TextEditingController();
  bool isRecording = false;
  bool isProcessing = false;
  CoachingFeedback? activeFeedback;

  @override
  void initState() {
    super.initState();
    activeScenario = widget.initialScenario ?? LanguageAIService.presetScenarios[0];
    turns.add(
      ConversationTurn(
        id: 'turn-init',
        sender: 'AI_TUTOR',
        text: activeScenario.tutorPersona.greeting,
        timestamp: 'Just now',
      ),
    );
  }

  void _sendMessage([String? text]) async {
    final msg = text ?? textController.text.trim();
    if (msg.isEmpty || isProcessing) return;

    setState(() {
      turns.add(ConversationTurn(
        id: 'user-${DateTime.now().millisecondsSinceEpoch}',
        sender: 'USER',
        text: msg,
        timestamp: 'Just now',
      ));
      textController.clear();
      isProcessing = true;
    });

    final res = await LanguageAIService.simulateAITurn(activeScenario, msg);

    setState(() {
      turns.add(ConversationTurn(
        id: 'ai-${DateTime.now().millisecondsSinceEpoch}',
        sender: 'AI_TUTOR',
        text: res['responseText'] as String,
        timestamp: 'Just now',
        feedback: res['feedback'] as CoachingFeedback,
      ));
      activeFeedback = res['feedback'] as CoachingFeedback;
      isProcessing = false;
    });
  }

  void _toggleMic() {
    if (isRecording) {
      setState(() => isRecording = false);
      _sendMessage('Yo ir a la entrevista de trabajo ayer y tener mucho entusiasmo.');
    } else {
      setState(() => isRecording = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F081D),
      appBar: AppBar(
        backgroundColor: const Color(0xFF180E29),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(activeScenario.tutorPersona.name, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
            Text('${activeScenario.tutorPersona.role} · ${activeScenario.cefrLevel}', style: const TextStyle(color: Color(0xFFA855F7), fontSize: 11)),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: turns.length,
              itemBuilder: (context, index) {
                final t = turns[index];
                final isAI = t.sender == 'AI_TUTOR';
                return Align(
                  alignment: isAI ? Alignment.centerLeft : Alignment.centerRight,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(14),
                    constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
                    decoration: BoxDecoration(
                      color: isAI ? const Color(0xFF180E29) : const Color(0xFFA855F7),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      t.text,
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: isAI ? FontWeight.normal : FontWeight.bold,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          if (activeFeedback != null)
            Container(
              padding: const EdgeInsets.all(12),
              color: const Color(0xFF180E29),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Phonetic Accuracy:', style: TextStyle(color: Colors.white70, fontSize: 11)),
                      Text('${activeFeedback!.pronunciationScore}%', style: const TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold)),
                    ],
                  ),
                  if (activeFeedback!.grammarCorrections.isNotEmpty)
                    Text('Grammar Fix: ${activeFeedback!.grammarCorrections[0]['corrected']}', style: const TextStyle(color: Color(0xFFFF6B6B), fontSize: 11, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          Container(
            padding: const EdgeInsets.all(12),
            color: const Color(0xFF0F081D),
            child: Row(
              children: [
                IconButton(
                  icon: Icon(isRecording ? Icons.mic_off : Icons.mic, color: isRecording ? Colors.red : const Color(0xFFA855F7)),
                  onPressed: _toggleMic,
                ),
                Expanded(
                  child: TextField(
                    controller: textController,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(
                      hintText: 'Speak or type response...',
                      hintStyle: TextStyle(color: Colors.white38),
                      border: InputBorder.none,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.send, color: Color(0xFFA855F7)),
                  onPressed: () => _sendMessage(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
