import React, { useState } from 'react';
import { X, Printer, Check, Receipt, UtensilsCrossed, QrCode } from 'lucide-react';

export default function ThermalReceiptModal({ order, restaurant, onClose, initialType = 'bill' }) {
  const [printType, setPrintType] = useState(initialType);
  const [activeStation, setActiveStation] = useState('ALL'); // 'ALL' | 'STATION_KITCHEN' | 'STATION_BAR' | 'STATION_PANTRY'

  if (!order) return null;

  const restName = restaurant?.name || 'ServeFlow Grand Gourmet';
  const restAddress = restaurant?.address || 'Shop 104, Bopal Cross Road, Ahmedabad';
  const restPhone = restaurant?.phone || '+91 98250 12345';
  const gstNo = restaurant?.gst_number || '24AAACU1234M1Z5';
  const fssaiNo = '10020021000123';

  const rawItems = (order.items || []).filter((i) => i.status !== 'cancelled');
  const filteredItems = printType === 'kot' && activeStation !== 'ALL'
    ? rawItems.filter((i) => (i.station || 'STATION_KITCHEN') === activeStation)
    : rawItems;

  const subtotal = Number(order.subtotal || 0);
  const discount = Number(order.discount || 0);
  const tax = Number(order.tax || 0);
  const total = Number(order.total || 0);
  const orderId = order.id || order.kot_number || 'ORD-1001';
  const tableName = order.table_name || order.table_number || 'Dine-In';
  const createdAt = order.created_at ? new Date(order.created_at).toLocaleString() : new Date().toLocaleString();

  const handlePrint = () => {
    window.print();
  };

  const getStationLabel = (st) => {
    if (st === 'STATION_BAR') return 'BAR & BEVERAGE STATION';
    if (st === 'STATION_PANTRY') return 'PANTRY & DESSERT STATION';
    return 'MAIN KITCHEN (TANDOOR & CURRIES)';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header bar (no-print) */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-orange-600" />
            <span className="font-bold text-xs text-slate-900">80mm Thermal Slip Preview</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Bill vs KOT */}
            <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setPrintType('bill')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  printType === 'bill' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600'
                }`}
              >
                Tax Invoice
              </button>
              <button
                type="button"
                onClick={() => setPrintType('kot')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  printType === 'kot' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600'
                }`}
              >
                Kitchen KOT
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Station Sub-Filter Tabs (Only in KOT mode) */}
        {printType === 'kot' && (
          <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-1 overflow-x-auto text-[10px] font-bold no-print">
            <span className="text-slate-500 mr-1">Route Station:</span>
            {[
              { id: 'ALL', label: 'All Items' },
              { id: 'STATION_KITCHEN', label: 'Kitchen' },
              { id: 'STATION_BAR', label: 'Bar' },
              { id: 'STATION_PANTRY', label: 'Pantry' }
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setActiveStation(st.id)}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                  activeStation === st.id
                    ? 'bg-slate-800 text-white font-black'
                    : 'bg-white text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        )}

        {/* Printable 80mm Receipt Body */}
        <div className="p-4 sm:p-6 bg-slate-100/50 flex justify-center max-h-[70vh] overflow-y-auto">
          <div
            id="printable-receipt"
            className="w-[80mm] max-w-full bg-white p-4 text-[11px] font-mono leading-tight shadow-md border border-slate-200 text-black select-text"
          >
            {printType === 'bill' ? (
              /* ================= 80mm CUSTOMER TAX INVOICE ================= */
              <div className="space-y-2">
                {/* Restaurant Brand */}
                <div className="text-center space-y-0.5 border-b border-dashed border-slate-400 pb-2">
                  <h2 className="text-sm font-bold uppercase tracking-wider">{restName}</h2>
                  <p className="text-[10px] text-slate-600">{restAddress}</p>
                  <p className="text-[10px] text-slate-600">Ph: {restPhone}</p>
                  <div className="flex justify-between text-[9px] pt-1 text-slate-500">
                    <span>GSTIN: {gstNo}</span>
                    <span>FSSAI: {fssaiNo}</span>
                  </div>
                </div>

                {/* Metadata */}
                <div className="text-[10px] border-b border-dashed border-slate-400 pb-1.5 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Invoice: #{orderId.slice(-6).toUpperCase()}</span>
                    <span className="font-bold">{tableName}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Date: {createdAt}</span>
                    <span>Cashier: Counter POS</span>
                  </div>
                  {order.customer_name && (
                    <div className="text-slate-600">Guest: {order.customer_name} ({order.customer_phone || 'N/A'})</div>
                  )}
                  <div className="text-slate-600 font-semibold">Channel: {order.order_type?.toUpperCase() || 'DINE-IN'}</div>
                </div>

                {/* Items Table */}
                <div className="border-b border-dashed border-slate-400 pb-2">
                  <div className="flex justify-between font-bold border-b border-slate-300 pb-1 mb-1 text-[10px]">
                    <span className="w-1/2">Item Description</span>
                    <span className="w-1/6 text-center">Qty</span>
                    <span className="w-1/6 text-right">Rate</span>
                    <span className="w-1/6 text-right">Amt</span>
                  </div>
                  <div className="space-y-1.5">
                    {filteredItems.map((it, idx) => (
                      <div key={idx} className="text-[10px]">
                        <div className="flex justify-between">
                          <span className="w-1/2 truncate font-semibold">{it.name}</span>
                          <span className="w-1/6 text-center">{it.quantity}</span>
                          <span className="w-1/6 text-right">₹{Number(it.price).toFixed(0)}</span>
                          <span className="w-1/6 text-right font-bold">₹{(it.quantity * it.price).toFixed(0)}</span>
                        </div>
                        {it.variant && (
                          <div className="text-[9px] text-slate-500 pl-1 italic">
                            * Portion: {it.variant}
                          </div>
                        )}
                        {it.modifiers && it.modifiers.length > 0 && (
                          <div className="text-[9px] text-amber-900 pl-1 italic">
                            * Modifiers: {it.modifiers.map((m) => m.label).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tax & Total Calculation */}
                <div className="space-y-1 text-[10px] border-b border-dashed border-slate-400 pb-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount</span>
                      <span>-₹{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>CGST (2.5%)</span>
                    <span>₹{(tax / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST (2.5%)</span>
                    <span>₹{(tax / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-300">
                    <span>GRAND TOTAL</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment & QR */}
                <div className="text-center pt-1 space-y-1">
                  <p className="text-[10px] font-bold">Payment: {order.payment_method || 'PAID (CASH / UPI)'}</p>
                  <div className="w-20 h-20 mx-auto border border-slate-300 p-1 bg-white rounded flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-slate-800" />
                  </div>
                  <p className="text-[9px] text-slate-500">Scan & Pay via any UPI App</p>
                  <p className="text-[10px] font-medium pt-1">*** THANK YOU! VISIT AGAIN ***</p>
                  <p className="text-[8px] text-slate-400">Powered by ServeFlow Enterprise POS</p>
                </div>
              </div>
            ) : (
              /* ================= 80mm KITCHEN KOT TICKET ================= */
              <div className="space-y-2">
                <div className="text-center border-b-2 border-slate-900 pb-1.5">
                  <h2 className="text-base font-black tracking-widest uppercase">KITCHEN TICKET (KOT)</h2>
                  <p className="text-xs font-black text-slate-800">{tableName.toUpperCase()} - {order.order_type?.toUpperCase() || 'DINE-IN'}</p>
                  <p className="text-[10px] font-bold text-orange-700 mt-0.5">{getStationLabel(activeStation)}</p>
                </div>

                <div className="text-[10px] flex justify-between border-b border-dashed border-slate-400 pb-1 text-slate-600">
                  <span>KOT #{orderId.slice(-4).toUpperCase()}</span>
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>

                {/* Big Bold Items with Modifiers */}
                <div className="space-y-2.5 border-b-2 border-slate-900 pb-3">
                  {filteredItems.map((it, idx) => (
                    <div key={idx} className="border-b border-dotted border-slate-200 pb-1">
                      <div className="flex justify-between items-start text-xs font-black">
                        <span className="w-3/4">
                          [{it.shortcode || 'ITEM'}] {it.name}
                        </span>
                        <span className="w-1/4 text-right text-sm">x {it.quantity}</span>
                      </div>
                      {it.variant && (
                        <div className="text-[10px] font-bold text-slate-600 pl-2">
                          PORTION: {it.variant.toUpperCase()}
                        </div>
                      )}
                      {it.modifiers && it.modifiers.length > 0 && (
                        <div className="text-[10px] font-black text-amber-900 pl-2">
                          * MODIFIERS: {it.modifiers.map((m) => m.label).join(' | ')}
                        </div>
                      )}
                      {it.notes && (
                        <div className="text-[10px] font-bold italic text-slate-700 pl-2">
                          * NOTE: {it.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {order.notes && (
                  <div className="p-1.5 bg-slate-50 border border-slate-300 rounded text-[10px]">
                    <span className="font-bold">TABLE SPECIAL REQUEST: </span>
                    <span>{order.notes}</span>
                  </div>
                )}

                <div className="text-center text-[9px] text-slate-400 pt-1">
                  Server: Counter Staff | ServeFlow High-Speed KDS
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions (no-print) */}
        <div className="px-4 py-3 bg-white border-t border-slate-200 flex justify-end gap-2 no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print 80mm Slip</span>
          </button>
        </div>

      </div>
    </div>
  );
}
