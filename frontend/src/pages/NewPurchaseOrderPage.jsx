import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Menu as MenuIcon,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Scan,
  Download,
  Upload,
  Save,
  ArrowLeft,
  Settings,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Boxes,
  Calendar,
  Layers,
  FileText
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function NewPurchaseOrderPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { restaurant, activeBranch } = useAuth();

  // Reference Data
  const [suppliers, setSuppliers] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState('Details');

  // Collapsible sections
  const [accountingOpen, setAccountingOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);

  // Form Fields (Screenshot 2 Matching)
  const [series, setSeries] = useState('PUR-ORD-.YYYY.-');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplierId, setSupplierId] = useState('');
  const [requiredBy, setRequiredBy] = useState(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
  
  // Right Checkboxes
  const [applyTaxWithholding, setApplyTaxWithholding] = useState(false);
  const [isReverseCharge, setIsReverseCharge] = useState(false);
  const [isSubcontracted, setIsSubcontracted] = useState(false);

  // Barcode & Target Warehouse
  const [barcodeInput, setBarcodeInput] = useState('');
  const [targetWarehouse, setTargetWarehouse] = useState('Main Kitchen Stores - USR');

  // Additional Tabs Data
  const [shippingAddress, setShippingAddress] = useState('Main Kitchen Commissary, Ground Floor, Central Kitchen, Bangalore');
  const [paymentTerms, setPaymentTerms] = useState('Net 15 Days after consignment inspection & GRN approval');
  const [notes, setNotes] = useState('Cold chain logistics required for dairy and fresh produce items.');

  // Items Table
  const [items, setItems] = useState([
    {
      id: 'row-1',
      selected: false,
      itemId: '',
      itemCode: '',
      itemName: '',
      requiredBy: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      quantity: 10,
      uom: 'kg',
      rate: 320,
      amount: 3200
    }
  ]);

  // Load suppliers and inventory items
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [supRes, invRes] = await Promise.all([
          api.get('/suppliers'),
          api.get('/inventory')
        ]);
        const supData = supRes.data || [];
        const invData = invRes.data || [];
        setSuppliers(supData);
        setInventoryItems(invData);

        if (supData.length > 0) {
          setSupplierId(supData[0].id);
        }

        // Initialize first row with first inventory item if available
        if (invData.length > 0) {
          const first = invData[0];
          setItems([
            {
              id: 'row-1',
              selected: false,
              itemId: first.id,
              itemCode: first.id,
              itemName: first.name,
              requiredBy: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
              quantity: 10,
              uom: first.unit || 'kg',
              rate: first.cost_per_unit || 320,
              amount: 10 * (first.cost_per_unit || 320)
            }
          ]);
        }
      } catch (err) {
        console.error('Error loading data for Purchase Order', err);
        showToast('Error loading suppliers or inventory', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, supplierId, date, targetWarehouse]);

  // Item Table Handlers
  const handleItemSelect = (rowIdx, itemId) => {
    const selected = inventoryItems.find(i => i.id === itemId);
    if (!selected) return;

    setItems(prev => {
      const updated = [...prev];
      const qty = updated[rowIdx].quantity || 1;
      const rate = selected.cost_per_unit || 100;
      updated[rowIdx] = {
        ...updated[rowIdx],
        itemId: selected.id,
        itemCode: selected.id,
        itemName: selected.name,
        uom: selected.unit || 'kg',
        rate,
        amount: qty * rate
      };
      return updated;
    });
  };

  const handleRowChange = (rowIdx, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      updated[rowIdx] = { ...updated[rowIdx], [field]: value };

      if (field === 'quantity' || field === 'rate') {
        const qty = Number(field === 'quantity' ? value : updated[rowIdx].quantity) || 0;
        const rate = Number(field === 'rate' ? value : updated[rowIdx].rate) || 0;
        updated[rowIdx].amount = parseFloat((qty * rate).toFixed(2));
      }

      return updated;
    });
  };

  const handleAddRow = () => {
    const newId = `row-${Date.now()}`;
    const defaultItem = inventoryItems[0];
    setItems(prev => [
      ...prev,
      {
        id: newId,
        selected: false,
        itemId: defaultItem?.id || '',
        itemCode: defaultItem?.id || '',
        itemName: defaultItem?.name || '',
        requiredBy,
        quantity: 5,
        uom: defaultItem?.unit || 'kg',
        rate: defaultItem?.cost_per_unit || 150,
        amount: 5 * (defaultItem?.cost_per_unit || 150)
      }
    ]);
  };

  const handleRemoveRow = (rowIdx) => {
    if (items.length === 1) {
      showToast('Purchase Order must have at least one item row', 'warning');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== rowIdx));
  };

  const handleBarcodeScan = (e) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      e.preventDefault();
      // Match barcode with inventory item
      const found = inventoryItems.find(
        i => i.name.toLowerCase().includes(barcodeInput.toLowerCase()) || i.id.toLowerCase() === barcodeInput.toLowerCase()
      );
      if (found) {
        setItems(prev => [
          ...prev,
          {
            id: `row-${Date.now()}`,
            selected: false,
            itemId: found.id,
            itemCode: found.id,
            itemName: found.name,
            requiredBy,
            quantity: 1,
            uom: found.unit || 'kg',
            rate: found.cost_per_unit || 100,
            amount: found.cost_per_unit || 100
          }
        ]);
        showToast(`Added scanned item: ${found.name}`, 'success');
      } else {
        showToast(`Item not found for barcode: ${barcodeInput}`, 'warning');
      }
      setBarcodeInput('');
    }
  };

  // Calculations
  const totalQuantity = items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
  const totalAmount = items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  const taxAmount = parseFloat((totalAmount * 0.05).toFixed(2));
  const grandTotal = parseFloat((totalAmount + taxAmount).toFixed(2));

  // Save Purchase Order to Backend
  const handleSave = async (receiptStatus = 'draft') => {
    if (!supplierId) {
      showToast('Please select a Supplier', 'warning');
      return;
    }
    if (items.length === 0 || !items[0].itemName) {
      showToast('Please add at least one valid item to the Purchase Order', 'warning');
      return;
    }

    setSaving(true);
    const selectedSupplier = suppliers.find(s => s.id === supplierId);
    const generatedPoNum = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      await api.post('/purchases', {
        supplier_id: supplierId,
        supplier_name: selectedSupplier?.name || 'Wholesale Supplier',
        invoice_number: generatedPoNum,
        date,
        items: items.map(it => ({
          itemId: it.itemId,
          itemName: it.itemName,
          quantity: it.quantity,
          unit: it.uom,
          unitPrice: it.rate,
          tax: parseFloat(((it.amount * 0.05)).toFixed(2)),
          total: parseFloat((it.amount * 1.05).toFixed(2))
        })),
        subtotal: totalAmount,
        tax_total: taxAmount,
        grand_total: grandTotal,
        status: receiptStatus // 'draft' or 'received'
      });

      setIsSaved(true);
      showToast(`Purchase Order ${generatedPoNum} saved successfully!`, 'success');
      setTimeout(() => {
        navigate('/purchases');
      }, 800);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Error saving Purchase Order', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f6] text-slate-800 text-xs font-sans pb-16">
      
      {/* 1. TOP BREADCRUMB BAR (Matching Screenshot 2) */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link to="/dashboard" className="hover:text-slate-800 transition-colors font-medium">Buying</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link to="/purchases" className="hover:text-slate-800 transition-colors font-medium">Purchase Order</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-800 font-semibold">New Purchase Order</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/purchases')}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to POs</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 space-y-4">
        
        {/* 2. TITLE & ACTION BAR (Screenshot 2: [≡] New Purchase Order [Not Saved] ... [Save]) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/purchases')}
              className="p-1 hover:bg-slate-200/70 rounded text-slate-600 transition-colors"
              title="Purchase Orders List"
            >
              <MenuIcon className="w-4 h-4" />
            </button>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">New Purchase Order</h1>
            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
              isSaved 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {isSaved ? 'Saved' : 'Not Saved'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => showToast('Select PO Template / Requisition', 'info')}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded text-slate-700 font-medium text-xs inline-flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
            >
              <span>Get Items From</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => showToast('Tools: Recalculate Taxes / Check Supplier Balance', 'info')}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded text-slate-700 font-medium text-xs inline-flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
            >
              <span>Tools</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => showToast('Options: Duplicate, Print Preview, Email Vendor', 'info')}
              className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded text-slate-600 shadow-2xs transition-colors cursor-pointer"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleSave('draft')}
              disabled={saving}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all duration-150 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </div>

        {/* 3. TABS BAR (Screenshot 2: Details, Address & Contact, Terms, More Info) */}
        <div className="border-b border-slate-200 flex items-center gap-6 text-xs font-medium text-slate-600 px-1">
          {['Details', 'Address & Contact', 'Terms', 'More Info'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2.5 transition-colors cursor-pointer ${
                activeTab === tab
                  ? 'text-slate-950 font-semibold border-b-2 border-slate-950 -mb-px'
                  : 'hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 4. MAIN FORM CANVAS (Screenshot 2) */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 space-y-6 shadow-2xs">
          
          {activeTab === 'Details' && (
            <>
              {/* Row 1: Series, Date, Checkboxes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Col 1: Series & Supplier */}
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Series <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={series}
                      onChange={(e) => setSeries(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-slate-400 focus:outline-none"
                    >
                      <option value="PUR-ORD-.YYYY.-">PUR-ORD-.YYYY.-</option>
                      <option value="PO-DIRECT-.YYYY.-">PO-DIRECT-.YYYY.-</option>
                      <option value="COMMISSARY-PO-">COMMISSARY-PO-</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Supplier <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={supplierId}
                      onChange={(e) => setSupplierId(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-slate-400 focus:outline-none font-medium"
                      required
                    >
                      <option value="">Select Supplier...</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.contact_person || 'Vendor'})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Col 2: Date & Required By */}
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-slate-400 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Required By
                    </label>
                    <input
                      type="date"
                      value={requiredBy}
                      onChange={(e) => setRequiredBy(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Col 3: Right Checkboxes (Screenshot 2) */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={applyTaxWithholding}
                      onChange={(e) => setApplyTaxWithholding(e.target.checked)}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span className="text-xs text-slate-700">Apply Tax Withholding Amount</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isReverseCharge}
                      onChange={(e) => setIsReverseCharge(e.target.checked)}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span className="text-xs text-slate-700">Is Reverse Charge</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isSubcontracted}
                      onChange={(e) => setIsSubcontracted(e.target.checked)}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span className="text-xs text-slate-700">Is Subcontracted</span>
                  </label>
                </div>

              </div>

              {/* Collapsible Sections (Screenshot 2) */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                {/* Accounting Dimensions */}
                <div>
                  <button
                    type="button"
                    onClick={() => setAccountingOpen(!accountingOpen)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-slate-950 transition-colors"
                  >
                    <span>Accounting Dimensions</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${accountingOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {accountingOpen && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 p-3 bg-slate-50/70 rounded-md border border-slate-200/70">
                      <div>
                        <span className="text-[11px] text-slate-600 block mb-1">Cost Center</span>
                        <input
                          type="text"
                          defaultValue="Main Kitchen - USR"
                          className="w-full p-1.5 text-xs border border-slate-200 rounded bg-white"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-600 block mb-1">Project</span>
                        <input
                          type="text"
                          defaultValue="Daily Kitchen Operations"
                          className="w-full p-1.5 text-xs border border-slate-200 rounded bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Currency and Price List */}
                <div>
                  <button
                    type="button"
                    onClick={() => setCurrencyOpen(!currencyOpen)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-slate-950 transition-colors"
                  >
                    <span>Currency and Price List</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${currencyOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {currencyOpen && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 p-3 bg-slate-50/70 rounded-md border border-slate-200/70">
                      <div>
                        <span className="text-[11px] text-slate-600 block mb-1">Currency</span>
                        <input
                          type="text"
                          readOnly
                          value="INR (₹)"
                          className="w-full p-1.5 text-xs border border-slate-200 rounded bg-slate-100 font-medium"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-600 block mb-1">Price List</span>
                        <input
                          type="text"
                          defaultValue="Standard Buying Wholesale"
                          className="w-full p-1.5 text-xs border border-slate-200 rounded bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Scan Barcode & Set Target Warehouse (Screenshot 2) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Scan Barcode
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyDown={handleBarcodeScan}
                      placeholder="Scan or enter barcode / SKU then press Enter..."
                      className="w-full text-xs p-2 pl-2.5 pr-8 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-slate-400 focus:outline-none"
                    />
                    <Scan className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Set Target Warehouse
                  </label>
                  <select
                    value={targetWarehouse}
                    onChange={(e) => setTargetWarehouse(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-slate-400 focus:outline-none font-medium"
                  >
                    <option value="Main Kitchen Stores - USR">Main Kitchen Stores - USR</option>
                    <option value="Cold Storage & Dairy Unit">Cold Storage & Dairy Unit</option>
                    <option value="Dry Ingredients Warehouse">Dry Ingredients Warehouse</option>
                    <option value="Beverage & Bar Stocks">Beverage & Bar Stocks</option>
                  </select>
                </div>
              </div>

              {/* Items Section Title (Screenshot 2) */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-900 tracking-tight">Items</h3>
                  <span className="text-[11px] text-slate-500">{items.length} items added</span>
                </div>

                {/* Items Table (Screenshot 2 exact column layout) */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                        <tr>
                          <th className="p-2.5 w-8 text-center">
                            <input type="checkbox" className="rounded border-slate-300" />
                          </th>
                          <th className="p-2.5 w-10 text-center">No.</th>
                          <th className="p-2.5 min-w-[200px]">Item Code *</th>
                          <th className="p-2.5 min-w-[130px]">Required By *</th>
                          <th className="p-2.5 w-24 text-right">Quantity *</th>
                          <th className="p-2.5 w-20">UOM *</th>
                          <th className="p-2.5 w-28 text-right">Rate (INR)</th>
                          <th className="p-2.5 w-28 text-right">Amount (INR)</th>
                          <th className="p-2.5 w-10 text-center">
                            <Settings className="w-3.5 h-3.5 text-slate-400 mx-auto" />
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                      {items.map((row, idx) => (
                        <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={row.selected}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setItems(prev => prev.map((r, i) => i === idx ? { ...r, selected: checked } : r));
                              }}
                              className="rounded border-slate-300 text-slate-900"
                            />
                          </td>

                          <td className="p-2.5 text-center text-slate-500 font-mono">
                            {idx + 1}
                          </td>

                          <td className="p-2.5">
                            <select
                              value={row.itemId}
                              onChange={(e) => handleItemSelect(idx, e.target.value)}
                              className="w-full p-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-slate-400 focus:outline-none font-medium"
                            >
                              <option value="">Select Item...</option>
                              {inventoryItems.map(inv => (
                                <option key={inv.id} value={inv.id}>
                                  {inv.name} ({inv.category} • Current: {inv.current_stock} {inv.unit})
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="p-2.5">
                            <input
                              type="date"
                              value={row.requiredBy}
                              onChange={(e) => handleRowChange(idx, 'requiredBy', e.target.value)}
                              className="w-full p-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-slate-400 focus:outline-none"
                            />
                          </td>

                          <td className="p-2.5 text-right">
                            <input
                              type="number"
                              min="0.1"
                              step="any"
                              value={row.quantity}
                              onChange={(e) => handleRowChange(idx, 'quantity', e.target.value)}
                              className="w-20 p-1.5 text-xs text-right bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-slate-400 focus:outline-none font-mono"
                            />
                          </td>

                          <td className="p-2.5">
                            <select
                              value={row.uom}
                              onChange={(e) => handleRowChange(idx, 'uom', e.target.value)}
                              className="w-full p-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-slate-400 focus:outline-none"
                            >
                              <option value="kg">kg</option>
                              <option value="gm">gm</option>
                              <option value="liter">liter</option>
                              <option value="ml">ml</option>
                              <option value="nos">nos</option>
                              <option value="packets">packets</option>
                              <option value="boxes">boxes</option>
                            </select>
                          </td>

                          <td className="p-2.5 text-right font-mono">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={row.rate}
                              onChange={(e) => handleRowChange(idx, 'rate', e.target.value)}
                              className="w-24 p-1.5 text-xs text-right bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-slate-400 focus:outline-none font-mono"
                            />
                          </td>

                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                            ₹{row.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(idx)}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                              title="Delete row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>

                {/* Table Bottom Action Buttons (Screenshot 2: Add Row, Add Multiple, Download, Upload) */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-slate-800 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Add Row
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        inventoryItems.slice(0, 3).forEach(inv => {
                          setItems(prev => [
                            ...prev,
                            {
                              id: `row-${Date.now()}-${inv.id}`,
                              selected: false,
                              itemId: inv.id,
                              itemCode: inv.id,
                              itemName: inv.name,
                              requiredBy,
                              quantity: 5,
                              uom: inv.unit || 'kg',
                              rate: inv.cost_per_unit || 150,
                              amount: 5 * (inv.cost_per_unit || 150)
                            }
                          ]);
                        });
                        showToast('Added multiple inventory items', 'info');
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded text-slate-700 font-medium text-xs transition-colors cursor-pointer"
                    >
                      Add Multiple
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => showToast('Purchase Order template downloaded', 'info')}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded text-slate-700 font-medium text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast('CSV Upload Consignment feature ready', 'info')}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded text-slate-700 font-medium text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Totals Section (Screenshot 2: Total Quantity & Total INR) */}
              <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-600 block">Total Quantity</span>
                  <div className="text-base font-bold text-slate-900 font-mono">{totalQuantity}</div>
                </div>

                <div className="w-full md:w-72 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-2.5 shadow-2xs">
                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <span>Net Total (INR):</span>
                    <span className="font-mono font-semibold text-slate-900">
                      ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <span>GST (5% Input Tax Credit):</span>
                    <span className="font-mono font-semibold text-slate-900">
                      ₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-slate-900">
                    <span>Total (INR):</span>
                    <span className="text-emerald-700 font-mono text-base">
                      ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Submit & Receive Consignment Actions */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>GST compliant invoice • Target warehouse will update upon Goods Receipt (GRN)</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSave('received')}
                    disabled={saving}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    Save & Mark Received (GRN)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSave('draft')}
                    disabled={saving}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    Save Draft PO
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'Address & Contact' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Shipping / Delivery Address</label>
                <textarea
                  rows="3"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Billing Branch</label>
                <input
                  type="text"
                  readOnly
                  value={`${restaurant?.name || 'Urban Spice Restaurant'} - ${activeBranch?.name || 'Main Branch'}`}
                  className="w-full p-2 text-xs bg-slate-100 border border-slate-200 rounded-md text-slate-700 font-medium"
                />
              </div>
            </div>
          )}

          {activeTab === 'Terms' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Payment & Credit Terms</label>
                <textarea
                  rows="4"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'More Info' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Internal Kitchen Notes</label>
                <textarea
                  rows="4"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
