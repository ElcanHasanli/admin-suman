# Su doldurma anbarı (Admin) — 2 məntəqə

**Mikrorayon** (`mikrorayon`) və **Xırdalan** (`xirdalan`) — iki ayrı anbar.

Frontend: `/dashboard/warehouse` · API: `/api/warehouse/*`

## Dashboard

`GET /api/warehouse/summary` → `warehouses[]`

| Göstərici | Mənbə |
|-----------|--------|
| Mikrorayon / Xırdalan dolu-boş | `warehouses[].full_count` / `empty_count` |
| Müştərilərdə bidon | `customers.total_active_bidons` |
| Son yeniləmə | `last_update` |

## Admin panel

| Bölmə | URL |
|-------|-----|
| Anbar səhifəsi | `/dashboard/warehouse` |
| Dashboard xülasə | `/dashboard` (hər məntəqə) |

**Avtomatik yeniləmə:** hər 30 saniyə + «Yenilə» düyməsi.

**Sayım düzəltmə:** `PATCH /api/warehouse/stock` — `warehouse_code` mütləq.

## API

| Method | URL | Kim |
|--------|-----|-----|
| GET | `/api/warehouse/summary` | admin, kuryer |
| GET | `/api/warehouse/updates?warehouse_code=&period=&courier_id=` | admin, kuryer |
| POST | `/api/warehouse/update` | kuryer |
| PATCH | `/api/warehouse/stock` | admin |

## Kuryer yeniləməsi (UI)

```
Elnur · Mikrorayon · girdi 10 dolu + 5 boş · çıxdı 20 dolu · götürdü 10
```

| Sahə | Məna |
|------|------|
| `entry_full` | Neçə dolu ilə girdi |
| `entry_empty` | Neçə boş ilə girdi |
| `exit_full` | Neçə dolu ilə çıxdı |
| `full_taken` | Anbardan götürülən (`exit_full − entry_full`) |
| `warehouse_name` | Mikrorayon / Xırdalan |

## Push

| `data.type` | `data.screen` |
|-------------|---------------|
| `warehouse_updated` | `warehouse` |

## Deploy (backend)

```bash
npm run db:migrate:warehouse-rename
pm2 restart all
```
