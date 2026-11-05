// ==========================================
// 1. STATE & DATA INITIALIZATION (Safe from re-declaration)
// ==========================================
window.jiraData = window.jiraData || [];
window.gitData = window.gitData || [];
window.employeeData = window.employeeData || [];

window.currentTab = window.currentTab || 'jira';
window.currentSortCol = window.currentSortCol || 'Assignee';
window.currentSortAsc = window.currentSortAsc !== undefined ? window.currentSortAsc : true;

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
        if (savedJira) window.jiraData = JSON.parse(savedJira);

        const savedGit = localStorage.getItem('dashboard_gitData') || localStorage.getItem('dashboard_git_data');
        if (savedGit) window.gitData = JSON.parse(savedGit);

        const savedEmp = localStorage.getItem('dashboard_employeeData') || localStorage.getItem('dashboard_employee_data');
        if (savedEmp) window.employeeData = JSON.parse(savedEmp);
    } catch (e) {
        console.error("Error loading data from localStorage", e);
    }
}

function saveDataToLocalStorage() {
    try {
        localStorage.setItem('dashboard_jiraData', JSON.stringify(window.jiraData));
        localStorage.setItem('dashboard_gitData', JSON.stringify(window.gitData));
        localStorage.setItem('dashboard_employeeData', JSON.stringify(window.employeeData));
    } catch (e) {
        console.error("Error saving data to localStorage", e);
    }
}

// ==========================================
// 3. UI & TAB SWITCHING
// ==========================================
function initEventListeners() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.getAttribute('data-tab');
            if (tab) switchTab(tab);
        });
    });

    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.addEventListener('change', window.handleFileUpload);
    }
}

function switchTab(tab) {
    window.currentTab = tab;
    
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
        window.currentSortCol = 'Assignee';
        window.currentSortAsc = true;
    } else if (tab === 'git') {
        if (chartsSection) chartsSection.style.display = 'none';
        if (sidebarContainer) sidebarContainer.style.display = 'none';
        if (dashboardLayout) dashboardLayout.classList.add('full-width');
        if (btnAdd) btnAdd.style.display = 'none';
        window.currentSortCol = 'author';
        window.currentSortAsc = true;
    } else if (tab === 'employees') {
        if (chartsSection) chartsSection.style.display = 'none';
        if (sidebarContainer) chartsSection.style.display = 'none';
        if (dashboardLayout) dashboardLayout.classList.add('full-width');
        if (btnAdd) btnAdd.style.display = 'inline-block';
        window.currentSortCol = 'Name';
        window.currentSortAsc = true;
    }

    updateDashboard();
}

// ==========================================
// 4. MAIN DASHBOARD UPDATE & FILTERING
// ==========================================
function updateDashboard() {
    const tableTitle = document.getElementById('table-title');

    if (window.currentTab === 'jira') {
        if (tableTitle) tableTitle.innerHTML = "📋 Jira Transitions Matrix";
        
        const assigneeFilter = document.getElementById('jira-filter-assignee')?.value || '';
        const projectFilter = document.getElementById('jira-filter-project')?.value || '';
        const fromFilter = document.getElementById('jira-filter-from')?.value || '';
        const toFilter = document.getElementById('jira-filter-to')?.value || '';

        let filteredJira = (window.jiraData || []).filter(j => {
            if (assigneeFilter && j.Assignee !== assigneeFilter) return false;
            if (projectFilter && j.Project !== projectFilter) return false;
            if (fromFilter && j.FromStatus !== fromFilter) return false;
            if (toFilter && j.ToStatus !== toFilter) return false;
            return true;
        });

        filteredJira.sort((a, b) => {
            let valA = a[window.currentSortCol] !== undefined ? a[window.currentSortCol] : '',
                valB = b[window.currentSortCol] !== undefined ? b[window.currentSortCol] : '';
            if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
            return valA < valB ? (window.currentSortAsc ? -1 : 1) : (valA > valB ? (window.currentSortAsc ? 1 : -1) : 0);
        });

        if (typeof renderJiraTable === 'function') renderJiraTable(filteredJira);
        if (typeof renderJiraCharts === 'function') renderJiraCharts(filteredJira);

    } else if (window.currentTab === 'git') {
        if (tableTitle) tableTitle.innerHTML = "💻 Git Weekly Matrix Activity";
        
        const authorFilter = document.getElementById('git-filter-author')?.value || '';
        const yearFilter = document.getElementById('git-filter-year')?.value || '';
        const weekFilter = document.getElementById('git-filter-week')?.value || '';
        const startFilter = document.getElementById('git-filter-start')?.value || '';
        const endFilter = document.getElementById('git-filter-end')?.value || '';

        let filteredGit = (window.gitData || []).filter(g => {
            const gAuthor = g.author || g.developer || g.user || g.name || '';
            const gYear = String(g.year || '');
            const gWeek = String(g.week_number || g.week || '');
            const gStart = g.week_start || '';
            const gEnd = g.week_end || '';

            if (authorFilter && authorFilter !== '' && gAuthor !== authorFilter) return false;
            if (yearFilter && yearFilter !== '' && gYear !== yearFilter) return false;
            if (weekFilter && weekFilter !== '' && gWeek !== weekFilter) return false;
            if (startFilter && gStart < startFilter) return false;
            if (endFilter && gEnd > endFilter) return false;

            return true;
        });

        filteredGit.sort((a, b) => {
            let valA = a[window.currentSortCol] !== undefined ? a[window.currentSortCol] : '',
                valB = b[window.currentSortCol] !== undefined ? b[window.currentSortCol] : '';
            if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
            return valA < valB ? (window.currentSortAsc ? -1 : 1) : (valA > valB ? (window.currentSortAsc ? 1 : -1) : 0);
        });

        if (typeof renderGitTable === 'function') renderGitTable(filteredGit);

    } else if (window.currentTab === 'employees') {
        if (tableTitle) tableTitle.innerHTML = "👥 Resource Roster & Capacity";
        
        const nameFilter = document.getElementById('emp-filter-name')?.value || '';
        const roleFilter = document.getElementById('emp-filter-role')?.value || '';
        const locFilter = document.getElementById('emp-filter-loc')?.value || '';
        const projFilter = document.getElementById('emp-filter-proj')?.value || '';

        let filteredEmp = (window.employeeData || []).filter(e => {
            if (nameFilter && e.Name !== nameFilter) return false;
            if (roleFilter && e.Role !== roleFilter) return false;
            if (locFilter && e.Location !== locFilter) return false;
            if (projFilter && e.Project !== projFilter) return false;
            return true;
        });

        filteredEmp.sort((a, b) => {
            let valA = a[window.currentSortCol] !== undefined ? a[window.currentSortCol] : '',
                valB = b[window.currentSortCol] !== undefined ? b[window.currentSortCol] : '';
            if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
            return valA < valB ? (window.currentSortAsc ? -1 : 1) : (valA > valB ? (window.currentSortAsc ? 1 : -1) : 0);
        });

        if (typeof renderEmployeeTable === 'function') renderEmployeeTable(filteredEmp);
    }
}

