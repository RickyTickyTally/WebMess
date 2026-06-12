const SERVER_URL = 'https://bibiswim-webmess.hf.space'; // Ссылка на ваш хостинг

// DOM Элементы
const blockedScreen = document.getElementById('blocked-screen');
const authScreen = document.getElementById('auth-screen');
const chatScreen = document.getElementById('chat-screen');
const profileScreen = document.getElementById('profile-screen');

const nicknameInput = document.getElementById('nickname-input');
const saveNicknameBtn = document.getElementById('save-nickname-btn');

// Элементы авторизации
const premiumCheckbox = document.getElementById('premium-checkbox');
const premiumOptions = document.getElementById('premium-options');
const premiumBadge = document.getElementById('premium-badge');
const premiumColor = document.getElementById('premium-color');
const invisibleCheckbox = document.getElementById('invisible-checkbox');

// Элементы профиля
const profileBtn = document.getElementById('profile-btn');
const profileNicknameInput = document.getElementById('profile-nickname-input');
const profilePremiumCheckbox = document.getElementById('profile-premium-checkbox');
const profilePremiumOptions = document.getElementById('profile-premium-options');
const profilePremiumBadge = document.getElementById('profile-premium-badge');
const profilePremiumColor = document.getElementById('profile-premium-color');
const profileInvisibleCheckbox = document.getElementById('profile-invisible-checkbox');
const saveProfileBtn = document.getElementById('save-profile-btn');
const cancelProfileBtn = document.getElementById('cancel-profile-btn');

const usersList = document.getElementById('users-list');
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');

let socket = null;
let currentUrl = '';
let currentNickname = '';
let aesKey = null; // Сессионный AES-GCM ключ

// Переключение видимости блока премиум-настроек при авторизации
premiumCheckbox.addEventListener('change', () => {
  premiumOptions.style.display = premiumCheckbox.checked ? 'flex' : 'none';
});

// Переключение видимости блока премиум-настроек в профиле
profilePremiumCheckbox.addEventListener('change', () => {
  profilePremiumOptions.style.display = profilePremiumCheckbox.checked ? 'flex' : 'none';
});

// Вспомогательные функции конвертации буфера и hex-строки
function bufToHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuf(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes.buffer;
}

// Хелпер: Шифрование AES-GCM через Web Crypto API
async function encryptText(text, key) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-битный IV
  const encoded = new TextEncoder().encode(text);
  const encryptedBuf = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encoded
  );
  
  return {
    iv: bufToHex(iv.buffer),
    ciphertext: bufToHex(encryptedBuf)
  };
}

// Хелпер: Дешифрование AES-GCM через Web Crypto API
async function decryptText(payload, key) {
  const { iv, ciphertext } = payload;
  const ivBuf = hexToBuf(iv);
  const ciphertextBuf = hexToBuf(ciphertext);
  
  const decryptedBuf = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBuf },
    key,
    ciphertextBuf
  );
  
  return new TextDecoder().decode(decryptedBuf);
}

// Переключение видимости экранов
function showScreen(screenId) {
  blockedScreen.style.display = 'none';
  authScreen.style.display = 'none';
  chatScreen.style.display = 'none';
  profileScreen.style.display = 'none';
  document.getElementById(`${screenId}-screen`).style.display = 'flex';
}

// Проверка URL на безопасность (Blacklist)
function isUrlSafe(urlString) {
  try {
    const url = new URL(urlString);
    const blockedProtocols = ['chrome:', 'edge:', 'about:', 'file:'];
    if (blockedProtocols.includes(url.protocol)) return false;

    const blockedHosts = ['localhost', '127.0.0.1'];
    if (blockedHosts.includes(url.hostname)) return false;

    const blockedKeywords = ['bank', 'paypal', 'stripe', 'crypto', 'wallet', 'gov'];
    if (blockedKeywords.some(keyword => url.hostname.includes(keyword))) return false;

    return true;
  } catch (e) {
    return false;
  }
}

