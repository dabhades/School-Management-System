// Students related functions

const studentTableBody = document.getElementById('studentsTableBody');
const studentSearch = document.getElementById('studentSearch');
const studentClassFilter = document.getElementById('studentClassFilter'); // New student filter
const studentForm = document.getElementById('studentForm');
const studentIdInput = document.getElementById('studentId');
const studentNameInput = document.getElementById('studentName');
const studentClassInput = document.getElementById('studentClass');
const studentPhoneInput = document.getElementById('studentPhone');
const studentModalTitle = document.getElementById('studentModalTitle');
const saveStudentBtn = document.getElementById('saveStudentBtn');

// Edit modal elements
const studentEditModal = document.getElementById('studentEditModal');
const editStudentForm = document.getElementById('editStudentForm');
const editStudentIdInput = document.getElementById('editStudentId');
const editStudentNameInput = document.getElementById('editStudentName');
const editStudentClassInput = document.getElementById('editStudentClass');
const editStudentPhoneInput = document.getElementById('editStudentPhone');
const editStudentCancel = document.getElementById('editStudentCancel');
const editStudentModalClose = document.getElementById('editStudentModalClose');

function showEditModal() {
    if (studentEditModal) studentEditModal.classList.add('show');
}

function hideEditModal() {
    if (studentEditModal) studentEditModal.classList.remove('show');
}

// Students Management
studentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = studentIdInput.value.trim();
    const name = studentNameInput.value.trim();
    const studentClass = studentClassInput.value.trim();
    const phone = studentPhoneInput.value.trim();

    if (!id || !name || !studentClass) {
        showAppAlert('Student ID, Name, and Class are required.', 'danger');
        return;
    }

    try {
        if (currentEditingEntityId) {
            // Update existing student
            await db.collection('students').doc(currentEditingEntityId).update({ name, class: studentClass, phone });
            showAppAlert('Student updated successfully!');
        } else {
            // Add new student
            await db.collection('students').doc(id).set({ id, name, class: studentClass, phone });
            showAppAlert('Student added successfully!');
        }
        resetStudentForm();
        loadAndDisplayStudents();
        loadStatistics(); // Update dashboard after change
        populateClassFilters(); // Update class filter after new student is added
        // Switch back to list view after adding/editing
        document.querySelector('#students .tab-button[data-tab-target="#students-list"]').click();
        // Refresh autocomplete index
        loadStudentIndex();

    } catch (error) {
        console.error("Error saving student:", error);
        showAppAlert('Error saving student: ' + error.message, 'danger');
    }
});

async function loadAndDisplayStudents(query = '', classFilter = '') {
    const studentsRef = db.collection('students');
    const snapshot = await studentsRef.get();
    let students = snapshot.docs.map(doc => ({ _docId: doc.id, ...doc.data() }));

    // Filtering
    const lowerCaseQuery = query.toLowerCase();
    const lowerCaseClassFilter = classFilter.toLowerCase();

    students = students.filter(entity => {
        // Defensive checks for undefined properties
        const entityId = entity.id ? String(entity.id).toLowerCase() : '';
        const entityName = entity.name ? String(entity.name).toLowerCase() : '';
        const entityClass = entity.class ? String(entity.class).toLowerCase() : '';

        const matchesSearch = !lowerCaseQuery || (entityId.includes(lowerCaseQuery) || entityName.includes(lowerCaseQuery));
        const matchesClass = !lowerCaseClassFilter || (entityClass.includes(lowerCaseClassFilter));

        return matchesSearch && matchesClass;
    });

    renderTable(studentTableBody, students, 'student');
}

studentSearch.addEventListener('input', () => {
    const classFilter = studentClassFilter.value;
    loadAndDisplayStudents(studentSearch.value, classFilter);
});

studentClassFilter.addEventListener('change', () => {
    const query = studentSearch.value;
    loadAndDisplayStudents(query, studentClassFilter.value);
});


function resetStudentForm() {
    studentForm.reset();
    studentIdInput.removeAttribute('disabled'); // Enable ID for new entries
    currentEditingEntityId = null;
    currentEditingEntityType = null;
    studentModalTitle.textContent = 'Add New Student';
    saveStudentBtn.textContent = 'Add Student';
}

async function editStudent(id) {
    // Defensive check for valid ID before proceeding
    if (!id || String(id).trim() === '') {
        showAppAlert('Cannot edit: Student ID is missing or invalid. Please ensure the record has a valid ID.', 'danger');
        return;
    }
    try {
        const doc = await db.collection('students').doc(id).get();
        if (doc.exists) {
            const student = doc.data();
            // Populate edit modal fields
            if (editStudentIdInput) editStudentIdInput.value = student.id ?? id;
            if (editStudentNameInput) editStudentNameInput.value = student.name ?? '';
            if (editStudentClassInput) editStudentClassInput.value = student.class ?? '';
            if (editStudentPhoneInput) editStudentPhoneInput.value = student.phone ?? '';

            // show modal
            showEditModal();
            // attach the id to the form dataset for use on submit
            if (editStudentForm) editStudentForm.dataset.docId = id;
        } else {
            showAppAlert('Student not found.', 'danger');
        }
    } catch (error) {
        console.error("Error fetching student for edit:", error);
        showAppAlert('Error loading student for edit: ' + error.message, 'danger');
    }
}

// Handle modal cancel/close
if (editStudentCancel) editStudentCancel.addEventListener('click', hideEditModal);
if (editStudentModalClose) editStudentModalClose.addEventListener('click', hideEditModal);
if (studentEditModal) studentEditModal.addEventListener('click', (e) => { if (e.target === studentEditModal) hideEditModal(); });

// Handle edit form submit
if (editStudentForm) {
    editStudentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const docId = editStudentForm.dataset.docId;
        if (!docId) { showAppAlert('Internal error: missing student document id', 'danger'); return; }
        const name = (editStudentNameInput.value || '').trim();
        const studentClass = (editStudentClassInput.value || '').trim();
        const phone = (editStudentPhoneInput.value || '').trim();

        if (!name || !studentClass) {
            showAppAlert('Name and Class are required.', 'danger');
            return;
        }

        try {
            await db.collection('students').doc(docId).update({ name, class: studentClass, phone });
            showAppAlert('Student updated successfully!');
            hideEditModal();
            loadAndDisplayStudents();
            populateClassFilters();
            loadStudentIndex();
        } catch (err) {
            console.error('Error updating student:', err);
            showAppAlert('Error updating student: ' + err.message, 'danger');
        }
    });
}