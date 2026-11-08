export interface CreditCustomer {
  customerId: string;
  fullName: string;
  segment: 'Retail Prime' | 'Near-Prime' | 'SME Commercial' | 'Corporate Treasury';
  region: 'North' | 'West' | 'South' | 'East';
  annualIncomeInr: number;
  debtToIncomePct: number;
  creditScoreBand: '750+ (Prime)' | '680-749 (Standard)' | '620-679 (Watch)' | '<620 (Subprime)';
  onboardedDate: string;
}

export interface CreditAccount {
  accountId: string;
  customerId: string;
  productType: 'Revolving Credit Line' | 'Term Working Capital' | 'Commercial Card' | 'Trade Finance';
  creditLimitInr: number;
  currentBalanceInr: number;
  utilizationPct: number;
  daysPastDue: number;
  accountStatus: 'Current' | 'Watchlist (1-29 DPD)' | 'Delinquent (30+ DPD)' | 'Default (90+ DPD)';
}

export interface FinancialTransaction {
  transactionId: string;
  accountId: string;
  customerId: string;
  customerName: string;
  segment: CreditCustomer['segment'];
  timestamp: string;
  merchantCategory: string;
  amountInr: number;
  transactionType: 'Drawdown' | 'Repayment' | 'Merchant Settlement' | 'Fee Assessment';
  utilizationAfterPct: number;
  daysPastDue: number;
  riskTier: 'Low' | 'Moderate' | 'Elevated' | 'Critical';
  validationStatus: 'Validated' | 'Cleaned (Imputed)' | 'Rejected (Invalid)';
  validationNotes: string[];
}

export interface RiskAssessmentRecord {
  assessmentId: string;
  accountId: string;
  customerId: string;
  evaluatedAt: string;
  compositeRiskScore: number; // 0-100 descriptive risk index
  riskTier: 'Low' | 'Moderate' | 'Elevated' | 'Critical';
  primaryRiskDriver: string;
  recommendedAction: string;
}

export interface ValidationAuditLog {
  batchId: string;
  processedAt: string;
  sourceFormat: 'CSV Batch' | 'JSON Stream' | 'SQL Staging Load';
  recordsSubmitted: number;
  recordsValidated: number;
  recordsCleaned: number;
  recordsRejected: number;
  duplicateIdsRemoved: number;
  nullFieldsImputed: number;
  invalidDatesFixed: number;
}

export interface CreditVisionKPIs {
  totalTransactionsProcessed: number;
  validatedRecordsCount: number;
  cleanedRecordsCount: number;
  rejectedRecordsCount: number;
  dataValidationPassRatePct: number;
  totalPortfolioExposureInr: number;
  totalCreditLimitInr: number;
  averageUtilizationPct: number;
  averageDebtToIncomePct: number;
  delinquencyRate30PlusPct: number;
  highRiskExposureInr: number;
  highRiskExposureSharePct: number;
  activeAccountsCount: number;
  totalCustomersCount: number;
  flaggedHighRiskTransactionsCount: number;
}

export interface CreditVisionDataset {
  projectTitle: string;
  subtitle: string;
  customers: CreditCustomer[];
  creditAccounts: CreditAccount[];
  transactions: FinancialTransaction[];
  riskAssessments: RiskAssessmentRecord[];
  validationAuditLogs: ValidationAuditLog[];
  monthlyRiskTrends: Array<{
    month: string;
    processedCount: number;
    totalVolumeLakhs: number;
    avgUtilizationPct: number;
    delinquencyRatePct: number;
    flaggedCount: number;
  }>;
  riskTierBreakdown: Array<{
    tier: 'Low' | 'Moderate' | 'Elevated' | 'Critical';
    accountCount: number;
    transactionCount: number;
    exposureLakhs: number;
    sharePct: number;
  }>;
}

