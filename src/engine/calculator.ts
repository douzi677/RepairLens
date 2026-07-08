import type {
  ApplianceCategory,
  PricesData,
  CategoryData,
  RepairItemData,
  SelectedItem,
  AnalysisResult,
  CostBreakdown,
  ItemCostDetail,
  QuoteComparison,
  PriceTier,
} from '../types';

// === Data Lookup ===

export function getCategoryData(
  category: ApplianceCategory,
  pricesData: PricesData
): CategoryData {
  return pricesData.categories[category];
}

export function findRepairItem(
  itemId: string,
  categoryData: CategoryData
): RepairItemData | null {
  return categoryData.repair_items.find((item) => item.id === itemId) ?? null;
}

/**
 * Cross-category keyword search for "其他" category matching.
 * Searches all known repair items across all non-"其他" categories.
 */
export function searchAllCategories(
  keyword: string,
  pricesData: PricesData
): { item: RepairItemData; categoryName: string } | null {
  const lowerKeyword = keyword.toLowerCase();
  for (const [catKey, catData] of Object.entries(pricesData.categories)) {
    if (catKey === 'other') continue;
    for (const item of catData.repair_items) {
      if (item.name.includes(lowerKeyword) || lowerKeyword.includes(item.name)) {
        return { item, categoryName: catData.name };
      }
    }
  }
  return null;
}

// === Cost Calculation ===

function combineRanges(ranges: Array<[number, number]>): [number, number] {
  if (ranges.length === 0) return [0, 0];
  const minSum = ranges.reduce((sum, r) => sum + r[0], 0);
  const maxSum = ranges.reduce((sum, r) => sum + r[1], 0);
  return [minSum, maxSum];
}

function maxRanges(ranges: Array<[number, number]>): [number, number] {
  if (ranges.length === 0) return [0, 0];
  const maxMin = Math.max(...ranges.map((r) => r[0]));
  const maxMax = Math.max(...ranges.map((r) => r[1]));
  return [maxMin, maxMax];
}

export function calculateCostBreakdown(
  selectedItems: SelectedItem[],
  categoryData: CategoryData,
  pricesData: PricesData
): CostBreakdown {
  const itemDetails: ItemCostDetail[] = [];
  const knownPartsRanges: Array<[number, number]> = [];
  const knownLaborRanges: Array<[number, number]> = [];
  const knownVisitRanges: Array<[number, number]> = [];

  for (const selected of selectedItems) {
    let matchedItem: RepairItemData | null = null;

    if (!selected.isCustom) {
      // Preset item: look up in current category
      matchedItem = findRepairItem(selected.id, categoryData);
    } else {
      // Custom item: try cross-category keyword matching
      const result = searchAllCategories(selected.name, pricesData);
      if (result) {
        matchedItem = result.item;
      }
    }

    if (matchedItem) {
      knownPartsRanges.push(matchedItem.parts_cost);
      knownLaborRanges.push(matchedItem.labor_cost);
      knownVisitRanges.push(matchedItem.visit_fee);
      itemDetails.push({
        itemId: selected.id,
        itemName: selected.name,
        partsRange: matchedItem.parts_cost,
        laborRange: matchedItem.labor_cost,
        visitFeeRange: matchedItem.visit_fee,
        isKnown: true,
      });
    } else {
      itemDetails.push({
        itemId: selected.id,
        itemName: selected.name,
        partsRange: null,
        laborRange: null,
        visitFeeRange: null,
        isKnown: false,
      });
    }
  }

  const partsRange = combineRanges(knownPartsRanges);
  const laborRange = combineRanges(knownLaborRanges);
  const visitFeeRange = maxRanges(knownVisitRanges);
  const totalRange: [number, number] = [
    partsRange[0] + laborRange[0] + visitFeeRange[0],
    partsRange[1] + laborRange[1] + visitFeeRange[1],
  ];

  const hasUnknownItems = itemDetails.some((d) => !d.isKnown);

  return {
    partsRange,
    laborRange,
    visitFeeRange,
    totalRange,
    items: itemDetails,
    hasUnknownItems,
  };
}

// === Quote Comparison ===

function determineTier(ratio: number): PriceTier {
  if (ratio <= 1.0) return '合理';
  if (ratio <= 1.2) return '略高';
  if (ratio <= 1.5) return '偏高';
  return '严重偏高';
}

export function compareQuote(
  userQuote: number,
  totalRange: [number, number]
): QuoteComparison {
  const upperBound = totalRange[1];

  if (userQuote <= upperBound) {
    return { tier: '合理', premiumAmount: null, premiumPercent: null };
  }

  const ratio = userQuote / upperBound;
  const tier = determineTier(ratio);

  // Premium: difference from upper bound, and difference from lower bound
  const premiumAmount: [number, number] = [
    Math.round(userQuote - upperBound),
    Math.round(userQuote - totalRange[0]),
  ];

  const premiumPercent: [number, number] = [
    Math.round((premiumAmount[0] / upperBound) * 100),
    Math.round((premiumAmount[1] / totalRange[0]) * 100),
  ];

  return { tier, premiumAmount, premiumPercent };
}

// === Main Entry Point ===

export function analyzeQuote(
  category: ApplianceCategory,
  modelNumber: string,
  selectedItems: SelectedItem[],
  userQuote: number,
  pricesData: PricesData
): AnalysisResult {
  const categoryData = getCategoryData(category, pricesData);

  const costBreakdown = calculateCostBreakdown(selectedItems, categoryData, pricesData);

  const comparison = compareQuote(userQuote, costBreakdown.totalRange);

  // noDataAvailable: true only when ALL items are unknown (no price data at all)
  const allKnownItems = selectedItems.filter((item) => {
    if (!item.isCustom) {
      return findRepairItem(item.id, categoryData) !== null;
    }
    return searchAllCategories(item.name, pricesData) !== null;
  });
  const noDataAvailable = selectedItems.length > 0 && allKnownItems.length === 0;

  return {
    category,
    categoryName: categoryData.name,
    modelNumber,
    selectedItems,
    userQuote,
    costBreakdown,
    comparison,
    noDataAvailable,
  };
}
