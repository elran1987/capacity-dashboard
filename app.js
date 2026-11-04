let currentTab = 'resources';
let currentSortCol = 'FTE';
let currentSortAsc = false;

window.initDashboard = function() {
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

window.getFilteredResources = function() {
    if (typeof employeeData === 'undefined') return [];
    
    const projFilter = document.getElementById('filter-project')?.value || '';
    const roleSelect = document.getElementById('filter-role');
    const locFilter = document.getElementById('filter-location')?.value || '';

    const selectedRoles = roleSelect ? Array.from(roleSelect.selectedOptions).map(opt => opt.value).filter(v => v) : [];

    return employeeData.filter(emp => {
        const empProj = emp.Project || emp.project || '';
        const empRole = emp.Role || emp.role || '';
        const empLoc = emp.Location || emp.location || '';

        if (projFilter && empProj !== projFilter) return false;
        if (selectedRoles.length > 0 && !selectedRoles.includes(empRole)) return false;
        if (locFilter && empLoc !== locFilter) return false;
        return true;
    });
}

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
        sortedProjects.sort((a, b) => b[0].localeCompare(a[0]));
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
}

window.populateDropdowns = function() {
    if (typeof employeeData === 'undefined') return;

    const projects = [...new Set(employeeData.map(e => e.Project || e.project).filter(Boolean))].sort();
    const roles = [...new Set(employeeData.map(e => e.Role || e.role).filter(Boolean))].sort();
    const locations = [...new Set(employeeData.map(e => e.Location || e.location).filter(Boolean))].sort();

    const projSelect = document.getElementById('filter-project');
    if (projSelect) {
        const cur = projSelect.value;
        projSelect.innerHTML = '<option value="">All Projects</option>' + projects.map(p => `<option value="${p}">${p}</option>`).join('');
        projSelect.value = cur;
    }

    const roleSelect = document.getElementById('filter-role');
    if (roleSelect) {
        const selectedValues = Array.from(roleSelect.selectedOptions).map(o => o.value);
        roleSelect.innerHTML = roles.map(r => `<option value="${r}">${r}</option>`).join('');
        Array.from(roleSelect.options).forEach(opt => {
            if (selectedValues.includes(opt.value)) opt.selected = true;
        });
    }

    const locSelect = document.getElementById('filter-location');
    if (locSelect) {
        const cur = locSelect.value;
        locSelect.innerHTML = '<option value="">All Locations</option>' + locations.map(l => `<option value="${l}">${l}</option>`).join('');
        locSelect.value = cur;
    }
}

