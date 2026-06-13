const SERVER_URL = 'https://bibiswim-webmess.hf.space'; // Ссылка на ваш хостинг

// Проверка режима во весь экран (таб-режим)
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('tab') === 'true') {
  document.body.classList.add('mode-tab');
}

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

// Элементы игры «Бутылочка»
const gameTabBottle = document.getElementById('game-tab-bottle');
const gamesPanelBottle = document.getElementById('games-panel-bottle');
const bottleStatusText = document.getElementById('bottle-status-text');
const bottleTurnTimer = document.getElementById('bottle-turn-timer');
const bottleTimerValue = document.getElementById('bottle-timer-value');
const bottleTable = document.getElementById('bottle-table');
const bottleSprite = document.getElementById('bottle-sprite');
const bottlePlayersContainer = document.getElementById('bottle-players-container');
const bottleChoiceOverlay = document.getElementById('bottle-choice-overlay');
const bottleChoiceTitle = document.getElementById('bottle-choice-title');
const bottleChoiceYesBtn = document.getElementById('bottle-choice-yes-btn');
const bottleChoiceNoBtn = document.getElementById('bottle-choice-no-btn');
const bottleChoiceTimerVal = document.getElementById('bottle-choice-timer-val');
const bottleJoinBtn = document.getElementById('bottle-join-btn');
const bottleLeaveBtn = document.getElementById('bottle-leave-btn');
const bottleSpinBtn = document.getElementById('bottle-spin-btn');
const bottleSpinAnytimeBtn = document.getElementById('bottle-spin-anytime-btn');

// Элементы локального чата Бутылочки
const bottleChatToggleBtn = document.getElementById('bottle-chat-toggle-btn');
const bottleChatBadge = document.getElementById('bottle-chat-badge');
const bottleLocalChatPanel = document.getElementById('bottle-local-chat-panel');
const bottleChatCloseBtn = document.getElementById('bottle-chat-close-btn');
const bottleChatMessages = document.getElementById('bottle-chat-messages');
const bottleChatInput = document.getElementById('bottle-chat-input');
const bottleChatSendBtn = document.getElementById('bottle-chat-send-btn');

let bottleChoiceTimer = null;

// Элементы Магазина и Заказа Музыки
const gameTabShop = document.getElementById('game-tab-shop');
const gamesPanelShop = document.getElementById('games-panel-shop');
const shopCoinsDisplay = document.getElementById('shop-coins-display');
const shopTaskPro = document.getElementById('shop-task-pro');
const shopTaskLightning = document.getElementById('shop-task-lightning');

