const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const crypto = require('crypto');

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

// Хранилище таймаутов отключения пользователей (socket.id -> { timeoutId, room, nickname })
const disconnectTimeouts = new Map();

// Хранилище истории сообщений в комнатах (room -> Array)
const roomHistories = new Map();

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
      console.log(`[DH] Сессионный ключ для сокета ${socket.id} успешно создан.`);

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
      const { url, nickname, isPremium, badge, color, isInvisible } = JSON.parse(decryptedStr);

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
            const oldUsersInRoom = Array.from(users.values())
              .filter(u => u.room === oldRoom && !u.isInvisible)
              .map(u => ({
                nickname: u.nickname,
                badge: u.badge || null,
                color: u.color || null
              }));
            broadcastToRoom(oldRoom, 'update_users', oldUsersInRoom);
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
        isInvisible: isInvisible || false
      });
      socket.join(room);

      console.log(`[JOIN] ${nickname} присоеденился к комнате: ${room} (Premium: ${isPremium}, Invisible: ${isInvisible})`);

      // Формируем список участников комнаты (исключая пользователей в режиме невидимки)
      const usersInRoom = Array.from(users.values())
        .filter(u => u.room === room && !u.isInvisible)
        .map(u => ({
          nickname: u.nickname,
          badge: u.badge || null,
          color: u.color || null
        }));

      // Рассылаем обновленный список пользователей (каждому со своим ключом)
      broadcastToRoom(room, 'update_users', usersInRoom);

      // Отправляем историю сообщений новому участнику
      const history = roomHistories.get(room) || [];
      const encryptedHistory = encryptPayload(JSON.stringify(history), key);
      socket.emit('chat_history', encryptedHistory);
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
        color: user.color || null
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
    } catch (err) {
      console.error(`Ошибка обработки сообщения от сокета ${socket.id}:`, err);
    }
  });

  // Отключение пользователя
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      const { room, nickname } = user;
      console.log(`[-] Запланировано отключение ${nickname} от комнаты ${room} через 30 секунд`);

      const timeoutId = setTimeout(() => {
        users.delete(socket.id);
        socketKeys.delete(socket.id);
        disconnectTimeouts.delete(socket.id);

        console.log(`[-] ${nickname} окончательно отключился от комнаты: ${room}`);

        // Обновляем список участников для остальных
        const usersInRoom = Array.from(users.values())
          .filter(u => u.room === room && !u.isInvisible)
          .map(u => ({
            nickname: u.nickname,
            badge: u.badge || null,
            color: u.color || null
          }));

        broadcastToRoom(room, 'update_users', usersInRoom);
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
