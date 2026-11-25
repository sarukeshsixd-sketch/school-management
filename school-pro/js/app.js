/* ==========================================================================
   SchoolPro — Application Controller & Module Renderers
   ========================================================================== */
const SESSION_KEY = 'schoolpro_session_v1';
const THEME_KEY = 'schoolpro_theme_v1';

let db = loadStore();
let currentUser = null;
let currentPage = 'dashboard';
let globalSearchQuery = '';

const PAGE_META = {
  dashboard: { title: 'Dashboard', subtitle: 'School statistics, attendance & fee overview' },
  students: { title: 'Student Management', subtitle: 'Enroll, view profiles, edit & manage students' },
  teachers: { title: 'Teacher Management', subtitle: 'Manage faculty profiles, subjects & classes' },
  classes: { title: 'Class & Section Management', subtitle: 'Configure classes 1–10, sections A–C & class teachers' },
  attendance: { title: 'Attendance Tracking', subtitle: 'Mark daily attendance & review attendance reports' },
  grades: { title: 'Grade Management', subtitle: 'Record marks, calculate grades & print report cards' },
  fees: { title: 'Fee Management', subtitle: 'Manage fee structure, collect payments & generate receipts' },
  timetable: { title: 'Timetable & Exam Schedule', subtitle: 'Weekly class timetables & upcoming exam schedules' },
  communication: { title: 'Parent Communication', subtitle: 'Send announcements & view parent contact directory' },
  reports: { title: 'Reports & Exports', subtitle: 'Generate and export Student, Attendance, Fee & Grade reports' }
};

/* ---------- Initialization ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  bindGlobalEvents();
  restoreSession();
});

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
  updateThemeIcon(next);
}

function bindGlobalEvents() {
  // Auth tabs
  document.querySelectorAll('.auth-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.authTab;
      document.getElementById('login-form').classList.toggle('hidden', target !== 'login');
      document.getElementById('register-form').classList.toggle('hidden', target !== 'register');
    });
  });

  // Demo quick login
  document.querySelectorAll('[data-demo-role]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const role = btn.dataset.demoRole;
      const demoUser = db.users.find((u) => u.role === role);
      if (demoUser) {
        document.getElementById('login-email').value = demoUser.email;
        document.getElementById('login-password').value = demoUser.password;
        document.getElementById('login-role').value = demoUser.role;
        loginUser(demoUser);
      }
    });
  });

  // Login submit
  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    const role = document.getElementById('login-role').value;
    const found = db.users.find(
      (u) => u.email.toLowerCase() === email && u.password === password && u.role === role
    );
    if (!found) {
      showToast('Invalid credentials or role. Try a Demo button below!', 'error');
      return;
    }
    loginUser(found);
  });

  // Register submit
  document.getElementById('register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const role = document.getElementById('reg-role').value;
    const password = document.getElementById('reg-password').value;

    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      showToast('An account with this email already exists.', 'error');
      return;
    }
    const newUser = { id: uid('u'), name, email, password, role };
    db.users.push(newUser);
    saveStore(db);
    showToast(`Welcome ${name}! Account created.`, 'success');
    loginUser(newUser);
  });

  // Sidebar navigation
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      navigateTo(btn.dataset.page);
      closeSidebarMobile();
    });
  });

  // Mobile sidebar toggle
  document.getElementById('sidebar-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebar-backdrop').classList.add('open');
  });
  document.getElementById('sidebar-close').addEventListener('click', closeSidebarMobile);
  document.getElementById('sidebar-backdrop').addEventListener('click', closeSidebarMobile);

  // Theme toggle
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  // Global search
  document.getElementById('global-search').addEventListener('input', (e) => {
    globalSearchQuery = e.target.value.trim().toLowerCase();
    if (currentPage === 'students' || currentPage === 'teachers') {
      renderCurrentPage();
    } else if (globalSearchQuery.length > 1) {
      navigateTo('students');
    }
  });

  // Logout & Reset
  document.getElementById('logout-btn').addEventListener('click', logoutUser);
  document.getElementById('reset-demo-btn').addEventListener('click', () => {
    if (confirm('Reset all SchoolPro data back to initial demo records?')) {
      db = resetStore();
      showToast('Demo data restored.', 'success');
      renderCurrentPage();
    }
  });

  // Modal close
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });
}

function closeSidebarMobile() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-backdrop').classList.remove('open');
}

function restoreSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      currentUser = JSON.parse(raw);
      showAppShell();
      return;
    }
  } catch (_) {}
  showAuthView();
}

function loginUser(user) {
  currentUser = user;
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  showToast(`Signed in as ${user.name} (${user.role})`, 'success');
  showAppShell();
}

function logoutUser() {
  currentUser = null;
  localStorage.removeItem(SESSION_KEY);
  showAuthView();
}

function showAuthView() {
  document.getElementById('auth-view').classList.remove('hidden');
  document.getElementById('app-shell').classList.add('hidden');
}

function isAdmin() {
  return currentUser && currentUser.role === 'Admin';
}

function requireAdmin() {
  if (isAdmin()) return true;
  showToast('Access denied: Only Admins can add or edit data and schedules.', 'error');
  return false;
}

function showAppShell() {
  document.getElementById('auth-view').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');
  document.getElementById('user-name').textContent = currentUser.name;
  document.getElementById('user-role-badge').textContent = isAdmin() ? currentUser.role : `${currentUser.role} (Read-Only)`;
  document.getElementById('user-avatar').textContent = getInitials(currentUser.name);
  const resetBtn = document.getElementById('reset-demo-btn');
  if (resetBtn) resetBtn.classList.toggle('hidden', !isAdmin());
  navigateTo('dashboard');
}

function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.page === page);
  });
  const meta = PAGE_META[page] || PAGE_META.dashboard;
  document.getElementById('page-title').textContent = meta.title;
  document.getElementById('page-subtitle').textContent = meta.subtitle;
  renderCurrentPage();
}

function renderCurrentPage() {
  const container = document.getElementById('main-content');
  switch (currentPage) {
    case 'dashboard': renderDashboard(container); break;
    case 'students': renderStudents(container); break;
    case 'teachers': renderTeachers(container); break;
    case 'classes': renderClasses(container); break;
    case 'attendance': renderAttendance(container); break;
    case 'grades': renderGrades(container); break;
    case 'fees': renderFees(container); break;
    case 'timetable': renderTimetable(container); break;
    case 'communication': renderCommunication(container); break;
    case 'reports': renderReports(container); break;
    default: renderDashboard(container);
  }
}

/* ==========================================================================
   1. DASHBOARD
   ========================================================================== */
