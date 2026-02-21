/**
 * 个股分析模块
 * Stock Analysis Module
 */

// 股票分析状态
const StockState = {
  currentStock: null,
  stockData: null,
  chartInstance: null
};

// 初始化个股分析模块
function initStockAnalysis() {
  console.log('初始化个股分析模块...');
  setupStockEventListeners();
}

// 设置事件监听
function setupStockEventListeners() {
  const searchBtn = document.querySelector('#stockView .search-btn');
  const stockInput = document.querySelector('#stockView .stock-input');
  
  if (searchBtn && stockInput) {
    // 搜索按钮点击
    searchBtn.addEventListener('click', () => {
      const code = stockInput.value.trim();
      if (code) {
        searchStock(code);
      }
    });
    
    // 回车搜索
    stockInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const code = stockInput.value.trim();
        if (code) {
          searchStock(code);
        }
      }
    });
  }
}

// 搜索股票
async function searchStock(code) {
  console.log('搜索股票:', code);
  
  try {
    // 显示加载状态
    showStockLoading();
    
    // 获取股票数据（模拟）
    const stockData = await getStockInfo(code);
    
    if (stockData) {
      StockState.currentStock = code;
      StockState.stockData = stockData;
      
      // 显示股票信息
      displayStockInfo(stockData);
      displayStockChart(stockData);
      displayStockIndicators(stockData);
    } else {
      showStockError('未找到股票信息');
    }
  } catch (error) {
    console.error('搜索股票失败:', error);
    showStockError('搜索失败，请稍后重试');
  }
}

// 显示加载状态
function showStockLoading() {
  const container = document.querySelector('#stockView .stock-analysis');
  if (!container) return;
  
  // 清除现有结果
  const existingResult = container.querySelector('.stock-result');
  if (existingResult) {
    existingResult.remove();
  }
  
  // 显示加载中
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'stock-loading';
  loadingDiv.innerHTML = `
    <div class="loading-spinner">
      <i class="fas fa-spinner fa-spin"></i>
      <p>正在加载股票数据...</p>
    </div>
  `;
  container.appendChild(loadingDiv);
}

// 显示错误信息
function showStockError(message) {
  const container = document.querySelector('#stockView .stock-analysis');
  if (!container) return;
  
  const loadingDiv = container.querySelector('.stock-loading');
  if (loadingDiv) {
    loadingDiv.remove();
  }
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'stock-error';
  errorDiv.innerHTML = `
    <div class="error-message">
      <i class="fas fa-exclamation-circle"></i>
      <p>${message}</p>
    </div>
  `;
  container.appendChild(errorDiv);
  
  setTimeout(() => errorDiv.remove(), 3000);
}

// 获取股票信息（模拟数据）
async function getStockInfo(code) {
  // 模拟API调用延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 模拟股票数据
  const stocks = {
    '600519': {
      code: '600519',
      name: '贵州茅台',
      market: 'SH',
      price: 1685.50,
      change: 15.30,
      changePercent: 0.92,
      open: 1670.20,
      high: 1690.00,
      low: 1668.50,
      volume: 1250000,
      amount: 2100000000,
      marketCap: 2115000000000,
      pe: 35.8,
      pb: 12.5,
      roe: 34.2
    },
    '000001': {
      code: '000001',
      name: '平安银行',
      market: 'SZ',
      price: 12.85,
      change: -0.15,
      changePercent: -1.15,
      open: 12.95,
      high: 13.05,
      low: 12.80,
      volume: 58900000,
      amount: 757000000,
      marketCap: 248900000000,
      pe: 5.2,
      pb: 0.68,
      roe: 13.1
    }
  };
  
  return stocks[code] || null;
}

