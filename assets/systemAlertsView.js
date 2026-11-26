import { openAssetDetails, openEmployeeDetails } from "./recordDetails.js";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

export async function render(container) {
  container.innerHTML = `<div class="p-8 text-slate-500">Checking system records…</div>`;

  try {
    const response = await fetch("/api/views/alerts");
    const alerts = await response.json();
    if (!response.ok) throw new Error(alerts.error || `HTTP ${response.status}`);

    const rows = alerts.map(alert => {
      const isInactiveEmployee = alert.alert_type === "inactive_employee_assignment";
      const message = isInactiveEmployee
        ? "Assigned to an inactive employee"
        : alert.employee_email
          ? `Active assignment but asset status is “${alert.asset_status}”`
          : `Status is “${alert.asset_status}” but no active assignment exists`;
      const employee = alert.employee_email
        ? `<button type="button" data-alert-employee="${escapeHtml(alert.employee_id)}" class="text-left text-blue-700 hover:underline">${escapeHtml(alert.first_name)} ${escapeHtml(alert.last_name)}<span class="block text-xs text-slate-500">${escapeHtml(alert.employee_email)}</span></button>`
        : `<span class="text-slate-400">No active assignee</span>`;

      return `
        <tr class="border-t border-slate-100">
          <td class="px-4 py-3"><span class="rounded-full px-2 py-1 text-xs font-semibold ${alert.severity === "high" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"}">${alert.severity === "high" ? "Action needed" : "Check status"}</span><p class="mt-1 text-sm">${message}</p></td>
          <td class="px-4 py-3">${employee}</td>
          <td class="px-4 py-3"><button type="button" data-alert-asset="${escapeHtml(alert.resource_type)}" data-serial-number="${escapeHtml(alert.serial_number)}" class="text-left text-blue-700 hover:underline">${escapeHtml(alert.brand)} ${escapeHtml(alert.model)}<span class="block font-mono text-xs text-slate-500">${escapeHtml(alert.serial_number)}</span></button></td>
          <td class="px-4 py-3 text-sm">${escapeHtml(alert.asset_status || "—")}</td>
        </tr>
      `;
    }).join("");

    container.innerHTML = `
      <div class="mx-auto max-w-6xl space-y-5">
        <header class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-sm font-semibold uppercase tracking-wide text-blue-700">System health</p>
            <h1 class="text-2xl font-bold text-slate-900">System alerts</h1>
            <p class="mt-1 text-sm text-slate-600">Flags assigned resources linked to inactive employees and mismatches between assignment records and asset status.</p>
          </div>
          <div class="rounded-xl border ${alerts.length ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-800"} px-5 py-3">
            <span class="text-2xl font-bold">${alerts.length}</span>
            <span class="ml-1 text-sm">${alerts.length === 1 ? "issue found" : "issues found"}</span>
          </div>
        </header>
        ${alerts.length
          ? `<div class="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"><table class="w-full min-w-[760px] text-left"><thead class="bg-slate-50 text-xs uppercase text-slate-500"><tr><th class="px-4 py-3">Issue</th><th class="px-4 py-3">Employee</th><th class="px-4 py-3">Resource</th><th class="px-4 py-3">Recorded status</th></tr></thead><tbody>${rows}</tbody></table></div>`
          : `<div class="rounded-xl border border-emerald-200 bg-white p-8 text-center shadow-sm"><p class="text-lg font-semibold text-emerald-800">No issues found</p><p class="mt-1 text-sm text-slate-600">Current assignment and asset status records look consistent.</p></div>`
        }
      </div>
    `;

    container.onclick = event => {
      const employeeButton = event.target.closest("[data-alert-employee]");
      if (employeeButton) {
        openEmployeeDetails(employeeButton.dataset.alertEmployee);
        return;
      }

      const assetButton = event.target.closest("[data-alert-asset]");
      if (assetButton) {
        openAssetDetails(assetButton.dataset.alertAsset, assetButton.dataset.serialNumber);
      }
    };
  } catch (error) {
    container.innerHTML = `<div class="rounded-xl border border-rose-200 bg-white p-6 text-rose-700">Could not check system alerts: ${escapeHtml(error.message)}</div>`;
  }
}
