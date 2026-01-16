import claudeService from './claudeService.js';
import openaiService from './openaiService.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * AI服务管理器 - 统一管理不同的AI提供商
 */
class AIService {
  constructor() {
    this.providers = {
      claude: claudeService,
      openai: openaiService
    };
    this.defaultProvider = process.env.DEFAULT_AI_PROVIDER || 'claude';
  }

  /**
   * 获取指定的AI服务提供商
   * @param {string} provider - 提供商名称 (claude 或 openai)
   */
  getProvider(provider = null) {
    const providerName = provider || this.defaultProvider;

    if (!this.providers[providerName]) {
      throw new Error(`不支持的AI提供商: ${providerName}`);
    }

    return this.providers[providerName];
  }

  /**
   * 调用AI进行对话
   * @param {Object} options - 对话选项
   * @param {string} options.provider - AI提供商 (claude 或 openai)
   * @param {string} options.systemPrompt - 系统提示词
   * @param {Array} options.messages - 对话历史
   * @param {Array} options.tools - 可用工具列表
   * @param {number} options.maxTokens - 最大token数
   * @param {string} options.model - 指定模型（可选）
   */
  async chat({ provider, systemPrompt, messages, tools = [], maxTokens = 4096, model = null }) {
    try {
      const aiProvider = this.getProvider(provider);

      const response = await aiProvider.chat({
        systemPrompt,
        messages,
        tools,
        maxTokens,
        model
      });

      return response;
    } catch (error) {
      console.error(`AI服务调用失败 (${provider}):`, error);
      throw error;
    }
  }

  /**
   * 流式调用AI
   */
  async chatStream({ provider, systemPrompt, messages, tools = [], onUpdate, model = null }) {
    try {
      const aiProvider = this.getProvider(provider);

      const response = await aiProvider.chatStream({
        systemPrompt,
        messages,
        tools,
        onUpdate,
        model
      });

      return response;
    } catch (error) {
      console.error(`AI流式服务调用失败 (${provider}):`, error);
      throw error;
    }
  }

  /**
   * 验证提供商是否可用
   * @param {string} provider - 提供商名称
   */
  isProviderAvailable(provider) {
    if (provider === 'claude') {
      return !!process.env.ANTHROPIC_API_KEY;
    } else if (provider === 'openai') {
      return !!process.env.OPENAI_API_KEY;
    }
    return false;
  }

  /**
   * 获取所有可用的提供商列表
   */
  getAvailableProviders() {
    const providers = [];

    if (this.isProviderAvailable('claude')) {
      providers.push({
        id: 'claude',
        name: 'Claude (Anthropic)',
        models: [
          'claude-3-5-sonnet-20241022',
          'claude-3-opus-20240229',
          'claude-3-sonnet-20240229',
          'claude-3-haiku-20240307'
        ]
      });
    }

    if (this.isProviderAvailable('openai')) {
      providers.push({
        id: 'openai',
        name: 'OpenAI',
        models: [
          'gpt-4',
          'gpt-4-turbo',
          'gpt-4o',
          'gpt-3.5-turbo'
        ]
      });
    }

    return providers;
  }

  /**
   * 提取响应文本内容
   */
  extractTextFromContent(content) {
    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n');
    }

    return '';
  }

  /**
   * 提取工具调用
   */
  extractToolUses(content) {
    if (!Array.isArray(content)) {
      return [];
    }

    return content.filter(block => block.type === 'tool_use');
  }
}

export default new AIService();
