# StudyPulse - Student Task & Exam Planner

A clean, responsive, offline-first student task planner designed for college students to organize coursework, assignment deadlines, and exam preparations.

---

## 🎯 Features
1. **Task Creation with Metadata**:
   - Title with validation (required, friendly inline alert).
   - Subject category presets (Computer Science, Mathematics, Physics, Chemistry, Biology, Engineering, etc.) or custom subject input.
   - Deadline Date & Time picker (`datetime-local`) with live relative tags (Overdue, Due Today, Due in X days).
   - Priority selection (High, Medium, Low) with visual indicators.
2. **Interactive Dashboard**:
   - Metric statistics: Total Tasks, Pending, Completed, Urgent/Overdue.
   - Study Completion progress bar (% calculated in real-time).
3. **Task Actions**:
   - Mark as completed with visual strike-through and animated circular checkbox.
   - Delete task with accessible confirmation modal.
   - Bulk "Clear Completed" action.
4. **Filtering & Searching**:
   - Filter by status tabs: All, Pending, Completed.
   - Filter by priority: High, Medium, Low.
   - Live search by task title or subject.
   - Sort by earliest deadline, latest deadline, priority, recently added, or alphabetical.
5. **Persistence & Resilience**:
   - Saves tasks to browser `localStorage` automatically.
   - Data persists across refreshes and offline sessions.
   - Pre-populated "Load Demo Tasks" button for instant testing.
6. **Polished Design & UX**:
   - Modern dark slate aesthetic with glowing ambient backdrops and glassmorphism.
   - Non-intrusive toast notifications for user feedback.
   - Fully responsive on mobile, tablet, and desktop viewports.

---

## 🛠️ Technology Stack
- **HTML5**: Semantic structure, accessible landmarks, modal dialogs, and ARIA attributes.
- **CSS3 (Vanilla)**: CSS custom properties (tokens), CSS Grid, Flexbox, smooth micro-interactions, responsive media queries.
- **JavaScript (Vanilla ES6+)**: Modular IIFE architecture, event delegation, zero external runtime libraries, `localStorage` API.

---

## 🚀 How to Run Locally

You can run StudyPulse directly in any modern browser without installing any package manager or dependencies!

### Option 1: Using Python (Recommended)
From this project directory:
```bash
python -m http.server 3000
```
Then open your browser at:
```
http://localhost:3000
```

### Option 2: Using Node.js `npx serve`
```bash
npx serve .
```

### Option 3: Direct File Opening
Double-click `index.html` or open it directly in Google Chrome, Microsoft Edge, Firefox, or Safari.
# Prom
