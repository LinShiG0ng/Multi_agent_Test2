import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AGENTS_FILE = path.join(__dirname, '../agents.json');

/**
 * 智能体数据存储工具类
 */
class Storage {
  /**
   * 初始化存储文件
   */
  async initialize() {
    try {
      await fs.access(AGENTS_FILE);
    } catch {
      // 文件不存在，创建默认文件
      await this.saveAgents([]);
    }
  }

  /**
   * 读取所有智能体
   */
  async getAgents() {
    try {
      const data = await fs.readFile(AGENTS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('读取智能体数据失败:', error);
      return [];
    }
  }

  /**
   * 保存智能体列表
   */
  async saveAgents(agents) {
    await fs.writeFile(AGENTS_FILE, JSON.stringify(agents, null, 2), 'utf-8');
  }

  /**
   * 获取单个智能体
   */
  async getAgent(id) {
    const agents = await this.getAgents();
    return agents.find(agent => agent.id === id);
  }

  /**
   * 创建智能体
   */
  async createAgent(agent) {
    const agents = await this.getAgents();

    // 检查ID是否已存在
    if (agents.some(a => a.id === agent.id)) {
      throw new Error(`智能体ID "${agent.id}" 已存在`);
    }

    agents.push({
      ...agent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await this.saveAgents(agents);
    return agent;
  }

  /**
   * 更新智能体
   */
  async updateAgent(id, updates) {
    const agents = await this.getAgents();
    const index = agents.findIndex(agent => agent.id === id);

    if (index === -1) {
      throw new Error(`智能体ID "${id}" 不存在`);
    }

    // 如果更新了ID，需要检查新ID是否已存在
    if (updates.id && updates.id !== id) {
      if (agents.some(a => a.id === updates.id)) {
        throw new Error(`智能体ID "${updates.id}" 已存在`);
      }
    }

    agents[index] = {
      ...agents[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.saveAgents(agents);
    return agents[index];
  }

  /**
   * 删除智能体
   */
  async deleteAgent(id) {
    const agents = await this.getAgents();
    const filtered = agents.filter(agent => agent.id !== id);

    if (filtered.length === agents.length) {
      throw new Error(`智能体ID "${id}" 不存在`);
    }

    await this.saveAgents(filtered);
    return true;
  }

  /**
   * 获取所有可被调用的智能体
   */
  async getCallableAgents() {
    const agents = await this.getAgents();
    return agents.filter(agent => agent.callable === true);
  }
}

export default new Storage();
