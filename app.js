/* app.js */
const state = {
    view: 'day', 
    currentDate: new Date(),
    events: JSON.parse(localStorage.getItem('nexus_events')) || [],
    tasks: JSON.parse(localStorage.getItem('nexus_tasks')) || [],
    categories: {
        Work: '#3b82f6', Health: '#10b981', Spiritual: '#8b5cf6',
        Marriage: '#f43f5e', Business: '#f59e0b', Learning: '#06b6d4'
    }
};

const UI = {
    title: document.getElementById('current-date-title'),
    subtitle: document.getElementById('current-date-subtitle'),
    grid: document.getElementById('calendar-grid'),
    dayHeader: document.getElementById('day-columns-header'),
    monthGrid: document.getElementById('month-grid-body'),
    taskList: document.getElementById('task-list'),
    modal: document.getElementById('event-modal'),
    eventForm: document.getElementById('event-form')
};

// Initialization
function init() {
    setupEventListeners();
    render();
    startTimeLine();
    updateStats();
}

function save() {
    localStorage.setItem('nexus_events', JSON.stringify(state.events));
    localStorage.setItem('nexus_tasks', JSON.stringify(state.tasks));
    updateStats();
}

// Rendering Logic
function render() {
    const d = state.currentDate;
    
    // Header logic
    if(state.view === 'month') {
        UI.title.innerText = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        UI.subtitle.innerText = d.getFullYear();
    } else {
        UI.title.innerText = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        UI.subtitle.innerText = d.toLocaleDateString('en-US', { weekday: 'long' });
    }

    if (state.view === 'month') {
        document.getElementById('timeline-view').classList.add('hidden');
        document.getElementById('month-view').classList.remove('hidden');
        renderMonth();
    } else {
        document.getElementById('timeline-view').classList.remove('hidden');
        document.getElementById('month-view').classList.add('hidden');
        renderTimeline();
    }
    renderTasks();
}

function renderTimeline() {
    UI.dayHeader.innerHTML = '';
    UI.grid.innerHTML = '<div id="current-time-line" class="time-now-line"></div>';
    
    // Labels
    const labels = document.getElementById('time-labels');
    labels.innerHTML = '';
    for(let i=0; i<24; i++) {
        const div = document.createElement('div');
        div.className = 'hour-marker';
        div.innerText = `${String(i).padStart(2, '0')}:00`;
        labels.appendChild(div);
    }

    const daysCount = state.view === 'day' ? 1 : 7;
    const start = new Date(state.currentDate);
    if (state.view === 'week') {
        // Monday Start
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
    }

    for (let i = 0; i < daysCount; i++) {
        const curr = new Date(start);
        curr.setDate(start.getDate() + i);
        
        const col = document.createElement('div');
        col.className = 'day-column';
        const dateKey = curr.toISOString().split('T')[0];
        
        // Header Label
        const hLabel = document.createElement('div');
        hLabel.className = 'day-label';
        if (curr.toDateString() === new Date().toDateString()) hLabel.classList.add('neon-blue');
        hLabel.innerText = curr.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
        UI.dayHeader.appendChild(hLabel);

        // Events positioning
        state.events.filter(e => e.date === dateKey).forEach(ev => {
            col.appendChild(createEventElement(ev));
        });

        UI.grid.appendChild(col);
    }
    updateTimeLine();
}

function createEventElement(ev) {
    const [h1, m1] = ev.start.split(':').map(Number);
    const [h2, m2] = ev.end.split(':').map(Number);
    const startMins = h1 * 60 + m1;
    const duration = (h2 * 60 + m2) - startMins;
    
    // Hour height is 80px
    const top = (startMins / 60) * 80;
    const height = (duration / 60) * 80;

    const el = document.createElement('div');
    el.className = 'event-block';
    el.style.top = `${top}px`;
    el.style.height = `${Math.max(height, 25)}px`;
    el.style.borderLeftColor = state.categories[ev.category];
    el.innerHTML = `
        <div class="event-title">${ev.title}</div>
        <div class="event-time">${ev.start} - ${ev.end}</div>
    `;
    el.onclick = (e) => { e.stopPropagation(); openModal(ev); };
    return el;
}

function renderMonth() {
    UI.monthGrid.innerHTML = '';
    const d = state.currentDate;
    const firstDayOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    const lastDayOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    
    // Monday adjustment
    let startDay = firstDayOfMonth.getDay(); 
    if (startDay === 0) startDay = 7; 
    
    // Previous Month padding
    const prevLast = new Date(d.getFullYear(), d.getMonth(), 0).getDate();
    for (let i = startDay - 1; i > 0; i--) {
        const cell = document.createElement('div');
        cell.className = 'month-day other-month';
        cell.innerHTML = `<span class="day-num">${prevLast - i + 1}</span>`;
        UI.monthGrid.appendChild(cell);
    }

    // Days
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
        const cell = document.createElement('div');
        cell.className = 'month-day';
        const curr = new Date(d.getFullYear(), d.getMonth(), i);
        const dateKey = curr.toISOString().split('T')[0];
        
        if (curr.toDateString() === new Date().toDateString()) cell.style.borderColor = 'var(--accent-blue)';
        cell.innerHTML = `<span class="day-num">${i}</span>`;
        
        state.events.filter(e => e.date === dateKey).forEach(ev => {
            const pill = document.createElement('div');
            pill.className = 'month-event-pill';
            pill.style.borderLeftColor = state.categories[ev.category];
            pill.innerText = ev.title;
            pill.onclick = (e) => { e.stopPropagation(); openModal(ev); };
            cell.appendChild(pill);
        });

        UI.monthGrid.appendChild(cell);
    }
}

