let currentTab = 'resources';
let currentSortCol = 'FTE';
let currentSortAsc = false;

window.initDashboard = function() {
    populateDropdowns();
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

// פונקציית סינון עם תמיכה ב-Multi-select לתפקידים
window.getFilteredResources = function() {
    if (typeof employeeData === 'undefined') return [];
    
    const projFilter = document.getElementById('filter-project')?.value || '';
    const roleSelect = document.getElementById('filter-role');
    const locFilter = document.getElementById('filter-location')?.value || '';

    const selectedRoles = roleSelect ? Array.from(roleSelect.selectedOptions).map(opt => opt.value).filter(v => v) : [];

    return employeeData.filter(emp => {
        if (projFilter && emp.Project !== projFilter) return false;
        if (selectedRoles.length > 0 && !selectedRoles.includes(emp.Role)) return false;
        if (locFilter && emp.Location !== locFilter) return false;
        return true;
    });
}

// טבלת הסיכום בצד שמאל (PROJECT FTE)
window.renderSidebarProjectFTE = function(filtered) {
    const container = document.getElementById('sidebar-project-fte-list');
    const totalEl = document.getElementById('sidebar-total-fte');
    if (!container) return;

    const projectMap = {};
    let grandTotal = 0;

    filtered.forEach(emp => {
        const p = emp.Project || 'Unassigned';
        const fte = parseFloat(emp.FTE) || 0;
        projectMap[p] = (projectMap[p] || 0) + fte;
        grandTotal += fte;
    });

    const sortedProjects = Object.entries(projectMap).sort((a, b) => b[1] - a[1]);

    let html = '';
    sortedProjects.forEach(([proj, fte]) => {
        html += `
            <div class="sidebar-fte-row" onclick="filterByProject('${proj}')" style="cursor:pointer; display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #1e293b;">
                <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:120px;" title="${proj}">${proj}</span>
                <span class="badge" style="background:#0f172a; color:#38bdf8; padding:2px 8px; border-radius:4px;">${fte.toFixed(2)} FTE</span>
            </div>
        `;
    });

    container.innerHTML = html || '<div style="color:#64748b; font-size:12px;">No projects found</div>';
    if (totalEl) totalEl.innerText = `${grandTotal.toFixed(2)} FTE`;
}

// אוכלוסיית הדרופדאונים והפילטרים
window.populateDropdowns = function() {
    if (typeof employeeData === 'undefined') return;

    const projects = [...new Set(employeeData.map(e => e.Project).filter(Boolean))].sort();
    const roles = [...new Set(employeeData.map(e => e.Role).filter(Boolean))].sort();
    const locations = [...new Set(employeeData.map(e => e.Location).filter(Boolean))].sort();

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
            let valA = a[currentSortCol], valB = b[currentSortCol];
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
            employeeData = json.map(row => {
                let name = row['Name'] || row['name'] || '';
                let role = row['Role'] || row['role'] || '';
                let location = row['Location '] || row['Location'] || row['location'] || '';
                let project = row['main project '] || row['main project'] || row['Project'] || '';
                let fteVal = row['project'] !== undefined ? row['project'] : (row['FTE'] !== undefined ? row['FTE'] : 1.0);
                
                let fte = parseFloat(fteVal);
                if (isNaN(fte)) fte = 1.0;

                return {
                    Name: String(name).trim(),
                    Role: String(role).trim(),
                    Location: String(location).trim(),
                    Project: String(project).trim(),
                    FTE: fte
                };
            }).filter(e => e.Name);

            populateDropdowns();
            alert(`Successfully imported ${employeeData.length} resources!`);
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
    if (typeof initDashboard === 'function') {
        initDashboard();
    } else {
        updateDashboard();
    }
}
