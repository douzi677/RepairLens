import type { WizardStep } from '../types';

const STEPS = [
  { step: 1 as WizardStep, label: '品类' },
  { step: 2 as WizardStep, label: '型号' },
  { step: 3 as WizardStep, label: '项目' },
  { step: 4 as WizardStep, label: '报价' },
  { step: 5 as WizardStep, label: '报告' },
];

interface StepIndicatorProps {
  currentStep: WizardStep;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-sm py-3 mb-6">
      <div className="flex items-center justify-center gap-0">
        {STEPS.map((s, idx) => (
          <div key={s.step} className="flex items-center">
            {/* Step dot + label */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  transition-all duration-300
                  ${
                    s.step < currentStep
                      ? 'bg-brand-600 text-white'
                      : s.step === currentStep
                        ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                        : 'bg-slate-200 text-slate-400'
                  }
                `}
                aria-current={s.step === currentStep ? 'step' : undefined}
              >
                {s.step < currentStep ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  s.step
                )}
              </div>
              <span
                className={`text-xs ${
                  s.step <= currentStep ? 'text-brand-700 font-medium' : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
            </div>
            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div
                className={`w-8 h-0.5 mx-1 mb-5 rounded transition-colors duration-300 ${
                  s.step < currentStep ? 'bg-brand-400' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
