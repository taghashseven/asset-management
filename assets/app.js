export const CONFIG = {
    employees: {
        endpoint: "/api/employees",
        idField: "employee_id",
        fields: ["employee_id" , "email", "first_name", "last_name", "department", "job_title", "active"],
        fieldTypes: {
            active: ["true", "false"]
        },
        customViewFile: "./employeeRowTemplate.js"
    },


    "user-resources": {
        endpoint: "/api/views",
        idField: "employee_id",
        fields: ["employee_id", "department", "email", "first_name", "last_name", "computers", "monitors", "forms"],
        fieldTypes: {
            computers: "array",
            monitors: "array",
            forms: {
                type: "array",
                displayField: "path" ,// Target only the path attribute
                add : "api/employees/forms/create" , // Endpoint to add a new form
            }
        }, 
        
    },

    "forms": {
        endpoint: "/api/employees/forms/1",
        create : "/api/employees/forms/create",
        idField: "form_id",
        fields: ["form_id", "employee_id", "file_path"],
        fieldTypes: {
            date_submitted: "date", 
            file_path: "file"
        },
        customViewFile: null
    },
    "computer-assets": {
        endpoint: "/api/assets",
        idField: "asset_id",
        fields: ["asset_number", "serial_number", "device_type", "brand", "model", "status" , "bitlocker_key" , "assigned_to" , "location"],
        fieldTypes: {
            status: ["Available", "Deployed", "In Repair", "Scrapped"]
        },
        customViewFile: null
    },
    "asset-assignments": {
        endpoint: "/api/assignments",
        update: "/api/assignments/update",
        idField: "assignment_id",
        fields: ["serial_number", "assignment_id"  , "employee_email", "date_issued", "date_returned", "notes"],
        fieldTypes: {
            date_issued: "date",
            date_returned: "date",
            notes: "textarea"
        },
        customViewFile: null , 
        delete : true 
    },
    monitors: {
        endpoint: "/api/monitors",
        idField: "monitor_id",
        fields: ["asset_number", "serial_number", "brand", "model", "status"],
        fieldTypes: {
            status: ["Available", "Deployed", "In Repair"]
        },
        customViewFile: null
    },
    "monitor-assignments": {
        endpoint: "/api/usermonitors",
        idField: "id",
        fields: ["monitor_serial_number", "employee_email", "date_issued", "date_returned"],
        fieldTypes: {
            date_issued: "date",
            date_returned: "date"
        },
        customViewFile: null
    },
    printers: {
        endpoint: "/api/printers",
        idField: "printer_id",
        fields: ["asset_tag", "printer_name", "brand", "model", "status" , "IP_address" , "location" , "toner" , "page_count"],
        fieldTypes: {
            status: ["Online", "Offline", "Maintenance"],
            page_count: "number"
        },
        customViewFile: "./printerView.js"
    }, 
    "toner-stock": {
        endpoint: "/api/printers/toner-stock",
        idField: "id",
        fields: ["toner_code", "description", "quantity"],
        fieldTypes: {
            quantity: "number"
        },
        customViewFile: "./tonerStockView.js"
    }, 
    "printers-list": {
        endpoint: "/api/printers/all",
        customViewFile: "./printerListView.js",
        update: "/api/printers/update",
        idField: "printer_id",
        fields: [
            "printer_id", 
            "printer_name", 
            "brand", 
            "model", 
            "ip_address", 
            "mac_address", 
            "status", 
            "is_color", 
            "page_count", 
            "location", 
            "toner_code"
        ],
        fieldTypes: {
            status: ["Active", "Inactive", "Retired" , "standby"],
            is_color: [0 , 1],
            page_count: "number"
        } 
    }, 
    "printer-logs": {
        endpoint: (printerId) => `/api/printers/logs/${printerId}`,
        idField: "id",
        fields: ["id", "printer_id", "created_at", "description" ,  "event_type" , "toner_code" ],
        fieldTypes: {
            created_at: "date",
            event_type: ['TONER_REPLACEMENT', 'SERVICE', 'REPAIR', 'GENERAL', 'ERROR'],
            description: "textarea"
        }
    } , 

    "api-database": {
        customViewFile: "./apiDatabaseView.js" , 
        standalone: true ,
    } , 

    "form-submissions": {
        standalone: true,
        customViewFile: "./formSubmissionsView.js",
    }
};

