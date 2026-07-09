import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ProgressReportScreen extends StatefulWidget {
  const ProgressReportScreen({super.key});

  @override
  State<ProgressReportScreen> createState() => _ProgressReportScreenState();
}

class _ProgressReportScreenState extends State<ProgressReportScreen> {
  final ApiService _apiService = ApiService();
  bool _loading = true;
  String _report = '';

  @override
  void initState() {
    super.initState();
    _fetchReport();
  }

  Future<void> _fetchReport() async {
    setState(() => _loading = true);
    try {
      final response = await _apiService.request(path: '/analytics/progress-report', method: 'GET');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _report = data['report'] ?? 'No report generated yet.';
        });
      }
    } catch (e) {
      setState(() => _report = 'Failed to load report: $e');
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
        title: const Text('AI Progress Report', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Color(0xFFD4AF37)),
            onPressed: _fetchReport,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFD4AF37)))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20.0),
              child: Container(
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
                        Icon(Icons.insights_rounded, color: Color(0xFFD4AF37)),
                        SizedBox(width: 10),
                        Text(
                          'AI Tutor Assessment',
                          style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    const Divider(color: Color(0xFF1E3E6E), height: 32),
                    Text(
                      _report,
                      style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 12, height: 1.6, fontFamily: 'sans-serif'),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