// 显示股票基本信息
function displayStockInfo(stock) {
  const container = document.querySelector('#stockView .stock-analysis');
  if (!container) return;
  
  // 移除加载状态
  const loadingDiv = container.querySelector('.stock-loading');
  if (loadingDiv) {
    loadingDiv.remove();
  }
  
  // 创建或获取结果容器
  let resultDiv = container.querySelector('.stock-result');
  if (!resultDiv) {
    resultDiv = document.createElement('div');
    resultDiv.className = 'stock-result';
    container.appendChild(resultDiv);
  }
  
  const changeClass = stock.change >= 0 ? 'positive' : 'negative';
  const changeSymbol = stock.change >= 0 ? '+' : '';
  
  resultDiv.innerHTML = `
    <!-- 股票头部信息 -->
    <div class="stock-header">
      <div class="stock-title">
        <h3>${stock.name} (${stock.code})</h3>
        <span class="stock-market">${stock.market}</span>
      </div>
      <div class="stock-price-info">
        <div class="current-price ${changeClass}">¥${stock.price.toFixed(2)}</div>
        <div class="price-change ${changeClass}">
          ${changeSymbol}${stock.change.toFixed(2)} (${changeSymbol}${stock.changePercent.toFixed(2)}%)
        </div>
      </div>
    </div>
    
    <!-- 基本行情信息 -->
    <div class="stock-basics">
      <div class="basics-grid">
        <div class="basic-item">
          <span class="label">今开</span>
          <span class="value">¥${stock.open.toFixed(2)}</span>
        </div>
        <div class="basic-item">
          <span class="label">最高</span>
          <span class="value">¥${stock.high.toFixed(2)}</span>
        </div>
        <div class="basic-item">
          <span class="label">最低</span>
          <span class="value">¥${stock.low.toFixed(2)}</span>
        </div>
        <div class="basic-item">
          <span class="label">成交量</span>
          <span class="value">${formatVolume(stock.volume)}</span>
        </div>
        <div class="basic-item">
          <span class="label">成交额</span>
          <span class="value">${formatAmount(stock.amount)}</span>
        </div>
        <div class="basic-item">
          <span class="label">总市值</span>
          <span class="value">${formatAmount(stock.marketCap)}</span>
        </div>
        <div class="basic-item">
          <span class="label">市盈率</span>
          <span class="value">${stock.pe.toFixed(2)}</span>
        </div>
        <div class="basic-item">
          <span class="label">市净率</span>
          <span class="value">${stock.pb.toFixed(2)}</span>
        </div>
        <div class="basic-item">
          <span class="label">ROE</span>
          <span class="value">${stock.roe.toFixed(2)}%</span>
        </div>
      </div>
    </div>
    
    <!-- K线图容器 -->
    <div class="stock-chart-section">
      <h4><i class="fas fa-chart-candlestick"></i> K线走势</h4>
      <canvas id="stockKLineChart" width="800" height="400"></canvas>
    </div>
    
    <!-- 技术指标 -->
    <div class="stock-indicators-section">
      <h4><i class="fas fa-chart-line"></i> 技术指标</h4>
      <div class="indicators-container" id="indicatorsContainer">
        <!-- 指标将动态加载 -->
      </div>
    </div>
  `;
}

