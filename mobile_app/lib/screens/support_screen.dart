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
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _messageController = TextEditingController();
  
  String _selectedType = 'Suggestion'; // 'Suggestion' or 'Complaint'
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _fetchTickets();
  }

  @override
  void dispose() {
    _emailController.dispose();
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
      final emailStr = _emailController.text.trim();
      final messageBody = _messageController.text.trim();
      final fullMessage = emailStr.isNotEmpty 
          ? '$messageBody\n\nContact Email: $emailStr' 
          : messageBody;

      final response = await _apiService.request(
        path: '/support/tickets',
        method: 'POST',
        body: jsonEncode({
          'subject': '[$_selectedType] Support Request',
          'message': fullMessage,
        }),
      );

      if (response.statusCode == 201) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Your $_selectedType has been sent successfully!'),
            backgroundColor: const Color(0xFF10B981),
          ),
        );
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
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        title: const Text(
          'Help & Support',
          style: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.bold, fontSize: 16),
        ),
        centerTitle: true,
        leading: GestureDetector(
          onTap: () => Navigator.pop(context),
          child: Container(
            margin: const EdgeInsets.all(12),
            decoration: const BoxDecoration(
              color: Color(0xFFE2E8F0),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.close_rounded, color: Color(0xFF475569), size: 16),
          ),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFC62828)))
          : SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Paper airplane top logo icon
                    Center(
                      child: Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          color: const Color(0xFFC62828).withOpacity(0.08),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.send_rounded,
                          color: Color(0xFFC62828),
                          size: 32,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    const Center(
                      child: Text(
                        "We'd love to hear from you!",
                        style: const TextStyle(color: Color(0xFF0F172A), fontSize: 20, fontWeight: FontWeight.w800),
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.symmetric(horizontal: 16.0),
                        child: Text(
                          "Whether you have a great idea or found an issue, let us know so we can improve.",
                          style: TextStyle(color: Color(0xFF64748B), fontSize: 12),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                    const SizedBox(height: 28),

                    // Type Selector Label
                    const Text(
                      'WHAT IS THIS REGARDING?',
                      style: TextStyle(color: Color(0xFF475569), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.8),
                    ),
                    const SizedBox(height: 8),

                    // Segmented Button suggestions/complaints
                    Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(() => _selectedType = 'Suggestion'),
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                decoration: BoxDecoration(
                                  color: _selectedType == 'Suggestion' ? const Color(0xFFC62828) : Colors.transparent,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Center(
                                  child: Text(
                                    'Suggestion',
                                    style: TextStyle(
                                      color: _selectedType == 'Suggestion' ? Colors.white : const Color(0xFF475569),
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(() => _selectedType = 'Complaint'),
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                decoration: BoxDecoration(
                                  color: _selectedType == 'Complaint' ? const Color(0xFFC62828) : Colors.transparent,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Center(
                                  child: Text(
                                    'Complaint',
                                    style: TextStyle(
                                      color: _selectedType == 'Complaint' ? Colors.white : const Color(0xFF475569),
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Email input optional
                    const Text(
                      'EMAIL (OPTIONAL)',
                      style: TextStyle(color: Color(0xFF475569), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.8),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _emailController,
                      style: const TextStyle(color: Color(0xFF0F172A), fontSize: 13),
                      keyboardType: TextInputType.emailAddress,
                      decoration: InputDecoration(
                        hintText: 'Enter your email address',
                        hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                        filled: true,
                        fillColor: Colors.white,
                        prefixIcon: const Icon(Icons.email_outlined, color: Color(0xFF94A3B8), size: 18),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(color: Color(0xFFC62828)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Message input field
                    const Text(
                      'MESSAGE',
                      style: TextStyle(color: Color(0xFF475569), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.8),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _messageController,
                      style: const TextStyle(color: Color(0xFF0F172A), fontSize: 13),
                      maxLines: 5,
                      validator: (val) => val == null || val.trim().isEmpty ? 'Please describe your request details' : null,
                      decoration: InputDecoration(
                        hintText: 'Please describe your suggestion or issue in detail...',
                        hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                        filled: true,
                        fillColor: Colors.white,
                        contentPadding: const EdgeInsets.all(16),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(color: Color(0xFFC62828)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Send suggestion button
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFC62828),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: _submitting ? null : _submitTicket,
                      child: Text(
                        _submitting ? 'Sending...' : 'Send $_selectedType',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Ticket History header
                    const Text(
                      'Ticket History',
                      style: const TextStyle(color: Color(0xFF0F172A), fontSize: 15, fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 12),
                    _tickets.isEmpty
                        ? Container(
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: const Center(
                              child: Text(
                                'No support tickets found.',
                                style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                              ),
                            ),
                          )
                        : ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: _tickets.length,
                            itemBuilder: (context, idx) {
                              final ticket = _tickets[idx];
                              final status = ticket['status'] ?? 'OPEN';
                              final hasReply = ticket['reply'] != null;

                              Color statusColor = const Color(0xFFC62828);
                              if (status == 'RESOLVED') {
                                statusColor = const Color(0xFF10B981);
                              } else if (status == 'CLOSED') {
                                statusColor = Colors.grey;
                              }

                              return Container(
                                margin: const EdgeInsets.only(bottom: 12),
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: const Color(0xFFE2E8F0)),
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
                                            style: const TextStyle(color: Color(0xFF0F172A), fontSize: 13, fontWeight: FontWeight.bold),
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: statusColor.withOpacity(0.08),
                                            borderRadius: BorderRadius.circular(4),
                                            border: Border.all(color: statusColor.withOpacity(0.15)),
                                          ),
                                          child: Text(
                                            status,
                                            style: TextStyle(color: statusColor, fontSize: 8, fontWeight: FontWeight.bold),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      ticket['message'] ?? '',
                                      style: const TextStyle(color: Color(0xFF475569), fontSize: 11, height: 1.4),
                                    ),
                                    if (hasReply) ...[
                                      const SizedBox(height: 12),
                                      Container(
                                        width: double.infinity,
                                        padding: const EdgeInsets.all(10),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF10B981).withOpacity(0.04),
                                          borderRadius: BorderRadius.circular(8),
                                          border: Border.all(color: const Color(0xFF10B981).withOpacity(0.12)),
                                        ),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            const Text(
                                              'TUTOR/ADMIN RESPONSE:',
                                              style: TextStyle(color: Color(0xFF10B981), fontSize: 8, fontWeight: FontWeight.bold),
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              ticket['reply'] ?? '',
                                              style: const TextStyle(color: Color(0xFF475569), fontSize: 11, height: 1.4),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              );
                            },
                          ),
                  ],
                ),
              ),
            ),
    );
  }
}
