# OpenAI API 配置指南

本文档说明如何在多智能体协作系统中配置和使用OpenAI API（以及兼容OpenAI格式的其他API服务）。

## 快速开始

### 1. 配置API密钥

编辑 `.env` 文件，添加OpenAI配置：

```env
# OpenAI官方API
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_API_BASE=https://api.openai.com/v1
OPENAI_DEFAULT_MODEL=gpt-4

# 设置为默认提供商（可选）
DEFAULT_AI_PROVIDER=openai
```

### 2. 重启服务

```bash
npm start
```

### 3. 创建使用OpenAI的智能体

1. 打开 http://localhost:3000
2. 进入"智能体管理"
3. 点击"创建智能体"
4. 在"AI提供商"下拉框中选择"OpenAI"
5. 在"AI模型"下拉框中选择具体模型（如 gpt-4）
6. 填写其他信息并保存

## 支持的OpenAI模型

系统默认支持以下OpenAI模型：

- **gpt-4**：最强大的模型，适合复杂任务
- **gpt-4-turbo**：速度更快的GPT-4版本
- **gpt-4o**：最新的优化版本
- **gpt-3.5-turbo**：速度快、成本低，适合简单任务

## 使用其他兼容OpenAI格式的API

系统支持任何兼容OpenAI API格式的服务。

### Azure OpenAI

```env
OPENAI_API_KEY=your-azure-api-key
OPENAI_API_BASE=https://your-resource.openai.azure.com/
OPENAI_DEFAULT_MODEL=gpt-4
```

### 国内API服务商

许多国内服务商提供兼容OpenAI格式的API：

```env
# 示例配置
OPENAI_API_KEY=your-api-key
OPENAI_API_BASE=https://api.your-provider.com/v1
OPENAI_DEFAULT_MODEL=gpt-4
```

### 本地部署的模型（如LM Studio、Ollama等）

```env
OPENAI_API_KEY=not-needed
OPENAI_API_BASE=http://localhost:1234/v1
OPENAI_DEFAULT_MODEL=your-local-model
```

## 混合使用Claude和OpenAI

系统支持同时配置多个AI提供商，可以为不同的智能体选择不同的提供商。

### 配置示例

```env
# Claude配置
ANTHROPIC_API_KEY=sk-ant-your-claude-key

# OpenAI配置
OPENAI_API_KEY=sk-your-openai-key
OPENAI_API_BASE=https://api.openai.com/v1
OPENAI_DEFAULT_MODEL=gpt-4

# 默认使用Claude
DEFAULT_AI_PROVIDER=claude
```

### 使用场景

**智能体A - 代码助手**
- 提供商：Claude
- 模型：claude-3-5-sonnet-20241022
- 原因：Claude在代码生成和推理方面表现优秀

**智能体B - 快速问答**
- 提供商：OpenAI
- 模型：gpt-3.5-turbo
- 原因：速度快，成本低，适合简单问答

**智能体C - 创意写作**
- 提供商：OpenAI
- 模型：gpt-4
- 原因：创意生成能力强

**总指挥智能体**
- 使用系统默认（Claude）
- 原因：需要强大的推理能力来调度其他智能体

## 成本控制建议

### 按任务复杂度选择模型

| 任务类型 | 推荐模型 | 成本 | 适用场景 |
|---------|---------|------|----------|
| 简单问答 | gpt-3.5-turbo | 低 | 客服、FAQ、简单信息查询 |
| 中等任务 | gpt-4-turbo | 中 | 文案创作、数据分析、代码审查 |
| 复杂任务 | gpt-4 / claude-3.5-sonnet | 高 | 复杂编程、深度分析、架构设计 |

### 优化策略

1. **分层架构**：总指挥用强大模型，简单子智能体用轻量模型
2. **缓存结果**：相同问题复用之前的结果
3. **限制token**：合理设置maxTokens参数
4. **监控成本**：定期检查API使用情况

## 故障排除

### 问题1：无法连接到OpenAI API

**检查项**：
- API密钥是否正确
- 网络是否可以访问OpenAI服务器
- OPENAI_API_BASE是否配置正确

**解决方案**：
```bash
# 测试连接
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### 问题2：模型列表为空

**原因**：系统检测到API密钥未配置

**解决方案**：
1. 检查 `.env` 文件中 `OPENAI_API_KEY` 是否正确设置
2. 重启服务：`npm start`
3. 刷新浏览器

### 问题3：使用第三方API时报错

**常见问题**：
- API Base地址不正确
- 模型名称不匹配
- 请求格式不完全兼容

**解决方案**：
1. 确认API服务商的文档，获取正确的Base URL
2. 使用服务商支持的模型名称
3. 查看服务器日志了解详细错误信息

### 问题4：响应格式错误

**原因**：某些兼容服务的响应格式与标准OpenAI API略有不同

**解决方案**：
- 查看 `server/services/openaiService.js` 中的格式转换逻辑
- 根据实际API响应调整转换代码
- 提交Issue报告兼容性问题

## API密钥安全

### 最佳实践

1. **不要提交.env文件到Git**
   ```bash
   # .gitignore 已包含
   .env
   ```

2. **生产环境使用环境变量**
   ```bash
   export OPENAI_API_KEY=your-key
   export ANTHROPIC_API_KEY=your-key
   npm start
   ```

3. **定期轮换API密钥**
   - OpenAI: https://platform.openai.com/api-keys
   - Anthropic: https://console.anthropic.com/

4. **限制API密钥权限**
   - 只授予必要的权限
   - 设置使用限额

## 进阶配置

### 自定义模型列表

编辑 `server/services/aiService.js`，在 `getAvailableProviders` 方法中添加模型：

```javascript
if (this.isProviderAvailable('openai')) {
  providers.push({
    id: 'openai',
    name: 'OpenAI',
    models: [
      'gpt-4',
      'gpt-4-turbo',
      'gpt-4o',
      'gpt-3.5-turbo',
      'your-custom-model'  // 添加自定义模型
    ]
  });
}
```

### 添加新的API提供商

1. 创建服务文件 `server/services/yourProviderService.js`
2. 实现 `chat` 和 `chatStream` 方法
3. 在 `aiService.js` 中注册提供商
4. 更新前端模型列表

## 测试配置

创建一个测试智能体来验证OpenAI配置：

1. **名称**：OpenAI测试助手
2. **英文标识**：openai_test
3. **提示词**：你是一个测试助手，回答要简洁
4. **何时调用**：当用户要测试OpenAI时
5. **AI提供商**：OpenAI
6. **AI模型**：gpt-3.5-turbo
7. **可被调用**：是

然后在对话界面输入：
```
请测试OpenAI的连接
```

如果收到正常回复，说明配置成功。

## 相关资源

- [OpenAI API文档](https://platform.openai.com/docs)
- [OpenAI Pricing](https://openai.com/pricing)
- [Azure OpenAI文档](https://learn.microsoft.com/azure/ai-services/openai/)
- [Anthropic API文档](https://docs.anthropic.com/)

## 获取帮助

如遇到问题，请：

1. 查看服务器日志：查看控制台输出
2. 检查网络连接：确保可以访问API服务器
3. 查看API状态：https://status.openai.com/
4. 提交Issue：在GitHub仓库提交问题

---

祝您使用愉快！如有问题欢迎反馈。
