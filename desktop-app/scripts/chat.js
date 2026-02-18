/**
 * 聊天功能模块
 */

// 发送消息
async function sendMessage() {
  const messageInput = document.getElementById('messageInput');
  const message = messageInput.value.trim();
  
  if (!message) return;
  
  // 隐藏欢迎屏幕
  hideWelcomeScreen();
  
  // 清空输入框
  messageInput.value = '';
  messageInput.style.height = 'auto';
  
  // 显示用户消息
  appendMessage('user', message);
  
  // 保存到历史
  saveMessageToHistory('user', message);
  
  // 显示加载动画
  showTypingIndicator();
  
  try {
    // 调用AI接口
    const response = await callAIAPI(message);
    
    // 移除加载动画
    removeTypingIndicator();
    
    // 显示AI回复
    appendMessage('assistant', response);
    
    // 保存到历史
    saveMessageToHistory('assistant', response);
    
    // 更新对话标题（第一条消息）
    updateChatTitle(message);
    
  } catch (error) {
    removeTypingIndicator();
    appendMessage('assistant', '抱歉，我遇到了一些问题。请稍后再试。');
    console.error('AI API Error:', error);
  }
}

// 添加消息到界面
function appendMessage(role, content, animate = true) {
  const messagesContainer = document.getElementById('messagesContainer');
  if (!messagesContainer) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  if (animate) {
    messageDiv.classList.add('fade-in');
  }
  
  const avatar = role === 'assistant' 
    ? '<i class="fas fa-robot"></i>' 
    : '<i class="fas fa-user"></i>';
  
  messageDiv.innerHTML = `
    <div class="message-avatar">
      ${avatar}
    </div>
    <div class="message-content">
      <div class="message-bubble">${formatMessage(content)}</div>
      <div class="message-time">${getCurrentTime()}</div>
    </div>
  `;
  
  messagesContainer.appendChild(messageDiv);
  
  // 滚动到底部
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 格式化消息内容
function formatMessage(content) {
  // 处理换行
  let formatted = content.replace(/\n/g, '<br>');
  
  // 处理代码块
  formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code class="language-${lang || 'text'}">${escapeHtml(code.trim())}</code></pre>`;
  });
  
  // 处理行内代码
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // 处理粗体
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // 处理链接
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  
  return formatted;
}

// HTML转义
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// 获取当前时间
function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

// 显示加载动画
function showTypingIndicator() {
  const messagesContainer = document.getElementById('messagesContainer');
  if (!messagesContainer) return;
  
  const indicator = document.createElement('div');
  indicator.className = 'message assistant typing-message';
  indicator.innerHTML = `
    <div class="message-avatar">
      <i class="fas fa-robot"></i>
    </div>
    <div class="message-content">
      <div class="message-bubble">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    </div>
  `;
  
  messagesContainer.appendChild(indicator);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 移除加载动画
function removeTypingIndicator() {
  const indicator = document.querySelector('.typing-message');
  if (indicator) {
    indicator.remove();
  }
}

// 保存消息到历史
function saveMessageToHistory(role, content) {
  if (!AppState.currentChatId) {
    createNewChat();
  }
  
  const chat = AppState.chatHistory.find(c => c.id === AppState.currentChatId);
  if (chat) {
    chat.messages.push({
      role,
      content,
      time: new Date().toISOString()
    });
    saveChatHistory();
  }
}

// 更新对话标题
function updateChatTitle(firstMessage) {
  const chat = AppState.chatHistory.find(c => c.id === AppState.currentChatId);
  if (chat && chat.messages.length === 1) {
    // 使用第一条消息的前20个字符作为标题
    chat.title = firstMessage.substring(0, 20) + (firstMessage.length > 20 ? '...' : '');
    saveChatHistory();
    renderChatHistory();
  }
}
