/* app.js */
const STORAGE_KEY = 'nexusOS_data';

// Utilities
function formatDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const today = new Date();
let currentDate = new Date();
let currentView = 'day'; // 'day', 'week', 'month'

// Generate Dynamic Default Data so events show up today
const defaultData = {
    events: [
        { id: '1', title: 'Deep Work', date: formatDate(today), start: '09:00', end: '11:30', category: 'Work', color: 'var(--cat-work)' },
        { id: '2', title: 'Calisthenics', date: formatDate(today), start: '12:00', end: '13:00', category: 'Health', color: 'var(--cat-health)' },
        { id: '3', title: 'Digital Privacy Project', date: formatDate(today), start: '14:00', end: '16:00', category: 'Learning', color: 'var(--cat-learning)' },
        { id: '4', title: 'Time with Wife', date: formatDate(today), start: '18:00', end: '20:00', category: 'Marriage', color: 'var(--cat-marriage)' }
    ],
    tasks: [
        { id: 't1', text: 'Review PRs', completed: false },
        { id: 't2', text: 'Workout', completed: true },
        { id: 't3', text: 'Read 10 pages', completed: false }
    ],
    categories: [
        { name: 'Health', color: 'var(--cat-health)' },
        { name: 'Marriage', color: 'var(--cat-marriage)' },
        { name: 'Spiritual', color: 'var(--cat-spiritual)' },
        { name: 'Work', color: 'var(--cat-work)' },
        { name: 'Business', color: 'var(--cat-business)' },
        { name: 'Learning', color: 'var(--cat-learning)' },
        { name: 'Family', color: 'var(--cat-family)' }
    ],
    habits: [
        { name: 'Meditation', streak: 12 },
        { name: 'Cold Shower', streak: 5 },
        { name: 'Journaling', streak: 21 }
    ]
};

let appData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultData;
let clockInterval;

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    updateDashboardStats();
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initTimelineLabels();
    renderCategories();
    renderTasks();
    renderHabits();
    updateDashboardStats();
    setupEventListeners();
    renderCalendar();
    
    // Initial scroll to current time in timeline
    setTimeout(() => {
        const scrollPos = (today.getHours() * 60) - 100;
        document.getElementById('timeline-body').scrollTop = scrollPos > 0 ? scrollPos : 0;
    }, 100);
});

function initTimelineLabels() {
    const labelsContainer = document.getElementById('time-labels');
    labelsContainer.innerHTML = '';
    for (let i = 0; i < 24; i++) {
        const div = document.createElement('div');
        div.className = 'time-label';
        div.textContent = `${i.toString().padStart(2, '0')}:00`;
        labelsContainer.appendChild(div);
    }
}

// Calendar Rendering Logic
function renderCalendar() {
    updateHeaderDate();
    if (currentView === 'day') renderDayView();
    else if (currentView === 'week') renderWeekView();
    else if (currentView === 'month') renderMonthView();
    
    startClock();
}

function updateHeaderDate() {
    const title = document.getElementById('current-date-title');
    const subtitle = document.getElementById('current-date-subtitle');
    
    if (currentView === 'day') {
        const isToday = formatDate(currentDate) === formatDate(new Date());
        title.textContent = isToday ? "Today" : currentDate.toLocaleDateString('en-US', {weekday: 'long'});
        subtitle.textContent = currentDate.toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'});
    } else if (currentView === 'week') {
        title.textContent = "This Week";
        const start = new Date(currentDate);
        const day = start.getDay() || 7;
        start.setDate(start.getDate() - day + 1);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        subtitle.textContent = `${start.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} - ${end.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}`;
    } else if (currentView === 'month') {
        title.textContent = currentDate.toLocaleDateString('en-US', {month: 'long'});
        subtitle.textContent = currentDate.getFullYear();
    }
}

function renderDayView() {
    document.getElementById('month-view-container').classList.add('hidden');
    document.getElementById('timeline-body').classList.remove('hidden');
    document.getElementById('timeline-header').classList.remove('hidden');
    
    // Headers
    const headers = document.getElementById('day-headers');
    const isToday = formatDate(currentDate) === formatDate(new Date());
    headers.innerHTML = `<div class="day-header ${isToday ? 'active' : ''}">${currentDate.toLocaleDateString('en-US', {weekday: 'long', month: 'short', day: 'numeric'})}</div>`;
    
    // Grid
    const grid = document.getElementById('time-grid');
    grid.className = 'time-grid';
    grid.innerHTML = isToday ? '<div class="current-time-indicator" id="time-indicator"></div>' : '';
    
    const dayEvents = appData.events.filter(e => e.date === formatDate(currentDate));
    renderEventsToContainer(dayEvents, grid);
}

