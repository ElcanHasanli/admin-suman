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
- `summary.netRevenue` — backend sahəsi; **UI-da istifadə olunmur**
- **Xalis gəlir (UI):** `getOrderRevenue(summary) − totalExpenses` — borc ödənişləri daxil deyil
- `summary.debtCollected` — ayrıca «Borc ödənişləri» kartında
- `expenses[]` — `source`: `courier` \| `admin`

**Frontend:** `resolveApiPeriodParams()` → `getHistory(period, startDate?, endDate?)`. Dashboard: `getHistory('today')`.

## 3. Anbar tarixçəsi

```http
GET /api/warehouse/updates?period=yesterday|today|custom&warehouse_code=mikrorayon&startDate=&endDate=
```

Eyni period məntiqi (Baku timezone). 2 məntəqə: `docs/WAREHOUSE.md` · §15.

**Frontend:** Anbar səhifəsi eyni `resolveApiPeriodParams` + `warehouse_code` filteri.

## 4. Push

```http
POST /api/devices/register
```

`platform`: `"ios"` \| `"android"`, `app`: `"admin"`

**Frontend:** `lib/push.ts` — login sonrası səssiz qeydiyyat (toast yoxdur).

## 5. Müştərilər — səhifələmə

```http
GET /api/customers?page=1&limit=20&q=elcan
Authorization: Bearer <admin>
```

| Parametr | Default | Məna |
|----------|---------|------|
| `page` | `1` | Səhifə (1-dən) |
| `limit` | `20` | Səhifədə say (max 100) |
| `q` | — | Axtarış: ad, soyad, telefon, ünvan |

Cavab:

```json
{
  "customers": [{ "id": 12, "display_name": "...", "phone": "...", "debt": 0 }],
  "total": 145,
  "page": 1,
  "limit": 20
}
```

- `total` — həmişə qaytarılır (`q` filtrindən sonra)
- Sıralama: `display_name` A→Z
- Dashboard: `GET /api/customers?page=1&limit=1` → `total`

**Frontend:** `getCustomers({ page, limit, q })` — müştərilər səhifəsi `limit=20`, dashboard `limit=1`.

## 6. Sifarişlər — filtrlər

```http
GET /api/orders?status=assigned&courier_id=5&completedToday=true
Authorization: Bearer <admin>
```

Filtrlər **AND** ilə birləşir.

| Parametr | Məna |
|----------|------|
| `status` | `pending` \| `assigned` \| `in_progress` \| `completed` |
| `completedToday=true` | Bu gün (Baku) tamamlanan sifarişlər |
| `courier_id` | Kuryer ID və ya `unassigned` (kuryersiz) |

**Frontend:** `getOrders({ status, courier_id, completedToday })` — sifarişlər səhifəsi status düymələri + kuryer dropdown.

## 7. Müştəri axtarışı (sifariş yaradarkən)

```http
GET /api/customers/search?q=nəsimi
Authorization: Bearer <admin>
```

- Axtarış: **ad**, **telefon**, **ünvan**
- Ünvan uyğunluqları **əvvəl** (backend sıralayır)
- Cavab: `{ customers: [...] }` və ya massiv

**Frontend:** `searchCustomers(q)` — sifariş modalında; nəticə sırası backend-dən olduğu kimi saxlanılır; dropdown-da ünvan göstərilir.

## 8. Sifariş yaratma (yeni)

`order_type`: `delivery` | `pickup` · `scheduled_date` (YYYY-MM-DD, default bu gün Baku)

```http
GET /api/customers/:id/order-preview
POST /api/orders
```

Preview: `customer` + `last_note` (son sifariş qeydi).

Pickup: `price` avtomatik 0, `bidons_count` = götürüləcək boş bidon.

`debt` POST body-də — müştəri borcu yenilənir (azalanda `debt_payments`).

**Frontend:** Çatdırılma / Boş bidon götürmə tab, tarix picker, borc input, son qeyd readonly, `getCustomerOrderPreview`, `createOrder({ order_type, scheduled_date, debt, notes, ... })`.

**Redaktə:** `updateOrder({ order_type, scheduled_date, courier_id, bidons_count, address, price })` — tamamlanmış sifarişdə növ/tarix UI-da kilidlidir.

## 9. Tarix sahələri (Baku)

`scheduled_date` — həmişə `YYYY-MM-DD` string (təqvim tarixi, timezone yoxdur). `new Date(scheduled_date)` ilə parse etməyin.

| Sahə | İstifadə |
|------|----------|
| `scheduled_date` | İcra günü göstərmək (formatCalendarDate) |
| `assigned_at_baku` | Təyin vaxtı (ISO +04:00) |
| `completed_at_baku` | Tamamlanma vaxtı (Baku) |

**Frontend:** `formatCalendarDate`, `formatBakuDateTime`, `getOrderScheduledDateDisplay`, `getOrderAssignedTimeDisplay`, `getOrderCompletedTimeDisplay`.

## 10. SaaS / multi-şirkət

Lisenziya kodu ilə login, şirkət izolyasiyası, `mark-paid`, tarixçə `netRevenue` — tam sənəd: **`docs/BACKEND_SAAS_MIGRATION.md`**.

## 11. Sifariş borcu ödənişi (tam / qismən)

`PUT /api/orders/:id/mark-paid` — yalnız **sifariş qalığı** (`remaining_amount`).

**Frontend:** `OrderPaymentDetails`, `formatOrderCollectionSummary`, `OrderDebtPaymentModal`.

## 12. Tarixçə dashboard (7 qutu)

`GET /api/history/dashboard?period=&courier_id=` — `dashboard.sales`, `debt_given`, `credit`, `prepaid`, `courier_balance`, `expenses`, `net_balance`.

Period: `today` | `yesterday` | `week` | `month` | `custom`.

**Nisyə (`credit`):** yalnız `payment_type=credit` və hələ ödənilməmiş (`is_paid: false`, `remaining_amount > 0`). Borc ödəniləndə qutudan çıxır.

**Kuryer üzrə:** filter olmadan `by_courier[]` — hər kuryer üçün eyni 7 pul + 2 bidon qutu.

**Frontend:** `HistoryDashboardCards` — 7 pul + 2 bidon qutu (klik → modal), `HistoryPeriodButtons`, kuryer filteri.

## 13. Sifariş əlavələri və ödənilib

`POST /api/orders` — `unit_price`, `extras[]`, `is_prepaid`, `prepaid_amount`.

**Frontend:** sifariş yaratma modalında əlavələr + «Əvvəlcədən ödənilib» checkbox.

## 14. Borclu müştərilər

`GET /api/customers/debtors` · `POST /api/customers/:id/pay-debt`

**Frontend:** `/dashboard/customers/debtors` — `DebtorsView`, `CustomerPayDebtModal`.

## 15. Anbar — 2 məntəqə (Mikrorayon / Xırdalan)

`GET /api/warehouse/summary` → `warehouses[]` · `PATCH /api/warehouse/stock` + `warehouse_code`

**Frontend:** `WarehouseView` — hər məntəqə kartı (**dolu / boş**), kuryer giriş-çıxış tarixçəsi (`girdi X dolu + Y boş · çıxdı Z dolu`). Ətraflı: `docs/WAREHOUSE.md`.

