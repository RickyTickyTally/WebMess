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
const refreshChatBtn = document.getElementById('refresh-chat-btn');
const profileNicknameInput = document.getElementById('profile-nickname-input');
const profilePremiumCheckbox = document.getElementById('profile-premium-checkbox');
const profilePremiumOptions = document.getElementById('profile-premium-options');
const profilePremiumBadge = document.getElementById('profile-premium-badge');
const profilePremiumColor = document.getElementById('profile-premium-color');
const profileInvisibleCheckbox = document.getElementById('profile-invisible-checkbox');
const saveProfileBtn = document.getElementById('save-profile-btn');
const cancelProfileBtn = document.getElementById('cancel-profile-btn');

const profileAvatarWrapper = document.getElementById('profile-avatar-wrapper');
const profileAvatarPreview = document.getElementById('profile-avatar-preview');
const profileAvatarPlaceholder = document.getElementById('profile-avatar-placeholder');
const profileAvatarFileInput = document.getElementById('profile-avatar-file-input');
const profileTelegramInput = document.getElementById('profile-telegram-input');
const profileDiscordInput = document.getElementById('profile-discord-input');

const profileNicknameTitle = document.getElementById('profile-nickname-title');
const profileLevelText = document.getElementById('profile-level-text');
const profileMessagesStat = document.getElementById('profile-messages-stat');
const badgeCreator = document.getElementById('badge-creator');
const badgePro = document.getElementById('badge-pro');
const badgeLightning = document.getElementById('badge-lightning');
const profilePhoneInput = document.getElementById('profile-phone-input');
const profileBioInput = document.getElementById('profile-bio-input');
const profileBirthdayInput = document.getElementById('profile-birthday-input');

let originalTheme = 'white';
let selectedTheme = 'white';

const sidebarChatBtn = document.getElementById('sidebar-chat-btn');
const sidebarGamesBtn = document.getElementById('sidebar-games-btn');
const gamesScreen = document.getElementById('games-screen');
const gameCanvas = document.getElementById('game-canvas');
const gameCtx = gameCanvas.getContext('2d');
const gameStartOverlay = document.getElementById('game-start-overlay');
const gameJoinBtn = document.getElementById('game-join-btn');
const gameQuitBtn = document.getElementById('game-quit-btn');
const gameRoomsList = document.getElementById('game-rooms-list');
const refreshRoomsBtn = document.getElementById('refresh-rooms-btn');

let isGameActive = false;
let currentGameMode = 'ffa';
let localPlayer = {
  id: '',
  x: 100,
  y: 100,
  angle: 0,
  nickname: '',
  hp: 100,
  score: 0,
  deaths: 0,
  team: 'ffa',
  infected: false,
  badge: '',
  color: ''
};
let gamePlayers = new Map();
let gameProjectiles = [];
let gameBots = [];
let keysPressed = {};
let gameLoopId = null;
let roomsListInterval = null;
let gameUpdateInterval = null;

const usersListContainer = document.getElementById('users-list-container');
const usersCountText = document.getElementById('users-count-text');
const avatarListContainer = document.getElementById('avatar-list-container');
const usersModal = document.getElementById('users-modal');
const modalUsersList = document.getElementById('modal-users-list');
const closeUsersModalBtn = document.getElementById('close-users-modal-btn');
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');

let socket = null;
let currentUrl = '';
let currentNickname = '';
let currentUsersInRoom = [];
let aesKey = null; // Сессионный AES-GCM ключ
let currentAvatar = ''; // Текущая аватарка в формате Base64

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

