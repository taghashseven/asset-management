import { CONFIG } from "./app.js";

export async function render(container) {
  container.innerHTML = `
    <div class="flex items-center justify-center p-12 text-slate-400 font-medium">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
      Loading dashboard overview statistics...
    </div>
  `;

  try {
    // Fetch datasets concurrently
    const [employeesRes, userResourcesRes, printersRes, formsRes] = await Promise.all([
      fetch(CONFIG.employees.endpoint).then((res) => res.json()).catch(() => []),
      fetch(CONFIG["user-resources"].endpoint).then((res) => res.json()).catch(() => []),
      fetch(CONFIG["printers-list"].endpoint).then((res) => res.json()).catch(() => []),
      fetch(CONFIG.forms.endpoint).then((res) => res.json()).catch(() => [])
    ]);

    // 1. Total Employees
    const totalEmployees = employeesRes.length;

    // 2. Employees Without Assets
    const employeesWithoutAssets = userResourcesRes.filter((user) => {
      const hasComputers = Array.isArray(user.computers) && user.computers.length > 0;
      const hasMonitors = Array.isArray(user.monitors) && user.monitors.length > 0;
      return !hasComputers && !hasMonitors;
    }).length;

    // 3. Employees Not Active
    const inactiveEmployees = employeesRes.filter(
      (emp) => String(emp.active).toLowerCase() === "false" || emp.active === false || emp.active === 0
    ).length;

    // 4. Active Printers
    const activePrinters = printersRes.filter(
      (p) => String(p.status).toLowerCase() === "active" || String(p.status).toLowerCase() === "online"
    ).length;

    // 5. Total Forms
    const totalForms = formsRes.length;

    // Render Dashboard UI
    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-slate-800">System Overview</h2>
            <p class="text-slate-500 text-sm">Real-time metrics and system statistics summary</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          <!-- Card 1: Total Employees -->
          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div class="flex justify-between items-start">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Total Employees</span>
              <span class="p-2 bg-blue-50 text-blue-600 rounded-lg text-lg">👥</span>
            </div>
            <div class="mt-4">
              <div class="text-3xl font-extrabold text-slate-800">${totalEmployees}</div>
              <p class="text-xs text-slate-400 mt-1">Registered in system</p>
            </div>
          </div>

          <!-- Card 2: Employees Without Assets -->
          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div class="flex justify-between items-start">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-400">No Assets Assigned</span>
              <span class="p-2 bg-amber-50 text-amber-600 rounded-lg text-lg">📦</span>
            </div>
            <div class="mt-4">
              <div class="text-3xl font-extrabold text-slate-800">${employeesWithoutAssets}</div>
              <p class="text-xs text-slate-400 mt-1">Without PC or Monitor</p>
            </div>
          </div>

          <!-- Card 3: Employees Not Active -->
          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div class="flex justify-between items-start">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Inactive Employees</span>
              <span class="p-2 bg-rose-50 text-rose-600 rounded-lg text-lg">🚫</span>
            </div>
            <div class="mt-4">
              <div class="text-3xl font-extrabold text-slate-800">${inactiveEmployees}</div>
              <p class="text-xs text-slate-400 mt-1">Status set to inactive</p>
            </div>
          </div>

          <!-- Card 4: Active Printers -->
          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div class="flex justify-between items-start">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Active Printers</span>
              <span class="p-2 bg-emerald-50 text-emerald-600 rounded-lg text-lg">🖨️</span>
            </div>
            <div class="mt-4">
              <div class="text-3xl font-extrabold text-slate-800">${activePrinters}</div>
              <p class="text-xs text-slate-400 mt-1">Online & operational</p>
            </div>
          </div>

          <!-- Card 5: Forms -->
          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div class="flex justify-between items-start">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Total Forms</span>
              <span class="p-2 bg-indigo-50 text-indigo-600 rounded-lg text-lg">📄</span>
            </div>
            <div class="mt-4">
              <div class="text-3xl font-extrabold text-slate-800">${totalForms}</div>
              <p class="text-xs text-slate-400 mt-1">Submitted & archived</p>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    console.error("Dashboard overview render error:", err);
    container.innerHTML = `
      <div class="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-medium text-sm">
        Failed to load dashboard overview data.
      </div>
    `;
  }
}