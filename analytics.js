// ============================================
// التحليلات والإحصائيات
// ============================================

let phaseChart = null;
let monthlyChart = null;

// تحميل التحليلات
async function loadAnalytics() {
    const stats = await getStatistics();
    
    // تحديث البطاقات
    document.getElementById('totalSoldHouses').textContent = stats.totalSoldHouses;
    document.getElementById('monthlySoldHouses').textContent = stats.monthlySoldHouses;
    document.getElementById('totalRevenue').textContent = formatNumber(stats.totalRevenue) + ' دينار';
    document.getElementById('monthlyRevenue').textContent = formatNumber(stats.monthlyRevenue) + ' دينار';
    
    // تحديث مجموع الديون
    const totalDebtsElement = document.getElementById('totalDebts');
    if (totalDebtsElement) {
        totalDebtsElement.textContent = formatNumber(stats.totalDebts || 0) + ' دينار';
    }
    
    // رسم مخطط المراحل
    drawPhaseChart(stats.phaseSales);
    
    // رسم مخطط المبيعات الشهرية
    drawMonthlyChart(stats.monthlySalesData);
}

// رسم مخطط المراحل
function drawPhaseChart(phaseSales) {
    const ctx = document.getElementById('phaseChart');
    if (!ctx) return;
    
    if (phaseChart) {
        phaseChart.destroy();
    }
    
    const phases = ['المرحلة الأولى', 'المرحلة الثانية', 'المرحلة الثالثة', 'المرحلة الرابعة', 'المرحلة الخامسة'];
    const data = [1, 2, 3, 4, 5].map(phase => phaseSales[phase] || 0);
    
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
    
    const months = monthlyData.map(d => d.month);
    const counts = monthlyData.map(d => d.count);
    
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


