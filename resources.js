// Data & State for Resources Tab
let employeeData = [
    { Name: "Adriana Iovanut", Role: "Ro TL", Location: "Romania", Project: "Management", FTE: 1.0 },
    { Name: "Alexandru Mihai", Role: "BE", Location: "Romania", Project: "Vasco", FTE: 1.0 }
];

let charts = {};
const vibrantColors = [
    '#3b82f6', '#22d3ee', '#34d399', '#c084fc', '#fb7185', 
    '#fb923c', '#facc15', '#a855f7', '#ec4899', '#14b8a6', '#6366f1'
];

function populateDropdowns() {
    const projects = [...new Set(employeeData.map(e => e.Project))].filter(Boolean).sort();
    const roles = [...new Set(employeeData.map(e => e.Role))].filter(Boolean).sort();
    const locations = [...new Set(employeeData.map(e => e.Location))].filter(Boolean).sort();

    fillSelect('filter-project', projects, 'All Projects');
    fillSelect('filter-role', roles, 'All Roles');
    fillSelect('filter-location', locations, 'All Locations');
}

function fillSelect(id, items, defaultText) {
    const el = document.getElementById(id);
    if (!el) return;
    const current = el.value;
    el.innerHTML = `<option value="">${defaultText}</option>` + items.map(i => `<option value="${i}" ${i === current ? 'selected' : ''}>${i}</option>`).join('');
}

function getFilteredResources() {
    const proj = document.getElementById('filter-project').value;
    const role = document.getElementById('filter-role').value;
    const loc = document.getElementById('filter-location').value;

    return employeeData.filter(emp => {
        if (proj && emp.Project !== proj) return false;
        if (role && emp.Role !== role) return false;
        if (loc && emp.Location !== loc) return false;
        return true;
    });
}

