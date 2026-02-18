import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'
import crypto from 'crypto'
import db from './db.js'
import usersDb from './users-db.js'
import { initDatabase } from './init-db.js'
import stockService from './stock-service.js'
import akshareService from './akshare-service.js'
import serviceManager from './service-manager.js'
import { SERVER_CONFIG } from '../config/server.config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = SERVER_CONFIG.API_PORT

// 中间件
app.use(cors())
app.use(express.json())

// analysis-service.js 已被删除，相关功能已移除

// 静态文件服务 - 用于访问分析报告
app.use('/analysis', express.static(path.join(__dirname, 'analysis')))

// 初始化数据库（在启动时执行）
initDatabase().then(() => {
  console.log('✅ 数据库已连接')
}).catch(err => {
  console.error('❌ 数据库连接失败:', err)
})

// API 路由

// 搜索股票
app.get('/api/search', async (req, res) => {
  const { keyword } = req.query

  await db.read()
  
  // 如果没有关键词，返回所有 stocks
  if (!keyword) {
    return res.json({ success: true, data: db.data.stocks })
  }

  // 支持中英文字段名搜索（db.json 使用中文字段名）
  const results = db.data.stocks.filter(stock => {
    const code = stock['股票代码'] || stock.code || ''
    const name = stock['股票名称'] || stock.name || ''
    return code.toLowerCase().includes(keyword.toLowerCase()) || 
           name.toLowerCase().includes(keyword.toLowerCase())
  })

  res.json({ success: true, data: results })
})

// 获取自选持仓（含实时价格和MA数据）
app.get('/api/portfolio', async (req, res) => {
  const { market } = req.query

  await db.read()
  let portfolio = db.data.portfolio
  if (market && market !== 'all') {
    const marketMap = {
      'a-share': ['A股'],
      'hk-share': ['港股'],
      'us-share': ['美股'],
      'fund': ['基金', '场外基金']
    }
    const markets = marketMap[market] || []
    // 兼容中文字段名和英文字段名
    portfolio = db.data.portfolio.filter(item => {
      const itemMarket = item.market || item['所在市场'] || ''
      return markets.some(m => itemMarket.includes(m))
    })
  }

  try {
    // 并行获取所有股票的价格和MA数据
    const pricePromises = portfolio.map(async (stock) => {
      const stockCode = stock.code || stock['股票代码']
      
      try {
        const priceData = await stockService.getStockPrice(stockCode)
        const maData = await stockService.getMAData(stockCode)

        // 如果获取到新数据且不为空，则使用新数据，否则保留原数据
        return {
          ...stock,
          当前实时价: priceData.currentPrice || stock['当前实时价'],
          昨日收盘价: priceData.prevClose || stock['昨日收盘价'],
          MA5: maData.MA5 || stock['MA5'],
          MA10: maData.MA10 || stock['MA10'],
          MA20: maData.MA20 || stock['MA20'],
          MA30: maData.MA30 || stock['MA30'],
          MA50: maData.MA50 || stock['MA50']
        }
      } catch (error) {
        console.warn(`获取${stockCode}价格数据失败，保留原数据:`, error.message)
        // API调用失败时，返回原始数据
        return stock
      }
    })

    const updatedPortfolio = await Promise.all(pricePromises)

    res.json({
      success: true,
      data: updatedPortfolio,
      updateTime: new Date().toLocaleString()
    })
  } catch (error) {
    console.error('获取投资组合数据失败:', error)
    res.json({ success: true, data: portfolio })
  }
})

import fs from 'fs'

