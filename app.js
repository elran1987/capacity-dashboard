// ==========================================
// הגדרת חיבור ל-Supabase
// ==========================================
const SUPABASE_URL = 'https://gqhhxrwvczloycagiax.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_zWLjUQUEHlhVE1ZPFwLFSg_51pf8_9y';

if (!window.supabaseClient) {
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

window.employeeData = window.employeeData || [];

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
    window.employeeData = await loadResourcesFromDB();
    if (typeof populateDropdowns === 'function') populateDropdowns();
    updateDashboard();
};

window.switchTab = function(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const targetBtn = document.getElementById(`tab-btn-${tab}`);
    if (targetBtn) targetBtn.classList.add('active');

    const chartsSection = document.getElementById('charts-section');
    const btnAdd = document.getElementById('btn-add-action');
    const sidebarContainer = document.getElementById('sidebar-container');
    const dashboardLayout = document.getElementById('dashboard-layout');

    if (tab === 'resources') {
        if (chartsSection) chartsSection.style.display = 'grid';
        if (sidebarContainer) sidebarContainer.style.display = 'flex';
        if (dashboardLayout) dashboardLayout.classList.remove('full-width');
        const p1 = document.getElementById('sidebar-filters-panel');
        const p2 = document.getElementById('sidebar-fte-panel');
        if (p1) p1.style.display = 'block';
        if (p2) p2.style.display = 'block';
        if (btnAdd) {
            btnAdd.style.display = 'inline-flex';
            btnAdd.innerText = '+ Add Employee';
        }
        currentSortCol = 'FTE';
        currentSortAsc = false;
    } else if (tab === 'jira') {
        if (chartsSection) chartsSection.style.display = 'none';
        if (sidebarContainer) sidebarContainer.style.display = 'flex';
        if (dashboardLayout) dashboardLayout.classList.remove('full-width');
        const p1 = document.getElementById('sidebar-filters-panel');
        const p2 = document.getElementById('sidebar-fte-panel');
        if (p1) p1.style.display = 'block';
        if (p2) p2.style.display = 'none';
        if (btnAdd) {
            btnAdd.style.display = 'inline-flex';
            btnAdd.innerText = '+ Add Jira Issue';
        }
        currentSortCol = 'Assignee';
        currentSortAsc = true;
    } else if (tab === 'git') {
        if (chartsSection) chartsSection.style.display = 'none';
        if (sidebarContainer) sidebarContainer.style.display = 'none';
        if (dashboardLayout) dashboardLayout.classList.add('full-width');
        if (btnAdd) {
            btnAdd.style.display = 'inline-flex';
            btnAdd.innerText = '+ Add Git Record';
        }
        currentSortCol = 'author';
        currentSortAsc = true;
    }
    updateDashboard();
};

window.getFilteredResources = function() {
    const dataList = window.employeeData || [];
    const projFilter = document.getElementById('filter-project')?.value || '';
    const roleSelect = document.getElementById('filter-role');
    const locFilter = document.getElementById('filter-location')?.value || '';

    const selectedRoles = roleSelect ? Array.from(roleSelect.selectedOptions).map(opt => opt.value).filter(v => v) : [];

    return dataList.filter(emp => {
        const empProj = emp.Project || emp.project || '';
        const empRole = emp.Role || emp.role || '';
        const empLoc = emp.Location || emp.location || '';

        if (projFilter && empProj !== projFilter) return false;
        if (selectedRoles.length > 0 && !selectedRoles.includes(empRole)) return false;
        if (locFilter && empLoc !== locFilter) return false;
        return true;
    });
};

window.renderSidebarProjectFTE = function(filtered) {
    const sortMode = document.getElementById('project-sort-mode')?.value || 'fte-desc';
    const container = document.getElementById('project-fte-list');
    const totalEl = document.getElementById('sidebar-total-fte');
    if (!container) return;

    const projectMap = {};
    let grandTotal = 0;

    filtered.forEach(emp => {
        const p = emp.Project || emp.project || 'Unassigned';
        const fte = parseFloat(emp.FTE !== undefined ? emp.FTE : emp.fte) || 0;
        projectMap[p] = (projectMap[p] || 0) + fte;
        grandTotal += fte;
    });

    let sortedProjects = Object.entries(projectMap);

    if (sortMode === 'fte-desc') {
        sortedProjects.sort((a, b) => b[1] - a[1]);
    } else if (sortMode === 'fte-asc') {
        sortedProjects.sort((a, b) => a[1] - b[1]);
    } else if (sortMode === 'name-asc') {
        sortedProjects.sort((a, b) => a[0].localeCompare(b[0]));
    }

    let html = '';
    sortedProjects.forEach(([proj, fte]) => {
        html += `<div class="sidebar-fte-row" onclick="window.filterByProject('${proj}')" style="cursor:pointer; display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #1e293b;">
            <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:120px;" title="${proj}">${proj}</span>
            <span class="badge" style="background:#0f172a; color:#38bdf8; padding:2px 8px; border-radius:4px;">${fte.toFixed(2)} FTE</span>
        </div>`;
    });

    container.innerHTML = html || '<div style="color:#64748b; font-size:12px;">No projects found</div>';
    if (totalEl) totalEl.innerText = `${grandTotal.toFixed(2)} FTE`;
};

