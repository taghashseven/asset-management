import { 
  updatePaginationFooter, 
  visibleFields, 
  fieldWidths, 
  loadModule, 
  currentModule, 
  CONFIG, 
  filterTable
} from "./app.js";

export function render(filteredData, currentPage, pageSize) {
  console.log("Rendering custom employee view layout configuration...");

  const totalRecords = filteredData.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const pageData = filteredData.slice(startIndex, endIndex);

  // Extract dynamic widths from local storage / state (fallback to defaults if not set)
  const nameWidth = (fieldWidths["first_name"] || 90) + (fieldWidths["last_name"] || 90);
  const emailWidth = fieldWidths["email"] || 220;
  const deptWidth = fieldWidths["department"] || 150;
  const titleWidth = fieldWidths["job_title"] || 150;
  const statusWidth = fieldWidths["active"] || 160;

  // 1. Build Table Headers dynamically using our width variables
  let headerMarkup = `<tr><th class="p-2 text-left bg-slate-200" style="width: 60px;">#</th>`;
  
  if (visibleFields.includes("first_name") || visibleFields.includes("last_name")) {
    headerMarkup += `<th class="p-2 text-left text-xs bg-slate-200 font-bold" style="width: ${nameWidth}px;">NAME</th>`;
  }
  if (visibleFields.includes("email")) {
    headerMarkup += `<th class="p-2 text-left text-xs bg-slate-200 font-bold" style="width: ${emailWidth}px;">EMAIL</th>`;
  }
  if (visibleFields.includes("department")) {
    headerMarkup += `<th class="p-2 text-left text-xs bg-slate-200 font-bold" style="width: ${deptWidth}px;">DEPARTMENT</th>`;
  }
  if (visibleFields.includes("job_title")) {
    headerMarkup += `<th class="p-2 text-left text-xs bg-slate-200 font-bold" style="width: ${titleWidth}px;">JOB TITLE</th>`;
  }
  if (visibleFields.includes("active")) {
    headerMarkup += `<th class="p-2 text-left text-xs bg-slate-200 font-bold" style="width: ${statusWidth}px;">STATUS BADGES</th>`;
  }
  
  headerMarkup += `<th class="p-3 text-center bg-slate-200" style="width: 100px;">ACTIONS</th></tr>`;
  document.getElementById("tableHead").innerHTML = headerMarkup;

  // 2. Build Table Rows with visibility filters applied
  let bodyMarkup = "";
  if (pageData.length === 0) {
    bodyMarkup = `<tr><td colspan="100" class="p-8 text-center text-slate-400">No matching records found</td></tr>`;
  } else {
    pageData.forEach((employee, index) => {
      const isActive = employee.active;
      const isMissingEquipment = !employee.computers || employee.computers.length === 0;
      const shouldFlagRed = !isActive || isMissingEquipment;

      const rowClasses = shouldFlagRed
        ? "bg-red-50 text-red-900 border-l-4 border-red-500 hover:bg-red-100 transition-colors"
        : "bg-white text-gray-700 hover:bg-gray-50 transition-colors";

      let statusBadges = '';
      if (isMissingEquipment) {
        statusBadges += `
          <span 
            class="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/10 cursor-pointer hover:bg-amber-200"
            data-action="create-form"
            data-emp-id="${employee.employee_id}"
            data-emp-first="${employee.first_name || ''}"
            data-emp-last="${employee.last_name || ''}"
            title="Click to open handover form"
          >
            💻 No Hardware
          </span>`;
      }
      if (employee.active === false || employee.active === "false") {
        statusBadges += `<span class="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">⚠️ Inactive</span> `;
      }

      bodyMarkup += `<tr class="${rowClasses} border-b border-gray-200 align-top">`;
      bodyMarkup += `<td class="p-2 font-medium text-xs">${startIndex + index + 1}</td>`;
      
      if (visibleFields.includes("first_name") || visibleFields.includes("last_name")) {
        bodyMarkup += `<td class="whitespace-nowrap px-4 py-3 text-sm font-medium" style="width: ${nameWidth}px;">${employee.first_name || ''} ${employee.last_name || ''}</td>`;
      }
      if (visibleFields.includes("email")) {
        bodyMarkup += `<td class="whitespace-nowrap px-4 py-3 text-sm opacity-90" style="width: ${emailWidth}px;">${employee.email || ''}</td>`;
      }
      if (visibleFields.includes("department")) {
        bodyMarkup += `<td class="whitespace-nowrap px-4 py-3 text-sm opacity-90" style="width: ${deptWidth}px;">${employee.department || ''}</td>`;
      }
      if (visibleFields.includes("job_title")) {
        bodyMarkup += `<td class="whitespace-nowrap px-4 py-3 text-sm opacity-90" style="width: ${titleWidth}px;">${employee.job_title || ''}</td>`;
      }
      if (visibleFields.includes("active")) {
        bodyMarkup += `
        <td class="whitespace-nowrap px-4 py-3 text-sm" style="width: ${statusWidth}px;">
          <div class="flex flex-col gap-1.5">
            <div class="flex flex-wrap gap-1.5 items-center">${statusBadges}</div>

            ${
              employee.computers && employee.computers.length > 0
                ? `<div class="flex flex-col gap-0.5">
                    ${employee.computers
                      .map(
                        computer => `
                          <span
                            class="text-[10px] text-slate-500 font-mono cursor-pointer hover:text-blue-600 hover:underline w-fit"
                            data-computer="${computer}"
                          >
                            S/N: ${computer}
                          </span>
                        `
                      )
                      .join('')}
                  </div>`
                : `<button 
                    data-action="create-form" 
                    data-emp-id="${employee.employee_id}" 
                    data-emp-first="${employee.first_name || ''}" 
                    data-emp-last="${employee.last_name || ''}" 
                    class="text-[10px] font-bold text-blue-600 hover:underline text-left w-fit"
                   >
                     + Handover Form
                   </button>`
            }

          </div>
        </td>`;
      }

      bodyMarkup += `
          <td class="p-2 text-center" style="width: 100px;">
            <button data-id="${employee.employee_id}" class="edit-action-btn bg-amber-500 text-white px-2.5 py-1 rounded text-xs hover:bg-amber-600 transition">Edit</button>
          </td>
        </tr>
      `;
    });
  }

  document.getElementById("tableBody").innerHTML = bodyMarkup;
  document.getElementById("recordCount").innerText = `(${filteredData.length})`;

  // Edit Button Event Listeners
  document.querySelectorAll(".edit-action-btn").forEach(b => {
    b.addEventListener("click", (e) => {
        window.editRecord ? window.editRecord(e.target.dataset.id) : console.warn("Edit controller binding absent");
    });
  });

  // Global document click delegator
  document.addEventListener("click", async (e) => {
    // Handling computer link clicks
    const computer = e.target.dataset.computer;
    if (computer) {
      await loadModule("computer-assets");
      const searchBox = document.getElementById("searchBox");
      if (searchBox) searchBox.value = computer;
      filterTable(computer);
      return;
    }

    // Handling handover creation clicks
    if (e.target.dataset.action === "create-form") {
      const empId = e.target.dataset.empId;
      const firstName = e.target.dataset.empFirst;
      const lastName = e.target.dataset.empLast;

      // Loads the forms generator workspace module
      await loadModule("form-submissions"); 

      // Wait briefly for elements to mount inside the newly rendered module
      setTimeout(() => {
        const picker = document.getElementById("employee-picker");
        const empNameInput = document.getElementById("form-emp-name");
        const receiptEmpLabel = document.getElementById("receipt-emp-name");

        if (picker && empId) {
          picker.value = empId;
          // Trigger a synthetic 'change' event to update UI logic bound to employee select picker
          picker.dispatchEvent(new Event("change"));
        } else if (empNameInput && (firstName || lastName)) {
          const fullName = `${firstName} ${lastName}`.trim();
          empNameInput.value = fullName;
          if (receiptEmpLabel) receiptEmpLabel.textContent = fullName;
        }
      }, 80);
    }
  });

  updatePaginationFooter(totalRecords, startIndex, endIndex, totalPages);
}