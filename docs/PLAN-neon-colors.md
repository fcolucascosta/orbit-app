# PLAN-neon-colors.md

> **Task**: Expand Color Selector to 20 Neon Colors
> **Agent**: `frontend-specialist`
> **Status**: DRAFT

---

## 🎯 Goal
Update the habit color picker to support a vibrant selection of **20 Neon/Cyberpunk colors**.

## 📋 Context
- **Current State**: `COLOR_PALETTE` in `app/page.tsx` has ~10 colors.
- **Requirement**: "selector of 20 colors, neon colors".
- **Constraint**: Must keep existing color names valid to avoid breaking saved habits (unless we run a migration, but expanding is safer).

## 🛠️ Proposed Changes

### 1. Update `app/page.tsx`
- **Modify `COLOR_PALETTE` constant**:
  - Keep existing 10 colors (to maintain data integrity).
  - Add 10 NEW distinct neon colors.
  - Update any layout logic if needed (currently `flex-wrap` handles it).

#### New Palette (Draft)
1.  `neon-green` (#00FF94) - *Existing*
2.  `neon-cyan` (#00F0FF) - *Existing*
3.  `electric-blue` (#2979FF) - *Existing*
4.  `deep-purple` (#651FFF) - *Existing*
5.  `neon-violet` (#D500F9) - *Existing*
6.  `hot-pink` (#FF00E6) - *Existing*
7.  `bright-red` (#FF1744) - *Existing*
8.  `neon-orange` (#FF6D00) - *Existing*
9.  `bright-yellow` (#FFD600) - *Existing*
10. `lime` (#C6FF00) - *Existing*
11. `cyber-grape` (#9D00FF) - **NEW**
12. `toxic-green` (#39FF14) - **NEW**
13. `laser-lemon` (#FFFF00) - **NEW**
14. `plasma-blue` (#00BFFF) - **NEW**
15. `hacker-green` (#0F0) - **NEW**
16. `synth-pink` (#FF0090) - **NEW**
17. `flux-amber` (#FFBF00) - **NEW**
18. `ultraviolet` (#7F00FF) - **NEW**
19. `radioactive-teal` (#00FFEF) - **NEW**
20. `matrix-red` (#FF003C) - **NEW**

## ✅ Verification Plan

### Manual Verification
1.  **Open App**: Run `npm run dev`.
2.  **Open Modal**: Click "New Habit".
3.  **Check Picker**: Verify 20 color circles are visible.
4.  **Save Habit**: Create a habit with a NEW color (e.g., `matrix-red`).
5.  **Persist**: Reload page and ensure color remains.
6.  **Old Habits**: Ensure existing habits still show their correct colors.

### Automated Checks
- Run `python .agent/scripts/checklist.py` to ensure no lint regressions.