window.updateDashboard = function() {
    if (currentTab === 'resources') {
        document.getElementById('table-title').innerHTML = "👥 Interactive Resource Table & Edit Suite";
        const filterRow = document.getElementById('table-filter-row');
        if (filterRow) filterRow.style.display = 'none';
        
        const filtered = getFilteredResources();

        filtered.sort((a, b) => {
            let valA = a[currentSortCol] !== undefined ? a[currentSortCol] : a[currentSortCol?.toLowerCase()],
                valB = b[currentSortCol] !== undefined ? b[currentSortCol] : b[currentSortCol?.toLowerCase()];
            if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
            return valA < valB ? (currentSortAsc ? -1 : 1) : (valA > valB ? (currentSortAsc ? 1 : -1) : 0);
        });

        if (typeof renderResourceTable === 'function') renderResourceTable(filtered);
        renderSidebarProjectFTE(filtered);
        if (typeof renderResourceCharts === 'function') renderResourceCharts(filtered);

    } else if (currentTab === 'jira') {
        document.getElementById('table-title').innerHTML = "🎫 Jira Issues Tracking";
        const filterRow = document.getElementById('table-filter-row');
        if (filterRow) filterRow.style.display = 'table-row';
        
        const proj = document.getElementById('filter-project')?.value || '';
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
        const filterRow = document.getElementById('table-filter-row');
        if (filterRow) filterRow.style.display = 'table-row';
        
        let filteredGit = typeof gitData !== 'undefined' ? gitData : [];

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

    let activeTab = currentTab;
    const jiraBtn = document.getElementById('tab-btn-jira');
    const gitBtn = document.getElementById('tab-btn-git');
    const resBtn = document.getElementById('tab-btn-resources');

    if (jiraBtn && jiraBtn.classList.contains('active')) activeTab = 'jira';
    else if (gitBtn && gitBtn.classList.contains('active')) activeTab = 'git';
    else if (resBtn && resBtn.classList.contains('active')) activeTab = 'resources';

    if (activeTab === 'jira') {
        if (typeof jiraData !== 'undefined') {
            jiraData = json.map(row => {
                const r = {};
                Object.keys(row).forEach(k => r[k.toLowerCase().trim()] = row[k]);
                return {
                    Assignee: r.assignee || r['user'] || r['name'] || '',
                    Project: r.project || '',
                    FromStatus: r['from status'] || r.fromstatus || r['from'] || '',
                    ToStatus: r['to status'] || r.tostatus || r['to'] || '',
                    Issues: r.issues || r['issue'] || r['key'] || ''
                };
            }).filter(j => j.Assignee || j.Issues);
            alert(`Successfully imported ${jiraData.length} Jira records!`);
        }
    } else if (activeTab === 'git') {
        if (typeof gitData !== 'undefined') {
            gitData = json.map((row, index) => {
                const r = {};
                Object.keys(row).forEach(k => r[k.toLowerCase().trim()] = row[k]);
                return {
                    id: r.id || index,
                    author: r.author || r.developer || r.name || '',
                    year: parseInt(r.year || new Date().getFullYear()),
                    week_number: parseInt(r.week_number || r.week || 0),
                    week_start: r.week_start || r.startdate || '',
                    week_end: r.week_end || r.enddate || '',
                    unique_tickets_count: parseInt(r.unique_tickets_count || r.ticketscount || r.count || 0)
                };
            }).filter(g => g.author || g.week_number !== undefined);
            alert(`Successfully imported ${gitData.length} Git records!`);
        }
    } else {
        if (typeof employeeData !== 'undefined') {
            const tempMap = new Map();

            json.forEach(row => {
                const cleanRow = {};
                Object.keys(row).forEach(k => {
                    cleanRow[k.toLowerCase().trim()] = row[k];
                });

                let name = String(cleanRow['name'] || '').trim();
                if (!name) return;

                let role = String(cleanRow['role'] || '').trim();
                let location = String(cleanRow['location'] || '').trim();
                let project = String(cleanRow['project'] || cleanRow['main project'] || cleanRow['project name'] || cleanRow['שם פרויקט'] || '').trim();
                let fteVal = cleanRow['fte'] !== undefined && cleanRow['fte'] !== '' ? cleanRow['fte'] : 1.0;
                
                let fte = parseFloat(fteVal);
                if (isNaN(fte)) fte = 1.0;

                let uniqueKey = `${name.toLowerCase()}_${project.toLowerCase()}_${fte}`;

                tempMap.set(uniqueKey, {
                    Name: name,
                    name: name,
                    Role: role,
                    role: role,
                    Location: location,
                    location: location,
                    Project: project,
                    project: project,
                    FTE: fte,
                    fte: fte
                });
            });

            employeeData = Array.from(tempMap.values());

            populateDropdowns();
            alert(`Successfully imported ${employeeData.length} resource allocations. Total FTE sum: ${employeeData.reduce((acc, curr) => acc + curr.FTE, 0).toFixed(2)}`);
        }
    }
    updateDashboard();
}

// -------------------------------------------------------------
// פונקציות הוספה ועריכה ידנית (מחברות ישירות ל-employeeData ומעדכנות משאבים וסכימה)
// -------------------------------------------------------------

window.addNewResource = function() {
    const name = prompt("Enter Employee Name:");
    if (!name) return;
    const role = prompt("Enter Role / Discipline (e.g. BE, FE, DevOps):") || "BE";
    const location = prompt("Enter Location (e.g. Israel, Romania):") || "Israel";
    const project = prompt("Enter Project Name:") || "General";
    const fteInput = prompt("Enter FTE (e.g. 1.0, 0.5):") || "1.0";
    
    let fte = parseFloat(fteInput);
    if (isNaN(fte)) fte = 1.0;

    if (typeof employeeData === 'undefined') {
        window.employeeData = [];
    }

    employeeData.push({
        Name: name.trim(),
        name: name.trim(),
        Role: role.trim(),
        role: role.trim(),
        Location: location.trim(),
        location: location.trim(),
        Project: project.trim(),
        project: project.trim(),
        FTE: fte,
        fte: fte
    });

    populateDropdowns();
    updateDashboard();
    alert(`Successfully added ${name} to resources!`);
}

window.editResource = function(index) {
    if (typeof employeeData === 'undefined' || !employeeData[index]) return;
    const emp = employeeData[index];

    const newName = prompt("Edit Employee Name:", emp.Name || emp.name) || emp.Name;
    const newRole = prompt("Edit Role:", emp.Role || emp.role) || emp.Role;
    const newLoc = prompt("Edit Location:", emp.Location || emp.location) || emp.Location;
    const newProj = prompt("Edit Project:", emp.Project || emp.project) || emp.Project;
    const newFteInput = prompt("Edit FTE:", emp.FTE !== undefined ? emp.FTE : emp.fte) || "1.0";

    let fte = parseFloat(newFteInput);
    if (isNaN(fte)) fte = 1.0;

    employeeData[index] = {
        Name: newName.trim(),
        name: newName.trim(),
        Role: newRole.trim(),
        role: newRole.trim(),
        Location: newLoc.trim(),
        location: newLoc.trim(),
        Project: newProj.trim(),
        project: newProj.trim(),
        FTE: fte,
        fte: fte
    };

    populateDropdowns();
    updateDashboard();
    alert("Resource updated successfully!");
}

window.deleteResource = function(index) {
    if (typeof employeeData === 'undefined' || !employeeData[index]) return;
    if (confirm("Are you sure you want to delete this resource allocation?")) {
        employeeData.splice(index, 1);
        populateDropdowns();
        updateDashboard();
    }
}

// חיבור כפתור הפעולה הראשי (טראקר ה-Add) כך שיעבוד לפי הטאב הפעיל
window.handleAddAction = function() {
    if (currentTab === 'resources') {
        window.addNewResource();
    } else if (currentTab === 'jira') {
        alert("Add Jira Issue feature");
    } else if (currentTab === 'git') {
        alert("Add Git Record feature");
    }
}

window.filterByProject = function(projName) {
    const projEl = document.getElementById('filter-project');
    if (projEl) projEl.value = projName;
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
    const projEl = document.getElementById('filter-project');
    if (projEl) projEl.value = '';
    
    const roleSelect = document.getElementById('filter-role');
    if (roleSelect) {
        Array.from(roleSelect.options).forEach(opt => opt.selected = false);
    }
    
    const locEl = document.getElementById('filter-location');
    if (locEl) locEl.value = '';

    updateDashboard();
}

window.onload = function() {
    // חיבור כפתור ההוספה הראשי באירוע לחיצה
    const btnAdd = document.getElementById('btn-add-action');
    if (btnAdd) {
        btnAdd.onclick = window.handleAddAction;
    }

    if (typeof initDashboard === 'function') {
        initDashboard();
    } else {
        updateDashboard();
    }
}
