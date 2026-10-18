import { CONFIG } from "./app.js";



export async function render(container) {
  container.innerHTML = `
    <div class="flex items-center justify-center p-16 text-slate-400 font-medium">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
      Mapping database entity relationships...
    </div>
  `;

  try {
    const res = await fetch("/api/database-api/graph-overview");
    if (!res.ok) throw new Error("Failed to load graph overview");
    const graphData = await res.json();

    // Render Graph Navigation Shell
    container.innerHTML = `
      <div class="space-y-6 max-w-7xl mx-auto">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h2 class="text-2xl font-bold text-slate-800 tracking-tight">Entity Relationship Explorer</h2>
            <p class="text-slate-500 text-sm">Traverse node connections across workforce users, computers, monitors, and peripherals</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
              Nodes: <strong class="text-slate-900">${graphData.summary.totalNodes}</strong>
            </span>
            <span class="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
              Links: <strong class="text-slate-900">${graphData.summary.totalConnections}</strong>
            </span>
          </div>
        </div>

        <!-- Filter Controls -->
        <div class="flex flex-wrap gap-2" id="graph-filters">
          <button data-filter="all" class="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition">All Nodes</button>
          <button data-filter="inactive-emp" class="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition">Inactive Employees</button>
          <button data-filter="computers" class="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition">Computer Assets</button>
          <button data-filter="monitors" class="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition">Monitors</button>
          <button data-filter="printers" class="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition">Printers</button>
        </div>

        <!-- Two Column Explorer Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Node List Column -->
          <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm h-[600px] flex flex-col">
            <div class="mb-3">
              <input type="text" id="node-search" placeholder="Search node by name, email, or serial..." 
                class="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div id="node-list" class="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              <!-- Dynamically populated -->
            </div>
          </div>

          <!-- Relationship Drilldown Canvas -->
          <div class="lg:col-span-2 bg-slate-900 rounded-xl p-6 shadow-sm flex flex-col justify-between text-white relative min-h-[600px]" id="graph-inspector">
            <div id="inspector-default" class="m-auto text-center space-y-2">
              <div class="text-4xl">🕸️</div>
              <p class="text-slate-400 text-sm font-medium">Select any node on the left to inspect its multi-directional connections</p>
            </div>
            <div id="inspector-content" class="hidden space-y-6 w-full">
              <!-- Dynamically rendered connection map -->
            </div>
          </div>

        </div>
      </div>
    `;

    // Internal State Manager
    let currentNodes = graphData.nodes;

    const renderNodeList = (nodesToRender) => {
      const listContainer = document.getElementById("node-list");
      if (nodesToRender.length === 0) {
        listContainer.innerHTML = `<div class="p-4 text-center text-xs text-slate-400">No matching entities found.</div>`;
        return;
      }

      listContainer.innerHTML = nodesToRender.map(node => {
        const badgeColor = 
          node.type === "Employee" ? (node.status === "Inactive" ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700") :
          node.type === "Computer" ? "bg-indigo-100 text-indigo-700" :
          node.type === "Monitor" ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700";

        return `
          <div data-id="${node.id}" class="node-card p-3 rounded-lg border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition flex items-center justify-between">
            <div>
              <div class="text-xs font-bold text-slate-800">${node.label}</div>
              <div class="text-[11px] text-slate-400 capitalize">${node.type} • ${node.id}</div>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${badgeColor}">${node.status}</span>
          </div>
        `;
      }).join("");

      // Bind Click Handlers
      document.querySelectorAll(".node-card").forEach(card => {
        card.addEventListener("click", () => {
          const nodeId = card.getAttribute("data-id");
          inspectNode(nodeId, graphData);
        });
      });
    };

    // Deep Node Inspector
    const inspectNode = (nodeId, data) => {
      const selectedNode = data.nodes.find(n => n.id === nodeId);
      if (!selectedNode) return;

      const defaultView = document.getElementById("inspector-default");
      const content = document.getElementById("inspector-content");
      defaultView.classList.add("hidden");
      content.classList.remove("hidden");

      // Find direct connections (where node is source OR target)
      const outgoing = data.links.filter(l => l.source === nodeId);
      const incoming = data.links.filter(l => l.target === nodeId);

      content.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wider">${selectedNode.type}</span>
            <h3 class="text-xl font-bold text-white mt-1">${selectedNode.label}</h3>
            <p class="text-xs text-slate-400">Node ID: ${selectedNode.id}</p>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-semibold ${selectedNode.status === 'Inactive' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}">
            ${selectedNode.status}
          </span>
        </div>

        <!-- Connected Nodes Graph Traversal -->
        <div class="space-y-4">
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Directly Linked Connections (${outgoing.length + incoming.length})</h4>
          
          <div class="grid grid-cols-1 gap-3 max-h-[350px] overflow-y-auto pr-1">
            ${
              outgoing.concat(incoming).length === 0
                ? `<div class="p-4 bg-slate-800/50 rounded-lg text-slate-400 text-xs italic">No active assignment links found for this entity.</div>`
                : outgoing.concat(incoming).map(link => {
                    const isOutgoing = link.source === nodeId;
                    const connectedId = isOutgoing ? link.target : link.source;
                    const connectedNode = data.nodes.find(n => n.id === connectedId);

                    return `
                      <div class="p-3 bg-slate-800 border border-slate-700/60 rounded-lg flex items-center justify-between hover:border-slate-500 transition">
                        <div class="flex items-center space-x-3">
                          <span class="text-xs font-mono px-2 py-1 bg-slate-900 text-blue-400 rounded">${link.relationship}</span>
                          <div>
                            <div class="text-xs font-bold text-slate-200">${connectedNode ? connectedNode.label : connectedId}</div>
                            <div class="text-[10px] text-slate-400">${connectedNode ? connectedNode.type : 'Entity'}</div>
                          </div>
                        </div>
                        <button onclick="document.querySelector('[data-id=\\'${connectedId}\\']')?.click()" class="text-xs text-blue-400 hover:text-blue-300 font-semibold underline">Traverse →</button>
                      </div>
                    `;
                  }).join("")
            }
          </div>
        </div>
      `;
    };

    // Initial render
    renderNodeList(currentNodes);

    // Event Listeners for Filters
    document.getElementById("graph-filters").addEventListener("click", (e) => {
      if (e.target.tagName !== "BUTTON") return;
      
      const filter = e.target.getAttribute("data-filter");
      
      // Update UI button state
      document.querySelectorAll("#graph-filters button").forEach(b => {
        b.className = "px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition";
      });
      e.target.className = "px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition";

      // Filter Nodes
      if (filter === "all") currentNodes = graphData.nodes;
      else if (filter === "inactive-emp") currentNodes = graphData.nodes.filter(n => n.type === "Employee" && n.status === "Inactive");
      else if (filter === "computers") currentNodes = graphData.nodes.filter(n => n.type === "Computer");
      else if (filter === "monitors") currentNodes = graphData.nodes.filter(n => n.type === "Monitor");
      else if (filter === "printers") currentNodes = graphData.nodes.filter(n => n.type === "Printer");

      renderNodeList(currentNodes);
    });

    // Search input filtering
    document.getElementById("node-search").addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase();
      const filtered = currentNodes.filter(n => 
        n.label.toLowerCase().includes(query) || 
        n.id.toLowerCase().includes(query)
      );
      renderNodeList(filtered);
    });

  } catch (err) {
    console.error("Graph overview render error:", err);
    container.innerHTML = `
      <div class="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-medium text-sm">
        Failed to load database relationship graph. Verify server connectivity.
      </div>
    `;
  }
}