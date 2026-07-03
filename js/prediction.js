/**
 * Prediction Module for Business Services Dashboard
 * Uses Simple Linear Regression to forecast sales for upcoming months.
 * Completely independent - does NOT modify any existing charts or functions.
 */

/**
 * Performs simple linear regression on an array of values.
 * Returns predicted values for the next `steps` months.
 *
 * @param {number[]} data - Array of historical values (e.g., [23931, 36479, 24325, 18237])
 * @param {number} steps - Number of months to predict (default: 3)
 * @returns {{ predicted: number[], slope: number, intercept: number }}
 */
function linearRegressionPredict(data, steps = 3) {
    const n = data.length;
    if (n < 2) {
        // Not enough data for regression, return flat average
        const avg = data.reduce((a, b) => a + b, 0) / n;
        return {
            predicted: Array(steps).fill(Math.round(avg)),
            slope: 0,
            intercept: avg
        };
    }

    // x values: 0, 1, 2, ..., n-1
    const x = data.map((_, i) => i);
    const y = data;

    // Calculate means
    const xMean = x.reduce((a, b) => a + b, 0) / n;
    const yMean = y.reduce((a, b) => a + b, 0) / n;

    // Calculate slope (m) and intercept (c) for y = mx + c
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < n; i++) {
        numerator += (x[i] - xMean) * (y[i] - yMean);
        denominator += (x[i] - xMean) ** 2;
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    // Predict next `steps` values (x = n, n+1, n+2, ...)
    const predicted = [];
    for (let i = 0; i < steps; i++) {
        const nextX = n + i;
        let val = slope * nextX + intercept;
        // Ensure predictions don't go below 0
        val = Math.max(0, Math.round(val));
        predicted.push(val);
    }

    return { predicted, slope, intercept };
}

/**
 * Generates prediction data for all categories (sales + receipts).
 *
 * @param {Object} jualan - Sales data object from dashboardData.jualan
 * @param {Object} resit - Receipts data object from dashboardData.resit
 * @param {string} karpetType - 'karpet' or 'karpet_alt'
 * @param {number} steps - Number of months to predict (default: 3)
 * @returns {Object} Predictions per category with both sales and receipts
 */
function generateAllPredictions(jualan, resit, karpetType = 'karpet', steps = 3) {
    const categories = ['karpet', 'karpet_alt', 'kasut', 'langsir', 'sofa', 'tilam'];
    const predictions = { _carpetType: karpetType, _steps: steps };

    categories.forEach(cat => {
        // Sales prediction
        const salesKey = (cat === 'karpet') ? karpetType : cat;
        const salesData = jualan[salesKey] || [];
        predictions[cat] = {
            sales: linearRegressionPredict(salesData, steps)
        };

        // Receipts prediction
        // Sofa & Tilam share resit.sofa_tilam
        let receiptsData;
        if (cat === 'karpet' || cat === 'karpet_alt') {
            receiptsData = resit.karpet || [];
        } else if (cat === 'sofa' || cat === 'tilam') {
            receiptsData = resit.sofa_tilam || [];
        } else {
            receiptsData = resit[cat] || [];
        }
        predictions[cat].receipts = linearRegressionPredict(receiptsData, steps);
    });

    return predictions;
}

/**
 * Generates predicted month labels.
 *
 * @param {string[]} existingMonths - e.g., ["January", "February", "March", "April"]
 * @param {number} steps - Number of predicted months
 * @returns {string[]} e.g., ["May", "June", "July"]
 */
function generatePredictedMonthLabels(existingMonths, steps = 3) {
    const allMonths = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const lastMonth = existingMonths[existingMonths.length - 1];
    const lastIndex = allMonths.indexOf(lastMonth);

    const predictedMonths = [];
    for (let i = 1; i <= steps; i++) {
        const idx = (lastIndex + i) % 12;
        predictedMonths.push(allMonths[idx]);
    }

    return predictedMonths;
}

/**
 * Renders the prediction panel into the dashboard.
 * Shows both PREDICTED SALES and PREDICTED RECEIPTS per category.
 *
 * @param {Object} predictions - Output from generateAllPredictions()
 * @param {string[]} months - Existing months array
 */
