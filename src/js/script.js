// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
let functionsClient = null;
try { if (firebase && firebase.functions) functionsClient = firebase.functions(); } catch (e) { functionsClient = null; }



// Check if user is logged in
firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
        // User is not logged in, redirect to login page
        window.location.href = 'login.html';
    } else {
        // User is logged in, show dashboard
        console.log('Admin logged in:', user.email);
        // Your existing dashboard code continues here
    }
});


// DOM elements
const navLinks = document.getElementById('nav-links');
const hamburger = document.getElementById('hamburger');
const appAlert = document.getElementById('app-alert');






// New Teacher Analytics DOM elements
const analyticsStartDateInput = document.getElementById('analyticsStartDate');
const analyticsEndDateInput = document.getElementById('analyticsEndDate');
const teacherAnalyticsResultsDiv = document.getElementById('teacherAnalyticsResults');
const totalFeesCollectedEl = document.getElementById('totalFeesCollected');
const totalPendingFeesEl = document.getElementById('totalPendingFees');
const feeStatusChartCanvas = document.getElementById('feeStatusChart');
const exportReconciliationBtn = document.getElementById('exportReconciliationBtn');

// Fee Management DOM elements
const feesTableBody = document.getElementById('feesTableBody');
const feeClassFilter = document.getElementById('feeClassFilter');
const feeFromDate = document.getElementById('feeFromDate');
const feeToDate = document.getElementById('feeToDate');
const exportFeesCsvBtn = document.getElementById('exportFeesCsvBtn');
const feeForm = document.getElementById('feeForm');
const feeStudentId = document.getElementById('feeStudentId');
const feeAmount = document.getElementById('feeAmount');
const feeDate = document.getElementById('feeDate');
const paymentMethod = document.getElementById('paymentMethod');
const discount = document.getElementById('discount');
const feeStructureForm = document.getElementById('feeStructureForm');
const feeStructureClass = document.getElementById('feeStructureClass');
const feeStructureAmount = document.getElementById('feeStructureAmount');
const feeStructureTableBody = document.getElementById('feeStructureTableBody');
// Assign Fees DOM elements
const assignFeeStudentSelect = document.getElementById('assignFeeStudentSelect');
const studentFeeAssignmentDetails = document.getElementById('student-fee-assignment-details');
// Collect Payment Modal elements
const collectPaymentModal = document.getElementById('collectPaymentModal');
const collectPaymentForm = document.getElementById('collectPaymentForm');
const collectFeeIdInput = document.getElementById('collectFeeId');
const collectStudentDiv = document.getElementById('collectStudent');
const collectAmountInput = document.getElementById('collectAmount');
const collectDateInput = document.getElementById('collectDate');
const collectMethodSelect = document.getElementById('collectMethod');
const collectNotesInput = document.getElementById('collectNotes');
// Payments History Modal elements
const paymentsModal = document.getElementById('paymentsModal');
const paymentsTitle = document.getElementById('paymentsTitle');
const paymentsList = document.getElementById('paymentsList');
// Generic view modal elements (for student/teacher details)
const viewModal = document.getElementById('viewModal');
const viewModalTitle = document.getElementById('viewModalTitle');
const viewModalBody = document.getElementById('viewModalBody');
const viewModalClose = document.getElementById('viewModalClose');
const viewModalOk = document.getElementById('viewModalOk');

function showViewModal() { if (viewModal) viewModal.classList.add('show'); }
function hideViewModal() { if (viewModal) viewModal.classList.remove('show'); }
if (viewModalClose) viewModalClose.addEventListener('click', hideViewModal);
if (viewModalOk) viewModalOk.addEventListener('click', hideViewModal);
if (viewModal) viewModal.addEventListener('click', (e) => { if (e.target === viewModal) hideViewModal(); });

// Attendance DOM elements (declare here so other functions can use them safely)
const attendanceTypeSelect = document.getElementById('attendanceType');
const classFilterGroup = document.getElementById('classFilterGroup');
const attendanceDateInput = document.getElementById('attendanceDate');
const attendanceSearch = document.getElementById('attendanceSearch');
const attendanceClassFilter = document.getElementById('attendanceClassFilter');
const attendanceReportType = document.getElementById('attendanceReportType');
const attendanceReportDate = document.getElementById('attendanceReportDate');
const attendanceReportClassFilter = document.getElementById('attendanceReportClassFilter');
const attendanceTableBody = document.getElementById('attendanceTableBody');
const reportTableBody = document.getElementById('reportTableBody');
const reportTable = document.getElementById('reportTable');
const classAttendanceCharts = document.getElementById('classAttendanceCharts');



// Global variable to hold the ID of the entity being edited
let currentEditingEntityId = null;
let currentEditingEntityType = null;
let classCharts = {}; // Global variable to hold Chart.js instances



// Initial loads
document.addEventListener('DOMContentLoaded', () => {
    loadStatistics();
    loadAndDisplayStudents();
    loadAndDisplayTeachers();
    loadAndDisplayFees();
    loadAndDisplayFeeStructures();
    attendanceDateInput.valueAsDate = new Date();
    attendanceReportDate.valueAsDate = new Date();
    feeDate.valueAsDate = new Date();
    loadDailyAttendance();
    populateClassFilters();
    loadAssignFeeStudents(); // Populate Assign Fees student dropdown
    loadAttendanceReportTable();
    renderCalendar(); // Initial calendar render
    // Set default dates for analytics
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    analyticsStartDateInput.valueAsDate = firstDayOfMonth;
    analyticsEndDateInput.valueAsDate = today;
    // Initialize auth after DOM ready
    try { initAuth(); } catch (e) { console.warn('Auth init error', e); }
    // Dashboard tiles: navigate to respective list views when clicked
    const teacherCountEl = document.getElementById('teacherCount');
    const studentCountEl = document.getElementById('studentCount');
    if (teacherCountEl) {
        teacherCountEl.style.cursor = 'pointer';
        teacherCountEl.addEventListener('click', () => {
            const navLink = document.querySelector('.nav-link[href="#teachers"]');
            if (navLink) navLink.click();
            // ensure the list tab is shown after navigation
            setTimeout(() => {
                const btn = document.querySelector('#teachers .tab-button[data-tab-target="#teachers-list"]');
                if (btn) btn.click();
            }, 100);
        });
    }
    if (studentCountEl) {
        studentCountEl.style.cursor = 'pointer';
        studentCountEl.addEventListener('click', () => {
            const navLink = document.querySelector('.nav-link[href="#students"]');
            if (navLink) navLink.click();
            setTimeout(() => {
                const btn = document.querySelector('#students .tab-button[data-tab-target="#students-list"]');
                if (btn) btn.click();
            }, 100);
        });
    }
});

// Navigation and Tab Functionality
hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    hamburger.classList.toggle('active');
});

// Mobile Dropdown Toggle Functionality
document.querySelectorAll('.dropdown .dropbtn').forEach(dropbtn => {
    dropbtn.addEventListener('click', (e) => {
        // Only toggle on mobile (when hamburger is visible)
        if (window.innerWidth <= 768) {
            e.preventDefault();
            const dropdown = dropbtn.closest('.dropdown');

            // Close other dropdowns
            document.querySelectorAll('.dropdown').forEach(dd => {
                if (dd !== dropdown) {
                    dd.classList.remove('active');
                }
            });

            // Toggle current dropdown
            dropdown.classList.toggle('active');
        }
    });
});

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-content').forEach(section => {
            section.classList.add('hidden');
        });
        const targetId = e.target.getAttribute('href').substring(1);
        document.getElementById(targetId).classList.remove('hidden');
        navLinks.classList.remove('active'); // Close menu on navigation

        // Specific actions for new tabs
        if (targetId === 'calendar') {
            renderCalendar();
        } else if (targetId === 'teachers') {
            // Ensure the default teachers list tab is active when navigating to teachers
            document.querySelector('#teachers .tab-button[data-tab-target="#teachers-list"]').click();
        }
    });
});

// Dropdown navigation logic
document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent bubbling to parent nav link

        const targetTabSelector = item.getAttribute('data-target-tab');

        // Find the target tab button to identify the parent section
        // We search in all sections because we don't know which one it belongs to yet
        const targetTabButton = document.querySelector(`.tab-button[data-tab-target="${targetTabSelector}"]`);

        if (targetTabButton) {
            // 1. Navigate to the main section
            const parentSection = targetTabButton.closest('section');
            if (parentSection) {
                document.querySelectorAll('.tab-content').forEach(section => {
                    section.classList.add('hidden');
                });
                parentSection.classList.remove('hidden');
                navLinks.classList.remove('active');
            }

            // 2. Activate the specific tab
            targetTabButton.click();
        } else {
            console.warn(`Tab button not found for selector: ${targetTabSelector}`);
        }
    });
});

// Close nav when any link is clicked (mobile friendly)
document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('active');
    if (hamburger.classList.contains('active')) hamburger.classList.remove('active');
}));

// Make tab containers scrollable on small screens so buttons don't wrap
document.querySelectorAll('.tab-container').forEach(tc => {
    tc.style.overflowX = 'auto';
    tc.style.webkitOverflowScrolling = 'touch';
});

document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', (e) => {
        const parentTab = e.target.closest('section');
        parentTab.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        parentTab.querySelectorAll('.tab-content-pane').forEach(pane => pane.classList.add('hidden'));
        const targetPane = document.querySelector(e.target.dataset.tabTarget);
        targetPane.classList.remove('hidden');

        // Reset forms when switching to add tabs
        if (e.target.dataset.tabTarget === '#students-add') {
            resetStudentForm();
        } else if (e.target.dataset.tabTarget === '#teachers-add') {
            resetTeacherForm();
        }
        else if (e.target.dataset.tabTarget === '#add-payment') {
            feeForm.reset();
            feeDate.valueAsDate = new Date();
        } else if (e.target.dataset.tabTarget === '#teachers-analytics') {
            loadTeacherAnalytics(); // Load analytics when tab is opened
        }
    });
});

// Alert message handler
function showAppAlert(message, type = 'success') {
    appAlert.textContent = message;
    appAlert.className = `alert-${type}`;
    appAlert.classList.add('show');
    setTimeout(() => {
        appAlert.classList.remove('show');
    }, 3000);
}

// --- CRUD & LISTING FUNCTIONS ---



async function deleteEntity(type, id) {
    if (!id || String(id).trim() === '') { // Add defensive check for valid ID
        showAppAlert(`Cannot delete: ${type} ID is missing or invalid.`, 'danger');
        return;
    }
    if (confirm(`Are you sure you want to delete this ${type}?`)) {
        try {
            await db.collection(`${type}s`).doc(id).delete();
            showAppAlert(`${type} deleted successfully!`);
            if (type === 'student') {
                loadAndDisplayStudents();
                populateClassFilters(); // Update class filter after deletion
                loadStudentIndex();
            }
            if (type === 'teacher') loadAndDisplayTeachers();
            loadStatistics(); // Update dashboard after change
        } catch (error) {
            console.error("Error deleting document:", error);
            showAppAlert(`Error deleting ${type}: ` + error.message, 'danger');
        }
    }
}

// Teachers Management
teacherForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = teacherIdInput.value.trim();
    const name = teacherNameInput.value.trim();
    const subject = teacherSubjectInput.value.trim();
    const phone = teacherPhoneInput.value.trim();

    if (!id || !name || !subject) {
        showAppAlert('Teacher ID, Name, and Subject are required.', 'danger');
        return;
    }

    try {
        if (currentEditingEntityId) {
            // Update existing teacher
            await db.collection('teachers').doc(currentEditingEntityId).update({ name, subject, phone });
            showAppAlert('Teacher updated successfully!');
        } else {
            // Add new teacher
            await db.collection('teachers').doc(id).set({ id, name, subject, phone });
            showAppAlert('Teacher added successfully!');
        }
        resetTeacherForm();
        loadAndDisplayTeachers();
        loadStatistics(); // Update dashboard after change
        // Switch back to list view after adding/editing
        document.querySelector('#teachers .tab-button[data-tab-target="#teachers-list"]').click();
    } catch (error) {
        console.error("Error saving teacher:", error);
        showAppAlert('Error saving teacher: ' + error.message, 'danger');
    }
});

async function loadAndDisplayTeachers(query = '') {
    const teachersRef = db.collection('teachers');
    const snapshot = await teachersRef.get();
    let teachers = snapshot.docs.map(doc => ({ _docId: doc.id, ...doc.data() }));

    // Filtering
    const lowerCaseQuery = query.toLowerCase();
    if (lowerCaseQuery) {
        teachers = teachers.filter(entity => {
            // Defensive checks for undefined properties
            const entityId = entity.id ? String(entity.id).toLowerCase() : '';
            const entityName = entity.name ? String(entity.name).toLowerCase() : '';
            const entitySubject = entity.subject ? String(entity.subject).toLowerCase() : '';
            return entityId.includes(lowerCaseQuery) ||
                entityName.includes(lowerCaseQuery) ||
                entitySubject.includes(lowerCaseQuery);
        });
    }

    renderTable(teacherTableBody, teachers, 'teacher');
}

teacherSearch.addEventListener('input', (e) => {
    loadAndDisplayTeachers(e.target.value);
});

function resetTeacherForm() {
    teacherForm.reset();
    teacherIdInput.removeAttribute('disabled'); // Enable ID for new entries
    currentEditingEntityId = null;
    currentEditingEntityType = null;
    teacherModalTitle.textContent = 'Add New Teacher';
    saveTeacherBtn.textContent = 'Add Teacher';
}

async function editTeacher(id) {
    // Defensive check for valid ID before proceeding
    if (!id || String(id).trim() === '') {
        showAppAlert('Cannot edit: Teacher ID is missing or invalid. Please ensure the record has a valid ID.', 'danger');
        return;
    }
    try {
        const doc = await db.collection('teachers').doc(id).get();
        if (doc.exists) {
            const teacher = doc.data();
            teacherIdInput.value = teacher.id ?? '';
            teacherNameInput.value = teacher.name ?? '';
            teacherSubjectInput.value = teacher.subject ?? '';
            teacherPhoneInput.value = teacher.phone ?? '';

            teacherIdInput.setAttribute('disabled', 'true'); // Prevent changing ID on edit
            currentEditingEntityId = id;
            currentEditingEntityType = 'teacher';
            teacherModalTitle.textContent = 'Edit Teacher';
            saveTeacherBtn.textContent = 'Update Teacher';

            // Switch to the add/edit tab
            document.querySelector('#teachers .tab-button[data-tab-target="#teachers-add"]').click();
        } else {
            showAppAlert('Teacher not found.', 'danger');
        }
    } catch (error) {
        console.error("Error fetching teacher for edit:", error);
        showAppAlert('Error loading teacher for edit: ' + error.message, 'danger');
    }
}