// Хелпер: Масштабирование аватара с сохранением пропорций и сжатием в 64x64 JPEG
function resizeImage(file, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const maxDim = 64;
      canvas.width = maxDim;
      canvas.height = maxDim;
      // Обрезаем изображение по центру в квадрат
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, maxDim, maxDim);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      callback(dataUrl);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Переключение видимости экранов
function showScreen(screenId) {
  blockedScreen.style.display = 'none';
  authScreen.style.display = 'none';
  chatScreen.style.display = 'none';
  profileScreen.style.display = 'none';
  if (gamesScreen) gamesScreen.style.display = 'none';
  const roomSettingsScreen = document.getElementById('room-settings-screen');
  if (roomSettingsScreen) roomSettingsScreen.style.display = 'none';
  document.getElementById(`${screenId}-screen`).style.display = 'flex';

  if (screenId !== 'games') {
    if (typeof stopRelaxVideo === 'function') {
      stopRelaxVideo();
    }
  }
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
  const { author, text, time, badge, color, avatar, telegram, discord } = msg;
  const msgRow = document.createElement('div');
  
  if (author === 'System' || author === 'Система' || author === '📢 Система') {
    msgRow.className = 'message-row system';
    const safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    msgRow.innerHTML = `<div style="margin: 6px auto; background: var(--sidebar-bg); border: 1px solid var(--border-color); color: var(--text-color); font-size: 11px; padding: 4px 12px; border-radius: 12px; text-align: center; max-width: 85%; font-weight: 500; opacity: 0.95; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">${safeText}</div>`;
    messagesContainer.appendChild(msgRow);
    if (autoScroll) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    return;
  }
  
  // Определяем, наше ли это сообщение
  const isSelf = author === currentNickname;
  msgRow.className = `message-row ${isSelf ? 'self' : 'other'}`;
  
  // Аватарка отправителя сообщения снаружи пузыря
  let avatarOutsideHtml = '';
  if (avatar) {
    avatarOutsideHtml = `<img src="${avatar}" class="message-avatar-outside" title="${author}">`;
  } else {
    const fallbackChar = badge || author.charAt(0).toUpperCase();
    const bgStyle = color ? `background-color: ${color};` : '';
    avatarOutsideHtml = `<div class="message-avatar-outside" style="${bgStyle}" title="${author}">${fallbackChar}</div>`;
  }

  const date = new Date(time);
  const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  const safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const badgeHtml = badge ? `<span class="badge" style="margin-right: 4px; padding: 2px 4px; background: rgba(0,0,0,0.06); border-radius: 4px; font-size: 9px; font-weight: bold; color: inherit; display: inline-block;">${badge}</span>` : '';
  const nameStyle = color ? `style="color: ${color}; font-weight: bold;"` : '';

  let socialHtml = '';
  if (telegram || discord) {
    socialHtml = `<span style="margin-left: 6px; display: inline-flex; align-items: center; gap: 4px; opacity: 0.6; vertical-align: middle;">`;
    if (telegram) {
      const tgUser = telegram.startsWith('@') ? telegram.slice(1) : telegram;
      socialHtml += `
        <a href="https://t.me/${tgUser}" target="_blank" title="Telegram: ${telegram}" style="color: inherit; display: inline-flex; align-items: center; text-decoration: none;">
          <svg style="width: 12px; height: 12px; color: #0088cc;" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.24-5.54 3.65-.52.36-.97.53-1.34.52-.42-.01-1.21-.24-1.8-.44-.72-.24-1.29-.37-1.24-.78.03-.21.32-.43.89-.65 3.48-1.51 5.8-2.52 6.96-3.01 3.31-1.4 4-.1.4 0z"/></svg>
        </a>
      `;
    }
    if (discord) {
      socialHtml += `
        <span class="discord-msg-btn" data-ds="${discord}" title="Discord: ${discord} (Нажмите для копирования)" style="cursor: pointer; display: inline-flex; align-items: center; color: #5865F2;">
          <svg style="width: 12px; height: 12px;" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z"/></svg>
        </span>
      `;
    }
    socialHtml += `</span>`;
  }

  msgRow.innerHTML = `
    ${avatarOutsideHtml}
    <div class="message ${isSelf ? 'self' : 'other'}">
      <div class="author" ${nameStyle}>
        ${badgeHtml}
        <span>${isSelf ? 'Вы' : author}</span>
        ${socialHtml}
      </div>
      <div class="text">${safeText}</div>
      <div class="time">${timeStr}</div>
    </div>
  `;
  messagesContainer.appendChild(msgRow);
  
  if (autoScroll) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

// Подключение к WebSocket с ECDH рукопожатием
function connectToChat(url, nickname) {
  if (socket) {
    try {
      socket.disconnect();
    } catch (e) {}
    socket = null;
  }
  aesKey = null;

  showScreen('chat');
  messagesContainer.innerHTML = '';
  usersCountText.textContent = 'В сети: Подключение...';

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

  // Запрашиваем информацию о Premium настройках и профиле из хранилища
  chrome.storage.local.get(['isPremium', 'premiumBadge', 'premiumColor', 'isInvisible', 'avatar', 'telegram', 'discord'], (storageData) => {
    const isPremium = storageData.isPremium || false;
    const badge = isPremium ? (storageData.premiumBadge || '') : '';
    const color = isPremium ? (storageData.premiumColor || '') : '';
    const isInvisible = isPremium ? (storageData.isInvisible || false) : false;
    const avatar = storageData.avatar || '';
    const telegram = storageData.telegram || '';
    const discord = storageData.discord || '';

    socket = io(SERVER_URL, { transports: ['websocket'] });

    socket.on('disconnect', () => {
      aesKey = null;
    });

    socket.on('connect', async () => {
      aesKey = null;
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

            console.log('[DH] Шифрование согласовано с сервером. Key hash:', bufToHex(aesKeyBuffer));

            // Читаем монеты из локального хранилища перед входом в комнату
            chrome.storage.local.get(['clickerCoins'], async (storageCoinsRes) => {
              const savedCoins = storageCoinsRes.clickerCoins || 0;
              clickerCoins = savedCoins;

              // 2. Входим в комнату чата, зашифровав URL, никнейм, Premium параметры, социальные данные и монеты
              const joinPayload = await encryptText(JSON.stringify({ 
                url, 
                nickname, 
                isPremium, 
                badge, 
                color, 
                isInvisible,
                avatar,
                telegram,
                discord,
                coins: savedCoins
              }), aesKey);
              socket.emit('join_room', joinPayload);
              
              // Запускаем автоматическую добычу коинов кликера
              initClickerGame();
            });
          } catch (err) {
            console.error('Ошибка рукопожатия:', err);
            usersCountText.textContent = 'В сети: Ошибка шифрования';
          }
        });
      } catch (err) {
        console.error('Ошибка инициализации ECDH:', err);
        usersCountText.textContent = 'В сети: Ошибка шифрования';
      }
    });

    // Получение расшифрованного списка участников в сети
    socket.on('update_users', async (encryptedPayload) => {
      try {
        if (!aesKey) return;
        const decryptedStr = await decryptText(encryptedPayload, aesKey);
        const users = JSON.parse(decryptedStr);
        currentUsersInRoom = users;
        
        // 1. Обновляем счетчик
        usersCountText.textContent = `В сети: ${users.length}`;

        // 2. Очищаем контейнеры
        avatarListContainer.innerHTML = '';
        modalUsersList.innerHTML = '';

        // 3. Рендерим аватарки (первые 5)
        const maxAvatars = 5;
        users.slice(0, maxAvatars).forEach((u) => {
          const isObj = typeof u === 'object' && u !== null;
          const nickname = isObj ? u.nickname : u;
          const badge = isObj ? u.badge : null;
          const color = isObj ? u.color : null;
          const avatar = isObj ? u.avatar : null;

          const avatarDiv = document.createElement('div');
          avatarDiv.className = 'user-avatar-mini';
          
          if (avatar) {
            const img = document.createElement('img');
            img.src = avatar;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '50%';
            avatarDiv.appendChild(img);
          } else {
            avatarDiv.textContent = badge || nickname.charAt(0).toUpperCase();
            if (color) {
              avatarDiv.style.backgroundColor = color;
            }
          }
          
          avatarListContainer.appendChild(avatarDiv);
        });

        // Если больше 5, добавляем индикатор "+N"
        if (users.length > maxAvatars) {
          const moreDiv = document.createElement('div');
          moreDiv.className = 'user-avatar-mini more';
          moreDiv.textContent = `+${users.length - maxAvatars}`;
          avatarListContainer.appendChild(moreDiv);
        }

        // 4. Заполняем модальное окно всеми участниками
        users.forEach((u) => {
          const isObj = typeof u === 'object' && u !== null;
          const nickname = isObj ? u.nickname : u;
          const badge = isObj ? u.badge : null;
          const color = isObj ? u.color : null;
          const avatar = isObj ? u.avatar : null;
          const telegram = isObj ? u.telegram : null;
          const discord = isObj ? u.discord : null;

          const userRow = document.createElement('div');
          userRow.style.display = 'flex';
          userRow.style.alignItems = 'center';
          userRow.style.gap = '10px';
          userRow.style.padding = '8px 0';
          userRow.style.borderBottom = '1px solid #f1f3f5';

          const avatarDiv = document.createElement('div');
          avatarDiv.className = 'user-avatar-mini';
          avatarDiv.style.border = 'none';
          avatarDiv.style.boxShadow = 'none';
          
          if (avatar) {
            const img = document.createElement('img');
            img.src = avatar;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '50%';
            avatarDiv.appendChild(img);
          } else {
            avatarDiv.textContent = badge || nickname.charAt(0).toUpperCase();
            if (color) {
              avatarDiv.style.backgroundColor = color;
            }
          }

          const nameSpan = document.createElement('span');
          nameSpan.textContent = `${badge ? badge + ' ' : ''}${nickname}`;
          nameSpan.style.fontSize = '13px';
          if (color) {
            nameSpan.style.color = color;
            nameSpan.style.fontWeight = 'bold';
          }

          userRow.appendChild(avatarDiv);
          userRow.appendChild(nameSpan);

          // Кнопки соцсетей справа
          const socialContainer = document.createElement('div');
          socialContainer.style.display = 'flex';
          socialContainer.style.alignItems = 'center';
          socialContainer.style.gap = '8px';
          socialContainer.style.marginLeft = 'auto';
          socialContainer.style.flexShrink = '0';

          if (telegram) {
            const tgLink = document.createElement('a');
            const tgUser = telegram.startsWith('@') ? telegram.slice(1) : telegram;
            tgLink.href = `https://t.me/${tgUser}`;
            tgLink.target = '_blank';
            tgLink.title = `Telegram: ${telegram}`;
            tgLink.style.display = 'flex';
            tgLink.style.alignItems = 'center';
            tgLink.style.color = '#0088cc';
            tgLink.innerHTML = `
              <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.24-5.54 3.65-.52.36-.97.53-1.34.52-.42-.01-1.21-.24-1.8-.44-.72-.24-1.29-.37-1.24-.78.03-.21.32-.43.89-.65 3.48-1.51 5.8-2.52 6.96-3.01 3.31-1.4 4-.1.4 0z"/>
              </svg>
            `;
            tgLink.addEventListener('click', (e) => e.stopPropagation());
            socialContainer.appendChild(tgLink);
          }

          if (discord) {
            const dsBtn = document.createElement('button');
            dsBtn.style.background = 'none';
            dsBtn.style.border = 'none';
            dsBtn.style.padding = '0';
            dsBtn.style.cursor = 'pointer';
            dsBtn.style.display = 'flex';
            dsBtn.style.alignItems = 'center';
            dsBtn.style.color = '#5865F2';
            dsBtn.title = `Discord: ${discord} (Нажмите, чтобы скопировать)`;
            dsBtn.innerHTML = `
              <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z"/>
              </svg>
            `;
            dsBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(discord);
              const originalTitle = dsBtn.title;
              dsBtn.title = 'Скопировано!';
              setTimeout(() => { dsBtn.title = originalTitle; }, 2000);
            });
            socialContainer.appendChild(dsBtn);
          }

          userRow.appendChild(socialContainer);
          modalUsersList.appendChild(userRow);
        });

        // Обновляем рейтинг шахтеров, если открыт экран кликера
        const gamesPanelClicker = document.getElementById('games-panel-clicker');
        if (gamesPanelClicker && gamesPanelClicker.style.display === 'flex') {
          renderClickerLeaderboard(users);
        }
      } catch (err) {
        console.warn('Ошибка расшифровки списка участников (реконнект/смена ключа):', err.message || err);
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
        console.warn('Ошибка расшифровки истории сообщений (реконнект/смена ключа):', err.message || err);
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
        console.warn('Ошибка расшифровки сообщения:', err.message || err);
      }
    });

    // Игровые события PVP
    socket.on('game_player_joined', async (encryptedPayload) => {
      try {
        if (!aesKey) return;
        const decryptedStr = await decryptText(encryptedPayload, aesKey);
        const player = JSON.parse(decryptedStr);
        if (player.id !== socket.id) {
          gamePlayers.set(player.id, player);
        }
      } catch (err) {
        console.warn('Ошибка расшифровки game_player_joined:', err.message || err);
      }
    });

    socket.on('game_player_updated', async (encryptedPayload) => {
      try {
        if (!aesKey) return;
        const decryptedStr = await decryptText(encryptedPayload, aesKey);
        const player = JSON.parse(decryptedStr);
        if (player.id !== socket.id) {
          gamePlayers.set(player.id, player);
        }
      } catch (err) {
        console.warn('Ошибка расшифровки game_player_updated:', err.message || err);
      }
    });

    socket.on('game_bullet_spawned', async (encryptedPayload) => {
      try {
        if (!aesKey) return;
        const decryptedStr = await decryptText(encryptedPayload, aesKey);
        const bullet = JSON.parse(decryptedStr);
        if (bullet.ownerId !== socket.id) {
          gameProjectiles.push(bullet);
        }
      } catch (err) {
        console.warn('Ошибка расшифровки game_bullet_spawned:', err.message || err);
      }
    });

    socket.on('game_player_hit', async (encryptedPayload) => {
      try {
        if (!aesKey) return;
        const decryptedStr = await decryptText(encryptedPayload, aesKey);
        const { targetId, damage, infect, shooterId } = JSON.parse(decryptedStr);
        
        if (targetId === socket.id) {
          if (infect) {
            localPlayer.infected = true;
            localPlayer.hp = 100;
            alert('Вы заражены! Теперь вы зомби! Заражайте выживших касанием!');
          } else {
            localPlayer.hp -= damage;
            if (localPlayer.hp <= 0) {
              localPlayer.hp = 0;
              localPlayer.deaths++;
              
              const shooter = gamePlayers.get(shooterId) || gameBots.find(b => b.id === shooterId);
              if (shooter) shooter.score = (shooter.score || 0) + 1;
              
              setTimeout(() => {
                localPlayer.hp = 100;
                localPlayer.x = Math.random() * 320 + 20;
                localPlayer.y = Math.random() * 190 + 20;
                if (currentGameMode === 'infection') {
                  localPlayer.infected = false;
                }
              }, 2000);
            }
          }
        } else {
          const player = gamePlayers.get(targetId);
          if (player) {
            if (infect) {
              player.infected = true;
              player.hp = 100;
            } else {
              player.hp -= damage;
              if (player.hp <= 0) {
                player.hp = 0;
                if (shooterId === socket.id) {
                  localPlayer.score++;
                  chrome.storage.local.get(['messagesSentCount'], (res) => {
                    const count = (res.messagesSentCount || 0) + 1;
                    chrome.storage.local.set({ messagesSentCount: count });
                  });
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('Ошибка расшифровки game_player_hit:', err.message || err);
      }
    });

    socket.on('game_player_left', async (encryptedPayload) => {
      try {
        if (!aesKey) return;
        const decryptedStr = await decryptText(encryptedPayload, aesKey);
        const { id } = JSON.parse(decryptedStr);
        gamePlayers.delete(id);
      } catch (err) {
        console.warn('Ошибка расшифровки game_player_left:', err.message || err);
      }
    });

    socket.on('game_mode_updated', async (encryptedPayload) => {
      try {
        if (!aesKey) return;
        const decryptedStr = await decryptText(encryptedPayload, aesKey);
        const { mode } = JSON.parse(decryptedStr);
        updateGameMode(mode);
      } catch (err) {
        console.warn('Ошибка расшифровки game_mode_updated:', err.message || err);
      }
    });

    socket.on('game_rooms_list', async (encryptedPayload) => {
      try {
        if (!aesKey) return;
        const decryptedStr = await decryptText(encryptedPayload, aesKey);
        const rooms = JSON.parse(decryptedStr);
        renderGameRoomsList(rooms);
      } catch (err) {
        console.warn('Ошибка расшифровки game_rooms_list:', err.message || err);
      }
    });

    // UGC: Настройки комнаты
    socket.on('room_settings', async (encryptedPayload) => {
      try {
        if (!aesKey) return;
        const decryptedStr = await decryptText(encryptedPayload, aesKey);
        const settings = JSON.parse(decryptedStr);
        applyRoomSettings(settings);
      } catch (err) {
        console.warn('Ошибка расшифровки room_settings:', err.message || err);
      }
    });

    socket.on('room_settings_updated', async (encryptedPayload) => {
      try {
        if (!aesKey) return;
        const decryptedStr = await decryptText(encryptedPayload, aesKey);
        const settings = JSON.parse(decryptedStr);
        applyRoomSettings(settings);
      } catch (err) {
        console.warn('Ошибка расшифровки room_settings_updated:', err.message || err);
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

      // Увеличиваем счетчик отправленных сообщений
      chrome.storage.local.get(['messagesSentCount'], (res) => {
        const count = (res.messagesSentCount || 0) + 1;
        chrome.storage.local.set({ messagesSentCount: count });
      });
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

// Обновление соединения с чатом
refreshChatBtn.addEventListener('click', () => {
  refreshChatBtn.style.transform = 'rotate(360deg)';
  setTimeout(() => {
    refreshChatBtn.style.transform = 'rotate(0deg)';
  }, 300);

  if (currentUrl) {
    switchChatRoom(currentUrl);
  }
});

// Открытие экрана профиля
profileBtn.addEventListener('click', () => {
  chrome.storage.local.get([
    'nickname', 'isPremium', 'premiumBadge', 'premiumColor', 'isInvisible',
    'avatar', 'telegram', 'discord', 'phone', 'bio', 'birthday', 'theme', 'messagesSentCount'
  ], (result) => {
    profileNicknameInput.value = result.nickname || '';
    profileNicknameTitle.textContent = result.nickname || 'Пользователь';
    
    profilePremiumCheckbox.checked = result.isPremium || false;
    profilePremiumOptions.style.display = profilePremiumCheckbox.checked ? 'flex' : 'none';
    profilePremiumBadge.value = result.premiumBadge || '';
    profilePremiumColor.value = result.premiumColor || '';
    profileInvisibleCheckbox.checked = result.isInvisible || false;
    profileTelegramInput.value = result.telegram || '';
    profileDiscordInput.value = result.discord || '';
    
    profilePhoneInput.value = result.phone || '';
    profileBioInput.value = result.bio || '';
    profileBirthdayInput.value = result.birthday || '';
    
    const messagesSent = result.messagesSentCount || 0;
    profileMessagesStat.textContent = messagesSent;
    
    const level = Math.floor(messagesSent / 10) + 1;
    profileLevelText.textContent = `Уровень ${level}`;
    
    // Badges
    if (result.isPremium) {
      badgeCreator.classList.add('unlocked');
    } else {
      badgeCreator.classList.remove('unlocked');
    }
    if (messagesSent >= 10) {
      badgePro.classList.add('unlocked');
    } else {
      badgePro.classList.remove('unlocked');
    }
    if (messagesSent >= 50) {
      badgeLightning.classList.add('unlocked');
    } else {
      badgeLightning.classList.remove('unlocked');
    }
    
    // Theme
    const theme = result.theme || 'white';
    originalTheme = theme;
    selectedTheme = theme;
    document.querySelectorAll('.theme-select-btn').forEach(btn => {
      if (btn.dataset.theme === theme) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    document.body.className = `theme-${theme}`;
    
    currentAvatar = result.avatar || '';
    if (currentAvatar) {
      profileAvatarPreview.src = currentAvatar;
      profileAvatarPreview.style.display = 'block';
      profileAvatarPlaceholder.style.display = 'none';
    } else {
      profileAvatarPreview.style.display = 'none';
      profileAvatarPlaceholder.style.display = 'flex';
    }
    
    showScreen('profile');
  });
});

// Клик по аватарке открывает диалог выбора файла
profileAvatarWrapper.addEventListener('click', () => {
  profileAvatarFileInput.click();
});

// Обработка выбора файла аватара с масштабированием
profileAvatarFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    resizeImage(file, (base64Str) => {
      currentAvatar = base64Str;
      profileAvatarPreview.src = base64Str;
      profileAvatarPreview.style.display = 'block';
      profileAvatarPlaceholder.style.display = 'none';
    });
  }
});

// Сохранение изменений в профиле
saveProfileBtn.addEventListener('click', () => {
  const nickname = profileNicknameInput.value.trim();
  if (nickname) {
    const isPremium = profilePremiumCheckbox.checked;
    const badge = isPremium ? profilePremiumBadge.value : '';
    const color = isPremium ? profilePremiumColor.value : '';
    const isInvisible = isPremium ? profileInvisibleCheckbox.checked : false;
    const telegram = profileTelegramInput.value.trim();
    const discord = profileDiscordInput.value.trim();
    const phone = profilePhoneInput.value.trim();
    const bio = profileBioInput.value.trim();
    const birthday = profileBirthdayInput.value;
    const theme = selectedTheme;

    chrome.storage.local.set({ 
      nickname,
      isPremium,
      premiumBadge: badge,
      premiumColor: color,
      isInvisible,
      avatar: currentAvatar,
      telegram,
      discord,
      phone,
      bio,
      birthday,
      theme
    }, () => {
      currentNickname = nickname;
      originalTheme = theme;
      // Переподключаемся к чату для обновления данных сессии
      switchChatRoom(currentUrl);
    });
  }
});

// Отмена изменений в профиле
cancelProfileBtn.addEventListener('click', () => {
  document.body.className = `theme-${originalTheme}`;
  showScreen('chat');
});

// Открытие модального окна участников
usersListContainer.addEventListener('click', () => {
  usersModal.style.display = 'flex';
});

// Закрытие модального окна
closeUsersModalBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  usersModal.style.display = 'none';
});

// Закрытие по клику вне модального контента
usersModal.addEventListener('click', (e) => {
  if (e.target === usersModal) {
    usersModal.style.display = 'none';
  }
});

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// Копирование Discord по клику на иконку в сообщении
messagesContainer.addEventListener('click', (e) => {
  const dsBtn = e.target.closest('.discord-msg-btn');
  if (dsBtn) {
    const discord = dsBtn.getAttribute('data-ds');
    if (discord) {
      navigator.clipboard.writeText(discord);
      const originalTitle = dsBtn.title;
      dsBtn.title = 'Скопировано!';
      setTimeout(() => { dsBtn.title = originalTitle; }, 2000);
    }
  }
});

// Обработчик выбора тем
document.addEventListener('click', (e) => {
  const themeBtn = e.target.closest('.theme-select-btn');
  if (themeBtn) {
    const theme = themeBtn.dataset.theme;
    document.querySelectorAll('.theme-select-btn').forEach(btn => {
      btn.classList.toggle('active', btn === themeBtn);
    });
    document.body.className = `theme-${theme}`;
    selectedTheme = theme;
  }
});

// --- ТОЧКА ВХОДА ---
async function init() {
  // Загружаем сохраненную тему
  chrome.storage.local.get(['theme'], (res) => {
    const theme = res.theme || 'white';
    originalTheme = theme;
    selectedTheme = theme;
    document.body.className = `theme-${theme}`;
  });

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

// --- ИГРОВОЙ ДВИЖОК PVP ---

sidebarChatBtn.addEventListener('click', () => {
  sidebarGamesBtn.classList.remove('active');
  sidebarChatBtn.classList.add('active');
  
  chrome.storage.local.get(['nickname'], (res) => {
    if (res.nickname) {
      showScreen('chat');
    } else {
      showScreen('auth');
    }
  });
  
  stopGame();
  if (roomsListInterval) {
    clearInterval(roomsListInterval);
    roomsListInterval = null;
  }
});

sidebarGamesBtn.addEventListener('click', () => {
  sidebarChatBtn.classList.remove('active');
  sidebarGamesBtn.classList.add('active');
  
  chrome.storage.local.get(['nickname', 'isPremium', 'premiumBadge', 'premiumColor'], (res) => {
    if (!res.nickname) {
      alert('Пожалуйста, введите никнейм и зайдите в чат перед началом игры!');
      sidebarGamesBtn.classList.remove('active');
      sidebarChatBtn.classList.add('active');
      showScreen('auth');
      return;
    }
    
    localPlayer.nickname = res.nickname;
    localPlayer.badge = res.isPremium ? (res.premiumBadge || '') : '';
    localPlayer.color = res.isPremium ? (res.premiumColor || '') : '';
    
    showScreen('games');
    
    refreshLobbies();
    if (roomsListInterval) clearInterval(roomsListInterval);
    roomsListInterval = setInterval(refreshLobbies, 4000);
  });
});

refreshRoomsBtn.addEventListener('click', refreshLobbies);

function refreshLobbies() {
  if (socket && aesKey) {
    socket.emit('get_game_rooms');
  }
}

function renderGameRoomsList(rooms) {
  gameRoomsList.innerHTML = '';
  if (rooms.length === 0) {
    gameRoomsList.innerHTML = '<div style="font-size: 12px; color: var(--text-muted); text-align: center; padding: 4px;">Нет активных игр</div>';
    return;
  }
  
  rooms.forEach(r => {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.alignItems = 'center';
    row.style.padding = '4px 6px';
    row.style.background = 'var(--input-bg)';
    row.style.borderRadius = '4px';
    row.style.fontSize = '12px';
    row.style.border = '1px solid var(--border-color)';
    
    const isCurrent = r.room === currentUrl;
    
    row.innerHTML = `
      <span style="font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; color: ${isCurrent ? 'var(--accent-color)' : 'var(--text-color)'};">
        ${r.displayName} ${isCurrent ? '(Вы тут)' : ''}
      </span>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">${r.mode}</span>
        <span style="background: var(--sidebar-header-bg); padding: 1px 6px; border-radius: 10px; font-weight: bold; color: var(--text-color);">
          ${r.count}
        </span>
      </div>
    `;
    
    if (!isCurrent) {
      row.style.cursor = 'pointer';
      row.addEventListener('click', () => {
        if (isGameActive) {
          alert('Сначала выйдите из игры!');
          return;
        }
        switchChatRoom(r.room);
        loadTabs();
      });
    }
    
    gameRoomsList.appendChild(row);
  });
}

document.querySelectorAll('.game-mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!isGameActive) {
      const mode = btn.dataset.mode;
      updateGameMode(mode);
      sendGameModeChange(mode);
    } else {
      alert('Нельзя менять режим во время игры!');
    }
  });
});

function updateGameMode(mode) {
  currentGameMode = mode;
  document.querySelectorAll('.game-mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  
  const desc = document.getElementById('game-mode-desc');
  if (mode === 'ffa') {
    desc.textContent = 'FFA: Каждый сам за себя. Стреляйте во всех, зарабатывайте очки.';
  } else if (mode === 'team') {
    desc.textContent = 'TDM: Командный бой. Красные против Синих. Стреляйте по врагам.';
  } else if (mode === 'infection') {
    desc.textContent = 'Инфекция: Один игрок стартует зомби (зеленый) и заражает людей касанием. Люди могут отбиваться стрельбой.';
  }
}

gameJoinBtn.addEventListener('click', startGame);
gameQuitBtn.addEventListener('click', stopGame);

gameCanvas.addEventListener('mousedown', (e) => {
  if (!isGameActive || localPlayer.hp <= 0) return;
  if (currentGameMode === 'infection' && localPlayer.infected) return;

  const rect = gameCanvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const angle = Math.atan2(mouseY - localPlayer.y, mouseX - localPlayer.x);
  shootBullet(localPlayer.x, localPlayer.y, angle, socket.id || 'self');
});

function startGame() {
  isGameActive = true;
  gameStartOverlay.style.display = 'none';
  gameQuitBtn.style.display = 'block';
  
  localPlayer.hp = 100;
  localPlayer.x = Math.random() * 300 + 35;
  localPlayer.y = Math.random() * 180 + 25;
  localPlayer.score = 0;
  localPlayer.deaths = 0;
  
  if (currentGameMode === 'team') {
    let redCount = 0;
    let blueCount = 0;
    gamePlayers.forEach(p => {
      if (p.team === 'red') redCount++;
      if (p.team === 'blue') blueCount++;
    });
    localPlayer.team = redCount <= blueCount ? 'red' : 'blue';
    localPlayer.infected = false;
  } else if (currentGameMode === 'infection') {
    let infectedExists = false;
    gamePlayers.forEach(p => {
      if (p.infected) infectedExists = true;
    });
    localPlayer.infected = !infectedExists;
  } else {
    localPlayer.team = 'ffa';
    localPlayer.infected = false;
  }
  
  gameProjectiles = [];
  gameBots = [];
  keysPressed = {};
  
  sendGameJoin();
  
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  
  if (gameLoopId) cancelAnimationFrame(gameLoopId);
  gameLoopId = requestAnimationFrame(gameLoop);
  
  if (gameUpdateInterval) clearInterval(gameUpdateInterval);
  gameUpdateInterval = setInterval(() => {
    if (isGameActive) sendGameUpdate();
  }, 60);
}

function stopGame() {
  isGameActive = false;
  gameStartOverlay.style.display = 'flex';
  gameQuitBtn.style.display = 'none';
  
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
  
  if (gameLoopId) {
    cancelAnimationFrame(gameLoopId);
    gameLoopId = null;
  }
  
  if (gameUpdateInterval) {
    clearInterval(gameUpdateInterval);
    gameUpdateInterval = null;
  }
  
  if (socket && aesKey) {
    socket.emit('game_leave');
  }
  
  gamePlayers.clear();
  gameProjectiles = [];
  gameBots = [];
  
  gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
}

function handleKeyDown(e) {
  keysPressed[e.code] = true;
}

function handleKeyUp(e) {
  keysPressed[e.code] = false;
}

function manageBots() {
  const activeHumanPlayersCount = gamePlayers.size + 1;
  let maxBots = 4;
  if (currentRoomSettings && typeof currentRoomSettings.botCount === 'number') {
    maxBots = currentRoomSettings.botCount;
  }
  const targetBotsCount = Math.max(0, maxBots - activeHumanPlayersCount);
  
  while (gameBots.length < targetBotsCount) {
    const botId = 'bot_' + Math.random().toString(36).substr(2, 9);
    const botNames = ['CyberBot', 'NeonStrike', 'GlitchHunter', 'NullPointer', 'ByteSlayer'];
    const nickname = botNames[Math.floor(Math.random() * botNames.length)];
    
    let botTeam = 'ffa';
    let botInfected = false;
    
    if (currentGameMode === 'team') {
      const redCount = (localPlayer.team === 'red' ? 1 : 0) + gameBots.filter(b => b.team === 'red').length;
      const blueCount = (localPlayer.team === 'blue' ? 1 : 0) + gameBots.filter(b => b.team === 'blue').length;
      botTeam = redCount <= blueCount ? 'red' : 'blue';
    } else if (currentGameMode === 'infection') {
      botInfected = !localPlayer.infected;
    }
    
    gameBots.push({
      id: botId,
      nickname: nickname,
      x: Math.random() * 330 + 20,
      y: Math.random() * 190 + 20,
      vx: 0,
      vy: 0,
      hp: 100,
      angle: Math.random() * Math.PI * 2,
      team: botTeam,
      infected: botInfected,
      isBot: true,
      shootCooldown: Math.random() * 1.5,
      wanderTimer: 0
    });
  }
  
  if (gameBots.length > targetBotsCount) {
    gameBots.splice(targetBotsCount);
  }
}

function updateBots() {
  gameBots.forEach(bot => {
    if (bot.hp <= 0) return;
    
    bot.wanderTimer -= 0.016;
    bot.shootCooldown -= 0.016;
    
    let target = null;
    
    if (currentGameMode === 'ffa') {
      target = localPlayer;
    } else if (currentGameMode === 'team') {
      if (localPlayer.team !== bot.team) {
        target = localPlayer;
      }
    } else if (currentGameMode === 'infection') {
      if (bot.infected) {
        if (!localPlayer.infected) {
          target = localPlayer;
        }
      } else {
        if (localPlayer.infected) {
          target = localPlayer;
        }
      }
    }
    
    if (target && target.hp > 0) {
      const dx = target.x - bot.x;
      const dy = target.y - bot.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      bot.angle = Math.atan2(dy, dx);
      
      const speed = bot.infected ? 2.6 : 2.0;
      if (dist > 15) {
        const factor = (currentGameMode === 'infection' && !bot.infected) ? -1 : 1;
        bot.x += Math.cos(bot.angle) * speed * factor;
        bot.y += Math.sin(bot.angle) * speed * factor;
      }
      
      if (!bot.infected && bot.shootCooldown <= 0 && dist < 180) {
        shootBullet(bot.x, bot.y, bot.angle, bot.id);
        bot.shootCooldown = 1.2 + Math.random() * 0.8;
      }
      
      if (currentGameMode === 'infection' && bot.infected && dist < 18) {
        infectTarget(target, bot.id);
      }
    } else {
      if (bot.wanderTimer <= 0) {
        bot.vx = (Math.random() - 0.5) * 1.5;
        bot.vy = (Math.random() - 0.5) * 1.5;
        bot.wanderTimer = 1 + Math.random() * 2;
      }
      bot.x += bot.vx;
      bot.y += bot.vy;
      bot.angle = Math.atan2(bot.vy, bot.vx);
    }
    
    bot.x = Math.max(10, Math.min(360, bot.x));
    bot.y = Math.max(10, Math.min(220, bot.y));
  });
}

function infectTarget(target, zombieId) {
  if (currentGameMode !== 'infection') return;
  
  if (target === localPlayer && !localPlayer.infected) {
    localPlayer.infected = true;
    localPlayer.hp = 100;
    sendGameHit(localPlayer.id, 0, true);
    alert('Вы заражены зомби! Теперь вы зомби!');
  } else if (target.isBot && !target.infected) {
    target.infected = true;
    target.hp = 100;
  }
}

function shootBullet(x, y, angle, ownerId, color = null) {
  const bx = x + Math.cos(angle) * 12;
  const by = y + Math.sin(angle) * 12;
  
  let bulletColor = color || 'yellow';
  if (currentGameMode === 'team') {
    const owner = (ownerId === socket.id) ? localPlayer : (gamePlayers.get(ownerId) || gameBots.find(b => b.id === ownerId));
    if (owner) {
      bulletColor = owner.team === 'red' ? '#ff3333' : '#3333ff';
    }
  }
  
  const bullet = {
    x: bx,
    y: by,
    vx: Math.cos(angle) * 6,
    vy: Math.sin(angle) * 6,
    ownerId: ownerId,
    color: bulletColor
  };
  
  gameProjectiles.push(bullet);
  
  if (ownerId === socket.id) {
    sendGameShoot(bullet);
  }
}

function updateProjectiles() {
  for (let i = gameProjectiles.length - 1; i >= 0; i--) {
    const p = gameProjectiles[i];
    p.x += p.vx;
    p.y += p.vy;
    
    if (p.x < 0 || p.x > gameCanvas.width || p.y < 0 || p.y > gameCanvas.height) {
      gameProjectiles.splice(i, 1);
      continue;
    }
    
    if (p.ownerId !== socket.id && localPlayer.hp > 0) {
      const dx = p.x - localPlayer.x;
      const dy = p.y - localPlayer.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 12) {
        let friendly = false;
        if (currentGameMode === 'team') {
          const shooter = gamePlayers.get(p.ownerId) || gameBots.find(b => b.id === p.ownerId);
          if (shooter && shooter.team === localPlayer.team) friendly = true;
        }
        
        if (!friendly) {
          localPlayer.hp -= 15;
          gameProjectiles.splice(i, 1);
          
          if (localPlayer.hp <= 0) {
            localPlayer.hp = 0;
            localPlayer.deaths++;
            
            const shooter = gamePlayers.get(p.ownerId) || gameBots.find(b => b.id === p.ownerId);
            if (shooter) shooter.score = (shooter.score || 0) + 1;
            
            sendGameHit(localPlayer.id, 15, false);
            
            setTimeout(() => {
              localPlayer.hp = 100;
              localPlayer.x = Math.random() * 320 + 20;
              localPlayer.y = Math.random() * 190 + 20;
            }, 2000);
          } else {
            sendGameHit(localPlayer.id, 15, false);
          }
          continue;
        }
      }
    }
    
    if (p.ownerId === socket.id) {
      let hit = false;
      for (let j = 0; j < gameBots.length; j++) {
        const bot = gameBots[j];
        if (bot.hp <= 0) continue;
        
        const dx = p.x - bot.x;
        const dy = p.y - bot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 12) {
          if (currentGameMode === 'team' && bot.team === localPlayer.team) continue;
          
          bot.hp -= 15;
          gameProjectiles.splice(i, 1);
          hit = true;
          
          if (bot.hp <= 0) {
            bot.hp = 0;
            localPlayer.score++;
            
            chrome.storage.local.get(['messagesSentCount'], (res) => {
              const count = (res.messagesSentCount || 0) + 1;
              chrome.storage.local.set({ messagesSentCount: count });
            });
            
            const deadBot = bot;
            setTimeout(() => {
              if (gameBots.includes(deadBot)) {
                deadBot.hp = 100;
                deadBot.x = Math.random() * 320 + 20;
                deadBot.y = Math.random() * 190 + 20;
              }
            }, 2000);
          }
          break;
        }
      }
      if (hit) continue;
    }
  }
}

function updateLocalPlayer() {
  if (localPlayer.hp <= 0) return;
  
  let dx = 0;
  let dy = 0;
  if (keysPressed['KeyW'] || keysPressed['ArrowUp']) dy -= 1;
  if (keysPressed['KeyS'] || keysPressed['ArrowDown']) dy += 1;
  if (keysPressed['KeyA'] || keysPressed['ArrowLeft']) dx -= 1;
  if (keysPressed['KeyD'] || keysPressed['ArrowRight']) dx += 1;
  
  if (dx !== 0 || dy !== 0) {
    const len = Math.sqrt(dx * dx + dy * dy);
    const speed = (currentGameMode === 'infection' && localPlayer.infected) ? 3.6 : 3;
    localPlayer.x += (dx / len) * speed;
    localPlayer.y += (dy / len) * speed;
    
    localPlayer.x = Math.max(10, Math.min(360, localPlayer.x));
    localPlayer.y = Math.max(10, Math.min(220, localPlayer.y));
    
    localPlayer.angle = Math.atan2(dy, dx);
  }
  
  if (currentGameMode === 'infection' && localPlayer.infected) {
    gamePlayers.forEach((p, id) => {
      if (!p.infected && p.hp > 0) {
        const distDx = p.x - localPlayer.x;
        const distDy = p.y - localPlayer.y;
        const dist = Math.sqrt(distDx * distDx + distDy * distDy);
        if (dist < 18) {
          sendGameHit(id, 0, true);
        }
      }
    });
    
    gameBots.forEach(bot => {
      if (!bot.infected && bot.hp > 0) {
        const distDx = bot.x - localPlayer.x;
        const distDy = bot.y - localPlayer.y;
        const dist = Math.sqrt(distDx * distDx + distDy * distDy);
        if (dist < 18) {
          infectTarget(bot, localPlayer.id);
        }
      }
    });
  }
}

function drawGame() {
  gameCtx.fillStyle = '#0b0914';
  gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
  
  gameCtx.strokeStyle = 'rgba(128, 90, 213, 0.15)';
  gameCtx.lineWidth = 1;
  const gridSize = 25;
  for (let x = 0; x < gameCanvas.width; x += gridSize) {
    gameCtx.beginPath();
    gameCtx.moveTo(x, 0);
    gameCtx.lineTo(x, gameCanvas.height);
    gameCtx.stroke();
  }
  for (let y = 0; y < gameCanvas.height; y += gridSize) {
    gameCtx.beginPath();
    gameCtx.moveTo(0, y);
    gameCtx.lineTo(gameCanvas.width, y);
    gameCtx.stroke();
  }
  
  gameProjectiles.forEach(p => {
    gameCtx.beginPath();
    gameCtx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    gameCtx.fillStyle = p.color || 'yellow';
    gameCtx.shadowColor = p.color || 'yellow';
    gameCtx.shadowBlur = 6;
    gameCtx.fill();
    gameCtx.shadowBlur = 0;
  });
  
  gameBots.forEach(bot => {
    if (bot.hp > 0) drawCharacter(bot);
  });
  
  gamePlayers.forEach(p => {
    if (p.hp > 0) drawCharacter(p);
  });
  
  if (localPlayer.hp > 0) {
    drawCharacter({
      ...localPlayer,
      id: socket ? socket.id : 'self'
    }, true);
  } else {
    gameCtx.fillStyle = 'rgba(220, 53, 69, 0.8)';
    gameCtx.font = 'bold 16px sans-serif';
    gameCtx.textAlign = 'center';
    gameCtx.fillText('ВЫ ПОГИБЛИ', gameCanvas.width / 2, gameCanvas.height / 2 - 10);
    gameCtx.font = '11px sans-serif';
    gameCtx.fillText('Возрождение через 2 сек...', gameCanvas.width / 2, gameCanvas.height / 2 + 10);
  }
}

function drawCharacter(c, isSelf = false) {
  let color = 'cyan';
  if (currentGameMode === 'team') {
    color = c.team === 'red' ? '#ff3333' : '#3333ff';
  } else if (currentGameMode === 'infection') {
    color = c.infected ? '#00ff66' : '#ffffff';
  } else {
    color = isSelf ? '#00d2ff' : '#ff9f1c';
  }
  
  if (c.color && currentGameMode === 'ffa') {
    color = c.color;
  }
  
  gameCtx.beginPath();
  gameCtx.arc(c.x, c.y, 10, 0, Math.PI * 2);
  gameCtx.fillStyle = color;
  gameCtx.shadowColor = color;
  gameCtx.shadowBlur = 8;
  gameCtx.fill();
  gameCtx.shadowBlur = 0;
  
  gameCtx.beginPath();
  gameCtx.moveTo(c.x, c.y);
  gameCtx.lineTo(c.x + Math.cos(c.angle) * 12, c.y + Math.sin(c.angle) * 12);
  gameCtx.strokeStyle = 'white';
  gameCtx.lineWidth = 2;
  gameCtx.stroke();
  
  gameCtx.fillStyle = 'white';
  gameCtx.font = '9px sans-serif';
  gameCtx.textAlign = 'center';
  
  const badgeStr = c.badge ? c.badge + ' ' : '';
  const scoreVal = c.score || 0;
  const levelStr = ` [K:${scoreVal}]`;
  const nameLabel = `${badgeStr}${c.nickname}${levelStr}`;
  gameCtx.fillText(nameLabel, c.x, c.y - 18);
  
  const barW = 20;
  const barH = 3;
  gameCtx.fillStyle = 'rgba(0,0,0,0.5)';
  gameCtx.fillRect(c.x - barW / 2, c.y - 14, barW, barH);
  
  const hpPercent = c.hp / 100;
  gameCtx.fillStyle = c.infected ? '#00ff66' : (hpPercent > 0.5 ? '#198754' : '#dc3545');
  gameCtx.fillRect(c.x - barW / 2, c.y - 14, barW * hpPercent, barH);
}

async function sendGameJoin() {
  if (socket && aesKey) {
    try {
      const payload = await encryptText(JSON.stringify({
        nickname: localPlayer.nickname,
        x: localPlayer.x,
        y: localPlayer.y,
        hp: localPlayer.hp,
        team: localPlayer.team,
        infected: localPlayer.infected,
        badge: localPlayer.badge,
        color: localPlayer.color
      }), aesKey);
      socket.emit('game_join', payload);
    } catch(e) {
      console.error(e);
    }
  }
}

async function sendGameUpdate() {
  if (socket && aesKey) {
    try {
      const payload = await encryptText(JSON.stringify({
        x: localPlayer.x,
        y: localPlayer.y,
        angle: localPlayer.angle,
        hp: localPlayer.hp,
        team: localPlayer.team,
        infected: localPlayer.infected,
        score: localPlayer.score,
        badge: localPlayer.badge,
        color: localPlayer.color
      }), aesKey);
      socket.emit('game_update', payload);
    } catch(e) {
      console.error(e);
    }
  }
}

async function sendGameShoot(bullet) {
  if (socket && aesKey) {
    try {
      const payload = await encryptText(JSON.stringify(bullet), aesKey);
      socket.emit('game_shoot', payload);
    } catch(e) {
      console.error(e);
    }
  }
}

async function sendGameHit(targetId, damage, infect = false) {
  if (socket && aesKey) {
    try {
      const payload = await encryptText(JSON.stringify({
        targetId,
        damage,
        infect,
        shooterId: socket.id
      }), aesKey);
      socket.emit('game_hit', payload);
    } catch(e) {
      console.error(e);
    }
  }
}

async function sendGameModeChange(mode) {
  if (socket && aesKey) {
    try {
      const payload = await encryptText(JSON.stringify({ mode }), aesKey);
      socket.emit('game_mode_change', payload);
    } catch(e) {
      console.error(e);
    }
  }
}

function gameLoop() {
  if (!isGameActive) return;
  
  manageBots();
  updateLocalPlayer();
  updateBots();
  updateProjectiles();
  drawGame();
  
  gameLoopId = requestAnimationFrame(gameLoop);
}

// --- ИГРОВОЙ ДВИЖОК PVP КОНЕЦ ---

// --- UGC: ПРИВАТИЗАЦИЯ И КАСТОМИЗАЦИЯ КОМНАТ ---
let currentRoomSettings = { owner: null, theme: null };

const roomManageBtn = document.getElementById('room-manage-btn');
const closeRoomSettingsBtn = document.getElementById('close-room-settings-btn');
const claimRoomBtn = document.getElementById('claim-room-btn');
const saveRoomSettingsBtn = document.getElementById('save-room-settings-btn');

const roomUnownedView = document.getElementById('room-unowned-view');
const roomOwnedOtherView = document.getElementById('room-owned-other-view');
const roomOwnedSelfView = document.getElementById('room-owned-self-view');
const roomOwnerNameDisplay = document.getElementById('room-owner-name-display');
let selectedRoomTheme = 'white';

if (roomManageBtn) {
  roomManageBtn.addEventListener('click', () => {
    // Сбрасываем активную вкладку на Дизайн при открытии
    const defaultTab = document.querySelector('.studio-tab[data-target="studio-design"]');
    if (defaultTab) {
      // Имитируем клик для переключения панелей и сброса стилей
      defaultTab.click();
    }
    updateRoomSettingsUi();
    showScreen('room-settings');
  });
}

if (closeRoomSettingsBtn) {
  closeRoomSettingsBtn.addEventListener('click', () => {
    showScreen('chat');
  });
}

if (claimRoomBtn) {
  claimRoomBtn.addEventListener('click', () => {
    if (socket && aesKey) {
      socket.emit('claim_room');
    }
  });
}

// Переключение вкладок в Творческой студии
document.querySelectorAll('.studio-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.studio-tab').forEach(t => {
      t.classList.remove('active');
      t.style.borderBottomColor = 'transparent';
      t.style.color = 'var(--text-muted)';
    });
    tab.classList.add('active');
    tab.style.borderBottomColor = 'var(--accent-color)';
    tab.style.color = 'var(--accent-color)';

    document.querySelectorAll('.studio-panel').forEach(panel => {
      panel.style.display = 'none';
    });
    const targetPanel = document.getElementById(tab.dataset.target);
    if (targetPanel) {
      targetPanel.style.display = 'flex';
    }
  });
});

