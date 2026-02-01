// ============================================
// إدارة العقود
// ============================================

// تحميل العقود
async function loadContracts() {
    const contracts = await getAllContracts();
    const tbody = document.getElementById('contractsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    for (let index = 0; index < contracts.length; index++) {
        const contract = contracts[index];
        const remaining = await getRemainingAmount(contract.id);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${formatDate(contract.sale_date)}</td>
            <td>${contract.house_number}</td>
            <td>${contract.block_number}</td>
            <td>${contract.area}</td>
            <td>${contract.floors}</td>
            <td>${contract.buyer_name}</td>
            <td>${contract.mobile_number}</td>
            <td>${contract.sale_type}</td>
            <td>${formatNumber(contract.total_amount)}</td>
            <td>${formatNumber(contract.down_payment)}</td>
            <td>${formatNumber(contract.loan_amount)}</td>
            <td>${formatNumber(contract.amount_paid)}</td>
            <td>${formatNumber(remaining)}</td>
            <td>${formatDate(contract.contract_date)}</td>
            <td>${contract.contract_number}</td>
            <td><span class="badge ${contract.buyer_signature === 'تم' ? 'bg-success' : 'bg-warning'}">${contract.buyer_signature}</span></td>
            <td><span class="badge ${contract.investor_signature === 'تم' ? 'bg-success' : 'bg-warning'}">${contract.investor_signature}</span></td>
            <td><span class="badge ${contract.contract_receipt === 'تم' ? 'bg-success' : 'bg-warning'}">${contract.contract_receipt}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editContract(${contract.id})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-info" onclick="managePayments(${contract.id})" title="إدارة الديون والمدفوعات">
                    <i class="bi bi-cash-coin"></i> الديون
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// تحميل المنازل المتوفرة للعقد
function loadAvailableHousesForContract(currentHouse = null) {
    const houses = getAllHouses('all', true); // إرجاع جميع المنازل بما فيها المباعة للتعديل
    // في وضع التعديل قد تكون الدار مباعة بالفعل، نضمن ظهورها في القائمة
    if (currentHouse && !houses.some(h => h.house_number === currentHouse.house_number)) {
        houses.push(currentHouse);
    }
    const select = document.getElementById('contractHouseNumber');
    if (!select) return;
    
    select.innerHTML = '<option value="">اختر الدار</option>';
    
    houses.forEach(house => {
        const option = document.createElement('option');
        option.value = house.house_number;
        option.textContent = `دار ${house.house_number} - بلوك ${house.block_number}`;
        option.dataset.blockNumber = house.block_number;
        option.dataset.area = house.total_area;
        option.dataset.price = house.total_price;
        select.appendChild(option);
    });
    
    // إزالة المستمعين السابقين
    const newSelect = select.cloneNode(true);
    select.parentNode.replaceChild(newSelect, select);
    
    // عند اختيار دار، ملء البيانات تلقائياً
    newSelect.addEventListener('change', (e) => {
        const selectedOption = e.target.selectedOptions[0];
        if (selectedOption && selectedOption.value) {
            document.getElementById('contractBlock').value = selectedOption.dataset.blockNumber;
            document.getElementById('contractArea').value = selectedOption.dataset.area;
            const totalPrice = parseFloat(selectedOption.dataset.price) || 0;
            document.getElementById('contractTotalAmount').value = totalPrice;
            // حساب المبلغ المتبقي عند تغيير السعر الكلي
            calculateContractRemainingAmount();
        }
    });
    
    // عند إدخال المبلغ المدفوع، حساب المبلغ المتبقي تلقائياً
    const amountPaidInput = document.getElementById('amountPaid');
    if (amountPaidInput) {
        const newInput = amountPaidInput.cloneNode(true);
        amountPaidInput.parentNode.replaceChild(newInput, amountPaidInput);
        newInput.addEventListener('input', calculateContractRemainingAmount);
    }
    
    // عند تغيير السعر الكلي
    const totalAmountInput = document.getElementById('contractTotalAmount');
    if (totalAmountInput) {
        const newTotalInput = totalAmountInput.cloneNode(true);
        totalAmountInput.parentNode.replaceChild(newTotalInput, totalAmountInput);
        newTotalInput.addEventListener('input', calculateContractRemainingAmount);
    }
}

// حساب المبلغ المتبقي للعقد
function calculateContractRemainingAmount() {
    const totalAmount = parseFloat(document.getElementById('contractTotalAmount').value) || 0;
    const amountPaid = parseFloat(document.getElementById('amountPaid').value) || 0;
    const remainingAmount = totalAmount - amountPaid;
    const remainingInput = document.getElementById('remainingAmount');
    if (remainingInput) {
        remainingInput.value = remainingAmount >= 0 ? remainingAmount : 0;
    }
}

// اقتراح رقم العقد التالي
function suggestNextContractNumber() {
    const contracts = getAllContracts();
    let maxNumber = 0;
    contracts.forEach(contract => {
        if (contract.contract_number > maxNumber) {
            maxNumber = contract.contract_number;
        }
    });
    const contractNumberInput = document.getElementById('contractNumber');
    if (contractNumberInput) {
        contractNumberInput.value = maxNumber + 1;
    }
}

// حفظ عقد
function saveContract() {
    const contractData = {
        saleDate: document.getElementById('saleDate').value,
        houseNumber: parseInt(document.getElementById('contractHouseNumber').value),
        blockNumber: parseInt(document.getElementById('contractBlock').value),
        area: parseFloat(document.getElementById('contractArea').value),
        floors: parseInt(document.getElementById('floors').value),
        buyerName: document.getElementById('contractBuyerName').value,
        mobileNumber: document.getElementById('contractMobile').value,
        saleType: document.getElementById('saleType').value,
        totalAmount: parseFloat(document.getElementById('contractTotalAmount').value),
        downPayment: parseFloat(document.getElementById('contractDownPayment').value),
        loanAmount: parseFloat(document.getElementById('contractLoan').value),
        amountPaid: parseFloat(document.getElementById('amountPaid').value),
        contractDate: document.getElementById('contractDate').value,
        contractNumber: parseInt(document.getElementById('contractNumber').value),
        buyerSignature: document.getElementById('buyerSignature').value,
        investorSignature: document.getElementById('investorSignature').value,
        contractReceipt: document.getElementById('contractReceipt').value
    };
    
    if (editingContractId) {
        const updateResult = updateContract(editingContractId, contractData);
        if (updateResult.success) {
            alert('تم تحديث العقد بنجاح');
            const modal = bootstrap.Modal.getInstance(document.getElementById('addContractModal'));
            if (modal) modal.hide();
            resetContractForm();
            loadContracts();
            loadHouses(); // تحديث قائمة المنازل
        } else {
            alert('حدث خطأ: ' + updateResult.error);
        }
    } else {
        const result = addContract(contractData);
        if (result.success) {
            alert('تم حفظ العقد بنجاح');
            const modal = bootstrap.Modal.getInstance(document.getElementById('addContractModal'));
            if (modal) modal.hide();
            resetContractForm();
            loadContracts();
            loadHouses(); // تحديث قائمة المنازل
        } else {
            alert('حدث خطأ: ' + result.error);
        }
    }
}

// تعديل عقد
function editContract(id) {
    const contract = getContractById(id);
    if (!contract) {
        alert('العقد غير موجود');
        return;
    }

    editingContractId = id;
    setContractModalLabels(true);

    // ضمان ظهور الدار الحالية في القائمة حتى لو كانت مباعة
    loadAvailableHousesForContract({
        house_number: contract.house_number,
        block_number: contract.block_number,
        total_area: contract.area,
        total_price: contract.total_amount
    });

    document.getElementById('saleDate').value = contract.sale_date;
    document.getElementById('contractHouseNumber').value = contract.house_number;
    document.getElementById('contractBlock').value = contract.block_number;
    document.getElementById('contractArea').value = contract.area;
    document.getElementById('floors').value = contract.floors;
    document.getElementById('contractBuyerName').value = contract.buyer_name;
    document.getElementById('contractMobile').value = contract.mobile_number;
    document.getElementById('saleType').value = contract.sale_type;
    document.getElementById('contractTotalAmount').value = contract.total_amount;
    document.getElementById('contractDownPayment').value = contract.down_payment;
    document.getElementById('contractLoan').value = contract.loan_amount;
    document.getElementById('amountPaid').value = contract.amount_paid;
    document.getElementById('contractDate').value = contract.contract_date;
    document.getElementById('contractNumber').value = contract.contract_number;
    document.getElementById('buyerSignature').value = contract.buyer_signature;
    document.getElementById('investorSignature').value = contract.investor_signature;
    document.getElementById('contractReceipt').value = contract.contract_receipt;

    const modal = bootstrap.Modal.getInstance(document.getElementById('addContractModal')) || new bootstrap.Modal(document.getElementById('addContractModal'));
    modal.show();
}

// إعادة ضبط نموذج العقد
function resetContractForm() {
    editingContractId = null;
    document.getElementById('addContractForm').reset();
    document.getElementById('saleDate').valueAsDate = new Date();
    document.getElementById('contractDate').valueAsDate = new Date();
    // تعيين التوقيعات على "بالانتظار" كقيمة افتراضية
    document.getElementById('buyerSignature').value = 'بالانتظار';
    document.getElementById('investorSignature').value = 'بالانتظار';
    document.getElementById('contractReceipt').value = 'بالانتظار';
    // إعادة ضبط المبلغ المتبقي
    const remainingInput = document.getElementById('remainingAmount');
    if (remainingInput) {
        remainingInput.value = '';
    }
    suggestNextContractNumber();
    loadAvailableHousesForContract();
    setContractModalLabels(false);
}

function setContractModalLabels(isEdit) {
    const titleEl = document.querySelector('#addContractModal .modal-title');
    const saveBtn = document.querySelector('#addContractModal .btn.btn-primary');
    if (titleEl) {
        titleEl.textContent = isEdit ? 'تعديل العقد' : 'إضافة عقد جديد';
    }
    if (saveBtn) {
        saveBtn.textContent = isEdit ? 'تحديث' : 'حفظ';
    }
}

// إعداد حساب المبلغ المتبقي للعقود
function setupContractAmountCalculation() {
    const amountPaidInput = document.getElementById('amountPaid');
    const totalAmountInput = document.getElementById('contractTotalAmount');
    
    if (amountPaidInput) {
        amountPaidInput.addEventListener('input', calculateContractRemainingAmount);
    }
    
    if (totalAmountInput) {
        totalAmountInput.addEventListener('input', calculateContractRemainingAmount);
    }
}