// Загрузка открытых вкладок и рендер в боковой панели
async function loadTabs() {
  const tabsList = document.getElementById('tabs-list');
  tabsList.innerHTML = '';

  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    
    // Фильтруем только безопасные страницы для чата
    const safeTabs = tabs.filter(t => t.url && isUrlSafe(t.url));

    if (safeTabs.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'tab-item';
      emptyDiv.style.cursor = 'default';
      emptyDiv.innerHTML = '<div class="tab-title">Нет доступных чатов</div>';
      tabsList.appendChild(emptyDiv);
      return;
    }

    safeTabs.forEach(tab => {
      const tabItem = document.createElement('div');
      tabItem.className = 'tab-item';
      tabItem.dataset.url = tab.url;

      // Если эта вкладка является активной в данный момент
      if (tab.url === currentUrl) {
        tabItem.classList.add('active');
      }

      let hostname = '';
      try {
        hostname = new URL(tab.url).hostname;
      } catch (e) {
        hostname = tab.url;
      }

      tabItem.innerHTML = `
        <div class="tab-title">${tab.title || 'Страница'}</div>
        <div class="tab-domain">${hostname}</div>
      `;

      tabItem.addEventListener('click', () => {
        document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active'));
        tabItem.classList.add('active');

        switchChatRoom(tab.url);
      });

      tabsList.appendChild(tabItem);
    });
  } catch (err) {
    console.error('Ошибка получения списка вкладок:', err);
  }
}

// Переключение комнаты при выборе вкладки из списка
function switchChatRoom(newUrl) {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  aesKey = null;
  currentUrl = newUrl;

  chrome.storage.local.get(['nickname'], (result) => {
    if (result.nickname) {
      currentNickname = result.nickname;
      connectToChat(currentUrl, currentNickname);
    } else {
      showScreen('auth');
    }
  });
}

