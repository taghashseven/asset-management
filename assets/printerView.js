  import { masterData, loadModule , openCreateForm } from "./app.js";

  /* ==================== PRINTER SYSTEM (VIEW B) ==================== */
  export function applyPrinterFiltersAndRender() {

    console.log("Applying filters and rendering printer grid...");
    console.log("running appply filter and render");
    let total = masterData.length;
    let online = 0;
    let offline = 0;
    let lowSupplies = 0;

    masterData.forEach(printer => {
      // Structural match: Account for either a designated string status or explicit error text
      if (printer.error || printer.status === 'Offline') {
        offline++;
      } else {
        online++;
        let hasAlert = false;
        
        // Adapt directly to the provided "toner" or fallback "supplies" data array
        const supplyItems = printer.toner || printer.supplies || [];
        if (supplyItems.length > 0) {
          supplyItems.forEach(item => {
            // Identify alerts on explicit percentages equal or less than 20%
            if (item.percent !== undefined && item.percent !== null && item.percent <= 20) {
              hasAlert = true;
            }
          });
        }
        if (hasAlert) lowSupplies++;
      }
    });

    document.getElementById("stat-total").innerText = total;
    document.getElementById("stat-online").innerText = online;
    document.getElementById("stat-offline").innerText = offline;
    document.getElementById("stat-low").innerText = lowSupplies;

    const displayPrinters = masterData.filter(printer => {
      const isOffline = printer.error || printer.status === 'Offline';
      if (activePrinterFilter === "online" && isOffline) return false;
      if (activePrinterFilter === "offline" && !isOffline) return false;

      if (activePrinterSearch !== "") {
        const query = activePrinterSearch.toLowerCase();
        const ipMatch = String(printer.ip || '').toLowerCase().includes(query);
        const nameMatch = String(printer.listName || printer.displayName || '').toLowerCase().includes(query);
        const modelMatch = String(printer.model || '').toLowerCase().includes(query);
        const hostMatch = String(printer.hostname || '').toLowerCase().includes(query);
        return ipMatch || nameMatch || modelMatch || hostMatch;
      }
      return true;
    });

    renderPrinterGrid(displayPrinters);
  }

  export function render(printers) {
    const grid = document.getElementById("printer-grid");
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

    printers.forEach(printer => {
      let cardHtml = "";
      const isOffline = printer.error || printer.status === 'Offline';

      if (isOffline) {
        cardHtml = `
          <div class="bg-white border-t-4 border-rose-500 rounded-xl shadow-sm p-5 border border-slate-200 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-mono font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-sm">${printer.ip || '0.0.0.0'}</span>
                <span class="inline-flex items-center text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
                  <span class="w-1.5 h-1.5 bg-rose-500 rounded-full mr-1.5 animate-pulse"></span> Offline
                </span>
              </div>
              <h3 class="text-base font-bold text-slate-800">${printer.listName || 'Unreachable Device'}</h3>
              <p class="text-xs text-slate-400 mt-0.5">${printer.model || 'SNMP Connection Failure'}</p>
              <div class="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-700 font-mono break-all">
                ${printer.error || 'Device is reporting offline state.'}
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
          suppliesHtml = `<p class="text-xs text-slate-400 italic">${printer.message || 'No supply telemetry recorded.'}</p>`;
        } else {
          supplyItems.forEach(item => {
            let barColor = "bg-blue-600";
            let textColor = "text-slate-700";
            let alertBadge = "";

            // Color classification checks
            if (item.percent !== undefined && item.percent !== null) {
              if (item.percent <= 10) {
                barColor = "bg-rose-500";
                textColor = "text-rose-700 font-semibold";
                alertBadge = `<span class="text-[10px] font-bold uppercase bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded ml-1.5">Critical</span>`;
              } else if (item.percent <= 20) {
                barColor = "bg-amber-500";
                textColor = "text-amber-700 font-semibold";
                alertBadge = `<span class="text-[10px] font-bold uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded ml-1.5">Low</span>`;
              }
            }

            const displayValue = item.percent !== undefined && item.percent !== null ? `${item.percent}%` : `Level: ${item.level}`;
            const progressWidth = item.percent !== undefined && item.percent !== null ? `${item.percent}%` : '100%';

            suppliesHtml += `
              <div class="space-y-1">
                <div class="flex justify-between text-xs">
                  <span class="text-slate-600 truncate max-w-[70%]" title="${item.name}">${item.name} ${alertBadge}</span>
                  <span class="${textColor}">${displayValue}</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-2">
                  <div class="${barColor} h-2 rounded-full" style="width: ${progressWidth}"></div>
                </div>
              </div>`;
          });
        }

        cardHtml = `
          <div class="bg-white border-t-4 border-blue-600 rounded-xl shadow-sm p-5 border border-slate-200 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-mono font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-sm">${printer.ip || 'Network Device'}</span>
                <div class="flex items-center space-x-2">
                  ${printer.pagesPrinted && printer.pagesPrinted !== "Unknown" ? `
                    <span class="inline-flex items-center text-[11px] font-medium font-mono text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                      📟 ${Number(printer.pagesPrinted).toLocaleString()} pages
                    </span>
                  ` : ''}
                  <span class="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span> Online
                  </span>
                </div>
              </div>
              <h3 class="text-base font-bold text-slate-800 truncate" title="${printer.displayName || printer.listName}">${printer.displayName || printer.listName || 'Generic Printer'}</h3>
              <p class="text-xs text-slate-400 mt-0.5 truncate" title="${printer.model}">${printer.model || 'Unknown Fleet Model'}</p>
              <div class="mt-5 space-y-3.5">
                ${suppliesHtml}
              </div>
            </div>
            <div class="text-right text-[11px] text-slate-400 mt-6 pt-3 border-t border-slate-100 flex justify-between items-center">
              <button onclick="editRecord('${printer.printer_id}')" class="text-amber-600 font-medium hover:underline text-xs">Edit Asset</button>
              <span class="font-mono text-[10px] text-slate-300">${printer.hostname || 'SNMP v2c'}</span>
            </div>
          </div>`;
      }
      grid.innerHTML += cardHtml;
    });

    if (window.lucide) lucide.createIcons();
  }


// on click new pritner run the open create from method
document.getElementById("newPrinterBtn").addEventListener("click", openCreateForm )