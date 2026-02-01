// ============================================
// إدارة المنازل
// ============================================

// تحميل المنازل
function loadHouses(filterPhase = 'all') {
    const houses = getAllHouses(filterPhase, true); // إرجاع جميع المنازل بما فيها المباعة
    const tbody = document.getElementById('housesTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    houses.forEach((house, index) => {
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
function saveHouse() {
    const houseData = {
        houseNumber: parseInt(document.getElementById('houseNumber').value),
        blockNumber: parseInt(document.getElementById('houseBlock').value),
        totalArea: parseFloat(document.getElementById('totalArea').value),
        buildingArea: parseFloat(document.getElementById('buildingArea').value),
        totalPrice: parseFloat(document.getElementById('totalPrice').value),
        downPayment: parseFloat(document.getElementById('downPayment').value) || 0,
        loanAmount: parseFloat(document.getElementById('loanAmount').value) || 0,
        phase: parseInt(document.getElementById('phase').value),
        outlook: parseFloat(document.getElementById('outlook').value) || 0,
        additionalSpecs: document.getElementById('additionalSpecs').value
    };
    
    if (editingHouseId) {
        const updateResult = updateHouse(editingHouseId, houseData);
        if (updateResult.success) {
            alert('تم تحديث الدار بنجاح');
            const modal = bootstrap.Modal.getInstance(document.getElementById('addHouseModal'));
            if (modal) modal.hide();
            resetHouseForm();
            loadHouses();
        } else {
            alert('حدث خطأ: ' + updateResult.error);
        }
    } else {
        const result = addHouse(houseData);
        if (result.success) {
            alert('تم إضافة الدار بنجاح');
            const modal = bootstrap.Modal.getInstance(document.getElementById('addHouseModal'));
            if (modal) modal.hide();
            resetHouseForm();
            loadHouses();
        } else {
            alert('حدث خطأ: ' + result.error);
        }
    }
}

// تعديل دار
function editHouse(id) {
    const house = getHouseById(id);
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
    document.getElementById('additionalSpecs').value = house.additional_specs || '';

    const modal = bootstrap.Modal.getInstance(document.getElementById('addHouseModal')) || new bootstrap.Modal(document.getElementById('addHouseModal'));
    modal.show();
}

// حذف دار
function deleteHouse(id) {
    if (confirm('هل أنت متأكد من حذف هذه الدار؟')) {
        updateHouseStatus(id, 'deleted');
        loadHouses();
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


