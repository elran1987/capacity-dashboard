// ==========================================
// 1. STATE & DATA INITIALIZATION
// ==========================================
let jiraData = [];
let gitData = [];
let employeeData = [];

let currentTab = 'jira';
let currentSortCol = 'Assignee';
let currentSortAsc = true;

// טעינת נתונים מ-localStorage בעת עליית העמוד
document.addEventListener('DOMContentLoaded', () => {
    loadDataFromLocalStorage();
    initEventListeners();
    switchTab('jira');
});

// ==========================================
// 2. LOCALSTORAGE MANAGEMENT
// ==========================================
function loadDataFromLocalStorage() {
    try {
        const savedJira = localStorage.getItem('dashboard_jiraData') || localStorage.getItem('dashboard_jira_data');
        if (savedJira) jiraData = JSON.parse(savedJira);

        const savedGit = localStorage.getItem('dashboard_gitData') || localStorage.getItem('dashboard_git_data');
        if (savedGit) gitData = JSON.parse(savedGit);

        const savedEmp = localStorage.getItem('dashboard_employeeData') || localStorage.getItem('dashboard_employee_data');
        if (savedEmp) employeeData = JSON.parse(savedEmp);

        console.log("Data successfully loaded from localStorage");
    } catch (e) {
        console.error("Error loading data from localStorage", e);
    }
}

function saveDataToLocalStorage() {
    try {
        localStorage.setItem('dashboard_jiraData', JSON.stringify(jiraData));
        localStorage.setItem('dashboard_gitData', JSON.stringify(gitData));
        localStorage.setItem('dashboard_employeeData', JSON.stringify(employeeData));
        console.log("Data successfully saved to localStorage");
    } catch (e) {
        console.error("Error saving data to localStorage", e);
    }
}

// ==========================================
// 3. UI & TAB SWITCHING
// ==========================================
function initEventListeners() {
    // כפתורי הטאבים
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.getAttribute('data-tab');
            if (tab) switchTab(tab);
        });
    });

    // ייבוא קבצים (Excel / CSV / JSON)
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
}

function switchTab(tab) {
    currentTab = tab;
    
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    const chartsSection = document.getElementById('charts-section');
    const sidebarContainer = document.getElementById('sidebar-container');
    const dashboardLayout = document.getElementById('dashboard-layout');
    const btnAdd = document.getElementById('btn-add-record');

    if (tab === 'jira') {
        if (chartsSection) chartsSection.style.display = 'grid';
        if (sidebarContainer) sidebarContainer.style.display = 'block';
        if (dashboardLayout) dashboardLayout.classList.remove('full-width');
        if (btnAdd) btnAdd.style.display = 'inline-block';
        currentSortCol = 'Assignee';
        currentSortAsc = true;
    } else if (tab === 'git') {
        if (chartsSection) chartsSection.style.display = 'none';
        if (sidebarContainer) sidebarContainer.style.display = 'none';
        if (dashboardLayout) dashboardLayout.classList.add('full-width');
        
        // הסרת כפתור Add Record בטאב ה-Git
        if (btnAdd) btnAdd.style.display = 'none';
        
        currentSortCol = 'author';
        currentSortAsc = true;
    } else if (tab === 'employees') {
        if (chartsSection) chartsSection.style.display = 'none';
        if (sidebarContainer) sidebarContainer.style.display = 'none';
        if (dashboardLayout) dashboardLayout.classList.add('full-width');
        if (btnAdd) btnAdd.style.display = 'inline-block';
        currentSortCol = 'Name';
        currentSortAsc = true;
    }

    updateDashboard();
}