export function createInitialCreditVisionDataset(): CreditVisionDataset {
  const customers: CreditCustomer[] = [
    {
      customerId: 'CUST-1001',
      fullName: 'Aarav Mehta Enterprises',
      segment: 'SME Commercial',
      region: 'West',
      annualIncomeInr: 18500000,
      debtToIncomePct: 31.4,
      creditScoreBand: '750+ (Prime)',
      onboardedDate: '2025-04-12',
    },
    {
      customerId: 'CUST-1002',
      fullName: 'Nisha Verma Logistics',
      segment: 'SME Commercial',
      region: 'North',
      annualIncomeInr: 12400000,
      debtToIncomePct: 44.8,
      creditScoreBand: '680-749 (Standard)',
      onboardedDate: '2025-06-19',
    },
    {
      customerId: 'CUST-1003',
      fullName: 'Karthik Sundaram',
      segment: 'Retail Prime',
      region: 'South',
      annualIncomeInr: 3600000,
      debtToIncomePct: 24.2,
      creditScoreBand: '750+ (Prime)',
      onboardedDate: '2025-08-03',
    },
    {
      customerId: 'CUST-1004',
      fullName: 'Deccan Precision Components',
      segment: 'Corporate Treasury',
      region: 'South',
      annualIncomeInr: 42000000,
      debtToIncomePct: 58.6,
      creditScoreBand: '620-679 (Watch)',
      onboardedDate: '2025-02-27',
    },
    {
      customerId: 'CUST-1005',
      fullName: 'Vikramaditya Joshi',
      segment: 'Near-Prime',
      region: 'West',
      annualIncomeInr: 1950000,
      debtToIncomePct: 67.5,
      creditScoreBand: '<620 (Subprime)',
      onboardedDate: '2025-09-14',
    },
    {
      customerId: 'CUST-1006',
      fullName: 'Eastern Agro Supply Chain',
      segment: 'SME Commercial',
      region: 'East',
      annualIncomeInr: 15200000,
      debtToIncomePct: 36.1,
      creditScoreBand: '680-749 (Standard)',
      onboardedDate: '2025-05-08',
    },
    {
      customerId: 'CUST-1007',
      fullName: 'Meera Krishnan',
      segment: 'Retail Prime',
      region: 'South',
      annualIncomeInr: 4100000,
      debtToIncomePct: 21.0,
      creditScoreBand: '750+ (Prime)',
      onboardedDate: '2025-07-22',
    },
    {
      customerId: 'CUST-1008',
      fullName: 'Apex Freight & Cold Chain',
      segment: 'Corporate Treasury',
      region: 'North',
      annualIncomeInr: 31000000,
      debtToIncomePct: 63.2,
      creditScoreBand: '620-679 (Watch)',
      onboardedDate: '2025-03-11',
    },
  ];

  const creditAccounts: CreditAccount[] = [
    {
      accountId: 'ACC-901',
      customerId: 'CUST-1001',
      productType: 'Term Working Capital',
      creditLimitInr: 5000000,
      currentBalanceInr: 1650000,
      utilizationPct: 33.0,
      daysPastDue: 0,
      accountStatus: 'Current',
    },
    {
      accountId: 'ACC-902',
      customerId: 'CUST-1002',
      productType: 'Revolving Credit Line',
      creditLimitInr: 3500000,
      currentBalanceInr: 2590000,
      utilizationPct: 74.0,
      daysPastDue: 18,
      accountStatus: 'Watchlist (1-29 DPD)',
    },
    {
      accountId: 'ACC-903',
      customerId: 'CUST-1003',
      productType: 'Commercial Card',
      creditLimitInr: 800000,
      currentBalanceInr: 192000,
      utilizationPct: 24.0,
      daysPastDue: 0,
      accountStatus: 'Current',
    },
    {
      accountId: 'ACC-904',
      customerId: 'CUST-1004',
      productType: 'Trade Finance',
      creditLimitInr: 12000000,
      currentBalanceInr: 10560000,
      utilizationPct: 88.0,
      daysPastDue: 42,
      accountStatus: 'Delinquent (30+ DPD)',
    },
    {
      accountId: 'ACC-905',
      customerId: 'CUST-1005',
      productType: 'Revolving Credit Line',
      creditLimitInr: 600000,
      currentBalanceInr: 576000,
      utilizationPct: 96.0,
      daysPastDue: 64,
      accountStatus: 'Delinquent (30+ DPD)',
    },
    {
      accountId: 'ACC-906',
      customerId: 'CUST-1006',
      productType: 'Term Working Capital',
      creditLimitInr: 4500000,
      currentBalanceInr: 2160000,
      utilizationPct: 48.0,
      daysPastDue: 0,
      accountStatus: 'Current',
    },
    {
      accountId: 'ACC-907',
      customerId: 'CUST-1007',
      productType: 'Commercial Card',
      creditLimitInr: 900000,
      currentBalanceInr: 171000,
      utilizationPct: 19.0,
      daysPastDue: 0,
      accountStatus: 'Current',
    },
    {
      accountId: 'ACC-908',
      customerId: 'CUST-1008',
      productType: 'Trade Finance',
      creditLimitInr: 8500000,
      currentBalanceInr: 7310000,
      utilizationPct: 86.0,
      daysPastDue: 35,
      accountStatus: 'Delinquent (30+ DPD)',
    },
  ];

  const transactions: FinancialTransaction[] = [
    {
      transactionId: 'TXN-2026-8801',
      accountId: 'ACC-901',
      customerId: 'CUST-1001',
      customerName: 'Aarav Mehta Enterprises',
      segment: 'SME Commercial',
      timestamp: '2026-10-28 10:14:22',
      merchantCategory: 'Industrial Raw Materials',
      amountInr: 420000,
      transactionType: 'Drawdown',
      utilizationAfterPct: 33.0,
      daysPastDue: 0,
      riskTier: 'Low',
      validationStatus: 'Validated',
      validationNotes: ['Schema verified', 'Account foreign key & credit limit within bounds'],
    },
    {
      transactionId: 'TXN-2026-8802',
      accountId: 'ACC-902',
      customerId: 'CUST-1002',
      customerName: 'Nisha Verma Logistics',
      segment: 'SME Commercial',
      timestamp: '2026-10-29 14:32:10',
      merchantCategory: 'Fleet Fuel & Toll Clearing',
      amountInr: 385000,
      transactionType: 'Drawdown',
      utilizationAfterPct: 74.0,
      daysPastDue: 18,
      riskTier: 'Moderate',
      validationStatus: 'Validated',
      validationNotes: ['Utilization crossed 70% watchlist threshold'],
    },
    {
      transactionId: 'TXN-2026-8803',
      accountId: 'ACC-904',
      customerId: 'CUST-1004',
      customerName: 'Deccan Precision Components',
      segment: 'Corporate Treasury',
      timestamp: '2026-10-30 09:05:44',
      merchantCategory: 'Cross-Border Supplier Settlement',
      amountInr: 1850000,
      transactionType: 'Drawdown',
      utilizationAfterPct: 88.0,
      daysPastDue: 42,
      riskTier: 'Critical',
      validationStatus: 'Validated',
      validationNotes: [
        'Flagged: Account >30 DPD with utilization above 85% threshold',
      ],
    },
    {
      transactionId: 'TXN-2026-8804',
      accountId: 'ACC-903',
      customerId: 'CUST-1003',
      customerName: 'Karthik Sundaram',
      segment: 'Retail Prime',
      timestamp: '2026-10-30 16:48:19',
      merchantCategory: 'Cloud Infrastructure & SaaS',
      amountInr: 64000,
      transactionType: 'Merchant Settlement',
      utilizationAfterPct: 24.0,
      daysPastDue: 0,
      riskTier: 'Low',
      validationStatus: 'Validated',
      validationNotes: ['Schema verified'],
    },
    {
      transactionId: 'TXN-2026-8805',
      accountId: 'ACC-905',
      customerId: 'CUST-1005',
      customerName: 'Vikramaditya Joshi',
      segment: 'Near-Prime',
      timestamp: '2026-10-31 11:20:00',
      merchantCategory: 'Unclassified Cash Advance',
      amountInr: 145000,
      transactionType: 'Drawdown',
      utilizationAfterPct: 96.0,
      daysPastDue: 64,
      riskTier: 'Critical',
      validationStatus: 'Cleaned (Imputed)',
      validationNotes: [
        'Missing merchant category code imputed as Unclassified Cash Advance',
        'Flagged: Near-limit utilization (96%) and 64 DPD delinquency',
      ],
    },
    {
      transactionId: 'TXN-2026-8806',
      accountId: 'ACC-906',
      customerId: 'CUST-1006',
      customerName: 'Eastern Agro Supply Chain',
      segment: 'SME Commercial',
      timestamp: '2026-10-31 17:05:12',
      merchantCategory: 'Warehouse Cold Storage',
      amountInr: 540000,
      transactionType: 'Repayment',
      utilizationAfterPct: 48.0,
      daysPastDue: 0,
      riskTier: 'Low',
      validationStatus: 'Validated',
      validationNotes: ['Principal repayment verified against ledger balance'],
    },
    {
      transactionId: 'TXN-2026-8807',
      accountId: 'ACC-908',
      customerId: 'CUST-1008',
      customerName: 'Apex Freight & Cold Chain',
      segment: 'Corporate Treasury',
      timestamp: '2026-11-01 12:40:33',
      merchantCategory: 'Port Customs & Freight',
      amountInr: 1290000,
      transactionType: 'Drawdown',
      utilizationAfterPct: 86.0,
      daysPastDue: 35,
      riskTier: 'Elevated',
      validationStatus: 'Cleaned (Imputed)',
      validationNotes: [
        'Normalized non-ISO date string (01/11/2026) to YYYY-MM-DD HH:mm:ss',
        'Flagged: 35 DPD account exceeding 85% credit line utilization',
      ],
    },
    {
      transactionId: 'TXN-2026-8808',
      accountId: 'ACC-907',
      customerId: 'CUST-1007',
      customerName: 'Meera Krishnan',
      segment: 'Retail Prime',
      timestamp: '2026-11-01 18:15:05',
      merchantCategory: 'Enterprise Software Licensing',
      amountInr: 82000,
      transactionType: 'Merchant Settlement',
      utilizationAfterPct: 19.0,
      daysPastDue: 0,
      riskTier: 'Low',
      validationStatus: 'Validated',
      validationNotes: ['Schema verified'],
    },
    {
      transactionId: 'TXN-2026-8809',
      accountId: 'ACC-902',
      customerId: 'CUST-1002',
      customerName: 'Nisha Verma Logistics',
      segment: 'SME Commercial',
      timestamp: '2026-11-02 08:22:41',
      merchantCategory: 'Highway Fleet Maintenance',
      amountInr: 210000,
      transactionType: 'Drawdown',
      utilizationAfterPct: 78.5,
      daysPastDue: 19,
      riskTier: 'Elevated',
      validationStatus: 'Validated',
      validationNotes: ['Escalated from Moderate to Elevated due to rising revolving utilization'],
    },
    {
      transactionId: 'TXN-2026-8810',
      accountId: 'ACC-904',
      customerId: 'CUST-1004',
      customerName: 'Deccan Precision Components',
      segment: 'Corporate Treasury',
      timestamp: '2026-11-02 09:45:00',
      merchantCategory: 'Invalid Negative Settlement Payload',
      amountInr: -95000,
      transactionType: 'Drawdown',
      utilizationAfterPct: 88.0,
      daysPastDue: 42,
      riskTier: 'Critical',
      validationStatus: 'Rejected (Invalid)',
      validationNotes: [
        'Rejected by Validation Rule #3: Drawdown amount cannot be negative (-95000 INR)',
      ],
    },
  ];

  const riskAssessments: RiskAssessmentRecord[] = [
    {
      assessmentId: 'RSK-501',
      accountId: 'ACC-904',
      customerId: 'CUST-1004',
      evaluatedAt: '2026-11-02T09:30:00Z',
      compositeRiskScore: 84,
      riskTier: 'Critical',
      primaryRiskDriver: '42 Days Past Due + 88% Trade Finance Line Utilization',
      recommendedAction: 'Place automated drawdown hold and initiate structured repayment schedule.',
    },
    {
      assessmentId: 'RSK-502',
      accountId: 'ACC-905',
      customerId: 'CUST-1005',
      evaluatedAt: '2026-11-02T09:30:00Z',
      compositeRiskScore: 91,
      riskTier: 'Critical',
      primaryRiskDriver: '64 Days Past Due + 96% Revolving Line Utilization + 67.5% DTI',
      recommendedAction: 'Escalate to restructuring desk and freeze further cash-advance drawdowns.',
    },
    {
      assessmentId: 'RSK-503',
      accountId: 'ACC-908',
      customerId: 'CUST-1008',
      evaluatedAt: '2026-11-02T09:30:00Z',
      compositeRiskScore: 73,
      riskTier: 'Elevated',
      primaryRiskDriver: '35 Days Past Due + 86% Trade Finance Utilization',
      recommendedAction: 'Require invoice collateral verification prior to next freight disbursement.',
    },
    {
      assessmentId: 'RSK-504',
      accountId: 'ACC-902',
      customerId: 'CUST-1002',
      evaluatedAt: '2026-11-02T09:30:00Z',
      compositeRiskScore: 58,
      riskTier: 'Moderate',
      primaryRiskDriver: '18 Days Past Due + 74% Revolving Line Utilization',
      recommendedAction: 'Send automated 15-DPD payment reminder and monitor weekly fuel drawdown velocity.',
    },
  ];

  const validationAuditLogs: ValidationAuditLog[] = [
    {
      batchId: 'BATCH-2026-10-Q4A',
      processedAt: '2026-10-15T06:00:00Z',
      sourceFormat: 'CSV Batch',
      recordsSubmitted: 7450,
      recordsValidated: 7180,
      recordsCleaned: 215,
      recordsRejected: 55,
      duplicateIdsRemoved: 34,
      nullFieldsImputed: 142,
      invalidDatesFixed: 73,
    },
    {
      batchId: 'BATCH-2026-10-Q4B',
      processedAt: '2026-10-25T06:00:00Z',
      sourceFormat: 'SQL Staging Load',
      recordsSubmitted: 8120,
      recordsValidated: 7890,
      recordsCleaned: 184,
      recordsRejected: 46,
      duplicateIdsRemoved: 29,
      nullFieldsImputed: 118,
      invalidDatesFixed: 66,
    },
    {
      batchId: 'BATCH-2026-11-LIVE',
      processedAt: '2026-11-02T09:45:00Z',
      sourceFormat: 'JSON Stream',
      recordsSubmitted: 6840,
      recordsValidated: 6612,
      recordsCleaned: 179,
      recordsRejected: 49,
      duplicateIdsRemoved: 21,
      nullFieldsImputed: 114,
      invalidDatesFixed: 65,
    },
  ];

  const monthlyRiskTrends = [
    {
      month: 'Jun 2026',
      processedCount: 3420,
      totalVolumeLakhs: 412,
      avgUtilizationPct: 48.2,
      delinquencyRatePct: 8.4,
      flaggedCount: 14,
    },
    {
      month: 'Jul 2026',
      processedCount: 3680,
      totalVolumeLakhs: 448,
      avgUtilizationPct: 51.0,
      delinquencyRatePct: 9.1,
      flaggedCount: 18,
    },
    {
      month: 'Aug 2026',
      processedCount: 3890,
      totalVolumeLakhs: 475,
      avgUtilizationPct: 53.6,
      delinquencyRatePct: 10.5,
      flaggedCount: 21,
    },
    {
      month: 'Sep 2026',
      processedCount: 4110,
      totalVolumeLakhs: 510,
      avgUtilizationPct: 55.8,
      delinquencyRatePct: 11.2,
      flaggedCount: 25,
    },
    {
      month: 'Oct 2026',
      processedCount: 4390,
      totalVolumeLakhs: 546,
      avgUtilizationPct: 57.4,
      delinquencyRatePct: 12.0,
      flaggedCount: 29,
    },
    {
      month: 'Nov 2026',
      processedCount: 2920,
      totalVolumeLakhs: 384,
      avgUtilizationPct: 58.5,
      delinquencyRatePct: 12.5,
      flaggedCount: 19,
    },
  ];

  const riskTierBreakdown: CreditVisionDataset['riskTierBreakdown'] = [
    {
      tier: 'Low',
      accountCount: 4,
      transactionCount: 4,
      exposureLakhs: 41.73,
      sharePct: 16.5,
    },
    {
      tier: 'Moderate',
      accountCount: 1,
      transactionCount: 1,
      exposureLakhs: 25.9,
      sharePct: 10.3,
    },
    {
      tier: 'Elevated',
      accountCount: 1,
      transactionCount: 2,
      exposureLakhs: 73.1,
      sharePct: 29.0,
    },
    {
      tier: 'Critical',
      accountCount: 2,
      transactionCount: 3,
      exposureLakhs: 111.36,
      sharePct: 44.2,
    },
  ];

  return {
    projectTitle: 'CreditVision — Financial Risk Analytics & Data Processing',
    subtitle:
      'End-to-End Financial Transaction Cleaning, Relational Risk Modelling, REST API Services & Executive KPI Analytics',
    customers,
    creditAccounts,
    transactions,
    riskAssessments,
    validationAuditLogs,
    monthlyRiskTrends,
    riskTierBreakdown,
  };
}

