const state = {
    view: 'day',
    currentDate: new Date(),
    events: JSON.parse(localStorage.getItem('nexus_events')) || [],
    tasks: JSON.parse(localStorage.getItem('nexus_tasks')) || [],
    categories: { Work: '#3b82f6', Health: '#10b981', Spiritual: '#8b5cf6', Marriage: '#f43f5e' }
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

function init() {
    setupEventListeners();
    render();
}

function save() {
    localStorage.setItem('nexus_events', JSON.stringify(state.events));
    localStorage.setItem('nexus_tasks', JSON.stringify(state.tasks));
}

function render() {
    const d = state.currentDate;
    UI.title.innerText = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    UI.subtitle.innerText = d.toLocaleDateString('en-US', { weekday: 'long' });

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
    UI.grid.innerHTML = '';
    document.getElementById('time-labels').innerHTML = '';

    for(let i=0; i<24; i++) {
        const div = document.createElement('div');
        div.className = 'hour-marker';
        div.innerText = `${String(i).padStart(2, '0')}:00`;
        document.getElementById('time-labels').appendChild(div);
    }

    const daysCount = state.view === 'day' ? 1 : 7;
    const start = new Date(state.currentDate);
    if (state.view === 'week') start.setDate(start.getDate() - start.getDay() + 1);

    for (let i = 0; i < daysCount; i++) {
        const curr = new Date(start);
        curr.setDate(start.getDate() + i);
        const col = document.createElement('div');
        col.className = 'day-column';
        const dateKey = curr.toISOString().split('T')[0];

        const hLabel = document.createElement('div');
        hLabel.className = 'day-label';
        hLabel.innerText = curr.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
        UI.dayHeader.appendChild(hLabel);

        state.events.filter(e => e.date === dateKey).forEach(ev => {
            const [h1, m1] = ev.start.split(':').map(Number);
            const [h2, m2] = ev.end.split(':').map(Number);
            const top = (h1 * 60 + m1) / 60 * 80;
            const height = ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60 * 80;
            const el = document.createElement('div');
            el.className = 'event-block';
            el.style.top = `${top}px`;
            el.style.height = `${Math.max(height, 25)}px`;
            el.style.borderLeftColor = state.categories[ev.category];
            el.innerHTML = `<b>${ev.title}</b><br>${ev.start}`;
            el.onclick = () => openModal(ev);
            col.appendChild(el);
        });
        UI.grid.appendChild(col);
    }
}

function renderMonth() {
    UI.monthGrid.innerHTML = '';
    const d = state.currentDate;
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= last; i++) {
        const cell = document.createElement('div');
        cell.className = 'month-day';
        const curr = new Date(d.getFullYear(), d.getMonth(), i);
        const key = curr.toISOString().split('T')[0];
        cell.innerHTML = `<span class="day-num">${i}</span>`;
        state.events.filter(e => e.date === key).forEach(ev => {
            const pill = document.createElement('div');
            pill.className = 'month-event-pill';
            pill.style.borderLeftColor = state.categories[ev.category];
            pill.innerText = ev.title;
            cell.appendChild(pill);
        });
        UI.monthGrid.appendChild(cell);
    }
}

function openModal(ev = null) {
    UI.modal.classList.remove('hidden');
    const delBtn = document.getElementById('delete-event');
    if (ev) {
        document.getElementById('event-id').value = ev.id;
        document.getElementById('event-name').value = ev.title;
        document.getElementById('event-date').value = ev.date;
        document.getElementById('event-start').value = ev.start;
        document.getElementById('event-end').value = ev.end;
        document.getElementById('event-category').value = ev.category;
        delBtn.classList.remove('hidden');
    } else {
        UI.eventForm.reset();
        document.getElementById('event-id').value = '';
        document.getElementById('event-date').value = state.currentDate.toISOString().split('T')[0];
        delBtn.classList.add('hidden');
    }
}

function setupEventListeners() {
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.view = btn.dataset.view;
            render();
        };
    });

    document.getElementById('prev-date').onclick = () => {
        state.currentDate.setDate(state.currentDate.getDate() - (state.view === 'week' ? 7 : 1));
        render();
    };

    document.getElementById('next-date').onclick = () => {
        state.currentDate.setDate(state.currentDate.getDate() + (state.view === 'week' ? 7 : 1));
        render();
    };

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
            category: document.getElementById('event-category').value
        };
        if (id) {
            const idx = state.events.findIndex(x => x.id === id);
            state.events[idx] = newEv;
        } else state.events.push(newEv);
        save(); UI.modal.classList.add('hidden'); render();
    };

    document.getElementById('delete-event').onclick = () => {
        const id = document.getElementById('event-id').value;
        state.events = state.events.filter(x => x.id !== id);
        save(); UI.modal.classList.add('hidden'); render();
    };

    document.getElementById('add-task-btn').onclick = () => {
        document.getElementById('task-input-container').classList.toggle('hidden');
        document.getElementById('new-task-input').focus();
    };

    document.getElementById('new-task-input').onkeydown = (e) => {
        if(e.key === 'Enter' && e.target.value) {
            state.tasks.push({ id: Date.now(), text: e.target.value, done: false });
            e.target.value = ''; save(); renderTasks();
        }
    };
}

function renderTasks() {
    UI.taskList.innerHTML = '';
    state.tasks.forEach(t => {
        const li = document.createElement('li');
        li.className = `task-item ${t.done ? 'done' : ''}`;
        li.innerHTML = `<div class="check-circle"></div><span>${t.text}</span>`;
        li.onclick = () => { t.done = !t.done; save(); renderTasks(); };
        UI.taskList.appendChild(li);
    });
}

init();