// Global App State Core
export let currentModule = "employees";
export let activePrinterId = null;
export let masterData = [];     
export let filteredData = [];   
export let currentPage = 1;
export let pageSize = 50;
let editId = null;

export let visibleFields = [];  
export let fieldWidths = {}; 

// Refresh Button Listener Hook
document.getElementById("refreshButton").addEventListener("click", () => {
    console.log(`Refresh button clicked. Reloading module: ${currentModule}`);
    loadModule(currentModule, true, activePrinterId);
});

// Setup Application Hooks
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("bg-slate-800"));
            btn.classList.add("bg-slate-800");
            activePrinterId = null; // Clean out functional query constraints on core jumps
            loadModule(btn.dataset.module);
        });
    });

    document.getElementById("newBtn").addEventListener("click", openCreateForm);
    document.getElementById("searchBox").addEventListener("input", (e) => filterTable(e.target.value));
    document.getElementById("pageSizeSelector").addEventListener("change", (e) => {
        pageSize = parseInt(e.target.value);
        currentPage = 1;
        renderRouter();
    });
    
    document.getElementById("columnDropdownBtn").addEventListener("click", toggleColumnDropdown);
    document.body.addEventListener("click", closeColumnDropdown);
    document.getElementById("closeDrawerBtn").addEventListener("click", closeDrawer);

    loadModule("employees");
});

