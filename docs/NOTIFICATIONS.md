# Admin — in-app bildirişlər

Push (FCM) iOS-da həmişə çatmaya bilər. Ona görə admin tətbiqində **Bildirişlər** səhifəsi (`/dashboard/notifications`) var — backend eyni məlumatı `GET /api/notifications` ilə verir.

## Passiv müştəri (30+ gün)

Backend avtomatik yoxlayır: müştəri 30+ gündür sifariş verməyibsə:

1. `notifications` cədvəlinə in-app yazılır (`type: customer_inactive`)
2. Adminlərə FCM push (`customer_inactive`)

**Tetikleyicilər (backend):**

- Admin login (`POST /api/auth/login`) sonrası arxa planda
- `GET /api/notifications` çağırılanda (səhifə açılanda)

### Push payload

```json
{
  "type": "customer_inactive",
  "customer_id": "42",
  "last_order_date": "2026-04-28",
  "screen": "customers"
}
```

### In-app mesaj

`message`: `<Müştəri adı> 30+ gündür sifariş verməyib (son: YYYY-MM-DD)`

## Frontend

| Fayl | Vəzifə |
|------|--------|
| `app/dashboard/notifications/page.tsx` | Bildirişlər səhifəsi |
| `components/notifications/NotificationsView.tsx` | Siyahı, «30+ gün passiv» filteri |
| `components/notifications/NotificationNavBadge.tsx` | Sidebar / alt tab oxunmamış sayı |
| `lib/notifications.ts` | Oxunub/oxunmayıb, naviqasiya yolu |
| `lib/push.ts` | Push toxunanda eyni yol |

**Naviqasiya:** `customer_inactive` → `/dashboard/customers?customer_id=<id>` — sətir sarı vurğulanır.

**Nav:** Sidebar (desktop) və alt tab bar (mobil) — **Bildiriş** (`Bell`).

Yeni API endpoint lazım deyil — mövcud `GET /api/notifications` kifayətdir.

## Deploy

- Backend: passiv müştəri job + notifications migration (server tərəfi)
- Mobil JS: `npm run ota:upload` (yalnız UI dəyişikliyi)
- Push konfiq: `docs/PUSH-ADMIN.md`, `firebase/README.md`
