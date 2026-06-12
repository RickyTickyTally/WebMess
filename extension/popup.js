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
  const { author, text, time, badge, color, avatar, telegram, discord } = msg;
  const msgRow = document.createElement('div');
  
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

            // 2. Входим в комнату чата, зашифровав URL, никнейм, Premium параметры и социальные данные
            const joinPayload = await encryptText(JSON.stringify({ 
              url, 
              nickname, 
              isPremium, 
              badge, 
              color, 
              isInvisible,
              avatar,
              telegram,
              discord
            }), aesKey);
            socket.emit('join_room', joinPayload);
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
