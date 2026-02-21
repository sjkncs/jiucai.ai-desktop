/**
 * 市场行情模块
 * Market Data Module
 */

// 市场数据状态
const MarketState = {
  indices: [],
  sectors: [],
  topGainers: [],
  topLosers: [],
  updateInterval: null,
  refreshRate: 5000, // 5秒刷新一次
  isRealtime: true
};

// 初始化市场模块
function initMarket() {
  console.log('初始化市场行情模块...');
  loadMarketSettings();
  loadInitialMarketData();
  setupMarketEventListeners();
  
  if (MarketState.isRealtime) {
    startAutoRefresh();
  }
}

// 加载市场设置
function loadMarketSettings() {
  const settings = JSON.parse(localStorage.getItem('jiucai_settings') || '{}');
  MarketState.refreshRate = (settings.refreshRate || 30) * 1000;
  MarketState.isRealtime = settings.realtimeData !== false;
}

// 加载初始市场数据
function loadInitialMarketData() {
  // 初始化主要指数数据
  MarketState.indices = [
    {
      code: '000001',
      name: '上证指数',
      price: 3125.67,
      change: 27.89,
      changePercent: 0.90,
      volume: 298500000000,
      lastUpdate: Date.now()
    },
    {
      code: '399001',
      name: '深证成指',
      price: 10234.56,
      change: 113.45,
      changePercent: 1.12,
      volume: 385600000000,
      lastUpdate: Date.now()
    },
    {
      code: '399006',
      name: '创业板指',
      price: 2456.78,
      change: 35.12,
      changePercent: 1.45,
      volume: 156800000000,
      lastUpdate: Date.now()
    },
    {
      code: '000300',
      name: '沪深300',
      price: 3825.42,
      change: 46.53,
      changePercent: 1.23,
      volume: 225400000000,
      lastUpdate: Date.now()
    }
  ];
  
  // 初始化热门板块
  MarketState.sectors = [
    { name: '人工智能', change: 3.45, stocks: 156 },
    { name: '新能源车', change: 2.87, stocks: 234 },
    { name: '芯片半导体', change: 2.34, stocks: 189 },
    { name: '医药生物', change: -1.23, stocks: 267 },
    { name: '房地产', change: -2.15, stocks: 145 }
  ];
  
  updateMarketDisplay();
}

// 更新市场显示
function updateMarketDisplay() {
  updateIndicesDisplay();
  updateSectorsDisplay();
}

// 更新指数显示
function updateIndicesDisplay() {
  const container = document.querySelector('.market-indicators');
  if (!container) return;
  
  container.innerHTML = MarketState.indices.map(index => {
    const changeClass = index.change >= 0 ? 'positive' : 'negative';
    const changeSymbol = index.change >= 0 ? '+' : '';
    
    return `
      <div class="indicator-card ${changeClass}" data-code="${index.code}">
        <div class="indicator-label">${index.name}</div>
        <div class="indicator-value">${index.price.toFixed(2)}</div>
        <div class="indicator-change ${changeClass}">
          ${changeSymbol}${index.changePercent.toFixed(2)}%
        </div>
        <div class="indicator-volume">成交额: ${formatVolume(index.volume)}</div>
      </div>
    `;
  }).join('');
}

