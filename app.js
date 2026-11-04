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

// -------------------------------------------------------------
// Modal Management (Add / Edit בפורמט הנכון עם Dropdowns)
// -------------------------------------------------------------

window.openModal = function() {
    document.getElementById('edit-index').value = "-1";
    document.getElementById('modal-title').innerText = "Add New Employee";
    
    // שימוש בפונקציה קיימת או יצירת שדות בחירה נפתחות בדומה לצילום המסך
    document.getElementById('modal-form-body').innerHTML = `
        <div class="form-group" style="margin:0;"><label>Name</label><input type="text" id="m-name" placeholder="Full Name" style="width: 100%; background: var(--bg-slate-900); border: 1px solid var(--border-slate-800); border-radius: 10px; padding: 10px; color: white; font-size: 13px; outline: none;"></div>
        <div class="form-group" style="margin:0;"><label>Role</label>${typeof getDropdownOptionsHtml === 'function' ? getDropdownOptionsHtml('Role', '') : '<input type="text" id="m-role">'}</div>
        <div class="form-group" style="margin:0;"><label>Location</label>${typeof getDropdownOptionsHtml === 'function' ? getDropdownOptionsHtml('Location', '') : '<input type="text" id="m-location">'}</div>
        <div class="form-group" style="margin:0;"><label>Project</label>${typeof getDropdownOptionsHtml === 'function' ? getDropdownOptionsHtml('Project', '') : '<input type="text" id="m-project">'}</div>
        <div class="form-group" style="margin:0;"><label>FTE</label><input type="number" step="0.01" id="m-fte" value="1.0" style="width: 100%; background: var(--bg-slate-900); border: 1px solid var(--border-slate-800); border-radius: 10px; padding: 10px; color: white; font-size: 13px; outline: none;"></div>
    `;
    document.getElementById('employeeModal').classList.add('active');
}

window.closeModal = function() {
    document.getElementById('employeeModal').classList.remove('active');
}

window.saveRecord = function() {
    const idx = parseInt(document.getElementById('edit-index').value);
    const nameEl = document.getElementById('m-name');
    const roleEl = document.getElementById('m-role') || document.getElementById('m-role');
    const locEl = document.getElementById('m-location') || document.getElementById('m-location');
    const projEl = document.getElementById('m-project') || document.getElementById('m-project');
    const fteEl = document.getElementById('m-fte');

    if (!nameEl || !nameEl.value.trim()) {
        alert("Please enter a valid employee name.");
        return;
    }

    const name = nameEl.value.trim();
    const role = roleEl ? roleEl.value.trim() : '';
    const location = locEl ? locEl.value.trim() : '';
    const project = projEl ? projEl.value.trim() : '';
    const fte = fteEl ? parseFloat(fteEl.value) : 1.0;

    const newRecord = {
        Name: name,
        name: name,
        Role: role,
        role: role,
        Location: location,
        location: location,
        Project: project,
        project: project,
        FTE: isNaN(fte) ? 1.0 : fte,
        fte: isNaN(fte) ? 1.0 : fte
    };

    if (typeof employeeData === 'undefined') {
        window.employeeData = [];
    }

    if (idx === -1) {
        employeeData.push(newRecord);
    } else {
        employeeData[idx] = newRecord;
    }

    window.closeModal();
    populateDropdowns();
    updateDashboard();
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

    if (activeTab === 'resources') {
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
            alert(`Successfully imported ${employeeData.length} unique resource records! Total FTE: ${employeeData.reduce((acc, curr) => acc + curr.FTE, 0).toFixed(2)}`);
        }
    }
    updateDashboard();
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
    // קישור כפתור ה-Add הראשי לפתיחת ה-Modal
    const btnAdd = document.getElementById('btn-add-action');
    if (btnAdd) {
        btnAdd.onclick = function() {
            if (currentTab === 'resources') {
                if (typeof window.openModal === 'function') {
                    window.openModal();
                }
            } else {
                alert("Add action for this tab");
            }
        };
    }

    if (typeof initDashboard === 'function') {
        initDashboard();
    } else {
        updateDashboard();
    }
}
