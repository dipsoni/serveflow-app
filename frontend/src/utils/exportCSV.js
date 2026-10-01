/**
 * ServeFlow — Universal CSV Export Utility
 * Generates and triggers a browser download of a CSV file from structured data.
 */

/**
 * Download an array of row objects as a CSV file.
 * @param {string} filename - Name of the file (without .csv extension)
 * @param {Array<string>} headers - Column header labels
 * @param {Array<Array<string|number>>} rows - 2D array of row values (parallel to headers)
 */
export function downloadCSV(filename, headers, rows) {
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    // Quote the field if it contains commas, quotes, or newlines
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvLines = [
    headers.map(escape).join(','),
    ...rows.map((row) => row.map(escape).join(','))
  ];

  const csvString = csvLines.join('\r\n');
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Orders data as CSV
 */
export function exportOrders(orders) {
  const headers = ['Order ID', 'Table', 'Customer', 'Items', 'Total (INR)', 'Status', 'Payment Status', 'Date'];
  const rows = (orders || []).map((o) => [
    o.order_number || o.id,
    o.table_name || o.tableName || '',
    o.customer_name || o.customerName || 'Walk-in',
    (o.items || []).filter(i => i.status !== 'cancelled').map(i => `${i.name}x${i.quantity}`).join('; '),
    Number(o.total || o.totalAmount || 0).toFixed(2),
    o.status || '',
    o.payment_status || '',
    o.created_at ? new Date(o.created_at).toLocaleString() : ''
  ]);
  downloadCSV('ServeFlow_Orders', headers, rows);
}

/**
 * Export Inventory data as CSV
 */
export function exportInventory(items) {
  const headers = ['Item Name', 'Category', 'Current Stock', 'Unit', 'Min Stock', 'Cost per Unit (INR)', 'Total Value (INR)', 'Status'];
  const rows = (items || []).map((item) => [
    item.name,
    item.category || '',
    item.current_stock ?? item.quantity ?? '',
    item.unit || '',
    item.min_stock ?? item.minStock ?? '',
    Number(item.cost_per_unit || item.costPerUnit || 0).toFixed(2),
    Number((item.current_stock ?? item.quantity ?? 0) * (item.cost_per_unit || item.costPerUnit || 0)).toFixed(2),
    item.status || (item.current_stock < item.min_stock ? 'Low Stock' : 'OK')
  ]);
  downloadCSV('ServeFlow_Inventory', headers, rows);
}

/**
 * Export Purchases data as CSV
 */
export function exportPurchases(purchases) {
  const headers = ['PO Number', 'Supplier', 'Invoice #', 'Date', 'Items', 'Total (INR)', 'Payment Status', 'Delivery Status'];
  const rows = (purchases || []).map((p) => [
    p.po_number || p.id,
    p.supplier_name || p.supplierName || '',
    p.invoice_number || p.invoiceNumber || '',
    p.created_at ? new Date(p.created_at).toLocaleDateString() : p.purchase_date || '',
    (p.items || []).map(i => `${i.item_name || i.itemName}x${i.quantity}${i.unit}`).join('; '),
    Number(p.total_amount || p.totalAmount || 0).toFixed(2),
    p.payment_status || p.paymentStatus || '',
    p.status || ''
  ]);
  downloadCSV('ServeFlow_Purchases', headers, rows);
}

/**
 * Export Customers data as CSV
 */
export function exportCustomers(customers) {
  const headers = ['Customer ID', 'Name', 'Email', 'Phone', 'Total Orders', 'Total Spent (INR)', 'Last Visit'];
  const rows = (customers || []).map((c) => [
    c.id,
    c.name || '',
    c.email || '',
    c.phone || c.mobile || '',
    c.total_orders ?? c.totalOrders ?? 0,
    Number(c.total_spent || c.totalSpent || 0).toFixed(2),
    c.last_visit || c.lastVisit || ''
  ]);
  downloadCSV('ServeFlow_Customers', headers, rows);
}

/**
 * Export Employees data as CSV
 */
export function exportEmployees(employees) {
  const headers = ['Employee ID', 'Name', 'Email', 'Role', 'Branch', 'Phone', 'Status'];
  const rows = (employees || []).map((e) => [
    e.id,
    e.name || '',
    e.email || '',
    e.role || e.roleName || '',
    e.branch_name || e.branchName || '',
    e.phone || e.mobile || '',
    e.status || 'Active'
  ]);
  downloadCSV('ServeFlow_Employees', headers, rows);
}

/**
 * Export Expenses data as CSV
 */
export function exportExpenses(expenses) {
  const headers = ['Date', 'Category', 'Description', 'Payment Method', 'Amount (INR)', 'Branch'];
  const rows = (expenses || []).map((e) => [
    e.date || e.created_at ? new Date(e.date || e.created_at).toLocaleDateString() : '',
    e.category || '',
    e.description || e.title || '',
    e.payment_method || e.paymentMethod || 'Cash',
    Number(e.amount || 0).toFixed(2),
    e.branch_name || e.branchName || ''
  ]);
  downloadCSV('ServeFlow_Expenses', headers, rows);
}

/**
 * Export Suppliers data as CSV
 */
export function exportSuppliers(suppliers) {
  const headers = ['Supplier ID', 'Name', 'Contact Person', 'Email', 'Phone', 'City', 'Category', 'Status'];
  const rows = (suppliers || []).map((s) => [
    s.id,
    s.name || '',
    s.contact_person || s.contactPerson || '',
    s.email || '',
    s.phone || s.mobile || '',
    s.city || '',
    s.category || '',
    s.status || 'Active'
  ]);
  downloadCSV('ServeFlow_Suppliers', headers, rows);
}

/**
 * Export Accounts data (generic tabular export for AccountsPage tabs)
 */
export function exportAccountsTab(tabId, data) {
  switch (tabId) {
    case 'sales': {
      const headers = ['Invoice #', 'Date', 'Customer', 'Table', 'Payment Method', 'Subtotal (INR)', 'GST (INR)', 'Total (INR)', 'Status'];
      const rows = (data || []).map((s) => [
        s.invoiceNumber || '',
        s.date ? new Date(s.date).toLocaleDateString() : '',
        s.customer || '',
        s.table || '',
        s.paymentMethod || '',
        Number(s.subtotal || 0).toFixed(2),
        Number(s.gstAmount || 0).toFixed(2),
        Number(s.totalAmount || 0).toFixed(2),
        s.status || ''
      ]);
      downloadCSV('ServeFlow_Sales_Register', headers, rows);
      break;
    }
    case 'purchase': {
      const headers = ['PO Number', 'Supplier', 'Date', 'Total (INR)', 'Payment Status', 'Delivery Status'];
      const rows = (data || []).map((p) => [
        p.po_number || p.id,
        p.supplier_name || '',
        p.created_at ? new Date(p.created_at).toLocaleDateString() : '',
        Number(p.total_amount || 0).toFixed(2),
        p.payment_status || '',
        p.status || ''
      ]);
      downloadCSV('ServeFlow_Purchases_Register', headers, rows);
      break;
    }
    case 'expenses': {
      const headers = ['Date', 'Category', 'Description', 'Payment Method', 'Amount (INR)'];
      const rows = (data || []).map((e) => [
        e.date || '',
        e.category || '',
        e.description || e.title || '',
        e.payment_method || 'Cash',
        Number(e.amount || 0).toFixed(2)
      ]);
      downloadCSV('ServeFlow_Expenses_Register', headers, rows);
      break;
    }
    case 'receivables': {
      const headers = ['ID', 'Customer', 'Invoice #', 'Due Date', 'Branch', 'Invoice Amount (INR)', 'Balance Due (INR)', 'Status'];
      const rows = (data || []).map((r) => [
        r.id, r.customerName, r.invoiceNumber, r.dueDate, r.branchName,
        Number(r.amount || 0).toFixed(2),
        Number(r.balanceDue || 0).toFixed(2),
        r.status
      ]);
      downloadCSV('ServeFlow_Receivables', headers, rows);
      break;
    }
    case 'payables': {
      const headers = ['ID', 'Vendor', 'Bill #', 'Category', 'Due Date', 'Bill Amount (INR)', 'Balance Due (INR)', 'Status'];
      const rows = (data || []).map((p) => [
        p.id, p.vendorName, p.billNumber, p.category, p.dueDate,
        Number(p.amount || 0).toFixed(2),
        Number(p.balanceDue || 0).toFixed(2),
        p.status
      ]);
      downloadCSV('ServeFlow_Payables', headers, rows);
      break;
    }
    case 'ledger': {
      const headers = ['Code', 'Account Head', 'Account Group', 'Debit (INR)', 'Credit (INR)', 'Net Balance (INR)'];
      const rows = (data || []).map((a) => [
        a.code, a.name, a.group,
        Number(a.debit || 0).toFixed(2),
        Number(a.credit || 0).toFixed(2),
        Number(Math.abs(a.balance || 0)).toFixed(2) + ' ' + ((a.balance || 0) >= 0 ? 'Dr' : 'Cr')
      ]);
      downloadCSV('ServeFlow_General_Ledger', headers, rows);
      break;
    }
    case 'journal_entries': {
      const headers = ['Voucher #', 'Date', 'Description', 'Debit Account', 'Credit Account', 'Amount (INR)', 'Posted By'];
      const rows = (data || []).map((je) => [
        je.id, je.date, je.description, je.debitAccount, je.creditAccount,
        Number(je.amount || 0).toFixed(2),
        je.createdBy
      ]);
      downloadCSV('ServeFlow_Journal_Entries', headers, rows);
      break;
    }
    case 'reconciliation': {
      const headers = ['Date', 'Gateway / Tender', 'Settlement UTR', 'POS Reported (INR)', 'Bank Settled (INR)', 'Difference (INR)', 'Status'];
      const rows = (data || []).map((r) => [
        r.date, r.gateway, r.settlementUtr,
        Number(r.posReportedAmount || 0).toFixed(2),
        Number(r.bankSettledAmount || 0).toFixed(2),
        Number(r.difference || 0).toFixed(2),
        r.status
      ]);
      downloadCSV('ServeFlow_Reconciliation', headers, rows);
      break;
    }
    case 'cash_bank': {
      const headers = ['Account Name', 'Type', 'Account Number', 'Branch', 'Status', 'Current Balance (INR)'];
      const rows = (data || []).map((cb) => [
        cb.name, cb.type, cb.accountNumber || '', cb.branch || '', cb.status,
        Number(cb.currentBalance || 0).toFixed(2)
      ]);
      downloadCSV('ServeFlow_Cash_Bank', headers, rows);
      break;
    }
    default: {
      // Generic fallback for any tabular data
      if (Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0]);
        const rows = data.map(row => headers.map(h => row[h]));
        downloadCSV(`ServeFlow_${tabId}`, headers, rows);
      }
    }
  }
}

