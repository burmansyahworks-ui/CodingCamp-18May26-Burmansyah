/**
 * Personal Dashboard - Cyberpunk/Retro UI
 */
(function () {

  // ===========================
  // TimeUtils
  // ===========================
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function getGreeting(hour) {
    if (hour >= 5 && hour <= 11) return 'GOOD MORNING';
    if (hour >= 12 && hour <= 17) return 'GOOD AFTERNOON';
    if (hour >= 18 && hour <= 21) return 'GOOD EVENING';
    return 'GOOD NIGHT';
  }

  function formatTime(date) {
    var h = String(date.getHours()).padStart(2, '0');
    var m = String(date.getMinutes()).padStart(2, '0');
    var s = String(date.getSeconds()).padStart(2, '0');
    return h + ':' + m + ':' + s;
  }

  function formatDate(date) {
    return DAYS[date.getDay()] + ', ' + MONTHS[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
  }

  function formatTimer(totalSeconds) {
    var min = Math.floor(totalSeconds / 60);
    var sec = totalSeconds % 60;
    return (min < 10 ? '0' : '') + min + ':' + (sec < 10 ? '0' : '') + sec;
  }

  // ===========================
  // StorageUtils
  // ===========================
  function storageIsAvailable() {
    try { localStorage.setItem('__t__', '1'); localStorage.removeItem('__t__'); return true; }
    catch (e) { return false; }
  }

  function storageSave(key, data) {
    if (!storageIsAvailable()) return { success: false };
    try { localStorage.setItem(key, JSON.stringify(data)); return { success: true }; }
    catch (e) { return { success: false }; }
  }

  function storageLoad(key, validator) {
    if (!storageIsAvailable()) return { data: null, valid: false };
    try {
      var raw = localStorage.getItem(key);
      if (raw === null) return { data: null, valid: true };
      var parsed = JSON.parse(raw);
      if (typeof validator === 'function' && !validator(parsed)) return { data: null, valid: false };
      return { data: parsed, valid: true };
    } catch (e) { return { data: null, valid: false }; }
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ===========================
  // Settings
  // ===========================
  var settings = { name: '', pomodoroDuration: 25 };

  function loadSettings() {
    var result = storageLoad('dashboard_settings', function (d) { return d && typeof d === 'object'; });
    if (result.valid && result.data) {
      settings.name = result.data.name || '';
      settings.pomodoroDuration = result.data.pomodoroDuration || 25;
    }
  }

  function saveSettings() { storageSave('dashboard_settings', settings); }

  // ===========================
  // Theme Toggle (dark default, toggle to light)
  // ===========================
  function initThemeToggle() {
    var btn = document.getElementById('theme-toggle');
    var isLight = localStorage.getItem('dashboard_theme') === 'light';
    if (isLight) { document.body.classList.add('light-mode'); btn.textContent = '●'; }

    btn.onclick = function () {
      document.body.classList.toggle('light-mode');
      var light = document.body.classList.contains('light-mode');
      btn.textContent = light ? '●' : '◐';
      localStorage.setItem('dashboard_theme', light ? 'light' : 'dark');
    };
  }

  // ===========================
  // Settings Panel
  // ===========================
  var onSettingsSave = null;

  function initSettingsPanel() {
    var panel = document.getElementById('settings-panel');
    var toggleBtn = document.getElementById('settings-toggle');
    var saveBtn = document.getElementById('settings-save');
    var closeBtn = document.getElementById('settings-close');
    var nameInput = document.getElementById('setting-name');
    var pomodoroInput = document.getElementById('setting-pomodoro');

    toggleBtn.onclick = function () {
      nameInput.value = settings.name;
      pomodoroInput.value = settings.pomodoroDuration;
      panel.style.display = 'flex';
    };

    closeBtn.onclick = function () { panel.style.display = 'none'; };

    saveBtn.onclick = function () {
      settings.name = nameInput.value.trim();
      var dur = parseInt(pomodoroInput.value, 10);
      if (dur >= 1 && dur <= 120) settings.pomodoroDuration = dur;
      saveSettings();
      panel.style.display = 'none';
      if (onSettingsSave) onSettingsSave();
    };

    panel.onclick = function (e) { if (e.target === panel) panel.style.display = 'none'; };
  }

  // ===========================
  // Greeting Widget (Yellow)
  // ===========================
  function initGreetingWidget(container) {
    container.innerHTML =
      '<div class="greeting-label">SYSTEM TIME</div>' +
      '<div class="greeting-time"></div>' +
      '<div class="greeting-date"></div>' +
      '<div class="greeting-message"></div>' +
      '<div class="time-corner">⤴</div>' +
      '<div class="time-tag">CORP.™ ◉</div>';

    var timeEl = container.querySelector('.greeting-time');
    var dateEl = container.querySelector('.greeting-date');
    var greetingEl = container.querySelector('.greeting-message');

    function update() {
      var now = new Date();
      timeEl.textContent = formatTime(now);
      dateEl.textContent = formatDate(now);
      var greeting = getGreeting(now.getHours());
      greetingEl.textContent = settings.name ? greeting + ', ' + settings.name.toUpperCase() : greeting;
    }

    update();
    setInterval(update, 1000);
    return update;
  }

  // ===========================
  // Focus Timer (Green)
  // ===========================
  var timerReset = null;

  function initFocusTimer(container) {
    var remaining = settings.pomodoroDuration * 60;
    var running = false;
    var timer = null;

    function renderTimer() {
      container.innerHTML =
        '<div class="timer-label">FOCUS TIMER</div>' +
        '<div class="timer-display">' + formatTimer(remaining) + '</div>' +
        '<div class="timer-controls">' +
        '<button type="button" class="btn-start" id="btn-start">START</button>' +
        '<button type="button" class="btn-stop" id="btn-stop">STOP</button>' +
        '<button type="button" class="btn-reset" id="btn-reset">RESET</button>' +
        '</div>' +
        '<div class="timer-notification" id="timer-notif" style="display:none;"></div>' +
        '<div class="timer-dot"></div>';

      var display = container.querySelector('.timer-display');
      var notif = container.querySelector('#timer-notif');

      function updateDisplay() { display.textContent = formatTimer(remaining); }

      function tick() {
        remaining--;
        updateDisplay();
        if (remaining <= 0) {
          clearInterval(timer); timer = null; running = false;
          notif.textContent = '// SESSION COMPLETE';
          notif.style.display = 'block';
        }
      }

      container.querySelector('#btn-start').onclick = function () {
        if (running || remaining <= 0) return;
        running = true;
        notif.style.display = 'none';
        timer = setInterval(tick, 1000);
      };

      container.querySelector('#btn-stop').onclick = function () {
        if (!running) return;
        running = false; clearInterval(timer); timer = null;
      };

      container.querySelector('#btn-reset').onclick = function () {
        running = false; clearInterval(timer); timer = null;
        remaining = settings.pomodoroDuration * 60;
        updateDisplay();
        notif.style.display = 'none';
      };
    }

    renderTimer();
    timerReset = function () {
      if (timer) clearInterval(timer);
      timer = null; running = false;
      remaining = settings.pomodoroDuration * 60;
      renderTimer();
    };
  }

  // ===========================
  // Todo List (Red)
  // ===========================
  function initTodoList(container) {
    var STORAGE_KEY = 'dashboard_todos';
    var MAX_LEN = 200;
    var tasks = [];
    var sortMode = 'newest';

    function loadTasks() {
      var result = storageLoad(STORAGE_KEY, function (data) {
        return Array.isArray(data) && data.every(function (t) {
          return t && typeof t.id === 'string' && typeof t.text === 'string' && typeof t.completed === 'boolean';
        });
      });
      if (!result.valid) { storageSave(STORAGE_KEY, []); return []; }
      return result.data || [];
    }

    function saveTasks() { storageSave(STORAGE_KEY, tasks); }
    function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

    function isDuplicate(text) {
      var n = text.trim().toLowerCase();
      return tasks.some(function (t) { return t.text.toLowerCase() === n; });
    }

    function getSortedTasks() {
      var s = tasks.slice();
      switch (sortMode) {
        case 'oldest': break;
        case 'alpha': s.sort(function (a, b) { return a.text.toLowerCase().localeCompare(b.text.toLowerCase()); }); break;
        case 'completed': s.sort(function (a, b) { return a.completed === b.completed ? 0 : a.completed ? 1 : -1; }); break;
        default: s.reverse();
      }
      return s;
    }

    function getSortLabel() {
      switch (sortMode) {
        case 'oldest': return '↑OLD';
        case 'alpha': return 'A-Z';
        case 'completed': return '✓DN';
        default: return '↓NEW';
      }
    }

    function nextSort() {
      var modes = ['newest', 'oldest', 'alpha', 'completed'];
      sortMode = modes[(modes.indexOf(sortMode) + 1) % modes.length];
      render();
    }

    function render() {
      var sorted = getSortedTasks();
      var html = '<div class="tasks-label">TASK MODULE</div>' +
        '<div class="tasks-header"><h2>TASKS</h2>' +
        '<button type="button" class="todo-sort-btn" id="todo-sort">' + getSortLabel() + '</button></div>' +
        '<form class="todo-form" id="todo-form">' +
        '<input type="text" class="todo-input" id="todo-input" placeholder="New task..." maxlength="' + MAX_LEN + '">' +
        '<button type="submit" class="todo-add-btn">+ADD</button></form>' +
        '<div class="todo-duplicate-error" id="todo-dup-error" style="display:none;"></div>' +
        '<ul class="todo-tasks">';

      for (var i = 0; i < sorted.length; i++) {
        var t = sorted[i];
        html += '<li class="todo-task' + (t.completed ? ' completed' : '') + '" data-id="' + t.id + '">' +
          '<input type="checkbox" class="todo-checkbox"' + (t.completed ? ' checked' : '') + '>' +
          '<span class="todo-task-text">' + escapeHtml(t.text) + '</span>' +
          '<button type="button" class="todo-delete-btn">×</button></li>';
      }
      html += '</ul><div class="corner-kanji">Revou.Project</div>';
      container.innerHTML = html;

      container.querySelector('#todo-sort').onclick = nextSort;

      container.querySelector('#todo-form').onsubmit = function (e) {
        e.preventDefault();
        var input = container.querySelector('#todo-input');
        var text = input.value.trim();
        var dupErr = container.querySelector('#todo-dup-error');
        if (!text || text.length > MAX_LEN) return;
        if (isDuplicate(text)) {
          dupErr.textContent = '// DUPLICATE DETECTED';
          dupErr.style.display = 'block';
          setTimeout(function () { dupErr.style.display = 'none'; }, 3000);
          return;
        }
        dupErr.style.display = 'none';
        tasks.push({ id: genId(), text: text, completed: false });
        saveTasks(); input.value = ''; render();
      };

      var items = container.querySelectorAll('.todo-task');
      for (var j = 0; j < items.length; j++) {
        (function (li) {
          var id = li.getAttribute('data-id');
          li.querySelector('.todo-checkbox').onchange = function () {
            var task = tasks.find(function (t) { return t.id === id; });
            if (task) { task.completed = !task.completed; saveTasks(); render(); }
          };
          li.querySelector('.todo-delete-btn').onclick = function () {
            tasks = tasks.filter(function (t) { return t.id !== id; });
            saveTasks(); render();
          };
        })(items[j]);
      }
    }

    tasks = loadTasks();
    render();
  }

  // ===========================
  // Quick Links (Gray)
  // ===========================
  function initQuickLinks(container) {
    var STORAGE_KEY = 'dashboard_links';
    var MAX_LINKS = 20;
    var MAX_LABEL = 50;
    var links = [];

    function loadLinks() {
      var result = storageLoad(STORAGE_KEY, function (data) {
        return Array.isArray(data) && data.every(function (l) {
          return l && typeof l.id === 'string' && typeof l.label === 'string' && typeof l.url === 'string';
        });
      });
      if (!result.valid) { storageSave(STORAGE_KEY, []); return []; }
      return result.data || [];
    }

    function saveLinks() { storageSave(STORAGE_KEY, links); }
    function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

    function render() {
      var linksHtml = '';
      for (var i = 0; i < links.length; i++) {
        var l = links[i];
        linksHtml += '<div class="quick-link-item">' +
          '<a href="' + escapeHtml(l.url) + '" target="_blank" rel="noopener noreferrer" class="quick-link-button">' + escapeHtml(l.label) + '</a>' +
          '<button type="button" class="quick-link-delete" data-id="' + l.id + '">×</button></div>';
      }

      container.innerHTML =
        '<div class="links-label">QUICK ACCESS</div>' +
        '<div class="links-title">LINKS</div>' +
        '<form class="quick-links-form" id="links-form">' +
        '<input type="text" class="quick-links-label-input" id="link-label" placeholder="Name" maxlength="' + MAX_LABEL + '">' +
        '<input type="text" class="quick-links-url-input" id="link-url" placeholder="URL">' +
        '<button type="submit">+ADD</button></form>' +
        '<div class="quick-links-error" id="links-error" style="display:none;"></div>' +
        '<div class="quick-links-list">' + linksHtml + '</div>' +
        '<div class="links-big-number">' + String(links.length).padStart(2, '0') + '</div>';

      container.querySelector('#links-form').onsubmit = function (e) {
        e.preventDefault();
        var label = container.querySelector('#link-label').value.trim();
        var url = container.querySelector('#link-url').value.trim();
        var errEl = container.querySelector('#links-error');
        if (!label) { errEl.textContent = '// LABEL REQUIRED'; errEl.style.display = 'block'; return; }
        if (!url.startsWith('http://') && !url.startsWith('https://')) { errEl.textContent = '// INVALID URL'; errEl.style.display = 'block'; return; }
        if (links.length >= MAX_LINKS) { errEl.textContent = '// MAX REACHED'; errEl.style.display = 'block'; return; }
        errEl.style.display = 'none';
        links.push({ id: genId(), label: label, url: url });
        saveLinks(); render();
      };

      var delBtns = container.querySelectorAll('.quick-link-delete');
      for (var j = 0; j < delBtns.length; j++) {
        (function (btn) {
          btn.onclick = function () {
            links = links.filter(function (l) { return l.id !== btn.getAttribute('data-id'); });
            saveLinks(); render();
          };
        })(delBtns[j]);
      }
    }

    links = loadLinks();
    render();
  }

  // ===========================
  // Init
  // ===========================
  document.addEventListener('DOMContentLoaded', function () {
    loadSettings();
    initThemeToggle();
    initSettingsPanel();

    var greetingUpdate = initGreetingWidget(document.getElementById('greeting-widget'));
    initFocusTimer(document.getElementById('focus-timer'));
    initTodoList(document.getElementById('todo-list'));
    initQuickLinks(document.getElementById('quick-links'));

    onSettingsSave = function () {
      greetingUpdate();
      if (timerReset) timerReset();
    };
  });

})();
