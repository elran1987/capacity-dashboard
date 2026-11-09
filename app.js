// ==========================================
// DASHBOARD MAIN SCRIPT (app.js - Fix Data Rendering)
// ==========================================

window.jiraData = window.jiraData || [];
window.gitData = window.gitData || [];
window.employeeData = window.employeeData || [];

document.addEventListener('DOMContentLoaded', () => {
    loadDataFromLocalStorage();
    
    if (typeof initEventListeners === 'function') {
        try { initEventListeners(); } catch(e) { console.error(e); }
    }
    
    // רענון ראשוני של התצוגה בעליית העמוד
    triggerDashboardRefresh();
});

// ==========================================
// 1. LOCALSTORAGE MANAGEMENT
// ==========================================
function loadDataFromLocalStorage() {
    try {
        const savedJira = localStorage.getItem('dashboard_jiraData');
        if (savedJira) {
            window.jiraData = JSON.parse(savedJira);
            if (typeof jiraData !== 'undefined') jiraData = window.jiraData; // תאימות לקבצים אחרים
        }

        const savedGit = localStorage.getItem('dashboard_gitData');
        if (savedGit) {
            window.gitData = JSON.parse(savedGit);
            if (typeof gitData !== 'undefined') gitData = window.gitData;
        }

        const savedEmp = localStorage.getItem('dashboard_employeeData');
        if (savedEmp) {
            window.employeeData = JSON.parse(savedEmp);
            if (typeof employeeData !== 'undefined') employeeData = window.employeeData;
        }
        
        console.log("Data loaded from localStorage:", {
            jira: window.jiraData.length,
            git: window.gitData.length,
            employees: window.employeeData.length
        });
    } catch (e) {
        console.error("Error loading data from localStorage:", e);
    }
}

function saveDataToLocalStorage() {
    try {
        localStorage.setItem('dashboard_jiraData', JSON.stringify(window.jiraData));
        localStorage.setItem('dashboard_gitData', JSON.stringify(window.gitData));
        localStorage.setItem('dashboard_employeeData', JSON.stringify(window.employeeData));
        localStorage.setItem('dashboard_last_saved', new Date().toISOString());
        console.log("Data saved to localStorage successfully.");
    } catch (e) {
        console.error("Error saving data to localStorage:", e);
    }
}

// ==========================================
// 2. FILE UPLOAD HANDLER (Excel / CSV / JSON)
// ==========================================
window.handleFileUpload = function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            try {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const parsed = XLSX.utils.sheet_to_json(worksheet);

                processAndSaveData(parsed, fileName);
            } catch (err) {
                console.error("שגיאה בניתוח קובץ האקסל:", err);
                alert("שגיאה בקריאת קובץ האקסל.");
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        const reader = new FileReader();
        reader.onload = function(evt) {
            try {
                const content = evt.target.result;
                const parsed = JSON.parse(content);
                processAndSaveData(parsed, fileName);
            } catch (err) {
                console.error("שגיאה בניתוח קובץ ה-JSON:", err);
                alert("שגיאה בקריאת קובץ ה-JSON.");
            }
        };
        reader.readAsText(file);
    }
};

function processAndSaveData(parsed, fileName) {
    if (Array.isArray(parsed)) {
        if (fileName.includes('git') || (parsed[0] && 'author' in parsed[0])) {
            window.gitData = parsed;
            if (typeof gitData !== 'undefined') gitData = parsed;
        } else if (fileName.includes('jira') || (parsed[0] && ('Assignee' in parsed[0] || 'Key' in parsed[0]))) {
            window.jiraData = parsed;
            if (typeof jiraData !== 'undefined') jiraData = parsed;
        } else if (fileName.includes('employee') || fileName.includes('resource') || (parsed[0] && 'Role' in parsed[0])) {
            window.employeeData = parsed;
            if (typeof employeeData !== 'undefined') employeeData = parsed;
        } else {
            if (typeof currentTab !== 'undefined') {
                if (currentTab === 'git') { window.gitData = parsed; if (typeof gitData !== 'undefined') gitData = parsed; }
                else if (currentTab === 'jira') { window.jiraData = parsed; if (typeof jiraData !== 'undefined') jiraData = parsed; }
                else { window.employeeData = parsed; if (typeof employeeData !== 'undefined') employeeData = parsed; }
            } else {
                window.employeeData = parsed;
                if (typeof employeeData !== 'undefined') employeeData = parsed;
            }
        }
        
        saveDataToLocalStorage();
        triggerDashboardRefresh();
        alert("הקובץ נטען, נשמרו הנתונים והדשבורד עודכן בהצלחה!");
    } else {
        alert("הנתונים בקובץ אינם במבנה של מערך (Array) תקין.");
    }
}

// ==========================================
// 3. FETCH FROM GITHUB RAW
// ==========================================
window.fetchDataFromGitHub = async function() {
    const files = {
        git: 'https://raw.githubusercontent.com/elran1987/capacity-dashboard/main/git_matrix.json',
        jira: 'https://raw.githubusercontent.com/elran1987/capacity-dashboard/main/jira_matrix.json',
        employees: 'https://raw.githubusercontent.com/elran1987/capacity-dashboard/main/employees.json'
    };

    try {
        console.log("Fetching datasets from GitHub...");

        const gitRes = await fetch(files.git);
        if (gitRes.ok) {
            window.gitData = await gitRes.json();
            if (typeof gitData !== 'undefined') gitData = window.gitData;
        }

        const jiraRes = await fetch(files.jira);
        if (jiraRes.ok) {
            window.jiraData = await jiraRes.json();
            if (typeof jiraData !== 'undefined') jiraData = window.jiraData;
        }

        const empRes = await fetch(files.employees);
        if (empRes.ok) {
            window.employeeData = await empRes.json();
            if (typeof employeeData !== 'undefined') employeeData = window.employeeData;
        }

        saveDataToLocalStorage();
        triggerDashboardRefresh();
        
        alert("הנתונים נמשכו בהצלחה מ-GitHub והוצגו בדשבורד!");

    } catch (err) {
        console.error("שגיאה במשיכת נתונים מ-GitHub:", err);
        alert("שגיאה במשיכת הנתונים מ-GitHub. וודא שכתובות ה-Raw תקינות ושוררת גישה אליהן.");
    }
};

// ==========================================
// 4. TRIGGER DASHBOARD REFRESH (רענון תצוגת הטבלאות והגרפים)
// ==========================================
function triggerDashboardRefresh() {
    // הפעלת פונקציית העדכון הראשית של הדשבורד אם קיימת
    if (typeof updateDashboard === 'function') {
        try { updateDashboard(); } catch (e) { console.error("Error in updateDashboard:", e); }
    }

    // הפעלת פונקציות הציור הפרטניות של הקבצים האחרים כדי לוודא שהם מציגים את הדאטה
    if (typeof renderEmployeeTable === 'function' && window.employeeData.length > 0) {
        try { renderEmployeeTable(window.employeeData); } catch (e) { console.error(e); }
    }
    if (typeof renderJiraTable === 'function' && window.jiraData.length > 0) {
        try { renderJiraTable(window.jiraData); } catch (e) { console.error(e); }
    }
    if (typeof renderGitTable === 'function' && window.gitData.length > 0) {
        try { renderGitTable(window.gitData); } catch (e) { console.error(e); }
    }
}
