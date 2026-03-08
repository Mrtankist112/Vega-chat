let messagesContainer = document.getElementById('chatMessages');
let messageInput = document.getElementById('messageInput');
let sendButton = document.getElementById('sendButton');
let agentNameElement = document.getElementById('agentName');
let statusIndicator = document.getElementById('statusIndicator');
let settingsBtn = document.getElementById('settingsBtn');
let agentPanel = document.getElementById('agentPanel');
let closePanelBtn = document.getElementById('closePanelBtn');
let saveAgentBtn = document.getElementById('saveAgentBtn');
let resetAgentBtn = document.getElementById('resetAgentBtn');
let testConnectionBtn = document.getElementById('testConnectionBtn');
let testResult = document.getElementById('testResult');
let agentHost = document.getElementById('agentHost');
let agentPort = document.getElementById('agentPort');
let connectionType = document.getElementById('connectionType');
let timeout = document.getElementById('timeout');
let autoConnect = document.getElementById('autoConnect');

let agentOnline = false;
let agentName = "V.E.G.A";
let errorMessageShown = false;
let wasOffline = true;

// Загружаем сохраненные настройки
function loadAgentSettings() {
    const savedHost = localStorage.getItem('agentHost') || 'localhost';
    const savedPort = localStorage.getItem('agentPort') || '5000';
    const savedType = localStorage.getItem('agentType') || 'http';
    const savedTimeout = localStorage.getItem('agentTimeout') || '5';
    const savedAutoConnect = localStorage.getItem('agentAutoConnect') !== 'false';
    
    agentHost.value = savedHost;
    agentPort.value = savedPort;
    connectionType.value = savedType;
    timeout.value = savedTimeout;
    autoConnect.checked = savedAutoConnect;
}

// Сохраняем настройки
function saveAgentSettings() {
    localStorage.setItem('agentHost', agentHost.value);
    localStorage.setItem('agentPort', agentPort.value);
    localStorage.setItem('agentType', connectionType.value);
    localStorage.setItem('agentTimeout', timeout.value);
    localStorage.setItem('agentAutoConnect', autoConnect.checked);
    
    showSuccessMessage('✅ Настройки сохранены');
}

// Получить URL агента
function getAgentUrl() {
    return `${connectionType.value}://${agentHost.value}:${agentPort.value}`;
}

// Проверка подключения к агенту
async function checkAgentConnection() {
    try {
        const response = await window.electronAPI.sendToAgent(JSON.stringify({
            command: 'ping',
            agentUrl: getAgentUrl(),
            timeout: parseInt(timeout.value) * 1000
        }));
        
        if (response) {
            try {
                const data = JSON.parse(response);
                
                if (data.online === true || data.status === 'ok') {
                    const wasOfflineBefore = !agentOnline;
                    agentOnline = true;
                    statusIndicator.style.background = '#4caf50';
                    statusIndicator.style.boxShadow = '0 0 10px #4caf50';
                    agentNameElement.style.color = '#aaccff';
                    
                    if (data.agentName) {
                        agentName = data.agentName;
                        agentNameElement.textContent = agentName;
                    }
                    
                    if (errorMessageShown) {
                        removeErrorMessage();
                        errorMessageShown = false;
                    }
                    
                    if (wasOfflineBefore) {
                        showSuccessMessage('✅ Агент успешно подключен!');
                    }
                    
                    // Показываем адрес в интерфейсе
                    updateConnectionInfo(true);
                } else {
                    setAgentOffline();
                }
            } catch (e) {
                setAgentOffline();
            }
        } else {
            setAgentOffline();
        }
    } catch (error) {
        setAgentOffline();
    }
}

function setAgentOffline() {
    agentOnline = false;
    statusIndicator.style.background = '#f44336';
    statusIndicator.style.boxShadow = '0 0 10px #f44336';
    agentNameElement.style.color = '#ff9999';
    
    if (!errorMessageShown) {
        showErrorMessage();
        errorMessageShown = true;
    }
    
    updateConnectionInfo(false);
}

// Обновление информации о подключении
function updateConnectionInfo(connected) {
    const existingInfo = document.querySelector('.connection-info');
    if (existingInfo) {
        existingInfo.remove();
    }
    
    const info = document.createElement('div');
    info.className = 'connection-info';
    info.innerHTML = `
        <span class="agent-address">${getAgentUrl()}</span>
        <span class="status-text">${connected ? '🟢' : '🔴'}</span>
    `;
    
    document.querySelector('.chat-header').appendChild(info);
}

