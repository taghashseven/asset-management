import {
  updatePaginationFooter,
  visibleFields,
  fieldWidths
} from "./app.js";

export function render(filteredData, currentPage, pageSize) {
  console.log("Rendering toner stock view...");

  const totalRecords = filteredData.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const pageData = filteredData.slice(startIndex, endIndex);

  // Column widths
  const codeWidth = fieldWidths["toner_code"] || 180;
  const descWidth = fieldWidths["description"] || 300;
  const qtyWidth = fieldWidths["quantity"] || 120;
  const statusWidth = fieldWidths["status"] || 160;

  // --------------------------
  // TABLE HEADER
  // --------------------------
  let headerMarkup = `
    <tr>
      <th class="p-2 text-left bg-slate-200" style="width:60px;">#</th>
  `;

  if (visibleFields.includes("toner_code")) {
    headerMarkup += `
      <th class="p-2 text-left text-xs font-bold bg-slate-200"
          style="width:${codeWidth}px;">
          TONER CODE
      </th>`;
  }

  if (visibleFields.includes("description")) {
    headerMarkup += `
      <th class="p-2 text-left text-xs font-bold bg-slate-200"
          style="width:${descWidth}px;">
          DESCRIPTION
      </th>`;
  }

  if (visibleFields.includes("quantity")) {
    headerMarkup += `
      <th class="p-2 text-center text-xs font-bold bg-slate-200"
          style="width:${qtyWidth}px;">
          QUANTITY
      </th>`;
  }

  if (visibleFields.includes("status")) {
    headerMarkup += `
      <th class="p-2 text-center text-xs font-bold bg-slate-200"
          style="width:${statusWidth}px;">
          STOCK STATUS
      </th>`;
  }

  headerMarkup += `
      <th class="p-2 text-center bg-slate-200" style="width:100px;">
        ACTIONS
      </th>
    </tr>
  `;

  document.getElementById("tableHead").innerHTML = headerMarkup;

  // --------------------------
  // TABLE BODY
  // --------------------------

  let bodyMarkup = "";

  if (!pageData.length) {
    bodyMarkup = `
      <tr>
        <td colspan="100"
            class="p-8 text-center text-slate-400">
          No toner stock found
        </td>
      </tr>
    `;
  } else {

    pageData.forEach((toner, index) => {

      const qty = Number(toner.quantity);

      let rowClass = "bg-white hover:bg-gray-50";
      let badge = "";

      if (qty <= 0) {
        rowClass = "bg-red-50 text-red-900 border-l-4 border-red-500 hover:bg-red-100";

        badge = `
          <span class="inline-flex items-center rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-red-600/10">
            ❌ Out of Stock
          </span>
        `;
      }
      else if (qty <= 5) {
        rowClass = "bg-amber-50 border-l-4 border-amber-500 hover:bg-amber-100";

        badge = `
          <span class="inline-flex items-center rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-600/10">
            ⚠ Low Stock
          </span>
        `;
      }
      else {
        badge = `
          <span class="inline-flex items-center rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/10">
            ✔ In Stock
          </span>
        `;
      }

      bodyMarkup += `<tr class="${rowClass} border-b border-gray-200">`;

      bodyMarkup += `
        <td class="p-2 text-xs font-medium">
          ${startIndex + index + 1}
        </td>
      `;

      if (visibleFields.includes("toner_code")) {
        bodyMarkup += `
          <td class="px-4 py-3 text-sm font-semibold font-mono"
              style="width:${codeWidth}px;">
            ${toner.toner_code.trim()}
          </td>
        `;
      }

      if (visibleFields.includes("description")) {
        bodyMarkup += `
          <td class="px-4 py-3 text-sm"
              style="width:${descWidth}px;">
            ${toner.description}
          </td>
        `;
      }

      if (visibleFields.includes("quantity")) {
        bodyMarkup += `
          <td class="px-4 py-3 text-center text-sm font-bold"
              style="width:${qtyWidth}px;">
            ${qty}
          </td>
        `;
      }

      if (visibleFields.includes("status")) {
        bodyMarkup += `
          <td class="px-4 py-3 text-center"
              style="width:${statusWidth}px;">
            ${badge}
          </td>
        `;
      }

      bodyMarkup += `
        <td class="p-2 text-center" style="width:100px;">
          <button
              data-id="${toner.id}"
              class="edit-action-btn bg-amber-500 text-white px-3 py-1 rounded text-xs hover:bg-amber-600 transition">
              Edit
          </button>
        </td>
      `;

      bodyMarkup += `</tr>`;
    });
  }

  document.getElementById("tableBody").innerHTML = bodyMarkup;
  document.getElementById("recordCount").innerText = `(${filteredData.length})`;

  document.querySelectorAll(".edit-action-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      if (window.editRecord) {
        window.editRecord(e.target.dataset.id);
      }
    });
  });

  updatePaginationFooter(
    totalRecords,
    startIndex,
    endIndex,
    totalPages
  );
}