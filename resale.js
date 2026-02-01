// ============================================
// إدارة إعادة البيع
// ============================================

// تحميل إعادة البيع
function loadResale() {
    try {
        console.log('Loading resale data...');
        const resales = getAllResale();
        console.log('Resales found:', resales.length);
        
        const tbody = document.getElementById('resaleTableBody');
        if (!tbody) {
            console.error('resaleTableBody not found');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (resales.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="15" class="text-center text-muted">لا توجد بيانات</td>
            `;
            tbody.appendChild(row);
            return;
        }
        
        resales.forEach((resale, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${resale.house_number || '-'}</td>
                <td>${resale.block_number || '-'}</td>
                <td><span class="badge bg-info">المرحلة ${resale.phase || '-'}</span></td>
                <td>${resale.floors || '-'}</td>
                <td>${resale.building_area || '-'}</td>
                <td>${resale.total_price ? formatNumber(resale.total_price) : '-'}</td>
                <td>${resale.loan_amount ? formatNumber(resale.loan_amount) : '-'}</td>
                <td>${resale.remaining_amount ? formatNumber(resale.remaining_amount) : '-'}</td>
                <td>${resale.source || '-'}</td>
                <td>${resale.mobile_number || '-'}</td>
                <td>${resale.contact_date ? formatDate(resale.contact_date) : '-'}</td>
                <td>${resale.additional_specs || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteResaleRecord(${resale.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading resale:', error);
    }
}

// تحميل المنازل المباعة لإعادة البيع
function loadSoldHousesForResale() {
    try {
        console.log('Loading sold houses for resale...');
        const soldHouses = getSoldHouses();
        console.log('Sold houses found:', soldHouses.length);
        
        const select = document.getElementById('resaleHouseSelect');
        if (!select) {
            console.error('resaleHouseSelect not found');
            return;
        }
        
        select.innerHTML = '<option value="">اختر الدار</option>';
        
        if (soldHouses.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'لا توجد منازل مباعة';
            option.disabled = true;
            select.appendChild(option);
            return;
        }
        
        soldHouses.forEach(house => {
            const option = document.createElement('option');
            option.value = house.id;
            option.textContent = `دار ${house.house_number || ''} - بلوك ${house.block_number || ''} - المشتري: ${house.buyer_name || ''}`;
            select.appendChild(option);
        });
        
        // إزالة المستمعات السابقة لتجنب التكرار
        const newSelect = select.cloneNode(true);
        select.parentNode.replaceChild(newSelect, select);
        
        // إضافة مستمع لتحديث عدد الطوابق عند اختيار دار
        newSelect.addEventListener('change', function() {
            const houseId = parseInt(this.value);
            if (houseId) {
                loadHouseDetailsForResale(houseId);
            } else {
                // إعادة ضبط الحقول
                const floorsField = document.getElementById('resaleFloors');
                const materialField = document.getElementById('resaleBuildingMaterial');
                if (floorsField) floorsField.value = '';
                if (materialField) materialField.value = '';
            }
        });
    } catch (error) {
        console.error('Error loading sold houses:', error);
    }
}

// جلب تفاصيل الدار من العقد المرتبط
function loadHouseDetailsForResale(houseId) {
    try {
        // جلب العقد المرتبط بالدار
        const contracts = getAllContracts();
        const contract = contracts.find(c => c.house_id === houseId);
        
        if (contract) {
            // تعبئة عدد الطوابق من العقد
            if (contract.floors) {
                document.getElementById('resaleFloors').value = contract.floors;
            }
        }
        
        // جلب مادة البناء من جدول houses إذا كانت موجودة
        const house = getHouseById(houseId);
        if (house && house.building_material) {
            document.getElementById('resaleBuildingMaterial').value = house.building_material;
        }
    } catch (error) {
        console.error('Error loading house details:', error);
    }
}

// حفظ إعادة بيع
function saveResale() {
    try {
        const houseSelect = document.getElementById('resaleHouseSelect');
        const source = document.getElementById('resaleSource');
        const mobile = document.getElementById('resaleMobile');
        const contactDate = document.getElementById('resaleContactDate');
        
        if (!houseSelect || !source || !mobile || !contactDate) {
            alert('حدث خطأ: بعض الحقول غير موجودة');
            console.error('Missing form elements');
            return;
        }
        
        if (!houseSelect.value) {
            alert('الرجاء اختيار دار');
            return;
        }
        
        if (!source.value.trim()) {
            alert('الرجاء إدخال المصدر');
            return;
        }
        
        if (!mobile.value.trim()) {
            alert('الرجاء إدخال رقم الموبايل');
            return;
        }
        
        if (!contactDate.value) {
            alert('الرجاء إدخال تاريخ العرض');
            return;
        }
        
        const resaleData = {
            houseId: parseInt(houseSelect.value),
            source: source.value.trim(),
            mobileNumber: mobile.value.trim(),
            contactDate: contactDate.value,
            remainingAmount: parseFloat(document.getElementById('resaleRemaining').value) || null,
            floors: parseInt(document.getElementById('resaleFloors').value) || null,
            // buildingMaterial: document.getElementById('resaleBuildingMaterial').value?.trim() || null,
            additionalSpecs: document.getElementById('resaleAdditionalSpecs').value?.trim() || ''
        };
        
        console.log('Saving resale data:', resaleData);
        
        const result = addResale(resaleData);
        if (result && result.success) {
            alert('تم إضافة الدار لقسم إعادة البيع بنجاح');
            const modal = bootstrap.Modal.getInstance(document.getElementById('addResaleModal'));
            if (modal) {
                modal.hide();
            }
            const form = document.getElementById('addResaleForm');
            if (form) {
                form.reset();
            }
            loadResale();
        } else {
            alert('حدث خطأ: ' + (result?.error || 'خطأ غير معروف'));
            console.error('Error saving resale:', result);
        }
    } catch (error) {
        console.error('Error in saveResale:', error);
        alert('حدث خطأ: ' + error.message);
    }
}

// حذف سجل إعادة بيع
function deleteResaleRecord(id) {
    if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
        const result = deleteResale(id);
        if (result.success) {
            alert('تم الحذف بنجاح');
            loadResale();
        } else {
            alert('حدث خطأ: ' + result.error);
        }
    }
}


