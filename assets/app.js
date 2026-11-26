/* ==========================================================================
   APP CONFIGURATION & SCHEMA DEFINITIONS
   ========================================================================== */

import {
  initializeRecordDetails,
  openAssetDetails,
  openEmployeeDetails
} from "./recordDetails.js";

export const CONFIG = {

  employees: {
    endpoint: "/api/employees",
    about: {
      endPoint: "/api/employees/about",
    },
    idField: "employee_id",
    fields: ["employee_id", "email", "first_name", "last_name", "department", "job_title", "active"],
    requiredFields: ["email", "first_name", "last_name"],
    fieldTypes: {
      active: ["true", "false"]
    },
    customViewFile: "./employeeRowTemplate.js"
  },

  "user-resources": {
    endpoint: "/api/views",
    idField: "employee_id",
    fields: ["employee_id", "department", "email", "first_name", "last_name", "computers", "monitors", "forms" , "computer_hostname"],
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
    requiredFields: ["employee_id", "file_path"],
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
    deleteEndPoint : "/api/assets" ,
    idField: "asset_id",
    fields: ["asset_number", "serial_number", "device_type", "brand", "model", "status", "bitlocker_key", "assigned_to", "location" , "description" , "hostname"  , "specs","images" , "first_name" , "last_name" , "job_title"],
    requiredFields: ["serial_number", "device_type"],
    fieldTypes: {
      status: {
        type: "select",
        options: ["Available", "Assigned", "Repair", "Retired"]
      },
      bitlocker_key: {
        type: "text",
        truncate: 15
      }   ,
      images : {
        type : "array" 
      } , 
      description : {
        type : "text" , 
        truncate : 30
      } 
      
    },
    customViewFile: null ,
    delete : true 
  },

  "asset-assignments": {
    endpoint: "/api/assignments",
    update: "/api/assignments/update",
    idField: "assignment_id",
    fields: ["serial_number", "assignment_id", "employee_email", "date_issued", "date_returned", "notes"],
    requiredFields: ["serial_number", "employee_email"],
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
    requiredFields: ["serial_number"],
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
    requiredFields: ["monitor_serial_number", "employee_email"],
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
    requiredFields: ["name"],
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
    requiredFields: ["printer_name"],
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
    requiredFields: ["toner_code"],
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
    requiredFields: ["printer_name"],
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
    requiredFields: ["event_type"],
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
  } ,

   "form001": {
    customViewFile: "./form001.js",
    standalone: true
  } ,

  "dashboard": {
    customViewFile: "./overviewDashboardView.js",
    standalone: true
  },

  "system-alerts": {
    endpoint: "/api/views/alerts",
    customViewFile: "./systemAlertsView.js",
    standalone: true
  },

};

/* ==========================================================================
   GLOBAL STATE ENGINE
   ========================================================================== */

export let currentModule = "employees";
export let activePrinterId = null;
export let masterData = [];
export let filteredData = [];
export let currentPage = 1;
export let pageSize = 100;
export let visibleFields = [];
export let fieldWidths = {};

let editId = null;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

async function updateAlertsBadge() {
  const badge = document.getElementById("systemAlertsCount");
  if (!badge) return;

  try {
    const response = await fetch("/api/views/alerts");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const alerts = await response.json();
    badge.textContent = alerts.length > 99 ? "99+" : String(alerts.length);
    badge.classList.toggle("hidden", alerts.length === 0);
  } catch (error) {
    console.error("Could not refresh system alerts count:", error);
    badge.classList.add("hidden");
  }
}

