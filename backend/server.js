const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Хранилище сессионных AES-ключей (socket.id -> Buffer)
const socketKeys = new Map();

// Хранилище информации о пользователях (socket.id -> { nickname, room, isPremium, badge, color, isInvisible })
const users = new Map();

// Хелпер: Получение списка активных участников комнаты с их монетами
function getRoomUsers(room) {
  return Array.from(users.values())
    .filter(u => u.room === room && !u.isInvisible)
    .map(u => ({
      nickname: u.nickname,
      badge: u.badge || null,
      color: u.color || null,
      avatar: u.avatar || null,
      telegram: u.telegram || null,
      discord: u.discord || null,
      coins: u.coins || 0,
      avatarFrame: u.avatarFrame || null
    }));
}

// Хранилище таймаутов отключения пользователей (socket.id -> { timeoutId, room, nickname })
const disconnectTimeouts = new Map();

// Хранилище истории сообщений в комнатах (room -> Array)
const roomHistories = new Map();

// Хранилище режимов игры в комнатах (room -> mode)
const roomModes = new Map();

// Хранилище игр в Бутылочку (room -> game state)
const bottleGames = new Map();

// Хранилище заказанной музыки в комнатах (room -> active music state)
const roomMusic = new Map();

// Хранилище приватизированных комнат (room -> { owner, theme })
const ROOMS_FILE = path.join(__dirname, 'rooms.json');
const ownedRooms = new Map();

if (fs.existsSync(ROOMS_FILE)) {
  try {
    const data = fs.readFileSync(ROOMS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    for (const [room, settings] of Object.entries(parsed)) {
      ownedRooms.set(room, settings);
    }
  } catch(e) { console.error('Ошибка чтения rooms.json', e); }
}

function saveRooms() {
  const obj = Object.fromEntries(ownedRooms);
  fs.writeFileSync(ROOMS_FILE, JSON.stringify(obj, null, 2), 'utf8');
}

// Вспомогательная функция внедрения реферальных меток (CPA-партнерки)
function injectReferralTags(text) {
  // Регулярное выражение для поиска URL ссылок
  return text.replace(/(https?:\/\/[^\s]+)/g, (url) => {
    try {
      const parsed = new URL(url);
      
      // Партнерка AliExpress
      if (parsed.hostname.includes('aliexpress.com')) {
        parsed.searchParams.set('aff_id', 'webmess_aliexpress');
        return parsed.toString();
      }
      
      // Партнерка Amazon
      if (parsed.hostname.includes('amazon.com') || parsed.hostname.includes('amazon.co.uk')) {
        parsed.searchParams.set('tag', 'webmess_amazon-20');
        return parsed.toString();
      }
      
      // Партнерка eBay
      if (parsed.hostname.includes('ebay.com')) {
        parsed.searchParams.set('campid', '5338940424');
        return parsed.toString();
      }
      
      return url;
    } catch (e) {
      return url; // Если URL некорректный, возвращаем как есть
    }
  });
}

// Хелпер: Шифрование AES-256-GCM (совместимое с Web Crypto API)
function encryptPayload(text, key) {
  const iv = crypto.randomBytes(12); // 96-битный IV
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final(), cipher.getAuthTag()]);
  
  return {
    iv: iv.toString('hex'),
    ciphertext: encrypted.toString('hex')
  };
}

// Хелпер: Дешифрование AES-256-GCM (совместимое с Web Crypto API)
function decryptPayload(payload, key) {
  const { iv, ciphertext } = payload;
  const ivBuffer = Buffer.from(iv, 'hex');
  const combined = Buffer.from(ciphertext, 'hex');
  
  const tag = combined.subarray(combined.length - 16);
  const encryptedData = combined.subarray(0, combined.length - 16);
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, ivBuffer);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Функция отправки персонально зашифрованного сообщения участникам комнаты
function broadcastToRoom(room, eventName, data) {
  const socketsInRoom = io.sockets.adapter.rooms.get(room);
  if (!socketsInRoom) return;

  for (const socketId of socketsInRoom) {
    const socket = io.sockets.sockets.get(socketId);
    const key = socketKeys.get(socketId);
    if (socket && key) {
      try {
        const encrypted = encryptPayload(JSON.stringify(data), key);
        socket.emit(eventName, encrypted);
      } catch (err) {
        console.error(`Ошибка шифрования для сокета ${socketId}:`, err);
      }
    }
  }
}

