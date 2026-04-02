# Food Donation Platform -- Full AI Agent Prompt (With Localization)

## Added Feature: Localization (i18n)

### Requirements

-   Support multiple languages (initially: English, Arabic)
-   Detect user language automatically (browser or device)
-   Allow manual language switching
-   Store preferred language in user profile

### Frontend

-   Use i18n library (react-i18next)
-   Maintain translation files:
    -   /locales/en.json
    -   /locales/ar.json
-   RTL support for Arabic

### Backend

-   Store user language preference
-   Return localized messages where applicable

### Database إضافات

Add field: - users.preferred_language (VARCHAR)

### UX

-   Language switcher in UI
-   RTL layout when Arabic is active

------------------------------------------------------------------------

## (Rest of original prompt unchanged)

\[Refer to previous full specification content\]
