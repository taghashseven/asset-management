let charts = [];

const palette = {
  blue: "#2563eb",
  teal: "#0d9488",
  violet: "#7c3aed",
  amber: "#d97706",
  rose: "#e11d48",
  slate: "#64748b"
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function chartEntries(values = {}) {
  return Object.entries(values).sort(([labelA], [labelB]) => {
    if (labelA === "Unknown") return 1;
    if (labelB === "Unknown") return -1;
    const generationA = Number(labelA.match(/^Gen (\d+)$/)?.[1]);
    const generationB = Number(labelB.match(/^Gen (\d+)$/)?.[1]);
    if (generationA && generationB) return generationA - generationB;
    return labelA.localeCompare(labelB, undefined, { numeric: true, sensitivity: "base" });
  });
}

function chartCard(title, subtitle, chartId) {
  return `
    <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="mb-4">
        <h3 class="font-semibold text-slate-900">${title}</h3>
        <p class="mt-1 text-xs text-slate-500">${subtitle}</p>
      </div>
      <div class="relative h-64"><canvas id="${chartId}" aria-label="${title}" role="img"></canvas></div>
    </article>
  `;
}

function metricCard(label, value, caption, color) {
  const accentColor = {
    blue: "#2563eb",
    teal: "#0d9488",
    violet: "#7c3aed",
    amber: "#d97706"
  }[color];
  return `
    <article class="rounded-xl border border-slate-200 border-t-4 bg-white p-5 shadow-sm" style="border-top-color: ${accentColor}">
      <p class="text-sm font-medium text-slate-500">${label}</p>
      <p class="mt-2 text-3xl font-bold tracking-tight text-slate-900">${formatNumber(value)}</p>
      <p class="mt-1 text-xs text-slate-500">${caption}</p>
    </article>
  `;
}

function createBarChart(id, entries, color, horizontal = true) {
  const canvas = document.getElementById(id);
  if (!canvas || !window.Chart) return;
  const chart = new window.Chart(canvas, {
    type: "bar",
    data: {
      labels: entries.map(([label]) => label),
      datasets: [{
        data: entries.map(([, count]) => count),
        backgroundColor: color,
        borderRadius: 5,
        maxBarThickness: 28
      }]
    },
    options: {
      indexAxis: horizontal ? "y" : "x",
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true }
      },
      scales: {
        x: { beginAtZero: true, grid: { color: "#f1f5f9" }, ticks: { precision: 0, color: "#64748b" } },
        y: { beginAtZero: true, grid: { display: !horizontal }, ticks: { precision: 0, color: "#64748b" } }
      }
    }
  });
  charts.push(chart);
}

function createStorageChart(values) {
  const canvas = document.getElementById("computerStorageChart");
  if (!canvas || !window.Chart) return;
  const entries = chartEntries(values);
  const chart = new window.Chart(canvas, {
    type: "doughnut",
    data: {
      labels: entries.map(([label]) => label),
      datasets: [{
        data: entries.map(([, count]) => count),
        backgroundColor: [palette.teal, palette.amber, "#cbd5e1"],
        borderColor: "#ffffff",
        borderWidth: 3
      }]
    },
    options: {
      maintainAspectRatio: false,
      responsive: true,
      cutout: "64%",
      plugins: {
        legend: { position: "bottom", labels: { usePointStyle: true, padding: 18, color: "#475569" } }
      }
    }
  });
  charts.push(chart);
}

export async function render(container) {
  charts.forEach(chart => chart.destroy());
  charts = [];
  container.innerHTML = `<div class="rounded-xl border border-slate-200 bg-white p-8 text-slate-500">Loading dashboard data…</div>`;

  try {
    const response = await fetch("/api/database-api/dashboard/overview");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    renderDashboard(container, data);
  } catch (error) {
    container.innerHTML = `
      <div class="rounded-xl border border-rose-200 bg-white p-6 text-rose-700">
        <h2 class="font-semibold">Dashboard data could not be loaded</h2>
        <p class="mt-1 text-sm">${escapeHtml(error.message)}</p>
      </div>
    `;
  }
}

