/* ==========================================================================
   APP CONFIGURATION & SCHEMA DEFINITIONS
   ========================================================================== */

export const CONFIG = {

  employees: {
    endpoint: "/api/employees",
    about: {
      endPoint: "/api/employees/about",
    },
    idField: "employee_id",
    fields: ["employee_id", "email", "first_name", "last_name", "department", "job_title", "active"],
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
      computers: { 
        type: "array", 
        displayField: ["brand", "serial_number"],
        routeTo: {
          module: "computer-assets",
          matchField: "serial_number"
        }
      },
      monitors: { 
        type: "array", 
        displayField: ["brand", "serial_number"],
        routeTo: {
          module: "monitors",
          matchField: "serial_number"
        }
      },
      forms: {
        type: "array",
        displayField: "path",
        routeTo: {
          module: "forms",
          matchField: "form_id"
        }
      }
    }
  },

  forms: {
    endpoint: "/api/employees/forms",
    create: "/api/employees/forms/create",
    idField: "form_id",
    fields: ["form_id", "employee_id", "file_path", "email"],
    fieldTypes: {
      date_submitted: "date",
      file_path: {
        type: "file",
        api: {
          action: "open_url",
          urlField: "file_path"
        }
      },
      // --- DYNAMIC SCALABLE LOOKUP DEFINITION ---
      employee_id: {
        type: "lookup",
        searchEndpoint: "/api/employees",
        searchKeys: ["email", "first_name", "last_name", "employee_id"],
        targetField: "employee_id",
        displayFormat: (item) => `${item.first_name || ''} ${item.last_name || ''} (${item.email || ''})`.trim()
      },
      email: {
        type: "string",
        readOnly: true
      }
    },
    customViewFile: null , 
    delete : true
  },

  "computer-assets": {
    endpoint: "/api/assets",
    idField: "asset_id",
    fields: ["asset_number", "serial_number", "device_type", "brand", "model", "status", "bitlocker_key", "assigned_to", "location" , "specs","images" , "first_name" , "last_name" , "job_title"],
    fieldTypes: {
      status: ["Available", "Deployed", "In Repair", "Scrapped"],
      bitlocker_key: {
        type: "text",
        truncate: 15
      }   ,
      images : {
        type : "array" 
      }
      
    },
    customViewFile: null
  },

  "asset-assignments": {
    endpoint: "/api/assignments",
    update: "/api/assignments/update",
    idField: "assignment_id",
    fields: ["serial_number", "assignment_id", "employee_email", "date_issued", "date_returned", "notes"],
    fieldTypes: {
      date_issued: "date",
      date_returned: "date",
      notes: {
        type: "textarea"
      } , 
      employee_email: {
        type: "lookup",
        searchEndpoint: "/api/employees",
        searchKeys: ["email", "first_name", "last_name", "employee_id"],
        targetField: "email",
        displayFormat: (item) => `${item.first_name || ''} ${item.last_name || ''} (${item.email || ''})`.trim()
      },
    },
    customViewFile: null,
    delete: true
  },

  monitors: {
    endpoint: "/api/monitors",
    idField: "monitor_id",
    fields: ["asset_number", "serial_number", "brand", "model", "status" , "images"],
    fieldTypes: {
      status: ["Available", "Deployed", "In Repair"] , 
      images : {
        type : "array" , 
        displayField: "image_path",
      }
    },
    customViewFile: null
  },

  "monitor-assignments": {
    endpoint: "/api/usermonitors",
    update : "/api/usermonitors/update" ,
    idField: "id",
    fields: ["id" ,"monitor_serial_number", "employee_email", "date_issued", "date_returned"],
    fieldTypes: {
      date_issued: "date",
      date_returned: "date"
    },
    customViewFile: null
  },

  other_equipment: {
    endpoint: "/api/other-equipment",
    idField: "equipment_id",
    fields: ["equipment_id", "name", "serial_number", "description", "images"],
    fieldTypes: {
      images: {
        type: "array",
        displayField: "file_path",
        schema: {
          fields: ["file_path"],
          fieldTypes: { file_path: "file" }
        }
      }
    }
  },

  printers: {
    // endpoint: "/api/printer",
    endpoint: "/api/print/all",
    idField: "printer_id",
    update : "/api/print/upsert" ,
    fields: ["asset_tag", "printer_name", "brand", "model", "status", "IP_address", "location",  "page_count"],
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
    deleteEndPoint : "/api/printers" ,
    customViewFile: "./printerListView.js",
    idField: "printer_id",
    fields: ["printer_id", "printer_name", "brand", "model", "ip_address", "mac_address", "status", "is_color", "page_count", "location", "toner_code" , "images"],
    fieldTypes: {
      status: ["Active", "Inactive", "Retired", "standby"],
      is_color: [0, 1],
      page_count: "number" , 
      images : {
        type : "array" , 
        displayField : "image_path"
      }
    } , 
    delete : true 
  },

  "printer-logs": {
    endpoint: (printerId) => `/api/printers/logs/${printerId}`,
    idField: "id",
    fields: ["id", "printer_id", "created_at", "description", "event_type", "toner_code"],
    fieldTypes: {
      created_at: "date",
      event_type: ["TONER_REPLACEMENT", "SERVICE", "REPAIR", "GENERAL", "ERROR"],
      description: "textarea"
    }
  },

  "api-database": {
    customViewFile: "./apiDatabaseView.js",
    standalone: true
  },

  "form-submissions": {
    customViewFile: "./formSubmissionsView.js",
    standalone: true
  }
};

/* ==========================================================================
   GLOBAL STATE ENGINE
   ========================================================================== */

