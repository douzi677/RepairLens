import { useState } from 'react';
import type { WizardState, WizardAction } from '../types';
import { Button } from './ui/Button';

interface ModelInputProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

export function ModelInput({ state, dispatch }: ModelInputProps) {
  const [value, setValue] = useState(state.modelNumber);

  const handleNext = () => {
    dispatch({ type: 'SET_MODEL', payload: value.trim() });
    dispatch({ type: 'GO_TO_STEP', payload: 3 });
  };

  const handleSkip = () => {
    dispatch({ type: 'SET_MODEL', payload: '' });
    dispatch({ type: 'GO_TO_STEP', payload: 3 });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">设备型号（可选）</h1>
      <p className="text-slate-500 mb-6">
        输入设备型号可以获得更精准的价格参考，也可以直接跳过。
      </p>

      <div className="mb-6">
        <label htmlFor="model-input" className="block text-sm font-medium text-slate-700 mb-2">
          设备型号
        </label>
        <input
          id="model-input"
          type="text"
          inputMode="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="例如：KFR-35GW"
          className="w-full h-14 px-4 text-lg rounded-xl border border-slate-300 bg-white
                     focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500
                     placeholder:text-slate-400 transition-colors"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleNext();
          }}
        />
      </div>

      <div className="flex gap-3">
        <Button variant="primary" size="lg" className="flex-1" onClick={handleNext}>
          下一步
        </Button>
        <Button variant="ghost" size="lg" onClick={handleSkip}>
          跳过
        </Button>
      </div>
    </div>
  );
}
