import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> with SingleTickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  bool _loading = true;
  dynamic _history;
  TabController? _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchHistory();
  }

  @override
  void dispose() {
    _tabController?.dispose();
    super.dispose();
  }

  Future<void> _fetchHistory() async {
    try {
      final response = await _apiService.request(path: '/analytics/history', method: 'GET');
      if (response.statusCode == 200) {
        setState(() {
          _history = jsonDecode(response.body);
        });
      }
    } catch (e) {
      debugPrint('Error fetching history: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF050E1A), // Deep Navy
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B1E36),
        title: const Text('Attempt History', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFFD4AF37),
          labelColor: const Color(0xFFD4AF37),
          unselectedLabelColor: Colors.white60,
          tabs: const [
            Tab(text: 'Exam Mode'),
            Tab(text: 'Practice Mode'),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFD4AF37)))
          : TabBarView(
              controller: _tabController,
              children: [
                _buildLogsView(_history?['examMode']),
                _buildLogsView(_history?['practiceMode']),
              ],
            ),
    );
  }

  Widget _buildLogsView(dynamic logs) {
    final mockExams = logs?['mockExams'] ?? [];
    final practiceAnswers = logs?['practiceAnswers'] ?? [];
    final writing = logs?['writing'] ?? [];
    final speaking = logs?['speaking'] ?? [];

    if (mockExams.isEmpty && practiceAnswers.isEmpty && writing.isEmpty && speaking.isEmpty) {
      return const Center(child: Text('No attempts found under this mode.', style: TextStyle(color: Colors.white30, fontSize: 13)));
    }

    return ListView(
      padding: const EdgeInsets.all(20.0),
      children: [
        if (mockExams.isNotEmpty) ...[
          const Text('Mock Exams', style: TextStyle(color: Color(0xFFD4AF37), fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 8),
          ...mockExams.map<Widget>((exam) => _buildLogCard(
                exam['mockTest']?['title'] ?? 'Mock Test',
                'Status: ${exam['status']}',
                exam['overallBandEstimate'] != null ? 'Band ${exam['overallBandEstimate']}' : 'In Progress',
              )),
          const SizedBox(height: 24),
        ],
        if (writing.isNotEmpty) ...[
          const Text('Writing Tasks', style: TextStyle(color: Color(0xFFD4AF37), fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 8),
          ...writing.map<Widget>((w) => _buildLogCard(
                w['prompt']?['title'] ?? 'Essay Practice',
                'Words Count: ${w['wordCount']}',
                w['bandScoreEstimate'] != null ? 'Band ${w['bandScoreEstimate']}' : 'Grading...',
              )),
          const SizedBox(height: 24),
        ],
        if (speaking.isNotEmpty) ...[
          const Text('Speaking Tasks', style: TextStyle(color: Color(0xFFD4AF37), fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 8),
          ...speaking.map<Widget>((s) => _buildLogCard(
                s['prompt']?['topic'] ?? 'Speaking Card',
                'Part ${s['prompt']?['part'] ?? 1}',
                s['bandScoreEstimate'] != null ? 'Band ${s['bandScoreEstimate']}' : 'Processing...',
              )),
          const SizedBox(height: 24),
        ],
        if (practiceAnswers.isNotEmpty) ...[
          const Text('Sectional Practices', style: TextStyle(color: Color(0xFFD4AF37), fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 8),
          ...practiceAnswers.map<Widget>((ans) => _buildLogCard(
                ans['question']?['questionText'] ?? 'Practice Question',
                'Module: ${ans['question']?['module']?['name'] ?? ''}',
                ans['isCorrect'] ? 'Correct' : 'Incorrect',
                success: ans['isCorrect'],
              )),
          const SizedBox(height: 24),
        ],
      ],
    );
  }

  Widget _buildLogCard(String title, String subtitle, String score, {bool? success}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0B1E36),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF1E3E6E)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(subtitle, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: success == true
                  ? Colors.green.withValues(alpha: 0.1)
                  : (success == false ? Colors.red.withValues(alpha: 0.1) : const Color(0xFFD4AF37).withValues(alpha: 0.1)),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(
                color: success == true
                    ? Colors.green.withValues(alpha: 0.2)
                    : (success == false ? Colors.red.withValues(alpha: 0.2) : const Color(0xFFD4AF37).withValues(alpha: 0.2)),
              ),
            ),
            child: Text(
              score,
              style: TextStyle(
                color: success == true ? Colors.green : (success == false ? Colors.red : const Color(0xFFD4AF37)),
                fontSize: 11,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