export let currentModule = "employees";
export let activePrinterId = null;
export let masterData = [];
export let filteredData = [];
export let currentPage = 1;
export let pageSize = 50;
export let visibleFields = [];
export let fieldWidths = {};

let editId = null;

/* ==========================================================================
   INITIALIZATION & EVENT HOOKS
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("bg-slate-800"));
      btn.classList.add("bg-slate-800");
      activePrinterId = null;
      loadModule(btn.dataset.module);
    });
  });

  document.getElementById("refreshButton")?.addEventListener("click", () => {
    loadModule(currentModule, true, activePrinterId);
  });

  document.getElementById("newBtn")?.addEventListener("click", openCreateForm);
  document.getElementById("searchBox")?.addEventListener("input", (e) => filterTable(e.target.value));
  document.getElementById("pageSizeSelector")?.addEventListener("change", (e) => {
    pageSize = parseInt(e.target.value, 10);
    currentPage = 1;
    renderRouter();
  });

  document.getElementById("columnDropdownBtn")?.addEventListener("click", toggleColumnDropdown);
  document.body.addEventListener("click", closeColumnDropdown);
  document.getElementById("closeDrawerBtn")?.addEventListener("click", closeDrawer);

  loadModule("employees");
});

/* ==========================================================================
   PERSISTENCE & STORAGE UTILITIES
   ========================================================================== */

function initializeStorageConfiguration(module) {
  const config = CONFIG[module];
  if (!config?.fields) return;

  const cachedVis = localStorage.getItem(`visibility_${module}`);
  visibleFields = cachedVis ? JSON.parse(cachedVis) : [...config.fields];

  const cachedWidths = localStorage.getItem(`widths_${module}`);
  if (cachedWidths) {
    fieldWidths = JSON.parse(cachedWidths);
  } else {
    fieldWidths = {};
    config.fields.forEach((field) => {
      fieldWidths[field] = ["email", "bitlocker_key"].includes(field) ? 220 : 150;
    });
  }
}

function saveStorageConfiguration(module) {
  localStorage.setItem(`visibility_${module}`, JSON.stringify(visibleFields));
  localStorage.setItem(`widths_${module}`, JSON.stringify(fieldWidths));
}

/* ==========================================================================
   TOAST NOTIFICATION SYSTEM
   ========================================================================== */

export function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  const isSuccess = type === "success";

  toast.className = `p-4 rounded-xl shadow-lg border text-sm transition-all duration-300 opacity-0 transform translate-y-2 pointer-events-auto flex items-center gap-2 min-w-[280px] max-w-sm ${
    isSuccess ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
  }`;

  toast.innerHTML = `${isSuccess ? "✅" : "❌"} <span>${message}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.remove("opacity-0", "translate-y-2"));

  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/* ==========================================================================
   COLUMN SELECTOR DROPDOWN ENGINE
   ========================================================================== */

function toggleColumnDropdown(e) {
  e.stopPropagation();
  document.getElementById("columnDropdown")?.classList.toggle("hidden");
}

function closeColumnDropdown(e) {
  const container = document.getElementById("columnSelectorContainer");
  if (container && !container.contains(e.target)) {
    document.getElementById("columnDropdown")?.classList.add("hidden");
  }
}

function renderColumnSelector() {
  const dropdown = document.getElementById("columnDropdown");
  if (!dropdown) return;

  dropdown.innerHTML = `
    <div class="text-xs font-bold uppercase text-slate-400 mb-2 tracking-wider">Column Display Settings</div>
  `;

  const config = CONFIG[currentModule];
  if (!config?.fields) return;

  config.fields.forEach((field) => {
    const isChecked = visibleFields.includes(field) ? "checked" : "";
    const currentWidth = fieldWidths[field] || 150;
    const itemWrapper = document.createElement("div");

    itemWrapper.className = "p-2 mb-1.5 border border-slate-100 rounded-lg bg-slate-50 space-y-1.5";
    itemWrapper.innerHTML = `
      <label class="flex items-center justify-between cursor-pointer text-sm font-medium text-slate-700">
        <div class="flex items-center gap-2">
          <input type="checkbox" data-field="${field}" ${isChecked} class="col-toggle-chk rounded text-blue-600 focus:ring-blue-500">
          <span class="truncate max-w-[140px] text-xs font-semibold">${field.replaceAll("_", " ").toUpperCase()}</span>
        </div>
        <span class="text-[10px] text-slate-400 font-mono width-lbl">${currentWidth}px</span>
      </label>
      <div class="flex items-center gap-2">
        <input type="range" min="80" max="400" step="10" value="${currentWidth}" data-field="${field}" class="width-slider w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600">
      </div>
    `;

    itemWrapper.querySelector(".col-toggle-chk").addEventListener("change", (e) => {
      const f = e.target.dataset.field;
      visibleFields = e.target.checked ? [...visibleFields, f] : visibleFields.filter((x) => x !== f);
      saveStorageConfiguration(currentModule);
      renderDefaultTable(filteredData, config);
    });

    itemWrapper.querySelector(".width-slider").addEventListener("input", (e) => {
      const f = e.target.dataset.field;
      const targetVal = parseInt(e.target.value, 10);
      fieldWidths[f] = targetVal;
      itemWrapper.querySelector(".width-lbl").innerText = `${targetVal}px`;
      saveStorageConfiguration(currentModule);
      renderDefaultTable(filteredData, config);
    });

    dropdown.appendChild(itemWrapper);
  });
}

/* ==========================================================================
   MODULE LOADER & ROUTER ENGINE
   ========================================================================== */

export async function loadModule(module, forceRefresh = false, dynamicParam = null) {
  currentModule = module;
  currentPage = 1;

  if (module === "printer-logs" && dynamicParam) {
    activePrinterId = dynamicParam;
  }

  const targetConfig = CONFIG[module];
  if (!targetConfig) return;

  if (targetConfig.standalone) {
    document.getElementById("standardHeader")?.classList.add("hidden");
    document.getElementById("tableViewWrapper")?.classList.add("hidden");
    document.getElementById("printerViewWrapper")?.classList.add("hidden");

    let standaloneContainer = document.getElementById("standaloneViewWrapper");
    if (!standaloneContainer) {
      standaloneContainer = document.createElement("div");
      standaloneContainer.id = "standaloneViewWrapper";
      standaloneContainer.className = "p-6";
      document.getElementById("tableViewWrapper")?.parentNode.appendChild(standaloneContainer);
    }
    standaloneContainer.classList.remove("hidden");
    standaloneContainer.innerHTML = `<div class="text-slate-400 font-medium">Loading module dynamic components...</div>`;
  } else {
    document.getElementById("standaloneViewWrapper")?.classList.add("hidden");

    if (module === "printers") {
      document.getElementById("standardHeader")?.classList.add("hidden");
      document.getElementById("tableViewWrapper")?.classList.add("hidden");
      document.getElementById("printerViewWrapper")?.classList.remove("hidden");
      if (forceRefresh) localStorage.removeItem("printers_data");
    } else {
      document.getElementById("standardHeader")?.classList.remove("hidden");
      document.getElementById("tableViewWrapper")?.classList.remove("hidden");
      document.getElementById("printerViewWrapper")?.classList.add("hidden");

      const newBtn = document.getElementById("newBtn");
      if (newBtn) newBtn.style.display = module === "user-resources" ? "none" : "block";
    }
  }

  initializeStorageConfiguration(module);

  const titleEl = document.getElementById("pageTitle");
  if (titleEl) {
    titleEl.innerText =
      module === "printer-logs" && activePrinterId
        ? `PRINTER LOGS (PRINTER ID: ${activePrinterId})`
        : module.replaceAll("-", " ").toUpperCase();
  }

  if (targetConfig.standalone) {
    renderRouter();
    return;
  }

  try {
    if (targetConfig.endpoint || targetConfig.create || targetConfig.update) {
      const resolvedParam = dynamicParam || (module === "printer-logs" ? activePrinterId : null);
      const targetUrl = typeof targetConfig.endpoint === "function"
        ? targetConfig.endpoint(resolvedParam)
        : targetConfig.endpoint;

      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error(`HTTP fetch error: ${response.status}`);

      masterData = await response.json();
      filteredData = [...masterData];
    }
    renderRouter();
  } catch (err) {
    console.error(`Failed to load module ${module}:`, err);
    const tableBody = document.getElementById("tableBody");
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="100" class="p-8 text-center text-rose-500 font-medium">Failed to retrieve backend dataset for this module.</td></tr>`;
    }
  }
}