// Function to display all details of an item (for the "View" button) using a modal
async function viewDetails(item, type) {
    try {
        // Build HTML for primary fields (skip internal keys)
        const keysToShowFirst = ['name', 'id', 'class', 'subject', 'phone', 'email'];
        let html = '<div class="details-grid">';

        // Preferred order (render phone with call button)
        keysToShowFirst.forEach(k => {
            if (Object.prototype.hasOwnProperty.call(item, k)) {
                const raw = item[k];
                const val = raw === null || raw === undefined || raw === '' ? 'N/A' : raw;
                if (k === 'phone') {
                    if (val === 'N/A') {
                        html += `<div style="margin-bottom:.5rem;"><strong>Phone:</strong> N/A</div>`;
                    } else {
                        // sanitize phone for tel: link (keep + and digits)
                        const tel = String(raw).replace(/[^+0-9]/g, '');
                        // sanitize for WhatsApp wa.me link (digits only, no +)
                        const waNumber = String(raw).replace(/[^0-9]/g, '').replace(/^0+/, '');
                        const waUrl = waNumber ? `https://wa.me/${waNumber}` : '#';
                        html += `<div style="margin-bottom:.5rem;"><strong>Phone:</strong> ${val} <a href="tel:${tel}" class="call-button pulse" aria-label="Call ${val}"><i class="fa fa-phone"></i></a> <a href="${waUrl}" class="whatsapp-button pulse" target="_blank" rel="noopener" aria-label="WhatsApp ${val}"><i class="fa-brands fa-whatsapp"></i></a></div>`;
                    }
                } else {
                    html += `<div style="margin-bottom:.5rem;"><strong>${k.charAt(0).toUpperCase() + k.slice(1)}:</strong> ${val}</div>`;
                }
            }
        });

        // Other fields
        for (const key in item) {
            if (!Object.prototype.hasOwnProperty.call(item, key)) continue;
            if (keysToShowFirst.includes(key) || key === '_docId') continue;
            const value = item[key] === null || item[key] === undefined || item[key] === '' ? 'N/A' : item[key];
            html += `<div style="margin-bottom:.5rem;"><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${value}</div>`;
        }

        html += '</div>';

        // If student, load fee history and append
        if (type === 'student') {
            const studentIdForQuery = item.id || item._docId || '';
            try {
                const feesQuery = db.collection('fees');
                let feesSnap;
                if (studentIdForQuery) {
                    try {
                        feesSnap = await feesQuery.where('studentId', '==', studentIdForQuery).orderBy('date', 'desc').get();
                    } catch (e) {
                        // Fallback: if ordering by date fails (no date index), fetch without order
                        feesSnap = await feesQuery.where('studentId', '==', studentIdForQuery).get();
                    }
                } else {
                    feesSnap = { docs: [] };
                }

                const fees = feesSnap.docs.map(d => d.data());
                if (fees.length > 0) {
                    html += '<hr><h4>Fee History</h4><div>';
                    fees.forEach(fee => {
                        const date = fee.date || fee.dueDate || 'N/A';
                        const amount = fee.amount ?? '';
                        const receipt = fee.receiptNumber || fee.receipt || '';
                        html += `<div style="margin-bottom:.4rem;"><strong>Date:</strong> ${date} — <strong>Amount:</strong> ${amount} ${receipt ? ' — <strong>Receipt:</strong> ' + receipt : ''}</div>`;
                    });
                    html += '</div>';
                }
            } catch (err) {
                console.warn('Unable to load fee history for view modal', err);
            }
        }

        // Add action buttons (Edit / Delete) at top of modal for students (delete hidden in list)
        let actionsHtml = '';
        const docId = item._docId || item.id || '';
        if (type === 'student') {
            // Show delete only in the student view modal (edit removed)
            actionsHtml += `<div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-bottom:.5rem; flex-wrap:wrap;">`;
            actionsHtml += `<button class="btn btn-danger action-btn" onclick="deleteEntity('student','${docId}')"><i class="fa fa-trash"></i> <span class="btn-text">Delete</span></button>`;
            actionsHtml += `</div>`;
        } else if (type === 'teacher') {
            // Keep delete in teacher modal; remove edit to match requested behavior
            actionsHtml += `<div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-bottom:.5rem; flex-wrap:wrap;">`;
            actionsHtml += `<button class="btn btn-danger action-btn" onclick="deleteEntity('teacher','${docId}')"><i class="fa fa-trash"></i> <span class="btn-text">Delete</span></button>`;
            actionsHtml += `</div>`;
        }

        // Set modal title and body
        if (viewModalTitle) viewModalTitle.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} Details`;
        if (viewModalBody) viewModalBody.innerHTML = actionsHtml + html;
        showViewModal();
    } catch (error) {
        console.error('Error showing details:', error);
        showAppAlert('Error showing details: ' + (error.message || error), 'danger');
    }
}

// Dynamic Table Rendering (Updated to include Edit, Delete, and View buttons)
function renderTable(tableBody, data, type) {
    tableBody.innerHTML = '';
    // determine column count from table header for proper colspan when empty
    const table = tableBody.closest('table');
    const headerCount = table ? table.querySelectorAll('thead th').length : 3;
    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="${headerCount}">No ${type}s found.</td></tr>`;
        return;
    }
    data.forEach(item => {
        const row = document.createElement('tr');
        if (type === 'student') {
            row.innerHTML = `
                        <td>${item.name ?? 'N/A'}</td>
                        <td>${item.class ?? 'N/A'}</td>
                        <td>
                            <button class="btn btn-secondary btn-sm action-btn" onclick="viewDetails(${JSON.stringify(item).replace(/\"/g, '&quot;')}, 'student')"><i class="fa fa-eye"></i> <span class="btn-text">View</span></button>
                            <button class="btn btn-primary btn-sm action-btn" onclick="editStudent('${item._docId ?? item.id ?? ''}')"><i class="fa fa-edit"></i> <span class="btn-text">Edit</span></button>
                        </td>
                    `;
        } else if (type === 'teacher') {
            row.innerHTML = `
                        <td>${item.name ?? 'N/A'}</td>
                        <td>${item.subject ?? 'N/A'}</td>
                        <td>
                            <button class="btn btn-secondary btn-sm action-btn" onclick="viewDetails(${JSON.stringify(item).replace(/\"/g, '&quot;')}, 'teacher')"><i class="fa fa-eye"></i> <span class="btn-text">View</span></button>
                            <button class="btn btn-primary btn-sm action-btn" onclick="editTeacher('${item._docId ?? item.id ?? ''}')"><i class="fa fa-edit"></i> <span class="btn-text">Edit</span></button>
                            <button class="btn btn-danger btn-sm action-btn" onclick="deleteEntity('teacher', '${item._docId ?? item.id ?? ''}')"><i class="fa fa-trash"></i> <span class="btn-text">Delete</span></button>
                        </td>
                    `;
        }
        tableBody.appendChild(row);
    });
}

// Sorting functionality
document.querySelectorAll('.data-table th').forEach(headerCell => {
    headerCell.addEventListener('click', () => {
        const table = headerCell.closest('table');
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const column = headerCell.dataset.sort;
        const direction = headerCell.dataset.direction === 'asc' ? 'desc' : 'asc';

        rows.sort((a, b) => {
            // Safe access to text content
            const aText = a.querySelector(`td:nth-child(${headerCell.cellIndex + 1})`)?.textContent.trim() ?? '';
            const bText = b.querySelector(`td:nth-child(${headerCell.cellIndex + 1})`)?.textContent.trim() ?? '';
            return direction === 'asc' ? aText.localeCompare(bText) : bText.localeCompare(aText);
        });

        // Clear and re-append sorted rows
        tbody.innerHTML = '';
        rows.forEach(row => tbody.appendChild(row));

        // Update sort direction
        document.querySelectorAll('.data-table th').forEach(th => th.dataset.direction = '');
        headerCell.dataset.direction = direction;
    });
});

// --- BULK IMPORT/EXPORT ---

async function importData(collectionName) {
    const fileInput = document.getElementById(`${collectionName}BulkImport`);

    if (!fileInput) {
        showAppAlert('Internal error: File input not found. Please try again.', 'danger');
        return;
    }

    const file = fileInput.files[0];
    if (!file) {
        showAppAlert('Please select a CSV file to import.', 'danger');
        return;
    }

    // Simple validation for file type
    if (!file.name.endsWith('.csv')) {
        showAppAlert('Invalid file type. Please upload a CSV file.', 'danger');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const text = e.target.result;
            const lines = text.split('\n').filter(line => line.trim() !== '');
            if (lines.length === 0) {
                showAppAlert('CSV file is empty.', 'warning');
                return;
            }
            const headers = lines[0].split(',').map(h => h.trim());

            const expectedHeaders = collectionName === 'students'
                ? ['id', 'name', 'class', 'phone']
                : ['id', 'name', 'subject', 'phone'];

            // Basic header validation
            if (!expectedHeaders.every(h => headers.includes(h))) {
                showAppAlert(`CSV headers do not match expected format. Expected: ${expectedHeaders.join(', ')}`, 'danger');
                return;
            }

            const data = lines.slice(1).map(line => {
                const values = line.split(',');
                let obj = {};
                headers.forEach((header, i) => {
                    obj[header] = values[i] ? values[i].trim() : '';
                });
                return obj;
            });

            const batch = db.batch();
            let importedCount = 0;
            data.forEach(item => {
                if (item.id) {
                    const docRef = db.collection(collectionName).doc(item.id);
                    batch.set(docRef, item);
                    importedCount++;
                } else {
                    console.warn(`Skipping row due to missing ID in ${collectionName} import:`, item);
                }
            });

            if (importedCount === 0) {
                showAppAlert('No valid records with IDs found in CSV to import.', 'warning');
                return;
            }

            await batch.commit();
            showAppAlert(`Successfully imported ${importedCount} records to ${collectionName}.`);
            if (collectionName === 'students') {
                loadAndDisplayStudents();
                populateClassFilters(); // Update class filter after import
                loadStudentIndex();
            }
            else loadAndDisplayTeachers();
            loadStatistics(); // Update dashboard after change
            fileInput.value = ''; // Clear file input
        } catch (error) {
            console.error("Error importing data:", error);
            showAppAlert('Error importing data: ' + error.message, 'danger');
        }
    };
    reader.readAsText(file);
}

async function exportData(collectionName) {
    try {
        const snapshot = await db.collection(collectionName).get();
        if (snapshot.empty) {
            showAppAlert('No data to export.', 'warning');
            return;
        }

        const data = snapshot.docs.map(doc => doc.data());

        // Define the headers you want in the CSV file
        let headers;
        if (collectionName === 'students') {
            headers = ['id', 'name', 'class', 'phone'];
        } else if (collectionName === 'teachers') {
            headers = ['id', 'name', 'subject', 'phone'];
        } else {
            // Fallback for other collections
            let allKeys = new Set();
            data.forEach(item => Object.keys(item).forEach(key => allKeys.add(key)));
            headers = Array.from(allKeys).sort();
        }

        // Create the CSV content
        const csvRows = [
            headers.join(','), // CSV headers
            ...data.map(row => headers.map(header => {
                let value = row[header];
                // Ensure values are a string and handle commas/quotes by wrapping in quotes
                return `"${String(value ?? '').replace(/"/g, '""')}"`;
            }).join(','))
        ];
        const csvString = csvRows.join('\n');

        // Trigger the download
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${collectionName}_data.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        showAppAlert(`Exported ${data.length} records from ${collectionName}.`);
    } catch (error) {
        console.error("Error exporting data:", error);
        showAppAlert('Error exporting data: ' + error.message, 'danger');
    }
}

