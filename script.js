/* =====================================================
   KWICKR – script.js  |  Complete Vanilla JS
   ===================================================== */
'use strict';

/* ─── Storage Keys ───────────────────────────────── */
const STORAGE_KEYS = {
  tasks:   'kwickr_tasks_v7',
  user:    'kwickr_user_v7',
  theme:   'kwickr_theme_v7',
  chat:    'kwickr_chat_v7',
  demands: 'kwickr_demands_v7'
};

/* ─── Global State ───────────────────────────────── */
const state = {
  tasks:             [],
  demands:           {},     // { taskId: [demand,...] }
  currentUser:       null,
  userCoords:        null,   // { lat, lng }
  mapPickedCoords:   null,   // { lat, lng }
  filter:            { search: '', category: '', radius: 10 },
  activeChatTaskId:  null,
  activePayTaskId:   null,
  activeRateTaskId:  null,
  activeVerifyTaskId:null,
  authRole:          'provider'
};

/* ─── Pune base coordinates (demo) ──────────────── */
const BASE = { lat: 18.5204, lng: 73.8567 };

/* ─── Random job templates ───────────────────────── */
const JOB_TEMPLATES = [
  { title:'Fix Leaking Kitchen Tap',   category:'Repair',      budget:[200,600],  desc:'Tap is dripping constantly. Need a plumber ASAP.' },
  { title:'Grocery Delivery',          category:'Delivery',    budget:[80,200],   desc:'Pick up groceries from D-Mart and deliver to my flat.' },
  { title:'House Deep Cleaning',       category:'Cleaning',    budget:[500,1500], desc:'3 BHK apartment needs thorough cleaning including bathrooms.' },
  { title:'Math Tuition – Grade 10',   category:'Tutoring',    budget:[300,700],  desc:'Need a maths tutor for CBSE Grade 10 boards preparation.' },
  { title:'Furniture Moving Help',     category:'Moving Help', budget:[400,900],  desc:'Shifting sofa and beds to new flat, 2nd floor, no lift.' },
  { title:'Pharmacy Errand',           category:'Errands',     budget:[60,150],   desc:'Pick up medicines from Apollo Pharmacy and deliver home.' },
  { title:'AC Service & Gas Refill',   category:'Repair',      budget:[600,1200], desc:'1.5 ton split AC needs servicing and gas top-up.' },
  { title:'Dog Walking – 1 Hour',      category:'Other',       budget:[100,250],  desc:'Walk my Labrador around the park for 1 hour daily.' },
  { title:'Office Document Courier',   category:'Delivery',    budget:[100,300],  desc:'Urgent document delivery from Andheri to Bandra office.' },
];

const PUNE_AREAS = ['Koregaon Park','Baner','Hinjewadi','Kothrud','Viman Nagar','Hadapsar','Aundh','Shivaji Nagar','Deccan','FC Road','Wakad','Pimpri','Chinchwad','Kalyani Nagar'];

/* =====================================================
   INIT
===================================================== */
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  applyTheme();
  initThemeToggle();
  initNavbar();
  initBackToTop();
  initAppTabs();
  initMapPicker();
  initPostTaskForm();
  initNearbyTasks();
  initLifecycleBoard();
  initModalListeners();
  initAuthForms();
  initStatsCounter();
  initTestimonialsSlider();
  initFaqAccordion();
  initContactForm();
  initScrollReveal();
});

/* =====================================================
   PERSISTENCE
===================================================== */
function loadState() {
  try {
    const t = localStorage.getItem(STORAGE_KEYS.tasks);
    state.tasks   = t ? JSON.parse(t) : buildSampleTasks();
    const d = localStorage.getItem(STORAGE_KEYS.demands);
    state.demands = d ? JSON.parse(d) : {};
    const u = localStorage.getItem(STORAGE_KEYS.user);
    state.currentUser = u ? JSON.parse(u) : null;
  } catch (e) {
    state.tasks   = buildSampleTasks();
    state.demands = {};
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEYS.tasks,   JSON.stringify(state.tasks));
    localStorage.setItem(STORAGE_KEYS.demands, JSON.stringify(state.demands));
    if (state.currentUser)
      localStorage.setItem(STORAGE_KEYS.user,  JSON.stringify(state.currentUser));
  } catch (e) { /* storage full */ }
}

/* =====================================================
   SAMPLE TASKS
===================================================== */
function buildSampleTasks() {
  const now = Date.now();
  return [
    mkTask({ id:'t1', title:'Fix Leaking Tap',    category:'Repair',      budget:350, dist:1.2, desc:'Kitchen tap dripping badly.',         status:'posted',      hoursAhead:2 }),
    mkTask({ id:'t2', title:'Grocery Delivery',   category:'Delivery',    budget:120, dist:3.5, desc:'Get groceries from Big Bazaar.',      status:'posted',      hoursAhead:3 }),
    mkTask({ id:'t3', title:'Home Deep Cleaning',  category:'Cleaning',    budget:800, dist:2.1, desc:'2BHK deep cleaning with bathrooms.',  status:'accepted',    hoursAhead:1, worker:{ name:'Rajesh Kumar', phone:'9876543210', rating:4.7, demandAmount:750, eta:'45 mins' } }),
    mkTask({ id:'t4', title:'Math Tuition',        category:'Tutoring',    budget:500, dist:4.8, desc:'CBSE Grade 10 boards maths tuition.', status:'in_progress', hoursAhead:-1, worker:{ name:'Priya Sharma', phone:'9123456780', rating:4.9, demandAmount:480, eta:'On site' } }),
    mkTask({ id:'t5', title:'Furniture Moving',    category:'Moving Help', budget:700, dist:6.3, desc:'Shift sofa and wardrobe to 3rd floor.',status:'completed',   hoursAhead:-3, worker:{ name:'Arun Singh',  phone:'9988776655', rating:4.5, demandAmount:650, eta:'Done' } }),
    mkTask({ id:'t6', title:'Pharmacy Errand',     category:'Errands',     budget:80,  dist:0.8, desc:'Pick up medicines from Apollo.',      status:'posted',      hoursAhead:1 }),
  ].map(t => ({ ...t, createdAt: now }));
}

function mkTask({ id, title, category, budget, dist, desc, status, hoursAhead, worker }) {
  const dt = new Date();
  dt.setHours(dt.getHours() + hoursAhead);
  return {
    id:                   id || 'task_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
    title, category, budget,
    dateTime:             dt.toISOString(),
    description:          desc,
    location:             randomArea(),
    lat:                  BASE.lat + (Math.random() - 0.5) * 0.06,
    lng:                  BASE.lng + (Math.random() - 0.5) * 0.06,
    distance:             dist,
    providerName:         'Sample Provider',
    providerPhone:        '9000000000',
    status,
    assignedWorker:       worker || null,
    verificationPin:      pin4(),
    workerVerifiedOnSite: ['in_progress','completed','paid'].includes(status),
    progressPhotos:       [],
    rating:               null,
    createdAt:            Date.now()
  };
}

