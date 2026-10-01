import React from 'react';
import Modal from './Modal';
import { Printer, Download, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function PrintableBillModal({ isOpen, onClose, order }) {
  const { restaurant } = useAuth();

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    window.print();
  };

  const items = (order.items || []).filter(i => i.status !== 'cancelled');
  const isPaid = order.payment_status === 'paid' || order.status === 'paid';
  const restName = restaurant?.name || 'Urban Spice Restaurant';
  const address = restaurant?.address || '42, Brigade Road, Bengaluru 560001';
  const phone = restaurant?.phone || '+91 98765 43210';
  const gst = restaurant?.gst_number || '29ABCDE1234F1Z5';
  const footerText = restaurant?.footer_text || 'Thank you for dining with us! Visit again.';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tax Invoice & Receipt"
      maxWidth="max-w-md"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors gap-1.5"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs transition-colors gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>
          </div>
        </div>
      }
    >
      {/* Printable Area with id for print styles */}
      <div id="printable-receipt" className="bg-white p-4 font-mono text-xs text-slate-800 border border-dashed border-slate-300 rounded-xl">
        {/* Header */}
        <div className="text-center pb-3 border-b border-dashed border-slate-300">
          <div className="flex items-center justify-center gap-1.5 text-orange-600 font-sans font-bold text-base mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600 inline-block"></span>
            <span>ServeFlow POS</span>
          </div>
          <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wide">{restName}</h2>
          <p className="text-[11px] text-slate-600 mt-0.5">{address}</p>
          <p className="text-[11px] text-slate-600">Tel: {phone}</p>
          <p className="text-[11px] text-slate-700 font-semibold mt-0.5">GSTIN: {gst}</p>
        </div>

        {/* Invoice Meta */}
        <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Invoice No:</span>
            <span className="font-bold">{order.order_number || `#ORD-${order.id}`}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Date & Time:</span>
            <span>{new Date(order.created_at || Date.now()).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Table / Mode:</span>
            <span className="font-bold uppercase">{order.table_name || order.order_type}</span>
          </div>
          {order.customer_name && (
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <span>{order.customer_name}</span>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="py-3 border-b border-dashed border-slate-300">
          <div className="grid grid-cols-12 text-[11px] font-bold text-slate-900 pb-1.5 border-b border-slate-200">
            <span className="col-span-6">Item</span>
            <span className="col-span-2 text-center">Qty</span>
            <span className="col-span-2 text-right">Price</span>
            <span className="col-span-2 text-right">Amt</span>
          </div>
          <div className="divide-y divide-slate-100 pt-1">
            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 py-1.5 text-[11px]">
                <div className="col-span-6 pr-1">
                  <span className="font-medium text-slate-900">{it.name}</span>
                  {it.variant && <span className="block text-[10px] text-slate-400">({it.variant})</span>}
                </div>
                <span className="col-span-2 text-center text-slate-700">{it.quantity}</span>
                <span className="col-span-2 text-right text-slate-600">₹{it.price}</span>
                <span className="col-span-2 text-right font-medium text-slate-900">₹{it.price * it.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-600">Subtotal:</span>
            <span>₹{order.subtotal?.toFixed(2) || '0.00'}</span>
          </div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount:</span>
              <span>-₹{Number(order.discount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>GST / Tax:</span>
            <span>₹{order.tax?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-200">
            <span>GRAND TOTAL:</span>
            <span className="text-orange-600">₹{order.total?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="flex justify-between items-center pt-2 text-[11px]">
            <span className="text-slate-500 font-bold">Status:</span>
            <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
              isPaid
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {isPaid
                ? `PAID (${(order.payment_method || 'CASH').toUpperCase()})`
                : 'BILLING PENDING / UNPAID'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-3 text-[11px] text-slate-500 space-y-0.5">
          <p className="font-medium text-slate-700">{footerText}</p>
          <p className="text-[10px] text-slate-400">Powered by ServeFlow Restaurant Tech</p>
        </div>
      </div>
    </Modal>
  );
}