document.querySelectorAll('.room-theme-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedRoomTheme = btn.dataset.theme;
    document.querySelectorAll('.room-theme-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.theme === selectedRoomTheme);
    });
  });
});

if (saveRoomSettingsBtn) {
  saveRoomSettingsBtn.addEventListener('click', async () => {
    if (socket && aesKey) {
      try {
        const bgUrl = document.getElementById('room-bg-url-input').value.trim();
        const accentColor = document.getElementById('room-accent-color-input').value;
        const welcomeMessage = document.getElementById('room-welcome-input').value.trim();
        
        const botConfig = [];
        const triggerInputs = document.querySelectorAll('.bot-trigger-input');
        const responseInputs = document.querySelectorAll('.bot-response-input');
        triggerInputs.forEach((input, index) => {
          const trigger = input.value.trim();
          const response = responseInputs[index].value.trim();
          if (trigger && response) {
            botConfig.push({ trigger, response });
          }
        });

        const gameMode = document.getElementById('room-game-mode-input').value;
        const botCountRaw = document.getElementById('room-bot-count-input').value.trim();
        const botCount = botCountRaw !== '' ? parseInt(botCountRaw, 10) : null;

        const payloadData = {
          theme: selectedRoomTheme,
          bgUrl: bgUrl || null,
          accentColor: accentColor || null,
          welcomeMessage: welcomeMessage || null,
          botConfig: botConfig,
          gameMode: gameMode || null,
          botCount: botCount
        };

        const payload = await encryptText(JSON.stringify(payloadData), aesKey);
        socket.emit('update_room_settings', payload);
        showScreen('chat');
      } catch (err) {
        console.error('Ошибка сохранения настроек комнаты', err);
      }
    }
  });
}

