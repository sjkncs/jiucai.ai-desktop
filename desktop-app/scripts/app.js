/**
 * 久财AI桌面应用 - 应用逻辑
 */

// 应用状态
const AppState = {
  currentView: 'chat',
  chatHistory: [],
  currentChatId: null,
  user: {
    name: '投资者',
    avatar: null
  }
};

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  setupEventListeners();
  loadChatHistory();
});

// 初始化应用
function initializeApp() {
  console.log('久财AI Desktop App Initialized');
  
  // 加载用户信息和历史
  loadUserInfo();
  loadChatHistory();
  
  // 初始化市场视图
  initMarketView();
  // 设置默认视图
  switchView('chat');
}

// 设置事件监听
function setupEventListeners() {
  // 导航菜单
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const view = item.dataset.view;
      switchView(view);
      
      // 更新激活状态
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // 新对话按钮
  const newChatBtn = document.querySelector('.new-chat-btn');
  if (newChatBtn) {
    newChatBtn.addEventListener('click', createNewChat);
  }

  // 输入框自动调整高度
  const messageInput = document.getElementById('messageInput');
  if (messageInput) {
    messageInput.addEventListener('input', autoResizeTextarea);
    messageInput.addEventListener('keydown', handleInputKeydown);
  }

  // 发送按钮
  const sendBtn = document.getElementById('sendBtn');
  if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
  }

  // 附件按钮
  const attachBtn = document.querySelector('.attach-btn');
  if (attachBtn) {
    attachBtn.addEventListener('click', handleAttachment);
  }

  // 语音按钮
  const voiceBtn = document.querySelector('.voice-btn');
  if (voiceBtn) {
    voiceBtn.addEventListener('click', handleVoiceInput);
  }

  // 设置按钮
  const settingsBtn = document.querySelector('.settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', openSettings);
  }

  // 底部工具栏按钮
  const realtimeDataBtn = document.getElementById('realtimeDataBtn');
  if (realtimeDataBtn) {
    realtimeDataBtn.addEventListener('click', () => handleToolbarAction('realtime'));
  }

  const technicalBtn = document.getElementById('technicalBtn');
  if (technicalBtn) {
    technicalBtn.addEventListener('click', () => handleToolbarAction('technical'));
  }

  const newsBtn = document.getElementById('newsBtn');
  if (newsBtn) {
    newsBtn.addEventListener('click', () => handleToolbarAction('news'));
  }

  // 个股搜索按钮
  const stockSearchBtn = document.querySelector('.search-btn');
  if (stockSearchBtn) {
    stockSearchBtn.addEventListener('click', handleStockSearch);
  }

  // 个股搜索输入框回车
  const stockInput = document.querySelector('.stock-input');
  if (stockInput) {
    stockInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleStockSearch();
      }
    });
  }

  // 快捷功能卡片
  document.querySelectorAll('.action-card').forEach(card => {
    card.addEventListener('click', () => {
      const action = card.dataset.action;
      const text = card.querySelector('span').textContent;
      handleQuickAction(action, text);
    });
  });

  // 功能标签
  document.querySelectorAll('.tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const tagType = tag.dataset.tag;
      const text = tag.textContent.trim();
      handleTechnicalTag(tagType, text);
    });
  });
}

// 切换视图
function switchView(viewName) {
  AppState.currentView = viewName;
  
  // 隐藏所有视图
  document.querySelectorAll('.view-container').forEach(view => {
    view.classList.remove('active');
  });
  
  // 显示当前视图
  const targetView = document.getElementById(`${viewName}View`);
  if (targetView) {
    targetView.classList.add('active');
  }
}

// 加载用户信息
function loadUserInfo() {
  const savedUser = localStorage.getItem('jiucai_user');
  if (savedUser) {
    AppState.user = JSON.parse(savedUser);
    updateUserDisplay();
  }
}

// 更新用户显示
function updateUserDisplay() {
  const usernameElement = document.querySelector('.username');
  if (usernameElement) {
    usernameElement.textContent = AppState.user.name;
  }
}

