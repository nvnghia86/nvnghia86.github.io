# 🌟 Gemini Model Instructions for EdClub Typing Jungle & Office Hub

This file contains behavioral directives and engineering guidelines for Gemini models assisting in the development and iteration of this application.

---

## 🧭 Behavioral Directives

1. **User Intent Alignment**:
   - Implement features exactly as specified.
   - Maintain the educational touch-typing essence modeled after EdClub / TypingClub Program 3.
   - Respect existing bilingual i18n structure and design principles.

2. **Language and Localization**:
   - The app natively supports Vietnamese (`vi`) and English (`en`).
   - Keep all copy clean, professional, and pedagogically sound for learners of all ages (students, office professionals).

3. **Performance & Cleanliness**:
   - Maintain lightweight, modular React functional components.
   - Keep Web Audio synthesizer efficient with instant cleanup of audio oscillator nodes.
   - Ensure Canvas animations in mini-games cancel `requestAnimationFrame` on unmount.
   - Typography Pairing: Always apply `JetBrains Mono` for typing areas/keys, `Plus Jakarta Sans` for headings/badges, and `Be Vietnam Pro` for UI/body copy.

4. **TypeScript Strictness**:
   - Do not use `any` type where explicit interfaces exist.
   - Use named imports and export modular utilities.
