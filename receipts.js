// ============================================
// إدارة الوصولات
// ============================================

// تحميل الوصولات
function loadReceipts() {
    const receipts = getAllReceipts();
    const tbody = document.getElementById('receiptsListBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // تحديث الإحصائيات
    updateReceiptsStats(receipts);
    
    if (receipts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">لا توجد وصلات مسجلة</td></tr>';
        return;
    }
    
    receipts.forEach((receipt, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${receipt.receipt_number}</strong></td>
            <td>${formatDate(receipt.receipt_date)}</td>
            <td>${receipt.buyer_name}</td>
            <td>${receipt.mobile_number}</td>
            <td>دار ${receipt.unit_number} - بلوك ${receipt.block_number}</td>
            <td><strong class="text-success">${formatNumber(receipt.amount_received)} دينار</strong></td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-info" onclick="viewReceipt(${receipt.id})" title="عرض">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="printReceiptById(${receipt.id})" title="طباعة">
                        <i class="bi bi-printer"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteReceiptRecord(${receipt.id})" title="حذف">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// تحديث إحصائيات الوصولات
function updateReceiptsStats(receipts) {
    const totalCount = receipts.length;
    const totalAmount = receipts.reduce((sum, receipt) => sum + (parseFloat(receipt.amount_received) || 0), 0);
    
    const countElement = document.getElementById('totalReceiptsCount');
    const amountElement = document.getElementById('totalReceiptsAmount');
    
    if (countElement) {
        countElement.textContent = totalCount;
    }
    if (amountElement) {
        amountElement.textContent = formatNumber(totalAmount) + ' دينار';
    }
}

// تحميل المنازل المتوفرة للوصول
function loadAvailableHousesForReceipt() {
    const houses = getAllHouses('all', false); // فقط المنازل المتوفرة (غير المباعة)
    const select = document.getElementById('unitNumber');
    if (!select) return;
    
    select.innerHTML = '<option value="">اختر الوحدة</option>';
    
    houses.forEach(house => {
        const option = document.createElement('option');
        option.value = house.house_number;
        option.textContent = `دار ${house.house_number} - بلوك ${house.block_number} - ${house.total_area} م²`;
        option.dataset.houseId = house.id;
        option.dataset.blockNumber = house.block_number;
        option.dataset.area = house.total_area;
        option.dataset.price = house.total_price || 0;
        select.appendChild(option);
    });
    
    // إزالة المستمعين السابقين لتجنب التكرار
    const newSelect = select.cloneNode(true);
    select.parentNode.replaceChild(newSelect, select);
    
    // عند اختيار دار، ملء البيانات تلقائياً
    newSelect.addEventListener('change', (e) => {
        const selectedOption = e.target.selectedOptions[0];
        if (selectedOption && selectedOption.value) {
            document.getElementById('blockNumber').value = selectedOption.dataset.blockNumber;
            document.getElementById('unitArea').value = selectedOption.dataset.area;
            const totalPrice = parseFloat(selectedOption.dataset.price) || 0;
            document.getElementById('totalPrice').value = totalPrice;
            
            // عرض معلومات الدار
            const houseInfo = document.getElementById('houseInfo');
            const houseInfoText = document.getElementById('houseInfoText');
            if (houseInfo && houseInfoText) {
                houseInfo.style.display = 'block';
                houseInfoText.textContent = `السعر الكلي: ${formatNumber(totalPrice)} دينار`;
            }
            
            // حساب المبلغ المتبقي
            calculateReceiptRemaining();
        } else {
            const houseInfo = document.getElementById('houseInfo');
            if (houseInfo) {
                houseInfo.style.display = 'none';
            }
            document.getElementById('totalPrice').value = '';
            document.getElementById('remainingAmount').value = '';
        }
    });
    
    // عند تغيير المبلغ المستلم، حساب المتبقي تلقائياً
    const amountReceivedInput = document.getElementById('amountReceived');
    if (amountReceivedInput) {
        // إزالة المستمعين السابقين
        const newInput = amountReceivedInput.cloneNode(true);
        amountReceivedInput.parentNode.replaceChild(newInput, amountReceivedInput);
        newInput.addEventListener('input', calculateReceiptRemaining);
    }
}

// حساب المبلغ المتبقي في الوصل
function calculateReceiptRemaining() {
    const totalPrice = parseFloat(document.getElementById('totalPrice').value) || 0;
    const amountReceived = parseFloat(document.getElementById('amountReceived').value) || 0;
    const remaining = totalPrice - amountReceived;
    
    const remainingInput = document.getElementById('remainingAmount');
    if (remainingInput) {
        remainingInput.value = remaining >= 0 ? remaining : 0;
    }
}

// إعادة تعيين نموذج الوصل
function resetReceiptForm() {
    document.getElementById('receiptForm').reset();
    document.getElementById('receiptDate').valueAsDate = new Date();
    suggestNextReceiptNumber();
    const houseInfo = document.getElementById('houseInfo');
    if (houseInfo) {
        houseInfo.style.display = 'none';
    }
    calculateReceiptRemaining();
}

// اقتراح رقم الوصل التالي
function suggestNextReceiptNumber() {
    const receipts = getAllReceipts();
    let maxNumber = 0;
    receipts.forEach(receipt => {
        if (receipt.receipt_number > maxNumber) {
            maxNumber = receipt.receipt_number;
        }
    });
    const receiptNumberInput = document.getElementById('receiptNumber');
    if (receiptNumberInput) {
        receiptNumberInput.value = maxNumber + 1;
    }
}

// حفظ الوصل
function saveReceipt() {
    const unitSelect = document.getElementById('unitNumber');
    const selectedOption = unitSelect.selectedOptions[0];
    
    const receiptData = {
        receiptNumber: parseInt(document.getElementById('receiptNumber').value),
        receiptDate: document.getElementById('receiptDate').value,
        buyerName: document.getElementById('buyerName').value,
        mobileNumber: document.getElementById('mobileNumber').value,
        unitNumber: parseInt(document.getElementById('unitNumber').value),
        blockNumber: parseInt(document.getElementById('blockNumber').value),
        unitArea: parseFloat(document.getElementById('unitArea').value),
        amountReceived: parseFloat(document.getElementById('amountReceived').value),
        remainingAmount: parseFloat(document.getElementById('remainingAmount').value),
        dueDate: document.getElementById('dueDate').value || null,
        notes: document.getElementById('notes').value,
        houseId: selectedOption ? parseInt(selectedOption.dataset.houseId) : null
    };
    
    // التحقق من صحة البيانات
    const totalPrice = parseFloat(document.getElementById('totalPrice').value) || 0;
    if (totalPrice > 0 && receiptData.amountReceived + receiptData.remainingAmount !== totalPrice) {
        if (!confirm('المبلغ المستلم + المتبقي لا يساوي السعر الكلي. هل تريد المتابعة؟')) {
            return;
        }
    }
    
    const result = addReceipt(receiptData);
    if (result.success) {
        alert('تم حفظ الوصل بنجاح وتم تسجيل العقد في موقف العقود');
        resetReceiptForm();
        loadReceipts();
        // تحديث قائمة المنازل لإزالة الدار المباعة من القائمة
        loadHouses();
        // تحديث قائمة المنازل المتوفرة للوصولات
        loadAvailableHousesForReceipt();
        // تحديث قائمة العقود لإظهار العقد الجديد
        loadContracts();
    } else {
        alert('حدث خطأ: ' + result.error);
    }
}

// طباعة الوصل
function printReceipt() {
    const receiptData = {
        receiptNumber: document.getElementById('receiptNumber').value,
        date: document.getElementById('receiptDate').value,
        buyerName: document.getElementById('buyerName').value,
        mobileNumber: document.getElementById('mobileNumber').value,
        unitNumber: document.getElementById('unitNumber').value,
        blockNumber: document.getElementById('blockNumber').value,
        unitArea: document.getElementById('unitArea').value,
        amountReceived: document.getElementById('amountReceived').value,
        remainingAmount: document.getElementById('remainingAmount').value,
        purpose: `مبلغ شراء دار ${document.getElementById('unitNumber').value} بلوك ${document.getElementById('blockNumber').value}`
    };
    
    printReceiptData(receiptData);
}

// طباعة الوصل بواسطة ID
function printReceiptById(receiptId) {
    const receipt = getReceiptById(receiptId);
    if (!receipt) {
        alert('الوصول غير موجود');
        return;
    }
    
    const receiptData = {
        receiptNumber: receipt.receipt_number,
        date: receipt.receipt_date,
        buyerName: receipt.buyer_name,
        mobileNumber: receipt.mobile_number,
        unitNumber: receipt.unit_number,
        blockNumber: receipt.block_number,
        unitArea: receipt.unit_area,
        amountReceived: receipt.amount_received,
        remainingAmount: receipt.remaining_amount,
        purpose: `مبلغ شراء دار ${receipt.unit_number} بلوك ${receipt.block_number}`
    };
    
    printReceiptData(receiptData);
}

// طباعة بيانات الوصل
function printReceiptData(data) {
    // تعبئة النسخة الأولى
    document.getElementById('printReceiptNumber1').textContent = data.receiptNumber;
    document.getElementById('printDate1').textContent = formatDate(data.date);
    document.getElementById('printBuyerName1').textContent = data.buyerName;
    document.getElementById('printMobileNumber1').textContent = data.mobileNumber;
    document.getElementById('printUnitNumber1').textContent = data.unitNumber;
    document.getElementById('printBlockNumber1').textContent = data.blockNumber;
    document.getElementById('printUnitArea1').textContent = data.unitArea;
    document.getElementById('printAmountReceived1').textContent = formatNumber(data.amountReceived) + ' دينار عراقي';
    document.getElementById('printRemainingAmount1').textContent = formatNumber(data.remainingAmount) + ' دينار عراقي';
    document.getElementById('printPurpose1').textContent = data.purpose;
    
    // تعبئة النسخة الثانية (نفس البيانات)
    document.getElementById('printReceiptNumber2').textContent = data.receiptNumber;
    document.getElementById('printDate2').textContent = formatDate(data.date);
    document.getElementById('printBuyerName2').textContent = data.buyerName;
    document.getElementById('printMobileNumber2').textContent = data.mobileNumber;
    document.getElementById('printUnitNumber2').textContent = data.unitNumber;
    document.getElementById('printBlockNumber2').textContent = data.blockNumber;
    document.getElementById('printUnitArea2').textContent = data.unitArea;
    document.getElementById('printAmountReceived2').textContent = formatNumber(data.amountReceived) + ' دينار عراقي';
    document.getElementById('printRemainingAmount2').textContent = formatNumber(data.remainingAmount) + ' دينار عراقي';
    document.getElementById('printPurpose2').textContent = data.purpose;
    
    // إظهار قسم الطباعة
    document.getElementById('receiptPrint').classList.remove('d-none');
    
    // الانتظار قليلاً ثم الطباعة
    setTimeout(() => {
        window.print();
        // إخفاء قسم الطباعة بعد الطباعة
        setTimeout(() => {
            document.getElementById('receiptPrint').classList.add('d-none');
        }, 100);
    }, 150);
}

// عرض الوصل
function viewReceipt(id) {
    const receipt = getReceiptById(id);
    if (!receipt) {
        alert('الوصول غير موجود');
        return;
    }
    
    // عرض بيانات الوصل في نافذة منبثقة أو طباعته
    printReceiptById(id);
}

// حذف وصل
function deleteReceiptRecord(receiptId) {
    if (!confirm('هل أنت متأكد من حذف هذا الوصل؟ سيتم حذف العقد المرتبط به أيضاً وتحديث حالة المنزل إلى متوفر.')) {
        return;
    }
    
    const result = deleteReceipt(receiptId);
    if (result.success) {
        alert('تم حذف الوصل بنجاح');
        loadReceipts();
        // تحديث قائمة المنازل
        loadHouses();
        // تحديث قائمة المنازل المتوفرة للوصولات
        loadAvailableHousesForReceipt();
        // تحديث قائمة العقود
        loadContracts();
    } else {
        alert('حدث خطأ: ' + result.error);
    }
}


