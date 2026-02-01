// ============================================
// الملف الرئيسي - التهيئة والتنقل
// ============================================

// متغيرات عامة
let editingHouseId = null;
let editingContractId = null;

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', async () => {
    // إعداد التنقل بين الأقسام أولاً (قبل تحميل قاعدة البيانات)
    setupNavigation();
    
    try {
    // تهيئة قاعدة البيانات
    const dbInitialized = await initDatabase();
    if (!dbInitialized) {
            console.error('حدث خطأ في تهيئة قاعدة البيانات');
        alert('حدث خطأ في تهيئة قاعدة البيانات');
        return;
    }
    
    // تحميل البيانات الأولية
        if (typeof loadHouses === 'function') loadHouses();
        if (typeof loadReceipts === 'function') loadReceipts();
        if (typeof loadContracts === 'function') loadContracts();
        if (typeof loadResale === 'function') loadResale();
        if (typeof loadAnalytics === 'function') loadAnalytics();
    
    // إعداد النماذج
    setupForms();
    
    // إعداد الفلاتر
        if (typeof setupFilters === 'function') setupFilters();

    // إعادة ضبط النماذج عند إغلاق النوافذ
    setupModalReset();
    } catch (error) {
        console.error('Error initializing app:', error);
    }
});

// إعداد التنقل
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    
    if (navLinks.length === 0) {
        console.error('No navigation links found!');
        return;
    }
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const section = this.getAttribute('data-section');
            if (section) {
            showSection(section);
            // تحديث الناف بار
            navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
    
    // عرض القسم الأول افتراضياً
    showSection('houses');
}

// عرض قسم معين
function showSection(sectionName) {
    if (!sectionName) {
        console.error('showSection: sectionName is required');
        return;
    }
    
    // إخفاء جميع الأقسام
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.add('d-none');
    });
    
    // عرض القسم المطلوب
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.remove('d-none');
        
        // تحديث البيانات عند فتح القسم
        try {
            if (sectionName === 'houses' && typeof loadHouses === 'function') {
            loadHouses();
        } else if (sectionName === 'receipts') {
                if (typeof loadReceipts === 'function') loadReceipts();
                if (typeof loadAvailableHousesForReceipt === 'function') loadAvailableHousesForReceipt();
                if (typeof suggestNextReceiptNumber === 'function') suggestNextReceiptNumber();
        } else if (sectionName === 'contracts') {
                if (typeof loadContracts === 'function') loadContracts();
                if (typeof loadAvailableHousesForContract === 'function') loadAvailableHousesForContract();
                if (typeof suggestNextContractNumber === 'function') suggestNextContractNumber();
            } else if (sectionName === 'analytics' && typeof loadAnalytics === 'function') {
            loadAnalytics();
        } else if (sectionName === 'resale') {
                if (typeof loadResale === 'function') loadResale();
                if (typeof loadSoldHousesForResale === 'function') loadSoldHousesForResale();
            } else if (sectionName === 'debts' && typeof loadDebts === 'function') {
                loadDebts();
            }
        } catch (error) {
            console.error('Error loading section data:', error);
        }
    } else {
        console.error('Section not found:', `${sectionName}-section`);
    }
}

// إعادة ضبط النماذج عند إغلاق النوافذ
function setupModalReset() {
    const houseModalEl = document.getElementById('addHouseModal');
    if (houseModalEl) {
        houseModalEl.addEventListener('hidden.bs.modal', resetHouseForm);
    }

    const contractModalEl = document.getElementById('addContractModal');
    if (contractModalEl) {
        contractModalEl.addEventListener('hidden.bs.modal', resetContractForm);
        // تعيين القيم الافتراضية عند فتح النموذج
        contractModalEl.addEventListener('show.bs.modal', () => {
            if (!editingContractId) {
                // إذا كان في وضع إضافة جديد وليس تعديل
                document.getElementById('buyerSignature').value = 'بالانتظار';
                document.getElementById('investorSignature').value = 'بالانتظار';
                document.getElementById('contractReceipt').value = 'بالانتظار';
            }
        });
    }
}

// إعداد النماذج
function setupForms() {
    // نموذج الوصل
    const receiptForm = document.getElementById('receiptForm');
    if (receiptForm) {
        receiptForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveReceipt();
    });
    }
    
    // تعيين التاريخ الافتراضي للوصولات
    const receiptDate = document.getElementById('receiptDate');
    if (receiptDate) {
        receiptDate.valueAsDate = new Date();
    }
    
    // تعيين التاريخ الافتراضي للعقود
    const saleDate = document.getElementById('saleDate');
    const contractDate = document.getElementById('contractDate');
    if (saleDate) saleDate.valueAsDate = new Date();
    if (contractDate) contractDate.valueAsDate = new Date();
    
    // تعيين التاريخ الافتراضي لإعادة البيع
    const resaleContactDate = document.getElementById('resaleContactDate');
    if (resaleContactDate) {
        resaleContactDate.valueAsDate = new Date();
    }
    
    // إعداد حساب المبلغ المتبقي للعقود
    setupContractAmountCalculation();
    
    // إعداد نموذج المدفوعات
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            savePayment();
        });
    }
}
