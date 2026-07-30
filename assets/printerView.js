import { masterData, loadModule, openCreateForm } from "./app.js";

/* ==================== PRINTER SYSTEM (VIEW B) ==================== */

let activePrinterFilter = window.activePrinterFilter || "all";
let activePrinterSearch = window.activePrinterSearch || "";

export function applyPrinterFiltersAndRender() {
  console.log("Applying filters and rendering printer grid...");

  let total = masterData.length;
  let online = 0;
  let offline = 0;
  let lowSupplies = 0;

  masterData.forEach((printer) => {
    const isOffline = printer.error || printer.status === "Offline";

    if (isOffline) {
      offline++;
    } else {
      online++;
      let hasAlert = false;
      const supplyItems = printer.toner || printer.supplies || [];

      supplyItems.forEach((item) => {
        const pct = calculatePercent(item);
        if (pct !== null && pct <= 20) {
          hasAlert = true;
        }
      });

      if (hasAlert) lowSupplies++;
    }
  });

  const setElText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
  };

  setElText("stat-total", total);
  setElText("stat-online", online);
  setElText("stat-offline", offline);
  setElText("stat-low", lowSupplies);

  const displayPrinters = masterData.filter((printer) => {
    const isOffline = printer.error || printer.status === "Offline";
    if (activePrinterFilter === "online" && isOffline) return false;
    if (activePrinterFilter === "offline" && !isOffline) return false;

    if (activePrinterSearch.trim() !== "") {
      const query = activePrinterSearch.toLowerCase();
      const ipMatch = String(printer.ip || "").toLowerCase().includes(query);
      const nameMatch = String(printer.displayName || printer.listName || "").toLowerCase().includes(query);
      const modelMatch = String(printer.model || "").toLowerCase().includes(query);
      const hostMatch = String(printer.hostname || "").toLowerCase().includes(query);
      return ipMatch || nameMatch || modelMatch || hostMatch;
    }
    return true;
  });

  render(displayPrinters);
}

/**
 * Calculates human-readable relative time (e.g., "installed 27 days ago")
 */
