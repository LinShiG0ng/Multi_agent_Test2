import express from 'express';
import storage from '../utils/storage.js';
import orchestrator from '../services/orchestrator.js';

const router = express.Router();

/**
 * 获取所有智能体
 */
router.get('/', async (req, res) => {
  try {
    const agents = await storage.getAgents();
    res.json({
      success: true,
      data: agents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取单个智能体
 */
router.get('/:id', async (req, res) => {
  try {
    const agent = await storage.getAgent(req.params.id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: '智能体不存在'
      });
    }

    res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 创建智能体
 */
router.post('/', async (req, res) => {
  try {
    const { name, id, systemPrompt, callable, whenToCall, mcpTools, builtinTools } = req.body;

    // 验证必填字段
    if (!name || !id || callable === undefined || !whenToCall) {
      return res.status(400).json({
        success: false,
        error: '缺少必填字段：name, id, callable, whenToCall'
      });
    }

    const agent = await storage.createAgent({
      name,
      id,
      systemPrompt: systemPrompt || '',
      callable,
      whenToCall,
      mcpTools: mcpTools || [],
      builtinTools: builtinTools || []
    });

    res.status(201).json({
      success: true,
      data: agent
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 更新智能体
 */
router.put('/:id', async (req, res) => {
  try {
    const agent = await storage.updateAgent(req.params.id, req.body);

    res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 删除智能体
 */
router.delete('/:id', async (req, res) => {
  try {
    await storage.deleteAgent(req.params.id);

    res.json({
      success: true,
      message: '智能体已删除'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 获取可调用的智能体列表
 */
router.get('/callable/list', async (req, res) => {
  try {
    const agents = await storage.getCallableAgents();
    res.json({
      success: true,
      data: agents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 发送消息给总指挥智能体
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: '消息不能为空'
      });
    }

    const result = await orchestrator.handleMessage(message, conversationHistory);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