// 更新 init-db.js 中的 portfolio 数据
async function updateInitDbPortfolio(portfolio) {
  try {
    const initDbPath = path.join(__dirname, 'init-db.js')
    let content = fs.readFileSync(initDbPath, 'utf8')

    // 将数据格式化为 JS 对象字符串（使用中文字段名格式）
    const portfolioStr = JSON.stringify(portfolio, null, 2)
      // 将英文字段名转换为中文字段名
      .replace(/"code":/g, '"股票代码":')
      .replace(/"name":/g, '"股票名称":')
      .replace(/"market":/g, '"所在市场":')
      .replace(/"category":/g, '"股票类别":')
      .replace(/"industry":/g, '"所属行业":')
      .replace(/"theme":/g, '"核心主题":')
      .replace(/"style":/g, '"投资风格":')
      .replace(/"sector":/g, '"所属板块":')
      .replace(/"channel":/g, '"购买渠道":')
      .replace(/"currentPrice":/g, '"当前实时价":')
      .replace(/"prevPrice":/g, '"昨日收盘价":')
      .replace(/"ma5":/g, '"MA5":')
      .replace(/"ma10":/g, '"MA10":')
      .replace(/"ma20":/g, '"MA20":')
      .replace(/"ma30":/g, '"MA30":')
      .replace(/"ma50":/g, '"MA50":')

    // 替换 init-db.js 中的 portfolio 数组
    // 查找 db.data.portfolio = [ ... ] 的模式
    const regex = /(if \(!db\.data\.portfolio \|\| db\.data\.portfolio\.length === 0\) \{[\s\S]*?db\.data\.portfolio = )\[[\s\S]*?\](\s*hasChanges)/

    if (regex.test(content)) {
      content = content.replace(regex, `$1${portfolioStr}$2`)
      fs.writeFileSync(initDbPath, content, 'utf8')
      console.log('✅ init-db.js 已更新')
    } else {
      console.log('⚠️ 无法找到 init-db.js 中的 portfolio 定义位置')
    }
  } catch (e) {
    console.error('更新 init-db.js 失败:', e)
  }
}

// 更新 init-db.js 中的 stocks 数据
async function updateInitDbStocks(stocks) {
  try {
    const initDbPath = path.join(__dirname, 'init-db.js')
    let content = fs.readFileSync(initDbPath, 'utf8')

    // 将数据格式化为 JS 对象字符串（使用中文字段名格式）
    const stocksStr = JSON.stringify(stocks, null, 2)
      // 将英文字段名转换为中文字段名
      .replace(/"code":/g, '"股票代码":')
      .replace(/"name":/g, '"股票名称":')
      .replace(/"market":/g, '"所在市场":')
      .replace(/"category":/g, '"股票类别":')
      .replace(/"industry":/g, '"所属行业":')
      .replace(/"theme":/g, '"核心主题":')
      .replace(/"style":/g, '"投资风格":')
      .replace(/"sector":/g, '"所属板块":')
      .replace(/"channel":/g, '"购买渠道":')
      .replace(/"currentPrice":/g, '"当前实时价":')
      .replace(/"prevPrice":/g, '"昨日收盘价":')
      .replace(/"ma5":/g, '"MA5":')
      .replace(/"ma10":/g, '"MA10":')
      .replace(/"ma20":/g, '"MA20":')
      .replace(/"ma30":/g, '"MA30":')
      .replace(/"ma50":/g, '"MA50":')

    // 替换 init-db.js 中的 stocks 数组
    // 查找 db.data.stocks = [ ... ] 的模式
    const regex = /(if \(!db\.data\.stocks \|\| db\.data\.stocks\.length === 0\) \{[\s\S]*?db\.data\.stocks = )\[[\s\S]*?\](\s*hasChanges)/

    if (regex.test(content)) {
      content = content.replace(regex, `$1${stocksStr}$2`)
      fs.writeFileSync(initDbPath, content, 'utf8')
      console.log('✅ init-db.js stocks 数据已更新')
    } else {
      console.log('⚠️ 无法找到 init-db.js 中的 stocks 定义位置')
    }
  } catch (e) {
    console.error('更新 init-db.js stocks 数据失败:', e)
  }
}

// 保存自选持仓数据到本地 db.json
app.post('/api/save-portfolio', async (req, res) => {
  const { portfolio } = req.body

  if (!portfolio) {
    return res.status(400).json({ success: false, message: '缺少 portfolio 数据' })
  }

  try {
    await db.read()
    // 覆盖本地数据库中的 portfolio 字段
    db.data.portfolio = portfolio
    await db.write()

    // 同时更新 init-db.js
    await updateInitDbPortfolio(portfolio)

    res.json({ success: true, data: db.data.portfolio })
  } catch (e) {
    console.error('保存 portfolio 数据失败:', e)
    res.status(500).json({ success: false, message: '保存失败' })
  }
})

// 保存 stocks 数据到本地 db.json
app.post('/api/save-stocks', async (req, res) => {
  const { stocks } = req.body

  if (!stocks) {
    return res.status(400).json({ success: false, message: '缺少 stocks 数据' })
  }

  try {
    await db.read()
    // 将英文字段名转换为中文字段名以匹配数据库格式
    const convertedStocks = stocks.map(stock => ({
      '股票代码': stock.code || stock['股票代码'] || '',
      '股票名称': stock.name || stock['股票名称'] || '',
      '所在市场': stock.market || stock['所在市场'] || '',
      '股票类别': stock.category || stock['股票类别'] || '',
      '所属行业': stock.industry || stock['所属行业'] || '',
      '核心主题': stock.theme || stock['核心主题'] || '',
      '投资风格': stock.style || stock['投资风格'] || '',
      '所属板块': stock.sector || stock['所属板块'] || '',
      '购买渠道': stock.channel || stock['购买渠道'] || '',
      '当前实时价': stock.currentPrice?.toString() || stock['当前实时价'] || '',
      '昨日收盘价': stock.prevPrice?.toString() || stock['昨日收盘价'] || '',
      'MA5': stock.ma5?.toString() || stock['MA5'] || '',
      'MA10': stock.ma10?.toString() || stock['MA10'] || '',
      'MA20': stock.ma20?.toString() || stock['MA20'] || '',
      'MA30': stock.ma30?.toString() || stock['MA30'] || '',
      'MA50': stock.ma50?.toString() || stock['MA50'] || ''
    }))
    
    // 覆盖本地数据库中的 stocks 字段
    db.data.stocks = convertedStocks
    await db.write()

    // 同时更新 init-db.js
    await updateInitDbStocks(stocks)

    res.json({ success: true, data: db.data.stocks })
  } catch (e) {
    console.error('保存 stocks 数据失败:', e)
    res.status(500).json({ success: false, message: '保存失败' })
  }
})

// 获取指数估值
app.get('/api/valuation', async (_, res) => {
  await db.read()
  res.json({ success: true, data: db.data.valuation })
})

// 获取股票列表（stocks数据，含实时价格和MA数据）
app.get('/api/stocks', async (req, res) => {
  const { market } = req.query

  await db.read()
  let stocks = db.data.stocks
  if (market && market !== 'all') {
    const marketMap = {
      'a-share': ['A股'],
      'hk-share': ['港股'],
      'us-share': ['美股'],
      'fund': ['基金', '场外基金']
    }
    const markets = marketMap[market] || []
    // 兼容中文字段名和英文字段名
    stocks = db.data.stocks.filter(item => {
      const itemMarket = item.market || item['所在市场'] || ''
      return markets.some(m => itemMarket.includes(m))
    })
  }

  try {
    // 并行获取所有股票的价格和MA数据
    const pricePromises = stocks.map(async (stock) => {
      const stockCode = stock.code || stock['股票代码']
      
      try {
        const priceData = await stockService.getStockPrice(stockCode)
        const maData = await stockService.getMAData(stockCode)

        // 如果获取到新数据且不为空，则使用新数据，否则保留原数据
        return {
          ...stock,
          当前实时价: priceData.currentPrice || stock['当前实时价'],
          昨日收盘价: priceData.prevClose || stock['昨日收盘价'],
          MA5: maData.MA5 || stock['MA5'],
          MA10: maData.MA10 || stock['MA10'],
          MA20: maData.MA20 || stock['MA20'],
          MA30: maData.MA30 || stock['MA30'],
          MA50: maData.MA50 || stock['MA50']
        }
      } catch (error) {
        console.warn(`获取${stockCode}价格数据失败，保留原数据:`, error.message)
        // API调用失败时，返回原始数据
        return stock
      }
    })

    const updatedStocks = await Promise.all(pricePromises)

    res.json({
      success: true,
      data: updatedStocks,
      updateTime: new Date().toLocaleString()
    })
  } catch (error) {
    console.error('获取股票列表数据失败:', error)
    res.json({ success: true, data: stocks })
  }
})

// 获取股票详情
app.get('/api/stock/:code', async (req, res) => {
  const { code } = req.params

  try {
    // 调用 stock-service 获取实时数据
    const detail = await stockService.getStockDetail(code)

    if (detail) {
      res.json({ success: true, data: detail })
    } else {
      // 如果获取失败，从数据库读取基础信息并返回默认数据
      await db.read()
      const stock = db.data.stocks.find(s => s.code === code)

      const fallbackDetail = {
        code,
        name: stock?.name || `股票${code}`,
        currentPrice: stock?.price || 0,
        prevPrice: stock?.price ? stock.price * 0.99 : 0,
        openPrice: stock?.price ? stock.price * 1.01 : 0,
        highPrice: stock?.price ? stock.price * 1.03 : 0,
        lowPrice: stock?.price ? stock.price * 0.98 : 0,
        volume: '--',
        turnover: '--',
        totalShares: 0,
        floatShares: 0,
        totalMarketValue: 0,
        floatMarketValue: 0,
        industry: '--',
        listingDate: '--',
        pe: 0,
        pb: 0,
        limitUp: stock?.price ? stock.price * 1.1 : 0,
        limitDown: stock?.price ? stock.price * 0.9 : 0,
        turnoverRate: 0,
        volumeRatio: 0,
        avgPrice: stock?.price || 0,
        bid1: 0, bid1Vol: 0,
        bid2: 0, bid2Vol: 0,
        bid3: 0, bid3Vol: 0,
        bid4: 0, bid4Vol: 0,
        bid5: 0, bid5Vol: 0,
        ask1: 0, ask1Vol: 0,
        ask2: 0, ask2Vol: 0,
        ask3: 0, ask3Vol: 0,
        ask4: 0, ask4Vol: 0,
        ask5: 0, ask5Vol: 0
      }

      res.json({ success: true, data: fallbackDetail })
    }
  } catch (error) {
    console.error('获取股票详情失败:', error)
    res.status(500).json({ success: false, message: '获取股票详情失败' })
  }
})

// 获取K线数据
app.get('/api/stock/:code/kline', async (req, res) => {
  const { code } = req.params
  const { period = '1d' } = req.query

  try {
    // 调用 stock-service 获取K线数据
    const klineData = await stockService.getKlineData(code, period)

    if (klineData && klineData.length > 0) {
      res.json({ success: true, data: klineData })
    } else {
      // 如果获取失败，返回空数组
      res.json({ success: true, data: [] })
    }
  } catch (error) {
    console.error('获取K线数据失败:', error)
    res.status(500).json({ success: false, message: '获取K线数据失败' })
  }
})

// 添加股票到数据库
app.post('/api/stocks', async (req, res) => {
  const { code, name, type, market, price, change } = req.body

  if (!code || !name || !price) {
    return res.status(400).json({ success: false, message: '缺少必要字段' })
  }

  await db.read()

  // 检查股票是否已存在
  const existingStock = db.data.stocks.find(s => s.code === code)
  if (existingStock) {
    return res.status(400).json({ success: false, message: '股票已存在' })
  }

  const newStock = {
    code,
    name,
    type: type || '股票',
    market: market || '深圳',
    price: parseFloat(price),
    change: parseFloat(change || 0)
  }

  db.data.stocks.push(newStock)
  await db.write()

  res.json({ success: true, data: newStock })
})

// 更新股票价格
app.put('/api/stocks/:code', async (req, res) => {
  const { code } = req.params
  const { price, change } = req.body

  await db.read()

  const stockIndex = db.data.stocks.findIndex(s => s.code === code)
  if (stockIndex === -1) {
    return res.status(404).json({ success: false, message: '股票不存在' })
  }

  if (price !== undefined) {
    db.data.stocks[stockIndex].price = parseFloat(price)
  }
  if (change !== undefined) {
    db.data.stocks[stockIndex].change = parseFloat(change)
  }

  await db.write()

  res.json({ success: true, data: db.data.stocks[stockIndex] })
})

// 删除股票
app.delete('/api/stocks/:code', async (req, res) => {
  const { code } = req.params

  await db.read()

  const stockIndex = db.data.stocks.findIndex(s => s.code === code)
  if (stockIndex === -1) {
    return res.status(404).json({ success: false, message: '股票不存在' })
  }

  db.data.stocks.splice(stockIndex, 1)
  await db.write()

  res.json({ success: true, message: '股票已删除' })
})

// 获取ETF数据（使用BaoStock接口）
app.get('/api/etf', async (req, res) => {
  try {
    const { page = 1, page_size = 20 } = req.query
    
    // 调用BaoStock接口
    const baostockUrl = process.env.BAOSTOCK_API_URL || 'http://127.0.0.1:8001'
    const response = await axios.get(`${baostockUrl}/api/etf/list`, {
      params: {
        page: parseInt(page),
        page_size: parseInt(page_size),
        include_quote: true
      },
      timeout: 10000
    })

    // 检查BaoStock接口响应
    if (response.data && response.data.success) {
      // 转换数据格式以兼容前端
      const formattedEtfs = response.data.data.etfs.map(etf => {
        const quote = etf.quote || {}
        return {
          code: etf.code,
          name: etf.code_name,
          ipoDate: etf.ipoDate,
          outDate: etf.outDate,
          type: etf.type,
          status: etf.status,
          quote: {
            date: quote.date,
            open: quote.open,
            high: quote.high,
            low: quote.low,
            close: quote.close,
            preclose: quote.preclose,
            volume: quote.volume,
            amount: quote.amount,
            pctChg: quote.pctChg
          },
          currentPrice: quote.close || 0,
          changeAmount: quote.close && quote.preclose ? quote.close - quote.preclose : 0,
          changePercent: quote.pctChg || 0,
          volume: quote.volume || 0,
          turnover: quote.amount || 0,
          openPrice: quote.open || 0,
          highPrice: quote.high || 0,
          lowPrice: quote.low || 0,
          prevClose: quote.preclose || 0
        }
      })

      res.json({
        success: true,
        data: formattedEtfs,
        total: response.data.data.total,
        page: response.data.data.page,
        page_size: response.data.data.page_size,
        total_pages: response.data.data.total_pages,
        updateTime: new Date().toISOString(),
        source: 'baostock',
        type: response.data.type || '实时API数据'
      })
    } else {
      throw new Error('BaoStock接口返回数据格式错误')
    }
  } catch (error) {
    console.error('调用BaoStock ETF接口失败:', error.message)
    
    res.status(500).json({
      success: false,
      message: '获取ETF数据失败，请检查BaoStock服务是否启动',
      error: error.message
    })
  }
})

// 健康检查
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ==================== AKShare Python API 路由 ====================

// 检查 Python API 服务状态
app.get('/api/akshare/status', async (_, res) => {
  try {
    const isHealthy = await akshareService.healthCheck()
    res.json({
      success: true,
      status: isHealthy ? 'connected' : 'disconnected',
      pythonApiUrl: process.env.PYTHON_API_URL || 'http://localhost:8000'
    })
  } catch (error) {
    res.json({ success: false, status: 'error', message: error.message })
  }
})

// 使用 Python API 获取 ETF 列表（替代原有接口）
app.get('/api/etf/akshare', async (_, res) => {
  try {
    const etfData = await akshareService.getETFList(1, 200)

    // 转换数据格式以兼容前端
    const formattedData = etfData.data.map(item => ({
      code: item['代码'],
      name: item['名称'],
      currentPrice: parseFloat(item['最新价']) || 0,
      changeAmount: parseFloat(item['涨跌额']) || 0,
      changePercent: parseFloat(item['涨跌幅']) || 0,
      volume: parseFloat(item['成交量']) || 0,
      turnover: parseFloat(item['成交额']) || 0,
      openPrice: parseFloat(item['开盘价']) || 0,
      highPrice: parseFloat(item['最高价']) || 0,
      lowPrice: parseFloat(item['最低价']) || 0,
      prevClose: parseFloat(item['昨收']) || 0
    }))

    res.json({
      success: true,
      data: formattedData,
      updateTime: etfData.updateTime,
      source: 'akshare'
    })
  } catch (error) {
    console.error('从 AKShare 获取ETF数据失败:', error.message)
    // 如果 Python API 失败，回退到原有方式
    try {
      const etfData = await stockService.getETFData()
      res.json({ success: true, ...etfData, source: 'fallback' })
    } catch (fallbackError) {
      res.json({ success: true, data: [], updateTime: new Date().toLocaleString('zh-CN') })
    }
  }
})

// 使用 Python API 搜索股票
app.get('/api/stocks/search/akshare', async (req, res) => {
  const { keyword } = req.query

  if (!keyword) {
    return res.json({ success: true, data: [] })
  }

  try {
    const result = await akshareService.searchStock(keyword)

    // 转换数据格式
    const formattedData = result.data.map(item => ({
      code: item['代码'],
      name: item['名称'],
      market: item.get('市场类型', 'A股'),
      currentPrice: parseFloat(item.get('最新价', 0)),
      changePercent: parseFloat(item.get('涨跌幅', 0))
    }))

    res.json({ success: true, data: formattedData, source: 'akshare' })
  } catch (error) {
    console.error('从 AKShare 搜索股票失败:', error.message)
    // 回退到本地数据库搜索
    await db.read()
    const results = db.data.stocks.filter(stock =>
      stock.code.includes(keyword) || stock.name.includes(keyword)
    )
    res.json({ success: true, data: results, source: 'local' })
  }
})

// 使用 Python API 获取股票实时行情
app.get('/api/stocks/realtime/:code', async (req, res) => {
  const { code } = req.params

  try {
    const result = await akshareService.getStockRealtime(code)
    res.json({ success: true, data: result.data, source: 'akshare' })
  } catch (error) {
    console.error('从 AKShare 获取实时行情失败:', error.message)
    res.status(500).json({ success: false, message: error.message })
  }
})

// analysis-service.js 已被删除，相关API路由已移除

// ==================== 用户管理 API ====================

// MD5 加密函数
function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex')
}

// 生成唯一ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 获取当前时间字符串
function getCurrentTime() {
  const now = new Date()
  return now.getFullYear() + '-' + 
    String(now.getMonth() + 1).padStart(2, '0') + '-' + 
    String(now.getDate()).padStart(2, '0') + ' ' + 
    String(now.getHours()).padStart(2, '0') + ':' + 
    String(now.getMinutes()).padStart(2, '0') + ':' + 
    String(now.getSeconds()).padStart(2, '0')
}

// 登录接口
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body
    
    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码不能为空' })
    }
    
    await usersDb.read()
    const users = usersDb.data || []
    
    const user = users.find(u => u.username === username)
    if (!user) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' })
    }
    
    const encryptedPassword = md5(password)
    if (user.password !== encryptedPassword) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' })
    }
    
    if (user.status === 'disabled') {
      return res.status(403).json({ success: false, message: '账号已被禁用，请联系管理员' })
    }
    
    // 更新最后登录时间
    user.lastLoginAt = getCurrentTime()
    user.lastLoginIp = req.ip || req.connection.remoteAddress
    await usersDb.write()
    
    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user
    
    res.json({ 
      success: true, 
      message: '登录成功',
      data: userWithoutPassword
    })
  } catch (error) {
    console.error('[Auth] 登录失败:', error)
    res.status(500).json({ success: false, message: '登录失败，请稍后重试' })
  }
})

