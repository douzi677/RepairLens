import type { WizardState, WizardAction } from '../types';
import { StepIndicator } from './StepIndicator';
import { CategorySelector } from './CategorySelector';
import { ModelInput } from './ModelInput';
import { RepairItemSelector } from './RepairItemSelector';
import { QuoteInput } from './QuoteInput';
import { AnalysisReport } from './AnalysisReport';

interface WizardProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

export function Wizard({ state, dispatch }: WizardProps) {
  const { currentStep } = state;

  const handleBack = () => {
    dispatch({ type: 'GO_BACK' });
  };

  return (
    <div>
      <StepIndicator currentStep={currentStep} />

      {/* Back button */}
      {currentStep > 1 && currentStep < 5 && (
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4 py-2 min-h-[44px]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          上一步
        </button>
      )}

      {/* Step content */}
      <div className="animate-fade-in">
        {currentStep === 1 && <CategorySelector state={state} dispatch={dispatch} />}
        {currentStep === 2 && <ModelInput state={state} dispatch={dispatch} />}
        {currentStep === 3 && <RepairItemSelector state={state} dispatch={dispatch} />}
        {currentStep === 4 && <QuoteInput state={state} dispatch={dispatch} />}
        {currentStep === 5 && <AnalysisReport state={state} dispatch={dispatch} />}
      </div>
    </div>
  );
}
