// ============================================
// API Client للاتصال بالـ Backend
// ============================================

const API_BASE_URL = 'http://72.62.53.138:8001/api'

// دالة مساعدة للطلبات
async function apiRequest(method, endpoint, data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        
        if (!response.ok) {
            let errorMessage = 'حدث خطأ في الطلب';
            try {
                const error = await response.json();
                // معالجة أخطاء FastAPI validation
                if (error.detail && Array.isArray(error.detail)) {
                    const validationErrors = error.detail.map(err => {
                        const field = err.loc ? err.loc.join('.') : 'field';
                        return `${field}: ${err.msg}`;
                    }).join(', ');
                    errorMessage = `خطأ في التحقق من البيانات: ${validationErrors}`;
                } else {
                    errorMessage = error.detail || error.message || JSON.stringify(error);
                }
            } catch (e) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ==================== Houses ====================

async function getAllHouses(filterPhase = 'all', includeSold = true) {
    try {
        let url = `/houses?include_sold=${includeSold}`;
        if (filterPhase !== 'all') {
            url += `&phase=${filterPhase}`;
        }
        return await apiRequest('GET', url);
    } catch (error) {
        console.error('Error getting houses:', error);
        return [];
    }
}

async function getHouseById(id) {
    try {
        return await apiRequest('GET', `/houses/${id}`);
    } catch (error) {
        console.error('Error getting house:', error);
        return null;
    }
}

async function addHouse(houseData) {
    try {
        // البيانات يجب أن تكون محققة مسبقاً في saveHouse
        const data = {
            house_number: houseData.houseNumber,
            block_number: houseData.blockNumber,
            total_area: houseData.totalArea,
            building_area: houseData.buildingArea,
            total_price: houseData.totalPrice,
            down_payment: houseData.downPayment || 0,
            loan_amount: houseData.loanAmount || 0,
            phase: houseData.phase,
            outlook: houseData.outlook || null,
            additional_specs: houseData.additionalSpecs || null,
            floors: houseData.floors || null,
            building_material: null
        };
        
        console.log('Sending house data to API:', data);
        const result = await apiRequest('POST', '/houses', data);
        return { success: true, ...result };
    } catch (error) {
        console.error('Error adding house:', error);
        return { success: false, error: error.message };
    }
}

async function updateHouse(id, houseData) {
    try {
        // البيانات يجب أن تكون محققة مسبقاً في saveHouse
        const data = {
            house_number: houseData.houseNumber,
            block_number: houseData.blockNumber,
            total_area: houseData.totalArea,
            building_area: houseData.buildingArea,
            total_price: houseData.totalPrice,
            down_payment: houseData.downPayment || 0,
            loan_amount: houseData.loanAmount || 0,
            phase: houseData.phase,
            outlook: houseData.outlook || null,
            additional_specs: houseData.additionalSpecs || null,
            floors: houseData.floors || null,
            building_material: null
        };
        
        console.log('Updating house with data:', data);
        const result = await apiRequest('PUT', `/houses/${id}`, data);
        return { success: true, ...result };
    } catch (error) {
        console.error('Error updating house:', error);
        return { success: false, error: error.message };
    }
}

async function updateHouseStatus(houseId, status) {
    try {
        await apiRequest('PATCH', `/houses/${houseId}/status?status=${status}`);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function addMultipleHouses(count = 100) {
    // هذه الدالة يمكن تنفيذها في الـ backend لاحقاً
    // حالياً نعيد نفس النتيجة
    return { 
        success: true, 
        added: 0, 
        errors: 0,
        message: 'يرجى استخدام API لإضافة المنازل'
    };
}

// ==================== Receipts ====================

async function getAllReceipts() {
    try {
        return await apiRequest('GET', '/receipts');
    } catch (error) {
        console.error('Error getting receipts:', error);
        return [];
    }
}

async function getReceiptById(id) {
    try {
        return await apiRequest('GET', `/receipts/${id}`);
    } catch (error) {
        console.error('Error getting receipt:', error);
        return null;
    }
}

async function addReceipt(receiptData) {
    try {
        const data = {
            receipt_number: receiptData.receiptNumber,
            receipt_date: receiptData.receiptDate,
            buyer_name: receiptData.buyerName,
            mobile_number: receiptData.mobileNumber,
            unit_number: receiptData.unitNumber,
            block_number: receiptData.blockNumber,
            unit_area: receiptData.unitArea,
            amount_received: receiptData.amountReceived,
            remaining_amount: receiptData.remainingAmount,
            due_date: receiptData.dueDate || null,
            notes: receiptData.notes || null,
            house_id: receiptData.houseId || null
        };
        console.log('Sending receipt data to API:', data);
        const result = await apiRequest('POST', '/receipts', data);
        return { success: true, ...result };
    } catch (error) {
        console.error('Error adding receipt:', error);
        return { success: false, error: error.message };
    }
}

async function deleteReceipt(receiptId) {
    try {
        await apiRequest('DELETE', `/receipts/${receiptId}`);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ==================== Contracts ====================

async function getAllContracts() {
    try {
        return await apiRequest('GET', '/contracts');
    } catch (error) {
        console.error('Error getting contracts:', error);
        return [];
    }
}

async function getContractById(id) {
    try {
        return await apiRequest('GET', `/contracts/${id}`);
    } catch (error) {
        console.error('Error getting contract:', error);
        return null;
    }
}

async function addContract(contractData) {
    try {
        const data = {
            sale_date: contractData.saleDate,
            house_number: contractData.houseNumber,
            block_number: contractData.blockNumber,
            area: contractData.area,
            floors: contractData.floors,
            buyer_name: contractData.buyerName,
            mobile_number: contractData.mobileNumber,
            sale_type: contractData.saleType,
            total_amount: contractData.totalAmount,
            down_payment: contractData.downPayment,
            loan_amount: contractData.loanAmount,
            amount_paid: contractData.amountPaid,
            contract_date: contractData.contractDate,
            contract_number: contractData.contractNumber,
            buyer_signature: contractData.buyerSignature || 'بالانتظار',
            investor_signature: contractData.investorSignature || 'بالانتظار',
            contract_receipt: contractData.contractReceipt || 'بالانتظار',
            next_payment_due_date: null,
            house_id: null
        };
        await apiRequest('POST', '/contracts', data);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function updateContract(id, contractData) {
    try {
        const data = {
            sale_date: contractData.saleDate,
            house_number: contractData.houseNumber,
            block_number: contractData.blockNumber,
            area: contractData.area,
            floors: contractData.floors,
            buyer_name: contractData.buyerName,
            mobile_number: contractData.mobileNumber,
            sale_type: contractData.saleType,
            total_amount: contractData.totalAmount,
            down_payment: contractData.downPayment,
            loan_amount: contractData.loanAmount,
            amount_paid: contractData.amountPaid,
            contract_date: contractData.contractDate,
            contract_number: contractData.contractNumber,
            buyer_signature: contractData.buyerSignature || 'بالانتظار',
            investor_signature: contractData.investorSignature || 'بالانتظار',
            contract_receipt: contractData.contractReceipt || 'بالانتظار',
            next_payment_due_date: null,
            house_id: null
        };
        await apiRequest('PUT', `/contracts/${id}`, data);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getRemainingAmount(contractId) {
    try {
        const result = await apiRequest('GET', `/contracts/${contractId}/remaining`);
        return result.remaining_amount || 0;
    } catch (error) {
        console.error('Error getting remaining amount:', error);
        return 0;
    }
}

async function getSoldHouses() {
    try {
        return await apiRequest('GET', '/contracts/sold-houses');
    } catch (error) {
        console.error('Error getting sold houses:', error);
        return [];
    }
}

// ==================== Resale ====================

async function getAllResale() {
    try {
        return await apiRequest('GET', '/resale');
    } catch (error) {
        console.error('Error getting resale:', error);
        return [];
    }
}

async function addResale(resaleData) {
    try {
        const data = {
            house_id: resaleData.houseId,
            source: resaleData.source,
            mobile_number: resaleData.mobileNumber,
            contact_date: resaleData.contactDate,
            remaining_amount: resaleData.remainingAmount || null,
            floors: resaleData.floors || null,
            building_material: resaleData.buildingMaterial || null,
            additional_specs: resaleData.additionalSpecs || null
        };
        console.log('Sending resale data to API:', data);
        const result = await apiRequest('POST', '/resale', data);
        console.log('Resale created successfully:', result);
        return { success: true, data: result };
    } catch (error) {
        console.error('Error adding resale:', error);
        return { success: false, error: error.message };
    }
}

async function deleteResale(id) {
    try {
        await apiRequest('DELETE', `/resale/${id}`);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ==================== Payments ====================

async function getPaymentsByContractId(contractId) {
    try {
        return await apiRequest('GET', `/payments/contract/${contractId}`);
    } catch (error) {
        console.error('Error getting payments:', error);
        return [];
    }
}

async function addPayment(paymentData) {
    try {
        const data = {
            contract_id: paymentData.contractId,
            payment_date: paymentData.paymentDate,
            amount: paymentData.amount,
            payment_type: paymentData.paymentType || 'دفعة',
            notes: paymentData.notes || null,
            next_payment_due_date: paymentData.nextPaymentDueDate || null
        };
        const result = await apiRequest('POST', '/payments', data);
        return { success: true, id: result.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function deletePayment(paymentId) {
    try {
        await apiRequest('DELETE', `/payments/${paymentId}`);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ==================== Statistics ====================

async function getStatistics() {
    try {
        return await apiRequest('GET', '/statistics');
    } catch (error) {
        console.error('Error getting statistics:', error);
        return {
            totalSoldHouses: 0,
            monthlySoldHouses: 0,
            totalRevenue: 0,
            monthlyRevenue: 0,
            totalDebts: 0,
            phaseSales: {},
            monthlySalesData: []
        };
    }
}

// ==================== Helper Functions ====================

// الحصول على العقود المتأخرة عن الدفع
async function getOverdueContracts() {
    try {
        const contracts = await getAllContracts();
        const today = new Date().toISOString().split('T')[0];
        const overdueContracts = [];
        
        for (const contract of contracts) {
            const remaining = await getRemainingAmount(contract.id);
            if (remaining > 0) {
                // حساب موعد الدفعة القادمة (30 يوم من تاريخ العقد أو آخر دفعة)
                const payments = await getPaymentsByContractId(contract.id);
                let nextDueDate = null;
                
                if (payments.length > 0) {
                    const lastPayment = payments[0];
                    const lastPaymentDate = new Date(lastPayment.payment_date);
                    lastPaymentDate.setDate(lastPaymentDate.getDate() + 30);
                    nextDueDate = lastPaymentDate.toISOString().split('T')[0];
                } else {
                    const contractDate = new Date(contract.contract_date);
                    contractDate.setDate(contractDate.getDate() + 30);
                    nextDueDate = contractDate.toISOString().split('T')[0];
                }
                
                // حساب أيام التأخير
                if (nextDueDate && nextDueDate < today) {
                    const dueDate = new Date(nextDueDate);
                    const todayDate = new Date(today);
                    const daysOverdue = Math.floor((todayDate - dueDate) / (1000 * 60 * 60 * 24));
                    
                    overdueContracts.push({
                        ...contract,
                        remaining_amount: remaining,
                        next_due_date: nextDueDate,
                        days_overdue: daysOverdue
                    });
                }
            }
        }
        
        // ترتيب حسب أيام التأخير
        overdueContracts.sort((a, b) => b.days_overdue - a.days_overdue);
        return overdueContracts;
    } catch (error) {
        console.error('Error getting overdue contracts:', error);
        return [];
    }
}

// البحث عن عقود حسب اسم المشتري أو رقم الموبايل أو رقم الدار
async function searchContractsByBuyer(searchTerm) {
    try {
        const allContracts = await getAllContracts();
        const searchLower = searchTerm.toLowerCase().trim();
        
        if (!searchLower) {
            return await getOverdueContracts();
        }
        
        const results = [];
        for (const contract of allContracts) {
            const remaining = await getRemainingAmount(contract.id);
            if (remaining <= 0) continue;
            
            const buyerName = (contract.buyer_name || '').toLowerCase();
            const mobileNumber = (contract.mobile_number || '').toString();
            const houseNumber = (contract.house_number || '').toString();
            
            if (buyerName.includes(searchLower) || 
                mobileNumber.includes(searchLower) || 
                houseNumber.includes(searchLower)) {
                
                const payments = await getPaymentsByContractId(contract.id);
                let nextDueDate = null;
                let daysOverdue = 0;
                
                if (payments.length > 0) {
                    const lastPayment = payments[0];
                    const lastPaymentDate = new Date(lastPayment.payment_date);
                    lastPaymentDate.setDate(lastPaymentDate.getDate() + 30);
                    nextDueDate = lastPaymentDate.toISOString().split('T')[0];
                } else {
                    const contractDate = new Date(contract.contract_date);
                    contractDate.setDate(contractDate.getDate() + 30);
                    nextDueDate = contractDate.toISOString().split('T')[0];
                }
                
                const today = new Date().toISOString().split('T')[0];
                if (nextDueDate && nextDueDate < today) {
                    const dueDate = new Date(nextDueDate);
                    const todayDate = new Date(today);
                    daysOverdue = Math.floor((todayDate - dueDate) / (1000 * 60 * 60 * 24));
                }
                
                results.push({
                    ...contract,
                    remaining_amount: remaining,
                    next_due_date: nextDueDate,
                    days_overdue: daysOverdue
                });
            }
        }
        
        return results.sort((a, b) => b.days_overdue - a.days_overdue);
    } catch (error) {
        console.error('Error searching contracts:', error);
        return [];
    }
}

// دالة للتحقق من اتصال الـ API
async function checkApiConnection() {
    try {
        const response = await fetch('http://localhost:8001/health');
        return response.ok;
    } catch (error) {
        return false;
    }
}

// تهيئة قاعدة البيانات (لا حاجة لها مع API)
async function initDatabase() {
    const isConnected = await checkApiConnection();
    if (!isConnected) {
        console.error('Cannot connect to API. Make sure the backend server is running on http://localhost:8001');
        alert('لا يمكن الاتصال بالخادم. يرجى التأكد من تشغيل الخادم على http://localhost:8001');
        return false;
    }
    return true;
}