// 获取当前登录用户信息
app.get('/api/auth/me', async (req, res) => {
  try {
    // 这里可以实现基于 token 的验证
    // 简化版：暂时返回空，前端从 localStorage 获取
    res.json({ success: true, data: null })
  } catch (error) {
    console.error('[Auth] 获取用户信息失败:', error)
    res.status(500).json({ success: false, message: '获取用户信息失败' })
  }
})

// 获取所有用户列表
app.get('/api/users', async (req, res) => {
  try {
    await usersDb.read()
    const users = usersDb.data || []
    
    // 返回用户信息（不包含密码）
    const usersWithoutPassword = users.map(user => {
      const { password, ...userWithoutPassword } = user
      return userWithoutPassword
    })
    
    res.json({ success: true, data: usersWithoutPassword })
  } catch (error) {
    console.error('[Users] 获取用户列表失败:', error)
    res.status(500).json({ success: false, message: '获取用户列表失败' })
  }
})

// 获取单个用户详情
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params
    await usersDb.read()
    const users = usersDb.data || []
    
    const user = users.find(u => u.id === id)
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }
    
    const { password, ...userWithoutPassword } = user
    res.json({ success: true, data: userWithoutPassword })
  } catch (error) {
    console.error('[Users] 获取用户详情失败:', error)
    res.status(500).json({ success: false, message: '获取用户详情失败' })
  }
})

