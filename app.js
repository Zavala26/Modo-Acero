const events = JSON.parse(localStorage.getItem('events')) || [];
const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
const quotes = [
    "The only way to do great work is to love what you do. - Steve Jobs",
    "Success is not how high you have climbed, but how you make a positive difference to the world. - Roy T. Bennett",
    "Don't watch the clock; do what it does. Keep going. - Sam Levenson"
];

document.addEventListener('DOMContentLoaded', () => {
    renderCalendar();
    renderTasks();
    renderQuotes();
    document.getElementById('add-event-btn').addEventListener('click', openEventModal);
    document.getElementById('add-task-btn').addEventListener('click', addTask);
    document.getElementById('save-event-btn').addEventListener('click', saveEvent);
    document.querySelector('.close').addEventListener('click', closeEventModal);
});

function renderCalendar() {
    const calendarBody = document.getElementById('calendar-body');
    calendarBody.innerHTML = '';
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    
    for (let i = 1; i <= 31; i++) {
        const date = new Date(year, month, i);
        if (date.getMonth() !== month) continue;
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day');
        dayDiv.innerHTML = `<div>${i}</div>`;
        events.forEach(event => {
            const eventDate = new Date(event.start);
            if (eventDate.getDate() === i) {
                const eventDiv = document.createElement('div');
                eventDiv.classList.add('event');
                eventDiv.style.backgroundColor = event.color;
                eventDiv.innerHTML = `${event.title}<br>${event.start} - \${event.end}`;
                dayDiv.appendChild(eventDiv);
            }
        });
        calendarBody.appendChild(dayDiv);
    }
}

function openEventModal() {
    document.getElementById('event-modal').style.display = 'block';
}

function closeEventModal() {
    document.getElementById('event-modal').style.display = 'none';
}

function saveEvent() {
    const title = document.getElementById('event-title').value;
    const start = document.getElementById('event-start').value;
    const end = document.getElementById('event-end').value;
    const color = document.getElementById('event-color').value;
    const notes = document.getElementById('event-notes').value;
    
    events.push({ title, start, end, color, notes });
    localStorage.setItem('events', JSON.stringify(events));
    closeEventModal();
    renderCalendar();
}

function renderTasks() {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';
    tasks.forEach((task, index) => {
        const taskItem = document.createElement('li');
        taskItem.classList.add('task');
        taskItem.innerHTML = `
            <input type="checkbox" \${task.completed ? 'checked' : ''} onchange="toggleTask(${index})">
            <span>${task.title}</span>
            <button onclick="deleteTask(${index})">Delete</button>
        `;
        taskList.appendChild(taskItem);
    });
}

function addTask() {
    const taskTitle = document.getElementById('task-title').value;
    tasks.push({ title: taskTitle, completed: false });
    localStorage.setItem('tasks', JSON.stringify(tasks));
    document.getElementById('task-title').value = '';
    renderTasks();
}

function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderTasks();
}

function deleteTask(index) {
    tasks.splice(index, 1);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderTasks();
}

function renderQuotes() {
    const quotesPanel = document.getElementById('quotes-panel');
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    quotesPanel.innerHTML = randomQuote;
}