// --- ИГРА БУТЫЛОЧКА ---
const BOT_NAMES = ['CyberBot', 'NeonStrike', 'GlitchHunter', 'NullPointer', 'ByteSlayer', 'AlphaBot', 'MegaSpin', 'PixelKiss', 'HeartBreaker', 'LoveByte'];
const BOT_COLORS = ['#dc3545', '#6f42c1', '#fd7e14', '#198754', '#0d6efd', '#e91e63'];

function padWithBots(game) {
  while (game.players.length < 6) {
    const botId = 'bot_' + Math.random().toString(36).substr(2, 9);
    const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)] + '_' + Math.floor(Math.random() * 90 + 10);
    const color = BOT_COLORS[Math.floor(Math.random() * BOT_COLORS.length)];
    game.players.push({
      socketId: botId,
      nickname: name,
      avatar: '',
      badge: '🤖',
      color: color,
      isBot: true
    });
  }
}

function clearBottleGameTimers(game) {
  if (game.timerId) {
    clearTimeout(game.timerId);
    game.timerId = null;
  }
  if (game.botTimeouts) {
    game.botTimeouts.forEach(t => clearTimeout(t));
    game.botTimeouts = [];
  }
}

function resetBottleRound(game) {
  clearBottleGameTimers(game);
  game.state = 'waiting';
  game.spinnerId = null;
  game.targetId = null;
  game.choices = {};
  if (game.players.length > 0) {
    game.turnIndex = (game.turnIndex + 1) % game.players.length;
  } else {
    game.turnIndex = 0;
  }
}

function checkBotTurn(room) {
  const game = bottleGames.get(room);
  if (!game || game.state !== 'waiting' || game.players.length === 0) return;

  const currentSpinner = game.players[game.turnIndex];
  if (currentSpinner && currentSpinner.isBot) {
    const delay = 2000 + Math.random() * 1500;
    const timeout = setTimeout(() => {
      spinBottle(room, currentSpinner.socketId);
    }, delay);
    game.botTimeouts.push(timeout);
  }
}

function spinBottle(room, spinnerId) {
  const game = bottleGames.get(room);
  if (!game || game.state !== 'waiting') return;

  const currentSpinner = game.players[game.turnIndex];
  if (!currentSpinner || currentSpinner.socketId !== spinnerId) return;

  clearBottleGameTimers(game);
  game.state = 'spinning';
  game.spinnerId = spinnerId;
  game.choices = {};

  const spinnerIndex = game.turnIndex;
  let targetIndex = Math.floor(Math.random() * game.players.length);
  while (targetIndex === spinnerIndex && game.players.length > 1) {
    targetIndex = Math.floor(Math.random() * game.players.length);
  }
  const target = game.players[targetIndex];
  game.targetId = target.socketId;

  const targetAngle = (360 / game.players.length) * targetIndex;
  const rotations = 4 + Math.floor(Math.random() * 3);
  const totalAngle = 360 * rotations + targetAngle;

  broadcastToRoom(room, 'bottle_spin_start', {
    spinnerId: spinnerId,
    targetId: target.socketId,
    angle: totalAngle
  });

  game.timerId = setTimeout(() => {
    startKissingState(room);
  }, 4000);
}

function startKissingState(room) {
  const game = bottleGames.get(room);
  if (!game || game.state !== 'spinning') return;

  game.state = 'kissing';
  game.choices = {};

  broadcastBottleState(room);

  const spinner = game.players.find(p => p.socketId === game.spinnerId);
  if (spinner && spinner.isBot) {
    const delay = 1000 + Math.random() * 2000;
    const timeout = setTimeout(() => {
      submitBottleChoice(room, game.spinnerId, Math.random() < 0.7);
    }, delay);
    game.botTimeouts.push(timeout);
  }

  const target = game.players.find(p => p.socketId === game.targetId);
  if (target && target.isBot) {
    const delay = 1500 + Math.random() * 2000;
    const timeout = setTimeout(() => {
      submitBottleChoice(room, game.targetId, Math.random() < 0.7);
    }, delay);
    game.botTimeouts.push(timeout);
  }

  game.timerId = setTimeout(() => {
    resolveKissingChoices(room);
  }, 10000);
}

