// API基础URL
const API_BASE = '/api';

// 应用状态
const state = {
  agents: [],
  conversationHistory: [],
  isEditMode: false,
  currentEditId: null,
  aiProviders: []
};

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  initializeTabs();
  initializeAgentModal();
  initializeChat();
  loadAiProviders();
  loadAgents();
});

// ========== 标签页切换 ==========
function initializeTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;

      // 更新标签状态
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // 更新内容显示
      tabContents.forEach(content => {
        content.classList.remove('active');
      });

      document.getElementById(`${tabName}-tab`).classList.add('active');

      // 如果切换到智能体管理页，刷新列表
      if (tabName === 'agents') {
        loadAgents();
      }
    });
  });
}

// ========== AI提供商管理 ==========
async function loadAiProviders() {
  try {
    const response = await fetch(`${API_BASE}/agents/ai-providers/list`);
    const result = await response.json();

    if (result.success) {
      state.aiProviders = result.data;
      populateAiProviderSelect();
    }
  } catch (error) {
    console.error('加载AI提供商失败:', error);
  }
}

function populateAiProviderSelect() {
  const select = document.getElementById('agentAiProvider');
  if (!select) return;

  // 清空现有选项（保留默认选项）
  select.innerHTML = '<option value="">使用默认提供商</option>';

  // 添加AI提供商选项
  state.aiProviders.forEach(provider => {
    const option = document.createElement('option');
    option.value = provider.id;
    option.textContent = provider.name;
    option.dataset.models = JSON.stringify(provider.models);
    select.appendChild(option);
  });
}

function updateModelSelect(providerId) {
  const modelGroup = document.getElementById('aiModelGroup');
  const modelSelect = document.getElementById('agentAiModel');

  if (!providerId) {
    modelGroup.style.display = 'none';
    return;
  }

  const provider = state.aiProviders.find(p => p.id === providerId);
  if (!provider || !provider.models) {
    modelGroup.style.display = 'none';
    return;
  }

  // 显示模型选择
  modelGroup.style.display = 'block';

  // 清空并填充模型选项
  modelSelect.innerHTML = '<option value="">使用默认模型</option>';

  provider.models.forEach(model => {
    const option = document.createElement('option');
    option.value = model;
    option.textContent = model;
    modelSelect.appendChild(option);
  });
}

// ========== 智能体管理 ==========
async function loadAgents() {
  try {
    const response = await fetch(`${API_BASE}/agents`);
    const result = await response.json();

    if (result.success) {
      state.agents = result.data;
      renderAgents();
    } else {
      showError('加载智能体失败：' + result.error);
    }
  } catch (error) {
    showError('加载智能体失败：' + error.message);
  }
}

