# Implementation Plan: Personal Dashboard

## Overview

A single-page personal productivity dashboard built with vanilla HTML, CSS, and JavaScript. The implementation follows a modular approach: shared utilities first, then individual widgets, then integration and wiring. All user data is persisted in browser Local Storage. No frameworks, build tools, or external dependencies are used.

## Tasks

- [x] 1. Set up project structure and shared utilities
  - [x] 1.1 Create project directory structure and HTML entry point
    - Create `index.html` with semantic structure containing container elements for each widget (greeting, focus timer, todo list, quick links)
    - Create `css/style.css` with base styles, responsive layout (single-column below 600px, multi-column at 600px+), widget spacing (min 16px), font sizes (body 16px, headings 20px), and 4.5:1 contrast ratio
    - Create `js/app.js` as the main entry point that imports and initializes all widget modules on DOMContentLoaded
    - _Requirements: 8.3, 8.4, 10.1, 10.2, 10.3, 10.4_

  - [x] 1.2 Implement StorageUtils module
    - Create `js/storageUtils.js` with `isAvailable()`, `save(key, data)`, and `load(key, validator)` functions
    - Implement feature detection for Local Storage availability
    - Handle quota exceeded errors, JSON parse errors, and unavailability gracefully
    - Return structured results: `{ success, error }` for save, `{ data, valid }` for load
    - _Requirements: 5.1, 5.4, 5.5, 7.1, 7.4_

  - [x] 1.3 Implement TimeUtils module
    - Create `js/timeUtils.js` with pure functions: `getGreeting(hour)`, `formatTime(date)`, `formatDate(date)`, `formatTimer(totalSeconds)`
    - `formatTime` returns zero-padded 24-hour "HH:MM" string
    - `formatDate` returns "DayOfWeek, Month DayNumber" with full English names
    - `getGreeting` maps hours 5-11 → "Good Morning", 12-17 → "Good Afternoon", 18-21 → "Good Evening", 22-23/0-4 → "Good Night"
    - `formatTimer` returns zero-padded "MM:SS" for 0–1500 seconds
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 3.1_

- [x] 2. Implement GreetingWidget
  - [x] 2.1 Implement GreetingWidget module
    - Create `js/greetingWidget.js` with `init(containerElement)` and `destroy()` public methods
    - Render current time (HH:MM), full date, and greeting message on init
    - Set up `setInterval` (every 1 second) to update time display, refresh greeting when period boundary is crossed, and update date at midnight
    - Handle case where time cannot be determined by showing "Hello"
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 3. Implement FocusTimer
  - [x] 3.1 Implement FocusTimer module
    - Create `js/focusTimer.js` with `init(containerElement)` and `destroy()` public methods
    - Render timer display at "25:00" with Start, Stop, and Reset buttons
    - Implement `start()`: begins countdown if stopped/paused, no-op if running
    - Implement `stop()`: pauses countdown, retains remaining time
    - Implement `reset()`: stops countdown, resets to 25:00 (1500 seconds)
    - Implement `tick()`: decrements remaining seconds, updates display, shows notification at 0
    - Handle tab visibility changes by recalculating elapsed time on focus
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 4. Implement TodoList
  - [x] 4.1 Implement TodoList module
    - Create `js/todoList.js` with `init(containerElement)` and `destroy()` public methods
    - Implement `addTask(text)`: validates text (non-empty after trim, ≤200 chars), creates Task object with unique id, adds to list, saves to storage, re-renders
    - Implement `editTask(id, newText)`: validates new text, updates task text, saves, re-renders
    - Implement `toggleTask(id)`: toggles completed boolean, applies/removes strikethrough, saves
    - Implement `deleteTask(id)`: removes task from list, saves, re-renders
    - Implement `validateTaskText(text)`: returns `{ valid, error }` for empty, whitespace-only, or >200 chars
    - Implement `loadTasks()`: reads from Local Storage, validates structure, returns empty array for corrupted data
    - Implement `saveTasks()`: persists task list to Local Storage, shows error on failure
    - Render input form with submit handler and task list with edit/toggle/delete controls
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 5. Implement QuickLinks
  - [x] 5.1 Implement QuickLinks module
    - Create `js/quickLinks.js` with `init(containerElement)` and `destroy()` public methods
    - Implement `addLink(label, url)`: validates inputs, creates Link object, adds to list, saves, re-renders
    - Implement `deleteLink(id)`: removes link from list, saves, re-renders
    - Implement `validateLink(label, url)`: checks label non-empty (≤50 chars), URL starts with http:// or https://, max 20 links
    - Implement `loadLinks()`: reads from Local Storage, validates structure, returns empty array for corrupted data
    - Implement `saveLinks()`: persists link list to Local Storage
    - Render link buttons that open URLs in new tabs (`target="_blank"`) and add-link form with label/URL inputs
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4_

- [x] 6. Integration, wiring, and browser compatibility
  - [x] 6.1 Wire all modules together in app.js
    - Import all widget modules (GreetingWidget, FocusTimer, TodoList, QuickLinks)
    - On DOMContentLoaded, initialize each widget with its container element in sequence
    - Add feature detection for required APIs (localStorage, Date); display unsupported browser message if missing
    - Add non-blocking warning banner when Local Storage is unavailable (widgets operate in memory-only mode)
    - Ensure all widgets render with persisted data within 1 second of DOMContentLoaded
    - _Requirements: 8.1, 8.2, 9.1, 9.2, 9.3, 9.4_

  - [x] 6.2 Finalize responsive layout and visual polish
    - Verify single-column layout below 600px and multi-column at 600px+
    - Ensure minimum 16px spacing between widgets with visually distinct boundaries
    - Verify 4.5:1 color contrast ratio for all text
    - Ensure no horizontal scrolling from 320px to 1920px viewport widths
    - Ensure UI responds to interactions within 100ms
    - _Requirements: 8.4, 10.1, 10.2, 10.3, 10.4_

## Notes

- Each task references specific requirements for traceability
- The application uses vanilla JavaScript (ES modules), no frameworks or build tools required
- All persistence uses browser Local Storage with the keys `dashboard_todos` and `dashboard_links`
- No external dependencies — open `index.html` directly in a browser to use

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1", "3.1"] },
    { "id": 3, "tasks": ["4.1", "5.1"] },
    { "id": 4, "tasks": ["6.1"] },
    { "id": 5, "tasks": ["6.2"] }
  ]
}
```
