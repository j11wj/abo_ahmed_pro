// ============================================
// إدارة إعادة البيع
// ============================================

// تحميل إعادة البيع
async function loadResale() {
    try {
        console.log('Loading resale data...');
        const resales = await getAllResale();
        console.log('Resales found:', resales);
        
        const tbody = document.getElementById('resaleTableBody');
        if (!tbody) {
            console.error('resaleTableBody not found');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (!Array.isArray(resales)) {
            console.error('resales is not an array:', resales);
            tbody.innerHTML = '<tr><td colspan="16" class="text-center text-danger">خطأ في تحميل البيانات</td></tr>';
            return;
        }
        
        if (resales.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="16" class="text-center text-muted">لا توجد بيانات</td>
            `;
            tbody.appendChild(row);
            return;
        }
        
        resales.forEach((resale, index) => {
            console.log(`Resale ${index + 1}:`, resale);
            
            // دالة مساعدة لمعالجة القيم
            const formatValue = (value, isNumber = false) => {
                if (value === undefined || value === null || value === '') return '-';
                if (isNumber && typeof value === 'number') {
                    return value > 0 ? formatNumber(value) : '-';
                }
                return value;
            };
            
            // قراءة جميع البيانات مع معالجة القيم الفارغة
            const houseNumber = formatValue(resale.house_number);
            const blockNumber = formatValue(resale.block_number);
            const phase = formatValue(resale.phase);
            const floors = formatValue(resale.floors);
            const totalArea = formatValue(resale.total_area, true);
            const buildingArea = formatValue(resale.building_area, true);
            const totalPrice = formatValue(resale.total_price, true);
            const loanAmount = formatValue(resale.loan_amount, true);
            const remainingAmount = formatValue(resale.remaining_amount, true);
            const source = resale.source || '-';
            const mobileNumber = resale.mobile_number || '-';
            const contactDate = resale.contact_date ? formatDate(resale.contact_date) : '-';
            const additionalSpecs = resale.additional_specs || '-';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td><strong>${houseNumber}</strong></td>
                <td><strong>${blockNumber}</strong></td>
                <td><span class="badge bg-info">المرحلة ${phase}</span></td>
                <td>${floors}</td>
                <td>${totalArea !== '-' ? totalArea + ' م²' : '-'}</td>
                <td>${buildingArea !== '-' ? buildingArea + ' م²' : '-'}</td>
                <td>${totalPrice !== '-' ? totalPrice + ' دينار' : '-'}</td>
                <td>${loanAmount !== '-' ? loanAmount + ' دينار' : '-'}</td>
                <td><strong class="text-primary">${remainingAmount !== '-' ? remainingAmount + ' دينار' : '-'}</strong></td>
                <td>${source}</td>
                <td>${mobileNumber}</td>
                <td>${contactDate}</td>
                <td>${additionalSpecs}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteResaleRecord(${resale.id})" title="حذف">
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
async function loadSoldHousesForResale() {
    try {
        console.log('Loading sold houses for resale...');
        const soldHouses = await getSoldHouses();
        console.log('Sold houses API response:', soldHouses);
        console.log('Type:', typeof soldHouses, 'Is Array:', Array.isArray(soldHouses));
        
        const select = document.getElementById('resaleHouseSelect');
        if (!select) {
            console.error('resaleHouseSelect element not found');
            return;
        }
        
        select.innerHTML = '<option value="">اختر الدار</option>';
        
        if (!Array.isArray(soldHouses)) {
            console.error('soldHouses is not an array:', soldHouses);
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'خطأ في تحميل البيانات';
            option.disabled = true;
            select.appendChild(option);
            return;
        }
        
        if (soldHouses.length === 0) {
            console.log('No sold houses found');
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'لا توجد منازل مباعة';
            option.disabled = true;
            select.appendChild(option);
            return;
        }
        
        console.log(`Adding ${soldHouses.length} sold houses to select`);
        soldHouses.forEach((house, index) => {
            console.log(`House ${index + 1}:`, house);
            const option = document.createElement('option');
            option.value = house.id;
            option.textContent = `دار ${house.house_number || ''} - بلوك ${house.block_number || ''} - المشتري: ${house.buyer_name || ''}`;
            select.appendChild(option);
        });
        
        console.log('Successfully loaded sold houses');
        
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
async function loadHouseDetailsForResale(houseId) {
    try {
        // جلب العقد المرتبط بالدار
        const contracts = await getAllContracts();
        if (Array.isArray(contracts)) {
            const contract = contracts.find(c => c.house_id === houseId);
            
            if (contract) {
                // تعبئة عدد الطوابق من العقد
                if (contract.floors) {
                    document.getElementById('resaleFloors').value = contract.floors;
                }
            }
        }
        
        // جلب مادة البناء من جدول houses إذا كانت موجودة
        const house = await getHouseById(houseId);
        if (house && house.building_material) {
            const materialField = document.getElementById('resaleBuildingMaterial');
            if (materialField) {
                materialField.value = house.building_material;
            }
        }
    } catch (error) {
        console.error('Error loading house details:', error);
    }
}

// حفظ إعادة بيع
async function saveResale() {
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
        
        const result = await addResale(resaleData);
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
            await loadResale();
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
async function deleteResaleRecord(id) {
    if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
        const result = await deleteResale(id);
        if (result.success) {
            alert('تم الحذف بنجاح');
            await loadResale();
        } else {
            alert('حدث خطأ: ' + result.error);
        }
    }
}


