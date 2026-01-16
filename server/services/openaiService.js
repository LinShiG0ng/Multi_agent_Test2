import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE || 'https://api.openai.com/v1',
});

/**
 * OpenAI API 服务
 */
class OpenAIService {
  /**
   * 调用OpenAI API进行对话
   * @param {string} systemPrompt - 系统提示词
   * @param {Array} messages - 对话历史
   * @param {Array} tools - 可用工具列表
   * @param {number} maxTokens - 最大token数
   */
  async chat({ systemPrompt, messages, tools = [], maxTokens = 4096, model = null }) {
    try {
      // 将消息格式转换为OpenAI格式
      const openaiMessages = this.convertMessages(messages, systemPrompt);

      const params = {
        model: model || process.env.OPENAI_DEFAULT_MODEL || 'gpt-4',
        max_tokens: maxTokens,
        messages: openaiMessages,
      };

      // 如果有工具，添加到请求中
      if (tools && tools.length > 0) {
        params.tools = this.convertTools(tools);
        params.tool_choice = 'auto';
      }

      const response = await client.chat.completions.create(params);

      // 转换为统一格式
      return this.convertResponse(response);
    } catch (error) {
      console.error('OpenAI API调用失败:', error);
      throw error;
    }
  }

  /**
   * 转换消息格式为OpenAI格式
   */
  convertMessages(messages, systemPrompt) {
    const openaiMessages = [];

    // 添加系统提示词
    if (systemPrompt) {
      openaiMessages.push({
        role: 'system',
        content: systemPrompt
      });
    }

    // 转换消息历史
    for (const msg of messages) {
      if (msg.role === 'user') {
        openaiMessages.push({
          role: 'user',
          content: typeof msg.content === 'string' ? msg.content : this.extractTextContent(msg.content)
        });
      } else if (msg.role === 'assistant') {
        // 处理助手消息
        if (typeof msg.content === 'string') {
          openaiMessages.push({
            role: 'assistant',
            content: msg.content
          });
        } else if (Array.isArray(msg.content)) {
          const textContent = this.extractTextContent(msg.content);
          const toolCalls = this.extractToolCalls(msg.content);

          const assistantMsg = {
            role: 'assistant',
            content: textContent || null
          };

          if (toolCalls.length > 0) {
            assistantMsg.tool_calls = toolCalls;
          }

          openaiMessages.push(assistantMsg);
        }
      } else if (msg.role === 'tool' || (Array.isArray(msg.content) && msg.content[0]?.type === 'tool_result')) {
        // 处理工具结果
        const toolResults = Array.isArray(msg.content) ? msg.content : [msg.content];
        for (const result of toolResults) {
          if (result.type === 'tool_result') {
            openaiMessages.push({
              role: 'tool',
              tool_call_id: result.tool_use_id,
              content: result.content
            });
          }
        }
      }
    }

    return openaiMessages;
  }

  /**
   * 提取文本内容
   */
  extractTextContent(content) {
    if (typeof content === 'string') return content;
    if (!Array.isArray(content)) return '';

    return content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');
  }

  /**
   * 提取工具调用
   */
  extractToolCalls(content) {
    if (!Array.isArray(content)) return [];

    return content
      .filter(block => block.type === 'tool_use')
      .map(block => ({
        id: block.id,
        type: 'function',
        function: {
          name: block.name,
          arguments: JSON.stringify(block.input)
        }
      }));
  }

  /**
   * 转换工具格式为OpenAI格式
   */
  convertTools(tools) {
    return tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.input_schema
      }
    }));
  }

  /**
   * 转换响应为统一格式
   */
  convertResponse(response) {
    const choice = response.choices[0];
    const message = choice.message;

    // 构建内容数组
    const content = [];

    // 添加文本内容
    if (message.content) {
      content.push({
        type: 'text',
        text: message.content
      });
    }

    // 添加工具调用
    if (message.tool_calls && message.tool_calls.length > 0) {
      for (const toolCall of message.tool_calls) {
        content.push({
          type: 'tool_use',
          id: toolCall.id,
          name: toolCall.function.name,
          input: JSON.parse(toolCall.function.arguments)
        });
      }
    }

    // 确定停止原因
    let stopReason = 'end_turn';
    if (choice.finish_reason === 'tool_calls') {
      stopReason = 'tool_use';
    } else if (choice.finish_reason === 'length') {
      stopReason = 'max_tokens';
    }

    return {
      id: response.id,
      type: 'message',
      role: 'assistant',
      content: content,
      model: response.model,
      stop_reason: stopReason,
      usage: {
        input_tokens: response.usage.prompt_tokens,
        output_tokens: response.usage.completion_tokens
      }
    };
  }

  /**
   * 流式调用（暂未实现，保持接口一致）
   */
  async chatStream({ systemPrompt, messages, tools = [], onUpdate }) {
    // 简化版：直接调用非流式API
    const response = await this.chat({ systemPrompt, messages, tools });

    // 模拟流式返回
    const textContent = this.extractTextContent(response.content);
    if (onUpdate && textContent) {
      onUpdate({ type: 'text', content: textContent });
    }

    return {
      content: textContent,
      toolUses: response.content.filter(block => block.type === 'tool_use')
    };
  }
}

export default new OpenAIService();