function renderDashboard(container) {
  const today = getTodayISO();
  const todayAtt = db.attendance.filter((a) => a.date === today);
  const presentCount = todayAtt.filter((a) => a.status === 'Present').length;
  const attPct = todayAtt.length ? Math.round((presentCount / todayAtt.length) * 100) : 0;

  const totalCollected = db.feePayments.reduce((sum, p) => sum + Number(p.amountPaid || 0), 0);
  const totalDue = db.feePayments.reduce((sum, p) => sum + Number(p.amountDue || 0), 0);
  const totalPending = Math.max(0, totalDue - totalCollected);

  // Class distribution for chart
  const classCounts = {};
  SCHOOL_CONSTANTS.classes.slice(5).forEach((c) => (classCounts[c] = 0));
  db.students.forEach((s) => {
    classCounts[s.className] = (classCounts[s.className] || 0) + 1;
  });
  const maxClassCount = Math.max(1, ...Object.values(classCounts));

  container.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div>
          <div class="stat-label">Total Students</div>
          <div class="stat-value">${db.students.length}</div>
          <div class="stat-sub">Classes 1–10 Active</div>
        </div>
        <div class="stat-icon">🎓</div>
      </div>
      <div class="stat-card">
        <div>
          <div class="stat-label">Faculty / Teachers</div>
          <div class="stat-value">${db.teachers.length}</div>
          <div class="stat-sub">${SCHOOL_CONSTANTS.subjects.length} Subjects</div>
        </div>
        <div class="stat-icon">👩‍🏫</div>
      </div>
      <div class="stat-card">
        <div>
          <div class="stat-label">Today's Attendance</div>
          <div class="stat-value">${attPct}%</div>
          <div class="stat-sub">${presentCount} of ${todayAtt.length || db.students.length} Present</div>
        </div>
        <div class="stat-icon">✅</div>
      </div>
      <div class="stat-card">
        <div>
          <div class="stat-label">Fees Collected</div>
          <div class="stat-value">${formatCurrency(totalCollected)}</div>
          <div class="stat-sub" style="color: var(--warning);">Pending: ${formatCurrency(totalPending)}</div>
        </div>
        <div class="stat-icon">💰</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">📊 Student Enrollment by Class</h3>
          <button class="btn btn-outline btn-sm" onclick="navigateTo('students')">View All</button>
        </div>
        <div class="chart-bars">
          ${Object.entries(classCounts).map(([cls, count]) => {
            const h = Math.max(10, Math.round((count / maxClassCount) * 130));
            return `
              <div class="chart-col">
                <span class="chart-val">${count}</span>
                <div class="chart-bar" style="height:${h}px"></div>
                <span class="chart-lbl">${cls.replace('Class ', 'C')}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">📅 Upcoming Exam Schedule</h3>
          <button class="btn btn-outline btn-sm" onclick="navigateTo('timetable')">${isAdmin() ? 'Manage' : 'View'}</button>
        </div>
        <div class="table-responsive">
          <table>
            <thead><tr><th>Class</th><th>Subject</th><th>Date</th><th>Room</th></tr></thead>
            <tbody>
              ${db.examSchedules.slice(0, 4).map((ex) => `
                <tr>
                  <td><strong>${escapeHTML(ex.className)}</strong></td>
                  <td>${escapeHTML(ex.subject)}</td>
                  <td>${escapeHTML(ex.date)}</td>
                  <td><span class="badge badge-warning">${escapeHTML(ex.room)}</span></td>
                </tr>
              `).join('') || '<tr><td colspan="4">No upcoming exams.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">📢 Recent Announcements</h3>
          <button class="btn btn-outline btn-sm" onclick="navigateTo('communication')">${isAdmin() ? 'Post New' : 'View All'}</button>
        </div>
        ${db.announcements.slice(0, 3).map((a) => `
          <div style="padding:12px 0; border-bottom:1px solid var(--border);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <strong>${escapeHTML(a.title)}</strong>
              <span class="badge badge-info">${escapeHTML(a.target)}</span>
            </div>
            <p style="font-size:0.85rem; color:var(--text-muted);">${escapeHTML(a.message)}</p>
          </div>
        `).join('')}
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">⚡ Quick Actions</h3>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          ${isAdmin() ? `
            <button class="btn btn-primary" onclick="navigateTo('students'); openStudentModal()">+ Add Student</button>
            <button class="btn btn-outline" onclick="navigateTo('attendance')">✅ Mark Attendance</button>
            <button class="btn btn-outline" onclick="navigateTo('fees')">💰 Collect Fee</button>
            <button class="btn btn-outline" onclick="navigateTo('grades')">📝 Enter Marks</button>
            <button class="btn btn-outline" onclick="navigateTo('reports')">📑 Export Reports</button>
            <button class="btn btn-outline" onclick="navigateTo('communication')">💬 Send Notice</button>
          ` : `
            <button class="btn btn-primary" onclick="navigateTo('timetable')">📅 View Timetable</button>
            <button class="btn btn-outline" onclick="navigateTo('attendance')">✅ View Attendance</button>
            <button class="btn btn-outline" onclick="navigateTo('grades')">📝 View Grades</button>
            <button class="btn btn-outline" onclick="navigateTo('fees')">🧾 View Fee Receipts</button>
            <button class="btn btn-outline" onclick="navigateTo('reports')">📑 Export Reports</button>
            <button class="btn btn-outline" onclick="navigateTo('communication')">📢 Notice Board</button>
          `}
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   2. STUDENT MANAGEMENT
   ========================================================================== */
let studentFilter = { className: '', section: '' };

function renderStudents(container) {
  const q = globalSearchQuery;
  const filtered = db.students.filter((s) => {
    const matchClass = !studentFilter.className || s.className === studentFilter.className;
    const matchSec = !studentFilter.section || s.section === studentFilter.section;
    const matchSearch = !q ||
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.parentName.toLowerCase().includes(q);
    return matchClass && matchSec && matchSearch;
  });

  container.innerHTML = `
    <div class="toolbar">
      <div class="filter-group">
        <input type="search" id="stu-search" placeholder="Search name, ID, parent..." value="${escapeHTML(globalSearchQuery)}" />
        <select id="stu-class-filter">
          <option value="">All Classes</option>
          ${SCHOOL_CONSTANTS.classes.map((c) => `<option value="${c}" ${studentFilter.className === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
        <select id="stu-sec-filter">
          <option value="">All Sections</option>
          ${SCHOOL_CONSTANTS.sections.map((sec) => `<option value="${sec}" ${studentFilter.section === sec ? 'selected' : ''}>Section ${sec}</option>`).join('')}
        </select>
      </div>
      ${isAdmin() ? '<button class="btn btn-primary" id="add-student-btn">+ Add Student</button>' : ''}
    </div>

    <div class="card">
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>ID / Roll</th>
              <th>Class &amp; Section</th>
              <th>Parent Info</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((s) => `
              <tr>
                <td>
                  <div class="student-cell">
                    ${renderAvatar(s.name, s.photo)}
                    <div>
                      <strong>${escapeHTML(s.name)}</strong>
                      <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHTML(s.gender)} · DOB: ${escapeHTML(s.dob)}</div>
                    </div>
                  </div>
                </td>
                <td><strong>${escapeHTML(s.id)}</strong><div style="font-size:0.75rem; color:var(--text-muted);">Roll: ${escapeHTML(s.rollNo)}</div></td>
                <td><span class="badge badge-warning">${escapeHTML(s.className)} - ${escapeHTML(s.section)}</span></td>
                <td>
                  <div>${escapeHTML(s.parentName)}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHTML(s.parentPhone)}</div>
                </td>
                <td>
                  <div style="display:flex; gap:6px; flex-wrap:wrap;">
                    <button class="btn btn-outline btn-sm" onclick="viewStudentProfile('${s.id}')">👁️ View</button>
                    ${isAdmin() ? `
                      <button class="btn btn-outline btn-sm" onclick="openStudentModal('${s.id}')">✏️ Edit</button>
                      <button class="btn btn-danger-soft btn-sm" onclick="deleteStudent('${s.id}')">🗑️</button>
                    ` : ''}
                  </div>
                </td>
              </tr>
            `).join('') || '<tr><td colspan="5">No students match your filters.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('stu-search').addEventListener('input', (e) => {
    globalSearchQuery = e.target.value.trim().toLowerCase();
    renderStudents(container);
  });
  document.getElementById('stu-class-filter').addEventListener('change', (e) => {
    studentFilter.className = e.target.value;
    renderStudents(container);
  });
  document.getElementById('stu-sec-filter').addEventListener('change', (e) => {
    studentFilter.section = e.target.value;
    renderStudents(container);
  });
  const addStuBtn = document.getElementById('add-student-btn');
  if (addStuBtn) addStuBtn.addEventListener('click', () => openStudentModal());
}

window.openStudentModal = function (id = null) {
  if (!requireAdmin()) return;
  const existing = id ? db.students.find((s) => s.id === id) : null;
  let uploadedPhoto = existing ? existing.photo : '';

  const html = `
    <form id="student-form">
      <div class="form-row">
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" id="sf-name" required value="${escapeHTML(existing?.name || '')}" />
        </div>
        <div class="form-group">
          <label>Roll Number</label>
          <input type="text" id="sf-roll" required placeholder="e.g., 10A-05" value="${escapeHTML(existing?.rollNo || '')}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Class</label>
          <select id="sf-class" required>
            ${SCHOOL_CONSTANTS.classes.map((c) => `<option value="${c}" ${existing?.className === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Section</label>
          <select id="sf-section" required>
            ${SCHOOL_CONSTANTS.sections.map((sec) => `<option value="${sec}" ${existing?.section === sec ? 'selected' : ''}>${sec}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Date of Birth</label>
          <input type="date" id="sf-dob" required value="${escapeHTML(existing?.dob || '2012-01-01')}" />
        </div>
        <div class="form-group">
          <label>Gender</label>
          <select id="sf-gender">
            <option value="Male" ${existing?.gender === 'Male' ? 'selected' : ''}>Male</option>
            <option value="Female" ${existing?.gender === 'Female' ? 'selected' : ''}>Female</option>
            <option value="Other" ${existing?.gender === 'Other' ? 'selected' : ''}>Other</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Parent / Guardian Name</label>
          <input type="text" id="sf-pname" required value="${escapeHTML(existing?.parentName || '')}" />
        </div>
        <div class="form-group">
          <label>Parent Phone</label>
          <input type="tel" id="sf-pphone" required value="${escapeHTML(existing?.parentPhone || '')}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Parent Email</label>
          <input type="email" id="sf-pemail" value="${escapeHTML(existing?.parentEmail || '')}" />
        </div>
        <div class="form-group">
          <label>Student Photo (Optional)</label>
          <input type="file" id="sf-photo" accept="image/*" />
        </div>
      </div>
      <div class="form-group">
        <label>Address</label>
        <input type="text" id="sf-address" value="${escapeHTML(existing?.address || '')}" />
      </div>
      <button type="submit" class="btn btn-primary btn-block">${existing ? 'Update Student' : 'Register Student'}</button>
    </form>
  `;

  openModal(existing ? `Edit Student — ${existing.name}` : 'Register New Student', html, (body) => {
    body.querySelector('#sf-photo').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) uploadedPhoto = await readImageAsDataURL(file);
    });

    body.querySelector('#student-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const payload = {
        id: existing ? existing.id : uid('STU'),
        name: body.querySelector('#sf-name').value.trim(),
        rollNo: body.querySelector('#sf-roll').value.trim(),
        className: body.querySelector('#sf-class').value,
        section: body.querySelector('#sf-section').value,
        dob: body.querySelector('#sf-dob').value,
        gender: body.querySelector('#sf-gender').value,
        parentName: body.querySelector('#sf-pname').value.trim(),
        parentPhone: body.querySelector('#sf-pphone').value.trim(),
        parentEmail: body.querySelector('#sf-pemail').value.trim(),
        address: body.querySelector('#sf-address').value.trim(),
        photo: uploadedPhoto
      };
      if (existing) {
        const idx = db.students.findIndex((s) => s.id === existing.id);
        db.students[idx] = payload;
        showToast('Student updated successfully.', 'success');
      } else {
        db.students.unshift(payload);
        showToast('New student registered!', 'success');
      }
      saveStore(db);
      closeModal();
      renderCurrentPage();
    });
  });
};

window.viewStudentProfile = function (id) {
  const s = db.students.find((x) => x.id === id);
  if (!s) return;
  const att = db.attendance.filter((a) => a.studentId === id);
  const present = att.filter((a) => a.status === 'Present').length;
  const grades = db.grades.filter((g) => g.studentId === id);
  const fees = db.feePayments.filter((f) => f.studentId === id);

  openModal(`Student Profile — ${s.name}`, `
    <div style="display:flex; align-items:center; gap:16px; margin-bottom:18px; padding-bottom:14px; border-bottom:1px solid var(--border);">
      ${s.photo ? `<img src="${escapeHTML(s.photo)}" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:2px solid var(--primary);" />` : `<div style="width:72px;height:72px;border-radius:50%;background:var(--primary-light);color:#B45309;font-size:1.5rem;font-weight:800;display:flex;align-items:center;justify-content:center;">${escapeHTML(getInitials(s.name))}</div>`}
      <div>
        <h3 style="font-size:1.25rem;">${escapeHTML(s.name)}</h3>
        <p style="color:var(--text-muted); font-size:0.88rem;">${escapeHTML(s.id)} · Roll: ${escapeHTML(s.rollNo)} · <span class="badge badge-warning">${escapeHTML(s.className)} - ${escapeHTML(s.section)}</span></p>
      </div>
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:0.88rem; margin-bottom:16px;">
      <div><strong>DOB:</strong> ${escapeHTML(s.dob)}</div>
      <div><strong>Gender:</strong> ${escapeHTML(s.gender)}</div>
      <div><strong>Parent:</strong> ${escapeHTML(s.parentName)}</div>
      <div><strong>Phone:</strong> ${escapeHTML(s.parentPhone)}</div>
      <div><strong>Email:</strong> ${escapeHTML(s.parentEmail || '-')}</div>
      <div><strong>Address:</strong> ${escapeHTML(s.address || '-')}</div>
    </div>
    <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:10px; text-align:center;">
      <div style="padding:12px; background:var(--primary-soft); border-radius:10px;">
        <div style="font-size:0.75rem; color:var(--text-muted);">Attendance</div>
        <strong>${att.length ? Math.round((present / att.length) * 100) + '%' : 'N/A'}</strong>
      </div>
      <div style="padding:12px; background:var(--primary-soft); border-radius:10px;">
        <div style="font-size:0.75rem; color:var(--text-muted);">Exams Graded</div>
        <strong>${grades.length}</strong>
      </div>
      <div style="padding:12px; background:var(--primary-soft); border-radius:10px;">
        <div style="font-size:0.75rem; color:var(--text-muted);">Fee Records</div>
        <strong>${fees.length}</strong>
      </div>
    </div>
  `);
};

window.deleteStudent = function (id) {
  if (!requireAdmin()) return;
  if (!confirm('Delete this student record?')) return;
  db.students = db.students.filter((s) => s.id !== id);
  saveStore(db);
  showToast('Student deleted.', 'info');
  renderCurrentPage();
};

/* ==========================================================================
   3. TEACHER MANAGEMENT
   ========================================================================== */
function renderTeachers(container) {
  const q = globalSearchQuery;
  const filtered = db.teachers.filter(
    (t) => !q || t.name.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q)
  );

  container.innerHTML = `
    <div class="toolbar">
      <div class="filter-group">
        <input type="search" id="tch-search" placeholder="Search teacher or subject..." value="${escapeHTML(globalSearchQuery)}" />
      </div>
      ${isAdmin() ? '<button class="btn btn-primary" onclick="openTeacherModal()">+ Add Teacher</button>' : ''}
    </div>

    <div class="card">
      <div class="table-responsive">
        <table>
          <thead>
            <tr><th>Teacher</th><th>Subject</th><th>Classes Assigned</th><th>Contact</th>${isAdmin() ? '<th>Actions</th>' : ''}</tr>
          </thead>
          <tbody>
            ${filtered.map((t) => `
              <tr>
                <td>
                  <div class="student-cell">
                    ${renderAvatar(t.name, '')}
                    <div>
                      <strong>${escapeHTML(t.name)}</strong>
                      <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHTML(t.qualification)}</div>
                    </div>
                  </div>
                </td>
                <td><span class="badge badge-info">${escapeHTML(t.subject)}</span></td>
                <td>${t.classesAssigned.map((c) => `<span class="badge badge-warning" style="margin:2px;">${escapeHTML(c)}</span>`).join('')}</td>
                <td>
                  <div>${escapeHTML(t.email)}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHTML(t.phone)}</div>
                </td>
                ${isAdmin() ? `
                <td>
                  <div style="display:flex; gap:6px;">
                    <button class="btn btn-outline btn-sm" onclick="openTeacherModal('${t.id}')">✏️ Edit</button>
                    <button class="btn btn-danger-soft btn-sm" onclick="deleteTeacher('${t.id}')">🗑️</button>
                  </div>
                </td>
                ` : ''}
              </tr>
            `).join('') || `<tr><td colspan="${isAdmin() ? 5 : 4}">No teachers found.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('tch-search').addEventListener('input', (e) => {
    globalSearchQuery = e.target.value.trim().toLowerCase();
    renderTeachers(container);
  });
}

window.openTeacherModal = function (id = null) {
  if (!requireAdmin()) return;
  const existing = id ? db.teachers.find((t) => t.id === id) : null;
  const html = `
    <form id="teacher-form">
      <div class="form-row">
        <div class="form-group"><label>Full Name</label><input type="text" id="tf-name" required value="${escapeHTML(existing?.name || '')}" /></div>
        <div class="form-group"><label>Qualification</label><input type="text" id="tf-qual" required placeholder="M.Sc., B.Ed" value="${escapeHTML(existing?.qualification || '')}" /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Email</label><input type="email" id="tf-email" required value="${escapeHTML(existing?.email || '')}" /></div>
        <div class="form-group"><label>Phone</label><input type="tel" id="tf-phone" required value="${escapeHTML(existing?.phone || '')}" /></div>
      </div>
      <div class="form-group">
        <label>Primary Subject</label>
        <select id="tf-subject">
          ${SCHOOL_CONSTANTS.subjects.map((sub) => `<option value="${sub}" ${existing?.subject === sub ? 'selected' : ''}>${sub}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Classes Assigned</label>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          ${SCHOOL_CONSTANTS.classes.map((c) => `
            <label style="display:flex; align-items:center; gap:4px; font-weight:500;">
              <input type="checkbox" class="tf-cls-cb" value="${c}" ${existing?.classesAssigned?.includes(c) ? 'checked' : ''} /> ${c}
            </label>
          `).join('')}
        </div>
      </div>
      <button type="submit" class="btn btn-primary btn-block">${existing ? 'Update Teacher' : 'Add Teacher'}</button>
    </form>
  `;

  openModal(existing ? 'Edit Teacher' : 'Add New Teacher', html, (body) => {
    body.querySelector('#teacher-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const classesAssigned = [...body.querySelectorAll('.tf-cls-cb:checked')].map((cb) => cb.value);
      const payload = {
        id: existing ? existing.id : uid('TCH'),
        name: body.querySelector('#tf-name').value.trim(),
        qualification: body.querySelector('#tf-qual').value.trim(),
        email: body.querySelector('#tf-email').value.trim(),
        phone: body.querySelector('#tf-phone').value.trim(),
        subject: body.querySelector('#tf-subject').value,
        classesAssigned: classesAssigned.length ? classesAssigned : ['Class 10']
      };
      if (existing) {
        const idx = db.teachers.findIndex((t) => t.id === existing.id);
        db.teachers[idx] = payload;
        showToast('Teacher updated.', 'success');
      } else {
        db.teachers.unshift(payload);
        showToast('Teacher added.', 'success');
      }
      saveStore(db);
      closeModal();
      renderCurrentPage();
    });
  });
};

window.deleteTeacher = function (id) {
  if (!requireAdmin()) return;
  if (!confirm('Remove this teacher?')) return;
  db.teachers = db.teachers.filter((t) => t.id !== id);
  saveStore(db);
  showToast('Teacher removed.', 'info');
  renderCurrentPage();
};

/* ==========================================================================
   4. CLASS & SECTION MANAGEMENT
   ========================================================================== */
function renderClasses(container) {
  container.innerHTML = `
    <div class="toolbar">
      <p style="color:var(--text-muted); font-size:0.9rem;">${isAdmin() ? 'Manage Classes 1–10, Sections A–C, rooms, and assigned Class Teachers.' : 'View Classes 1–10, Sections A–C, rooms, and assigned Class Teachers.'}</p>
      ${isAdmin() ? '<button class="btn btn-primary" onclick="openClassModal()">+ Create Class / Section</button>' : ''}
    </div>

    <div class="card">
      <div class="table-responsive">
        <table>
          <thead>
            <tr><th>Class</th><th>Section</th><th>Class Teacher</th><th>Room</th><th>Students Enrolled</th>${isAdmin() ? '<th>Actions</th>' : ''}</tr>
          </thead>
          <tbody>
            ${db.classSections.map((cs) => {
              const count = db.students.filter((s) => s.className === cs.className && s.section === cs.section).length;
              return `
                <tr>
                  <td><strong>${escapeHTML(cs.className)}</strong></td>
                  <td><span class="badge badge-warning">Section ${escapeHTML(cs.section)}</span></td>
                  <td>${escapeHTML(cs.classTeacher)}</td>
                  <td>${escapeHTML(cs.room)}</td>
                  <td><strong>${count}</strong> students</td>
                  ${isAdmin() ? `
                  <td>
                    <div style="display:flex; gap:6px;">
                      <button class="btn btn-outline btn-sm" onclick="openClassModal('${cs.id}')">✏️ Edit</button>
                      <button class="btn btn-danger-soft btn-sm" onclick="deleteClassSection('${cs.id}')">🗑️</button>
                    </div>
                  </td>
                  ` : ''}
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

window.openClassModal = function (id = null) {
  if (!requireAdmin()) return;
  const existing = id ? db.classSections.find((c) => c.id === id) : null;
  const html = `
    <form id="class-form">
      <div class="form-row">
        <div class="form-group">
          <label>Class</label>
          <select id="cf-class">
            ${SCHOOL_CONSTANTS.classes.map((c) => `<option value="${c}" ${existing?.className === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Section</label>
          <select id="cf-sec">
            ${SCHOOL_CONSTANTS.sections.map((sec) => `<option value="${sec}" ${existing?.section === sec ? 'selected' : ''}>${sec}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Class Teacher</label>
        <select id="cf-teacher">
          ${db.teachers.map((t) => `<option value="${escapeHTML(t.name)}" ${existing?.classTeacher === t.name ? 'selected' : ''}>${escapeHTML(t.name)} (${escapeHTML(t.subject)})</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Room Number</label>
        <input type="text" id="cf-room" required placeholder="e.g., Room 105" value="${escapeHTML(existing?.room || '')}" />
      </div>
      <button type="submit" class="btn btn-primary btn-block">${existing ? 'Update Class' : 'Create Class Section'}</button>
    </form>
  `;
  openModal(existing ? 'Edit Class & Section' : 'Create Class & Section', html, (body) => {
    body.querySelector('#class-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const payload = {
        id: existing ? existing.id : uid('CS'),
        className: body.querySelector('#cf-class').value,
        section: body.querySelector('#cf-sec').value,
        classTeacher: body.querySelector('#cf-teacher').value,
        room: body.querySelector('#cf-room').value.trim()
      };
      if (existing) {
        const idx = db.classSections.findIndex((c) => c.id === existing.id);
        db.classSections[idx] = payload;
      } else {
        db.classSections.push(payload);
      }
      saveStore(db);
      showToast('Class & Section saved.', 'success');
      closeModal();
      renderCurrentPage();
    });
  });
};

window.deleteClassSection = function (id) {
  if (!requireAdmin()) return;
  if (!confirm('Delete this class section?')) return;
  db.classSections = db.classSections.filter((c) => c.id !== id);
  saveStore(db);
  renderCurrentPage();
};

/* ==========================================================================
   5. ATTENDANCE
   ========================================================================== */
let attState = { date: getTodayISO(), className: 'Class 10', section: 'A' };

function renderAttendance(container) {
  const students = db.students.filter(
    (s) => (!attState.className || s.className === attState.className) && (!attState.section || s.section === attState.section)
  );

  const getStatus = (stuId) => {
    const rec = db.attendance.find((a) => a.date === attState.date && a.studentId === stuId);
    return rec ? rec.status : 'Present';
  };

  container.innerHTML = `
    <div class="toolbar">
      <div class="filter-group">
        <input type="date" id="att-date" value="${attState.date}" />
        <select id="att-class">
          <option value="">All Classes</option>
          ${SCHOOL_CONSTANTS.classes.map((c) => `<option value="${c}" ${attState.className === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
        <select id="att-sec">
          <option value="">All Sections</option>
          ${SCHOOL_CONSTANTS.sections.map((sec) => `<option value="${sec}" ${attState.section === sec ? 'selected' : ''}>Section ${sec}</option>`).join('')}
        </select>
      </div>
      ${isAdmin() ? `
      <div class="filter-group">
        <button class="btn btn-outline btn-sm" id="mark-all-present">Mark All Present</button>
        <button class="btn btn-primary" id="save-att-btn">💾 Save Attendance</button>
      </div>
      ` : '<span class="badge badge-info">Read-Only View</span>'}
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Daily Attendance Sheet (${attState.date})</h3></div>
      <div class="table-responsive">
        <table>
          <thead><tr><th>Roll No</th><th>Student</th><th>Class</th><th>Status</th></tr></thead>
          <tbody>
            ${students.map((s) => {
              const st = getStatus(s.id);
              return `
                <tr>
                  <td><strong>${escapeHTML(s.rollNo)}</strong></td>
                  <td>${escapeHTML(s.name)}</td>
                  <td>${escapeHTML(s.className)} - ${escapeHTML(s.section)}</td>
                  <td>
                    ${isAdmin() ? `
                    <select class="att-select" data-student-id="${s.id}" style="padding:6px 10px; border-radius:6px; border:1px solid var(--border); background:var(--bg-input); color:var(--text-main);">
                      <option value="Present" ${st === 'Present' ? 'selected' : ''}>✅ Present</option>
                      <option value="Absent" ${st === 'Absent' ? 'selected' : ''}>❌ Absent</option>
                    </select>
                    ` : `<span class="badge ${st === 'Present' ? 'badge-success' : 'badge-danger'}">${st === 'Present' ? '✅ Present' : '❌ Absent'}</span>`}
                  </td>
                </tr>
              `;
            }).join('') || '<tr><td colspan="4">No students in selected class/section.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">📈 Student Attendance Summary</h3></div>
      <div class="table-responsive">
        <table>
          <thead><tr><th>Student</th><th>Class</th><th>Days Recorded</th><th>Present</th><th>Attendance %</th></tr></thead>
          <tbody>
            ${db.students.map((s) => {
              const recs = db.attendance.filter((a) => a.studentId === s.id);
              const pres = recs.filter((a) => a.status === 'Present').length;
              const pct = recs.length ? Math.round((pres / recs.length) * 100) : 0;
              return `
                <tr>
                  <td><strong>${escapeHTML(s.name)}</strong></td>
                  <td>${escapeHTML(s.className)}-${escapeHTML(s.section)}</td>
                  <td>${recs.length}</td>
                  <td>${pres}</td>
                  <td><span class="badge ${pct >= 75 ? 'badge-success' : 'badge-danger'}">${pct}%</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('att-date').addEventListener('change', (e) => { attState.date = e.target.value; renderAttendance(container); });
  document.getElementById('att-class').addEventListener('change', (e) => { attState.className = e.target.value; renderAttendance(container); });
  document.getElementById('att-sec').addEventListener('change', (e) => { attState.section = e.target.value; renderAttendance(container); });

  const markAllBtn = document.getElementById('mark-all-present');
  if (markAllBtn) {
    markAllBtn.addEventListener('click', () => {
      document.querySelectorAll('.att-select').forEach((sel) => (sel.value = 'Present'));
    });
  }

  const saveAttBtn = document.getElementById('save-att-btn');
  if (saveAttBtn) {
    saveAttBtn.addEventListener('click', () => {
      if (!requireAdmin()) return;
      document.querySelectorAll('.att-select').forEach((sel) => {
        const stuId = sel.dataset.studentId;
        const status = sel.value;
        const idx = db.attendance.findIndex((a) => a.date === attState.date && a.studentId === stuId);
        if (idx >= 0) db.attendance[idx].status = status;
        else db.attendance.push({ date: attState.date, studentId: stuId, status });
      });
      saveStore(db);
      showToast(`Attendance saved for ${attState.date}`, 'success');
      renderAttendance(container);
    });
  }
}

/* ==========================================================================
   6. GRADE MANAGEMENT
   ========================================================================== */
function renderGrades(container) {
  container.innerHTML = `
    <div class="toolbar">
      <div class="filter-group">
        <select id="rc-student-select">
          ${db.students.map((s) => `<option value="${s.id}">${escapeHTML(s.name)} (${escapeHTML(s.className)}-${escapeHTML(s.section)})</option>`).join('')}
        </select>
        <button class="btn btn-outline" id="view-rc-btn">📄 View Report Card</button>
      </div>
      ${isAdmin() ? '<button class="btn btn-primary" onclick="openGradeModal()">+ Add / Edit Grade</button>' : ''}
    </div>

    <div class="card">
      <div class="table-responsive">
        <table>
          <thead><tr><th>Student</th><th>Subject</th><th>Exam</th><th>Marks</th><th>Percentage</th><th>Grade</th>${isAdmin() ? '<th>Actions</th>' : ''}</tr></thead>
          <tbody>
            ${db.grades.map((g) => {
              const stu = db.students.find((s) => s.id === g.studentId);
              const pct = Math.round((g.marks / g.maxMarks) * 100);
              const lg = calcLetterGrade(pct);
              return `
                <tr>
                  <td><strong>${escapeHTML(stu ? stu.name : g.studentId)}</strong></td>
                  <td>${escapeHTML(g.subject)}</td>
                  <td>${escapeHTML(g.exam)}</td>
                  <td>${g.marks} / ${g.maxMarks}</td>
                  <td>${pct}%</td>
                  <td><span class="badge ${lg.badge}">${lg.letter}</span></td>
                  ${isAdmin() ? `
                  <td>
                    <button class="btn btn-outline btn-sm" onclick="openGradeModal('${g.id}')">✏️</button>
                    <button class="btn btn-danger-soft btn-sm" onclick="deleteGrade('${g.id}')">🗑️</button>
                  </td>
                  ` : ''}
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('view-rc-btn').addEventListener('click', () => {
    const stuId = document.getElementById('rc-student-select').value;
    openReportCardModal(stuId);
  });
}

window.openGradeModal = function (id = null) {
  if (!requireAdmin()) return;
  const existing = id ? db.grades.find((g) => g.id === id) : null;
  const html = `
    <form id="grade-form">
      <div class="form-group">
        <label>Student</label>
        <select id="gf-student">
          ${db.students.map((s) => `<option value="${s.id}" ${existing?.studentId === s.id ? 'selected' : ''}>${escapeHTML(s.name)} (${escapeHTML(s.className)})</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Subject</label>
          <select id="gf-subject">
            ${SCHOOL_CONSTANTS.subjects.map((sub) => `<option value="${sub}" ${existing?.subject === sub ? 'selected' : ''}>${sub}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Exam</label>
          <input type="text" id="gf-exam" required value="${escapeHTML(existing?.exam || 'Mid-Term')}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Marks Obtained</label><input type="number" id="gf-marks" min="0" max="100" required value="${existing?.marks ?? 85}" /></div>
        <div class="form-group"><label>Max Marks</label><input type="number" id="gf-max" min="1" required value="${existing?.maxMarks ?? 100}" /></div>
      </div>
      <button type="submit" class="btn btn-primary btn-block">${existing ? 'Update Grade' : 'Save Grade'}</button>
    </form>
  `;
  openModal(existing ? 'Edit Grade' : 'Add Student Grade', html, (body) => {
    body.querySelector('#grade-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const payload = {
        id: existing ? existing.id : uid('GRD'),
        studentId: body.querySelector('#gf-student').value,
        subject: body.querySelector('#gf-subject').value,
        exam: body.querySelector('#gf-exam').value.trim(),
        marks: Number(body.querySelector('#gf-marks').value),
        maxMarks: Number(body.querySelector('#gf-max').value)
      };
      if (existing) {
        const idx = db.grades.findIndex((g) => g.id === existing.id);
        db.grades[idx] = payload;
      } else {
        db.grades.unshift(payload);
      }
      saveStore(db);
      showToast('Grade saved.', 'success');
      closeModal();
      renderCurrentPage();
    });
  });
};

window.deleteGrade = function (id) {
  if (!requireAdmin()) return;
  db.grades = db.grades.filter((g) => g.id !== id);
  saveStore(db);
  renderCurrentPage();
};

window.openReportCardModal = function (stuId) {
  const stu = db.students.find((s) => s.id === stuId);
  if (!stu) return;
  const grades = db.grades.filter((g) => g.studentId === stuId);
  const totalMarks = grades.reduce((s, g) => s + g.marks, 0);
  const totalMax = grades.reduce((s, g) => s + g.maxMarks, 0);
  const overallPct = totalMax ? Math.round((totalMarks / totalMax) * 100) : 0;
  const overallGrade = calcLetterGrade(overallPct);

  const rcHTML = `
    <div class="receipt-box">
      <div class="receipt-header">
        <div>
          <h3>🏫 SchoolPro Academic Report Card</h3>
          <p style="font-size:0.85rem; color:var(--text-muted);">Student: <strong>${escapeHTML(stu.name)}</strong> (${escapeHTML(stu.className)} - ${escapeHTML(stu.section)})</p>
        </div>
        <span class="badge ${overallGrade.badge}">Overall: ${overallPct}% (${overallGrade.letter})</span>
      </div>
      <table>
        <thead><tr><th>Subject</th><th>Exam</th><th>Marks</th><th>Grade</th></tr></thead>
        <tbody>
          ${grades.map((g) => {
            const lg = calcLetterGrade(Math.round((g.marks / g.maxMarks) * 100));
            return `<tr><td>${escapeHTML(g.subject)}</td><td>${escapeHTML(g.exam)}</td><td>${g.marks}/${g.maxMarks}</td><td>${lg.letter}</td></tr>`;
          }).join('') || '<tr><td colspan="4">No grades recorded yet.</td></tr>'}
        </tbody>
      </table>
    </div>
    <div style="margin-top:14px; display:flex; justify-content:flex-end;">
      <button class="btn btn-primary" onclick="printHTML(document.querySelector('.receipt-box').outerHTML)">🖨️ Print / Save PDF</button>
    </div>
  `;
  openModal(`Report Card — ${stu.name}`, rcHTML);
};

/* ==========================================================================
   7. FEE MANAGEMENT & RECEIPT GENERATION
   ========================================================================== */
let feeTab = 'payments';

function renderFees(container) {
  container.innerHTML = `
    <div class="tabs">
      <button class="tab-btn ${feeTab === 'payments' ? 'active' : ''}" onclick="switchFeeTab('payments')">💳 Fee Payments &amp; Receipts</button>
      <button class="tab-btn ${feeTab === 'structure' ? 'active' : ''}" onclick="switchFeeTab('structure')">📋 Fee Structure</button>
    </div>
    <div id="fee-tab-body"></div>
  `;

  const body = document.getElementById('fee-tab-body');
  if (feeTab === 'payments') {
    body.innerHTML = `
      <div class="toolbar">
        <p style="color:var(--text-muted); font-size:0.9rem;">${isAdmin() ? 'Collect student fees and generate printable receipts.' : 'View fee payment records and print receipts.'}</p>
        ${isAdmin() ? '<button class="btn btn-primary" onclick="openCollectFeeModal()">+ Collect Fee Payment</button>' : ''}
      </div>
      <div class="card">
        <div class="table-responsive">
          <table>
            <thead><tr><th>Receipt #</th><th>Student</th><th>Category</th><th>Due</th><th>Paid</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              ${db.feePayments.map((p) => {
                const stu = db.students.find((s) => s.id === p.studentId);
                const badge = p.status === 'Paid' ? 'badge-success' : p.status === 'Partial' ? 'badge-warning' : 'badge-danger';
                return `
                  <tr>
                    <td><strong>${escapeHTML(p.id)}</strong></td>
                    <td>${escapeHTML(stu ? stu.name : p.studentId)}</td>
                    <td>${escapeHTML(p.category)}</td>
                    <td>${formatCurrency(p.amountDue)}</td>
                    <td>${formatCurrency(p.amountPaid)}</td>
                    <td><span class="badge ${badge}">${escapeHTML(p.status)}</span></td>
                    <td>
                      <button class="btn btn-outline btn-sm" onclick="openFeeReceiptModal('${p.id}')">🧾 Receipt</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else {
    body.innerHTML = `
      <div class="toolbar">
        <p style="color:var(--text-muted); font-size:0.9rem;">Standard fee categories: Tuition, Transport, Library, Sports, Examination.</p>
        ${isAdmin() ? '<button class="btn btn-primary" onclick="openFeeStructureModal()">+ Add Fee Structure</button>' : ''}
      </div>
      <div class="card">
        <div class="table-responsive">
          <table>
            <thead><tr><th>Class</th><th>Fee Category</th><th>Amount</th>${isAdmin() ? '<th>Actions</th>' : ''}</tr></thead>
            <tbody>
              ${db.feeStructures.map((fs) => `
                <tr>
                  <td><strong>${escapeHTML(fs.className)}</strong></td>
                  <td>${escapeHTML(fs.category)}</td>
                  <td><strong>${formatCurrency(fs.amount)}</strong></td>
                  ${isAdmin() ? `<td><button class="btn btn-danger-soft btn-sm" onclick="deleteFeeStructure('${fs.id}')">🗑️</button></td>` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

window.switchFeeTab = function (tab) {
  feeTab = tab;
  renderCurrentPage();
};

window.openCollectFeeModal = function () {
  if (!requireAdmin()) return;
  const html = `
    <form id="collect-fee-form">
      <div class="form-group">
        <label>Student</label>
        <select id="ff-student">
          ${db.students.map((s) => `<option value="${s.id}">${escapeHTML(s.name)} (${escapeHTML(s.className)})</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Fee Category</label>
          <select id="ff-category">
            ${SCHOOL_CONSTANTS.feeCategories.map((c) => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Payment Method</label>
          <select id="ff-method">
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="NetBanking">NetBanking</option>
            <option value="Cash">Cash</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Total Due (₹)</label><input type="number" id="ff-due" required value="25000" /></div>
        <div class="form-group"><label>Amount Paid (₹)</label><input type="number" id="ff-paid" required value="25000" /></div>
      </div>
      <button type="submit" class="btn btn-primary btn-block">Record Payment &amp; Generate Receipt</button>
    </form>
  `;
  openModal('Collect Fee Payment', html, (body) => {
    body.querySelector('#collect-fee-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const due = Number(body.querySelector('#ff-due').value);
      const paid = Number(body.querySelector('#ff-paid').value);
      const status = paid >= due ? 'Paid' : paid > 0 ? 'Partial' : 'Pending';
      const rec = {
        id: uid('REC'),
        studentId: body.querySelector('#ff-student').value,
        category: body.querySelector('#ff-category').value,
        amountDue: due,
        amountPaid: paid,
        status,
        date: getTodayISO(),
        method: body.querySelector('#ff-method').value
      };
      db.feePayments.unshift(rec);
      saveStore(db);
      closeModal();
      showToast('Fee payment recorded!', 'success');
      renderCurrentPage();
      openFeeReceiptModal(rec.id);
    });
  });
};

window.openFeeReceiptModal = function (recId) {
  const p = db.feePayments.find((x) => x.id === recId);
  if (!p) return;
  const stu = db.students.find((s) => s.id === p.studentId);
  const receiptHTML = `
    <div class="receipt-box">
      <div class="receipt-header">
        <div>
          <h3>🏫 SchoolPro Official Fee Receipt</h3>
          <p style="font-size:0.82rem; color:var(--text-muted);">Data Alcott Systems · Task WD-SCH-001</p>
        </div>
        <div style="text-align:right;">
          <strong>${escapeHTML(p.id)}</strong>
          <div style="font-size:0.8rem; color:var(--text-muted);">Date: ${escapeHTML(p.date || getTodayISO())}</div>
        </div>
      </div>
      <div style="display:grid; gap:8px; font-size:0.9rem; margin-bottom:14px;">
        <div><strong>Student Name:</strong> ${escapeHTML(stu ? stu.name : p.studentId)} (${escapeHTML(stu ? stu.className + ' - ' + stu.section : '')})</div>
        <div><strong>Fee Category:</strong> ${escapeHTML(p.category)}</div>
        <div><strong>Payment Method:</strong> ${escapeHTML(p.method)}</div>
        <div><strong>Amount Due:</strong> ${formatCurrency(p.amountDue)}</div>
        <div><strong>Amount Paid:</strong> <strong style="color:var(--success);">${formatCurrency(p.amountPaid)}</strong></div>
        <div><strong>Status:</strong> ${escapeHTML(p.status)}</div>
      </div>
    </div>
    <div style="margin-top:14px; display:flex; justify-content:flex-end;">
      <button class="btn btn-primary" onclick="printHTML(document.querySelector('.receipt-box').outerHTML)">🖨️ Print / Save PDF</button>
    </div>
  `;
  openModal(`Fee Receipt — ${p.id}`, receiptHTML);
};

window.openFeeStructureModal = function () {
  if (!requireAdmin()) return;
  const html = `
    <form id="fs-form">
      <div class="form-group">
        <label>Class</label>
        <select id="fs-class">${SCHOOL_CONSTANTS.classes.map((c) => `<option value="${c}">${c}</option>`).join('')}</select>
      </div>
      <div class="form-group">
        <label>Fee Category</label>
        <select id="fs-cat">${SCHOOL_CONSTANTS.feeCategories.map((c) => `<option value="${c}">${c}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Amount (₹)</label><input type="number" id="fs-amt" required value="5000" /></div>
      <button type="submit" class="btn btn-primary btn-block">Save Fee Structure</button>
    </form>
  `;
  openModal('Add Fee Structure', html, (body) => {
    body.querySelector('#fs-form').addEventListener('submit', (e) => {
      e.preventDefault();
      db.feeStructures.push({
        id: uid('FS'),
        className: body.querySelector('#fs-class').value,
        category: body.querySelector('#fs-cat').value,
        amount: Number(body.querySelector('#fs-amt').value)
      });
      saveStore(db);
      closeModal();
      showToast('Fee structure added.', 'success');
      renderCurrentPage();
    });
  });
};

window.deleteFeeStructure = function (id) {
  if (!requireAdmin()) return;
  db.feeStructures = db.feeStructures.filter((f) => f.id !== id);
  saveStore(db);
  renderCurrentPage();
};

/* ==========================================================================
   8. TIMETABLE & EXAM SCHEDULE
   ========================================================================== */
let ttTab = 'timetable';
let ttFilter = { className: 'Class 10', section: 'A' };

function renderTimetable(container) {
  container.innerHTML = `
    <div class="tabs">
      <button class="tab-btn ${ttTab === 'timetable' ? 'active' : ''}" onclick="switchTTTab('timetable')">📅 Weekly Class Timetable</button>
      <button class="tab-btn ${ttTab === 'exams' ? 'active' : ''}" onclick="switchTTTab('exams')">📝 Exam Schedule</button>
    </div>
    <div id="tt-body"></div>
  `;
  const body = document.getElementById('tt-body');

  if (ttTab === 'timetable') {
    body.innerHTML = `
      <div class="toolbar">
        <div class="filter-group">
          <select id="tt-class">${SCHOOL_CONSTANTS.classes.map((c) => `<option value="${c}" ${ttFilter.className === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
          <select id="tt-sec">${SCHOOL_CONSTANTS.sections.map((s) => `<option value="${s}" ${ttFilter.section === s ? 'selected' : ''}>Section ${s}</option>`).join('')}</select>
        </div>
        ${isAdmin() ? '<button class="btn btn-primary" onclick="openTimetableModal()">+ Add Timetable Slot</button>' : '<span class="badge badge-info">Read-Only Schedule</span>'}
      </div>
      <div class="card">
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Day / Time</th>
                ${SCHOOL_CONSTANTS.periods.map((p) => `<th>${p}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${SCHOOL_CONSTANTS.days.map((day) => `
                <tr>
                  <td><strong>${day}</strong></td>
                  ${SCHOOL_CONSTANTS.periods.map((period) => {
                    const slot = db.timetables.find(
                      (t) => t.className === ttFilter.className && t.section === ttFilter.section && t.day === day && t.period === period
                    );
                    return slot
                      ? `<td><div class="badge badge-warning">${escapeHTML(slot.subject)}</div><div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">${escapeHTML(slot.teacher)}</div></td>`
                      : `<td style="color:var(--text-muted); font-size:0.78rem;">—</td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    document.getElementById('tt-class').addEventListener('change', (e) => { ttFilter.className = e.target.value; renderTimetable(container); });
    document.getElementById('tt-sec').addEventListener('change', (e) => { ttFilter.section = e.target.value; renderTimetable(container); });
  } else {
    body.innerHTML = `
      <div class="toolbar">
        <p style="color:var(--text-muted); font-size:0.9rem;">${isAdmin() ? 'Manage upcoming examination dates, timings &amp; halls.' : 'View upcoming examination dates, timings &amp; halls.'}</p>
        ${isAdmin() ? '<button class="btn btn-primary" onclick="openExamModal()">+ Schedule Exam</button>' : '<span class="badge badge-info">Read-Only Schedule</span>'}
      </div>
      <div class="card">
        <div class="table-responsive">
          <table>
            <thead><tr><th>Class</th><th>Subject</th><th>Date</th><th>Time</th><th>Room</th>${isAdmin() ? '<th>Action</th>' : ''}</tr></thead>
            <tbody>
              ${db.examSchedules.map((ex) => `
                <tr>
                  <td><strong>${escapeHTML(ex.className)}</strong></td>
                  <td>${escapeHTML(ex.subject)}</td>
                  <td>${escapeHTML(ex.date)}</td>
                  <td>${escapeHTML(ex.time)}</td>
                  <td><span class="badge badge-info">${escapeHTML(ex.room)}</span></td>
                  ${isAdmin() ? `<td><button class="btn btn-danger-soft btn-sm" onclick="deleteExam('${ex.id}')">🗑️</button></td>` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

window.switchTTTab = function (tab) { ttTab = tab; renderCurrentPage(); };

window.openTimetableModal = function () {
  if (!requireAdmin()) return;
  const html = `
    <form id="tt-form">
      <div class="form-row">
        <div class="form-group"><label>Day</label><select id="ttf-day">${SCHOOL_CONSTANTS.days.map((d) => `<option>${d}</option>`).join('')}</select></div>
        <div class="form-group"><label>Period</label><select id="ttf-period">${SCHOOL_CONSTANTS.periods.map((p) => `<option>${p}</option>`).join('')}</select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Subject</label><select id="ttf-sub">${SCHOOL_CONSTANTS.subjects.map((s) => `<option>${s}</option>`).join('')}</select></div>
        <div class="form-group"><label>Teacher</label><select id="ttf-tch">${db.teachers.map((t) => `<option value="${escapeHTML(t.name)}">${escapeHTML(t.name)}</option>`).join('')}</select></div>
      </div>
      <button type="submit" class="btn btn-primary btn-block">Save Slot for ${ttFilter.className}-${ttFilter.section}</button>
    </form>
  `;
  openModal('Add Timetable Slot', html, (body) => {
    body.querySelector('#tt-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const day = body.querySelector('#ttf-day').value;
      const period = body.querySelector('#ttf-period').value;
      db.timetables = db.timetables.filter(
        (t) => !(t.className === ttFilter.className && t.section === ttFilter.section && t.day === day && t.period === period)
      );
      db.timetables.push({
        id: uid('TT'),
        className: ttFilter.className,
        section: ttFilter.section,
        day,
        period,
        subject: body.querySelector('#ttf-sub').value,
        teacher: body.querySelector('#ttf-tch').value
      });
      saveStore(db);
      closeModal();
      showToast('Timetable slot updated.', 'success');
      renderCurrentPage();
    });
  });
};

window.openExamModal = function () {
  if (!requireAdmin()) return;
  const html = `
    <form id="ex-form">
      <div class="form-row">
        <div class="form-group"><label>Class</label><select id="ex-cls">${SCHOOL_CONSTANTS.classes.map((c) => `<option>${c}</option>`).join('')}</select></div>
        <div class="form-group"><label>Subject</label><select id="ex-sub">${SCHOOL_CONSTANTS.subjects.map((s) => `<option>${s}</option>`).join('')}</select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Date</label><input type="date" id="ex-date" required value="${getTodayISO()}" /></div>
        <div class="form-group"><label>Time</label><input type="text" id="ex-time" required value="09:30 AM - 12:30 PM" /></div>
      </div>
      <div class="form-group"><label>Exam Hall / Room</label><input type="text" id="ex-room" required value="Hall A" /></div>
      <button type="submit" class="btn btn-primary btn-block">Schedule Exam</button>
    </form>
  `;
  openModal('Schedule Exam', html, (body) => {
    body.querySelector('#ex-form').addEventListener('submit', (e) => {
      e.preventDefault();
      db.examSchedules.push({
        id: uid('EX'),
        className: body.querySelector('#ex-cls').value,
        subject: body.querySelector('#ex-sub').value,
        date: body.querySelector('#ex-date').value,
        time: body.querySelector('#ex-time').value.trim(),
        room: body.querySelector('#ex-room').value.trim()
      });
      saveStore(db);
      closeModal();
      showToast('Exam scheduled.', 'success');
      renderCurrentPage();
    });
  });
};

window.deleteExam = function (id) {
  if (!requireAdmin()) return;
  db.examSchedules = db.examSchedules.filter((e) => e.id !== id);
  saveStore(db);
  renderCurrentPage();
};

/* ==========================================================================
   9. PARENT COMMUNICATION
   ========================================================================== */
function renderCommunication(container) {
  container.innerHTML = `
    <div class="${isAdmin() ? 'grid-2' : ''}">
      ${isAdmin() ? `
      <div class="card">
        <div class="card-header"><h3 class="card-title">📣 Send Announcement</h3></div>
        <form id="ann-form">
          <div class="form-group"><label>Title</label><input type="text" id="ann-title" required placeholder="e.g., Holiday Notice" /></div>
          <div class="form-group">
            <label>Target Audience</label>
            <select id="ann-target">
              <option value="All Parents & Students">All Parents &amp; Students</option>
              ${SCHOOL_CONSTANTS.classes.map((c) => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label>Message</label><textarea id="ann-msg" rows="3" required placeholder="Write your announcement..."></textarea></div>
          <button type="submit" class="btn btn-primary btn-block">Publish Announcement</button>
        </form>
      </div>
      ` : ''}

      <div class="card">
        <div class="card-header"><h3 class="card-title">📢 Notice Board</h3></div>
        <div style="max-height:340px; overflow-y:auto;">
          ${db.announcements.map((a) => `
            <div style="padding:12px; border:1px solid var(--border); border-radius:10px; margin-bottom:10px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <strong>${escapeHTML(a.title)}</strong>
                <span class="badge badge-warning">${escapeHTML(a.target)}</span>
              </div>
              <p style="font-size:0.86rem; color:var(--text-muted); margin-bottom:6px;">${escapeHTML(a.message)}</p>
              <div style="font-size:0.74rem; color:var(--text-muted);">By ${escapeHTML(a.author)} · ${escapeHTML(a.date)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">👪 Parent Contact Directory</h3></div>
      <div class="table-responsive">
        <table>
          <thead><tr><th>Parent Name</th><th>Student</th><th>Class</th><th>Phone</th><th>Email</th></tr></thead>
          <tbody>
            ${db.students.map((s) => `
              <tr>
                <td><strong>${escapeHTML(s.parentName)}</strong></td>
                <td>${escapeHTML(s.name)}</td>
                <td>${escapeHTML(s.className)} - ${escapeHTML(s.section)}</td>
                <td>${escapeHTML(s.parentPhone)}</td>
                <td>${escapeHTML(s.parentEmail || '-')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  const annForm = document.getElementById('ann-form');
  if (annForm) {
    annForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!requireAdmin()) return;
      db.announcements.unshift({
        id: uid('ANN'),
        title: document.getElementById('ann-title').value.trim(),
        target: document.getElementById('ann-target').value,
        message: document.getElementById('ann-msg').value.trim(),
        author: currentUser.name,
        date: getTodayISO()
      });
      saveStore(db);
      showToast('Announcement published to parents!', 'success');
      renderCommunication(container);
    });
  }
}

/* ==========================================================================
   10. REPORTS & EXPORTS (CSV & PDF)
   ========================================================================== */
let reportType = 'students';

function renderReports(container) {
  const { headers, rows, title } = buildReportData(reportType);

  container.innerHTML = `
    <div class="toolbar">
      <div class="filter-group">
        <select id="rep-type">
          <option value="students" ${reportType === 'students' ? 'selected' : ''}>Student Directory Report</option>
          <option value="attendance" ${reportType === 'attendance' ? 'selected' : ''}>Attendance Report</option>
          <option value="fees" ${reportType === 'fees' ? 'selected' : ''}>Fee Collection Report</option>
          <option value="grades" ${reportType === 'grades' ? 'selected' : ''}>Academic Grades Report</option>
        </select>
      </div>
      <div class="filter-group">
        <button class="btn btn-outline" id="export-csv-btn">📥 Export CSV</button>
        <button class="btn btn-primary" id="export-pdf-btn">🖨️ Export / Print PDF</button>
      </div>
    </div>

    <div class="card" id="report-preview-card">
      <div class="card-header">
        <h3 class="card-title">${title}</h3>
        <span class="badge badge-info">${rows.length} Records</span>
      </div>
      <div class="table-responsive">
        <table>
          <thead><tr>${headers.map((h) => `<th>${escapeHTML(h)}</th>`).join('')}</tr></thead>
          <tbody>
            ${rows.map((r) => `<tr>${r.map((cell) => `<td>${escapeHTML(cell)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${headers.length}">No records available.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('rep-type').addEventListener('change', (e) => {
    reportType = e.target.value;
    renderReports(container);
  });
  document.getElementById('export-csv-btn').addEventListener('click', () => {
    exportToCSV(`schoolpro_${reportType}_report.csv`, headers, rows);
  });
  document.getElementById('export-pdf-btn').addEventListener('click', () => {
    printHTML(document.getElementById('report-preview-card').innerHTML);
  });
}

function buildReportData(type) {
  if (type === 'students') {
    return {
      title: '🎓 Student Enrollment Report',
      headers: ['ID', 'Name', 'Roll No', 'Class', 'Section', 'Parent', 'Phone'],
      rows: db.students.map((s) => [s.id, s.name, s.rollNo, s.className, s.section, s.parentName, s.parentPhone])
    };
  }
  if (type === 'attendance') {
    return {
      title: '✅ Attendance Summary Report',
      headers: ['Date', 'Student ID', 'Student Name', 'Status'],
      rows: db.attendance.map((a) => {
        const stu = db.students.find((s) => s.id === a.studentId);
        return [a.date, a.studentId, stu ? stu.name : a.studentId, a.status];
      })
    };
  }
  if (type === 'fees') {
    return {
      title: '💰 Fee Collection Report',
      headers: ['Receipt ID', 'Student', 'Category', 'Due (INR)', 'Paid (INR)', 'Status', 'Date'],
      rows: db.feePayments.map((p) => {
        const stu = db.students.find((s) => s.id === p.studentId);
        return [p.id, stu ? stu.name : p.studentId, p.category, p.amountDue, p.amountPaid, p.status, p.date || '-'];
      })
    };
  }
  return {
    title: '📝 Academic Grades Report',
    headers: ['Student', 'Subject', 'Exam', 'Marks', 'Max Marks', 'Percentage'],
    rows: db.grades.map((g) => {
      const stu = db.students.find((s) => s.id === g.studentId);
      return [stu ? stu.name : g.studentId, g.subject, g.exam, g.marks, g.maxMarks, Math.round((g.marks / g.maxMarks) * 100) + '%'];
    })
  };
}