export function calculateCreditVisionKPIs(dataset: CreditVisionDataset): CreditVisionKPIs {
  const totalFromBatches = dataset.validationAuditLogs.reduce(
    (sum, b) => sum + b.recordsSubmitted,
    0
  );
  const validatedFromBatches = dataset.validationAuditLogs.reduce(
    (sum, b) => sum + b.recordsValidated,
    0
  );
  const cleanedFromBatches = dataset.validationAuditLogs.reduce(
    (sum, b) => sum + b.recordsCleaned,
    0
  );
  const rejectedFromBatches = dataset.validationAuditLogs.reduce(
    (sum, b) => sum + b.recordsRejected,
    0
  );

  const totalPortfolioExposureInr = dataset.creditAccounts.reduce(
    (sum, acc) => sum + acc.currentBalanceInr,
    0
  );
  const totalCreditLimitInr = dataset.creditAccounts.reduce(
    (sum, acc) => sum + acc.creditLimitInr,
    0
  );
  const averageUtilizationPct =
    dataset.creditAccounts.length > 0
      ? Number(
          (
            dataset.creditAccounts.reduce((sum, acc) => sum + acc.utilizationPct, 0) /
            dataset.creditAccounts.length
          ).toFixed(1)
        )
      : 0;

  const averageDebtToIncomePct =
    dataset.customers.length > 0
      ? Number(
          (
            dataset.customers.reduce((sum, c) => sum + c.debtToIncomePct, 0) /
            dataset.customers.length
          ).toFixed(1)
        )
      : 0;

  const delinquentAccounts = dataset.creditAccounts.filter((a) => a.daysPastDue >= 30);
  const delinquencyRate30PlusPct =
    dataset.creditAccounts.length > 0
      ? Number(((delinquentAccounts.length / dataset.creditAccounts.length) * 100).toFixed(1))
      : 0;

  const highRiskExposureInr = delinquentAccounts.reduce(
    (sum, a) => sum + a.currentBalanceInr,
    0
  );
  const highRiskExposureSharePct =
    totalPortfolioExposureInr > 0
      ? Number(((highRiskExposureInr / totalPortfolioExposureInr) * 100).toFixed(1))
      : 0;

  const passRatePct =
    totalFromBatches > 0
      ? Number(
          (((validatedFromBatches + cleanedFromBatches) / totalFromBatches) * 100).toFixed(2)
        )
      : 100;

  const flaggedHighRiskTransactionsCount = dataset.transactions.filter(
    (t) => t.riskTier === 'Critical' || t.riskTier === 'Elevated'
  ).length;

  return {
    totalTransactionsProcessed: totalFromBatches,
    validatedRecordsCount: validatedFromBatches,
    cleanedRecordsCount: cleanedFromBatches,
    rejectedRecordsCount: rejectedFromBatches,
    dataValidationPassRatePct: passRatePct,
    totalPortfolioExposureInr,
    totalCreditLimitInr,
    averageUtilizationPct,
    averageDebtToIncomePct,
    delinquencyRate30PlusPct,
    highRiskExposureInr,
    highRiskExposureSharePct,
    activeAccountsCount: dataset.creditAccounts.length,
    totalCustomersCount: dataset.customers.length,
    flaggedHighRiskTransactionsCount,
  };
}