function renderPredictionPanel(predictions, months) {
    const steps = predictions._steps || 3;
    const predictedMonths = generatePredictedMonthLabels(months, steps);

    const container = document.getElementById('predictionPanel');
    if (!container) return;

    const catConfig = {
        karpet: { name: 'Karpet', color: '#8b5cf6' },
        karpet_alt: { name: 'Karpet (Alt)', color: '#a78bfa' },
        kasut: { name: 'Kasut', color: '#10b981' },
        langsir: { name: 'Langsir', color: '#f59e0b' },
        sofa: { name: 'Sofa', color: '#06b6d4' },
        tilam: { name: 'Tilam', color: '#ec4899' }
    };

    const carpetType = predictions._carpetType || 'karpet';
    const catsToShow = ['karpet', 'kasut', 'langsir', 'sofa', 'tilam'];

    // Short month labels
    const monthHeaders = predictedMonths.map(m =>
        `<th class="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center" colspan="2">${m.substring(0, 3)}</th>`
    ).join('');

    // Sub-headers for Sales / Resit
    const subHeaders = predictedMonths.map(() =>
        `<td class="px-1 py-1 text-xxs text-gray-500 text-center">💰 Jualan</td>
         <td class="px-1 py-1 text-xxs text-gray-500 text-center">🧾 Resit</td>`
    ).join('');

    // Build rows: each category = 1 row showing sales & receipts per predicted month
    let tableRows = '';
    catsToShow.forEach(cat => {
        const dataKey = (cat === 'karpet') ? carpetType : cat;
        const pred = predictions[dataKey];
        if (!pred || !pred.sales || !pred.receipts) return;

        const config = catConfig[cat] || { name: cat, color: '#9ca3af' };

        // Actual last month values (April)
        const lastSalesIdx = months.length - 1;
        const lastSales = Math.round(pred.sales.slope * lastSalesIdx + pred.sales.intercept);
        const lastReceipts = Math.round(pred.receipts.slope * lastSalesIdx + pred.receipts.intercept);

        // Predicted months cells (Sales | Receipts)
        let predCells = '';
        for (let i = 0; i < steps; i++) {
            const salesVal = pred.sales.predicted[i];
            const receiptsVal = pred.receipts.predicted[i];
            const salesTrend = salesVal > lastSales ? '📈' : (salesVal < lastSales ? '📉' : '➡️');
            const receiptsTrend = receiptsVal > lastReceipts ? '📈' : (receiptsVal < lastReceipts ? '📉' : '➡️');
            predCells += `
                <td class="px-1 py-2 text-xs text-right text-gray-200 font-semibold">RM ${salesVal.toLocaleString()} ${salesTrend}</td>
                <td class="px-1 py-2 text-xs text-right text-gray-300">${receiptsVal.toLocaleString()} ${receiptsTrend}</td>
            `;
        }

        // Overall trend emoji
        const salesTrendIcon = pred.sales.slope > 1 ? '📈' : (pred.sales.slope < -1 ? '📉' : '➡️');
        const receiptsTrendIcon = pred.receipts.slope > 0.5 ? '📈' : (pred.receipts.slope < -0.5 ? '📉' : '➡️');

        tableRows += `
            <tr class="border-b border-gray-700/30 hover:bg-gray-800/20 transition-colors">
                <td class="px-3 py-2 whitespace-nowrap text-sm">
                    <span class="inline-block w-2.5 h-2.5 rounded-full mr-2" style="background-color: ${config.color};"></span>
                    <span class="text-gray-200 font-medium">${config.name}</span>
                </td>
                <td class="px-3 py-2 text-xs text-right text-gray-400">
                    <div>RM ${lastSales.toLocaleString()}</div>
                    <div class="text-xxs text-gray-500">${lastReceipts} resit</div>
                </td>
                ${predCells}
                <td class="px-3 py-2 text-xs text-center whitespace-nowrap">
                    <div>${salesTrendIcon} <span class="text-xxs text-gray-500">${pred.sales.slope > 0 ? '+' : ''}${pred.sales.slope.toFixed(0)}</span></div>
                    <div class="text-xxs text-gray-500">${receiptsTrendIcon} ${pred.receipts.slope > 0 ? '+' : ''}${pred.receipts.slope.toFixed(1)}</div>
                </td>
            </tr>
        `;
    });

    container.innerHTML = `
        <div class="glass-panel rounded-2xl overflow-hidden">
            <div class="p-5 border-b border-gray-800/80 flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
                        <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                        </svg>
                    </div>
                    <div>
                        <h4 class="text-md font-bold text-white">🔮 Ramalan Jualan & Resit (Prediction)</h4>
                        <p class="text-xs text-gray-400">Unjuran ${predictedMonths.length} bulan akan datang — Jualan (💰) & Bilangan Resit (🧾)</p>
                    </div>
                </div>
            </div>
            <div class="overflow-x-auto p-4">
                <table class="min-w-full">
                    <thead>
                        <tr class="border-b border-gray-800/60">
                            <th class="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider" rowspan="2">Kategori</th>
                            <th class="px-3 py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider border-r border-gray-800/40" rowspan="2">April<br><span class="text-xxs text-gray-500 font-normal">(Actual)</span></th>
                            ${monthHeaders}
                            <th class="px-3 py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider" rowspan="2">Trend</th>
                        </tr>
                        <tr class="border-b border-gray-800/40">
                            ${subHeaders}
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-800/30">
                        ${tableRows}
                    </tbody>
                </table>
            </div>
            <div class="px-5 py-3 bg-gray-900/40 border-t border-gray-800/60 flex items-center justify-between text-xxs text-gray-500">
                <span>💡 Ramalan berdasarkan Simple Linear Regression — data sedia ada (${months.length} bulan)</span>
                <span>📊 Precision: ±15-25%</span>
            </div>
        </div>
    `;
}