const MAP_SIZE = 4000;
let isGameActive = false;
let currentGameMode = 'ffa';
let localPlayer = {
  id: '',
  x: 2000,
  y: 2000,
  angle: 0,
  nickname: '',
  hp: 100,
  score: 20,
  deaths: 0,
  team: 'ffa',
  infected: false,
  badge: '',
  color: '',
  length: 20,
  body: [],
  history: []
};
let activePowerups = {
  speed: 0,
  magnet: 0,
  double: 0
};
let lastLoopTime = 0;
let gamePlayers = new Map();
let gameProjectiles = [];
let gameBots = [];
let gameFoods = [];
let isBoosting = false;
let mouseX = 0;
let mouseY = 0;
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
    if (typeof leaveBottleGameClient === 'function') {
      leaveBottleGameClient();
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
  const frameClass = msg.avatarFrame ? `frame-${msg.avatarFrame}` : '';
  let avatarOutsideHtml = '';
  if (avatar) {
    avatarOutsideHtml = `<img src="${avatar}" class="message-avatar-outside ${frameClass}" title="${author}">`;
  } else {
    const fallbackChar = badge || author.charAt(0).toUpperCase();
    const bgStyle = color ? `background-color: ${color};` : '';
    avatarOutsideHtml = `<div class="message-avatar-outside ${frameClass}" style="${bgStyle}" title="${author}">${fallbackChar}</div>`;
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

  if (document.body.classList.contains('mode-tab')) {
    showScreen('games');
  } else {
    showScreen('chat');
  }
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
  chrome.storage.local.get([
    'isPremium', 'premiumBadge', 'premiumColor', 'isInvisible', 'avatar', 'telegram', 'discord',
    'activeAvatarFrame', 'activeColor', 'activeBadge'
  ], (storageData) => {
    const isPremium = storageData.isPremium || false;
    const badge = (isPremium && storageData.premiumBadge) ? storageData.premiumBadge : (storageData.activeBadge || '');
    const color = (isPremium && storageData.premiumColor) ? storageData.premiumColor : (storageData.activeColor || '');
    const avatarFrame = storageData.activeAvatarFrame || '';
    const isInvisible = isPremium ? (storageData.isInvisible || false) : false;
    const avatar = storageData.avatar || '';
    const telegram = storageData.telegram || '';
    const discord = storageData.discord || '';

    // Инициализируем данные локального игрока
    localPlayer.nickname = nickname;
    localPlayer.badge = badge;
    localPlayer.color = color;

    socket = io(SERVER_URL, { transports: ['websocket'] });

    socket.on('disconnect', () => {
      aesKey = null;
      if (typeof leaveBottleGameClient === 'function') {
        leaveBottleGameClient();
      }
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
                coins: savedCoins,
                avatarFrame
              }), aesKey);
              socket.emit('join_room', joinPayload);
              
              // Запускаем автоматическую добычу коинов кликера
              initClickerGame();

              if (document.body.classList.contains('mode-tab')) {
                startGame();
              }
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
          const avatarFrame = isObj ? u.avatarFrame : null;

          const avatarDiv = document.createElement('div');
          avatarDiv.className = 'user-avatar-mini';
          if (avatarFrame) {
            avatarDiv.classList.add('frame-' + avatarFrame);
          }
          
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

          const avatarFrame = isObj ? u.avatarFrame : null;
          const avatarDiv = document.createElement('div');
          avatarDiv.className = 'user-avatar-mini';
          if (avatarFrame) {
            avatarDiv.classList.add('frame-' + avatarFrame);
          } else {
            avatarDiv.style.border = 'none';
            avatarDiv.style.boxShadow = 'none';
          }
          
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

    socket.on('game_food_list', async (encryptedPayload) => {
      try {
        if (!aesKey) return;
        const decryptedStr = await decryptText(encryptedPayload, aesKey);
        gameFoods = JSON.parse(decryptedStr);
      } catch (err) {
        console.warn('Ошибка расшифровки game_food_list:', err.message || err);
      }
    });

    socket.on('game_food_eaten', async (encryptedPayload) => {
      try {
        if (!aesKey) return;
        const decryptedStr = await decryptText(encryptedPayload, aesKey);
        const { id, newFood } = JSON.parse(decryptedStr);
        gameFoods = gameFoods.filter(f => f.id !== id);
        if (newFood) {
          gameFoods.push(newFood);
        }
      } catch (err) {
        console.warn('Ошибка расшифровки game_food_eaten:', err.message || err);
      }
    });

    socket.on('game_food_spawned', async (encryptedPayload) => {
      try {
        if (!aesKey) return;
        const decryptedStr = await decryptText(encryptedPayload, aesKey);
        const newFoods = JSON.parse(decryptedStr);
        if (Array.isArray(newFoods)) {
          gameFoods.push(...newFoods);
        }
      } catch (err) {
        console.warn('Ошибка расшифровки game_food_spawned:', err.message || err);
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

    socket.on('game_modes_player_counts', async (encryptedPayload) => {
      try {
        if (!aesKey) return;
        const decryptedStr = await decryptText(encryptedPayload, aesKey);
        const counts = JSON.parse(decryptedStr);
        updateGameModesPlayerCountsUi(counts);
      } catch (err) {
        console.warn('Ошибка расшифровки game_modes_player_counts:', err.message || err);
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

    // События игры «Бутылочка»
    socket.on('bottle_state', async (encryptedPayload) => {
      try {
        if (!aesKey) return;
        const decryptedStr = await decryptText(encryptedPayload, aesKey);
        const game = JSON.parse(decryptedStr);
        updateBottleUi(game);
      } catch (err) {
        console.warn('Ошибка расшифровки bottle_state:', err.message || err);
      }
    });

    socket.on('bottle_spin_start', async (encryptedPayload) => {
      try {
        if (!aesKey) return;
        const decryptedStr = await decryptText(encryptedPayload, aesKey);
        const { spinnerId, targetId, angle } = JSON.parse(decryptedStr);

        bottleStatusText.textContent = 'Бутылочка крутится... 🍾';
        bottleSpinBtn.style.display = 'none';

        bottleSprite.style.transition = 'none';
        const currentAngle = parseFloat(bottleSprite.style.transform.replace('rotate(', '').replace('deg)', '')) || 0;
        const angleModulo = currentAngle % 360;
        bottleSprite.style.transform = `rotate(${angleModulo}deg)`;

        bottleSprite.offsetHeight; // force reflow

        bottleSprite.style.transition = 'transform 4s cubic-bezier(0.15, 0.85, 0.35, 1)';
        bottleSprite.style.transform = `rotate(${angle}deg)`;
      } catch (err) {
        console.warn('Ошибка расшифровки bottle_spin_start:', err.message || err);
      }
    });

    socket.on('bottle_kiss_result', async (encryptedPayload) => {
      try {
        if (!aesKey) return;
        const decryptedStr = await decryptText(encryptedPayload, aesKey);
        const { success } = JSON.parse(decryptedStr);

        bottleChoiceOverlay.style.display = 'none';
        if (bottleChoiceTimer) {
          clearInterval(bottleChoiceTimer);
          bottleChoiceTimer = null;
        }

        if (success) {
          showKissSuccessAnimation();
        } else {
          showKissFailAnimation();
        }
      } catch (err) {
        console.warn('Ошибка расшифровки bottle_kiss_result:', err.message || err);
      }
    });

    socket.on('bottle_chat_history', async (encryptedPayload) => {
      try {
        if (!aesKey) return;
        const decryptedStr = await decryptText(encryptedPayload, aesKey);
        const history = JSON.parse(decryptedStr);
        renderBottleMessages(history);
      } catch (err) {
        console.warn('Ошибка расшифровки bottle_chat_history:', err.message || err);
      }
    });

    socket.on('bottle_chat_message', async (encryptedPayload) => {
      try {
        if (!aesKey) return;
        const decryptedStr = await decryptText(encryptedPayload, aesKey);
        const messageData = JSON.parse(decryptedStr);
        appendBottleMessageToUi(messageData);
      } catch (err) {
        console.warn('Ошибка расшифровки bottle_chat_message:', err.message || err);
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
    'avatar', 'telegram', 'discord', 'phone', 'bio', 'birthday', 'theme', 'messagesSentCount', 'activeBadge'
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

    updateBadgeDrawerSelection(result.activeBadge || '');
    
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
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('tab') === 'true') {
    const paramRoom = urlParams.get('room');
    if (paramRoom) {
      currentUrl = paramRoom;
    } else {
      currentUrl = 'https://global-room'; // fallback
    }
  } else {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      currentUrl = tab.url;
    } else {
      currentUrl = '';
    }
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
    desc.textContent = 'Змейка: Каждый сам за себя. Растите, поедая цветной корм. Не врезайтесь головой в тела других змеек!';
  } else if (mode === 'team') {
    desc.textContent = 'TDM: Командный режим. Союзные змейки не убивают друг друга при столкновении. Вражеские змейки смертельно опасны.';
  } else if (mode === 'infection') {
    desc.textContent = 'Инфекция: Зомби-змейки (зеленые) заражают касанием выживших (белых), обращая их в зомби.';
  }
}

function updateGameModesPlayerCountsUi(counts) {
  const ffaBtn = document.querySelector('.game-mode-btn[data-mode="ffa"]');
  const teamBtn = document.querySelector('.game-mode-btn[data-mode="team"]');
  const infBtn = document.querySelector('.game-mode-btn[data-mode="infection"]');
  
  if (ffaBtn) ffaBtn.textContent = `FFA [${counts.ffa || 0}]`;
  if (teamBtn) teamBtn.textContent = `TDM [${counts.team || 0}]`;
  if (infBtn) infBtn.textContent = `Инфекция [${counts.infection || 0}]`;
}

gameJoinBtn.addEventListener('click', startGame);
gameQuitBtn.addEventListener('click', stopGame);

gameCanvas.addEventListener('mousedown', (e) => {
  if (e.button === 0) { // Left click
    isBoosting = true;
  }
});

gameCanvas.addEventListener('mouseup', (e) => {
  if (e.button === 0) {
    isBoosting = false;
  }
});

gameCanvas.addEventListener('touchstart', (e) => {
  isBoosting = true;
});

gameCanvas.addEventListener('touchend', (e) => {
  isBoosting = false;
});

document.addEventListener('mousemove', (e) => {
  if (!isGameActive) return;
  const rect = gameCanvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});

document.addEventListener('touchmove', (e) => {
  if (!isGameActive || e.touches.length === 0) return;
  const rect = gameCanvas.getBoundingClientRect();
  mouseX = e.touches[0].clientX - rect.left;
  mouseY = e.touches[0].clientY - rect.top;
}, { passive: true });

function startGame() {
  document.body.classList.add('game-fullscreen');
  isGameActive = true;
  gameStartOverlay.style.display = 'none';
  gameQuitBtn.style.display = 'block';
  
  localPlayer.hp = 100;
  localPlayer.x = Math.random() * (MAP_SIZE - 200) + 100;
  localPlayer.y = Math.random() * (MAP_SIZE - 200) + 100;
  localPlayer.score = 20;
  localPlayer.deaths = 0;
  localPlayer.length = 20;
  localPlayer.body = [];
  localPlayer.history = [];
  activePowerups.speed = 0;
  activePowerups.magnet = 0;
  activePowerups.double = 0;
  lastLoopTime = 0;
  isBoosting = false;
  
  resizeCanvas();
  
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
  document.body.classList.remove('game-fullscreen');
  isGameActive = false;
  gameStartOverlay.style.display = 'flex';
  gameQuitBtn.style.display = 'none';
  isBoosting = false;
  
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
  
  resizeCanvas();
  
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
  if (e.code === 'Space') {
    isBoosting = true;
    e.preventDefault();
  }
  if (e.code === 'Escape') {
    stopGame();
  }
}

function handleKeyUp(e) {
  keysPressed[e.code] = false;
  if (e.code === 'Space') {
    isBoosting = false;
    e.preventDefault();
  }
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
      x: Math.random() * (MAP_SIZE - 200) + 100,
      y: Math.random() * (MAP_SIZE - 200) + 100,
      hp: 100,
      angle: Math.random() * Math.PI * 2,
      team: botTeam,
      infected: botInfected,
      isBot: true,
      length: 5,
      body: [],
      history: [],
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
    
    if (!bot.length) bot.length = 5;
    if (!bot.body) bot.body = [];
    if (!bot.history) bot.history = [];
    if (bot.wanderTimer === undefined) bot.wanderTimer = 0;
    
    bot.wanderTimer -= 0.016;
    
    // Find nearest food
    let nearestFood = null;
    let minDist = Infinity;
    gameFoods.forEach(food => {
      const dx = food.x - bot.x;
      const dy = food.y - bot.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        nearestFood = food;
      }
    });
    
    let targetAngle = bot.angle || 0;
    if (nearestFood && minDist < 300) {
      targetAngle = Math.atan2(nearestFood.y - bot.y, nearestFood.x - bot.x);
    } else {
      if (bot.wanderTimer <= 0) {
        bot.wanderAngle = (Math.random() - 0.5) * 2;
        bot.wanderTimer = 1 + Math.random() * 2;
      }
      targetAngle = (bot.angle || 0) + (bot.wanderAngle || 0) * 0.05;
    }
    
    // Turn smoothly
    let diff = targetAngle - (bot.angle || 0);
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    const turnLimit = 0.08;
    if (Math.abs(diff) > turnLimit) {
      bot.angle = (bot.angle || 0) + Math.sign(diff) * turnLimit;
    } else {
      bot.angle = targetAngle;
    }
    
    // Move bot
    const speed = 2.0;
    bot.x += Math.cos(bot.angle) * speed;
    bot.y += Math.sin(bot.angle) * speed;
    bot.x = Math.max(10, Math.min(MAP_SIZE - 10, bot.x));
    bot.y = Math.max(10, Math.min(MAP_SIZE - 10, bot.y));
    
    // Update body segments history
    bot.history.unshift({ x: bot.x, y: bot.y });
    const maxHistoryNeeded = bot.length * 8;
    if (bot.history.length > maxHistoryNeeded) {
      bot.history.length = maxHistoryNeeded;
    }
    
    bot.body = [];
    const spacing = 7;
    for (let i = 0; i < bot.length; i++) {
      const idx = i * spacing;
      if (idx < bot.history.length) {
        bot.body.push(bot.history[idx]);
      } else if (bot.history.length > 0) {
        bot.body.push(bot.history[bot.history.length - 1]);
      } else {
        bot.body.push({ x: bot.x, y: bot.y });
      }
    }
  });
}

function updatePowerups(dt) {
  if (activePowerups.speed > 0) activePowerups.speed = Math.max(0, activePowerups.speed - dt);
  if (activePowerups.magnet > 0) activePowerups.magnet = Math.max(0, activePowerups.magnet - dt);
  if (activePowerups.double > 0) activePowerups.double = Math.max(0, activePowerups.double - dt);
}

function infectTarget(target, zombieId) {
  if (currentGameMode !== 'infection') return;
  
  if (target === localPlayer && !localPlayer.infected) {
    localPlayer.infected = true;
    localPlayer.hp = 100;
    alert('Вы заражены зомби! Теперь вы зомби!');
  } else if (target.isBot && !target.infected) {
    target.infected = true;
    target.hp = 100;
  }
}

function updateLocalPlayer() {
  if (localPlayer.hp <= 0) return;

  // Follow mouse pointer
  // Calculate target angle based on screen center (where player's head is always drawn)
  const targetAngle = Math.atan2(mouseY - gameCanvas.height / 2, mouseX - gameCanvas.width / 2);
  
  // Smoothly interpolate angle
  let diff = targetAngle - localPlayer.angle;
  while (diff < -Math.PI) diff += Math.PI * 2;
  while (diff > Math.PI) diff -= Math.PI * 2;
  
  const turnLimit = 0.08;
  if (Math.abs(diff) > turnLimit) {
    localPlayer.angle += Math.sign(diff) * turnLimit;
  } else {
    localPlayer.angle = targetAngle;
  }
  
  // Boost logic
  const canBoost = isBoosting && localPlayer.length > 5;
  let baseSpeed = 2.5;
  let boostSpeed = 4.5;
  if (activePowerups.speed > 0) {
    baseSpeed *= 1.5;
    boostSpeed *= 1.5;
  }
  const speed = canBoost ? boostSpeed : baseSpeed;
  
  localPlayer.x += Math.cos(localPlayer.angle) * speed;
  localPlayer.y += Math.sin(localPlayer.angle) * speed;
  
  localPlayer.x = Math.max(10, Math.min(MAP_SIZE - 10, localPlayer.x));
  localPlayer.y = Math.max(10, Math.min(MAP_SIZE - 10, localPlayer.y));
  
  // Boost decay
  if (canBoost) {
    if (!localPlayer.boostCounter) localPlayer.boostCounter = 0;
    localPlayer.boostCounter++;
    if (localPlayer.boostCounter >= 15) {
      localPlayer.boostCounter = 0;
      localPlayer.length = Math.max(5, localPlayer.length - 1);
      
      // Spawn food behind tail using the existing server event
      const tail = localPlayer.body[localPlayer.body.length - 1];
      if (tail && socket && aesKey) {
        encryptText(JSON.stringify({ body: [tail, tail] }), aesKey).then(payload => {
          socket.emit('game_snake_died', payload);
        });
      }
    }
  }
  
  // Body and history tracking
  localPlayer.history.unshift({ x: localPlayer.x, y: localPlayer.y });
  const maxHistoryNeeded = localPlayer.length * 8;
  if (localPlayer.history.length > maxHistoryNeeded) {
    localPlayer.history.length = maxHistoryNeeded;
  }
  
  localPlayer.body = [];
  let spacing = canBoost ? 4 : 7;
  if (activePowerups.speed > 0) {
    spacing = canBoost ? 3 : 5;
  }
  for (let i = 0; i < localPlayer.length; i++) {
    const idx = i * spacing;
    if (idx < localPlayer.history.length) {
      localPlayer.body.push(localPlayer.history[idx]);
    } else if (localPlayer.history.length > 0) {
      localPlayer.body.push(localPlayer.history[localPlayer.history.length - 1]);
    } else {
      localPlayer.body.push({ x: localPlayer.x, y: localPlayer.y });
    }
  }
}

function checkFoodCollisions() {
  if (localPlayer.hp <= 0) return;
  
  // Magnet power-up pulls food closer
  if (activePowerups.magnet > 0) {
    gameFoods.forEach(food => {
      const dx = localPlayer.x - food.x;
      const dy = localPlayer.y - food.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150 && dist > 5) {
        const force = (150 - dist) / 10 + 2;
        food.x += (dx / dist) * force;
        food.y += (dy / dist) * force;
      }
    });
  }
  
  // 1. Local player vs food
  for (let i = gameFoods.length - 1; i >= 0; i--) {
    const food = gameFoods[i];
    const dx = food.x - localPlayer.x;
    const dy = food.y - localPlayer.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 10 + (food.size || 4)) {
      // Eat food!
      if (food.isToken) {
        if (food.tokenType === 'speed') {
          activePowerups.speed = 15000;
        } else if (food.tokenType === 'magnet') {
          activePowerups.magnet = 20000;
        } else if (food.tokenType === 'double') {
          activePowerups.double = 20000;
        }
      } else {
        const multiplier = activePowerups.double > 0 ? 2 : 1;
        const points = Math.max(1, Math.floor((food.size || 4) / 2)) * multiplier;
        localPlayer.length += points;
        localPlayer.score += Math.round(food.size || 4) * multiplier;
      }
      
      // Emit to server
      if (socket && aesKey) {
        encryptText(JSON.stringify({ id: food.id }), aesKey).then(payload => {
          socket.emit('game_eat_food', payload);
        });
      }
      
      // Remove locally immediately to prevent double-eating
      gameFoods.splice(i, 1);
    }
  }

  // 2. Bots vs food
  gameBots.forEach(bot => {
    if (bot.hp <= 0) return;
    for (let i = gameFoods.length - 1; i >= 0; i--) {
      const food = gameFoods[i];
      const dx = food.x - bot.x;
      const dy = food.y - bot.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 10 + (food.size || 4)) {
        bot.length = (bot.length || 5) + 1;
        bot.score = (bot.score || 0) + 1;
        
        // Emit on behalf of the bot to sync food removal
        if (socket && aesKey) {
          encryptText(JSON.stringify({ id: food.id }), aesKey).then(payload => {
            socket.emit('game_eat_food', payload);
          });
        }
        gameFoods.splice(i, 1);
      }
    }
  });
}

function checkSnakeCollisions() {
  if (localPlayer.hp <= 0) return;

  const head = localPlayer.body[0] || localPlayer;
  
  // 1. Local Player head colliding with other players or bots
  let died = false;
  
  // Check against other players
  gamePlayers.forEach((player, playerId) => {
    if (died) return;
    if (currentGameMode === 'team' && player.team === localPlayer.team) return; // ignore friendly body
    
    const body = player.body || [];
    for (let i = 0; i < body.length; i++) {
      const segment = body[i];
      const dx = head.x - segment.x;
      const dy = head.y - segment.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 14) {
        died = true;
      }
    }
  });

  // Check against bots
  gameBots.forEach(bot => {
    if (died || bot.hp <= 0) return;
    if (currentGameMode === 'team' && bot.team === localPlayer.team) return; // ignore friendly body
    
    const body = bot.body || [];
    for (let i = 0; i < body.length; i++) {
      const segment = body[i];
      const dx = head.x - segment.x;
      const dy = head.y - segment.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 14) {
        died = true;
      }
    }
  });

  if (died) {
    localPlayer.hp = 0;
    localPlayer.deaths++;
    
    // Emit game_snake_died to spawn food
    if (socket && aesKey) {
      encryptText(JSON.stringify({ body: localPlayer.body }), aesKey).then(payload => {
        socket.emit('game_snake_died', payload);
      });
    }

    setTimeout(() => {
      // Respawn
      localPlayer.hp = 100;
      localPlayer.x = Math.random() * (MAP_SIZE - 200) + 100;
      localPlayer.y = Math.random() * (MAP_SIZE - 200) + 100;
      localPlayer.length = 20;
      localPlayer.score = 20;
      localPlayer.body = [];
      localPlayer.history = [];
      activePowerups.speed = 0;
      activePowerups.magnet = 0;
      activePowerups.double = 0;
      lastLoopTime = 0;
    }, 2000);
    return; // Don't proceed to infection checks if died
  }

  // 2. Bots colliding with other snakes
  gameBots.forEach((bot, botIdx) => {
    if (bot.hp <= 0) return;
    const botHead = bot.body ? bot.body[0] : bot;
    if (!botHead) return;

    let botDied = false;

    // Check vs local player body
    if (currentGameMode !== 'team' || localPlayer.team !== bot.team) {
      const localBody = localPlayer.body || [];
      for (let i = 0; i < localBody.length; i++) {
        const segment = localBody[i];
        const dx = botHead.x - segment.x;
        const dy = botHead.y - segment.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 14) {
          botDied = true;
          break;
        }
      }
    }

    // Check vs other bots
    if (!botDied) {
      gameBots.forEach((otherBot, otherIdx) => {
        if (botDied || otherIdx === botIdx || otherBot.hp <= 0) return;
        if (currentGameMode === 'team' && otherBot.team === bot.team) return; // ignore friendly body
        
        const otherBody = otherBot.body || [];
        for (let i = 0; i < otherBody.length; i++) {
          const segment = otherBody[i];
          const dx = botHead.x - segment.x;
          const dy = botHead.y - segment.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 14) {
            botDied = true;
            break;
          }
        }
      });
    }

    // Check vs other players
    if (!botDied) {
      gamePlayers.forEach((player) => {
        if (botDied) return;
        if (currentGameMode === 'team' && player.team === bot.team) return; // ignore friendly body
        
        const otherBody = player.body || [];
        for (let i = 0; i < otherBody.length; i++) {
          const segment = otherBody[i];
          const dx = botHead.x - segment.x;
          const dy = botHead.y - segment.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 14) {
            botDied = true;
            break;
          }
        }
      });
    }

    if (botDied) {
      bot.hp = 0;
      // Emit game_snake_died to spawn food
      if (socket && aesKey) {
        encryptText(JSON.stringify({ body: bot.body }), aesKey).then(payload => {
          socket.emit('game_snake_died', payload);
        });
      }
      
      // Respawn bot
      setTimeout(() => {
        bot.hp = 100;
        bot.x = Math.random() * (MAP_SIZE - 200) + 100;
        bot.y = Math.random() * (MAP_SIZE - 200) + 100;
        bot.length = 5;
        bot.body = [];
        bot.history = [];
      }, 2000);
    }
  });

  // 3. Infection Mode Rules
  if (currentGameMode === 'infection') {
    if (localPlayer.infected) {
      // Zombie local player infects human players
      gamePlayers.forEach((p, id) => {
        if (!p.infected && p.hp > 0) {
          const body = p.body || [{ x: p.x, y: p.y }];
          for (let i = 0; i < body.length; i++) {
            const dx = localPlayer.x - body[i].x;
            const dy = localPlayer.y - body[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 18) {
              p.infected = true;
            }
          }
        }
      });
      // Zombie local player infects human bots
      gameBots.forEach(bot => {
        if (!bot.infected && bot.hp > 0) {
          const body = bot.body || [{ x: bot.x, y: bot.y }];
          for (let i = 0; i < body.length; i++) {
            const dx = localPlayer.x - body[i].x;
            const dy = localPlayer.y - body[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 18) {
              bot.infected = true;
            }
          }
        }
      });
    } else {
      // Human local player gets infected if touching a zombie
      let gotInfected = false;
      gamePlayers.forEach((p) => {
        if (p.infected && p.hp > 0) {
          const body = p.body || [{ x: p.x, y: p.y }];
          for (let i = 0; i < body.length; i++) {
            const dx = localPlayer.x - body[i].x;
            const dy = localPlayer.y - body[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 18) gotInfected = true;
          }
        }
      });
      gameBots.forEach(bot => {
        if (bot.infected && bot.hp > 0) {
          const body = bot.body || [{ x: bot.x, y: bot.y }];
          for (let i = 0; i < body.length; i++) {
            const dx = localPlayer.x - body[i].x;
            const dy = localPlayer.y - body[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 18) gotInfected = true;
          }
        }
      });
      
      if (gotInfected) {
        localPlayer.infected = true;
        localPlayer.hp = 100;
        alert('Вы заражены! Теперь вы зомби!');
      }
    }

    // Bots infect humans
    gameBots.forEach(bot => {
      if (bot.hp > 0 && bot.infected) {
        // Zombie bot infects human player
        if (!localPlayer.infected && localPlayer.hp > 0) {
          const body = localPlayer.body || [{ x: localPlayer.x, y: localPlayer.y }];
          for (let i = 0; i < body.length; i++) {
            const dx = bot.x - body[i].x;
            const dy = bot.y - body[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 18) {
              localPlayer.infected = true;
              localPlayer.hp = 100;
              alert('Вы заражены зомби-ботом! Теперь вы зомби!');
            }
          }
        }
        // Zombie bot infects other human bots
        gameBots.forEach(otherBot => {
          if (otherBot.hp > 0 && !otherBot.infected) {
            const body = otherBot.body || [{ x: otherBot.x, y: otherBot.y }];
            for (let i = 0; i < body.length; i++) {
              const dx = bot.x - body[i].x;
              const dy = bot.y - body[i].y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 18) {
                otherBot.infected = true;
              }
            }
          }
        });
      }
    });
  }
}

