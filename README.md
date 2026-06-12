---
title: WebMess
emoji: 💬
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
---

# Site Chat MVP

Реалтайм-чат для пользователей, находящихся на одном и том же URL.

## Структура проекта

- `backend/` — серверная часть на Node.js (Express + Socket.io)
- `extension/` — клиентское расширение для браузера Chrome (Manifest V3)

## Как запустить

### 1. Сервер (Backend)
1. Установите зависимости:
   ```bash
   cd backend
   npm install
   ```
2. Запустите сервер:
   ```bash
   npm start
   ```
   Сервер запустится по адресу `http://localhost:3000`.

### 2. Расширение (Frontend / Chrome Extension)
1. Откройте Google Chrome и перейдите по ссылке `chrome://extensions/`.
2. Включите **Режим разработчика** (Developer mode) в правом верхнем углу страницы.
3. Нажмите кнопку **Загрузить распакованное расширение** (Load unpacked) в левом верхнем углу.
4. Выберите папку `extension/` из этого проекта.

---
### Особенности MVP:
- **Фильтрация URL (Blacklist):** Расширение блокирует соединение на служебных протоколах (`chrome://`, `file://` и др.), локальных хостах (`localhost`) и подозрительных ресурсах (содержащих `bank`, `crypto`, `gov` и др.).
- **Сохранение сессии:** Никнейм сохраняется в `chrome.storage.local`.
- **Комнаты:** Каждый нормализованный URL представляет собой отдельную чат-комнату в Socket.io.