// 创建用户
app.post('/api/users', async (req, res) => {
  try {
    const { username, password, nickname, email, phone, roles, status, createdBy } = req.body
    
    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码不能为空' })
    }
    
    await usersDb.read()
    const users = usersDb.data || []
    
    // 检查用户名是否已存在
    if (users.find(u => u.username === username)) {
      return res.status(400).json({ success: false, message: '用户名已存在' })
    }
    
    const now = getCurrentTime()
    const newUser = {
      id: generateId(),
      username,
      password: md5(password),
      nickname: nickname || username,
      avatar: '',
      email: email || '',
      phone: phone || '',
      status: status || 'enabled',
      roles: roles || ['普通用户'],
      createdAt: now,
      createdBy: createdBy || 'system',
      updatedAt: now,
      updatedBy: createdBy || 'system',
      lastLoginAt: '',
      lastLoginIp: ''
    }
    
    users.push(newUser)
    await usersDb.write()
    
    const { password: _, ...userWithoutPassword } = newUser
    res.json({ success: true, message: '用户创建成功', data: userWithoutPassword })
  } catch (error) {
    console.error('[Users] 创建用户失败:', error)
    res.status(500).json({ success: false, message: '创建用户失败' })
  }
})

// 更新用户
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { username, password, nickname, email, phone, roles, status, updatedBy } = req.body
    
    await usersDb.read()
    const users = usersDb.data || []
    
    const userIndex = users.findIndex(u => u.id === id)
    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }
    
    const user = users[userIndex]
    
    // 如果修改用户名，检查是否与其他用户冲突
    if (username && username !== user.username) {
      if (users.find(u => u.username === username && u.id !== id)) {
        return res.status(400).json({ success: false, message: '用户名已存在' })
      }
      user.username = username
    }
    
    // 更新其他字段
    if (password) user.password = md5(password)
    if (nickname !== undefined) user.nickname = nickname
    if (email !== undefined) user.email = email
    if (phone !== undefined) user.phone = phone
    if (roles) user.roles = roles
    if (status) user.status = status
    
    user.updatedAt = getCurrentTime()
    user.updatedBy = updatedBy || 'system'
    
    await usersDb.write()
    
    const { password: _, ...userWithoutPassword } = user
    res.json({ success: true, message: '用户更新成功', data: userWithoutPassword })
  } catch (error) {
    console.error('[Users] 更新用户失败:', error)
    res.status(500).json({ success: false, message: '更新用户失败' })
  }
})