// 更新板块显示
function updateSectorsDisplay() {
  const sectorsContainer = document.querySelector('.market-sectors');
  if (!sectorsContainer) return;
  
  sectorsContainer.innerHTML = `
    <h3><i class="fas fa-chart-pie"></i> 热门板块</h3>
    <div class="sectors-list">
      ${MarketState.sectors.map(sector => {
        const changeClass = sector.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = sector.change >= 0 ? '+' : '';
        return `
          <div class="sector-item">
            <span class="sector-name">${sector.name}</span>
            <span class="sector-stocks">${sector.stocks}只</span>
            <span class="sector-change ${changeClass}">
              ${changeSymbol}${sector.change.toFixed(2)}%
            </span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// 格式化成交量
function formatVolume(volume) {
  if (volume >= 100000000) {
    return (volume / 100000000).toFixed(0) + '亿';
  } else if (volume >= 10000) {
    return (volume / 10000).toFixed(0) + '万';
  }
  return volume.toString();
}

// 模拟数据更新
function simulateMarketUpdate() {
  // 更新指数数据
  MarketState.indices = MarketState.indices.map(index => {
    // 生成小幅度随机波动 (-0.3% 到 +0.3%)
    const changePercent = (Math.random() - 0.5) * 0.6;
    const priceChange = index.price * (changePercent / 100);
    const newPrice = index.price + priceChange;
    
    // 累计涨跌
    const basePrice = newPrice / (1 + index.changePercent / 100);
    const newChange = newPrice - basePrice;
    const newChangePercent = (newChange / basePrice) * 100;
    
    // 成交额也小幅波动
    const volumeChange = (Math.random() - 0.5) * 0.1;
    const newVolume = index.volume * (1 + volumeChange);
    
    return {
      ...index,
      price: newPrice,
      change: newChange,
      changePercent: newChangePercent,
      volume: newVolume,
      lastUpdate: Date.now()
    };
  });
  
  // 更新板块数据
  MarketState.sectors = MarketState.sectors.map(sector => {
    const changeAdjust = (Math.random() - 0.5) * 0.2;
    return {
      ...sector,
      change: sector.change + changeAdjust
    };
  });
  
  // 添加动画效果
  animateMarketUpdate();
  
  // 更新显示
  updateMarketDisplay();
}

// 动画效果
function animateMarketUpdate() {
  const cards = document.querySelectorAll('.indicator-card');
  cards.forEach(card => {
    card.classList.add('updating');
    setTimeout(() => {
      card.classList.remove('updating');
    }, 300);
  });
}

// 开始自动刷新
function startAutoRefresh() {
  if (MarketState.updateInterval) {
    clearInterval(MarketState.updateInterval);
  }
  
  MarketState.updateInterval = setInterval(() => {
    simulateMarketUpdate();
  }, MarketState.refreshRate);
  
  console.log(`市场数据自动刷新已启动，间隔: ${MarketState.refreshRate / 1000}秒`);
}

// 停止自动刷新
function stopAutoRefresh() {
  if (MarketState.updateInterval) {
    clearInterval(MarketState.updateInterval);
    MarketState.updateInterval = null;
    console.log('市场数据自动刷新已停止');
  }
}

// 设置事件监听
function setupMarketEventListeners() {
  // 监听刷新率设置变化
  window.addEventListener('storage', (e) => {
    if (e.key === 'jiucai_settings') {
      loadMarketSettings();
      if (MarketState.isRealtime) {
        startAutoRefresh();
      } else {
        stopAutoRefresh();
      }
    }
  });
  
  // 监听页面可见性
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoRefresh();
    } else if (MarketState.isRealtime) {
      startAutoRefresh();
      simulateMarketUpdate(); // 立即更新一次
    }
  });
}

// 手动刷新
function refreshMarketData() {
  console.log('手动刷新市场数据...');
  simulateMarketUpdate();
  
  // 显示刷新提示
  const container = document.querySelector('.market-overview');
  if (container) {
    const toast = document.createElement('div');
    toast.className = 'refresh-toast';
    toast.innerHTML = '<i class="fas fa-sync-alt"></i> 数据已刷新';
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 2000);
  }
}

// 获取指数详情
function getIndexDetail(code) {
  return MarketState.indices.find(index => index.code === code);
}

// 切换实时更新
function toggleRealtimeUpdate(enabled) {
  MarketState.isRealtime = enabled;
  
  if (enabled) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
  
  // 保存设置
  const settings = JSON.parse(localStorage.getItem('jiucai_settings') || '{}');
  settings.realtimeData = enabled;
  localStorage.setItem('jiucai_settings', JSON.stringify(settings));
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initMarket,
    refreshMarketData,
    toggleRealtimeUpdate,
    getIndexDetail
  };
}