export function navigateToModuleWithParam(moduleName, paramValue) {
  document.querySelectorAll(".nav-btn").forEach((b) => {
    b.classList.remove("bg-slate-800");
    if (b.dataset.module === moduleName) b.classList.add("bg-slate-800");
  });
  loadModule(moduleName, false, paramValue);
}

async function renderRouter() {
  const config = CONFIG[currentModule];
  if (!config) return;

  if (!config.standalone) renderColumnSelector();

  if (config.customViewFile) {
    try {
      const moduleScript = await import(config.customViewFile);
      if (moduleScript?.render) {
        if (config.standalone) {
          const container = document.getElementById("standaloneViewWrapper");
          container.innerHTML = "";
          moduleScript.render(container, filteredData, currentPage, pageSize);
        } else {
          moduleScript.render(filteredData, currentPage, pageSize);
        }
        return;
      }
    } catch (e) {
      console.warn(`Fallback active: custom module engine '${config.customViewFile}' failed to mount.`, e);
    }
  }

  renderDefaultTable(filteredData, config);
}

export function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    if (typeof showToast === "function") {
      showToast("Copied to clipboard!", "success");
    } else {
      console.log("Copied:", text);
    }
  }).catch(err => {
    console.error("Failed to copy text: ", err);
  });
}
window.copyToClipboard = copyToClipboard;

/**
 * Dynamic Default Table Rendering Engine
 */
