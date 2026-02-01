// ============================================
// دوال مساعدة مشتركة
// ============================================

// تنسيق الأرقام
function formatNumber(num) {
    if (!num && num !== 0) return '0';
    return new Intl.NumberFormat('ar-IQ').format(num);
}

// تنسيق التواريخ
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-IQ');
}


