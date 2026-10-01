import React, { useState } from 'react';
import { X, ShieldAlert, KeyRound, Check, Delete } from 'lucide-react';

export default function ManagerPinModal({ actionTitle = 'Manager Approval Required', actionDescription = 'Enter 4-digit Manager PIN to authorize this sensitive action.', onSuccess, onCancel }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  // Default demo manager PIN: 1234
  const VALID_PINS = ['1234', '9999', '0000'];

  const handleKeyPress = (digit) => {
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      setError('');
      if (next.length === 4) {
        verifyPin(next);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const verifyPin = (code) => {
    if (VALID_PINS.includes(code)) {
      setTimeout(() => {
        onSuccess();
      }, 200);
    } else {
      setError('Invalid Manager PIN. Default demo PIN is 1234.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span className="font-semibold text-xs text-slate-900">{actionTitle}</span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 text-center space-y-4">
          <p className="text-xs text-slate-600">{actionDescription}</p>

          {/* PIN Dots Display */}
          <div className="flex justify-center items-center gap-3 py-2">
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                    isFilled ? 'bg-slate-900 scale-110 shadow-xs' : 'border-2 border-slate-300 bg-slate-100'
                  }`}
                />
              );
            })}
          </div>

          {error ? (
            <p className="text-[11px] text-rose-600 font-medium">{error}</p>
          ) : (
            <p className="text-[11px] text-slate-400 font-mono">Demo Manager PIN: 1234</p>
          )}

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2 max-w-[220px] mx-auto pt-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(String(num))}
                className="btn-tactile h-11 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-md text-sm font-semibold text-slate-800 shadow-2xs cursor-pointer"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPin('')}
              className="btn-tactile h-11 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-xs font-medium text-slate-500 cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="btn-tactile h-11 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-md text-sm font-semibold text-slate-800 shadow-2xs cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="btn-tactile h-11 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md flex items-center justify-center text-slate-600 cursor-pointer"
              aria-label="Backspace"
            >
              <Delete className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs text-slate-700 font-medium"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
