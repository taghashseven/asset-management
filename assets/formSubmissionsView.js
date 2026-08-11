export async function render(container, filteredData, currentPage, pageSize) {
    // 1. Fetch employee data for autocomplete
    let employees = [];
    try {
        const res = await fetch("/api/employees");
        if (res.ok) employees = await res.json();
    } catch (e) {
        console.warn("Could not fetch employees for autocomplete:", e);
    }

    // 2. Define Default Asset Items
    let allocationItems = [
        { id: "alloc_laptop", label: "Laptop / Desktop", checked: true },
        { id: "alloc_charger", label: "Charger / Power Pack", checked: true },
        { id: "alloc_bag", label: "Laptop Bag", checked: true },
        { id: "alloc_mouse", label: "External Mouse", checked: true },
        { id: "alloc_keyboard", label: "Keyboard", checked: true },
        { id: "alloc_monitor", label: "Monitor(s)", checked: true },
        { id: "alloc_dock", label: "Docking Station", checked: true },
        { id: "alloc_headset", label: "Headset", checked: true },
        { id: "alloc_phone", label: "Company Mobile Phone", checked: true },
        { id: "alloc_sim", label: "SIM Card", checked: true },
        { id: "alloc_ups", label: "UPS", checked: true }
    ];

    // 3. Render Form Workspace UI
    container.innerHTML = `
        <div class="max-w-5xl mx-auto bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0" id="generator-workspace">
            
            <!-- INTERFACE CONTROL PANEL (Hidden on Print) -->
            <div class="mb-6 p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4 print:hidden">
                <div class="flex flex-wrap gap-4 items-end justify-between border-b border-slate-200 pb-4">
                    <div class="space-y-1 flex-1 min-w-[240px]">
                        <label class="block text-xs font-bold text-slate-500 uppercase">Search & Auto-Fill Employee</label>
                        <select id="employee-picker" class="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500">
                            <option value="">-- Select an Employee --</option>
                            ${employees.map(emp => `
                                <option value="${emp.employee_id}" data-first="${emp.first_name}" data-last="${emp.last_name}">
                                    ${emp.first_name} ${emp.last_name} (${emp.department || 'No Dept'})
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div>
                        <button id="print-btn" class="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition flex items-center gap-2 shadow-sm">
                            🖨️ Print Asset Form
                        </button>
                    </div>
                </div>

                <!-- SELECT ITEMS & ADD CUSTOM ENTRIES -->
                <div class="space-y-3 text-xs">
                    <h4 class="font-bold text-slate-700 uppercase tracking-wider">Configure Allocation Items</h4>
                    <div class="max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2.5 space-y-1.5 bg-white" id="config-allocation-checklist">
                        <!-- Populated dynamically -->
                    </div>
                    <div class="flex gap-2 max-w-md">
                        <input type="text" id="new-allocation-name" placeholder="Add custom equipment..." class="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <button id="add-allocation-btn" class="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap">Add Item</button>
                    </div>
                </div>
            </div>

            <!-- PRINT FORM TARGET AREA -->
            <div id="printable-form-area" class="font-sans text-black p-2 text-xs leading-relaxed">
                
                <!-- DOCUMENT HEADER WITH COMPANY LOGO -->
                <div class="flex justify-between items-start mb-6 border-b-2 border-black pb-3">
                    <div class="text-left">
                        <h1 class="text-xl font-extrabold uppercase tracking-wider text-black">Cross Country Containers</h1>
                        <p class="text-[11px] font-bold text-black uppercase tracking-widest mt-0.5">Equipment & Asset Allocation Handover</p>
                        <p class="text-[9px] text-black font-semibold mt-0.5">Information Technology Department</p>
                    </div>
                    <!-- Right Corner Company Logo -->
                    <div class="w-32 h-14 border border-black rounded flex items-center justify-center p-1 bg-transparent">
                        <img id="company-logo" src="/public/assets/logo.jpg" alt="Cross Country" class="max-w-full max-h-full object-contain" onError="this.style.display='none'; document.getElementById('logo-placeholder').style.display='block';">
                        <span id="logo-placeholder" class="hidden text-center text-[10px] font-black uppercase text-black tracking-tighter leading-none">Cross Country<br>Containers</span>
                    </div>
                </div>

                <!-- RECIPIENT INFO GRID -->
                <div class="grid grid-cols-2 gap-4 mb-6 border border-black p-3 rounded">
                    <div>
                        <p class="font-bold text-[10px] uppercase text-black">Employee Name</p>
                        <input type="text" id="form-emp-name" placeholder="________________________________________" 
                               class="w-full border-b border-transparent hover:border-black focus:border-black focus:outline-none bg-transparent font-bold text-black py-0.5 print:placeholder-transparent">
                    </div>
                    <div>
                        <p class="font-bold text-[10px] uppercase text-black">Date Generated</p>
                        <input type="text" id="form-generated-date" value="${new Date().toLocaleDateString()}" 
                               class="w-full border-b border-transparent hover:border-black focus:border-black focus:outline-none bg-transparent font-bold text-black py-0.5">
                    </div>
                </div>

                <!-- TABLE LAYOUT -->
                <div class="mb-6">
                    <table class="w-full text-left border-collapse border border-black text-[11px] text-black">
                        <thead>
                            <tr class="bg-neutral-100 border-b border-black">
                                <th class="p-2 border-r border-black text-center w-[10%] font-bold">Assigned</th>
                                <th class="p-2 border-r border-black w-[20%] font-bold">Asset Description</th>
                                <th class="p-2 border-r border-black w-[45%] font-bold">Serial / Asset No.</th>
                                <th class="p-2 w-[25%] font-bold">Condition(Good/Fair/Damaged)</th>
                            </tr>
                        </thead>
                        <tbody id="allocation-table-body">
                            <!-- Populated dynamically -->
                        </tbody>
                    </table>
                </div>

                <!-- USER CONFIRMATION ACKNOWLEDGEMENT -->
                <div class="mt-6 border border-black p-3 rounded">
                    <h4 class="font-bold uppercase text-[10px] text-black mb-1">User Confirmation</h4>
                    <p class="text-[10px] leading-relaxed text-black">
                        I, <span class="font-bold underline" id="receipt-emp-name">____________________________________</span>, hereby confirm that I have received the above company equipment in good working condition and acknowledge responsibility for its proper care.
                    </p>
                    <div class="grid grid-cols-2 gap-4 mt-4 text-[10px] text-black">
                        <div>Employee Signature: ________________________</div>
                        <div>Date: ________________________</div>
                    </div>
                </div>

                <!-- VERTICAL IT SIGN-OFF BLOCK -->
                <div class="mt-6 pt-4 border-t border-black">
                    <div class="text-[10px] space-y-4 max-w-md text-black">
                        <div>
                            <h4 class="font-bold uppercase text-[10px] text-black">IT Confirmation</h4>
                            <p class="text-black font-medium">I hereby confirm that I have issued the above equipment and completed the handover setup for the employee.</p>
                        </div>
                        <div class="space-y-3 pt-1">
                            <div class="flex items-center">
                                <span class="w-24 font-bold">IT Officer:</span>
                                <span>________________________________________</span>
                            </div>
                            <div class="flex items-center">
                                <span class="w-24 font-bold">Signature:</span>
                                <span>________________________________________</span>
                            </div>
                            <div class="flex items-center">
                                <span class="w-24 font-bold">Date:</span>
                                <span>________________________________________</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <style>
            /* Ensure high-contrast solid black boundaries for crisp prints */
            #printable-form-area, #printable-form-area * {
                color: #000000 !important;
                border-color: #000000 !important;
            }
            @media print {
                body * {
                    visibility: hidden;
                }
                #generator-workspace, #generator-workspace * {
                    visibility: visible;
                }
                #generator-workspace {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                }
                .print\\:hidden, #toast-container, nav, header {
                    display: none !important;
                }
                input[type="text"] {
                    border: none !important;
                    background: transparent !important;
                    padding: 0 !important;
                    color: #000000 !important;
                }
                @page {
                    size: A4 portrait;
                    margin: 1.2cm 1cm;
                }
            }
        </style>
    `;

    // 4. Setup Selection Config Checklists
    function renderConfigurationChecklists() {
        const allocChecklist = document.getElementById("config-allocation-checklist");
        allocChecklist.innerHTML = allocationItems.map(item => `
            <label class="flex items-center gap-2 text-[11px] font-medium text-slate-700 cursor-pointer">
                <input type="checkbox" data-id="${item.id}" ${item.checked ? 'checked' : ''} class="alloc-cfg-chk rounded text-blue-600 focus:ring-0">
                <span>${item.label}</span>
            </label>
        `).join('');

        // Attach change listeners to checkboxes
        document.querySelectorAll(".alloc-cfg-chk").forEach(chk => {
            chk.addEventListener("change", (e) => {
                const target = allocationItems.find(i => i.id === e.target.dataset.id);
                if (target) target.checked = e.target.checked;
                renderLiveFormTables();
            });
        });
    }

    // 5. Populate Dynamic Table Rows
    function renderLiveFormTables() {
        const allocBody = document.getElementById("allocation-table-body");
        const visibleAllocations = allocationItems.filter(i => i.checked);
        
        if (visibleAllocations.length === 0) {
            allocBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center italic text-black text-[10px]">No equipment selected. Check boxes above to add items.</td></tr>`;
        } else {
            allocBody.innerHTML = visibleAllocations.map(item => `
                <tr class="border-b border-black">
                    <!-- Assigned Checkbox -->
                    <td class="p-2 border-r border-black text-center">
                        <input type="checkbox" class="w-4 h-4 border-black text-black focus:ring-0 cursor-pointer">
                    </td>
                    <!-- Asset Description -->
                    <td class="p-2 border-r border-black font-bold text-black">${item.label}</td>
                    <!-- Serial / Asset No. (Clean - no inline lines) -->
                    <td class="p-1 border-r border-black">
                        <input type="text" class="w-full text-[10px] bg-transparent border-none focus:outline-none py-1 px-1 text-black">
                    </td>
                    <!-- Condition (Clean - no inline lines) -->
                    <td class="p-1">
                        <input type="text" placeholder="Good / Fair / Damaged" class="w-full text-[10px] bg-transparent border-none focus:outline-none py-1 px-1 placeholder-neutral-400 print:placeholder-transparent text-black">
                    </td>
                </tr>
            `).join('');
        }
    }

    // Initial render call
    renderConfigurationChecklists();
    renderLiveFormTables();

    // 6. Action listener to add customized item
    document.getElementById("add-allocation-btn").addEventListener("click", () => {
        const input = document.getElementById("new-allocation-name");
        const val = input.value.trim();
        if (val) {
            const newItemId = "custom_alloc_" + Date.now();
            allocationItems.push({
                id: newItemId,
                label: val,
                checked: true
            });
            input.value = "";
            renderConfigurationChecklists();
            renderLiveFormTables();
        }
    });

    // 7. Interactive Employee Name Picker Match
    const picker = document.getElementById("employee-picker");
    const empNameInput = document.getElementById("form-emp-name");
    const receiptEmpLabel = document.getElementById("receipt-emp-name");

    picker.addEventListener("change", (e) => {
        const selectedOption = e.target.selectedOptions[0];
        if (selectedOption && selectedOption.value !== "") {
            const firstName = selectedOption.dataset.first;
            const lastName = selectedOption.dataset.last;
            const fullName = `${firstName} ${lastName}`;
            empNameInput.value = fullName;
            receiptEmpLabel.textContent = fullName;
        } else {
            empNameInput.value = "";
            receiptEmpLabel.textContent = "____________________________________";
        }
    });

    empNameInput.addEventListener("input", (e) => {
        receiptEmpLabel.textContent = e.target.value || "____________________________________";
    });

    document.getElementById("print-btn").addEventListener("click", () => {
        window.print();
    });
}