function randomArea() {
  return PUNE_AREAS[Math.floor(Math.random() * PUNE_AREAS.length)] + ', Pune';
}

function pin4() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/* =====================================================
   THEME
===================================================== */
function applyTheme() {
  const saved = localStorage.getItem(STORAGE_KEYS.theme) || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = saved === 'dark' ? '☀️' : '🌙';
}

function initThemeToggle() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const cur  = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE_KEYS.theme, next);
    btn.textContent = next === 'dark' ? '☀️' : '🌙';
  });
}

/* =====================================================
   NAVBAR
===================================================== */
function initNavbar() {
  const ham   = document.getElementById('hamburger');
  const links = document.getElementById('navLinks');
  if (ham && links) {
    ham.addEventListener('click', () => {
      ham.classList.toggle('open');
      links.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        ham.classList.remove('open');
        links.classList.remove('open');
      });
    });
  }
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (nav) nav.style.boxShadow = window.scrollY > 8 ? '0 2px 20px rgba(0,0,0,.12)' : '';
  });
}

/* =====================================================
   BACK TO TOP
===================================================== */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 400));
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* =====================================================
   APP TABS
===================================================== */
function initAppTabs() {
  document.querySelectorAll('.app-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchAppTab(btn.dataset.target));
  });
}

function switchAppTab(tabId) {
  document.querySelectorAll('.app-tab-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.target === tabId));
  document.querySelectorAll('.app-tab-content').forEach(c =>
    c.classList.toggle('active', c.id === tabId));
  if (tabId === 'nearbyTasksTab') renderNearbyTasks();
  if (tabId === 'lifecycleTab')   renderLifecycleBoard();
}

/* Expose for inline buttons */
function goToNearbyTasksBoard() {
  switchAppTab('nearbyTasksTab');
  const el = document.getElementById('workingDemo');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* Scroll to Working Demo and open the Post a Task tab */
function goToPostTaskBoard() {
  switchAppTab('postTaskTab');
  const el = document.getElementById('workingDemo');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* =====================================================
   MAP PICKER
===================================================== */
function initMapPicker() {
  /* Open map modal */
  document.getElementById('openMapPickerBtn')?.addEventListener('click', () => openModal('mapPickerModal'));

  /* Click on map canvas to place pin */
  const canvas = document.getElementById('mapCanvas');
  if (canvas) {
    canvas.addEventListener('click', (e) => {
      const rect  = canvas.getBoundingClientRect();
      const pctX  = (e.clientX - rect.left)  / rect.width;
      const pctY  = (e.clientY - rect.top)   / rect.height;
      const lat   = BASE.lat + 0.06 - pctY * 0.12;
      const lng   = BASE.lng - 0.06 + pctX * 0.12;
      state.mapPickedCoords = { lat: +lat.toFixed(5), lng: +lng.toFixed(5) };
      const marker = document.getElementById('mapMarker');
      if (marker) {
        marker.style.top  = (e.clientY - rect.top)  + 'px';
        marker.style.left = (e.clientX - rect.left) + 'px';
        marker.style.transform = 'translate(-50%,-100%)';
        marker.style.transition = 'none';
      }
      const coordEl = document.getElementById('mapCoords');
      if (coordEl) coordEl.textContent = `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
    });
  }

  /* GPS button */
  document.getElementById('useGpsBtn')?.addEventListener('click', () => {
    if (!navigator.geolocation) { showToast('Geolocation not supported by this browser.', 'error'); return; }
    showToast('Getting your location via GPS…', 'info');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        state.userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        state.mapPickedCoords = { ...state.userCoords };
        const locEl = document.getElementById('taskLocation');
        if (locEl) locEl.value = `GPS: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
        document.getElementById('taskLat').value = pos.coords.latitude;
        document.getElementById('taskLng').value = pos.coords.longitude;
        showToast('Location captured via GPS 📍', 'success');
        recalcDistances();
      },
      () => showToast('GPS access denied. Enter location manually or use the map.', 'error')
    );
  });
}

function simulateMapSearch() {
  const q   = document.getElementById('mapSearchInput')?.value.trim();
  if (!q) return;
  const lat = BASE.lat + (Math.random() - 0.5) * 0.1;
  const lng = BASE.lng + (Math.random() - 0.5) * 0.1;
  state.mapPickedCoords = { lat: +lat.toFixed(5), lng: +lng.toFixed(5) };
  const coordEl = document.getElementById('mapCoords');
  if (coordEl) coordEl.textContent = `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}  ("${q}")`;
  showToast(`Location found: ${q}`, 'success');
}

function confirmMapLocation() {
  if (!state.mapPickedCoords) { showToast('Please click on the map to drop a pin first.', 'error'); return; }
  const q     = document.getElementById('mapSearchInput')?.value.trim();
  const locEl = document.getElementById('taskLocation');
  if (locEl) locEl.value = q || `Map: ${state.mapPickedCoords.lat}, ${state.mapPickedCoords.lng}`;
  const latEl = document.getElementById('taskLat');
  const lngEl = document.getElementById('taskLng');
  if (latEl) latEl.value = state.mapPickedCoords.lat;
  if (lngEl) lngEl.value = state.mapPickedCoords.lng;
  closeModal('mapPickerModal');
  showToast('Location confirmed from map 📍', 'success');
}

/* =====================================================
   HAVERSINE
===================================================== */
function haversine(lat1, lng1, lat2, lng2) {
  const R    = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a    = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function recalcDistances() {
  if (!state.userCoords) return;
  state.tasks.forEach(t => {
    t.distance = +haversine(state.userCoords.lat, state.userCoords.lng, t.lat, t.lng).toFixed(1);
  });
  saveState();
  renderNearbyTasks();
}

/* =====================================================
   POST TASK FORM
===================================================== */
function initPostTaskForm() {
  const form   = document.getElementById('postTaskForm');
  const dtInput = document.getElementById('taskDateTime');
  if (!form) return;
  /* Default datetime = now + 1 hr */
  if (dtInput) {
    const d = new Date(); d.setHours(d.getHours() + 1);
    dtInput.value = d.toISOString().slice(0, 16);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title    = val('taskTitle');
    const category = val('taskCategory');
    const desc     = val('taskDescription');
    const location = val('taskLocation');
    const dateTime = val('taskDateTime');
    const budget   = parseFloat(val('taskBudget'));
    const lat      = parseFloat(val('taskLat'))  || BASE.lat + rand(-.05,.05);
    const lng      = parseFloat(val('taskLng'))  || BASE.lng + rand(-.05,.05);

    if (!title || !category || !desc || !location || !dateTime || !budget) {
      showToast('Please fill in all required fields ✱', 'error'); return;
    }
    if (budget < 50) { showToast('Minimum budget is ₹50', 'error'); return; }

    const dist = state.userCoords
      ? +haversine(state.userCoords.lat, state.userCoords.lng, lat, lng).toFixed(1)
      : +(rand(0.5, 9)).toFixed(1);

    const task = {
      id:                   'task_' + Date.now(),
      title, category, budget, dateTime, description: desc, location, lat, lng,
      distance:             dist,
      providerName:         state.currentUser?.name  || 'You',
      providerPhone:        state.currentUser?.phone || '',
      status:               'posted',
      assignedWorker:       null,
      verificationPin:      pin4(),
      workerVerifiedOnSite: false,
      progressPhotos:       [],
      rating:               null,
      createdAt:            Date.now()
    };
    state.tasks.unshift(task);
    saveState();
    form.reset();
    /* Reset datetime */
    const d2 = new Date(); d2.setHours(d2.getHours() + 1);
    document.getElementById('taskDateTime').value = d2.toISOString().slice(0, 16);
    state.mapPickedCoords = null;
    showToast('Task posted! 🚀 Nearby workers will be notified.', 'success');
    switchAppTab('nearbyTasksTab');
  });
}

function val(id)      { return (document.getElementById(id)?.value || '').trim(); }
function rand(a, b)   { return a + Math.random() * (b - a); }

/* =====================================================
   NEARBY TASKS
===================================================== */
function initNearbyTasks() {
  document.getElementById('taskSearch')?.addEventListener('input', (e) => {
    state.filter.search = e.target.value;
    renderNearbyTasks();
  });
  document.getElementById('categoryFilter')?.addEventListener('change', (e) => {
    state.filter.category = e.target.value;
    renderNearbyTasks();
  });
  document.getElementById('radiusSlider')?.addEventListener('input', (e) => {
    state.filter.radius = parseInt(e.target.value);
    document.getElementById('radiusVal').textContent = e.target.value;
    renderNearbyTasks();
  });
  document.getElementById('addRandomJobBtn')?.addEventListener('click', addRandomJob);
  document.getElementById('resetDemoBtn')?.addEventListener('click', resetDemoJobs);

  /* Event delegation */
  document.getElementById('nearbyTasksContainer')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (btn) routeAction(btn.dataset.action, btn.dataset.taskid);
  });

  renderNearbyTasks();
}

