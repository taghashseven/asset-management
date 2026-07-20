import { updatePaginationFooter, editRecord } from "./app.js";
// Import our custom route jump handling engine
import { navigateToModuleWithParam } from "./app.js";

/**
 * Custom renderer for Printers List
 */
export function render(filteredData, currentPage, pageSize) {   
  const tableHead = document.getElementById("tableHead");
  const tableBody = document.getElementById("tableBody");
  document.getElementById("recordCount").innerText = `(${filteredData.length})`;

  tableHead.innerHTML = `
    <tr>
      <th class="p-2 text-left bg-slate-200" style="width: 60px;">#</th>
      <th class="p-2 text-left text-xs bg-slate-200 font-bold" style="width: 250px;">PRINTER INFO</th>
      <th class="p-2 text-left text-xs bg-slate-200 font-bold" style="width: 200px;">NETWORK & SPECS</th>
      <th class="p-2 text-left text-xs bg-slate-200 font-bold" style="width: 250px;">STATUS & LOGS</th>
      <th class="p-3 text-center bg-slate-200" style="width: 100px;">ACTIONS</th>
    </tr>`;

  const totalRecords = filteredData.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const pageData = filteredData.slice(startIndex, endIndex);

  let body = "";
  if (pageData.length === 0) {
    body = `<tr><td colspan="5" class="p-8 text-center text-slate-400">No matching printer records discovered</td></tr>`;
  } else {
    pageData.forEach((row, index) => {
      const statusColor = row.status?.toLowerCase() === 'active' 
        ? 'bg-green-100 text-green-800 border-green-300' 
        : 'bg-slate-100 text-slate-600 border-slate-300';

      body += `<tr class="border-t hover:bg-slate-50 align-top">
        <td class="p-2 font-medium text-xs">${startIndex + index + 1}</td>
        
        <td class="p-2">
          <div class="font-bold text-slate-900 text-xs">${row.printer_name || 'Unnamed Printer'}</div>
          <div class="text-slate-500 text-[11px] font-semibold">${row.brand ? row.brand + ' ' : ''}${row.model || 'Unknown Model'}</div>
          <div class="mt-1 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Loc: ${row.location || 'N/A'}</div>
          ${row.asset_tag ? `<span class="mt-1 inline-block text-[9px] bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-600 border">Tag: ${row.asset_tag}</span>` : ''}
        </td>
        
        <td class="p-2 space-y-1">
          <div class="text-xs font-mono text-slate-700 select-all"><span class="text-[10px] text-slate-400 font-sans">IP:</span> ${row.ip_address || 'N/A'}</div>
          <div class="text-[11px] font-mono text-slate-500 select-all"><span class="text-[10px] text-slate-400 font-sans">MAC:</span> ${row.mac_address || 'N/A'}</div>
          <div class="pt-1 flex gap-2 items-center text-[10px]">
            <span class="px-1.5 py-0.5 rounded ${row.is_color ? 'bg-purple-100 text-purple-700 font-medium' : 'bg-slate-100 text-slate-500'}">
              ${row.is_color ? 'Color' : 'Mono'}
            </span>
            <span class="text-slate-500">Pages: <strong>${row.page_count ?? 0}</strong></span>
          </div>
        </td>
        
        <!-- Status & Logs -->
        <td class="p-2 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold border ${statusColor}">${row.status || 'Unknown'}</span>
            <span class="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">Toner: ${row.toner_code?.trim() || 'N/A'}</span>
          </div>
          <!-- Clickable Logs Target Component Container -->
          <div data-printer-id="${row.printer_id}" class="view-logs-trigger space-y-1 max-h-[60px] overflow-y-auto pr-1 cursor-pointer hover:ring-2 hover:ring-slate-200 p-0.5 rounded transition" title="Click to view full log audit table">
            ${renderPrinterLogs(row.logs)}
          </div>
        </td>
        
        <td class="p-2 text-center">
          <button data-id="${row.printer_id}" class="prn-edit-btn bg-amber-500 text-white px-2.5 py-1 rounded text-xs hover:bg-amber-600 transition">Edit</button>
        </td>
      </tr>`;
    });
  }
  tableBody.innerHTML = body;

  // Add event listeners to edit buttons
  document.querySelectorAll(".prn-edit-btn").forEach(b => {
    b.onclick = (e) => editRecord(e.target.dataset.id);
  });

  // Attach dynamic redirection event listeners to the log columns
  document.querySelectorAll(".view-logs-trigger").forEach(container => {
      container.onclick = (e) => {
          const printerId = container.dataset.printerId;
          if (printerId) {
              navigateToModuleWithParam("printer-logs", printerId);
          }
      };
  });

  updatePaginationFooter(totalRecords, startIndex, endIndex, totalPages);
}

function renderPrinterLogs(logs) {
  if (!logs || logs.length === 0) return `<div class="text-[10px] text-slate-400 italic">No historical logs</div>`;
  return logs.map(log => `
    <div class="bg-slate-100 text-[10px] p-1 rounded border-l-2 border-slate-400 text-slate-600 truncate" title="${log.description}">
      <span class="font-bold text-[9px] text-slate-500 uppercase font-mono mr-1">[${log.event_type || 'LOG'}]</span>${log.description}
    </div>
  `).join('');
}