function drawGame() {
  gameCtx.fillStyle = '#0b0914';
  gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
  
  gameCtx.save();
  // Center camera on local player head position
  gameCtx.translate(gameCanvas.width / 2 - localPlayer.x, gameCanvas.height / 2 - localPlayer.y);
  
  // Draw grid lines
  gameCtx.strokeStyle = 'rgba(128, 90, 213, 0.15)';
  gameCtx.lineWidth = 1;
  const gridSize = 100;
  for (let x = 0; x <= MAP_SIZE; x += gridSize) {
    gameCtx.beginPath();
    gameCtx.moveTo(x, 0);
    gameCtx.lineTo(x, MAP_SIZE);
    gameCtx.stroke();
  }
  for (let y = 0; y <= MAP_SIZE; y += gridSize) {
    gameCtx.beginPath();
    gameCtx.moveTo(0, y);
    gameCtx.lineTo(MAP_SIZE, y);
    gameCtx.stroke();
  }
  
  // Draw boundary borders
  gameCtx.strokeStyle = '#805ad5';
  gameCtx.lineWidth = 5;
  gameCtx.strokeRect(0, 0, MAP_SIZE, MAP_SIZE);
  
  // Draw food particles
  gameFoods.forEach(food => {
    // only draw if inside viewport bounds (plus small margin)
    if (food.x < localPlayer.x - gameCanvas.width / 2 - 20 ||
        food.x > localPlayer.x + gameCanvas.width / 2 + 20 ||
        food.y < localPlayer.y - gameCanvas.height / 2 - 20 ||
        food.y > localPlayer.y + gameCanvas.height / 2 + 20) {
      return;
    }
    
    if (food.isToken) {
      const radius = 10;
      
      // Draw outer glowing pulsing rings
      const pulse = 1 + Math.abs(Math.sin(Date.now() / 200)) * 0.3;
      gameCtx.beginPath();
      gameCtx.arc(food.x, food.y, radius * pulse, 0, Math.PI * 2);
      gameCtx.strokeStyle = food.color || '#ffff00';
      gameCtx.lineWidth = 1.5;
      gameCtx.shadowColor = food.color || '#ffff00';
      gameCtx.shadowBlur = 8;
      gameCtx.stroke();
      gameCtx.shadowBlur = 0;
      
      // Draw token base circle
      gameCtx.beginPath();
      gameCtx.arc(food.x, food.y, radius, 0, Math.PI * 2);
      gameCtx.fillStyle = 'rgba(11, 9, 20, 0.9)';
      gameCtx.strokeStyle = food.color || '#ffff00';
      gameCtx.lineWidth = 1.5;
      gameCtx.fill();
      gameCtx.stroke();
      
      // Draw emoji inside
      let emoji = '⚡';
      if (food.tokenType === 'magnet') emoji = '🧲';
      else if (food.tokenType === 'double') emoji = '⭐';
      
      gameCtx.font = '10px sans-serif';
      gameCtx.textAlign = 'center';
      gameCtx.textBaseline = 'middle';
      gameCtx.fillText(emoji, food.x, food.y + 0.5);
    } else {
      gameCtx.beginPath();
      gameCtx.arc(food.x, food.y, food.size || 4, 0, Math.PI * 2);
      gameCtx.fillStyle = food.color || '#ff00ff';
      gameCtx.shadowColor = food.color || '#ff00ff';
      gameCtx.shadowBlur = 6;
      gameCtx.fill();
      gameCtx.shadowBlur = 0;
    }
  });
  
  // Draw Bots
  gameBots.forEach(bot => {
    if (bot.hp > 0) drawSnake(bot, false);
  });
  
  // Draw Other players
  gamePlayers.forEach(p => {
    if (p.hp > 0) drawSnake(p, false);
  });
  
  // Draw Local Player
  if (localPlayer.hp > 0) {
    drawSnake({
      ...localPlayer,
      id: socket ? socket.id : 'self'
    }, true);
  }
  
  gameCtx.restore();
  
  // Screen space overlays
  if (localPlayer.hp <= 0) {
    gameCtx.fillStyle = 'rgba(220, 53, 69, 0.8)';
    gameCtx.font = 'bold 16px sans-serif';
    gameCtx.textAlign = 'center';
    gameCtx.fillText('ВЫ ПОГИБЛИ', gameCanvas.width / 2, gameCanvas.height / 2 - 10);
    gameCtx.font = '11px sans-serif';
    gameCtx.fillText('Возрождение через 2 сек...', gameCanvas.width / 2, gameCanvas.height / 2 + 10);
  }
  
  // Draw Mini-map (80x80 pixels in bottom-right corner)
  const mapSize = 80;
  const mapX = gameCanvas.width - mapSize - 10;
  const mapY = gameCanvas.height - mapSize - 10;
  
  gameCtx.fillStyle = 'rgba(11, 9, 20, 0.7)';
  gameCtx.strokeStyle = 'rgba(128, 90, 213, 0.5)';
  gameCtx.lineWidth = 1.5;
  gameCtx.fillRect(mapX, mapY, mapSize, mapSize);
  gameCtx.strokeRect(mapX, mapY, mapSize, mapSize);
  
  // Draw local player dot
  if (localPlayer.hp > 0) {
    const dotX = mapX + (localPlayer.x / MAP_SIZE) * mapSize;
    const dotY = mapY + (localPlayer.y / MAP_SIZE) * mapSize;
    gameCtx.beginPath();
    gameCtx.arc(dotX, dotY, 2.5, 0, Math.PI * 2);
    gameCtx.fillStyle = '#00d2ff';
    gameCtx.fill();
  }
  
  // Draw bot dots
  gameBots.forEach(bot => {
    if (bot.hp > 0) {
      const dotX = mapX + (bot.x / MAP_SIZE) * mapSize;
      const dotY = mapY + (bot.y / MAP_SIZE) * mapSize;
      gameCtx.beginPath();
      gameCtx.arc(dotX, dotY, 1.5, 0, Math.PI * 2);
      gameCtx.fillStyle = '#ff9f1c';
      gameCtx.fill();
    }
  });
  
  // Draw other player dots
  gamePlayers.forEach(p => {
    if (p.hp > 0) {
      const dotX = mapX + (p.x / MAP_SIZE) * mapSize;
      const dotY = mapY + (p.y / MAP_SIZE) * mapSize;
      gameCtx.beginPath();
      gameCtx.arc(dotX, dotY, 1.5, 0, Math.PI * 2);
      gameCtx.fillStyle = p.color || '#ff9f1c';
      gameCtx.fill();
    }
  });

  // Draw Leaderboard
  drawLeaderboard();
  
  // Draw Power-ups HUD
  drawPowerupsHUD();
}

