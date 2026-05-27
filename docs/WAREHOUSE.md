# Su doldurma anbarı (Admin)

Kuryer su doldurma məntəqəsində bidon hərəkətini qeyd edir; admin real vaxtda anbar və müştəridəki ümumi bidon sayını görür.

Frontend: `/dashboard/warehouse` · API: `/api/warehouse/*`

## Admin panel

| Bölmə | URL |
|-------|-----|
| Anbar səhifəsi | `/dashboard/warehouse` |
| Dashboard xülasə | `/dashboard` (anbar kartı) |

**Avtomatik yeniləmə:** hər 30 saniyə + «Yenilə» düyməsi.

**Admin sayım düzəltmə:** `PATCH /api/warehouse/stock` — modal «Sayım düzəlt».

## API

| Method | URL | Kim |
|--------|-----|-----|
| GET | `/api/warehouse/summary` | admin, kuryer |
| GET | `/api/warehouse/updates?period=&courier_id=` | admin, kuryer |
| POST | `/api/warehouse/update` | kuryer |
| PATCH | `/api/warehouse/stock` | admin |

## Push (admin)

| `data.type` | `data.screen` | Navigasiya |
|-------------|---------------|------------|
| `warehouse_updated` | `warehouse` | `/dashboard/warehouse` |

Kod: `lib/push.ts`

## Deploy (backend)

```bash
npm run db:migrate:warehouse
pm2 restart all
```

## Sahələr (kuryer yeniləməsi)

| Sahə | Mənası |
|------|--------|
| `empty_in` | Anbara daxil boş |
| `full_in` | Anbara daxil dolu |
| `full_out` | Anbardan götürülən dolu |
| `exit_full` | Maşında dolu (audit) |
| `remaining_full` | Anbarda qalan dolu |
| `remaining_empty` | Anbarda qalan boş |