// Тест подключения
async function testConnection() {
    testResult.textContent = '⏳ Проверка...';
    testResult.className = 'test-result';
    
    try {
        const response = await window.electronAPI.sendToAgent(JSON.stringify({
            command: 'ping',
            agentUrl: getAgentUrl(),
            timeout: parseInt(timeout.value) * 1000
        }));
        
        if (response) {
            const data = JSON.parse(response);
            if (data.online === true || data.status === 'ok') {
                testResult.textContent = '✅ Подключение успешно!';
                testResult.className = 'test-result success';
            } else {
                testResult.textContent = '❌ Агент не отвечает';
                testResult.className = 'test-result error';
            }
        } else {
            testResult.textContent = '❌ Нет ответа';
            testResult.className = 'test-result error';
        }
    } catch (error) {
        testResult.textContent = '❌ Ошибка подключения';
        testResult.className = 'test-result error';
    }
}

// Показать сообщение об успехе
function showSuccessMessage(text) {
    const existingSuccess = document.getElementById('agentSuccess');
    if (existingSuccess) {
        existingSuccess.remove();
    }
    
    const successDiv = document.createElement('div');
    successDiv.className = 'message system';
    successDiv.id = 'agentSuccess';
    successDiv.innerHTML = `
        <div class="system-message success">
            <span class="system-icon">✅</span>
            <span class="system-text">${text}</span>
        </div>
    `;
    messagesContainer.appendChild(successDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    setTimeout(() => {
        const successMsg = document.getElementById('agentSuccess');
        if (successMsg) {
            successMsg.remove();
        }
    }, 3000);
}

// Показать сообщение об ошибке
function showErrorMessage() {
    removeErrorMessage();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'message system';
    errorDiv.id = 'agentError';
    errorDiv.innerHTML = `
        <div class="system-message error">
            <span class="system-icon">⚠️</span>
            <span class="system-text">Подключите агента!</span>
        </div>
    `;
    messagesContainer.appendChild(errorDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeErrorMessage() {
    const errorMsg = document.getElementById('agentError');
    if (errorMsg) {
        errorMsg.remove();
    }
}

// Добавление сообщения от агента
function addAgentMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message agent';
    
    messageDiv.innerHTML = `
        <div class="avatar">🤖</div>
        <div class="message-content">
            <div class="message-sender">${agentName}</div>
            <div class="message-text">${text}</div>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Индикатор печатания
function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'message agent typing-indicator';
    indicator.id = 'typingIndicator';
    indicator.innerHTML = `
        <div class="avatar">🤖</div>
        <div class="message-content">
            <div class="message-sender">${agentName}</div>
            <div class="message-text">•••</div>
        </div>
    `;
    messagesContainer.appendChild(indicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

// Авто-расширение textarea
window.autoResize = function(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

// Отправка сообщения
async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    messageInput.value = '';
    autoResize(messageInput);
    
    if (!agentOnline) {
        showErrorMessage();
        return;
    }
    
    showTypingIndicator();

    try {
        const response = await window.electronAPI.sendToAgent(JSON.stringify({
            message: message,
            command: 'process_message',
            agentUrl: getAgentUrl(),
            timeout: parseInt(timeout.value) * 1000
        }));
        
        removeTypingIndicator();
        
        if (response) {
            try {
                const agentResponse = JSON.parse(response);
                
                if (agentResponse.error || agentResponse.status === false) {
                    setAgentOffline();
                    showErrorMessage();
                } else {
                    if (agentResponse.message) {
                        addAgentMessage(agentResponse.message);
                    }
                    
                    if (agentResponse.agentName) {
                        agentName = agentResponse.agentName;
                        agentNameElement.textContent = agentName;
                    }
                }
                
            } catch (e) {
                addAgentMessage(response);
            }
        } else {
            setAgentOffline();
            showErrorMessage();
        }
        
    } catch (error) {
        removeTypingIndicator();
        setAgentOffline();
        showErrorMessage();
    }
}

// Обработчики событий
sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

settingsBtn.addEventListener('click', () => {
    agentPanel.classList.toggle('hidden');
});

closePanelBtn.addEventListener('click', () => {
    agentPanel.classList.add('hidden');
});

saveAgentBtn.addEventListener('click', () => {
    saveAgentSettings();
    agentPanel.classList.add('hidden');
    checkAgentConnection();
});

resetAgentBtn.addEventListener('click', () => {
    agentHost.value = 'localhost';
    agentPort.value = '5000';
    connectionType.value = 'http';
    timeout.value = '5';
    autoConnect.checked = true;
    saveAgentSettings();
    showSuccessMessage('🔄 Настройки сброшены');
});

testConnectionBtn.addEventListener('click', testConnection);

// Закрыть панель при клике вне её
document.addEventListener('click', (e) => {
    if (!agentPanel.contains(e.target) && !settingsBtn.contains(e.target)) {
        agentPanel.classList.add('hidden');
    }
});

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    loadAgentSettings();
    if (autoConnect.checked) {
        checkAgentConnection();
    }
    setInterval(checkAgentConnection, 2000);
});

let updateIndicator = document.getElementById('updateIndicator');
let updateText = document.getElementById('updateText');
let progressPanel = null;

// Слушаем статус обновлений
window.electronAPI.onUpdateStatus((data) => {
  console.log('Update status:', data);
  
  switch(data.status) {
    case 'checking':
      showUpdateIndicator('Проверка обновлений...', true);
      break;
      
    case 'available':
      showUpdateIndicator(`Доступна версия ${data.version}`, false);
      showUpdateNotification(data);
      break;
      
    case 'downloaded':
      showUpdateIndicator('Обновление готово к установке', false);
      break;
      
    case 'not-available':
      hideUpdateIndicator();
      break;
      
    case 'error':
      hideUpdateIndicator();
      break;
  }
});

// Слушаем прогресс загрузки
window.electronAPI.onUpdateProgress((data) => {
  showProgressPanel(data);
});

// Показать индикатор обновления
function showUpdateIndicator(message, animate = true) {
  updateIndicator.style.display = 'flex';
  updateText.textContent = message;
  
  if (animate) {
    document.querySelector('.update-icon').style.animation = 'spin 2s linear infinite';
  } else {
    document.querySelector('.update-icon').style.animation = 'none';
  }
}

// Скрыть индикатор обновления
function hideUpdateIndicator() {
  updateIndicator.style.display = 'none';
}

// Показать уведомление об обновлении
function showUpdateNotification(updateInfo) {
  const notification = document.createElement('div');
  notification.className = 'message system';
  notification.id = 'updateNotification';
  notification.innerHTML = `
    <div class="system-message success">
      <span class="system-icon">📦</span>
      <span class="system-text">
        Доступна новая версия ${updateInfo.version}! 
        <button onclick="checkForUpdates()" class="update-btn">Скачать</button>
      </span>
    </div>
  `;
  
  messagesContainer.appendChild(notification);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  setTimeout(() => {
    const notif = document.getElementById('updateNotification');
    if (notif) notif.remove();
  }, 10000);
}

// Показать панель прогресса
function showProgressPanel(progress) {
  if (!progressPanel) {
    progressPanel = document.createElement('div');
    progressPanel.className = 'update-progress';
    progressPanel.id = 'progressPanel';
    progressPanel.innerHTML = `
      <div class="progress-header">
        <span>📥 Загрузка обновления</span>
        <button class="progress-close" onclick="closeProgressPanel()">✕</button>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" id="progressFill" style="width: 0%"></div>
      </div>
      <div class="progress-stats">
        <span class="progress-percent" id="progressPercent">0%</span>
        <span class="progress-speed" id="progressSpeed">0 KB/s</span>
      </div>
      <div class="progress-stats">
        <span id="progressTransferred">0 MB</span>
        <span>/</span>
        <span id="progressTotal">0 MB</span>
      </div>
    `;
    document.body.appendChild(progressPanel);
  }
  
  progressPanel.classList.remove('hidden');
  
  const percent = Math.round(progress.percent);
  document.getElementById('progressFill').style.width = `${percent}%`;
  document.getElementById('progressPercent').textContent = `${percent}%`;
  
  // Форматируем скорость
  const speed = formatBytes(progress.bytesPerSecond);
  document.getElementById('progressSpeed').textContent = `${speed}/s`;
  
  // Форматируем размер
  const transferred = formatBytes(progress.transferred);
  const total = formatBytes(progress.total);
  document.getElementById('progressTransferred').textContent = transferred;
  document.getElementById('progressTotal').textContent = total;
  
  if (percent >= 100) {
    setTimeout(() => {
      closeProgressPanel();
    }, 2000);
  }
}

// Закрыть панель прогресса
window.closeProgressPanel = function() {
  if (progressPanel) {
    progressPanel.classList.add('hidden');
  }
}

// Форматирование байтов
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Проверка обновлений
window.checkForUpdates = function() {
  window.electronAPI.checkForUpdates();
}