function drawSnake(snake, isSelf = false) {
  let color = 'cyan';
  if (currentGameMode === 'team') {
    color = snake.team === 'red' ? '#ff3333' : '#3333ff';
  } else if (currentGameMode === 'infection') {
    color = snake.infected ? '#00ff66' : '#ffffff';
  } else {
    color = snake.color || (isSelf ? '#00d2ff' : '#ff9f1c');
  }
  
  const body = snake.body || [{ x: snake.x, y: snake.y }];
  if (body.length === 0) return;

  // Draw body segments (from tail to head-1)
  for (let i = body.length - 1; i >= 1; i--) {
    const seg = body[i];
    if (!seg) continue;
    
    // Draw body segment
    gameCtx.beginPath();
    gameCtx.arc(seg.x, seg.y, 8, 0, Math.PI * 2);
    gameCtx.fillStyle = color;
    gameCtx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    gameCtx.lineWidth = 1.5;
    gameCtx.fill();
    gameCtx.stroke();
  }

  // Draw Head (segment 0)
  const head = body[0];
  if (head) {
    gameCtx.beginPath();
    gameCtx.arc(head.x, head.y, 10, 0, Math.PI * 2);
    gameCtx.fillStyle = color;
    gameCtx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    gameCtx.lineWidth = 2;
    gameCtx.fill();
    gameCtx.stroke();

    // Draw Eyes pointing in movement direction
    const angle = snake.angle || 0;
    const eyeOffsetAngle = 0.5;
    const eyeDist = 6;
    const pupilDist = 7;
    
    // Left Eye
    const lex = head.x + Math.cos(angle - eyeOffsetAngle) * eyeDist;
    const ley = head.y + Math.sin(angle - eyeOffsetAngle) * eyeDist;
    // Right Eye
    const rex = head.x + Math.cos(angle + eyeOffsetAngle) * eyeDist;
    const rey = head.y + Math.sin(angle + eyeOffsetAngle) * eyeDist;

    gameCtx.beginPath();
    gameCtx.arc(lex, ley, 3.5, 0, Math.PI * 2);
    gameCtx.arc(rex, rey, 3.5, 0, Math.PI * 2);
    gameCtx.fillStyle = 'white';
    gameCtx.fill();

    const lpx = head.x + Math.cos(angle - eyeOffsetAngle * 0.7) * pupilDist;
    const lpy = head.y + Math.sin(angle - eyeOffsetAngle * 0.7) * pupilDist;
    const rpx = head.x + Math.cos(angle + eyeOffsetAngle * 0.7) * pupilDist;
    const rpy = head.y + Math.sin(angle + eyeOffsetAngle * 0.7) * pupilDist;

    gameCtx.beginPath();
    gameCtx.arc(lpx, lpy, 1.5, 0, Math.PI * 2);
    gameCtx.arc(rpx, rpy, 1.5, 0, Math.PI * 2);
    gameCtx.fillStyle = 'black';
    gameCtx.fill();
    
    // Nickname above head
    gameCtx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    gameCtx.font = 'bold 9px sans-serif';
    gameCtx.textAlign = 'center';
    
    const badgeStr = snake.badge ? snake.badge + ' ' : '';
    const scoreVal = snake.score || 0;
    const nameLabel = `${badgeStr}${snake.nickname} [${scoreVal}]`;
    gameCtx.fillText(nameLabel, head.x, head.y - 15);
  }
}

