// ============================================
// إدارة الوصولات
// ============================================

// تحميل الوصولات
async function loadReceipts() {
    const receipts = await getAllReceipts();
    const tbody = document.getElementById('receiptsListBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!Array.isArray(receipts)) {
        console.error('receipts is not an array:', receipts);
        return;
    }
    
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
async function loadAvailableHousesForReceipt() {
    const houses = await getAllHouses('all', false); // فقط المنازل المتوفرة (غير المباعة)
    const select = document.getElementById('unitNumber');
    if (!select) return;
    
    select.innerHTML = '<option value="">اختر الوحدة</option>';
    
    if (!Array.isArray(houses)) {
        console.error('houses is not an array:', houses);
        return;
    }
    
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
            document.getElementById('receiptTotalPrice').value = totalPrice;
            
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
            document.getElementById('receiptTotalPrice').value = '';
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
    const totalPrice = parseFloat(document.getElementById('receiptTotalPrice').value) || 0;
    const amountReceived = parseFloat(document.getElementById('amountReceived').value) || 0;
    const remaining = totalPrice - amountReceived;
    
    const remainingInput = document.getElementById('remainingAmount');
    if (remainingInput) {
        remainingInput.value = remaining >= 0 ? remaining : 0;
    }
}

// إعادة تعيين نموذج الوصل
async function resetReceiptForm() {
    document.getElementById('receiptForm').reset();
    document.getElementById('receiptDate').valueAsDate = new Date();
    await suggestNextReceiptNumber();
    const houseInfo = document.getElementById('houseInfo');
    if (houseInfo) {
        houseInfo.style.display = 'none';
    }
    calculateReceiptRemaining();
}

// اقتراح رقم الوصل التالي
async function suggestNextReceiptNumber() {
    const receipts = await getAllReceipts();
    let maxNumber = 0;
    
    if (!Array.isArray(receipts)) {
        console.error('receipts is not an array:', receipts);
        return;
    }
    
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
async function saveReceipt() {
    try {
        // قراءة الحقول
        const receiptNumberEl = document.getElementById('receiptNumber');
        const receiptDateEl = document.getElementById('receiptDate');
        const buyerNameEl = document.getElementById('buyerName');
        const mobileNumberEl = document.getElementById('mobileNumber');
        const unitNumberEl = document.getElementById('unitNumber');
        const blockNumberEl = document.getElementById('blockNumber');
        const unitAreaEl = document.getElementById('unitArea');
        const amountReceivedEl = document.getElementById('amountReceived');
        const remainingAmountEl = document.getElementById('remainingAmount');
        const dueDateEl = document.getElementById('dueDate');
        const notesEl = document.getElementById('notes');
        
        // التحقق من وجود الحقول
        if (!receiptNumberEl || !receiptDateEl || !buyerNameEl || !mobileNumberEl || 
            !unitNumberEl || !blockNumberEl || !unitAreaEl || !amountReceivedEl || !remainingAmountEl) {
            alert('خطأ: لم يتم العثور على بعض حقول النموذج');
            return;
        }
        
        // قراءة القيم
        const receiptNumber = parseInt(receiptNumberEl.value);
        const receiptDate = receiptDateEl.value;
        const buyerName = buyerNameEl.value.trim();
        const mobileNumber = mobileNumberEl.value.trim();
        const unitNumber = parseInt(unitNumberEl.value);
        const blockNumber = parseInt(blockNumberEl.value);
        const unitArea = parseFloat(unitAreaEl.value);
        const amountReceived = parseFloat(amountReceivedEl.value);
        const remainingAmount = parseFloat(remainingAmountEl.value);
        const dueDate = dueDateEl ? (dueDateEl.value || null) : null;
        const notes = notesEl ? notesEl.value.trim() : null;
        
        // الحصول على house_id من القائمة المنسدلة
        const unitSelect = document.getElementById('unitNumber');
        const selectedOption = unitSelect ? unitSelect.selectedOptions[0] : null;
        const houseId = selectedOption && selectedOption.dataset.houseId 
            ? parseInt(selectedOption.dataset.houseId) : null;
        
        console.log('Receipt data:', {
            receiptNumber, receiptDate, buyerName, mobileNumber, unitNumber,
            blockNumber, unitArea, amountReceived, remainingAmount, houseId
        });
        
        // التحقق من الحقول المطلوبة
        const invalidFields = [];
        if (isNaN(receiptNumber) || receiptNumber <= 0) invalidFields.push('رقم الوصل');
        if (!receiptDate || receiptDate === '') invalidFields.push('التاريخ');
        if (!buyerName || buyerName === '') invalidFields.push('اسم المشتري');
        if (!mobileNumber || mobileNumber === '') invalidFields.push('رقم الموبايل');
        if (isNaN(unitNumber) || unitNumber <= 0) invalidFields.push('رقم الوحدة');
        if (isNaN(blockNumber) || blockNumber <= 0) invalidFields.push('رقم البلوك');
        if (isNaN(unitArea) || unitArea <= 0) invalidFields.push('المساحة');
        if (isNaN(amountReceived) || amountReceived <= 0) invalidFields.push('المبلغ المستلم');
        if (isNaN(remainingAmount) || remainingAmount < 0) invalidFields.push('المبلغ المتبقي');
        
        if (invalidFields.length > 0) {
            alert('يرجى ملء الحقول التالية بشكل صحيح:\n' + invalidFields.join('\n'));
            return;
        }
        
        // التحقق من صحة البيانات
        const totalPrice = parseFloat(document.getElementById('receiptTotalPrice').value) || 0;
        if (totalPrice > 0 && Math.abs((amountReceived + remainingAmount) - totalPrice) > 0.01) {
            if (!confirm('المبلغ المستلم + المتبقي لا يساوي السعر الكلي. هل تريد المتابعة؟')) {
                return;
            }
        }
        
        const receiptData = {
            receiptNumber: receiptNumber,
            receiptDate: receiptDate,
            buyerName: buyerName,
            mobileNumber: mobileNumber,
            unitNumber: unitNumber,
            blockNumber: blockNumber,
            unitArea: unitArea,
            amountReceived: amountReceived,
            remainingAmount: remainingAmount,
            dueDate: dueDate,
            notes: notes,
            houseId: houseId
        };
        
        console.log('Sending receipt data:', receiptData);
        const result = await addReceipt(receiptData);
        
        if (result.success) {
            alert('تم حفظ الوصل بنجاح وتم تسجيل العقد في موقف العقود');
            await resetReceiptForm();
            await loadReceipts();
            // تحديث قائمة المنازل لإزالة الدار المباعة من القائمة
            await loadHouses();
            // تحديث قائمة المنازل المتوفرة للوصولات
            await loadAvailableHousesForReceipt();
            // تحديث قائمة العقود لإظهار العقد الجديد
            await loadContracts();
        } else {
            alert('حدث خطأ: ' + result.error);
        }
    } catch (error) {
        console.error('Error saving receipt:', error);
        alert('حدث خطأ غير متوقع: ' + error.message);
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
        purpose: `مبلغ شراء دار ${document.getElementById('unitNumber').value} بلوك ${document.getElementById('blockNumber').value}`,
        accountantName: document.getElementById('accountantName') ? document.getElementById('accountantName').value : ''
    };
    
    printReceiptData(receiptData);
}

// طباعة الوصل بواسطة ID
async function printReceiptById(receiptId) {
    const receipt = await getReceiptById(receiptId);
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
        purpose: `مبلغ شراء دار ${receipt.unit_number} بلوك ${receipt.block_number}`,
        accountantName: '' // يمكن إضافة حقل في قاعدة البيانات لاحقاً
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
    document.getElementById('printAccountantName1').textContent = data.accountantName || '';
    
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
    document.getElementById('printAccountantName2').textContent = data.accountantName || '';
    
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
async function viewReceipt(id) {
    const receipt = await getReceiptById(id);
    if (!receipt) {
        alert('الوصول غير موجود');
        return;
    }
    
    // عرض بيانات الوصل في نافذة منبثقة أو طباعته
    await printReceiptById(id);
}

// حذف وصل
async function deleteReceiptRecord(receiptId) {
    if (!confirm('هل أنت متأكد من حذف هذا الوصل؟ سيتم حذف العقد المرتبط به أيضاً وتحديث حالة المنزل إلى متوفر.')) {
        return;
    }
    
    const result = await deleteReceipt(receiptId);
    if (result.success) {
        alert('تم حذف الوصل بنجاح');
        await loadReceipts();
        // تحديث قائمة المنازل
        await loadHouses();
        // تحديث قائمة المنازل المتوفرة للوصولات
        await loadAvailableHousesForReceipt();
        // تحديث قائمة العقود
        await loadContracts();
    } else {
        alert('حدث خطأ: ' + result.error);
    }
}


