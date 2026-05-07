const calendar = document.getElementById('calendar');
    eventElement.innerHTML = `
      <strong>${event.title}</strong>
      <span>${event.start} - ${event.end}</span>
    `;

    container.appendChild(eventElement);
  });
}

function renderCurrentTime(container, date) {
  const now = new Date();

  if (
    now.getDate() !== date.getDate() ||
    now.getMonth() !== date.getMonth() ||
    now.getFullYear() !== date.getFullYear()
  ) {
    return;
  }

  const minutes = now.getHours() * 60 + now.getMinutes();

  const line = document.createElement('div');
  line.className = 'current-time-line';
  line.style.top = `${minutes}px`;

  container.appendChild(line);
}

function renderDayView() {
  calendar.innerHTML = '';

  currentViewTitle.textContent = currentDate.toDateString();

  const wrapper = document.createElement('div');
  wrapper.className = 'day-view';

  const timeColumn = document.createElement('div');
  timeColumn.className = 'time-column';
  timeColumn.innerHTML = generateHours();

  const dayColumn = document.createElement('div');
  dayColumn.className = 'day-column';

  dayColumn.innerHTML = `
    <div class="day-header">${currentDate.toDateString()}</div>
    <div class="day-grid">
      ${createHourLines()}
    </div>
  `;

  const grid = dayColumn.querySelector('.day-grid');

  renderEvents(currentDate, grid);
  renderCurrentTime(grid, currentDate);

  wrapper.appendChild(timeColumn);
  wrapper.appendChild(dayColumn);

  calendar.appendChild(wrapper);
}

function renderWeekView() {
  calendar.innerHTML = '';

  const start = getStartOfWeek(currentDate);
  const wrapper = document.createElement('div');
  wrapper.className = 'week-view';

  currentViewTitle.textContent = `Week of ${start.toDateString()}`;

  const timeColumn = document.createElement('div');
  timeColumn.className = 'time-column';
  timeColumn.innerHTML = generateHours();

  wrapper.appendChild(timeColumn);

  for (let i = 0; i < 7;
