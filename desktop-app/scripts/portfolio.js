/**
 * 投资组合模块
 * Portfolio Management Module
 */

// 投资组合状态
const PortfolioState = {
  holdings: [],
  totalValue: 0,
  totalCost: 0,
  totalProfit: 0
};

// 初始化投资组合模块
function initPortfolio() {
  console.log('初始化投资组合模块...');
  loadPortfolioData();
  setupPortfolioEventListeners();
  renderPortfolio();
}

// 加载投资组合数据
function loadPortfolioData() {
  const savedData = localStorage.getItem('jiucai_portfolio');
  if (savedData) {
    try {
      PortfolioState.holdings = JSON.parse(savedData);
      calculatePortfolioTotals();
    } catch (error) {
      console.error('加载投资组合数据失败:', error);
      PortfolioState.holdings = [];
    }
  }
}

// 保存投资组合数据
function savePortfolioData() {
  localStorage.setItem('jiucai_portfolio', JSON.stringify(PortfolioState.holdings));
  calculatePortfolioTotals();
  renderPortfolio();
}

// 计算投资组合总计
function calculatePortfolioTotals() {
  let totalValue = 0;
  let totalCost = 0;
  
  PortfolioState.holdings.forEach(holding => {
    const currentValue = holding.currentPrice * holding.quantity;
    const cost = holding.costPrice * holding.quantity;
    totalValue += currentValue;
    totalCost += cost;
  });
  
  PortfolioState.totalValue = totalValue;
  PortfolioState.totalCost = totalCost;
  PortfolioState.totalProfit = totalValue - totalCost;
}

// 设置事件监听
function setupPortfolioEventListeners() {
  const addBtn = document.getElementById('addHoldingBtn');
  if (addBtn) {
    addBtn.addEventListener('click', showAddHoldingDialog);
  }
}