function renderWeekView() {
    document.getElementById('month-view-container').classList.add('hidden');
    document.getElementById('timeline-body').classList.remove('hidden');
    document.getElementById('timeline-header').classList.remove('hidden');
    
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay() || 7; 
    startOfWeek.setDate(startOfWeek.getDate() - day + 1); // Monday start
    
    const headers = document.getElementById('day-headers');
    headers.innerHTML = '';
    const grid = document.getElementById('time-grid');
    grid.className = 'time-grid week-grid';
    grid.innerHTML = ''; // Clear indicator from root
    
    for(let i=0; i<7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + i);
        const dateStr = formatDate(d);
        const isToday = dateStr === formatDate(new Date());
        
        headers.innerHTML += `<div class="day-header ${isToday ? 'active' : ''}">${d.toLocaleDateString('en-US', {weekday: 'short', day: 'numeric'})}</div>`;
        
        const col = document.createElement('div');
        col.className = 'day-column';
        if (isToday) {
            col.innerHTML = '<div class="current-time-indicator" id="time-indicator"></div>';
        }
        
        const dayEvents = appData.events.filter(e => e.date === dateStr);
        renderEventsToContainer(dayEvents, col);
        grid.appendChild(col);
    }
}

function renderMonthView() {
    document.getElementById('timeline-body').classList.add('hidden');
    document.getElementById('timeline-header').classList.add('hidden');
    const container = document.getElementById('month-view-container');
    container.classList.remove('hidden');
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay() || 7; // Mon=1, Sun=7
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let html = '<div class="month-view"><div class="month-header">';
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach(d => html += `<div>${d}</div>`);
    html += '</div><div class="month-grid">';
    
    // Padding
    for(let i=1; i<firstDay; i++) {
        html += `<div class="month-day empty"></div>`;
    }
    
    // Days
    for(let i=1; i<=daysInMonth; i++) {
        const d = new Date(year, month, i);
        const dateStr = formatDate(d);
        const isToday = dateStr === formatDate(new Date());
        const dayEvents = appData.events.filter(e => e.date === dateStr);
        
        let eventsHtml = dayEvents.map(e => `
            <div class="month-event" style="background-color: ${e.color.replace('var(', '').replace(')', '')}; border-left: 3px solid ${e.color.includes('var') ? `var(--cat-${e.category.toLowerCase()})` : e.color}" data-id="${e.id}">
                ${e.start} ${e.title}
            </div>
        `).join('');
        
        html += `<div class="month-day ${isToday ? 'today' : ''}"><div class="month-day-number">${i}</div>${eventsHtml}</div>`;
    }
    html += '</div></div>';
    container.innerHTML = html;

    // Attach delete handlers for month events
    container.querySelectorAll('.month-event').forEach(el => {
        el.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            if(confirm('Delete this event?')) {
                const id = el.getAttribute('data-id');
                appData.events = appData.events.filter(ev => ev.id !== id);
                saveData();
                renderCalendar();
            }
        });
    });
}

function renderEventsToContainer(events, container) {
    events.forEach(ev => {
        const [startH, startM] = ev.start.split(':').map(Number);
        const [endH, endM] = ev.end.split(':').map(Number);
        
        const top = (startH * 60) + startM;
        const duration = ((endH * 60) + endM) - top;
        
        const block = document.createElement('div');
        block.className = 'event-block glass-panel';
        block.style.top = `${top}px`;
        block.style.height = `${duration}px`;
        block.style.background = `linear-gradient(135deg, rgba(20,20,20,0.8), rgba(20,20,20,0.9))`;
        block.style.borderLeftColor = ev.color.includes('var') ? `var(--cat-${ev.category.toLowerCase()})` : ev.color;
        
        block.innerHTML = `
            <div class="event-time">${ev.start} - ${ev.end}</div>
            <div class="event-title">${ev.title}</div>
        `;
        
        block.addEventListener('dblclick', () => {
            if(confirm('Delete this time block?')) {
                appData.events = appData.events.filter(e => e.id !== ev.id);
                saveData();
                renderCalendar();
            }
        });
        
        container.appendChild(block);
    });
}

function startClock() {
    if(clockInterval) clearInterval(clockInterval);
    
    function update() {
        const indicator = document.getElementById('time-indicator');
        if (indicator) {
            const now = new Date();
            const mins = (now.getHours() * 60) + now.getMinutes();
            indicator.style.top = `${mins}px`;
        }
    }
    
    update();
    clockInterval = setInterval(update, 60000);
}

function renderCategories() {
    const list = document.getElementById('category-list');
    list.innerHTML = '';
    appData.categories.forEach(cat => {
        const li = document.createElement('li');
        li.className = 'category-item';
        li.innerHTML = `<div class="cat-dot" style="background: ${cat.color}"></div> <span>${cat.name}</span>`;
        list.appendChild(li);
    });
}

