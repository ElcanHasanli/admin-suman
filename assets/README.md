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
- Kvadrat, kənarlar boş olmasın (ümumi sahəni doldurun)
- PNG
- App Store üçün şəffaf fon tövsiyə olunmur

`icon-only.png` yoxdursa, birbaşa əvəz edin:
`ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`
