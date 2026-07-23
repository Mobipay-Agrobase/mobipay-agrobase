// Data models for VSLA module

class VslaGroup {
  final String id;
  final String name;
  final String code;
  final String? district;
  final double shareValue;
  final double loanInterestRate;
  final double maxLoanMultiplier;
  final String meetingFrequency;
  final String status;
  final int memberCount;
  final double totalSavings;
  final double outstandingLoans;
  final double socialFundBalance;

  VslaGroup({
    required this.id,
    required this.name,
    required this.code,
    this.district,
    required this.shareValue,
    required this.loanInterestRate,
    required this.maxLoanMultiplier,
    required this.meetingFrequency,
    required this.status,
    required this.memberCount,
    required this.totalSavings,
    required this.outstandingLoans,
    required this.socialFundBalance,
  });

  factory VslaGroup.fromJson(Map<String, dynamic> j) => VslaGroup(
    id: j['id'] as String,
    name: j['name'] as String,
    code: j['code'] as String,
    district: j['district'] as String?,
    shareValue: (j['shareValue'] as num).toDouble(),
    loanInterestRate: (j['loanInterestRate'] as num).toDouble(),
    maxLoanMultiplier: (j['maxLoanMultiplier'] as num).toDouble(),
    meetingFrequency: j['meetingFrequency'] as String? ?? 'WEEKLY',
    status: j['status'] as String? ?? 'ACTIVE',
    memberCount: j['_count']?['members'] as int? ?? 0,
    totalSavings: (j['totalSavings'] as num?)?.toDouble() ?? 0,
    outstandingLoans: (j['outstandingLoans'] as num?)?.toDouble() ?? 0,
    socialFundBalance: (j['socialFundBalance'] as num?)?.toDouble() ?? 0,
  );
}

class VslaMember {
  final String id;
  final String memberId;
  final String fullName;
  final String? phone;
  final String? gender;
  final String? occupation;
  final String status;
  final double totalSavings;
  final int totalShares;
  final double outstandingLoans;
  final String? officerRole;

  VslaMember({
    required this.id,
    required this.memberId,
    required this.fullName,
    this.phone,
    this.gender,
    this.occupation,
    required this.status,
    required this.totalSavings,
    required this.totalShares,
    required this.outstandingLoans,
    this.officerRole,
  });

  factory VslaMember.fromJson(Map<String, dynamic> j) => VslaMember(
    id: j['id'] as String,
    memberId: j['memberId'] as String? ?? '',
    fullName: j['fullName'] as String,
    phone: j['phone'] as String?,
    gender: j['gender'] as String?,
    occupation: j['occupation'] as String?,
    status: j['status'] as String? ?? 'ACTIVE',
    totalSavings: (j['totalSavings'] as num?)?.toDouble() ?? 0,
    totalShares: j['totalShares'] as int? ?? 0,
    outstandingLoans: (j['outstandingLoans'] as num?)?.toDouble() ?? 0,
    officerRole: j['officerRoles']?.isNotEmpty == true ? j['officerRoles'][0]['role'] as String : null,
  );
}

class VslaLoan {
  final String id;
  final String memberName;
  final double amount;
  final double totalRepayable;
  final double outstanding;
  final double amountRepaid;
  final String purpose;
  final String status;
  final DateTime? applicationDate;
  final DateTime? expectedRepaymentDate;
  final String transactionRef;
  final List<VslaRepayment> repayments;
  final List<VslaGuarantor> guarantors;

  VslaLoan({
    required this.id,
    required this.memberName,
    required this.amount,
    required this.totalRepayable,
    required this.outstanding,
    required this.amountRepaid,
    required this.purpose,
    required this.status,
    this.applicationDate,
    this.expectedRepaymentDate,
    required this.transactionRef,
    required this.repayments,
    required this.guarantors,
  });

  factory VslaLoan.fromJson(Map<String, dynamic> j) => VslaLoan(
    id: j['id'] as String,
    memberName: j['member']?['fullName'] as String? ?? 'Unknown',
    amount: (j['amount'] as num).toDouble(),
    totalRepayable: (j['totalRepayable'] as num).toDouble(),
    outstanding: (j['outstanding'] as num?)?.toDouble() ?? 0,
    amountRepaid: (j['amountRepaid'] as num?)?.toDouble() ?? 0,
    purpose: j['purpose'] as String? ?? '',
    status: j['status'] as String? ?? 'PENDING',
    applicationDate: j['applicationDate'] != null ? DateTime.parse(j['applicationDate'] as String) : null,
    expectedRepaymentDate: j['expectedRepaymentDate'] != null ? DateTime.parse(j['expectedRepaymentDate'] as String) : null,
    transactionRef: j['transactionRef'] as String? ?? '',
    repayments: (j['repayments'] as List<dynamic>? ?? []).map((r) => VslaRepayment.fromJson(r as Map<String, dynamic>)).toList(),
    guarantors: (j['guarantors'] as List<dynamic>? ?? []).map((g) => VslaGuarantor.fromJson(g as Map<String, dynamic>)).toList(),
  );
}