function renderTasks() {
    const list = document.getElementById('task-list');
    list.innerHTML = '';
    appData.tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <div class="task-checkbox">${task.completed ? '<i class="fas fa-check" style="color:white; font-size:10px;"></i>' : ''}</div>
            <span class="task-text">${task.text}</span>
        `;
        li.querySelector('.task-checkbox').addEventListener('click', () => {
            task.completed = !task.completed;
            saveData();
            renderTasks();
        });
        list.appendChild(li);
    });
}

function renderHabits() {
    const list = document.getElementById('habit-list');
    list.innerHTML = '';
    appData.habits.forEach(habit => {
        const li = document.createElement('li');
        li.className = 'habit-item';
        li.innerHTML = `
            <span>${habit.name}</span>
            <span class="habit-streak"><i class="fas fa-fire"></i> ${habit.streak}</span>
        `;
        list.appendChild(li);
    });
}

function updateDashboardStats() {
    const total = appData.tasks.length;
    const completed = appData.tasks.filter(t => t.completed).length;
    document.getElementById('tasks-stat').textContent = `${completed}/${total}`;
    
    const focusScore = total === 0 ? 100 : Math.round((completed / total) * 100);
    document.getElementById('focus-score').textContent = `${focusScore}%`;
}

function setupEventListeners() {
    // View Navigation
    const views = ['day', 'week', 'month'];
    views.forEach(v => {
        document.getElementById(`btn-view-${v}`).addEventListener('click', (e) => {
            views.forEach(view => document.getElementById(`btn-view-${view}`).classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentView = v;
            renderCalendar();
        });
    });

    // Date Navigation
    document.getElementById('prev-date').addEventListener('click', () => {
        if (currentView === 'day') currentDate.setDate(currentDate.getDate() - 1);
        else if (currentView === 'week') currentDate.setDate(currentDate.getDate() - 7);
        else if (currentView === 'month') currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById('next-date').addEventListener('click', () => {
        if (currentView === 'day') currentDate.setDate(currentDate.getDate() + 1);
        else if (currentView === 'week') currentDate.setDate(currentDate.getDate() + 7);
        else if (currentView === 'month') currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // Modal
    const modal = document.getElementById('event-modal');
    const fab = document.getElementById('main-fab');
    const cancelBtn = document.getElementById('cancel-event');
    const form = document.getElementById('event-form');
    const dateInput = document.getElementById('event-date');

    fab.addEventListener('click', () => {
        dateInput.value = formatDate(currentDate);
        modal.classList.remove('hidden');
    });
    
    cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('event-title').value;
        const date = document.getElementById('event-date').value;
        const start = document.getElementById('event-start').value;
        const end = document.getElementById('event-end').value;
        const category = document.getElementById('event-category').value;
        
        const catObj = appData.categories.find(c => c.name === category);
        const color = catObj ? catObj.color : '#fff';

        appData.events.push({
            id: Date.now().toString(),
            title, date, start, end, category, color
        });
        
        saveData();
        renderCalendar();
        modal.classList.add('hidden');
        form.reset();
    });

    // Tasks Quick Add
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskInputContainer = document.getElementById('task-input-container');
    const taskInput = document.getElementById('new-task-input');

    addTaskBtn.addEventListener('click', () => {
        taskInputContainer.classList.toggle('hidden');
        if(!taskInputContainer.classList.contains('hidden')) taskInput.focus();
    });

    taskInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter' && taskInput.value.trim() !== '') {
            appData.tasks.push({
                id: 't' + Date.now(),
                text: taskInput.value.trim(),
                completed: false
            });
            saveData();
            renderTasks();
            taskInput.value = '';
            taskInputContainer.classList.add('hidden');
        }
    });

    // Pomodoro
    let pomoInterval;
    let pomoTime = 25 * 60;
    let isPomoRunning = false;
    const pomoDisplay = document.getElementById('pomo-timer');
    const pomoStartBtn = document.getElementById('pomo-start');
    const pomoResetBtn = document.getElementById('pomo-reset');

    function updatePomoDisplay() {
        const m = Math.floor(pomoTime / 60).toString().padStart(2, '0');
        const s = (pomoTime % 60).toString().padStart(2, '0');
        pomoDisplay.textContent = `${m}:${s}`;
    }

    pomoStartBtn.addEventListener('click', () => {
        if(isPomoRunning) {
            clearInterval(pomoInterval);
            pomoStartBtn.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            pomoInterval = setInterval(() => {
                if(pomoTime > 0) {
                    pomoTime--;
                    updatePomoDisplay();
                } else {
                    clearInterval(pomoInterval);
                    alert("Focus session complete!");
                    pomoTime = 25 * 60;
                    updatePomoDisplay();
                    pomoStartBtn.innerHTML = '<i class="fas fa-play"></i>';
                    isPomoRunning = false;
                }
            }, 1000);
            pomoStartBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
        isPomoRunning = !isPomoRunning;
    });

    pomoResetBtn.addEventListener('click', () => {
        clearInterval(pomoInterval);
        isPomoRunning = false;
        pomoTime = 25 * 60;
        updatePomoDisplay();
        pomoStartBtn.innerHTML = '<i class="fas fa-play"></i>';
    });
}