// ==========================================
// 4. MAIN DASHBOARD UPDATE & FILTERING
// ==========================================
function updateDashboard() {
    const tableTitle = document.getElementById('table-title');
    const filterRow = document.getElementById('table-filter-row');

    if (currentTab === 'jira') {
        if (tableTitle) tableTitle.innerHTML = "📋 Jira Transitions Matrix";
        
        const assigneeFilter = document.getElementById('jira-filter-assignee')?.value || '';
        const projectFilter = document.getElementById('jira-filter-project')?.value || '';
        const fromFilter = document.getElementById('jira-filter-from')?.value || '';
        const toFilter = document.getElementById('jira-filter-to')?.value || '';

        let filteredJira = (jiraData || []).filter(j => {
            if (assigneeFilter && j.Assignee !== assigneeFilter) return false;
            if (projectFilter && j.Project !== projectFilter) return false;
            if (fromFilter && j.FromStatus !== fromFilter) return false;
            if (toFilter && j.ToStatus !== toFilter) return false;
            return true;
        });

        filteredJira.sort((a, b) => {
            let valA = a[currentSortCol] !== undefined ? a[currentSortCol] : '',
                valB = b[currentSortCol] !== undefined ? b[currentSortCol] : '';
            if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
            return valA < valB ? (currentSortAsc ? -1 : 1) : (valA > valB ? (currentSortAsc ? 1 : -1) : 0);
        });

        if (typeof renderJiraTable === 'function') renderJiraTable(filteredJira);
        if (typeof renderJiraCharts === 'function') renderJiraCharts(filteredJira);

    } else if (currentTab === 'git') {
        if (tableTitle) tableTitle.innerHTML = "💻 Git Weekly Matrix Activity";
        
        // שליפת ערכי הסינון מהטבלה
        const authorFilter = document.getElementById('git-filter-author')?.value || '';
        const yearFilter = document.getElementById('git-filter-year')?.value || '';
        const weekFilter = document.getElementById('git-filter-week')?.value || '';
        const startFilter = document.getElementById('git-filter-start')?.value || '';
        const endFilter = document.getElementById('git-filter-end')?.value || '';

        let filteredGit = (gitData || []).filter(g => {
            const gAuthor = g.author || g.developer || g.user || g.name || '';
            const gYear = String(g.year || '');
            const gWeek = String(g.week_number || g.week || '');
            const gStart = g.week_start || '';
            const gEnd = g.week_end || '';

            // סינון מדויק לפי Author
            if (authorFilter && authorFilter !== '' && gAuthor !== authorFilter) return false;
            if (yearFilter && yearFilter !== '' && gYear !== yearFilter) return false;
            if (weekFilter && weekFilter !== '' && gWeek !== weekFilter) return false;
            
            // סינון לפי תאריכי התחלה וסיום
            if (startFilter && gStart < startFilter) return false;
            if (endFilter && gEnd > endFilter) return false;

            return true;
        });

        // מיון
        filteredGit.sort((a, b) => {
            let valA = a[currentSortCol] !== undefined ? a[currentSortCol] : '',
                valB = b[currentSortCol] !== undefined ? b[currentSortCol] : '';
            if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
            return valA < valB ? (currentSortAsc ? -1 : 1) : (valA > valB ? (currentSortAsc ? 1 : -1) : 0);
        });

        if (typeof renderGitTable === 'function') renderGitTable(filteredGit);

    } else if (currentTab === 'employees') {
        if (tableTitle) tableTitle.innerHTML = "👥 Resource Roster & Capacity";
        
        const nameFilter = document.getElementById('emp-filter-name')?.value || '';
        const roleFilter = document.getElementById('emp-filter-role')?.value || '';
        const locFilter = document.getElementById('emp-filter-loc')?.value || '';
        const projFilter = document.getElementById('emp-filter-proj')?.value || '';

        let filteredEmp = (employeeData || []).filter(e => {
            if (nameFilter && e.Name !== nameFilter) return false;
            if (roleFilter && e.Role !== roleFilter) return false;
            if (locFilter && e.Location !== locFilter) return false;
            if (projFilter && e.Project !== projFilter) return false;
            return true;
        });

        filteredEmp.sort((a, b) => {
            let valA = a[currentSortCol] !== undefined ? a[currentSortCol] : '',
                valB = b[currentSortCol] !== undefined ? b[currentSortCol] : '';
            if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
            return valA < valB ? (currentSortAsc ? -1 : 1) : (valA > valB ? (currentSortAsc ? 1 : -1) : 0);
        });

        if (typeof renderEmployeeTable === 'function') renderEmployeeTable(filteredEmp);
    }
}

// פונקציית מיון לפי עמודה
function sortTable(col) {
    if (currentSortCol === col) {
        currentSortAsc = !currentSortAsc;
    } else {
        currentSortCol = col;
        currentSortAsc = true;
    }
    updateDashboard();
}