function downloadCsvTemplate(type) {
    let csvContent = '';
    let filename = '';

    if (type === 'student') {
        csvContent = "id,name,class,phone\nS-001,John Doe,10th,1234567890\nS-002,Jane Smith,11th,0987654321";
        filename = 'student_template.csv';
    } else if (type === 'teacher') {
        csvContent = "id,name,subject,phone\nT-001,Mr. Sharma,Math,9876543210\nT-002,Ms. Khan,Science,0123456789";
        filename = 'teacher_template.csv';
    } else {
        showAppAlert('Invalid template type.', 'danger');
        return;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAppAlert(`${filename} downloaded successfully!`, 'success');
}

// --- ATTENDANCE MANAGEMENT ---

attendanceTypeSelect.addEventListener('change', () => {
    const type = attendanceTypeSelect.value;
    if (type === 'student') {
        classFilterGroup.style.display = 'block';
        populateClassFilters(); // Repopulate when switching to students
    } else {
        classFilterGroup.style.display = 'none';
        attendanceClassFilter.value = ''; // Reset filter
    }
    loadDailyAttendance();
});

attendanceDateInput.addEventListener('change', loadDailyAttendance);
attendanceSearch.addEventListener('input', loadDailyAttendance);
attendanceClassFilter.addEventListener('change', loadDailyAttendance);

// New function to populate the class filter dropdowns
async function populateClassFilters() {
    try {
        const studentsRef = db.collection('students');
        const snapshot = await studentsRef.get();
        const students = snapshot.docs.map(doc => doc.data());
        const uniqueClasses = [...new Set(students.map(s => s.class).filter(c => c))].sort();
        // Query the DOM elements locally so function works regardless of script load order
        const attendanceClassFilterEl = document.getElementById('attendanceClassFilter');
        const attendanceReportClassFilterEl = document.getElementById('attendanceReportClassFilter');
        const studentClassFilterEl = document.getElementById('studentClassFilter');
        const feeClassFilterEl = document.getElementById('feeClassFilter');

        // Populate 'Mark Attendance' filter
        if (attendanceClassFilterEl) {
            attendanceClassFilterEl.innerHTML = '<option value="">All Classes</option>';
            uniqueClasses.forEach(className => {
                const option = document.createElement('option');
                option.value = className;
                option.textContent = className;
                attendanceClassFilterEl.appendChild(option);
            });
        }

        // Populate 'View Attendance' filter
        if (attendanceReportClassFilterEl) {
            attendanceReportClassFilterEl.innerHTML = '<option value="">All Classes</option>';
            uniqueClasses.forEach(className => {
                const option = document.createElement('option');
                option.value = className;
                option.textContent = className;
                attendanceReportClassFilterEl.appendChild(option);
            });
        }

        // Populate 'Students List' filter
        if (studentClassFilterEl) {
            studentClassFilterEl.innerHTML = '<option value="">Filter by Class</option>';
            uniqueClasses.forEach(className => {
                const option = document.createElement('option');
                option.value = className;
                option.textContent = className;
                studentClassFilterEl.appendChild(option);
            });
        }
        // Also refresh Assign Fees student dropdown when classes change
        loadAssignFeeStudents();
        // Populate Fee Records class filter
        if (feeClassFilterEl) {
            feeClassFilterEl.innerHTML = '<option value="">Filter by Class</option>';
            uniqueClasses.forEach(className => {
                const option = document.createElement('option');
                option.value = className;
                option.textContent = className;
                feeClassFilterEl.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Error populating class filter:", error);
        showAppAlert('Error loading classes: ' + error.message, 'danger');
    }
}

// --- ASSIGN FEES FUNCTIONALITY ---

// Populate the student select in the Assign Fees tab
async function loadAssignFeeStudents() {
    if (!assignFeeStudentSelect) return;
    try {
        const snapshot = await db.collection('students').get();
        const students = snapshot.docs.map(doc => doc.data()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        assignFeeStudentSelect.innerHTML = '<option value="">Select a student</option>';
        students.forEach(s => {
            const option = document.createElement('option');
            option.value = s.id || '';
            option.textContent = `${s.name || 'Unknown'} (${s.id || ''}) - ${s.class || ''}`;
            assignFeeStudentSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading students for assign-fees:', error);
        showAppAlert('Error loading students for assignment: ' + error.message, 'danger');
    }
}

// --- Student Autocomplete for Add Payment ---
let _studentIndex = []; // cached students for quick lookup
let _selectedFeeStudent = null; // holds full student object when selected from suggestions

async function loadStudentIndex() {
    try {
        const snapshot = await db.collection('students').get();
        _studentIndex = snapshot.docs.map(d => d.data()).filter(s => s && s.id);
    } catch (error) {
        console.error('Error loading student index:', error);
    }
}

function renderFeeStudentSuggestions(list, highlightIndex = -1) {
    const container = document.getElementById('feeStudentSuggestions');
    if (!container) return;
    container.innerHTML = '';
    container.style.display = list.length ? 'block' : 'none';
    container.setAttribute('aria-hidden', list.length ? 'false' : 'true');
    // update input aria-expanded
    const input = document.getElementById('feeStudentId');
    if (input) input.setAttribute('aria-expanded', list.length ? 'true' : 'false');
    list.slice(0, 20).forEach((s, idx) => {
        const div = document.createElement('div');
        const itemId = `fee-sugg-${idx}`;
        div.id = itemId;
        div.setAttribute('role', 'option');
        div.setAttribute('aria-selected', idx === highlightIndex ? 'true' : 'false');
        div.className = 'suggestion-item' + (idx === highlightIndex ? ' active' : '');
        div.tabIndex = -1;
        div.textContent = `${s.name || 'Unknown'} (${s.id}) — ${s.class || ''}`;
        div.addEventListener('click', () => selectFeeStudent(s));
        div.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') selectFeeStudent(s); });
        container.appendChild(div);
        // update activedescendant if highlighted
        if (idx === highlightIndex && input) input.setAttribute('aria-activedescendant', itemId);
    });
}

function selectFeeStudent(student) {
    _selectedFeeStudent = student;
    feeStudentId.value = `${student.name} (${student.id})`;
    const info = document.getElementById('selectedFeeStudentInfo');
    if (info) info.textContent = `Selected: ${student.name} — Class ${student.class || 'N/A'}`;
    const container = document.getElementById('feeStudentSuggestions');
    if (container) { container.style.display = 'none'; container.innerHTML = ''; container.setAttribute('aria-hidden', 'true'); }
    const input = document.getElementById('feeStudentId');
    if (input) { input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); }
}

function clearSelectedFeeStudent() {
    _selectedFeeStudent = null;
    const info = document.getElementById('selectedFeeStudentInfo');
    if (info) info.textContent = '';
}

function onFeeStudentInput(e) {
    const v = e.target.value.trim();
    clearSelectedFeeStudent();
    if (!v) { renderFeeStudentSuggestions([]); return; }
    const q = v.toLowerCase();
    const matches = _studentIndex.filter(s => (s.id && s.id.toLowerCase().includes(q)) || (s.name && s.name.toLowerCase().includes(q)) || (s.class && s.class.toLowerCase().includes(q)));
    renderFeeStudentSuggestions(matches);
}

// Keyboard navigation for suggestions (simple)
function wireFeeStudentKeyboard() {
    const input = feeStudentId;
    const container = document.getElementById('feeStudentSuggestions');
    let highlight = -1;
    input.addEventListener('keydown', (e) => {
        if (!container) return;
        const items = container.querySelectorAll('.suggestion-item');
        if (e.key === 'ArrowDown') {
            e.preventDefault(); highlight = Math.min(items.length - 1, highlight + 1); items.forEach((it, i) => it.classList.toggle('active', i === highlight));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault(); highlight = Math.max(-1, highlight - 1); items.forEach((it, i) => it.classList.toggle('active', i === highlight));
        } else if (e.key === 'Enter') {
            if (highlight >= 0 && items[highlight]) { items[highlight].click(); e.preventDefault(); }
        } else if (e.key === 'Escape') {
            container.style.display = 'none'; highlight = -1;
        }
    });
}

// Wire autocomplete on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    loadStudentIndex();
    if (feeStudentId) {
        feeStudentId.addEventListener('input', onFeeStudentInput);
        feeStudentId.addEventListener('focus', onFeeStudentInput);
        feeStudentId.addEventListener('blur', () => { setTimeout(() => { const c = document.getElementById('feeStudentSuggestions'); if (c) c.style.display = 'none'; }, 150); });
        wireFeeStudentKeyboard();
    }
});

// --- BULK ASSIGN FEES ---
const bulkClassSelect = document.getElementById('bulkClassSelect');
const bulkAmountInput = document.getElementById('bulkAmount');
const bulkDueDateInput = document.getElementById('bulkDueDate');
const bulkInstallmentsInput = document.getElementById('bulkInstallments');
const bulkFrequencySelect = document.getElementById('bulkFrequency');
const bulkFirstDueDateInput = document.getElementById('bulkFirstDueDate');
const bulkNotesInput = document.getElementById('bulkNotes');
const bulkSkipExistingCheckbox = document.getElementById('bulkSkipExisting');
const previewBulkAssignBtn = document.getElementById('previewBulkAssignBtn');
const confirmBulkAssignBtn = document.getElementById('confirmBulkAssignBtn');
const bulkAssignPreviewDiv = document.getElementById('bulkAssignPreview');

// Helper to split amount into N nearly-equal installments (two decimals)
function splitAmountIntoInstallments(amount, n) {
    const parts = [];
    const base = Math.floor((amount / n) * 100) / 100; // cents
    let remainder = Math.round((amount - base * n) * 100) / 100;
    for (let i = 0; i < n; i++) {
        let part = base;
        // Distribute remainder cents to last installment
        if (i === n - 1) {
            part = Math.round((part + remainder) * 100) / 100;
        }
        parts.push(part);
    }
    return parts;
}

function shiftDateByFrequency(dateStr, frequency, idx) {
    const d = dateStr ? new Date(dateStr) : new Date();
    if (frequency === 'weekly') {
        d.setDate(d.getDate() + idx * 7);
    } else { // monthly
        d.setMonth(d.getMonth() + idx);
    }
    return d.toISOString().split('T')[0];
}

// Populate classes for bulk assign (reuses populateClassFilters logic but keeps a separate select)
async function populateBulkClassSelect() {
    try {
        const studentsSnapshot = await db.collection('students').get();
        const students = studentsSnapshot.docs.map(doc => doc.data());
        const uniqueClasses = [...new Set(students.map(s => s.class).filter(c => c))].sort();

        if (!bulkClassSelect) return;
        bulkClassSelect.innerHTML = '<option value="">Select class</option>';
        uniqueClasses.forEach(className => {
            const option = document.createElement('option');
            option.value = className;
            option.textContent = className;
            bulkClassSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error populating bulk class select:', error);
    }
}

// Preview bulk assign: shows list/count of students that will receive the fee (respects skip-existing)
async function previewBulkAssign() {
    const className = bulkClassSelect.value;
    const amount = parseFloat(bulkAmountInput.value || '0');
    const dueDate = bulkDueDateInput.value;
    const notes = bulkNotesInput.value.trim();
    const skipExisting = bulkSkipExistingCheckbox.checked;

    bulkAssignPreviewDiv.innerHTML = '';
    confirmBulkAssignBtn.disabled = true;

    if (!className) { showAppAlert('Please select a class to preview.', 'danger'); return; }
    if (!amount || amount <= 0) { showAppAlert('Please enter a valid amount.', 'danger'); return; }

    try {
        const studentsSnapshot = await db.collection('students').where('class', '==', className).get();
        if (studentsSnapshot.empty) { bulkAssignPreviewDiv.innerHTML = '<p>No students found for this class.</p>'; return; }

        const students = studentsSnapshot.docs.map(d => d.data());
        let candidates = students;

        const installments = bulkInstallmentsInput ? parseInt(bulkInstallmentsInput.value || '1') : 1;
        const frequency = bulkFrequencySelect ? bulkFrequencySelect.value : 'monthly';
        const firstDate = bulkFirstDueDateInput ? bulkFirstDueDateInput.value : '';

        if (skipExisting) {
            // For each student, check if there is an unpaid fee with same amount
            const checks = await Promise.all(students.map(async (s) => {
                const feesSnap = await db.collection('fees')
                    .where('studentId', '==', s.id)
                    .where('status', 'in', ['Unpaid', 'Partial'])
                    .get();
                const hasSame = feesSnap.docs.some(fdoc => {
                    const f = fdoc.data();
                    return Number(f.amount || 0) === amount;
                });
                return { student: s, skip: hasSame };
            }));

            const willAssign = checks.filter(c => !c.skip).map(c => c.student);
            const skipped = checks.filter(c => c.skip).map(c => c.student);

            bulkAssignPreviewDiv.innerHTML = `<p>Will assign fee to <strong>${willAssign.length}</strong> students. <strong>${skipped.length}</strong> students will be skipped because they have an existing unpaid fee of the same amount.</p>`;
            if (willAssign.length > 0) {
                const list = document.createElement('div');
                list.style.maxHeight = '200px';
                list.style.overflow = 'auto';
                willAssign.slice(0, 200).forEach(s => {
                    const el = document.createElement('div');
                    el.textContent = `${s.name || s.id} (${s.id})`;
                    list.appendChild(el);
                });
                bulkAssignPreviewDiv.appendChild(list);
            }
            // Show sample schedule if installments > 1
            if (installments > 1) {
                const sample = willAssign[0];
                if (sample) {
                    const amounts = splitAmountIntoInstallments(amount, installments);
                    const scheduleDiv = document.createElement('div');
                    scheduleDiv.style.marginTop = '0.5rem';
                    scheduleDiv.innerHTML = '<strong>Sample Installment Schedule:</strong>';
                    const ul = document.createElement('ul');
                    for (let i = 0; i < installments; i++) {
                        const due = firstDate ? shiftDateByFrequency(firstDate, frequency, i) : (dueDate || 'N/A');
                        const li = document.createElement('li');
                        li.textContent = `Installment ${i + 1}: ${amounts[i]} - Due: ${due}`;
                        ul.appendChild(li);
                    }
                    scheduleDiv.appendChild(ul);
                    bulkAssignPreviewDiv.appendChild(scheduleDiv);
                }
            }
            if (willAssign.length > 0) confirmBulkAssignBtn.disabled = false;
        } else {
            bulkAssignPreviewDiv.innerHTML = `<p>Will assign fee to <strong>${students.length}</strong> students in class ${className}.</p>`;
            const list = document.createElement('div');
            list.style.maxHeight = '200px';
            list.style.overflow = 'auto';
            students.slice(0, 200).forEach(s => {
                const el = document.createElement('div');
                el.textContent = `${s.name || s.id} (${s.id})`;
                list.appendChild(el);
            });
            bulkAssignPreviewDiv.appendChild(list);
            // show sample schedule
            const installments = bulkInstallmentsInput ? parseInt(bulkInstallmentsInput.value || '1') : 1;
            const frequency = bulkFrequencySelect ? bulkFrequencySelect.value : 'monthly';
            const firstDate = bulkFirstDueDateInput ? bulkFirstDueDateInput.value : '';
            if (installments > 1) {
                const amounts = splitAmountIntoInstallments(amount, installments);
                const scheduleDiv = document.createElement('div');
                scheduleDiv.style.marginTop = '0.5rem';
                scheduleDiv.innerHTML = '<strong>Sample Installment Schedule:</strong>';
                const ul = document.createElement('ul');
                for (let i = 0; i < installments; i++) {
                    const due = firstDate ? shiftDateByFrequency(firstDate, frequency, i) : (dueDate || 'N/A');
                    const li = document.createElement('li');
                    li.textContent = `Installment ${i + 1}: ${amounts[i]} - Due: ${due}`;
                    ul.appendChild(li);
                }
                scheduleDiv.appendChild(ul);
                bulkAssignPreviewDiv.appendChild(scheduleDiv);
            }
            confirmBulkAssignBtn.disabled = false;
        }

    } catch (error) {
        console.error('Error previewing bulk assign:', error);
        showAppAlert('Error preparing preview: ' + error.message, 'danger');
    }
}

// Perform bulk assign with batching and progress updates
async function performBulkAssign() {
    const className = bulkClassSelect.value;
    const amount = parseFloat(bulkAmountInput.value || '0');
    const dueDate = bulkDueDateInput.value || null;
    const notes = bulkNotesInput.value.trim() || '';
    const skipExisting = bulkSkipExistingCheckbox.checked;

    if (!className) { showAppAlert('Please select a class.', 'danger'); return; }
    if (!amount || amount <= 0) { showAppAlert('Please enter a valid amount.', 'danger'); return; }

    if (!confirm(`Are you sure you want to assign amount ${amount} to all students in ${className}?`)) return;

    try {
        const studentsSnapshot = await db.collection('students').where('class', '==', className).get();
        if (studentsSnapshot.empty) { showAppAlert('No students found for this class.', 'warning'); return; }
        const students = studentsSnapshot.docs.map(d => d.data());

        // Filter based on skipExisting
        let targets = students;
        if (skipExisting) {
            const checks = await Promise.all(students.map(async (s) => {
                const feesSnap = await db.collection('fees')
                    .where('studentId', '==', s.id)
                    .where('status', 'in', ['Unpaid', 'Partial'])
                    .get();
                const hasSame = feesSnap.docs.some(fdoc => Number(fdoc.data().amount || 0) === amount);
                return { student: s, skip: hasSame };
            }));
            targets = checks.filter(c => !c.skip).map(c => c.student);
        }

        if (targets.length === 0) { showAppAlert('No students to assign after applying filters.', 'warning'); return; }

        // Batch writes (Firestore batches limited to 500 ops)
        const BATCH_LIMIT = 450; // keep a safe margin
        let created = 0;
        let failed = 0;

        bulkAssignPreviewDiv.innerHTML = `<p>Assigning to ${targets.length} students. Progress will appear below.</p><div id="bulkProgress" style="margin-top:0.5rem;"></div>`;
        const bulkProgressDiv = document.getElementById('bulkProgress');

        for (let i = 0; i < targets.length; i += BATCH_LIMIT) {
            const chunk = targets.slice(i, i + BATCH_LIMIT);
            const batch = db.batch();
            chunk.forEach((s, idx) => {
                const docRef = db.collection('fees').doc();
                batch.set(docRef, {
                    studentId: s.id,
                    amount,
                    dueDate,
                    notes,
                    status: 'Unpaid',
                    assignedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // If installments requested, create schedule entries in the same batch
                const installments = bulkInstallmentsInput ? parseInt(bulkInstallmentsInput.value || '1') : 1;
                const frequency = bulkFrequencySelect ? bulkFrequencySelect.value : 'monthly';
                const firstDate = bulkFirstDueDateInput ? bulkFirstDueDateInput.value : '';
                if (installments > 1) {
                    const parts = splitAmountIntoInstallments(amount, installments);
                    for (let k = 0; k < installments; k++) {
                        const scheduleRef = docRef.collection('schedule').doc();
                        const due = firstDate ? shiftDateByFrequency(firstDate, frequency, k) : (dueDate || null);
                        batch.set(scheduleRef, {
                            installmentNumber: k + 1,
                            amount: parts[k],
                            dueDate: due,
                            status: 'Pending',
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    }
                }
            });

            try {
                await batch.commit();
                created += chunk.length;
                bulkProgressDiv.innerHTML += `<div>Batch ${Math.floor(i / BATCH_LIMIT) + 1}: created ${chunk.length} fees.</div>`;
                try {
                    await logAuditEventClient({ action: 'bulkAssignChunk', className, amount, created: chunk.length });
                } catch (e) { console.warn('audit log failed', e); }
            } catch (error) {
                console.error('Error committing batch:', error);
                failed += chunk.length;
                bulkProgressDiv.innerHTML += `<div style="color:var(--danger);">Batch ${Math.floor(i / BATCH_LIMIT) + 1} failed: ${error.message}</div>`;
            }
        }

        showAppAlert(`Bulk assign complete. Created: ${created}. Failed: ${failed}.`);
        loadAndDisplayFees();
        confirmBulkAssignBtn.disabled = true;
    } catch (error) {
        console.error('Error performing bulk assign:', error);
        showAppAlert('Error performing bulk assign: ' + error.message, 'danger');
    }
}

// Wire up preview/confirm buttons and populate class select on DOM ready
if (previewBulkAssignBtn) previewBulkAssignBtn.addEventListener('click', previewBulkAssign);
if (confirmBulkAssignBtn) confirmBulkAssignBtn.addEventListener('click', performBulkAssign);
document.addEventListener('DOMContentLoaded', () => {
    populateBulkClassSelect();
});

// When a student is selected, show fee options and assignment button
if (assignFeeStudentSelect) {
    assignFeeStudentSelect.addEventListener('change', async (e) => {
        const studentId = e.target.value;
        studentFeeAssignmentDetails.innerHTML = '';
        if (!studentId) return;

        try {
            const studentDoc = await db.collection('students').doc(studentId).get();
            const student = studentDoc.exists ? studentDoc.data() : null;

            // Fetch fee structure for student's class (if exists)
            let suggestedAmount = '';
            if (student && student.class) {
                const fsDoc = await db.collection('feeStructures').doc(student.class).get();
                if (fsDoc.exists) suggestedAmount = fsDoc.data().amount || '';
            }

            studentFeeAssignmentDetails.innerHTML = `
                <div class="form-group">
                    <label>Student:</label>
                    <div><strong>${student ? student.name : studentId} (${studentId})</strong></div>
                </div>
                <div class="form-group">
                    <label for="assignAmount">Amount:</label>
                    <input type="number" id="assignAmount" class="form-control" value="${suggestedAmount}" min="0">
                </div>
                <div class="form-group">
                    <label for="assignDueDate">Due Date:</label>
                    <input type="date" id="assignDueDate" class="form-control">
                </div>
                <div class="form-group">
                    <label for="assignInstallments">Installments (count):</label>
                    <input type="number" id="assignInstallments" class="form-control" min="1" value="1">
                </div>
                <div class="form-group">
                    <label for="assignFrequency">Frequency:</label>
                    <select id="assignFrequency" class="form-control">
                        <option value="monthly">Monthly</option>
                        <option value="weekly">Weekly</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="assignFirstDueDate">First Installment Date:</label>
                    <input type="date" id="assignFirstDueDate" class="form-control">
                </div>
                <div class="form-group">
                    <label for="assignNotes">Notes:</label>
                    <textarea id="assignNotes" class="form-control" rows="3"></textarea>
                </div>
                <button class="btn btn-primary" id="assignFeeBtn">Assign Fee</button>
            `;

            document.getElementById('assignFeeBtn').addEventListener('click', async () => {
                const amountEl = document.getElementById('assignAmount');
                const dueEl = document.getElementById('assignDueDate');
                const installmentsEl = document.getElementById('assignInstallments');
                const frequencyEl = document.getElementById('assignFrequency');
                const firstDueEl = document.getElementById('assignFirstDueDate');
                const notesEl = document.getElementById('assignNotes');

                const amount = parseFloat(amountEl.value || '0');
                const dueDate = dueEl.value;
                const installments = installmentsEl ? parseInt(installmentsEl.value || '1') : 1;
                const frequency = frequencyEl ? frequencyEl.value : 'monthly';
                const firstDue = firstDueEl ? firstDueEl.value : '';
                const notes = notesEl.value.trim();

                if (!amount || amount <= 0) {
                    showAppAlert('Please enter a valid amount to assign.', 'danger');
                    return;
                }

                // Create a fee assignment record with status 'Unpaid'
                try {
                    const feeRef = db.collection('fees').doc();
                    const batch = db.batch();
                    batch.set(feeRef, {
                        studentId,
                        amount,
                        dueDate: dueDate || null,
                        notes: notes || '',
                        status: 'Unpaid',
                        assignedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });

                    // Create schedule entries if installments > 1
                    if (installments > 1) {
                        const parts = splitAmountIntoInstallments(amount, installments);
                        for (let k = 0; k < installments; k++) {
                            const scheduleRef = feeRef.collection('schedule').doc();
                            const due = firstDue ? shiftDateByFrequency(firstDue, frequency, k) : (dueDate || null);
                            batch.set(scheduleRef, {
                                installmentNumber: k + 1,
                                amount: parts[k],
                                dueDate: due,
                                status: 'Pending',
                                createdAt: firebase.firestore.FieldValue.serverTimestamp()
                            });
                        }
                    }

                    await batch.commit();
                    // Audit
                    try {
                        await logAuditEventClient({ action: 'assignFee', feeId: feeRef.id, studentId, amount, installments: installments || 1 });
                    } catch (e) { console.warn('audit log failed', e); }
                    showAppAlert('Fee assigned successfully!');
                    studentFeeAssignmentDetails.innerHTML = '';
                    assignFeeStudentSelect.value = '';
                    loadAndDisplayFees();
                } catch (error) {
                    console.error('Error assigning fee:', error);
                    showAppAlert('Error assigning fee: ' + error.message, 'danger');
                }
            });

        } catch (error) {
            console.error('Error preparing assignment UI:', error);
            showAppAlert('Error preparing assignment UI: ' + error.message, 'danger');
        }
    });
}

// Initialize class filters on page load
document.addEventListener('DOMContentLoaded', () => {
    populateClassFilters();

    // Set initial visibility based on default selection
    if (attendanceTypeSelect && attendanceTypeSelect.value === 'student') {
        if (classFilterGroup) classFilterGroup.style.display = 'block';
    }
});

async function loadDailyAttendance() {
    const type = attendanceTypeSelect.value;
    const date = attendanceDateInput.value;
    const query = attendanceSearch.value.toLowerCase();
    const selectedClass = attendanceClassFilter.value;

    const collectionName = `${type}s`;
    const attendanceCollectionName = `${type}Attendance`;

    if (!date) return;

    try {
        const snapshot = await db.collection(collectionName).get();
        let entities = snapshot.docs.map(doc => doc.data());

        // Fetch today's attendance records
        const attendanceSnapshot = await db.collection(attendanceCollectionName)
            .where('date', '==', date)
            .get();
        const attendanceRecords = attendanceSnapshot.docs.reduce((acc, doc) => {
            const data = doc.data();
            acc[data[`${type}Id`]] = data.status;
            // Also store the note if it exists
            if (data.note) {
                acc[data[`${type}Id`] + '_note'] = data.note;
            }
            return acc;
        }, {});

        // Filter entities by search query and class
        entities = entities.filter(entity => {
            const entityId = entity.id ? String(entity.id).toLowerCase() : '';
            const entityName = entity.name ? String(entity.name).toLowerCase() : '';
            const matchesSearch = entityId.includes(query) || entityName.includes(query);

            const matchesClass = !selectedClass || (entity.class && String(entity.class) === selectedClass);

            return matchesSearch && matchesClass;
        });

        renderAttendanceTable(entities, attendanceRecords, type);

    } catch (error) {
        console.error("Error loading daily attendance:", error);
        showAppAlert('Error loading attendance: ' + error.message, 'danger');
    }
}

function renderAttendanceTable(entities, attendanceRecords, type) {
    attendanceTableBody.innerHTML = '';
    if (entities.length === 0) {
        attendanceTableBody.innerHTML = `<tr><td colspan="5">No ${type}s found matching search criteria for this date.</td></tr>`;
        return;
    }

    entities.forEach(entity => {
        const status = attendanceRecords[entity.id] || 'NA';
        const note = attendanceRecords[entity.id + '_note'] || '';
        const hasNote = note && note.trim() !== '';

        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>${entity.id ?? 'N/A'}</td>
                    <td>${entity.name ?? 'N/A'}</td>
                    <td>
                        <span class="status-badge status-${status.toLowerCase()}">${status}</span>
                    </td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-success btn-sm ${status === 'P' ? 'present-marked' : ''}" onclick="markAttendance('${type}', '${entity.id ?? ''}', 'P', this)">Present</button>
                            <button class="btn btn-danger btn-sm ${status === 'A' ? 'absent-marked' : ''}" onclick="markAttendance('${type}', '${entity.id ?? ''}', 'A', this)">Absent</button>
                            <button class="btn btn-warning btn-sm ${status === 'L' ? 'late-marked' : ''}" onclick="markAttendance('${type}', '${entity.id ?? ''}', 'L', this)">Late</button>
                            <button class="btn btn-secondary btn-sm" onclick="clearAttendance('${type}', '${entity.id ?? ''}', '${attendanceDateInput.value}')" title="Clear attendance">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </td>
                    <td>
                        <button class="btn btn-info btn-sm ${hasNote ? 'has-note' : ''}"
                                onclick="openAttendanceNoteModal('${type}', '${entity.id ?? ''}', '${entity.name ?? 'N/A'}', '${attendanceDateInput.value}')"
                                title="${hasNote ? 'View/Edit Note' : 'Add Note'}">
                            📝 ${hasNote ? 'View Note' : 'Add Note'}
                        </button>
                    </td>
                `;
        attendanceTableBody.appendChild(row);
    });
}

async function markAttendance(type, id, status, button) {
    const date = attendanceDateInput.value;
    if (!id || String(id).trim() === '') { // Add defensive check
        showAppAlert('Cannot mark attendance: Entity ID is missing or invalid.', 'danger');
        return;
    }
    const attendanceCollectionName = `${type}Attendance`;
    const docRef = db.collection(attendanceCollectionName).doc(`${date}-${id}`);
    const data = {
        date,
        status,
        markedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    data[`${type}Id`] = id;

    try {
        await docRef.set(data, { merge: true });
        showAppAlert(`Attendance marked for ${id ?? 'N/A'}: ${status}`);
        loadDailyAttendance();
        loadStatistics(); // Add this to refresh the dashboard charts after marking attendance
    }
    // Catch and display permission denied errors separately
    catch (error) {
        if (error.code === 'permission-denied') {
            showAppAlert('Permission denied. Check your Firebase security rules for write access to ' + attendanceCollectionName, 'danger');
        } else {
            console.error("Error marking attendance:", error);
            showAppAlert('Error marking attendance: ' + error.message, 'danger');
        }
    }
}

async function clearAttendance(type, id, date) {
    if (!confirm('Are you sure you want to clear the attendance status for this person?')) {
        return;
    }

    const attendanceCollectionName = `${type}Attendance`;
    const docRef = db.collection(attendanceCollectionName).doc(`${date}-${id}`);

    try {
        await docRef.delete();
        showAppAlert('Attendance cleared successfully');
        loadDailyAttendance();
        loadStatistics();
    } catch (error) {
        console.error('Error clearing attendance:', error);
        showAppAlert('Error clearing attendance: ' + error.message, 'danger');
    }
}

// --- ATTENDANCE NOTE FUNCTIONS ---

let currentNoteContext = null; // Store current note context

async function openAttendanceNoteModal(type, id, name, date) {
    currentNoteContext = { type, id, name, date };

    // Update modal info
    document.getElementById('noteEntityName').textContent = name;
    document.getElementById('noteDate').textContent = date;

    // Fetch existing note if any
    const attendanceCollectionName = `${type}Attendance`;
    const docRef = db.collection(attendanceCollectionName).doc(`${date}-${id}`);

    try {
        const doc = await docRef.get();
        const noteText = doc.exists && doc.data().note ? doc.data().note : '';

        const noteTextarea = document.getElementById('attendanceNoteText');
        noteTextarea.value = noteText;
        updateNoteCharCount();

        // Show/hide delete button based on whether note exists
        const deleteBtn = document.getElementById('deleteAttendanceNoteBtn');
        if (deleteBtn) {
            deleteBtn.style.display = noteText ? 'block' : 'none';
        }

        // Show modal
        document.getElementById('attendanceNoteModal').style.display = 'flex';
    } catch (error) {
        console.error('Error fetching note:', error);
        showAppAlert('Error loading note: ' + error.message, 'danger');
    }
}

function updateNoteCharCount() {
    const noteTextarea = document.getElementById('attendanceNoteText');
    const charCount = document.getElementById('noteCharCount');
    charCount.textContent = noteTextarea.value.length;
}

async function saveAttendanceNote() {
    if (!currentNoteContext) {
        showAppAlert('Error: No note context available', 'danger');
        return;
    }

    const { type, id, date } = currentNoteContext;
    const noteText = document.getElementById('attendanceNoteText').value.trim();

    const attendanceCollectionName = `${type}Attendance`;
    const docRef = db.collection(attendanceCollectionName).doc(`${date}-${id}`);

    try {
        // Update the note field in the attendance record
        await docRef.set({
            note: noteText
        }, { merge: true });

        showAppAlert('Note saved successfully!');
        closeModal('attendanceNoteModal');
        loadDailyAttendance(); // Refresh the table to show note indicator
    } catch (error) {
        console.error('Error saving note:', error);
        showAppAlert('Error saving note: ' + error.message, 'danger');
    }
}

async function deleteAttendanceNote() {
    if (!currentNoteContext) {
        showAppAlert('Error: No note context available', 'danger');
        return;
    }

    if (!confirm('Are you sure you want to delete this note?')) {
        return;
    }

    const { type, id, date } = currentNoteContext;
    const attendanceCollectionName = `${type}Attendance`;
    const docRef = db.collection(attendanceCollectionName).doc(`${date}-${id}`);

    try {
        // Remove the note field from the attendance record
        await docRef.update({
            note: firebase.firestore.FieldValue.delete()
        });

        showAppAlert('Note deleted successfully!');
        closeModal('attendanceNoteModal');
        loadDailyAttendance(); // Refresh the table
    } catch (error) {
        console.error('Error deleting note:', error);
        showAppAlert('Error deleting note: ' + error.message, 'danger');
    }
}

// Setup note modal event listeners
document.addEventListener('DOMContentLoaded', () => {
    const noteTextarea = document.getElementById('attendanceNoteText');
    const saveNoteBtn = document.getElementById('saveAttendanceNoteBtn');
    const deleteNoteBtn = document.getElementById('deleteAttendanceNoteBtn');

    if (noteTextarea) {
        noteTextarea.addEventListener('input', updateNoteCharCount);
    }

    if (saveNoteBtn) {
        saveNoteBtn.addEventListener('click', saveAttendanceNote);
    }

    if (deleteNoteBtn) {
        deleteNoteBtn.addEventListener('click', deleteAttendanceNote);
    }
});

// --- ATTENDANCE REPORTING ---
attendanceReportType.addEventListener('change', loadAttendanceReportTable);
attendanceReportDate.addEventListener('change', loadAttendanceReportTable);
attendanceReportClassFilter.addEventListener('change', loadAttendanceReportTable);

async function loadAttendanceReportTable() {
    const reportType = attendanceReportType.value;
    const reportDate = attendanceReportDate.value;
    const reportClass = attendanceReportClassFilter.value;

    if (!reportDate) {
        showAppAlert('Please select a date to view the attendance records.', 'danger');
        return;
    }

    const attendanceCollectionName = `${reportType}Attendance`;
    const entitiesCollectionName = `${reportType}s`;

    try {
        // Fetch attendance records for the selected date
        let attendanceQuery = db.collection(attendanceCollectionName).where('date', '==', reportDate);
        const attendanceSnapshot = await attendanceQuery.get();
        let attendanceRecords = attendanceSnapshot.docs.map(doc => doc.data());

        // Fetch all entities (students/teachers) to get their names
        const entitySnapshot = await db.collection(entitiesCollectionName).get();
        const entities = entitySnapshot.docs.reduce((acc, doc) => {
            acc[doc.id] = doc.data();
            return acc;
        }, {});

        // Combine data and filter by class if selected
        const combinedData = attendanceRecords.map(record => {
            const entity = entities[record[`${reportType}Id`]];
            const className = entity && entity.class ? entity.class : 'N/A';
            return {
                id: record[`${reportType}Id`],
                name: entity ? entity.name : 'N/A',
                date: record.date,
                status: record.status,
                class: className
            };
        }).filter(record => {
            return !reportClass || record.class === reportClass;
        });

        renderReportTable(combinedData);

    } catch (error) {
        console.error("Error loading attendance report table:", error);
        showAppAlert('Error loading attendance records: ' + error.message, 'danger');
    }
}

function renderReportTable(data) {
    reportTableBody.innerHTML = '';
    if (data.length === 0) {
        reportTableBody.innerHTML = `<tr><td colspan="4">No attendance records found for this date and class.</td></tr>`;
        reportTable.style.display = 'table';
        return;
    }

    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>${item.id ?? 'N/A'}</td>
                    <td>${item.name ?? 'N/A'}</td>
                    <td>${item.date ?? 'N/A'}</td>
                    <td><span class="status-badge status-${item.status.toLowerCase()}">${item.status}</span></td>
                `;
        reportTableBody.appendChild(row);
    });
    reportTable.style.display = 'table';
}


async function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const reportId = document.getElementById('reportId').value.trim();
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;

    if (!startDate || !endDate) {
        showAppAlert('Please select a start and end date.', 'danger');
        return;
    }

    const attendanceCollectionName = `${reportType}Attendance`;
    let queryRef = db.collection(attendanceCollectionName)
        .where('date', '>=', startDate)
        .where('date', '<=', endDate);

    // Fetch data from Firestore without filtering by ID to avoid index issues
    try {
        const snapshot = await queryRef.get();
        let data = snapshot.docs.map(doc => doc.data());

        // Now filter by reportId in JavaScript memory if reportId is provided
        if (reportId) {
            data = data.filter(record =>
                record[`${reportType}Id`] && String(record[`${reportType}Id`]).trim().toLowerCase() === String(reportId).trim().toLowerCase()
            );
        }

        if (data.length === 0) {
            showAppAlert('No attendance records found for the selected criteria.', 'warning');
            return;
        }

        // To get the student/teacher name, we need to fetch all entities first
        const entityCollection = db.collection(`${reportType}s`);
        const entitySnapshot = await entityCollection.get();
        const entities = entitySnapshot.docs.reduce((acc, doc) => {
            acc[doc.id] = doc.data();
            return acc;
        }, {});

        // Add name to each attendance record
        const dataWithNames = data.map(record => {
            const entity = entities[record[`${reportType}Id`]];
            if (entity) {
                return { ...record, name: entity.name };
            }
            return { ...record, name: 'N/A' };
        });

        // Dynamically get headers ensuring 'markedAt' is always last if present
        let headers = new Set();
        dataWithNames.forEach(row => {
            Object.keys(row).forEach(key => headers.add(key));
        });
        // Prioritize ID and Name, then sort the rest
        let sortedHeaders = ['id', 'name', 'date', 'status']; // Manually order key headers
        let otherHeaders = Array.from(headers).filter(h => !sortedHeaders.includes(h)).sort();
        headers = [...sortedHeaders, ...otherHeaders];


        const csvRows = [
            headers.join(','),
            ...dataWithNames.map(row => headers.map(header => {
                let value = row[header];
                if (header === 'markedAt' && value && value.toDate) {
                    value = value.toDate().toLocaleString(); // Convert Firebase Timestamp to readable string
                }
                return `"${String(value ?? '').replace(/"/g, '""')}"`; // Handle commas and quotes in string data
            }).join(','))
        ];
        const csvString = csvRows.join('\n');

        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${reportType}_attendance_report_${startDate}_to_${endDate}${reportId ? '_' + reportId : ''}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        showAppAlert('Attendance report downloaded successfully!');

    } catch (error) {
        console.error("Error generating report:", error);
        showAppAlert('Error generating report: ' + error.message, 'danger');
    }
}

// --- STATISTICS FOR DASHBOARD ---

async function loadStatistics() {
    db.collection('teachers').get().then(querySnapshot => {
        document.getElementById('teacherCount').textContent = querySnapshot.size;
    }).catch(error => console.error("Error fetching teacher count:", error));

    const studentsSnapshot = await db.collection('students').get();
    const students = studentsSnapshot.docs.map(doc => doc.data());
    const studentCount = students.length;
    document.getElementById('studentCount').textContent = studentCount;

    const today = new Date().toISOString().split('T')[0];
    const attendanceSnapshot = await db.collection('studentAttendance').where('date', '==', today).get();
    const attendanceRecords = attendanceSnapshot.docs.map(doc => doc.data());
    const presentStudentsCount = attendanceRecords.filter(doc => doc.status === 'P').length;
    document.getElementById('attendanceCount').textContent = presentStudentsCount;

    // --- New Dashboard Feature: Class-wise Attendance Charts ---
    const classCounts = students.reduce((acc, student) => {
        if (student.class) {
            acc[student.class] = (acc[student.class] || 0) + 1;
        }
        return acc;
    }, {});

    const attendanceCounts = attendanceRecords.reduce((acc, record) => {
        // FIX: Use case-insensitive matching for student IDs
        const student = students.find(s => s.id && record.studentId && s.id.toLowerCase() === record.studentId.toLowerCase());
        if (student && record.status === 'P') {
            if (student.class) {
                acc[student.class] = (acc[student.class] || 0) + 1;
            }
        }
        return acc;
    }, {});

    // Clear old charts
    classAttendanceCharts.innerHTML = '';
    for (let chart in classCharts) {
        if (classCharts[chart]) {
            classCharts[chart].destroy();
        }
    }
    classCharts = {};

    const sortedClasses = Object.keys(classCounts).sort();

    sortedClasses.forEach(className => {
        const total = classCounts[className];
        const present = attendanceCounts[className] || 0;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
                    <div class="chart-container">
                        <canvas id="chart-${className.replace(/\s/g, '-')}-canvas"></canvas>
                        <div class="chart-text">
                            <span>${percentage}%</span>
                            <p>Class ${className}</p>
                        </div>
                    </div>
                `;
        classAttendanceCharts.appendChild(card);

        const ctx = document.getElementById(`chart-${className.replace(/\s/g, '-')}-canvas`).getContext('2d');
        classCharts[className] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [percentage, 100 - percentage],
                    backgroundColor: [varToString('--success'), varToString('--light')],
                    borderWidth: 0,
                }]
            },
            options: {
                cutout: '70%',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        enabled: false
                    },
                    legend: {
                        display: false
                    }
                }
            }
        });
    });
}

function varToString(variable) {
    return getComputedStyle(document.documentElement).getPropertyValue(variable);
}



// --- TEACHER ANALYTICS FUNCTIONS ---

async function loadTeacherAnalytics() {
    const startDate = analyticsStartDateInput.value;
    const endDate = analyticsEndDateInput.value;

    if (!startDate || !endDate) {
        showAppAlert('Please select both start and end dates for analytics.', 'danger');
        return;
    }

    teacherAnalyticsResultsDiv.innerHTML = 'Loading analytics...';

    try {
        // 1. Get all teachers
        const teachersSnapshot = await db.collection('teachers').get();
        const teachers = teachersSnapshot.docs.map(doc => doc.data());

        if (teachers.length === 0) {
            teacherAnalyticsResultsDiv.innerHTML = '<p>No teachers found to generate analytics.</p>';
            return;
        }

        // 2. Get all teacher attendance records within the date range
        const attendanceSnapshot = await db.collection('teacherAttendance')
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .get();
        const attendanceRecords = attendanceSnapshot.docs.map(doc => doc.data());

        // 3. Get working days from calendar events within the date range
        const calendarEventsSnapshot = await db.collection('calendarEvents')
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .get();
        const calendarEvents = {};
        calendarEventsSnapshot.forEach(doc => {
            const data = doc.data();
            calendarEvents[data.date] = data.type;
        });

        // Calculate total working days in the period
        let totalWorkingDays = 0;
        let currentDate = new Date(startDate);
        const end = new Date(endDate);

        while (currentDate <= end) {
            const dateString = currentDate.toISOString().split('T')[0];
            const dayOfWeek = currentDate.getDay(); // 0=Sunday, 6=Saturday

            // Check if it's a weekend (Saturday or Sunday)
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

            // Check calendar event for the day
            const eventType = calendarEvents[dateString];

            if (eventType === 'working-day') {
                totalWorkingDays++;
            } else if (eventType === 'holiday') {
                // This day is a holiday, do not count as working day
            } else if (!isWeekend) {
                // If no specific event and not a weekend, it's a working day by default
                totalWorkingDays++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        const analyticsData = {};

        teachers.forEach(teacher => {
            analyticsData[teacher.id] = {
                name: teacher.name,
                workingDays: totalWorkingDays,
                presentDays: 0,
                absentDays: 0,
                lateDays: 0,
                attendancePercentage: 0
            };
        });

        attendanceRecords.forEach(record => {
            const teacherId = record.teacherId;
            if (analyticsData[teacherId]) {
                if (record.status === 'P') {
                    analyticsData[teacherId].presentDays++;
                } else if (record.status === 'A') {
                    analyticsData[teacherId].absentDays++;
                } else if (record.status === 'L') {
                    analyticsData[teacherId].lateDays++;
                }
            }
        });

        // Calculate attendance percentage
        Object.values(analyticsData).forEach(data => {
            if (data.workingDays > 0) {
                data.attendancePercentage = ((data.presentDays + data.lateDays) / data.workingDays * 100).toFixed(2);
            } else {
                data.attendancePercentage = 'N/A';
            }
        });

        renderTeacherAnalytics(analyticsData);

    } catch (error) {
        console.error("Error loading teacher analytics:", error);
        showAppAlert('Error loading teacher analytics: ' + error.message, 'danger');
        teacherAnalyticsResultsDiv.innerHTML = '<p>Error loading analytics. Please try again.</p>';
    }
}

function renderTeacherAnalytics(data) {
    teacherAnalyticsResultsDiv.innerHTML = '';
    if (Object.keys(data).length === 0) {
        teacherAnalyticsResultsDiv.innerHTML = '<p>No analytics data available for the selected period.</p>';
        return;
    }

    Object.values(data).forEach(teacher => {
        const card = document.createElement('div');
        card.className = 'analytics-card';
        card.innerHTML = `
                    <h4>${teacher.name} </h4>
                    <div class="analytics-item">
                        <span>Total Working Days:</span>
                        <span>${teacher.workingDays}</span>
                    </div>
                    <div class="analytics-item">
                        <span>Present Days:</span>
                        <span>${teacher.presentDays}</span>
                    </div>
                    <div class="analytics-item">
                        <span>Absent Days:</span>
                        <span>${teacher.absentDays}</span>
                    </div>
                    <div class="analytics-item">
                        <span>Late Days:</span>
                        <span>${teacher.lateDays}</span>
                    </div>
                    <div class="analytics-item">
                        <span>Attendance Percentage:</span>
                        <span class="percentage ${parseFloat(teacher.attendancePercentage) < 75 ? 'low' : ''}">${teacher.attendancePercentage}%</span>
                    </div>
                `;
        teacherAnalyticsResultsDiv.appendChild(card);
    });
}

// Fee reconciliation and aging report
async function loadFeeAnalytics() {
    try {
        const feesSnapshot = await db.collection('fees').get();
        if (feesSnapshot.empty) {
            totalFeesCollectedEl.textContent = '0';
            totalPendingFeesEl.textContent = '0';
            return;
        }

        let totalCollected = 0;
        let totalPending = 0;
        const statusCounts = { Paid: 0, Partial: 0, Unpaid: 0 };
        const agingBuckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
        const today = new Date().toISOString().split('T')[0];

        const fees = await Promise.all(feesSnapshot.docs.map(async doc => ({ id: doc.id, ...(doc.data()) })));

        for (const f of fees) {
            const paid = f.paidAmount ? Number(f.paidAmount) : 0;
            const total = f.amount ? Number(f.amount) : 0;
            totalCollected += paid;
            const balance = Math.max(0, total - paid);
            totalPending += balance;
            const st = f.status || (balance === 0 ? 'Paid' : balance === total ? 'Unpaid' : 'Partial');
            statusCounts[st] = (statusCounts[st] || 0) + 1;

            if (balance > 0) {
                // determine days overdue by comparing dueDate (or date) with today
                const dueDate = f.dueDate || f.date || null;
                if (dueDate) {
                    const dDue = new Date(dueDate);
                    const dToday = new Date();
                    const diffDays = Math.floor((dToday - dDue) / (1000 * 60 * 60 * 24));
                    if (diffDays <= 30) agingBuckets['0-30'] += balance;
                    else if (diffDays <= 60) agingBuckets['31-60'] += balance;
                    else if (diffDays <= 90) agingBuckets['61-90'] += balance;
                    else agingBuckets['90+'] += balance;
                } else {
                    agingBuckets['0-30'] += balance; // no due date -> treat as current
                }
            }
        }

        totalFeesCollectedEl.textContent = totalCollected.toFixed(2);
        totalPendingFeesEl.textContent = totalPending.toFixed(2);

        // Render simple pie/doughnut chart for status
        if (feeStatusChartCanvas) {
            if (window._feeStatusChart) window._feeStatusChart.destroy();
            const ctx = feeStatusChartCanvas.getContext('2d');
            window._feeStatusChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Paid', 'Partial', 'Unpaid'],
                    datasets: [{ data: [statusCounts.Paid || 0, statusCounts.Partial || 0, statusCounts.Unpaid || 0], backgroundColor: ['#2ecc71', '#f1c40f', '#e74c3c'] }]
                }
            });
        }

        // Store last analytics snapshot for export
        window._feeAnalyticsSnapshot = { totalCollected, totalPending, statusCounts, agingBuckets, fees };
    } catch (error) {
        console.error('Error loading fee analytics:', error);
        showAppAlert('Error loading fee analytics: ' + error.message, 'danger');
    }
}

if (exportReconciliationBtn) exportReconciliationBtn.addEventListener('click', () => {
    const snap = window._feeAnalyticsSnapshot;
    if (!snap) { showAppAlert('Run analytics first (open the Analytics tab).', 'warning'); return; }

    // Export two CSVs in a ZIP-like concatenation (simple approach): reconciliation & aging
    try {
        const reconHeaders = ['feeId', 'studentId', 'studentName', 'amount', 'paidAmount', 'balance', 'dueDate', 'status'];
        const reconRows = [reconHeaders.join(',')];
        snap.fees.forEach(f => {
            const paid = f.paidAmount ? Number(f.paidAmount) : 0;
            const total = f.amount ? Number(f.amount) : 0;
            const balance = Math.max(0, total - paid);
            const studentName = f.studentName || '';
            reconRows.push([f.id, f.studentId, studentName, total, paid, balance, f.dueDate || f.date || '', f.status || ''].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
        });
        const reconCsv = reconRows.join('\n');

        const agingHeaders = ['bucket', 'amount'];
        const agingRows = [agingHeaders.join(',')];
        Object.keys(snap.agingBuckets).forEach(b => agingRows.push(`"${b}","${snap.agingBuckets[b]}"`));
        const agingCsv = agingRows.join('\n');

        // Provide downloads sequentially
        const blob1 = new Blob([reconCsv], { type: 'text/csv;charset=utf-8;' });
        const link1 = document.createElement('a');
        link1.href = URL.createObjectURL(blob1);
        link1.download = `reconciliation_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link1);
        link1.click();
        document.body.removeChild(link1);

        const blob2 = new Blob([agingCsv], { type: 'text/csv;charset=utf-8;' });
        const link2 = document.createElement('a');
        link2.href = URL.createObjectURL(blob2);
        link2.download = `aging_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link2);
        link2.click();
        document.body.removeChild(link2);

        showAppAlert('Reconciliation and aging CSVs exported.');
    } catch (error) {
        console.error('Error exporting reconciliation CSV:', error);
        showAppAlert('Error exporting reconciliation: ' + error.message, 'danger');
    }
});

async function downloadAnalyticsImage() {
    const startDate = analyticsStartDateInput.value;
    const endDate = analyticsEndDateInput.value;

    if (!startDate || !endDate) {
        showAppAlert('Please select both start and end dates for analytics.', 'danger');
        return;
    }

    const analyticsData = await getTeacherAnalyticsData(startDate, endDate);
    if (!analyticsData) {
        showAppAlert('No analytics data available to download.', 'warning');
        return;
    }

    const imageContainer = document.createElement('div');
    imageContainer.id = 'analytics-image-container';
    document.body.appendChild(imageContainer);

    renderTeacherAnalyticsForImage(analyticsData, imageContainer, startDate, endDate);

    html2canvas(imageContainer, {
        backgroundColor: '#f0f2f5',
        scale: 2, // Higher scale for better quality
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `teacher-analytics-${startDate}-to-${endDate}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        document.body.removeChild(imageContainer);
    });
}

function renderTeacherAnalyticsForImage(data, container, startDate, endDate) {
    container.innerHTML = ''; // Clear previous content
    container.style.padding = '2.5rem';
    container.style.backgroundColor = '#ffffff';
    container.style.border = '2px solid #7b2cbf';
    container.style.borderRadius = '12px';
    container.style.width = '1200px'; // Horizontal/landscape width
    container.style.fontFamily = "'Poppins', sans-serif";

    // Header section with logo and title
    const headerDiv = document.createElement('div');
    headerDiv.style.display = 'flex';
    headerDiv.style.alignItems = 'center';
    headerDiv.style.justifyContent = 'space-between';
    headerDiv.style.marginBottom = '2rem';
    headerDiv.style.paddingBottom = '1.5rem';
    headerDiv.style.borderBottom = '3px solid #7b2cbf';

    // Logo and organization name section (left side)
    const logoSection = document.createElement('div');
    logoSection.style.display = 'flex';
    logoSection.style.alignItems = 'center';
    logoSection.style.gap = '1rem';

    const logo = document.createElement('img');
    logo.src = 'Images/targetlogo.png';
    logo.alt = 'Target Foundation Center Logo';
    logo.style.width = '80px';
    logo.style.height = '80px';
    logo.style.objectFit = 'contain';
    logoSection.appendChild(logo);

    const orgInfo = document.createElement('div');
    const orgName = document.createElement('h3');
    orgName.textContent = 'TARGET FOUNDATION CENTER';
    orgName.style.color = '#7b2cbf';
    orgName.style.margin = '0';
    orgName.style.fontSize = '1.4rem';
    orgName.style.fontWeight = '700';
    orgInfo.appendChild(orgName);

    const reportType = document.createElement('p');
    reportType.textContent = 'Teacher Attendance Analytics Report';
    reportType.style.color = '#666';
    reportType.style.margin = '0.3rem 0 0 0';
    reportType.style.fontSize = '0.95rem';
    orgInfo.appendChild(reportType);

    logoSection.appendChild(orgInfo);
    headerDiv.appendChild(logoSection);

    // Date range section (right side)
    const dateSection = document.createElement('div');
    dateSection.style.textAlign = 'right';

    const date = new Date(startDate);
    const monthName = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    const timeDiff = new Date(endDate) - new Date(startDate);
    const noOfDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;

    const periodTitle = document.createElement('h4');
    periodTitle.textContent = `${monthName} ${year}`;
    periodTitle.style.color = '#333';
    periodTitle.style.margin = '0';
    periodTitle.style.fontSize = '1.2rem';
    periodTitle.style.fontWeight = '600';
    dateSection.appendChild(periodTitle);

    const daysInfo = document.createElement('p');
    daysInfo.textContent = `${noOfDays} Working Days`;
    daysInfo.style.color = '#666';
    daysInfo.style.margin = '0.3rem 0 0 0';
    daysInfo.style.fontSize = '0.9rem';
    dateSection.appendChild(daysInfo);

    const dateRange = document.createElement('p');
    dateRange.textContent = `${startDate} to ${endDate}`;
    dateRange.style.color = '#999';
    dateRange.style.margin = '0.2rem 0 0 0';
    dateRange.style.fontSize = '0.85rem';
    dateSection.appendChild(dateRange);

    headerDiv.appendChild(dateSection);
    container.appendChild(headerDiv);

    // Teachers data section - horizontal cards
    const dataSection = document.createElement('div');
    dataSection.style.display = 'flex';
    dataSection.style.flexDirection = 'column';
    dataSection.style.gap = '1.2rem';

    Object.values(data).forEach((teacher, index) => {
        const card = document.createElement('div');
        card.style.border = '2px solid #e0e0e0';
        card.style.borderRadius = '10px';
        card.style.padding = '1.2rem 1.5rem';
        card.style.backgroundColor = index % 2 === 0 ? '#f3e5f5' : '#e3f2fd';
        card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
        card.style.transition = 'all 0.3s ease';

        // Teacher name header
        const nameHeader = document.createElement('div');
        nameHeader.style.marginBottom = '1rem';
        nameHeader.style.paddingBottom = '0.8rem';
        nameHeader.style.borderBottom = '2px solid #7b2cbf';

        const teacherName = document.createElement('h4');
        teacherName.textContent = teacher.name;
        teacherName.style.color = '#7b2cbf';
        teacherName.style.margin = '0';
        teacherName.style.fontSize = '1.15rem';
        teacherName.style.fontWeight = '600';
        nameHeader.appendChild(teacherName);
        card.appendChild(nameHeader);

        // Data grid - horizontal layout
        const dataGrid = document.createElement('div');
        dataGrid.style.display = 'grid';
        dataGrid.style.gridTemplateColumns = 'repeat(5, 1fr)';
        dataGrid.style.gap = '1rem';
        dataGrid.style.alignItems = 'center';

        const items = [
            { label: 'Working Days', value: teacher.workingDays, icon: '📅' },
            { label: 'Present', value: teacher.presentDays, icon: '✅' },
            { label: 'Absent', value: teacher.absentDays, icon: '❌' },
            { label: 'Late', value: teacher.lateDays, icon: '⏰' },
            { label: 'Attendance %', value: `${teacher.attendancePercentage}%`, icon: '📊' }
        ];

        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.style.textAlign = 'center';
            itemDiv.style.padding = '0.8rem';
            itemDiv.style.backgroundColor = '#ffffff';
            itemDiv.style.borderRadius = '8px';
            itemDiv.style.border = '1px solid #e0e0e0';

            const iconSpan = document.createElement('div');
            iconSpan.textContent = item.icon;
            iconSpan.style.fontSize = '1.5rem';
            iconSpan.style.marginBottom = '0.3rem';
            itemDiv.appendChild(iconSpan);

            const valueSpan = document.createElement('div');
            valueSpan.textContent = item.value;
            valueSpan.style.fontSize = '1.3rem';
            valueSpan.style.fontWeight = '700';
            valueSpan.style.marginBottom = '0.2rem';

            if (item.label === 'Attendance %') {
                const percentage = parseFloat(teacher.attendancePercentage);
                if (percentage >= 90) {
                    valueSpan.style.color = '#28a745'; // Green for excellent
                } else if (percentage >= 75) {
                    valueSpan.style.color = '#ffc107'; // Yellow for good
                } else {
                    valueSpan.style.color = '#dc3545'; // Red for needs improvement
                }
            } else {
                valueSpan.style.color = '#333';
            }
            itemDiv.appendChild(valueSpan);

            const labelSpan = document.createElement('div');
            labelSpan.textContent = item.label;
            labelSpan.style.fontSize = '0.75rem';
            labelSpan.style.color = '#666';
            labelSpan.style.fontWeight = '500';
            labelSpan.style.textTransform = 'uppercase';
            labelSpan.style.letterSpacing = '0.5px';
            itemDiv.appendChild(labelSpan);

            dataGrid.appendChild(itemDiv);
        });

        card.appendChild(dataGrid);
        dataSection.appendChild(card);
    });

    container.appendChild(dataSection);

    // Footer with generation timestamp
    const footer = document.createElement('div');
    footer.style.marginTop = '2rem';
    footer.style.paddingTop = '1rem';
    footer.style.borderTop = '2px solid #e0e0e0';
    footer.style.textAlign = 'center';
    footer.style.color = '#999';
    footer.style.fontSize = '0.8rem';

    const timestamp = new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata'
    });
    footer.textContent = `Generated on ${timestamp}`;
    container.appendChild(footer);
}

async function getTeacherAnalyticsData(startDate, endDate) {
    try {
        const teachersSnapshot = await db.collection('teachers').get();
        const teachers = teachersSnapshot.docs.map(doc => doc.data());

        if (teachers.length === 0) {
            return null;
        }

        const attendanceSnapshot = await db.collection('teacherAttendance')
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .get();
        const attendanceRecords = attendanceSnapshot.docs.map(doc => doc.data());

        const calendarEventsSnapshot = await db.collection('calendarEvents')
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .get();
        const calendarEvents = {};
        calendarEventsSnapshot.forEach(doc => {
            const data = doc.data();
            calendarEvents[data.date] = data.type;
        });

        let totalWorkingDays = 0;
        let currentDate = new Date(startDate);
        const end = new Date(endDate);

        while (currentDate <= end) {
            const dateString = currentDate.toISOString().split('T')[0];
            const dayOfWeek = currentDate.getDay();
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
            const eventType = calendarEvents[dateString];

            if (eventType === 'working-day') {
                totalWorkingDays++;
            } else if (eventType !== 'holiday' && !isWeekend) {
                totalWorkingDays++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        const analyticsData = {};
        teachers.forEach(teacher => {
            analyticsData[teacher.id] = {
                name: teacher.name,
                workingDays: totalWorkingDays,
                presentDays: 0,
                absentDays: 0,
                lateDays: 0,
                attendancePercentage: 0
            };
        });

        attendanceRecords.forEach(record => {
            const teacherId = record.teacherId;
            if (analyticsData[teacherId]) {
                if (record.status === 'P') {
                    analyticsData[teacherId].presentDays++;
                } else if (record.status === 'A') {
                    analyticsData[teacherId].absentDays++;
                } else if (record.status === 'L') {
                    analyticsData[teacherId].lateDays++;
                }
            }
        });

        Object.values(analyticsData).forEach(data => {
            if (data.workingDays > 0) {
                data.attendancePercentage = ((data.presentDays + data.lateDays) / data.workingDays * 100).toFixed(2);
            } else {
                data.attendancePercentage = 'N/A';
            }
        });

        return analyticsData;

    } catch (error) {
        console.error("Error getting teacher analytics data:", error);
        showAppAlert('Error getting teacher analytics data: ' + error.message, 'danger');
        return null;
    }
}

// --- FEE MANAGEMENT ---

feeStructureForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const className = feeStructureClass.value.trim();
    const amount = feeStructureAmount.value.trim();

    if (!className || !amount) {
        showAppAlert('Class and Amount are required.', 'danger');
        return;
    }

    try {
        await db.collection('feeStructures').doc(className).set({
            amount: parseFloat(amount)
        });
        showAppAlert('Fee structure saved successfully!');
        feeStructureForm.reset();
        loadAndDisplayFeeStructures();
    } catch (error) {
        console.error("Error saving fee structure:", error);
        showAppAlert('Error saving fee structure: ' + error.message, 'danger');
    }
});

async function loadAndDisplayFeeStructures() {
    const feeStructuresRef = db.collection('feeStructures');
    const snapshot = await feeStructuresRef.get();
    const feeStructures = snapshot.docs.map(doc => ({ class: doc.id, ...doc.data() }));

    feeStructureTableBody.innerHTML = '';
    if (feeStructures.length === 0) {
        feeStructureTableBody.innerHTML = '<tr><td colspan="3">No fee structures found.</td></tr>';
        return;
    }

    feeStructures.forEach(fs => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${fs.class}</td>
            <td>${fs.amount}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="deleteFeeStructure('${fs.class}')">Delete</button>
            </td>
        `;
        feeStructureTableBody.appendChild(row);
    });
}

async function deleteFeeStructure(className) {
    if (confirm(`Are you sure you want to delete the fee structure for ${className}?`)) {
        try {
            await db.collection('feeStructures').doc(className).delete();
            showAppAlert('Fee structure deleted successfully!');
            loadAndDisplayFeeStructures();
        } catch (error) {
            console.error("Error deleting fee structure:", error);
            showAppAlert('Error deleting fee structure: ' + error.message, 'danger');
        }
    }
}

feeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Prefer selected student object (from autocomplete). If user typed raw ID, accept that too.
    const studentId = _selectedFeeStudent ? _selectedFeeStudent.id : feeStudentId.value.trim();
    const amount = feeAmount.value.trim();
    const date = feeDate.value.trim();
    const method = paymentMethod.value;
    const discountAmount = discount.value.trim();

    if (!studentId || !amount || !date) {
        showAppAlert('Student ID, Amount, and Date are required.', 'danger');
        return;
    }

    try {
        const receiptNumber = `RCPT-${Date.now()}`;
        await db.collection('fees').add({
            studentId,
            amount: parseFloat(amount),
            date,
            paymentMethod: method,
            discount: parseFloat(discountAmount),
            status: 'Paid',
            receiptNumber
        });
        showAppAlert('Fee payment added successfully!');
        feeForm.reset();
        feeDate.valueAsDate = new Date();
        loadAndDisplayFees();
        document.querySelector('#fees .tab-button[data-tab-target="#fee-records"]').click();
    } catch (error) {
        console.error("Error adding fee payment:", error);
        showAppAlert('Error adding fee payment: ' + error.message, 'danger');
    }
});

feeSearch.addEventListener('input', () => {
    const cls = feeClassFilter ? feeClassFilter.value : '';
    const from = feeFromDate ? feeFromDate.value : '';
    const to = feeToDate ? feeToDate.value : '';
    loadAndDisplayFees(feeSearch.value, cls, from, to);
});

if (feeClassFilter) feeClassFilter.addEventListener('change', () => loadAndDisplayFees(feeSearch.value, feeClassFilter.value, feeFromDate.value, feeToDate.value));
if (feeFromDate) feeFromDate.addEventListener('change', () => loadAndDisplayFees(feeSearch.value, feeClassFilter.value, feeFromDate.value, feeToDate.value));
if (feeToDate) feeToDate.addEventListener('change', () => loadAndDisplayFees(feeSearch.value, feeClassFilter.value, feeFromDate.value, feeToDate.value));

if (exportFeesCsvBtn) exportFeesCsvBtn.addEventListener('click', async () => {
    // Reuse loadAndDisplayFees logic to get filtered list then export
    try {
        const cls = feeClassFilter ? feeClassFilter.value : '';
        const from = feeFromDate ? feeFromDate.value : '';
        const to = feeToDate ? feeToDate.value : '';
        const q = feeSearch.value || '';

        const fees = await getFilteredFees(q, cls, from, to);
        if (!fees || fees.length === 0) { showAppAlert('No fee records found for export.', 'warning'); return; }

        const headers = ['studentId', 'studentName', 'studentClass', 'amount', 'paidAmount', 'balance', 'dueDate', 'status', 'receiptNumber'];
        const csvRows = [headers.join(',')];
        fees.forEach(f => {
            const row = headers.map(h => `"${String(f[h] ?? '').replace(/"/g, '""')}"`).join(',');
            csvRows.push(row);
        });
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.setAttribute('href', URL.createObjectURL(blob));
        link.setAttribute('download', `fees_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showAppAlert(`Exported ${fees.length} fee records.`);
    } catch (error) {
        console.error('Error exporting fees CSV:', error);
        showAppAlert('Error exporting CSV: ' + error.message, 'danger');
    }
});

// Helper to fetch fees with current filters (used by export)
async function getFilteredFees(query = '', classFilter = '', from = '', to = '') {
    const lowerCaseQuery = query.toLowerCase();
    const feesRef = db.collection('fees').orderBy('date', 'desc');
    const studentsRef = db.collection('students');
    const [feesSnapshot, studentsSnapshot] = await Promise.all([feesRef.get(), studentsRef.get()]);
    const studentsData = studentsSnapshot.docs.reduce((acc, doc) => { acc[doc.id] = doc.data(); return acc; }, {});
    let fees = feesSnapshot.docs.map(doc => {
        const fee = doc.data();
        const student = studentsData[fee.studentId] || {};
        return { ...fee, id: doc.id, studentName: student.name, studentClass: student.class };
    });

    // Apply filters in JS
    fees = fees.filter(fee => {
        if (lowerCaseQuery) {
            const studentId = fee.studentId ? fee.studentId.toLowerCase() : '';
            const studentName = fee.studentName ? fee.studentName.toLowerCase() : '';
            const receiptNumber = fee.receiptNumber ? fee.receiptNumber.toLowerCase() : '';
            if (!(studentId.includes(lowerCaseQuery) || studentName.includes(lowerCaseQuery) || receiptNumber.includes(lowerCaseQuery))) return false;
        }
        if (classFilter) {
            if ((fee.studentClass || '') !== classFilter) return false;
        }
        if (from) {
            const feeDate = fee.dueDate || fee.date || '';
            if (!feeDate || feeDate < from) return false;
        }
        if (to) {
            const feeDate = fee.dueDate || fee.date || '';
            if (!feeDate || feeDate > to) return false;
        }
        return true;
    });

    // compute paid and balance for each
    fees = await Promise.all(fees.map(async fee => {
        const paidAmount = fee.paidAmount ? Number(fee.paidAmount) : 0;
        const totalAmount = fee.amount ? Number(fee.amount) : 0;
        const balance = Math.max(0, totalAmount - paidAmount);
        return { ...fee, paidAmount, balance, amount: totalAmount };
    }));
    return fees;
}

async function loadAndDisplayFees(query = '') {
    const lowerCaseQuery = query.toLowerCase();
    const feesRef = db.collection('fees').orderBy('date', 'desc');
    const studentsRef = db.collection('students');

    try {
        const [feesSnapshot, studentsSnapshot] = await Promise.all([feesRef.get(), studentsRef.get()]);

        const studentsData = studentsSnapshot.docs.reduce((acc, doc) => {
            acc[doc.id] = doc.data();
            return acc;
        }, {});

        let fees = feesSnapshot.docs.map(doc => {
            const fee = doc.data();
            const student = studentsData[fee.studentId] || {};
            return { ...fee, id: doc.id, studentName: student.name, studentClass: student.class };
        });

        if (lowerCaseQuery) {
            fees = fees.filter(fee => {
                const studentId = fee.studentId ? fee.studentId.toLowerCase() : '';
                const studentName = fee.studentName ? fee.studentName.toLowerCase() : '';
                const receiptNumber = fee.receiptNumber ? fee.receiptNumber.toLowerCase() : '';
                return studentId.includes(lowerCaseQuery) || studentName.includes(lowerCaseQuery) || receiptNumber.includes(lowerCaseQuery);
            });
        }

        renderFeesTable(fees);
    } catch (error) {
        console.error("Error loading fees:", error);
        showAppAlert('Error loading fees: ' + error.message, 'danger');
    }
}

function renderFeesTable(fees) {
    feesTableBody.innerHTML = '';
    if (fees.length === 0) {
        feesTableBody.innerHTML = '<tr><td colspan="9">No fee records found.</td></tr>';
        return;
    }

    fees.forEach(fee => {
        const row = document.createElement('tr');
        // Compute paid and balance
        const paidAmount = fee.paidAmount ? Number(fee.paidAmount) : 0;
        const totalAmount = fee.amount ? Number(fee.amount) : 0;
        const balance = Math.max(0, totalAmount - paidAmount);

        row.innerHTML = `
            <td>${fee.studentId}</td>
            <td>${fee.studentName || 'N/A'}</td>
            <td>${fee.studentClass || 'N/A'}</td>
            <td>${totalAmount}</td>
            <td>${paidAmount}</td>
            <td>${balance}</td>
            <td>${fee.dueDate || fee.date || ''}</td>
            <td><span class="status-badge status-${(fee.status || '').toLowerCase()}">${fee.status || 'N/A'}</span></td>
            <td>
                    <button class="btn btn-secondary btn-sm" onclick="viewReceipt('${fee.id}')">View</button>
                    <button class="btn btn-info btn-sm" onclick="openPaymentsModal('${fee.id}')">Payments</button>
                    <button class="btn btn-success btn-sm" onclick="payBalance('${fee.id}')">Pay Balance</button>
                    <button class="btn btn-warning btn-sm" onclick="payFull('${fee.id}')">Pay Full</button>
                    <button class="btn btn-primary btn-sm" onclick="openCollectPaymentModal('${fee.id}')">Collect</button>
                    <button class="btn btn-outline btn-sm" onclick="toggleInstallmentsInline('${fee.id}', this)">Schedule</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteFee('${fee.id}')">Delete</button>
            </td>
        `;
        feesTableBody.appendChild(row);
    });
}

// Toggle inline installment schedule / recent payments under a fee row
async function toggleInstallmentsInline(feeId, btnEl) {
    // Find the row containing this button
    const tr = btnEl.closest('tr');
    if (!tr) return;

    // If next sibling is an inline details row for this fee, remove it
    const next = tr.nextElementSibling;
    if (next && next.dataset && next.dataset.inlineFor === feeId) {
        next.remove();
        return;
    }

    // Otherwise create a details row
    const detailsRow = document.createElement('tr');
    detailsRow.dataset.inlineFor = feeId;
    const td = document.createElement('td');
    td.colSpan = 9;
    td.innerHTML = '<div>Loading schedule & recent payments...</div>';
    detailsRow.appendChild(td);
    tr.parentNode.insertBefore(detailsRow, tr.nextSibling);

    try {
        const feeDoc = await db.collection('fees').doc(feeId).get();
        if (!feeDoc.exists) { td.innerHTML = '<div>Fee not found.</div>'; return; }

        // Fetch schedule (if any)
        const scheduleSnap = await db.collection('fees').doc(feeId).collection('schedule').orderBy('installmentNumber').get();
        const paymentsSnap = await db.collection('fees').doc(feeId).collection('payments').orderBy('createdAt', 'desc').limit(5).get();

        let html = '<div style="display:flex; gap:1rem; flex-wrap:wrap;">';
        html += '<div style="flex:1 1 300px;">';
        html += '<h4>Installment Schedule</h4>';
        if (scheduleSnap.empty) {
            html += '<p>No installment schedule found.</p>';
        } else {
            html += '<table class="data-table" style="width:100%;"><thead><tr><th>#</th><th>Amount</th><th>Due Date</th><th>Status</th></tr></thead><tbody>';
            scheduleSnap.forEach(s => {
                const sd = s.data();
                html += `<tr><td>${sd.installmentNumber}</td><td>${sd.amount}</td><td>${sd.dueDate || ''}</td><td>${sd.status || ''}</td></tr>`;
            });
            html += '</tbody></table>';
        }
        html += '</div>';

        html += '<div style="flex:1 1 300px;">';
        html += '<h4>Recent Payments</h4>';
        if (paymentsSnap.empty) {
            html += '<p>No payments recorded.</p>';
        } else {
            html += '<ul style="list-style: none; padding-left: 0;">';
            paymentsSnap.forEach(p => {
                const pd = p.data();
                html += `<li style="padding:0.5rem 0; border-bottom:1px solid #eee;"><strong>${pd.amount}</strong> on ${pd.date || ''} - ${pd.method || ''}</li>`;
            });
            html += '</ul>';
        }
        html += '</div>';

        html += '</div>';
        td.innerHTML = html;
    } catch (error) {
        console.error('Error loading inline installments:', error);
        td.innerHTML = '<div>Error loading schedule.</div>';
    }
}

// Open Payments history modal for a fee
async function openPaymentsModal(feeId) {
    try {
        const feeDoc = await db.collection('fees').doc(feeId).get();
        if (!feeDoc.exists) {
            showAppAlert('Fee record not found.', 'danger');
            return;
        }
        const fee = feeDoc.data();
        const studentDoc = await db.collection('students').doc(fee.studentId).get();
        const student = studentDoc.exists ? studentDoc.data() : { name: fee.studentId };

        paymentsTitle.textContent = `${student.name || fee.studentId} (${fee.studentId}) - Payments`;
        paymentsList.innerHTML = '<p>Loading payments...</p>';

        const paymentsSnapshot = await db.collection('fees').doc(feeId).collection('payments').orderBy('createdAt', 'desc').get();
        if (paymentsSnapshot.empty) {
            paymentsList.innerHTML = '<p>No payments recorded for this fee.</p>';
        } else {
            paymentsList.innerHTML = '';
            paymentsSnapshot.forEach(doc => {
                const p = doc.data();
                const item = document.createElement('div');
                item.style.padding = '0.75rem 0';
                item.style.borderBottom = '1px solid #eee';
                item.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem;">
                            <div>
                                <div><strong>Amount:</strong> ${p.amount}</div>
                                <div style="font-size:0.9rem; color:#666;"><strong>Date:</strong> ${p.date || ''} ${p.createdAt && p.createdAt.toDate ? '(' + p.createdAt.toDate().toLocaleString() + ')' : ''}</div>
                                <div style="font-size:0.9rem; color:#666;"><strong>Method:</strong> ${p.method || ''}</div>
                                <div style="font-size:0.9rem; color:#666;"><strong>Notes:</strong> ${p.notes || ''}</div>
                            </div>
                            <div style="display:flex; gap:0.5rem;">
                                <button class="btn btn-primary btn-sm" onclick="printPaymentReceipt('${feeId}', '${doc.id}')">Print</button>
                            </div>
                        </div>
                    `;
                paymentsList.appendChild(item);
            });
        }

        openModal('paymentsModal');
    } catch (error) {
        console.error('Error loading payments:', error);
        showAppAlert('Error loading payments: ' + error.message, 'danger');
    }
}

