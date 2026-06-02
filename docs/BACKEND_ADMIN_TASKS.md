# Backend — Admin tətbiqi üçün tələblər

Frontend hazırdır; aşağıdakılar backend-də tam işləməlidir.

## 1. Admin / şirkət xərci (`POST /api/expenses`)

Admin panel **kuryer seçmədən** istənilən şirkət xərcini qeyd edir: əmək haqqı, yanacaq, icarə, materiallar, təmir və s. (yalnız «maaş» deyil).

**Gözlənilən body:**

```json
{
  "amount": 350,
  "description": "Yanacaq — mart",
  "category": "fuel", 
  "source": "admin"
}
```

Başqa nümunələr: `category`: `payroll`, `rent`, `supplies`, `equipment`, `other`.

- `courier_id` **opsional** olmalıdır (`source: "admin"` olduqda).
- Cavabda: `id`, `amount`, `description`, `category`, `source: "admin"`, `created_at`; `courier_name` boş ola bilər və ya `"Admin"`.

**Tarixçə (`GET /api/history?period=custom&startDate=&endDate=`):**

- `summary.totalExpenses` — kuryer + admin (şirkət) xərclərinin cəmi.
- `summary.netRevenue` — ümumi gəlir − `totalExpenses`.
- `expenses[]` — hər iki mənbə.

## 2. Anbar yeniləmələri — tarix filtri

`GET /api/warehouse/updates`:

- `period`: `yesterday` | `today` | `custom` (köhnə `week` / `month` əvəzinə).
- `custom` üçün: `startDate`, `endDate` (YYYY-MM-DD).

Əgər hələ dəstəklənmirsə, frontend client-side filtr edir; tam dəqiqlik üçün API tərəfdə filtr lazımdır.

## 3. Tarixçə period

`GET /api/history` və export artıq əsasən `period=custom` + `startDate` / `endDate` istifadə edir. `yesterday` / `today` bir günlük aralıq kimi işləməlidir.

## 4. Push (iOS)

Firebase token qeydiyyatı (`POST /api/devices/register`, `app: admin`) işləməlidir; frontend artıq login zamanı xəta toast göstərmir.

---

**Yoxlama:**

1. Admin login → Tarixçə → «Xərc əlavə et» → məbləğ + təsvir → siyahıda görünür.
2. Xalis gəlir və ümumi xərclər yenilənir.
3. Anbar səhifəsində «Dünən» / «Bu gün» / aralıq düzgün siyahı verir.