window.updateDashboard = function() {
    const tableTitle = document.getElementById('table-title');
    const filterRow = document.getElementById('table-filter-row');

    if (currentTab === 'resources') {
        if (tableTitle) tableTitle.innerHTML = "👥 Interactive Resource Table & Edit Suite";
        if (filterRow) filterRow.style.display = 'none';
        
        const filtered = window.getFilteredResources();

        filtered.sort((a, b) => {
            let valA = a[currentSortCol] !== undefined ? a[currentSortCol] : a[currentSortCol?.toLowerCase()],
                valB = b[currentSortCol] !== undefined ? b[currentSortCol] : b[currentSortCol?.toLowerCase()];
            if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
            return valA < valB ? (currentSortAsc ? -1 : 1) : (valA > valB ? (currentSortAsc ? 1 : -1) : 0);
        });

        if (typeof renderResourceTable === 'function') renderResourceTable(filtered);
        window.renderSidebarProjectFTE(filtered);
        if (typeof renderResourceCharts === 'function') renderResourceCharts(filtered);

    } else if (currentTab === 'jira') {
        if (tableTitle) tableTitle.innerHTML = "🎫 Jira Issues Tracking";
        if (filterRow) filterRow.style.display = 'table-row';
        
        const filteredJira = (typeof jiraData !== 'undefined' ? jiraData : []);
        filteredJira.sort((a, b) => {
            let valA = a[currentSortCol] || '', valB = b[currentSortCol] || '';
            if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
            return valA < valB ? (currentSortAsc ? -1 : 1) : (valA > valB ? (currentSortAsc ? 1 : -1) : 0);
        });

        if (typeof renderJiraTable === 'function') renderJiraTable(filteredJira);

    } else if (currentTab === 'git') {
        if (tableTitle) tableTitle.innerHTML = "💻 Git Weekly Matrix Activity";
        if (filterRow) filterRow.style.display = 'table-row';
        
        const filteredGit = (typeof gitData !== 'undefined' ? gitData : []);
        filteredGit.sort((a, b) => {
            let valA = a[currentSortCol] || '', valB = b[currentSortCol] || '';
            if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
            return valA < valB ? (currentSortAsc ? -1 : 1) : (valA > valB ? (currentSortAsc ? 1 : -1) : 0);
        });

        if (typeof renderGitTable === 'function') renderGitTable(filteredGit);
    }
};

window.handleFileUpload = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsed = JSON.parse(e.target.result);
            const json = Array.isArray(parsed) ? parsed : (parsed.data || [parsed]);
            window.employeeData = json.map(row => ({
                Name: row.name || row.Name || '',
                Role: row.role || row.Role || '',
                Location: row.location || row.Location || '',
                Project: row.project || row.Project || '',
                FTE: parseFloat(row.fte !== undefined ? row.fte : row.FTE) || 1.0
            }));
            if (typeof populateDropdowns === 'function') populateDropdowns();
            updateDashboard();
            alert(`Successfully imported ${window.employeeData.length} records!`);
        } catch (err) {
            console.error(err);
            alert("Error parsing file.");
        }
    };
    reader.readAsText(file);
    event.target.value = '';
};

window.filterByProject = function(projName) {
    const projEl = document.getElementById('filter-project');
    if (projEl) projEl.value = projName;
    updateDashboard();
};

window.sortTable = function(col) {
    if (currentSortCol === col) {
        currentSortAsc = !currentSortAsc;
    } else {
        currentSortCol = col;
        currentSortAsc = (col === 'FTE' || col === 'unique_tickets_count' || col === 'year' || col === 'week_number' || col === 'Count') ? false : true;
    }
    updateDashboard();
};

window.resetFilters = function() {
    const projEl = document.getElementById('filter-project');
    if (projEl) projEl.value = '';
    const roleSelect = document.getElementById('filter-role');
    if (roleSelect) {
        Array.from(roleSelect.options).forEach(opt => opt.selected = false);
    }
    const locEl = document.getElementById('filter-location');
    if (locEl) locEl.value = '';
    updateDashboard();
};

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
};

window.closeModal = function() {
    document.getElementById('employeeModal').classList.remove('active');
};

window.saveRecord = function() {
    const idx = parseInt(document.getElementById('edit-index').value);
    if (currentTab === 'resources') {
        const rec = {
            Name: document.getElementById('m-name').value.trim(),
            Role: document.getElementById('m-role').value.trim(),
            Location: document.getElementById('m-location').value.trim(),
            Project: document.getElementById('m-project').value.trim(),
            FTE: parseFloat(document.getElementById('m-fte').value) || 1.0
        };
        if (!rec.Name) { alert("Name is required."); return; }
        if (idx === -1) window.employeeData.push(rec);
        else window.employeeData[idx] = rec;
        if (typeof populateDropdowns === 'function') populateDropdowns();
    }
    closeModal();
    updateDashboard();
};

window.onload = function() {
    if (typeof window.initDashboard === 'function') {
        window.initDashboard();
    }
};
