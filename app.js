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

window.updateDashboard = function() {
    const tableTitle = document.getElementById('table-title');
    const filterRow = document.getElementById('table-filter-row');

    if (currentTab === 'resources') {
        if (tableTitle) tableTitle.innerHTML = "👥 Interactive Resource Table & Edit Suite";
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
        if (tableTitle) tableTitle.innerHTML = "🎫 Jira Issues Tracking";
        if (filterRow) filterRow.style.display = 'table-row';
        
        const assigneeFilter = typeof jiraFilters !== 'undefined' ? jiraFilters.Assignee : '';
        const projFilter = typeof jiraFilters !== 'undefined' ? jiraFilters.Project : '';
        const fromFilter = typeof jiraFilters !== 'undefined' ? jiraFilters.FromStatus : '';
        const toFilter = typeof jiraFilters !== 'undefined' ? jiraFilters.ToStatus : '';
        const textFilter = typeof jiraFilters !== 'undefined' ? (jiraFilters.Issues || '').toLowerCase() : '';

        let filteredJira = (typeof jiraData !== 'undefined' ? jiraData : []).filter(j => {
            const jAssignee = j.Assignee || j.user || j.assignee || '';
            const jProject = j.Project || j.project || '';
            const jFrom = j.FromStatus || j.fromstatus || j.from_status || '';
            const jTo = j.ToStatus || j.tostatus || j.to_status || '';
            const jIssues = String(j.Issues || j.issues || '').toLowerCase();

            if (assigneeFilter && jAssignee !== assigneeFilter) return false;
            if (projFilter && jProject !== projFilter) return false;
            if (fromFilter && jFrom !== fromFilter) return false;
            if (toFilter && jTo !== toFilter) return false;
            if (textFilter && !jIssues.includes(textFilter)) return false;

            return true;
        });

        filteredJira.sort((a, b) => {
            let valA = a[currentSortCol] || '', valB = b[currentSortCol] || '';
            if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
            return valA < valB ? (currentSortAsc ? -1 : 1) : (valA > valB ? (currentSortAsc ? 1 : -1) : 0);
        });

        if (typeof renderJiraTable === 'function') renderJiraTable(filteredJira);

    } else if (currentTab === 'git') {
        if (tableTitle) tableTitle.innerHTML = "💻 Git Weekly Matrix Activity";
        if (filterRow) filterRow.style.display = 'table-row';
        
        let filteredGit = typeof gitData !== 'undefined' ? gitData : [];

        filteredGit.sort((a, b) => {
            let valA = a[currentSortCol] || '', valB = b[currentSortCol] || '';
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

    if (fileName.endsWith('.json') || fileName.endsWith('.txt') || fileName.endsWith('.csv')) {
        reader.onload = function(e) {
            try {
                const text = e.target.result;
                if (fileName.endsWith('.json')) {
                    const parsed = JSON.parse(text);
                    const json = Array.isArray(parsed) ? parsed : (parsed.data || parsed.issues || parsed.commits || parsed.matrix || [parsed]);
                    processParsedData(json);
                } else {
                    // פענוח בסיסי לטקסט/CSV שהודבק
                    const lines = text.split('\n').filter(l => l.trim().length > 0);
                    if (lines.length < 2) { alert("File is empty or invalid format."); return; }
                    
                    // זיהוי כותרות
                    const headers = lines[0].replace(/"/g, '').split(/,|\s{2,}/).map(h => h.trim());
                    const rows = [];
                    for (let i = 1; i < lines.length; i++) {
                        const currentLine = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
                        const obj = {};
                        headers.forEach((h, idx) => {
                            let val = currentLine[idx] ? currentLine[idx].replace(/^"|"$/g, '').trim() : '';
                            obj[h] = val;
                        });
                        rows.push(obj);
                    }
                    processParsedData(rows);
                }
            } catch (err) {
                console.error(err);
                alert("Error parsing file.");
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
                
                let fromStatus = r['from status'] || r['fromstatus'] || r['from_status'] || r['from'] || '';
                let toStatus = r['to status'] || r['tostatus'] || r['to_status'] || r['to'] || '';
                
                const transition = r['transition'] || r['status_transition'] || '';
                if (transition && transition.includes('->')) {
                    const parts = transition.split('->');
                    fromStatus = parts[0].trim();
                    toStatus = parts[1].trim();
                }

                return {
                    Assignee: r.user || r.assignee || r['name'] || '',
                    Project: r.project || '',
                    FromStatus: fromStatus,
                    ToStatus: toStatus,
                    Count: parseInt(r.count || r.issues_count || 1),
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
                    Role: role,
                    Location: location,
                    Project: project,
                    FTE: fte
                });
            });

            employeeData = Array.from(tempMap.values());
            if (typeof populateDropdowns === 'function') populateDropdowns();
            alert(`Successfully imported ${employeeData.length} resource records! Total FTE: ${employeeData.reduce((acc, curr) => acc + curr.FTE, 0).toFixed(2)}`);
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
        currentSortAsc = (col === 'FTE' || col === 'unique_tickets_count' || col === 'year' || col === 'week_number' || col === 'Count') ? false : true;
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

    if (typeof jiraFilters !== 'undefined') {
        jiraFilters = { Assignee: '', Project: '', FromStatus: '', ToStatus: '', Issues: '' };
    }

    updateDashboard();
}

window.onload = function() {
    if (typeof initDashboard === 'function') {
        initDashboard();
    } else {
        updateDashboard();
    }
}