// ==========================================
// 5. RENDER TABLE: GIT ACTIVITY (CUSTOMIZED)
// ==========================================
window.renderGitTable = function(data) {
    const tableHead = document.getElementById('table-head');
    const tableBody = document.getElementById('table-body');
    if (!tableHead || !tableBody) return;

    // חילוץ ערכים ייחודיים לפילטרים
    const rawGit = gitData || [];
    const authors = Array.from(new Set(rawGit.map(g => g.author || g.developer || g.name).filter(Boolean))).sort();
    const years = Array.from(new Set(rawGit.map(g => g.year).filter(Boolean))).sort();
    const weeks = Array.from(new Set(rawGit.map(g => g.week_number || g.week).filter(Boolean))).sort((a, b) => a - b);

    const currentAuthor = document.getElementById('git-filter-author')?.value || '';
    const currentYear = document.getElementById('git-filter-year')?.value || '';
    const currentWeek = document.getElementById('git-filter-week')?.value || '';
    const currentStart = document.getElementById('git-filter-start')?.value || '';
    const currentEnd = document.getElementById('git-filter-end')?.value || '';

    // כותרות ופילטרים - ללא ACTIONS וללא FILTER COUNT
    tableHead.innerHTML = `
        <tr>
            <th onclick="sortTable('author')" style="cursor:pointer;">AUTHOR ⇅</th>
            <th onclick="sortTable('year')" style="cursor:pointer;">YEAR ⇅</th>
            <th onclick="sortTable('week_number')" style="cursor:pointer;">WEEK NUMBER ⇅</th>
            <th onclick="sortTable('week_start')" style="cursor:pointer;">WEEK START ⇅</th>
            <th onclick="sortTable('week_end')" style="cursor:pointer;">WEEK END ⇅</th>
            <th onclick="sortTable('unique_tickets_count')" style="cursor:pointer;">UNIQUE TICKETS COUNT ⇅</th>
        </tr>
        <tr id="table-filter-row">
            <th>
                <select id="git-filter-author" onchange="updateDashboard()" class="table-filter-input">
                    <option value="">All Authors</option>
                    ${authors.map(a => `<option value="${a}" ${a === currentAuthor ? 'selected' : ''}>${a}</option>`).join('')}
                </select>
            </th>
            <th>
                <select id="git-filter-year" onchange="updateDashboard()" class="table-filter-input">
                    <option value="">All Years</option>
                    ${years.map(y => `<option value="${y}" ${String(y) === currentYear ? 'selected' : ''}>${y}</option>`).join('')}
                </select>
            </th>
            <th>
                <select id="git-filter-week" onchange="updateDashboard()" class="table-filter-input">
                    <option value="">All Weeks</option>
                    ${weeks.map(w => `<option value="${w}" ${String(w) === currentWeek ? 'selected' : ''}>Week ${w}</option>`).join('')}
                </select>
            </th>
            <th>
                <input type="date" id="git-filter-start" value="${currentStart}" onchange="updateDashboard()" class="table-filter-input" />
            </th>
            <th>
                <input type="date" id="git-filter-end" value="${currentEnd}" onchange="updateDashboard()" class="table-filter-input" />
            </th>
            <th></th>
        </tr>
    `;

    // שורות הנתונים בטבלה
    let html = '';
    data.forEach(item => {
        html += `
            <tr>
                <td style="font-weight:600;">${item.author || ''}</td>
                <td>${item.year || ''}</td>
                <td><span class="badge-week">Week ${item.week_number || ''}</span></td>
                <td>${item.week_start || ''}</td>
                <td>${item.week_end || ''}</td>
                <td><span class="badge-count">${item.unique_tickets_count || 0}</span></td>
            </tr>
        `;
    });

    tableBody.innerHTML = html || '<tr><td colspan="6" style="text-align:center; color:#64748b; padding:20px;">No Git records found</td></tr>';
};

// ==========================================
// 6. FILE UPLOAD HANDLING (AUTO-SAVE)
// ==========================================
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const reader = new FileReader();

    reader.onload = function(evt) {
        try {
            const content = evt.target.result;
            if (fileName.endsWith('.json')) {
                const parsed = JSON.parse(content);
                
                // בדיקת סוג הנתונים לפי המבנה
                if (Array.isArray(parsed) && parsed.length > 0 && ('author' in parsed[0] || 'unique_tickets_count' in parsed[0])) {
                    gitData = parsed;
                } else if (Array.isArray(parsed) && parsed.length > 0 && ('Assignee' in parsed[0])) {
                    jiraData = parsed;
                } else if (Array.isArray(parsed) && parsed.length > 0 && ('Role' in parsed[0])) {
                    employeeData = parsed;
                } else {
                    // ברירת מחדל לפי הטאב האקטיבי
                    if (currentTab === 'git') gitData = parsed;
                    else if (currentTab === 'jira') jiraData = parsed;
                    else if (currentTab === 'employees') employeeData = parsed;
                }
            }
            
            // שמירה אוטומטית ל-localStorage ורענון ה-UI
            saveDataToLocalStorage();
            updateDashboard();
            alert("File loaded and saved successfully!");

        } catch (err) {
            console.error("Error parsing uploaded file:", err);
            alert("Error reading file. Please make sure it is a valid format.");
        }
    };

    reader.readAsText(file);
}