// Toast Engine UI Notification Service
export function showToast(message, type = 'success') {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = `p-4 rounded-xl shadow-lg border text-sm transition-all duration-300 opacity-0 transform translate-y-2 pointer-events-auto flex items-center gap-2 min-w-[280px] max-w-sm `;
    if (type === 'success') {
        toast.className += "bg-emerald-50 border-emerald-200 text-emerald-800";
        toast.innerHTML = `✅ <span>${message}</span>`;
    } else {
        toast.className += "bg-rose-50 border-rose-200 text-rose-800";
        toast.innerHTML = `❌ <span>${message}</span>`;
    }
    container.appendChild(toast);
    setTimeout(() => toast.classList.remove("opacity-0", "translate-y-2"), 10);
    setTimeout(() => {
        toast.classList.add("opacity-0", "translate-y-2");
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function initializeStorageConfiguration(module) {
    const config = CONFIG[module];
    
    // Add this guard clause to prevent errors on standalone modules
    if (!config.fields) return;

    const cachedVis = localStorage.getItem(`visibility_${module}`);
    visibleFields = cachedVis ? JSON.parse(cachedVis) : [...config.fields];
    
    const cachedWidths = localStorage.getItem(`widths_${module}`);
    if (cachedWidths) {
        fieldWidths = JSON.parse(cachedWidths);
    } else {
        fieldWidths = {};
        config.fields.forEach(field => {
            fieldWidths[field] = (field === "email" || field === "bitlocker_key") ? 220 : 150;
        });
    }
}


function saveStorageConfiguration(module) {
    localStorage.setItem(`visibility_${module}`, JSON.stringify(visibleFields));
    localStorage.setItem(`widths_${module}`, JSON.stringify(fieldWidths));
}

function toggleColumnDropdown(e) {
    e.stopPropagation();
    document.getElementById("columnDropdown").classList.toggle("hidden");
}

function closeColumnDropdown(e) {
    const container = document.getElementById("columnSelectorContainer");
    if (container && !container.contains(e.target)) {
        document.getElementById("columnDropdown").classList.add("hidden");
    }
}

function renderColumnSelector() {
    const dropdown = document.getElementById("columnDropdown");
    dropdown.innerHTML = ""; 
    const config = CONFIG[currentModule];
    
    const headerTitle = document.createElement("div");
    headerTitle.className = "text-xs font-bold uppercase text-slate-400 mb-1";
    headerTitle.innerText = "Column Display Settings";
    dropdown.appendChild(headerTitle);
    
    config.fields.forEach(field => {
        const isChecked = visibleFields.includes(field) ? "checked" : "";
        const currentWidth = fieldWidths[field] || 150;
        const itemWrapper = document.createElement("div");
        itemWrapper.className = "p-2 border border-slate-100 rounded-lg bg-slate-50 space-y-1";
        itemWrapper.innerHTML = `
            <label class="flex items-center justify-between cursor-pointer text-sm font-medium text-slate-700">
            <div class="flex items-center gap-2">
                <input type="checkbox" data-field="${field}" ${isChecked} class="col-toggle-chk rounded text-blue-600 focus:ring-blue-500">
                <span class="truncate max-w-[140px] text-xs">${field.replaceAll("_", " ").toUpperCase()}</span>
            </div>
            <span class="text-[10px] text-slate-400 font-mono width-lbl">${currentWidth}px</span>
            </label>
            <div class="flex items-center gap-2">
            <input type="range" min="80" max="400" step="10" value="${currentWidth}" data-field="${field}" class="width-slider w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600">
            </div>`;
        
        itemWrapper.querySelector(".col-toggle-chk").addEventListener("change", (el) => {
            const f = el.target.dataset.field;
            visibleFields = el.target.checked ? [...visibleFields, f] : visibleFields.filter(x => x !== f);
            saveStorageConfiguration(currentModule);
            renderRouter();
        });

        itemWrapper.querySelector(".width-slider").addEventListener("input", (el) => {
            const f = el.target.dataset.field;
            const targetVal = parseInt(el.target.value);
            fieldWidths[f] = targetVal;
            itemWrapper.querySelector(".width-lbl").innerText = `${targetVal}px`;
            saveStorageConfiguration(currentModule);
            renderRouter();
        });
        
        dropdown.appendChild(itemWrapper);
    });
}

export async function loadModule(module, forceRefresh = false, dynamicParam = null) {
    currentModule = module;
    currentPage = 1;

    if (module === "printer-logs" && dynamicParam) {
        activePrinterId = dynamicParam;
    }

    const targetConfig = CONFIG[module];

    // Manage UI visibility wrappers for standard vs custom/standalone modules
    if (targetConfig.standalone) {
        document.getElementById("standardHeader").classList.add("hidden");
        document.getElementById("tableViewWrapper").classList.add("hidden");
        document.getElementById("printerViewWrapper").classList.add("hidden");
        
        // Ensure a target container for your custom view is visible and empty
        let standaloneContainer = document.getElementById("standaloneViewWrapper");
        if (!standaloneContainer) {
            standaloneContainer = document.createElement("div");
            standaloneContainer.id = "standaloneViewWrapper";
            standaloneContainer.className = "p-6";
            // Append it next to your other wrappers in the DOM
            document.getElementById("tableViewWrapper").parentNode.appendChild(standaloneContainer);
        }
        standaloneContainer.classList.remove("hidden");
        standaloneContainer.innerHTML = `<div class="text-slate-400">Loading module...</div>`;
    } else {
        // Hide standalone container if we are switching away from it
        const standaloneContainer = document.getElementById("standaloneViewWrapper");
        if (standaloneContainer) standaloneContainer.classList.add("hidden");

        if (module === "printers") {
            document.getElementById("standardHeader").classList.add("hidden");
            document.getElementById("tableViewWrapper").classList.add("hidden");
            document.getElementById("printerViewWrapper").classList.remove("hidden");
            if (forceRefresh) localStorage.removeItem("printers_data");
        } else {
            document.getElementById("standardHeader").classList.remove("hidden");
            document.getElementById("tableViewWrapper").classList.remove("hidden");
            document.getElementById("printerViewWrapper").classList.add("hidden");
            document.getElementById("newBtn").style.display = (module === "user-resources") ? "none" : "block";
        }
    }

    // Initialize storage configuration
    initializeStorageConfiguration(module);
    
    if (module === "printer-logs" && activePrinterId) {
        document.getElementById("pageTitle").innerText = `PRINTER LOGS (PRINTER ID: ${activePrinterId})`;
    } else {
        document.getElementById("pageTitle").innerText = module.replaceAll("-", " ").toUpperCase();
    }

    // For standalone modules, skip standard data fetching and render immediately
    if (targetConfig.standalone) {
        renderRouter();
        return;
    }                                                    

    try {
        if(targetConfig.endpoint || targetConfig.create || targetConfig.update) {
            const resolvedParam = dynamicParam || (module === "printer-logs" ? activePrinterId : null);
            const targetUrl = typeof targetConfig.endpoint === "function" 
                ? targetConfig.endpoint(resolvedParam) 
                : targetConfig.endpoint;

            const response = await fetch(targetUrl);
            if (!response.ok) throw new Error("Network query verification failure");
            masterData = await response.json();
            filteredData = [...masterData];
        }
        renderRouter();
    } catch(err) {
        console.error(err);
        document.getElementById("tableBody").innerHTML = `<tr><td colspan="100" class="p-8 text-center text-red-500">Failed to render data module system data.</td></tr>`;
    }
}


export function navigateToModuleWithParam(moduleName, paramValue) {
    document.querySelectorAll(".nav-btn").forEach(b => {
        b.classList.remove("bg-slate-800");
        if (b.dataset.module === moduleName) {
            b.classList.add("bg-slate-800");
        }
    });
    loadModule(moduleName, false, paramValue);
}

async function renderRouter() {
    const config = CONFIG[currentModule];
    
    // Column selector is irrelevant for standalone non-tabular layouts
    if (!config.standalone) {
        renderColumnSelector();
    }

    if (config.customViewFile) {
        try {
            const moduleScript = await import(config.customViewFile);
            if (moduleScript && typeof moduleScript.render === "function") {
                if (config.standalone) {
                    const standaloneContainer = document.getElementById("standaloneViewWrapper");
                    standaloneContainer.innerHTML = ""; // Clear loader text
                    // Pass the container along so the view script knows where to render itself
                    moduleScript.render(standaloneContainer, filteredData, currentPage, pageSize);
                } else {
                    moduleScript.render(filteredData, currentPage, pageSize);
                }
                return; 
            }
        } catch (e) {
            console.warn("Failed to apply modular standalone customized file module, running default fallback layout engine.", e);
        }
    }
    
    renderDefaultTable();
}

function renderDefaultTable() {
    const config = CONFIG[currentModule];
    document.getElementById("recordCount").innerText = `(${filteredData.length})`;
    let hasDelete = config.delete || false;

    const totalRecords = filteredData.length;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalRecords);
    const pageData = filteredData.slice(startIndex, endIndex);

    let head = `<tr><th class="p-2 text-left bg-slate-200" style="width: 60px;">#</th>`;
    visibleFields.forEach(field => {
        const w = fieldWidths[field] || 150;
        head += `<th class="p-2 text-left text-xs bg-slate-200 font-bold truncate" style="width: ${w}px;">${field.replaceAll("_", " ").toUpperCase()}</th>`;
    });
    head += `<th class="p-3 text-center bg-slate-200" style="width: 140px;">Actions</th></tr>`;
    document.getElementById("tableHead").innerHTML = head;

    let body = "";
    if (pageData.length === 0) {
        body = `<tr><td colspan="100" class="p-8 text-center text-slate-400">No matching records found</td></tr>`;
    } else {
        pageData.forEach((row, index) => {
            body += "<tr class='border-t hover:bg-slate-50 align-top'>";
            body += `<td class="p-2 font-medium text-xs">${startIndex + index + 1}</td>`;

            visibleFields.forEach(field => {
                const fieldValue = row[field];
                
                if (Array.isArray(fieldValue)) {
                    // option to add an item it it have an add endpoint
                    
                    if (fieldValue.length === 0) {
                        body += `<td class="p-2 text-slate-400 italic text-[11px] truncate">None Assigned</td>`;
                    } else {
                        let cellMarkup = `<td class="p-2 space-y-2 overflow-hidden">`;
                        
                        // Check if field has advanced configuration details (like displayField)
                        const fieldConfig = config.fieldTypes?.[field];
                        const displayField = typeof fieldConfig === 'object' ? fieldConfig.displayField : null;

                        if (displayField) {
                            // Extract just the target key (e.g., "path" from forms)
                            fieldValue.forEach(item => {
                                const val = item[displayField] || '';
                                const fileName = val.split('\\').pop().split('/').pop(); // Grab filename from path
                                
                                cellMarkup += `
                                    <div class="bg-blue-50 hover:bg-blue-100 p-1.5 rounded border border-blue-200 text-[11px] transition">
                                        <a href="/${val.replace(/\\/g, '/')}" target="_blank" class="font-bold text-blue-700 block truncate" title="${val}">
                                            📄 ${fileName || 'View Document'}
                                        </a>
                                    </div>`;
                            });
                        } else {
                            // Default rendering fallback for objects (e.g., computers/monitors)
                            fieldValue.forEach(item => {
                                cellMarkup += `
                                    <div class="bg-slate-100 p-1.5 rounded border border-slate-200 text-[11px]">
                                        <span class="font-bold text-slate-700 block truncate">${item.brand || 'Unknown'} ${item.model || ''}</span>
                                        <div class="text-[10px] text-slate-500 truncate">S/N: ${item.serial_number || 'N/A'}</div>
                                    </div>`;
                            });
                        }
                        body += cellMarkup + `</td>`;
                    }
                } else {
                    body += `<td class="p-2 text-xs truncate" title="${fieldValue ?? ''}">${fieldValue ?? ""}</td>`;
                }
            });

            const rowId = row[config.idField];
            body += `
                <td class="p-2">
                    <div class="flex items-center justify-center gap-1.5">
                        <button data-id="${rowId}" class="edit-action-btn bg-amber-500 text-white px-2 py-1 rounded text-xs hover:bg-amber-600 transition">Edit</button>
                        ${hasDelete ? `<button data-id="${rowId}" class="delete-action-btn bg-rose-500 text-white px-2 py-1 rounded text-xs hover:bg-rose-600 transition">Delete</button>` : ''}
                    </div>
                </td></tr>`;
        });
    }
    document.getElementById("tableBody").innerHTML = body;
    
    document.querySelectorAll(".edit-action-btn").forEach(b => {
        b.addEventListener("click", (e) => editRecord(e.target.dataset.id));
    });

    document.querySelectorAll(".delete-action-btn").forEach(b => {
        b.addEventListener("click", (e) => deleteRecord(e.target.dataset.id));
    });

    updatePaginationFooter(totalRecords, startIndex, endIndex, totalPages);
}

export function updatePaginationFooter(totalRecords, startIndex, endIndex, totalPages) {
    document.getElementById("paginationInfo").innerText = totalRecords > 0 
        ? `Showing ${startIndex + 1} to ${endIndex} of ${totalRecords} entries` 
        : `Showing 0 to 0 of 0 entries`;

    let btnHtml = `
        <button id="p-first" ${currentPage === 1 ? 'disabled' : ''} class="px-3 py-1 border rounded bg-white text-sm disabled:opacity-50 hover:bg-slate-100">«</button>
        <button id="p-prev" ${currentPage === 1 ? 'disabled' : ''} class="px-3 py-1 border rounded bg-white text-sm disabled:opacity-50 hover:bg-slate-100">‹</button>
    `;
    
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

    for (let p = startPage; p <= endPage; p++) {
        btnHtml += `<button data-page="${p}" class="page-num-btn px-3 py-1 border rounded text-sm ${currentPage === p ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-slate-100'}">${p}</button>`;
    }

    btnHtml += `
        <button id="p-next" ${currentPage === totalPages ? 'disabled' : ''} class="px-3 py-1 border rounded bg-white text-sm disabled:opacity-50 hover:bg-slate-100">›</button>
        <button id="p-high" ${currentPage === totalPages ? 'disabled' : ''} class="px-3 py-1 border rounded bg-white text-sm disabled:opacity-50 hover:bg-slate-100">»</button>
    `;
    document.getElementById("paginationButtons").innerHTML = btnHtml;

    document.getElementById("p-first").onclick = () => changePage(1);
    document.getElementById("p-prev").onclick = () => changePage(currentPage - 1);
    document.getElementById("p-next").onclick = () => changePage(currentPage + 1);
    document.getElementById("p-high").onclick = () => changePage(totalPages);
    document.querySelectorAll(".page-num-btn").forEach(b => {
        b.onclick = (e) => changePage(parseInt(e.target.dataset.page));
    });
}

function changePage(targetPage) {
    currentPage = targetPage;
    renderRouter();
}

export function filterTable(search){
    const config = CONFIG[currentModule];
    currentPage = 1;
    filteredData = masterData.filter(row => {
        return config.fields.some(field => {
            if (Array.isArray(row[field])) {
                return row[field].some(subItem => Object.values(subItem).some(val => String(val ?? "").toLowerCase().includes(search.toLowerCase())));
            }
            return String(row[field] ?? "").toLowerCase().includes(search.toLowerCase());
        });
    });
    renderRouter();
}

/* ==================== FORM BUILDER ENGINE (TYPES: DATE, ENUM/BOOLEAN, NUMBER, TEXT) ==================== */
function generateFormFieldHTML(field, value = "", config) {
    const types = config.fieldTypes || {};
    const fieldType = types[field];
    const labelText = field.replaceAll('_', ' ').toUpperCase();
    
    // Normalize existing value string representations for UI controls
    const normalizedValue = value !== null && value !== undefined ? String(value) : "";
    let inputHTML = "";

    // 1. Array checks cover Select Dropdowns, Custom Enum configurations, and explicit Boolean structures
    if (Array.isArray(fieldType)) {
        let options = fieldType.map(opt => {
            const optStr = String(opt);
            const selected = optStr === normalizedValue ? "selected" : "";
            return `<option value="${optStr}" ${selected}>${optStr.toUpperCase()}</option>`;
        }).join("");
        
        inputHTML = `<select name="${field}" class="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">${options}</select>`;
    }
    // 2. Multi-line Text Block configurations
    else if (fieldType === "textarea") {
        inputHTML = `<textarea name="${field}" rows="3" class="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">${normalizedValue}</textarea>`;
    }
    // 3. Explicit Primitive Field Configurations (date, number, etc.)
    else if (fieldType) {
        // Safe standard ISO string transformation if working with mixed Date formats
        let safeValue = normalizedValue;
        if (fieldType === "date" && safeValue.includes("T")) {
            safeValue = safeValue.split("T")[0];
        }
        inputHTML = `<input type="${fieldType}" name="${field}" value="${safeValue}" class="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">`;
    }
    // 4. Default Fallbacks (Infers structural date if key name hits matching strings, otherwise falls back to basic Text)
    else {
        const inferredType = field.toLowerCase().includes("date") ? "date" : "text";
        let safeValue = normalizedValue;
        if (inferredType === "date" && safeValue.includes("T")) {
            safeValue = safeValue.split("T")[0];
        }
        inputHTML = `<input type="${inferredType}" name="${field}" value="${safeValue}" class="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">`;
    }

    return `
    <div>
        <label class="block mb-1 font-medium text-sm text-slate-700">${labelText}</label>
        ${inputHTML}
    </div>`;
}

/* ==================== FORM PROCESSORS & DRAWER HANDLERS ==================== */
export function openDrawer(title) {
    document.getElementById("drawerTitle").innerText = title;
    document.getElementById("drawer").style.right = "0";
}

export function closeDrawer() {
    document.getElementById("drawer").style.right = "-600px";
}

export function openCreateForm() {
    editId = null;
    const config = CONFIG[currentModule];
    let html = "";
    
    config.fields.forEach(field => {
        if (field === "computers" || field === "monitors" || field === config.idField) return;
        
        // Context persistence: Auto-fill printer_id inside printer-logs context
        if (currentModule === "printer-logs" && field === "printer_id" && activePrinterId) {
            html += `
            <div>
                <label class="block mb-1 font-medium text-sm text-blue-600 font-bold">PRINTER ID (AUTO-ASSIGNED)</label>
                <input name="${field}" value="${activePrinterId}" readonly class="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-sm text-slate-500 font-mono focus:outline-none">
            </div>`;
        } else {
            html += generateFormFieldHTML(field, "", config);
        }
    });
    
    html += `<div class="pt-4"><button type="submit" class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition w-full">Save Record</button></div>`;
    document.getElementById("recordForm").innerHTML = html;
    document.getElementById("recordForm").onsubmit = saveRecord;
    openDrawer("Create Record");
}

export function editRecord(id) {
    const config = CONFIG[currentModule];
    const row = masterData.find(x => String(x[config.idField]) === String(id));
    editId = id;
    let html = "";
    
    config.fields.forEach(field => {
        if (field === "computers" || field === "monitors") return;
        
        if (field === config.idField) {
            html += `
            <div>
                <label class="block mb-1 font-medium text-sm text-slate-400">${field.replaceAll('_', ' ').toUpperCase()} (READ ONLY)</label>
                <input name="${field}" value="${row[field] ?? ""}" readonly class="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-sm text-slate-400 font-mono focus:outline-none">
            </div>`;
        } else {
            html += generateFormFieldHTML(field, row[field], config);
        }
    });
    
    html += `<div class="pt-4"><button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition w-full">Update Record</button></div>`;
    document.getElementById("recordForm").innerHTML = html;
    document.getElementById("recordForm").onsubmit = updateRecord;
    openDrawer("Edit Record");
}

async function saveRecord(e) {
    console.log("Initiating record save operation for module:", currentModule);
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {};
    const config = CONFIG[currentModule];

    // Helper function to read file and convert it to a Base64 Data URL
    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    try {
        // Iterate over form fields and convert any file fields to Base64
        for (const [key, value] of formData.entries()) {
            if (value instanceof File && value.size > 0) {
                payload[key] = await toBase64(value);
            } else if (value instanceof File && value.size === 0) {
                // Ignore empty file inputs
                payload[key] = null;
            } else {
                payload[key] = value;
            }
        }

        // Resolve endpoint if it's a function or a string // first check if config.has create 

        const targetUrl = typeof (config.create || config.endpoint) === "function"
            ? (config.create || config.endpoint)(activePrinterId || payload.printer_id)
            : (config.create || config.endpoint);

        console.log("Saving new record with Base64 payload to:", targetUrl, payload);

        const response = await fetch(targetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) throw new Error(`Server execution error status: ${response.status}`);
        
        showToast("Record successfully created!", "success");
        closeDrawer();
        loadModule(currentModule, false, activePrinterId);
    } catch (err) {
        showToast(`Failed to create record: ${err.message}`, "error");
    }
}

async function updateRecord(e) {
    e.preventDefault();
    const config = CONFIG[currentModule];
    const payload = Object.fromEntries(new FormData(e.target));
    
    // Fall back to config.endpoint if config.update doesn't exist
    let targetUrl = config.update || config.endpoint;
    
    // Resolve if it's a dynamic function builder
    if (typeof targetUrl === "function") {
        targetUrl = targetUrl(activePrinterId || payload.printer_id);
    }
    
    try {
        console.log("Updating record with payload to:", targetUrl, payload);
        const response = await fetch(targetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`Server returned code ${response.status}`);
        showToast("Record modifications successfully updated!", "success");
        closeDrawer();
        loadModule(currentModule, false, activePrinterId);
    } catch (err) {
        showToast(`Failed to apply updates: ${err.message}`, "error");
    }
}

async function deleteRecord(id) {
    const config = CONFIG[currentModule];
    if (!confirm(`Are you absolutely sure you want to delete this record? This action cannot be undone.`)) return;

    const targetUrl = `${config.endpoint}/${id}`;
    try {
        console.log(`Attempting to delete record ${id} from url: ${targetUrl}`);
        const response = await fetch(targetUrl, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) throw new Error(`Server execution error status: ${response.status}`);
        
        showToast("Record successfully deleted!", "success");
        loadModule(currentModule, false, activePrinterId); 
    } catch (err) {
        showToast(`Failed to delete record: ${err.message}`, "error");
    }
}

window.editRecord = editRecord;