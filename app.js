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
    if (document.getElementById('tab-btn-jira').classList.contains('active')) activeTab = 'jira';
    else if (document.getElementById('tab-btn-git').classList.contains('active')) activeTab = 'git';
    else if (document.getElementById('tab-btn-resources').classList.contains('active')) activeTab = 'resources';

    if (activeTab === 'jira') {
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

    } else if (activeTab === 'git') {
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

    } else {
        employeeData = json.map(row => {
            let name = '', role = '', location = '', project = '';
            let fte = 1.0;

            for (let k of Object.keys(row)) {
                const val = row[k];
                const lk = k.toLowerCase().trim();
                
                if ((lk.includes('name') || lk === 'שם') && !lk.includes('project')) {
                    name = val;
                } else if (lk.includes('role') || lk.includes('תפקיד')) {
                    role = val;
                } else if (lk.includes('location') || lk.includes('מיקום') || lk.includes('country')) {
                    location = val;
                } else if (lk.includes('main project') || (lk.includes('project') && lk !== 'project' && !lk.includes('fte'))) {
                    project = val;
                } else if (lk === 'project' || lk.includes('fte') || lk.includes('%') || lk.includes('allocation')) {
                    const parsed = parseFloat(val);
                    if (!isNaN(parsed)) fte = parsed;
                }
            }

            const vals = Object.values(row);
            if (!name && vals.length > 0) name = vals[0];
            if (!role && vals.length > 1) role = vals[1];
            if (!location && vals.length > 2) location = vals[2];
            if (!project && vals.length > 3) project = vals[3];
            if (fte === 1.0 && vals.length > 4) {
                const p = parseFloat(vals[4]);
                if (!isNaN(p)) fte = p;
            }

            return {
                Name: String(name || '').trim(),
                Role: String(role || '').trim(),
                Location: String(location || '').trim(),
                Project: String(project || '').trim(),
                FTE: isNaN(fte) ? 1.0 : fte
            };
        }).filter(e => e.Name);

        populateDropdowns();
        alert(`Successfully imported ${employeeData.length} resources!`);
    }
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
    jiraFilters = { Assignee: '', Project: '', FromStatus: '', ToStatus: '', Issues: '' };
    gitFilters = { author: '', year: '', week_number: '', unique_tickets_count: '' };
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
            <div class="form-group" style="margin:0;"><label>Role</label>${getDropdownOptionsHtml('Role', '')}</div>
            <div class="form-group" style="margin:0;"><label>Location</label>${getDropdownOptionsHtml('Location', '')}</div>
            <div class="form-group" style="margin:0;"><label>Project</label>${getDropdownOptionsHtml('Project', '')}</div>
            <div class="form-group" style="margin:0;"><label>FTE</label><input type="number" step="0.01" id="m-fte" value="1.0"></div>
        `;
    } else if (currentTab === 'jira') {
        formBody.innerHTML = `
            <div class="form-group" style="margin:0;"><label>Assignee</label><input type="text" id="m-assignee"></div>
            <div class="form-group" style="margin:0;"><label>Project</label><input type="text" id="m-proj"></div>
            <div class="form-group" style="margin:0;"><label>From Status</label><input type="text" id="m-from"></div>
            <div class="form-group" style="margin:0;"><label>To Status</label><input type="text" id="m-to"></div>
            <div class="form-group" style="margin:0;"><label>Issues</label><input type="text" id="m-issues"></div>
        `;
    } else if (currentTab === 'git') {
        formBody.innerHTML = `
            <div class="form-group" style="margin:0;"><label>Author</label><input type="text" id="m-author"></div>
            <div class="form-group" style="margin:0;"><label>Year</label><input type="number" id="m-year" value="2026"></div>
            <div class="form-group" style="margin:0;"><label>Week Number</label><input type="number" id="m-week" value="0"></div>
            <div class="form-group" style="margin:0;"><label>Week Start</label><input type="date" id="m-start"></div>
            <div class="form-group" style="margin:0;"><label>Week End</label><input type="date" id="m-end"></div>
            <div class="form-group" style="margin:0;"><label>Unique Tickets Count</label><input type="number" id="m-count" value="0"></div>
        `;
    }
    document.getElementById('employeeModal').classList.add('active');
}

window.closeModal = function() {
    document.getElementById('employeeModal').classList.remove('active');
}

window.saveRecord = function() {
    const idx = parseInt(document.getElementById('edit-index').value);
    if (currentTab === 'resources') {
        const rec = {
            Name: document.getElementById('m-name').value.trim(),
            Role: document.getElementById('m-role').value,
            Location: document.getElementById('m-location').value,
            Project: document.getElementById('m-project').value,
            FTE: parseFloat(document.getElementById('m-fte').value) || 1.0
        };
        if (!rec.Name) { alert("Name is required."); return; }
        if (!rec.Role || !rec.Location || !rec.Project) { alert("Please select Role, Location, and Project from the dropdowns."); return; }
        if (idx === -1) employeeData.push(rec);
        else employeeData[idx] = rec;
        populateDropdowns();
    } else if (currentTab === 'jira') {
        const rec = {
            Assignee: document.getElementById('m-assignee').value.trim(),
            Project: document.getElementById('m-proj').value.trim(),
            FromStatus: document.getElementById('m-from').value.trim(),
            ToStatus: document.getElementById('m-to').value.trim(),
            Issues: document.getElementById('m-issues').value.trim()
        };
        if (!rec.Assignee && !rec.Issues) { alert("Assignee or Issue is required."); return; }
        if (idx === -1) jiraData.push(rec);
        else jiraData[idx] = rec;
    } else if (currentTab === 'git') {
        const rec = {
            author: document.getElementById('m-author').value.trim(),
            year: parseInt(document.getElementById('m-year').value) || new Date().getFullYear(),
            week_number: parseInt(document.getElementById('m-week').value) || 0,
            week_start: document.getElementById('m-start').value,
            week_end: document.getElementById('m-end').value,
            unique_tickets_count: parseInt(document.getElementById('m-count').value) || 0
        };
        if (!rec.author) { alert("Author is required."); return; }
        if (idx === -1) gitData.push(rec);
        else gitData[idx] = rec;
    }
    closeModal();
    updateDashboard();
}

window.onload = function() {
    initDashboard();
}