function submitBottleChoice(room, socketId, choice) {
  const game = bottleGames.get(room);
  if (!game || game.state !== 'kissing') return;

  if (game.spinnerId !== socketId && game.targetId !== socketId) return;

  game.choices[socketId] = !!choice;

  const hasSpinnerChoice = game.choices[game.spinnerId] !== undefined;
  const hasTargetChoice = game.choices[game.targetId] !== undefined;

  if (hasSpinnerChoice && hasTargetChoice) {
    resolveKissingChoices(room);
  }
}

function resolveKissingChoices(room) {
  const game = bottleGames.get(room);
  if (!game || game.state !== 'kissing') return;

  clearBottleGameTimers(game);
  game.state = 'result';

  const spinnerChoice = !!game.choices[game.spinnerId];
  const targetChoice = !!game.choices[game.targetId];
  const success = spinnerChoice && targetChoice;

  const spinner = game.players.find(p => p.socketId === game.spinnerId);
  const target = game.players.find(p => p.socketId === game.targetId);

  const spinnerName = spinner ? spinner.nickname : 'Кто-то';
  const targetName = target ? target.nickname : 'Кто-то';

  broadcastToRoom(room, 'bottle_kiss_result', {
    success: success,
    spinnerId: game.spinnerId,
    targetId: game.targetId
  });

  let chatText = '';
  if (success) {
    chatText = `💋 Ура! ${spinnerName} и ${targetName} поцеловались!`;
  } else {
    chatText = `💔 Увы, поцелуй между ${spinnerName} и ${targetName} не состоялся.`;
  }

  const systemMessage = {
    author: '🍾 Бутылочка',
    text: chatText,
    time: new Date().toISOString(),
    badge: '🍾',
    color: success ? '#e91e63' : '#9e9e9e',
    avatar: '',
    telegram: '',
    discord: ''
  };

  if (!roomHistories.has(room)) {
    roomHistories.set(room, []);
  }
  const history = roomHistories.get(room);
  history.push(systemMessage);
  if (history.length > 50) history.shift();

  broadcastToRoom(room, 'receive_message', systemMessage);

  game.timerId = setTimeout(() => {
    if (game.players.length > 0) {
      game.turnIndex = (game.turnIndex + 1) % game.players.length;
    } else {
      game.turnIndex = 0;
    }
    game.state = 'waiting';
    game.spinnerId = null;
    game.targetId = null;
    game.choices = {};

    broadcastBottleState(room);
    checkBotTurn(room);
  }, 3000);
}

function broadcastBottleState(room) {
  const game = bottleGames.get(room);
  if (!game) return;

  const choicesState = {};
  if (game.choices[game.spinnerId] !== undefined) choicesState[game.spinnerId] = true;
  if (game.choices[game.targetId] !== undefined) choicesState[game.targetId] = true;

  broadcastToRoom(room, 'bottle_state', {
    players: game.players,
    state: game.state,
    turnIndex: game.turnIndex,
    spinnerId: game.spinnerId,
    targetId: game.targetId,
    choices: choicesState
  });
}

function joinBottleGame(room, socketId, user) {
  let game = bottleGames.get(room);
  if (!game) {
    game = {
      players: [],
      state: 'waiting',
      turnIndex: 0,
      spinnerId: null,
      targetId: null,
      choices: {},
      timerId: null,
      botTimeouts: []
    };
    bottleGames.set(room, game);
  }

  if (game.players.some(p => p.socketId === socketId)) {
    return;
  }

  const newPlayer = {
    socketId: socketId,
    nickname: user.nickname,
    avatar: user.avatar || '',
    badge: user.badge || '',
    color: user.color || '',
    isBot: false
  };

  const botIndex = game.players.findIndex(p => p.isBot);
  if (game.players.length >= 6 && botIndex !== -1) {
    game.players[botIndex] = newPlayer;
  } else {
    game.players.push(newPlayer);
  }

  padWithBots(game);
  broadcastBottleState(room);

  if (game.state === 'waiting') {
    checkBotTurn(room);
  }
}