// Вспомогательная функция отрисовки всех сообщений из массива
function renderMessages(messages) {
  messagesContainer.innerHTML = '';
  messages.forEach(msg => {
    appendMessageToUi(msg, false);
  });
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Вспомогательная функция отрисовки одного сообщения
function appendMessageToUi(msg, autoScroll = true) {
  const { author, text, time, badge, color } = msg;
  const msgDiv = document.createElement('div');
  
  // Определяем, наше ли это сообщение
  const isSelf = author === currentNickname;
  msgDiv.className = `message ${isSelf ? 'self' : 'other'}`;
  
  const date = new Date(time);
  const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  const safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const badgeHtml = badge ? `<span class="badge" style="margin-right: 4px; padding: 2px 4px; background: rgba(0,0,0,0.06); border-radius: 4px; font-size: 9px; font-weight: bold; color: inherit;">${badge}</span>` : '';
  const nameStyle = color ? `style="color: ${color}; font-weight: bold;"` : '';

  msgDiv.innerHTML = `
    <div class="author" ${nameStyle}>${badgeHtml}${isSelf ? 'Вы' : author}</div>
    <div class="text">${safeText}</div>
    <div class="time">${timeStr}</div>
  `;
  messagesContainer.appendChild(msgDiv);
  
  if (autoScroll) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

// Подключение к WebSocket с ECDH рукопожатием
function connectToChat(url, nickname) {
  showScreen('chat');
  messagesContainer.innerHTML = '';
  usersList.textContent = 'Установка защищенного соединения...';

  // Выводим имя домена в заголовок чата
  try {
    const parsedUrl = new URL(url);
    document.getElementById('chat-header-title').textContent = parsedUrl.hostname;
  } catch (e) {
    document.getElementById('chat-header-title').textContent = 'Site Chat';
  }

  // Очищаем URL от параметров и слэшей для получения ключа кэша
  const cacheKey = `history_${url.split('?')[0].split('#')[0].replace(/\/$/, '')}`;

  // Сначала мгновенно грузим историю из локального кэша расширения
  chrome.storage.local.get([cacheKey], (result) => {
    const cached = result[cacheKey] || [];
    if (cached.length > 0) {
      renderMessages(cached);
    }
  });

  // Запрашиваем информацию о Premium настройках из хранилища
  chrome.storage.local.get(['isPremium', 'premiumBadge', 'premiumColor', 'isInvisible'], (storageData) => {
    const isPremium = storageData.isPremium || false;
    const badge = isPremium ? (storageData.premiumBadge || '') : '';
    const color = isPremium ? (storageData.premiumColor || '') : '';
    const isInvisible = isPremium ? (storageData.isInvisible || false) : false;

    socket = io(SERVER_URL, { transports: ['websocket'] });

    socket.on('connect', async () => {
      try {
        // 1. Генерируем эфемерные ключи ECDH (кривая P-256)
        const keyPair = await window.crypto.subtle.generateKey(
          { name: "ECDH", namedCurve: "P-256" },
          true,
          ["deriveKey", "deriveBits"]
        );

        // Экспортируем публичный ключ в RAW формат и кодируем в HEX
        const rawPubBuf = await window.crypto.subtle.exportKey("raw", keyPair.publicKey);
        const clientPublicKeyHex = bufToHex(rawPubBuf);

        // Отправляем запрос на обмен ключами
        socket.emit('dh_handshake_start', { clientPublicKeyHex });

        // Ждем ответный ключ сервера
        socket.once('dh_handshake_response', async ({ serverPublicKeyHex }) => {
          try {
            const serverPubKeyBuf = hexToBuf(serverPublicKeyHex);
            
            // Импортируем публичный ключ сервера
            const serverPublicKey = await window.crypto.subtle.importKey(
              "raw",
              serverPubKeyBuf,
              { name: "ECDH", namedCurve: "P-256" },
              true,
              []
            );

            // Вычисляем shared secret
            const sharedSecretBits = await window.crypto.subtle.deriveBits(
              { name: "ECDH", public: serverPublicKey },
              keyPair.privateKey,
              256
            );

            // Хэшируем shared secret через SHA-256
            const aesKeyBuffer = await window.crypto.subtle.digest("SHA-256", sharedSecretBits);

            // Импортируем хэш как симметричный ключ AES-GCM
            aesKey = await window.crypto.subtle.importKey(
              "raw",
              aesKeyBuffer,
              { name: "AES-GCM", length: 256 },
              false,
              ["encrypt", "decrypt"]
            );

            console.log('[DH] Шифрование согласовано с сервером.');

            // 2. Входим в комнату чата, зашифровав URL, никнейм и Premium параметры
            const joinPayload = await encryptText(JSON.stringify({ 
              url, 
              nickname, 
              isPremium, 
              badge, 
              color, 
              isInvisible 
            }), aesKey);
            socket.emit('join_room', joinPayload);
          } catch (err) {
            console.error('Ошибка рукопожатия:', err);
            usersList.textContent = 'Ошибка шифрования';
          }
        });
      } catch (err) {
        console.error('Ошибка инициализации ECDH:', err);
        usersList.textContent = 'Ошибка инициализации шифрования';
      }
    });

    // Получение расшифрованного списка участников в сети
    socket.on('update_users', async (encryptedPayload) => {
      try {
        if (!aesKey) return;
        const decryptedStr = await decryptText(encryptedPayload, aesKey);
        const users = JSON.parse(decryptedStr);
        
        // Рендерим список с бейджами и цветами
        usersList.innerHTML = 'В сети: ';
        users.forEach((u, index) => {
          const isObj = typeof u === 'object' && u !== null;
          const nickname = isObj ? u.nickname : u;
          const badge = isObj ? u.badge : null;
          const color = isObj ? u.color : null;

          const span = document.createElement('span');
          span.textContent = `${badge ? badge + ' ' : ''}${nickname}`;
          if (color) {
            span.style.color = color;
            span.style.fontWeight = 'bold';
          }
          
          if (index > 0) {
            usersList.appendChild(document.createTextNode(', '));
          }
          usersList.appendChild(span);
        });
      } catch (err) {
        console.error('Ошибка расшифровки списка участников:', err);
      }
    });

    // Получение и расшифровка истории сообщений в комнате (синхронизируем с кэшем)
    socket.on('chat_history', async (encryptedPayload) => {
      try {
        if (!aesKey) return;
        const decryptedStr = await decryptText(encryptedPayload, aesKey);
        const history = JSON.parse(decryptedStr);
        
        // Обновляем локальный кэш
        chrome.storage.local.set({ [cacheKey]: history }, () => {
          renderMessages(history);
        });
      } catch (err) {
        console.error('Ошибка расшифровки истории сообщений:', err);
      }
    });

    // Получение расшифрованного входящего сообщения
    socket.on('receive_message', async (encryptedPayload) => {
      try {
        if (!aesKey) return;
        const decryptedStr = await decryptText(encryptedPayload, aesKey);
        const messageData = JSON.parse(decryptedStr);
        
        // Добавляем сообщение в локальный кэш
        chrome.storage.local.get([cacheKey], (result) => {
          const history = result[cacheKey] || [];
          const isDuplicate = history.some(m => m.time === messageData.time && m.text === messageData.text);
          if (!isDuplicate) {
            history.push(messageData);
            if (history.length > 50) history.shift();
            chrome.storage.local.set({ [cacheKey]: history }, () => {
              appendMessageToUi(messageData);
            });
          }
        });
      } catch (err) {
        console.error('Ошибка расшифровки сообщения:', err);
      }
    });
  });
}

// Отправка зашифрованного сообщения на сервер
async function sendMessage() {
  const text = messageInput.value.trim();
  if (text && socket && aesKey) {
    try {
      const encrypted = await encryptText(text, aesKey);
      socket.emit('send_message', encrypted);
      messageInput.value = '';
    } catch (err) {
      console.error('Ошибка отправки сообщения:', err);
    }
  }
}

// --- СОБЫТИЯ UI ---

// Авторизация
saveNicknameBtn.addEventListener('click', () => {
  const nickname = nicknameInput.value.trim();
  if (nickname) {
    const isPremium = premiumCheckbox.checked;
    const badge = isPremium ? premiumBadge.value : '';
    const color = isPremium ? premiumColor.value : '';
    const isInvisible = isPremium ? invisibleCheckbox.checked : false;

    chrome.storage.local.set({ 
      nickname,
      isPremium,
      premiumBadge: badge,
      premiumColor: color,
      isInvisible
    }, () => {
      currentNickname = nickname;
      connectToChat(currentUrl, currentNickname);
    });
  }
});

// Открытие экрана профиля
profileBtn.addEventListener('click', () => {
  chrome.storage.local.get(['nickname', 'isPremium', 'premiumBadge', 'premiumColor', 'isInvisible'], (result) => {
    profileNicknameInput.value = result.nickname || '';
    profilePremiumCheckbox.checked = result.isPremium || false;
    profilePremiumOptions.style.display = profilePremiumCheckbox.checked ? 'flex' : 'none';
    profilePremiumBadge.value = result.premiumBadge || '';
    profilePremiumColor.value = result.premiumColor || '';
    profileInvisibleCheckbox.checked = result.isInvisible || false;
    
    showScreen('profile');
  });
});

// Сохранение изменений в профиле
saveProfileBtn.addEventListener('click', () => {
  const nickname = profileNicknameInput.value.trim();
  if (nickname) {
    const isPremium = profilePremiumCheckbox.checked;
    const badge = isPremium ? profilePremiumBadge.value : '';
    const color = isPremium ? profilePremiumColor.value : '';
    const isInvisible = isPremium ? profileInvisibleCheckbox.checked : false;

    chrome.storage.local.set({ 
      nickname,
      isPremium,
      premiumBadge: badge,
      premiumColor: color,
      isInvisible
    }, () => {
      currentNickname = nickname;
      // Переподключаемся к чату для обновления данных сессии
      switchChatRoom(currentUrl);
    });
  }
});

// Отмена изменений в профиле
cancelProfileBtn.addEventListener('click', () => {
  showScreen('chat');
});

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// --- ТОЧКА ВХОДА ---
async function init() {
  // Получаем текущую активную вкладку
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (tab && tab.url) {
    currentUrl = tab.url;
  } else {
    currentUrl = '';
  }

  // Загружаем вкладки в сайдбар
  await loadTabs();

  // Если активная вкладка безопасна, пробуем войти, иначе пишем "Доступ запрещен"
  if (currentUrl && isUrlSafe(currentUrl)) {
    chrome.storage.local.get(['nickname', 'isPremium', 'premiumBadge', 'premiumColor', 'isInvisible'], (result) => {
      if (result.nickname) {
        currentNickname = result.nickname;
        
        // Пре-заполняем поля премиума в форме авторизации
        premiumCheckbox.checked = result.isPremium || false;
        premiumOptions.style.display = premiumCheckbox.checked ? 'flex' : 'none';
        premiumBadge.value = result.premiumBadge || '';
        premiumColor.value = result.premiumColor || '';
        invisibleCheckbox.checked = result.isInvisible || false;
        nicknameInput.value = result.nickname;

        connectToChat(currentUrl, currentNickname);
      } else {
        showScreen('auth');
      }
    });
  } else {
    showScreen('blocked');
  }
}

document.addEventListener('DOMContentLoaded', init);
