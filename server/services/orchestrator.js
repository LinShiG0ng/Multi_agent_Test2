import claudeService from './claudeService.js';
import storage from '../utils/storage.js';
import mcpService from './mcpService.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ORCHESTRATOR_PROMPT_FILE = path.join(__dirname, '../orchestrator-prompt.txt');

/**
 * 总指挥智能体 - 负责统筹和调度多个智能体
 */
class Orchestrator {
  constructor() {
    this.conversationHistory = [];
  }

  /**
   * 读取总指挥智能体的系统提示词
   */
  async getOrchestratorPrompt() {
    try {
      const prompt = await fs.readFile(ORCHESTRATOR_PROMPT_FILE, 'utf-8');
      return prompt;
    } catch {
      // 如果文件不存在，返回默认提示词
      return this.getDefaultPrompt();
    }
  }

  /**
   * 获取默认的总指挥提示词
   */
  getDefaultPrompt() {
    return `你是一个智能体调度系统的总指挥。你的职责是：

1. 理解用户的请求和需求
2. 分析哪些智能体可以帮助完成任务
3. 决定调用哪个或哪些智能体
4. 协调多个智能体之间的协作
5. 整合各个智能体的结果，给用户一个完整的回答

你可以调用的智能体列表会以工具的形式提供给你。每个智能体工具的描述中包含了：
- 智能体的名称
- 智能体的用途说明
- 何时应该调用该智能体

调用智能体的规则：
- 根据用户需求和智能体的"何时调用"描述，判断是否需要调用某个智能体
- 可以连续调用多个智能体来完成复杂任务
- 将用户的问题或任务分解，传递给合适的智能体
- 整合智能体的返回结果，给用户清晰的答复

注意：
- 如果用户的问题不需要特定智能体，你可以直接回答
- 如果需要多个智能体协作，请依次调用它们
- 保持对话的连贯性和用户体验`;
  }

  /**
   * 将智能体转换为Claude工具定义
   */
  convertAgentsToTools(agents) {
    return agents.map(agent => ({
      name: `call_agent_${agent.id}`,
      description: `智能体名称：${agent.name}\n用途：${agent.whenToCall || '通用智能体'}\n\n调用此工具来使用该智能体处理用户请求。`,
      input_schema: {
        type: 'object',
        properties: {
          task: {
            type: 'string',
            description: '要交给该智能体处理的具体任务或问题'
          },
          context: {
            type: 'string',
            description: '相关的上下文信息（可选）'
          }
        },
        required: ['task']
      }
    }));
  }

  /**
   * 执行子智能体
   */
  async executeAgent(agentId, task, context = '') {
    const agent = await storage.getAgent(agentId);

    if (!agent) {
      return {
        success: false,
        error: `智能体 ${agentId} 不存在`
      };
    }

    if (!agent.callable) {
      return {
        success: false,
        error: `智能体 ${agent.name} 不允许被其他智能体调用`
      };
    }

    try {
      // 构建子智能体的系统提示词
      const systemPrompt = agent.systemPrompt || `你是${agent.name}`;

      // 构建消息
      const messages = [{
        role: 'user',
        content: context ? `上下文：${context}\n\n任务：${task}` : task
      }];

      // 获取智能体的工具列表
      const tools = await this.getAgentTools(agent);

      // 调用Claude API
      const response = await claudeService.chat({
        systemPrompt,
        messages,
        tools,
        maxTokens: 4096
      });

      // 处理工具调用
      if (response.stop_reason === 'tool_use') {
        const toolResults = await this.handleToolCalls(response.content, agent);

        // 将工具结果返回给子智能体继续处理
        messages.push({
          role: 'assistant',
          content: response.content
        });
        messages.push({
          role: 'user',
          content: toolResults
        });

        const finalResponse = await claudeService.chat({
          systemPrompt,
          messages,
          tools,
          maxTokens: 4096
        });

        return {
          success: true,
          result: this.extractTextFromContent(finalResponse.content),
          agentName: agent.name
        };
      }

      return {
        success: true,
        result: this.extractTextFromContent(response.content),
        agentName: agent.name
      };
    } catch (error) {
      console.error(`执行智能体 ${agentId} 失败:`, error);
      return {
        success: false,
        error: error.message,
        agentName: agent.name
      };
    }
  }

