// ==========================================
// הגדרת חיבור ל-Supabase
// ==========================================
const SUPABASE_URL = 'https://gqhhxrwvczloycagiax.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_zWLjUQUEHlhVE1ZPFwLFSg_51pf8_9y';

// יצירת הקליינט והצמדתו לגלובל
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let employeeData = [];
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
        let filteredJira = jiraData.filter(j => {
            if (proj && j.Project !== proj) return false;
            if (jiraFilters.Assignee && j.Assignee !== jiraFilters.Assignee) return false;
            if (jiraFilters.Project && j.Project !== jiraFilters.Project) return false;
            if (jiraFilters.FromStatus && j.FromStatus !== jiraFilters.FromStatus) return false;
            if (jiraFilters.ToStatus && j.ToStatus !== jiraFilters.ToStatus) return false;
            if (jiraFilters.Issues && !j.Issues.toLowerCase().includes(jiraFilters.Issues.toLowerCase())) return false;
            return true;
        });

        filteredJira.sort((a, b) => {
            let valA = a[currentSortCol], valB = b[currentSortCol];
            if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
            return valA < valB ? (currentSortAsc ? -1 : 1) : (valA > valB ? (currentSortAsc ? 1 : -1) : 0);
        });

        renderJiraTable(filteredJira);
    } else if (currentTab === 'git') {
        document.getElementById('table-title').innerHTML = "💻 Git Weekly Matrix Activity";
        document.getElementById('table-filter-row').style.display = 'table-row';
        
        let filteredGit = gitData.filter(g => {
            if (gitFilters.author && g.author !== gitFilters.author) return false;
            if (gitFilters.year && String(g.year) !== String(gitFilters.year)) return false;
            if (gitFilters.week_number && String(g.week_number) !== String(gitFilters.week_number)) return false;
            if (gitFilters.unique_tickets_count && String(g.unique_tickets_count) !== String(gitFilters.unique_tickets_count)) return false;
            return true;
        });

        filteredGit.sort((a, b) => {
            let valA = a[currentSortCol], valB = b[currentSortCol];
            if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
            return valA < valB ? (currentSortAsc ? -1 : 1) : (valA > valB ? (currentSortAsc ? 1 : -1) : 0);
        });

        renderGitTable(filteredGit);
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
                const parsed = JSON.parse(e.target.result
