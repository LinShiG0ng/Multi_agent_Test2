# 使用指南

## 快速开始

### 1. 配置API密钥

在项目根目录创建 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的Claude API密钥：

```env
ANTHROPIC_API_KEY=sk-ant-xxxxx
PORT=3000
```

> 💡 如何获取API密钥：访问 https://console.anthropic.com/ 注册并创建API密钥

### 2. 启动服务

```bash
npm start
```

看到以下输出表示启动成功：

```
✓ 数据存储初始化完成
✓ MCP工具加载完成

========================================
🚀 多智能体协作系统已启动
========================================
📡 服务器地址: http://localhost:3000
📊 API文档: http://localhost:3000/api/health
🌐 前端界面: http://localhost:3000
========================================
```

### 3. 访问应用

在浏览器中打开：http://localhost:3000

## 功能演示

### 场景1：创建第一个智能体

1. 点击"智能体管理"标签
2. 点击"创建智能体"
3. 填写以下信息：
   - **名称**：Python编程助手
   - **英文标识**：python_helper
   - **提示词**：
     ```
     你是一个Python编程专家，擅长编写高质量的Python代码。
     你可以帮助用户解决Python编程问题，提供代码示例和最佳实践。
     ```
   - **何时调用**：当用户询问Python编程、Python代码、Python库等问题时
   - **是否可被调用**：开启
   - **MCP工具**：选择"文件系统"和"计算器"
4. 点击"保存"

### 场景2：测试智能体调用

1. 切换到"对话"标签
2. 输入：`帮我写一个Python函数，计算斐波那契数列的第n项`
3. 观察总指挥智能体的行为：
   - 总指挥会分析这是Python编程问题
   - 自动调用"Python编程助手"
   - 返回完整的代码和解释

### 场景3：多智能体协作

先创建第二个智能体：

- **名称**：技术文档助手
- **英文标识**：doc_writer
- **提示词**：
  ```
  你是一个技术文档专家，擅长为代码编写清晰的文档。
  你可以为函数、类、模块编写文档注释，创建README等。
  ```
- **何时调用**：当用户需要编写技术文档、代码注释、API文档时

然后测试：

输入：`写一个快速排序的Python代码，并为它生成详细的文档`

总指挥会：
1. 调用"Python编程助手"生成快速排序代码
2. 调用"技术文档助手"为代码添加文档
3. 整合返回完整结果

## 实用示例

### 示例1：代码助手

创建一个通用代码助手：

```json
{
  "名称": "全栈代码助手",
  "英文标识": "fullstack_dev",
  "提示词": "你是一个全栈开发专家，精通前端（React, Vue）和后端（Node.js, Python）技术。",
  "何时调用": "当用户询问Web开发、前端、后端、全栈相关问题时",
  "可被调用": true,
  "MCP工具": ["filesystem"],
  "内置工具": []
}
```

### 示例2：内容创作助手

```json
{
  "名称": "营销文案专家",
  "英文标识": "marketing_writer",
  "提示词": "你是一个资深的营销文案专家，擅长创作吸引人的营销内容、广告文案、产品描述等。",
  "何时调用": "当用户需要创作营销文案、广告内容、产品描述、品牌故事时",
  "可被调用": true,
  "MCP工具": [],
  "内置工具": []
}
```

### 示例3：数据分析助手

```json
{
  "名称": "数据科学家",
  "英文标识": "data_scientist",
  "提示词": "你是一个数据科学专家，精通数据分析、机器学习、数据可视化。使用Python的pandas、numpy、scikit-learn等库。",
  "何时调用": "当用户需要分析数据、统计计算、机器学习、数据可视化时",
  "可被调用": true,
  "MCP工具": ["calculator", "filesystem"],
  "内置工具": []
}
```

## 自定义总指挥提示词

编辑 `server/orchestrator-prompt.txt` 来调整总指挥的行为：

```bash
# 编辑提示词文件
vim server/orchestrator-prompt.txt

# 保存后重启服务
npm start
```

### 提示词优化建议

1. **明确职责**：清晰说明总指挥的角色和职责
2. **调用规则**：详细说明何时以及如何调用子智能体
3. **协作策略**：描述如何协调多个智能体
4. **响应格式**：指导如何整合和呈现结果

示例提示词片段：

```
你是多智能体系统的总指挥。你需要：

1. 分析用户需求的复杂度
2. 判断是否需要调用专门的智能体
3. 选择最合适的智能体组合
4. 协调多个智能体的执行顺序
5. 整合结果，给用户连贯的回答

调用策略：
- 简单问题：直接回答，不调用子智能体
- 专业问题：调用对应领域的专家智能体
- 复杂任务：分解为多个步骤，依次调用多个智能体
```

## 导入示例智能体

项目包含了一个示例智能体配置文件 `server/agents.example.json`，包含4个预配置的智能体：

1. 代码助手
2. 文案创作助手
3. 数据分析助手
4. 研究助手

导入方法：

```bash
# 复制示例文件
cp server/agents.example.json server/agents.json

# 重启服务
npm start
```

刷新浏览器，这些智能体就会出现在"智能体管理"页面。

## 常见问题

### Q: 总指挥不调用我的智能体？

A: 检查以下几点：
1. "是否可被调用"选项是否开启
2. "何时调用"描述是否清晰且与用户问题匹配
3. 智能体名称和描述是否让总指挥能理解其用途
4. 尝试在用户问题中明确提到智能体的专业领域

### Q: 如何让智能体之间相互调用？

A: 目前的架构中，只有总指挥可以调用子智能体。如果需要智能体间的相互调用，需要：
1. 将子智能体的调用能力也转化为工具
2. 修改 `orchestrator.js` 中的逻辑
3. 注意防止循环调用

### Q: 能否添加更多的MCP工具？

A: 可以！编辑 `server/services/mcpService.js`：

```javascript
// 在 loadExampleMcpTools() 方法中添加
this.registerMcp('your_tool_name', [
  {
    name: 'tool_function',
    description: '工具描述',
    input_schema: {
      type: 'object',
      properties: {
        param: { type: 'string', description: '参数说明' }
      },
      required: ['param']
    }
  }
]);
```

### Q: 对话历史存储在哪里？

A: 当前版本中，对话历史仅保存在浏览器的内存中。刷新页面会丢失。

如需持久化：
1. 添加数据库支持（MongoDB、PostgreSQL等）
2. 修改 `server/routes/agents.js` 中的 chat 端点
3. 实现会话管理和历史记录存储

## 进阶用法

### 添加用户认证

1. 安装passport.js
2. 创建用户模型
3. 为智能体添加用户所有权
4. 修改API路由添加认证中间件

### 实现流式响应

1. 修改 `server/routes/agents.js`，使用SSE（Server-Sent Events）
2. 在 `claudeService.js` 中使用 `chatStream` 方法
3. 前端监听SSE事件，实时显示响应

### 部署到生产环境

1. 使用PM2管理进程
   ```bash
   npm install -g pm2
   pm2 start server/index.js --name multi-agent
   ```

2. 配置Nginx反向代理
   ```nginx
   server {
     listen 80;
     server_name your-domain.com;

     location / {
       proxy_pass http://localhost:3000;
     }
   }
   ```

3. 使用环境变量管理配置

## 贡献和反馈

遇到问题或有改进建议？欢迎：

1. 提交Issue
2. 发起Pull Request
3. 分享你的使用案例

---

祝您使用愉快！🎉
