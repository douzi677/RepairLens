import type { AnalysisResult, AIReportSections } from '../types';

export const FALLBACK_AI_SECTIONS: AIReportSections = {
  marketReference:
    '以上价格区间基于市场公开数据统计，反映了独立维修店和品牌授权售后的常见报价范围。具体价格可能因地区、品牌和配件来源有所不同。',
  riskWarnings:
    '维修过程中可能涉及未预先告知的额外费用（如高空作业费、管道延长费等）。建议在维修前与师傅确认所有费用项目，并要求出具详细费用清单。',
  suggestions:
    '建议联系品牌官方售后服务中心获取同项目报价对比。如报价相差较大，可考虑咨询其他维修商。维修完成后索要正规发票和保修凭证。',
  disclaimerNote:
    '本报告由 RepairLens 自动生成，分析结果仅供参考。价格数据基于市场公开信息整理，不代表任何品牌官方报价。',
};

export async function fetchAIReport(
  analysis: AnalysisResult
): Promise<AIReportSections> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: analysis.categoryName,
      modelNumber: analysis.modelNumber || '未提供',
      items: analysis.selectedItems.map((i) => i.name),
      userQuote: analysis.userQuote,
      partsRange: analysis.costBreakdown.partsRange,
      laborRange: analysis.costBreakdown.laborRange,
      visitFeeRange: analysis.costBreakdown.visitFeeRange,
      totalRange: analysis.costBreakdown.totalRange,
      tier: analysis.comparison.tier,
      premiumAmount: analysis.comparison.premiumAmount,
      premiumPercent: analysis.comparison.premiumPercent,
      noDataAvailable: analysis.noDataAvailable,
      hasUnknownItems: analysis.costBreakdown.hasUnknownItems,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI analysis failed: ${response.status}`);
  }

  return response.json();
}
