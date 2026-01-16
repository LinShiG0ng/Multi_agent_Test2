import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import agentsRouter from './routes/agents.js';
import storage from './utils/storage.js';
import mcpService from './services/mcpService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API路由
app.use('/api/agents', agentsRouter);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '多智能体协作系统运行正常',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
async function startServer() {
  try {
    // 初始化存储
    await storage.initialize();
    console.log('✓ 数据存储初始化完成');

    // 加载示例MCP工具
    mcpService.loadExampleMcpTools();
    console.log('✓ MCP工具加载完成');

    app.listen(PORT, () => {
      console.log('\n========================================');
      console.log('🚀 多智能体协作系统已启动');
      console.log('========================================');
      console.log(`📡 服务器地址: http://localhost:${PORT}`);
      console.log(`📊 API文档: http://localhost:${PORT}/api/health`);
      console.log(`🌐 前端界面: http://localhost:${PORT}`);
      console.log('========================================\n');
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();
