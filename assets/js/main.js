/* =========================================================
   BloomOS — shared app script
   One state store (localStorage), one shell, a renderer per page.
   ========================================================= */
(() => {
  'use strict';

  const KEY = 'bloomos:v2';
  const UI_KEY = 'bloomos:ui';
  const DAY = 864e5;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 10);
  const pad = n => String(n).padStart(2, '0');
  const dayKey = (d = new Date()) => { const x = new Date(d); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };
  const daysFrom = n => dayKey(Date.now() + n * DAY);
  const parseDay = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const daysUntil = k => Math.round((parseDay(k) - parseDay(dayKey())) / DAY);
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

  function timeAgo(ts) {
    const s = Math.max(0, (Date.now() - ts) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    const d = Math.floor(s / 86400);
    return d === 1 ? 'yesterday' : `${d}d ago`;
  }

  /* ---------------------------------------------------------
     CATALOG (static course data)
     --------------------------------------------------------- */

  const CATALOG = [
    { id: 'python', title: 'Python Programming', icon: 'fa-brands fa-python', c: ['#266be0', '#19cce1'], level: 'Beginner → Advanced', cat: 'Programming', lessons: 25, hours: 18, plant: 'Lotus',
      desc: 'From variables to decorators — write clean, expressive Python with confidence.',
      topics: ['Variables & types', 'Control flow', 'Functions', 'Recursion', 'Collections', 'Files & errors', 'Classes', 'Modules & packages'],
      tip: 'Write a function that calculates factorials — first with a loop, then recursively.' },
    { id: 'web', title: 'Web Development', icon: 'fa-solid fa-code', c: ['#188fe8', '#23d9e9'], level: 'Beginner → Advanced', cat: 'Programming', lessons: 20, hours: 22, plant: 'Fern',
      desc: 'Build responsive, accessible sites with HTML, CSS and modern JavaScript.',
      topics: ['Semantic HTML', 'CSS layout', 'Flexbox', 'CSS Grid', 'JavaScript basics', 'The DOM', 'Fetch & APIs', 'Deploying'],
      tip: 'Rebuild a card layout you like with CSS Grid — then make it work at 400px wide.' },
    { id: 'data', title: 'Data Structures', icon: 'fa-solid fa-diagram-project', c: ['#00bba7', '#287be7'], level: 'Intermediate → Advanced', cat: 'Computer science', lessons: 20, hours: 16, plant: 'Blossom',
      desc: 'Arrays, trees, graphs and hash maps — and when to reach for each one.',
      topics: ['Big-O thinking', 'Arrays', 'Linked lists', 'Stacks & queues', 'Hash maps', 'Trees', 'Heaps', 'Graphs'],
      tip: 'Implement a stack with an array, then use it to check for balanced brackets.' },
    { id: 'design', title: 'UI/UX Design', icon: 'fa-solid fa-pen-nib', c: ['#ff9e44', '#f14dbb'], level: 'Beginner → Advanced', cat: 'Design', lessons: 20, hours: 14, plant: 'Orchid',
      desc: 'Research, wireframe and prototype interfaces people genuinely enjoy using.',
      topics: ['Design thinking', 'User research', 'Information architecture', 'Wireframing', 'Visual hierarchy', 'Color & type', 'Prototyping', 'Usability testing'],
      tip: 'Sketch three different layouts for the same screen before choosing one.' },
    { id: 'csharp', title: 'C# Development', icon: 'fa-solid fa-hashtag', c: ['#983bff', '#5a42de'], level: 'Beginner → Intermediate', cat: 'Programming', lessons: 22, hours: 20, plant: 'Iris',
      desc: 'Strongly-typed, object-oriented programming for apps, games and services.',
      topics: ['Syntax & types', 'Methods', 'Classes & objects', 'Interfaces', 'Collections & LINQ', 'Async/await', 'Testing', 'Building an API'],
      tip: 'Model a small library system with classes for Book, Member and Loan.' },
    { id: 'ml', title: 'Machine Learning Basics', icon: 'fa-solid fa-brain', c: ['#ff5c8a', '#ffa05c'], level: 'Intermediate', cat: 'Data', lessons: 24, hours: 26, plant: 'Sunflower',
      desc: 'Understand models, training and evaluation — then build your first classifier.',
      topics: ['What is ML?', 'Preparing data', 'Regression', 'Classification', 'Evaluation', 'Overfitting', 'Trees & forests', 'Neural networks'],
      tip: 'Plot a tiny dataset by hand and guess the best-fit line before computing it.' },
    { id: 'git', title: 'Git & Collaboration', icon: 'fa-solid fa-code-branch', c: ['#22c993', '#4bdcff'], level: 'Beginner', cat: 'Tools', lessons: 12, hours: 6, plant: 'Clover',
      desc: 'Commits, branches and pull requests — work confidently with a team.',
      topics: ['Commits', 'Branches', 'Merging', 'Remotes', 'Pull requests', 'Resolving conflicts'],
      tip: 'Create a repo, make three commits, then undo the last one with git revert.' },
  ];
  const courseById = id => CATALOG.find(c => c.id === id);

  const PAGES = [
    { id: 'home', href: 'index.html', label: 'Home', icon: 'fa-house', hint: 'Dashboard & living garden' },
    { id: 'garden', href: 'garden.html', label: 'My Garden', icon: 'fa-spa', hint: 'Every skill as a growing plant' },
    { id: 'courses', href: 'courses.html', label: 'Courses', icon: 'fa-book-open', hint: 'Browse and continue courses' },
    { id: 'goals', href: 'goals.html', label: 'Goals', icon: 'fa-bullseye', hint: 'Milestones and deadlines' },
    { id: 'achievements', href: 'achievements.html', label: 'Achievements', icon: 'fa-trophy', hint: 'Badges you have earned' },
    { id: 'community', href: 'community.html', label: 'Community', icon: 'fa-users', hint: 'Share and learn together' },
    { id: 'settings', href: 'settings.html', label: 'Settings', icon: 'fa-gear', hint: 'Profile and preferences' },
  ];

  const PEOPLE = {
    'Elena Rostova': ['#ff5c8a', '#ffa05c'],
    'Marcus Chen': ['#188fe8', '#23d9e9'],
    'Amara Okafor': ['#22c993', '#4bdcff'],
    'Diego Alvarez': ['#983bff', '#5a42de'],
    'Priya Nair': ['#ff9e44', '#f14dbb'],
  };

  const SEEDS_OF_WISDOM = [
    'Small steps, taken daily, become a forest.',
    'Understanding grows in the quiet after practice.',
    'Every expert was once a beginner who kept going.',
    'Water the skill you want to grow today.',
    'Curiosity is the best fertiliser.',
    'Progress, not perfection.',
    'Teach one thing you learned today — it roots deeper.',
  ];

  /* ---------------------------------------------------------
     STATE
     --------------------------------------------------------- */

  const DEFAULT_SETTINGS = { theme: 'light', textSize: 'normal', dailyGoal: 2, reminders: true, ripples: true, reduceMotion: false, accent: 'violet' };

  function seed() {
    const now = Date.now();
    return {
      v: 2,
      user: { name: 'Chibuike', role: 'Learner' },
      settings: { ...DEFAULT_SETTINGS },
      onboarded: false,
      progress: {
        python: { done: 18, last: now - 3 * 36e5 },
        data: { done: 12, last: now - 1 * DAY },
        web: { done: 9, last: now - 2 * DAY },
        design: { done: 7, last: now - 5 * DAY },
      },
      lastCourse: 'python',
      log: { [daysFrom(-6)]: 1, [daysFrom(-5)]: 2, [daysFrom(-4)]: 1, [daysFrom(-3)]: 3, [daysFrom(-2)]: 1, [daysFrom(-1)]: 2 },
      goals: [
        { id: uid(), title: 'Complete Python Programming', courseId: 'python', due: daysFrom(10), created: now },
        { id: uid(), title: 'Build a full-stack portfolio website', courseId: 'web', due: daysFrom(21), created: now },
        { id: uid(), title: 'Solve 30 algorithm problems', target: 30, current: 18, unit: 'problems', due: daysFrom(3), created: now },
      ],
      posts: [
        { id: uid(), author: 'Elena Rostova', tag: 'Win', text: 'Just bloomed my Python lotus to 70%! Functions finally clicked into place today. 🌸', time: now - 2 * 36e5, likes: 14, liked: false },
        { id: uid(), author: 'Marcus Chen', tag: 'Question', text: 'Does anyone have tips for mastering CSS Grid layouts? Looking to level up my web garden.', time: now - 5 * 36e5, likes: 6, liked: false },
        { id: uid(), author: 'Amara Okafor', tag: 'Tip', text: 'Explaining a concept out loud (even to a plant 🌱) is the fastest way I have found to spot the gaps in what I know.', time: now - 26 * 36e5, likes: 21, liked: false },
      ],
      notifications: [
        { id: uid(), icon: 'fa-seedling', text: 'Your Python lotus is over 70% bloomed — keep watering!', time: now - 3 * 36e5, read: false },
        { id: uid(), icon: 'fa-comment', text: 'Marcus Chen asked the community about CSS Grid.', time: now - 5 * 36e5, read: false },
        { id: uid(), icon: 'fa-bullseye', text: '“Solve 30 algorithm problems” is due in 3 days.', time: now - 20 * 36e5, read: true },
      ],
      unlocked: [],
      postsMade: 0,
      likesGiven: 0,
    };
  }

  function migrate(s) {
    if (!s || s.v !== 2 || !s.progress) return null;
    s.settings = { ...DEFAULT_SETTINGS, ...s.settings };
    if (s.onboarded === undefined) s.onboarded = true;
    return s;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = migrate(JSON.parse(raw));
        if (s) return s;
      }
    } catch (_) { /* storage unavailable or corrupt — fall back to seed */ }
    return seed();
  }

  let state = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {} };

  let ui = {};
  try { ui = JSON.parse(localStorage.getItem(UI_KEY)) || {}; } catch (_) {}
  const saveUi = () => { try { localStorage.setItem(UI_KEY, JSON.stringify(ui)); } catch (_) {} };

  /* ---------------------------------------------------------
     DERIVED VALUES
     --------------------------------------------------------- */

  const done = id => state.progress[id]?.done ?? 0;
  const enrolled = id => id in state.progress;
  const pct = id => Math.round(done(id) / courseById(id).lessons * 100);
  const statusOf = id => !enrolled(id) ? 'new' : done(id) >= courseById(id).lessons ? 'done' : 'active';
  const enrolledCourses = () => CATALOG.filter(c => enrolled(c.id));
  const totalDone = () => Object.values(state.progress).reduce((a, p) => a + p.done, 0);
  const todayCount = () => state.log[dayKey()] || 0;

  function overallPct() {
    const list = enrolledCourses();
    const total = list.reduce((a, c) => a + c.lessons, 0);
    return total ? Math.round(list.reduce((a, c) => a + done(c.id), 0) / total * 100) : 0;
  }

  function streak() {
    let n = 0;
    let d = state.log[dayKey()] ? 0 : -1; // today not studied yet doesn't break the streak
    while ((state.log[daysFrom(d)] || 0) > 0) { n++; d--; }
    return n;
  }

  function bestStreak() {
    const days = Object.keys(state.log).filter(k => state.log[k] > 0).sort();
    let best = 0, run = 0, prev = null;
    for (const k of days) {
      run = prev && Math.round((parseDay(k) - parseDay(prev)) / DAY) === 1 ? run + 1 : 1;
      best = Math.max(best, run); prev = k;
    }
    return best;
  }

  const lessonsSince = n => Array.from({ length: n }, (_, i) => state.log[daysFrom(-i)] || 0).reduce((a, b) => a + b, 0);
  const level = () => 1 + Math.floor(totalDone() / 10);

  function goalProgress(g) {
    if (g.courseId) { const c = courseById(g.courseId); return { cur: done(g.courseId), target: c.lessons, unit: 'lessons' }; }
    return { cur: g.current, target: g.target, unit: g.unit || 'steps' };
  }
  const goalDone = g => { const p = goalProgress(g); return p.cur >= p.target; };

  function stageOf(p) {
    if (p <= 0) return 'Seed';
    if (p < 25) return 'Sprout';
    if (p < 50) return 'Growing';
    if (p < 75) return 'Budding';
    if (p < 100) return 'Blooming';
    return 'Full bloom';
  }

  function healthOf(id) {
    const last = state.progress[id]?.last;
    if (!last) return { label: 'Dormant', icon: 'fa-moon', color: 'var(--faint)' };
    if (statusOf(id) === 'done') return { label: 'Flourishing', icon: 'fa-sun', color: 'var(--green)' };
    const d = (Date.now() - last) / DAY;
    if (d <= 2.5) return { label: 'Thriving', icon: 'fa-circle-check', color: 'var(--green)' };
    if (d <= 6) return { label: 'Thirsty', icon: 'fa-droplet', color: 'var(--amber)' };
    return { label: 'Wilting', icon: 'fa-triangle-exclamation', color: 'var(--red)' };
  }

  /* ---------------------------------------------------------
     ACHIEVEMENTS
     --------------------------------------------------------- */

  const ACHIEVEMENTS = [
    { id: 'seed', title: 'First Seed', desc: 'Complete your first lesson', icon: 'fa-seedling', c: ['#22c993', '#54f0b0'], prog: () => [Math.min(totalDone(), 1), 1] },
    { id: 'streak3', title: 'Taking Root', desc: 'Learn 3 days in a row', icon: 'fa-fire', c: ['#ff9e44', '#ff5c8a'], prog: () => [Math.min(bestStreak(), 3), 3] },
    { id: 'fast', title: 'Fast Learner', desc: 'Finish 3 lessons in one day', icon: 'fa-bolt', c: ['#ffc163', '#ff9e44'], prog: () => [Math.min(Math.max(0, ...Object.values(state.log)), 3), 3] },
    { id: 'gardener', title: 'Gardener', desc: 'Plant 4 different skills', icon: 'fa-leaf', c: ['#00bba7', '#287be7'], prog: () => [Math.min(enrolledCourses().length, 4), 4] },
    { id: 'streak7', title: 'Week of Growth', desc: 'Learn 7 days in a row', icon: 'fa-fire-flame-curved', c: ['#ff5c8a', '#ed5ce8'], prog: () => [Math.min(bestStreak(), 7), 7] },
    { id: 'fifty', title: 'Deep Roots', desc: 'Complete 50 lessons', icon: 'fa-tree', c: ['#22c993', '#188fe8'], prog: () => [Math.min(totalDone(), 50), 50] },
    { id: 'bloom', title: 'Full Bloom', desc: 'Finish an entire course', icon: 'fa-spa', c: ['#9c63ff', '#ed5ce8'], prog: () => [Math.max(0, ...CATALOG.map(c => pct(c.id))), 100] },
    { id: 'goal', title: 'Goal Getter', desc: 'Complete one of your goals', icon: 'fa-bullseye', c: ['#4bdcff', '#3b8cff'], prog: () => [Math.min(state.goals.filter(goalDone).length, 1), 1] },
    { id: 'voice', title: 'Community Voice', desc: 'Share your first post', icon: 'fa-comment-dots', c: ['#983bff', '#4bdcff'], prog: () => [Math.min(state.postsMade, 1), 1] },
    { id: 'kind', title: 'Kind Gardener', desc: 'Cheer on 3 posts from others', icon: 'fa-heart', c: ['#ff5c8a', '#f14dbb'], prog: () => [Math.min(state.likesGiven, 3), 3] },
    { id: 'polyglot', title: 'Cross-Pollinator', desc: 'Complete lessons in 3 categories', icon: 'fa-shuffle', c: ['#ffa05c', '#ffc163'], prog: () => [Math.min(new Set(CATALOG.filter(c => done(c.id) > 0).map(c => c.cat)).size, 3), 3] },
    { id: 'century', title: 'Ancient Oak', desc: 'Complete 100 lessons', icon: 'fa-crown', c: ['#ffc163', '#ff9e44'], prog: () => [Math.min(totalDone(), 100), 100] },
  ];

  function notify(icon, text) {
    state.notifications.unshift({ id: uid(), icon, text, time: Date.now(), read: false });
    state.notifications = state.notifications.slice(0, 20);
  }

  function checkAchievements(silent) {
    const fresh = ACHIEVEMENTS.filter(a => { const [c, t] = a.prog(); return c >= t && !state.unlocked.includes(a.id); });
    fresh.forEach(a => {
      state.unlocked.push(a.id);
      if (!silent) notify('fa-trophy', `Achievement unlocked: ${a.title}`);
    });
    if (fresh.length && !silent) setTimeout(() => toast('🏆', `Achievement unlocked: ${fresh[0].title}`, fresh[0].desc), 900);
  }

  checkAchievements(true);
  save();

  /* ---------------------------------------------------------
     PREFERENCES APPLIED TO <html>
     --------------------------------------------------------- */

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const motionOff = () => state.settings.reduceMotion || prefersReduced.matches;
  const resolvedTheme = () => state.settings.theme === 'system' ? (prefersDark.matches ? 'dark' : 'light') : state.settings.theme;
  const isDark = () => resolvedTheme() === 'dark';

  function applyPrefs() {
    const root = document.documentElement;
    root.dataset.theme = resolvedTheme();
    root.dataset.accent = state.settings.accent;
    root.dataset.text = state.settings.textSize;
    root.classList.toggle('reduce-motion', !!state.settings.reduceMotion);
    $('meta[name="theme-color"]')?.setAttribute('content', isDark() ? '#050b1b' : '#f5f3fb');
    const tb = $('#themeBtn');
    if (tb) {
      tb.innerHTML = `<i class="fas ${isDark() ? 'fa-sun' : 'fa-moon'}"></i>`;
      tb.setAttribute('aria-label', `Switch to ${isDark() ? 'light' : 'dark'} theme`);
      tb.title = tb.getAttribute('aria-label');
    }
  }
  applyPrefs();
  prefersDark.addEventListener?.('change', () => { if (state.settings.theme === 'system') { applyPrefs(); water.sync(); } });

  /* ---------------------------------------------------------
     SHELL — sidebar, topbar, toast, dialog
     --------------------------------------------------------- */

  const page = document.body.dataset.page || 'home';
  const sidebar = $('#sidebar');
  const layout = $('.layout');
  const topbar = $('#topbar');

  function renderSidebar() {
    if (!sidebar) return;
    const counts = {
      courses: CATALOG.filter(c => statusOf(c.id) === 'active').length,
      goals: state.goals.filter(g => !goalDone(g)).length,
    };
    const tip = SEEDS_OF_WISDOM[Math.floor(Date.now() / DAY) % SEEDS_OF_WISDOM.length];
    const collapsed = !!ui.collapsed;
    sidebar.classList.toggle('collapsed', collapsed);
    layout.classList.toggle('sidebar-is-collapsed', collapsed);
    sidebar.innerHTML = `
      <button class="sidebar-toggle" id="sidebarToggle" aria-label="${collapsed ? 'Expand' : 'Collapse'} navigation" aria-expanded="${!collapsed}"><i class="fas fa-chevron-left"></i></button>
      <a class="brand" href="index.html" aria-label="BloomOS home">
        <div class="brand-mark"><i class="fas fa-seedling"></i></div>
        <div class="brand-copy"><strong>BloomOS</strong><small>Learn · Grow · Achieve</small></div>
      </a>
      <div class="nav-label">YOUR SPACE</div>
      <nav class="nav" aria-label="Main">
        ${PAGES.map(p => `
          <a href="${p.href}" ${p.id === page ? 'class="active" aria-current="page"' : ''} title="${p.label}">
            <span class="ico"><i class="fas ${p.icon}"></i></span><span class="nav-text">${p.label}</span>
            ${counts[p.id] ? `<span class="count" aria-label="${counts[p.id]} active">${counts[p.id]}</span>` : ''}
          </a>`).join('')}
      </nav>
      <div class="sidebar-bottom">
        ${state.settings.reminders ? `<div class="daily-note"><strong><i class="fas fa-lightbulb"></i> Daily seed</strong><p>${tip}</p></div>` : ''}
        <a class="side-link ${page === 'about' ? 'active' : ''}" href="about.html" ${page === 'about' ? 'aria-current="page"' : ''}><i class="fas fa-circle-info"></i> About &amp; case study</a>
      </div>`;
    $('#sidebarToggle').addEventListener('click', () => { ui.collapsed = !ui.collapsed; saveUi(); renderSidebar(); });
  }

  function renderTopbar() {
    if (!topbar) return;
    const name = state.user.name || 'Learner';
    topbar.innerHTML = `
      <div class="search" role="search">
        <i class="fas fa-magnifying-glass" aria-hidden="true"></i>
        <input id="searchInput" type="search" autocomplete="off" spellcheck="false"
          placeholder="${page === 'courses' ? 'Filter courses…' : 'Search courses, goals, pages…'}"
          aria-label="Search" role="combobox" aria-expanded="false" aria-controls="searchResults" aria-autocomplete="list">
        <kbd aria-hidden="true">/</kbd>
        <ul class="search-results" id="searchResults" role="listbox" hidden></ul>
      </div>
      <div class="top-spacer"></div>
      <button class="icon-btn theme-btn" id="themeBtn" type="button"></button>
      <div class="menu-wrap">
        <button class="icon-btn" id="notifyBtn" aria-label="Notifications" aria-haspopup="true" aria-expanded="false" aria-controls="notifyPop">
          <i class="fas fa-bell"></i><i class="dot" id="notifyDot" hidden></i>
        </button>
        <div class="popover" id="notifyPop" hidden></div>
      </div>
      <div class="menu-wrap">
        <button class="profile" id="profileBtn" aria-haspopup="true" aria-expanded="false" aria-controls="profilePop">
          <div class="avatar" id="avatar">${esc(name[0].toUpperCase())}</div>
          <div class="profile-copy"><strong id="profileName">${esc(name)}</strong><small id="profileMeta">${esc(state.user.role)} · Lv ${level()}</small></div>
          <i class="fas fa-chevron-down" aria-hidden="true"></i>
        </button>
        <div class="popover" id="profilePop" hidden></div>
      </div>`;
    setupSearch();
    setupMenus();
    updateTopbar();
    applyPrefs();
    $('#themeBtn').addEventListener('click', () => {
      state.settings.theme = isDark() ? 'light' : 'dark';
      save(); applyPrefs(); water.sync();
      if (page === 'settings') renderSettings();
    });
  }

  function updateTopbar() {
    if (!topbar) return;
    const name = state.user.name || 'Learner';
    $('#avatar').textContent = name[0].toUpperCase();
    $('#profileName').textContent = name;
    $('#profileMeta').textContent = `${state.user.role} · Lv ${level()}`;
    $('#notifyDot').hidden = !state.notifications.some(n => !n.read);
  }

  /* menus (notifications + profile) */

  let openMenu = null;
  function closeMenus() {
    if (!openMenu) return;
    openMenu.btn.setAttribute('aria-expanded', 'false');
    openMenu.pop.hidden = true;
    openMenu = null;
  }

  function setupMenus() {
    const pairs = [
      { btn: $('#notifyBtn'), pop: $('#notifyPop'), fill: fillNotifications },
      { btn: $('#profileBtn'), pop: $('#profilePop'), fill: fillProfile },
    ];
    pairs.forEach(m => m.btn.addEventListener('click', e => {
      e.stopPropagation();
      const wasOpen = openMenu?.btn === m.btn;
      closeMenus();
      if (wasOpen) return;
      m.fill(m.pop);
      m.pop.hidden = false;
      m.btn.setAttribute('aria-expanded', 'true');
      openMenu = m;
    }));
  }

  document.addEventListener('click', e => { if (openMenu && !openMenu.pop.contains(e.target)) closeMenus(); });

  function fillNotifications(pop) {
    const list = state.notifications;
    pop.innerHTML = `
      <div class="popover-head"><span>Notifications</span>${list.some(n => !n.read) ? '<button id="markRead">Mark all read</button>' : ''}</div>
      ${list.length ? list.slice(0, 8).map(n => `
        <div class="notif ${n.read ? '' : 'unread'}">
          <div class="ni"><i class="fas ${n.icon}"></i></div>
          <div><p>${esc(n.text)}</p><time>${timeAgo(n.time)}</time></div>
        </div>`).join('') : '<div class="notif"><p>You are all caught up. 🌿</p></div>'}`;
    $('#markRead', pop)?.addEventListener('click', () => {
      state.notifications.forEach(n => { n.read = true; });
      save(); fillNotifications(pop); updateTopbar();
    });
  }

  function fillProfile(pop) {
    pop.innerHTML = `
      <div class="popover-head"><span>${esc(state.user.name)}</span><span class="pill">Level ${level()}</span></div>
      <a class="menu-item" href="achievements.html"><i class="fas fa-trophy"></i> ${state.unlocked.length} of ${ACHIEVEMENTS.length} badges</a>
      <a class="menu-item" href="goals.html"><i class="fas fa-bullseye"></i> My goals</a>
      <div class="menu-sep"></div>
      <a class="menu-item" href="settings.html"><i class="fas fa-gear"></i> Settings</a>
      <a class="menu-item" href="about.html"><i class="fas fa-circle-info"></i> About &amp; case study</a>
      <button class="menu-item" id="menuMotion"><i class="fas fa-wand-magic-sparkles"></i> ${state.settings.reduceMotion ? 'Enable' : 'Reduce'} animations</button>`;
    $('#menuMotion', pop).addEventListener('click', () => {
      state.settings.reduceMotion = !state.settings.reduceMotion;
      save(); applyPrefs(); water.sync(); closeMenus();
      if (page === 'settings') renderPage();
      toast('✨', state.settings.reduceMotion ? 'Animations reduced' : 'Animations on', 'You can change this any time in Settings.');
    });
  }

  /* search */

  let searchQuery = '';
  function searchIndex() {
    return [
      ...PAGES.map(p => ({ t: p.label, s: p.hint, href: p.href, icon: `fa-solid ${p.icon}`, k: '' })),
      { t: 'About & case study', s: 'The problem, the people and the design decisions', href: 'about.html', icon: 'fa-solid fa-circle-info', k: 'accessibility design process' },
      { t: 'Switch theme', s: 'Light, dark or follow your system', href: 'settings.html', icon: 'fa-solid fa-circle-half-stroke', k: 'dark light mode appearance' },
      ...CATALOG.map(c => ({ t: c.title, s: `${c.cat} · ${{ new: 'Not started', active: `${pct(c.id)}% grown`, done: 'Completed' }[statusOf(c.id)]}`, href: `courses.html#c-${c.id}`, icon: c.icon, k: c.topics.join(' ') + ' ' + c.desc })),
      ...state.goals.map(g => ({ t: g.title, s: 'Goal', href: 'goals.html', icon: 'fa-solid fa-bullseye', k: '' })),
    ];
  }

  function setupSearch() {
    const input = $('#searchInput');
    const list = $('#searchResults');
    let sel = -1, items = [];

    const close = () => { list.hidden = true; input.setAttribute('aria-expanded', 'false'); sel = -1; };

    function draw() {
      list.innerHTML = items.length
        ? items.map((r, i) => `<li><a href="${r.href}" role="option" id="sr-${i}" aria-selected="${i === sel}"><span class="ri"><i class="${r.icon}"></i></span><span><b>${esc(r.t)}</b><small>${esc(r.s)}</small></span></a></li>`).join('')
        : `<li class="empty">No matches for “${esc(input.value)}”. Try a skill like “python” or “design”.</li>`;
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      if (sel >= 0) input.setAttribute('aria-activedescendant', `sr-${sel}`); else input.removeAttribute('aria-activedescendant');
    }

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      if (page === 'courses') { searchQuery = q; renderCourseGrid(); return; }
      if (!q) { close(); return; }
      const words = q.split(/\s+/);
      items = searchIndex().filter(r => words.every(w => (r.t + ' ' + r.s + ' ' + r.k).toLowerCase().includes(w))).slice(0, 8);
      sel = items.length ? 0 : -1;
      draw();
    });

    input.addEventListener('keydown', e => {
      if (list.hidden) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!items.length) return;
        sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        draw();
      } else if (e.key === 'Enter' && items[sel]) {
        e.preventDefault();
        location.href = items[sel].href;
        close();
      } else if (e.key === 'Escape') {
        close();
      }
    });

    input.addEventListener('blur', () => setTimeout(close, 150));
  }

  document.addEventListener('keydown', e => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);
    if ((e.key === '/' && !typing) || (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey))) {
      e.preventDefault();
      $('#searchInput')?.focus();
    }
    if (e.key === 'Escape') closeMenus();
  });

  /* toast */

  const toastEl = document.createElement('div');
  toastEl.className = 'toast';
  toastEl.setAttribute('role', 'status');
  toastEl.setAttribute('aria-live', 'polite');
  toastEl.innerHTML = '<div class="toast-icon" aria-hidden="true"></div><div><strong></strong><p></p></div>';
  document.body.appendChild(toastEl);
  let toastTimer;

  function toast(icon, title, message = '') {
    toastEl.querySelector('.toast-icon').textContent = icon;
    toastEl.querySelector('strong').textContent = title;
    toastEl.querySelector('p').textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3600);
  }
  toastEl.addEventListener('click', () => toastEl.classList.remove('show'));

  /* ---------------------------------------------------------
     LESSON FLOW
     --------------------------------------------------------- */

  const dialog = document.createElement('dialog');
  dialog.className = 'modal';
  dialog.setAttribute('aria-labelledby', 'lessonTitle');
  document.body.appendChild(dialog);
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });

  function lessonTopic(c, n) {
    return c.topics[Math.min(c.topics.length - 1, Math.floor((n - 1) / c.lessons * c.topics.length))];
  }

  function openLesson(id) {
    const c = courseById(id);
    if (!enrolled(id)) {
      state.progress[id] = { done: 0, last: Date.now() };
      notify('fa-seedling', `You planted a new seed: ${c.title}.`);
      commit();
      toast('🌱', `${c.title} planted`, 'Your first lesson is ready.');
    }
    if (statusOf(id) === 'done') { toast('🌸', `${c.title} is in full bloom`, 'You have completed every lesson.'); return; }
    const n = done(id) + 1;
    dialog.innerHTML = `
      <form method="dialog" class="modal-body">
        <div class="modal-head">
          <div class="course-logo" style="--c1:${c.c[0]};--c2:${c.c[1]}"><i class="${c.icon}"></i></div>
          <div><small>${esc(c.title)} · Lesson ${n} of ${c.lessons}</small><strong id="lessonTitle">${esc(lessonTopic(c, n))}</strong></div>
          <button class="btn btn-ghost btn-icon modal-close" value="cancel" aria-label="Close"><i class="fas fa-xmark"></i></button>
        </div>
        <div class="progress" aria-hidden="true"><span style="--p:${pct(id)}%"></span></div>
        <div class="lesson-box">
          <h3><i class="fas fa-lightbulb" style="color:var(--amber)"></i> Today's little step</h3>
          <p>${esc(c.tip)}</p>
        </div>
        <ul class="checklist" aria-label="Lesson checklist">
          <li><label><input type="checkbox"> Read or watch the ${esc(lessonTopic(c, n).toLowerCase())} walkthrough</label></li>
          <li><label><input type="checkbox"> Try the practice exercise yourself</label></li>
          <li><label><input type="checkbox"> Write one takeaway in your own words</label></li>
        </ul>
        <div class="focus-timer">
          <i class="fas fa-hourglass-half" aria-hidden="true"></i>
          <time id="focusTime" aria-label="Focus timer">10:00</time>
          <span>Optional 10-minute focus session</span>
          <button type="button" class="btn btn-sm" id="focusBtn" aria-pressed="false">Start</button>
        </div>
        <div class="modal-foot">
          <button class="btn btn-ghost" value="cancel">Later</button>
          <button class="btn btn-primary" value="complete" id="completeBtn"><i class="fas fa-check"></i> Complete lesson</button>
        </div>
      </form>`;
    const btn = $('#completeBtn', dialog);
    btn.addEventListener('click', e => {
      e.preventDefault();
      dialog.close();
      completeLesson(id);
    });

    // optional focus timer — pauses/resumes, stops when the dialog closes
    let left = 600, timer = null;
    const fb = $('#focusBtn', dialog), ft = $('#focusTime', dialog);
    const show = () => { ft.textContent = `${pad(Math.floor(left / 60))}:${pad(left % 60)}`; };
    const stop = () => { clearInterval(timer); timer = null; };
    fb.addEventListener('click', () => {
      if (timer) { stop(); fb.textContent = 'Resume'; fb.setAttribute('aria-pressed', 'false'); return; }
      fb.textContent = 'Pause'; fb.setAttribute('aria-pressed', 'true');
      timer = setInterval(() => {
        left--; show();
        if (left <= 0) { stop(); fb.textContent = 'Done'; fb.disabled = true; toast('⏰', 'Focus session complete', 'Nice deep work. Mark the lesson complete when you are ready.'); }
      }, 1000);
    });
    dialog.addEventListener('close', stop, { once: true });

    dialog.showModal();
    btn.focus();
  }

  let justWatered = null;
  function completeLesson(id) {
    const c = courseById(id);
    const before = streak();
    const p = state.progress[id];
    p.done = Math.min(c.lessons, p.done + 1);
    p.last = Date.now();
    state.lastCourse = id;
    const k = dayKey();
    state.log[k] = (state.log[k] || 0) + 1;
    justWatered = id;
    water.burst();

    if (p.done === c.lessons) {
      notify('fa-spa', `${c.title} reached full bloom!`);
      toast('🌸', `${c.title} — full bloom!`, 'You completed every lesson. Incredible work.');
      petalRain();
    } else if (todayCount() === state.settings.dailyGoal) {
      notify('fa-droplet', 'Daily watering goal reached.');
      toast('🎉', 'Daily goal reached!', `${plural(todayCount(), 'lesson')} today — your whole garden is glowing.`);
      petalRain();
    } else if (streak() > before && streak() > 1) {
      toast('🔥', `${streak()}-day streak!`, `Lesson ${p.done} of ${c.title} complete. Your garden is thriving.`);
    } else {
      toast('💧', 'Lesson complete', `${c.title} is now ${pct(id)}% grown.`);
    }
    commit();
  }

  function petalRain() {
    if (motionOff()) return;
    const box = document.createElement('div');
    box.className = 'petal-rain';
    box.setAttribute('aria-hidden', 'true');
    const cols = ['var(--accent)', 'var(--accent-2)', 'var(--accent-3)', '#ffb3d9'];
    box.innerHTML = Array.from({ length: 36 }, (_, i) =>
      `<i style="left:${Math.random() * 100}%;--pc:${cols[i % 4]};--d:${2.2 + Math.random() * 1.6}s;--x:${(Math.random() - 0.5) * 240}px;--r:${Math.random() * 720 - 360}deg;animation-delay:${Math.random() * 0.6}s"></i>`).join('');
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 4600);
  }

  /* ---------------------------------------------------------
     COMMIT — save, check badges, re-render
     --------------------------------------------------------- */

  function commit() {
    checkAchievements(false);
    save();
    renderSidebar();
    updateTopbar();
    renderPage();
  }

  /* ---------------------------------------------------------
     SHARED BITS
     --------------------------------------------------------- */

  const statusTag = id => ({
    new: '<span class="status-tag">Not started</span>',
    active: '<span class="status-tag progress-tag"><i class="fas fa-seedling"></i> In progress</span>',
    done: '<span class="status-tag done-tag"><i class="fas fa-check"></i> Completed</span>',
  }[statusOf(id)]);

  function progressBar(id, label = true) {
    const c = courseById(id);
    return `
      ${label ? `<div class="course-meta"><span>${done(id)} / ${c.lessons} lessons</span><b>${pct(id)}%</b></div>` : ''}
      <div class="progress ${statusOf(id) === 'done' ? 'done' : ''}" role="progressbar" aria-label="${esc(c.title)} progress" aria-valuenow="${pct(id)}" aria-valuemin="0" aria-valuemax="100"><span style="--p:${pct(id)}%"></span></div>`;
  }

  // Delegate any [data-lesson] click to the lesson dialog.
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-lesson]');
    if (b) { e.preventDefault(); openLesson(b.dataset.lesson); }
  });

  /* ---------------------------------------------------------
     PAGE: HOME
     --------------------------------------------------------- */

  function renderHome() {
    const h = new Date().getHours();
    const greet = h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    $('#greeting').innerHTML = `${greet}, <span class="name">${esc(state.user.name)}.</span>`;

    const active = CATALOG.filter(c => statusOf(c.id) === 'active');
    const garden = enrolledCourses();
    const thirsty = garden.filter(c => ['Thirsty', 'Wilting'].includes(healthOf(c.id).label));
    const goal = state.settings.dailyGoal, today = todayCount(), met = today >= goal;
    const dg = $('#dailyGoal');
    dg.classList.toggle('met', met);
    dg.innerHTML = `
      <div class="ring ${met ? 'met' : ''}" style="--p:${Math.min(100, today / goal * 100)}" aria-hidden="true"><span>${met ? '<i class="fas fa-check"></i>' : `${today}/${goal}`}</span></div>
      <div><strong>${met ? 'Daily goal reached' : "Today's watering goal"}</strong>
      <small>${met ? `${plural(today, 'lesson')} today · lovely work` : `${plural(goal - today, 'lesson')} to go${thirsty.length ? ` · ${plural(thirsty.length, 'plant')} thirsty` : ''}`}</small></div>`;
    dg.setAttribute('aria-label', `${today} of ${goal} lessons done today`);

    const st = streak();
    const week = lessonsSince(7);
    $('#stats').innerHTML = [
      { label: 'Active courses', icon: 'fa-book-open', val: active.length, sub: `${CATALOG.length - garden.length} more to explore`, glow: '100,115,255' },
      { label: 'Lessons completed', icon: 'fa-seedling', val: totalDone(), sub: `<em>+${week}</em> in the last 7 days`, glow: '55,232,170' },
      { label: 'Overall progress', icon: 'fa-chart-pie', val: `${overallPct()}%`, sub: 'Across your planted skills', glow: '204,86,255' },
      { label: 'Day streak', icon: 'fa-fire', val: st, sub: todayCount() ? 'Today counted — nice!' : st ? 'Learn today to keep it' : 'Start one today', glow: '255,140,90' },
    ].map(s => `
      <article class="stat" style="--glow:rgba(${s.glow},.22);--glow-solid:rgb(${s.glow})">
        <div class="stat-head"><span>${s.label}</span><i class="fas ${s.icon} stat-icon" aria-hidden="true"></i></div>
        <strong>${s.val}</strong><small>${s.sub}</small>
      </article>`).join('');

    // skill nodes — four most recently studied
    const recent = [...garden].sort((a, b) => state.progress[b.id].last - state.progress[a.id].last).slice(0, 4);
    $('#skillNodes').innerHTML = recent.map((c, i) => `
      <button type="button" class="skill-node pos-${i}" data-lesson="${c.id}" style="--c1:${c.c[0]};--c2:${c.c[1]};--p:${pct(c.id)}%" aria-label="${esc(c.title)}, ${pct(c.id)}% grown. Start next lesson.">
        <span class="node-icon"><i class="${c.icon}"></i></span>
        <span class="node-text"><b>${esc(c.title)}</b><small>${stageOf(pct(c.id))} · ${pct(c.id)}%</small><span class="mini"><span></span></span></span>
      </button>`).join('');
    $('.lotus')?.style.setProperty('--bloom', (0.8 + overallPct() / 100 * 0.35).toFixed(2));

    // continue learning
    const cur = courseById(statusOf(state.lastCourse) === 'active' ? state.lastCourse : active[0]?.id);
    $('#continuePanel').innerHTML = cur ? `
      <div class="panel-head"><h2><i class="fas fa-play"></i> Continue learning</h2><a href="courses.html" class="panel-link">All courses <i class="fas fa-arrow-right"></i></a></div>
      <div class="current-course">
        <div class="course-logo" style="--c1:${cur.c[0]};--c2:${cur.c[1]}"><i class="${cur.icon}"></i></div>
        <div><strong>${esc(cur.title)}</strong><small>Next: Lesson ${done(cur.id) + 1} · ${esc(lessonTopic(cur, done(cur.id) + 1))}</small></div>
      </div>
      ${progressBar(cur.id)}
      <button class="btn btn-primary btn-block" style="margin-top:16px" data-lesson="${cur.id}"><i class="fas fa-play"></i> Continue lesson ${done(cur.id) + 1}</button>
      <div class="next-step"><strong><i class="fas fa-lightbulb"></i> Your next little step</strong><p>${esc(cur.tip)}</p></div>`
      : `
      <div class="panel-head"><h2><i class="fas fa-play"></i> Continue learning</h2></div>
      <div class="empty-state"><i class="fas fa-seedling"></i><p>No courses in progress. Plant a new seed to get growing.</p><a class="btn btn-primary" href="courses.html">Browse courses</a></div>`;

    // growth panel + weekly chart
    const op = overallPct();
    const msg = op < 25 ? 'Your roots are forming.' : op < 50 ? 'You are sprouting nicely.' : op < 75 ? 'You are taking deep root.' : 'You are about to bloom.';
    const days = Array.from({ length: 7 }, (_, i) => { const k = daysFrom(i - 6); return { k, n: state.log[k] || 0, d: parseDay(k) }; });
    const max = Math.max(3, ...days.map(d => d.n));
    const fmt = d => d.toLocaleDateString(undefined, { weekday: 'short' });
    $('#growthPanel').innerHTML = `
      <div class="panel-head"><h2><i class="fas fa-chart-simple"></i> Your growth</h2><span class="pill">Last 7 days</span></div>
      <div class="progress-panel">
        <div class="donut" style="--p:${op}" role="img" aria-label="Overall progress ${op}%"><strong>${op}%</strong></div>
        <div class="progress-copy">
          <strong>${msg}</strong>
          <p>${totalDone()} lessons completed across ${plural(garden.length, 'skill')}. You're at level ${level()} — ${10 - totalDone() % 10} lessons to level ${level() + 1}.</p>
          <p class="good"><i class="fas fa-fire"></i> Best streak: ${plural(bestStreak(), 'day')}</p>
        </div>
      </div>
      <div class="week-chart">
        <div class="week-chart-head"><span>Lessons per day</span><small>${week} this week</small></div>
        <div class="bars">
          ${days.map((d, i) => `
            <div class="bar ${i === 6 ? 'today' : ''}" tabindex="0" style="--h:${d.n / max * 100}%" aria-label="${d.d.toLocaleDateString(undefined, { weekday: 'long' })}: ${plural(d.n, 'lesson')}">
              <span class="tip">${fmt(d.d)} · ${plural(d.n, 'lesson')}</span><span></span>
            </div>`).join('')}
        </div>
        <div class="bar-labels">${days.map((d, i) => `<span class="${i === 6 ? 'today' : ''}">${i === 6 ? 'Today' : fmt(d.d)}</span>`).join('')}</div>
      </div>`;
  }

  function setupHome() {
    const card = $('#gardenCard');
    const scene = $('#gardenScene');
    // stars
    $('.stars', scene).innerHTML = Array.from({ length: 40 }, () =>
      `<i style="left:${Math.random() * 100}%;top:${Math.random() * 45}%;animation-delay:${-Math.random() * 4}s;opacity:${0.2 + Math.random() * 0.6}"></i>`).join('');

    function splash(x, y) {
      const r = scene.getBoundingClientRect();
      const el = document.createElement('span');
      el.className = 'splash';
      el.style.left = `${x - r.left}px`;
      el.style.top = `${y - r.top}px`;
      scene.appendChild(el);
      setTimeout(() => el.remove(), 1500);
      water.ripple(x, y, 1.2);
    }

    card.addEventListener('pointerdown', e => {
      if (e.target.closest('a, button')) return;
      splash(e.clientX, e.clientY);
    });
    $('#rippleBtn').addEventListener('click', () => {
      const r = scene.getBoundingClientRect();
      [0, 180, 360].forEach((t, i) => setTimeout(() => splash(r.left + r.width * (0.3 + i * 0.2), r.top + r.height * 0.62), t));
      toast('🌊', 'A ripple of curiosity', 'Your garden responds to every little step.');
    });

    if (state.onboarded && state.settings.reminders && !todayCount() && !sessionStorageGet('reminded')) {
      sessionStorageSet('reminded', '1');
      setTimeout(() => toast('💧', 'Your garden is thirsty', 'One short lesson today keeps your streak alive.'), 2600);
    }
  }

  function sessionStorageGet(k) { try { return sessionStorage.getItem(`bloomos:${k}`); } catch (_) { return null; } }
  function sessionStorageSet(k, v) { try { sessionStorage.setItem(`bloomos:${k}`, v); } catch (_) {} }

  /* ---------------------------------------------------------
     PAGE: GARDEN
     --------------------------------------------------------- */

  function plantSVG(c, p) {
    const [c1, c2] = c.c;
    const g = `g-${c.id}`;
    const base = 172;
    let body = '';
    if (p <= 0) {
      body = `<ellipse cx="90" cy="${base - 4}" rx="7" ry="5" fill="${c2}" opacity=".9"/>`;
    } else {
      const h = 26 + Math.min(p, 100) * 1.15;
      const top = base - h;
      body += `<path d="M90 ${base} Q ${84} ${base - h * 0.5} 90 ${top}" stroke="url(#${g}s)" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
      const leaves = Math.min(6, Math.floor(p / 16) + 1);
      for (let i = 0; i < leaves; i++) {
        const y = base - 16 - (i * (h - 30)) / Math.max(1, leaves);
        const right = i % 2 === 0;
        const s = 0.7 + (1 - i / 6) * 0.45;
        body += `<path d="M0 0 C 8 -11, 26 -11, 34 0 C 26 9, 8 9, 0 0Z" fill="url(#${g}l)" opacity=".92"
          transform="translate(${right ? 89 : 89} ${y}) rotate(${right ? -28 : 208}) scale(${s})"/>`;
      }
      if (p >= 35) {
        const open = p >= 75;
        const s = open ? 1.1 + (p - 75) / 25 * 0.5 : 0.85 + (p - 35) / 40 * 0.3;
        const petals = open ? 7 : 3;
        const spread = open ? 360 / petals : 28;
        let fl = '';
        for (let i = 0; i < petals; i++) {
          const a = open ? i * spread : (i - 1) * spread;
          fl += `<ellipse cx="0" cy="-13" rx="${open ? 7 : 6}" ry="14" fill="url(#${g}p)" transform="rotate(${a})" opacity=".95"/>`;
        }
        fl += `<circle r="${open ? 6 : 3}" fill="#ffe9b0"/>`;
        body += `<g transform="translate(90 ${top}) scale(${s.toFixed(2)})" ${p >= 100 ? `filter="url(#${g}glow)"` : ''}>${fl}</g>`;
      }
    }
    return `
      <svg viewBox="0 0 180 190" aria-hidden="true">
        <defs>
          <linearGradient id="${g}s" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#1f8f6e"/><stop offset="1" stop-color="#5cf0b6"/></linearGradient>
          <linearGradient id="${g}l" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1fae7e"/><stop offset="1" stop-color="#7cf5c4"/></linearGradient>
          <radialGradient id="${g}p" cx=".5" cy=".9" r=".9"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="${c2}"/><stop offset="1" stop-color="${c1}"/></radialGradient>
          <filter id="${g}glow" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <ellipse cx="90" cy="${base + 4}" rx="58" ry="10" style="fill:var(--soil)" stroke="${c2}" stroke-opacity=".45"/>
        <g class="sway">${body}</g>
      </svg>`;
  }

  function renderGarden() {
    const planted = enrolledCourses();
    const seeds = CATALOG.filter(c => !enrolled(c.id));
    const blooming = planted.filter(c => pct(c.id) >= 75).length;
    const thriving = planted.filter(c => ['Thriving', 'Flourishing'].includes(healthOf(c.id).label)).length;

    $('#gardenSummary').innerHTML = [
      { l: 'Plants growing', i: 'fa-seedling', v: planted.length, s: `${seeds.length} seeds still to plant` },
      { l: 'Blooming', i: 'fa-spa', v: blooming, s: '75% grown or more' },
      { l: 'Healthy', i: 'fa-heart-pulse', v: `${thriving}/${planted.length}`, s: 'Watered in the last 2 days' },
      { l: 'Watered today', i: 'fa-droplet', v: todayCount(), s: todayCount() ? 'Lovely work' : 'Study one lesson to water' },
    ].map(s => `<article class="stat"><div class="stat-head"><span>${s.l}</span><i class="fas ${s.i} stat-icon"></i></div><strong>${s.v}</strong><small>${s.s}</small></article>`).join('');

    const sorted = [...planted].sort((a, b) => pct(b.id) - pct(a.id));
    $('#plantGrid').innerHTML = sorted.length ? sorted.map(c => {
      const p = pct(c.id), hl = healthOf(c.id), st = statusOf(c.id);
      return `
      <article class="plant-card ${justWatered === c.id ? 'watered' : ''}" style="--c1:${c.c[0]};--c2:${c.c[1]}" id="plant-${c.id}">
        <div class="plant-stage">
          <span class="pill stage-label">${stageOf(p)} · ${p}%</span>
          ${plantSVG(c, p)}
        </div>
        <div class="plant-body">
          <h3><i class="${c.icon}"></i> ${esc(c.title.split(' ')[0])} ${esc(c.plant)}</h3>
          <dl class="plant-facts">
            <div><dt>Health</dt><dd style="color:${hl.color}"><i class="fas ${hl.icon}"></i> ${hl.label}</dd></div>
            <div><dt>Last watered</dt><dd>${timeAgo(state.progress[c.id].last)}</dd></div>
            <div><dt>Growth</dt><dd>${done(c.id)} / ${c.lessons} lessons</dd></div>
            <div><dt>Focus</dt><dd>${esc(lessonTopic(c, Math.min(c.lessons, done(c.id) + 1)))}</dd></div>
          </dl>
          ${progressBar(c.id, false)}
          <div class="plant-actions">
            ${st === 'done'
              ? '<button class="btn btn-sm" disabled><i class="fas fa-sun"></i> Fully bloomed</button>'
              : `<button class="btn btn-primary btn-sm" data-lesson="${c.id}"><i class="fas fa-droplet"></i> Water · study</button>`}
            <a class="btn btn-sm" href="courses.html#c-${c.id}">Details</a>
          </div>
        </div>
      </article>`;
    }).join('') : '<div class="empty-state"><i class="fas fa-seedling"></i><p>Your garden is empty. Plant your first seed below.</p></div>';

    $('#seedSection').hidden = !seeds.length;
    $('#seedGrid').innerHTML = seeds.map(c => `
      <article class="course-card" style="--c1:${c.c[0]};--c2:${c.c[1]}">
        <div class="course-card-top"><div class="course-logo"><i class="${c.icon}"></i></div><span class="status-tag">${esc(c.plant)} seed</span></div>
        <div><h3>${esc(c.title)}</h3><p class="level">${esc(c.level)} · ${c.lessons} lessons</p></div>
        <button class="btn btn-sm" data-lesson="${c.id}"><i class="fas fa-seedling"></i> Plant & start</button>
      </article>`).join('');

    if (justWatered) {
      const card = $(`#plant-${justWatered} .plant-stage`);
      if (card && !motionOff()) {
        for (let i = 0; i < 6; i++) {
          const d = document.createElement('span');
          d.className = 'drop';
          d.style.left = `${35 + Math.random() * 30}%`;
          d.style.animationDelay = `${i * 0.08}s`;
          card.appendChild(d);
          setTimeout(() => d.remove(), 1400);
        }
      }
      justWatered = null;
    }
  }

  /* ---------------------------------------------------------
     PAGE: COURSES
     --------------------------------------------------------- */

  let courseFilter = 'all';

  function renderCourses() {
    const counts = { all: CATALOG.length, active: 0, new: 0, done: 0 };
    CATALOG.forEach(c => counts[statusOf(c.id)]++);
    $('#courseFilters').innerHTML = [['all', 'All'], ['active', 'In progress'], ['new', 'Not started'], ['done', 'Completed']]
      .map(([k, l]) => `<button class="chip" data-filter="${k}" aria-pressed="${courseFilter === k}">${l} · ${counts[k]}</button>`).join('');
    renderCourseGrid();
  }

  function renderCourseGrid() {
    const q = searchQuery.split(/\s+/).filter(Boolean);
    const list = CATALOG.filter(c =>
      (courseFilter === 'all' || statusOf(c.id) === courseFilter) &&
      q.every(w => `${c.title} ${c.cat} ${c.desc} ${c.topics.join(' ')}`.toLowerCase().includes(w)));
    $('#resultCount').textContent = `${plural(list.length, 'course')}${q.length ? ` matching “${searchQuery}”` : ''}`;
    $('#courseGrid').innerHTML = list.length ? list.map(c => {
      const st = statusOf(c.id);
      return `
      <article class="course-card" id="c-${c.id}" style="--c1:${c.c[0]};--c2:${c.c[1]}">
        <div class="course-card-top"><div class="course-logo"><i class="${c.icon}"></i></div>${statusTag(c.id)}</div>
        <div><h3>${esc(c.title)}</h3><p class="level">${esc(c.level)}</p></div>
        <p class="desc">${esc(c.desc)}</p>
        <div class="meta"><span><i class="fas fa-layer-group"></i>${c.lessons} lessons</span><span><i class="far fa-clock"></i>${c.hours}h</span><span><i class="fas fa-tag"></i>${esc(c.cat)}</span></div>
        ${st !== 'new' ? `<div>${progressBar(c.id)}</div>` : ''}
        ${st === 'new' ? `<button class="btn" data-lesson="${c.id}"><i class="fas fa-seedling"></i> Plant & start</button>`
          : st === 'active' ? `<button class="btn btn-primary" data-lesson="${c.id}"><i class="fas fa-play"></i> Continue · lesson ${done(c.id) + 1}</button>`
          : '<button class="btn" disabled><i class="fas fa-check"></i> Completed</button>'}
      </article>`;
    }).join('') : `<div class="empty-state" style="grid-column:1/-1"><i class="fas fa-magnifying-glass"></i><p>No courses match. Try a different filter or search term.</p><button class="btn btn-sm" id="clearFilters">Clear filters</button></div>`;
  }

  function setupCourses() {
    $('#courseFilters').addEventListener('click', e => {
      const b = e.target.closest('[data-filter]');
      if (!b) return;
      courseFilter = b.dataset.filter;
      renderCourses();
    });
    $('#courseGrid').addEventListener('click', e => {
      if (!e.target.closest('#clearFilters')) return;
      courseFilter = 'all'; searchQuery = '';
      $('#searchInput').value = '';
      renderCourses();
    });
    const flash = () => {
      const el = location.hash && $(location.hash);
      if (!el) return;
      el.scrollIntoView({ behavior: motionOff() ? 'auto' : 'smooth', block: 'center' });
      el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
    };
    window.addEventListener('hashchange', flash);
    setTimeout(flash, 100);
  }

  /* ---------------------------------------------------------
     PAGE: GOALS
     --------------------------------------------------------- */

  let confirmingGoal = null;

  function dueText(g) {
    if (!g.due) return '<span><i class="far fa-calendar"></i> No deadline</span>';
    const n = daysUntil(g.due);
    if (goalDone(g)) return '<span><i class="fas fa-check"></i> Achieved</span>';
    if (n < 0) return `<span class="overdue"><i class="fas fa-triangle-exclamation"></i> ${plural(-n, 'day')} overdue</span>`;
    if (n === 0) return '<span class="soon"><i class="fas fa-hourglass-half"></i> Due today</span>';
    return `<span class="${n <= 3 ? 'soon' : ''}"><i class="far fa-calendar"></i> Due in ${plural(n, 'day')}</span>`;
  }

  function goalRow(g) {
    const p = goalProgress(g);
    const pc = Math.min(100, Math.round(p.cur / p.target * 100));
    const complete = goalDone(g);
    const c = g.courseId && courseById(g.courseId);
    const actions = confirmingGoal === g.id
      ? `<div class="confirm-row" role="group" aria-label="Confirm delete">Delete goal? <button class="btn btn-danger btn-sm" data-act="delete-yes" data-id="${g.id}">Delete</button><button class="btn btn-sm" data-act="delete-no">Keep</button></div>`
      : `${c ? (complete ? '' : `<button class="btn btn-sm" data-lesson="${c.id}"><i class="fas fa-play"></i> Study</button>`)
            : `<button class="btn btn-icon btn-sm" data-act="dec" data-id="${g.id}" aria-label="Decrease progress" ${p.cur <= 0 ? 'disabled' : ''}><i class="fas fa-minus"></i></button>
               <span class="goal-count">${p.cur} / ${p.target}</span>
               <button class="btn btn-icon btn-sm" data-act="inc" data-id="${g.id}" aria-label="Increase progress" ${complete ? 'disabled' : ''}><i class="fas fa-plus"></i></button>`}
         <button class="btn btn-ghost btn-icon btn-sm" data-act="delete" data-id="${g.id}" aria-label="Delete goal"><i class="far fa-trash-can"></i></button>`;
    return `
      <div class="goal-item ${complete ? 'complete' : ''}">
        <div class="ring" style="--p:${pc}" role="img" aria-label="${pc}% complete"><span>${complete ? '<i class="fas fa-check"></i>' : `${pc}%`}</span></div>
        <div>
          <div class="goal-title">${esc(g.title)}</div>
          <div class="goal-sub">${dueText(g)}${c ? `<span><i class="${c.icon}"></i> ${done(c.id)} / ${c.lessons} lessons · auto-tracked</span>` : `<span>${p.cur} of ${p.target} ${esc(p.unit)}</span>`}</div>
        </div>
        <div class="goal-actions">${actions}</div>
      </div>`;
  }

  function renderGoals() {
    const active = state.goals.filter(g => !goalDone(g)).sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'));
    const finished = state.goals.filter(goalDone);
    $('#goalSummary').textContent = `${plural(active.length, 'active goal')} · ${finished.length} achieved`;
    $('#goalList').innerHTML = active.length ? active.map(goalRow).join('')
      : '<div class="empty-state"><i class="fas fa-bullseye"></i><p>No active goals. Plant one with the form — small, specific goals grow best.</p></div>';
    $('#doneWrap').hidden = !finished.length;
    $('#doneList').innerHTML = finished.map(goalRow).join('');
  }

  function setupGoals() {
    const form = $('#goalForm');
    const courseSel = $('#goalCourse');
    courseSel.innerHTML = '<option value="">None — track manually</option>' +
      CATALOG.map(c => `<option value="${c.id}">${esc(c.title)}</option>`).join('');
    const sync = () => { $('#manualFields').hidden = !!courseSel.value; };
    courseSel.addEventListener('change', sync);
    sync();
    $('#goalDue').min = dayKey();

    form.addEventListener('submit', e => {
      e.preventDefault();
      const title = $('#goalTitle').value.trim();
      if (!title) { $('#goalTitle').focus(); return; }
      const courseId = courseSel.value;
      const g = { id: uid(), title, due: $('#goalDue').value || null, created: Date.now() };
      if (courseId) {
        g.courseId = courseId;
        if (!enrolled(courseId)) state.progress[courseId] = { done: 0, last: Date.now() };
      } else {
        g.target = Math.max(1, parseInt($('#goalTarget').value, 10) || 10);
        g.current = 0;
        g.unit = $('#goalUnit').value.trim() || 'steps';
      }
      state.goals.push(g);
      form.reset(); sync();
      toast('🎯', 'Goal planted', title);
      commit();
      $('#goalTitle').focus();
    });

    $('#goalsMain').addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const g = state.goals.find(x => x.id === b.dataset.id);
      switch (b.dataset.act) {
        case 'inc':
          g.current = Math.min(g.target, g.current + 1);
          if (goalDone(g)) { notify('fa-bullseye', `Goal achieved: ${g.title}`); toast('🎉', 'Goal achieved!', g.title); }
          break;
        case 'dec': g.current = Math.max(0, g.current - 1); break;
        case 'delete': confirmingGoal = g.id; renderGoals(); $('[data-act="delete-no"]')?.focus(); return;
        case 'delete-no': confirmingGoal = null; renderGoals(); return;
        case 'delete-yes':
          state.goals = state.goals.filter(x => x.id !== b.dataset.id);
          confirmingGoal = null;
          toast('🍂', 'Goal removed');
          break;
      }
      commit();
    });
  }

  /* ---------------------------------------------------------
     PAGE: ACHIEVEMENTS
     --------------------------------------------------------- */

  function renderAchievements() {
    const got = state.unlocked.length, all = ACHIEVEMENTS.length;
    const p = Math.round(got / all * 100);
    $('#achHero').innerHTML = `
      <div class="donut" style="--p:${p}" role="img" aria-label="${got} of ${all} badges"><strong>${got}/${all}</strong></div>
      <div class="progress-copy"><strong>${got === all ? 'Every badge collected. Legendary.' : `${plural(all - got, 'badge')} still waiting to bloom.`}</strong>
      <p>Level ${level()} · ${totalDone()} lessons · best streak ${plural(bestStreak(), 'day')}</p></div>`;
    const sorted = [...ACHIEVEMENTS].sort((a, b) => state.unlocked.includes(b.id) - state.unlocked.includes(a.id));
    $('#badgeGrid').innerHTML = sorted.map(a => {
      const on = state.unlocked.includes(a.id);
      const [c, t] = a.prog();
      return `
      <article class="badge ${on ? 'unlocked' : 'locked'}" style="--c1:${a.c[0]};--c2:${a.c[1]}">
        <div class="medal"><i class="fas ${on ? a.icon : 'fa-lock'}"></i></div>
        <h3>${esc(a.title)}</h3>
        <p>${esc(a.desc)}</p>
        ${on ? '<span class="badge-foot"><i class="fas fa-check"></i> Unlocked</span>'
          : `<div class="progress" role="progressbar" aria-label="${esc(a.title)} progress" aria-valuenow="${c}" aria-valuemin="0" aria-valuemax="${t}"><span style="--p:${c / t * 100}%"></span></div><span class="badge-foot">${c} / ${t}${t === 100 && a.id === 'bloom' ? '%' : ''}</span>`}
      </article>`;
    }).join('');
  }

  /* ---------------------------------------------------------
     PAGE: COMMUNITY
     --------------------------------------------------------- */

  let feedFilter = 'All';

  function renderCommunity() {
    const tags = ['All', 'Win', 'Question', 'Tip', 'Resource'];
    $('#feedFilters').innerHTML = tags.map(t => `<button class="chip" data-tag="${t}" aria-pressed="${feedFilter === t}">${t}</button>`).join('');
    const posts = [...state.posts].sort((a, b) => b.time - a.time).filter(p => feedFilter === 'All' || p.tag === feedFilter);
    $('#feed').innerHTML = posts.length ? posts.map(p => {
      const colors = p.mine ? null : PEOPLE[p.author] || ['#3b8cff', '#4bdcff'];
      const name = p.mine ? state.user.name : p.author;
      return `
      <article class="post">
        <div class="post-head">
          <div class="avatar" style="${colors ? `--c1:${colors[0]};--c2:${colors[1]}` : '--c1:var(--accent);--c2:var(--accent-3)'}">${esc(name[0])}</div>
          <div><strong>${esc(name)}${p.mine ? ' <span style="color:var(--faint);font-weight:500">(you)</span>' : ''}</strong><small>${timeAgo(p.time)}</small></div>
          <span class="status-tag">${esc(p.tag)}</span>
        </div>
        <p>${esc(p.text)}</p>
        <div class="post-actions">
          <button class="btn btn-sm like-btn" data-like="${p.id}" aria-pressed="${!!p.liked}" aria-label="${p.liked ? 'Unlike' : 'Like'} post"><i class="${p.liked ? 'fas' : 'far'} fa-heart"></i> ${p.likes}</button>
          ${p.mine ? `<button class="btn btn-ghost btn-sm" data-del="${p.id}"><i class="far fa-trash-can"></i> Delete</button>` : ''}
        </div>
      </article>`;
    }).join('') : '<div class="empty-state"><i class="fas fa-comments"></i><p>No posts with this tag yet. Be the first to share one.</p></div>';

    const me = { name: state.user.name, pts: totalDone() * 10 + state.unlocked.length * 50, me: true };
    const board = [
      { name: 'Elena Rostova', pts: 820 }, { name: 'Amara Okafor', pts: 760 }, { name: 'Diego Alvarez', pts: 540 },
      { name: 'Marcus Chen', pts: 410 }, { name: 'Priya Nair', pts: 380 }, me,
    ].sort((a, b) => b.pts - a.pts);
    $('#leaderboard').innerHTML = board.map((p, i) => {
      const col = p.me ? null : PEOPLE[p.name];
      return `<li class="${p.me ? 'me' : ''}"><span class="rank">${i + 1}</span>
        <div class="avatar" style="${col ? `--c1:${col[0]};--c2:${col[1]}` : '--c1:var(--accent);--c2:var(--accent-3)'}">${esc(p.name[0])}</div>
        <strong>${esc(p.name)}${p.me ? ' (you)' : ''}</strong><span class="pts">${p.pts} pts</span></li>`;
    }).join('');
  }

  function setupCommunity() {
    const text = $('#postText'), btn = $('#postBtn'), count = $('#charCount');
    $('#composerAvatar').textContent = state.user.name[0].toUpperCase();
    const sync = () => { btn.disabled = !text.value.trim(); count.textContent = `${text.value.length} / 280`; };
    text.addEventListener('input', sync);
    sync();
    const post = () => {
      const v = text.value.trim();
      if (!v) return;
      state.posts.push({ id: uid(), author: state.user.name, mine: true, tag: $('#postTag').value, text: v, time: Date.now(), likes: 0, liked: false });
      state.postsMade++;
      text.value = ''; sync();
      if (feedFilter !== 'All') feedFilter = 'All';
      toast('🌿', 'Shared with the greenhouse', 'Fellow learners can now see your post.');
      commit();
    };
    $('#composer').addEventListener('submit', e => { e.preventDefault(); post(); });
    text.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) post(); });

    $('#feedFilters').addEventListener('click', e => {
      const b = e.target.closest('[data-tag]');
      if (b) { feedFilter = b.dataset.tag; renderCommunity(); }
    });
    $('#feed').addEventListener('click', e => {
      const like = e.target.closest('[data-like]');
      const del = e.target.closest('[data-del]');
      if (like) {
        const p = state.posts.find(x => x.id === like.dataset.like);
        p.liked = !p.liked;
        p.likes += p.liked ? 1 : -1;
        if (p.liked && !p.mine && !p.cheered) { p.cheered = true; state.likesGiven++; }
        commit();
        $(`[data-like="${p.id}"]`)?.focus();
      } else if (del) {
        state.posts = state.posts.filter(x => x.id !== del.dataset.del);
        toast('🍂', 'Post deleted');
        commit();
      }
    });
    $('#promptBtn').addEventListener('click', () => {
      text.value = 'This week I learned… ';
      $('#postTag').value = 'Win';
      text.focus(); sync();
    });
  }

  /* ---------------------------------------------------------
     PAGE: SETTINGS
     --------------------------------------------------------- */

  const ACCENTS = { violet: ['#9c63ff', '#ed5ce8'], ocean: ['#3b8cff', '#4bdcff'], rose: ['#ff5c8a', '#ffa05c'], emerald: ['#22c993', '#4bdcff'] };

  function renderSettings() {
    $('#setName').value = state.user.name;
    $('#setRole').value = state.user.role;
    $('#setReminders').checked = state.settings.reminders;
    $('#setRipples').checked = state.settings.ripples;
    $('#setMotion').checked = state.settings.reduceMotion;
    $('#setDaily').value = String(state.settings.dailyGoal);
    $$('#themeSeg [data-opt]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.opt === state.settings.theme)));
    $$('#textSeg [data-opt]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.opt === state.settings.textSize)));
    $('#swatches').innerHTML = Object.entries(ACCENTS).map(([k, [a, b]]) =>
      `<button class="swatch" role="radio" aria-checked="${state.settings.accent === k}" aria-label="${k[0].toUpperCase() + k.slice(1)}" data-accent="${k}" style="--s1:${a};--s2:${b}"></button>`).join('');
    $('#dataSummary').textContent = `${totalDone()} lessons, ${plural(state.goals.length, 'goal')}, ${plural(state.posts.filter(p => p.mine).length, 'post')} stored in this browser.`;
  }

  function setupSettings() {
    const nameIn = $('#setName');
    nameIn.addEventListener('change', () => {
      const v = nameIn.value.trim().slice(0, 32);
      if (!v) { nameIn.value = state.user.name; return; }
      state.user.name = v;
      toast('👋', `Hello, ${v}`, 'Your name has been updated.');
      commit();
    });
    $('#setRole').addEventListener('change', e => { state.user.role = e.target.value; commit(); });
    const bindSwitch = (id, key, after) => $(id).addEventListener('change', e => {
      state.settings[key] = e.target.checked;
      save(); applyPrefs(); after?.(); renderSidebar();
      toast('⚙️', 'Preference saved');
    });
    bindSwitch('#setReminders', 'reminders');
    bindSwitch('#setRipples', 'ripples', () => water.sync());
    bindSwitch('#setMotion', 'reduceMotion', () => water.sync());

    const bindSeg = (sel, key, after) => {
      const seg = $(sel);
      seg.addEventListener('click', e => {
        const b = e.target.closest('[data-opt]');
        if (!b) return;
        state.settings[key] = b.dataset.opt;
        save(); applyPrefs(); after?.(); renderSettings();
      });
      // arrow keys move between radio options
      seg.addEventListener('keydown', e => {
        if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
        const opts = $$('[data-opt]', seg);
        const i = opts.indexOf(document.activeElement);
        const next = opts[(i + (e.key === 'ArrowRight' ? 1 : -1) + opts.length) % opts.length];
        next.click(); next.focus();
      });
    };
    bindSeg('#themeSeg', 'theme', () => water.sync());
    bindSeg('#textSeg', 'textSize');
    $('#setDaily').addEventListener('change', e => {
      state.settings.dailyGoal = Number(e.target.value);
      save();
      toast('💧', `Daily goal: ${plural(state.settings.dailyGoal, 'lesson')}`, 'Small and steady beats big and rare.');
    });
    $('#replayOnboard').addEventListener('click', () => openOnboarding(true));

    $('#swatches').addEventListener('click', e => {
      const b = e.target.closest('[data-accent]');
      if (!b) return;
      state.settings.accent = b.dataset.accent;
      save(); applyPrefs(); renderSettings();
      $(`[data-accent="${b.dataset.accent}"]`).focus();
    });

    $('#exportBtn').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `bloomos-backup-${dayKey()}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      toast('📦', 'Backup downloaded');
    });

    $('#importInput').addEventListener('change', async e => {
      const f = e.target.files[0];
      if (!f) return;
      try {
        const s = migrate(JSON.parse(await f.text()));
        if (!s) throw new Error('bad file');
        state = s;
        commit(); applyPrefs(); water.sync(); renderTopbar();
        toast('🌱', 'Garden restored', 'Your backup has been imported.');
      } catch (_) {
        toast('⚠️', 'Could not import that file', 'Choose a BloomOS backup (.json).');
      }
      e.target.value = '';
    });

    const resetBtn = $('#resetBtn'), confirmBox = $('#resetConfirm');
    resetBtn.addEventListener('click', () => { resetBtn.hidden = true; confirmBox.hidden = false; $('#resetNo').focus(); });
    $('#resetNo').addEventListener('click', () => { resetBtn.hidden = false; confirmBox.hidden = true; resetBtn.focus(); });
    $('#resetYes').addEventListener('click', () => {
      state = seed();
      checkAchievements(true);
      save(); applyPrefs(); water.sync(); renderTopbar(); renderSidebar(); renderPage();
      resetBtn.hidden = false; confirmBox.hidden = true;
      openOnboarding(false);
    });
  }

  /* ---------------------------------------------------------
     AMBIENT WATER CANVAS
     --------------------------------------------------------- */

  const water = (() => {
    const canvas = $('#water');
    const noop = { ripple() {}, burst() {}, sync() {} };
    if (!canvas) return noop;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, ripples = [], particles = [], running = false, raf = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!running) frame(false);
    }

    function ripple(x, y, power = 1) {
      if (!state.settings.ripples) return;
      ripples.push({ x, y, r: 3, life: 1, speed: (1.2 + Math.random() * 0.8) * power });
      for (let i = 0; i < 9; i++) {
        const a = Math.random() * Math.PI * 2, sp = 0.4 + Math.random() * 1.9;
        particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.8 + Math.random() * 0.5, size: 1 + Math.random() * 2, hue: 175 + Math.random() * 95 });
      }
      if (ripples.length > 40) ripples.shift();
      if (particles.length > 180) particles.splice(0, particles.length - 180);
    }

    const PALETTES = {
      dark: { wave1: '110,115,255', wave2: '55,202,255', waveBoost: 1, ring1: '81,220,255', ring2: '195,112,255', sat: 100, light: 75, glow: '#7ceaff' },
      light: { wave1: '110,80,230', wave2: '30,130,210', waveBoost: 1.6, ring1: '40,120,230', ring2: '124,77,255', sat: 80, light: 58, glow: 'rgba(124,77,255,.35)' },
    };
    let pal = PALETTES.light;

    function frame(animate = true) {
      pal = PALETTES[isDark() ? 'dark' : 'light'];
      ctx.clearRect(0, 0, w, h);
      const t = performance.now() * 0.001;
      const horizon = h * 0.55;
      for (let i = 0; i < 13; i++) {
        const yy = horizon + i * i * 1.8;
        if (yy > h) continue;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 12) {
          const wave = Math.sin(x * 0.012 + t * 0.8 + i * 0.55) * 2.3 + Math.sin(x * 0.025 - t * 0.45 + i) * 1.1;
          x === 0 ? ctx.moveTo(x, yy + wave) : ctx.lineTo(x, yy + wave);
        }
        ctx.strokeStyle = `rgba(${i % 3 === 0 ? pal.wave1 : pal.wave2},${(0.025 + (i % 4) * 0.009) * pal.waveBoost})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ripples.forEach(r => {
        const alpha = Math.max(0, r.life) * 0.43;
        for (let k = 0; k < 3; k++) {
          const radius = r.r * (1 + k * 0.28);
          ctx.beginPath();
          ctx.ellipse(r.x, r.y, radius, radius * 0.36, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${k === 1 ? pal.ring2 : pal.ring1},${alpha * (1 - k * 0.2)})`;
          ctx.lineWidth = k === 0 ? 1.5 : 1;
          ctx.stroke();
        }
        r.r += r.speed; r.life -= 0.009;
      });
      ripples = ripples.filter(r => r.life > 0);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},${pal.sat}%,${pal.light}%,${Math.max(0, p.life)})`;
        ctx.shadowBlur = 9; ctx.shadowColor = pal.glow;
        ctx.fill();
        ctx.shadowBlur = 0;
        p.x += p.vx; p.y += p.vy; p.life -= 0.012; p.vy -= 0.008;
      });
      particles = particles.filter(p => p.life > 0);
      if (animate && running) raf = requestAnimationFrame(() => frame());
    }

    function sync() {
      canvas.hidden = !state.settings.ripples;
      const should = state.settings.ripples && !motionOff() && !document.hidden;
      if (should && !running) { running = true; raf = requestAnimationFrame(() => frame()); }
      if (!should && running) { running = false; cancelAnimationFrame(raf); ripples = []; particles = []; }
      if (!running) frame(false);
    }

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', sync);
    prefersReduced.addEventListener?.('change', sync);
    resize();
    sync();
    ripple(innerWidth * 0.5, innerHeight * 0.55, 0.7);

    return {
      ripple: (x, y, p) => { ripple(x, y, p); if (!running) frame(false); },
      burst: () => ripple(innerWidth * 0.5, innerHeight * 0.6, 1.4),
      sync,
    };
  })();

  /* ---------------------------------------------------------
     BOOT
     --------------------------------------------------------- */

  const RENDER = { home: renderHome, garden: renderGarden, courses: renderCourses, goals: renderGoals, achievements: renderAchievements, community: renderCommunity, settings: renderSettings };
  const SETUP = {
    home: setupHome, courses: setupCourses, goals: setupGoals, community: setupCommunity, settings: setupSettings,
    about: () => $('#aboutTour').addEventListener('click', () => openOnboarding(true)),
  };
  function renderPage() { RENDER[page]?.(); }

  /* ---------------------------------------------------------
     ONBOARDING (first run, or replayed from Settings)
     --------------------------------------------------------- */

  const LOTUS_SVG = `
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <defs><linearGradient id="obPetal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style="stop-color:#fbf8ff"/><stop offset=".55" style="stop-color:var(--accent)"/><stop offset="1" style="stop-color:var(--accent-3)"/>
      </linearGradient></defs>
      ${[[-58, .78], [58, .78], [-30, .92], [30, .92], [0, 1]].map(([a, s]) =>
        `<path d="M50 16 C 63 33, 63 58, 50 74 C 37 58, 37 33, 50 16Z" fill="url(#obPetal)" stroke="#fff" stroke-opacity=".7" transform="rotate(${a} 50 74) translate(50 74) scale(${s}) translate(-50 -74)"/>`).join('')}
      <ellipse cx="50" cy="72" rx="7" ry="6" fill="#ffe3a3"/>
    </svg>`;

  function openOnboarding(replay) {
    const ob = document.createElement('dialog');
    ob.className = 'modal onboard';
    ob.setAttribute('aria-labelledby', 'obTitle');
    document.body.appendChild(ob);
    let step = 0, finished = false;
    const pick = {
      name: state.user.name,
      skills: new Set(replay ? enrolledCourses().map(c => c.id) : ['python', 'web']),
      goal: state.settings.dailyGoal,
      mode: 'sample',
    };
    const GOALS = [[1, 'fa-seedling', 'Casual', '1 lesson a day · about 10 minutes'], [2, 'fa-leaf', 'Regular', '2 lessons a day · about 20 minutes'], [3, 'fa-tree', 'Committed', '3 lessons a day · about 30 minutes']];

    function draw() {
      let body = '';
      if (step === 0) body = `
        <div class="ob-hero">${LOTUS_SVG}</div>
        <h2 class="ob-title" id="obTitle">${replay ? 'Let’s re-plant your garden' : 'Welcome to BloomOS'}</h2>
        <p class="ob-sub">Every skill you learn becomes a plant. Study a lesson to water it — leave it too long and it gets thirsty. No guilt, just growth.</p>
        <div class="field"><label for="obName">What should we call you?</label>
          <input class="input" id="obName" maxlength="32" autocomplete="given-name" value="${esc(pick.name)}" required></div>`;
      if (step === 1) body = `
        <h2 class="ob-title" id="obTitle">What do you want to grow?</h2>
        <p class="ob-sub">Pick one or more skills to plant. You can add more any time.</p>
        <div class="ob-skills" role="group" aria-labelledby="obTitle">
          ${CATALOG.map(c => `<button type="button" class="ob-skill" role="checkbox" aria-checked="${pick.skills.has(c.id)}" data-skill="${c.id}">
            <span class="course-logo" style="--c1:${c.c[0]};--c2:${c.c[1]}"><i class="${c.icon}"></i></span>${esc(c.title)}</button>`).join('')}
        </div>
        <p class="ob-sub" id="obHint" role="alert" style="margin:0;color:var(--red)"></p>`;
      if (step === 2) body = `
        <h2 class="ob-title" id="obTitle">How much can you water each day?</h2>
        <p class="ob-sub">A gentle daily goal. Most people stick with 1–2 lessons — you can change it later.</p>
        <div class="ob-options" role="radiogroup" aria-labelledby="obTitle">
          ${GOALS.map(([n, i, t, s]) => `<button type="button" class="ob-option" role="radio" aria-checked="${pick.goal === n}" data-goal="${n}"><i class="fas ${i}"></i><span><strong>${t}</strong><small>${s}</small></span></button>`).join('')}
        </div>
        ${replay ? '' : `
        <div class="field-label" id="obModeLbl">Start with</div>
        <div class="ob-options" role="radiogroup" aria-labelledby="obModeLbl">
          <button type="button" class="ob-option" role="radio" aria-checked="${pick.mode === 'sample'}" data-mode="sample"><i class="fas fa-wand-magic-sparkles"></i><span><strong>Sample progress</strong><small>A week of demo history so you can explore every feature</small></span></button>
          <button type="button" class="ob-option" role="radio" aria-checked="${pick.mode === 'fresh'}" data-mode="fresh"><i class="fas fa-seedling"></i><span><strong>A fresh garden</strong><small>Start from zero with only the skills you picked</small></span></button>
        </div>`}`;
      ob.innerHTML = `
        <form method="dialog" class="modal-body" novalidate>
          <div class="ob-steps" aria-hidden="true">${[0, 1, 2].map(i => `<span class="${i <= step ? 'on' : ''}"></span>`).join('')}</div>
          <p class="sr-only" aria-live="polite">Step ${step + 1} of 3</p>
          ${body}
          <div class="ob-foot">
            ${step ? '<button type="button" class="btn btn-ghost" data-ob="back"><i class="fas fa-arrow-left"></i> Back</button>'
                   : '<button type="button" class="btn btn-ghost" data-ob="skip">Skip for now</button>'}
            <span class="spacer"></span>
            <button type="submit" class="btn btn-primary">${step === 2 ? 'Plant my garden <i class="fas fa-seedling"></i>' : 'Continue <i class="fas fa-arrow-right"></i>'}</button>
          </div>
        </form>`;
      (step === 0 ? $('#obName', ob) : $('[aria-checked="true"], .ob-skill, .ob-option', ob))?.focus();
    }

    function finish() {
      const fresh = !replay && pick.mode === 'fresh';
      state.user.name = pick.name || 'Learner';
      state.settings.dailyGoal = pick.goal;
      if (fresh) {
        Object.assign(state, { progress: {}, log: {}, goals: [], unlocked: [], postsMade: 0, likesGiven: 0 });
        state.posts = state.posts.filter(p => !p.mine).map(p => ({ ...p, liked: false }));
        state.notifications = [{ id: uid(), icon: 'fa-seedling', text: 'Welcome to BloomOS! Your first seeds are planted.', time: Date.now(), read: false }];
      }
      pick.skills.forEach(id => { if (!enrolled(id)) state.progress[id] = { done: 0, last: Date.now() }; });
      if (fresh || !enrolled(state.lastCourse)) state.lastCourse = [...pick.skills][0];
      state.onboarded = true;
      finished = true;
      ob.close();
      ob.remove();
      checkAchievements(true);
      save(); applyPrefs(); renderTopbar(); renderSidebar(); renderPage();
      toast('🌸', `Welcome, ${state.user.name}!`, 'Your garden is planted. Tap a skill to take your first lesson.');
      petalRain();
    }

    ob.addEventListener('click', e => {
      const t = e.target.closest('[data-skill], [data-goal], [data-mode], [data-ob]');
      if (!t) return;
      if (t.dataset.skill) {
        const id = t.dataset.skill;
        pick.skills.has(id) ? pick.skills.delete(id) : pick.skills.add(id);
        t.setAttribute('aria-checked', String(pick.skills.has(id)));
        $('#obHint', ob).textContent = '';
      } else if (t.dataset.goal || t.dataset.mode) {
        if (t.dataset.goal) pick.goal = Number(t.dataset.goal); else pick.mode = t.dataset.mode;
        $$('[role="radio"]', t.parentElement).forEach(b => b.setAttribute('aria-checked', String(b === t)));
      } else if (t.dataset.ob === 'back') {
        step--; draw();
      } else if (t.dataset.ob === 'skip') {
        state.onboarded = true;
        save();
        ob.close();
        ob.remove();
      }
    });

    ob.addEventListener('submit', e => {
      e.preventDefault();
      if (step === 0) {
        const v = $('#obName', ob).value.trim().slice(0, 32);
        if (!v) { $('#obName', ob).focus(); return; }
        pick.name = v;
      }
      if (step === 1 && !pick.skills.size) { $('#obHint', ob).textContent = 'Pick at least one skill to plant.'; return; }
      if (step === 2) { finish(); return; }
      step++; draw();
    });

    ob.addEventListener('close', () => {
      if (!finished) { state.onboarded = true; save(); }
      ob.remove();
    });

    draw();
    ob.showModal();
    $('#obName', ob)?.select();
  }

  /* ---------------------------------------------------------
     PRELOADER — full bloom on first visit, quick fade after
     --------------------------------------------------------- */

  function finishPreloader() {
    const pl = $('#preloader');
    const afterReveal = () => { if (!state.onboarded) openOnboarding(false); };
    const enter = () => { if (!motionOff()) $('#page')?.classList.add('page-enter'); };
    if (!pl) { enter(); afterReveal(); return; }
    const first = !sessionStorageGet('seen');
    sessionStorageSet('seen', '1');
    const minTime = first && !motionOff() ? 1700 : 0;
    const started = window.__bloomStart || 0;
    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      setTimeout(() => {
        enter();
        pl.classList.add('pl-done');
        document.documentElement.classList.remove('preloading');
        setTimeout(() => { pl.remove(); afterReveal(); }, motionOff() ? 0 : 550);
      }, Math.max(0, minTime - (performance.now() - started)));
    };
    const loaded = new Promise(r => document.readyState === 'complete' ? r() : window.addEventListener('load', r, { once: true }));
    Promise.all([loaded, document.fonts?.ready]).then(reveal); // wait for icons + Inter so nothing pops in
    setTimeout(reveal, 3000); // never hold the page hostage to a slow CDN
  }

  renderSidebar();
  renderTopbar();
  renderPage();
  SETUP[page]?.();
  finishPreloader();

  // keep relative times and streak fresh if the tab stays open
  setInterval(() => { if (!document.hidden && !dialog.open && !document.activeElement?.matches('input, textarea, select')) renderPage(); }, 60000);
})();