function renderNearbyTasks() {
  const container = document.getElementById('nearbyTasksContainer');
  if (!container) return;
  const { search, category, radius } = state.filter;
  const list = state.tasks.filter(t => {
    const mS = !search   || t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    const mC = !category || t.category === category;
    const mR = t.distance == null || t.distance <= radius;
    return mS && mC && mR;
  });

  if (!list.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h4>No tasks found nearby</h4>
        <p>Expand the radius slider or add a random demo job.</p>
        <div class="empty-state-btns">
          <button class="btn btn-outline" onclick="document.getElementById('radiusSlider').value=20;document.getElementById('radiusVal').textContent=20;state.filter.radius=20;renderNearbyTasks();">🔄 Expand to 20 km</button>
          <button class="btn btn-primary" onclick="addRandomJob()">🎲 Add Random Job</button>
        </div>
      </div>`;
    return;
  }
  container.innerHTML = list.map(buildTaskCard).join('');
}

function buildTaskCard(t) {
  const badge = statusBadge(t.status);
  const workerHtml = t.assignedWorker
    ? `<div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.4rem;">
         <span class="tag tag-cat">👷 ${esc(t.assignedWorker.name)} ★${t.assignedWorker.rating}</span>
         <span class="badge verified-badge">✅ Verified</span>
       </div>` : '';

  let actions = '';
  if (t.status === 'posted') {
    actions = `<button class="btn btn-green btn-sm" data-action="demand" data-taskid="${t.id}">📨 Accept Task</button>`;
    if (t.assignedWorker) actions += ` <button class="btn btn-outline btn-sm" data-action="viewWorker" data-taskid="${t.id}">👷 View Request</button>`;
  } else if (t.status === 'accepted') {
    actions = `
      <button class="btn btn-outline btn-sm" data-action="showQr"     data-taskid="${t.id}">📱 QR Pass</button>
      <button class="btn btn-primary btn-sm" data-action="chat"       data-taskid="${t.id}">💬 Chat</button>
      <button class="btn btn-outline btn-sm" data-action="gmap"       data-taskid="${t.id}">🗺️ Navigate</button>`;
  } else if (t.status === 'in_progress') {
    actions = `
      <button class="btn btn-outline btn-sm" data-action="uploadPhoto" data-taskid="${t.id}">📸 Photo</button>
      <button class="btn btn-primary btn-sm" data-action="chat"        data-taskid="${t.id}">💬 Chat</button>`;
  }

  return `
    <div class="task-card" id="card_${t.id}">
      <div class="task-card-header">
        <span class="task-card-title">${esc(t.title)}</span>
        ${badge}
      </div>
      <div class="task-card-meta">
        <span class="tag tag-cat">${esc(t.category)}</span>
        <span class="tag tag-dist">📍 ${t.distance ? t.distance + ' km' : '—'}</span>
        <span class="tag tag-budget">₹${t.budget}</span>
      </div>
      <p class="task-card-desc">${esc(t.description)}</p>
      ${workerHtml}
      <div class="card-actions">${actions}</div>
    </div>`;
}

function addRandomJob() {
  const tpl = JOB_TEMPLATES[Math.floor(Math.random() * JOB_TEMPLATES.length)];
  const [mn, mx] = tpl.budget;
  const budget   = mn + Math.floor(Math.random() * (mx - mn));
  const lat      = BASE.lat + rand(-.09, .09);
  const lng      = BASE.lng + rand(-.09, .09);
  const dist     = state.userCoords ? +haversine(state.userCoords.lat, state.userCoords.lng, lat, lng).toFixed(1) : +rand(.5, 9).toFixed(1);
  const dt       = new Date(); dt.setMinutes(dt.getMinutes() + 30 + Math.floor(Math.random() * 180));
  const task     = {
    id: 'r_' + Date.now(), title: tpl.title, category: tpl.category, budget,
    dateTime: dt.toISOString(), description: tpl.desc, location: randomArea(),
    lat, lng, distance: dist, providerName: 'Demo Provider', providerPhone: '9000000001',
    status: 'posted', assignedWorker: null, verificationPin: pin4(),
    workerVerifiedOnSite: false, progressPhotos: [], rating: null, createdAt: Date.now()
  };
  state.tasks.unshift(task);
  saveState();
  renderNearbyTasks();
  showToast(`🎲 Random job added: "${task.title}"`, 'success');
}

function resetDemoJobs() {
  state.tasks   = buildSampleTasks();
  state.demands = {};
  saveState();
  renderNearbyTasks();
  renderLifecycleBoard();
  showToast('Jobs reset to default samples ↺', 'info');
}

/* =====================================================
   LIFECYCLE BOARD
===================================================== */
function initLifecycleBoard() {
  document.getElementById('lifecycleBoardContainer')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (btn) routeAction(btn.dataset.action, btn.dataset.taskid);
  });
  renderLifecycleBoard();
}

function renderLifecycleBoard() {
  const container = document.getElementById('lifecycleBoardContainer');
  if (!container) return;
  if (!state.tasks.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><h4>No tasks yet</h4><p>Post a task or browse nearby jobs.</p></div>`;
    return;
  }
  container.innerHTML = state.tasks.map(buildLifecycleCard).join('');
}

