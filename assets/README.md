# Mobil ikon və splash

Bu qovluğa şəkilləri qoyun, sonra terminalda:

```bash
npx capacitor-assets generate
npm run cap:sync
```

## Fayllar

| Fayl | Ölçü | Məqsəd |
|------|------|--------|
| `icon-only.png` | 1024×1024 px | Telefon ekranındakı tətbiq ikonu |
| `splash.png` | 2732×2732 px (tövsiyə) | Açılış ekranı |

**İkon qaydaları:**
- Kvadrat, loqo **təxminən 85–90%** sahəni doldursun (çox boşluq = telefonda kiçik görünür)
- PNG, **1024×1024** (Xcode üçün dəqiq bu ölçü)
- App Store üçün şəffaf fon tövsiyə olunmur
- iOS ikonları avtomatik yumru künclər kəsir — kənarlara kritik mətn qoymayın

`icon-only.png` yoxdursa, birbaşa əvəz edin:
`ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`
