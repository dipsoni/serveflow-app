// backend/src/controllers/accountController.js
const DataService = require('../services/dataService');

/**
 * Accounts Parent Module Controller
 *
 * Provides endpoints for all 12 child modules:
 * 1. Dashboard (/accounts/dashboard)
 * 2. Sales (/accounts/sales)
 * 3. Purchase (/accounts/purchase)
 * 4. Expenses (/accounts/expenses)
 * 5. Receivables (/accounts/receivables)
 * 6. Payables (/accounts/payables)
 * 7. Cash & Bank (/accounts/cash-bank)
 * 8. Ledger (/accounts/ledger)
 * 9. Journal Entries (/accounts/journal)
 * 10. Reconciliation (/accounts/reconciliation)
 * 11. GST / Tax (/accounts/tax)
 * 12. Reports (/accounts/reports)
 *
 * Protected strictly at child-module level, action-level, and branch-level.
 */

// In-memory data stores for accounting sub-entities to complement orders/purchases/expenses
let journalEntries = [
  {
    id: 'JE-2026-001',
    date: '2026-09-27',
    reference: 'REF-DEP-001',
    description: 'Security Deposit received for Heritage Banquet Hall booking',
    branchId: 'branch-bopal',
    branchName: 'Bopal Flagship',
    debitAccount: 'HDFC Bank Main (A/C ...8821)',
    creditAccount: 'Customer Deposits (Liability)',
    amount: 25000,
    status: 'Posted',
    createdBy: 'Aditya Vikram'
  },
  {
    id: 'JE-2026-002',
    date: '2026-09-26',
    reference: 'REF-PRV-092',
    description: 'Monthly kitchen equipment depreciation provision',
    branchId: 'branch-satellite',
    branchName: 'Satellite Dine-In',
    debitAccount: 'Depreciation Expense',
    creditAccount: 'Accumulated Depreciation - Kitchen',
    amount: 14500,
    status: 'Posted',
    createdBy: 'Accounts Manager'
  },
  {
    id: 'JE-2026-003',
    date: '2026-09-25',
    reference: 'REF-ADJ-004',
    description: 'Prepaid commercial kitchen insurance amortization',
    branchId: 'branch-bopal',
    branchName: 'Bopal Flagship',
    debitAccount: 'Insurance Expense',
    creditAccount: 'Prepaid Expenses',
    amount: 8200,
    status: 'Posted',
    createdBy: 'Accounts Manager'
  }
];

let receivablesList = [
  {
    id: 'REC-101',
    customerName: 'Adani Corporate Catering',
    invoiceNumber: 'INV-2026-089',
    dueDate: '2026-10-05',
    amount: 48500,
    paidAmount: 20000,
    balanceDue: 28500,
    branchId: 'branch-bopal',
    branchName: 'Bopal Flagship',
    status: 'Partially Paid'
  },
  {
    id: 'REC-102',
    customerName: 'Cadila Healthcare Executive Luncheon',
    invoiceNumber: 'INV-2026-094',
    dueDate: '2026-10-10',
    amount: 62000,
    paidAmount: 0,
    balanceDue: 62000,
    branchId: 'branch-satellite',
    branchName: 'Satellite Dine-In',
    status: 'Pending'
  },
  {
    id: 'REC-103',
    customerName: 'Zydus Lifesciences Annual Dinner',
    invoiceNumber: 'INV-2026-077',
    dueDate: '2026-09-30',
    amount: 95400,
    paidAmount: 95400,
    balanceDue: 0,
    branchId: 'branch-sg-highway',
    branchName: 'SG Highway Express',
    status: 'Settled'
  }
];