function buildLifecycleCard(t) {
  const STEPS = ['Posted','Accepted','In Progress','Completed'];
  const IDX   = { posted:0, accepted:1, in_progress:2, completed:3, paid:3 };
  const cur   = IDX[t.status] ?? 0;

  const tracker = STEPS.map((s, i) => {
    const cls  = i < cur ? 'done' : i === cur ? 'active' : '';
    const icon = i < cur ? '✓' : i + 1;
    const line = i < STEPS.length - 1 ? `<div class="progress-connector ${i < cur ? 'done' : ''}"></div>` : '';
    return `<div class="progress-step ${cls}"><div class="dot">${icon}</div><span>${s}</span></div>${line}`;
  }).join('');

  const photos = t.progressPhotos.slice(-3).map(p => `
    <div class="photo-timeline-item">
      <img class="photo-thumb" src="${p.url}" alt="progress" />
      <div><strong>${p.percent}%</strong> — ${esc(p.caption)}<br/><small>${new Date(p.timestamp).toLocaleTimeString()}</small></div>
    </div>`).join('');

  const workerLine = t.assignedWorker
    ? `<div style="font-size:.82rem;color:var(--text-muted);margin:.4rem 0;">👷 ${esc(t.assignedWorker.name)} · ₹${t.assignedWorker.demandAmount} · ETA: ${esc(t.assignedWorker.eta)}</div>` : '';
  const pinLine = t.verificationPin
    ? `<div style="font-size:.75rem;color:var(--text-muted);">🔐 PIN: <strong>${t.verificationPin}</strong></div>` : '';

  let actions = '';
  if (t.status === 'posted') {
    actions = `<button class="btn btn-outline btn-sm" data-action="verifyQr" data-taskid="${t.id}">🔍 Verify Worker</button>
               <button class="btn btn-primary btn-sm" data-action="chat"     data-taskid="${t.id}">💬 Chat</button>`;
    if (t.assignedWorker) actions += ` <button class="btn btn-green btn-sm" data-action="viewWorker" data-taskid="${t.id}">👷 Worker Request</button>`;
  } else if (t.status === 'accepted') {
    actions = `<button class="btn btn-outline btn-sm" data-action="showQr"   data-taskid="${t.id}">📱 QR Pass</button>
               <button class="btn btn-outline btn-sm" data-action="verifyQr" data-taskid="${t.id}">🔍 Verify</button>
               <button class="btn btn-primary btn-sm" data-action="chat"     data-taskid="${t.id}">💬 Chat</button>
               <button class="btn btn-outline btn-sm" data-action="gmap"     data-taskid="${t.id}">🗺️ Navigate</button>`;
  } else if (t.status === 'in_progress') {
    actions = `<button class="btn btn-outline btn-sm" data-action="uploadPhoto"  data-taskid="${t.id}">📸 Photo</button>
               <button class="btn btn-primary btn-sm" data-action="chat"         data-taskid="${t.id}">💬 Chat</button>
               <button class="btn btn-green btn-sm"   data-action="markComplete" data-taskid="${t.id}">✅ Mark Complete</button>`;
  } else if (t.status === 'completed') {
    actions = `<button class="btn btn-green btn-sm"   data-action="pay"  data-taskid="${t.id}">💳 Confirm &amp; Pay</button>
               <button class="btn btn-outline btn-sm" data-action="rate" data-taskid="${t.id}">⭐ Rate Worker</button>`;
  } else if (t.status === 'paid') {
    actions = `<button class="btn btn-outline btn-sm" data-action="rate" data-taskid="${t.id}">⭐ Rate Worker</button>`;
  }

  return `
    <div class="lifecycle-card" id="lc_${t.id}">
      <div class="lifecycle-card-title">${esc(t.title)}</div>
      <div style="font-size:.8rem;color:var(--text-muted);">📍 ${esc(t.location)} · ₹${t.budget} · ${esc(t.category)}</div>
      ${workerLine}${pinLine}
      <div class="progress-tracker">${tracker}</div>
      ${photos ? `<div class="photo-timeline">${photos}</div>` : ''}
      <div class="card-actions" style="margin-top:.8rem;">${actions}</div>
    </div>`;
}

function markComplete(taskId) {
  const t = findTask(taskId); if (!t) return;
  t.status = 'completed';
  saveState(); renderLifecycleBoard();
  showToast('Task marked as Completed! 🎉 Confirm payment when ready.', 'success');
}

/* =====================================================
   ACTION ROUTER
===================================================== */
function routeAction(action, taskId) {
  const t = findTask(taskId);
  switch (action) {
    case 'demand':       openDemandModal(taskId); break;
    case 'viewWorker':   openWorkerInfoModal(taskId); break;
    case 'showQr':       openWorkerQrModal(taskId); break;
    case 'verifyQr':     openProviderVerifyModal(taskId); break;
    case 'chat':         openChatModal(taskId); break;
    case 'gmap':         if (t) openGoogleMaps(t); break;
    case 'uploadPhoto':  openPhotoUploadModal(taskId); break;
    case 'pay':          openPaymentModal(taskId); break;
    case 'rate':         openRatingModal(taskId); break;
    case 'markComplete': markComplete(taskId); break;
  }
}

/* =====================================================
   OPEN / CLOSE MODAL
===================================================== */
function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('active');
  document.body.style.overflow = '';
}

/* Close on backdrop click */
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

