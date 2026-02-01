// ============================================
// إدارة المدفوعات والديون
// ============================================

// تحميل الديون المتأخرة
async function loadDebts(searchTerm = '') {
    let debts = [];
    
    if (searchTerm && searchTerm.trim()) {
        debts = await searchContractsByBuyer(searchTerm.trim());
    } else {
        debts = await getOverdueContracts();
    }
    
    const tbody = document.getElementById('debtsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (debts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="text-center">لا توجد ديون متأخرة</td></tr>';
        return;
    }
    
    debts.forEach((debt, index) => {
        const row = document.createElement('tr');
        const daysOverdue = debt.days_overdue || 0;
        const rowClass = daysOverdue > 90 ? 'table-danger' : daysOverdue > 30 ? 'table-warning' : '';
        
        row.className = rowClass;
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${debt.buyer_name}</td>
            <td>${debt.mobile_number}</td>
            <td>${debt.house_number}</td>
            <td>${debt.block_number}</td>
            <td>${formatNumber(debt.total_amount)} دينار</td>
            <td>${formatNumber(debt.amount_paid || 0)} دينار</td>
            <td class="fw-bold text-danger">${formatNumber(debt.remaining_amount || 0)} دينار</td>
            <td>${debt.next_due_date ? formatDate(debt.next_due_date) : '-'}</td>
            <td>
                <span class="badge ${daysOverdue > 90 ? 'bg-danger' : daysOverdue > 30 ? 'bg-warning' : 'bg-info'}">
                    ${daysOverdue} يوم
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-info" onclick="managePayments(${debt.id})" title="إدارة الديون">
                    <i class="bi bi-cash-coin"></i> إدارة
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// البحث عن الديون
function searchDebts() {
    const searchInput = document.getElementById('debtSearchInput');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value;
    loadDebts(searchTerm);
}

// إدارة الديون والمدفوعات
async function managePayments(contractId) {
    try {
        const contract = await getContractById(contractId);
        if (!contract) {
            alert('العقد غير موجود');
            return;
        }
        
        // التحقق من وجود العناصر
        const paymentContractId = document.getElementById('paymentContractId');
        const paymentContractBuyer = document.getElementById('paymentContractBuyer');
        const paymentContractHouse = document.getElementById('paymentContractHouse');
        const paymentContractTotal = document.getElementById('paymentContractTotal');
        const paymentDate = document.getElementById('paymentDate');
        const paymentsModal = document.getElementById('paymentsModal');
        
        if (!paymentContractId || !paymentContractBuyer || !paymentContractHouse || 
            !paymentContractTotal || !paymentDate || !paymentsModal) {
            alert('خطأ: بعض العناصر غير موجودة في الصفحة');
            console.error('Missing elements in payments modal');
            return;
        }
        
        // ملء معلومات العقد
        paymentContractId.value = contractId;
        paymentContractBuyer.textContent = contract.buyer_name;
        paymentContractHouse.textContent = `دار ${contract.house_number} - بلوك ${contract.block_number}`;
        paymentContractTotal.textContent = formatNumber(contract.total_amount);
        
        // تحديث المبالغ
        await updatePaymentInfo(contractId);
        
        // تحميل قائمة المدفوعات
        await loadPaymentsList(contractId);
        
        // تعيين التاريخ الافتراضي
        paymentDate.valueAsDate = new Date();
        
        // إظهار النافذة
        const modal = new bootstrap.Modal(paymentsModal);
        modal.show();
    } catch (error) {
        console.error('Error in managePayments:', error);
        alert('حدث خطأ في فتح صفحة إدارة الديون: ' + error.message);
    }
}

// تحديث معلومات المدفوعات
async function updatePaymentInfo(contractId) {
    try {
        const contract = await getContractById(contractId);
        if (!contract) {
            console.error('Contract not found:', contractId);
            return;
        }
        
        const totalAmount = contract.total_amount || 0;
        const amountPaid = contract.amount_paid || 0;
        const remaining = totalAmount - amountPaid;
        
        const paidElement = document.getElementById('paymentContractPaid');
        const remainingElement = document.getElementById('paymentContractRemaining');
        
        if (paidElement) {
            paidElement.textContent = formatNumber(amountPaid);
        }
        if (remainingElement) {
            remainingElement.textContent = formatNumber(remaining >= 0 ? remaining : 0);
        }
    } catch (error) {
        console.error('Error in updatePaymentInfo:', error);
    }
}

// تحميل قائمة المدفوعات
async function loadPaymentsList(contractId) {
    try {
        if (typeof getPaymentsByContractId !== 'function') {
            console.error('getPaymentsByContractId function not found');
            return;
        }
        
        const payments = await getPaymentsByContractId(contractId);
        const tbody = document.getElementById('paymentsListBody');
        if (!tbody) {
            console.error('paymentsListBody element not found');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (!payments || payments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">لا توجد مدفوعات مسجلة</td></tr>';
            return;
        }
        
        payments.forEach((payment, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(payment.payment_date)}</td>
                <td>${formatNumber(payment.amount)} دينار</td>
                <td>${payment.payment_type || 'دفعة'}</td>
                <td>${payment.notes || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deletePaymentRecord(${payment.id}, ${contractId})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error in loadPaymentsList:', error);
        const tbody = document.getElementById('paymentsListBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">حدث خطأ في تحميل المدفوعات</td></tr>';
        }
    }
}

// حفظ دفعة جديدة
async function savePayment() {
    const contractId = parseInt(document.getElementById('paymentContractId').value);
    const paymentData = {
        contractId: contractId,
        paymentDate: document.getElementById('paymentDate').value,
        amount: parseFloat(document.getElementById('paymentAmount').value),
        paymentType: document.getElementById('paymentType').value,
        notes: document.getElementById('paymentNotes').value
    };
    
    if (!paymentData.amount || paymentData.amount <= 0) {
        alert('يرجى إدخال مبلغ صحيح');
        return;
    }
    
    const contract = await getContractById(contractId);
    if (!contract) {
        alert('العقد غير موجود');
        return;
    }
    
    const totalAmount = contract.total_amount || 0;
    const currentPaid = contract.amount_paid || 0;
    const remaining = totalAmount - currentPaid;
    
    if (paymentData.amount > remaining) {
        if (!confirm(`المبلغ المدخل (${formatNumber(paymentData.amount)}) أكبر من المبلغ المتبقي (${formatNumber(remaining)}). هل تريد المتابعة؟`)) {
            return;
        }
    }
    
    const result = await addPayment(paymentData);
    if (result.success) {
        alert('تم إضافة الدفعة بنجاح');
        document.getElementById('paymentForm').reset();
        document.getElementById('paymentDate').valueAsDate = new Date();
        await updatePaymentInfo(contractId);
        await loadPaymentsList(contractId);
        await loadContracts(); // تحديث جدول العقود
        await loadDebts(); // تحديث جدول الديون
    } else {
        alert('حدث خطأ: ' + result.error);
    }
}

// حذف دفعة
async function deletePaymentRecord(paymentId, contractId) {
    if (!confirm('هل أنت متأكد من حذف هذه الدفعة؟')) {
        return;
    }
    
    const result = await deletePayment(paymentId);
    if (result.success) {
        alert('تم حذف الدفعة بنجاح');
        await updatePaymentInfo(contractId);
        await loadPaymentsList(contractId);
        await loadContracts(); // تحديث جدول العقود
        await loadDebts(); // تحديث جدول الديون
    } else {
        alert('حدث خطأ: ' + result.error);
    }
}