// Print a specific payment receipt by fetching payment doc and fee/student
async function printPaymentReceipt(feeId, paymentId) {
    try {
        const feeDoc = await db.collection('fees').doc(feeId).get();
        if (!feeDoc.exists) throw new Error('Fee not found');
        const fee = feeDoc.data();

        const paymentDoc = await db.collection('fees').doc(feeId).collection('payments').doc(paymentId).get();
        if (!paymentDoc.exists) throw new Error('Payment not found');
        const payment = paymentDoc.data();

        const studentDoc = await db.collection('students').doc(fee.studentId).get();
        const student = studentDoc.exists ? studentDoc.data() : { id: fee.studentId, name: fee.studentId };

        const receipt = {
            receiptNumber: `RCPT-${Date.now()}`,
            date: payment.date || (new Date().toISOString().split('T')[0]),
            amount: payment.amount,
            discount: fee.discount || 0,
            paymentMethod: payment.method || '',
            notes: payment.notes || ''
        };

        displayReceipt(student, receipt);
        openModal('receiptModal');
    } catch (error) {
        console.error('Error printing payment receipt:', error);
        showAppAlert('Error printing payment receipt: ' + error.message, 'danger');
    }
}

// Open Collect Payment modal prefilled with fee and student info
async function openCollectPaymentModal(feeId) {
    try {
        const feeDoc = await db.collection('fees').doc(feeId).get();
        if (!feeDoc.exists) {
            showAppAlert('Fee record not found.', 'danger');
            return;
        }
        const fee = feeDoc.data();
        const studentDoc = await db.collection('students').doc(fee.studentId).get();
        const student = studentDoc.exists ? studentDoc.data() : { name: fee.studentId };

        collectFeeIdInput.value = feeId;
        collectStudentDiv.textContent = `${student.name || fee.studentId} (${fee.studentId})`;

        // Set default amount to remaining balance
        const paidAmount = fee.paidAmount ? Number(fee.paidAmount) : 0;
        const totalAmount = fee.amount ? Number(fee.amount) : 0;
        const balance = Math.max(0, totalAmount - paidAmount);
        collectAmountInput.value = balance > 0 ? balance : '';
        collectDateInput.valueAsDate = new Date();
        collectMethodSelect.value = 'Cash';
        collectNotesInput.value = '';

        openModal('collectPaymentModal');
    } catch (error) {
        console.error('Error opening collect payment modal:', error);
        showAppAlert('Error opening collect payment modal: ' + error.message, 'danger');
    }
}

