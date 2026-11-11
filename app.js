// ==========================================
// הגדרת חיבור ל-Supabase
// ==========================================
const SUPABASE_URL = 'https://gqhhxrwvczloycagiax.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_zWLjUQUEHlhVE1ZPFwLFSg_51pf8_9y';

// יצירת הקליינט והצמדתו לגלובל (בדיקה למניעת כפילות)
if (!window.supabaseClient) {
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// שימוש ב-var או בדיקה כדי למנוע שגיאת הכרזה כפולה
if (typeof employeeData === 'undefined') {
    var employeeData = [];
}

let currentTab = 'resources';
let currentSortCol = 'FTE';
let currentSortAsc = false;

// פונקציה לשליפת המשאבים מטבלת master_resources בסופרבייס
async function loadResourcesFromDB() {
    try {
        const { data, error } = await window.supabaseClient
            .from('master_resources')
            .select('*');

        if (error) {
            console.error("שגיאה בשליפת המשאבים מסופרבייס:", error.message);
            return [];
        }

        console.log(`נטענו בהצלחה ${data.length} רשומות מהדאטה-בייס.`);

        return (data || []).map(row => ({
            Name: row.name || row.Name || '',
            Role: row.role || row.Role || '',
            Location: row.location || row.Location || '',
            Project: row.project || row.Project || '',
            FTE: parseFloat(row.fte !== undefined ? row.fte : row.FTE) || 1.0
        }));
    } catch (err) {
        console.error("שגיאת תקשורת מול סופרבייס:", err);
        return [];
    }
}

window.initDashboard = async function() {
    // טעינת הנתונים מהדאטה-בייס בעליית העמוד
    employeeData = await loadResourcesFromDB();
    if (typeof populateDropdowns === 'function') populateDropdowns();
    updateDashboard();
}

window.switchTab = function(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-btn-${tab}`).classList.add('active');

    const chartsSection = document.getElementById('charts-section');
    const btnAdd = document.getElementById('btn-add-action');
    const sidebarContainer = document.getElementById('sidebar-container');
    const dashboardLayout = document.getElementById('dashboard-layout');

    if (tab === 'resources') {
        chartsSection.style.display = 'grid';
        sidebarContainer.style.display = 'flex';
        dashboardLayout.classList.remove('full-width');
        document.getElementById('sidebar-filters-panel').style.display = 'block';
        document.getElementById('sidebar-fte-panel').style.display = 'block';
        btnAdd.style.display = 'inline-flex';
        btnAdd.innerText = '+ Add Employee';
        currentSortCol = 'FTE';
        currentSortAsc = false;
    } else if (tab === 'jira') {
        chartsSection.style.display = 'none';
        sidebarContainer.style.display = 'flex';
        dashboardLayout.classList.remove('full-width');
        document.getElementById('sidebar-filters-panel').style.display = 'block';
        document.getElementById('sidebar-fte-panel').style.display = 'none';
        btnAdd.style.display = 'inline-flex';
        btnAdd.innerText = '+ Add Jira Issue';
        currentSortCol = 'Assignee';
        currentSortAsc = true;
    } else if (tab === 'git') {
        chartsSection.style.display = 'none';
        sidebarContainer.style.display = 'none';
        dashboardLayout.classList.add('full-width');
        btnAdd.style.display = 'inline-flex';
        btnAdd.innerText = '+ Add Git Record';
        currentSortCol = 'author';
        currentSortAsc = true;
    }
    updateDashboard();
}

window.updateDashboard = function() {
    if (currentTab === 'resources') {
        document.getElementById('table-title').innerHTML = "👥 Interactive Resource Table & Edit Suite";
        document.getElementById('table-filter-row').style.display = 'none';
        const filtered = getFilteredResources();

        filtered.sort((a, b) => {
            let valA = a[currentSortCol], valB = b[currentSortCol];
            if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
            return valA < valB ? (currentSortAsc ? -1 : 1) : (valA > valB ? (currentSortAsc ? 1 : -1) : 0);
        });

        renderResourceTable(filtered);
        renderSidebarProjectFTE(filtered);
        renderResourceCharts(filtered);
    } else if (currentTab === 'jira') {
        document.getElementById('table-title').innerHTML = "🎫 Jira Issues Tracking";
        document.getElementById('table-filter-row').style.display = 'table-row';
        
        const proj = document.getElementById('filter-project').value;
        let filteredJira = (typeof jiraData !== 'undefined' ? jiraData : []).filter(j => {
            if (proj && j.Project !== proj) return false;
            return true;
        });

        filteredJira.sort((a, b) => {
            let valA = a[currentSortCol], valB = b[currentSortCol];
            if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
            return valA < valB ? (currentSortAsc ? -1 : 1) : (valA > valB ? (currentSortAsc ? 1 : -1) : 0);
        });

        if (typeof renderJiraTable === 'function') renderJiraTable(filteredJira);
    } else if (currentTab === 'git') {
        document.getElementById('table-title').innerHTML = "💻 Git Weekly Matrix Activity";
        document.getElementById('table-filter-row').style.display = 'table-row';
        
        let filteredGit = (typeof gitData !== 'undefined' ? gitData : []);

        filteredGit.sort((a, b) => {
            let valA = a[currentSortCol], valB = b[currentSortCol];
            if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
            return valA < valB ? (currentSortAsc ? -1 : 1) : (valA > valB ? (currentSortAsc ? 1 : -1) : 0);
        });

        if (typeof renderGitTable === 'function') renderGitTable(filteredGit);
    }
}

window.handleFileUpload = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.json')) {
        reader.onload = function(e) {
            try {
                const parsed = JSON.parse(e.target.result);
                const json = Array.isArray(parsed) ? parsed : (parsed.data || parsed.issues || parsed.commits || parsed.matrix || [parsed]);
                processParsedData(json);
            } catch (err) {
                console.error(err);
                alert("Error parsing JSON file.");
            }
        };
        reader.readAsText(file);
    } else {
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
                if (rawJson.length === 0) { alert("File is empty."); return; }
                processParsedData(rawJson);
            } catch (err) {
                console.error(err);
                alert("Error reading file.");
            }
        };
        reader.readAsArrayBuffer(file);
    }
    event.target.value = '';
}

function processParsedData(json) {
    if (!json || json.length === 0) return;
    alert(`Successfully processed ${json.length} records!`);
    updateDashboard();
}

window.filterByProject = function(projName) {
    document.getElementById('filter-project').value = projName;
    updateDashboard();
}

window.sortTable = function(col) {
    if (currentSortCol === col) {
        currentSortAsc = !currentSortAsc;
    } else {
        currentSortCol = col;
        currentSortAsc = (col === 'FTE' || col === 'unique_tickets_count' || col === 'year' || col === 'week_number') ? false : true;
    }
    updateDashboard();
}

window.resetFilters = function() {
    document.getElementById('filter-project').value = '';
    document.getElementById('filter-role').value = '';
    document.getElementById('filter-location').value = '';
    updateDashboard();
}

window.openModal = function() {
    document.getElementById('edit-index').value = -1;
    const title = currentTab === 'resources' ? 'Add New Employee' : currentTab === 'jira' ? 'Add Jira Issue' : 'Add Git Matrix Record';
    document.getElementById('modal-title').innerText = title;
    
    const formBody = document.getElementById('modal-form-body');
    if (currentTab === 'resources') {
        formBody.innerHTML = `
            <div class="form-group" style="margin:0;"><label>Name</label><input type="text" id="m-name" placeholder="Full Name"></div>
            <div class="form-group" style="margin:0;"><label>Role</label><input type="text" id="m-role" placeholder="Role"></div>
            <div class="form-group" style="margin:0;"><label>Location</label><input type="text" id="m-location" placeholder="Location"></div>
            <div class="form-group" style="margin:0;"><label>Project</label><input type="text" id="m-project" placeholder="Project"></div>
            <div class="form-group" style="margin:0;"><label>FTE</label><input type="number" step="0.01" id="m-fte" value="1.0"></div>
        `;
    }
    document.getElementById('employeeModal').classList.add('active');
}

window.closeModal = function() {
    document.getElementById('employeeModal').classList.remove('active');
}

window.saveRecord = function() {
    closeModal();
    updateDashboard();
}

window.onload = function() {
    initDashboard();
}
