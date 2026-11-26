function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function showDetails(content) {
  document.getElementById("recordDetailsContent").innerHTML = content;
  document.getElementById("recordDetailsOverlay").classList.remove("hidden");
}

export function closeRecordDetails() {
  document.getElementById("recordDetailsOverlay")?.classList.add("hidden");
}

export function initializeRecordDetails() {
  const overlay = document.getElementById("recordDetailsOverlay");
  overlay?.addEventListener("click", event => {
    if (event.target === overlay || event.target.closest("[data-close-details]")) {
      closeRecordDetails();
    }
  });
}

export async function openEmployeeDetails(employeeId) {
  showDetails(`<div class="p-8 text-slate-500">Loading employee details…</div>`);
  try {
    const response = await fetch(`/api/views/employees/${encodeURIComponent(employeeId)}`);
    const details = await response.json();
    if (!response.ok) throw new Error(details.error || `HTTP ${response.status}`);

    const [computersResponse, monitorsResponse] = await Promise.all([
      fetch("/api/views/unassigned"),
      fetch("/api/views/unassigned-monitors")
    ]);
    const [computers, monitors] = await Promise.all([
      computersResponse.json(),
      monitorsResponse.json()
    ]);
    if (!computersResponse.ok) throw new Error(computers.error || `Computer inventory request failed: HTTP ${computersResponse.status}`);
    if (!monitorsResponse.ok) throw new Error(monitors.error || `Monitor inventory request failed: HTTP ${monitorsResponse.status}`);

    const { employee, resources, history, forms } = details;
    const fullName = `${employee.first_name || ""} ${employee.last_name || ""}`.trim();
    const availableResources = [
      ...computers.map(resource => ({ ...resource, resource_type: "computer" })),
      ...monitors.map(resource => ({ ...resource, resource_type: "monitor" }))
    ];
    const resourceOptions = availableResources.map((resource, index) => `
      <option value="${index}" data-resource-type="${resource.resource_type}" data-serial-number="${escapeHtml(resource.serial_number)}">
        ${escapeHtml(resource.resource_type === "monitor" ? "Monitor" : resource.device_type || "Computer")} · ${escapeHtml(resource.brand)} ${escapeHtml(resource.model)} · S/N: ${escapeHtml(resource.serial_number)}
      </option>
    `).join("");
    const resourceRows = resources.length
      ? resources.map(resource => `
          <div class="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0">
            <div>
              <div class="font-medium text-slate-800">${escapeHtml(resource.brand)} ${escapeHtml(resource.model)}</div>
              <div class="text-xs text-slate-500">${escapeHtml(resource.resource_type)} · S/N: ${escapeHtml(resource.serial_number)} · Assigned ${escapeHtml(resource.date_issued || "date unknown")}</div>
            </div>
            <button type="button" data-open-asset="${escapeHtml(resource.resource_type)}" data-serial-number="${escapeHtml(resource.serial_number)}"
              class="shrink-0 rounded border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50">Asset history</button>
          </div>
        `).join("")
      : `<p class="py-4 text-sm text-slate-500">No resources currently assigned.</p>`;
    const historyRows = history.length
      ? history.map(item => `
          <tr class="border-t border-slate-100">
            <td class="px-3 py-2">${escapeHtml(item.date_issued || "—")}</td>
            <td class="px-3 py-2">${escapeHtml(item.date_returned || "Currently assigned")}</td>
            <td class="px-3 py-2"><button type="button" data-open-asset="${escapeHtml(item.resource_type)}" data-serial-number="${escapeHtml(item.serial_number)}" class="text-left text-blue-700 hover:underline">${escapeHtml(item.resource_type)} · ${escapeHtml(item.brand)} ${escapeHtml(item.model)}<span class="block font-mono text-xs text-slate-500">${escapeHtml(item.serial_number)}</span></button></td>
            <td class="px-3 py-2">${escapeHtml(item.notes || "—")}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="4" class="px-3 py-6 text-center text-slate-500">No assignment history.</td></tr>`;
    const formRows = forms.length
      ? forms.map(form => `<a class="mr-3 inline-block text-sm text-blue-700 underline" href="/${encodeURIComponent(form.file_path)}" target="_blank" rel="noopener">${escapeHtml(form.file_path)}</a>`).join("")
      : `<span class="text-sm text-slate-500">No forms on record.</span>`;

    showDetails(`
      <div class="flex items-start justify-between border-b border-slate-200 px-6 py-5">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-blue-700">Employee profile</p>
          <h2 class="mt-1 text-2xl font-bold text-slate-900">${escapeHtml(fullName)}</h2>
        </div>
        <button type="button" data-close-details class="rounded px-3 py-1 text-xl text-slate-500 hover:bg-slate-100" aria-label="Close">×</button>
      </div>
      <div class="space-y-6 p-6">
        <section class="grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
          <div><span class="text-xs text-slate-500">Email</span><p class="font-medium">${escapeHtml(employee.email)}</p></div>
          <div><span class="text-xs text-slate-500">Department</span><p class="font-medium">${escapeHtml(employee.department || "—")}</p></div>
          <div><span class="text-xs text-slate-500">Job title</span><p class="font-medium">${escapeHtml(employee.job_title || "—")}</p></div>
          <div><span class="text-xs text-slate-500">Status</span><p class="font-medium">${employee.active ? "Active" : "Inactive"}</p></div>
        </section>
        <section>
          <h3 class="mb-2 text-lg font-semibold">Currently assigned resources</h3>
          <div class="rounded-lg border border-slate-200 px-4">${resourceRows}</div>
        </section>
        <section class="rounded-lg border border-slate-200 p-4">
          <h3 class="mb-2 text-lg font-semibold">Assign a resource</h3>
          ${!employee.active
            ? `<p class="text-sm text-amber-800">This employee is inactive. Resources cannot be assigned.</p>`
            : availableResources.length
            ? `<form id="employeeAssignResourceForm" class="space-y-3">
                <label for="employeeResourceSelect" class="block text-sm font-medium text-slate-700">Available computers and monitors</label>
                <select id="employeeResourceSelect" required class="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm">
                  <option value="">Select a resource</option>${resourceOptions}
                </select>
                <label for="employeeResourceNotes" class="block text-sm font-medium text-slate-700">Notes (optional)</label>
                <textarea id="employeeResourceNotes" rows="2" class="w-full rounded-lg border border-slate-300 p-2 text-sm"></textarea>
                <button type="submit" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Assign to ${escapeHtml(fullName)}</button>
                <p id="employeeAssignResourceMessage" class="hidden text-sm" role="status"></p>
              </form>`
            : `<p class="text-sm text-slate-500">No unassigned computers or monitors are available.</p>`
          }
        </section>
        <section>
          <h3 class="mb-2 text-lg font-semibold">Assignment history</h3>
          <div class="overflow-x-auto rounded-lg border border-slate-200">
            <table class="w-full min-w-[640px] text-left text-sm">
              <thead class="bg-slate-50 text-xs uppercase text-slate-500"><tr><th class="px-3 py-2">Issued</th><th class="px-3 py-2">Returned</th><th class="px-3 py-2">Resource</th><th class="px-3 py-2">Notes</th></tr></thead>
              <tbody>${historyRows}</tbody>
            </table>
          </div>
        </section>
        <section><h3 class="mb-2 text-lg font-semibold">Employee forms</h3>${formRows}</section>
      </div>
    `);

    document.getElementById("employeeAssignResourceForm")?.addEventListener("submit", event => {
      event.preventDefault();
      const selectedResource = document.getElementById("employeeResourceSelect").selectedOptions[0];
      assignResourceToEmployee({
        employeeId,
        employeeEmail: employee.email,
        type: selectedResource.dataset.resourceType,
        serialNumber: selectedResource.dataset.serialNumber,
        notes: document.getElementById("employeeResourceNotes").value
      });
    });
  } catch (error) {
    showDetails(`<div class="p-8"><button type="button" data-close-details class="float-right text-xl">×</button><p class="font-medium text-rose-700">Could not load employee details: ${escapeHtml(error.message)}</p></div>`);
  }
}

async function assignResourceToEmployee({ employeeId, employeeEmail, type, serialNumber, notes }) {
  const message = document.getElementById("employeeAssignResourceMessage");
  const submitButton = document.querySelector("#employeeAssignResourceForm button[type='submit']");
  if (submitButton) submitButton.disabled = true;
  if (message) {
    message.classList.remove("hidden", "text-rose-700");
    message.classList.add("text-slate-600");
    message.textContent = "Assigning resource…";
  }

  try {
    const response = await fetch("/api/views/assets/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        serial_number: serialNumber,
        employee_email: employeeEmail,
        notes
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
    document.dispatchEvent(new CustomEvent("employee-resource-assignment-changed", {
      detail: { employeeId }
    }));
    await openEmployeeDetails(employeeId);
  } catch (error) {
    if (submitButton) submitButton.disabled = false;
    if (message) {
      message.classList.remove("text-slate-600");
      message.classList.add("text-rose-700");
      message.textContent = `Could not assign resource: ${error.message}`;
    }
  }
}

export async function openAssetDetails(type, serialNumber) {
  showDetails(`<div class="p-8 text-slate-500">Loading asset history…</div>`);
  try {
    const response = await fetch(`/api/views/assets/${encodeURIComponent(type)}/${encodeURIComponent(serialNumber)}`);
    const details = await response.json();
    if (!response.ok) throw new Error(details.error || `HTTP ${response.status}`);

    const { asset, history } = details;
    const currentAssignment = history.find(item => !item.date_returned);
    const employeesResponse = await fetch("/api/employees");
    const employees = await employeesResponse.json();
    if (!employeesResponse.ok) throw new Error(employees.error || `HTTP ${employeesResponse.status}`);
    const eligibleEmployees = employees.filter(employee =>
      ["1", "true"].includes(String(employee.active).toLowerCase()) &&
      employee.email !== currentAssignment?.employee_email
    );

    const historyRows = history.length
      ? history.map(item => `
          <tr class="border-t border-slate-100">
            <td class="px-3 py-2">${escapeHtml(item.first_name)} ${escapeHtml(item.last_name)}</td>
            <td class="px-3 py-2">${escapeHtml(item.department || "—")}</td>
            <td class="px-3 py-2">${escapeHtml(item.date_issued || "—")}</td>
            <td class="px-3 py-2">${escapeHtml(item.date_returned || "Currently assigned")}</td>
            <td class="px-3 py-2">${escapeHtml(item.notes || "—")}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="5" class="px-3 py-6 text-center text-slate-500">No assignment history.</td></tr>`;
    const employeeOptions = eligibleEmployees.map(employee => `
      <option value="${escapeHtml(employee.email)}">
        ${escapeHtml(employee.first_name)} ${escapeHtml(employee.last_name)} (${escapeHtml(employee.email)})
      </option>
    `).join("");
    const title = `${asset.brand || ""} ${asset.model || ""}`.trim() || type;

    showDetails(`
      <div class="flex items-start justify-between border-b border-slate-200 px-6 py-5">
        <div><p class="text-xs font-semibold uppercase tracking-wide text-blue-700">${escapeHtml(type)} asset history</p><h2 class="mt-1 text-2xl font-bold text-slate-900">${escapeHtml(title)}</h2></div>
        <button type="button" data-close-details class="rounded px-3 py-1 text-xl text-slate-500 hover:bg-slate-100" aria-label="Close">×</button>
      </div>
      <div class="space-y-6 p-6">
        <section class="grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
          <div><span class="text-xs text-slate-500">Asset number</span><p class="font-medium">${escapeHtml(asset.asset_number || "—")}</p></div>
          <div><span class="text-xs text-slate-500">Serial number</span><p class="font-mono font-medium">${escapeHtml(asset.serial_number)}</p></div>
          <div><span class="text-xs text-slate-500">Status</span><p class="font-medium">${escapeHtml(asset.status || "—")}</p></div>
          <div><span class="text-xs text-slate-500">Location</span><p class="font-medium">${escapeHtml(asset.location || "—")}</p></div>
          <div><span class="text-xs text-slate-500">Device type</span><p class="font-medium">${escapeHtml(asset.device_type || type)}</p></div>
          <div><span class="text-xs text-slate-500">Description</span><p class="font-medium">${escapeHtml(asset.description || "—")}</p></div>
          ${asset.hostname ? `<div><span class="text-xs text-slate-500">Hostname</span><p class="font-medium">${escapeHtml(asset.hostname)}</p></div>` : ""}
        </section>
        <section class="rounded-lg border border-slate-200 p-4">
          <h3 class="mb-2 text-lg font-semibold">${currentAssignment ? "Move or return resource" : "Assign resource"}</h3>
          ${currentAssignment ? `<p class="mb-3 text-sm text-slate-600">Currently assigned to <span class="font-semibold">${escapeHtml(currentAssignment.first_name)} ${escapeHtml(currentAssignment.last_name)}</span> (${escapeHtml(currentAssignment.employee_email)}).</p>` : ""}
          <form id="assetTransferForm" class="space-y-3">
            <label class="block text-sm font-medium text-slate-700" for="assetTransferEmployee">Assign to employee</label>
            <select id="assetTransferEmployee" name="employee_email" required class="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm">
              <option value="">${eligibleEmployees.length ? "Select an active employee" : "No other active employees available"}</option>${employeeOptions}
            </select>
            <label class="block text-sm font-medium text-slate-700" for="assetTransferNotes">Notes (optional)</label>
            <textarea id="assetTransferNotes" name="notes" rows="2" class="w-full rounded-lg border border-slate-300 p-2 text-sm"></textarea>
            <div class="flex flex-wrap gap-2">
              <button type="submit" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">${currentAssignment ? "Move resource" : "Assign resource"}</button>
              ${currentAssignment ? `<button type="button" id="returnAssetButton" class="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">Return to inventory</button>` : ""}
            </div>
            <p id="assetTransferMessage" class="hidden text-sm" role="status"></p>
          </form>
        </section>
        <section>
          <h3 class="mb-2 text-lg font-semibold">Assignment history</h3>
          <div class="overflow-x-auto rounded-lg border border-slate-200">
            <table class="w-full min-w-[640px] text-left text-sm">
              <thead class="bg-slate-50 text-xs uppercase text-slate-500"><tr><th class="px-3 py-2">Assigned to</th><th class="px-3 py-2">Department</th><th class="px-3 py-2">Issued</th><th class="px-3 py-2">Returned</th><th class="px-3 py-2">Notes</th></tr></thead>
              <tbody>${historyRows}</tbody>
            </table>
          </div>
        </section>
      </div>
    `);

    document.getElementById("assetTransferForm").addEventListener("submit", event => {
      event.preventDefault();
      saveAssetAssignment(type, serialNumber, document.getElementById("assetTransferEmployee").value, document.getElementById("assetTransferNotes").value);
    });
    document.getElementById("returnAssetButton")?.addEventListener("click", () => {
      if (confirm(`Return "${title}" (S/N: ${serialNumber}) to available inventory? This ends its current assignment.`)) {
        saveAssetAssignment(type, serialNumber, "");
      }
    });
  } catch (error) {
    showDetails(`<div class="p-8"><button type="button" data-close-details class="float-right text-xl">×</button><p class="font-medium text-rose-700">Could not load asset details: ${escapeHtml(error.message)}</p></div>`);
  }
}

async function saveAssetAssignment(type, serialNumber, employeeEmail, notes = "") {
  const form = document.getElementById("assetTransferForm");
  if (form?.dataset.submitting === "true") return;
  if (form) form.dataset.submitting = "true";
  const actionButtons = form?.querySelectorAll('button[type="submit"], #returnAssetButton') || [];
  actionButtons.forEach(button => {
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
  });
  const message = document.getElementById("assetTransferMessage");
  if (message) {
    message.classList.remove("hidden", "text-rose-700");
    message.classList.add("text-slate-600");
    message.textContent = "Saving assignment…";
  }

  try {
    const response = await fetch("/api/views/assets/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, serial_number: serialNumber, employee_email: employeeEmail || null, notes })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
    document.dispatchEvent(new CustomEvent("asset-assignment-changed", { detail: { type, serialNumber } }));
    await openAssetDetails(type, serialNumber);
  } catch (error) {
    if (message) {
      message.classList.remove("text-slate-600");
      message.classList.add("text-rose-700");
      message.textContent = `Could not save assignment: ${error.message}`;
    }
  } finally {
    if (form) form.dataset.submitting = "false";
    actionButtons.forEach(button => {
      button.disabled = false;
      button.removeAttribute("aria-busy");
    });
  }
}