// Navigation
function navigate(direction) {
    if (state.view === 'day') state.currentDate.setDate(state.currentDate.getDate() + direction);
    else if (state.view === 'week') state.currentDate.setDate(state.currentDate.getDate() + (direction * 7));
    else if (state.view === 'month') state.currentDate.setMonth(state.currentDate.getMonth() + direction);
    render();
}

// Modal & Forms
function openModal(ev = null) {
    UI.modal.classList.remove('hidden');
    const delBtn = document.getElementById('delete-event');
    
    if (ev) {
        document.getElementById('modal-title').innerText = "Edit Event";
        document.getElementById('event-id').value = ev.id;
        document.getElementById('event-name').value = ev.title;
        document.getElementById('event-date').value = ev.date;
        document.getElementById('event-start').value = ev.start;
        document.getElementById('event-end').value = ev.end;
        document.getElementById('event-category').value = ev.category;
        document.getElementById('event-notes').value = ev.notes || '';
        delBtn.classList.remove('hidden');
    } else {
        document.getElementById('modal-title').innerText = "New Event";
        UI.eventForm.reset();
        document.getElementById('event-id').value = '';
        document.getElementById('event-date').value = state.currentDate.toISOString().split('T')[0];
        delBtn.classList.add('hidden');
    }
}

function setupEventListeners() {
    // View Switching
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.view = btn.dataset.view;
            render();
        };
    });

    document.getElementById('prev-date').onclick = () => navigate(-1);
    document.getElementById('next-date').onclick = () => navigate(1);
    document.getElementById('main-fab').onclick = () => openModal();
    document.getElementById('cancel-event').onclick = () => UI.modal.classList.add('hidden');

    UI.eventForm.onsubmit = (e) => {
        e.preventDefault();
        const id = document.getElementById('event-id').value;
        const newEv = {
            id: id || Date.now().toString(),
            title: document.getElementById('event-name').value,
            date: document.getElementById('event-date').value,
            start: document.getElementById('event-start').value,
            end: document.getElementById('event-end').value,
            category: document.getElementById('event-category').value,
            notes: document.getElementById('event-notes').value
        };

        if (id) {
            const idx = state.events.findIndex(x => x.id === id);
            state.events[idx] = newEv;
        } else {
            state.events.push(newEv);
        }
        
        save();
        UI.modal.classList.add('hidden');
        render();
    };

    document.getElementById('delete-event').onclick = () => {
        const id = document.getElementById('event-id').value;
        state.events = state.events.filter(x => x.id !== id);
        save();
        UI.modal.classList.add('hidden');
        render();
    };

    // Task Functionality
    document.getElementById('add-task-btn').onclick = () => {
        document.getElementById('task-input-container').classList.toggle('hidden');
        document.getElementById('new-task-input').focus();
    };

    document.getElementById('new-task-input').onkeydown = (e) => {
        if(e.key === 'Enter' && e.target.value) {
            state.tasks.push({ id: Date.now(), text: e.target.value, done: false });
            e.target.value = '';
            save();
            renderTasks();
        }
    };
}

function renderTasks() {
    UI.taskList.innerHTML = '';
    state.tasks.forEach(t => {
        const li = document.createElement('li');
        li.className = `task-item ${t.done ? 'done' : ''}`;
        li.innerHTML = `<div class="check-circle"></div> <span>${t.text}</span>`;
        li.onclick = () => { t.done = !t.done; save(); renderTasks(); };
        UI.taskList.appendChild(li);
    });
}

function updateStats() {
    const total = state.tasks.length;
    const done = state.tasks.filter(x => x.done).length;
    document.getElementById('tasks-stat').innerText = `${done}/${total}`;
    document.getElementById('focus-score').innerText = total ? `${Math.round((done/total)*100)}%` : '0%';
}

function updateTimeLine() {
    const line = document.getElementById('current-time-line');
    if (!line) return;
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    line.style.top = `${(mins / 60) * 80}px`;
}

function startTimeLine() {
    updateTimeLine();
    setInterval(updateTimeLine, 60000);
}

// Pomodoro Timer Logic
let pomoTime = 1500;
let pomoInterval = null;
const pomoDisplay = document.getElementById('pomo-timer');

document.getElementById('pomo-start').onclick = () => {
    if (pomoInterval) {
        clearInterval(pomoInterval);
        pomoInterval = null;
        document.getElementById('pomo-start').innerHTML = '<i class="fas fa-play"></i>';
    } else {
        pomoInterval = setInterval(() => {
            pomoTime--;
            const m = Math.floor(pomoTime / 60);
            const s = pomoTime % 60;
            pomoDisplay.innerText = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            if (pomoTime <= 0) {
                clearInterval(pomoInterval);
                alert("Focus Session Complete!");
            }
        }, 1000);
        document.getElementById('pomo-start').innerHTML = '<i class="fas fa-pause"></i>';
    }
};

document.getElementById('pomo-reset').onclick = () => {
    clearInterval(pomoInterval);
    pomoInterval = null;
    pomoTime = 1500;
    pomoDisplay.innerText = "25:00";
    document.getElementById('pomo-start').innerHTML = '<i class="fas fa-play"></i>';
};

init();
