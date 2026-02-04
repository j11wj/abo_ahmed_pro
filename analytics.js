// ============================================
// التحليلات والإحصائيات
// ============================================

let phaseChart = null;
let monthlyChart = null;

// تحميل التحليلات
async function loadAnalytics() {
    try {
        const stats = await getStatistics();
        
        if (!stats) {
            console.error('No statistics data received');
            return;
        }
        
        // تحديث البطاقات
        const totalSoldEl = document.getElementById('totalSoldHouses');
        const monthlySoldEl = document.getElementById('monthlySoldHouses');
        const totalRevenueEl = document.getElementById('totalRevenue');
        const monthlyRevenueEl = document.getElementById('monthlyRevenue');
        
        if (totalSoldEl) totalSoldEl.textContent = stats.total_sold_houses || stats.totalSoldHouses || 0;
        if (monthlySoldEl) monthlySoldEl.textContent = stats.monthly_sold_houses || stats.monthlySoldHouses || 0;
        if (totalRevenueEl) totalRevenueEl.textContent = formatNumber(stats.total_revenue || stats.totalRevenue || 0) + ' دينار';
        if (monthlyRevenueEl) monthlyRevenueEl.textContent = formatNumber(stats.monthly_revenue || stats.monthlyRevenue || 0) + ' دينار';
        
        // تحديث مجموع الديون
        const totalDebtsElement = document.getElementById('totalDebts');
        if (totalDebtsElement) {
            totalDebtsElement.textContent = formatNumber(stats.total_debts || stats.totalDebts || 0) + ' دينار';
        }
        
        // رسم مخطط المراحل
        const phaseSales = stats.phase_sales || stats.phaseSales || {};
        drawPhaseChart(phaseSales);
        
        // رسم مخطط المبيعات الشهرية (إذا كان موجوداً)
        const monthlySalesData = stats.monthlySalesData || [];
        drawMonthlyChart(monthlySalesData);
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// رسم مخطط المراحل
function drawPhaseChart(phaseSales) {
    const ctx = document.getElementById('phaseChart');
    if (!ctx) return;
    
    if (phaseChart) {
        phaseChart.destroy();
    }
    
    // التحقق من أن phaseSales موجود وصحيح
    if (!phaseSales || typeof phaseSales !== 'object') {
        console.warn('phaseSales is not valid:', phaseSales);
        phaseSales = {};
    }
    
    const phases = ['المرحلة الأولى', 'المرحلة الثانية', 'المرحلة الثالثة', 'المرحلة الرابعة', 'المرحلة الخامسة'];
    const data = [1, 2, 3, 4, 5].map(phase => {
        const value = phaseSales[phase];
        return (value !== undefined && value !== null) ? value : 0;
    });
    
    phaseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: phases,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                    'rgba(255, 99, 132, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// رسم مخطط المبيعات الشهرية
function drawMonthlyChart(monthlyData) {
    const ctx = document.getElementById('monthlyChart');
    if (!ctx) return;
    
    if (monthlyChart) {
        monthlyChart.destroy();
    }
    
    // التحقق من أن monthlyData موجود وصحيح
    if (!Array.isArray(monthlyData) || monthlyData.length === 0) {
        console.warn('monthlyData is not valid:', monthlyData);
        monthlyData = [];
    }
    
    const months = monthlyData.map(d => d?.month || '');
    const counts = monthlyData.map(d => d?.count || 0);
    
    monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'عدد المبيعات',
                data: counts,
                backgroundColor: 'rgba(75, 192, 192, 0.8)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}


