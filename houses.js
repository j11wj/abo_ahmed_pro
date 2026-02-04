// ============================================
// إدارة المنازل
// ============================================

// تحميل المنازل
async function loadHouses(filterPhase = 'all') {
    const houses = await getAllHouses(filterPhase, true); // إرجاع جميع المنازل بما فيها المباعة
    const tbody = document.getElementById('housesTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!Array.isArray(houses)) {
        console.error('houses is not an array:', houses);
        return;
    }
    
    // تصفية المنازل المحذوفة
    const activeHouses = houses.filter(house => house.status !== 'deleted');
    
    activeHouses.forEach((house, index) => {
        // تحديد الحالة بناءً على status
        const status = house.status || 'available';
        let statusBadge = '';
        if (status === 'sold') {
            statusBadge = '<span class="badge bg-danger">تم البيع</span>';
        } else {
            statusBadge = '<span class="badge bg-success">متوفرة</span>';
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${house.house_number}</td>
            <td>${house.block_number}</td>
            <td>${house.total_area}</td>
            <td>${house.building_area}</td>
            <td>${formatNumber(house.total_price)}</td>
            <td>${formatNumber(house.down_payment)}</td>
            <td>${formatNumber(house.loan_amount)}</td>
            <td><span class="badge bg-info">المرحلة ${house.phase}</span></td>
            <td>${house.outlook ? formatNumber(house.outlook) + ' دينار' : '-'}</td>
            <td>${house.floors ? house.floors : '-'}</td>
            <td>${house.additional_specs || '-'}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editHouse(${house.id})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteHouse(${house.id})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// حفظ دار جديدة
async function saveHouse() {
    // التحقق من الحقول المطلوبة قبل الإرسال
    const houseNumberEl = document.getElementById('houseNumber');
    const blockNumberEl = document.getElementById('houseBlock');
    const totalAreaEl = document.getElementById('totalArea');
    const buildingAreaEl = document.getElementById('buildingArea');
    const totalPriceEl = document.getElementById('totalPrice');
    const phaseEl = document.getElementById('phase');
    
    // التحقق من وجود العناصر
    if (!houseNumberEl || !blockNumberEl || !totalAreaEl || !buildingAreaEl || !totalPriceEl || !phaseEl) {
        alert('خطأ: لم يتم العثور على بعض حقول النموذج');
        return;
    }
    
    // قراءة القيم مباشرة - استخدام value أولاً لأنه أكثر موثوقية
    const readNumber = (el) => {
        const val = el.value;
        if (val === '' || val === null || val === undefined) return NaN;
        // إزالة أي مسافات أو فواصل
        const cleanVal = String(val).replace(/\s/g, '').replace(/,/g, '');
        const num = parseFloat(cleanVal);
        return isNaN(num) ? NaN : num;
    };
    
    const readInt = (el) => {
        const val = el.value;
        if (val === '' || val === null || val === undefined) return NaN;
        const cleanVal = String(val).replace(/\s/g, '').replace(/,/g, '');
        const num = parseInt(cleanVal, 10);
        return isNaN(num) ? NaN : num;
    };
    
    // قراءة جميع القيم
    const houseNumberInt = readInt(houseNumberEl);
    const blockNumberInt = readInt(blockNumberEl);
    const totalAreaFloat = readNumber(totalAreaEl);
    const buildingAreaFloat = readNumber(buildingAreaEl);
    const totalPriceFloat = readNumber(totalPriceEl);
    const phaseInt = readInt(phaseEl);
    
    // تسجيل مفصل للتشخيص
    console.log('=== Form Values Debug ===');
    console.log('House Number:', { value: houseNumberEl.value, parsed: houseNumberInt });
    console.log('Block Number:', { value: blockNumberEl.value, parsed: blockNumberInt });
    console.log('Total Area:', { value: totalAreaEl.value, parsed: totalAreaFloat });
    console.log('Building Area:', { value: buildingAreaEl.value, parsed: buildingAreaFloat });
    console.log('Total Price:', { 
        value: totalPriceEl.value, 
        valueAsNumber: totalPriceEl.valueAsNumber,
        parsed: totalPriceFloat,
        type: typeof totalPriceEl.value,
        isEmpty: totalPriceEl.value === ''
    });
    console.log('Phase:', { value: phaseEl.value, parsed: phaseInt });
    console.log('========================');
    
    // التحقق من أن الحقول صحيحة
    const invalidFields = [];
    if (isNaN(houseNumberInt) || houseNumberInt <= 0) {
        invalidFields.push('رقم الدار');
    }
    if (isNaN(blockNumberInt) || blockNumberInt <= 0) {
        invalidFields.push('رقم البلوك');
    }
    if (isNaN(totalAreaFloat) || totalAreaFloat <= 0) {
        invalidFields.push('المساحة الكلية');
    }
    if (isNaN(buildingAreaFloat) || buildingAreaFloat <= 0) {
        invalidFields.push('مساحة البناء');
    }
    if (isNaN(totalPriceFloat) || totalPriceFloat <= 0) {
        invalidFields.push('السعر الكلي');
        console.error('❌ Total Price Validation Failed:', {
            rawValue: totalPriceEl.value,
            valueAsNumber: totalPriceEl.valueAsNumber,
            parsed: totalPriceFloat,
            isNaN: isNaN(totalPriceFloat),
            isZeroOrLess: totalPriceFloat <= 0,
            elementType: totalPriceEl.type,
            elementId: totalPriceEl.id
        });
    }
    if (isNaN(phaseInt) || phaseInt < 1 || phaseInt > 5) {
        invalidFields.push('المرحلة');
    }
    
    if (invalidFields.length > 0) {
        console.error('❌ Invalid fields detected:', invalidFields);
        alert('يرجى ملء الحقول التالية بشكل صحيح:\n' + invalidFields.join('\n'));
        return;
    }
    
    // قراءة الحقول الاختيارية
    const outlookEl = document.getElementById('outlook');
    const outlookValue = outlookEl ? outlookEl.value : '';
    const outlookNum = outlookValue && !isNaN(parseFloat(outlookValue)) && parseFloat(outlookValue) > 0 
        ? parseFloat(outlookValue) : null;
    
    const downPaymentEl = document.getElementById('downPayment');
    const loanAmountEl = document.getElementById('loanAmount');
    const additionalSpecsEl = document.getElementById('additionalSpecs');
    const floorsEl = document.getElementById('floors');
    
    // قراءة عدد الطوابق
    let floorsValue = null;
    if (floorsEl && floorsEl.value && floorsEl.value.trim() !== '') {
        const floorsInt = parseInt(floorsEl.value, 10);
        if (!isNaN(floorsInt) && floorsInt > 0) {
            floorsValue = floorsInt;
        }
    }
    
    const houseData = {
        houseNumber: houseNumberInt,
        blockNumber: blockNumberInt,
        totalArea: totalAreaFloat,
        buildingArea: buildingAreaFloat,
        totalPrice: totalPriceFloat,
        downPayment: downPaymentEl ? (parseFloat(downPaymentEl.value) || 0) : 0,
        loanAmount: loanAmountEl ? (parseFloat(loanAmountEl.value) || 0) : 0,
        phase: phaseInt,
        outlook: outlookNum,
        floors: floorsValue,
        additionalSpecs: additionalSpecsEl ? (additionalSpecsEl.value.trim() || null) : null
    };
    
    console.log('House data to send:', houseData);
    
    if (editingHouseId) {
        const updateResult = await updateHouse(editingHouseId, houseData);
        if (updateResult.success) {
            alert('تم تحديث الدار بنجاح');
            const modal = bootstrap.Modal.getInstance(document.getElementById('addHouseModal'));
            if (modal) modal.hide();
            resetHouseForm();
            await loadHouses();
        } else {
            alert('حدث خطأ: ' + updateResult.error);
        }
    } else {
        const result = await addHouse(houseData);
        if (result.success) {
            alert('تم إضافة الدار بنجاح');
            const modal = bootstrap.Modal.getInstance(document.getElementById('addHouseModal'));
            if (modal) modal.hide();
            resetHouseForm();
            await loadHouses();
        } else {
            alert('حدث خطأ: ' + result.error);
        }
    }
}

// تعديل دار
async function editHouse(id) {
    const house = await getHouseById(id);
    if (!house) {
        alert('الدار غير موجودة');
        return;
    }

    editingHouseId = id;
    setHouseModalLabels(true);

    document.getElementById('houseNumber').value = house.house_number;
    document.getElementById('houseBlock').value = house.block_number;
    document.getElementById('totalArea').value = house.total_area;
    document.getElementById('buildingArea').value = house.building_area;
    document.getElementById('totalPrice').value = house.total_price;
    document.getElementById('downPayment').value = house.down_payment;
    document.getElementById('loanAmount').value = house.loan_amount;
    document.getElementById('phase').value = house.phase;
    document.getElementById('outlook').value = house.outlook || 0;
    const floorsEl = document.getElementById('floors');
    if (floorsEl) floorsEl.value = house.floors || '';
    document.getElementById('additionalSpecs').value = house.additional_specs || '';

    const modal = bootstrap.Modal.getInstance(document.getElementById('addHouseModal')) || new bootstrap.Modal(document.getElementById('addHouseModal'));
    modal.show();
}

// حذف دار
async function deleteHouse(id) {
    if (confirm('هل أنت متأكد من حذف هذه الدار؟')) {
        const result = await updateHouseStatus(id, 'deleted');
        if (result.success) {
            await loadHouses();
        } else {
            alert('حدث خطأ أثناء حذف الدار: ' + result.error);
        }
    }
}

// إعادة ضبط نموذج الدار
function resetHouseForm() {
    editingHouseId = null;
    document.getElementById('addHouseForm').reset();
    setHouseModalLabels(false);
}

function setHouseModalLabels(isEdit) {
    const titleEl = document.querySelector('#addHouseModal .modal-title');
    const saveBtn = document.querySelector('#addHouseModal .btn.btn-primary');
    if (titleEl) {
        titleEl.textContent = isEdit ? 'تعديل بيانات الدار' : 'إضافة دار جديدة';
    }
    if (saveBtn) {
        saveBtn.textContent = isEdit ? 'تحديث' : 'حفظ';
    }
}

// إعداد الفلاتر
function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-phase');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const phase = btn.getAttribute('data-phase');
            loadHouses(phase);
        });
    });
}

// دالة لإضافة منازل للاختبار
function addTestHouses(count = 100) {
    if (confirm(`هل تريد إضافة ${count} منزل للاختبار؟`)) {
        const result = addMultipleHouses(count);
        if (result.success) {
            alert(result.message);
            loadHouses();
        } else {
            alert('حدث خطأ: ' + result.error);
        }
    }
}


