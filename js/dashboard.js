// Main dashboard controller
let dashboardData = null;
let currentCarpetType = 'karpet'; // Default to 'karpet' (Utama), can toggle to 'karpet_alt'

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initial Data Load
    await refreshDashboard();

    // 2. Event Listeners Setup
    setupEventListeners();
});

/**
 * Loads data, calculates metrics, renders UI elements and updates charts
 */
async function refreshDashboard() {
    dashboardData = await loadDashboardData();
    if (!dashboardData) {
        alert('Gagal memuatkan data dashboard.');
        return;
    }

    // Update UI Elements
    calculateAndRenderMetrics();
    renderDetailedTable();

    // Initialize/Update Charts
    initCharts(dashboardData, currentCarpetType);

    // Generate & Render Predictions (NEW section - doesn't touch existing charts)
    const predictions = generateAllPredictions(dashboardData.jualan, dashboardData.resit, currentCarpetType, 3);
    renderPredictionPanel(predictions, dashboardData.months);
}

/**
 * Calculates sum, average, growth and renders KPI numbers
 */
function calculateAndRenderMetrics() {
    const jualan = dashboardData.jualan;
    const resit = dashboardData.resit;
    const months = dashboardData.months;

    // Helper: Sum an array
    const sum = arr => arr.reduce((a, b) => a + b, 0);

    // 1. Calculate Total Sales
    const totalSales =
        sum(jualan[currentCarpetType]) +
        sum(jualan.kasut) +
        sum(jualan.langsir) +
        sum(jualan.sofa) +
        sum(jualan.tilam);

    // 2. Calculate Total Receipts
    const totalReceipts =
        sum(resit.karpet) +
        sum(resit.kasut) +
        sum(resit.langsir) +
        sum(resit.sofa_tilam);

    // 3. Average Order Value (AOV)
    const aov = totalReceipts > 0 ? (totalSales / totalReceipts) : 0;

    // 4. Calculate Month-over-Month Growth (comparing the last month to the previous one)
    let growthRate = 0;
    if (months.length >= 2) {
        const lastIdx = months.length - 1;
        const prevIdx = lastIdx - 1;

        const getMonthlySales = (idx) =>
            jualan[currentCarpetType][idx] +
            jualan.kasut[idx] +
            jualan.langsir[idx] +
            jualan.sofa[idx] +
            jualan.tilam[idx];

        const lastMonthSales = getMonthlySales(lastIdx);
        const prevMonthSales = getMonthlySales(prevIdx);

        if (prevMonthSales > 0) {
            growthRate = ((lastMonthSales - prevMonthSales) / prevMonthSales) * 100;
        }
    }

    // Render numbers in the HTML
    document.getElementById('kpiTotalSales').innerText = `RM ${totalSales.toLocaleString()}`;
    document.getElementById('kpiTotalReceipts').innerText = totalReceipts.toLocaleString();
    document.getElementById('kpiAOV').innerText = `RM ${aov.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const growthElement = document.getElementById('kpiGrowth');
    if (growthRate >= 0) {
        growthElement.innerHTML = `
            <span class="text-emerald-400 font-semibold flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                +${growthRate.toFixed(1)}% MoM
            </span>
        `;
    } else {
        growthElement.innerHTML = `
            <span class="text-rose-400 font-semibold flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"></path></svg>
                ${growthRate.toFixed(1)}% MoM
            </span>
        `;
    }
}

/**
 * Generates and renders rows in the data table
 */
function renderDetailedTable() {
    const tableBody = document.getElementById('salesTableBody');
    tableBody.innerHTML = ''; // Clear previous contents

    const months = dashboardData.months;
    const jualan = dashboardData.jualan;
    const resit = dashboardData.resit;

    const filterMonthVal = document.getElementById('filterMonth')?.value || 'ALL';
    const filterCategoryVal = document.getElementById('filterCategory')?.value || 'ALL';

    // We compile rows into flat data objects to easily map them
    let rows = [];

    months.forEach((month, idx) => {
        // Categories details
        const categories = [
            { id: 'karpet', name: 'Karpet', sales: jualan[currentCarpetType][idx], receipts: resit.karpet[idx], color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
            { id: 'kasut', name: 'Kasut', sales: jualan.kasut[idx], receipts: resit.kasut[idx], color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
            { id: 'langsir', name: 'Langsir', sales: jualan.langsir[idx], receipts: resit.langsir[idx], color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
            { id: 'sofa', name: 'Sofa', sales: jualan.sofa[idx], receipts: 'Kongsi', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
            { id: 'tilam', name: 'Tilam', sales: jualan.tilam[idx], receipts: 'Kongsi', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' }
        ];

        categories.forEach(cat => {
            // Handle shared receipts description
            let receiptsDisplay = cat.receipts;
            if (cat.receipts === 'Kongsi') {
                receiptsDisplay = `${resit.sofa_tilam[idx]} (Sofa & Tilam)`;
            }

            rows.push({
                month: month,
                category: cat.name,
                sales: cat.sales,
                receipts: receiptsDisplay,
                colorClass: cat.color
            });
        });
    });

    // Apply filtering
    if (filterMonthVal !== 'ALL') {
        rows = rows.filter(row => row.month === filterMonthVal);
    }
    if (filterCategoryVal !== 'ALL') {
        rows = rows.filter(row => row.category === filterCategoryVal);
    }

    // Populate rows
    rows.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors';
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">${row.month}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span class="px-2.5 py-1 text-xs font-semibold rounded-full border ${row.colorClass}">
                    ${row.category}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-100 font-semibold">RM ${row.sales.toLocaleString()}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-300">${row.receipts}</td>
        `;
        tableBody.appendChild(tr);
    });
}

