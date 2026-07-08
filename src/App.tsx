import { useReducer } from 'react';
import type { WizardState, WizardAction } from './types';
import { Wizard } from './components/Wizard';

const initialState: WizardState = {
  currentStep: 1,
  category: null,
  modelNumber: '',
  selectedItems: [],
  userQuote: null,
  analysisResult: null,
  reportData: null,
  isAnalyzing: false,
};

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SELECT_CATEGORY':
      return {
        ...state,
        category: action.payload,
        selectedItems: [],
        currentStep: 2,
      };

    case 'SET_MODEL':
      return {
        ...state,
        modelNumber: action.payload,
      };

    case 'SET_ITEMS':
      return {
        ...state,
        selectedItems: action.payload,
      };

    case 'SET_QUOTE':
      return {
        ...state,
        userQuote: action.payload,
      };

    case 'SET_ANALYSIS_RESULT':
      return {
        ...state,
        analysisResult: action.payload,
        currentStep: 5,
      };

    case 'SET_REPORT_DATA':
      return {
        ...state,
        reportData: action.payload,
        isAnalyzing: false,
      };

    case 'SET_ANALYZING':
      return {
        ...state,
        isAnalyzing: action.payload,
      };

    case 'GO_TO_STEP':
      return {
        ...state,
        currentStep: action.payload,
      };

    case 'GO_BACK': {
      const prevStep = Math.max(1, state.currentStep - 1) as WizardState['currentStep'];
      // If going back from report, clear results
      if (state.currentStep === 5) {
        return {
          ...state,
          currentStep: prevStep,
          analysisResult: null,
          reportData: null,
          isAnalyzing: false,
        };
      }
      return { ...state, currentStep: prevStep };
    }

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  return (
    <div className="min-h-dvh bg-slate-50">
      <div className="mx-auto max-w-lg px-4 py-6">
        <Wizard state={state} dispatch={dispatch} />
      </div>
    </div>
  );
}