function sortTable(col) {
    if (window.currentSortCol === col) {
        window.currentSortAsc = !window.currentSortAsc;
    } else {
        window.currentSortCol = col;
        window.currentSortAsc = true;
    }
    updateDashboard();
}

// ==========================================
// 5. RENDER GIT TABLE
// ==========================================
window.renderGitTable = function(data) {
    const tableHead = document.getElementById('table-head');
    const tableBody = document.getElementById('table-body');
    if (!tableHead || !tableBody) return;

    const rawGit = window.gitData || [];
    const authors = Array.from(new Set(rawGit.map(g => g.author || g.developer || g.name).filter(Boolean))).sort();
    const years = Array.from(new Set(rawGit.map(g => g.year).filter(Boolean))).sort();
    const weeks = Array.from(new Set(rawGit.map(g => g.week_number || g.week).filter(Boolean))).sort((a, b) => a - b);

    const currentAuthor = document.getElementById('git-filter-author')?.value || '';
    const currentYear = document.getElementById('git-filter-year')?.value || '';
    const currentWeek = document.getElementById('git-filter-week')?.value || '';
    const currentStart = document.getElementById('git-filter-start')?.value || '';
    const currentEnd = document.getElementById('git-filter-end')?.value || '';

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
// 6. FILE UPLOAD HANDLING (EXPOSED TO WINDOW)
// ==========================================
window.handleFileUpload = function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const reader = new FileReader();

    reader.onload = function(evt) {
        try {
            const content = evt.target.result;
            const parsed = JSON.parse(content);
            
            if (Array.isArray(parsed)) {
                if (parsed.length > 0) {
                    const sample = parsed[0];
                    if ('author' in sample || 'unique_tickets_count' in sample || fileName.includes('git')) {
                        window.gitData = parsed;
                    } else if ('Assignee' in sample || fileName.includes('jira')) {
                        window.jiraData = parsed;
                    } else if ('Role' in sample || fileName.includes('employee')) {
                        window.employeeData = parsed;
                    } else {
                        if (window.currentTab === 'git') window.gitData = parsed;
                        else if (window.currentTab === 'jira') window.jiraData = parsed;
                        else if (window.currentTab === 'employees') window.employeeData = parsed;
                    }
                } else {
                    if (window.currentTab === 'git') window.gitData = parsed;
                    else if (window.currentTab === 'jira') window.jiraData = parsed;
                    else if (window.currentTab === 'employees') window.employeeData = parsed;
                }
            } else {
                alert("The uploaded JSON file must be an array of records.");
                return;
            }
            
            saveDataToLocalStorage();
            updateDashboard();
            alert("File loaded and saved successfully!");

        } catch (err) {
            console.error("Error parsing uploaded file:", err);
            alert("Error reading file. Please make sure it is a valid JSON format.");
        }
    };

    reader.readAsText(file);
};