  /**
   * 获取智能体的工具列表
   */
  async getAgentTools(agent) {
    const tools = [];

    // 添加内置工具
    if (agent.builtinTools && agent.builtinTools.length > 0) {
      // 这里可以根据builtinTools列表添加实际的内置工具定义
      // 暂时返回空数组，可以后续扩展
    }

    // 添加MCP工具
    if (agent.mcpTools && agent.mcpTools.length > 0) {
      const mcpTools = await mcpService.getMcpTools(agent.mcpTools);
      tools.push(...mcpTools);
    }

    return tools;
  }

  /**
   * 处理工具调用
   */
  async handleToolCalls(content, agent) {
    const toolUses = content.filter(block => block.type === 'tool_use');
    const results = [];

    for (const toolUse of toolUses) {
      // 处理MCP工具调用
      if (agent.mcpTools && agent.mcpTools.some(mcp => toolUse.name.startsWith(mcp))) {
        const result = await mcpService.callMcpTool(toolUse.name, toolUse.input);
        results.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result)
        });
      }
      // 这里可以添加内置工具的处理逻辑
    }

    return results;
  }

  /**
   * 从响应内容中提取文本
   */
  extractTextFromContent(content) {
    if (Array.isArray(content)) {
      return content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n');
    }
    return content;
  }

  /**
   * 处理用户消息（主入口）
   */
  async handleMessage(userMessage, conversationHistory = []) {
    try {
      // 获取可调用的智能体
      const callableAgents = await storage.getCallableAgents();

      // 获取总指挥的系统提示词
      const systemPrompt = await this.getOrchestratorPrompt();

      // 将智能体转换为工具
      const agentTools = this.convertAgentsToTools(callableAgents);

      // 构建对话历史
      const messages = [
        ...conversationHistory,
        {
          role: 'user',
          content: userMessage
        }
      ];

      // 调用总指挥智能体
      let response = await claudeService.chat({
        systemPrompt,
        messages,
        tools: agentTools,
        maxTokens: 4096
      });

      // 处理智能体调用
      let iterations = 0;
      const maxIterations = 10; // 防止无限循环

      while (response.stop_reason === 'tool_use' && iterations < maxIterations) {
        iterations++;

        // 提取工具调用
        const toolUses = response.content.filter(block => block.type === 'tool_use');
        const toolResults = [];

        // 执行每个工具调用
        for (const toolUse of toolUses) {
          // 提取智能体ID
          const agentId = toolUse.name.replace('call_agent_', '');
          const { task, context } = toolUse.input;

          // 执行子智能体
          const result = await this.executeAgent(agentId, task, context);

          // 构建工具结果
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: result.success
              ? `智能体"${result.agentName}"的执行结果：\n${result.result}`
              : `智能体执行失败：${result.error}`
          });
        }

        // 将工具调用和结果添加到消息历史
        messages.push({
          role: 'assistant',
          content: response.content
        });
        messages.push({
          role: 'user',
          content: toolResults
        });

        // 继续对话
        response = await claudeService.chat({
          systemPrompt,
          messages,
          tools: agentTools,
          maxTokens: 4096
        });
      }

      // 提取最终回复
      const finalReply = this.extractTextFromContent(response.content);

      return {
        success: true,
        reply: finalReply,
        conversationHistory: [
          ...messages,
          {
            role: 'assistant',
            content: response.content
          }
        ]
      };
    } catch (error) {
      console.error('总指挥智能体处理失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new Orchestrator();