// 创建新对话
function createNewChat() {
  const chatId = Date.now().toString();
  AppState.currentChatId = chatId;
  
  // 显示欢迎屏幕
  showWelcomeScreen();
  
  // 添加到历史记录
  const newChat = {
    id: chatId,
    title: '新对话',
    time: new Date().toISOString(),
    messages: []
  };
  
  AppState.chatHistory.unshift(newChat);
  saveChatHistory();
  renderChatHistory();
}

// 显示欢迎屏幕
function showWelcomeScreen() {
  const welcomeScreen = document.getElementById('welcomeScreen');
  const chatArea = document.getElementById('chatArea');
  
  if (welcomeScreen) welcomeScreen.style.display = 'flex';
  if (chatArea) chatArea.style.display = 'none';
  
  // 清空消息
  const messagesContainer = document.getElementById('messagesContainer');
  if (messagesContainer) {
    messagesContainer.innerHTML = '';
  }
}

// 隐藏欢迎屏幕
function hideWelcomeScreen() {
  const welcomeScreen = document.getElementById('welcomeScreen');
  const chatArea = document.getElementById('chatArea');
  
  if (welcomeScreen) welcomeScreen.style.display = 'none';
  if (chatArea) chatArea.style.display = 'flex';
}

// 处理快捷功能
function handleQuickAction(action, text) {
  const actionMessages = {
    'market-overview': '请为我分析当前市场整体走势和主要指数表现',
    'stock-search': '我想查询股票信息，请问股票代码或名称是？',
    'technical-analysis': '请帮我进行技术分析，包括主要技术指标',
    'news-sentiment': '请分析最近的市场新闻和舆情',
    'ai-prediction': '请使用AI模型预测股票走势',
    'risk-analysis': '请评估当前市场风险和个股风险'
  };
  
  const messageInput = document.getElementById('messageInput');
  if (messageInput) {
    messageInput.value = actionMessages[action] || text;
    messageInput.focus();
  }
}

// 处理技术指标标签
function handleTechnicalTag(tagType, text) {
  const tagMessages = {
    'macd': '请分析MACD指标，包括DIF、DEA和MACD柱状图',
    'kdj': '请分析KDJ指标的K值、D值和J值',
    'ma': '请分析均线系统，包括5日、10日、20日均线',
    'volume': '请分析成交量变化和量价关系',
    'bollinger': '请分析布林带上轨、中轨和下轨',
    'rsi': '请分析RSI相对强弱指标',
    'support': '请找出当前的支撑位',
    'resistance': '请找出当前的压力位'
  };
  
  const messageInput = document.getElementById('messageInput');
  if (messageInput) {
    messageInput.value = tagMessages[tagType] || text;
    messageInput.focus();
  }
}

// 输入框自动调整高度
function autoResizeTextarea(e) {
  const textarea = e.target;
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
}

// 处理输入键盘事件
function handleInputKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

// 加载对话历史
function loadChatHistory() {
  const saved = localStorage.getItem('jiucai_chat_history');
  if (saved) {
    AppState.chatHistory = JSON.parse(saved);
    renderChatHistory();
  }
}

// 保存对话历史
function saveChatHistory() {
  localStorage.setItem('jiucai_chat_history', JSON.stringify(AppState.chatHistory));
}

// 渲染对话历史
function renderChatHistory() {
  const container = document.getElementById('chatHistory');
  if (!container) return;
  
  container.innerHTML = '';
  
  AppState.chatHistory.forEach(chat => {
    const item = document.createElement('div');
    item.className = 'history-item';
    if (chat.id === AppState.currentChatId) {
      item.classList.add('active');
    }
    
    item.innerHTML = `
      <div class="history-title">${chat.title}</div>
      <div class="history-time">${formatTime(chat.time)}</div>
    `;
    
    item.addEventListener('click', () => loadChat(chat.id));
    container.appendChild(item);
  });
}