// 显示K线图（简化版Canvas实现）
function displayStockChart(stock) {
  setTimeout(() => {
    const canvas = document.getElementById('stockKLineChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    // 生成模拟K线数据（30天）
    const klineData = generateMockKLineData(stock.price, 30);
    
    // 绘制K线图
    drawKLineChart(ctx, klineData, width, height);
  }, 100);
}

// 生成模拟K线数据
function generateMockKLineData(currentPrice, days) {
  const data = [];
  let basePrice = currentPrice * 0.9; // 从90%的当前价开始
  
  for (let i = 0; i < days; i++) {
    const volatility = basePrice * 0.03; // 3%波动
    const open = basePrice + (Math.random() - 0.5) * volatility;
    const close = open + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    
    data.push({
      date: getDateStr(i - days + 1),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(500000 + Math.random() * 1000000)
    });
    
    basePrice = close * (0.98 + Math.random() * 0.04); // 逐渐趋向当前价
  }
  
  // 最后一天设为当前价
  data[data.length - 1].close = currentPrice;
  
  return data;
}

// 获取日期字符串
function getDateStr(daysOffset) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${month}-${day}`;
}

// 绘制K线图
function drawKLineChart(ctx, data, width, height) {
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  // 计算价格范围
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  data.forEach(item => {
    minPrice = Math.min(minPrice, item.low);
    maxPrice = Math.max(maxPrice, item.high);
  });
  
  const priceRange = maxPrice - minPrice;
  const candleWidth = chartWidth / data.length * 0.6;
  const gap = chartWidth / data.length * 0.4;
  
  // 绘制背景网格
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = padding + (chartHeight / 5) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }
  
  // 绘制K线
  data.forEach((item, index) => {
    const x = padding + (candleWidth + gap) * index + gap / 2;
    const openY = padding + chartHeight - ((item.open - minPrice) / priceRange) * chartHeight;
    const closeY = padding + chartHeight - ((item.close - minPrice) / priceRange) * chartHeight;
    const highY = padding + chartHeight - ((item.high - minPrice) / priceRange) * chartHeight;
    const lowY = padding + chartHeight - ((item.low - minPrice) / priceRange) * chartHeight;
    
    const isRising = item.close >= item.open;
    ctx.strokeStyle = isRising ? '#f44336' : '#4caf50';
    ctx.fillStyle = isRising ? '#f44336' : '#4caf50';
    
    // 绘制上下影线
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + candleWidth / 2, highY);
    ctx.lineTo(x + candleWidth / 2, lowY);
    ctx.stroke();
    
    // 绘制实体
    const bodyHeight = Math.abs(closeY - openY);
    const bodyY = Math.min(openY, closeY);
    
    if (bodyHeight < 1) {
      // 十字星
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, openY);
      ctx.lineTo(x + candleWidth, openY);
      ctx.stroke();
    } else {
      // 实体K线
      ctx.fillRect(x, bodyY, candleWidth, bodyHeight);
    }
  });
  
  // 绘制Y轴价格标签
  ctx.fillStyle = '#666';
  ctx.font = '12px Arial';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 5; i++) {
    const price = minPrice + (priceRange / 5) * i;
    const y = padding + chartHeight - (chartHeight / 5) * i;
    ctx.fillText(price.toFixed(2), padding - 5, y + 4);
  }
  
  // 绘制X轴日期标签（每5天）
  ctx.textAlign = 'center';
  data.forEach((item, index) => {
    if (index % 5 === 0 || index === data.length - 1) {
      const x = padding + (candleWidth + gap) * index + candleWidth / 2;
      ctx.fillText(item.date, x, height - padding + 20);
    }
  });
}

// 显示技术指标
function displayStockIndicators(stock) {
  const container = document.getElementById('indicatorsContainer');
  if (!container) return;
  
  // 计算技术指标（简化版）
  const indicators = calculateIndicators(stock);
  
  container.innerHTML = `
    <div class="indicator-card">
      <div class="indicator-name">MA5</div>
      <div class="indicator-value">${indicators.ma5.toFixed(2)}</div>
    </div>
    <div class="indicator-card">
      <div class="indicator-name">MA10</div>
      <div class="indicator-value">${indicators.ma10.toFixed(2)}</div>
    </div>
    <div class="indicator-card">
      <div class="indicator-name">MA20</div>
      <div class="indicator-value">${indicators.ma20.toFixed(2)}</div>
    </div>
    <div class="indicator-card">
      <div class="indicator-name">RSI(14)</div>
      <div class="indicator-value ${indicators.rsi > 70 ? 'overbought' : indicators.rsi < 30 ? 'oversold' : ''}">${indicators.rsi.toFixed(2)}</div>
      <div class="indicator-status">${indicators.rsi > 70 ? '超买' : indicators.rsi < 30 ? '超卖' : '正常'}</div>
    </div>
  `;
}

// 计算技术指标
function calculateIndicators(stock) {
  // 这里使用简化的计算，实际应该基于历史数据
  const price = stock.price;
  
  return {
    ma5: price * (0.98 + Math.random() * 0.04),
    ma10: price * (0.96 + Math.random() * 0.08),
    ma20: price * (0.94 + Math.random() * 0.12),
    rsi: 40 + Math.random() * 40 // 模拟RSI在40-80之间
  };
}

// 格式化成交量
function formatVolume(volume) {
  if (volume >= 100000000) {
    return (volume / 100000000).toFixed(2) + '亿';
  } else if (volume >= 10000) {
    return (volume / 10000).toFixed(2) + '万';
  }
  return volume.toString();
}

// 格式化金额
function formatAmount(amount) {
  if (amount >= 100000000) {
    return (amount / 100000000).toFixed(2) + '亿';
  } else if (amount >= 10000) {
    return (amount / 10000).toFixed(2) + '万';
  }
  return amount.toString();
}

// 导出初始化函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initStockAnalysis };
}
