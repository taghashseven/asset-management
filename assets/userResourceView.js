import { updatePaginationFooter, editRecord } from "./app.js";

/**
 * Custom renderer for User Resources
 */
export function render(filteredData, currentPage, pageSize) {   
  const tableHead = document.getElementById("tableHead");
  const tableBody = document.getElementById("tableBody");
  document.getElementById("recordCount").innerText = `(${filteredData.length})`;

  // Custom Table Header Definition
  tableHead.innerHTML = `
    <tr>
      <th class="p-2 text-left bg-slate-200" style="width: 60px;">#</th>
      <th class="p-2 text-left text-xs bg-slate-200 font-bold" style="width: 250px;">EMPLOYEE PROFILE</th>
      <th class="p-2 text-left text-xs bg-slate-200 font-bold" style="width: 300px;">ASSIGNED COMPUTING HARDWARE</th>
      <th class="p-2 text-left text-xs bg-slate-200 font-bold" style="width: 300px;">ASSIGNED DISPLAY MONITORS</th>
      <th class="p-3 text-center bg-slate-200" style="width: 100px;">ACTIONS</th>
    </tr>`;

  const totalRecords = filteredData.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const pageData = filteredData.slice(startIndex, endIndex);

  let body = "";
  if (pageData.length === 0) {
    body = `<tr><td colspan="5" class="p-8 text-center text-slate-400">No matching user resources records discovered</td></tr>`;
  } else {
    pageData.forEach((row, index) => {
      body += `<tr class="border-t hover:bg-slate-50 align-top">
        <td class="p-2 font-medium text-xs">${startIndex + index + 1}</td>
        <td class="p-2">
          <div class="font-bold text-slate-900 text-xs">${row.first_name} ${row.last_name}</div>
          <div class="text-slate-500 text-[11px] font-mono select-all">${row.email}</div>
          <div class="mt-1 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">${row.department || 'N/A'}</div>
        </td>
        <td class="p-2 space-y-1">${renderHardwareChips(row.computers, 'bg-slate-800 border-blue-500')}</td>
        <td class="p-2 space-y-1">${renderHardwareChips(row.monitors, 'bg-slate-700 border-teal-500')}</td>
        <td class="p-2 text-center">
          <button data-id="${row.employee_id}" class="usr-edit-btn bg-amber-500 text-white px-2.5 py-1 rounded text-xs hover:bg-amber-600 transition">Edit</button>
        </td>
      </tr>`;
    });
  }
  tableBody.innerHTML = body;

  // Add event listeners to custom generated rows
  document.querySelectorAll(".usr-edit-btn").forEach(b => {
    b.onclick = (e) => editRecord(e.target.dataset.id);
  });

  updatePaginationFooter(totalRecords, startIndex, endIndex, totalPages);
}

function renderHardwareChips(assets, classes) {
  if (!assets || assets.length === 0) return `<span class="text-slate-400 italic text-[11px]">None Active</span>`;
  return assets.map(asset => `
    <div class="${classes} text-slate-100 p-2 rounded shadow-sm border-l-4 flex justify-between items-center text-[11px]" 
      data-serial="${asset.serial_number}">
      <div class="serial_chip cursor-pointer" data-serial="${asset.serial_number}" onclick="handleSerialClick('${asset.serial_number}')">
        <strong class="block truncate max-w-[180px]">${asset.brand} ${asset.model}</strong>
        <span class="text-[10px] text-slate-400 block">S/N: ${asset.serial_number}</span>
      </div>
      <span class="text-[9px] bg-black/30 px-1.5 py-0.5 rounded font-mono text-slate-300 ml-1">${asset.asset_number || 'N/A'}</span>
    </div>
  `).join('');
}


 