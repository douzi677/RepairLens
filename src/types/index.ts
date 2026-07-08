// === Enums ===

export type ApplianceCategory =
  | 'air_conditioner'
  | 'refrigerator'
  | 'washing_machine'
  | 'television'
  | 'water_heater'
  | 'other';

export type PriceTier = '合理' | '略高' | '偏高' | '严重偏高';

export type WizardStep = 1 | 2 | 3 | 4 | 5;

// === Data Model (mirrors prices.json) ===

export interface RepairItemData {
  id: string;
  name: string;
  parts_cost: [number, number];
  labor_cost: [number, number];
  visit_fee: [number, number];
  notes?: string;
}

export interface CategoryData {
  name: string;
  icon: string;
  repair_items: RepairItemData[];
}

export interface PricesData {
  version: string;
  last_updated: string;
  categories: Record<ApplianceCategory, CategoryData>;
}

// === Wizard State ===

export interface SelectedItem {
  id: string;
  name: string;
  isCustom: boolean;
}

export interface WizardState {
  currentStep: WizardStep;
  category: ApplianceCategory | null;
  modelNumber: string;
  selectedItems: SelectedItem[];
  userQuote: number | null;
  analysisResult: AnalysisResult | null;
  reportData: ReportData | null;
  isAnalyzing: boolean;
}

export type WizardAction =
  | { type: 'SELECT_CATEGORY'; payload: ApplianceCategory }
  | { type: 'SET_MODEL'; payload: string }
  | { type: 'SET_ITEMS'; payload: SelectedItem[] }
  | { type: 'SET_QUOTE'; payload: number }
  | { type: 'SET_ANALYSIS_RESULT'; payload: AnalysisResult }
  | { type: 'SET_REPORT_DATA'; payload: ReportData }
  | { type: 'SET_ANALYZING'; payload: boolean }
  | { type: 'GO_TO_STEP'; payload: WizardStep }
  | { type: 'GO_BACK' }
  | { type: 'RESET' };

// === Engine Output ===

export interface ItemCostDetail {
  itemId: string;
  itemName: string;
  partsRange: [number, number] | null;
  laborRange: [number, number] | null;
  visitFeeRange: [number, number] | null;
  isKnown: boolean;
}

export interface CostBreakdown {
  partsRange: [number, number];
  laborRange: [number, number];
  visitFeeRange: [number, number];
  totalRange: [number, number];
  items: ItemCostDetail[];
  hasUnknownItems: boolean;
}

export interface QuoteComparison {
  tier: PriceTier;
  premiumAmount: [number, number] | null;
  premiumPercent: [number, number] | null;
}

export interface AnalysisResult {
  category: ApplianceCategory;
  categoryName: string;
  modelNumber: string;
  selectedItems: SelectedItem[];
  userQuote: number;
  costBreakdown: CostBreakdown;
  comparison: QuoteComparison;
  noDataAvailable: boolean;
}

// === AI Response ===

export interface AIReportSections {
  marketReference: string;
  riskWarnings: string;
  suggestions: string;
  disclaimerNote: string;
}

// === Full Report ===

export interface ReportData {
  analysis: AnalysisResult;
  aiSections: AIReportSections | null;
  aiError: boolean;
}