function drawLeaderboard() {
  const list = [];
  if (localPlayer.hp > 0) {
    list.push({ nickname: localPlayer.nickname || 'Вы', score: localPlayer.score || 0, isSelf: true });
  }
  gameBots.forEach(bot => {
    if (bot.hp > 0) {
      list.push({ nickname: bot.nickname, score: bot.score || 0 });
    }
  });
  gamePlayers.forEach(p => {
    if (p.hp > 0) {
      list.push({ nickname: p.nickname || 'Игрок', score: p.score || 0 });
    }
  });

  list.sort((a, b) => b.score - a.score);

  const maxItems = Math.min(5, list.length);
  const startX = gameCanvas.width - 150;
  const startY = 20;

  gameCtx.fillStyle = 'rgba(11, 9, 20, 0.6)';
  gameCtx.fillRect(startX - 10, startY - 15, 150, maxItems * 15 + 20);
  gameCtx.strokeStyle = 'rgba(128, 90, 213, 0.3)';
  gameCtx.strokeRect(startX - 10, startY - 15, 150, maxItems * 15 + 20);

  gameCtx.fillStyle = 'white';
  gameCtx.font = 'bold 10px sans-serif';
  gameCtx.textAlign = 'left';
  gameCtx.fillText('РЕЙТИНГ', startX, startY);

  gameCtx.font = '9px sans-serif';
  for (let i = 0; i < maxItems; i++) {
    const item = list[i];
    const text = `${i + 1}. ${item.nickname}`;
    gameCtx.fillStyle = item.isSelf ? '#00d2ff' : 'rgba(255, 255, 255, 0.8)';
    gameCtx.fillText(text, startX, startY + 15 + i * 15);
    gameCtx.textAlign = 'right';
    gameCtx.fillText(item.score.toString(), startX + 130, startY + 15 + i * 15);
    gameCtx.textAlign = 'left';
  }
}

function drawPowerupsHUD() {
  const activeList = [];
  if (activePowerups.speed > 0) {
    activeList.push({
      type: 'speed',
      name: '⚡ Ускорение +50%',
      color: '#ffff00',
      duration: activePowerups.speed,
      maxDuration: 15000
    });
  }
  if (activePowerups.magnet > 0) {
    activeList.push({
      type: 'magnet',
      name: '🧲 Магнит еды',
      color: '#ff3366',
      duration: activePowerups.magnet,
      maxDuration: 20000
    });
  }
  if (activePowerups.double > 0) {
    activeList.push({
      type: 'double',
      name: '⭐ Удвоение очков',
      color: '#00ffff',
      duration: activePowerups.double,
      maxDuration: 20000
    });
  }

  if (activeList.length === 0) return;

  const startX = 20;
  let startY = 20;
  const cardWidth = 120;
  const cardHeight = 30;
  const gap = 6;

  activeList.forEach((powerup) => {
    // Draw background card (semi-transparent glassmorphism)
    gameCtx.fillStyle = 'rgba(11, 9, 20, 0.75)';
    gameCtx.fillRect(startX, startY, cardWidth, cardHeight);
    
    // Draw border
    gameCtx.strokeStyle = 'rgba(128, 90, 213, 0.3)';
    gameCtx.lineWidth = 1;
    gameCtx.strokeRect(startX, startY, cardWidth, cardHeight);
    
    // Draw active indicator line on the left side of the card
    gameCtx.fillStyle = powerup.color;
    gameCtx.fillRect(startX, startY, 3, cardHeight);

    // Draw text: powerup name
    gameCtx.fillStyle = '#ffffff';
    gameCtx.font = 'bold 8px sans-serif';
    gameCtx.textAlign = 'left';
    gameCtx.textBaseline = 'top';
    gameCtx.fillText(powerup.name, startX + 8, startY + 5);

    // Draw text: remaining duration
    const secondsLeft = (powerup.duration / 1000).toFixed(1) + 's';
    gameCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    gameCtx.font = '7px sans-serif';
    gameCtx.textAlign = 'right';
    gameCtx.fillText(secondsLeft, startX + cardWidth - 8, startY + 5);

    // Draw progress bar background
    const barX = startX + 8;
    const barY = startY + 18;
    const barWidth = cardWidth - 16;
    const barHeight = 3;
    gameCtx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    gameCtx.fillRect(barX, barY, barWidth, barHeight);

    // Draw progress bar fill (using active duration ratio)
    const progressRatio = Math.max(0, Math.min(1, powerup.duration / powerup.maxDuration));
    const fillWidth = barWidth * progressRatio;
    gameCtx.fillStyle = powerup.color;
    gameCtx.fillRect(barX, barY, fillWidth, barHeight);

    startY += cardHeight + gap;
  });
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
        color: localPlayer.color,
        length: localPlayer.length,
        body: localPlayer.body,
        mode: currentGameMode
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
        nickname: localPlayer.nickname,
        x: localPlayer.x,
        y: localPlayer.y,
        angle: localPlayer.angle,
        hp: localPlayer.hp,
        team: localPlayer.team,
        infected: localPlayer.infected,
        score: localPlayer.score,
        badge: localPlayer.badge,
        color: localPlayer.color,
        length: localPlayer.length,
        body: localPlayer.body
      }), aesKey);
      socket.emit('game_update', payload);
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

function updatePowerups(dt) {
  if (activePowerups.speed > 0) {
    activePowerups.speed = Math.max(0, activePowerups.speed - dt);
  }
  if (activePowerups.magnet > 0) {
    activePowerups.magnet = Math.max(0, activePowerups.magnet - dt);
  }
  if (activePowerups.double > 0) {
    activePowerups.double = Math.max(0, activePowerups.double - dt);
  }
}

