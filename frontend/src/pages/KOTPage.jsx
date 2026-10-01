import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Check,
  Volume2,
  VolumeX,
  RotateCcw,
  Printer
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { SkeletonModulePage } from '../components/common/SkeletonLoader';
import ThermalReceiptModal from '../components/ThermalReceiptModal';

export default function KOTPage() {
  const [kots, setKots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedKotForPrint, setSelectedKotForPrint] = useState(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const { showToast } = useToast();
  const { activeBranchId } = useAuth();
  const latestBranchRef = useRef(activeBranchId);

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  };

  const fetchKots = useCallback(async (signal) => {
    const branchAtRequest = activeBranchId;
    latestBranchRef.current = branchAtRequest;
    try {
      const res = await api.get('/kot', { signal });
      if (latestBranchRef.current === branchAtRequest && !signal?.aborted) {
        setKots(res.data || []);
      }
    } catch (err) {
      if (!signal?.aborted) console.error(err);
    } finally {
      if (!signal?.aborted && latestBranchRef.current === branchAtRequest) {
        setLoading(false);
      }
    }
  }, [activeBranchId]);

  // Branch change: re-fetch KOTs and clear stale data
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setKots([]);
    fetchKots(controller.signal);
    return () => controller.abort();
  }, [activeBranchId]);

  useEffect(() => {
    // Connect to real-time WebSocket stream
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let ws = null;

    try {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        console.log('[KDS WebSocket] Connected to real-time Kitchen stream');
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if ([
            'kot:new_order',
            'kot:ticket_created',
            'kot:status_updated',
            'kot:item_updated',
            'pos:order_updated',
            'order:status_updated',
            'kitchen:ready_alert'
          ].includes(data.type)) {
            fetchKots();
            if (soundEnabled) {
              playChime();
            }
          }
        } catch (e) {
          console.error(e);
        }
      };
    } catch (err) {
      console.warn('WebSocket connection error, falling back to polling');
    }

    // Heartbeat poll fallback
    const interval = setInterval(() => fetchKots(), 8000);
    return () => {
      clearInterval(interval);
      if (ws) ws.close();
    };
  }, [soundEnabled, fetchKots]);

  const handleUpdateStatus = async (kotId, newStatus) => {
    try {
      await api.put(`/kot/${kotId}/status`, { status: newStatus });
      showToast(`KOT status updated to ${newStatus.toUpperCase()}`, 'success');
      fetchKots();
    } catch (err) {
      showToast('Error updating KOT status', 'error');
    }
  };

  // Helper to compute elapsed minutes
  const getElapsedMinutes = (dateString) => {
    const diffMs = Date.now() - new Date(dateString).getTime();
    return Math.max(1, Math.floor(diffMs / 60000));
  };

  // Group by status
  const newKots = kots.filter((k) => k.status === 'new');
  const preparingKots = kots.filter((k) => k.status === 'preparing');
  const readyKots = kots.filter((k) => k.status === 'ready');
  const completedKots = kots.filter((k) => k.status === 'completed');
  const cancelledKots = kots.filter((k) => k.status === 'cancelled');

  if (loading) {
    return <SkeletonModulePage type="kot" />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kitchen Order Tickets (KOT)</h1>
            <p className="text-xs text-slate-500 font-medium">Real-time order board for line cooks & kitchen supervisors</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {cancelledKots.length > 0 && (
            <button
              onClick={() => setShowCancelled(!showCancelled)}
              className={`px-3 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer ${
                showCancelled
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
              }`}
            >
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{showCancelled ? 'Hide Cancelled' : `Cancelled Tickets (${cancelledKots.length})`}</span>
            </button>
          )}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer ${
              soundEnabled ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Alerts ON' : 'Muted'}</span>
          </button>
          <button
            onClick={fetchKots}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Refresh Tickets"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4-Column Kitchen Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* COLUMN 1: NEW */}
        <div className="bg-slate-100/70 rounded-xl p-3 sm:p-4 border border-slate-200/80 flex flex-col h-[calc(100vh-14rem)]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <h3 className="font-bold text-sm text-slate-800 tracking-wide uppercase">NEW</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              {newKots.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {newKots.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-slate-400">
                No new orders
              </div>
            ) : (
              newKots.map((kot) => renderTicket(kot, 'new', handleUpdateStatus, getElapsedMinutes, setSelectedKotForPrint))
            )}
          </div>
        </div>

        {/* COLUMN 2: PREPARING */}
        <div className="bg-slate-100/70 rounded-xl p-3 sm:p-4 border border-slate-200/80 flex flex-col h-[calc(100vh-14rem)]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <h3 className="font-bold text-sm text-slate-800 tracking-wide uppercase">PREPARING</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {preparingKots.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {preparingKots.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-slate-400">
                No orders preparing
              </div>
            ) : (
              preparingKots.map((kot) => renderTicket(kot, 'preparing', handleUpdateStatus, getElapsedMinutes, setSelectedKotForPrint))
            )}
          </div>
        </div>

        {/* COLUMN 3: READY */}
        <div className="bg-slate-100/70 rounded-xl p-3 sm:p-4 border border-slate-200/80 flex flex-col h-[calc(100vh-14rem)]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-teal-500" />
              <h3 className="font-bold text-sm text-slate-800 tracking-wide uppercase">READY</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
              {readyKots.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {readyKots.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-slate-400">
                No orders ready
              </div>
            ) : (
              readyKots.map((kot) => renderTicket(kot, 'ready', handleUpdateStatus, getElapsedMinutes, setSelectedKotForPrint))
            )}
          </div>
        </div>

        {/* COLUMN 4: COMPLETED */}
        <div className="bg-slate-100/70 rounded-xl p-3 sm:p-4 border border-slate-200/80 flex flex-col h-[calc(100vh-14rem)]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <h3 className="font-bold text-sm text-slate-800 tracking-wide uppercase">COMPLETED</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              {completedKots.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {completedKots.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-slate-400">
                No completed orders
              </div>
            ) : (
              completedKots.map((kot) => renderTicket(kot, 'completed', handleUpdateStatus, getElapsedMinutes, setSelectedKotForPrint))
            )}
          </div>
        </div>
      </div>

      {/* Cancelled Tickets Drawer / Grid */}
      {showCancelled && cancelledKots.length > 0 && (
        <div className="bg-rose-50/60 rounded-2xl p-4 sm:p-6 border border-rose-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <h3 className="font-bold text-sm text-rose-900 tracking-wide uppercase">
                Cancelled Tickets ({cancelledKots.length})
              </h3>
            </div>
            <span className="text-xs text-rose-600 font-medium">Orders cancelled in Orders / POS — Do NOT prepare</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cancelledKots.map((kot) => renderTicket(kot, 'cancelled', handleUpdateStatus, getElapsedMinutes, setSelectedKotForPrint))}
          </div>
        </div>
      )}

      {selectedKotForPrint && (
        <ThermalReceiptModal
          order={selectedKotForPrint}
          initialType="kot"
          onClose={() => setSelectedKotForPrint(null)}
        />
      )}
    </div>
  );
}

