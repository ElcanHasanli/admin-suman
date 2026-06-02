# Admin backend API (frontend uyğunluğu)

Backend deploy: `npm run db:migrate:expense-source` → `pm2 restart all`

## 1. Şirkət xərci (kuryer olmadan)

```http
POST /api/expenses
Authorization: Bearer <admin>
```

```json
{
  "amount": 350,
  "description": "Yanacaq — mart",
  "category": "fuel",
  "source": "admin"
}
```

- `courier_id` **lazım deyil** (`source: "admin"`).
- `category`: `payroll` | `fuel` | `rent` | `supplies` | `equipment` | `other`
- Cavab: `source: "admin"`, `courier_name: "Admin"` (və ya null)

Kuryer adına xərc: `{ "source": "courier", "courier_id": 5, ... }`

**Frontend:** Tarixçə → «Xərc əlavə et» → `createExpense({ source: 'admin', ... })`.

## 2. Tarixçə

```http
GET /api/history?period=custom&startDate=2026-03-01&endDate=2026-03-31
```

`period`:

| Dəyər | Məna |
|--------|------|
| `today` | Bu gün (Asia/Baku) |
| `yesterday` | Dünən |
| `custom` | `startDate`, `endDate` (YYYY-MM-DD, daxil) |

- `summary.totalExpenses` — kuryer + admin xərcləri
- `summary.netRevenue` — ümumi gəlir − xərclər
- `expenses[]` — `source`: `courier` \| `admin`

**Frontend:** `resolveApiPeriodParams()` → `getHistory(period, startDate?, endDate?)`. Dashboard: `getHistory('today')`.

## 3. Anbar tarixçəsi

```http
GET /api/warehouse/updates?period=yesterday|today|custom&startDate=&endDate=
```

Eyni period məntiqi (Baku timezone).

**Frontend:** Anbar səhifəsi eyni `resolveApiPeriodParams` istifadə edir.

## 4. Push

```http
POST /api/devices/register
```

`platform`: `"ios"` \| `"android"`, `app`: `"admin"`

**Frontend:** `lib/push.ts` — login sonrası səssiz qeydiyyat (toast yoxdur).