// 渲染投资组合
function renderPortfolio() {
  const container = document.querySelector('#portfolioView .portfolio-management');
  if (!container) return;
  
  // 清空现有内容（保留标题）
  const existingContent = container.querySelector('.portfolio-content');
  if (existingContent) {
    existingContent.remove();
  }
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'portfolio-content';
  
  if (PortfolioState.holdings.length === 0) {
    contentDiv.innerHTML = `
      <div class="empty-portfolio">
        <i class="fas fa-briefcase"></i>
        <p>您还没有添加任何持仓</p>
        <button class="add-holding-btn" id="addHoldingBtn">
          <i class="fas fa-plus"></i> 添加持仓
        </button>
      </div>
    `;
  } else {
    const profitPercent = (PortfolioState.totalProfit / PortfolioState.totalCost) * 100;
    const profitClass = PortfolioState.totalProfit >= 0 ? 'positive' : 'negative';
    
    contentDiv.innerHTML = `
      <!-- 组合摘要 -->
      <div class="portfolio-summary">
        <div class="summary-card">
          <div class="summary-label">总市值</div>
          <div class="summary-value">¥${PortfolioState.totalValue.toFixed(2)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">总成本</div>
          <div class="summary-value">¥${PortfolioState.totalCost.toFixed(2)}</div>
        </div>
        <div class="summary-card ${profitClass}">
          <div class="summary-label">总盈亏</div>
          <div class="summary-value">¥${PortfolioState.totalProfit.toFixed(2)}</div>
          <div class="summary-percent">${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(2)}%</div>
        </div>
      </div>
      
      <!-- 持仓列表 -->
      <div class="holdings-section">
        <div class="section-header">
          <h3><i class="fas fa-list"></i> 持仓明细</h3>
          <button class="add-holding-btn" id="addHoldingBtn">
            <i class="fas fa-plus"></i> 添加持仓
          </button>
        </div>
        
        <table class="holdings-table">
          <thead>
            <tr>
              <th>股票代码</th>
              <th>股票名称</th>
              <th>持仓数量</th>
              <th>成本价</th>
              <th>现价</th>
              <th>市值</th>
              <th>盈亏</th>
              <th>盈亏比例</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${PortfolioState.holdings.map(holding => renderHoldingRow(holding)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
  
  container.appendChild(contentDiv);
  
  // 重新绑定事件
  setupPortfolioEventListeners();
  
  // 绑定删除按钮
  document.querySelectorAll('.delete-holding-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const code = e.currentTarget.dataset.code;
      deleteHolding(code);
    });
  });
}

// 渲染持仓行
function renderHoldingRow(holding) {
  const currentValue = holding.currentPrice * holding.quantity;
  const cost = holding.costPrice * holding.quantity;
  const profit = currentValue - cost;
  const profitPercent = (profit / cost) * 100;
  const profitClass = profit >= 0 ? 'positive' : 'negative';
  
  return `
    <tr>
      <td>${holding.code}</td>
      <td>${holding.name}</td>
      <td>${holding.quantity}</td>
      <td>¥${holding.costPrice.toFixed(2)}</td>
      <td>¥${holding.currentPrice.toFixed(2)}</td>
      <td>¥${currentValue.toFixed(2)}</td>
      <td class="${profitClass}">¥${profit.toFixed(2)}</td>
      <td class="${profitClass}">${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(2)}%</td>
      <td>
        <button class="delete-holding-btn" data-code="${holding.code}" title="删除">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `;
}

// 显示添加持仓对话框
function showAddHoldingDialog() {
  const dialogHTML = `
    <div class="modal-overlay" id="addHoldingModal">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3><i class="fas fa-plus-circle"></i> 添加持仓</h3>
          <button class="modal-close" onclick="closeAddHoldingDialog()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form id="addHoldingForm">
            <div class="form-group">
              <label>股票代码</label>
              <input type="text" id="holdingCode" required placeholder="例如: 600519">
            </div>
            <div class="form-group">
              <label>股票名称</label>
              <input type="text" id="holdingName" required placeholder="例如: 贵州茅台">
            </div>
            <div class="form-group">
              <label>持仓数量</label>
              <input type="number" id="holdingQuantity" required placeholder="例如: 100" min="1">
            </div>
            <div class="form-group">
              <label>成本价</label>
              <input type="number" id="holdingCostPrice" required placeholder="例如: 1650.50" step="0.01" min="0">
            </div>
            <div class="form-group">
              <label>现价</label>
              <input type="number" id="holdingCurrentPrice" required placeholder="例如: 1685.50" step="0.01" min="0">
            </div>
            <div class="form-actions">
              <button type="button" class="btn-secondary" onclick="closeAddHoldingDialog()">取消</button>
              <button type="submit" class="btn-primary">添加</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', dialogHTML);
  
  const form = document.getElementById('addHoldingForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    addHolding();
  });
}

// 关闭添加持仓对话框
function closeAddHoldingDialog() {
  const modal = document.getElementById('addHoldingModal');
  if (modal) {
    modal.remove();
  }
}

// 添加持仓
function addHolding() {
  const code = document.getElementById('holdingCode').value.trim();
  const name = document.getElementById('holdingName').value.trim();
  const quantity = parseInt(document.getElementById('holdingQuantity').value);
  const costPrice = parseFloat(document.getElementById('holdingCostPrice').value);
  const currentPrice = parseFloat(document.getElementById('holdingCurrentPrice').value);
  
  // 检查是否已存在
  const existingIndex = PortfolioState.holdings.findIndex(h => h.code === code);
  
  const holding = {
    code,
    name,
    quantity,
    costPrice,
    currentPrice,
    addedDate: new Date().toISOString()
  };
  
  if (existingIndex >= 0) {
    // 更新现有持仓
    PortfolioState.holdings[existingIndex] = holding;
  } else {
    // 添加新持仓
    PortfolioState.holdings.push(holding);
  }
  
  savePortfolioData();
  closeAddHoldingDialog();
}

// 删除持仓
function deleteHolding(code) {
  if (confirm('确定要删除这个持仓吗？')) {
    PortfolioState.holdings = PortfolioState.holdings.filter(h => h.code !== code);
    savePortfolioData();
  }
}

// 导出初始化函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initPortfolio };
}
