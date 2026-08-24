---
name: typing-learning-platform
description: Architectural rules, sound synthesis, calculations, and internationalization standards for the EdClub Typing Jungle & Office Hub application.
---

# Typing Learning Platform Skill

This skill defines the operational practices and technical requirements for developing, extending, and debugging the EdClub Typing Jungle (Program 3) and Office Hub platform.

## Key Capabilities & Responsibilities

### 1. Bilingual Localization (i18n)
- **Files Involved**: `src/i18n/types.ts`, `src/i18n/locales/vi.ts`, `src/i18n/locales/en.ts`, `src/i18n/index.tsx`.
- **Workflow**:
  1. Define key structure in `TranslationSchema`.
  2. Add Vietnamese text in `vi.ts`.
  3. Add English text in `en.ts`.
  4. Access via `const { t, language } = useTranslation()`.

### 2. Live Typing Engine Operations
- **Files Involved**: `src/components/TypingEngine.tsx`, `src/components/VirtualKeyboard.tsx`, `src/components/HandGuide.tsx`.
- **Calculations**:
  - Live WPM: `Math.round((correctChars.length / 5) / (elapsedSeconds / 60))`
  - Live Accuracy: `Math.round((correctChars.length / totalKeystrokes) * 100)`
- **Key-to-Finger Mapping**:
  - Left Hand: Pinky (`1`, `Q`, `A`, `Z`), Ring (`2`, `W`, `S`, `X`), Middle (`3`, `E`, `D`, `C`), Index (`4`, `5`, `R`, `T`, `F`, `G`, `V`, `B`), Thumb (`Space`).
  - Right Hand: Index (`6`, `7`, `Y`, `U`, `H`, `J`, `N`, `M`), Middle (`8`, `I`, `K`, `,`), Ring (`9`, `O`, `L`, `.`), Pinky (`0`, `-`, `=`, `P`, `[`, `]`, `;`, `'`, `/`, `Enter`, `Backspace`), Thumb (`Space`).

### 3. Audio Synthesizer (Zero External MP3 Assets)
- **File**: `src/utils/soundEngine.ts`.
- Uses native `AudioContext` with `createOscillator()`, `createBiquadFilter()`, and `createGain()` for:
  - Mechanical switch click (frequency decay + bandpass noise).
  - Soft typing click (sine wave click + gentle envelope).
  - Error blip (low square wave thud).
  - Star fanfare & victory jingle (harmonic chord progression).

### 4. Data Persistence & User Progress
- **Files**: `src/utils/storage.ts`, `src/types.ts`.
- Storage key: `edclub_typing_user_progress_v1`.
- Handles completed lessons, star counts, highest WPM, badges, custom drills, and user settings.

### 5. Office Knowledge Hub & Formula Evaluator
- **Files**: `src/components/OfficeKnowledgeHub.tsx`, `src/components/FormulaPlayground.tsx`, `src/data/officeKnowledgeData.ts`.
- Supports searchable formulas, live calculation playground, practical business hacks, and direct clipboard copying.
