import type { AnalysisResult, AIReportSections } from '../types';

// === Fallback text (used when AI is completely unavailable) ===

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

// === System Prompt (shared with Edge Function) ===

const SYSTEM_PROMPT = `你是RepairLens的家电维修报价分析助手。你的职责是帮助用户理解维修报价是否合理。

## 严格规则
1. 你收到的所有价格数据已经过系统计算，你只需解释这些数据，不得修改、质疑或补充任何价格数字。
2. 绝对禁止编造任何价格、市场行情、维修数据。如果用户提供的维修项目无匹配数据，如实告知"无参考数据"。
3. 你的回答必须是纯JSON格式，不包含markdown代码块或其他格式。直接输出JSON对象。
4. 语气要求：专业但不冰冷，友善但不油滑。站在消费者角度提供建议，但不抹黑维修行业。
5. 每个回答字段控制在150字以内，简洁有力。
6. 维修师傅的合理利润应该被尊重，只帮助识别明显不合理的溢价。
7. 根据溢价程度给出分级建议：合理→"可以放心维修"；略高→"可以考虑接受或议价"；偏高→"建议多方比价"；严重偏高→"建议拒绝并联系品牌售后"。

## 输出格式
返回严格的JSON对象，不要有任何其他内容：
{
  "marketReference": "对市场参考区间的通俗解释，用用户可以理解的语言说明价格构成",
  "riskWarnings": "针对该品类和维修项目的具体风险提示，如涉及额外费用或常见以次充好情况",
  "suggestions": "根据溢价程度给出具体、可执行的下一步建议",
  "disclaimerNote": "针对本次分析的个性化补充说明"
}`;

// === Prompt Builder ===

function buildPrompt(analysis: AnalysisResult): string {
  const {
    categoryName,
    modelNumber,
    selectedItems,
    userQuote,
    costBreakdown,
    comparison,
    noDataAvailable,
  } = analysis;

  let prompt = `## 本次维修分析数据

**家电品类**：${categoryName}
**设备型号**：${modelNumber || '未提供'}
**维修项目**：${selectedItems.map((i) => i.name).join('、')}
**用户报价**：¥${userQuote}

`;

  if (noDataAvailable) {
    prompt += `**重要**：该维修项目暂无市场价格数据。

请基于此情况生成分析报告：`;
  } else {
    prompt += `## 系统计算的费用区间
**零件成本**：¥${costBreakdown.partsRange[0]} - ¥${costBreakdown.partsRange[1]}
**人工费用**：¥${costBreakdown.laborRange[0]} - ¥${costBreakdown.laborRange[1]}
**上门费用**：¥${costBreakdown.visitFeeRange[0]} - ¥${costBreakdown.visitFeeRange[1]}
**合理总价区间**：¥${costBreakdown.totalRange[0]} - ¥${costBreakdown.totalRange[1]}

## 报价对比
**判定结果**：${comparison.tier}
`;

    if (comparison.premiumAmount) {
      prompt += `**溢价金额**：¥${comparison.premiumAmount[0]} - ¥${comparison.premiumAmount[1]}
**溢价比例**：${comparison.premiumPercent![0]}% - ${comparison.premiumPercent![1]}%
`;
    }

    if (costBreakdown.hasUnknownItems) {
      prompt += `
**注意**：部分维修项目未收录在价格数据库中，以上区间仅基于已收录项目计算。`;
    }
  }

  prompt += `
请根据以上数据生成分析报告的4个字段（marketReference, riskWarnings, suggestions, disclaimerNote），直接返回JSON。`;

  return prompt;
}

function parseAIResponse(text: string): AIReportSections {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

// === Primary: via Edge Function (production) ===

async function fetchViaEdgeFunction(
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
    throw new Error(`Edge Function returned ${response.status}`);
  }

  return response.json();
}

// === Fallback: direct DashScope call (local dev) ===

const DASHSCOPE_API_URL =
  'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

async function fetchViaDashScopeDirect(
  analysis: AnalysisResult,
  apiKey: string
): Promise<AIReportSections> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  const response = await fetch(DASHSCOPE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'qwen-plus',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildPrompt(analysis) },
      ],
      max_tokens: 800,
      temperature: 0.3,
    }),
    signal: controller.signal,
  });

  clearTimeout(timeout);

  if (!response.ok) {
    throw new Error(`DashScope API error: ${response.status}`);
  }

  const result = await response.json();
  const text = result.choices?.[0]?.message?.content || '';
  return parseAIResponse(text);
}

// === Public API ===

export async function fetchAIReport(
  analysis: AnalysisResult
): Promise<AIReportSections> {
  // 1. Try Edge Function first (production / vercel dev)
  try {
    return await fetchViaEdgeFunction(analysis);
  } catch (edgeError) {
    console.warn('Edge Function unavailable, trying direct DashScope call...');
  }

  // 2. Fallback: direct DashScope call (local dev with VITE_DASHSCOPE_API_KEY)
  const localKey = import.meta.env.VITE_DASHSCOPE_API_KEY;
  if (localKey) {
    try {
      return await fetchViaDashScopeDirect(analysis, localKey);
    } catch (directError) {
      console.error('Direct DashScope call failed:', directError);
    }
  }

  // 3. Hard fallback: static template text
  return FALLBACK_AI_SECTIONS;
}