function updateRoomSettingsUi() {
  roomUnownedView.style.display = 'none';
  roomOwnedOtherView.style.display = 'none';
  roomOwnedSelfView.style.display = 'none';

  if (!currentRoomSettings.owner) {
    roomUnownedView.style.display = 'flex';
  } else if (currentRoomSettings.owner === currentNickname) {
    roomOwnedSelfView.style.display = 'flex';
    selectedRoomTheme = currentRoomSettings.theme || 'white';
    document.querySelectorAll('.room-theme-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.theme === selectedRoomTheme);
    });

    document.getElementById('room-bg-url-input').value = currentRoomSettings.bgUrl || '';
    document.getElementById('room-accent-color-input').value = currentRoomSettings.accentColor || '#0d6efd';
    document.getElementById('room-welcome-input').value = currentRoomSettings.welcomeMessage || '';
    
    const botConfig = currentRoomSettings.botConfig || [];
    const triggerInputs = document.querySelectorAll('.bot-trigger-input');
    const responseInputs = document.querySelectorAll('.bot-response-input');
    
    triggerInputs.forEach((input, index) => {
      input.value = botConfig[index] ? botConfig[index].trigger : '';
    });
    responseInputs.forEach((input, index) => {
      input.value = botConfig[index] ? botConfig[index].response : '';
    });

    document.getElementById('room-game-mode-input').value = currentRoomSettings.gameMode || '';
    document.getElementById('room-bot-count-input').value = currentRoomSettings.botCount !== undefined && currentRoomSettings.botCount !== null ? currentRoomSettings.botCount : '';
  } else {
    roomOwnedOtherView.style.display = 'flex';
    roomOwnerNameDisplay.textContent = currentRoomSettings.owner;
  }
}