export function renderDefaultTable(data = [], config = {}) {
  const tableBody = document.getElementById("tableBody");
  if (!tableBody) return;

  if (!Array.isArray(data) || data.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="100" class="p-8 text-center text-slate-400 font-medium bg-white rounded-lg border border-slate-200">
          No records found.
        </td>
      </tr>
    `;
    return;
  }

  const sampleRecord = data[0];
  const allHeaders = (Array.isArray(config.fields) && config.fields.length > 0)
    ? config.fields
    : Object.keys(sampleRecord);

  // Filter headers to only display active/visible fields
  const headers = allHeaders.filter((field) => visibleFields.includes(field));

  const fieldTypes = config.fieldTypes || {};

  // Build Table Headers with Inline Width Styling
  const headerRowHTML = headers.map(header => {
    const title = header.replaceAll('_', ' ').toUpperCase();
    const widthStyle = fieldWidths[header] ? `style="width: ${fieldWidths[header]}px;"` : '';
    return `<th class="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider bg-slate-50 border-b border-slate-200" ${widthStyle}>${title}</th>`;
  }).join('') + `<th class="px-4 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider bg-slate-50 border-b border-slate-200" style="width: 100px;">Actions</th>`;

  // Build Table Data Rows matching filtered visible headers
  const dataRowsHTML = data.map((row) => {
    const primaryKey = config.idField || Object.keys(row)[0];
    const recordId = row[primaryKey];

    const cellsHTML = headers.map(header => {
      const rawValue = row[header];
      const fieldConfig = fieldTypes[header];

      let cellContent = '';

      // --- 1. DIRECT API LINK HANDLER ---
      if (typeof fieldConfig === 'object' && fieldConfig.api) {
        const urlKey = fieldConfig.api.urlField || header;
        const targetUrl = row[urlKey] || rawValue;

        if (targetUrl) {
          const fileName = String(targetUrl).split('\\').pop().split('/').pop();
          cellContent = `
            <a href="/${targetUrl}" target="_blank" class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition" title="${targetUrl}">
              <span>📄 ${fileName}</span>
              <span class="text-[10px]">↗</span>
            </a>
          `;
        } else {
          cellContent = `<span class="text-xs text-slate-400 italic">No File</span>`;
        }
      }
      // --- 2. ARRAY HANDLER (Supports routeTo navigation) ---
      else if (typeof fieldConfig === 'object' && fieldConfig.type === 'array') {
        const itemsList = Array.isArray(rawValue) ? rawValue : [];

        if (itemsList.length === 0) {
          cellContent = `<span class="text-xs text-slate-400 italic">None</span>`;
        } else if (header === 'images' || fieldConfig.fileType === 'file') {
          const displayField = fieldConfig.displayField || 'file_path';
          const maxVisible = 3;
          const visibleItems = itemsList.slice(0, maxVisible);
          const extraCount = itemsList.length - maxVisible;

          const thumbsHTML = visibleItems.map(item => {
            const relativePath = typeof item === 'object' ? item[displayField] : item;
            const fileName = String(relativePath || '').split('\\').pop().split('/').pop();
            const srcUrl = String(relativePath || '').startsWith('/') ? relativePath : `/${relativePath}`;

            return `
              <a href="${srcUrl}" target="_blank" title="${fileName}" class="inline-block relative group">
                <img src="${srcUrl}" 
                     alt="${fileName}" 
                     class="w-8 h-8 hover:w-32 hover:h-32 object-cover rounded border border-slate-200 shadow-sm hover:scale-210 hover:z-10 hover:border-blue-500 transition-all duration-150 cursor-pointer"
                     onerror="this.onerror=null; this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2232%22 height=%2232%22 fill=%22%2394a3b8%22 viewBox=%220 0 16 16%22><path d=%22M14 3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h12zM2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H2z%22/><path d=%22M10.648 8.646a.5.5 0 0 1 .577-.093l3.777 1.947V14h-12v-1l2.646-2.354a.5.5 0 0 1 .63-.062l2.66 1.773 3.71-3.71z%22/></svg>';" />
              </a>
            `;
          }).join('');

          const extraBadgeHTML = extraCount > 0 
            ? `<span class="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-1 rounded-md border border-slate-200" title="${extraCount} more">+${extraCount}</span>` 
            : '';

          cellContent = `<div class="flex items-center gap-1.5 flex-wrap">${thumbsHTML}${extraBadgeHTML}</div>`;
        } else {
          const displayConfig = fieldConfig.displayField || fieldConfig.display;
          const routeConfig = fieldConfig.routeTo || {};

          const badgesHTML = itemsList.map(item => {
            if (typeof item !== 'object' || item === null) {
              return `<span class="inline-block px-2 py-0.5 text-xs font-mono bg-slate-100 text-slate-700 border border-slate-200 rounded-md">${item}</span>`;
            }

            let displayText = "";
            if (Array.isArray(displayConfig)) {
              displayText = displayConfig.map(key => item[key]).filter(Boolean).join(" • ");
            } else if (typeof displayConfig === 'string') {
              displayText = item[displayConfig];
            } else {
              displayText = Object.values(item).find(val => typeof val !== 'object') || '-';
            }

            const matchKey = routeConfig.matchField ? item[routeConfig.matchField] : (item.serial_number || displayText);

            if (routeConfig.module) {
              return `
                <button 
                  type="button"
                  onclick="navigateAndFilter('${routeConfig.module}', '${matchKey}')"
                  title="Click to view record in ${routeConfig.module.replaceAll('-', ' ')}"
                  class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 hover:border-blue-300 transition cursor-pointer group"
                >
                  <span>${displayText || '-'}</span>
                  <span class="text-[10px] text-blue-500 group-hover:translate-x-0.5 transition-transform">↗</span>
                </button>
              `;
            }

            return `<span class="inline-block px-2 py-0.5 text-xs font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200 rounded-md">${displayText || '-'}</span>`;
          }).join('');

          cellContent = `<div class="flex items-center gap-1.5 flex-wrap">${badgesHTML}</div>`;
        }
      } 
      // --- 3. OBJECT HANDLER ---
      else if (typeof rawValue === 'object' && rawValue !== null) {
        cellContent = `<span class="text-xs text-slate-500 font-mono">${JSON.stringify(rawValue)}</span>`;
      } 
      // --- 4. SCALAR PRIMITIVES HANDLER ---
      else {
        const strValue = String(rawValue ?? '-');
        const truncateLimit = (typeof fieldConfig === 'object') ? parseInt(fieldConfig.truncate || fieldConfig.maxLen) : NaN;

        if (!isNaN(truncateLimit) && strValue.length > truncateLimit) {
          const shortText = strValue.substring(0, truncateLimit) + '...';
          cellContent = `
            <div class="inline-flex items-center gap-1.5 group" title="${strValue}">
              <span class="text-xs font-mono bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded">
                ${shortText}
              </span>
              <button type="button" onclick="copyToClipboard('${strValue}')" class="text-[10px] text-slate-400 hover:text-blue-600 transition font-sans" title="Copy full value">📋</button>
            </div>
          `;
        } else {
          cellContent = `<span class="text-sm text-slate-700">${rawValue ?? '-'}</span>`;
        }
      }

      return `<td class="px-4 py-3 align-middle">${cellContent}</td>`;
    }).join('');

    const actionsHTML = `
      <td class="px-4 py-3 text-right align-middle space-x-2">
        <button onclick="editRecord('${recordId}')" class="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline">Edit</button>
        ${config.delete ? `<button onclick="deleteRecord('${recordId}')" class="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline">Delete</button>` : ''}
      </td>
    `;

    return `<tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">${cellsHTML}${actionsHTML}</tr>`;
  }).join('');

  const tableHead = document.getElementById("tableHead");
  if (tableHead) tableHead.innerHTML = `<tr>${headerRowHTML}</tr>`;
  tableBody.innerHTML = dataRowsHTML;
}