let payablesList = [
  {
    id: 'PAY-201',
    vendorName: 'Amul Dairy Fresh Supply',
    billNumber: 'BILL-AMUL-9921',
    dueDate: '2026-10-02',
    amount: 34200,
    paidAmount: 0,
    balanceDue: 34200,
    branchId: 'branch-bopal',
    branchName: 'Bopal Flagship',
    category: 'Dairy Products',
    status: 'Pending'
  },
  {
    id: 'PAY-202',
    vendorName: 'APMC Fresh Vegetables Mandi',
    billNumber: 'BILL-APMC-4120',
    dueDate: '2026-09-29',
    amount: 18750,
    paidAmount: 10000,
    balanceDue: 8750,
    branchId: 'branch-satellite',
    branchName: 'Satellite Dine-In',
    category: 'Vegetables & Greens',
    status: 'Partially Paid'
  },
  {
    id: 'PAY-203',
    vendorName: 'Metro Cash & Carry Spice Hub',
    billNumber: 'BILL-METRO-7811',
    dueDate: '2026-10-15',
    amount: 52300,
    paidAmount: 0,
    balanceDue: 52300,
    branchId: 'branch-bopal',
    branchName: 'Bopal Flagship',
    category: 'Dry Spices & Grocery',
    status: 'Pending'
  }
];

let reconciliationRecords = [
  {
    id: 'REC-STMT-01',
    date: '2026-09-27',
    gateway: 'PineLabs EDC Terminal / UPI QR',
    posReportedAmount: 142680,
    bankSettledAmount: 142680,
    difference: 0,
    status: 'Reconciled',
    branchId: 'branch-bopal',
    branchName: 'Bopal Flagship',
    settlementUtr: 'HDFCR20260927889102'
  },
  {
    id: 'REC-STMT-02',
    date: '2026-09-26',
    gateway: 'Razorpay Online Orders',
    posReportedAmount: 68400,
    bankSettledAmount: 67200,
    difference: -1200, // Gateway MDR fee
    status: 'Fee Adjusted',
    branchId: 'branch-satellite',
    branchName: 'Satellite Dine-In',
    settlementUtr: 'RAZORPAY2026092671'
  },
  {
    id: 'REC-STMT-03',
    date: '2026-09-25',
    gateway: 'Cash Drawer Physical Audit',
    posReportedAmount: 54100,
    bankSettledAmount: 54100,
    difference: 0,
    status: 'Reconciled',
    branchId: 'branch-bopal',
    branchName: 'Bopal Flagship',
    settlementUtr: 'CASH-DEP-BOPAL-0925'
  }
];