function leaveBottleGame(room, socketId) {
  const game = bottleGames.get(room);
  if (!game) return;

  const index = game.players.findIndex(p => p.socketId === socketId);
  if (index !== -1) {
    game.players.splice(index, 1);

    const humanCount = game.players.filter(p => !p.isBot).length;
    if (humanCount === 0) {
      clearBottleGameTimers(game);
      bottleGames.delete(room);
      return;
    }

    if (index < game.turnIndex) {
      game.turnIndex--;
    }
    if (game.turnIndex >= game.players.length) {
      game.turnIndex = 0;
    }

    if (game.spinnerId === socketId || game.targetId === socketId) {
      resetBottleRound(game);
    }

    padWithBots(game);
    broadcastBottleState(room);

    if (game.state === 'waiting') {
      checkBotTurn(room);
    }
  }
}

io.on('connection', (socket) => {
  console.log(`[+] Подключен сокет: ${socket.id}`);

  // Шаг 1: Рукопожатие Диффи-Хеллмана (ECDH)
  socket.on('dh_handshake_start', ({ clientPublicKeyHex }) => {
    try {
      const serverEcdh = crypto.createECDH('prime256v1');
      serverEcdh.generateKeys();
      const serverPublicKey = serverEcdh.getPublicKey('hex');

      // Вычисляем общий секрет и хэшируем его для получения 32-байтного AES-ключа
      const sharedSecret = serverEcdh.computeSecret(clientPublicKeyHex, 'hex');
      const aesKey = crypto.createHash('sha256').update(sharedSecret).digest();

      socketKeys.set(socket.id, aesKey);
      console.log(`[DH] Сессионный ключ для сокета ${socket.id} успешно создан. Key hash: ${aesKey.toString('hex')}`);

      socket.emit('dh_handshake_response', { serverPublicKeyHex: serverPublicKey });
    } catch (err) {
      console.error(`Ошибка рукопожатия ECDH для сокета ${socket.id}:`, err);
      socket.disconnect();
    }
  });

  // Шаг 2: Вход в комнату (данные зашифрованы AES-GCM)
  socket.on('join_room', (encryptedPayload) => {
    const key = socketKeys.get(socket.id);
    if (!key) {
      console.error(`Попытка join_room без ключа шифрования: ${socket.id}`);
      return;
    }

    try {
      const decryptedStr = decryptPayload(encryptedPayload, key);
      const { url, nickname, isPremium, badge, color, isInvisible, avatar, telegram, discord, coins, avatarFrame } = JSON.parse(decryptedStr);

      const room = url.split('?')[0].split('#')[0].replace(/\/$/, '');
      
      // Проверяем, есть ли уже этот пользователь в сети (например, переподключение или повторный вход)
      for (const [oldSocketId, oldUser] of users.entries()) {
        if (oldUser.nickname === nickname) {
          const pending = disconnectTimeouts.get(oldSocketId);
          if (pending) {
            clearTimeout(pending.timeoutId);
            disconnectTimeouts.delete(oldSocketId);
            console.log(`[RECONNECT] Отменен таймаут отключения для ${nickname}`);
          }
          
          const oldRoom = oldUser.room;
          users.delete(oldSocketId);
          socketKeys.delete(oldSocketId);

          // Если комната изменилась, уведомляем участников старой комнаты
          if (oldRoom !== room) {
            broadcastToRoom(oldRoom, 'update_users', getRoomUsers(oldRoom));
          }
        }
      }

      // Сохраняем сессионную информацию о пользователе
      users.set(socket.id, { 
        nickname, 
        room,
        isPremium: isPremium || false,
        badge: badge || '',
        color: color || '',
        isInvisible: isInvisible || false,
        avatar: avatar || '',
        telegram: telegram || '',
        discord: discord || '',
        coins: coins || 0,
        avatarFrame: avatarFrame || ''
      });
      socket.join(room);

      console.log(`[JOIN] ${nickname} присоеденился к комнате: ${room} (Premium: ${isPremium}, Invisible: ${isInvisible})`);

      // Рассылаем обновленный список пользователей (каждому со своим ключом)
      broadcastToRoom(room, 'update_users', getRoomUsers(room));

      // Отправляем историю сообщений новому участнику
      const history = roomHistories.get(room) || [];
      const encryptedHistory = encryptPayload(JSON.stringify(history), key);
      socket.emit('chat_history', encryptedHistory);

      // Отправляем текущее состояние Бутылочки новому участнику
      if (bottleGames.has(room)) {
        const game = bottleGames.get(room);
        const choicesState = {};
        if (game.choices[game.spinnerId] !== undefined) choicesState[game.spinnerId] = true;
        if (game.choices[game.targetId] !== undefined) choicesState[game.targetId] = true;

        const encryptedBottleState = encryptPayload(JSON.stringify({
          players: game.players,
          state: game.state,
          turnIndex: game.turnIndex,
          spinnerId: game.spinnerId,
          targetId: game.targetId,
          choices: choicesState
        }), key);
        socket.emit('bottle_state', encryptedBottleState);
      }

      // Отправляем текущую музыку, если она играет
      if (roomMusic.has(room)) {
        const music = roomMusic.get(room);
        if (music.expiresAt > Date.now()) {
          const encryptedMusic = encryptPayload(JSON.stringify({
            videoId: music.videoId,
            title: music.title,
            orderedBy: music.orderedBy,
            expiresAt: music.expiresAt
          }), key);
          socket.emit('room_music_update', encryptedMusic);
        }
      }
      
      // Отправляем настройки приватизированной комнаты (владелец, тема)
      if (ownedRooms.has(room)) {
        const settings = ownedRooms.get(room);
        socket.emit('room_settings', encryptPayload(JSON.stringify(settings), key));

        // Если в комнате настроено приветствие, отправляем его новому участнику в чат через 1 секунду
        if (settings.welcomeMessage) {
          setTimeout(() => {
            const welcomeMsgData = {
              author: '📢 Система',
              text: settings.welcomeMessage,
              time: new Date().toISOString(),
              badge: '📢',
              color: '#0d6efd',
              avatar: '',
              telegram: '',
              discord: ''
            };
            const currentKey = socketKeys.get(socket.id);
            if (currentKey) {
              socket.emit('receive_message', encryptPayload(JSON.stringify(welcomeMsgData), currentKey));
            }
          }, 1000);
        }
      } else {
        socket.emit('room_settings', encryptPayload(JSON.stringify({ owner: null }), key));
      }
    } catch (err) {
      console.error(`Ошибка join_room для сокета ${socket.id}:`, err);
    }
  });

  // Шаг 3: Передача зашифрованных сообщений
  socket.on('send_message', (encryptedPayload) => {
    const key = socketKeys.get(socket.id);
    const user = users.get(socket.id);
    if (!key || !user) return;

    try {
      const text = decryptPayload(encryptedPayload, key);
      
      // Монетизация: подменяем ссылки на реферальные (AliExpress, Amazon, eBay)
      const processedText = injectReferralTags(text);

      const messageData = {
        author: user.nickname,
        text: processedText,
        time: new Date().toISOString(),
        badge: user.badge || null,
        color: user.color || null,
        avatar: user.avatar || null,
        telegram: user.telegram || null,
        discord: user.discord || null,
        avatarFrame: user.avatarFrame || null
      };

      console.log(`[MSG] Сообщение от ${user.nickname} в комнате ${user.room}`);

      // Сохраняем сообщение в историю комнаты
      if (!roomHistories.has(user.room)) {
        roomHistories.set(user.room, []);
      }
      const history = roomHistories.get(user.room);
      history.push(messageData);
      if (history.length > 50) {
        history.shift();
      }
      
      // Рассылаем сообщение (каждому со своим ключом)
      broadcastToRoom(user.room, 'receive_message', messageData);

      // --- КОНСТРУКТОР БОТОВ (UGC BOT) ---
      const roomSettings = ownedRooms.get(user.room);
      if (roomSettings && roomSettings.botConfig && Array.isArray(roomSettings.botConfig)) {
        const lowerText = text.toLowerCase();
        for (const rule of roomSettings.botConfig) {
          if (rule.trigger && rule.response && lowerText.startsWith(rule.trigger.toLowerCase())) {
            setTimeout(() => {
              const replyText = rule.response.replace(/{username}/g, user.nickname);
              const botMessage = {
                author: '🤖 Авто-Бот',
                text: replyText,
                time: new Date().toISOString(),
                badge: '🤖',
                color: '#ffc107',
                avatar: '',
                telegram: '',
                discord: ''
              };
              if (roomHistories.has(user.room)) {
                roomHistories.get(user.room).push(botMessage);
              }
              broadcastToRoom(user.room, 'receive_message', botMessage);
            }, 1000);
            break;
          }
        }
      }
    } catch (err) {
      console.error(`Ошибка обработки сообщения от сокета ${socket.id}:`, err);
    }
  });

  // UGC: Приватизация комнат и кастомизация
  socket.on('claim_room', () => {
    const user = users.get(socket.id);
    const key = socketKeys.get(socket.id);
    if (!user || !key) return;

    if (!ownedRooms.has(user.room)) {
      const settings = {
        owner: user.nickname,
        theme: 'white' // Дефолтная тема
      };
      ownedRooms.set(user.room, settings);
      saveRooms();
      console.log(`[UGC] Пользователь ${user.nickname} захватил комнату ${user.room}`);
      broadcastToRoom(user.room, 'room_settings_updated', settings);
    }
  });

  socket.on('update_room_settings', (encryptedPayload) => {
    const user = users.get(socket.id);
    const key = socketKeys.get(socket.id);
    if (!user || !key) return;

    try {
      const decryptedStr = decryptPayload(encryptedPayload, key);
      const newSettings = JSON.parse(decryptedStr);
      
      const currentSettings = ownedRooms.get(user.room);
      if (currentSettings && currentSettings.owner === user.nickname) {
        currentSettings.theme = newSettings.theme || currentSettings.theme;
        currentSettings.bgUrl = newSettings.bgUrl !== undefined ? newSettings.bgUrl : currentSettings.bgUrl;
        currentSettings.accentColor = newSettings.accentColor !== undefined ? newSettings.accentColor : currentSettings.accentColor;
        currentSettings.welcomeMessage = newSettings.welcomeMessage !== undefined ? newSettings.welcomeMessage : currentSettings.welcomeMessage;
        currentSettings.botConfig = newSettings.botConfig !== undefined ? newSettings.botConfig : currentSettings.botConfig;
        currentSettings.gameMode = newSettings.gameMode !== undefined ? newSettings.gameMode : currentSettings.gameMode;
        currentSettings.botCount = newSettings.botCount !== undefined ? newSettings.botCount : currentSettings.botCount;
        
        ownedRooms.set(user.room, currentSettings);
        saveRooms();
        console.log(`[UGC] Владелец ${user.nickname} обновил настройки комнаты ${user.room}`);
        broadcastToRoom(user.room, 'room_settings_updated', currentSettings);

        // Если изменился принудительный игровой режим, обновляем его на бэкенде и уведомляем арену
        if (newSettings.gameMode) {
          roomModes.set(user.room, newSettings.gameMode);
          broadcastToRoom(user.room, 'game_mode_updated', { mode: newSettings.gameMode });
        }
      }
    } catch (err) {
      console.error(`Ошибка update_room_settings для сокета ${socket.id}:`, err);
    }
  });

  // Игровые события PVP
  socket.on('get_game_rooms', () => {
    const key = socketKeys.get(socket.id);
    if (!key) return;
    try {
      const roomList = [];
      const roomsWithPlayers = new Map();
      
      for (const u of users.values()) {
        roomsWithPlayers.set(u.room, (roomsWithPlayers.get(u.room) || 0) + 1);
      }
      
      for (const [r, count] of roomsWithPlayers.entries()) {
        let roomDisplayName = r;
        try {
          if (r.startsWith('http')) {
            roomDisplayName = new URL(r).hostname;
          }
        } catch(e) {}
        
        roomList.push({
          room: r,
          displayName: roomDisplayName,
          count: count,
          mode: roomModes.get(r) || 'ffa'
        });
      }
      
      const encrypted = encryptPayload(JSON.stringify(roomList), key);
      socket.emit('game_rooms_list', encrypted);
    } catch (err) {
      console.error('Ошибка get_game_rooms:', err);
    }
  });

  socket.on('game_join', (encryptedPayload) => {
    const key = socketKeys.get(socket.id);
    const user = users.get(socket.id);
    if (!key || !user) return;
    try {
      const decryptedStr = decryptPayload(encryptedPayload, key);
      const playerData = JSON.parse(decryptedStr);
      playerData.id = socket.id;
      broadcastToRoom(user.room, 'game_player_joined', playerData);
    } catch (err) {
      console.error('Ошибка game_join:', err);
    }
  });

  socket.on('game_update', (encryptedPayload) => {
    const key = socketKeys.get(socket.id);
    const user = users.get(socket.id);
    if (!key || !user) return;
    try {
      const decryptedStr = decryptPayload(encryptedPayload, key);
      const updateData = JSON.parse(decryptedStr);
      updateData.id = socket.id;
      broadcastToRoom(user.room, 'game_player_updated', updateData);
    } catch (err) {
      console.error('Ошибка game_update:', err);
    }
  });

  socket.on('game_shoot', (encryptedPayload) => {
    const key = socketKeys.get(socket.id);
    const user = users.get(socket.id);
    if (!key || !user) return;
    try {
      const decryptedStr = decryptPayload(encryptedPayload, key);
      const bulletData = JSON.parse(decryptedStr);
      bulletData.id = socket.id;
      broadcastToRoom(user.room, 'game_bullet_spawned', bulletData);
    } catch (err) {
      console.error('Ошибка game_shoot:', err);
    }
  });

  socket.on('game_hit', (encryptedPayload) => {
    const key = socketKeys.get(socket.id);
    const user = users.get(socket.id);
    if (!key || !user) return;
    try {
      const decryptedStr = decryptPayload(encryptedPayload, key);
      const hitData = JSON.parse(decryptedStr);
      broadcastToRoom(user.room, 'game_player_hit', hitData);
    } catch (err) {
      console.error('Ошибка game_hit:', err);
    }
  });

  socket.on('game_mode_change', (encryptedPayload) => {
    const key = socketKeys.get(socket.id);
    const user = users.get(socket.id);
    if (!key || !user) return;
    try {
      const decryptedStr = decryptPayload(encryptedPayload, key);
      const { mode } = JSON.parse(decryptedStr);
      roomModes.set(user.room, mode);
      broadcastToRoom(user.room, 'game_mode_updated', { mode });
    } catch (err) {
      console.error('Ошибка game_mode_change:', err);
    }
  });

  socket.on('clicker_update', (encryptedPayload) => {
    const key = socketKeys.get(socket.id);
    const user = users.get(socket.id);
    if (!key || !user) return;
    try {
      const decryptedStr = decryptPayload(encryptedPayload, key);
      const { coins } = JSON.parse(decryptedStr);
      user.coins = coins || 0;
      broadcastToRoom(user.room, 'update_users', getRoomUsers(user.room));
    } catch (err) {
      console.error('Ошибка clicker_update:', err);
    }
  });

  socket.on('equip_attribute', (encryptedPayload) => {
    const key = socketKeys.get(socket.id);
    const user = users.get(socket.id);
    if (!key || !user) return;
    try {
      const decryptedStr = decryptPayload(encryptedPayload, key);
      const { badge, color, avatarFrame } = JSON.parse(decryptedStr);
      if (badge !== undefined) user.badge = badge;
      if (color !== undefined) user.color = color;
      if (avatarFrame !== undefined) user.avatarFrame = avatarFrame;
      broadcastToRoom(user.room, 'update_users', getRoomUsers(user.room));
    } catch(err) {
      console.error('Ошибка equip_attribute:', err);
    }
  });

  socket.on('order_music', (encryptedPayload) => {
    const key = socketKeys.get(socket.id);
    const user = users.get(socket.id);
    if (!key || !user) return;
    try {
      const decryptedStr = decryptPayload(encryptedPayload, key);
      const { videoId, title, cost } = JSON.parse(decryptedStr);

      if (user.coins < cost) {
        return; // Недостаточно монет
      }
      user.coins -= cost;

      if (roomMusic.has(user.room)) {
        const oldMusic = roomMusic.get(user.room);
        if (oldMusic.timerId) clearTimeout(oldMusic.timerId);
      }

      const trackLength = 240000; // 4 минуты в мс
      const expiresAt = Date.now() + trackLength;

      const timerId = setTimeout(() => {
        roomMusic.delete(user.room);
        broadcastToRoom(user.room, 'room_music_update', { videoId: null, title: null, orderedBy: null });
      }, trackLength);

      const musicState = {
        videoId,
        title,
        orderedBy: user.nickname,
        expiresAt,
        timerId
      };
      roomMusic.set(user.room, musicState);

      broadcastToRoom(user.room, 'update_users', getRoomUsers(user.room));

      broadcastToRoom(user.room, 'room_music_update', {
        videoId,
        title,
        orderedBy: user.nickname,
        expiresAt
      });

      const systemMessage = {
        author: '🎵 Музыка',
        text: `🎵 ${user.nickname} заказал трек: "${title}"`,
        time: new Date().toISOString(),
        badge: '🎵',
        color: '#ffc107',
        avatar: '',
        telegram: '',
        discord: ''
      };

      if (!roomHistories.has(user.room)) {
        roomHistories.set(user.room, []);
      }
      const history = roomHistories.get(user.room);
      history.push(systemMessage);
      if (history.length > 50) history.shift();

      broadcastToRoom(user.room, 'receive_message', systemMessage);

    } catch (err) {
      console.error('Ошибка order_music:', err);
    }
  });

  socket.on('game_leave', () => {
    const user = users.get(socket.id);
    if (!user) return;
    broadcastToRoom(user.room, 'game_player_left', { id: socket.id });
  });

  // События игры «Бутылочка»
  socket.on('bottle_join', () => {
    const user = users.get(socket.id);
    if (!user) return;
    joinBottleGame(user.room, socket.id, user);
  });

  socket.on('bottle_leave', () => {
    const user = users.get(socket.id);
    if (!user) return;
    leaveBottleGame(user.room, socket.id);
  });

  socket.on('bottle_spin', () => {
    const user = users.get(socket.id);
    if (!user) return;
    spinBottle(user.room, socket.id);
  });

  socket.on('bottle_choice', (encryptedPayload) => {
    const key = socketKeys.get(socket.id);
    const user = users.get(socket.id);
    if (!key || !user) return;
    try {
      const decryptedStr = decryptPayload(encryptedPayload, key);
      const { choice } = JSON.parse(decryptedStr);
      submitBottleChoice(user.room, socket.id, choice);
    } catch (err) {
      console.error('Ошибка расшифровки bottle_choice:', err);
    }
  });

  // Отключение пользователя
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      const { room, nickname } = user;
      console.log(`[-] Запланировано отключение ${nickname} от комнаты ${room} через 30 секунд`);

      // Немедленно убираем игрока из игры
      broadcastToRoom(room, 'game_player_left', { id: socket.id });
      leaveBottleGame(room, socket.id);

      const timeoutId = setTimeout(() => {
        users.delete(socket.id);
        socketKeys.delete(socket.id);
        disconnectTimeouts.delete(socket.id);

        console.log(`[-] ${nickname} окончательно отключился от комнаты: ${room}`);

        // Обновляем список участников для остальных
        broadcastToRoom(room, 'update_users', getRoomUsers(room));
      }, 30000);

      disconnectTimeouts.set(socket.id, {
        timeoutId,
        nickname,
        room
      });
    } else {
      // Если у сокета не было юзера (например, отключился до dh_handshake или join_room), просто удаляем ключ
      socketKeys.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 7860; // 7860 по умолчанию для совместимости с Hugging Face
server.listen(PORT, () => {
  console.log(`Крипто-защищенный WebSocket-сервер запущен на порту ${PORT}`);
});
