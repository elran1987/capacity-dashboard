// Data & State for Jira Tab
let jiraData = [
    { Assignee: "Alexandru Mihai", Project: "Vasco", FromStatus: "In Progress", ToStatus: "Done", Issues: "VAS-102" }
];

let jiraFilters = { Assignee: '', Project: '', FromStatus: '', ToStatus: '', Issues: '' };

function renderJiraTable(data) {
    const getSortIndicator = (col) => (currentSortCol !== col) ? ' ↕' : (currentSortAsc ? ' ▲' : ' ▼');

    document.getElementById('table-header-row').innerHTML = `
        <th onclick="window.sortTable('Assignee')">Assignee${getSortIndicator('Assignee')}</th>
        <th onclick="window.sortTable('Project')">Project${getSortIndicator('Project')}</th>
        <th onclick="window.sortTable('FromStatus')">From Status${getSortIndicator('FromStatus')}</th>
        <th onclick="window.sortTable('ToStatus')">To Status${getSortIndicator('ToStatus')}</th>
        <th onclick="window.sortTable('Issues')">Issues${getSortIndicator('Issues')}</th>
        <th style="text-align: center;">Actions</th>
    `;

    const assignees = [...new Set(jiraData.map(j => j.Assignee))].filter(Boolean).sort();
    const projects = [...new Set(jiraData.map(j => j.Project))].filter(Boolean).sort();
    const fromStatuses = [...new Set(jiraData.map(j => j.FromStatus))].filter(Boolean).sort();
    const toStatuses = [...new Set(jiraData.map(j => j.ToStatus))].filter(Boolean).sort();

    const createSelectFilter = (field, currentVal, options, defaultText) => `
        <select class="table-filter-input" onchange="window.updateJiraFilter('${field}', this.value)">
            <option value="">${defaultText}</option>
            ${options.map(opt => `<option value="${opt}" ${opt === currentVal ? 'selected' : ''}>${opt}</option>`).join('')}
        </select>
    `;

    document.getElementById('table-filter-row').innerHTML = `
        <th>${createSelectFilter('Assignee', jiraFilters.Assignee, assignees, 'All Assignees')}</th>
        <th>${createSelectFilter('Project', jiraFilters.Project, projects, 'All Projects')}</th>
        <th>${createSelectFilter('FromStatus', jiraFilters.FromStatus, fromStatuses, 'All From')}</th>
        <th>${createSelectFilter('ToStatus', jiraFilters.ToStatus, toStatuses, 'All To')}</th>
        <th><input type="text" class="table-filter-input" placeholder="Filter Issue..." value="${jiraFilters.Issues}" oninput="window.updateJiraFilter('Issues', this.value)"></th>
        <th></th>
    `;

    const tbody = document.getElementById('resource-table-body');
    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-slate-400); padding: 32px;">No Jira data available.</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map((j) => {
        const globalIdx = jiraData.indexOf(j);
        return `
            <tr>
                <td style="font-weight: 500; color: white;">${j.Assignee}</td>
                <td style="color: var(--cyan-400);">${j.Project}</td>
                <td><span class="badge">${j.FromStatus}</span></td>
                <td><span class="badge" style="color: var(--emerald-400);">${j.ToStatus}</span></td>
                <td style="font-weight: bold; color: var(--blue-400);">${j.Issues}</td>
                <td style="text-align: center;">
                    <button onclick="window.editJira(${globalIdx})" style="background: none; border: none; cursor: pointer; color: var(--blue-400); font-size: 14px; margin-right: 8px;" title="Edit">✏️</button>
                    <button onclick="window.deleteJira(${globalIdx})" style="background: none; border: none; cursor: pointer; color: var(--rose-400); font-size: 14px;" title="Delete">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

window.updateJiraFilter = function(field, val) {
    jiraFilters[field] = val;
    updateDashboard();
}

window.editJira = function(idx) {
    const j = jiraData[idx];
    document.getElementById('edit-index').value = idx;
    document.getElementById('modal-title').innerText = 'Edit Jira Issue';
    document.getElementById('modal-form-body').innerHTML = `
        <div class="form-group" style="margin:0;"><label>Assignee</label><input type="text" id="m-assignee" value="${j.Assignee}"></div>
        <div class="form-group" style="margin:0;"><label>Project</label><input type="text" id="m-proj" value="${j.Project}"></div>
        <div class="form-group" style="margin:0;"><label>From Status</label><input type="text" id="m-from" value="${j.FromStatus}"></div>
        <div class="form-group" style="margin:0;"><label>To Status</label><input type="text" id="m-to" value="${j.ToStatus}"></div>
        <div class="form-group" style="margin:0;"><label>Issues</label><input type="text" id="m-issues" value="${j.Issues}"></div>
    `;
    document.getElementById('employeeModal').classList.add('active');
}

window.deleteJira = function(idx) {
    if (confirm("Are you sure you want to delete this Jira issue?")) {
        jiraData.splice(idx, 1);
        updateDashboard();
    }
}