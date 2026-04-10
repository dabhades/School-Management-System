// Calendar related functions

// New Calendar DOM elements
const calendarGrid = document.getElementById('calendarGrid');
const currentMonthYearSpan = document.getElementById('currentMonthYear');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const markHolidayBtn = document.getElementById('markHoliday');
const markWorkingDayBtn = document.getElementById('markWorkingDay');
const clearDayStatusBtn = document.getElementById('clearDayStatus');

// Calendar variables
let currentCalendarDate = new Date();
let selectedCalendarDay = null; // To store the currently selected day in the calendar

// --- CALENDAR FUNCTIONS ---

async function renderCalendar() {
    calendarGrid.innerHTML = ''; // Clear previous calendar
    selectedCalendarDay = null; // Reset selected day

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth(); // 0-indexed

    currentMonthYearSpan.textContent = `${currentCalendarDate.toLocaleString('default', { month: 'long' })} ${year}`;

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday

    // Add day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        calendarGrid.appendChild(header);
    });

    // Fetch calendar events for the current month
    const events = await getCalendarEvents(year, month);

    // Fill leading empty days
    for (let i = 0; i < startDayOfWeek; i++) {
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.innerHTML = `<span class="calendar-day-number">${prevMonthLastDay - startDayOfWeek + 1 + i}</span>`;
        calendarGrid.appendChild(day);
    }

    // Fill days of the current month
    for (let i = 1; i <= daysInMonth; i++) {
        const day = document.createElement('div');
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        day.dataset.date = dateString;
        day.className = 'calendar-day current-month';
        day.innerHTML = `<span class="calendar-day-number">${i}</span>`;

        if (dateString === new Date().toISOString().split('T')[0]) {
            day.classList.add('today');
        }

        const event = events[dateString];
        if (event) {
            day.classList.add(event.type); // 'holiday' or 'working-day'
            day.innerHTML += `<span class="calendar-day-status">${event.type === 'holiday' ? 'Holiday' : 'Working'}</span>`;
        }

        day.addEventListener('click', () => selectCalendarDay(day));
        calendarGrid.appendChild(day);
    }

    // Fill trailing empty days
    const totalDaysDisplayed = startDayOfWeek + daysInMonth;
    const remainingCells = 42 - totalDaysDisplayed; // Max 6 rows * 7 days
    for (let i = 1; i <= remainingCells; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.innerHTML = `<span class="calendar-day-number">${i}</span>`;
        calendarGrid.appendChild(day);
    }
}

function selectCalendarDay(dayElement) {
    // Remove 'selected' class from previously selected day
    if (selectedCalendarDay) {
        selectedCalendarDay.classList.remove('selected');
    }
    // Add 'selected' class to the new day
    dayElement.classList.add('selected');
    selectedCalendarDay = dayElement;
}

prevMonthBtn.addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
});

markHolidayBtn.addEventListener('click', () => markSelectedDay('holiday'));
markWorkingDayBtn.addEventListener('click', () => markSelectedDay('working-day'));
clearDayStatusBtn.addEventListener('click', () => markSelectedDay('clear'));

async function markSelectedDay(type) {
    if (!selectedCalendarDay || selectedCalendarDay.classList.contains('other-month')) {
        showAppAlert('Please select a day in the current month first.', 'warning');
        return;
    }

    const date = selectedCalendarDay.dataset.date;
    const docId = date; // Use date as document ID

    try {
        if (type === 'clear') {
            await db.collection('calendarEvents').doc(docId).delete();
            showAppAlert(`Status cleared for ${date}.`);
        } else {
            await db.collection('calendarEvents').doc(docId).set({
                date: date,
                type: type
            });
            showAppAlert(`Day ${date} marked as ${type === 'holiday' ? 'Holiday' : 'Working Day'}.`);
        }
        renderCalendar(); // Re-render calendar to show updated status
    } catch (error) {
        console.error("Error marking calendar day:", error);
        showAppAlert('Error updating calendar day: ' + error.message, 'danger');
    }
}

async function getCalendarEvents(year, month) {
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;

    const snapshot = await db.collection('calendarEvents')
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .get();

    const events = {};
    snapshot.forEach(doc => {
        const data = doc.data();
        events[data.date] = data;
    });
    return events;
}