const AccountController = {
  // 1. GET /api/accounts/dashboard
  async getDashboard(req, res) {
    try {
      const activeBranch = req.scope?.activeBranch;
      const allowedBranches = req.scope?.allowedBranches;

      // Aggregate data from orders, expenses, purchases
      const orders = await DataService.getOrders(req.restaurantId, activeBranch);
      const expenses = await DataService.getExpenses(req.restaurantId, activeBranch);
      const purchases = await DataService.getPurchases(req.restaurantId, activeBranch);

      const totalRevenue = orders.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);
      const totalExpenses = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
      const totalPurchases = purchases.reduce((acc, p) => acc + (Number(p.total_amount) || 0), 0);
      const grossMargin = totalRevenue - totalPurchases;
      const netOperatingIncome = totalRevenue - (totalPurchases + totalExpenses);

      // Branch-wise summary
      const branchSummaryMap = {};
      const addBranchData = (bId, type, amount) => {
        if (!bId) return;
        if (!branchSummaryMap[bId]) branchSummaryMap[bId] = { branchId: bId, branchName: bId, sales: 0, purchase: 0, expenses: 0 };
        branchSummaryMap[bId][type] += amount;
      };

      orders.forEach(o => addBranchData(o.branch_id || o.branchId, 'sales', Number(o.total_amount) || 0));
      expenses.forEach(e => addBranchData(e.branch_id || e.branchId, 'expenses', Number(e.amount) || 0));
      purchases.forEach(p => addBranchData(p.branch_id || p.branchId, 'purchase', Number(p.total_amount) || 0));

      const branchWiseSummary = Object.values(branchSummaryMap);

      const pendingReceivables = receivablesList
        .filter(r => !activeBranch || activeBranch === 'ALL' || r.branchId === activeBranch)
        .reduce((sum, r) => sum + r.balanceDue, 0);

      const pendingPayables = payablesList
        .filter(p => !activeBranch || activeBranch === 'ALL' || p.branchId === activeBranch)
        .reduce((sum, p) => sum + p.balanceDue, 0);

      return res.json({
        success: true,
        metrics: {
          totalRevenue,
          totalExpenses,
          totalPurchases,
          grossMargin,
          netOperatingIncome,
          pendingReceivables,
          pendingPayables,
          totalPaymentsReceived: totalRevenue, // simplified for now based on POS
          totalPaymentsMade: totalExpenses + totalPurchases,
          cashInHand: 48500,
          bankBalance: 492000
        },
        branchWiseSummary,
        branch: activeBranch || 'Consolidated (All Branches)',
        lastUpdated: new Date().toISOString()
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to load accounts dashboard', details: err.message });
    }
  },

  // 2. GET /api/accounts/sales
  async getSales(req, res) {
    try {
      const activeBranch = req.scope?.activeBranch;
      const orders = await DataService.getOrders(req.restaurantId, activeBranch);
      
      const salesLedger = orders.map(order => ({
        invoiceNumber: order.order_number || `INV-${order.id}`,
        orderId: order.id,
        date: order.created_at || new Date().toISOString(),
        customer: order.customer_name || 'Walk-in Guest',
        table: order.table_number ? `Table ${order.table_number}` : 'Takeaway / Delivery',
        paymentMethod: order.payment_method || 'UPI / Cash',
        subtotal: order.subtotal || Math.round((order.total_amount || 0) / 1.05),
        gstAmount: order.tax_amount || Math.round((order.total_amount || 0) * 0.05),
        totalAmount: order.total_amount || 0,
        status: order.payment_status || order.status || 'Paid',
        branchId: order.branch_id || 'branch-bopal'
      }));

      return res.json({
        success: true,
        count: salesLedger.length,
        sales: salesLedger
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch sales ledger', details: err.message });
    }
  },

  // GET /api/accounts/payments
  async getPayments(req, res) {
    try {
      const activeBranch = req.scope?.activeBranch;
      const orders = await DataService.getOrders(req.restaurantId, activeBranch);
      const expenses = await DataService.getExpenses(req.restaurantId, activeBranch);
      const purchases = await DataService.getPurchases(req.restaurantId, activeBranch);

      const paymentsList = [];

      // Incoming from sales
      orders.forEach(o => {
        paymentsList.push({
          id: `pay-in-${o.id}`,
          date: o.created_at || new Date().toISOString(),
          direction: 'Incoming',
          amount: Number(o.total_amount) || 0,
          paymentMethod: o.payment_method || 'UPI',
          reference: o.order_number || `INV-${o.id}`,
          branchName: o.branch_id || o.branchId || 'Unknown Branch',
          relatedTransaction: `Order #${o.order_number || o.id}`
        });
      });

      // Outgoing from expenses
      expenses.forEach(e => {
        paymentsList.push({
          id: `pay-out-exp-${e.id}`,
          date: e.date || e.created_at || new Date().toISOString(),
          direction: 'Outgoing',
          amount: Number(e.amount) || 0,
          paymentMethod: e.payment_method || 'Cash',
          reference: e.title || e.category,
          branchName: e.branch_id || e.branchId || 'Unknown Branch',
          relatedTransaction: 'Expense'
        });
      });

      // Outgoing from purchases
      purchases.forEach(p => {
        paymentsList.push({
          id: `pay-out-pur-${p.id}`,
          date: p.date || p.created_at || new Date().toISOString(),
          direction: 'Outgoing',
          amount: Number(p.total_amount) || 0,
          paymentMethod: p.payment_method || 'Bank Transfer',
          reference: p.invoice_number || `PUR-${p.id}`,
          branchName: p.branch_id || p.branchId || 'Unknown Branch',
          relatedTransaction: 'Purchase'
        });
      });

      // Sort by date descending
      paymentsList.sort((a, b) => new Date(b.date) - new Date(a.date));

      return res.json({ success: true, payments: paymentsList });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to load payments data', details: err.message });
    }
  },

  // 3. GET /api/accounts/purchase
  async getPurchases(req, res) {
    try {
      const activeBranch = req.scope?.activeBranch;
      const purchases = await DataService.getPurchases(req.restaurantId, activeBranch);
      return res.json({
        success: true,
        count: purchases.length,
        purchases
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch purchase bills', details: err.message });
    }
  },

  // 4. GET /api/accounts/expenses
  async getExpenses(req, res) {
    try {
      const activeBranch = req.scope?.activeBranch;
      const expenses = await DataService.getExpenses(req.restaurantId, activeBranch);
      return res.json({
        success: true,
        count: expenses.length,
        expenses
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch expenses', details: err.message });
    }
  },

  // 5. GET /api/accounts/receivables
  async getReceivables(req, res) {
    try {
      const activeBranch = req.scope?.activeBranch;
      const filtered = receivablesList.filter(r => !activeBranch || activeBranch === 'ALL' || r.branchId === activeBranch);
      return res.json({
        success: true,
        count: filtered.length,
        receivables: filtered
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch receivables', details: err.message });
    }
  },

  // 6. GET /api/accounts/payables
  async getPayables(req, res) {
    try {
      const activeBranch = req.scope?.activeBranch;
      const filtered = payablesList.filter(p => !activeBranch || activeBranch === 'ALL' || p.branchId === activeBranch);
      return res.json({
        success: true,
        count: filtered.length,
        payables: filtered
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch payables', details: err.message });
    }
  },

  // 7. GET /api/accounts/cash-bank
  async getCashBank(req, res) {
    try {
      const registers = [
        {
          id: 'CB-01',
          name: 'Front Counter Cash Drawer',
          type: 'Cash in Hand',
          accountNumber: 'CASH-REG-01',
          branch: 'Bopal Flagship',
          branchId: 'branch-bopal',
          currentBalance: 28400,
          currency: '₹',
          status: 'Active'
        },
        {
          id: 'CB-02',
          name: 'HDFC Bank Current Account',
          type: 'Bank Account',
          accountNumber: '50200034188219',
          branch: 'Consolidated HQ',
          branchId: 'ALL',
          currentBalance: 384500,
          currency: '₹',
          status: 'Active'
        },
        {
          id: 'CB-03',
          name: 'ICICI Bank UPI Merchant Settlement',
          type: 'UPI / Payment Gateway',
          accountNumber: '002405011928',
          branch: 'Satellite Dine-In',
          branchId: 'branch-satellite',
          currentBalance: 107500,
          currency: '₹',
          status: 'Active'
        }
      ];

      return res.json({ success: true, registers });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to load cash and bank accounts', details: err.message });
    }
  },

  // 8. GET /api/accounts/ledger
  async getLedger(req, res) {
    try {
      const activeBranch = req.scope?.activeBranch;
      const ledgerAccounts = [
        { code: '1001', name: 'Petty Cash - Bopal', group: 'Current Assets', debit: 28400, credit: 0, balance: 28400 },
        { code: '1002', name: 'HDFC Bank Current Account', group: 'Current Assets', debit: 384500, credit: 0, balance: 384500 },
        { code: '1050', name: 'Accounts Receivable (Trade Debtors)', group: 'Current Assets', debit: 90500, credit: 0, balance: 90500 },
        { code: '1200', name: 'Kitchen Stock & Inventory', group: 'Current Assets', debit: 165000, credit: 0, balance: 165000 },
        { code: '2001', name: 'Accounts Payable (Trade Creditors)', group: 'Current Liabilities', debit: 0, credit: 95250, balance: -95250 },
        { code: '2100', name: 'Output GST Payable (CGST+SGST)', group: 'Current Liabilities', debit: 0, credit: 41200, balance: -41200 },
        { code: '3001', name: 'Owner Capital & Reserves', group: 'Equity', debit: 0, credit: 350000, balance: -350000 },
        { code: '4001', name: 'Restaurant Food & Beverage Sales', group: 'Operating Revenue', debit: 0, credit: 420000, balance: -420000 },
        { code: '5001', name: 'Cost of Raw Materials Consumed', group: 'Cost of Goods Sold', debit: 145000, credit: 0, balance: 145000 },
        { code: '6001', name: 'Kitchen & Staff Salaries', group: 'Operating Expenses', debit: 52000, credit: 0, balance: 52000 },
        { code: '6002', name: 'Restaurant Electricity & LPG Gas', group: 'Operating Expenses', debit: 21000, credit: 0, balance: 21000 },
        { code: '6003', name: 'Commercial Outlet Rent', group: 'Operating Expenses', debit: 45000, credit: 0, balance: 45000 }
      ];

      return res.json({
        success: true,
        branch: activeBranch || 'Consolidated',
        accounts: ledgerAccounts
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch ledger accounts', details: err.message });
    }
  },

  // 9. GET /api/accounts/journal
  async getJournalEntries(req, res) {
    try {
      const activeBranch = req.scope?.activeBranch;
      const filtered = journalEntries.filter(j => !activeBranch || activeBranch === 'ALL' || j.branchId === activeBranch);
      return res.json({
        success: true,
        count: filtered.length,
        journalEntries: filtered
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch journal entries', details: err.message });
    }
  },

  // POST /api/accounts/journal (Action: create)
  async createJournalEntry(req, res) {
    try {
      const { description, debitAccount, creditAccount, amount, branchId, reference } = req.body;
      if (!description || !debitAccount || !creditAccount || !amount) {
        return res.status(400).json({ error: 'All fields (description, debitAccount, creditAccount, amount) are required' });
      }

      const newEntry = {
        id: `JE-2026-${String(journalEntries.length + 1).padStart(3, '0')}`,
        date: new Date().toISOString().split('T')[0],
        reference: reference || `REF-${Date.now().toString().slice(-4)}`,
        description,
        branchId: branchId || req.scope?.activeBranch || 'branch-bopal',
        branchName: branchId === 'branch-satellite' ? 'Satellite Dine-In' : 'Bopal Flagship',
        debitAccount,
        creditAccount,
        amount: Number(amount),
        status: 'Posted',
        createdBy: req.user?.name || 'Administrator'
      };

      journalEntries.unshift(newEntry);
      return res.status(201).json({ success: true, message: 'Journal entry created', journalEntry: newEntry });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to create journal entry', details: err.message });
    }
  },

  // 10. GET /api/accounts/reconciliation
  async getReconciliation(req, res) {
    try {
      const activeBranch = req.scope?.activeBranch;
      const filtered = reconciliationRecords.filter(r => !activeBranch || activeBranch === 'ALL' || r.branchId === activeBranch);
      return res.json({
        success: true,
        count: filtered.length,
        reconciliations: filtered
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to load reconciliation records', details: err.message });
    }
  },

  // 11. GET /api/accounts/tax
  async getTax(req, res) {
    try {
      const orders = await DataService.getOrders(req.restaurantId, req.scope?.activeBranch);
      const totalTaxable = orders.reduce((sum, o) => sum + (o.subtotal || Math.round((o.total_amount || 0) / 1.05)), 0);
      const totalGst = orders.reduce((sum, o) => sum + (o.tax_amount || Math.round((o.total_amount || 0) * 0.05)), 0);
      const cgst = Math.round(totalGst / 2);
      const sgst = totalGst - cgst;

      return res.json({
        success: true,
        period: 'September 2026',
        gstSummary: {
          totalTaxableTurnover: totalTaxable,
          totalOutputGST: totalGst,
          cgstRate: '2.5%',
          cgstAmount: cgst,
          sgstRate: '2.5%',
          sgstAmount: sgst,
          itcClaimable: 16200,
          netGstPayable: Math.max(0, totalGst - 16200),
          filingStatusGSTR1: 'Ready for Upload',
          filingStatusGSTR3B: 'Pending Verification'
        }
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to compute GST tax report', details: err.message });
    }
  },

  // 12. GET /api/accounts/reports
  async getFinancialReports(req, res) {
    try {
      return res.json({
        success: true,
        availableReports: [
          { id: 'pnl', title: 'Profit & Loss Statement (P&L)', period: 'FY 2026-27 Q2', generated: 'Auto-compiled' },
          { id: 'balance_sheet', title: 'Balance Sheet', asOf: '2026-09-28', auditStatus: 'Draft' },
          { id: 'cash_flow', title: 'Statement of Cash Flows', period: 'Monthly Q3', format: 'Direct' },
          { id: 'aged_debtors', title: 'Aged Receivables Breakdown (30-60-90 Days)', risk: 'Low' },
          { id: 'aged_creditors', title: 'Aged Payables Schedule', risk: 'Normal' }
        ]
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to load financial reports', details: err.message });
    }
  }
};

module.exports = AccountController;