/* ==========================================================================
   PAGINATION & SEARCH FILTER CONTROLLERS
   ========================================================================== */

export function updatePaginationFooter(totalRecords, startIndex, endIndex, totalPages) {
  const infoEl = document.getElementById("paginationInfo");
  if (infoEl) {
    infoEl.innerText = totalRecords > 0
      ? `Showing ${startIndex + 1} to ${endIndex} of ${totalRecords} entries`
      : `Showing 0 to 0 of 0 entries`;
  }

  let btnHtml = `
    <button id="p-first" ${currentPage === 1 ? "disabled" : ""} class="px-3 py-1 border rounded bg-white text-sm disabled:opacity-50 hover:bg-slate-100">«</button>
    <button id="p-prev" ${currentPage === 1 ? "disabled" : ""} class="px-3 py-1 border rounded bg-white text-sm disabled:opacity-50 hover:bg-slate-100">‹</button>
  `;

  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

  for (let p = startPage; p <= endPage; p++) {
    btnHtml += `<button data-page="${p}" class="page-num-btn px-3 py-1 border rounded text-sm ${currentPage === p ? "bg-blue-600 text-white border-blue-600" : "bg-white hover:bg-slate-100"}">${p}</button>`;
  }

  btnHtml += `
    <button id="p-next" ${currentPage === totalPages ? "disabled" : ""} class="px-3 py-1 border rounded bg-white text-sm disabled:opacity-50 hover:bg-slate-100">›</button>
    <button id="p-high" ${currentPage === totalPages ? "disabled" : ""} class="px-3 py-1 border rounded bg-white text-sm disabled:opacity-50 hover:bg-slate-100">»</button>
  `;

  const btnContainer = document.getElementById("paginationButtons");
  if (!btnContainer) return;

  btnContainer.innerHTML = btnHtml;

  document.getElementById("p-first").onclick = () => changePage(1);
  document.getElementById("p-prev").onclick = () => changePage(currentPage - 1);
  document.getElementById("p-next").onclick = () => changePage(currentPage + 1);
  document.getElementById("p-high").onclick = () => changePage(totalPages);

  document.querySelectorAll(".page-num-btn").forEach((b) => {
    b.onclick = (e) => changePage(parseInt(e.target.dataset.page, 10));
  });
}

function changePage(targetPage) {
  currentPage = targetPage;
  renderRouter();
}

export function filterTable(searchQuery) {
  const config = CONFIG[currentModule];
  const query = searchQuery.toLowerCase().trim();
  currentPage = 1;

  filteredData = masterData.filter((row) => {
    return config.fields.some((field) => {
      const value = row[field];
      if (Array.isArray(value)) {
        return value.some((subItem) =>
          Object.values(subItem || {}).some((val) => String(val ?? "").toLowerCase().includes(query))
        );
      }
      return String(value ?? "").toLowerCase().includes(query);
    });
  });

  renderRouter();
}

/* ==========================================================================
   FORM COMPONENT & FIELD BUILDERS
   ========================================================================== */