function applyRoomSettings(settings) {
  currentRoomSettings = settings;
  
  const headerTitle = document.getElementById('chat-header-title');
  if (settings.owner) {
    let hostname = 'Site Chat';
    try {
      hostname = new URL(currentUrl).hostname;
    } catch (e) {}
    headerTitle.innerHTML = `<span style="font-size: 11px; opacity: 0.8;">Владелец: </span><span style="color: var(--author-text);">${settings.owner}</span><br><span style="font-size: 10px; opacity: 0.6;">${hostname}</span>`;
  } else {
    try {
      headerTitle.textContent = new URL(currentUrl).hostname;
    } catch (e) {
      headerTitle.textContent = 'Site Chat';
    }
  }

  // Применяем тему комнаты
  if (settings.theme) {
    document.body.className = `theme-${settings.theme}`;
  } else {
    document.body.className = `theme-${originalTheme}`;
  }

  // Применяем фоновую картинку
  const existingBgOverlay = document.getElementById('room-custom-bg');
  if (settings.bgUrl) {
    if (!existingBgOverlay) {
      const bgOverlay = document.createElement('div');
      bgOverlay.id = 'room-custom-bg';
      bgOverlay.style.position = 'absolute';
      bgOverlay.style.top = '0';
      bgOverlay.style.left = '0';
      bgOverlay.style.width = '100%';
      bgOverlay.style.height = '100%';
      bgOverlay.style.backgroundImage = `url(${settings.bgUrl})`;
      bgOverlay.style.backgroundSize = 'cover';
      bgOverlay.style.backgroundPosition = 'center';
      bgOverlay.style.opacity = '0.15';
      bgOverlay.style.zIndex = '-2';
      bgOverlay.style.pointerEvents = 'none';
      document.body.appendChild(bgOverlay);
    } else {
      existingBgOverlay.style.backgroundImage = `url(${settings.bgUrl})`;
      existingBgOverlay.style.display = 'block';
    }
  } else {
    if (existingBgOverlay) {
      existingBgOverlay.style.display = 'none';
    }
  }

  // Применяем кастомный акцентный цвет
  const existingCustomStyle = document.getElementById('room-custom-style');
  if (settings.accentColor) {
    const cssContent = `
      :root {
        --accent-color: ${settings.accentColor} !important;
        --button-bg: ${settings.accentColor} !important;
      }
    `;
    if (!existingCustomStyle) {
      const styleEl = document.createElement('style');
      styleEl.id = 'room-custom-style';
      styleEl.textContent = cssContent;
      document.head.appendChild(styleEl);
    } else {
      existingCustomStyle.textContent = cssContent;
    }
  } else {
    if (existingCustomStyle) {
      existingCustomStyle.remove();
    }
  }

  // Если владелец комнаты принудительно установил режим игры, применяем его
  if (settings.gameMode) {
    updateGameMode(settings.gameMode);
  }
  
  if (document.getElementById('room-settings-screen').style.display === 'flex') {
    updateRoomSettingsUi();
  }
}