class VslaRepayment {
  final String id;
  final double amount;
  final DateTime createdAt;
  final String? transactionRef;

  VslaRepayment({required this.id, required this.amount, required this.createdAt, this.transactionRef});

  factory VslaRepayment.fromJson(Map<String, dynamic> j) => VslaRepayment(
    id: j['id'] as String,
    amount: (j['amount'] as num).toDouble(),
    createdAt: DateTime.parse(j['createdAt'] as String),
    transactionRef: j['transactionRef'] as String?,
  );
}

class VslaGuarantor {
  final String id;
  final String memberName;
  final double guaranteedAmount;
  final String status;

  VslaGuarantor({required this.id, required this.memberName, required this.guaranteedAmount, required this.status});

  factory VslaGuarantor.fromJson(Map<String, dynamic> j) => VslaGuarantor(
    id: j['id'] as String,
    memberName: j['member']?['fullName'] as String? ?? 'Unknown',
    guaranteedAmount: (j['guaranteedAmount'] as num).toDouble(),
    status: j['status'] as String? ?? 'PENDING',
  );
}

class VslaSaving {
  final String id;
  final String memberName;
  final double amount;
  final int sharesBought;
  final String paymentMethod;
  final String status;
  final DateTime createdAt;
  final String transactionRef;

  VslaSaving({
    required this.id,
    required this.memberName,
    required this.amount,
    required this.sharesBought,
    required this.paymentMethod,
    required this.status,
    required this.createdAt,
    required this.transactionRef,
  });

  factory VslaSaving.fromJson(Map<String, dynamic> j) => VslaSaving(
    id: j['id'] as String,
    memberName: j['member']?['fullName'] as String? ?? 'Unknown',
    amount: (j['amount'] as num).toDouble(),
    sharesBought: j['sharesBought'] as int? ?? 0,
    paymentMethod: j['paymentMethod'] as String? ?? 'CASH',
    status: j['status'] as String? ?? 'COMPLETED',
    createdAt: DateTime.parse(j['createdAt'] as String),
    transactionRef: j['transactionRef'] as String? ?? '',
  );
}

class VslaMeeting {
  final String id;
  final int meetingNumber;
  final String title;
  final DateTime meetingDate;
  final String? agenda;
  final String status;
  final int attendanceCount;
  final int totalMembers;
  final double totalSavings;

  VslaMeeting({
    required this.id,
    required this.meetingNumber,
    required this.title,
    required this.meetingDate,
    this.agenda,
    required this.status,
    required this.attendanceCount,
    required this.totalMembers,
    required this.totalSavings,
  });

  factory VslaMeeting.fromJson(Map<String, dynamic> j) => VslaMeeting(
    id: j['id'] as String,
    meetingNumber: j['meetingNumber'] as int? ?? 1,
    title: j['title'] as String? ?? 'Meeting',
    meetingDate: DateTime.parse(j['meetingDate'] as String),
    agenda: j['agenda'] as String?,
    status: j['status'] as String? ?? 'SCHEDULED',
    attendanceCount: j['attendanceCount'] as int? ?? 0,
    totalMembers: j['totalMembers'] as int? ?? 0,
    totalSavings: (j['totalSavings'] as num?)?.toDouble() ?? 0,
  );
}

class SocialFundContribution {
  final String id;
  final String? memberName;
  final double amount;
  final String contributionType;
  final DateTime createdAt;
  final String transactionRef;

  SocialFundContribution({
    required this.id,
    this.memberName,
    required this.amount,
    required this.contributionType,
    required this.createdAt,
    required this.transactionRef,
  });

  factory SocialFundContribution.fromJson(Map<String, dynamic> j) => SocialFundContribution(
    id: j['id'] as String,
    memberName: j['member']?['fullName'] as String?,
    amount: (j['amount'] as num).toDouble(),
    contributionType: j['contributionType'] as String? ?? 'REGULAR',
    createdAt: DateTime.parse(j['createdAt'] as String),
    transactionRef: j['transactionRef'] as String? ?? '',
  );
}

class SocialFundClaim {
  final String id;
  final String memberName;
  final double amount;
  final String claimType;
  final String description;
  final String status;

  SocialFundClaim({
    required this.id,
    required this.memberName,
    required this.amount,
    required this.claimType,
    required this.description,
    required this.status,
  });

  factory SocialFundClaim.fromJson(Map<String, dynamic> j) => SocialFundClaim(
    id: j['id'] as String,
    memberName: j['member']?['fullName'] as String? ?? 'Unknown',
    amount: (j['amount'] as num).toDouble(),
    claimType: j['claimType'] as String? ?? '',
    description: j['description'] as String? ?? '',
    status: j['status'] as String? ?? 'PENDING',
  );
}
