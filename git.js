// Data & State for Git Tab
let gitData = [
    { author: "Administrator", year: 2026, week_number: 30, week_start: "2026-07-20", week_end: "", unique_tickets_count: 0 },
    { author: "Administrator", year: 2026, week_number: 29, week_start: "2026-07-13", week_end: "", unique_tickets_count: 0 }
];

let gitFilters = { author: '', year: '', week_number: '', unique_tickets_count: '' };

function renderGitTable(data) {
    const getSortIndicator = (col) => (currentSortCol !== col) ? ' ↕' : (currentSortAsc ? ' ▲' : ' ▼');

    document.getElementById('table-header-row').innerHTML = `
        <th onclick="window.sortTable('author')">Author${getSortIndicator('author')}</th>
        <th onclick="window.sortTable('year')">Year${getSortIndicator('year')}</th>
        <th onclick="window.sortTable('week_number')">Week Number${getSortIndicator('week_number')}</th>
        <th onclick="window.sortTable('week_start')">Week Start</th>
        <th onclick="window.sortTable('week_end')">Week End</th>
        <th onclick="window.sortTable('unique_tickets_count')" style="text-align: right;">Unique Tickets Count${getSortIndicator('unique_tickets_count')}</th>
        <th style="text-align: center;">Actions</th>
    `;

    const authors = [...new Set(gitData.map(g => g.author))].filter(Boolean).sort();
    const years = [...new Set(gitData.map(g => g.year))].filter(Boolean).sort();
    const weeks = [...new Set(gitData.map(g => g.week_number))].filter(v => v !== undefined && v !== null).sort((a,b)=>a-b);

    const createSelectFilter = (field, currentVal, options, defaultText) => `
        <select class="table-filter-input" onchange="window.updateGitFilter('${field}', this.value)">
            <option value="">${defaultText}</option>
            ${options.map(opt => `<option value="${opt}" ${String(opt) === String(currentVal) ? 'selected' : ''}>${opt}</option>`).join('')}
        </select>
    `;

    document.getElementById('table-filter-row').innerHTML = `
        <th>${createSelectFilter('author', gitFilters.author, authors, 'All Authors')}</th>
        <th>${createSelectFilter('year', gitFilters.year, years, 'All Years')}</th>
        <th>${createSelectFilter('week_number', gitFilters.week_number, weeks, 'All Weeks')}</th>
        <th></th>
        <th></th>
        <th><input type="text" class="table-filter-input" placeholder="Filter Count..." value="${gitFilters.unique_tickets_count}" oninput="window.updateGitFilter('unique_tickets_count', this.value)"></th>
        <th></th>
    `;

    const tbody = document.getElementById('resource-table-body');
    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-slate-400); padding: 32px;">No Git Matrix data available.</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map((g) => {
        const globalIdx = gitData.indexOf(g);
        return `
            <tr>
                <td style="font-weight: 500; color: white;">${g.author}</td>
                <td style="color: var(--text-slate-400);">${g.year}</td>
                <td><span class="badge">Week ${g.week_number}</span></td>
                <td style="color: var(--text-slate-400);">${g.week_start || '—'}</td>
                <td style="color: var(--text-slate-400);">${g.week_end || '—'}</td>
                <td style="text-align: right;">
                    <span style="padding: 4px 10px; background: rgba(6, 182, 212, 0.1); color: var(--cyan-400); border-radius: 6px; font-weight: bold; border: 1px solid rgba(6, 182, 212, 0.2);">
                        ${g.unique_tickets_count}
                    </span>
                </td>
                <td style="text-align: center;">
                    <button onclick="window.editGit(${globalIdx})" style="background: none; border: none; cursor: pointer; color: var(--blue-400); font-size: 14px; margin-right: 8px;" title="Edit">✏️</button>
                    <button onclick="window.deleteGit(${globalIdx})" style="background: none; border: none; cursor: pointer; color: var(--rose-400); font-size: 14px;" title="Delete">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

window.updateGitFilter = function(field, val) {
    gitFilters[field] = val;
    updateDashboard();
}

window.editGit = function(idx) {
    const g = gitData[idx];
    document.getElementById('edit-index').value = idx;
    document.getElementById('modal-title').innerText = 'Edit Git Record';
    document.getElementById('modal-form-body').innerHTML = `
        <div class="form-group" style="margin:0;"><label>Author</label><input type="text" id="m-author" value="${g.author}"></div>
        <div class="form-group" style="margin:0;"><label>Year</label><input type="number" id="m-year" value="${g.year}"></div>
        <div class="form-group" style="margin:0;"><label>Week Number</label><input type="number" id="m-week" value="${g.week_number}"></div>
        <div class="form-group" style="margin:0;"><label>Week Start</label><input type="date" id="m-start" value="${g.week_start}"></div>
        <div class="form-group" style="margin:0;"><label>Week End</label><input type="date" id="m-end" value="${g.week_end}"></div>
        <div class="form-group" style="margin:0;"><label>Unique Tickets Count</label><input type="number" id="m-count" value="${g.unique_tickets_count}"></div>
    `;
    document.getElementById('employeeModal').classList.add('active');
}

window.deleteGit = function(idx) {
    if (confirm("Are you sure you want to delete this Git record?")) {
        gitData.splice(idx, 1);
        updateDashboard();
    }
}