// apiDatabaseView.js

export function render(container) {
    container.innerHTML = `
        <div class="max-w-7xl mx-auto space-y-6">
            
            <!-- SQL Query Input Section -->
            <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="bg-slate-900 text-white px-5 py-3 flex items-center justify-between border-b border-slate-800">
                    <div class="flex items-center gap-2">
                        <span class="text-blue-400 font-mono text-lg">⚡</span>
                        <h3 class="font-bold text-sm tracking-wide">SQL Query Console</h3>
                    </div>
                    <!-- Quick Helper Shortcuts -->
                    <div class="flex items-center gap-2">
                        <button id="btnShortcutSelect" class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded border border-slate-700 font-mono transition">SELECT *</button>
                        <button id="btnShortcutClear" class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded border border-slate-700 font-mono transition">Clear</button>
                    </div>
                </div>
                
                <div class="p-4 bg-slate-950">
                    <textarea 
                        id="sqlQueryInput" 
                        rows="5" 
                        class="w-full bg-slate-950 text-emerald-400 font-mono text-sm p-3 focus:outline-none resize-y placeholder-slate-700"
                        placeholder="-- Write your SQL query here&#10;SELECT * FROM employees LIMIT 10;"
                        spellcheck="false"
                    ></textarea>
                </div>

                <div class="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Target Endpoint:</span>
                        <code class="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded font-mono">/api/database/query</code>
                    </div>
                    <button 
                        id="btnExecuteQuery" 
                        class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition active:scale-95"
                    >
                        <span>Run Query</span>
                        <span class="text-xs opacity-75 font-mono">(Ctrl + Enter)</span>
                    </button>
                </div>
            </div>

            <!-- Query Metadata / Status Bar -->
            <div id="queryMetaContainer" class="hidden flex items-center justify-between bg-white px-5 py-3 rounded-xl border border-slate-200 text-xs font-medium">
                <div class="flex items-center gap-4">
                    <span id="queryStatusBadge" class="px-2.5 py-1 rounded-full font-bold"></span>
                    <span id="queryExecutionTime" class="text-slate-500 font-mono"></span>
                </div>
                <div id="queryRowCount" class="text-slate-600 font-semibold"></div>
            </div>

            <!-- Query Results Section -->
            <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[350px]">
                <div class="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                    <h4 class="font-bold text-slate-700 text-sm">Query Results</h4>
                    <div class="flex gap-2">
                        <button id="toggleViewBtn" class="text-xs text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1 rounded-md font-medium transition">
                            Switch to Raw JSON
                        </button>
                    </div>
                </div>

                <!-- Table View Container -->
                <div id="resultTableWrapper" class="overflow-auto flex-1 max-h-[500px]">
                    <div class="p-12 text-center text-slate-400 space-y-2">
                        <div class="text-3xl">🔍</div>
                        <p class="text-sm font-medium">Run a SQL query above to view standard response tables.</p>
                    </div>
                </div>

                <!-- Raw JSON Container (Initially Hidden) -->
                <div id="resultJsonWrapper" class="hidden overflow-auto flex-1 max-h-[500px] bg-slate-900 p-4">
                    <pre id="jsonViewer" class="text-xs text-blue-300 font-mono whitespace-pre-wrap"></pre>
                </div>
            </div>

        </div>
    `;

    // Internal State Management
    let currentData = null;
    let isJsonView = false;

    // DOM References
    const queryInput = container.querySelector("#sqlQueryInput");
    const executeBtn = container.querySelector("#btnExecuteQuery");
    const metaContainer = container.querySelector("#queryMetaContainer");
    const statusBadge = container.querySelector("#queryStatusBadge");
    const executionTimeEl = container.querySelector("#queryExecutionTime");
    const rowCountEl = container.querySelector("#queryRowCount");
    const tableWrapper = container.querySelector("#resultTableWrapper");
    const jsonWrapper = container.querySelector("#resultJsonWrapper");
    const jsonViewer = container.querySelector("#jsonViewer");
    const toggleViewBtn = container.querySelector("#toggleViewBtn");

    // Event Listeners
    executeBtn.addEventListener("click", executeQuery);
    
    // Keyboard Shortcut (Ctrl + Enter / Cmd + Enter to Run Query)
    queryInput.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            executeQuery();
        }
    });

    container.querySelector("#btnShortcutSelect").addEventListener("click", () => {
        queryInput.value = "SELECT * FROM employees LIMIT 50;";
        queryInput.focus();
    });

    container.querySelector("#btnShortcutClear").addEventListener("click", () => {
        queryInput.value = "";
        queryInput.focus();
    });

    toggleViewBtn.addEventListener("click", () => {
        isJsonView = !isJsonView;
        if (isJsonView) {
            tableWrapper.classList.add("hidden");
            jsonWrapper.classList.remove("hidden");
            toggleViewBtn.innerText = "Switch to Table View";
        } else {
            jsonWrapper.classList.add("hidden");
            tableWrapper.classList.remove("hidden");
            toggleViewBtn.innerText = "Switch to Raw JSON";
        }
    });

    // Core Execution Logic
    async function executeQuery() {
        const queryText = queryInput.value.trim();
        if (!queryText) return;

        // UI Loading State
        executeBtn.disabled = true;
        executeBtn.classList.add("opacity-50", "cursor-not-allowed");
        tableWrapper.innerHTML = `
            <div class="p-12 text-center text-slate-500 space-y-3">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                <p class="text-sm font-medium">Executing SQL query against database engine...</p>
            </div>`;

        const startTime = performance.now();

        try {
            // Adjust the fetch URL and payload key to match your API backend specification
            const response = await fetch("/api/database/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: queryText })
            });

            const endTime = performance.now();
            const executionDuration = (endTime - startTime).toFixed(2);
            
            const data = await response.json();
            currentData = data;

            // Render Meta Header Status
            metaContainer.classList.remove("hidden");
            executionTimeEl.innerText = `Duration: ${executionDuration} ms`;

            if (!response.ok) {
                throw new Error(data.message || data.error || `HTTP ${response.status} execution failure.`);
            }

            // Success Metadata Rendering
            statusBadge.className = "px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300";
            statusBadge.innerText = `SUCCESS (${response.status})`;

            // Support for arrays of results or custom data key envelopes
            const resultList = Array.isArray(data) ? data : (data.results || data.rows || []);
            rowCountEl.innerText = `${resultList.length} Row(s) returned`;

            // Render Results Engine
            renderTable(resultList);
            jsonViewer.textContent = JSON.stringify(data, null, 2);

        } catch (err) {
            metaContainer.classList.remove("hidden");
            statusBadge.className = "px-2.5 py-1 rounded-full font-bold bg-rose-100 text-rose-800 border border-rose-300";
            statusBadge.innerText = "ERROR";
            rowCountEl.innerText = "0 Rows returned";

            tableWrapper.innerHTML = `
                <div class="p-8 bg-rose-50 border-l-4 border-rose-500 text-rose-800 m-4 rounded-r-lg space-y-1">
                    <div class="font-bold text-sm">Query Execution Error</div>
                    <div class="text-xs font-mono break-all">${err.message}</div>
                </div>`;
            jsonViewer.textContent = JSON.stringify({ error: err.message }, null, 2);
        } finally {
            executeBtn.disabled = false;
            executeBtn.classList.remove("opacity-50", "cursor-not-allowed");
        }
    }

    // Dynamic SQL Response Table Builder
    function renderTable(rows) {
        if (!rows || rows.length === 0) {
            tableWrapper.innerHTML = `
                <div class="p-8 text-center text-slate-400 text-sm">
                    Query executed successfully, but returned 0 records (or non-tabular response).
                </div>`;
            return;
        }

        // Dynamically extract database column headers from first record keys
        const columns = Object.keys(rows[0]);

        let headMarkup = `
            <tr class="bg-slate-100 border-b border-slate-200">
                <th class="p-2.5 text-left text-xs font-bold text-slate-500 w-12 bg-slate-100 sticky top-0">#</th>`;
        columns.forEach(col => {
            headMarkup += `<th class="p-2.5 text-left text-xs font-bold text-slate-700 font-mono uppercase bg-slate-100 sticky top-0">${col}</th>`;
        });
        headMarkup += `</tr>`;

        let bodyMarkup = "";
        rows.forEach((row, idx) => {
            bodyMarkup += `<tr class="border-b border-slate-100 hover:bg-slate-50 transition">`;
            bodyMarkup += `<td class="p-2.5 text-xs text-slate-400 font-mono">${idx + 1}</td>`;
            columns.forEach(col => {
                const val = row[col];
                const displayVal = (typeof val === "object" && val !== null) ? JSON.stringify(val) : (val ?? "NULL");
                const isNull = val === null;
                bodyMarkup += `<td class="p-2.5 text-xs font-mono ${isNull ? 'text-slate-400 italic' : 'text-slate-800'} truncate max-w-xs">${displayVal}</td>`;
            });
            bodyMarkup += `</tr>`;
        });

        tableWrapper.innerHTML = `
            <table class="w-full text-left border-collapse">
                <thead>${headMarkup}</thead>
                <tbody>${bodyMarkup}</tbody>
            </table>`;
    }
}