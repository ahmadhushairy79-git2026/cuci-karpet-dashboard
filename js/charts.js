// Chart configuration and management
let salesTrendChart = null;
let categoryShareChart = null;
let receiptsVSsalesChart = null;

// Palette for services
const chartColors = {
    karpet: { border: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)' },
    karpet_alt: { border: '#a78bfa', background: 'rgba(167, 139, 250, 0.1)' },
    kasut: { border: '#10b981', background: 'rgba(16, 185, 129, 0.1)' },
    langsir: { border: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' },
    sofa: { border: '#06b6d4', background: 'rgba(6, 182, 212, 0.1)' },
    tilam: { border: '#ec4899', background: 'rgba(236, 72, 153, 0.1)' }
};

/**
 * Destroys existing chart instances if they exist
 */
function destroyCharts() {
    if (salesTrendChart) salesTrendChart.destroy();
    if (categoryShareChart) categoryShareChart.destroy();
    if (receiptsVSsalesChart) receiptsVSsalesChart.destroy();
}

/**
 * Initializes all charts
 * @param {Object} data - Clean dashboard data structure
 * @param {string} karpetType - 'karpet' or 'karpet_alt'
 */
function initCharts(data, karpetType = 'karpet') {
    destroyCharts();

    const months = data.months;
    const jualan = data.jualan;
    const resit = data.resit;

    // Common Chart.js global options for dark-theme premium appearance
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: '#e5e7eb', // gray-200
                    font: { family: 'Outfit, Inter, sans-serif', size: 12 }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                titleColor: '#f3f4f6',
                bodyColor: '#e5e7eb',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8,
                titleFont: { weight: 'bold', family: 'Outfit, Inter' },
                bodyFont: { family: 'Outfit, Inter' }
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#9ca3af', font: { family: 'Outfit, Inter' } }
            },
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#9ca3af', font: { family: 'Outfit, Inter' } }
            }
        }
    };

    // 1. Sales Trend Chart (Line / Area)
    const ctxTrend = document.getElementById('salesTrendChart').getContext('2d');
    const datasetsTrend = [
        {
            label: karpetType === 'karpet' ? 'Karpet (Utama)' : 'Karpet (Alternatif)',
            data: jualan[karpetType],
            borderColor: chartColors[karpetType].border,
            backgroundColor: chartColors[karpetType].background,
            fill: true,
            tension: 0.35,
            borderWidth: 3
        },
        {
            label: 'Kasut',
            data: jualan.kasut,
            borderColor: chartColors.kasut.border,
            backgroundColor: chartColors.kasut.background,
            fill: true,
            tension: 0.35,
            borderWidth: 2
        },
        {
            label: 'Langsir',
            data: jualan.langsir,
            borderColor: chartColors.langsir.border,
            backgroundColor: chartColors.langsir.background,
            fill: true,
            tension: 0.35,
            borderWidth: 2
        },
        {
            label: 'Sofa',
            data: jualan.sofa,
            borderColor: chartColors.sofa.border,
            backgroundColor: chartColors.sofa.background,
            fill: true,
            tension: 0.35,
            borderWidth: 2
        },
        {
            label: 'Tilam',
            data: jualan.tilam,
            borderColor: chartColors.tilam.border,
            backgroundColor: chartColors.tilam.background,
            fill: true,
            tension: 0.35,
            borderWidth: 2
        }
    ];

    salesTrendChart = new Chart(ctxTrend, {
        type: 'line',
        data: { labels: months, datasets: datasetsTrend },
        options: {
            ...commonOptions,
            plugins: {
                ...commonOptions.plugins,
                title: { display: false },
                datalabels: {
                    display: true,
                    color: '#e5e7eb',
                    font: { family: 'Outfit, Inter', size: 10, weight: 'bold' },
                    anchor: 'end',
                    align: 'top',
                    offset: 4,
                    formatter: function (value) {
                        return 'RM ' + value.toLocaleString();
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });

    // 2. Category Share Chart (Doughnut)
    const ctxShare = document.getElementById('categoryShareChart').getContext('2d');

    // Compute total sales per category
    const sum = arr => arr.reduce((a, b) => a + b, 0);
    const totals = {
        karpet: sum(jualan[karpetType]),
        kasut: sum(jualan.kasut),
        langsir: sum(jualan.langsir),
        sofa: sum(jualan.sofa),
        tilam: sum(jualan.tilam)
    };

    categoryShareChart = new Chart(ctxShare, {
        type: 'doughnut',
        data: {
            labels: ['Karpet', 'Kasut', 'Langsir', 'Sofa', 'Tilam'],
            datasets: [{
                data: [totals.karpet, totals.kasut, totals.langsir, totals.sofa, totals.tilam],
                backgroundColor: [
                    chartColors[karpetType].border,
                    chartColors.kasut.border,
                    chartColors.langsir.border,
                    chartColors.sofa.border,
                    chartColors.tilam.border
                ],
                borderWidth: 2,
                borderColor: '#1f2937', // gray-800
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e5e7eb',
                        font: { family: 'Outfit, Inter', size: 11 },
                        padding: 15
                    }
                },
                tooltip: {
                    ...commonOptions.plugins.tooltip,
                    callbacks: {
                        label: function (context) {
                            const val = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((val / total) * 100).toFixed(1);
                            return ` RM ${val.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });

    // 3. Receipts vs Sales Amount Chart (Bar & Line combo)
    const ctxRvS = document.getElementById('receiptsVSsalesChart').getContext('2d');

    // Total monthly sales and total monthly receipts across all categories
    const monthlyTotalSales = months.map((_, index) => {
        return jualan[karpetType][index] + jualan.kasut[index] + jualan.langsir[index] + jualan.sofa[index] + jualan.tilam[index];
    });

    const monthlyTotalReceipts = months.map((_, index) => {
        // Sofa and Tilam shares the receipts in `sofa_tilam`
        return resit.karpet[index] + resit.kasut[index] + resit.langsir[index] + resit.sofa_tilam[index];
    });

    receiptsVSsalesChart = new Chart(ctxRvS, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Jumlah Resit (Transaksi)',
                    type: 'bar',
                    data: monthlyTotalReceipts,
                    backgroundColor: 'rgba(6, 182, 212, 0.4)',
                    borderColor: '#06b6d4',
                    borderWidth: 1.5,
                    yAxisID: 'yReceipts'
                },
                {
                    label: 'Jumlah Jualan Keseluruhan (RM)',
                    type: 'line',
                    data: monthlyTotalSales,
                    borderColor: '#f59e0b',
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    pointBackgroundColor: '#f59e0b',
                    pointRadius: 4,
                    tension: 0.3,
                    yAxisID: 'ySales'
                }
            ]
        },
        options: {
            ...commonOptions,
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#9ca3af', font: { family: 'Outfit, Inter' } }
                },
                yReceipts: {
                    type: 'linear',
                    position: 'left',
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#06b6d4', font: { family: 'Outfit, Inter' } },
                    title: {
                        display: true,
                        text: 'Bilangan Resit',
                        color: '#06b6d4',
                        font: { family: 'Outfit, Inter', weight: 'bold' }
                    }
                },
                ySales: {
                    type: 'linear',
                    position: 'right',
                    grid: { drawOnChartArea: false }, // avoid grid overlapping
                    ticks: {
                        color: '#f59e0b',
                        font: { family: 'Outfit, Inter' },
                        callback: value => 'RM ' + value.toLocaleString()
                    },
                    title: {
                        display: true,
                        text: 'Jualan (RM)',
                        color: '#f59e0b',
                        font: { family: 'Outfit, Inter', weight: 'bold' }
                    }
                }
            }
        }
    });
}