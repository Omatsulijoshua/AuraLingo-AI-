import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/api_service.dart';

class ReferralsScreen extends StatefulWidget {
  const ReferralsScreen({super.key});

  @override
  State<ReferralsScreen> createState() => _ReferralsScreenState();
}

class _ReferralsScreenState extends State<ReferralsScreen> {
  final ApiService _apiService = ApiService();
  bool _loading = true;
  dynamic _stats;

  // Text Controllers
  final TextEditingController _bankNameController = TextEditingController();
  final TextEditingController _accountNumberController = TextEditingController();
  final TextEditingController _accountNameController = TextEditingController();
  final TextEditingController _amountController = TextEditingController(text: '1000');

  bool _verifying = false;
  bool _withdrawing = false;

  @override
  void initState() {
    super.initState();
    _fetchStats();
  }

  @override
  void dispose() {
    _bankNameController.dispose();
    _accountNumberController.dispose();
    _accountNameController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _fetchStats() async {
    try {
      final response = await _apiService.request(path: '/referrals/stats', method: 'GET');
      if (response.statusCode == 200) {
        setState(() {
          _stats = jsonDecode(response.body);
          if (_stats['bankName'] != null) _bankNameController.text = _stats['bankName'];
          if (_stats['accountNumber'] != null) _accountNumberController.text = _stats['accountNumber'];
          if (_stats['accountName'] != null) _accountNameController.text = _stats['accountName'];
        });
      }
    } catch (e) {
      debugPrint('Error: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _verifyDetails() async {
    setState(() => _verifying = true);
    try {
      final response = await _apiService.request(
        path: '/referrals/verify',
        method: 'POST',
        body: jsonEncode({
          'bankName': _bankNameController.text,
          'accountNumber': _accountNumberController.text,
          'accountName': _accountNameController.text,
        }),
      );
      if (response.statusCode == 201) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Bank account verified successfully!')),
        );
        _fetchStats();
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Verification failed: $e')),
      );
    } finally {
      setState(() => _verifying = false);
    }
  }

  Future<void> _requestWithdrawal() async {
    setState(() => _withdrawing = true);
    try {
      final response = await _apiService.request(
        path: '/referrals/withdraw',
        method: 'POST',
        body: jsonEncode({
          'amount': double.parse(_amountController.text),
        }),
      );
      if (response.statusCode == 201) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Withdrawal request submitted! Processing in 24 hours.')),
        );
        _fetchStats();
      } else {
        final body = jsonDecode(response.body);
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(body['message'] ?? 'Withdrawal failed')),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Withdrawal failed: $e')),
      );
    } finally {
      setState(() => _withdrawing = false);
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return '';
    try {
      final date = DateTime.parse(dateStr);
      final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return '${months[date.month - 1]} ${date.day}, ${date.year}';
    } catch (_) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final refLink = _stats != null && _stats['referralLink'] != null
        ? _stats['referralLink'] as String
        : 'https://bandup-ielts-prep.vercel.app/auth/register?ref=${_stats?['userId'] ?? 'your-id'}';

    final double balance = (_stats?['referralBalance'] ?? 0.0) as double;
    final double withdrawable = (_stats?['withdrawableBalance'] ?? 0.0) as double;
    final double locked = (_stats?['lockedBalance'] ?? 0.0) as double;
    final double thisMonth = (_stats?['madeThisMonth'] ?? 0.0) as double;
    final referralsList = _stats?['referralsList'] as List? ?? [];

    return Scaffold(
      backgroundColor: const Color(0xFF050E1A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B1E36),
        title: const Text('Referrals & Earnings', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
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
                  // 1. Balance Overview & Monthly Earnings Grid Card
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF0B1E36), Color(0xFF1E3E6E)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFF1E3E6E)),
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Total Earnings', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 4),
                                Text('₦${balance.toStringAsFixed(0)}', style: const TextStyle(color: Color(0xFFD4AF37), fontSize: 28, fontWeight: FontWeight.bold)),
                              ],
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                const Text('This Month', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 4),
                                Text('₦${thisMonth.toStringAsFixed(0)}', style: const TextStyle(color: Colors.greenAccent, fontSize: 24, fontWeight: FontWeight.bold)),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        const Divider(color: Colors.white10),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Withdrawable', style: TextStyle(color: Colors.white54, fontSize: 10)),
                                const SizedBox(height: 2),
                                Text('₦${withdrawable.toStringAsFixed(0)}', style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                              ],
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                const Text('Locked / Pending', style: TextStyle(color: Colors.white54, fontSize: 10)),
                                const SizedBox(height: 2),
                                Text('₦${locked.toStringAsFixed(0)}', style: const TextStyle(color: Colors.amberAccent, fontSize: 14, fontWeight: FontWeight.bold)),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 2. Master Invite Link Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0B1E36),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFF1E3E6E)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Your Master Referral Link', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        const Text('Share this link to earn per referred user once they subscribe to any plan.', style: TextStyle(color: Colors.white38, fontSize: 10)),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFF050E1A),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(0xFF152A4A)),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  refLink,
                                  style: const TextStyle(color: Colors.white70, fontSize: 11),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.copy_rounded, color: Color(0xFFD4AF37), size: 18),
                                onPressed: () {
                                  Clipboard.setData(ClipboardData(text: refLink));
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Referral link copied to clipboard!')),
                                  );
                                },
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // 3. Referred Friends List Section
                  const Text('Invited Friends & Status', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  referralsList.isEmpty
                      ? Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0B1E36),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFF1E3E6E)),
                          ),
                          child: const Center(
                            child: Column(
                              children: [
                                Icon(Icons.people_outline_rounded, color: Colors.white24, size: 36),
                                SizedBox(height: 8),
                                Text('No referrals yet. Share your link to start earning!', style: TextStyle(color: Colors.white38, fontSize: 11)),
                              ],
                            ),
                          ),
                        )
                      : Container(
                          decoration: BoxDecoration(
                            color: const Color(0xFF0B1E36),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFF1E3E6E)),
                          ),
                          child: ListView.separated(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: referralsList.length,
                            separatorBuilder: (context, index) => const Divider(color: Colors.white10, height: 1),
                            itemBuilder: (context, idx) {
                              final item = referralsList[idx];
                              final isPaid = item['isPaidUser'] == true;
                              final dateStr = _formatDate(item['createdAt']);
                              final double earned = (item['rewardEarned'] ?? 0.0) as double;

                              return Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                child: Row(
                                  children: [
                                    CircleAvatar(
                                      radius: 16,
                                      backgroundColor: isPaid ? Colors.green.withOpacity(0.1) : Colors.white10,
                                      child: Text(
                                        (item['name'] as String? ?? 'S').substring(0, 1).toUpperCase(),
                                        style: TextStyle(color: isPaid ? Colors.greenAccent : Colors.white54, fontSize: 12, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            item['name'] ?? 'Invited User',
                                            style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            'Invited: $dateStr',
                                            style: const TextStyle(color: Colors.white38, fontSize: 9),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: isPaid ? Colors.green.withOpacity(0.08) : Colors.amber.withOpacity(0.08),
                                            borderRadius: BorderRadius.circular(6),
                                            border: Border.all(color: isPaid ? Colors.green.withOpacity(0.2) : Colors.amber.withOpacity(0.2)),
                                          ),
                                          child: Text(
                                            isPaid ? 'Paid' : 'Unpaid',
                                            style: TextStyle(color: isPaid ? Colors.greenAccent : Colors.amberAccent, fontSize: 9, fontWeight: FontWeight.bold),
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          isPaid ? '+₦${earned.toStringAsFixed(0)}' : '₦0 (Pending)',
                                          style: TextStyle(color: isPaid ? Colors.greenAccent : Colors.white38, fontSize: 10, fontWeight: FontWeight.bold),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                        ),
                  const SizedBox(height: 24),

                  // 4. Payout Bank Details
                  const Text('Payout Bank Account Details', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0B1E36),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFF1E3E6E)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _buildTextField(_bankNameController, 'Bank Name (e.g. Opay, Kuda)'),
                        const SizedBox(height: 10),
                        _buildTextField(_accountNumberController, 'Account Number'),
                        const SizedBox(height: 10),
                        _buildTextField(_accountNameController, 'Account Name'),
                        const SizedBox(height: 14),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF10B981),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          onPressed: _verifying ? null : _verifyDetails,
                          child: Text(_verifying ? 'Saving details...' : 'Save Bank Account', style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // 5. Request Payout Section
                  if (_stats?['isReferralVerified'] == true) ...[
                    const Text('Request Payout', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0B1E36),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFF1E3E6E)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            margin: const EdgeInsets.only(bottom: 12),
                            decoration: BoxDecoration(
                              color: Colors.blue.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: Colors.blue.withOpacity(0.15)),
                            ),
                            child: const Text(
                              'ℹ️ Payout Schedule Notice: Payout requests are verified and paid on the 21st of every month. You can only request one payout at a time.',
                              style: TextStyle(color: Colors.blueAccent, fontSize: 10, height: 1.4),
                            ),
                          ),
                          _buildTextField(_amountController, 'Amount (₦)', keyboardType: TextInputType.number),
                          const SizedBox(height: 14),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFD4AF37),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            onPressed: _withdrawing ? null : _requestWithdrawal,
                            child: Text(_withdrawing ? 'Processing payout...' : 'Request Payout', style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ),
                  ] else ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.yellow.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.yellow.withOpacity(0.15)),
                      ),
                      child: const Text('⚠️ Save and verify your payout bank details above to enable withdrawals request.', style: TextStyle(color: Colors.yellowAccent, fontSize: 11)),
                    ),
                  ],
                ],
              ),
            ),
    );
  }

  Widget _buildTextField(TextEditingController controller, String label, {TextInputType keyboardType = TextInputType.text}) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      style: const TextStyle(color: Colors.white, fontSize: 13),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
        filled: true,
        fillColor: const Color(0xFF050E1A),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Color(0xFF1E3E6E)),
        ),
      ),
    );
  }
}
