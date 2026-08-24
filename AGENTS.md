# 🤖 AI Agent Guidelines & Architecture Rules

This document outlines persistent instructions, conventions, architectural patterns, and development skills for any AI Agent working on the **EdClub Typing Jungle (Program 3) & Office Pro Hub** codebase.

---

## 📌 Project Identity & Core Objectives

- **App Name**: EdClub Typing Jungle (Program 3) & Office Hub
- **Purpose**: A comprehensive touch-typing learning platform replicating and extending EdClub / TypingClub's Program 3 curriculum, featuring real-time finger-to-key guidance, audio synthesis, RPG mini-games (Monster PK Battle, Speed Run Racer), Office knowledge base (Word & Excel tips/shortcuts/formulas), and a complete bilingual i18n system (Vietnamese & English).
- **Core Architecture**: Client-side Single Page Application built with React 18, TypeScript, Tailwind CSS, Web Audio API, and HTML5 Canvas.

---

## 🎯 Mandatory Agent Rules & Conventions

### 1. 🌐 Bilingual Internationalization (i18n) Rules
- **Never hardcode user-facing strings**: All buttons, labels, titles, error messages, modal texts, descriptions, and hints MUST be referenced through the `useTranslation()` hook.
- **Synchronized Locale Dictionaries**:
  - If a new key or feature is added, it MUST be declared in `src/i18n/types.ts` inside `TranslationSchema`.
  - Both `src/i18n/locales/vi.ts` and `src/i18n/locales/en.ts` MUST be updated with accurate, idiomatic translations in both languages.
- **Language Switcher Accessibility**: Ensure the `LanguageSelector` component is available across major navigation views (Header, Settings, Typing Header, Modals).

### 2. ⌨️ Typing Engine & Calculations
- **WPM Formula**:
  $$\text{Gross WPM} = \frac{\text{Total Characters Typed} / 5}{\text{Elapsed Time in Minutes}}$$
  $$\text{Net WPM} = \max\left(0, \frac{(\text{Total Characters} - \text{Unfixed Errors}) / 5}{\text{Elapsed Time in Minutes}}\right)$$
- **Accuracy Formula**:
  $$\text{Accuracy (\%)} = \max\left(0, \min\left(100, \frac{\text{Correct Characters}}{\text{Total Keystrokes}} \times 100\right)\right)$$
- **Star Rating Rules**:
  - $5\text{ Stars}$: Accuracy $\ge 98\%$ AND $\text{WPM} \ge \text{Target WPM} + 5$.
  - $4\text{ Stars}$: Accuracy $\ge 95\%$ AND $\text{WPM} \ge \text{Target WPM}$.
  - $3\text{ Stars}$: Accuracy $\ge 90\%$ AND $\text{WPM} \ge \text{Target WPM} \times 0.8$.
  - $2\text{ Stars}$: Accuracy $\ge 85\%$.
  - $1\text{ Star}$: Completed with lower accuracy.
- **Focus Management**: The typing container must maintain focus on click, handling `Tab` (reset) and `Esc` (restart/exit) smoothly without hijacking necessary browser devtools.

### 3. 🔊 Web Audio Engine Guidelines
- **Zero External Audio Assets**: All sound effects (keypresses, mechanical clicks, error chimes, victory jingles, level up fanfare) MUST be generated purely using the browser's native `AudioContext` / `Web Audio API` in `src/utils/soundEngine.ts`.
- **Autoplay Handling**: Audio contexts must be lazily initialized or resumed on the first user interaction to comply with browser autoplay policies.
- **User Preference Respect**: Always check `settings.soundTheme !== 'mute'` before playing sounds.

### 4. 🎨 UI/UX & Styling Standards ("Anti-Slop")
- **Palette**: Clean, modern slate-based background (`#f8fafc` / `#f0f4f8`), crisp white cards with subtle borders (`border-slate-200`), and semantic accents (Blue for active focus, Emerald for success/speed, Amber for streaks/stars, Rose for errors).
- **No Heavy Clichés**: Do not introduce neon dark glow effects, purple-blue heavy gradients, or nested card-in-card visual noise.
- **Icons**: Always import icons from `lucide-react`. Never craft custom raw SVGs unless mathematically drawing on HTML5 Canvas.
- **Typography Pairing & System**:
  - **Typing Area & Keyboard Streams (`font-mono`, `font-typing`)**: **JetBrains Mono** (fallback: Fira Code, monospace). Essential for unambiguous character distinction (0 vs O, 1 vs l vs I), uniform width tracking, zero layout shifts during live typing, and code/shortcuts display.
  - **Headings, Gamification & Metrics (`font-heading`, `h1`-`h6`, Badges, WPM/Score Numbers)**: **Plus Jakarta Sans** (fallback: Outfit, sans-serif). Delivers modern, energetic geometric authority for titles, level tags, and achievement badges.
  - **Body UI, Descriptions & Handbook (`font-body`, general text)**: **Be Vietnam Pro** (fallback: Inter, sans-serif). Specially engineered for optimal Vietnamese diacritic marks and high-contrast, clean English readability across all screen sizes.

### 5. 💾 State Management & Data Persistence
- **Storage Utility**: Use `src/utils/storage.ts` for all reading and writing to `localStorage`.
- **Type Safety**: All entities (`Lesson`, `LessonResult`, `UserSettings`, `Badge`, `OfficeTip`, `Monster`) must have strict TypeScript interfaces in `src/types.ts`.
- **Graceful Fallbacks**: Always provide sensible default settings (`defaultSettings`) if stored JSON is corrupted or missing.

### 6. 🧪 Code Verification Before Completion
- Always run `lint_applet` (`npm run lint` / `tsc --noEmit`) to verify zero TypeScript errors.
- Always run `compile_applet` (`npm run build`) to ensure bundle validity.