/* =====================================================
   MODAL LISTENERS
===================================================== */
function initModalListeners() {
  /* ── Demand submit ── */
  document.getElementById('submitDemandBtn')?.addEventListener('click', () => {
    const btn    = document.getElementById('submitDemandBtn');
    const taskId = btn.dataset.taskid;
    const name   = val('demandName');
    const phone  = val('demandPhone');
    const amount = parseFloat(val('demandAmount'));
    const eta    = val('demandEta');
    if (!name || !phone || !amount || !eta) { showToast('Please fill all fields.', 'error'); return; }
    const t = findTask(taskId);
    if (t) {
      t.status = 'accepted';
      t.assignedWorker = { name, phone, rating: +(4.2 + Math.random() * 0.7).toFixed(1), demandAmount: amount, eta };
      if (!state.demands[taskId]) state.demands[taskId] = [];
      state.demands[taskId].push({ name, phone, amount, eta, ts: Date.now() });
      saveState(); renderNearbyTasks(); renderLifecycleBoard();
    }
    closeModal('demandModal');
    showToast('Request sent to provider! 📨 Awaiting confirmation.', 'success');
  });

  /* ── Accept worker (provider side) ── */
  document.getElementById('confirmAcceptBtn')?.addEventListener('click', () => {
    const btn    = document.getElementById('confirmAcceptBtn');
    const taskId = btn.dataset.taskid;
    const t      = findTask(taskId);
    if (t) { t.status = 'accepted'; saveState(); renderNearbyTasks(); renderLifecycleBoard(); }
    closeModal('workerInfoModal');
    showToast('Worker accepted! They\'ll arrive at your location. ✅', 'success');
  });

  /* ── Photo submit ── */
  document.getElementById('submitPhotoBtn')?.addEventListener('click', () => {
    const btn    = document.getElementById('submitPhotoBtn');
    const taskId = btn.dataset.taskid;
    const file   = document.getElementById('progressPhotoInput')?.files?.[0];
    const pct    = document.getElementById('progressPct')?.value || 50;
    const cap    = val('progressCaption') || 'Work in progress';
    if (!file) { showToast('Please select a photo first.', 'error'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const t = findTask(taskId);
      if (t) {
        t.progressPhotos.push({ url: ev.target.result, percent: parseInt(pct), caption: cap, timestamp: Date.now() });
        if (t.status === 'accepted') t.status = 'in_progress';
        saveState(); renderLifecycleBoard(); renderUploadedPhotos(taskId);
      }
      document.getElementById('progressPhotoInput').value = '';
      document.getElementById('photoPreviewArea').innerHTML = '';
      showToast('Photo uploaded! 📸', 'success');
    };
    reader.readAsDataURL(file);
  });

  /* Photo live preview */
  document.getElementById('progressPhotoInput')?.addEventListener('change', () => {
    const file = document.getElementById('progressPhotoInput').files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const area = document.getElementById('photoPreviewArea');
      if (area) area.innerHTML = `<img src="${ev.target.result}" alt="preview" />`;
    };
    reader.readAsDataURL(file);
  });

  /* ── Payment confirm ── */
  document.getElementById('confirmPayBtn')?.addEventListener('click', () => {
    const btn    = document.getElementById('confirmPayBtn');
    const taskId = btn.dataset.taskid;
    const method = document.querySelector('input[name="payMethod"]:checked')?.value || 'upi';
    const t      = findTask(taskId);
    if (t) { t.status = 'paid'; saveState(); renderLifecycleBoard(); }
    closeModal('paymentModal');
    showToast(`Payment of ₹${t?.budget || ''} via ${method.toUpperCase()} successful! 💳`, 'success');
    setTimeout(() => openRatingModal(taskId), 900);
  });

  /* ── QR scan simulate ── */
  document.getElementById('simulateQrScanBtn')?.addEventListener('click', () => {
    confirmWorkerOnSite(document.getElementById('simulateQrScanBtn').dataset.taskid);
  });

  /* ── PIN verify ── */
  document.getElementById('verifyPinBtn')?.addEventListener('click', () => {
    const btn    = document.getElementById('verifyPinBtn');
    const taskId = btn.dataset.taskid;
    const entered = val('pinVerifyInput');
    const t       = findTask(taskId);
    if (!t) return;
    if (entered === t.verificationPin) {
      confirmWorkerOnSite(taskId);
    } else {
      showToast('Incorrect PIN. Ask the worker to show their QR Pass.', 'error');
    }
  });
}

function confirmWorkerOnSite(taskId) {
  const t = findTask(taskId); if (!t) return;
  t.workerVerifiedOnSite = true;
  if (t.status === 'accepted') t.status = 'in_progress';
  saveState(); renderNearbyTasks(); renderLifecycleBoard();
  const alertEl = document.getElementById('verifySuccessAlert');
  if (alertEl) { alertEl.style.display = 'flex'; setTimeout(() => { alertEl.style.display = 'none'; }, 2000); }
  setTimeout(() => closeModal('providerVerifyModal'), 1800);
  showToast('Worker verified on-site! Task is now In Progress. 🚀', 'success');
}

