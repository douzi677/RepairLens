/**
 * Vercel Edge Function — RepairLens AI Analysis
 *
 * Receives pre-calculated price analysis data and generates
 * natural-language explanations via Claude API.
 *
 * CRITICAL: The AI NEVER calculates or fabricates prices.
 * All price data is pre-computed by the engine and passed in.
 */

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

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

function buildUserPrompt(data) {
  const {
    category,
    modelNumber,
    items,
    userQuote,
    partsRange,
    laborRange,
    visitFeeRange,
    totalRange,
    tier,
    premiumAmount,
    premiumPercent,
    noDataAvailable,
    hasUnknownItems,
  } = data;

  let prompt = `## 本次维修分析数据

**家电品类**：${category}
**设备型号**：${modelNumber}
**维修项目**：${items.join('、')}
**用户报价**：¥${userQuote}

`;

  if (noDataAvailable) {
    prompt += `**重要**：该维修项目暂无市场价格数据。

请基于此情况生成分析报告：
`;
  } else {
    prompt += `## 系统计算的费用区间
**零件成本**：¥${partsRange[0]} - ¥${partsRange[1]}
**人工费用**：¥${laborRange[0]} - ¥${laborRange[1]}
**上门费用**：¥${visitFeeRange[0]} - ¥${visitFeeRange[1]}
**合理总价区间**：¥${totalRange[0]} - ¥${totalRange[1]}

## 报价对比
**判定结果**：${tier}
`;

    if (premiumAmount) {
      prompt += `**溢价金额**：¥${premiumAmount[0]} - ¥${premiumAmount[1]}
**溢价比例**：${premiumPercent[0]}% - ${premiumPercent[1]}%
`;
    }

    if (hasUnknownItems) {
      prompt += `
**注意**：部分维修项目未收录在价格数据库中，以上区间仅基于已收录项目计算。
`;
    }
  }

  prompt += `
请根据以上数据生成分析报告的4个字段（marketReference, riskWarnings, suggestions, disclaimerNote），直接返回JSON。`;

  return prompt;
}

export default async function handler(req) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    console.error('CLAUDE_API_KEY not configured');
    return new Response(
      JSON.stringify({
        marketReference: 'AI 分析服务未配置，以下为通用建议。',
        riskWarnings: '维修过程中请确认所有费用明细，索要正规发票。',
        suggestions: '建议多方比价，咨询品牌官方售后获取参考价格。',
        disclaimerNote: 'AI 服务暂时不可用。',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const body = await req.json();
    const userPrompt = buildUserPrompt(body);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 800,
        temperature: 0.3,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const result = await response.json();
    const text = result.content?.[0]?.text || '';

    // Parse JSON from the response
    let parsed;
    try {
      // Strip any potential markdown code fences
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // If parsing fails, return fallback
      throw new Error('Failed to parse AI response as JSON');
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('AI analysis error:', error.message);

    // Return graceful fallback
    return new Response(
      JSON.stringify({
        marketReference: '暂无法生成个性化分析，请参考以上市场数据。',
        riskWarnings: '建议在维修前与师傅确认所有费用明细，了解是否包含额外服务费。',
        suggestions: '如需更准确的价格参考，建议致电品牌官方售后服务中心。',
        disclaimerNote: 'AI 分析暂时不可用，以上为通用建议。',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
