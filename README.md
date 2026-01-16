# 🤖 多智能体协作系统

一个基于"总指挥智能体"架构的多智能体协作系统，允许用户自定义多个AI智能体，并通过总指挥智能体统筹调度，实现智能体之间的协作。

## ✨ 核心特性

- **总指挥智能体架构**：通过一个总指挥智能体统筹调度多个子智能体
- **自定义智能体**：用户可以灵活创建和配置自己的智能体
- **MCP工具支持**：集成MCP（Model Context Protocol）工具
- **内置工具系统**：支持内置工具扩展
- **智能调度**：总指挥智能体根据用户需求自动选择合适的智能体
- **对话历史管理**：保持对话上下文，支持多轮对话

## 🏗️ 系统架构

### 智能体定义

每个自定义智能体包含以下配置：

1. **名称**（必填）：智能体的显示名称
2. **英文标识**（必填）：唯一ID，用于系统调用
3. **提示词**（选填）：智能体的system prompt
4. **是否可被调用**（必填）：控制智能体是否可被总指挥调用
5. **何时调用**（必填）：描述在什么情况下应该调用该智能体
6. **MCP工具**（选填）：智能体可使用的MCP工具列表
7. **内置工具**（选填）：智能体可使用的内置工具列表

### 工作流程

```
用户请求 → 总指挥智能体 → 分析需求 → 调用合适的子智能体 → 整合结果 → 返回用户
```

## 📋 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- Claude API密钥（Anthropic API Key）

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 文件为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的Claude API密钥：

```env
ANTHROPIC_API_KEY=your_api_key_here
PORT=3000
```

### 3. 启动服务

```bash
npm start
```

或者使用开发模式（支持热重载）：

```bash
npm run dev
```

### 4. 访问应用

打开浏览器访问：`http://localhost:3000`

## 📖 使用指南

### 创建智能体

1. 打开应用，切换到"智能体管理"标签
2. 点击"创建智能体"按钮
3. 填写智能体信息：
   - **名称**：例如"代码助手"
   - **英文标识**：例如"code_helper"（仅支持字母、数字、下划线）
   - **提示词**：描述智能体的角色，例如"你是一个专业的代码助手，擅长解答编程问题"
   - **何时调用**：例如"当用户询问编程、代码或技术问题时"
   - **是否可被调用**：开启此选项，允许总指挥智能体调用
   - **MCP工具**：选择该智能体可以使用的MCP工具
   - **内置工具**：选择该智能体可以使用的内置工具
4. 点击"保存"

### 使用对话功能

1. 切换到"对话"标签
2. 在输入框中输入你的问题或需求
3. 总指挥智能体会：
   - 分析你的需求
   - 决定是否需要调用子智能体
   - 如需要，自动调用合适的智能体
   - 整合结果返回给你

### 示例对话场景

**场景1：单智能体调用**

```
用户：帮我写一个Python快速排序的代码
总指挥：[分析] 这是编程问题 → [调用] 代码助手 → [返回] 代码和解释
```

**场景2：多智能体协作**

```
用户：帮我搜索React最新版本，然后生成一个示例项目
总指挥：
  [步骤1] 调用"搜索助手"获取React版本信息
  [步骤2] 调用"代码助手"生成项目代码
  [整合] 返回完整答案
```

## 🛠️ 自定义总指挥提示词

总指挥智能体的系统提示词存储在 `server/orchestrator-prompt.txt` 文件中。

你可以编辑此文件来修改总指挥智能体的行为：

```bash
vim server/orchestrator-prompt.txt
```

修改后重启服务即可生效。

## 📁 项目结构

```
Multi_agent_Test2/
├── server/                      # 后端代码
│   ├── index.js                # Express服务器入口
│   ├── agents.json             # 智能体数据存储
│   ├── orchestrator-prompt.txt # 总指挥提示词
│   ├── routes/
│   │   └── agents.js          # 智能体API路由
│   ├── services/
│   │   ├── claudeService.js   # Claude API服务
│   │   ├── orchestrator.js    # 总指挥智能体逻辑
│   │   └── mcpService.js      # MCP工具服务
│   └── utils/
│       └── storage.js         # 数据存储工具
├── public/                     # 前端代码
│   ├── index.html             # 主页面
│   ├── app.js                 # 前端逻辑
│   └── styles.css             # 样式文件
├── package.json
├── .env.example
└── README.md
```

## 🔌 API文档

### 智能体管理API

#### 获取所有智能体
```
GET /api/agents
```

#### 获取单个智能体
```
GET /api/agents/:id
```

#### 创建智能体
```
POST /api/agents
Content-Type: application/json

{
  "name": "代码助手",
  "id": "code_helper",
  "systemPrompt": "你是一个专业的代码助手...",
  "callable": true,
  "whenToCall": "当用户询问编程问题时",
  "mcpTools": ["filesystem"],
  "builtinTools": ["open_page"]
}
```

#### 更新智能体
```
PUT /api/agents/:id
Content-Type: application/json

{
  "name": "新名称",
  ...
}
```

#### 删除智能体
```
DELETE /api/agents/:id
```

### 对话API

#### 发送消息
```
POST /api/agents/chat
Content-Type: application/json

{
  "message": "用户消息",
  "conversationHistory": []
}
```

## 🎯 MCP工具扩展

系统内置了几个示例MCP工具：

- **filesystem**：文件系统操作
- **search**：网络搜索
- **calculator**：计算器

### 添加自定义MCP工具

编辑 `server/services/mcpService.js`：

```javascript
// 注册新的MCP工具
this.registerMcp('your_mcp_name', [
  {
    name: 'your_tool',
    description: '工具描述',
    input_schema: {
      type: 'object',
      properties: {
        // 定义输入参数
      }
    }
  }
]);
```

## 🔧 内置工具扩展

内置工具示例：

- **open_page**：在客户端打开新页面
- **show_dialog**：显示对话框
- **notification**：发送通知

可以在 `server/services/orchestrator.js` 中扩展内置工具的实际实现。

## 🐛 故障排除

### 问题：服务器无法启动

- 检查Node.js版本：`node --version`（需要 >= 18）
- 检查端口是否被占用：`lsof -i :3000`
- 检查 `.env` 文件是否配置正确

### 问题：API调用失败

- 检查 `ANTHROPIC_API_KEY` 是否正确配置
- 查看服务器日志输出
- 确认网络连接正常

### 问题：智能体无法被调用

- 确认智能体的"是否可被调用"选项已开启
- 检查"何时调用"描述是否清晰
- 查看总指挥提示词是否合理

## 📝 开发说明

### 技术栈

- **后端**：Node.js + Express
- **前端**：原生HTML/CSS/JavaScript
- **AI模型**：Claude 3.5 Sonnet
- **数据存储**：JSON文件

### 扩展建议

1. **数据库**：可以将JSON文件存储替换为MongoDB、PostgreSQL等数据库
2. **用户系统**：添加用户认证和多用户支持
3. **对话历史**：持久化存储对话历史
4. **流式输出**：实现流式响应以提升用户体验
5. **工具市场**：创建MCP工具和内置工具的市场
6. **智能体模板**：提供常用智能体模板

## 📄 许可证

本项目采用 MIT 许可证。

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📮 联系方式

如有问题或建议，请通过Issue联系我们。

---

**祝您使用愉快！🎉**