// 加载对话
function loadChat(chatId) {
  const chat = AppState.chatHistory.find(c => c.id === chatId);
  if (!chat) return;
  
  AppState.currentChatId = chatId;
  
  // 渲染消息
  const messagesContainer = document.getElementById('messagesContainer');
  if (messagesContainer) {
    messagesContainer.innerHTML = '';
    chat.messages.forEach(msg => {
      appendMessage(msg.role, msg.content, false);
    });
  }
  
  // 隐藏欢迎屏幕
  if (chat.messages.length > 0) {
    hideWelcomeScreen();
  }
  
  renderChatHistory();
}

// 格式化时间
function formatTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  
  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

// 处理附件
function handleAttachment() {
  console.log('附件功能');
  // TODO: 实现附件上传
}

// 处理语音输入
function handleVoiceInput() {
  console.log('语音输入');
  // TODO: 实现语音识别
}

// 打开设置窗口
function openSettings() {
  const settingsWindow = window.open(
    'settings.html',
    'settings',
    'width=1000,height=700,resizable=yes'
  );
}

// 接收设置更新
window.addEventListener('message', (event) => {
  if (event.data.type === 'settings-updated') {
    applySettings(event.data.settings);
  }
});

// 应用设置
function applySettings(settings) {
  // 应用主题色
  if (settings.themeColor) {
    document.documentElement.style.setProperty('--primary-color', settings.themeColor);
  }

  // 应用字体大小
  if (settings.fontSize) {
    document.documentElement.style.fontSize = settings.fontSize + 'px';
  }

  // 应用侧边栏宽度
  if (settings.sidebarWidth) {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.style.width = settings.sidebarWidth + 'px';
    }
  }

  // 应用动画设置
  if (settings.animations !== undefined) {
    document.documentElement.classList.toggle('no-animations', !settings.animations);
  }
}

// 处理工具栏操作
function handleToolbarAction(action) {
  const messageInput = document.getElementById('messageInput');
  const actions = {
    'realtime': '请提供最新的实时市场数据',
    'technical': '请进行技术指标分析',
    'news': '请分析最近的相关新闻和市场动态'
  };

  if (messageInput && actions[action]) {
    messageInput.value = actions[action];
    messageInput.focus();
  }
}

// 处理股票搜索
function handleStockSearch() {
  const stockInput = document.querySelector('.stock-input');
  if (!stockInput) return;

  const query = stockInput.value.trim();
  if (!query) {
    alert('请输入股票代码或名称');
    return;
  }

  // 切换到智能分析视图
  switchView('chat');
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === 'chat');
  });

  // 在输入框中填充查询
  const messageInput = document.getElementById('messageInput');
  if (messageInput) {
    messageInput.value = `请详细分析股票：${query}，包括基本面、技术面和最新动态`;
    // 自动发送消息
    setTimeout(() => {
      sendMessage();
      stockInput.value = '';
    }, 300);
  }
}

// 加载市场数据
function loadMarketData() {
  // TODO: 从API获取实时市场数据
  // 这里使用模拟数据
  const marketIndicators = [
    { label: '上证指数', value: '3,125.67', change: '+0.89%', isPositive: true },
    { label: '深证成指', value: '10,234.56', change: '+1.12%', isPositive: true },
    { label: '创业板指', value: '2,456.78', change: '+1.45%', isPositive: true },
    { label: '沪深300', value: '3,825.42', change: '+1.23%', isPositive: true }
  ];

  updateMarketDisplay(marketIndicators);
}

// 更新市场数据显示
function updateMarketDisplay(indicators) {
  const container = document.querySelector('.market-indicators');
  if (!container) return;

  container.innerHTML = indicators.map(item => `
    <div class="indicator-card">
      <div class="indicator-label">${item.label}</div>
      <div class="indicator-value">${item.value}</div>
      <div class="indicator-change ${item.isPositive ? 'positive' : 'negative'}">
        ${item.change}
      </div>
    </div>
  `).join('');
}

// 初始化市场数据
function initMarketView() {
  loadMarketData();
  
  // 定时刷新市场数据
  const settings = JSON.parse(localStorage.getItem('jiucai_settings') || '{}');
  const refreshRate = (settings.refreshRate || 30) * 1000;
  
  setInterval(() => {
    if (AppState.currentView === 'market') {
      loadMarketData();
    }
  }, refreshRate);
}
