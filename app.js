/**
 * StudyPulse - Student Task & Exam Planner
 * Pure Vanilla JavaScript implementation with LocalStorage persistence,
 * validation, live filtering, priority categorization, and metrics tracking.
 */

(() => {
  'use strict';

  // --- Constants & Keys ---
  const STORAGE_KEY = 'studypulse_tasks_v1';

  // Realistic sample data for college students to get started immediately
  const DEMO_TASKS = [
    {
      id: 'task-demo-1',
      title: 'CS 201: Implement Dijkstra Algorithm Lab',
      subject: 'Computer Science',
      deadline: getOffsetDateString(1, 23, 59), // Due tomorrow midnight
      priority: 'high',
      completed: false,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'task-demo-2',
      title: 'MATH 240: Linear Algebra Problem Set 5',
      subject: 'Mathematics',
      deadline: getOffsetDateString(3, 17, 0), // Due in 3 days
      priority: 'high',
      completed: false,
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: 'task-demo-3',
      title: 'PHYS 150: Review Optics Chapter 8 for Midterm',
      subject: 'Physics',
      deadline: getOffsetDateString(5, 10, 0), // Due in 5 days
      priority: 'medium',
      completed: false,
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
      id: 'task-demo-4',
      title: 'ENG 105: Submit First Draft of Analytical Essay',
      subject: 'Literature & Writing',
      deadline: getOffsetDateString(0, 18, 0), // Due today
      priority: 'medium',
      completed: true,
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
    {
      id: 'task-demo-5',
      title: 'CHEM 101: Pre-lab reading for Titration experiment',
      subject: 'Chemistry',
      deadline: getOffsetDateString(-1, 9, 0), // Overdue by 1 day
      priority: 'low',
      completed: false,
      createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    }
  ];

  // Helper function to create ISO string relative to today for demo data
  function getOffsetDateString(dayOffset, hour = 23, minute = 59) {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, minute, 0, 0);
    // Format as YYYY-MM-DDTHH:mm for datetime-local
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // --- State ---
  let tasks = [];
  let activeStatusFilter = 'all'; // 'all' | 'pending' | 'completed'
  let activePriorityFilter = 'all'; // 'all' | 'high' | 'medium' | 'low'
  let searchQuery = '';
  let activeSortOption = 'deadline-asc';
  let taskPendingDeletionId = null;

  // --- DOM Elements ---
  const taskForm = document.getElementById('task-form');
  const titleInput = document.getElementById('task-title');
  const titleError = document.getElementById('title-error');
  const subjectSelect = document.getElementById('task-subject');
  const customSubjectInput = document.getElementById('custom-subject-input');
  const deadlineInput = document.getElementById('task-deadline');
  const taskListContainer = document.getElementById('task-list-container');
  const emptyStateAll = document.getElementById('empty-state-all');
  const emptyStateFiltered = document.getElementById('empty-state-filtered');
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('btn-clear-search');
  const sortSelect = document.getElementById('sort-select');
  const priorityFilter = document.getElementById('filter-priority');
  const filterTabs = document.querySelectorAll('.filter-tabs .tab-btn');
  const resultsCountLabel = document.getElementById('results-count-label');
  const btnClearCompleted = document.getElementById('btn-clear-completed');
  const btnLoadDemo = document.getElementById('btn-load-demo');
  const btnEmptyDemo = document.getElementById('btn-empty-demo');
  const btnResetFilters = document.getElementById('btn-reset-filters');
  const dateText = document.getElementById('date-text');

  // Stats Counters
  const statTotal = document.getElementById('stat-total');
  const statPending = document.getElementById('stat-pending');
  const statCompleted = document.getElementById('stat-completed');
  const statUrgent = document.getElementById('stat-urgent');
  const badgeAll = document.getElementById('badge-all');
  const badgePending = document.getElementById('badge-pending');
  const badgeCompleted = document.getElementById('badge-completed');
  const progressPercentLabel = document.getElementById('progress-percent-label');
  const progressFillBar = document.getElementById('progress-fill-bar');

  // Modal Elements
  const confirmModal = document.getElementById('confirm-modal');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  const modalConfirmBtn = document.getElementById('modal-confirm-btn');

  // --- Initialization ---
  function init() {
    initCurrentDate();
    loadTasks();
    setupEventListeners();
    render();
  }

  // Display human-friendly date header
  function initCurrentDate() {
    const today = new Date();
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    if (dateText) {
      dateText.textContent = today.toLocaleDateString(undefined, options);
    }
  }

  // --- Persistence Layer ---
  function loadTasks() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        tasks = JSON.parse(stored);
        if (!Array.isArray(tasks)) {
          tasks = [];
        }
      } else {
        // If first time visit, tasks starts empty
        tasks = [];
      }
    } catch (err) {
      console.error('Failed to read from localStorage:', err);
      tasks = [];
      showToast('Could not load saved tasks from local storage.', 'error');
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
      showToast('Storage quota exceeded or storage disabled.', 'error');
    }
  }

  // --- Task Operations ---
  function addTask(taskData) {
    tasks.unshift(taskData);
    saveTasks();
    render();
    showToast(`Added: "${truncate(taskData.title, 30)}"`, 'success');
  }

  function toggleTaskCompletion(taskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    saveTasks();
    render();

    if (task.completed) {
      showToast('Task marked as completed! 🎉', 'success');
    } else {
      showToast('Task reopened.', 'info');
    }
  }

  function deleteTask(taskId) {
    const initialLen = tasks.length;
    tasks = tasks.filter((t) => t.id !== taskId);
    if (tasks.length < initialLen) {
      saveTasks();
      render();
      showToast('Task deleted.', 'info');
    }
  }

  function clearCompletedTasks() {
    const completedCount = tasks.filter((t) => t.completed).length;
    if (completedCount === 0) return;

    tasks = tasks.filter((t) => !t.completed);
    saveTasks();
    render();
    showToast(`Removed ${completedCount} completed task${completedCount > 1 ? 's' : ''}.`, 'info');
  }

  function loadDemoData() {
    // Merge or replacedemo
    tasks = [...DEMO_TASKS];
    saveTasks();
    render();
    showToast('Loaded 5 realistic college tasks!', 'success');
  }

  // --- Validation & Form Handling ---
  function handleFormSubmit(e) {
    e.preventDefault();

    const titleValue = titleInput.value.trim();

    // Title validation
    if (!titleValue) {
      titleInput.classList.add('input-error');
      titleError.classList.add('visible');
      titleInput.focus();
      return;
    }

    // Determine subject
    let subjectValue = subjectSelect.value;
    if (subjectValue === '__custom__') {
      const customSub = customSubjectInput.value.trim();
      subjectValue = customSub || 'General Study';
    }

    // Determine priority
    const priorityChecked = document.querySelector('input[name="priority"]:checked');
    const priorityValue = priorityChecked ? priorityChecked.value : 'medium';

    // Deadline
    const deadlineValue = deadlineInput.value ? deadlineInput.value : null;

    const newTask = {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      title: titleValue,
      subject: subjectValue,
      deadline: deadlineValue,
      priority: priorityValue,
      completed: false,
      createdAt: new Date().toISOString()
    };

    addTask(newTask);

    // Reset Form
    resetForm();
  }

  function resetForm() {
    taskForm.reset();
    titleInput.classList.remove('input-error');
    titleError.classList.remove('visible');
    customSubjectInput.classList.add('hidden');
    // Restore default priority selection
    const medRadio = document.getElementById('priority-medium');
    if (medRadio) medRadio.checked = true;
  }

  // --- Filtering & Sorting ---
  function getFilteredAndSortedTasks() {
    return tasks
      .filter((task) => {
        // Status filter
        if (activeStatusFilter === 'pending' && task.completed) return false;
        if (activeStatusFilter === 'completed' && !task.completed) return false;

        // Priority filter
        if (activePriorityFilter !== 'all' && task.priority !== activePriorityFilter) return false;

        // Search query filter (matches title or subject)
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const titleMatch = task.title.toLowerCase().includes(q);
          const subjectMatch = task.subject.toLowerCase().includes(q);
          if (!titleMatch && !subjectMatch) return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (activeSortOption) {
          case 'deadline-asc': {
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;
            return new Date(a.deadline) - new Date(b.deadline);
          }
          case 'deadline-desc': {
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;
            return new Date(b.deadline) - new Date(a.deadline);
          }
          case 'priority-desc': {
            const weight = { high: 3, medium: 2, low: 1 };
            const diff = weight[b.priority] - weight[a.priority];
            if (diff !== 0) return diff;
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          case 'created-desc': {
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          case 'alpha-asc': {
            return a.title.localeCompare(b.title);
          }
          default:
            return 0;
        }
      });
  }

  // --- Rendering Functions ---
  function render() {
    updateStatistics();
    renderTasksList();
  }

  function updateStatistics() {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;

    // Calculate urgent / overdue tasks (pending tasks with high priority OR overdue)
    const now = new Date();
    const urgent = tasks.filter((t) => {
      if (t.completed) return false;
      if (t.priority === 'high') return true;
      if (t.deadline) {
        return new Date(t.deadline) < now;
      }
      return false;
    }).length;

    // Update counts in DOM
    if (statTotal) statTotal.textContent = total;
    if (statPending) statPending.textContent = pending;
    if (statCompleted) statCompleted.textContent = completed;
    if (statUrgent) statUrgent.textContent = urgent;

    // Update tab badges
    if (badgeAll) badgeAll.textContent = total;
    if (badgePending) badgePending.textContent = pending;
    if (badgeCompleted) badgeCompleted.textContent = completed;

    // Update progress bar
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    if (progressPercentLabel) progressPercentLabel.textContent = `${percent}%`;
    if (progressFillBar) progressFillBar.style.width = `${percent}%`;

    // Toggle Clear Completed button visibility
    if (btnClearCompleted) {
      if (completed > 0) {
        btnClearCompleted.classList.remove('hidden');
      } else {
        btnClearCompleted.classList.add('hidden');
      }
    }
  }

  function renderTasksList() {
    const filteredTasks = getFilteredAndSortedTasks();
    const totalCount = tasks.length;
    const filteredCount = filteredTasks.length;

    // Update count label
    if (resultsCountLabel) {
      if (searchQuery || activeStatusFilter !== 'all' || activePriorityFilter !== 'all') {
        resultsCountLabel.textContent = `Showing ${filteredCount} of ${totalCount} task${totalCount === 1 ? '' : 's'}`;
      } else {
        resultsCountLabel.textContent = `Showing ${filteredCount} task${filteredCount === 1 ? '' : 's'}`;
      }
    }

    // Clear current container
    taskListContainer.innerHTML = '';

    // Handle Empty States
    if (totalCount === 0) {
      taskListContainer.classList.add('hidden');
      emptyStateAll.classList.remove('hidden');
      emptyStateFiltered.classList.add('hidden');
      return;
    }

    if (filteredCount === 0) {
      taskListContainer.classList.add('hidden');
      emptyStateAll.classList.add('hidden');
      emptyStateFiltered.classList.remove('hidden');
      return;
    }

    // If there are tasks to display
    taskListContainer.classList.remove('hidden');
    emptyStateAll.classList.add('hidden');
    emptyStateFiltered.classList.add('hidden');

    const fragment = document.createDocumentFragment();

    filteredTasks.forEach((task) => {
      const taskEl = createTaskCardElement(task);
      fragment.appendChild(taskEl);
    });

    taskListContainer.appendChild(fragment);
  }

  function createTaskCardElement(task) {
    const card = document.createElement('div');
    card.className = `task-item priority-${task.priority} ${task.completed ? 'completed' : ''}`;
    card.setAttribute('data-id', task.id);
    card.setAttribute('role', 'listitem');

    // Deadline metadata calculations
    const deadlineInfo = formatDeadline(task.deadline, task.completed);

    card.innerHTML = `
      <button 
        type="button" 
        class="task-checkbox-btn" 
        data-action="toggle" 
        data-id="${escapeHtml(task.id)}"
        aria-label="${task.completed ? 'Mark task as incomplete' : 'Mark task as complete'}"
      >
        <span class="custom-checkbox-circle">
          <svg class="checkbox-checkmark" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
      </button>

      <div class="task-content">
        <div class="task-title">${escapeHtml(task.title)}</div>
        <div class="task-meta">
          <span class="badge badge-subject">${escapeHtml(task.subject)}</span>
          <span class="badge badge-priority-${task.priority}">
            <span class="priority-dot dot-${task.priority}"></span>
            ${capitalize(task.priority)}
          </span>
          ${deadlineInfo ? `<span class="deadline-pill ${deadlineInfo.statusClass}">${deadlineInfo.html}</span>` : ''}
        </div>
      </div>

      <div class="task-actions">
        <button 
          type="button" 
          class="btn-icon btn-delete" 
          data-action="delete" 
          data-id="${escapeHtml(task.id)}"
          aria-label="Delete task ${escapeHtml(task.title)}"
          title="Delete task"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>
    `;

    return card;
  }

  // --- Deadline Formatting Helper ---
  function formatDeadline(deadlineString, isCompleted) {
    if (!deadlineString) return null;

    const due = new Date(deadlineString);
    if (isNaN(due.getTime())) return null;

    const now = new Date();
    const diffMs = due - now;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    const dateOptions = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    const formattedDate = due.toLocaleDateString(undefined, dateOptions);

    let statusClass = '';
    let label = formattedDate;

    if (!isCompleted) {
      if (diffMs < 0) {
        statusClass = 'overdue';
        label = `⚠️ Overdue (${formattedDate})`;
      } else if (diffHours <= 24) {
        statusClass = 'due-today';
        label = `🚨 Due Today (${due.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })})`;
      } else if (diffDays <= 3) {
        statusClass = 'due-soon';
        label = `⏰ In ${Math.ceil(diffDays)} days (${formattedDate})`;
      }
    }

    return {
      statusClass,
      html: `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <span>${escapeHtml(label)}</span>
      `
    };
  }

  // --- Modal Helpers ---
  function promptDeleteConfirmation(taskId) {
    taskPendingDeletionId = taskId;
    const task = tasks.find((t) => t.id === taskId);
    const modalDesc = document.getElementById('modal-desc');
    if (task && modalDesc) {
      modalDesc.textContent = `Are you sure you want to delete "${truncate(task.title, 40)}"? This cannot be undone.`;
    }
    confirmModal.classList.remove('hidden');
    modalConfirmBtn.focus();
  }

  function closeModal() {
    confirmModal.classList.add('hidden');
    taskPendingDeletionId = null;
  }

  // --- Toast Notification System ---
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-completed); flex-shrink: 0;"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--priority-high); flex-shrink: 0;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else {
      iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-primary); flex-shrink: 0;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  // --- Utility Functions ---
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function truncate(str, max = 35) {
    if (!str) return '';
    return str.length > max ? str.substring(0, max) + '...' : str;
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // 1. Task Form Submission
    taskForm.addEventListener('submit', handleFormSubmit);

    // 2. Real-time input validation on title typing
    titleInput.addEventListener('input', () => {
      if (titleInput.value.trim()) {
        titleInput.classList.remove('input-error');
        titleError.classList.remove('visible');
      }
    });

    // 3. Custom subject selector change
    subjectSelect.addEventListener('change', () => {
      if (subjectSelect.value === '__custom__') {
        customSubjectInput.classList.remove('hidden');
        customSubjectInput.focus();
      } else {
        customSubjectInput.classList.add('hidden');
      }
    });

    // 4. Task List Event Delegation (Toggle complete & Delete)
    taskListContainer.addEventListener('click', (e) => {
      const toggleBtn = e.target.closest('[data-action="toggle"]');
      if (toggleBtn) {
        const taskId = toggleBtn.getAttribute('data-id');
        toggleTaskCompletion(taskId);
        return;
      }

      const deleteBtn = e.target.closest('[data-action="delete"]');
      if (deleteBtn) {
        const taskId = deleteBtn.getAttribute('data-id');
        promptDeleteConfirmation(taskId);
        return;
      }
    });

    // 5. Search Bar Input
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value.trim();
      if (searchQuery) {
        clearSearchBtn.classList.remove('hidden');
      } else {
        clearSearchBtn.classList.add('hidden');
      }
      renderTasksList();
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.classList.add('hidden');
      searchInput.focus();
      renderTasksList();
    });

    // 6. Sort Select
    sortSelect.addEventListener('change', () => {
      activeSortOption = sortSelect.value;
      renderTasksList();
    });

    // 7. Priority Filter Dropdown
    priorityFilter.addEventListener('change', () => {
      activePriorityFilter = priorityFilter.value;
      renderTasksList();
    });

    // 8. Filter Tabs (Status: All, Pending, Completed)
    filterTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        filterTabs.forEach((t) => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        activeStatusFilter = tab.getAttribute('data-status');
        renderTasksList();
      });
    });

    // 9. Batch Actions & Demo Buttons
    btnClearCompleted.addEventListener('click', clearCompletedTasks);
    btnLoadDemo.addEventListener('click', loadDemoData);
    btnEmptyDemo.addEventListener('click', loadDemoData);

    btnResetFilters.addEventListener('click', () => {
      // Reset search
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.classList.add('hidden');

      // Reset priority filter
      priorityFilter.value = 'all';
      activePriorityFilter = 'all';

      // Reset tab to All
      filterTabs.forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      const tabAll = document.getElementById('tab-all');
      if (tabAll) {
        tabAll.classList.add('active');
        tabAll.setAttribute('aria-selected', 'true');
      }
      activeStatusFilter = 'all';

      renderTasksList();
      showToast('Filters reset.', 'info');
    });

    // 10. Delete Modal Handlers
    modalCancelBtn.addEventListener('click', closeModal);
    modalConfirmBtn.addEventListener('click', () => {
      if (taskPendingDeletionId) {
        deleteTask(taskPendingDeletionId);
      }
      closeModal();
    });

    confirmModal.addEventListener('click', (e) => {
      if (e.target === confirmModal) {
        closeModal();
      }
    });

    // 11. Keyboard Shortcuts (Escape closes modal)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!confirmModal.classList.contains('hidden')) {
          closeModal();
        } else if (searchQuery) {
          searchInput.value = '';
          searchQuery = '';
          clearSearchBtn.classList.add('hidden');
          renderTasksList();
        }
      }
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