// --- КЛИКЕР-ИГРА "ШАХТА" (MINER CLICKER) ---
let clickerCoins = 0;
let upgradePickaxe = 1;
let upgradeDrill = 0;
let upgradeQuantum = 0;
let clickerTimer = null;
let clickerSocketThrottleTimer = null;
let clickerHasUnsavedChanges = false;

function saveClickerState() {
  chrome.storage.local.set({
    clickerCoins: Math.floor(clickerCoins),
    upgradePickaxe,
    upgradeDrill,
    upgradeQuantum,
    clickerLastSavedTime: Date.now()
  });
}

// Сохраняем состояние при закрытии/сворачивании popup
window.addEventListener('unload', () => {
  saveClickerState();
});

function initClickerGame() {
  chrome.storage.local.get(['clickerCoins', 'upgradePickaxe', 'upgradeDrill', 'upgradeQuantum', 'clickerLastSavedTime'], (res) => {
    clickerCoins = res.clickerCoins || 0;
    upgradePickaxe = res.upgradePickaxe || 1;
    upgradeDrill = res.upgradeDrill || 0;
    upgradeQuantum = res.upgradeQuantum || 0;
    
    // Рассчитываем оффлайн-доход от автобуров
    const lastSaved = res.clickerLastSavedTime;
    const incomePerSec = upgradeDrill * 1 + upgradeQuantum * 10;
    if (lastSaved && incomePerSec > 0) {
      const timeDiffSeconds = Math.floor((Date.now() - lastSaved) / 1000);
      if (timeDiffSeconds > 0) {
        const offlineIncome = timeDiffSeconds * incomePerSec;
        clickerCoins += offlineIncome;
        
        // Красивое оповещение в чат
        setTimeout(() => {
          appendMessageToUi({
            author: '📢 Система',
            text: `Пока вас не было, ваши буры добыли 🪙 ${offlineIncome} коинов! (вы отсутствовали ${timeDiffSeconds} сек)`,
            time: new Date().toISOString(),
            badge: '📢',
            color: '#0d6efd',
            avatar: '',
            telegram: '',
            discord: ''
          });
        }, 1500);
      }
    }
    
    updateClickerUi();
    
    // Запускаем автоматическую добычу каждую секунду
    if (clickerTimer) clearInterval(clickerTimer);
    clickerTimer = setInterval(() => {
      const income = upgradeDrill * 1 + upgradeQuantum * 10;
      if (income > 0) {
        clickerCoins += income;
        clickerHasUnsavedChanges = true;
        updateClickerUi();
      }
    }, 1000);
    
    // Запускаем отправку статистики на сервер и сохранение в локальное хранилище каждые 3 секунды
    if (clickerSocketThrottleTimer) clearInterval(clickerSocketThrottleTimer);
    clickerSocketThrottleTimer = setInterval(() => {
      if (clickerHasUnsavedChanges) {
        saveClickerState();
        if (socket && aesKey) {
          sendClickerStats();
        }
        clickerHasUnsavedChanges = false;
      }
    }, 3000);
  });
}