function setActiveNavigation(module) {
  document.querySelectorAll(".nav-btn").forEach(button => {
    const isActive = button.dataset.module === module;
    button.classList.toggle("bg-slate-800", isActive);
    button.classList.toggle("text-white", isActive);
    button.classList.toggle("font-semibold", isActive);
    if (isActive) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
}

/* ==========================================================================
   INITIALIZATION & EVENT HOOKS
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initializeRecordDetails();
  updateAlertsBadge();

  document.body.addEventListener("click", event => {
    const employeeButton = event.target.closest("[data-open-employee]");
    if (employeeButton) {
      openEmployeeDetails(employeeButton.dataset.openEmployee);
      return;
    }

    const assetButton = event.target.closest("[data-open-asset]");
    if (assetButton) {
      openAssetDetails(assetButton.dataset.openAsset, assetButton.dataset.serialNumber);
    }
  });

  document.addEventListener("asset-assignment-changed", async event => {
    await loadModule(currentModule, true, activePrinterId);
    updateAlertsBadge();
    openAssetDetails(event.detail.type, event.detail.serialNumber);
  });

  document.addEventListener("employee-resource-assignment-changed", async event => {
    await loadModule(currentModule, true, activePrinterId);
    updateAlertsBadge();
    openEmployeeDetails(event.detail.employeeId);
  });

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
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
  setActiveNavigation(module);

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
      if (module === "employees") updateAlertsBadge();
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
    const hasSearch = Boolean(document.getElementById("searchBox")?.value.trim());
    tableBody.innerHTML = `
      <tr>
        <td colspan="100" class="p-8 text-center bg-white rounded-lg border border-slate-200" aria-live="polite">
          <p class="font-medium text-slate-600">${hasSearch ? "No matching records found." : "No records found."}</p>
          ${hasSearch ? `<button id="clearSearchButton" type="button" class="mt-2 text-sm font-semibold text-blue-700 hover:underline">Clear search</button>` : ""}
        </td>
      </tr>
    `;
    document.getElementById("clearSearchButton")?.addEventListener("click", () => {
      const searchBox = document.getElementById("searchBox");
      if (searchBox) searchBox.value = "";
      filterTable("");
      searchBox?.focus();
    });
    return;
  }

  const sampleRecord = data[0];
  const allHeaders = (Array.isArray(config.fields) && config.fields.length > 0)
    ? config.fields
    : Object.keys(sampleRecord);

  // Filter headers to only display active/visible fields
  const headers = allHeaders.filter((field) => visibleFields.includes(field));

  const fieldTypes = config.fieldTypes || {};
  const resourceDetailConfig = {
    "computer-assets": { type: "computer", serialField: "serial_number" },
    "asset-assignments": { type: "computer", serialField: "serial_number" },
    monitors: { type: "monitor", serialField: "serial_number" },
    "monitor-assignments": { type: "monitor", serialField: "monitor_serial_number" }
  }[currentModule];

  // Build Table Headers with Inline Width Styling
  const headerRowHTML = headers.map(header => {
    const title = header.replaceAll('_', ' ').toUpperCase();
    const widthStyle = fieldWidths[header] ? `style="width: ${fieldWidths[header]}px;"` : '';
    return `<th class="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider bg-slate-50 border-b border-slate-200" ${widthStyle}>${title}</th>`;
  }).join('') + `<th class="px-4 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider bg-slate-50 border-b border-slate-200" style="width: 100px;">Actions</th>`;

   document.getElementById("recordCount").innerText = `(${data.length})`;
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

        if (resourceDetailConfig && header === resourceDetailConfig.serialField) {
          cellContent = `<button type="button" data-open-asset="${resourceDetailConfig.type}" data-serial-number="${escapeHtml(strValue)}" class="font-mono text-xs text-blue-700 hover:underline">${escapeHtml(strValue)}</button>`;
        } else if (!isNaN(truncateLimit) && strValue.length > truncateLimit) {
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

    const detailAction = currentModule === "employees"
      ? `<button type="button" data-open-employee="${recordId}" class="text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:underline">View</button>`
      : resourceDetailConfig
        ? `<button type="button" data-open-asset="${resourceDetailConfig.type}" data-serial-number="${escapeHtml(row[resourceDetailConfig.serialField] || "")}" class="text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:underline">History</button>`
        : "";

    const actionsHTML = `
      <td class="px-4 py-3 text-right align-middle space-x-2">
        ${detailAction}
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

/**
 * Enhanced Smart Search & Filtering Engine
 * Supports:
 *  - Field specific search: "status:Deployed" or "images:png"
 *  - File / Attachment checks: "images:empty", "file_path:pdf"
 *  - Empty / Blank checks: "bitlocker_key:empty", "notes:blank"
 *  - Quoted strings & OR logic
 */
export function filterTable(searchQuery) {
  const config = CONFIG[currentModule];
  const query = searchQuery.trim();
  currentPage = 1;

  if (!query) {
    filteredData = [...masterData];
    renderRouter();
    return;
  }

  // Parse query into structured tokens
  const tokens = parseSearchTokens(query);

  filteredData = masterData.filter((row) => {
    // Split tokens into OR groups
    const orGroups = splitTokensByOr(tokens);

    return orGroups.some((groupTokens) => {
      // Every token in a group must evaluate to true (AND logic)
      return groupTokens.every((token) => evaluateTokenCondition(row, token, config));
    });
  });

  renderRouter();
}

/* Helper to parse structured query string into token objects */
function parseSearchTokens(query) {
  const tokenRegex = /(?:(\w+):)?(?:"([^"]+)"|(\S+))/g;
  const tokens = [];
  let match;

  while ((match = tokenRegex.exec(query)) !== null) {
    const rawKey = match[1]?.toLowerCase();
    const value = match[2] ?? match[3];

    if (value.toUpperCase() === "OR") {
      tokens.push({ type: "OPERATOR", value: "OR" });
    } else {
      tokens.push({
        type: "CONDITION",
        field: rawKey || null,
        value: value
      });
    }
  }
  return tokens;
}

/* Helper to group tokens separated by OR operators */
function splitTokensByOr(tokens) {
  const groups = [[]];
  tokens.forEach((token) => {
    if (token.type === "OPERATOR" && token.value === "OR") {
      groups.push([]);
    } else {
      groups[groups.length - 1].push(token);
    }
  });
  return groups.filter((g) => g.length > 0);
}

/* Helper to evaluate a token condition against a row record */
function evaluateTokenCondition(row, token, config) {
  const { field, value } = token;
  const lowerVal = value.toLowerCase();
  const isEmptyCheck = ["empty", "null", "blank", "none"].includes(lowerVal);

  // --- Case 1: Field-specific search (e.g. "images:empty", "file_path:pdf") ---
  if (field) {
    const actualField = config.fields.find(
      (f) => f.toLowerCase() === field || f.replaceAll("_", "").toLowerCase() === field
    );

    if (!actualField) return false;

    const rowVal = row[actualField];

    if (isEmptyCheck) {
      return isFieldValueEmpty(rowVal);
    }

    return checkValueMatch(rowVal, lowerVal);
  }

  // --- Case 2: Global search across all active fields ---
  if (isEmptyCheck) {
    return config.fields.some((f) => isFieldValueEmpty(row[f]));
  }

  return config.fields.some((f) => checkValueMatch(row[f], lowerVal));
}

/* Checks whether a given field value or file list is empty/blank */
function isFieldValueEmpty(val) {
  if (val === null || val === undefined) return true;
  if (typeof val === "string" && val.trim() === "") return true;
  if (Array.isArray(val)) {
    if (val.length === 0) return true;
    // Check if array contains empty items or null paths
    return val.every((item) => {
      if (typeof item === "object" && item !== null) {
        return Object.values(item).every((v) => v === null || v === undefined || String(v).trim() === "");
      }
      return item === null || item === undefined || String(item).trim() === "";
    });
  }
  if (typeof val === "object" && Object.keys(val).length === 0) return true;
  return false;
}

/* Deep search utility that traverses primitive values, arrays, and file objects */
function checkValueMatch(rowVal, queryVal) {
  if (rowVal === null || rowVal === undefined) return false;

  // Handles File Arrays / Image Objects (e.g., [{ file_path: "/uploads/img.jpg" }])
  if (Array.isArray(rowVal)) {
    return rowVal.some((item) => {
      if (typeof item === "object" && item !== null) {
        return Object.values(item).some((val) => checkValueMatch(val, queryVal));
      }
      return String(item).toLowerCase().includes(queryVal);
    });
  }

  // Handles Nested Objects / File Spec maps
  if (typeof rowVal === "object") {
    return Object.values(rowVal).some((val) => checkValueMatch(val, queryVal));
  }

  // Primitive strings, numbers, file paths
  return String(rowVal).toLowerCase().includes(queryVal);
}

/* ==========================================================================
   FORM COMPONENT & FIELD BUILDERS
   ========================================================================== */

export function generateFormFieldHTML(field, value = "", config = {}, recordId = null) {
  const types = config.fieldTypes || {};
  const fieldConfig = types[field];
  const labelText = escapeHtml(field.replaceAll("_", " ").toUpperCase());
  const required = config.requiredFields?.includes(field) || fieldConfig?.required === true;
  const requiredMark = required ? `<span class="ml-1 text-rose-600" aria-hidden="true">*</span><span class="sr-only"> required</span>` : "";
  const helpText = fieldConfig?.helpText
    ? `<p id="help-${escapeHtml(field)}" class="mt-1 text-xs text-slate-500">${escapeHtml(fieldConfig.helpText)}</p>`
    : "";
  const fieldId = `field-${currentModule}-${field}`;

  // --- 1. SELECT DROPDOWN HANDLER ---
  const isSelectType = typeof fieldConfig === "object" && fieldConfig?.type === "select";
  const selectOptions = isSelectType ? fieldConfig.options : (Array.isArray(fieldConfig) ? fieldConfig : null);

  if (selectOptions) {
    const optionsHTML = selectOptions.map((opt) => {
      const isSelected = String(value) === String(opt) ? "selected" : "";
      return `<option value="${escapeHtml(opt)}" ${isSelected}>${escapeHtml(opt)}</option>`;
    }).join("");

    return `
      <div>
        <label for="${fieldId}" class="block mb-1 font-medium text-sm text-slate-700">${labelText}${requiredMark}</label>
        <select id="${fieldId}" name="${field}" ${required ? "required" : ""} ${fieldConfig?.helpText ? `aria-describedby="help-${escapeHtml(field)}"` : ""} class="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">-- Select ${labelText} --</option>
          ${optionsHTML}
        </select>
        ${helpText}
      </div>
    `;
  }

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
        <label for="lookup-input-${field}" class="block mb-1 font-medium text-sm text-slate-700">${labelText}${requiredMark}</label>
        <div class="relative">
          <input 
            type="text" 
            id="lookup-input-${field}" 
            value="${escapeHtml(value)}"
            placeholder="${escapeHtml(fieldConfig.placeholder || "Type to search and select a result…")}"
            ${required ? "required" : ""}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="false"
            aria-controls="lookup-results-${field}"
            aria-describedby="lookup-help-${field}"
            class="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            autocomplete="off"
          />
          <input type="hidden" name="${field}" id="lookup-hidden-${field}" value="${escapeHtml(value)}" />
        </div>
        <p id="lookup-help-${field}" class="mt-1 text-xs text-slate-500">${escapeHtml(fieldConfig.helpText || "Choose an item from the suggestions to confirm your selection.")}</p>
        <div 
          id="lookup-results-${field}" 
          role="listbox"
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
        <label for="${fieldId}" class="block mb-1 font-medium text-sm text-slate-700">${labelText}${requiredMark}</label>
        <textarea id="${fieldId}" name="${field}" ${required ? "required" : ""} ${fieldConfig?.helpText ? `aria-describedby="help-${escapeHtml(field)}"` : ""} class="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3" ${isReadOnly}>${escapeHtml(value)}</textarea>
        ${helpText}
      </div>`;
  }

  // --- 4. STANDARD INPUT FIELD ---
  const isFileInput = fieldType === "file";
  const requiredAttribute = required && (!isFileInput || !recordId) ? "required" : "";
  const fileLink = isFileInput && value
    ? `<p class="mb-1 text-xs text-slate-500">Current file: <a class="text-blue-700 underline" href="/${encodeURI(String(value))}" target="_blank" rel="noopener">View existing file</a></p>`
    : "";
  return `
    <div>
      <label for="${fieldId}" class="block mb-1 font-medium text-sm text-slate-700">${labelText}${requiredMark}</label>
      ${fileLink}
      <input id="${fieldId}" type="${escapeHtml(fieldType)}" name="${field}" ${isFileInput ? "" : `value="${escapeHtml(value)}"`} ${requiredAttribute} ${fieldConfig?.helpText ? `aria-describedby="help-${escapeHtml(field)}"` : ""} ${isReadOnly} class="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isReadOnly ? 'bg-slate-100 text-slate-500' : ''}">
      ${helpText}
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
    let cacheError = null;

    const loadCache = async () => {
      if (!cache && fieldConfig.searchEndpoint) {
        try {
          const res = await fetch(fieldConfig.searchEndpoint);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          cache = await res.json();
        } catch (err) {
          cacheError = err.message;
          console.error(`Failed to load choices for ${fieldName}:`, err);
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
        searchInput.setCustomValidity("");
      });
    }

    // Load endpoint cache when user focuses input
    searchInput.addEventListener("focus", async () => {
      await loadCache();
    });

    // Handle real-time user query search
    searchInput.addEventListener("input", async (e) => {
      const query = e.target.value.toLowerCase().trim();
      hiddenInput.value = "";
      searchInput.setCustomValidity(query ? "Select a matching result from the list." : "");
      searchInput.setAttribute("aria-invalid", query ? "true" : "false");
      const dataset = await loadCache();

      if (!query) {
        resultsContainer.innerHTML = "";
        resultsContainer.classList.add("hidden");
        searchInput.setAttribute("aria-expanded", "false");
        return;
      }

      if (!dataset) {
        resultsContainer.innerHTML = `<div class="p-2.5 text-xs text-rose-700">Could not load choices. ${escapeHtml(cacheError || "Please try again.")}</div>`;
        resultsContainer.classList.remove("hidden");
        searchInput.setAttribute("aria-expanded", "true");
        return;
      }

      const matches = dataset.filter((item) => {
        return fieldConfig.searchKeys.some((k) =>
          String(item[k] || "").toLowerCase().includes(query)
        );
      });

      if (matches.length === 0) {
        resultsContainer.innerHTML = `<div class="p-2.5 text-xs text-slate-600 font-medium">No matching records. Check the spelling or search by email.</div>`;
      } else {
        resultsContainer.innerHTML = matches.map((item) => {
          const label = fieldConfig.displayFormat
            ? fieldConfig.displayFormat(item)
            : item[fieldConfig.targetField];

          return `
            <div 
              class="lookup-item p-2 hover:bg-blue-50 focus:bg-blue-50 cursor-pointer text-xs border-b border-slate-100 last:border-b-0 text-slate-700 font-medium transition"
              role="option"
              tabindex="0"
              data-id="${escapeHtml(item[fieldConfig.targetField])}"
              data-email="${escapeHtml(item.email || '')}"
              data-label="${escapeHtml(label)}"
            >
              ${escapeHtml(label)}
            </div>
          `;
        }).join("");
      }

      resultsContainer.classList.remove("hidden");
      searchInput.setAttribute("aria-expanded", "true");
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
      searchInput.setCustomValidity("");
      searchInput.setAttribute("aria-invalid", "false");
      searchInput.setAttribute("aria-expanded", "false");

      // Auto-fill connected read-only inputs in form (e.g. email)
      const form = container.closest("form");
      if (form) {
        const emailInput = form.querySelector('input[name="email"]');
        if (emailInput) emailInput.value = selectedEmail;
      }

      resultsContainer.classList.add("hidden");
    });

    resultsContainer.addEventListener("keydown", event => {
      if ((event.key === "Enter" || event.key === " ") && event.target.closest(".lookup-item")) {
        event.preventDefault();
        event.target.closest(".lookup-item").click();
      } else if (event.key === "Escape") {
        resultsContainer.classList.add("hidden");
        searchInput.setAttribute("aria-expanded", "false");
        searchInput.focus();
      }
    });

    // Dismiss results on clicking outside
    document.addEventListener("click", (e) => {
      if (!container.contains(e.target)) {
        resultsContainer.classList.add("hidden");
        searchInput.setAttribute("aria-expanded", "false");
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
  if (form.dataset.submitting === "true") return;
  form.dataset.submitting = "true";
  form.setAttribute("aria-busy", "true");
  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton?.textContent || "Save";
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Saving...";
  }

  const moduleName = currentModule;
  const recordId = editId;
  try {
    const config = CONFIG[moduleName];
    if (!config) throw new Error("This form is no longer connected to an active module.");
    const formData = new FormData(form);
    const payload = {};

    const toBase64 = file => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error(`Could not read file "${file.name}".`));
    });

    for (const [key, value] of formData.entries()) {
      if (!key.endsWith("[]") && !(value instanceof File)) {
        payload[key] = value;
      }
    }

    for (const input of form.querySelectorAll('input[type="file"]')) {
      if (input.files?.length > 0) {
        const rawFieldName = input.name.replace("[]", "");
        if (!payload[rawFieldName]) payload[rawFieldName] = [];
        for (const file of input.files) {
          if (file.size > 0) {
            payload[rawFieldName].push({
              filename: file.name,
              string: await toBase64(file)
            });
          }
        }
      }
    }

    let customUpdateEndpoint = null;
    if (recordId && config.fieldTypes) {
      for (const fieldConfig of Object.values(config.fieldTypes)) {
        if (typeof fieldConfig === "object" && fieldConfig.updateField?.endpoint) {
          customUpdateEndpoint = fieldConfig.updateField.endpoint;
          break;
        }
      }
    }

    let targetUrl = recordId
      ? customUpdateEndpoint || config.update || config.endpoint
      : config.create || config.endpoint;
    if (typeof targetUrl === "function") {
      targetUrl = targetUrl(activePrinterId || payload[config.idField]);
    }
    if (!targetUrl) throw new Error("No save endpoint is configured for this form.");

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let responseData = null;
    if (responseText) {
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = null;
      }
    }
    if (!response.ok) {
      throw new Error(responseData?.error || responseData?.message || responseText || `HTTP ${response.status}`);
    }

    showToast(recordId ? "Record updated successfully!" : "Record created successfully!", "success");
    closeDrawer();
    if (currentModule === moduleName) {
      await loadModule(moduleName, true, activePrinterId);
    }
  } catch (err) {
    console.error("Failed to execute save operation:", err);
    showToast(`Failed to save record: ${err.message}`, "error");
  } finally {
    form.dataset.submitting = "false";
    form.removeAttribute("aria-busy");
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  }
}