function gameLoop(timestamp) {
  if (!isGameActive) return;
  
  if (!lastLoopTime) lastLoopTime = timestamp;
  const dt = timestamp - lastLoopTime;
  lastLoopTime = timestamp;

  updatePowerups(dt);
  
  manageBots();
  updateLocalPlayer();
  updateBots();
  checkFoodCollisions();
  checkSnakeCollisions();
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

function selectSubTab(activeTab, activePanel) {
  const subTabs = [gameTabPvp, gameTabClicker, gameTabRelax, gameTabBottle, gameTabShop];
  const panels = [gamesPanelPvp, gamesPanelClicker, gamesPanelRelax, gamesPanelBottle, gamesPanelShop];
  
  subTabs.forEach(tab => {
    if (tab) {
      if (tab === activeTab) {
        tab.classList.add('active');
        tab.style.background = 'var(--tab-active-bg)';
        tab.style.color = 'var(--tab-active-text)';
      } else {
        tab.classList.remove('active');
        tab.style.background = 'transparent';
        tab.style.color = 'var(--text-color)';
      }
    }
  });

  panels.forEach(panel => {
    if (panel) {
      panel.style.display = (panel === activePanel) ? 'flex' : 'none';
    }
  });
}

if (gameTabPvp && gameTabClicker && gameTabRelax && gameTabBottle && gameTabShop) {
  gameTabPvp.addEventListener('click', () => {
    stopRelaxVideo();
    leaveBottleGameClient();
    selectSubTab(gameTabPvp, gamesPanelPvp);
    resizeCanvas();
  });
  
  gameTabClicker.addEventListener('click', () => {
    stopRelaxVideo();
    leaveBottleGameClient();
    selectSubTab(gameTabClicker, gamesPanelClicker);
    renderClickerLeaderboard(currentUsersInRoom);
  });

  gameTabRelax.addEventListener('click', () => {
    leaveBottleGameClient();
    selectSubTab(gameTabRelax, gamesPanelRelax);
  });

  gameTabBottle.addEventListener('click', () => {
    stopRelaxVideo();
    stopGame();
    selectSubTab(gameTabBottle, gamesPanelBottle);
    if (currentBottleGameState) {
      updateBottleUi(currentBottleGameState);
    }
  });

  gameTabShop.addEventListener('click', () => {
    stopRelaxVideo();
    leaveBottleGameClient();
    selectSubTab(gameTabShop, gamesPanelShop);
    updateShopUi();
  });
}

const gameFullscreenBtn = document.getElementById('game-fullscreen-btn');
if (gameFullscreenBtn) {
  gameFullscreenBtn.addEventListener('click', () => {
    const targetUrl = chrome.runtime.getURL(`popup.html?tab=true&room=${encodeURIComponent(currentUrl)}`);
    chrome.tabs.create({ url: targetUrl });
  });
}

function resizeCanvas() {
  const isTab = document.body.classList.contains('mode-tab');
  const isFullscreen = document.body.classList.contains('game-fullscreen');
  
  if (isFullscreen) {
    gameCanvas.width = window.innerWidth;
    gameCanvas.height = window.innerHeight;
  } else if (isTab) {
    const rect = gamesScreen.getBoundingClientRect();
    gameCanvas.width = rect.width - 48;
    gameCanvas.height = rect.height - 110;
  } else {
    gameCanvas.width = 370;
    gameCanvas.height = 230;
  }
}

window.addEventListener('resize', resizeCanvas);

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

// --- ИГРА БУТЫЛОЧКА: КЛИЕНТСКАЯ ЛОГИКА ---

let currentBottleGameState = null;

function leaveBottleGameClient() {
  if (socket && aesKey) {
    socket.emit('bottle_leave');
  }
  if (bottleChoiceOverlay) {
    bottleChoiceOverlay.style.display = 'none';
  }
  if (bottleChoiceTimer) {
    clearInterval(bottleChoiceTimer);
    bottleChoiceTimer = null;
  }
}

function startChoiceCountdown(seconds) {
  if (bottleChoiceTimer) clearInterval(bottleChoiceTimer);
  let remaining = seconds;
  if (bottleChoiceTimerVal) bottleChoiceTimerVal.textContent = remaining;

  bottleChoiceTimer = setInterval(() => {
    remaining--;
    if (bottleChoiceTimerVal) bottleChoiceTimerVal.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(bottleChoiceTimer);
      bottleChoiceTimer = null;
      if (bottleChoiceOverlay) bottleChoiceOverlay.style.display = 'none';
      
      // Авто-отказ при истечении времени на клиенте
      if (socket && aesKey) {
        try {
          encryptText(JSON.stringify({ choice: false }), aesKey).then(payload => {
            socket.emit('bottle_choice', payload);
          });
        } catch (e) {
          console.error('Ошибка авто-отправки выбора при таймауте:', e);
        }
      }
    }
  }, 1000);
}

function renderBottlePlayers(players, spinnerId, targetId, turnIndex) {
  if (!bottlePlayersContainer) return;
  bottlePlayersContainer.innerHTML = '';
  if (!players || players.length === 0) return;

  const rect = bottlePlayersContainer.getBoundingClientRect();
  const centerX = rect.width > 0 ? rect.width / 2 : 185;
  const centerY = rect.height > 0 ? rect.height / 2 : 125; // Смещаем центр вертикально для новой высоты 250px
  const radius = 95; // Увеличенный радиус рассадки от центра стола (для 50px аватарок)

  const N = players.length;
  players.forEach((player, i) => {
    const angle = -90 + (360 / N) * i;
    const rad = angle * Math.PI / 180;
    const x = centerX + radius * Math.cos(rad);
    const y = centerY + radius * Math.sin(rad);

    const playerDiv = document.createElement('div');
    playerDiv.style.position = 'absolute';
    playerDiv.style.left = `${x - 25}px`; // Размер аватарки 50px -> смещение на 25px
    playerDiv.style.top = `${y - 25}px`;
    playerDiv.style.width = '50px';
    playerDiv.style.height = '50px';
    playerDiv.style.borderRadius = '50%';
    playerDiv.style.border = '2px solid var(--border-color)';
    playerDiv.style.backgroundColor = 'var(--input-bg)';
    playerDiv.style.display = 'flex';
    playerDiv.style.alignItems = 'center';
    playerDiv.style.justifyContent = 'center';
    playerDiv.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
    playerDiv.style.pointerEvents = 'auto';
    playerDiv.style.transition = 'all 0.3s ease';

    if (player.avatarFrame) {
      playerDiv.classList.add('frame-' + player.avatarFrame);
    }

    if (player.socketId === spinnerId) {
      playerDiv.style.borderColor = '#e91e63';
      playerDiv.style.boxShadow = '0 0 8px #e91e63';
    } else if (player.socketId === targetId) {
      playerDiv.style.borderColor = '#2196f3';
      playerDiv.style.boxShadow = '0 0 8px #2196f3';
    } else if (i === turnIndex) {
      playerDiv.style.borderColor = 'var(--accent-color)';
      playerDiv.style.boxShadow = '0 0 6px var(--accent-color)';
    }

    if (player.avatar) {
      const img = document.createElement('img');
      img.src = player.avatar;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '50%';
      playerDiv.appendChild(img);
    } else {
      const char = player.badge || player.nickname.charAt(0).toUpperCase();
      playerDiv.textContent = char;
      playerDiv.style.fontSize = '14px'; // Увеличенный размер шрифта значка
      playerDiv.style.fontWeight = 'bold';
      if (player.color) {
        playerDiv.style.backgroundColor = player.color;
        playerDiv.style.color = '#fff';
      } else {
        playerDiv.style.color = 'var(--text-color)';
      }
    }

    playerDiv.title = player.nickname + (player.isBot ? ' 🤖' : '') + (player.socketId === socket.id ? ' (Вы)' : '');

    const nameLabel = document.createElement('div');
    const displayNickname = player.nickname.length > 10 ? player.nickname.substring(0, 9) + '..' : player.nickname;
    nameLabel.textContent = (player.badge ? player.badge + ' ' : '') + displayNickname;
    nameLabel.style.position = 'absolute';
    nameLabel.style.bottom = '-16px'; // Смещаем ниже для 50px аватарок
    nameLabel.style.fontSize = '9.5px'; // Увеличенный шрифт никнейма
    nameLabel.style.width = '70px'; // Увеличенная ширина плашки
    nameLabel.style.textAlign = 'center';
    if (player.color) {
      nameLabel.style.color = player.color;
    } else {
      nameLabel.style.color = 'var(--text-color)';
    }
    nameLabel.style.textShadow = '0 1px 2px rgba(0,0,0,0.5)';
    nameLabel.style.fontWeight = 'bold';
    nameLabel.style.left = '50%';
    nameLabel.style.transform = 'translateX(-50%)';
    playerDiv.appendChild(nameLabel);

    bottlePlayersContainer.appendChild(playerDiv);
  });
}

function updateBottleUi(game) {
  currentBottleGameState = game;

  if (!socket) return;

  const me = game.players.find(p => p.socketId === socket.id);
  const isSpinner = game.spinnerId === socket.id;
  const isTarget = game.targetId === socket.id;
  const myTurn = game.players[game.turnIndex] && game.players[game.turnIndex].socketId === socket.id;

  renderBottlePlayers(game.players, game.spinnerId, game.targetId, game.turnIndex);

  if (me) {
    if (bottleJoinBtn) bottleJoinBtn.style.display = 'none';
    if (bottleLeaveBtn) bottleLeaveBtn.style.display = 'block';
  } else {
    if (bottleJoinBtn) bottleJoinBtn.style.display = 'block';
    if (bottleLeaveBtn) bottleLeaveBtn.style.display = 'none';
  }

  const currentSpinnerName = game.players[game.turnIndex] ? game.players[game.turnIndex].nickname : '...';

  if (game.state === 'waiting') {
    if (bottleChoiceOverlay) bottleChoiceOverlay.style.display = 'none';
    if (bottleTurnTimer) bottleTurnTimer.style.display = 'none';

    if (myTurn) {
      if (bottleStatusText) bottleStatusText.textContent = 'Ваш ход! Крутите бутылочку 🍾';
      if (bottleSpinBtn) bottleSpinBtn.style.display = 'block';
      if (bottleSpinAnytimeBtn) bottleSpinAnytimeBtn.style.display = 'none';
    } else {
      if (bottleStatusText) bottleStatusText.textContent = `Ход игрока ${currentSpinnerName}...`;
      if (bottleSpinBtn) bottleSpinBtn.style.display = 'none';
      if (me && bottleSpinAnytimeBtn) {
        bottleSpinAnytimeBtn.style.display = 'block';
      } else if (bottleSpinAnytimeBtn) {
        bottleSpinAnytimeBtn.style.display = 'none';
      }
    }
  } else if (game.state === 'spinning') {
    if (bottleChoiceOverlay) bottleChoiceOverlay.style.display = 'none';
    if (bottleTurnTimer) bottleTurnTimer.style.display = 'none';
    if (bottleSpinBtn) bottleSpinBtn.style.display = 'none';
    if (bottleSpinAnytimeBtn) bottleSpinAnytimeBtn.style.display = 'none';
    if (bottleStatusText) bottleStatusText.textContent = 'Бутылочка крутится... 🍾';
  } else if (game.state === 'kissing') {
    if (bottleSpinBtn) bottleSpinBtn.style.display = 'none';
    if (bottleSpinAnytimeBtn) bottleSpinAnytimeBtn.style.display = 'none';
    
    const spinner = game.players.find(p => p.socketId === game.spinnerId);
    const target = game.players.find(p => p.socketId === game.targetId);
    const spinnerName = spinner ? spinner.nickname : 'Кто-то';
    const targetName = target ? target.nickname : 'Кто-то';

    if (bottleStatusText) bottleStatusText.textContent = `Выбор поцелуя: ${spinnerName} и ${targetName}`;

    const hasMyChoice = game.choices[socket.id] !== undefined;

    if ((isSpinner || isTarget) && !hasMyChoice) {
      if (bottleChoiceOverlay) {
        bottleChoiceOverlay.style.display = 'flex';
        if (bottleChoiceTitle) {
          bottleChoiceTitle.textContent = isSpinner ? `Поцеловать ${targetName}?` : `Поцеловать ${spinnerName}?`;
        }
      }
      startChoiceCountdown(10);
    } else {
      if (bottleChoiceOverlay) bottleChoiceOverlay.style.display = 'none';
    }
  } else if (game.state === 'result') {
    if (bottleChoiceOverlay) bottleChoiceOverlay.style.display = 'none';
    if (bottleTurnTimer) bottleTurnTimer.style.display = 'none';
    if (bottleSpinBtn) bottleSpinBtn.style.display = 'none';
    if (bottleSpinAnytimeBtn) bottleSpinAnytimeBtn.style.display = 'none';
    if (bottleStatusText) bottleStatusText.textContent = 'Раунд завершен!';
  }
}

