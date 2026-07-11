import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  final ApiService _apiService = ApiService();
  bool _loading = true;
  List<dynamic> _tickets = [];

  final _formKey = GlobalKey<FormState>();
  final TextEditingController _subjectController = TextEditingController();
  final TextEditingController _messageController = TextEditingController();
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _fetchTickets();
  }

  @override
  void dispose() {
    _subjectController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _fetchTickets() async {
    try {
      final response = await _apiService.request(path: '/support/tickets', method: 'GET');
      if (response.statusCode == 200) {
        setState(() {
          _tickets = jsonDecode(response.body);
        });
      }
    } catch (e) {
      debugPrint('Error fetching tickets: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _submitTicket() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _submitting = true);
    try {
      final response = await _apiService.request(
        path: '/support/tickets',
        method: 'POST',
        body: jsonEncode({
          'subject': _subjectController.text.trim(),
          'message': _messageController.text.trim(),
        }),
      );

      if (response.statusCode == 201) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Support ticket submitted successfully!'),
            backgroundColor: Color(0xFF10B981),
          ),
        );
        _subjectController.clear();
        _messageController.clear();
        _fetchTickets();
      } else {
        final body = jsonDecode(response.body);
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(body['message'] ?? 'Failed to submit ticket')),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Submission failed: $e')),
      );
    } finally {
      setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF050E1A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B1E36),
        title: const Text('Help & Support', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFD4AF37)))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Form Card
                  Form(
                    key: _formKey,
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0B1E36),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFF1E3E6E)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Text(
                            'Submit a Support Ticket',
                            style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _subjectController,
                            style: const TextStyle(color: Colors.white, fontSize: 13),
                            decoration: InputDecoration(
                              labelText: 'Subject',
                              labelStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
                              filled: true,
                              fillColor: const Color(0xFF050E1A),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                                borderSide: const BorderSide(color: Color(0xFF1E3E6E)),
                              ),
                            ),
                            validator: (value) => value == null || value.trim().isEmpty ? 'Subject is required' : null,
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _messageController,
                            style: const TextStyle(color: Colors.white, fontSize: 13),
                            maxLines: 4,
                            decoration: InputDecoration(
                              labelText: 'Message / Issue Details',
                              labelStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
                              filled: true,
                              fillColor: const Color(0xFF050E1A),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                                borderSide: const BorderSide(color: Color(0xFF1E3E6E)),
                              ),
                            ),
                            validator: (value) => value == null || value.trim().isEmpty ? 'Description is required' : null,
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFD4AF37),
                              foregroundColor: Colors.black,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            onPressed: _submitting ? null : _submitTicket,
                            child: Text(
                              _submitting ? 'Submitting...' : 'Submit Ticket',
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 28),

                  const Text(
                    'Ticket History',
                    style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  if (_tickets.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0B1E36),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFF1E3E6E)),
                      ),
                      child: const Center(
                        child: Text(
                          'No support tickets found.',
                          style: TextStyle(color: Colors.white38, fontSize: 12),
                        ),
                      ),
                    )
                  else
                    ..._tickets.map((ticket) {
                      final status = ticket['status'] ?? 'OPEN';
                      final hasReply = ticket['reply'] != null;

                      Color statusColor = const Color(0xFFD4AF37);
                      if (status == 'RESOLVED') {
                        statusColor = const Color(0xFF10B981);
                      } else if (status == 'CLOSED') {
                        statusColor = Colors.grey;
                      }

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
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
                                Expanded(
                                  child: Text(
                                    ticket['subject'] ?? '',
                                    style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: statusColor.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(4),
                                    border: Border.all(color: statusColor.withValues(alpha: 0.2)),
                                  ),
                                  child: Text(
                                    status,
                                    style: TextStyle(color: statusColor, fontSize: 9, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              ticket['message'] ?? '',
                              style: const TextStyle(color: Colors.white70, fontSize: 12, height: 1.4),
                            ),
                            if (hasReply) ...[
                              const SizedBox(height: 12),
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF10B981).withValues(alpha: 0.05),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.15)),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'TUTOR/ADMIN RESPONSE:',
                                      style: TextStyle(color: Color(0xFF10B981), fontSize: 9, fontWeight: FontWeight.bold),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      ticket['reply'] ?? '',
                                      style: const TextStyle(color: Colors.white70, fontSize: 12, height: 1.4),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                      );
                    }),
                ],
              ),
            ),
    );
  }
}
