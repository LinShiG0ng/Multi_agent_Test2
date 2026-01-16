import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Claude API 服务
 */
class ClaudeService {
  /**
   * 调用Claude API进行对话
   * @param {string} systemPrompt - 系统提示词
   * @param {Array} messages - 对话历史
   * @param {Array} tools - 可用工具列表
   * @param {number} maxTokens - 最大token数
   */
  async chat({ systemPrompt, messages, tools = [], maxTokens = 4096 }) {
    try {
      const params = {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: maxTokens,
        messages: messages,
      };

      if (systemPrompt) {
        params.system = systemPrompt;
      }

      if (tools && tools.length > 0) {
        params.tools = tools;
      }

      const response = await client.messages.create(params);
      return response;
    } catch (error) {
      console.error('Claude API调用失败:', error);
      throw error;
    }
  }

  /**
   * 流式调用Claude API
   * @param {string} systemPrompt - 系统提示词
   * @param {Array} messages - 对话历史
   * @param {Array} tools - 可用工具列表
   * @param {Function} onUpdate - 流式更新回调
   */
  async chatStream({ systemPrompt, messages, tools = [], onUpdate }) {
    try {
      const params = {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: messages,
        stream: true,
      };

      if (systemPrompt) {
        params.system = systemPrompt;
      }

      if (tools && tools.length > 0) {
        params.tools = tools;
      }

      const stream = await client.messages.create(params);

      let fullContent = '';
      let toolUses = [];

      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            fullContent += event.delta.text;
            if (onUpdate) {
              onUpdate({ type: 'text', content: event.delta.text });
            }
          }
        } else if (event.type === 'content_block_start') {
          if (event.content_block.type === 'tool_use') {
            toolUses.push(event.content_block);
          }
        }
      }

      return { content: fullContent, toolUses };
    } catch (error) {
      console.error('Claude API流式调用失败:', error);
      throw error;
    }
  }
}

export default new ClaudeService();
