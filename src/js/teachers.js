// Teachers related functions

const teacherTableBody = document.getElementById('teachersTableBody');
const teacherSearch = document.getElementById('teacherSearch');
const teacherForm = document.getElementById('teacherForm');
const teacherIdInput = document.getElementById('teacherId');
const teacherNameInput = document.getElementById('teacherName');
const teacherSubjectInput = document.getElementById('teacherSubject');
const teacherPhoneInput = document.getElementById('teacherPhone');
const teacherModalTitle = document.getElementById('teacherModalTitle');
const saveTeacherBtn = document.getElementById('saveTeacherBtn');

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
    let teachers = snapshot.docs.map(doc => doc.data());

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