function renderAgents() {
  const container = document.getElementById('agentsList');

  if (state.agents.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-state-icon">🤖</div>
        <div class="empty-state-text">还没有创建任何智能体</div>
        <button class="btn btn-primary" onclick="openAgentModal()">创建第一个智能体</button>
      </div>
    `;
    return;
  }

  container.innerHTML = state.agents.map(agent => `
    <div class="agent-card">
      <div class="agent-header">
        <div>
          <div class="agent-name">${escapeHtml(agent.name)}</div>
          <div class="agent-id">${escapeHtml(agent.id)}</div>
        </div>
        <span class="agent-badge ${agent.callable ? 'badge-callable' : 'badge-not-callable'}">
          ${agent.callable ? '可调用' : '不可调用'}
        </span>
      </div>

      <div class="agent-info">
        <div class="agent-label">何时调用：</div>
        <div class="agent-text">${escapeHtml(agent.whenToCall || '未设置')}</div>
      </div>

      ${agent.systemPrompt ? `
        <div class="agent-info">
          <div class="agent-label">提示词：</div>
          <div class="agent-text">${escapeHtml(agent.systemPrompt.substring(0, 100))}${agent.systemPrompt.length > 100 ? '...' : ''}</div>
        </div>
      ` : ''}

      ${agent.mcpTools && agent.mcpTools.length > 0 ? `
        <div class="agent-info">
          <div class="agent-label">MCP工具：</div>
          <div class="agent-text">${agent.mcpTools.join(', ')}</div>
        </div>
      ` : ''}

      ${agent.aiProvider ? `
        <div class="agent-info">
          <div class="agent-label">AI提供商：</div>
          <div class="agent-text">${escapeHtml(agent.aiProvider)}${agent.aiModel ? ` (${escapeHtml(agent.aiModel)})` : ''}</div>
        </div>
      ` : ''}

      <div class="agent-actions">
        <button class="btn btn-primary btn-sm" onclick="editAgent('${escapeHtml(agent.id)}')">编辑</button>
        <button class="btn btn-danger btn-sm" onclick="deleteAgent('${escapeHtml(agent.id)}', '${escapeHtml(agent.name)}')">删除</button>
      </div>
    </div>
  `).join('');
}

// 初始化智能体模态框
function initializeAgentModal() {
  const modal = document.getElementById('agentModal');
  const form = document.getElementById('agentForm');
  const createBtn = document.getElementById('createAgentBtn');
  const closeBtn = document.getElementById('closeModalBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const callableCheckbox = document.getElementById('agentCallable');
  const callableLabel = document.getElementById('callableLabel');

  // 打开创建模态框
  createBtn.addEventListener('click', () => openAgentModal());

  // 关闭模态框
  closeBtn.addEventListener('click', closeAgentModal);
  cancelBtn.addEventListener('click', closeAgentModal);

  // 点击外部关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeAgentModal();
    }
  });

  // 可调用开关
  callableCheckbox.addEventListener('change', (e) => {
    callableLabel.textContent = e.target.checked ? '允许调用' : '不允许调用';
  });

  // AI提供商选择
  const providerSelect = document.getElementById('agentAiProvider');
  if (providerSelect) {
    providerSelect.addEventListener('change', (e) => {
      updateModelSelect(e.target.value);
    });
  }

  // 表单提交
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveAgent();
  });
}

function openAgentModal(agentId = null) {
  const modal = document.getElementById('agentModal');
  const form = document.getElementById('agentForm');
  const modalTitle = document.getElementById('modalTitle');

  // 重置表单
  form.reset();
  document.querySelectorAll('input[name="mcpTools"]').forEach(cb => cb.checked = false);
  document.querySelectorAll('input[name="builtinTools"]').forEach(cb => cb.checked = false);

  if (agentId) {
    // 编辑模式
    state.isEditMode = true;
    state.currentEditId = agentId;
    modalTitle.textContent = '编辑智能体';

    const agent = state.agents.find(a => a.id === agentId);
    if (agent) {
      document.getElementById('agentOriginalId').value = agent.id;
      document.getElementById('agentName').value = agent.name;
      document.getElementById('agentId').value = agent.id;
      document.getElementById('agentSystemPrompt').value = agent.systemPrompt || '';
      document.getElementById('agentWhenToCall').value = agent.whenToCall || '';
      document.getElementById('agentCallable').checked = agent.callable;
      document.getElementById('callableLabel').textContent = agent.callable ? '允许调用' : '不允许调用';

      // 设置MCP工具
      if (agent.mcpTools) {
        agent.mcpTools.forEach(tool => {
          const checkbox = document.querySelector(`input[name="mcpTools"][value="${tool}"]`);
          if (checkbox) checkbox.checked = true;
        });
      }

      // 设置内置工具
      if (agent.builtinTools) {
        agent.builtinTools.forEach(tool => {
          const checkbox = document.querySelector(`input[name="builtinTools"][value="${tool}"]`);
          if (checkbox) checkbox.checked = true;
        });
      }

      // 设置AI提供商和模型
      if (agent.aiProvider) {
        document.getElementById('agentAiProvider').value = agent.aiProvider;
        updateModelSelect(agent.aiProvider);

        // 等待模型列表加载后设置模型
        setTimeout(() => {
          if (agent.aiModel) {
            document.getElementById('agentAiModel').value = agent.aiModel;
          }
        }, 0);
      }
    }
  } else {
    // 创建模式
    state.isEditMode = false;
    state.currentEditId = null;
    modalTitle.textContent = '创建智能体';
    document.getElementById('agentCallable').checked = true;
    document.getElementById('callableLabel').textContent = '允许调用';

    // 重置AI提供商选择
    document.getElementById('agentAiProvider').value = '';
    document.getElementById('aiModelGroup').style.display = 'none';
  }

  modal.classList.add('show');
}

function closeAgentModal() {
  const modal = document.getElementById('agentModal');
  modal.classList.remove('show');
  state.isEditMode = false;
  state.currentEditId = null;
}

async function saveAgent() {
  const submitBtn = document.getElementById('submitBtn');
  const originalText = document.getElementById('submitBtnText').textContent;

  try {
    submitBtn.disabled = true;
    document.getElementById('submitBtnText').textContent = '保存中...';

    // 收集表单数据
    const name = document.getElementById('agentName').value.trim();
    const id = document.getElementById('agentId').value.trim();
    const systemPrompt = document.getElementById('agentSystemPrompt').value.trim();
    const whenToCall = document.getElementById('agentWhenToCall').value.trim();
    const callable = document.getElementById('agentCallable').checked;

    // 收集MCP工具
    const mcpTools = Array.from(document.querySelectorAll('input[name="mcpTools"]:checked'))
      .map(cb => cb.value);

    // 收集内置工具
    const builtinTools = Array.from(document.querySelectorAll('input[name="builtinTools"]:checked'))
      .map(cb => cb.value);

    // 收集AI提供商和模型
    const aiProvider = document.getElementById('agentAiProvider').value || null;
    const aiModel = document.getElementById('agentAiModel').value || null;

    const agentData = {
      name,
      id,
      systemPrompt,
      whenToCall,
      callable,
      mcpTools,
      builtinTools,
      aiProvider,
      aiModel
    };

    let response;
    if (state.isEditMode) {
      // 更新智能体
      const originalId = document.getElementById('agentOriginalId').value;
      response = await fetch(`${API_BASE}/agents/${originalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData)
      });
    } else {
      // 创建智能体
      response = await fetch(`${API_BASE}/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData)
      });
    }

    const result = await response.json();

    if (result.success) {
      closeAgentModal();
      await loadAgents();
      showSuccess(state.isEditMode ? '智能体已更新' : '智能体已创建');
    } else {
      showError(result.error);
    }
  } catch (error) {
    showError('保存失败：' + error.message);
  } finally {
    submitBtn.disabled = false;
    document.getElementById('submitBtnText').textContent = originalText;
  }
}

function editAgent(agentId) {
  openAgentModal(agentId);
}

async function deleteAgent(agentId, agentName) {
  if (!confirm(`确定要删除智能体"${agentName}"吗？此操作无法撤销。`)) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/agents/${agentId}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (result.success) {
      await loadAgents();
      showSuccess('智能体已删除');
    } else {
      showError(result.error);
    }
  } catch (error) {
    showError('删除失败：' + error.message);
  }
}

// ========== 对话功能 ==========
function initializeChat() {
  const sendBtn = document.getElementById('sendBtn');
  const chatInput = document.getElementById('chatInput');
  const clearChatBtn = document.getElementById('clearChatBtn');

  // 发送消息
  sendBtn.addEventListener('click', sendMessage);

  // 按Enter发送，Shift+Enter换行
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // 清空对话
  clearChatBtn.addEventListener('click', () => {
    if (confirm('确定要清空对话历史吗？')) {
      state.conversationHistory = [];
      renderChatMessages();
    }
  });
}

async function sendMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();

  if (!message) return;

  const sendBtn = document.getElementById('sendBtn');
  const sendBtnText = document.getElementById('sendBtnText');
  const sendBtnLoading = document.getElementById('sendBtnLoading');

  try {
    // 禁用输入
    sendBtn.disabled = true;
    input.disabled = true;
    sendBtnText.style.display = 'none';
    sendBtnLoading.style.display = 'inline-block';

    // 添加用户消息到界面
    addMessageToUI('user', message);
    input.value = '';

    // 发送到后端
    const response = await fetch(`${API_BASE}/agents/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversationHistory: state.conversationHistory
      })
    });

    const result = await response.json();

    if (result.success) {
      // 更新对话历史
      state.conversationHistory = result.conversationHistory;

      // 添加助手回复到界面
      addMessageToUI('assistant', result.reply);
    } else {
      showError('发送失败：' + result.error);
      // 添加错误消息
      addMessageToUI('assistant', `抱歉，出现了错误：${result.error}`);
    }
  } catch (error) {
    showError('发送失败：' + error.message);
    addMessageToUI('assistant', `抱歉，出现了错误：${error.message}`);
  } finally {
    // 恢复输入
    sendBtn.disabled = false;
    input.disabled = false;
    sendBtnText.style.display = 'inline';
    sendBtnLoading.style.display = 'none';
    input.focus();
  }
}

