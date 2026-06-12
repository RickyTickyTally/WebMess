# Инструкция по деплою бэкенда Site Chat на Hugging Face Spaces

Если Glitch или Render неудобны, лучшая бесплатная альтернатива без ввода банковских карт — **Hugging Face Spaces**. Этот сервис позволяет бесплатно запускать Docker-контейнеры с поддержкой WebSocket-соединений.

Мы добавили файл `Dockerfile` в корень проекта, чтобы Hugging Face автоматически собрал и запустил сервер.

---

## Шаг 1. Создание Space на Hugging Face

1. Перейдите на сайт **[Hugging Face](https://huggingface.co/)** и зарегистрируйте бесплатный аккаунт (карты не требуются).
2. Перейдите по ссылке создания нового пространства: **[huggingface.co/new-space](https://huggingface.co/new-space)**.
3. Настройте параметры:
   * **Space name:** `webmess` (или любое другое имя)
   * **License:** `mit` (или оставьте пустым)
   * **SDK:** Выберите **Docker** (это очень важно!)
   * **Docker template:** Выберите **Blank**
   * **Space hardware:** Оставьте бесплатный **CPU basic**
   * **Visibility:** Выберите **Public** (чтобы расширение могло достучаться до сервера)
4. Нажмите **Create Space**.

---

## Шаг 2. Заливка кода в Hugging Face

После создания Space перед вами откроется страница с инструкцией. Чтобы загрузить наш код прямо туда:

1. Откройте терминал в папке проекта `SiteChat`.
2. Добавьте адрес репозитория Hugging Face в качестве второго удаленного репозитория (замените `<username>` на ваш ник в Hugging Face, а `<space-name>` на имя созданного пространства):
   ```bash
   git remote add hf https://huggingface.co/spaces/<username>/<space-name>
   ```
   *Пример: `git remote add hf https://huggingface.co/spaces/RickyTicky/webmess`*
3. Отправьте код на Hugging Face:
   ```bash
   git push -f hf main
   ```
   *(Если спросит логин и пароль: введите ваш никнейм на Hugging Face, а в качестве пароля создайте Access Token в настройках профиля: Settings -> Access Tokens -> New Token с ролью Write).*

Hugging Face увидит `Dockerfile` и начнет сборку. Через 1-2 минуты статус вашего пространства вверху страницы изменится на зеленый **Running**.

---

## Шаг 3. Получение ссылки и настройка расширения

1. На странице вашего Space нажмите на иконку **три точки** (в правом верхнем углу) -> выберите **Embed this Space**.
2. В появившемся окне найдите строку **Direct URL** (она выглядит примерно так: `https://username-space-name.hf.space`). Скопируйте её.
3. В локальной папке расширения `extension`:
   * В **`popup.js`** пропишите этот адрес (обязательно с `https`):
     ```javascript
     const SERVER_URL = 'https://username-space-name.hf.space'; 
     ```
   * В **`manifest.json`** добавьте его в `host_permissions`:
     ```json
       "host_permissions": [
         "https://username-space-name.hf.space/"
       ]
     ```
4. Обновите расширение на странице `chrome://extensions/`.

Теперь вы и ваши друзья сможете полноценно пользоваться чатом!