function getRelativeTimeAgo(dateString) {
  if (!dateString) return null;

  // Replace space with 'T' for reliable cross-browser ISO string parsing
  const formattedDate = dateString.replace(" ", "T");
  const installedDate = new Date(formattedDate);
  const now = new Date();

  if (isNaN(installedDate.getTime())) return null;

  const diffInSeconds = Math.floor((now - installedDate) / 1000);
  const diffInDays = Math.floor(diffInSeconds / (3600 * 24));

  if (diffInDays === 0) {
    const diffInHours = Math.floor(diffInSeconds / 3600);
    if (diffInHours === 0) return "installed today";
    return `installed ${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
  } else if (diffInDays === 1) {
    return "installed yesterday";
  } else {
    return `installed ${diffInDays} days ago`;
  }
}

function calculatePercent(item) {
  if (item.percent !== undefined && item.percent !== null && item.percent >= 0) {
    return item.percent;
  }
  if (item.level !== undefined && item.max && item.max > 0 && item.level >= 0) {
    return Math.round((item.level / item.max) * 100);
  }
  return null;
}

function getSupplyColors(item, percent) {
  const name = (item.name || "").toLowerCase();

  if (percent !== null) {
    if (percent <= 10) {
      return {
        bar: "bg-rose-500",
        text: "text-rose-700 font-semibold",
        badge: `<span class="text-[10px] font-bold uppercase bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded ml-1.5">Critical</span>`
      };
    }
    if (percent <= 20) {
      return {
        bar: "bg-amber-500",
        text: "text-amber-700 font-semibold",
        badge: `<span class="text-[10px] font-bold uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded ml-1.5">Low</span>`
      };
    }
  }

  if (name.includes("cyan")) return { bar: "bg-cyan-500", text: "text-slate-700", badge: "" };
  if (name.includes("magenta")) return { bar: "bg-fuchsia-500", text: "text-slate-700", badge: "" };
  if (name.includes("yellow")) return { bar: "bg-amber-400", text: "text-slate-700", badge: "" };
  if (name.includes("drum")) return { bar: "bg-purple-600", text: "text-slate-700", badge: "" };
  if (name.includes("black")) return { bar: "bg-slate-800", text: "text-slate-700", badge: "" };

  return { bar: "bg-blue-600", text: "text-slate-700", badge: "" };
}

export function render(printers) {
  const grid = document.getElementById("printer-grid");
  if (!grid) return;

  grid.innerHTML = "";

  if (printers.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-12 bg-white rounded-xl border border-slate-200">
        <i data-lucide="search-code" class="w-12 h-12 text-slate-300 mx-auto mb-3"></i>
        <p class="text-slate-500 font-medium">No matching fleet printers found.</p>
      </div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  printers.forEach((printer) => {
    let cardHtml = "";
    const isOffline = printer.error || printer.status === "Offline";

    if (isOffline) {
      cardHtml = `
        <div class="bg-white border-t-4 border-rose-500 rounded-xl shadow-sm p-5 border border-slate-200 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-mono font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-sm">${printer.ip || "0.0.0.0"}</span>
              <span class="inline-flex items-center text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
                <span class="w-1.5 h-1.5 bg-rose-500 rounded-full mr-1.5 animate-pulse"></span> Offline
              </span>
            </div>
            <h3 class="text-base font-bold text-slate-800">${printer.displayName || printer.listName || "Unreachable Device"}</h3>
            <p class="text-xs text-slate-400 mt-0.5">${printer.model || "SNMP Connection Failure"}</p>
            <div class="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-700 font-mono break-all">
              ${printer.error || "Device is reporting offline state."}
            </div>
          </div>
          <div class="text-right text-xs text-slate-400 mt-6 pt-3 border-t border-slate-100 flex justify-between items-center">
            <button onclick="editRecord('${printer.printer_id}')" class="text-amber-600 font-medium hover:underline">Edit Config</button>
            <span>Action Required</span>
          </div>
        </div>`;
    } else {
      let suppliesHtml = "";
      const supplyItems = printer.toner || printer.supplies || [];

      if (supplyItems.length === 0) {
        suppliesHtml = `<p class="text-xs text-slate-400 italic">${printer.message || "No supply telemetry recorded."}</p>`;
      } else {
        supplyItems.forEach((item) => {
          const pct = calculatePercent(item);
          const style = getSupplyColors(item, pct);

          const displayValue = pct !== null ? `${pct}%` : item.level < 0 ? "OK" : `Level: ${item.level}`;
          const progressWidth = pct !== null ? `${pct}%` : "100%";

          // Telemetry extra details
          const timeAgo = getRelativeTimeAgo(item.installDate);
          const pagesPrinted = item.pagesPrintedWithToner !== undefined ? item.pagesPrintedWithToner : null;

          // Assemble meta string (e.g. "39 pgs printed • installed 27 days ago")
          let metaText = "";
          if (pagesPrinted !== null) {
            metaText += `<span>${Number(pagesPrinted).toLocaleString()} pgs printed</span>`;
          }
          if (timeAgo) {
            metaText += metaText ? ` • <span>${timeAgo}</span>` : `<span>${timeAgo}</span>`;
          }

          suppliesHtml += `
            <div class="space-y-1">
              <div class="flex justify-between text-xs">
                <span class="text-slate-600 font-medium truncate max-w-[65%]" title="${item.name}">${item.name} ${style.badge}</span>
                <span class="${style.text}">${displayValue}</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2">
                <div class="${style.bar} h-2 rounded-full transition-all duration-300" style="width: ${progressWidth}"></div>
              </div>
              ${
                metaText
                  ? `<div class="flex justify-between text-[10px] text-slate-400 font-mono pt-0.5">${metaText}</div>`
                  : ""
              }
            </div>`;
        });
      }

      cardHtml = `
        <div class="bg-white border-t-4 border-blue-600 rounded-xl shadow-sm p-5 border border-slate-200 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-mono font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-sm">${printer.ip || "Network Device"}</span>
              <div class="flex items-center space-x-2">
                ${
                  printer.pagesPrinted && printer.pagesPrinted !== "Unknown"
                    ? `
                  <span class="inline-flex items-center text-[11px] font-medium font-mono text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                    📟 ${Number(printer.pagesPrinted).toLocaleString()} total pgs
                  </span>
                `
                    : ""
                }
                <span class="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span> Online
                </span>
              </div>
            </div>
            <h3 class="text-base font-bold text-slate-800 truncate" title="${printer.displayName || printer.listName}">${printer.displayName || printer.listName || "Generic Printer"}</h3>
            <p class="text-xs text-slate-400 mt-0.5 truncate" title="${printer.model}">${printer.model || "Unknown Fleet Model"}</p>
            <div class="mt-5 space-y-4">
              ${suppliesHtml}
            </div>
          </div>
          <div class="text-right text-[11px] text-slate-400 mt-6 pt-3 border-t border-slate-100 flex justify-between items-center">
            <button onclick="editRecord('${printer.printer_id}')" class="text-amber-600 font-medium hover:underline text-xs">Edit Asset</button>
            <span class="font-mono text-[10px] text-slate-300">${printer.hostname || "SNMP v2c"}</span>
          </div>
        </div>`;
    }
    grid.innerHTML += cardHtml;
  });

  if (window.lucide) lucide.createIcons();
}

const newPrinterBtn = document.getElementById("newPrinterBtn");
if (newPrinterBtn) {
  newPrinterBtn.addEventListener("click", openCreateForm);
}