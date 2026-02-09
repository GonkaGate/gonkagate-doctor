# Product Requirements Document - gonka-proxy

**Author:** Danii
**Date:** 2025-12-10

## Executive Summary

gonka-proxy is the **fiat gateway to decentralized AI compute** — providing AI agencies seamless access to the Gonka GPU network through an OpenAI-compatible API. No cryptocurrency knowledge required, no wallet management, no blockchain complexity.

**The Economics Are Transformative:**
Agencies currently earning 33% margin (paying $0.15, charging $0.10/1M tokens) can achieve **96% margin** with gonka-proxy's $0.004 base cost at identical client rates. This isn't competing on price—it's operating in a fundamentally different economic league.

**Target Segment:** Chatbot and AI automation agencies who build solutions with continuous API consumption and resell compute to their clients.

### What Makes This Special

**Strategic Moat:**

1. **Only fiat gateway to Gonka network** — First-mover bridging traditional business payments to decentralized AI compute, with 12-18 month head start before competitors can achieve token cost parity
2. **Miner-founder token advantage** — Access at $1.5 cost basis (vs $3-4 OTC) enables aggressive pricing with healthy margins

**Network-Level Stability:** 3. **Dynamic per-model pricing** — Gonka network adjusts pricing based on utilization (40-60% stability zone), with max 2% change per block preventing sudden cost spikes 4. **Price floor guarantee** — Network minimum of 1 nicoin per token ensures predictable cost baseline

**Zero-Friction Adoption:** 5. **Simplicity value** — Fiat billing + API key management eliminate crypto complexity for agencies 6. **Drop-in replacement** — Change one line (base URL), everything else identical to OpenAI

## Project Classification

**Technical Type:** api_backend
**Domain:** general
**Complexity:** low
**Project Context:** Greenfield - new project

Backend API service proxying requests to decentralized GPU infrastructure, handling authentication and billing. Technical complexity is low (standard REST patterns), business value comes from unique economic positioning and exclusive network access.

## Success Criteria

### User Success

**Activation Metric:**

- Primary: User migrates 100% of their API traffic to gonka-proxy
- Leading indicator: First successful API call within 24h of signup
- Validation: User sees cost comparison in dashboard showing savings

**Aha Moment:**

- First invoice/dashboard view showing 10x+ savings vs market rates
- Realization of independence from centralized providers

**Retention Metric:**

- Primary: User remains active (>1 API call/day) after 30 days
- Churn signal: No activity for 14+ days
- **Churn target: Monthly churn <10%**

**Emotional Success:**

- Decentralization: Freedom from Big Tech AI provider lock-in
- Independence: Own their AI infrastructure economics
- Open source alignment: Supporting decentralized, transparent AI future
- Simplicity: "I just changed the base URL and everything works"

### Business Success

**Growth Objectives:**

| Timeframe     | Goal                  | Metric                                       |
| ------------- | --------------------- | -------------------------------------------- |
| MVP (Month 1) | Prove the model works | 5 external active users + founder's pipeline |
| 3 Months      | Early traction        | 100 active users                             |
| 12 Months     | Scale                 | 1,000 active users                           |

**Priority Phases:**

- Phase 1 (0-100 users): User count > Volume — focus on acquisition and validation
- Phase 2 (100+ users): Volume/Revenue optimization — focus on unit economics

**Acquisition Strategy (Month 1):**