/**
 * Export Menu Items as CSV
 */
export function exportMenuItems(items) {
  const headers = ['Item ID', 'Name', 'Category', 'Sub-Category', 'Price (INR)', 'GST (%)', 'Status', 'Vegetarian'];
  const rows = (items || []).map((item) => [
    item.id,
    item.name || '',
    item.category || '',
    item.sub_category || item.subCategory || '',
    Number(item.price || 0).toFixed(2),
    item.gst_rate ?? item.gstRate ?? 5,
    item.status || item.availability || 'Available',
    item.is_veg || item.isVeg ? 'Yes' : 'No'
  ]);
  downloadCSV('ServeFlow_Menu_Items', headers, rows);
}

/**
 * Export ERP Users as CSV
 */
export function exportERPUsers(users) {
  const headers = ['User ID', 'Name', 'Email', 'Role', 'Status', 'Branch Access', 'Modules'];
  const rows = (users || []).map((u) => [
    u.id,
    u.name || '',
    u.email || '',
    u.roleName || u.role || '',
    u.status || 'Active',
    u.has_all_branch_access ? 'All Branches' : (u.assignedBranchIds || []).join('; '),
    (u.allowed_modules || []).join('; ')
  ]);
  downloadCSV('ServeFlow_ERP_Users', headers, rows);
}
