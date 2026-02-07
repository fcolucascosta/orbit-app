# PLAN-vacation-skip.md

> **Task**: Vacation Mode & Skip Day
> **Agent**: `project-planner`
> **Status**: DRAFT

---

## 🎯 Goal
Implement flexibility features to prevent streak loss due to life events, reducing user demotivation.

## 📋 Requirements

### 1. Vacation Mode (Modo Férias)
*   **Functionality**: User selects a date range (Start - End) to be on vacation.
*   **Impact on Streak**: Days within this range do NOT break the streak if missed.
*   **"Rewarding" UI**: If a user completes a habit *during* vacation, it should look special (e.g., Gold border/glow), anticipating the "extra effort".
*   **DB**: New table `vacations`.

### 2. Skip Day (Pular Dia)
*   **Functionality**: 3-state toggle on Grid Click:
    1.  Click -> **Completed** (Current color)
    2.  Click -> **Skipped** (Gray/Neutral icon, maintains streak)
    3.  Click -> **Empty** (Reset)
*   **DB**: New table `habit_skips` (easier than refactoring `habit_completions` which assumes 'presence = done').

## 🛠️ Proposed Changes

### 1. Database Schema (Supabase)
*   **New Table**: `vacations`
    *   `id` (uuid)
    *   `user_id` (uuid)
    *   `start_date` (date)
    *   `end_date` (date)
*   **New Table**: `habit_skips`
    *   `id` (uuid)
    *   `habit_id` (uuid)
    *   `user_id` (uuid)
    *   `date` (date)
    *   `reason` (text, optional)

### 2. UI/UX Implementation (`app/page.tsx`)
*   **3-State Logic**:
    *   Update `toggleHabit` function to cycle: `None` -> `Complete` -> `Skip` -> `None`.
    *   Check both `habit_completions` and `habit_skips` state maps.
*   **Visuals**:
    *   **Skip**: Render a specific icon (e.g., `Pause` or `Slash`) or a neutral gray color in the grid cell.
    *   **Vacation**:
        *   Render a subtle background pattern (stripes?) on vacation dates in the grid.
        *   If completed during vacation: Add a "Gold" glow or special border to show "Overachievement".

### 3. Streak Calculation Logic
*   **Current**: `while (isCompleted(date)) streak++`
*   **New**: `while (isCompleted(date) || isSkipped(date) || isVacation(date)) streak++`
    *   *Note*: Vacation/Skip days extend the streak but don't necessarily *increment* the count? Or do they?
    *   *Decision*: Usually, Skips *maintain* the streak (don't break it) but don't add to the "Day Count". Just bridges the gap.

## ✅ Verification Plan

### Manual Verification
1.  **Skip**: Click a cell twice. ensure it turns "Skipped" (Gray). Verify streak doesn't break.
2.  **Vacation**: Set vacation for next week.
    *   Ensure grid shows vacation UI.
    *   Complete a habit in vacation -> Check "Reward" UI.
3.  **Persistence**: Reload page, ensure Skips/Vacations persist.

### Automated Checks
- `python .agent/scripts/checklist.py`
