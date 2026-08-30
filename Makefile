.PHONY: dev release

# macOS system Ruby (2.6) bundler 2.5.3 dəstəkləmir — Homebrew Ruby istifadə et
BUNDLE := $(shell brew --prefix ruby 2>/dev/null)/bin/bundle

dev:
	@test -x "$(BUNDLE)" || (echo "❌ Homebrew Ruby tapılmadı. Əvvəl: brew install ruby"; exit 1)
	@read -p "📝 Dev Changelog: " notes; \
	read -p "🔢 Versiya tipi (patch/minor/major) [patch]: " bump; \
	case "$${bump:-patch}" in patch|minor|major) ;; *) echo "❌ Yalnız: patch, minor və ya major"; exit 1;; esac; \
	PATH="$$(brew --prefix ruby)/bin:$$PATH" "$(BUNDLE)" exec fastlane ios dev bump:$${bump:-patch} notes:"$$notes"

release:
	@test -x "$(BUNDLE)" || (echo "❌ Homebrew Ruby tapılmadı. Əvvəl: brew install ruby"; exit 1)
	@read -p "📝 Release Notes: " notes; \
	read -p "🔢 Versiya tipi (patch/minor/major) [patch]: " bump; \
	case "$${bump:-patch}" in patch|minor|major) ;; *) echo "❌ Yalnız: patch, minor və ya major"; exit 1;; esac; \
	PATH="$$(brew --prefix ruby)/bin:$$PATH" "$(BUNDLE)" exec fastlane ios release bump:$${bump:-patch} notes:"$$notes"