/* =====================================================
   DEMAND MODAL
===================================================== */
function openDemandModal(taskId) {
  const t = findTask(taskId);
  const titleEl = document.getElementById('demandTaskTitle');
  if (titleEl && t) titleEl.textContent = t.title;
  const btn = document.getElementById('submitDemandBtn');
  if (btn) btn.dataset.taskid = taskId;
  /* Pre-fill from current user */
  if (state.currentUser) {
    const n = document.getElementById('demandName');
    const p = document.getElementById('demandPhone');
    if (n) n.value = state.currentUser.name;
    if (p) p.value = state.currentUser.phone;
  }
  ['demandAmount','demandEta','demandMessage'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  openModal('demandModal');
}

/* =====================================================
   WORKER INFO MODAL
===================================================== */
function openWorkerInfoModal(taskId) {
  const t = findTask(taskId);
  if (!t?.assignedWorker) return;
  const w    = t.assignedWorker;
  const body = document.getElementById('workerInfoBody');
  if (body) {
    body.innerHTML = `
      <div class="worker-info-profile">
        <div class="worker-info-avatar">👷</div>
        <div>
          <div class="worker-info-name">${esc(w.name)} <span class="badge verified-badge">✅ Verified</span></div>
          <div class="worker-info-rating">★ ${w.rating} / 5.0</div>
        </div>
      </div>
      <div class="worker-info-details">
        <div class="worker-detail-row">📞 <span>${esc(w.phone)}</span></div>
        <div class="worker-detail-row">💰 <span>Demand: ₹${w.demandAmount}</span></div>
        <div class="worker-detail-row">⏰ <span>ETA: ${esc(w.eta)}</span></div>
        <div class="worker-detail-row">📋 <span>Task: ${esc(t.title)}</span></div>
        <div class="worker-detail-row">📍 <span>${esc(t.location)}</span></div>
      </div>`;
  }
  const btn = document.getElementById('confirmAcceptBtn');
  if (btn) btn.dataset.taskid = taskId;
  openModal('workerInfoModal');
}

/* =====================================================
   PHOTO UPLOAD MODAL
===================================================== */
function openPhotoUploadModal(taskId) {
  const t = findTask(taskId);
  const titleEl = document.getElementById('photoTaskTitle');
  if (titleEl && t) titleEl.textContent = t.title;
  const btn = document.getElementById('submitPhotoBtn');
  if (btn) btn.dataset.taskid = taskId;
  document.getElementById('progressPct').value = 50;
  document.getElementById('progressPctDisplay').textContent = '50%';
  document.getElementById('progressCaption').value = '';
  document.getElementById('photoPreviewArea').innerHTML = '';
  renderUploadedPhotos(taskId);
  openModal('photoUploadModal');
}

function renderUploadedPhotos(taskId) {
  const t    = findTask(taskId);
  const list = document.getElementById('uploadedPhotosList');
  if (!list || !t) return;
  list.innerHTML = !t.progressPhotos.length
    ? '<p style="font-size:.8rem;color:var(--text-muted);">No photos uploaded yet.</p>'
    : t.progressPhotos.map(p => `
        <div class="uploaded-photo-item">
          <img src="${p.url}" alt="progress" />
          <div><strong>${p.percent}%</strong> — ${esc(p.caption)}<br/><small>${new Date(p.timestamp).toLocaleTimeString()}</small></div>
        </div>`).join('');
}

/* =====================================================
   PAYMENT MODAL
===================================================== */
function openPaymentModal(taskId) {
  const t = findTask(taskId); if (!t) return;
  const summary = document.getElementById('paymentSummary');
  if (summary) {
    summary.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:.5rem;"><span>Task</span><strong>${esc(t.title)}</strong></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:.5rem;"><span>Worker</span><strong>${esc(t.assignedWorker?.name || 'Worker')}</strong></div>
      <div style="display:flex;justify-content:space-between;font-size:1.1rem;border-top:1px solid var(--border);padding-top:.5rem;margin-top:.4rem;">
        <span>Total</span><strong style="color:var(--green);">₹${t.budget}</strong>
      </div>`;
  }
  const btn = document.getElementById('confirmPayBtn');
  if (btn) btn.dataset.taskid = taskId;
  openModal('paymentModal');
}

/* =====================================================
   RATING MODAL
===================================================== */
function openRatingModal(taskId) {
  const t = findTask(taskId); if (!t) return;
  const titleEl = document.getElementById('ratingTaskTitle');
  if (titleEl) titleEl.textContent = t.title;
  state.activeRateTaskId = taskId;
  document.querySelectorAll('#starRating .star').forEach(s => s.classList.remove('active'));
  const commentEl = document.getElementById('ratingComment');
  if (commentEl) commentEl.value = '';
  openModal('ratingModal');
  wireStarRating();
}

function wireStarRating() {
  const stars  = document.querySelectorAll('#starRating .star');
  let selected = 0;

  const oldBtn = document.getElementById('submitRatingBtn');
  const newBtn = oldBtn.cloneNode(true);
  oldBtn.parentNode.replaceChild(newBtn, oldBtn);

  stars.forEach(star => {
    star.addEventListener('mouseenter', () => {
      const v = parseInt(star.dataset.val);
      stars.forEach((s,i) => s.classList.toggle('active', i < v));
    });
    star.addEventListener('mouseleave', () => {
      stars.forEach((s,i) => s.classList.toggle('active', i < selected));
    });
    star.addEventListener('click', () => {
      selected = parseInt(star.dataset.val);
      stars.forEach((s,i) => s.classList.toggle('active', i < selected));
    });
  });

  newBtn.addEventListener('click', () => {
    if (!selected) { showToast('Please select a star rating.', 'error'); return; }
    const comment = val('ratingComment');
    const t = findTask(state.activeRateTaskId);
    if (t) { t.rating = { score: selected, comment }; saveState(); renderLifecycleBoard(); }
    closeModal('ratingModal');
    showToast(`Thank you! You rated ★${selected}. 🌟`, 'success');
  });
}

/* =====================================================
   CHAT MODAL
===================================================== */
function openChatModal(taskId) {
  const t = findTask(taskId); if (!t) return;
  state.activeChatTaskId = taskId;
  const titleEl = document.getElementById('chatModalTitle');
  if (titleEl) titleEl.textContent = `💬 ${t.title}`;

  let history = [];
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.chat + '_' + taskId);
    history = saved ? JSON.parse(saved) : [];
  } catch (e) { history = []; }

  if (!history.length) {
    const now = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    history = [
      { text: `Hi! I'm interested in your task "${t.title}". I'm available today.`, sent: false, time: now },
      { text: `Great! Location is ${t.location}. Budget is ₹${t.budget}. When can you come?`, sent: true, time: now },
    ];
  }

  drawChatMessages(history);
  openModal('chatModal');
  wireChatInput(taskId, history);
}

function drawChatMessages(messages) {
  const win = document.getElementById('chatWindow');
  if (!win) return;
  win.innerHTML = messages.map(m => `
    <div class="chat-bubble ${m.sent ? 'sent' : 'recv'}">
      ${esc(m.text)}<div class="chat-time">${m.time}</div>
    </div>`).join('');
  win.scrollTop = win.scrollHeight;
}

function wireChatInput(taskId, history) {
  const oldInput = document.getElementById('chatInput');
  const oldBtn   = document.getElementById('chatSendBtn');
  const newInput = oldInput.cloneNode(true);
  const newBtn   = oldBtn.cloneNode(true);
  oldInput.parentNode.replaceChild(newInput, oldInput);
  oldBtn.parentNode.replaceChild(newBtn, oldBtn);

  function send() {
    const text = newInput.value.trim();
    if (!text) return;
    const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    history.push({ text, sent: true, time });
    newInput.value = '';
    try { localStorage.setItem(STORAGE_KEYS.chat + '_' + taskId, JSON.stringify(history)); } catch(e) {}
    drawChatMessages(history);
    /* Auto-reply */
    setTimeout(() => {
      const replies = ['Got it! 👍','On my way! 🚗','Understood, be there shortly.','Reaching in ~15 mins 📍','Done with this step ✅','Need 10 more minutes ⏰'];
      const reply   = { text: replies[Math.floor(Math.random() * replies.length)], sent: false, time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) };
      history.push(reply);
      try { localStorage.setItem(STORAGE_KEYS.chat + '_' + taskId, JSON.stringify(history)); } catch(e) {}
      drawChatMessages(history);
    }, 1000 + Math.random() * 1500);
  }

  newBtn.addEventListener('click', send);
  newInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
}

function sendChatChip(text) {
  const input = document.getElementById('chatInput');
  if (input) input.value = text;
  document.getElementById('chatSendBtn')?.click();
}

function simulateCall() {
  showToast('📞 Calling worker… (simulated — no real call)', 'info');
}

function openWhatsApp() {
  const t = findTask(state.activeChatTaskId);
  const phone = t?.assignedWorker?.phone || '9000000000';
  const msg   = encodeURIComponent(`Hi! I found you on Kwickr for the task: "${t?.title || ''}". Please confirm availability.`);
  window.open(`https://wa.me/91${phone}?text=${msg}`, '_blank');
}

/* =====================================================
   GOOGLE MAPS
===================================================== */
function openGoogleMaps(t) {
  const dest = (t.lat && t.lng) ? `${t.lat},${t.lng}` : encodeURIComponent(t.location);
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, '_blank');
}

/* =====================================================
   WORKER QR MODAL
===================================================== */
function openWorkerQrModal(taskId) {
  const t = findTask(taskId); if (!t) return;
  const workerName = t.assignedWorker?.name || state.currentUser?.name || 'Worker';
  const nameEl = document.getElementById('qrWorkerName');
  const pinEl  = document.getElementById('qrPinDisplay');
  const metaEl = document.getElementById('qrTaskMeta');
  if (nameEl) nameEl.textContent = workerName;
  if (pinEl)  pinEl.textContent  = t.verificationPin;
  if (metaEl) metaEl.innerHTML   = `📋 ${esc(t.title)}<br/>📍 ${esc(t.location)}<br/>💰 ₹${t.budget}`;
  const canvas = document.getElementById('workerQrCanvas');
  if (canvas) drawKwickrQr(canvas, `KWICKR|${taskId}|${t.verificationPin}|${workerName}|${t.title}`);
  openModal('workerQrModal');
}

/* ─── QR Canvas Renderer ─────────────────────────── */
function drawKwickrQr(canvas, data) {
  const ctx  = canvas.getContext('2d');
  const S    = canvas.width;   // 200
  const MOD  = 25;
  const cell = S / MOD;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, S, S);

  /* deterministic hash */
  function h(str) {
    let v = 0;
    for (let i = 0; i < str.length; i++) v = (Math.imul(31, v) + str.charCodeAt(i)) | 0;
    return Math.abs(v);
  }

  function fillCell(c, r, color) {
    ctx.fillStyle = color || '#000';
    ctx.fillRect(c * cell + 1, r * cell + 1, cell - 2, cell - 2);
  }

  /* finder pattern */
  function finder(sc, sr) {
    for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) {
      if (r === 0 || r === 6 || c === 0 || c === 6) fillCell(sc+c, sr+r, '#000');
    }
    for (let r = 1; r < 6; r++) for (let c = 1; c < 6; c++) {
      if (r === 1 || r === 5 || c === 1 || c === 5) fillCell(sc+c, sr+r, '#FFF');
    }
    for (let r = 2; r < 5; r++) for (let c = 2; c < 5; c++) fillCell(sc+c, sr+r, '#000');
  }

  finder(0, 0);
  finder(MOD - 7, 0);
  finder(0, MOD - 7);

  /* timing */
  for (let i = 8; i < MOD - 8; i++) {
    if (i % 2 === 0) { fillCell(i, 6, '#000'); fillCell(6, i, '#000'); }
  }

  /* reserved zones */
  const reserved = new Set();
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    reserved.add(`${c},${r}`); reserved.add(`${MOD-1-c},${r}`); reserved.add(`${c},${MOD-1-r}`);
  }
  for (let i = 6; i < MOD; i++) { reserved.add(`${i},6`); reserved.add(`6,${i}`); }

  /* data cells */
  const hv = h(data);
  for (let r = 0; r < MOD; r++) {
    for (let c = 0; c < MOD; c++) {
      if (reserved.has(`${c},${r}`)) continue;
      if ((h(data + r * MOD + c + hv) >> (c % 8)) & 1) fillCell(c, r, '#4B1FA8');
    }
  }

  /* center Kwickr dot */
  const cx = S / 2, cy = S / 2;
  ctx.fillStyle = '#2E9E44';
  ctx.beginPath();
  ctx.arc(cx, cy, cell * 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFF';
  ctx.font = `900 ${Math.round(cell * 1.5)}px Poppins, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('K', cx, cy + 1);
}

/* =====================================================
   PROVIDER VERIFY MODAL
===================================================== */
function openProviderVerifyModal(taskId) {
  state.activeVerifyTaskId = taskId;
  const simBtn = document.getElementById('simulateQrScanBtn');
  const pinBtn = document.getElementById('verifyPinBtn');
  if (simBtn) simBtn.dataset.taskid = taskId;
  if (pinBtn) pinBtn.dataset.taskid = taskId;
  const pinInput = document.getElementById('pinVerifyInput');
  if (pinInput) pinInput.value = '';
  const alertEl = document.getElementById('verifySuccessAlert');
  if (alertEl) alertEl.style.display = 'none';
  openModal('providerVerifyModal');
}

/* =====================================================
   AUTH MODAL
===================================================== */
function openAuthModal(role) {
  state.authRole = role || 'provider';
  setAuthRole(state.authRole);
  document.getElementById('authPhoneForm').style.display = 'block';
  document.getElementById('authOtpForm').style.display   = 'none';
  document.getElementById('authKycForm').style.display   = 'none';
  ['authName','authPhone','authPassword','authOtp'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  /* clear KYC previews */
  removeSelfie(); removeId();
  document.getElementById('idType').value = '';
  openModal('authModal');
}

function setAuthRole(role) {
  state.authRole = role;
  document.getElementById('tabRoleProvider')?.classList.toggle('active', role === 'provider');
  document.getElementById('tabRoleWorker')?.classList.toggle('active',   role === 'worker');
  const titleEl = document.getElementById('authModalTitle');
  if (titleEl) titleEl.textContent = role === 'provider' ? 'Join as Job Provider' : 'Join as Freelancer';
}

function switchToLogin() {
  const titleEl = document.getElementById('authModalTitle');
  if (titleEl) titleEl.textContent = 'Log In to Kwickr';
  showToast('Demo: fill in any details and enter any 4-digit OTP.', 'info');
}

function skipKyc() { finishAuth(); }

function initAuthForms() {
  /* ── Step 1: Phone/Name ── */
  document.getElementById('authPhoneForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name  = val('authName');
    const phone = val('authPhone');
    const pass  = val('authPassword');
    if (!name || !phone || !pass)  { showToast('Please fill all fields.', 'error'); return; }
    if (pass.length < 6)           { showToast('Password must be at least 6 characters.', 'error'); return; }
    /* Stash for later */
    document.getElementById('authPhoneForm')._name  = name;
    document.getElementById('authPhoneForm')._phone = phone;
    document.getElementById('authPhoneForm').style.display = 'none';
    document.getElementById('authOtpForm').style.display   = 'block';
    showToast('OTP sent! Enter any 4 digits (demo).', 'info');
  });

  /* ── Step 2: OTP ── */
  document.getElementById('authOtpForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const otp = val('authOtp');
    if (otp.length !== 4 || isNaN(otp)) { showToast('Enter a valid 4-digit OTP.', 'error'); return; }
    document.getElementById('authOtpForm').style.display = 'none';
    document.getElementById('authKycForm').style.display = 'block';
    showToast('Phone verified ✅ Complete your identity verification.', 'success');
  });

  /* ── Step 3: KYC ── */
  document.getElementById('authKycForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const idType   = document.getElementById('idType')?.value;
    const selfieF  = document.getElementById('selfieInput')?.files?.[0];
    const idF      = document.getElementById('idInput')?.files?.[0];
    if (!idType)   { showToast('Please select your ID type.', 'error'); return; }
    if (!selfieF)  { showToast('Please take or upload a selfie.', 'error'); return; }
    if (!idF)      { showToast('Please upload your ID proof.', 'error'); return; }
    showToast('⏳ Uploading verification documents…', 'info');
    setTimeout(() => {
      showToast('✅ Documents submitted! You\'ll be verified within 24 hours.', 'success');
      finishAuth();
    }, 1600);
  });

  /* ── Selfie preview ── */
  document.getElementById('selfieInput')?.addEventListener('change', () => {
    const file = document.getElementById('selfieInput').files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      document.getElementById('selfiePreviewImg').src       = ev.target.result;
      document.getElementById('selfiePreview').style.display = 'flex';
      document.querySelector('#selfieUploadArea .kyc-upload-label').style.display = 'none';
    };
    reader.readAsDataURL(file);
  });

  /* ── ID proof preview ── */
  document.getElementById('idInput')?.addEventListener('change', () => {
    const file = document.getElementById('idInput').files[0];
    if (!file) return;
    const preview    = document.getElementById('idPreview');
    const previewImg = document.getElementById('idPreviewImg');
    const pdfBadge   = document.getElementById('idPreviewPdf');
    const label      = document.querySelector('#idUploadArea .kyc-upload-label');
    if (file.type === 'application/pdf') {
      previewImg.style.display  = 'none';
      pdfBadge.style.display    = 'block';
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        previewImg.src           = ev.target.result;
        previewImg.style.display = 'block';
        pdfBadge.style.display   = 'none';
      };
      reader.readAsDataURL(file);
    }
    preview.style.display = 'flex';
    if (label) label.style.display = 'none';
  });
}

function removeSelfie() {
  const inp   = document.getElementById('selfieInput');
  const prev  = document.getElementById('selfiePreview');
  const label = document.querySelector('#selfieUploadArea .kyc-upload-label');
  if (inp)   inp.value = '';
  if (prev)  prev.style.display  = 'none';
  if (label) label.style.display = 'flex';
}

function removeId() {
  const inp   = document.getElementById('idInput');
  const prev  = document.getElementById('idPreview');
  const label = document.querySelector('#idUploadArea .kyc-upload-label');
  if (inp)   inp.value = '';
  if (prev)  prev.style.display  = 'none';
  if (label) label.style.display = 'flex';
}

function finishAuth() {
  const form  = document.getElementById('authPhoneForm');
  const name  = form?._name  || val('authName')  || 'User';
  const phone = form?._phone || val('authPhone') || '';
  state.currentUser = { name, phone, role: state.authRole, verified: false, joinedAt: Date.now() };
  saveState();
  closeModal('authModal');
  /* Update nav button text */
  const provBtn = document.querySelector('.nav-actions .btn-outline');
  if (provBtn) provBtn.textContent = `👤 ${name}`;
  showToast(`Welcome, ${name}! 🎉 Logged in as ${state.authRole === 'provider' ? 'Job Provider' : 'Freelancer'}.`, 'success');
}

/* =====================================================
   STATS COUNTER
===================================================== */
function initStatsCounter() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el      = entry.target;
      const target  = parseInt(el.dataset.target);
      const decimal = el.dataset.decimal === '1';
      const dur     = 1800, steps = 60;
      let cur = 0;
      const timer = setInterval(() => {
        cur += target / steps;
        if (cur >= target) { cur = target; clearInterval(timer); }
        el.textContent = decimal
          ? (cur / 10).toFixed(1)
          : Math.floor(cur).toLocaleString('en-IN');
      }, dur / steps);
      observer.unobserve(el);
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.stat-num[data-target]').forEach(el => observer.observe(el));
}

/* =====================================================
   TESTIMONIALS SLIDER
===================================================== */
function initTestimonialsSlider() {
  const track  = document.getElementById('sliderTrack');
  const prevBtn = document.getElementById('sliderPrev');
  const nextBtn = document.getElementById('sliderNext');
  const dotsEl  = document.getElementById('sliderDots');
  if (!track) return;

  const cards = track.querySelectorAll('.testimonial-card');
  const total = cards.length;
  let current = 0, autoPlay = null;

  /* Dots */
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('div');
    dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => goTo(i));
    dotsEl?.appendChild(dot);
  }

  function goTo(idx) {
    current = (idx + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    dotsEl?.querySelectorAll('.slider-dot').forEach((d, i) => d.classList.toggle('active', i === current));
  }

  prevBtn?.addEventListener('click', () => { goTo(current - 1); resetAuto(); });
  nextBtn?.addEventListener('click', () => { goTo(current + 1); resetAuto(); });

  function startAuto() { autoPlay = setInterval(() => goTo(current + 1), 4500); }
  function resetAuto()  { clearInterval(autoPlay); startAuto(); }
  startAuto();
}

/* =====================================================
   FAQ
===================================================== */
function initFaqAccordion() {
  document.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-q')?.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}

/* =====================================================
   CONTACT FORM
===================================================== */
function initContactForm() {
  document.getElementById('contactForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name  = val('contactName');
    const email = val('contactEmail');
    const msg   = val('contactMessage');
    if (!name || !email || !msg) { showToast('Please fill all fields.', 'error'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('Please enter a valid email address.', 'error'); return; }
    showToast(`Thanks ${name}! We'll get back to you soon. ✉️`, 'success');
    document.getElementById('contactForm').reset();
  });
}