function updateClickerUi() {
  const coinsDisplay = document.getElementById('clicker-coins-display');
  const incomeDisplay = document.getElementById('clicker-income-display');
  if (coinsDisplay) coinsDisplay.textContent = Math.floor(clickerCoins);
  
  const income = upgradeDrill * 1 + upgradeQuantum * 10;
  if (incomeDisplay) incomeDisplay.textContent = `+${income} /сек`;
  
  // Улучшение Кирки
  const costPick = upgradePickaxe * 10;
  const pickCostEl = document.getElementById('upgrade-pick-cost');
  const pickDescEl = document.getElementById('upgrade-pick-desc');
  if (pickCostEl) pickCostEl.textContent = costPick;
  if (pickDescEl) pickDescEl.textContent = `Клик: +${upgradePickaxe} коин (Ур. ${upgradePickaxe})`;
  
  // Улучшение Бура
  const costDrill = (upgradeDrill + 1) * 50;
  const drillCostEl = document.getElementById('upgrade-drill-cost');
  const drillDescEl = document.getElementById('upgrade-drill-desc');
  if (drillCostEl) drillCostEl.textContent = costDrill;
  if (drillDescEl) drillDescEl.textContent = `+1/сек автоматически (Ур. ${upgradeDrill})`;
  
  // Улучшение Квантового Бура
  const costQuantum = (upgradeQuantum + 1) * 250;
  const quantumCostEl = document.getElementById('upgrade-quantum-cost');
  const quantumDescEl = document.getElementById('upgrade-quantum-desc');
  if (quantumCostEl) quantumCostEl.textContent = costQuantum;
  if (quantumDescEl) quantumDescEl.textContent = `+10/сек автоматически (Ур. ${upgradeQuantum})`;
}

async function sendClickerStats() {
  try {
    const payload = await encryptText(JSON.stringify({ coins: Math.floor(clickerCoins) }), aesKey);
    socket.emit('clicker_update', payload);
  } catch(e) {
    console.error('Ошибка отправки кликера', e);
  }
}

function createFlyingText(x, y, text) {
  const el = document.createElement('div');
  el.textContent = text;
  el.style.position = 'fixed';
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.color = '#ffc107';
  el.style.fontWeight = '900';
  el.style.fontSize = '14px';
  el.style.pointerEvents = 'none';
  el.style.zIndex = '9999';
  el.style.transition = 'all 0.8s ease-out';
  el.style.transform = 'translate(-50%, -50%)';
  document.body.appendChild(el);
  
  setTimeout(() => {
    el.style.top = `${y - 40}px`;
    el.style.opacity = '0';
  }, 10);
  
  setTimeout(() => {
    el.remove();
  }, 800);
}

function renderClickerLeaderboard(usersInRoom) {
  const leaderboardList = document.getElementById('clicker-leaderboard-list');
  if (!leaderboardList) return;
  leaderboardList.innerHTML = '';
  
  const sortedUsers = [...usersInRoom].sort((a, b) => (b.coins || 0) - (a.coins || 0));
  
  sortedUsers.forEach((u, index) => {
    const isSelf = u.nickname === currentNickname;
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.alignItems = 'center';
    row.style.fontSize = '12px';
    row.style.padding = '4px 6px';
    row.style.borderRadius = '4px';
    row.style.background = isSelf ? 'var(--tab-active-bg)' : 'transparent';
    row.style.color = isSelf ? 'var(--tab-active-text)' : 'var(--text-color)';
    row.style.fontWeight = isSelf ? 'bold' : 'normal';
    
    row.innerHTML = `
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="font-size: 10px; color: var(--text-muted); font-weight: bold; width: 14px;">#${index + 1}</span>
        <span>${u.nickname}</span>
      </div>
      <div style="color: #ffc107; font-weight: bold; display: flex; align-items: center; gap: 2px;">
        <span>🪙</span>
        <span>${u.coins || 0}</span>
      </div>
    `;
    leaderboardList.appendChild(row);
  });
}

// Слушатели событий кликера
const clickerCrystal = document.getElementById('clicker-crystal');
if (clickerCrystal) {
  clickerCrystal.addEventListener('click', (e) => {
    clickerCrystal.style.transform = 'scale(0.95)';
    setTimeout(() => {
      clickerCrystal.style.transform = 'scale(1)';
    }, 50);
    
    clickerCoins += upgradePickaxe;
    clickerHasUnsavedChanges = true;
    updateClickerUi();
    
    createFlyingText(e.clientX, e.clientY, `+${upgradePickaxe}`);
  });
}

const buyUpgradePick = document.getElementById('buy-upgrade-pick');
if (buyUpgradePick) {
  buyUpgradePick.addEventListener('click', () => {
    const cost = upgradePickaxe * 10;
    if (clickerCoins >= cost) {
      clickerCoins -= cost;
      upgradePickaxe += 1;
      clickerHasUnsavedChanges = true;
      updateClickerUi();
      saveClickerState();
      sendClickerStats();
    }
  });
}

const buyUpgradeDrill = document.getElementById('buy-upgrade-drill');
if (buyUpgradeDrill) {
  buyUpgradeDrill.addEventListener('click', () => {
    const cost = (upgradeDrill + 1) * 50;
    if (clickerCoins >= cost) {
      clickerCoins -= cost;
      upgradeDrill += 1;
      clickerHasUnsavedChanges = true;
      updateClickerUi();
      saveClickerState();
      sendClickerStats();
    }
  });
}

const buyUpgradeQuantum = document.getElementById('buy-upgrade-quantum');
if (buyUpgradeQuantum) {
  buyUpgradeQuantum.addEventListener('click', () => {
    const cost = (upgradeQuantum + 1) * 250;
    if (clickerCoins >= cost) {
      clickerCoins -= cost;
      upgradeQuantum += 1;
      clickerHasUnsavedChanges = true;
      updateClickerUi();
      saveClickerState();
      sendClickerStats();
    }
  });
}

// Переключение между PVP Ареной, Шахтой (кликером) и Релакс (ASMR)
const gameTabPvp = document.getElementById('game-tab-pvp');
const gameTabClicker = document.getElementById('game-tab-clicker');
const gameTabRelax = document.getElementById('game-tab-relax');
const gamesPanelPvp = document.getElementById('games-panel-pvp');
const gamesPanelClicker = document.getElementById('games-panel-clicker');
const gamesPanelRelax = document.getElementById('games-panel-relax');

const relaxVideoPlayer = document.getElementById('relax-video-player');
const relaxPlayerPlaceholder = document.getElementById('relax-player-placeholder');