function renderDashboard(container, data) {
  const { computers, employees, monitors, printers, errors, systemAlerts } = data;
  const topPrinter = printers.mostUsed;
  const lowToners = printers.lowToners || [];
  const multipleMonitorEmployees = employees.multipleMonitorList || [];
  const errorRows = errors.recent.length
    ? errors.recent.map(error => `
        <tr class="border-t border-slate-100">
          <td class="whitespace-nowrap px-4 py-3 text-xs text-slate-500">${escapeHtml(error.created_at)}</td>
          <td class="px-4 py-3 text-sm font-medium text-slate-800">${escapeHtml(error.printer_name)}</td>
          <td class="px-4 py-3 text-sm text-slate-600">${escapeHtml(error.description || "No details recorded")}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="3" class="px-4 py-8 text-center text-sm text-slate-500">No printer error events have been recorded.</td></tr>`;
  const monitorEmployeeRows = multipleMonitorEmployees.length
    ? multipleMonitorEmployees.slice(0, 8).map(employee => `
        <li class="flex items-center justify-between gap-3 border-t border-slate-100 py-3 first:border-0">
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-slate-800">${escapeHtml(employee.first_name)} ${escapeHtml(employee.last_name)}</p>
            <p class="truncate text-xs text-slate-500">${escapeHtml(employee.department || "No department")}</p>
          </div>
          <span class="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">${employee.monitor_count} monitors</span>
        </li>
      `).join("")
    : `<li class="py-6 text-center text-sm text-slate-500">No active employees have multiple monitors assigned.</li>`;
  const lowTonerRows = lowToners.length
    ? lowToners.slice(0, 6).map(toner => `
        <li class="flex items-center justify-between gap-3 border-t border-slate-100 py-3 first:border-0">
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-slate-800">${escapeHtml(toner.printer_name)}</p>
            <p class="truncate text-xs text-slate-500">${escapeHtml(toner.toner_code)}</p>
          </div>
          <span class="shrink-0 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">${toner.toner_level}%</span>
        </li>
      `).join("")
    : `<li class="py-6 text-center text-sm text-slate-500">No toner readings below 20%.</li>`;

  container.innerHTML = `
    <div class="mx-auto max-w-[1440px] space-y-8 pb-8">
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-sm font-semibold uppercase tracking-wide text-blue-700">Asset management</p>
          <h1 class="mt-1 text-3xl font-bold tracking-tight text-slate-900">Operations dashboard</h1>
          <p class="mt-2 text-sm text-slate-500">A live overview of inventory, people, printer usage, and system health.</p>
        </div>
        <button id="refreshDashboard" type="button" class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
          Refresh data
        </button>
      </header>

      <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        ${metricCard("Computers", computers.total, `${formatNumber(computers.assigned)} assigned · ${formatNumber(computers.available)} available`, "blue")}
        ${metricCard("Active employees", employees.active, `${formatNumber(employees.inactive)} inactive of ${formatNumber(employees.total)} total`, "teal")}
        ${metricCard("Monitors", monitors.total, `${formatNumber(monitors.assigned)} currently assigned`, "violet")}
        ${metricCard("Printers", printers.total, `${formatNumber(printers.lowToners.length)} toner readings below 20%`, "amber")}
      </section>

      <section>
        <div class="mb-4">
          <h2 class="text-xl font-bold text-slate-900">Computer inventory</h2>
          <p class="mt-1 text-sm text-slate-500">Hardware mix and resource profile inferred from recorded specifications.</p>
        </div>
        <div class="grid gap-4 xl:grid-cols-3">
          ${chartCard("CPU generation", "Detected from the processor details in computer specs.", "computerGenerationChart")}
          ${chartCard("Installed RAM", "Memory sizes parsed from recorded computer specs.", "computerRamChart")}
          ${chartCard("Storage type", "SSD/HDD classification from the recorded drive details.", "computerStorageChart")}
        </div>
      </section>

      <section>
        <div class="mb-4">
          <h2 class="text-xl font-bold text-slate-900">Printer operations</h2>
          <p class="mt-1 text-sm text-slate-500">Usage is based on lifetime page counters; toner usage comes from recorded cartridge lifecycles.</p>
        </div>
        <div class="mb-4 grid gap-4 md:grid-cols-3">
          <article class="rounded-xl border border-rose-200 bg-rose-50 p-5">
            <p class="text-sm font-medium text-rose-800">Toners below 20%</p>
            <p class="mt-2 text-3xl font-bold text-rose-900">${formatNumber(lowToners.length)}</p>
            <p class="mt-1 text-xs text-rose-700">Latest valid reading per toner</p>
          </article>
          <article class="rounded-xl border border-blue-200 bg-blue-50 p-5">
            <p class="text-sm font-medium text-blue-800">Most-used printer</p>
            <p class="mt-2 truncate text-xl font-bold text-blue-950">${topPrinter ? escapeHtml(topPrinter.printer_name) : "No printer data"}</p>
            <p class="mt-1 text-xs text-blue-700">${topPrinter ? `${formatNumber(topPrinter.page_count)} lifetime pages` : "No page counts recorded"}</p>
          </article>
          <article class="rounded-xl border border-teal-200 bg-teal-50 p-5">
            <p class="text-sm font-medium text-teal-800">Average pages per toner</p>
            <p class="mt-2 text-3xl font-bold text-teal-950">${printers.averagePagesPerToner === null ? "—" : formatNumber(printers.averagePagesPerToner)}</p>
            <p class="mt-1 text-xs text-teal-700">Across ${formatNumber(printers.tonerHistoryCount)} recorded cartridge lifecycles</p>
          </article>
        </div>
        <div class="grid gap-4 xl:grid-cols-3">
          <div class="xl:col-span-2">${chartCard("Most-used printers", "Top printers by lifetime page count.", "printerUsageChart")}</div>
          <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 class="font-semibold text-slate-900">Low toner readings</h3>
            <p class="mt-1 text-xs text-slate-500">Cartridges with a latest reading below 20%.</p>
            <ul class="mt-3">${lowTonerRows}</ul>
          </article>
        </div>
      </section>

      <section class="grid gap-4 xl:grid-cols-2">
        <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-bold text-slate-900">Employees with multiple monitors</h2>
              <p class="mt-1 text-sm text-slate-500">Active employees currently assigned two or more monitors.</p>
            </div>
            <span class="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">${formatNumber(employees.withMultipleMonitors)}</span>
          </div>
          <ul class="mt-3">${monitorEmployeeRows}</ul>
        </article>
        <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-bold text-slate-900">System inventory alerts</h2>
              <p class="mt-1 text-sm text-slate-500">Assignment or asset status issues needing review.</p>
            </div>
            <span class="rounded-full ${systemAlerts.total ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"} px-3 py-1 text-sm font-bold">${formatNumber(systemAlerts.total)}</span>
          </div>
          <div class="mt-5 grid grid-cols-2 gap-3">
            <div class="rounded-lg bg-rose-50 p-4"><p class="text-xs font-medium text-rose-700">High priority</p><p class="mt-1 text-2xl font-bold text-rose-900">${formatNumber(systemAlerts.high)}</p></div>
            <div class="rounded-lg bg-slate-50 p-4"><p class="text-xs font-medium text-slate-600">Other checks</p><p class="mt-1 text-2xl font-bold text-slate-900">${formatNumber(systemAlerts.total - systemAlerts.high)}</p></div>
          </div>
          <p class="mt-4 text-xs text-slate-500">Open System Alerts from the sidebar to review and resolve records.</p>
        </article>
      </section>

      <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 class="text-lg font-bold text-slate-900">System error logs</h2>
            <p class="mt-1 text-sm text-slate-500">Most recent printer errors recorded by the system.</p>
          </div>
          <span class="rounded-full ${errors.total ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"} px-3 py-1 text-sm font-bold">${formatNumber(errors.total)} total</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-left">
            <thead class="bg-slate-50 text-xs uppercase text-slate-500"><tr><th class="px-4 py-3">Time</th><th class="px-4 py-3">Printer</th><th class="px-4 py-3">Details</th></tr></thead>
            <tbody>${errorRows}</tbody>
          </table>
        </div>
      </section>

      ${!window.Chart ? `<p class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Charts are unavailable because the chart library did not load. The summary metrics and tables are still available.</p>` : ""}
    </div>
  `;

  document.getElementById("refreshDashboard").addEventListener("click", () => render(container));
  createBarChart("computerGenerationChart", chartEntries(computers.byGeneration), palette.blue);
  createBarChart("computerRamChart", chartEntries(computers.byRam), palette.violet);
  createStorageChart(computers.byStorage);
  createBarChart("printerUsageChart", printers.usage.map(printer => [printer.printer_name, printer.page_count]), palette.teal);
}