export function generateFormFieldHTML(field, value = "", config = {}, recordId = null) {
  const types = config.fieldTypes || {};
  const fieldConfig = types[field];
  const labelText = field.replaceAll("_", " ").toUpperCase();

  // --- 1. ARRAY / NESTED IMAGE FIELD ---
  if (typeof fieldConfig === "object" && fieldConfig.type === "array") {
    const existingItems = Array.isArray(value) ? value : [];
    const displayField = fieldConfig.displayField || "file_path";

    const itemsHTML = existingItems.map((val, index) => {
      const relativePath = typeof val === "object" ? val[displayField] : val;
      const fileName = String(relativePath || "").split("\\").pop().split("/").pop();
      const srcUrl = String(relativePath || "").startsWith("/") ? relativePath : `/${relativePath}`;
      const uniqueRowId = `existing-file-${field}-${index}`;

      // Escape quotes for safely passing inside inline JS
      const safeFilePath = String(relativePath).replace(/'/g, "\\'");

      return `
        <div id="${uniqueRowId}" class="nested-item-row bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between gap-3 shadow-sm">
          <div class="flex items-center gap-3 overflow-hidden">
            <a href="${srcUrl}" target="_blank" title="Click to view file">
              <img src="${srcUrl}" alt="${fileName}" class="w-12 h-12 object-cover rounded border border-slate-300 hover:opacity-80 transition cursor-pointer flex-shrink-0" onerror="this.onerror=null; this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22 fill=%22%2394a3b8%22 viewBox=%220 0 16 16%22><path d=%22M14 3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h12zM2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H2z%22/><path d=%22M10.648 8.646a.5.5 0 0 1 .577-.093l3.777 1.947V14h-12v-1l2.646-2.354a.5.5 0 0 1 .63-.062l2.66 1.773 3.71-3.71z%22/></svg>';" />
            </a>
            <div class="overflow-hidden">
              <a href="${srcUrl}" target="_blank" class="text-xs font-semibold text-slate-700 hover:text-blue-600 truncate block" title="${fileName}">${fileName}</a>
              <span class="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">Saved in DB</span>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <a href="${srcUrl}" target="_blank" class="text-xs text-blue-600 hover:underline font-medium">View ↗</a>
            ${
              recordId
                ? `<button type="button" 
                           onclick="deleteExistingFile('${currentModule}', '${field}', '${recordId}', '${safeFilePath}', '${uniqueRowId}')" 
                           class="text-xs text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 p-1.5 rounded border border-rose-200 transition" 
                           title="Delete from server">
                     🗑️
                   </button>`
                : ''
            }
          </div>
        </div>`;
    }).join("");

    return `
      <div class="col-span-full border border-slate-200 bg-slate-50 p-3 rounded-lg space-y-3">
        <div class="flex justify-between items-center border-b border-slate-200 pb-2">
          <label class="font-bold text-sm text-slate-700">${labelText}</label>
          <button type="button" onclick="addFlatFileItem('${field}')" class="bg-blue-600 text-white px-2.5 py-1 rounded-md text-xs font-medium hover:bg-blue-700 transition">+ Add New Image</button>
        </div>
        <div id="nested-container-${field}" class="space-y-2">
          ${itemsHTML.length > 0 ? itemsHTML : '<p class="text-xs text-slate-400 italic">No images attached.</p>'}
        </div>
      </div>`;
  }

  // --- 2. SEARCHABLE LOOKUP FIELD ---
  if (typeof fieldConfig === "object" && fieldConfig.type === "lookup") {
    return `
      <div class="relative lookup-container" data-field="${field}">
        <label class="block mb-1 font-medium text-sm text-slate-700">${labelText}</label>
        <div class="relative">
          <input 
            type="text" 
            id="lookup-input-${field}" 
            placeholder="Type user email or name to search..." 
            class="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            autocomplete="off"
          />
          <input type="hidden" name="${field}" id="lookup-hidden-${field}" value="${value ?? ''}" />
        </div>
        <div 
          id="lookup-results-${field}" 
          class="hidden absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        ></div>
      </div>
    `;
  }

  const fieldType = (typeof fieldConfig === "object" ? fieldConfig.type : fieldConfig) || "text";
  const isReadOnly = (typeof fieldConfig === "object" && fieldConfig.readOnly) ? "readonly" : "";

  // --- 3. TEXTAREA FIELD ---
  if (fieldType === "textarea") {
    return `
      <div>
        <label class="block mb-1 font-medium text-sm text-slate-700">${labelText}</label>
        <textarea name="${field}" class="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3" ${isReadOnly}>${value ?? ""}</textarea>
      </div>`;
  }

  // --- 4. STANDARD INPUT FIELD ---
  return `
    <div>
      <label class="block mb-1 font-medium text-sm text-slate-700">${labelText}</label>
      <input type="${fieldType}" name="${field}" value="${value ?? ""}" ${isReadOnly} class="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isReadOnly ? 'bg-slate-100 text-slate-500' : ''}">
    </div>`;
}

/**
 * Controller to bind search behaviors and auto-filling logic to lookup input fields
 */
export function setupFormLookups(config, rowData = null) {
  const lookupContainers = document.querySelectorAll(".lookup-container");

  lookupContainers.forEach((container) => {
    const fieldName = container.dataset.field;
    const fieldConfig = config.fieldTypes?.[fieldName];
    if (!fieldConfig) return;

    const searchInput = container.querySelector(`#lookup-input-${fieldName}`);
    const hiddenInput = container.querySelector(`#lookup-hidden-${fieldName}`);
    const resultsContainer = container.querySelector(`#lookup-results-${fieldName}`);

    let cache = null;

    const loadCache = async () => {
      if (!cache && fieldConfig.searchEndpoint) {
        try {
          const res = await fetch(fieldConfig.searchEndpoint);
          cache = await res.json();
        } catch (err) {
          console.error("Failed to fetch lookup data:", err);
        }
      }
      return cache;
    };

    // Pre-populate input label if editing an existing record
    if (rowData && rowData[fieldName]) {
      loadCache().then((dataset) => {
        if (!dataset) return;
        const match = dataset.find(x => String(x[fieldConfig.targetField]) === String(rowData[fieldName]));
        if (match) {
          searchInput.value = fieldConfig.displayFormat ? fieldConfig.displayFormat(match) : match[fieldConfig.targetField];
        } else {
          searchInput.value = rowData[fieldName];
        }
      });
    }

    // Load endpoint cache when user focuses input
    searchInput.addEventListener("focus", async () => {
      await loadCache();
    });

    // Handle real-time user query search
    searchInput.addEventListener("input", async (e) => {
      const query = e.target.value.toLowerCase().trim();
      const dataset = await loadCache();

      if (!query || !dataset) {
        resultsContainer.innerHTML = "";
        resultsContainer.classList.add("hidden");
        return;
      }

      const matches = dataset.filter((item) => {
        return fieldConfig.searchKeys.some((k) =>
          String(item[k] || "").toLowerCase().includes(query)
        );
      });

      if (matches.length === 0) {
        resultsContainer.innerHTML = `<div class="p-2.5 text-xs text-slate-400 font-medium">No matching records found</div>`;
      } else {
        resultsContainer.innerHTML = matches.map((item) => {
          const label = fieldConfig.displayFormat
            ? fieldConfig.displayFormat(item)
            : item[fieldConfig.targetField];

          return `
            <div 
              class="lookup-item p-2 hover:bg-blue-50 cursor-pointer text-xs border-b border-slate-100 last:border-b-0 text-slate-700 font-medium transition"
              data-id="${item[fieldConfig.targetField]}"
              data-email="${item.email || ''}"
              data-label="${label}"
            >
              ${label}
            </div>
          `;
        }).join("");
      }

      resultsContainer.classList.remove("hidden");
    });

    // Handle user selection from dropdown options
    resultsContainer.addEventListener("click", (e) => {
      const itemEl = e.target.closest(".lookup-item");
      if (!itemEl) return;

      const selectedId = itemEl.dataset.id;
      const selectedEmail = itemEl.dataset.email;
      const selectedLabel = itemEl.dataset.label;

      hiddenInput.value = selectedId;
      searchInput.value = selectedLabel;

      // Auto-fill connected read-only inputs in form (e.g. email)
      const form = container.closest("form");
      if (form) {
        const emailInput = form.querySelector('input[name="email"]');
        if (emailInput) emailInput.value = selectedEmail;
      }

      resultsContainer.classList.add("hidden");
    });

    // Dismiss results on clicking outside
    document.addEventListener("click", (e) => {
      if (!container.contains(e.target)) {
        resultsContainer.classList.add("hidden");
      }
    });
  });
}

window.addFlatFileItem = function (field) {
  const container = document.getElementById(`nested-container-${field}`);
  if (!container) return;

  container.querySelector("p")?.remove();

  const div = document.createElement("div");
  div.className = "nested-item-row bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between gap-3 shadow-sm";
  div.innerHTML = `
    <div class="flex items-center gap-3 flex-1 overflow-hidden">
      <img class="preview-thumb w-32 h-32 object-cover rounded border border-slate-200 hidden" alt="preview" />
      <input type="file" name="${field}[]" accept="image/*" class="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer">
    </div>
    <button type="button" onclick="this.closest('.nested-item-row').remove()" class="text-rose-500 hover:text-rose-700 text-xs font-bold px-1">✕</button>
  `;

  const fileInput = div.querySelector('input[type="file"]');
  const thumbImg = div.querySelector(".preview-thumb");

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file?.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        thumbImg.src = event.target.result;
        thumbImg.classList.remove("hidden");
      };
      reader.readAsDataURL(file);
    } else {
      thumbImg.classList.add("hidden");
    }
  });

  container.appendChild(div);
};

