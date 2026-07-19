import 'package:flutter/material.dart';
import '../services/localization.dart';

class BandCalculatorScreen extends StatefulWidget {
  const BandCalculatorScreen({super.key});

  @override
  State<BandCalculatorScreen> createState() => _BandCalculatorScreenState();
}

class _BandCalculatorScreenState extends State<BandCalculatorScreen> {
  double _listeningScore = 6.5;
  double _readingScore = 6.5;
  double _writingScore = 6.5;
  double _speakingScore = 6.5;
  double _overallBand = 6.5;

  @override
  void initState() {
    super.initState();
    _calculateOverall();
  }

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

  String _getBandDescriptor(double band) {
    if (band >= 9.0) return 'Expert User';
    if (band >= 8.0) return 'Very Good User';
    if (band >= 7.0) return 'Good User';
    if (band >= 6.0) return 'Competent User';
    if (band >= 5.0) return 'Modest User';
    if (band >= 4.0) return 'Limited User';
    if (band >= 3.0) return 'Extremely Limited User';
    if (band >= 2.0) return 'Intermittent User';
    if (band >= 1.0) return 'Non User';
    return 'Did not attempt';
  }

  String _t(String key) => LocalizationService.translate(key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: Padding(
          padding: const EdgeInsets.all(8.0),
          child: CircleAvatar(
            backgroundColor: Colors.white,
            child: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.black, size: 18),
              onPressed: () => Navigator.pop(context),
            ),
          ),
        ),
        title: Text(
          _t('band_calculator'),
          style: const TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.bold, fontSize: 18),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Circular Gauge
            Center(
              child: Column(
                children: [
                  CustomPaint(
                    size: const Size(180, 180),
                    painter: GaugePainter(_overallBand),
                    child: SizedBox(
                      width: 180,
                      height: 180,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            _overallBand.toStringAsFixed(1),
                            style: const TextStyle(
                              color: Color(0xFF0F172A),
                              fontSize: 50,
                              fontWeight: FontWeight.w900,
                              height: 1.0,
                            ),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Overall Band',
                            style: TextStyle(
                              color: Color(0xFF64748B),
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    _getBandDescriptor(_overallBand),
                    style: const TextStyle(
                      color: Color(0xFF475569),
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 36),

            // Sliders list
            _buildSliderCard(
              title: 'Listening',
              score: _listeningScore,
              activeColor: const Color(0xFF2563EB),
              icon: Icons.headset_mic_rounded,
              onChanged: (val) {
                setState(() => _listeningScore = val);
                _calculateOverall();
              },
            ),
            const SizedBox(height: 16),
            _buildSliderCard(
              title: 'Reading',
              score: _readingScore,
              activeColor: const Color(0xFF9333EA),
              icon: Icons.menu_book_rounded,
              onChanged: (val) {
                setState(() => _readingScore = val);
                _calculateOverall();
              },
            ),
            const SizedBox(height: 16),
            _buildSliderCard(
              title: 'Writing',
              score: _writingScore,
              activeColor: const Color(0xFFD97706),
              icon: Icons.edit_note_rounded,
              onChanged: (val) {
                setState(() => _writingScore = val);
                _calculateOverall();
              },
            ),
            const SizedBox(height: 16),
            _buildSliderCard(
              title: 'Speaking',
              score: _speakingScore,
              activeColor: const Color(0xFF059669),
              icon: Icons.mic_none_rounded,
              onChanged: (val) {
                setState(() => _speakingScore = val);
                _calculateOverall();
              },
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildSliderCard({
    required String title,
    required double score,
    required Color activeColor,
    required IconData icon,
    required ValueChanged<double> onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            spreadRadius: 1,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: activeColor.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(icon, color: activeColor, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    title,
                    style: const TextStyle(
                      color: Color(0xFF0F172A),
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              Text(
                score.toStringAsFixed(1),
                style: TextStyle(
                  color: activeColor,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              const Text('0', style: TextStyle(color: Colors.black26, fontSize: 10, fontWeight: FontWeight.bold)),
              Expanded(
                child: SliderTheme(
                  data: SliderThemeData(
                    activeTrackColor: activeColor,
                    inactiveTrackColor: const Color(0xFFF1F5F9),
                    thumbColor: Colors.white,
                    overlayColor: activeColor.withOpacity(0.12),
                    trackHeight: 4,
                    thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 10, elevation: 3),
                  ),
                  child: Slider(
                    value: score,
                    min: 0.0,
                    max: 9.0,
                    divisions: 18, // 0.5 steps
                    onChanged: onChanged,
                  ),
                ),
              ),
              const Text('9', style: TextStyle(color: Colors.black26, fontSize: 10, fontWeight: FontWeight.bold)),
            ],
          ),
        ],
      ),
    );
  }
}

class GaugePainter extends CustomPainter {
  final double value;

  GaugePainter(this.value);

  @override
  void paint(Canvas canvas, Size size) {
    final double strokeWidth = 12.0;
    final Offset center = Offset(size.width / 2, size.height / 2);
    final double radius = (size.width - strokeWidth) / 2;

    // Starts at 135 degrees (3/4 pi) and sweeps 270 degrees (1.5 pi)
    final double startAngle = 3.14159 * 0.75;
    final double sweepAngle = 3.14159 * 1.5;

    final Paint bgPaint = Paint()
      ..color = const Color(0xFFF1F5F9)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      sweepAngle,
      false,
      bgPaint,
    );

    final double activeSweepAngle = sweepAngle * (value / 9.0);
    final Paint activePaint = Paint()
      ..color = const Color(0xFFFF9800)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      activeSweepAngle,
      false,
      activePaint,
    );
  }

  @override
  bool shouldRepaint(covariant GaugePainter oldDelegate) {
    return oldDelegate.value != value;
  }
}
