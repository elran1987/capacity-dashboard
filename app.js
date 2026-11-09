// ==========================================
// DASHBOARD MAIN SCRIPT (app.js - Zero Collision)
// ==========================================

// שימוש ישיר ב-window ללא הצהרות let/const שגורמות להתנגשויות
window.jiraData = window.jiraData || [];
window.gitData = window.gitData || [];
window.employeeData = window.employeeData || [];

// טעינת הנתונים בעליית העמוד
document.addEventListener('DOMContentLoaded', () => {
    loadDataFromLocalStorage();
    
    if (typeof initEventListeners === 'function') {
        try { initEventListeners(); } catch(e) { console.error(e); }
    }
    
    if (typeof updateDashboard === 'function') {
        try { updateDashboard(); } catch(e) { console.error(e); }
    }
});

// ==========================================
// 1. LOCALSTORAGE MANAGEMENT
// ==========================================
function loadDataFromLocalStorage() {
    try {
        const savedJira = localStorage.getItem('dashboard_jiraData');
        if (savedJira) window.jiraData = JSON.parse(savedJira);

        const savedGit = localStorage.getItem('dashboard_gitData');
        if (savedGit) window.gitData = JSON.parse(savedGit);

        const savedEmp = localStorage.getItem('dashboard_employeeData');
        if (savedEmp) window.employeeData = JSON.parse(savedEmp);
        
        console.log("Data loaded successfully from localStorage.");
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
        console.log("Data saved successfully to localStorage.");
    } catch (e) {
        console.error("Error saving data to localStorage:", e);
    }
}

// ==========================================
// 2. FILE UPLOAD HANDLER (משויך ל-window למניעת שגיאת TypeError)
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
                if (fileName.includes('git') || (parsed[0] && 'author' in parsed[0])) {
                    window.gitData = parsed;
                } else if (fileName.includes('jira') || (parsed[0] && ('Assignee' in parsed[0] || 'Key' in parsed[0]))) {
                    window.jiraData = parsed;
                } else if (fileName.includes('employee') || fileName.includes('resource') || (parsed[0] && 'Role' in parsed[0])) {
                    window.employeeData = parsed;
                } else {
                    if (typeof currentTab !== 'undefined') {
                        if (currentTab === 'git') window.gitData = parsed;
                        else if (currentTab === 'jira') window.jiraData = parsed;
                        else window.employeeData = parsed;
                    } else {
                        window.employeeData = parsed;
                    }
                }
                
                saveDataToLocalStorage();
                if (typeof updateDashboard === 'function') updateDashboard();
                alert("הקובץ נטען ונשמר בהצלחה!");
            } else {
                alert("הקובץ חייב להכיל מערך נתונים (Array) תקין.");
            }
        } catch (err) {
            console.error("שגיאה בניתוח קובץ ה-JSON:", err);
            alert("שגיאה בקריאת הקובץ.");
        }
    };

    reader.readAsText(file);
};

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
        if (gitRes.ok) window.gitData = await gitRes.json();

        const jiraRes = await fetch(files.jira);
        if (jiraRes.ok) window.jiraData = await jiraRes.json();

        const empRes = await fetch(files.employees);
        if (empRes.ok) window.employeeData = await empRes.json();

        saveDataToLocalStorage();
        
        if (typeof updateDashboard === 'function') {
            updateDashboard();
        }
        
        alert("הנתונים נמשכו בהצלחה מ-GitHub ונשמרו בדשבורד!");

    } catch (err) {
        console.error("שגיאה במשיכת נתונים מ-GitHub:", err);
        alert("שגיאה במשיכת הנתונים מ-GitHub.");
    }
};