/**
 * Attaches event listeners for toggle selectors, import buttons, and sync inputs
 */
function setupEventListeners() {
    // 1. Carpet Data Type Toggle
    const toggleCarpet = document.getElementById('carpetTypeToggle');
    if (toggleCarpet) {
        toggleCarpet.addEventListener('change', (e) => {
            currentCarpetType = e.target.checked ? 'karpet_alt' : 'karpet';

            // Re-render
            calculateAndRenderMetrics();
            renderDetailedTable();
            initCharts(dashboardData, currentCarpetType);

            // Update predictions
            const pred = generateAllPredictions(dashboardData.jualan, dashboardData.resit, currentCarpetType, 3);
            renderPredictionPanel(pred, dashboardData.months);
        });
    }

    // 1.5 Filters Change Listeners
    const filterMonth = document.getElementById('filterMonth');
    if (filterMonth) {
        filterMonth.addEventListener('change', renderDetailedTable);
    }
    const filterCategory = document.getElementById('filterCategory');
    if (filterCategory) {
        filterCategory.addEventListener('change', renderDetailedTable);
    }

    // 2. Reset Data
    const btnReset = document.getElementById('btnReset');
    if (btnReset) {
        btnReset.addEventListener('click', async () => {
            if (confirm('Adakah anda pasti untuk menetapkan semula data dashboard ke tetapan asal (PDF asli)?')) {
                dashboardData = await resetToDefault();
                currentCarpetType = 'karpet';
                if (toggleCarpet) toggleCarpet.checked = false;
                if (filterMonth) filterMonth.value = 'ALL';
                if (filterCategory) filterCategory.value = 'ALL';

                // Refresh views
                calculateAndRenderMetrics();
                renderDetailedTable();
                initCharts(dashboardData, currentCarpetType);

                // Update predictions
                const predReset = generateAllPredictions(dashboardData.jualan, dashboardData.resit, currentCarpetType, 3);
                renderPredictionPanel(predReset, dashboardData.months);

                alert('Data telah ditetapkan semula!');
            }
        });
    }

    // 3. Import JSON file
    const fileInput = document.getElementById('importFileInput');
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const newData = await processImportFile(file);
                saveDashboardData(newData);
                dashboardData = newData;

                // Refresh UI
                calculateAndRenderMetrics();
                renderDetailedTable();
                initCharts(dashboardData, currentCarpetType);

                // Update predictions
                const predImport = generateAllPredictions(dashboardData.jualan, dashboardData.resit, currentCarpetType, 3);
                renderPredictionPanel(predImport, dashboardData.months);

                alert('Data import berjaya dimuatkan!');
            } catch (err) {
                alert(`Gagal import: ${err.message}`);
            }
            fileInput.value = ''; // Clear value
        });
    }

    // 4. GitHub Sync
    const btnSync = document.getElementById('btnSyncGitHub');
    if (btnSync) {
        btnSync.addEventListener('click', async () => {
            const token = document.getElementById('ghToken').value.trim();
            const repo = document.getElementById('ghRepo').value.trim();
            const path = document.getElementById('ghPath').value.trim() || 'bisnes-servis-dashboard/data/sample-data.json';

            if (!token || !repo) {
                alert('Sila isi GitHub Personal Access Token dan Repositori.');
                return;
            }

            btnSync.disabled = true;
            btnSync.innerText = 'Menyegerakkan...';

            try {
                await syncToGitHub(dashboardData, token, repo, path);
                alert('Data berjaya disegerakkan ke GitHub!');
            } catch (err) {
                alert(`Gagal menyegerakkan ke GitHub: ${err.message}`);
            } finally {
                btnSync.disabled = false;
                btnSync.innerText = 'Segerakkan Sekarang';
            }
        });
    }
}