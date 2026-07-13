import 'package:flutter/material.dart';
import '../services/localization.dart';

class ToolsScreen extends StatefulWidget {
  const ToolsScreen({super.key});

  @override
  State<ToolsScreen> createState() => _ToolsScreenState();
}

class _ToolsScreenState extends State<ToolsScreen> {
  // Band Calculator input variables
  double _listeningScore = 6.0;
  double _readingScore = 6.0;
  double _writingScore = 6.0;
  double _speakingScore = 6.0;
  double _overallBand = 6.0;

  void _calculateOverall() {
    final double avg = (_listeningScore + _readingScore + _writingScore + _speakingScore) / 4.0;
    // IELTS Rounding Rules: round to nearest half band
    final double fraction = avg - avg.toInt();
    double rounded = avg.toInt().toDouble();
    if (fraction >= 0.75) {
      rounded += 1.0;
    } else if (fraction >= 0.25) {
      rounded += 0.5;
    }
    setState(() {
      _overallBand = rounded;
    });
  }

  String _t(String key) => LocalizationService.translate(key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF050E1A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B1E36),
        title: Text(_t('ai_tools_title'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_t('ai_tools_desc'), style: const TextStyle(color: Colors.white60, fontSize: 12)),
            const SizedBox(height: 24),

            // AI Analysis Grid
            const Text('AI ANALYSIS', style: TextStyle(color: Color(0xFFD4AF37), fontSize: 11, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _buildToolCard(_t('essay_checker'), _t('essay_checker_desc'), Icons.fact_check, Colors.amberAccent),
            const SizedBox(height: 12),
            _buildToolCard(_t('grammar_check'), _t('grammar_check_desc'), Icons.spellcheck, Colors.greenAccent),
            const SizedBox(height: 12),
            _buildToolCard(_t('paraphrase'), _t('paraphrase_desc'), Icons.transform, Colors.blueAccent),
            const SizedBox(height: 12),
            _buildToolCard(_t('vocabulary'), _t('vocabulary_desc'), Icons.translate, Colors.purpleAccent),

            const SizedBox(height: 24),

            // Sample Generators
            const Text('AI SAMPLES', style: TextStyle(color: Color(0xFFD4AF37), fontSize: 11, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _buildToolCard(_t('speaking_samples'), _t('speaking_samples_desc'), Icons.mic, Colors.redAccent),
            const SizedBox(height: 12),
            _buildToolCard(_t('writing_samples'), _t('writing_samples_desc'), Icons.history_edu, Colors.tealAccent),

            const SizedBox(height: 28),

            // Band Calculator Widget
            const Text('UTILITIES', style: TextStyle(color: Color(0xFFD4AF37), fontSize: 11, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),

            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF0B1E36),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF1E3E6E)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.calculate, color: Color(0xFFD4AF37), size: 24),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(_t('band_calculator'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                            const SizedBox(height: 2),
                            Text(_t('band_calculator_desc'), style: const TextStyle(color: Colors.white54, fontSize: 10)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Overall result display
                  Container(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF050E1A),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFA3001E)),
                    ),
                    child: Column(
                      children: [
                        const Text('Calculated Overall Band', style: TextStyle(color: Colors.white54, fontSize: 10)),
                        const SizedBox(height: 4),
                        Text(
                          '$_overallBand',
                          style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Score sliders
                  _buildScoreSelector('Listening', _listeningScore, (val) {
                    setState(() => _listeningScore = val);
                    _calculateOverall();
                  }),
                  _buildScoreSelector('Reading', _readingScore, (val) {
                    setState(() => _readingScore = val);
                    _calculateOverall();
                  }),
                  _buildScoreSelector('Writing', _writingScore, (val) {
                    setState(() => _writingScore = val);
                    _calculateOverall();
                  }),
                  _buildScoreSelector('Speaking', _speakingScore, (val) {
                    setState(() => _speakingScore = val);
                    _calculateOverall();
                  }),
                ],
              ),
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _buildToolCard(String title, String desc, IconData icon, Color accentColor) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0B1E36),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF1E3E6E)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: accentColor.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: accentColor, size: 22),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 4),
                Text(desc, style: const TextStyle(color: Colors.white38, fontSize: 11)),
              ],
            ),
          ),
          const Icon(Icons.arrow_forward_ios, color: Colors.white24, size: 14),
        ],
      ),
    );
  }

  Widget _buildScoreSelector(String label, double val, ValueChanged<double> onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Row(
        children: [
          SizedBox(
            width: 80,
            child: Text(label, style: const TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600)),
          ),
          Expanded(
            child: Slider(
              value: val,
              min: 4.0,
              max: 9.0,
              divisions: 10,
              label: val.toString(),
              activeColor: const Color(0xFFA3001E),
              inactiveColor: const Color(0xFF1E3E6E),
              onChanged: onChanged,
            ),
          ),
          SizedBox(
            width: 30,
            child: Text(val.toString(), style: const TextStyle(color: Color(0xFFD4AF37), fontWeight: FontWeight.bold, fontSize: 12)),
          ),
        ],
      ),
    );
  }
}
