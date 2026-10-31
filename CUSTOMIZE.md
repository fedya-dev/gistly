# Персонализация на Gistly — къде се какво сменя

Кратък указател на основните места в кода, които обикновено се променят при
собствена инсталация. Пътищата са спрямо корена на проекта. След промени по
код: `git add … && git commit && git push` на твоята машина, а на сървъра
`git pull && ./deploy.sh` (Docker билдва наново и пуска новата версия).

---

## Бърза справочна таблица

| Какво искаш да смениш | Файл | Конкретно |
| --- | --- | --- |
| Заглавие в браузъра / SEO описание | `src/app/layout.tsx` | `metadata` — `title`, `description`, `openGraph`, `keywords` |
| Лого иконката | `src/components/logo.tsx` | SVG-ът в `LogoMark` (градиента е в `<linearGradient>`) |
| Хедър: лого текст, бутони, GitHub иконка | `src/components/app-header.tsx` | Менюто навигация + бутоните вдясно |
| Футър: линкове GitHub / fedia.eu | `src/components/app-footer.tsx` | Двата линка; самите адреси — виж `src/lib/site.ts` |
| GitHub адрес, автор, fedia.eu | `src/lib/site.ts` | `GITHUB_REPO_URL`, `GITHUB_REPO_LABEL`, `AUTHOR_URL`, `AUTHOR_LABEL` |
| Всички надписи (EN и BG) | `src/lib/i18n-dicts.ts` | Два обекта с преводи; всеки ред е `ключ: текст` |
| Цветове / акцент (лилавото) | `src/app/globals.css` | `--primary` (и останалите променливи) — два пъти: светла (`:root`, ~ред 54) и тъмна (`.dark`, ~ред 88), формат oklch |
| Тема по подразбиране (тъмна/светла) | `src/components/providers.tsx` | `defaultTheme="dark"` в `ThemeProvider` |
| Начална страница (hero заглавие и подзаглавие) | `src/components/views/home-view.tsx` | Текстовете идват от i18n (`home.*`), оформлението е тук |
| Картите на гистове в списъка | `src/components/gist-card.tsx` | Изглед, баджове, брояч на прегледи |
| Страница на гиста (бутони Копирай линк / Изтегли / Изтрий) | `src/components/views/gist-view.tsx` | Панелът с действия + метаданни |
| Код блоковете (номера на редове, wrap, копирай) | `src/components/code-view.tsx` | Shiki темите са GitHub Light/Dark в `highlight()` |
| Markdown преглед | `src/components/markdown-view.tsx` | remark/rehype плъгини и стилове |
| Формата за нов/редакция на гист | `src/components/views/gist-form-view.tsx` | Полета, валидации, видимост |
| Статистика (Insights) | `src/components/views/stats-view.tsx` + `src/app/api/stats/route.ts` | Изгледът + данните (топ тагове, heatmap) |
| Командната палитра (Ctrl+K) | `src/components/command-palette.tsx` | Командите и търсенето |
| Маршрути (URL-та) | `src/lib/use-route.ts` | Параметрите `?g=`, `?stats=1`, `?new=1` и навигацията |
| Поддържани езици за оцветяване | `src/lib/languages.ts` | `EXT_MAP` (разширение → език) и цветове |
| Копиране в клипборда | `src/lib/clipboard.ts` | Една функция с fallback за HTTP (не-HTTPS) среди |
| База данни (модели, полета) | `prisma/schema.prisma` | Промяна → рестарт прилага `prisma db push` (виж долу) |
| APIEndpoint-и и лимити | `src/app/api/**/route.ts`, `src/lib/api-helpers.ts` | `rateLimit(ключ, лимит, прозорец)` във всеки route |
| Порт, рестарт, volume | `docker-compose.yml` | `PORT`, `restart`, томът `gistly_data:/app/db` |
| Docker образ (Node/Bun слой) | `Dockerfile` | Multistage билд; рядко се пипа |
| Домейн / HTTPS | `Caddyfile` | Домейнът в началото; Caddy дава безплатен TLS |
| Парола и сесиен ключ | `.env` (на сървъра) | `ADMIN_PASSWORD`, `AUTH_SECRET` |

---

## Три най-чести промени, стъпка по стъпка

### 1. Смяна на името „Gistly" с твоето

1. `src/app/layout.tsx` — `title`, `applicationName`, `openGraph.title`.
2. `src/components/app-header.tsx` — текстът до логото.
3. `src/lib/i18n-dicts.ts` — редове с „Gistly" в преводите (aria-надписи).
4. `README.md`, `public/robots.txt`, `Caddyfile` (коментарите) — по желание.

Бърза проверка, че нищо не е останало: `grep -rn "Gistly" src/ public/`.

### 2. Смяна на акцентния цвят (по подразбиране лилаво)

Отвори `src/app/globals.css` и смени `--primary` на двете места (светла и
тъмна тема). Стойностите са в oklch; примери:

- Лилаво (текущо): `oklch(0.541 0.247 293.009)`
- Синьо: `oklch(0.55 0.20 260)`
- Зелено: `oklch(0.55 0.17 155)`

Градиеентът на логото е отделно — в `src/components/logo.tsx`
(`<stop stopColor="#a78bfa" />` и `#7c3aed`), а лентите в Статистика ползват
Tailwind класове (`violet-500`, `fuchsia-500`) директно в
`src/components/views/stats-view.tsx`.

### 3. Смяна на линковете във футъра и хедъра

Адресите са централно в `src/lib/site.ts`:

```ts
export const GITHUB_REPO_URL = 'https://github.com/fedya-dev/gistly'
export const AUTHOR_URL = 'https://fedia.eu/'
export const AUTHOR_LABEL = 'fedia.eu'
```

Смени ги там — хедър, футър и командната палитра взимат от едно и също място.

---

## База данни и schema промени

1. Редактирай `prisma/schema.prisma`.
2. Локално: `bun run db:push` (или `bunx prisma db push`).
3. В Docker: при рестарт entrypoint-ът изпълнява `prisma db push` автоматично,
   т.е. `./deploy.sh` след pull е достатъчен. Внимание: SQLite е файлова база —
   за тежки промени направи backup първо: `docker cp gistly:/app/db/gistly.db backup.db`.

## Dev режим (без Docker)

```bash
bun install
cp .env.example .env        # ако няма .env
bun run db:push
bun dev                     # http://localhost:3000, логовете в dev.log
```

## Проверка след промяна

- `bun run lint` — стил/грешки
- `bunx tsc -p tsconfig.json --noEmit` — типове (build-ът **не** спира при type грешки, затова си струва да се пуска ръчно)
- `bun run build` — пълнен production билд