/* ==========================================================================
   DRAWER NAVIGATION & FORM SUBMISSION CONTROLLERS
   ========================================================================== */

function openDrawer(title) {
  const titleEl = document.getElementById("drawerTitle");
  if (titleEl) titleEl.innerText = title;

  const drawer = document.getElementById("drawer");
  if (drawer) drawer.style.right = "0";
}

function closeDrawer() {
  const drawer = document.getElementById("drawer");
  if (drawer) drawer.style.right = "-600px";
}

export function openCreateForm() {
  editId = null;
  const config = CONFIG[currentModule];
  let html = "";

  config.fields.forEach((field) => {
    if (["computers", "monitors", config.idField].includes(field)) return;

    if (currentModule === "printer-logs" && field === "printer_id" && activePrinterId) {
      html += `
        <div>
          <label class="block mb-1 font-bold text-sm text-blue-600">PRINTER ID (AUTO-ASSIGNED)</label>
          <input name="${field}" value="${activePrinterId}" readonly class="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-sm text-slate-500 font-mono focus:outline-none">
        </div>`;
    } else {
      html += generateFormFieldHTML(field, "", config);
    }
  });

  html += `<div class="pt-4"><button type="submit" class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition w-full">Save Record</button></div>`;

  const recordForm = document.getElementById("recordForm");
  if (recordForm) {
    recordForm.innerHTML = html;
    recordForm.onsubmit = saveRecord;
    setupFormLookups(config);
  }
  openDrawer("Create Record");
}

function editRecord(id) {
  const config = CONFIG[currentModule];
  const row = masterData.find((x) => String(x[config.idField]) === String(id));
  if (!row) return;

  editId = id;
  let html = "";

  config.fields.forEach((field) => {
    if (["computers", "monitors"].includes(field)) return;

    if (field === config.idField) {
      html += `
        <div>
          <label class="block mb-1 font-medium text-sm text-slate-400">${field.replaceAll("_", " ").toUpperCase()} (READ ONLY)</label>
          <input name="${field}" value="${row[field] ?? ""}" readonly class="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-sm text-slate-400 font-mono focus:outline-none">
        </div>`;
    } else {
      // Pass 'id' as 4th parameter
      html += generateFormFieldHTML(field, row[field], config, id);
    }
  });

  html += `<div class="pt-4"><button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition w-full">Update Record</button></div>`;

  const recordForm = document.getElementById("recordForm");
  if (recordForm) {
    recordForm.innerHTML = html;
    recordForm.onsubmit = saveRecord;
    setupFormLookups(config, row);
  }
  openDrawer("Edit Record");
} 

/* ==========================================================================
   ATOMIC CRUD ACTION HANDLERS
   ========================================================================== */

