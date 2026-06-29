# Kuryer paneli — frontend tapşırıqları (admin panel uyğunluğu)

Bu sənəd **kuryer paneli** frontend developer-ə üçündür. Admin panel (`admin-suman`) artıq istifadə olunan UI/UX və Excel export qaydalarına uyğunlaşdırılmalıdır.

---

## 1. Excel export — human-readable dəyərlər

API-dən gələn **texniki** dəyərlər birbaşa Excel-ə yazılmamalıdır. İstifadəçi `TRUE`/`FALSE` və ya `cash`/`credit` görməməlidir.

### Ödəniş növü (`payment_type`)

| API dəyəri | Excel / UI |
|------------|------------|
| `cash` | **Nağd** |
| `card` | **Kart** |
| `credit` | **Nisyə** |

```ts
function getPaymentTypeLabel(paymentType?: string): string {
  switch ((paymentType || '').toLowerCase()) {
    case 'cash': return 'Nağd';
    case 'card': return 'Kart';
    case 'credit': return 'Nisyə';
    default: return '—';
  }
}
```

### Ödənilib (`is_paid`)

| API dəyəri | Excel / UI |
|------------|------------|
| `true` | **hə** |
| `false` | **yox** |

Sifariş siyahısında (admin kimi) alternativ: ödənilibsə **«Ödənilib»**, borcdursa **«Borc»** — amma Excel-də sadə sorğu-cavab üçün **hə / yox** istifadə olunur.

```ts
function formatPaidForExcel(isPaid?: boolean): string {
  if (typeof isPaid !== 'boolean') return '—';
  return isPaid ? 'hə' : 'yox';
}
```

### Digər sahələr

- Tarix: `2026-06-29T14:30:00` yox → `29.06.2026, 14:30` (`az-AZ` locale)
- Məbləğ: `2.5` yox → `₼2.50` (UI); Excel-də rəqəm olaraq saxlamaq da olar, amma sütun başlığı azərbaycancadır
- Status: `completed` yox → **Tamamlandı**, `in_progress` → **Çatdırılır**, və s.

**Qayda:** Export zamanı API raw field-lərini map et; heç vaxt `cash`, `credit`, `TRUE`, `FALSE` endirmə.

---

## 2. Dizayn — admin panel ilə eyni dil

Kuryer paneli vizual olaraq **admin.suman.khamsacraft.az** ilə eyni ailədən görünməlidir.

### Rəng və komponentlər

- Əsas rəng: **sky-600** (`#0284c7`), hover sky-700
- Fon: ağ kartlar, **slate-50** / **slate-100** border
- Kartlar: `rounded-xl`, incə shadow, `border-slate-200/80`
- Düymələr: `rounded-lg`, `font-semibold`, min hündürlük ~44px (mobil toxunma)
- Uğur: emerald, xəbərdarlıq: amber, xəta/borc: red/rose

### Layout

- **Mobil:** uzun cədvəl yox — **kart layout** (hər sifariş/xərc ayrıca kart)
- **Desktop:** cədvəl + horizontal scroll lazım olsa
- Modal: aşağıda sticky **Saxla / Ləğv et** (iOS-da düymə footer altında qalmasın)
- Tarix filtri: **Dünən | Bu gün | Tarix aralığı** (admin ilə eyni preset düymələri)

### Tipografiya

- Inter və ya oxşar sans-serif
- Başlıq: `text-xl font-bold text-slate-900`
- İkinci dərəcəli: `text-sm text-slate-500`

### Nümunə referans (admin repo)

| Sahə | Admin fayl |
|------|------------|
| Düymələr | `components/ui/Button.tsx` |
| Kartlar | `components/ui/Card.tsx`, `MobileCards.tsx` |
| Tarix preset | `components/ui/DateRangePresets.tsx` |
| Ödəniş / borc label | `lib/utils.ts` → `getPaymentTypeLabel`, `getOrderPaidLabel` |
| Excel export | `lib/historyExport.ts` |

---

## 3. Excel export — struktur (tövsiyə)

Admin tarixçə export-u **4 vərəq** istifadə edir; kuryer panelində də oxunaqlı vərəq adları azərbaycanca olsun:

- Sifarişlər (ödəniş növü və ödənilib **map edilmiş**)
- Xərclər (varsa)
- Xülasə (varsa)

Client-side export: `xlsx` paketi + yuxarıdakı label funksiyaları.

---

## 4. Yoxlama siyahısı

- [ ] Excel-də ödəniş sütunu: Nağd / Kart / Nisyə (cash/credit yox)
- [ ] Excel-də ödənilib: hə / yox (TRUE/FALSE yox)
- [ ] Mobil görünüş kart layout-dadır
- [ ] Primary düymələr sky-600
- [ ] Tarix filtri: Dünən / Bu gün / Tarix aralığı
- [ ] Modal submit düyməsi iOS-da görünür

---

**Suallar:** admin panel repo — `admin-suman` (GitHub: ElcanHasanli/admin-suman).