async function deleteRecord(id) {
  const moduleName = currentModule;
  const config = CONFIG[moduleName];
  const row = masterData.find(item => String(item[config.idField]) === String(id));
  const recordLabel = row
    ? [
        [row.first_name, row.last_name].filter(Boolean).join(" "),
        row.email,
        row.serial_number,
        row.asset_number,
        row.name,
        row.printer_name
      ].find(Boolean)
    : null;
  const description = recordLabel || `${moduleName.replaceAll("-", " ")} record ${id}`;
  if (!confirm(`Permanently delete "${description}"? This action cannot be undone.`)) return;

  const targetUrl = config.deleteEndPoint
    ? `${config.deleteEndPoint}/${encodeURIComponent(id)}`
    : `${config.endpoint}/${encodeURIComponent(id)}`;

  try {
    const response = await fetch(targetUrl, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(responseText || `HTTP ${response.status}`);
    }

    showToast("Record successfully deleted!", "success");
    if (currentModule === moduleName) {
      await loadModule(moduleName, false, activePrinterId);
    }
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
  const fileName = String(fileIdentifier).split(/[\\/]/).pop() || String(fileIdentifier);
  if (!confirm(`Permanently delete "${fileName}" from record ${recordId}? This cannot be undone.`)) return;

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

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(responseText || `Server returned HTTP ${response.status}`);
    }

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
  const dataset = currentModule === "computer-assets"
    ? filteredData
    : filteredData.length > 0 ? filteredData : masterData;

  if (!dataset || dataset.length === 0) {
    showToast("No data available to export.", "error");
    return;
  }

  if (currentModule === "computer-assets") {
    const headers = [
      "SERIAL NUMBER",
      "DEVICE TYPE",
      "BRAND",
      "ASSIGNED TO",
      "LOCATION",
      "FIRST NAME",
      "LAST NAME",
      "HOSTNAME",
      "ASSET NUMBER",
      "MODEL",
      "Date",
      "SPECS",
      "Domain joined",
      "Printing share",
      "Sophos Installed",
      "Bitlocker Enabled"
    ];

    const getValue = (row, ...keys) => {
      for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null) return row[key];
      }
      return "";
    };

    const formatPurchaseDate = value => {
      if (!value) return "";
      const date = new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
      if (Number.isNaN(date.getTime())) return value;
      return new Intl.DateTimeFormat("en", {
        month: "short",
        year: "2-digit",
        timeZone: "UTC"
      }).format(date).replace(" ", "-");
    };

    const groups = new Map();
    dataset.forEach(row => {
      const department = getValue(row, "employee_department", "department") || "Unassigned";
      if (!groups.has(department)) groups.set(department, []);
      groups.get(department).push(row);
    });

    const departmentNames = [...groups.keys()].sort((a, b) => {
      if (a === "Unassigned") return 1;
      if (b === "Unassigned") return -1;
      return String(a).localeCompare(String(b), undefined, { sensitivity: "base" });
    });
    const sheetRows = [];
    const merges = [];
    let exportedCount = 0;

    departmentNames.forEach((department, groupIndex) => {
      if (groupIndex > 0) sheetRows.push([]);
      const sectionRow = sheetRows.length;
      sheetRows.push([`Department: ${department}`]);
      merges.push({ s: { r: sectionRow, c: 0 }, e: { r: sectionRow, c: headers.length - 1 } });
      sheetRows.push(headers);

      const departmentRows = groups.get(department).sort((a, b) =>
        String(getValue(a, "last_name") || "").localeCompare(String(getValue(b, "last_name") || "")) ||
        String(getValue(a, "first_name") || "").localeCompare(String(getValue(b, "first_name") || "")) ||
        String(getValue(a, "serial_number") || "").localeCompare(String(getValue(b, "serial_number") || ""))
      );

      departmentRows.forEach(row => {
        sheetRows.push([
          getValue(row, "serial_number"),
          getValue(row, "device_type"),
          getValue(row, "brand"),
          getValue(row, "assigned_to", "employee_email"),
          getValue(row, "location"),
          getValue(row, "first_name"),
          getValue(row, "last_name"),
          getValue(row, "hostname"),
          getValue(row, "asset_number"),
          getValue(row, "model"),
          formatPurchaseDate(getValue(row, "purchase_date", "date")),
          getValue(row, "specs"),
          getValue(row, "domain_joined", "Domain joined"),
          getValue(row, "printing_share", "Printing share"),
          getValue(row, "sophos_installed", "Sophos Installed"),
          getValue(row, "bitlocker_enabled", "Bitlocker Enabled")
        ]);
        exportedCount++;
      });
    });

    const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
    worksheet["!merges"] = merges;
    worksheet["!cols"] = [
      { wch: 18 }, { wch: 15 }, { wch: 14 }, { wch: 32 },
      { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 22 },
      { wch: 16 }, { wch: 34 }, { wch: 12 }, { wch: 72 },
      { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 18 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Computer Assets");
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `computer-assets_export_${dateStr}.xlsx`);
    showToast(`Successfully exported ${exportedCount} records grouped by department to Excel!`, "success");
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

document.addEventListener("DOMContentLoaded", () => {
  // Existing DOM listeners...
  
  // Search Help Modal Toggle Handlers
  const helpBtn = document.getElementById("searchHelpBtn");
  const helpDropdown = document.getElementById("searchHelpDropdown");
  const closeHelpBtn = document.getElementById("closeSearchHelpBtn");

  if (helpBtn && helpDropdown) {
    helpBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      helpDropdown.classList.toggle("hidden");
    });

    closeHelpBtn?.addEventListener("click", () => {
      helpDropdown.classList.add("hidden");
    });

    document.addEventListener("click", (e) => {
      if (!helpDropdown.contains(e.target) && e.target !== helpBtn) {
        helpDropdown.classList.add("hidden");
      }
    });
  }
});