function addMessageToUI(role, content) {
  const messagesContainer = document.getElementById('chatMessages');

  // 移除空状态
  const emptyState = messagesContainer.querySelector('.empty-state');
  if (emptyState) {
    emptyState.remove();
  }

  // 创建消息元素
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;

  const headerDiv = document.createElement('div');
  headerDiv.className = 'message-header';
  headerDiv.textContent = role === 'user' ? '您' : '总指挥智能体';

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.textContent = content;

  messageDiv.appendChild(headerDiv);
  messageDiv.appendChild(contentDiv);

  messagesContainer.appendChild(messageDiv);

  // 滚动到底部
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function renderChatMessages() {
  const messagesContainer = document.getElementById('chatMessages');

  if (state.conversationHistory.length === 0) {
    messagesContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">💭</div>
        <div class="empty-state-text">开始与总指挥智能体对话</div>
      </div>
    `;
    return;
  }

  messagesContainer.innerHTML = '';

  state.conversationHistory.forEach(msg => {
    if (msg.role === 'user' || msg.role === 'assistant') {
      let content = '';
      if (typeof msg.content === 'string') {
        content = msg.content;
      } else if (Array.isArray(msg.content)) {
        content = msg.content
          .filter(block => block.type === 'text')
          .map(block => block.text)
          .join('\n');
      }

      if (content) {
        addMessageToUI(msg.role, content);
      }
    }
  });
}

// ========== 工具函数 ==========
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showSuccess(message) {
  // 简单的成功提示（可以用更好的UI库替换）
  alert(message);
}

function showError(message) {
  // 简单的错误提示（可以用更好的UI库替换）
  alert('错误：' + message);
  console.error(message);
}
