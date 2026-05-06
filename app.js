/* app.js */
const STORAGE_KEY = 'nexusOS_data';

const defaultData = {
    events: [
        { id: '1', title: 'Deep Work', start: '09:00', end: '11:30', category: 'Work', color: 'var(--cat-work)' },
        { id: '2', title: 'Calisthenics', start: '12:00', end: '13:00', category: 'Health', color: 'var(--cat-health)' },
        { id: '3', title: 'Digital Privacy Project', start: '14:00', end: '16:00', category: 'Learning', color: 'var(--cat-learning)' },
        { id: '4', title: 'Time with Wife', start: '18:00', end: '20:00', category: 'Marriage', color: 'var(--cat-marriage)' }
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

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    updateDashboardStats();
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initTimeline();
    renderCategories();
    renderEvents();
    renderTasks();
    renderHabits();
    updateDashboardStats();
    startClock();
    setupEventListeners();
});

function initHeader() {
    const now = new Date();
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    document.getElementById('current-date-title').textContent = "Today";
    document.getElementById('current-date-subtitle').textContent = now.toLocaleDateString('en-US', options);
}

function initTimeline() {
    const labelsContainer = document.getElementById('time-labels');
    for (let i = 0; i < 24; i++) {
        const div = document.createElement('div');
        div.className = 'time-label';
        div.textContent = `${i.toString().padStart(2, '0')}:00`;
        labelsContainer.appendChild(div);
    }
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

function renderEvents() {
    const grid = document.getElementById('time-grid');
    // Remove old events
    document.querySelectorAll('.event-block').forEach(el => el.remove());

    appData.events.forEach(ev => {
        const [startH, startM] = ev.start.split(':').map(Number);
        const [endH, endM] = ev.end.split(':').map(Number);
        
        const top = (startH * 60) + startM;
        const duration = ((endH * 60) + endM) - top;
        
        const block = document.createElement('div');
        block.className = 'event-block glass-panel';
        block.style.top = `${top}px`;
        block.style.height = `${duration}px`;
        block.style.backgroundColor = ev.color.replace('var(', '').replace(')', ''); // Fallback
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
                renderEvents();
            }
        });
        
        grid.appendChild(block);
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

function startClock() {
    const indicator = document.getElementById('time-indicator');
    const body = document.getElementById('timeline-body');
    
    function update() {
        const now = new Date();
        const mins = (now.getHours() * 60) + now.getMinutes();
        indicator.style.top = `${mins}px`;
    }
    
    update();
    setInterval(update, 60000);
    
    // Scroll to current time initially
    setTimeout(() => {
        const now = new Date();
        const scrollPos = (now.getHours() * 60) - 100;
        body.scrollTop = scrollPos > 0 ? scrollPos : 0;
    }, 100);
}

// Event Listeners
function setupEventListeners() {
    // Modal
    const modal = document.getElementById('event-modal');
    const fab = document.getElementById('main-fab');
    const cancelBtn = document.getElementById('cancel-event');
    const form = document.getElementById('event-form');

    fab.addEventListener('click', () => modal.classList.remove('hidden'));
    cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('event-title').value;
        const start = document.getElementById('event-start').value;
        const end = document.getElementById('event-end').value;
        const category = document.getElementById('event-category').value;
        
        const catObj = appData.categories.find(c => c.name === category);
        const color = catObj ? catObj.color : '#fff';

        appData.events.push({
            id: Date.now().toString(),
            title, start, end, category, color
        });
        
        saveData();
        renderEvents();
        modal.classList.add('hidden');
        form.reset();
    });

    // Tasks
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