// Allow opening collect modal with a prefill amount
async function openCollectPaymentModalWithAmount(feeId, prefillAmount) {
    await openCollectPaymentModal(feeId);
    if (typeof prefillAmount === 'number' && !isNaN(prefillAmount)) {
        collectAmountInput.value = prefillAmount;
    }
}

// Quick-pay helpers
async function payBalance(feeId) {
    try {
        const feeDoc = await db.collection('fees').doc(feeId).get();
        if (!feeDoc.exists) { showAppAlert('Fee not found', 'danger'); return; }
        const fee = feeDoc.data();
        const paidAmount = fee.paidAmount ? Number(fee.paidAmount) : 0;
        const totalAmount = fee.amount ? Number(fee.amount) : 0;
        const balance = Math.max(0, totalAmount - paidAmount);
        if (balance <= 0) { showAppAlert('No balance remaining', 'warning'); return; }
        openCollectPaymentModalWithAmount(feeId, balance);
    } catch (error) {
        console.error('Error in payBalance:', error);
        showAppAlert('Error preparing balance payment: ' + error.message, 'danger');
    }
}

async function payFull(feeId) {
    try {
        const feeDoc = await db.collection('fees').doc(feeId).get();
        if (!feeDoc.exists) { showAppAlert('Fee not found', 'danger'); return; }
        const fee = feeDoc.data();
        const totalAmount = fee.amount ? Number(fee.amount) : 0;
        openCollectPaymentModalWithAmount(feeId, totalAmount);
    } catch (error) {
        console.error('Error in payFull:', error);
        showAppAlert('Error preparing full payment: ' + error.message, 'danger');
    }
}

