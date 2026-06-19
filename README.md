# Chat Frontend

Фронтенд чат-додатку на **React 19 + TypeScript + Vite**, що працює з готовим
NestJS-бекендом (REST + Socket.IO): автентифікація через JWT, обмін
повідомленнями в реальному часі, надсилання й перегляд файлів і зображень.

## Технології

- TypeScript 6, React 19, React Router 7
- socket.io-client 4 (WebSocket), axios 1 (REST)
- Ant Design 5 (UI, локаль `uk_UA`)
- SCSS Modules для стилів компонентів + один глобальний reset
  ([`src/styles/global.scss`](src/styles/global.scss))
- Vite 8 (білд), ESLint 10 (flat config) + Prettier

## Запуск

```bash
cp .env.example .env
# Відредагуйте .env з адресою бекенду (VITE_API_URL)
npm install
npm run dev      # дев-сервер Vite (http://localhost:5173)
npm run build    # продакшн-збірка (tsc -b && vite build)
npm run preview  # перегляд продакшн-збірки
npm run lint     # ESLint
npm run format   # Prettier (src/**/*.{ts,tsx,scss})
```

> Спершу має бути запущений бекенд (за замовчуванням `http://localhost:3000`).
> Адресу сервера задає змінна `VITE_API_URL` у `.env`.

## Маршрути

| Шлях         | Опис                                               |
| ------------ | -------------------------------------------------- |
| `/login`     | Вхід (без лейауту)                                 |
| `/register`  | Реєстрація (без лейауту)                            |
| `/chat`      | Захищено: `ProtectedRoute → MainLayout → ChatPage` |
| `*`          | Будь-що інше → редирект на `/chat`                  |

## Архітектура

Шарова структура: **UI** (сторінки + компоненти) → **логіка**
(контексти `Auth`/`Socket`, хуки `useAuth`/`useSocket`) → **інфраструктура**
(`ApiClient` поверх axios + екземпляр socket.io-client).

## Патерни

- **Facade** — [`src/api/ApiClient.ts`](src/api/ApiClient.ts): єдиний клас із
  модулями `apiClient.auth.*` та `apiClient.files.*`. Request-interceptor
  автоматично додає JWT з `localStorage` до кожного запиту; response-interceptor
  на `401` (поза `/auth/*`) чистить токен і робить редирект на `/login`.
- **Observer** — [`src/contexts/SocketProvider.tsx`](src/contexts/SocketProvider.tsx)
  керує життєвим циклом сокета (екземпляр у `useState`, перестворюється при зміні
  токена), а [`ChatPage`](src/pages/ChatPage.tsx) підписується через `socket.on(...)`
  на події сервера і знімає підписки при розмонтуванні.

## Автентифікація

- JWT зберігається в `localStorage` під ключем `chat_access_token`
  ([`src/constants.ts`](src/constants.ts)).
- Ім'я користувача не зберігається окремо — деривується з payload токена
  ([`AuthProvider`](src/contexts/AuthProvider.tsx)), тож JWT є єдиним джерелом істини.
- `ProtectedRoute` пускає на `/chat` лише за наявності токена (без запиту до сервера).

## Контракт з бекендом

Код узгоджений із **реальним** API сервера.

**REST:**

- `POST /auth/login`, `POST /auth/register` → `{ access_token }`
- `POST /files/upload` (multipart, поле `file`) → `{ filename, originalName, mimetype, ... }`
- `GET /files/:filename` — захищено JWT. Тому файли тягнуться через axios як
  `blob` і показуються/завантажуються через `objectURL` (а не прямим `<img src>`).

**WebSocket (Socket.IO):**

- Підключення з токеном у handshake: `io(url, { auth: { token } })`
- `emit('sendMessage', { content })`
- `on('history')` → масив `{ id, content, author: { username }, createdAt }`
- `on('newMessage')` → один такий самий об'єкт (дублікати фільтруються за `id`)
- `on('fileUploaded')` → `{ id, filename, originalName, mimetype, owner, messageId, createdAt }`
- `on('userJoined' | 'userLeft')` → `{ username }` (показ службового повідомлення)

Файлові повідомлення сервер шле як текст виду `[Файл] назва (/files/ім'я)`;
`ChatPage.normalizeMessage` розпізнає цей формат і прикріплює метадані файлу
(MIME-тип для історії визначається за розширенням через `guessMimeType`).