function showKissSuccessAnimation() {
  if (!bottleTable) return;
  const rect = bottleTable.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;

  for (let i = 0; i < 20; i++) {
    setTimeout(() => {
      const heart = document.createElement('div');
      heart.textContent = ['💖', '❤️', '💕', '💋'][Math.floor(Math.random() * 4)];
      heart.style.position = 'fixed';
      heart.style.left = `${originX}px`;
      heart.style.top = `${originY}px`;
      heart.style.fontSize = `${16 + Math.random() * 16}px`;
      heart.style.pointerEvents = 'none';
      heart.style.zIndex = '9999';
      heart.style.transition = 'all 1.5s cubic-bezier(0.25, 1, 0.5, 1)';
      heart.style.transform = 'translate(-50%, -50%) scale(0.5)';
      heart.style.opacity = '1';
      document.body.appendChild(heart);

      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 120;
      const tx = originX + Math.cos(angle) * distance;
      const ty = originY - distance * 0.8;

      setTimeout(() => {
        heart.style.left = `${tx}px`;
        heart.style.top = `${ty}px`;
        heart.style.transform = `translate(-50%, -50%) scale(1.5) rotate(${(Math.random() - 0.5) * 60}deg)`;
        heart.style.opacity = '0';
      }, 50);

      setTimeout(() => heart.remove(), 1600);
    }, i * 60);
  }
}

function showKissFailAnimation() {
  if (!bottleTable) return;
  const rect = bottleTable.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;

  const crack = document.createElement('div');
  crack.textContent = '💔';
  crack.style.position = 'fixed';
  crack.style.left = `${originX}px`;
  crack.style.top = `${originY}px`;
  crack.style.fontSize = '64px';
  crack.style.pointerEvents = 'none';
  crack.style.zIndex = '9999';
  crack.style.transition = 'all 1.2s cubic-bezier(0.36, 0.07, 0.19, 0.97)';
  crack.style.transform = 'translate(-50%, -50%) scale(0.1)';
  crack.style.opacity = '0';
  document.body.appendChild(crack);

  setTimeout(() => {
    crack.style.transform = 'translate(-50%, -50%) scale(1.2)';
    crack.style.opacity = '1';
  }, 50);

  setTimeout(() => {
    crack.style.transition = 'all 0.8s ease-in';
    crack.style.top = `${originY + 120}px`;
    crack.style.opacity = '0';
    crack.style.transform = 'translate(-50%, -50%) scale(0.8) rotate(-20deg)';
  }, 1000);

  setTimeout(() => crack.remove(), 1900);
}

// Слушатели кнопок Бутылочки
if (bottleJoinBtn) {
  bottleJoinBtn.addEventListener('click', () => {
    if (socket) socket.emit('bottle_join');
  });
}

if (bottleLeaveBtn) {
  bottleLeaveBtn.addEventListener('click', () => {
    leaveBottleGameClient();
  });
}

if (bottleSpinBtn) {
  bottleSpinBtn.addEventListener('click', () => {
    if (socket) socket.emit('bottle_spin');
  });
}

if (bottleSpinAnytimeBtn) {
  bottleSpinAnytimeBtn.addEventListener('click', async () => {
    chrome.storage.local.get(['clickerCoins'], async (res) => {
      const coins = res.clickerCoins || 0;
      if (coins < 30) {
        alert('Недостаточно монет кликера! Ход вне очереди стоит 30 🪙.');
        return;
      }
      
      const newCoins = coins - 30;
      chrome.storage.local.set({ clickerCoins: newCoins }, async () => {
        clickerCoins = newCoins;
        updateClickerUi();
        updateShopUi();
        sendClickerStats();

        try {
          const payload = await encryptText(JSON.stringify({ cost: 30 }), aesKey);
          socket.emit('bottle_buy_spin', payload);
        } catch (err) {
          console.error('Ошибка шифрования покупки хода:', err);
        }
      });
    });
  });
}

if (bottleChoiceYesBtn) {
  bottleChoiceYesBtn.addEventListener('click', async () => {
    if (socket && aesKey) {
      if (bottleChoiceOverlay) bottleChoiceOverlay.style.display = 'none';
      if (bottleChoiceTimer) {
        clearInterval(bottleChoiceTimer);
        bottleChoiceTimer = null;
      }
      try {
        const payload = await encryptText(JSON.stringify({ choice: true }), aesKey);
        socket.emit('bottle_choice', payload);
      } catch (e) {
        console.error('Ошибка отправки выбора choice:true', e);
      }
    }
  });
}

if (bottleChoiceNoBtn) {
  bottleChoiceNoBtn.addEventListener('click', async () => {
    if (socket && aesKey) {
      if (bottleChoiceOverlay) bottleChoiceOverlay.style.display = 'none';
      if (bottleChoiceTimer) {
        clearInterval(bottleChoiceTimer);
        bottleChoiceTimer = null;
      }
      try {
        const payload = await encryptText(JSON.stringify({ choice: false }), aesKey);
        socket.emit('bottle_choice', payload);
      } catch (e) {
        console.error('Ошибка отправки выбора choice:false', e);
      }
    }
  });
}

if (bottleChatToggleBtn) {
  bottleChatToggleBtn.addEventListener('click', () => {
    if (bottleLocalChatPanel) {
      const isOpen = bottleLocalChatPanel.style.right === '0px' || bottleLocalChatPanel.style.right === '0';
      if (isOpen) {
        bottleLocalChatPanel.style.right = '-240px';
      } else {
        bottleLocalChatPanel.style.right = '0px';
        if (bottleChatBadge) bottleChatBadge.style.display = 'none';
        if (bottleChatMessages) bottleChatMessages.scrollTop = bottleChatMessages.scrollHeight;
      }
    }
  });
}

if (bottleChatCloseBtn) {
  bottleChatCloseBtn.addEventListener('click', () => {
    if (bottleLocalChatPanel) bottleLocalChatPanel.style.right = '-240px';
  });
}

async function sendBottleMessage() {
  if (!bottleChatInput) return;
  const text = bottleChatInput.value.trim();
  if (text && socket && aesKey) {
    try {
      const encrypted = await encryptText(text, aesKey);
      socket.emit('bottle_chat_message', encrypted);
      bottleChatInput.value = '';
    } catch (err) {
      console.error('Ошибка отправки сообщения в чат стола:', err);
    }
  }
}

if (bottleChatSendBtn) {
  bottleChatSendBtn.addEventListener('click', sendBottleMessage);
}

if (bottleChatInput) {
  bottleChatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      sendBottleMessage();
    }
  });
}

function appendBottleMessageToUi(msg, autoScroll = true) {
  if (!bottleChatMessages) return;
  const { author, text, time, badge, color, avatar, avatarFrame } = msg;

  const msgDiv = document.createElement('div');
  msgDiv.style.display = 'flex';
  msgDiv.style.flexDirection = 'column';
  msgDiv.style.background = 'var(--input-bg)';
  msgDiv.style.border = '1px solid var(--border-color)';
  msgDiv.style.borderRadius = '8px';
  msgDiv.style.padding = '6px 8px';
  msgDiv.style.fontSize = '11px';
  msgDiv.style.color = 'var(--text-color)';
  msgDiv.style.wordBreak = 'break-word';
  msgDiv.style.lineHeight = '1.3';
  msgDiv.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
  msgDiv.style.width = '100%';
  msgDiv.style.boxSizing = 'border-box';

  const headerDiv = document.createElement('div');
  headerDiv.style.display = 'flex';
  headerDiv.style.alignItems = 'center';
  headerDiv.style.gap = '4px';
  headerDiv.style.fontWeight = 'bold';
  headerDiv.style.fontSize = '10px';
  headerDiv.style.marginBottom = '2px';

  // Badge
  if (badge) {
    const badgeSpan = document.createElement('span');
    badgeSpan.textContent = badge;
    headerDiv.appendChild(badgeSpan);
  }

  // Author Name
  const authorSpan = document.createElement('span');
  authorSpan.textContent = author === currentNickname ? 'Вы' : author;
  if (color) {
    authorSpan.style.color = color;
  } else {
    authorSpan.style.color = 'var(--accent-color)';
  }
  headerDiv.appendChild(authorSpan);

  // Time
  const timeSpan = document.createElement('span');
  timeSpan.style.marginLeft = 'auto';
  timeSpan.style.fontSize = '8.5px';
  timeSpan.style.color = 'var(--text-muted)';
  timeSpan.style.fontWeight = 'normal';
  const date = new Date(time);
  timeSpan.textContent = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  headerDiv.appendChild(timeSpan);

  msgDiv.appendChild(headerDiv);

  // Message Text
  const textDiv = document.createElement('div');
  textDiv.textContent = text;
  msgDiv.appendChild(textDiv);

  bottleChatMessages.appendChild(msgDiv);

  // If chat panel is NOT open, show the badge (red dot)
  if (bottleLocalChatPanel && bottleChatBadge) {
    const isChatOpen = bottleLocalChatPanel.style.right === '0px' || bottleLocalChatPanel.style.right === '0';
    if (!isChatOpen) {
      bottleChatBadge.style.display = 'block';
    }
  }

  if (autoScroll) {
    bottleChatMessages.scrollTop = bottleChatMessages.scrollHeight;
  }
}

