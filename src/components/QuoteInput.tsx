import { useState, useEffect } from 'react';
import type { WizardState, WizardAction } from '../types';
import { analyzeQuote } from '../engine/calculator';
import pricesData from '../data/prices.json';
import type { PricesData } from '../types';
import { Button } from './ui/Button';

interface QuoteInputProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

export function QuoteInput({ state, dispatch }: QuoteInputProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  // Focus management
  useEffect(() => {
    const input = document.getElementById('quote-input');
    if (input) input.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow empty input
    if (raw === '') {
      setValue('');
      setError('');
      return;
    }
    // Only allow digits and one decimal point
    if (!/^\d*\.?\d{0,2}$/.test(raw)) return;
    setValue(raw);
    setError('');
  };

  const handleSubmit = () => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      setError('请输入有效的维修报价金额');
      return;
    }
    if (num < 1 || num > 100000) {
      setError('请输入 1-100,000 元之间的金额');
      return;
    }

    if (!state.category) return;

    dispatch({ type: 'SET_QUOTE', payload: num });
    dispatch({ type: 'SET_ANALYZING', payload: true });

    // Run calculation immediately (synchronous, pure function)
    const result = analyzeQuote(
      state.category,
      state.modelNumber,
      state.selectedItems,
      num,
      pricesData as unknown as PricesData
    );
    dispatch({ type: 'SET_ANALYSIS_RESULT', payload: result });

    // AI call will be triggered by AnalysisReport component
  };

  // Show big warning for unusually large quotes
  const numValue = parseFloat(value);
  const showLargeWarning = !isNaN(numValue) && numValue > 10000;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">输入维修报价</h1>
      <p className="text-slate-500 mb-6">请输入维修师傅给出的最终报价金额</p>

      {/* Large price input */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6 text-center">
        <div className="text-sm text-slate-500 mb-3">维修报价</div>
        <div className="flex items-center justify-center gap-1">
          <span className="text-3xl font-light text-slate-400">¥</span>
          <input
            id="quote-input"
            type="number"
            inputMode="decimal"
            value={value}
            onChange={handleChange}
            placeholder="0"
            className="w-48 text-center text-5xl font-mono font-bold text-slate-800
                       bg-transparent border-none outline-none
                       placeholder:text-slate-300"
            min="1"
            max="100000"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
          />
        </div>
        <div className="text-sm text-slate-400 mt-2">元（人民币）</div>

        {error && (
          <div className="mt-3 text-sm text-red-500 bg-red-50 rounded-lg py-2 px-3">
            {error}
          </div>
        )}

        {showLargeWarning && (
          <div className="mt-3 text-sm text-amber-600 bg-amber-50 rounded-lg py-2 px-3">
            金额较大，请确认是否正确
          </div>
        )}
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        disabled={!value || parseFloat(value) <= 0}
        onClick={handleSubmit}
      >
        查看分析结果
      </Button>
    </div>
  );
}