function renderTicket(kot, stage, handleUpdateStatus, getElapsedMinutes, onPrint) {
  const elapsed = getElapsedMinutes(kot.created_at);
  const isDelayed = elapsed > 20;

  return (
    <div
      key={kot.id}
      className={`bg-white rounded-xl p-4 border shadow-2xs transition-all space-y-3 ${
        isDelayed ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200/80'
      }`}
    >
      {/* Top line: KOT #, Table, Order Number, Elapsed Time & Print button */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-sm font-black text-slate-900 block">{kot.kot_number}</span>
          <div className="flex items-center gap-1.5 text-[11px] font-bold mt-0.5">
            <span className="text-orange-600 uppercase">{kot.table_number || kot.order_type}</span>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-slate-600">{kot.order_number}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {onPrint && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPrint(kot);
              }}
              title="Print KOT Slip"
              className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          )}
          <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
            isDelayed ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
          }`}>
            <Clock className="w-3 h-3" />
            <span>{elapsed} min</span>
          </div>
        </div>
      </div>

      {/* Items list */}
      <div className="divide-y divide-slate-100 border-t border-b border-slate-100 py-2 space-y-1.5">
        {(kot.items || []).map((it, idx) => {
          const isItemCancelled = it.status === 'cancelled';
          return (
            <div
              key={idx}
              className={`pt-1.5 first:pt-0 flex items-start justify-between text-xs transition-all ${
                isItemCancelled ? 'opacity-70 bg-rose-50/60 p-1.5 rounded-lg border border-rose-100 my-1' : ''
              }`}
            >
              <div className="pr-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`font-bold ${isItemCancelled ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                    {it.name}
                  </span>
                  {isItemCancelled && (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white px-1.5 py-0.5 rounded-md shadow-2xs">
                      Cancelled
                    </span>
                  )}
                </div>
                {it.notes && (
                  <span className={`block text-[11px] font-semibold mt-0.5 ${isItemCancelled ? 'text-rose-700 line-through' : 'text-amber-700'}`}>
                    • Note: {it.notes}
                  </span>
                )}
              </div>
              <span className={`text-sm font-black px-2 py-0.5 rounded-lg shrink-0 ${
                isItemCancelled ? 'line-through bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-900'
              }`}>
                ×{it.quantity}
              </span>
            </div>
          );
        })}
      </div>

      {/* Cancelled Banner if whole KOT is cancelled */}
      {kot.status === 'cancelled' && (
        <div className="p-2 bg-rose-100 border border-rose-300 rounded-xl text-center text-xs font-black text-rose-800">
          ⚠️ ORDER CANCELLED IN ORDERS — DO NOT PREPARE
        </div>
      )}

      {/* Special Note */}
      {kot.special_note && (
        <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
          <span className="font-bold">Special Note: </span>
          <span>{kot.special_note}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-1">
        {stage === 'new' && (
          <button
            onClick={() => handleUpdateStatus(kot.id, 'preparing')}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Preparing</span>
          </button>
        )}

        {stage === 'preparing' && (
          <button
            onClick={() => handleUpdateStatus(kot.id, 'ready')}
            className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mark Ready</span>
          </button>
        )}

        {stage === 'ready' && (
          <button
            onClick={() => handleUpdateStatus(kot.id, 'completed')}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Complete (Ready to Serve)</span>
          </button>
        )}

        {stage === 'completed' && (
          <div className="text-center text-[11px] font-bold text-emerald-700 bg-emerald-50 py-1.5 rounded-xl border border-emerald-200">
            ✓ Kitchen Completed • Serve Pending
          </div>
        )}
      </div>

    </div>
  );
}