function renderBottleMessages(history) {
  if (!bottleChatMessages) return;
  bottleChatMessages.innerHTML = '';
  if (history && history.length > 0) {
    history.forEach(msg => appendBottleMessageToUi(msg, false));
  }
  bottleChatMessages.scrollTop = bottleChatMessages.scrollHeight;
}

// --- МАГАЗИН И МУЗЫКАЛЬНЫЕ ФУНКЦИИ ---

function updateShopUi() {
  chrome.storage.local.get([
    'clickerCoins', 'purchasedAttributes',
    'activeAvatarFrame', 'activeColor', 'activeBadge',
    'messagesSentCount'
  ], (res) => {
    const coins = res.clickerCoins || 0;
    const purchased = res.purchasedAttributes || [];
    const activeFrame = res.activeAvatarFrame || '';
    const activeColor = res.activeColor || '';
    const activeBadge = res.activeBadge || '';
    const messagesSent = res.messagesSentCount || 0;

    // Обновляем баланс монет
    const shopCoinsDisplay = document.getElementById('shop-coins-display');
    if (shopCoinsDisplay) shopCoinsDisplay.textContent = Math.floor(coins);

    // Обновляем прогресс заданий
    const shopTaskPro = document.getElementById('shop-task-pro');
    if (shopTaskPro) shopTaskPro.textContent = `${Math.min(messagesSent, 10)} / 10`;
    const shopTaskLightning = document.getElementById('shop-task-lightning');
    if (shopTaskLightning) shopTaskLightning.textContent = `${Math.min(messagesSent, 50)} / 50`;

    // Обновляем кнопки товаров
    document.querySelectorAll('.shop-item-btn').forEach(btn => {
      const itemId = btn.getAttribute('data-item-id');
      const price = parseInt(btn.getAttribute('data-price'), 10);
      const isPurchased = purchased.includes(itemId);

      // Проверяем, активен ли товар
      let isActive = false;
      if (itemId.startsWith('color_')) {
        const val = getShopItemValue(itemId);
        isActive = (activeColor === val);
      } else if (itemId.startsWith('badge_')) {
        const val = getShopItemValue(itemId);
        isActive = (activeBadge === val);
      } else if (itemId.startsWith('frame_')) {
        const val = getShopItemValue(itemId);
        isActive = (activeFrame === val);
      }

      if (isActive) {
        btn.textContent = 'Активно';
        btn.style.background = '#198754'; // Зеленый
        btn.style.color = '#fff';
      } else if (isPurchased) {
        btn.textContent = 'Применить';
        btn.style.background = '#0d6efd'; // Синий
        btn.style.color = '#fff';
      } else {
        btn.textContent = `${price} 🪙`;
        btn.style.background = 'var(--accent-color)';
        btn.style.color = 'var(--tab-active-text)';
      }
    });
  });
}

function getShopItemValue(itemId) {
  switch (itemId) {
    case 'color_neon_green': return '#39ff14';
    case 'color_gold': return '#ffd700';
    case 'color_neon_pink': return '#ff6ec7';
    case 'badge_diamond': return '💎';
    case 'badge_unicorn': return '🦄';
    case 'badge_star': return '🌟';
    case 'frame_gold': return 'gold';
    case 'frame_neon': return 'neon';
    case 'frame_rainbow': return 'rainbow';
    default: return '';
  }
}

function updateBadgeDrawerSelection(activeBadge) {
  document.querySelectorAll('.profile-badge-item').forEach(item => {
    item.style.outline = 'none';
    item.style.boxShadow = 'none';
  });

  let activeId = '';
  if (activeBadge === '👑') activeId = 'badge-creator';
  else if (activeBadge === '🔥') activeId = 'badge-pro';
  else if (activeBadge === '⚡') activeId = 'badge-lightning';

  if (activeId) {
    const activeItem = document.getElementById(activeId);
    if (activeItem && activeItem.classList.contains('unlocked')) {
      activeItem.style.outline = '2px solid var(--accent-color)';
      activeItem.style.boxShadow = '0 0 8px var(--accent-color)';
    }
  }
}

// Обработчик покупки/экипировки в магазине
document.addEventListener('click', async (e) => {
  const shopBtn = e.target.closest('.shop-item-btn');
  if (shopBtn) {
    const itemId = shopBtn.getAttribute('data-item-id');
    const price = parseInt(shopBtn.getAttribute('data-price'), 10);

    chrome.storage.local.get([
      'clickerCoins', 'purchasedAttributes',
      'activeAvatarFrame', 'activeColor', 'activeBadge',
      'isPremium', 'premiumBadge', 'premiumColor'
    ], (res) => {
      let coins = res.clickerCoins || 0;
      let purchased = res.purchasedAttributes || [];
      let activeFrame = res.activeAvatarFrame || '';
      let activeColor = res.activeColor || '';
      let activeBadge = res.activeBadge || '';
      const isPremium = res.isPremium || false;

      const isPurchased = purchased.includes(itemId);

      let itemType = '';
      if (itemId.startsWith('color_')) itemType = 'color';
      else if (itemId.startsWith('badge_')) itemType = 'badge';
      else if (itemId.startsWith('frame_')) itemType = 'frame';

      const val = getShopItemValue(itemId);

      if (isPurchased) {
        if (itemType === 'color') {
          activeColor = (activeColor === val) ? '' : val;
        } else if (itemType === 'badge') {
          activeBadge = (activeBadge === val) ? '' : val;
        } else if (itemType === 'frame') {
          activeFrame = (activeFrame === val) ? '' : val;
        }
      } else {
        if (coins < price) {
          alert('Недостаточно монет кликера! 🪙');
          return;
        }
        coins -= price;
        purchased.push(itemId);

        if (itemType === 'color') activeColor = val;
        else if (itemType === 'badge') activeBadge = val;
        else if (itemType === 'frame') activeFrame = val;
      }

      chrome.storage.local.set({
        clickerCoins: Math.floor(coins),
        purchasedAttributes: purchased,
        activeColor,
        activeBadge,
        activeAvatarFrame: activeFrame
      }, async () => {
        clickerCoins = coins;
        updateClickerUi();
        updateShopUi();

        if (socket && aesKey) {
          sendClickerStats();
          const finalBadge = (isPremium && res.premiumBadge) ? res.premiumBadge : activeBadge;
          const finalColor = (isPremium && res.premiumColor) ? res.premiumColor : activeColor;
          
          try {
            const payload = await encryptText(JSON.stringify({
              badge: finalBadge,
              color: finalColor,
              avatarFrame: activeFrame
            }), aesKey);
            socket.emit('equip_attribute', payload);
          } catch (err) {
            console.error('Ошибка отправки equip_attribute:', err);
          }
        }
      });
    });
  }
});

// Обработка клика по значкам в профиле для их экипировки
const badgesDrawer = document.getElementById('profile-badges-drawer');
if (badgesDrawer) {
  badgesDrawer.addEventListener('click', async (e) => {
    const badgeItem = e.target.closest('.profile-badge-item');
    if (!badgeItem) return;

    if (!badgeItem.classList.contains('unlocked')) {
      alert('Этот значок еще не разблокирован! Выполняйте задания чата или активируйте Premium.');
      return;
    }

    const badgeId = badgeItem.id;
    let emoji = '';
    if (badgeId === 'badge-creator') emoji = '👑';
    else if (badgeId === 'badge-pro') emoji = '🔥';
    else if (badgeId === 'badge-lightning') emoji = '⚡';

    chrome.storage.local.get(['activeBadge', 'isPremium', 'premiumBadge', 'premiumColor', 'activeColor', 'activeAvatarFrame'], async (res) => {
      const isPremium = res.isPremium || false;
      let activeBadge = res.activeBadge || '';

      activeBadge = (activeBadge === emoji) ? '' : emoji;

      chrome.storage.local.set({ activeBadge }, async () => {
        updateBadgeDrawerSelection(activeBadge);

        if (socket && aesKey) {
          const finalBadge = (isPremium && res.premiumBadge) ? res.premiumBadge : activeBadge;
          const finalColor = (isPremium && res.premiumColor) ? res.premiumColor : (res.activeColor || '');
          
          try {
            const payload = await encryptText(JSON.stringify({
              badge: finalBadge,
              color: finalColor,
              avatarFrame: res.activeAvatarFrame || ''
            }), aesKey);
            socket.emit('equip_attribute', payload);
          } catch (err) {
            console.error('Ошибка отправки equip_attribute:', err);
          }
        }
      });
    });
  });
}