// 删除用户
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    await usersDb.read()
    const users = usersDb.data || []
    
    const userIndex = users.findIndex(u => u.id === id)
    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }
    
    // 不允许删除 admin 用户
    if (users[userIndex].username === 'admin') {
      return res.status(403).json({ success: false, message: '不能删除系统管理员账号' })
    }
    
    users.splice(userIndex, 1)
    await usersDb.write()
    
    res.json({ success: true, message: '用户删除成功' })
  } catch (error) {
    console.error('[Users] 删除用户失败:', error)
    res.status(500).json({ success: false, message: '删除用户失败' })
  }
})

// 启用/禁用用户
app.patch('/api/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status, updatedBy } = req.body
    
    if (!status || !['enabled', 'disabled'].includes(status)) {
      return res.status(400).json({ success: false, message: '状态值无效' })
    }
    
    await usersDb.read()
    const users = usersDb.data || []
    
    const userIndex = users.findIndex(u => u.id === id)
    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }
    
    // 不允许禁用 admin 用户
    if (users[userIndex].username === 'admin' && status === 'disabled') {
      return res.status(403).json({ success: false, message: '不能禁用系统管理员账号' })
    }
    
    users[userIndex].status = status
    users[userIndex].updatedAt = getCurrentTime()
    users[userIndex].updatedBy = updatedBy || 'system'
    
    await usersDb.write()
    
    const { password, ...userWithoutPassword } = users[userIndex]
    res.json({ 
      success: true, 
      message: status === 'enabled' ? '用户已启用' : '用户已禁用',
      data: userWithoutPassword
    })
  } catch (error) {
    console.error('[Users] 更新用户状态失败:', error)
    res.status(500).json({ success: false, message: '更新用户状态失败' })
  }
})