function renderResourceTable(data) {
    const getSortIndicator = (col) => (currentSortCol !== col) ? ' ↕' : (currentSortAsc ? ' ▲' : ' ▼');

    document.getElementById('table-header-row').innerHTML = `
        <th onclick="window.sortTable('Name')">Name${getSortIndicator('Name')}</th>
        <th onclick="window.sortTable('Role')">Role${getSortIndicator('Role')}</th>
        <th onclick="window.sortTable('Location')">Location${getSortIndicator('Location')}</th>
        <th onclick="window.sortTable('Project')">Project${getSortIndicator('Project')}</th>
        <th onclick="window.sortTable('FTE')" style="text-align: right;">FTE / % Project${getSortIndicator('FTE')}</th>
        <th style="text-align: center;">Actions</th>
    `;

    const tbody = document.getElementById('resource-table-body');
    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-slate-400); padding: 32px;">No matching records found.</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(emp => {
        const globalIdx = employeeData.indexOf(emp);
        const ftePercent = Math.min(Math.max(emp.FTE * 100, 0), 100);
        return `
            <tr>
                <td style="font-weight: 500; color: white;">${emp.Name}</td>
                <td><span class="badge">${emp.Role}</span></td>
                <td style="color: var(--text-slate-400);">${emp.Location}</td>
                <td style="color: var(--cyan-400); font-weight: 500;">${emp.Project}</td>
                <td style="text-align: right;">
                    <div class="fte-bar-container" style="justify-content: flex-end;">
                        <span style="font-weight: bold; color: var(--emerald-400);">${emp.FTE}</span>
                        <div style="width: 60px; background: rgba(51, 65, 85, 0.5); border-radius: 3px; overflow: hidden;">
                            <div class="fte-bar" style="width: ${ftePercent}%;"></div>
                        </div>
                    </div>
                </td>
                <td style="text-align: center;">
                    <button onclick="window.editEmployee(${globalIdx})" style="background: none; border: none; cursor: pointer; color: var(--blue-400); font-size: 14px; margin-right: 8px;" title="Edit">✏️</button>
                    <button onclick="window.deleteEmployee(${globalIdx})" style="background: none; border: none; cursor: pointer; color: var(--rose-400); font-size: 14px;" title="Delete">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderSidebarProjectFTE(filteredEmps) {
    const map = {};
    let totalFTE = 0;
    filteredEmps.forEach(e => { 
        if(e.Project) {
            map[e.Project] = (map[e.Project] || 0) + (e.FTE || 0);
            totalFTE += (e.FTE || 0);
        }
    });
    
    let sorted = Object.entries(map);
    const sortMode = document.getElementById('project-sort-mode').value;

    if (sortMode === 'fte-desc') sorted.sort((a, b) => b[1] - a[1]);
    else if (sortMode === 'fte-asc') sorted.sort((a, b) => a[1] - b[1]);
    else if (sortMode === 'name-asc') sorted.sort((a, b) => a[0].localeCompare(b[0]));

    const container = document.getElementById('project-fte-list');
    if (sorted.length === 0) {
        container.innerHTML = `<div style="font-size: 12px; color: var(--text-slate-400); text-align: center; padding: 10px;">No projects found</div>`;
    } else {
        container.innerHTML = sorted.map(([proj, fte]) => `
            <div class="project-fte-item" onclick="window.filterByProject('${proj}')">
                <span style="color: white; font-weight: 500;">${proj}</span>
                <span class="project-fte-badge">${Math.round(fte * 100) / 100} FTE</span>
            </div>
        `).join('');
    }

    document.getElementById('sidebar-total-fte').innerText = `${Math.round(totalFTE * 100) / 100} FTE`;
}

function renderResourceCharts(filteredEmps) {
    const projMap = {};
    filteredEmps.forEach(e => { if(e.Project) projMap[e.Project] = (projMap[e.Project] || 0) + (e.FTE || 0); });
    const projLabels = Object.keys(projMap);
    const projValues = Object.values(projMap);

    if (charts.projectFTE) charts.projectFTE.destroy();
    const ctx1 = document.getElementById('chartProjectFTE').getContext('2d');
    charts.projectFTE = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: projLabels,
            datasets: [{
                label: 'Total FTE',
                data: projValues,
                backgroundColor: '#22d3ee',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
                y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
            },
            onClick: (e, els) => {
                if (els.length > 0) {
                    const idx = els[0].index;
                    window.filterByProject(projLabels[idx]);
                }
            }
        }
    });

    const roleMap = {};
    filteredEmps.forEach(e => { if(e.Role) roleMap[e.Role] = (roleMap[e.Role] || 0) + 1; });
    const roleLabels = Object.keys(roleMap);
    const roleValues = Object.values(roleMap);

    if (charts.orgComp) charts.orgComp.destroy();
    const ctx2 = document.getElementById('chartOrgComposition').getContext('2d');
    charts.orgComp = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: roleLabels,
            datasets: [{
                data: roleValues,
                backgroundColor: vibrantColors.slice(0, roleLabels.length)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: '#f1f5f9', boxWidth: 12 } } }
        }
    });
}

function getDropdownOptionsHtml(key, currentVal) {
    const uniqueValues = [...new Set(employeeData.map(e => e[key]))].filter(Boolean).sort();
    if (currentVal && !uniqueValues.includes(currentVal)) {
        uniqueValues.push(currentVal);
        uniqueValues.sort();
    }
    return `
        <select id="m-${key.toLowerCase()}" class="form-group" style="width: 100%; background: var(--bg-slate-900); border: 1px solid var(--border-slate-800); border-radius: 10px; padding: 10px; color: white; font-size: 13px; outline: none;">
            <option value="">Select ${key}...</option>
            ${uniqueValues.map(val => `<option value="${val}" ${val === currentVal ? 'selected' : ''}>${val}</option>`).join('')}
        </select>
    `;
}

window.editEmployee = function(idx) {
    const emp = employeeData[idx];
    document.getElementById('edit-index').value = idx;
    document.getElementById('modal-title').innerText = 'Edit Employee';
    document.getElementById('modal-form-body').innerHTML = `
        <div class="form-group" style="margin:0;"><label>Name</label><input type="text" id="m-name" value="${emp.Name}"></div>
        <div class="form-group" style="margin:0;"><label>Role</label>${getDropdownOptionsHtml('Role', emp.Role)}</div>
        <div class="form-group" style="margin:0;"><label>Location</label>${getDropdownOptionsHtml('Location', emp.Location)}</div>
        <div class="form-group" style="margin:0;"><label>Project</label>${getDropdownOptionsHtml('Project', emp.Project)}</div>
        <div class="form-group" style="margin:0;"><label>FTE</label><input type="number" step="0.01" id="m-fte" value="${emp.FTE}"></div>
    `;
    document.getElementById('employeeModal').classList.add('active');
}

window.deleteEmployee = function(idx) {
    if (confirm("Are you sure you want to delete this resource?")) {
        employeeData.splice(idx, 1);
        populateDropdowns();
        updateDashboard();
    }
}