/* =====================================================
   SCROLL REVEAL
===================================================== */
function initScrollReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (!entry.isIntersecting) return;
      setTimeout(() => entry.target.classList.add('in-view'), i * 75);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

/* =====================================================
   HELPERS
===================================================== */
function findTask(id) { return state.tasks.find(t => t.id === id) || null; }

function statusBadge(status) {
  const map = {
    posted:      '<span class="badge badge-posted">🔵 Posted</span>',
    accepted:    '<span class="badge badge-accepted">✅ Accepted</span>',
    in_progress: '<span class="badge badge-progress">🔄 In Progress</span>',
    completed:   '<span class="badge badge-completed">🎉 Completed</span>',
    paid:        '<span class="badge badge-paid">💳 Paid</span>',
  };
  return map[status] || '';
}

function showToast(message, type = 'default') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity   = '0';
    toast.style.transform = 'translateX(120%)';
    toast.style.transition = 'all .4s ease';
    setTimeout(() => toast.remove(), 400);
  }, 3800);
}

function esc(str) {
  if (typeof str !== 'string') return String(str ?? '');
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

/* ── Expose globals used by inline onclick attributes ── */
window.openAuthModal          = openAuthModal;
window.setAuthRole            = setAuthRole;
window.switchToLogin          = switchToLogin;
window.skipKyc                = skipKyc;
window.removeSelfie           = removeSelfie;
window.removeId               = removeId;
window.openModal              = openModal;
window.closeModal             = closeModal;
window.goToNearbyTasksBoard   = goToNearbyTasksBoard;
window.goToPostTaskBoard      = goToPostTaskBoard;
window.renderNearbyTasks      = renderNearbyTasks;
window.addRandomJob           = addRandomJob;
window.resetDemoJobs          = resetDemoJobs;
window.switchAppTab           = switchAppTab;
window.simulateMapSearch      = simulateMapSearch;
window.confirmMapLocation     = confirmMapLocation;
window.sendChatChip           = sendChatChip;
window.simulateCall           = simulateCall;
window.openWhatsApp           = openWhatsApp;
window.state                  = state;
