.PHONY: dev release

dev:
	@read -p "📝 Dev Changelog: " notes; \
	read -p "🔢 Versiya tipi (patch/minor/major) [patch]: " bump; \
	bundle exec fastlane ios dev bump:$${bump:-patch} notes:"$$notes"

release:
	@read -p "📝 Release Notes: " notes; \
	read -p "🔢 Versiya tipi (patch/minor/major) [patch]: " bump; \
	bundle exec fastlane ios release bump:$${bump:-patch} notes:"$$notes"