// Handle collect payment form submit
if (collectPaymentForm) {
    collectPaymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const feeId = collectFeeIdInput.value;
        const amount = parseFloat(collectAmountInput.value || '0');
        const date = collectDateInput.value;
        const method = collectMethodSelect.value;
        const notes = collectNotesInput.value.trim();

        if (!feeId || !amount || amount <= 0) {
            showAppAlert('Please enter a valid amount to collect.', 'danger');
            return;
        }

        try {
            // Transaction: add payment record and update fee document
            const feeRef = db.collection('fees').doc(feeId);
            await db.runTransaction(async (tx) => {
                const feeSnap = await tx.get(feeRef);
                if (!feeSnap.exists) throw new Error('Fee record no longer exists');
                const fee = feeSnap.data();

                const currentPaid = fee.paidAmount ? Number(fee.paidAmount) : 0;
                const total = fee.amount ? Number(fee.amount) : 0;
                const newPaid = currentPaid + amount;
                const newStatus = newPaid >= total ? 'Paid' : 'Partial';

                // Append payment to a subcollection 'payments'
                const paymentsRef = feeRef.collection('payments').doc();
                tx.set(paymentsRef, {
                    amount,
                    date,
                    method,
                    notes: notes || '',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                tx.update(feeRef, {
                    paidAmount: newPaid,
                    status: newStatus
                });
            });

            // Audit log
            try {
                await logAuditEventClient({ action: 'collectPayment', feeId, amount, method, notes });
            } catch (e) {
                console.warn('Failed to write audit log for payment:', e);
            }

            showAppAlert('Payment recorded successfully!');
            closeModal('collectPaymentModal');
            // Reload fees list
            loadAndDisplayFees();

            // Show professional receipt in receipt modal using latest payment data
            // We'll try to fetch the fee doc and latest payment entry
            try {
                const feeSnap = await db.collection('fees').doc(feeId).get();
                const fee = feeSnap.data();
                const paymentsSnapshot = await db.collection('fees').doc(feeId).collection('payments').orderBy('createdAt', 'desc').limit(1).get();
                const payment = paymentsSnapshot.empty ? null : paymentsSnapshot.docs[0].data();

                // Build receipt using student and payment
                const studentDoc = await db.collection('students').doc(fee.studentId).get();
                const student = studentDoc.exists ? studentDoc.data() : { id: fee.studentId, name: fee.studentId };

                const receipt = {
                    receiptNumber: `RCPT-${Date.now()}`,
                    date: payment && payment.date ? payment.date : (new Date().toISOString().split('T')[0]),
                    amount: payment ? payment.amount : amount,
                    discount: fee.discount || 0,
                    paymentMethod: payment ? payment.method : method,
                    notes: payment ? payment.notes : notes
                };

                displayReceipt(student, receipt);
                openModal('receiptModal');
            } catch (innerErr) {
                console.error('Error preparing receipt:', innerErr);
            }

        } catch (error) {
            console.error('Error recording payment:', error);
            showAppAlert('Error recording payment: ' + error.message, 'danger');
        }
    });
}