- Primary: Direct outreach in n8n community, AI automation Telegram groups
- Secondary: Personal network referrals
- Target: At least 1 user acquired through community outreach (not founder's network)

**Financial Targets:**

| KPI           | 3 Months | 12 Months |
| ------------- | -------- | --------- |
| MRR           | $500     | $10,000   |
| Gross margin  | >80%     | >75%      |
| CAC           | <$10     | <$20      |
| Monthly churn | <10%     | <5%       |

**Secondary Goal:**

- Contribute to Gonka network visibility and adoption
- Post-MVP: Referral program linking gonka-proxy users to Gonka ecosystem

### Technical Success

**MVP Technical Requirements:**

- **Uptime:** >95% availability (MVP target — 36h max downtime/month)
- **Error rate:** <1% 5xx errors
- **Request timeout:** 60s max wait for Gonka network response
- **Correctness:** API endpoint responds correctly to OpenAI-format requests
- **Model coverage:** At least 3 Gonka models accessible through proxy
- **Core functionality:** Signup → API key → requests → balance tracking works accurately
- **Zero critical bugs** in production during Week 1

**Post-MVP Technical Goals (V1.1):**

- **Uptime:** Path to 99%+ (7h max downtime/month)
- Latency optimization (network provides baseline, proxy adds minimal overhead)
- Horizontal scaling for concurrent users
- Rate limiting per user
- Dashboard with cost comparison vs market rates

### Measurable Outcomes

**Week 1 Success:**

- [ ] Founder's news pipeline migrated and running on gonka-proxy
- [ ] 0 critical bugs in production
- [ ] Core flow works: signup → API key → request → balance deduction

**Month 1 Success:**

- [ ] 5 external active users acquired
- [ ] > 95% uptime achieved
- [ ] At least 1 user acquired through community outreach (n8n/Telegram)

**MVP Validation Signals:**

- Users increase usage after first week (not just try once and leave)
- At least 1 user asks "when can I pay with card?" (demand signal)
- No users churn due to missing models (model coverage sufficient)

## Product Scope

### MVP - Minimum Viable Product

**Core Features (Must Have):**

1. **OpenAI-Compatible API**
   - POST /v1/chat/completions endpoint
   - Standard request/response format identical to OpenAI
   - Support for all models available in Gonka network
   - Streaming support (SSE)
   - 60s request timeout

2. **User Management**
   - Email + password signup
   - API key generation and management
   - Secure key storage and validation

3. **Gonka Network Integration**
   - Proxy requests to Gonka SDK
   - Handle wallet/key management server-side
   - Pass through all available Gonka models

4. **Prepaid Balance System**
   - User balance in USD equivalent
   - Token usage tracking and deduction
   - Manual top-up process (bank transfer, crypto, manual)
   - Balance visibility in dashboard

5. **Basic Dashboard**
   - Current balance display
   - Usage statistics (requests, tokens, cost)
   - API key management

### Growth Features (Post-MVP)

**V1.1 (Month 2-3):**

- **Self-service payment flow** (Stripe) to eliminate manual top-ups
- Dashboard cost comparison vs market rates ("You saved $X")
- Usage alerts and spending limits
- Referral program with tracking
- Rate limiting per user
- Path to 99% uptime

**V1.2:**

- Queue-based request handling for network issues
- Multiple API keys per user

### Vision (Future)

**V2.0 (Month 4-6):**

- Sub-accounts for agencies
- Team management (multiple users per org)
- White-label API (custom domains)
- Invoicing for business customers

**Long-term:**

- Price guarantee mode (queue until price drops)
- Automatic failover with retry logic
- Plugins for n8n, Make, Zapier
- Enterprise tier with SLA guarantees
- Expand to other decentralized compute networks

**Vision Statement:**
Become the **Stripe of decentralized AI** — the default payment and access layer between traditional businesses and open AI infrastructure. Every agency, every indie hacker, every enterprise accesses decentralized compute through gonka-proxy without knowing what a blockchain is.

## User Journeys

### Journey 1: Alex — From Margin Squeeze to Workflow Empire

Alex создаёт и продаёт AI-powered автоматизации для малого бизнеса. Его YouTube-канал растёт, Telegram-комьюнити активно, но есть проблема — некоторые его workflows становятся убыточными при масштабе. Клиенты платят фикс $50/месяц за автоматизацию, а inference costs съедают $60+.

Однажды в Telegram-чате по n8n кто-то упоминает gonka-proxy: "Я сократил costs на AI в 10 раз, просто поменял base URL". Alex скептичен, но регистрируется — email, пароль, 2 минуты. Получает API key и видит dashboard с балансом.

Он открывает свой самый "токсичный" workflow — бот для анализа отзывов клиентов. Меняет одну строку: `baseURL: https://api.gonka-proxy.com/v1`. Запускает тест. Работает. Смотрит на dashboard — видит свой cost и сравнение: "Market rate: $0.15/1M tokens. Your rate: $0.01/1M tokens." Aha moment — экономия в 15 раз.

Через неделю Alex мигрирует все workflows. Через месяц записывает YouTube видео: "How I Cut AI Costs 10x Without Changing My Code". Видео набирает 50K просмотров. Три человека из комментариев регистрируются в тот же день.

**Requirements revealed:** Signup flow, API key generation, OpenAI-compatible endpoint, usage dashboard, static cost comparison display (market rate vs your rate)

---

### Journey 2: Danii — The Builder Who Became the Product

Danii запускает автоматизированный новостной сайт. LLM-пайплайн собирает источники, генерирует статьи, публикует контент 24/7. Система работает, но счета от API провайдеров растут быстрее чем доход от рекламы. Каждый день — тысячи токенов, каждый месяц — сотни долларов.

Он знает про Gonka — сам майнит. Видит цены в сети: $0.004 за 1M токенов против $0.15 у OpenRouter. Разница в 37 раз. Но чтобы использовать сеть напрямую, нужно возиться с кошельками, подписывать транзакции, мониторить балансы в nicoins. Для production pipeline это overhead, который не хочется тащить.

И тут приходит идея: "А что если сделать прокси? OpenAI-совместимый API, который скрывает всю крипто-сложность". Danii строит MVP за несколько недель. Меняет base URL в своём пайплайне. Первый день — всё работает. Первая неделя — costs падают на 90%. Первый месяц — экономия покрывает хостинг с запасом.

Но настоящий момент истины — когда знакомый из n8n-комьюнити спрашивает: "Как ты так дёшево inference делаешь?" Danii даёт ему доступ. Потом ещё одному. Потом понимает: это не просто внутренний инструмент — это продукт.

**Requirements revealed:** Server-side wallet management, transparent Gonka integration, production-grade reliability, simple onboarding for referrals

---

### Journey 3: Mikhail — CTO Who Finally Fixed the Margin Problem

Mikhail руководит техническим отделом в AI-агентстве "AutomateIt" — 15 человек, 30 активных клиентов, chatbots и AI assistants для e-commerce. Каждый месяц он смотрит на P&L и морщится: inference costs съедают 60% выручки от AI-проектов. Клиенты платят $0.20 за 1M токенов, агентство платит провайдерам $0.15. Маржа — жалкие 25%.

На очередном созвоне CEO спрашивает: "Почему мы не можем снизить цены и выиграть больше тендеров?" Mikhail объясняет: "При текущих costs мы уйдём в минус". Он уже пробовал всех — OpenRouter, Together AI, Fireworks. Разница в копейках.

В LinkedIn ему попадается пост от знакомого n8n-автоматизатора: "Switched to gonka-proxy, margins went from 30% to 85%". Mikhail думает это clickbait, но всё равно кликает. OpenAI-compatible API, fiat payments, обычные invoices для бухгалтерии. Никакого крипто.

Он регистрируется, получает API key, тестирует на внутреннем проекте. Dashboard показывает: "Your rate: $0.02/1M tokens. Market rate: $0.15/1M tokens." Mikhail пересчитывает: при тех же клиентских ценах маржа вырастает до 90%.

**MVP Reality:** Для первого пополнения Mikhail делает bank transfer и пишет в support. Через час баланс на месте. Не идеально, но для pilot проекта — приемлемо. Он понимает что Stripe будет позже, и готов подождать ради такой экономии.

Через месяц AutomateIt выигрывает три тендера подряд, предложив цены ниже конкурентов. Через квартал Mikhail приходит на созвон с CEO уже с другими цифрами: "AI-направление теперь самое прибыльное в компании". К тому времени self-service payments уже работают.

**Requirements revealed:** Clear pricing display, static cost comparison, manual payment flow (MVP), invoicing for accounting (V1.1), usage tracking per organization (future)

---

### Journey 4: Danii as Admin — Running the Machine

Утро понедельника. Danii открывает admin dashboard gonka-proxy перед тем как заняться своими проектами. Три новых регистрации за выходные — двое из n8n Telegram, один по рефералу от Alex.

Один из новых пользователей написал в support: "Пополнил баланс, но не вижу credits". Danii проверяет — банковский перевод пришёл, но manual top-up ещё не обработан. Два клика: находит пользователя, добавляет $50 на баланс, отправляет confirmation email. Время: 2 минуты.

Следующая задача — мониторинг. Danii смотрит на метрики за неделю: 2.3M токенов обработано, error rate 0.3%, средний response time в норме (сеть обеспечивает). Один пользователь израсходовал 80% баланса — стоит напомнить о пополнении. Отправляет quick email.

Раз в неделю — финансовый чек. Сколько токенов потрачено в Gonka сети, сколько получено от пользователей, какая маржа. Пока всё вручную в spreadsheet, но цифры радуют: gross margin 82%.

В конце месяца — подготовка простого отчёта для себя: сколько пользователей, retention, MRR. Пять активных пользователей, все продолжают использовать, $127 MRR. MVP работает.

**Requirements revealed:** Admin dashboard, user management, manual balance adjustment, usage metrics, error monitoring, financial tracking

---

### Journey 5: Danii as Support — When Things Go Wrong

Среда, 11 вечера. Telegram notification: "API returns 500 error, my workflow is down". Пишет Alex — его самый активный workflow перестал работать.

_Note: В MVP founder = support. Это temporary reality, не sustainable long-term. При росте — нужны async support channels и SLA expectations._

Danii открывает логи. Видит: последние 15 минут — серия 500 ошибок от Gonka сети. Не proxy, а сама сеть. Проверяет Gonka status page — действительно, один из популярных miners offline. Сеть перебалансируется на других miners, но это занимает время.

Быстрый ответ Alex'у: "Gonka network issue, miners rebalancing, should be back in 10-15 min. Monitoring." Alex успокаивается — хотя бы понятно что происходит и что это не его проблема.

Через 12 минут сеть стабилизируется. Danii проверяет: requests снова проходят. Пишет Alex'у: "Back online, verified". Alex отвечает emoji с поднятым пальцем.

На следующий день — другой кейс. Новый пользователь жалуется: "Model 'gpt-4' not found". Danii объясняет: gonka-proxy работает с open-source моделями из Gonka сети — llama, mistral, qwen. gpt-4 — проприетарная модель OpenAI, её в децентрализованной сети нет. Высылает список доступных моделей и гайд по выбору альтернатив. Пользователь переключается на llama-70b, доволен результатом.

Третий тип запроса — "Как посмотреть сколько токенов я потратил?" Danii понимает: нужен FAQ или onboarding guide. Записывает в backlog: "V1.1 — добавить docs/FAQ section".

**Requirements revealed:** Error logging, network status visibility, model documentation, FAQ/help content, clear error messages

---

### Journey 6: Sergei — Developer Integrating Into His SaaS

Sergei — backend developer в стартапе, который строит SaaS для автоматизации customer support. Их продукт использует LLM для генерации ответов на тикеты. Сейчас они на OpenAI API, но unit economics не сходятся: каждый клиент генерирует убыток на inference.

CTO скидывает ему ссылку: "Посмотри, может сработает для нас". Sergei открывает gonka-proxy docs. Первое что видит: "OpenAI-compatible API". Значит, не нужно переписывать код — только поменять endpoint.

Он создаёт аккаунт, получает API key. В documentation section находит страницу "Available Models" — таблица с названиями моделей, их capabilities, и маппинг на OpenAI equivalents. Открывает свой код, меняет `base_url` на `https://api.gonka-proxy.com/v1`. Запускает тесты. 47 из 48 проходят. Один падает — используется `gpt-4-turbo`, которого нет в Gonka. По таблице выбирает `llama-3.1-70b-instruct` как замену. Прогоняет A/B тест качества ответов — разница минимальна, клиенты не заметят.

Деплоит на staging. Неделя тестов с реальным трафиком. Response times сопоставимы, качество ответов держится, costs падают в 12 раз. Sergei готовит PR для production.

На code review коллега спрашивает: "А если их сервис упадёт?" Sergei показывает: "Fallback на OpenAI в 3 строки — если gonka-proxy вернёт 5xx три раза подряд, переключаемся". API возвращает predictable error codes, что делает fallback logic простым.

Через месяц после миграции CFO на all-hands показывает график: "Inference costs -89%, при том же качестве". Sergei получает благодарность в Slack.

**Requirements revealed:** API documentation, model list with capabilities and OpenAI mapping, code examples, predictable error responses for fallback logic, staging-friendly testing

---

### Journey 7: Edge Case — Balance Exhaustion Mid-Request

_This is not a persona journey but a critical failure scenario that affects all users._

Alex запускает длинный workflow с streaming response. На середине ответа его баланс достигает нуля. Что происходит?

**Expected behavior:**

- API возвращает clear error: `402 Payment Required` с message "Insufficient balance. Please top up to continue."
- Partial response сохраняется (если streaming) — пользователь не теряет уже полученные данные
- Dashboard показывает причину: "Request interrupted: balance exhausted"

**Recovery path:**

- Alex видит notification в dashboard о нулевом балансе
- Пополняет баланс (manual в MVP, Stripe в V1.1)
- Повторяет запрос — работает

**Requirements revealed:** Graceful handling of balance exhaustion, clear 402 error response, balance warnings before exhaustion (V1.1)

---

### Journey Requirements Summary

| Capability Area                 | Revealed By Journeys       | MVP Priority    |
| ------------------------------- | -------------------------- | --------------- |
| **OpenAI-Compatible API**       | All journeys               | Must Have       |
| **Signup & API Key Generation** | Alex, Mikhail, Sergei      | Must Have       |
| **Usage Dashboard**             | Alex, Mikhail, Danii Admin | Must Have       |
| **Static Cost Comparison**      | Alex, Mikhail (Aha moment) | Must Have       |
| **Balance Management**          | Danii Admin                | Must Have       |
| **Admin User Management**       | Danii Admin                | Must Have       |
| **Error Logging & Monitoring**  | Danii Support              | Must Have       |
| **Model Documentation**         | Sergei, Danii Support      | Must Have       |
| **Available Models Page**       | Sergei                     | Must Have       |
| **Streaming Support (SSE)**     | Alex, Sergei               | Must Have       |
| **Clear Error Messages**        | All journeys               | Must Have       |
| **Predictable Error Codes**     | Sergei (fallback logic)    | Must Have       |
| **402 Balance Exhaustion**      | Edge Case Journey          | Must Have       |
| **Fiat Invoicing**              | Mikhail                    | Post-MVP (V1.1) |
| **Self-Service Payments**       | Mikhail                    | Post-MVP (V1.1) |
| **FAQ/Help Section**            | Danii Support              | Post-MVP (V1.1) |
| **Usage Alerts**                | Danii Admin, Edge Case     | Post-MVP (V1.1) |
| **Per-Organization Tracking**   | Mikhail                    | Post-MVP (V2.0) |

### Error States (UX Requirements)

| Error Scenario            | HTTP Code | User-Facing Message                                           |
| ------------------------- | --------- | ------------------------------------------------------------- |
| Invalid API Key           | 401       | "Invalid API key. Check your key in dashboard."               |
| Zero/Insufficient Balance | 402       | "Insufficient balance. Please top up to continue."            |
| Unsupported Model         | 400       | "Model not available. See /docs/models for supported models." |
| Network Error (Gonka)     | 503       | "Network temporarily unavailable. Retry in a moment."         |
| Rate Limit (future)       | 429       | "Rate limit exceeded. Slow down requests."                    |

### Future Consideration: Cold Discovery Journey

_Not MVP scope, but noted for growth phase._

How do users discover gonka-proxy without community referral? SEO for "cheap LLM API", "affordable AI inference", "OpenAI alternative pricing" — potential acquisition channel for Phase 2.

## API Backend Specific Requirements

### Project-Type Overview

gonka-proxy is an **api_backend** product — a REST API service that proxies requests to the Gonka decentralized GPU network while handling authentication, billing, and reliability. The API follows OpenAI compatibility standards to enable drop-in replacement for existing integrations.

### API Endpoint Specification

**MVP Endpoint:**

| Method | Endpoint               | Description                                 |
| ------ | ---------------------- | ------------------------------------------- |
| POST   | `/v1/chat/completions` | Chat completion request (OpenAI-compatible) |

**Request Format:**

```json
{
  "model": "llama-3.1-70b-instruct",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "Hello!" }
  ],
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 1000
}
```

**Response Format:**

- Non-streaming: Standard OpenAI JSON response with `usage` field
- Streaming: Server-Sent Events (SSE) with `data: {...}` chunks, final chunk includes `usage`

**Supported Parameters:**

- `model` (required): Model identifier from Gonka network
- `messages` (required): Array of message objects
- `stream` (optional): Boolean for SSE streaming
- `temperature`, `max_tokens`, `top_p`, etc.: Pass-through to Gonka

### Authentication Model

**Method:** Bearer Token Authentication

```
Authorization: Bearer gp-xxxxxxxxxxxxxxxxxxxx
```

**API Key Format:**

- Prefix: `gp-` (gonka-proxy identifier)
- Length: 32+ characters
- Storage: Hashed in database, shown once on creation

**Authentication Flow:**

1. User registers via dashboard → receives API key
2. API key included in every request header
3. Proxy validates key, checks balance, routes to Gonka
4. Invalid key → 401 Unauthorized

**Security Considerations:**

- Keys hashed with bcrypt/argon2 at rest
- HTTPS required for all API traffic
- Key regeneration available in dashboard

### Data Schemas

**Request Validation:**

- JSON body required
- `model` and `messages` fields mandatory
- Unknown fields: pass-through to Gonka (flexibility)

**Response Schema:**

- Follows OpenAI response format exactly
- `usage` field in final response/chunk includes token counts and cost

**Usage Field (OpenAI-compatible + cost extension):**

```json
{
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 150,
    "total_tokens": 175,
    "cost_usd": 0.000035
  }
}
```

**Error Response Schema:**

```json
{
  "error": {
    "message": "Human-readable error description",
    "type": "invalid_request_error | authentication_error | rate_limit_error | server_error",
    "code": "specific_error_code"
  }
}
```

### Error Codes

| HTTP Code | Type                  | Code                 | Description                           |
| --------- | --------------------- | -------------------- | ------------------------------------- |
| 400       | invalid_request_error | invalid_model        | Model not available in Gonka network  |
| 400       | invalid_request_error | invalid_request      | Malformed request body                |
| 401       | authentication_error  | invalid_api_key      | API key invalid or missing            |
| 402       | payment_required      | insufficient_balance | User balance below minimum threshold  |
| 429       | rate_limit_error      | rate_limit_exceeded  | Too many requests (post-MVP)          |
| 500       | server_error          | internal_error       | Proxy internal error                  |
| 503       | server_error          | network_unavailable  | Gonka network temporarily unavailable |

### Rate Limits

**MVP:** No rate limiting — trust users, monitor for abuse manually.

**Post-MVP (V1.1):**

- Per-user rate limits configurable
- Default: 60 requests/minute, 1000 requests/hour
- Burst allowance for streaming connections
- 429 response with `Retry-After` header

### API Versioning

**Current:** `/v1/` path prefix

**Strategy:**

- v1 is the initial and current version
- No immediate plans for v2
- If breaking changes needed in future: new version path (`/v2/`)
- Old versions maintained for reasonable deprecation period

### SDK Requirements

**MVP:** No SDK needed.

**Rationale:**

- Users already have OpenAI SDK/libraries (Python, Node, etc.)
- Drop-in replacement: change `base_url` only
- SDK would add maintenance burden without significant value

**Future consideration:** If demand emerges for gonka-proxy-specific features (balance checking, usage stats via API), consider lightweight SDK wrapper.

### Balance Management

**Pre-Request Check (Pessimistic Strategy):**

- Require minimum balance threshold before accepting request
- Minimum threshold: $0.001 (configurable)
- If balance < threshold → 402 Payment Required immediately
- Prevents starting requests that cannot complete

**Mid-Stream Balance Exhaustion:**

- If balance exhausts during streaming response: **complete current response**
- Deduct actual tokens used (may result in small negative balance)
- Block subsequent requests until balance topped up
- Rationale: Better UX than cutting off mid-response

**Balance Deduction Timing:**

- Deduct after response completion (accurate count)
- For streaming: deduct after final chunk sent
- Track pending requests to prevent race conditions

### Edge Cases & Error Recovery

**Model Unavailable Mid-Request:**

- If Gonka miner goes offline during request processing
- Behavior: Return 503 with clear error message
- No charge for failed requests
- Client should implement retry logic

**Concurrent Requests Exceeding Balance:**

- Multiple parallel requests from same user
- Strategy: First-come-first-served with balance reservation
- Each request reserves estimated cost (based on max_tokens or default)
- If total reservations > balance: later requests get 402
- Actual deduction replaces reservation on completion

**Network Glitch & Retry (Idempotency):**

- No built-in idempotency keys in MVP
- If client retries due to network timeout: may result in double execution
- Mitigation: Clear timeout messaging, encourage client-side idempotency
- Post-MVP: Consider `Idempotency-Key` header support

**Partial Response on Error:**

- If error occurs after partial streaming response sent
- Behavior: Send error chunk, close stream
- Charge only for tokens actually generated
- Log incident for monitoring

**Gonka Network Timeout:**

- If Gonka doesn't respond within 55s
- Return 503 with message: "Network request timed out. Please retry."
- No charge for timed-out requests

### Implementation Considerations

**Request Flow:**

1. Receive request → Validate API key
2. Check user balance ≥ minimum threshold → 402 if insufficient
3. Reserve estimated cost (for concurrent request handling)
4. Transform request for Gonka SDK (if needed)
5. Proxy to Gonka network → Handle response
6. Calculate actual token usage and cost
7. Replace reservation with actual deduction
8. Return response with `usage` field to user

**Timeout Handling:**

- Client timeout: 60s max
- Gonka network timeout: 55s (buffer for response formatting)
- Streaming: Keep-alive every 15s

**Concurrency:**

- Async request handling
- No artificial concurrency limits in MVP
- Connection pooling to Gonka network
- Balance reservation system for parallel requests

**Logging:**

- Request metadata (user, model, tokens, latency, cost)
- No logging of request/response content (privacy)
- Error logging with stack traces for debugging
- Failed request logging for billing reconciliation

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Revenue MVP + Problem-Solving Hybrid

- Solve the core problem (crypto complexity) with minimal features
- Generate revenue from day one (even with manual payments)
- Validate market demand before investing in automation

**Key MVP Principles Applied:**

1. **Viability first** — MVP must allow users to complete entire task independently
2. **Soft launch** — Start with small group (founder + 5 pilot users), gather feedback
3. **Analytics from day one** — Track usage, errors, costs for data-driven decisions
4. **Validate before building** — Each phase unlocks based on validation signals

**Resource Requirements:**

- Team: Solo founder (Danii)
- Timeline: 6-8 weeks for MVP (aligns with simple MVP benchmarks)
- Infrastructure: Single server deployment initially

**Scope Assessment:** Simple MVP — focused product, clear value prop, low technical complexity

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**

- ✅ Journey 1 (Alex): n8n creator discovers, integrates, saves costs
- ✅ Journey 2 (Danii): Founder uses own product in production
- ✅ Journey 6 (Sergei): Developer integrates into SaaS

**Journeys Partially Supported (Pilot Users Accept Friction):**

- ⚠️ Journey 3 (Mikhail): Pilot agency CTO, accepts manual payment for 37x savings
- ⚠️ Journey 4 (Admin): Manual processes acceptable at <10 users
- ⚠️ Journey 5 (Support): Founder handles directly

**Must-Have Capabilities (MVP):**

| Capability                   | Justification                        | Viability Check                          |
| ---------------------------- | ------------------------------------ | ---------------------------------------- |
| POST /v1/chat/completions    | Core product value                   | Without this = no product                |
| OpenAI-compatible format     | Drop-in replacement promise          | Without this = no differentiation        |
| Streaming (SSE)              | Required for chat/workflow use cases | Without this = broken use cases          |
| API key auth                 | Security baseline                    | Without this = unusable                  |
| Balance tracking & deduction | Usage-based billing core             | Without this = no revenue model          |
| Dashboard: API key display   | User must see their key              | Without this = support ticket per user   |
| Dashboard: Balance display   | User must know their balance         | Without this = constant "how much left?" |
| Manual top-up flow           | Revenue path                         | Without this = no business               |

**MVP Dashboard (Minimum Viable):**

- API key display (show once, regenerate option)
- Current balance display
- _Usage stats — can be Week 2 addition_
- _Cost comparison — can be Week 2 addition_

**Documentation (MVP):**

- Available models list (can be README/external doc initially)
- Quick start guide (can be README)
- Error codes reference (inline in error messages)

**Explicitly Out of MVP:**

| Feature           | Reason                                | When |
| ----------------- | ------------------------------------- | ---- |
| Stripe payments   | Adds 2+ weeks, manual works for pilot | V1.1 |
| Rate limiting     | Trust pilot users                     | V1.1 |
| Usage alerts      | Nice-to-have                          | V1.1 |
| In-dashboard docs | External docs sufficient              | V1.1 |
| Multiple API keys | Single key sufficient for pilot       | V1.2 |
| Sub-accounts      | Need agencies first                   | V2.0 |

### Soft Launch Strategy

**Week 1-2: Founder Dogfooding**

- Danii's news pipeline as first production user
- Fix critical bugs, validate core flow
- Success: Pipeline runs 24/7 without intervention

**Week 3-4: Pilot Users (3-5 people)**

- Invite from n8n community / personal network
- Manual onboarding, direct support channel
- Gather feedback on: setup friction, missing features, error clarity
- Success: At least 3 users make >100 requests

**Week 5+: Soft Public Launch**

- Open signups (still manual payment)
- Community outreach (n8n Telegram, AI automation groups)
- Success: 5 external active users

### Fallback Scope (If Needed)

**If timeline pressure — cut in this order:**

1. ~~Usage statistics in dashboard~~ → Add Week 2
2. ~~Cost comparison display~~ → Add Week 2
3. ~~In-app documentation~~ → Use external README/Notion
4. ~~Email notifications~~ → Manual outreach

**Never cut (viability requirements):**

- API endpoint functionality
- API key generation & display
- Balance display & deduction
- Authentication

### Post-MVP Features

**Phase 2: Remove Friction (V1.1 — Month 2-3)**

_Trigger: 5+ active users, at least 1 asks "when can I pay with card?"_

- Self-service payments (Stripe)
- Usage statistics dashboard
- Cost comparison ("You saved $X")
- Usage alerts (low balance warning)
- Rate limiting
- In-app documentation

**Phase 3: Scale (V1.2 — Month 3-4)**

_Trigger: 20+ users, operational burden increasing_

- Multiple API keys per user
- Queue-based request handling
- Improved monitoring/alerting
- Path to 99% uptime
- Basic invoicing (PDF generation)

**Phase 4: Agency Features (V2.0 — Month 4-6)**

_Trigger: 50+ users, agency demand validated_

- Sub-accounts for agencies
- Team management
- White-label API
- Per-organization reporting

**Phase 5: Platform (Long-term)**

_Trigger: Product-market fit confirmed, revenue sustainable_

- Price guarantee mode
- Automatic failover
- Ecosystem plugins (n8n, Make, Zapier)
- Enterprise tier

### Risk Mitigation Strategy

**Technical Risks:**

| Risk                      | Probability        | Impact | Mitigation                                              |
| ------------------------- | ------------------ | ------ | ------------------------------------------------------- |
| Gonka network instability | Medium             | High   | Clear errors, no charge for failures, retry docs        |
| Scaling bottlenecks       | Low (at MVP scale) | Medium | Async architecture, horizontal scale ready              |
| Security vulnerabilities  | Low                | High   | HTTPS, hashed keys, no content logging, security review |

**Market Risks:**

| Risk                           | Probability      | Impact | Mitigation                                     |
| ------------------------------ | ---------------- | ------ | ---------------------------------------------- |
| Users don't trust new provider | Medium           | High   | Founder dogfoods publicly, transparent pricing |
| Model quality concerns         | Low              | Medium | Clear model docs, A/B test guidance            |
| Competition enters market      | Low (short-term) | Medium | 12-18 month token advantage, relationship moat |

**Financial Risks:**

| Risk                          | Probability | Impact         | Mitigation                                                 |
| ----------------------------- | ----------- | -------------- | ---------------------------------------------------------- |
| Token price volatility (up)   | Medium      | Medium         | Sell tokens as inference quickly; margin buffer in pricing |
| Token price volatility (down) | Medium      | Low (positive) | Increased margin, can lower prices                         |
| Slow user acquisition         | Medium      | Medium         | Low burn rate, founder's own usage covers costs            |

**Resource Risks:**

| Risk                        | Probability     | Impact | Mitigation                                   |
| --------------------------- | --------------- | ------ | -------------------------------------------- |
| Solo founder bandwidth      | High            | Medium | Lean MVP, manual processes, clear priorities |
| Support overwhelm           | Medium          | Medium | Good docs, clear errors, FAQ                 |
| Manual payments don't scale | High (at scale) | Medium | Stripe in V1.1, trigger at 10+ users         |

### MVP Success Metrics

**Week 1 (Dogfooding):**

- [ ] Founder's pipeline running on gonka-proxy
- [ ] 0 critical bugs
- [ ] Core flow works end-to-end

**Month 1 (Pilot):**

- [ ] 5 external active users
- [ ] > 95% uptime
- [ ] <1% error rate
- [ ] At least 1 user from community outreach

**Validation Signals to Unlock V1.1:**

- Users increase usage week-over-week (retention)
- At least 1 user asks about card payments (demand signal)
- No churn due to missing models (coverage sufficient)
- Positive feedback on cost savings (value confirmed)

## Functional Requirements

### API Gateway

- FR1: User can send chat completion requests to `/v1/chat/completions` endpoint in OpenAI-compatible format
- FR2: User can receive streaming responses via Server-Sent Events (SSE)
- FR3: User can receive non-streaming responses as complete JSON
- FR4: User can specify model name from available Gonka network models
- FR5: User can pass standard OpenAI parameters (temperature, max_tokens, top_p, etc.)
- FR6: System proxies requests to Gonka network transparently
- FR7: System returns usage information (tokens, cost) in response
- FR8: System requires HTTPS for all API traffic

### User Management

- FR9: Visitor can create account with email and password
- FR10: User can log in to dashboard
- FR11: User can log out from dashboard
- FR12: User can view their API key in dashboard (masked format: gp-xxxx...xxxx)
- FR13: User can copy API key to clipboard
- FR14: User can regenerate their API key (shows full key once on regeneration)
- FR15: System generates unique API key with `gp-` prefix on account creation
- FR16: User can request password reset via support (MVP: manual process)

### Authentication & Authorization

- FR17: System validates API key on every API request
- FR18: System rejects requests with invalid API key (401 error)
- FR19: System rejects requests when user balance is below minimum threshold (402 error)
- FR20: User can authenticate API requests using Bearer token in Authorization header

### Balance & Billing

- FR21: User can view current balance in dashboard
- FR22: System tracks token usage per request
- FR23: System deducts cost from user balance after each completed request
- FR24: System checks balance against estimated cost before processing request
- FR25: System uses max_tokens parameter (or default 4096) for cost estimation
- FR26: System allows overdraft up to $0.05 or 2000 tokens to complete streaming responses gracefully
- FR27: System blocks subsequent requests when balance is negative until topped up
- FR28: Admin can manually add balance to any user account
- FR29: System displays cost in USD equivalent
- FR30: System uses USD to nicoin conversion rate for billing accuracy
  - **Note (Dec 2025):** GNK token is not publicly traded yet. Rate is managed manually via admin endpoint (`POST /api/v1/admin/rate`) based on OTC market price. When GNK lists on exchanges, this will be replaced with automatic rate fetching from exchange API.

### Dashboard

- FR31: User can view current balance on dashboard
- FR32: User can view API key on dashboard (masked)
- FR33: User can view usage statistics (requests count, tokens used, total cost)
- FR34: User can view static cost comparison (your rate vs market rate)
- FR35: User can navigate between dashboard sections

### Admin Operations

- FR36: Admin can view list of all users
- FR37: Admin can view individual user details (balance, usage, registration date)
- FR38: Admin can adjust user balance (add/subtract)
- FR39: Admin can view system-wide metrics (total requests, total tokens, error rate)
- FR40: Admin can view error logs
- FR41: Admin can process password reset requests manually (MVP)

### Error Handling

- FR42: System returns appropriate HTTP error codes (400, 401, 402, 500, 503)
- FR43: System returns human-readable error messages in consistent JSON format
- FR44: System returns specific error codes (invalid_api_key, insufficient_balance, invalid_model, etc.)
- FR45: System does not charge user for failed requests
- FR46: System logs errors for debugging and monitoring

### Model Management

- FR47: System exposes all models available in Gonka network
- FR48: User can view list of available models with descriptions
- FR49: System returns clear error when user requests unavailable model
- FR50: System passes model-specific parameters through to Gonka

### Documentation

- FR51: User can view list of available models and their capabilities
- FR52: User can view quick start guide for API integration
- FR53: User can view error codes reference
- FR54: User can view example requests and responses

### Monitoring & Logging

- FR55: System logs request metadata (user, model, tokens, latency, cost) for each request
- FR56: System does not log request/response content (privacy)
- FR57: System tracks uptime and availability metrics
- FR58: System tracks error rates by type

### Gonka Network Integration

- FR59: System manages Gonka wallet/keys server-side (users never interact with crypto)
- FR60: System converts USD balance to nicoins using real-time rate for Gonka network requests
- FR61: System handles Gonka network timeouts gracefully (503 error, no charge)
- FR62: System supports all Gonka SDK request parameters

### Future Capabilities (Post-MVP Placeholders)

- FR63: [V1.1] System can enforce rate limits per user (requests per minute/hour)
- FR64: [V1.1] User can reset password via automated email flow
- FR65: [V1.1] User can change password in dashboard
- FR66: [V1.1] System sends low balance warning notifications

---

## Non-Functional Requirements

Non-functional requirements define HOW WELL the system performs, not WHAT it does. These are quality attributes that ensure the system meets user expectations for performance, security, reliability, and operational excellence.

**Note:** Accessibility requirements skipped — API product with minimal dashboard UI targeting tech-savvy developers, no regulatory accessibility requirements.

### Performance

**API Response Time:**

- NFR1: System adds <200ms overhead beyond Gonka SDK latency
- NFR2: Dashboard pages load within 2 seconds
- NFR3: API key validation completes within 50ms
- NFR4: Balance check and deduction completes within 100ms

**Throughput:**

- NFR5: System handles at least 10 concurrent requests per user without degradation
- NFR6: MVP supports at least 100 requests/minute total system capacity

**Streaming:**

- NFR7: First SSE chunk delivered within 1 second of Gonka response start
- NFR8: SSE keep-alive sent every 15 seconds during streaming

**Request Limits:**

- NFR9: Maximum request body size: 1MB
- NFR10: Maximum response size: 10MB (limited by Gonka network)

### Security

**Data Protection:**

- NFR11: All API traffic encrypted via TLS 1.2+
- NFR12: API keys hashed using bcrypt or argon2 before storage
- NFR13: API keys never logged in plaintext
- NFR14: Request/response content never logged (privacy)
- NFR15: User passwords hashed with bcrypt (cost factor ≥10)

**Authentication:**

- NFR16: Session tokens expire after 24 hours of inactivity
- NFR17: API keys are cryptographically random (≥256 bits entropy)
- NFR18: Failed login attempts limited to 5 per 15 minutes per IP

**Access Control:**

- NFR19: Admin functions accessible only to designated admin accounts
- NFR20: Users can only access their own data (balance, usage, API key)

**Compliance:**

- NFR21: No PII shared with third parties (except Gonka network for request processing)
- NFR22: User can request account deletion within 72 hours (MVP: manual process)

### Reliability

**Availability:**

- NFR23: MVP target: >95% uptime (36h max downtime/month)
- NFR24: V1.1 target: >99% uptime (7h max downtime/month)
- NFR25: Planned maintenance windows announced 24h in advance

**Error Handling:**

- NFR26: System recovers gracefully from Gonka network failures
- NFR27: No data loss on unexpected system restart
- NFR28: Error rate <1% for valid requests

**Data Integrity:**

- NFR29: Balance deductions are atomic (no partial deductions)
- NFR30: Usage logs are append-only and tamper-evident
- NFR31: Database backed up daily (automated, even for MVP)

**Rate Management:**

- NFR32: ~~If nicoin rate API unavailable, use last known rate (max 1 hour old)~~ **Deferred** — GNK not publicly traded yet
- NFR33: If rate not configured by admin, reject requests with 503 (RateNotSetError)
  - **Note (Dec 2025):** Manual OTC-based rate management until GNK lists on exchanges. Admin sets rate via `/api/v1/admin/rate`. Initial rate seeded from `NICOIN_RATE_INITIAL` env var on first startup.

### Scalability

**MVP Capacity:**

- NFR34: System supports 50 registered users
- NFR35: System supports 10,000 requests/day
- NFR36: System supports 5 concurrent active users

**Growth Path:**

- NFR37: Architecture supports horizontal scaling for future growth
- NFR38: Database schema supports 10x user growth without migration
- NFR39: All capacity limits configurable via environment variables

### Integration

**Gonka Network:**

- NFR40: Compatible with Gonka SDK current version
- NFR41: Graceful degradation when Gonka network is slow or unavailable
- NFR42: Nicoin rate fetching with 5-minute cache and fallback strategy

**OpenAI Compatibility:**

- NFR43: API request format 100% compatible with OpenAI Python SDK
- NFR44: API response format 100% compatible with OpenAI response parsing
- NFR45: Error format follows OpenAI error response structure
