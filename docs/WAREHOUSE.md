# Su doldurma anbarı (Admin) — 2 məntəqə

**Novxanı** (`novxani`) və **Azadlıq** (`azadliq`) — iki ayrı anbar. Hər kuryerin default anbarı var.

Frontend: `/dashboard/warehouse` · API: `/api/warehouse/*`

## Dashboard

`GET /api/warehouse/summary` → `warehouses[]`

| Göstərici | Mənbə |
|-----------|--------|
| Novxanı / Azadlıq dolu-boş | `warehouses[].full_count` / `empty_count` |
| Pompa / dispenser | `warehouses[].pump_count` / `dispenser_count` |
| Müştərilərdə bidon | `customers.total_active_bidons` |
| Son yeniləmə | `last_update` |

## Admin panel

| Bölmə | URL |
|-------|-----|
| Anbar səhifəsi | `/dashboard/warehouse` |
| Dashboard xülasə | `/dashboard` (hər məntəqə) |

**Avtomatik yeniləmə:** hər 30 saniyə + «Yenilə» düyməsi.

**Sayım düzəltmə:** `PATCH /api/warehouse/stock` — `warehouse_code` mütləq.

**Kuryer default:** `PATCH /api/couriers/:id/warehouse`

## API

| Method | URL | Kim |
|--------|-----|-----|
| GET | `/api/warehouse/summary` | admin, kuryer |
| GET | `/api/warehouse/updates?warehouse_code=&period=&courier_id=` | admin, kuryer |
| POST | `/api/warehouse/update` | kuryer |
| PATCH | `/api/warehouse/stock` | admin |
| PATCH | `/api/couriers/:id/warehouse` | admin |
| GET | `/api/couriers` → `default_warehouse` | admin |

## Kuryer yeniləməsi (UI)

```
Elnur · Novxanı · girdi 10 dolu + 5 boş · çıxdı 20 dolu · götürdü 10
```

| Sahə | Məna |
|------|------|
| `entry_full` | Neçə dolu ilə girdi |
| `entry_empty` | Neçə boş ilə girdi |
| `exit_full` | Neçə dolu ilə çıxdı |
| `full_taken` | Anbardan götürülən (`exit_full − entry_full`) |
| `warehouse_name` | Novxanı / Azadlıq |

## Push

| `data.type` | `data.screen` |
|-------------|---------------|
| `warehouse_updated` | `warehouse` |

## Deploy (backend)

```bash
npm run db:migrate:warehouse-locations
pm2 restart all
```