const CARPET_PLAYLIST = [
  "Hpgw0T6KIRA", "HgKeX36LjiQ", "5DL4v0UkITI", "9dkEtSsDqTM", "MU7tDGf203k",
  "aAUG-5aYr2c", "_VY4r5ty8hc", "WhGVoJ3qWzs", "kmuEvmJ_n44", "erw3qPgV4zs",
  "orf5xwhbmMQ", "t4tYTkRtyTI", "o8w9PBeojX0", "RSEZliEfInU", "ivUVhrJpF_M",
  "XAmlB-F-9VI", "XSr83tPjjZ4", "lWXFqYI_3Rg", "zgiwHCNpgco", "s7lJ9TMS1pM",
  "QSyHZC8aU7g", "YGRsVl6zov4", "JUcR3Yv0Heo", "OpFDWhEGH-o", "Cdnfoi7OoO4",
  "wSjtSboLAZ4", "Iflr2FBJvS4", "hW3nEHsmNXM", "x5x7PBPeC-8", "47phJFCbfeI",
  "z7OKEKT6r94", "D2Ns2ifQ53E", "JJA2M2HgDuQ", "J6GLXcla6oU", "AdtHunhytyU",
  "56ce36CJbhU", "q7Syi2mbIO0", "gHaxtcSWY8w", "Eg_E8GYftxk", "AlHHK4p7H9M",
  "eNmi3oMhr1E", "p3KCpYcFjdE", "kWdcX6eyi4c", "7t_axQtm1-w", "_Udu4tD1mqY",
  "zQoT1QYbdHc", "VZVjyfDcf6I", "2q0ujrdT8-Q", "TRbXEuYu8po", "SthZ3KnQSFQ",
  "vmSEBQA65P8", "4K3sV7qiZd0", "woFUByHItCk", "A5MOqI2-FZE", "WpWrdRHpU3s",
  "h8cf9Pw29oU", "g-RIFmT3L0o", "Kq6fpHblxic", "mEzZ6fTcwmA", "w1pQHuWV2JM",
  "-yw4gWeq3QY", "1_6C-SWQRwU", "Tb5L-kcJfho", "VV6JuB3ZmVc", "8n2wRvhergo",
  "gg1IZhdWiNw", "F8azcYH7WPk", "nMf2pk8x_h0", "t1nPATCDakE", "UcOUnBt9yyw",
  "mLT0IOMQqVM", "-gKSi0axz6A", "BY2H9lczp_Y", "0BdYdtJ_BRg", "VyZEgS6tReQ",
  "qYAMNnEiUb0", "caFtyG64crg", "783guRk48VA", "bRR1cgEmG0c", "awYRK3PKOUg",
  "qJ54Ib0Sl1c", "DKetcbITNpA", "ucmaR-rsA_c", "nC62Fnh9OM8", "u85vpttQw-s",
  "roTbValeTVY", "fkgbyCpc_CE", "meqFtj9mRQY", "JqLq98DL3As", "v2vv45n_1p8",
  "P5mmqHgGgkI", "oCo8iin1TII", "a7FWnGqytUo", "qXYx6b0WdHk", "Dae3wOM4DMk",
  "5-z7BFoQXRE", "9UC067AKtsk", "bpGrK-9v_yA", "X8RBDoKcDaY", "Y8fOUeKNjXQ"
];

const RELAX_VIDEOS = {
  carpet: `https://www.youtube.com/embed/${CARPET_PLAYLIST[0]}?autoplay=1&mute=1&enablejsapi=1`,
  soap: 'https://www.youtube.com/embed/V6_V9n5X4oQ?autoplay=1&mute=1&loop=1&playlist=V6_V9n5X4oQ',
  subway: 'https://www.youtube.com/embed/42_xee_vjM0?autoplay=1&mute=1&loop=1&playlist=42_xee_vjM0',
  sand: 'https://www.youtube.com/embed/qL_fH_xH5Jg?autoplay=1&mute=1&loop=1&playlist=qL_fH_xH5Jg'
};

let currentCarpetIndex = 0;
let isYoutubeListenerAdded = false;
let isCarpetActive = false;

function playNextCarpetVideo() {
  if (!isCarpetActive) return;
  currentCarpetIndex = (currentCarpetIndex + 1) % CARPET_PLAYLIST.length;
  const nextVideoId = CARPET_PLAYLIST[currentCarpetIndex];
  if (relaxVideoPlayer) {
    relaxVideoPlayer.src = `https://www.youtube.com/embed/${nextVideoId}?autoplay=1&mute=1&enablejsapi=1`;
    console.log(`[ASMR] Переключение на следующее видео ковров (индекс ${currentCarpetIndex}): ${nextVideoId}`);
  }
}

function initYoutubeListener() {
  if (isYoutubeListenerAdded) return;
  window.addEventListener('message', (event) => {
    // Проверяем, что сообщение пришло от домена youtube.com
    if (!event.origin.includes('youtube.com')) return;
    
    try {
      let data = event.data;
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      
      // Событие onStateChange: 0 означает видео закончилось (ended)
      if (data && data.event === 'onStateChange' && data.info === 0) {
        playNextCarpetVideo();
      }
    } catch (e) {
      // Игнорируем ошибки парсинга для не-youtube сообщений
    }
  });
  isYoutubeListenerAdded = true;
}

function stopRelaxVideo() {
  isCarpetActive = false;
  if (relaxVideoPlayer) {
    relaxVideoPlayer.src = '';
    relaxVideoPlayer.style.display = 'none';
  }
  if (relaxPlayerPlaceholder) {
    relaxPlayerPlaceholder.style.display = 'flex';
  }
  
  // Сбрасываем стили кнопок выбора видео
  document.querySelectorAll('.relax-video-btn').forEach(btn => {
    btn.style.background = 'var(--input-bg)';
    btn.style.borderColor = 'var(--border-color)';
    btn.style.color = 'var(--text-color)';
  });
}

if (gameTabPvp && gameTabClicker && gameTabRelax) {
  gameTabPvp.addEventListener('click', () => {
    stopRelaxVideo();

    gameTabPvp.classList.add('active');
    gameTabPvp.style.background = 'var(--tab-active-bg)';
    gameTabPvp.style.color = 'var(--tab-active-text)';
    
    gameTabClicker.classList.remove('active');
    gameTabClicker.style.background = 'transparent';
    gameTabClicker.style.color = 'var(--text-color)';

    gameTabRelax.classList.remove('active');
    gameTabRelax.style.background = 'transparent';
    gameTabRelax.style.color = 'var(--text-color)';
    
    if (gamesPanelPvp) gamesPanelPvp.style.display = 'flex';
    if (gamesPanelClicker) gamesPanelClicker.style.display = 'none';
    if (gamesPanelRelax) gamesPanelRelax.style.display = 'none';
  });
  
  gameTabClicker.addEventListener('click', () => {
    stopRelaxVideo();

    gameTabClicker.classList.add('active');
    gameTabClicker.style.background = 'var(--tab-active-bg)';
    gameTabClicker.style.color = 'var(--tab-active-text)';
    
    gameTabPvp.classList.remove('active');
    gameTabPvp.style.background = 'transparent';
    gameTabPvp.style.color = 'var(--text-color)';

    gameTabRelax.classList.remove('active');
    gameTabRelax.style.background = 'transparent';
    gameTabRelax.style.color = 'var(--text-color)';
    
    if (gamesPanelClicker) gamesPanelClicker.style.display = 'flex';
    if (gamesPanelPvp) gamesPanelPvp.style.display = 'none';
    if (gamesPanelRelax) gamesPanelRelax.style.display = 'none';
    
    renderClickerLeaderboard(currentUsersInRoom);
  });

  gameTabRelax.addEventListener('click', () => {
    gameTabRelax.classList.add('active');
    gameTabRelax.style.background = 'var(--tab-active-bg)';
    gameTabRelax.style.color = 'var(--tab-active-text)';
    
    gameTabPvp.classList.remove('active');
    gameTabPvp.style.background = 'transparent';
    gameTabPvp.style.color = 'var(--text-color)';

    gameTabClicker.classList.remove('active');
    gameTabClicker.style.background = 'transparent';
    gameTabClicker.style.color = 'var(--text-color)';
    
    if (gamesPanelRelax) gamesPanelRelax.style.display = 'flex';
    if (gamesPanelPvp) gamesPanelPvp.style.display = 'none';
    if (gamesPanelClicker) gamesPanelClicker.style.display = 'none';
  });
}

// Слушатели событий кнопок запуска видео
document.querySelectorAll('.relax-video-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // Сбрасываем стили всех кнопок видео
    document.querySelectorAll('.relax-video-btn').forEach(b => {
      b.style.background = 'var(--input-bg)';
      b.style.borderColor = 'var(--border-color)';
      b.style.color = 'var(--text-color)';
    });

    // Выделяем активную кнопку
    btn.style.background = 'var(--tab-active-bg)';
    btn.style.borderColor = 'var(--accent-color)';
    btn.style.color = 'var(--tab-active-text)';

    const videoKey = btn.getAttribute('data-video');
    if (relaxVideoPlayer) {
      if (videoKey === 'carpet') {
        isCarpetActive = true;
        currentCarpetIndex = 0;
        initYoutubeListener();
        relaxVideoPlayer.src = `https://www.youtube.com/embed/${CARPET_PLAYLIST[0]}?autoplay=1&mute=1&enablejsapi=1`;
      } else {
        isCarpetActive = false;
        const embedUrl = RELAX_VIDEOS[videoKey];
        if (embedUrl) {
          relaxVideoPlayer.src = embedUrl;
        }
      }
      relaxVideoPlayer.style.display = 'block';
      if (relaxPlayerPlaceholder) {
        relaxPlayerPlaceholder.style.display = 'none';
      }
    }
  });
});
