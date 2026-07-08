import { useEffect, useRef } from 'react';
import type { WizardState, WizardAction } from '../types';
import { fetchAIReport, generateLocalFallback } from '../services/analyze';
import { ReportSection } from './ReportSection';
import { FeedbackButtons } from './FeedbackButtons';
import { Button } from './ui/Button';

interface AnalysisReportProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

const tierConfig = {
  '合理': { bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-100 text-green-800', icon: '✅', summary: '该报价在市场参考区间内' },
  '略高': { bg: 'bg-yellow-50', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800', icon: '💡', summary: '报价略高于市场参考区间' },
  '偏高': { bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800', icon: '⚠️', summary: '报价明显高于市场参考区间' },
  '严重偏高': { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100 text-red-800', icon: '🚨', summary: '报价远高于市场参考区间' },
} as const;

function formatRange(range: [number, number]): string {
  return `¥${range[0].toLocaleString()} - ¥${range[1].toLocaleString()}`;
}

export function AnalysisReport({ state, dispatch }: AnalysisReportProps) {
  const { analysisResult, reportData } = state;
  const aiPendingRef = useRef(false);

  // Show local fallback instantly, then upgrade to AI in background
  useEffect(() => {
    if (!analysisResult || reportData) return;

    // 1. Show local fallback immediately (synchronous, no wait)
    const localFallback = generateLocalFallback(analysisResult);
    dispatch({
      type: 'SET_REPORT_DATA',
      payload: {
        analysis: analysisResult,
        aiSections: localFallback,
        aiError: true,
      },
    });
    aiPendingRef.current = true;

    // 2. Try AI in background
    let cancelled = false;

    fetchAIReport(analysisResult)
      .then((aiSections) => {
        if (!cancelled) {
          aiPendingRef.current = false;
          dispatch({
            type: 'SET_REPORT_DATA',
            payload: {
              analysis: analysisResult,
              aiSections,
              aiError: false,
            },
          });
        }
      })
      .catch(() => {
        // Local fallback already showing — nothing to replace
        if (!cancelled) {
          aiPendingRef.current = false;
        }
      });

    return () => { cancelled = true; };
  }, [analysisResult]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!analysisResult) return null;

  const analysis = reportData?.analysis || analysisResult;
  const tier = tierConfig[analysis.comparison.tier];

  // Always have content: AI > local fallback
  const aiSections = reportData?.aiSections || generateLocalFallback(analysis);
  const handleStartOver = () => {
    dispatch({ type: 'RESET' });
  };

  return (
    <div>
      {/* Key Finding Card */}
      <div className={`rounded-2xl p-6 mb-4 ${tier.bg}`}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{tier.icon}</span>
          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${tier.badge}`}>
              {analysis.comparison.tier}
            </span>
          </div>
        </div>
        <p className={`text-lg font-semibold ${tier.text}`}>
          {tier.summary}
        </p>
        {analysis.comparison.premiumPercent && (
          <p className={`text-sm mt-2 ${tier.text}`}>
            报价比市场参考区间上限高出约 {analysis.comparison.premiumPercent[0]}% - {analysis.comparison.premiumPercent[1]}%
          </p>
        )}
      </div>

      {/* Repair Content Summary */}
      <ReportSection title="维修内容">
        <div className="flex flex-wrap gap-2 mb-2">
          {analysis.selectedItems.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700"
            >
              {item.name}
              {item.isCustom && (
                <span className="ml-1 text-slate-400">(自定义)</span>
              )}
            </span>
          ))}
        </div>
        <p className="text-sm text-slate-500">
          {analysis.categoryName}{analysis.modelNumber ? ` · 型号 ${analysis.modelNumber}` : ''}
        </p>
      </ReportSection>

      {/* Cost Breakdown */}
      {!analysis.noDataAvailable && (
        <ReportSection title="费用明细">
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">零件成本</span>
              <span className="font-medium text-slate-700">
                {formatRange(analysis.costBreakdown.partsRange)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">人工费用</span>
              <span className="font-medium text-slate-700">
                {formatRange(analysis.costBreakdown.laborRange)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">上门费用</span>
              <span className="font-medium text-slate-700">
                {formatRange(analysis.costBreakdown.visitFeeRange)}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-2.5 flex justify-between text-sm">
              <span className="text-slate-700 font-semibold">合理总价区间</span>
              <span className="font-bold text-slate-800">
                {formatRange(analysis.costBreakdown.totalRange)}
              </span>
            </div>
          </div>
        </ReportSection>
      )}

      {/* Market Reference Range */}
      <ReportSection title="市场参考区间" variant="highlight">
        {analysis.noDataAvailable ? (
          <p className="text-amber-700 text-sm">
            暂未收录该维修项目的市场价格，请谨慎参考，并建议咨询品牌官方售后。
          </p>
        ) : (
          <>
            <p className="text-2xl font-bold text-brand-700 mb-1">
              {formatRange(analysis.costBreakdown.totalRange)}
            </p>
            <p className="text-xs text-slate-500">基于市场公开数据，仅供参考</p>
            {analysis.costBreakdown.hasUnknownItems && (
              <p className="text-xs text-amber-600 mt-2">
                ⚠ 部分维修项目未收录，该区间仅基于已收录项目计算
              </p>
            )}
          </>
        )}
      </ReportSection>

      {/* Quote Comparison */}
      {!analysis.noDataAvailable && (
        <ReportSection title="报价对比">
          <div className="mb-3">
            <div className="flex items-end gap-2 mb-1">
              <span className="text-3xl font-bold text-slate-800">
                ¥{analysis.userQuote.toLocaleString()}
              </span>
              <span className="text-sm text-slate-400">您的报价</span>
            </div>
            <div className="text-sm text-slate-500">
              市场参考区间：{formatRange(analysis.costBreakdown.totalRange)}
            </div>
          </div>
          {analysis.comparison.premiumAmount && (
            <div className="text-sm space-y-1">
              <p className="text-red-600 font-medium">
                溢价约 ¥{analysis.comparison.premiumAmount[0].toLocaleString()} - ¥{analysis.comparison.premiumAmount[1].toLocaleString()}
              </p>
              <p className="text-red-600 font-medium">
                溢价比例约 {analysis.comparison.premiumPercent![0]}% - {analysis.comparison.premiumPercent![1]}%
              </p>
            </div>
          )}
          {/* Visual bar */}
          <div className="mt-3 h-2 bg-slate-200 rounded-full relative overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-brand-400 rounded-full"
              style={{
                width: `${Math.min(100, (analysis.costBreakdown.totalRange[1] / analysis.userQuote) * 100)}%`,
              }}
            />
          </div>
          <div className="text-xs text-slate-400 mt-1">市场参考区间占比示意</div>
        </ReportSection>
      )}

      {/* AI Analysis — content always shown */}
      <ReportSection title="AI 分析与建议" variant="highlight">
        <div className="space-y-4 text-sm">
          {aiSections.marketReference && (
            <div>
              <p className="font-medium text-slate-700 mb-1">市场参考</p>
              <p className="text-slate-600">{aiSections.marketReference}</p>
            </div>
          )}
          {aiSections.riskWarnings && (
            <div>
              <p className="font-medium text-slate-700 mb-1">风险提示</p>
              <p className="text-slate-600">{aiSections.riskWarnings}</p>
            </div>
          )}
          {aiSections.suggestions && (
            <div>
              <p className="font-medium text-slate-700 mb-1">建议</p>
              <p className="text-slate-600">{aiSections.suggestions}</p>
            </div>
          )}
          {aiSections.disclaimerNote && (
            <div>
              <p className="text-slate-500 italic text-xs">{aiSections.disclaimerNote}</p>
            </div>
          )}
        </div>
        <span className="inline-block mt-3 px-2 py-0.5 rounded text-xs bg-slate-200 text-slate-500">
          AI 生成 · 仅供参考
        </span>
      </ReportSection>

      {/* Disclaimer */}
      <ReportSection title="免责声明" variant="muted">
        <p className="text-xs text-slate-400 leading-relaxed">
          本报告仅供参考，不构成任何形式的报价承诺。实际维修价格受地区、品牌、配件来源、故障程度等因素影响。
          建议在维修前多方比价，咨询品牌官方售后服务获取更准确的价格参考。
        </p>
      </ReportSection>

      {/* Feedback */}
      <FeedbackButtons />

      {/* Start Over */}
      <div className="text-center pt-2 pb-8">
        <Button variant="ghost" onClick={handleStartOver}>
          重新分析
        </Button>
      </div>
    </div>
  );
}