async function saveRecord(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const config = CONFIG[currentModule];
  const payload = {};

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

  for (const [key, value] of formData.entries()) {
    if (!key.endsWith("[]") && !(value instanceof File)) {
      payload[key] = value;
    }
  }

  const fileInputs = form.querySelectorAll('input[type="file"]');
  for (const input of fileInputs) {
    if (input.files?.length > 0) {
      const rawFieldName = input.name.replace("[]", "");
      if (!payload[rawFieldName]) payload[rawFieldName] = [];

      for (const file of input.files) {
        if (file.size > 0) {
          const base64String = await toBase64(file);
          payload[rawFieldName].push({
            filename: file.name,
            string: base64String
          });
        }
      }
    }
  }

  // --- Check for custom field override endpoint (e.g., updateField) ---
  let customUpdateEndpoint = null;
  if (editId && config.fieldTypes) {
    Object.keys(config.fieldTypes).forEach((fKey) => {
      if (typeof config.fieldTypes[fKey] === "object" && config.fieldTypes[fKey].updateField?.endpoint) {
        customUpdateEndpoint = config.fieldTypes[fKey].updateField.endpoint;
      }
    });
  }

  let targetUrl = editId
    ? customUpdateEndpoint || config.update || config.endpoint
    : config.create || config.endpoint;

  if (typeof targetUrl === "function") {
    targetUrl = targetUrl(activePrinterId || payload[config.idField]);
  }

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`HTTP error status: ${response.status}`);

    showToast(editId ? "Record updated successfully!" : "Record created successfully!", "success");
    closeDrawer();
    loadModule(currentModule, true, activePrinterId);
  } catch (err) {
    console.error("Failed to execute save operation:", err);
    showToast(`Failed to save record: ${err.message}`, "error");
  }
}

async function deleteRecord(id) {
  const config = CONFIG[currentModule];
  if (!confirm("Are you sure you want to permanently delete this record?")) return;

  const targetUrl =  config.deleteEndPoint ? `${config.deleteEndPoint}/${id}` :  `${config.endpoint}/${id}`;

  try {
    const response = await fetch(targetUrl, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) throw new Error(`HTTP error status: ${response.status}`);

    showToast("Record successfully deleted!", "success");
    loadModule(currentModule, false, activePrinterId);
  } catch (err) {
    showToast(`Failed to delete record: ${err.message}`, "error");
  }
}

export function navigateAndFilter(targetModule, searchKey) {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.remove("bg-slate-800");
    if (btn.dataset.module === targetModule) {
      btn.classList.add("bg-slate-800");
    }
  });

  loadModule(targetModule).then(() => {
    const searchBox = document.getElementById("searchBox");
    if (searchBox) {
      searchBox.value = searchKey;
      filterTable(searchKey);
    }
  });
}

/* ==========================================================================
   IMAGE/FILE DELETION HANDLER
   ========================================================================== */

export async function deleteExistingFile(moduleName, field, recordId, fileIdentifier, elementId) {
  if (!confirm("Are you sure you want to delete this file permanently?")) return;

  const config = CONFIG[moduleName];
  const fieldConfig = config?.fieldTypes?.[field];
  const deleteEndpoint = fieldConfig?.deleteEndpoint || `${config?.endpoint}/delete-file`;

  try {
    const response = await fetch(deleteEndpoint, {
      method: "POST", // or "DELETE" depending on your backend API contract
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        [config.idField]: recordId,
        field: field,
        filePath: fileIdentifier
      })
    });

    if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`);

    showToast("File deleted successfully!", "success");

    // Remove item UI element from drawer
    const rowEl = document.getElementById(elementId);
    if (rowEl) rowEl.remove();

    // Reload module background data to keep UI synced
    loadModule(currentModule, true, activePrinterId);

  } catch (err) {
    console.error("Failed to delete file:", err);
    showToast(`Failed to delete file: ${err.message}`, "error");
  }
}


/* ==========================================================================
   EXPORTER UTILITY (EXCEL)
   ========================================================================== */

export function exportToExcel() {
  const dataset = filteredData.length > 0 ? filteredData : masterData;

  if (!dataset || dataset.length === 0) {
    showToast("No data available to export.", "error");
    return;
  }

  const config = CONFIG[currentModule];
  const fieldsToExport = visibleFields.length > 0 ? visibleFields : (config?.fields || Object.keys(dataset[0]));

  // Clean and format rows for spreadsheet output
  const processedRows = dataset.map((row) => {
    const cleanedRow = {};

    fieldsToExport.forEach((field) => {
      const headerLabel = field.replaceAll("_", " ").toUpperCase();
      let value = row[field];

      if (Array.isArray(value)) {
        // Flatten arrays (e.g., nested objects/images/assignments) to readable comma-separated strings
        value = value
          .map((item) => (typeof item === "object" ? Object.values(item).filter(Boolean).join(" - ") : item))
          .join("; ");
      } else if (typeof value === "object" && value !== null) {
        value = JSON.stringify(value);
      }

      cleanedRow[headerLabel] = value ?? "";
    });

    return cleanedRow;
  });

  // Convert JSON to Worksheet & Workbook
  const worksheet = XLSX.utils.json_to_sheet(processedRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, currentModule);

  // Generate File Name based on active module and timestamp
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `${currentModule}_export_${dateStr}.xlsx`;

  // Trigger browser download
  XLSX.writeFile(workbook, fileName);
  showToast(`Successfully exported ${processedRows.length} records to Excel!`, "success");
}

// Bind click event listener on DOM Content Loaded
document.addEventListener("DOMContentLoaded", () => {
  // Existing bindings...
  document.getElementById("exportExcelBtn")?.addEventListener("click", exportToExcel);
});

// Bind to window for inline onclick execution
window.deleteExistingFile = deleteExistingFile;

// Global Bindings
window.navigateAndFilter = navigateAndFilter;
window.editRecord = editRecord;
window.deleteRecord = deleteRecord;
window.showAboutModal = () => console.log("Displaying Modal for module:", currentModule);