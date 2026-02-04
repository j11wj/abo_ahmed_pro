# Real Estate Management Backend API

Backend API مبني باستخدام FastAPI و SQLite لإدارة نظام العقارات.

## المتطلبات

- Python 3.8 أو أحدث
- pip

## التثبيت

1. تثبيت المكتبات المطلوبة:
```bash
pip install -r requirements.txt
```

## تشغيل الخادم

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

الخادم سيعمل على: `http://localhost:8001`

## API Documentation

بعد تشغيل الخادم، يمكنك الوصول إلى:
- Swagger UI: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc`

## Endpoints الرئيسية

### المنازل (Houses)
- `GET /api/houses` - الحصول على جميع المنازل
- `GET /api/houses/{id}` - الحصول على منزل محدد
- `POST /api/houses` - إضافة منزل جديد
- `PUT /api/houses/{id}` - تحديث منزل
- `PATCH /api/houses/{id}/status` - تحديث حالة المنزل
- `DELETE /api/houses/{id}` - حذف منزل

### الوصولات (Receipts)
- `GET /api/receipts` - الحصول على جميع الوصولات
- `GET /api/receipts/{id}` - الحصول على وصل محدد
- `POST /api/receipts` - إضافة وصل جديد
- `DELETE /api/receipts/{id}` - حذف وصل

### العقود (Contracts)
- `GET /api/contracts` - الحصول على جميع العقود
- `GET /api/contracts/{id}` - الحصول على عقد محدد
- `POST /api/contracts` - إضافة عقد جديد
- `PUT /api/contracts/{id}` - تحديث عقد
- `GET /api/contracts/sold-houses` - الحصول على المنازل المباعة
- `GET /api/contracts/{id}/remaining` - حساب المبلغ المتبقي

### إعادة البيع (Resale)
- `GET /api/resale` - الحصول على جميع إعادة البيع
- `POST /api/resale` - إضافة إعادة بيع
- `DELETE /api/resale/{id}` - حذف إعادة بيع

### المدفوعات (Payments)
- `GET /api/payments/contract/{contract_id}` - الحصول على مدفوعات عقد
- `POST /api/payments` - إضافة دفعة جديدة
- `DELETE /api/payments/{id}` - حذف دفعة

### الإحصائيات
- `GET /api/statistics` - الحصول على الإحصائيات

## قاعدة البيانات

قاعدة البيانات SQLite تُنشأ تلقائياً في ملف `real_estate.db` في نفس مجلد `backend`.

## ملاحظات

- جميع التواريخ بصيغة `YYYY-MM-DD`
- جميع الأرقام المالية بالأرقام (float)
- API يدعم CORS للاتصال من المتصفح