// 角色枚举值
app.get('/api/users/roles/enums', async (req, res) => {
  try {
    const roles = [
      { value: '系统管理员', label: '系统管理员' },
      { value: '普通用户', label: '普通用户' },
      { value: '数据分析师', label: '数据分析师' },
      { value: '财务管理员', label: '财务管理员' },
      { value: '运营人员', label: '运营人员' }
    ]
    res.json({ success: true, data: roles })
  } catch (error) {
    console.error('[Users] 获取角色枚举失败:', error)
    res.status(500).json({ success: false, message: '获取角色枚举失败' })
  }
})

// ==================== 服务管理 API ====================

// 获取所有服务状态
app.get('/api/services', async (_, res) => {
  try {
    const services = await serviceManager.getAllServiceStatus();
    res.json({ success: true, data: services });
  } catch (error) {
    console.error('[ServiceManager] 获取服务状态失败:', error);
    res.status(500).json({ success: false, message: '获取服务状态失败' });
  }
});

// 获取单个服务状态
app.get('/api/services/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const status = await serviceManager.checkServiceStatus(id);
    res.json({ success: true, data: status });
  } catch (error) {
    console.error('[ServiceManager] 获取服务状态失败:', error);
    res.status(500).json({ success: false, message: '获取服务状态失败' });
  }
});

// 启动服务
app.post('/api/services/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await serviceManager.startService(id);
    res.json(result);
  } catch (error) {
    console.error('[ServiceManager] 启动服务失败:', error);
    res.status(500).json({ success: false, message: '启动服务失败' });
  }
});

// 停止服务
app.post('/api/services/:id/stop', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await serviceManager.stopService(id);
    res.json(result);
  } catch (error) {
    console.error('[ServiceManager] 停止服务失败:', error);
    res.status(500).json({ success: false, message: '停止服务失败' });
  }
});

// 重启服务
app.post('/api/services/:id/restart', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await serviceManager.restartService(id);
    res.json(result);
  } catch (error) {
    console.error('[ServiceManager] 重启服务失败:', error);
    res.status(500).json({ success: false, message: '重启服务失败' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 久财AI API服务器运行在 http://localhost:${PORT}`)
  console.log(`📊 API文档: http://localhost:${PORT}/api/health`)
})