async function viewReceipt(feeId) {
    try {
        const feeDoc = await db.collection('fees').doc(feeId).get();
        if (!feeDoc.exists) {
            showAppAlert('Fee record not found.', 'danger');
            return;
        }
        const fee = feeDoc.data();

        const studentDoc = await db.collection('students').doc(fee.studentId).get();
        if (!studentDoc.exists) {
            showAppAlert('Student not found for this fee record.', 'danger');
            return;
        }
        const student = studentDoc.data();

        displayReceipt(student, fee);
        openModal('receiptModal');
    } catch (error) {
        console.error("Error viewing receipt:", error);
        showAppAlert('Error viewing receipt: ' + error.message, 'danger');
    }
}

async function printFeeReceipt(feeId) {
    try {
        const feeDoc = await db.collection('fees').doc(feeId).get();
        if (!feeDoc.exists) {
            showAppAlert('Fee record not found.', 'danger');
            return;
        }
        const fee = feeDoc.data();

        const studentDoc = await db.collection('students').doc(fee.studentId).get();
        if (!studentDoc.exists) {
            showAppAlert('Student not found for this fee record.', 'danger');
            return;
        }
        const student = studentDoc.data();

        const receiptContent = getReceiptContent(student, fee);
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Print Receipt</title>');
        printWindow.document.write('<link rel="stylesheet" href="src/css/style.css" type="text/css">');
        printWindow.document.write('<style>body { padding: 2rem; } .data-table { width: 100%; margin-top: 1rem; } </style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(receiptContent);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);

    } catch (error) {
        console.error("Error printing receipt:", error);
        showAppAlert('Error printing receipt: ' + error.message, 'danger');
    }
}

async function deleteFee(feeId) {
    if (confirm('Are you sure you want to delete this fee record?')) {
        try {
            await db.collection('fees').doc(feeId).delete();
            try { await logAuditEventClient({ action: 'deleteFee', feeId }); } catch (e) { console.warn('audit log failed', e); }
            showAppAlert('Fee record deleted successfully!');
            loadAndDisplayFees();
        } catch (error) {
            console.error("Error deleting fee record:", error);
            showAppAlert('Error deleting fee record: ' + error.message, 'danger');
        }
    }
}

function displayReceipt(student, fee) {
    const receiptDisplay = document.getElementById('receipt-display');
    receiptDisplay.innerHTML = getReceiptContent(student, fee);
}

function getReceiptContent(student, fee) {
    return `
        <div id="receipt-content">
            <h3 style="text-align: center; color: #333;">TARGET FOUNDATION CENTER</h3>
            <p style="text-align: center; font-size: 0.9rem; color: #666;">Fee Receipt</p>
            <hr>
            <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                <div>
                    <p><strong>Receipt No:</strong> ${fee.receiptNumber}</p>
                    <p><strong>Date:</strong> ${fee.date}</p>
                </div>
                <div>
                    <p><strong>Student ID:</strong> ${student.id}</p>
                    <p><strong>Student Name:</strong> ${student.name}</p>
                    <p><strong>Class:</strong> ${student.class}</p>
                </div>
            </div>
            <table class="data-table" style="width: 100%;">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Tuition Fee</td>
                        <td>${fee.amount}</td>
                    </tr>
                    <tr>
                        <td>Discount</td>
                        <td>-${fee.discount}</td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr>
                        <td style="font-weight: bold;">Total Paid</td>
                        <td style="font-weight: bold;">${fee.amount - fee.discount}</td>
                    </tr>
                </tfoot>
            </table>
            <p style="margin-top: 1rem;"><strong>Payment Method:</strong> ${fee.paymentMethod}</p>
            <p style="margin-top: 2rem; text-align: center; font-size: 0.8rem; color: #999;">
                This is a computer-generated receipt and does not require a signature.
            </p>
        </div>
    `;
}

// Download the currently displayed receipt as a PDF using html2pdf
function downloadReceiptPdf() {
    const receiptEl = document.getElementById('receipt-content');
    if (!receiptEl) {
        showAppAlert('No receipt content available to download.', 'danger');
        return;
    }

    // Prefer html2pdf (bundle includes html2canvas + jsPDF). Fallback to printing if not available.
    if (typeof html2pdf !== 'undefined') {
        // Try to extract a friendly filename from the receipt (receipt number)
        let filename = 'receipt.pdf';
        try {
            const receiptNumberMatch = receiptEl.innerText.match(/Receipt No:\s*(\S+)/i);
            if (receiptNumberMatch && receiptNumberMatch[1]) {
                filename = `${receiptNumberMatch[1]}.pdf`;
            } else {
                filename = `receipt-${Date.now()}.pdf`;
            }
        } catch (e) {
            filename = `receipt-${Date.now()}.pdf`;
        }

        const opt = {
            margin: 10,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
        };

        try {
            html2pdf().set(opt).from(receiptEl).save();
        } catch (error) {
            console.error('Error generating PDF:', error);
            showAppAlert('Failed to generate PDF. Please try printing instead.', 'danger');
        }
    } else {
        // Fallback: open print dialog and let user save as PDF
        showAppAlert('PDF export library not loaded; opening print dialog as fallback.', 'warning');
        printReceipt();
    }
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}