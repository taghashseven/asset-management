export function render(container) {
    container.innerHTML = `
        <div class="p-4 md:p-6 space-y-6 bg-slate-100 min-h-screen">
            
            <!-- Dashboard Header -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div class="flex items-center gap-3">
                    <div class="p-3 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s-8-1.79-8-4"></path></svg>
                    </div>
                    <div>
                        <h2 class="text-xl font-bold text-slate-800 tracking-tight">Dynamic Database Explorer & ER Visualizer</h2>
                        <p id="dbSummarySubtitle" class="text-xs text-slate-500">Connecting to database engine...</p>
                    </div>
                </div>

                <!-- View Switcher & Actions -->
                <div class="flex items-center gap-3">
                    <div class="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1">
                        <button id="tabBtnConsole" class="px-3 py-1.5 rounded-lg text-xs font-bold transition bg-white text-blue-600 shadow-sm">
                            💻 SQL Console & Data
                        </button>
                        <button id="tabBtnVisualizer" class="px-3 py-1.5 rounded-lg text-xs font-bold transition text-slate-600 hover:text-slate-900">
                            🎯 Focused ER Diagram
                        </button>
                    </div>

                    <button id="btnRefreshSchema" class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-300 font-semibold transition flex items-center gap-1.5">
                        <span>🔄</span> Refresh
                    </button>
                </div>
            </div>

            <!-- VIEW 1: SQL Console & Data Explorer -->
            <div id="viewConsole" class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <!-- Left Sidebar: Tables Browser -->
                <div class="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[780px] overflow-hidden">
                    <div class="p-4 border-b border-slate-100 bg-slate-50/50">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="font-bold text-sm text-slate-700">Schema Explorer</h3>
                            <span id="tableCountBadge" class="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-mono">0</span>
                        </div>
                        <input 
                            type="text" 
                            id="tableSearchInput" 
                            placeholder="Filter tables..." 
                            class="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                        />
                    </div>

                    <div id="tablesContainer" class="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
                        <div class="p-8 text-center text-slate-400 text-xs">Fetching database schema...</div>
                    </div>
                </div>

                <!-- Right Pane: SQL Console + Dynamic Results View -->
                <div class="lg:col-span-9 space-y-6">
                    <div class="bg-slate-950 rounded-2xl shadow-lg border border-slate-800 overflow-hidden">
                        <div class="bg-slate-900/90 px-5 py-3 flex items-center justify-between border-b border-slate-800">
                            <div class="flex items-center gap-2">
                                <span class="text-blue-400 font-mono text-base">⚡</span>
                                <h3 class="font-bold text-xs uppercase tracking-wider text-slate-300 font-mono">SQL Execution Console</h3>
                            </div>
                            <div class="flex items-center gap-2" id="queryShortcutsContainer">
                                <button id="btnShortcutSelect" class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/60 font-mono transition">SELECT Active Table</button>
                                <button id="btnShortcutClear" class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700/60 font-mono transition">Clear</button>
                            </div>
                        </div>
                        
                        <div class="p-4 bg-slate-950">
                            <textarea 
                                id="sqlQueryInput" 
                                rows="4" 
                                class="w-full bg-transparent text-emerald-400 font-mono text-sm leading-relaxed p-2 focus:outline-none resize-y placeholder-slate-700"
                                placeholder="-- Select a table from the sidebar or type dynamic custom SQL queries...&#10;SELECT * FROM your_table LIMIT 50;"
                                spellcheck="false"
                            ></textarea>
                        </div>

                        <div class="bg-slate-900/50 px-5 py-3 border-t border-slate-800/80 flex items-center justify-between">
                            <div class="flex items-center gap-2 text-slate-400">
                                <span class="text-[11px] font-mono text-slate-500 uppercase">Endpoint:</span>
                                <code class="text-xs text-blue-400 font-mono bg-blue-950/50 px-2 py-0.5 rounded border border-blue-900/50">/api/database-api/query</code>
                            </div>
                            <button 
                                id="btnExecuteQuery" 
                                class="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold tracking-wide flex items-center gap-2 shadow-lg shadow-blue-600/30 transition active:scale-95"
                            >
                                <span>RUN QUERY</span>
                                <span class="text-[10px] opacity-75 font-mono">(Ctrl + Enter)</span>
                            </button>
                        </div>
                    </div>

                    <div id="queryMetaContainer" class="hidden flex items-center justify-between bg-white px-5 py-3 rounded-xl border border-slate-200 text-xs font-medium shadow-sm">
                        <div class="flex items-center gap-3">
                            <span id="queryStatusBadge" class="px-2.5 py-0.5 rounded-full font-bold"></span>
                            <span id="queryExecutionTime" class="text-slate-500 font-mono"></span>
                        </div>
                        <div id="queryRowCount" class="text-slate-700 font-semibold font-mono"></div>
                    </div>

                    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[420px]">
                        <div class="bg-slate-50/80 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <h4 class="font-bold text-slate-700 text-xs uppercase tracking-wider">Results Explorer</h4>
                                <span id="activeTableLabel" class="text-xs text-blue-600 font-mono font-semibold"></span>
                            </div>
                            <button id="toggleViewBtn" class="text-xs text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1 rounded-lg font-medium shadow-sm transition">
                                Switch to Raw JSON
                            </button>
                        </div>

                        <div id="resultTableWrapper" class="overflow-auto flex-1 max-h-[480px]">
                            <div class="p-16 text-center text-slate-400 space-y-3">
                                <div class="text-4xl">🗄️</div>
                                <p class="text-xs font-medium text-slate-500">Select a table from the left or run a custom SQL query to display database records.</p>
                            </div>
                        </div>

                        <div id="resultJsonWrapper" class="hidden overflow-auto flex-1 max-h-[480px] bg-slate-900 p-4">
                            <pre id="jsonViewer" class="text-xs text-emerald-400 font-mono whitespace-pre-wrap"></pre>
                        </div>
                    </div>
                </div>
            </div>

            <!-- VIEW 2: Single Table Focused ER Diagram Visualizer -->
            <div id="viewVisualizer" class="hidden relative bg-slate-900 border border-slate-800 rounded-2xl shadow-xl h-[780px] overflow-hidden">
                <div class="absolute top-4 left-4 z-20 bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 shadow-lg backdrop-blur flex items-center gap-3">
                    <div>
                        <h3 class="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider">Single Table ER Focus</h3>
                        <p class="text-[11px] text-slate-400 mt-0.5">Showing dynamic direct relationships</p>
                    </div>
                    <div class="border-l border-slate-700 pl-3">
                        <label class="text-[10px] text-slate-400 uppercase font-mono block mb-1">Select Focus Table:</label>
                        <select id="focusTableSelect" class="bg-slate-800 text-blue-400 text-xs font-mono font-bold border border-slate-700 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500">
                            <!-- Populated dynamically -->
                        </select>
                    </div>
                </div>

                <div id="erCanvasViewport" class="relative w-full h-full overflow-auto">
                    <!-- SVG Overlay Canvas for Connectors -->
                    <svg id="erSvgCanvas" class="absolute inset-0 pointer-events-none z-0 min-w-full min-h-full">
                        <defs>
                            <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
                            </marker>
                        </defs>
                    </svg>

                    <!-- Dynamic Container for Draggable Table Nodes -->
                    <div id="erNodesContainer" class="relative z-10 p-8 min-w-full min-h-full"></div>
                </div>
            </div>

        </div>
    `;

    // State Variables
    let currentSchemaData = null;
    let selectedFocusTable = null;
    let isJsonView = false;

    // DOM Elements
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
    const tableSearchInput = container.querySelector("#tableSearchInput");
    const activeTableLabel = container.querySelector("#activeTableLabel");
    const tablesContainer = container.querySelector("#tablesContainer");
    const tableCountBadge = container.querySelector("#tableCountBadge");
    const dbSummarySubtitle = container.querySelector("#dbSummarySubtitle");
    const btnRefreshSchema = container.querySelector("#btnRefreshSchema");

    // Navigation and Canvas Elements
    const tabBtnConsole = container.querySelector("#tabBtnConsole");
    const tabBtnVisualizer = container.querySelector("#tabBtnVisualizer");
    const viewConsole = container.querySelector("#viewConsole");
    const viewVisualizer = container.querySelector("#viewVisualizer");
    const erSvgCanvas = container.querySelector("#erSvgCanvas");
    const erNodesContainer = container.querySelector("#erNodesContainer");
    const erCanvasViewport = container.querySelector("#erCanvasViewport");
    const focusTableSelect = container.querySelector("#focusTableSelect");

    // Initialize Schema
    loadSchemaSummary();

    // Event Handlers
    tabBtnConsole.addEventListener("click", () => {
        tabBtnConsole.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition bg-white text-blue-600 shadow-sm";
        tabBtnVisualizer.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition text-slate-600 hover:text-slate-900";
        viewConsole.classList.remove("hidden");
        viewVisualizer.classList.add("hidden");
    });

    tabBtnVisualizer.addEventListener("click", () => {
        tabBtnVisualizer.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition bg-white text-blue-600 shadow-sm";
        tabBtnConsole.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition text-slate-600 hover:text-slate-900";
        viewConsole.classList.add("hidden");
        viewVisualizer.classList.remove("hidden");
        
        if (currentSchemaData) {
            requestAnimationFrame(() => renderFocusedErDiagram());
        }
    });

    focusTableSelect.addEventListener("change", (e) => {
        selectedFocusTable = e.target.value;
        renderFocusedErDiagram();
    });

    btnRefreshSchema.addEventListener("click", loadSchemaSummary);
    executeBtn.addEventListener("click", executeSqlQuery);

    queryInput.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            executeSqlQuery();
        }
    });

    tableSearchInput.addEventListener("input", (e) => {
        const val = e.target.value.toLowerCase();
        container.querySelectorAll(".btn-table-item").forEach(item => {
            const tableName = item.getAttribute("data-table").toLowerCase();
            item.style.display = tableName.includes(val) ? "flex" : "none";
        });
    });

    container.querySelector("#btnShortcutSelect").addEventListener("click", () => {
        const targetTable = selectedFocusTable || getNormalizedTablesList(currentSchemaData)[0]?.name;
        if (targetTable) {
            queryInput.value = `SELECT * FROM ${targetTable} LIMIT 50;`;
            activeTableLabel.innerText = `[${targetTable}]`;
            queryInput.focus();
        }
    });

    container.querySelector("#btnShortcutClear").addEventListener("click", () => {
        queryInput.value = "";
        activeTableLabel.innerText = "";
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

    // Dynamic Schema Extraction Engine
    async function loadSchemaSummary() {
        tablesContainer.innerHTML = `<div class="p-8 text-center text-slate-400 text-xs">Loading schema...</div>`;
        
        try {
            const response = await fetch("/api/database-api");
            if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch schema.`);
            
            currentSchemaData = await response.json();
            const tables = getNormalizedTablesList(currentSchemaData);
            
            if (tables.length > 0 && !selectedFocusTable) {
                selectedFocusTable = tables[0].name;
            }

            renderSidebarSchema(currentSchemaData);
            populateFocusDropdown(currentSchemaData);
            
            if (!viewVisualizer.classList.contains("hidden")) {
                renderFocusedErDiagram();
            }
        } catch (err) {
            tablesContainer.innerHTML = `
                <div class="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl m-2">
                    <strong>Schema Load Error:</strong><br/>${err.message}
                </div>`;
            dbSummarySubtitle.innerText = "Failed to load database schema.";
        }
    }

    function populateFocusDropdown(summaryData) {
        const tables = getNormalizedTablesList(summaryData);
        focusTableSelect.innerHTML = tables.map(t => `<option value="${t.name}">${t.name}</option>`).join('');
        if (selectedFocusTable) {
            focusTableSelect.value = selectedFocusTable;
        }
    }

    function getNormalizedTablesList(summaryData) {
        if (!summaryData) return [];
        const tablesObj = summaryData.tables || summaryData;
        
        if (Array.isArray(tablesObj)) {
            return tablesObj.map(t => typeof t === "string" ? { name: t, columns: [] } : t);
        }
        
        return Object.keys(tablesObj).map(key => ({
            name: key,
            columns: Array.isArray(tablesObj[key].columns) 
                ? tablesObj[key].columns 
                : (Array.isArray(tablesObj[key]) ? tablesObj[key] : [])
        }));
    }

    // Dynamic Sidebar Rendering
    function renderSidebarSchema(summaryData) {
        const tables = getNormalizedTablesList(summaryData);
        tableCountBadge.innerText = tables.length;
        dbSummarySubtitle.innerText = `Database Engine • ${tables.length} Table(s) Discovered`;

        if (tables.length === 0) {
            tablesContainer.innerHTML = `<div class="p-8 text-center text-slate-400 text-xs">No tables found in database.</div>`;
            return;
        }

        tablesContainer.innerHTML = tables.map(item => `
            <button 
                data-table="${item.name}" 
                class="btn-table-item w-full text-left p-2.5 rounded-xl hover:bg-blue-50/80 transition group flex items-center justify-between border border-transparent hover:border-blue-100"
            >
                <div class="flex items-center gap-2.5 min-w-0">
                    <span class="text-base group-hover:scale-110 transition-transform">📄</span>
                    <div class="truncate">
                        <div class="text-xs font-semibold text-slate-700 font-mono group-hover:text-blue-600 truncate">${item.name}</div>
                        <div class="text-[10px] text-slate-400 font-mono">${(item.columns || []).length} column(s)</div>
                    </div>
                </div>
                <span class="text-[10px] text-blue-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity">FETCH</span>
            </button>
        `).join('');

        container.querySelectorAll(".btn-table-item").forEach(btn => {
            btn.addEventListener("click", () => {
                const tableName = btn.getAttribute("data-table");
                queryInput.value = `SELECT * FROM ${tableName} LIMIT 100;`;
                activeTableLabel.innerText = `[${tableName}]`;
                selectedFocusTable = tableName;
                focusTableSelect.value = tableName;
                fetchTableContent(tableName);
            });
        });
    }

    // Dynamic Relational Graph Builder
    function renderFocusedErDiagram() {
        erNodesContainer.innerHTML = "";
        if (!currentSchemaData) return;

        const allTables = getNormalizedTablesList(currentSchemaData);
        const focusTableObj = allTables.find(t => t.name === selectedFocusTable);

        if (!focusTableObj) {
            erNodesContainer.innerHTML = `<div class="text-slate-400 text-xs text-center mt-20">Select a target table to visualize its relational tree.</div>`;
            return;
        }

        const relatedTables = [];
        const relationships = [];

        // Discover Dynamic Foreign Relationships
        allTables.forEach(otherTbl => {
            if (otherTbl.name === focusTableObj.name) return;

            let isRelated = false;

            // Check if focus table references other table
            (focusTableObj.columns || []).forEach(col => {
                const colName = typeof col === "string" ? col : (col.name || col.title || "");
                const targetSingular = otherTbl.name.replace(/s$/, "");
                
                if (colName === `${targetSingular}_id` || colName === `${otherTbl.name}_id`) {
                    isRelated = true;
                    relationships.push({ from: focusTableObj.name, to: otherTbl.name, key: colName });
                }
            });

            // Check if other table references focus table
            (otherTbl.columns || []).forEach(col => {
                const colName = typeof col === "string" ? col : (col.name || col.title || "");
                const focusSingular = focusTableObj.name.replace(/s$/, "");
                
                if (colName === `${focusSingular}_id` || colName === `${focusTableObj.name}_id`) {
                    isRelated = true;
                    relationships.push({ from: otherTbl.name, to: focusTableObj.name, key: colName });
                }
            });

            if (isRelated && !relatedTables.some(rt => rt.name === otherTbl.name)) {
                relatedTables.push(otherTbl);
            }
        });

        // Radial Layout Computation
        const viewportWidth = erCanvasViewport.clientWidth || 900;
        const viewportHeight = erCanvasViewport.clientHeight || 700;

        const centerX = Math.max(350, viewportWidth / 2 - 130);
        const centerY = Math.max(250, viewportHeight / 2 - 140);
        const radius = 320;

        renderTableCard(focusTableObj, centerX, centerY, true);

        relatedTables.forEach((relTbl, idx) => {
            const angle = (2 * Math.PI * idx) / relatedTables.length;
            const px = centerX + radius * Math.cos(angle);
            const py = centerY + radius * Math.sin(angle);

            renderTableCard(relTbl, px, py, false);
        });

        const activeTableSet = [focusTableObj, ...relatedTables];
        
        activeTableSet.forEach(tbl => {
            const el = container.querySelector(`#node-${tbl.name}`);
            if (el) makeDraggable(el, relationships);
        });

        syncCanvasSizeAndRedraw(relationships);
    }

    function renderTableCard(tbl, posX, posY, isFocus) {
        const node = document.createElement("div");
        node.id = `node-${tbl.name}`;
        node.setAttribute("data-table-name", tbl.name);
        
        const borderClass = isFocus ? "border-2 border-blue-500 shadow-blue-500/20 ring-4 ring-blue-500/10" : "border border-slate-700 hover:border-slate-500";
        const headerBg = isFocus ? "bg-blue-900/40 border-blue-500/50" : "bg-slate-900 border-slate-700";

        node.className = `absolute bg-slate-800/95 ${borderClass} rounded-xl shadow-2xl w-[260px] overflow-hidden cursor-move transition-all select-none`;
        node.style.left = `${posX}px`;
        node.style.top = `${posY}px`;

        const columnsHtml = (tbl.columns || []).map(c => {
            const colName = typeof c === "string" ? c : (c.name || c.cid || c.field || "");
            const colType = c.type ? `<span class="text-[10px] text-slate-500 font-mono">${c.type}</span>` : '';
            const isPk = c.pk || colName.endsWith("_id") || colName === "id";
            const isFk = colName.includes("_id") && !isPk;

            let keyBadge = '';
            if (isPk) keyBadge = `<span class="text-[9px] bg-amber-500/20 text-amber-400 px-1 py-0.2 rounded font-mono font-bold">PK</span>`;
            else if (isFk) keyBadge = `<span class="text-[9px] bg-blue-500/20 text-blue-400 px-1 py-0.2 rounded font-mono font-bold">FK</span>`;

            return `
                <div class="flex items-center justify-between text-xs px-3 py-1.5 border-b border-slate-800/60 hover:bg-slate-700/30">
                    <div class="flex items-center gap-1.5 truncate">
                        ${keyBadge}
                        <span class="font-mono ${isPk ? 'text-amber-200 font-semibold' : (isFk ? 'text-blue-300' : 'text-slate-300')} truncate">${colName}</span>
                    </div>
                    ${colType}
                </div>
            `;
        }).join('');

        node.innerHTML = `
            <div class="${headerBg} border-b px-3 py-2 flex items-center justify-between">
                <div class="flex items-center gap-1.5 truncate">
                    ${isFocus ? '<span class="text-xs">🎯</span>' : ''}
                    <span class="font-mono text-xs font-bold ${isFocus ? 'text-blue-300' : 'text-slate-300'} truncate">${tbl.name}</span>
                </div>
                <span class="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">${(tbl.columns || []).length} cols</span>
            </div>
            <div class="max-h-52 overflow-y-auto divide-y divide-slate-800">
                ${columnsHtml || '<div class="p-3 text-[11px] text-slate-500 italic">No columns detected</div>'}
            </div>
        `;

        erNodesContainer.appendChild(node);
    }

    function getCardBounds(node) {
        return {
            left: { x: node.offsetLeft, y: node.offsetTop + node.offsetHeight / 2, dir: "left" },
            right: { x: node.offsetLeft + node.offsetWidth, y: node.offsetTop + node.offsetHeight / 2, dir: "right" },
            top: { x: node.offsetLeft + node.offsetWidth / 2, y: node.offsetTop, dir: "top" },
            bottom: { x: node.offsetLeft + node.offsetWidth / 2, y: node.offsetTop + node.offsetHeight, dir: "bottom" }
        };
    }

    function getClosestAnchorPair(nodeA, nodeB) {
        const boundsA = getCardBounds(nodeA);
        const boundsB = getCardBounds(nodeB);

        const anchorsA = Object.values(boundsA);
        const anchorsB = Object.values(boundsB);

        let minDistance = Infinity;
        let bestPair = { start: anchorsA[0], end: anchorsB[0] };

        anchorsA.forEach(a => {
            anchorsB.forEach(b => {
                const dist = Math.hypot(b.x - a.x, b.y - a.y);
                if (dist < minDistance) {
                    minDistance = dist;
                    bestPair = { start: a, end: b };
                }
            });
        });

        return bestPair;
    }

    function drawAdaptiveRelationships(relationships) {
        const markers = erSvgCanvas.querySelector("defs");
        erSvgCanvas.innerHTML = "";
        if (markers) erSvgCanvas.appendChild(markers);

        relationships.forEach(rel => {
            const sourceNode = container.querySelector(`#node-${rel.from}`);
            const targetNode = container.querySelector(`#node-${rel.to}`);

            if (sourceNode && targetNode) {
                const { start, end } = getClosestAnchorPair(sourceNode, targetNode);
                drawAdaptiveBezier(start, end);
            }
        });
    }

    function drawAdaptiveBezier(start, end) {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const dx = Math.abs(end.x - start.x) * 0.5;
        const dy = Math.abs(end.y - start.y) * 0.5;

        let cp1x = start.x, cp1y = start.y;
        let cp2x = end.x, cp2y = end.y;

        const offset = Math.max(35, Math.min(dx, dy));

        if (start.dir === "left") cp1x -= offset;
        else if (start.dir === "right") cp1x += offset;
        else if (start.dir === "top") cp1y -= offset;
        else if (start.dir === "bottom") cp1y += offset;

        if (end.dir === "left") cp2x -= offset;
        else if (end.dir === "right") cp2x += offset;
        else if (end.dir === "top") cp2y -= offset;
        else if (end.dir === "bottom") cp2y += offset;

        path.setAttribute("d", `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`);
        path.setAttribute("stroke", "#3b82f6");
        path.setAttribute("stroke-width", "2.5");
        path.setAttribute("stroke-dasharray", "5 4");
        path.setAttribute("fill", "none");
        path.setAttribute("marker-end", "url(#arrow)");
        path.setAttribute("opacity", "0.9");

        erSvgCanvas.appendChild(path);
    }

    function syncCanvasSizeAndRedraw(relationships) {
        const nodes = container.querySelectorAll("[id^='node-']");
        let maxX = erCanvasViewport.clientWidth;
        let maxY = erCanvasViewport.clientHeight;

        nodes.forEach(node => {
            const right = node.offsetLeft + node.offsetWidth + 80;
            const bottom = node.offsetTop + node.offsetHeight + 80;
            if (right > maxX) maxX = right;
            if (bottom > maxY) maxY = bottom;
        });

        erSvgCanvas.setAttribute("width", `${maxX}px`);
        erSvgCanvas.setAttribute("height", `${maxY}px`);
        erNodesContainer.style.width = `${maxX}px`;
        erNodesContainer.style.height = `${maxY}px`;

        drawAdaptiveRelationships(relationships);
    }

    function makeDraggable(element, relationships) {
        let offsetX = 0, offsetY = 0, isDragging = false;

        element.addEventListener("mousedown", (e) => {
            if (e.target.closest('.overflow-y-auto')) return;
            isDragging = true;
            offsetX = e.clientX - element.offsetLeft;
            offsetY = e.clientY - element.offsetTop;
            element.classList.add("z-30", "ring-2", "ring-blue-500");
        });

        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            const newX = Math.max(10, e.clientX - offsetX);
            const newY = Math.max(10, e.clientY - offsetY);

            element.style.left = `${newX}px`;
            element.style.top = `${newY}px`;

            syncCanvasSizeAndRedraw(relationships);
        });

        document.addEventListener("mouseup", () => {
            if (isDragging) {
                isDragging = false;
                element.classList.remove("z-30", "ring-2", "ring-blue-500");
            }
        });
    }

    // Dynamic Execution Requests
    async function executeSqlQuery() {
        const queryText = queryInput.value.trim();
        if (!queryText) return;

        setLoadingState("Executing query...");
        const startTime = performance.now();

        try {
            const response = await fetch("/api/database-api/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: queryText })
            });

            const duration = (performance.now() - startTime).toFixed(2);
            const data = await response.json();
            handleApiResponse(response, data, duration);
        } catch (err) {
            handleApiError(err.message);
        }
    }

    async function fetchTableContent(tableName) {
        setLoadingState(`Fetching contents for '${tableName}'...`);
        const startTime = performance.now();

        try {
            const response = await fetch("/api/database-api/table", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tableName })
            });

            const duration = (performance.now() - startTime).toFixed(2);
            const data = await response.json();
            handleApiResponse(response, data, duration);
        } catch (err) {
            handleApiError(err.message);
        }
    }

    function setLoadingState(message) {
        executeBtn.disabled = true;
        executeBtn.classList.add("opacity-50", "cursor-not-allowed");
        tableWrapper.innerHTML = `
            <div class="p-16 text-center text-slate-500 space-y-3">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                <p class="text-xs font-medium text-slate-600">${message}</p>
            </div>`;
    }

    function handleApiResponse(response, data, duration) {
        executeBtn.disabled = false;
        executeBtn.classList.remove("opacity-50", "cursor-not-allowed");

        metaContainer.classList.remove("hidden");
        executionTimeEl.innerText = `Time: ${duration} ms`;

        if (!response.ok) {
            handleApiError(data.message || data.error || `HTTP ${response.status} Error`);
            return;
        }

        statusBadge.className = "px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200";
        statusBadge.innerText = `200 OK`;

        const resultList = Array.isArray(data) ? data : (data.results || data.rows || []);
        rowCountEl.innerText = `${resultList.length} row(s) returned`;

        renderTable(resultList);
        jsonViewer.textContent = JSON.stringify(data, null, 2);
    }

    function handleApiError(errorMessage) {
        executeBtn.disabled = false;
        executeBtn.classList.remove("opacity-50", "cursor-not-allowed");

        metaContainer.classList.remove("hidden");
        statusBadge.className = "px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200";
        statusBadge.innerText = "FAILED";
        rowCountEl.innerText = "0 rows";

        tableWrapper.innerHTML = `
            <div class="p-6 bg-rose-50 border-l-4 border-rose-500 text-rose-800 m-4 rounded-r-xl space-y-1">
                <div class="font-bold text-xs uppercase tracking-wider">Execution Error</div>
                <div class="text-xs font-mono break-all">${errorMessage}</div>
            </div>`;
        jsonViewer.textContent = JSON.stringify({ error: errorMessage }, null, 2);
    }

    function renderTable(rows) {
        if (!rows || rows.length === 0) {
            tableWrapper.innerHTML = `
                <div class="p-12 text-center text-slate-400 text-xs">
                    Query executed successfully, but returned 0 records.
                </div>`;
            return;
        }

        const columns = Object.keys(rows[0]);

        let headMarkup = `
            <tr class="bg-slate-100/80 border-b border-slate-200">
                <th class="p-3 text-left text-[11px] font-bold text-slate-400 w-10 bg-slate-100 sticky top-0">#</th>`;
        columns.forEach(col => {
            headMarkup += `<th class="p-3 text-left text-[11px] font-bold text-slate-600 font-mono uppercase bg-slate-100 sticky top-0 tracking-wider">${col}</th>`;
        });
        headMarkup += `</tr>`;

        let bodyMarkup = "";
        rows.forEach((row, idx) => {
            bodyMarkup += `<tr class="border-b border-slate-100 hover:bg-blue-50/40 transition">`;
            bodyMarkup += `<td class="p-3 text-xs text-slate-400 font-mono">${idx + 1}</td>`;
            columns.forEach(col => {
                const val = row[col];
                const displayVal = (typeof val === "object" && val !== null) ? JSON.stringify(val) : (val ?? "NULL");
                const isNull = val === null;
                bodyMarkup += `<td class="p-3 text-xs font-mono ${isNull ? 'text-slate-400 italic' : 'text-slate-800'} truncate max-w-xs">${displayVal}</td>`;
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