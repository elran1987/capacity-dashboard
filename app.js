// ==========================================
// DASHBOARD MAIN SCRIPT (app.js - GitHub Sync & Persistent)
// ==========================================

let jiraData = [];
let gitData = [];
let employeeData = [];
let currentTab = 'jira';

let currentSortCol = '';
let currentSortAsc = true;

document.addEventListener('DOMContentLoaded', () => {
    loadDataFromLocalStorage();
    initEventListeners();
    switchTab('jira');
});

// ==========================================
// 1. LOCALSTORAGE MANAGEMENT (שמירה וטעינה חסינה למניעת איבוד דאטה)
// ==========================================
function loadDataFromLocalStorage() {
    try {
        const savedJira = localStorage.getItem('dashboard_jiraData');
        if (savedJira) {
            jiraData = JSON.parse(savedJira);
            console.log("Loaded Jira data from storage:", jiraData.length);
        }

        const savedGit = localStorage.getItem('dashboard_gitData');
        if (savedGit) {
            gitData = JSON.parse(savedGit);
            console.log("Loaded Git data from storage:", gitData.length);
        }

        const savedEmp = localStorage.getItem('dashboard_employeeData');
        if (savedEmp) {
            employeeData = JSON.parse(savedEmp);
            console.log("Loaded Employee data from storage:", employeeData.length);
        }
    } catch (e) {
        console.error("Error loading data from localStorage:", e);
    }
}

function saveDataToLocalStorage() {
    try {
        localStorage.setItem('dashboard_jiraData', JSON.stringify(jiraData));
        localStorage.setItem('dashboard_gitData', JSON.stringify(gitData));
        localStorage.setItem('dashboard_employeeData', JSON.stringify(employeeData));
        localStorage.setItem('dashboard_last_saved', new Date().toISOString());
        console.log("Data successfully saved to localStorage.");
    } catch (e) {
        console.error("Error saving data to localStorage:", e);
    }
}

// ==========================================
// 2. EVENT LISTENERS & TABS
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
        if (btnAdd) btnAdd.style.display = 'inline-block';
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
// 3. UPDATE DASHBOARD & TABLES
// ==========================================
function updateDashboard() {
    const tableTitle = document.getElementById('table-title');

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

        if (currentSortCol) {
            filteredJira.sort((a, b) => {
                let valA = a[currentSortCol] !== undefined ? a[currentSortCol] : '',
                    valB = b[currentSortCol] !== undefined ? b[currentSortCol] : '';
                if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
                return valA < valB ? (currentSortAsc ? -1 : 1) : (valA > valB ? (currentSortAsc ? 1 : -1) : 0);
            });
        }

        if (typeof renderJiraTable === 'function') renderJiraTable(filteredJira);
        if (typeof renderJiraCharts === 'function') renderJiraCharts(filteredJira);

    } else if (currentTab === 'git') {
        if (tableTitle) tableTitle.innerHTML = "💻 Git Weekly Matrix Activity";
        
        let filteredGit = gitData || [];
        if (currentSortCol) {
            filteredGit.sort((a, b) => {
                let valA = a[currentSortCol] !== undefined ? a[currentSortCol] : '',
                    valB = b[currentSortCol] !== undefined ? b[currentSortCol] : '';
                if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
                return valA < valB ? (currentSortAsc ? -1 : 1) : (valA > valB ? (currentSortAsc ? 1 : -1) : 0);
            });
        }

        if (typeof renderGitTable === 'function') renderGitTable(filteredGit);

    } else if (currentTab === 'employees') {
        if (tableTitle) tableTitle.innerHTML = "👥 Resource Roster & Capacity";
        
        let filteredEmp = employeeData || [];
        if (currentSortCol) {
            filteredEmp.sort((a, b) => {
                let valA = a[currentSortCol] !== undefined ? a[currentSortCol] : '',
                    valB = b[currentSortCol] !== undefined ? b[currentSortCol] : '';
                if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
                return valA < valB ? (currentSortAsc ? -1 : 1) : (valA > valB ? (currentSortAsc ? 1 : -1) : 0);
            });
        }

        if (typeof renderEmployeeTable === 'function') renderEmployeeTable(filteredEmp);
    }
}

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
// 4. FILE UPLOAD & PERSISTENCE
// ==========================================
function handleFileUpload(e) {
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
                        gitData = parsed;
                    } else if ('Assignee' in sample || fileName.includes('jira')) {
                        jiraData = parsed;
                    } else if ('Role' in sample || fileName.includes('employee')) {
                        employeeData = parsed;
                    } else {
                        if (currentTab === 'git') gitData = parsed;
                        else if (currentTab === 'jira') jiraData = parsed;
                        else if (currentTab === 'employees') employeeData = parsed;
                    }
                } else {
                    if (currentTab === 'git') gitData = parsed;
                    else if (currentTab === 'jira') jiraData = parsed;
                    else if (currentTab === 'employees') employeeData = parsed;
                }
            } else {
                alert("הקובץ חייב להכיל מערך נתונים (Array) תקין.");
                return;
            }
            
            saveDataToLocalStorage();
            updateDashboard();
            alert("הקובץ נטען ונשמר בהצלחה!");

        } catch (err) {
            console.error("שגיאה בניתוח קובץ ה-JSON:", err);
            alert("שגיאה בקריאת הקובץ. וודא שהוא בפורמט JSON תקין.");
        }
    };

    reader.readAsText(file);
}

// ==========================================
// 5. FETCH DIRECTLY FROM GITHUB RAW
// ==========================================
async function fetchDataFromGitHub() {
    // ניתן לעדכן את שמות הקבצים כאן בהתאם לשמות שקיימים בריפו שלך ב-GitHub
    const files = {
        git: 'https://raw.githubusercontent.com/elran1987/capacity-dashboard/main/git_matrix.json',
        jira: 'https://raw.githubusercontent.com/elran1987/capacity-dashboard/main/jira_matrix.json',
        employees: 'https://raw.githubusercontent.com/elran1987/capacity-dashboard/main/employees.json'
    };

    try {
        console.log("Fetching data from GitHub...");

        const gitRes = await fetch(files.git);
        if (gitRes.ok) {
            gitData = await gitRes.json();
        }

        const jiraRes = await fetch(files.jira);
        if (jiraRes.ok) {
            jiraData = await jira