export function validateAndIngestTransactionBatch(
  dataset: CreditVisionDataset,
  rawRows: Array<{
    transactionId?: string;
    accountId?: string;
    customerName?: string;
    merchantCategory?: string;
    amountInr?: number;
    timestamp?: string;
    utilizationAfterPct?: number;
    daysPastDue?: number;
  }>
): {
  updatedDataset: CreditVisionDataset;
  batchSummary: ValidationAuditLog;
  processedTransactions: FinancialTransaction[];
} {
  const existingIds = new Set(dataset.transactions.map((t) => t.transactionId));
  let recordsValidated = 0;
  let recordsCleaned = 0;
  let recordsRejected = 0;
  let duplicateIdsRemoved = 0;
  let nullFieldsImputed = 0;
  let invalidDatesFixed = 0;

  const newTransactions: FinancialTransaction[] = [];

  rawRows.forEach((row, idx) => {
    const notes: string[] = [];
    const txnId = (row.transactionId || '').trim() || `TXN-2026-99${idx + 1}`;

    if (existingIds.has(txnId)) {
      duplicateIdsRemoved++;
      recordsRejected++;
      return;
    }

    const amount = Number(row.amountInr);
    if (!Number.isFinite(amount) || amount <= 0) {
      recordsRejected++;
      newTransactions.push({
        transactionId: txnId,
        accountId: row.accountId || 'ACC-901',
        customerId: 'CUST-1001',
        customerName: row.customerName || 'Unknown Counterparty',
        segment: 'SME Commercial',
        timestamp: row.timestamp || '2026-11-02 10:00:00',
        merchantCategory: row.merchantCategory || 'Invalid Payload',
        amountInr: Number.isFinite(amount) ? amount : 0,
        transactionType: 'Drawdown',
        utilizationAfterPct: Number(row.utilizationAfterPct) || 0,
        daysPastDue: Number(row.daysPastDue) || 0,
        riskTier: 'Critical',
        validationStatus: 'Rejected (Invalid)',
        validationNotes: ['Rejected: Transaction amount must be a positive number'],
      });
      return;
    }

    let wasCleaned = false;
    let merchant = (row.merchantCategory || '').trim();
    if (!merchant) {
      merchant = 'Unclassified Commercial Spend (Imputed)';
      nullFieldsImputed++;
      wasCleaned = true;
      notes.push('Imputed missing merchantCategory field');
    }

    let ts = (row.timestamp || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}/.test(ts)) {
      ts = '2026-11-02 11:30:00';
      invalidDatesFixed++;
      wasCleaned = true;
      notes.push('Normalized non-ISO timestamp to YYYY-MM-DD HH:mm:ss');
    }

    const util = Math.max(0, Math.min(100, Number(row.utilizationAfterPct) || 42));
    const dpd = Math.max(0, Number(row.daysPastDue) || 0);

    const riskTier: FinancialTransaction['riskTier'] =
      dpd >= 30 || util >= 88
        ? 'Critical'
        : dpd >= 15 || util >= 75
        ? 'Elevated'
        : util >= 55
        ? 'Moderate'
        : 'Low';

    if (wasCleaned) {
      recordsCleaned++;
    } else {
      recordsValidated++;
      notes.push('Passed all schema, foreign-key, and credit-limit checks');
    }

    existingIds.add(txnId);
    newTransactions.push({
      transactionId: txnId,
      accountId: row.accountId || 'ACC-902',
      customerId: 'CUST-1002',
      customerName: row.customerName || 'Nisha Verma Logistics',
      segment: 'SME Commercial',
      timestamp: ts,
      merchantCategory: merchant,
      amountInr: amount,
      transactionType: 'Drawdown',
      utilizationAfterPct: util,
      daysPastDue: dpd,
      riskTier,
      validationStatus: wasCleaned ? 'Cleaned (Imputed)' : 'Validated',
      validationNotes: notes,
    });
  });

  const batchSummary: ValidationAuditLog = {
    batchId: `BATCH-${Date.now().toString().slice(-6)}`,
    processedAt: new Date().toISOString(),
    sourceFormat: 'JSON Stream',
    recordsSubmitted: rawRows.length,
    recordsValidated,
    recordsCleaned,
    recordsRejected,
    duplicateIdsRemoved,
    nullFieldsImputed,
    invalidDatesFixed,
  };

  const updatedDataset: CreditVisionDataset = {
    ...dataset,
    transactions: [...newTransactions, ...dataset.transactions],
    validationAuditLogs: [batchSummary, ...dataset.validationAuditLogs],
  };

  return {
    updatedDataset,
    batchSummary,
    processedTransactions: newTransactions,
  };
}
