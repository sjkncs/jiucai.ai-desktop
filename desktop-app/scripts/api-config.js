/**
 * API配置管理模块
 * API Configuration Management
 */

// API提供商配置
const API_PROVIDERS = {
  // 豆包 (字节跳动)
  doubao: {
    name: '豆包AI',
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    chatEndpoint: '/chat/completions',
    modelEndpoint: '/models',
    defaultModel: 'ep-20241220182157-9hlpb', // 替换为你的模型ID
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 60000,
    maxRetries: 3,
    streamSupport: true
  },
  
  // OpenAI
  openai: {
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    chatEndpoint: '/chat/completions',
    modelEndpoint: '/models',
    defaultModel: 'gpt-3.5-turbo',
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 60000,
    maxRetries: 3,
    streamSupport: true
  },
  
  // 通义千问 (阿里云)
  qwen: {
    name: '通义千问',
    baseURL: 'https://dashscope.aliyuncs.com/api/v1',
    chatEndpoint: '/services/aigc/text-generation/generation',
    modelEndpoint: '/models',
    defaultModel: 'qwen-plus',
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 60000,
    maxRetries: 3,
    streamSupport: true
  },
  
  // 文心一言 (百度)
  wenxin: {
    name: '文心一言',
    baseURL: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1',
    chatEndpoint: '/wenxinworkshop/chat/completions',
    modelEndpoint: '/wenxinworkshop/models',
    defaultModel: 'ERNIE-Bot',
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 60000,
    maxRetries: 3,
    streamSupport: true
  },
  
  // 本地Mock (开发测试用)
  mock: {
    name: '本地模拟',
    baseURL: 'http://localhost:3001/api',
    chatEndpoint: '/chat',
    modelEndpoint: '/models',
    defaultModel: 'mock-model',
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 5000,
    maxRetries: 1,
    streamSupport: false
  }
};

// 当前API配置类
class APIConfiguration {
  constructor() {
    this.currentProvider = 'doubao'; // 默认使用豆包
    this.apiKey = '';
    this.customConfig = {};
    this.loadConfig();
  }
  
  // 从LocalStorage加载配置
  loadConfig() {
    try {
      const saved = localStorage.getItem('jiucai_api_config');
      if (saved) {
        const config = JSON.parse(saved);
        this.currentProvider = config.provider || 'doubao';
        this.apiKey = config.apiKey || '';
        this.customConfig = config.custom || {};
      }
    } catch (error) {
      console.error('加载API配置失败:', error);
    }
  }
  
  // 保存配置到LocalStorage
  saveConfig() {
    try {
      const config = {
        provider: this.currentProvider,
        apiKey: this.apiKey,
        custom: this.customConfig
      };
      localStorage.setItem('jiucai_api_config', JSON.stringify(config));
    } catch (error) {
      console.error('保存API配置失败:', error);
    }
  }
  
  // 设置API提供商
  setProvider(provider) {
    if (!API_PROVIDERS[provider]) {
      throw new Error(`不支持的API提供商: ${provider}`);
    }
    this.currentProvider = provider;
    this.saveConfig();
  }
  
  // 设置API Key
  setAPIKey(key) {
    this.apiKey = key;
    this.saveConfig();
  }
  
  // 获取当前提供商配置
  getProviderConfig() {
    return API_PROVIDERS[this.currentProvider];
  }
  
  // 获取完整的请求URL
  getEndpointURL(endpoint) {
    const config = this.getProviderConfig();
    return `${config.baseURL}${endpoint}`;
  }
  
  // 获取请求头
  getHeaders() {
    const config = this.getProviderConfig();
    const headers = { ...config.headers };
    
    // 添加API Key
    if (this.apiKey) {
      if (this.currentProvider === 'doubao') {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      } else if (this.currentProvider === 'openai') {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      } else if (this.currentProvider === 'qwen') {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      } else if (this.currentProvider === 'wenxin') {
        // 百度的认证方式不同，需要在URL中添加access_token
        // 这里简化处理
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }
    }
    
    return headers;
  }
  
  // 验证配置是否完整
  isValid() {
    if (this.currentProvider === 'mock') {
      return true; // Mock模式不需要API Key
    }
    return !!this.apiKey;
  }
  
  // 获取所有可用的提供商
  getAvailableProviders() {
    return Object.keys(API_PROVIDERS).map(key => ({
      id: key,
      name: API_PROVIDERS[key].name,
      current: key === this.currentProvider
    }));
  }
}

// 创建全局配置实例
const apiConfig = new APIConfiguration();

// 导出配置和提供商信息
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    API_PROVIDERS,
    APIConfiguration,
    apiConfig
  };
}
