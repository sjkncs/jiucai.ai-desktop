/**
 * API接口模块
 */

// API配置
const API_CONFIG = {
  baseURL: 'http://localhost:3001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// 调用AI API
async function callAIAPI(message) {
  try {
    // 模拟API调用 - 实际应用中替换为真实API
    const response = await simulateAIResponse(message);
    return response;
    
    // 真实API调用示例:
    /*
    const response = await fetch(`${API_CONFIG.baseURL}/chat`, {
      method: 'POST',
      headers: API_CONFIG.headers,
      body: JSON.stringify({
        message: message,
        chatId: AppState.currentChatId,
        context: getConversationContext()
      })
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.response;
    */
    
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// 模拟AI响应（开发用）
async function simulateAIResponse(message) {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // 股票相关问题
  if (message.includes('股票') || message.includes('行情') || message.includes('涨跌')) {
    return generateStockResponse(message);
  }
  
  // 技术分析问题
  if (message.includes('技术分析') || message.includes('指标') || message.includes('K线')) {
    return generateTechnicalAnalysisResponse();
  }
  
  // 投资建议
  if (message.includes('建议') || message.includes('买入') || message.includes('卖出')) {
    return generateInvestmentAdviceResponse();
  }
  
  // 默认响应
  return generateDefaultResponse(message);
}

// 生成股票响应
function generateStockResponse(message) {
  const responses = [
    `我已经帮您分析了相关股票的行情数据。

**市场概况：**
- 沪深300指数：3,825.42 (+1.23%)
- 上证指数：3,125.67 (+0.89%)
- 创业板指：2,456.78 (+1.45%)

**热门板块：**
1. 新能源汽车 (+3.2%)
2. 人工智能 (+2.8%)
3. 医疗健康 (+2.1%)

需要查看具体股票的详细分析吗？`,

    `根据最新的市场数据分析：

📈 **市场趋势**
当前市场整体呈现震荡上行态势，成交量温和放大。

💡 **投资机会**
- 关注科技板块的龙头股
- 注意防御性板块的配置
- 控制仓位，分散风险

⚠️ **风险提示**
市场波动加大，建议控制好止损位。`,
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// 生成技术分析响应
function generateTechnicalAnalysisResponse() {
  return `为您提供专业的技术分析：

**MACD指标：**
- DIF线：0.125
- DEA线：0.089
- MACD柱：+0.036（金叉形态）

**KDJ指标：**
- K值：65.3
- D值：58.7
- J值：78.5（超买区域）

**建议：**
短期技术面偏多，但需注意KDJ已进入超买区域，建议等待回调后再入场。

**支撑位：** 3,800点
**压力位：** 3,900点`;
}

// 生成投资建议响应
function generateInvestmentAdviceResponse() {
  return `⚠️ **重要提示：**
以下内容仅供参考，不构成投资建议。投资有风险，入市需谨慎。

**分析建议：**

1. **仓位管理**
   - 建议保持6-7成仓位
   - 预留资金应对回调

2. **板块配置**
   - 40%：成长股（科技、新能源）
   - 30%：价值股（金融、消费）
   - 30%：防御股（医药、公用事业）

3. **操作策略**
   - 逢低分批建仓
   - 设置合理止损位
   - 避免追涨杀跌

需要了解具体股票的投资逻辑吗？`;
}

// 生成默认响应
function generateDefaultResponse(message) {
  const responses = [
    `您好！我是久财AI智能助手，专注于股票分析和投资决策支持。

我可以帮您：
- 📊 分析股票行情和技术指标
- 💹 提供投资建议和风险提示
- 📈 监控市场动态和热点板块
- 🎯 制定投资策略和资产配置

有什么问题请随时问我！`,

    `我理解您的问题。让我为您详细分析一下。

${message.length > 10 ? '根据您提到的内容' : '关于这个话题'}，我建议您可以从以下几个方面考虑：

1. 基本面分析：公司财务状况、行业地位
2. 技术面分析：K线形态、技术指标
3. 市场情绪：资金流向、舆情分析

需要我详细展开某个方面吗？`,

    `这是一个很好的问题！

作为AI助手，我会基于：
- 📊 实时市场数据
- 🤖 机器学习模型
- 📈 历史数据分析

为您提供专业的投资参考。

您想了解哪方面的详细信息？`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// 获取对话上下文
function getConversationContext() {
  const chat = AppState.chatHistory.find(c => c.id === AppState.currentChatId);
  if (!chat) return [];
  
  // 返回最近5条消息作为上下文
  return chat.messages.slice(-5).map(msg => ({
    role: msg.role,
    content: msg.content
  }));
}

// 获取股票实时数据
async function getStockData(symbol) {
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/stocks/${symbol}`);
    if (!response.ok) throw new Error('Failed to fetch stock data');
    return await response.json();
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return null;
  }
}

// 获取技术指标
async function getTechnicalIndicators(symbol) {
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/indicators/${symbol}`);
    if (!response.ok) throw new Error('Failed to fetch indicators');
    return await response.json();
  } catch (error) {
    console.error('Error fetching indicators:', error);
    return null;
  }
}

// 获取市场概览数据
async function getMarketOverview() {
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/market/overview`);
    if (!response.ok) throw new Error('Failed to fetch market data');
    return await response.json();
  } catch (error) {
    console.error('Error fetching market data:', error);
    // 返回模拟数据
    return {
      indices: [
        { name: '上证指数', code: 'sh000001', value: 3125.67, change: 0.89, volume: '2345亿' },
        { name: '深证成指', code: 'sz399001', value: 10234.56, change: 1.12, volume: '3456亿' },
        { name: '创业板指', code: 'sz399006', value: 2456.78, change: 1.45, volume: '1234亿' },
        { name: '沪深300', code: 'sh000300', value: 3825.42, change: 1.23, volume: '1567亿' }
      ],
      timestamp: new Date().toISOString()
    };
  }
}

// 搜索股票
async function searchStock(query) {
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to search stock');
    return await response.json();
  } catch (error) {
    console.error('Error searching stock:', error);
    // 返回模拟搜索结果
    return {
      results: [
        { symbol: '600519', name: '贵州茅台', market: 'sh' },
        { symbol: '000858', name: '五粮液', market: 'sz' },
        { symbol: '600036', name: '招商银行', market: 'sh' }
      ]
    };
  }
}
