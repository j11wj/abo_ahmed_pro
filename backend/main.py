from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from database import get_db, init_db
from models import House, Receipt, Contract, Resale, Payment
from pydantic import BaseModel

app = FastAPI(title="Real Estate Management API", version="1.0.0")

# إعداد CORS للسماح بالاتصال من المتصفح
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # في الإنتاج، حدد النطاقات المسموحة
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# تهيئة قاعدة البيانات عند بدء التطبيق
@app.on_event("startup")
async def startup_event():
    init_db()


# ==================== Pydantic Models ====================

class HouseBase(BaseModel):
    house_number: int
    block_number: int
    total_area: float
    building_area: float
    total_price: float
    down_payment: float = 0
    loan_amount: float = 0
    phase: int = 1
    outlook: Optional[float] = None
    additional_specs: Optional[str] = None
    floors: Optional[int] = None
    building_material: Optional[str] = None

class HouseCreate(HouseBase):
    pass

class HouseResponse(HouseBase):
    id: int
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ReceiptBase(BaseModel):
    receipt_number: int
    receipt_date: date
    buyer_name: str
    mobile_number: str
    unit_number: int
    block_number: int
    unit_area: float
    amount_received: float
    remaining_amount: float
    due_date: Optional[date] = None
    notes: Optional[str] = None
    house_id: Optional[int] = None

class ReceiptCreate(ReceiptBase):
    pass

class ReceiptResponse(ReceiptBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ContractBase(BaseModel):
    sale_date: date
    house_number: int
    block_number: int
    area: float
    floors: int
    buyer_name: str
    mobile_number: str
    sale_type: str
    total_amount: float
    down_payment: float
    loan_amount: float
    amount_paid: float
    contract_date: date
    contract_number: int
    buyer_signature: str = 'بالانتظار'
    investor_signature: str = 'بالانتظار'
    contract_receipt: str = 'بالانتظار'
    next_payment_due_date: Optional[date] = None
    house_id: Optional[int] = None

class ContractCreate(ContractBase):
    pass

class ContractResponse(ContractBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ResaleBase(BaseModel):
    house_id: int
    source: str
    mobile_number: str
    contact_date: date
    remaining_amount: Optional[float] = None
    floors: Optional[int] = None
    building_material: Optional[str] = None
    additional_specs: Optional[str] = None

class ResaleCreate(ResaleBase):
    pass

class ResaleResponse(ResaleBase):
    id: int
    created_at: datetime
    # معلومات المنزل
    house_number: Optional[int] = None
    block_number: Optional[int] = None
    phase: Optional[int] = None
    building_area: Optional[float] = None
    total_price: Optional[float] = None
    loan_amount: Optional[float] = None
    outlook: Optional[float] = None
    
    class Config:
        from_attributes = True

class PaymentBase(BaseModel):
    contract_id: int
    payment_date: date
    amount: float
    payment_type: Optional[str] = None
    notes: Optional[str] = None
    next_payment_due_date: Optional[date] = None

class PaymentCreate(PaymentBase):
    pass

class PaymentResponse(PaymentBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ==================== Houses Endpoints ====================

@app.get("/api/houses", response_model=List[HouseResponse])
def get_houses(phase: Optional[int] = None, include_sold: bool = True, db: Session = Depends(get_db)):
    """الحصول على جميع المنازل"""
    query = db.query(House)
    if not include_sold:
        query = query.filter(House.status == 'available')
    if phase:
        query = query.filter(House.phase == phase)
    return query.order_by(House.house_number).all()

@app.get("/api/houses/{house_id}", response_model=HouseResponse)
def get_house(house_id: int, db: Session = Depends(get_db)):
    """الحصول على منزل محدد"""
    house = db.query(House).filter(House.id == house_id).first()
    if not house:
        raise HTTPException(status_code=404, detail="المنزل غير موجود")
    return house

@app.post("/api/houses", response_model=HouseResponse)
def create_house(house: HouseCreate, db: Session = Depends(get_db)):
    """إضافة منزل جديد"""
    # التحقق من عدم وجود منزل بنفس الرقم
    existing = db.query(House).filter(House.house_number == house.house_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="يوجد منزل بنفس الرقم")
    
    db_house = House(**house.dict(), status='available')
    db.add(db_house)
    db.commit()
    db.refresh(db_house)
    return db_house

@app.put("/api/houses/{house_id}", response_model=HouseResponse)
def update_house(house_id: int, house: HouseCreate, db: Session = Depends(get_db)):
    """تحديث منزل"""
    db_house = db.query(House).filter(House.id == house_id).first()
    if not db_house:
        raise HTTPException(status_code=404, detail="المنزل غير موجود")
    
    for key, value in house.dict().items():
        setattr(db_house, key, value)
    
    db.commit()
    db.refresh(db_house)
    return db_house

@app.patch("/api/houses/{house_id}/status")
def update_house_status(house_id: int, status: str, db: Session = Depends(get_db)):
    """تحديث حالة المنزل"""
    db_house = db.query(House).filter(House.id == house_id).first()
    if not db_house:
        raise HTTPException(status_code=404, detail="المنزل غير موجود")
    
    db_house.status = status
    db.commit()
    return {"success": True}

@app.delete("/api/houses/{house_id}")
def delete_house(house_id: int, db: Session = Depends(get_db)):
    """حذف منزل (تحديث الحالة إلى deleted)"""
    db_house = db.query(House).filter(House.id == house_id).first()
    if not db_house:
        raise HTTPException(status_code=404, detail="المنزل غير موجود")
    
    db_house.status = 'deleted'
    db.commit()
    return {"success": True}


# ==================== Receipts Endpoints ====================

@app.get("/api/receipts", response_model=List[ReceiptResponse])
def get_receipts(db: Session = Depends(get_db)):
    """الحصول على جميع الوصولات"""
    return db.query(Receipt).order_by(Receipt.receipt_date.desc(), Receipt.receipt_number.desc()).all()

@app.get("/api/receipts/{receipt_id}", response_model=ReceiptResponse)
def get_receipt(receipt_id: int, db: Session = Depends(get_db)):
    """الحصول على وصل محدد"""
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="الوصول غير موجود")
    return receipt

@app.post("/api/receipts", response_model=ReceiptResponse)
def create_receipt(receipt: ReceiptCreate, db: Session = Depends(get_db)):
    """إضافة وصل جديد"""
    # التحقق من عدم وجود وصل بنفس الرقم
    existing = db.query(Receipt).filter(Receipt.receipt_number == receipt.receipt_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="يوجد وصل بنفس الرقم")
    
    db_receipt = Receipt(**receipt.dict())
    db.add(db_receipt)
    
    # تحديث حالة المنزل إلى مباع
    if receipt.house_id:
        house = db.query(House).filter(House.id == receipt.house_id).first()
        if house:
            house.status = 'sold'
            
            # إنشاء عقد تلقائياً
            contract_number = db.query(Contract).count() + 1
            contract = Contract(
                sale_date=receipt.receipt_date,
                house_number=receipt.unit_number,
                block_number=receipt.block_number,
                area=receipt.unit_area,
                floors=1,
                buyer_name=receipt.buyer_name,
                mobile_number=receipt.mobile_number,
                sale_type='بيع أول مرة',
                total_amount=house.total_price or (receipt.amount_received + receipt.remaining_amount),
                down_payment=receipt.amount_received,
                loan_amount=house.loan_amount or receipt.remaining_amount,
                amount_paid=receipt.amount_received,
                contract_date=receipt.receipt_date,
                contract_number=contract_number,
                house_id=receipt.house_id
            )
            db.add(contract)
    
    db.commit()
    db.refresh(db_receipt)
    return db_receipt

@app.delete("/api/receipts/{receipt_id}")
def delete_receipt(receipt_id: int, db: Session = Depends(get_db)):
    """حذف وصل"""
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="الوصول غير موجود")
    
    house_id = receipt.house_id
    
    # البحث عن العقد المرتبط وحذفه
    if house_id:
        contract = db.query(Contract).filter(
            Contract.house_id == house_id,
            Contract.buyer_name == receipt.buyer_name,
            Contract.mobile_number == receipt.mobile_number
        ).first()
        
        if contract:
            # حذف المدفوعات المرتبطة
            db.query(Payment).filter(Payment.contract_id == contract.id).delete()
            # حذف العقد
            db.delete(contract)
    
    # حذف الوصل
    db.delete(receipt)
    
    # تحديث حالة المنزل إذا لم تكن هناك عقود أخرى
    if house_id:
        other_contracts = db.query(Contract).filter(Contract.house_id == house_id).count()
        if other_contracts == 0:
            house = db.query(House).filter(House.id == house_id).first()
            if house:
                house.status = 'available'
    
    db.commit()
    return {"success": True}


# ==================== Contracts Endpoints ====================

@app.get("/api/contracts", response_model=List[ContractResponse])
def get_contracts(db: Session = Depends(get_db)):
    """الحصول على جميع العقود"""
    return db.query(Contract).order_by(Contract.sale_date.desc()).all()

@app.get("/api/contracts/sold-houses")
def get_sold_houses(db: Session = Depends(get_db)):
    """الحصول على المنازل المباعة"""
    contracts = db.query(Contract).filter(Contract.house_id.isnot(None)).all()
    house_ids = set()
    sold_houses = []
    
    for contract in contracts:
        if contract.house_id and contract.house_id not in house_ids:
            house_ids.add(contract.house_id)
            house = db.query(House).filter(House.id == contract.house_id).first()
            if house:
                house_dict = {
                    "id": house.id,
                    "house_number": house.house_number,
                    "block_number": house.block_number,
                    "phase": house.phase,
                    "building_area": house.building_area,
                    "total_price": house.total_price,
                    "loan_amount": house.loan_amount,
                    "buyer_name": contract.buyer_name,
                    "contract_date": contract.contract_date,
                    "contract_number": contract.contract_number
                }
                sold_houses.append(house_dict)
    
    return sold_houses

@app.get("/api/contracts/{contract_id}", response_model=ContractResponse)
def get_contract(contract_id: int, db: Session = Depends(get_db)):
    """الحصول على عقد محدد"""
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="العقد غير موجود")
    return contract

@app.post("/api/contracts", response_model=ContractResponse)
def create_contract(contract: ContractCreate, db: Session = Depends(get_db)):
    """إضافة عقد جديد"""
    # التحقق من عدم وجود عقد بنفس الرقم
    existing = db.query(Contract).filter(Contract.contract_number == contract.contract_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="يوجد عقد بنفس الرقم")
    
    # البحث عن house_id من house_number
    house_id = None
    if contract.house_number:
        house = db.query(House).filter(House.house_number == contract.house_number).first()
        if house:
            house_id = house.id
            house.status = 'sold'
    
    db_contract = Contract(**contract.dict(), house_id=house_id)
    db.add(db_contract)
    db.commit()
    db.refresh(db_contract)
    return db_contract

@app.put("/api/contracts/{contract_id}", response_model=ContractResponse)
def update_contract(contract_id: int, contract: ContractCreate, db: Session = Depends(get_db)):
    """تحديث عقد"""
    db_contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not db_contract:
        raise HTTPException(status_code=404, detail="العقد غير موجود")
    
    old_house_id = db_contract.house_id
    
    # البحث عن house_id الجديد
    house_id = None
    if contract.house_number:
        house = db.query(House).filter(House.house_number == contract.house_number).first()
        if house:
            house_id = house.id
    
    # تحديث حالة المنزل القديم
    if old_house_id and old_house_id != house_id:
        old_house = db.query(House).filter(House.id == old_house_id).first()
        if old_house:
            # التحقق من وجود عقود أخرى
            other_contracts = db.query(Contract).filter(
                Contract.house_id == old_house_id,
                Contract.id != contract_id
            ).count()
            if other_contracts == 0:
                old_house.status = 'available'
    
    # تحديث حالة المنزل الجديد
    if house_id:
        house = db.query(House).filter(House.id == house_id).first()
        if house:
            house.status = 'sold'
    
    # تحديث بيانات العقد
    for key, value in contract.dict().items():
        setattr(db_contract, key, value)
    db_contract.house_id = house_id
    
    db.commit()
    db.refresh(db_contract)
    return db_contract

# ==================== Resale Endpoints ====================

@app.get("/api/resale")
def get_resales(db: Session = Depends(get_db)):
    """الحصول على جميع إعادة البيع"""
    resales = db.query(Resale).order_by(Resale.contact_date.desc()).all()
    result = []
    for resale in resales:
        # جلب المنزل حتى لو كان محذوفاً (status='deleted')
        house = db.query(House).filter(House.id == resale.house_id).first()
        
        # إنشاء القاموس الأساسي
        resale_dict = {
            "id": resale.id,
            "house_id": resale.house_id,
            "source": resale.source,
            "mobile_number": resale.mobile_number,
            "contact_date": resale.contact_date,
            "remaining_amount": resale.remaining_amount,
            "floors": resale.floors,
            "building_material": resale.building_material,
            "additional_specs": resale.additional_specs,
            "created_at": resale.created_at
        }
        
        # إضافة معلومات المنزل إذا كان موجوداً
        if house:
            resale_dict["house_number"] = house.house_number
            resale_dict["block_number"] = house.block_number
            resale_dict["phase"] = house.phase
            resale_dict["total_area"] = house.total_area
            resale_dict["building_area"] = house.building_area
            resale_dict["total_price"] = house.total_price
            resale_dict["loan_amount"] = house.loan_amount
            resale_dict["outlook"] = house.outlook
        else:
            # إذا لم يكن المنزل موجوداً، جرب جلب المعلومات من العقد
            contract = db.query(Contract).filter(Contract.house_id == resale.house_id).first()
            if contract:
                resale_dict["house_number"] = contract.house_number
                resale_dict["block_number"] = contract.block_number
                resale_dict["phase"] = None  # لا يوجد phase في العقد
                resale_dict["building_area"] = contract.area
                resale_dict["total_price"] = contract.total_amount
                resale_dict["loan_amount"] = contract.loan_amount
                resale_dict["outlook"] = None
            else:
                # إذا لم يكن هناك منزل ولا عقد، ضع قيم None
                resale_dict["house_number"] = None
                resale_dict["block_number"] = None
                resale_dict["phase"] = None
                resale_dict["total_area"] = None
                resale_dict["building_area"] = None
                resale_dict["total_price"] = None
                resale_dict["loan_amount"] = None
                resale_dict["outlook"] = None
        
        result.append(resale_dict)
    return result

@app.post("/api/resale")
def create_resale(resale: ResaleCreate, db: Session = Depends(get_db)):
    """إضافة إعادة بيع"""
    # التحقق من وجود المنزل
    house = db.query(House).filter(House.id == resale.house_id).first()
    if not house:
        raise HTTPException(status_code=404, detail="المنزل غير موجود")
    
    db_resale = Resale(**resale.dict())
    db.add(db_resale)
    db.commit()
    db.refresh(db_resale)
    
    # إرجاع البيانات مع معلومات المنزل
    result = {
        "id": db_resale.id,
        "house_id": db_resale.house_id,
        "source": db_resale.source,
        "mobile_number": db_resale.mobile_number,
        "contact_date": db_resale.contact_date,
        "remaining_amount": db_resale.remaining_amount,
        "floors": db_resale.floors,
        "building_material": db_resale.building_material,
        "additional_specs": db_resale.additional_specs,
        "created_at": db_resale.created_at,
        "house_number": house.house_number,
        "block_number": house.block_number,
        "phase": house.phase,
        "building_area": house.building_area,
        "total_price": house.total_price,
        "loan_amount": house.loan_amount,
        "outlook": house.outlook
    }
    return result

@app.delete("/api/resale/{resale_id}")
def delete_resale(resale_id: int, db: Session = Depends(get_db)):
    """حذف إعادة بيع"""
    resale = db.query(Resale).filter(Resale.id == resale_id).first()
    if not resale:
        raise HTTPException(status_code=404, detail="السجل غير موجود")
    
    db.delete(resale)
    db.commit()
    return {"success": True}


# ==================== Payments Endpoints ====================

@app.get("/api/payments/contract/{contract_id}", response_model=List[PaymentResponse])
def get_payments_by_contract(contract_id: int, db: Session = Depends(get_db)):
    """الحصول على المدفوعات لعقد محدد"""
    return db.query(Payment).filter(Payment.contract_id == contract_id).order_by(
        Payment.payment_date.desc(), Payment.created_at.desc()
    ).all()

@app.post("/api/payments", response_model=PaymentResponse)
def create_payment(payment: PaymentCreate, db: Session = Depends(get_db)):
    """إضافة دفعة جديدة"""
    contract = db.query(Contract).filter(Contract.id == payment.contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="العقد غير موجود")
    
    db_payment = Payment(**payment.dict())
    db.add(db_payment)
    
    # تحديث المبلغ المدفوع في العقد
    contract.amount_paid = (contract.amount_paid or 0) + payment.amount
    
    db.commit()
    db.refresh(db_payment)
    return db_payment

@app.delete("/api/payments/{payment_id}")
def delete_payment(payment_id: int, db: Session = Depends(get_db)):
    """حذف دفعة"""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="الدفعة غير موجودة")
    
    contract = db.query(Contract).filter(Contract.id == payment.contract_id).first()
    if contract:
        contract.amount_paid = max(0, (contract.amount_paid or 0) - payment.amount)
    
    db.delete(payment)
    db.commit()
    return {"success": True}

@app.get("/api/contracts/{contract_id}/remaining")
def get_remaining_amount(contract_id: int, db: Session = Depends(get_db)):
    """حساب المبلغ المتبقي لعقد"""
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="العقد غير موجود")
    
    total = contract.total_amount or 0
    paid = contract.amount_paid or 0
    remaining = max(0, total - paid)
    
    return {"remaining_amount": remaining}


# ==================== Statistics Endpoints ====================

@app.get("/api/statistics")
def get_statistics(db: Session = Depends(get_db)):
    """الحصول على الإحصائيات"""
    from datetime import datetime
    
    # إجمالي المنازل المباعة
    total_sold = db.query(Contract).count()
    
    # المنازل المباعة هذا الشهر
    from datetime import date as date_type
    current_date = date_type.today()
    current_month_start = date_type(current_date.year, current_date.month, 1)
    if current_date.month == 12:
        next_month_start = date_type(current_date.year + 1, 1, 1)
    else:
        next_month_start = date_type(current_date.year, current_date.month + 1, 1)
    
    monthly_sold = db.query(Contract).filter(
        Contract.sale_date >= current_month_start,
        Contract.sale_date < next_month_start
    ).count()
    
    # إجمالي الإيرادات
    contracts = db.query(Contract).all()
    total_revenue = 0
    monthly_revenue = 0
    
    for contract in contracts:
        house = None
        if contract.house_id:
            house = db.query(House).filter(House.id == contract.house_id).first()
        
        down_payment = contract.down_payment or 0
        total_revenue += down_payment
        
        if house and house.outlook:
            total_revenue += house.outlook
        
        sale_month = contract.sale_date.strftime("%Y-%m") if isinstance(contract.sale_date, date_type) else str(contract.sale_date)[:7]
        current_month_str = current_date.strftime("%Y-%m")
        if sale_month == current_month_str:
            monthly_revenue += down_payment
            if house and house.outlook:
                monthly_revenue += house.outlook
    
    # المبيعات حسب المرحلة
    phase_sales = {}
    for contract in contracts:
        if contract.house_id:
            house = db.query(House).filter(House.id == contract.house_id).first()
            if house:
                phase = house.phase
                phase_sales[phase] = phase_sales.get(phase, 0) + 1
    
    # مجموع الديون
    total_debts = 0
    for contract in contracts:
        total = contract.total_amount or 0
        paid = contract.amount_paid or 0
        remaining = max(0, total - paid)
        total_debts += remaining
    
    return {
        "total_sold_houses": total_sold,
        "monthly_sold_houses": monthly_sold,
        "total_revenue": total_revenue,
        "monthly_revenue": monthly_revenue,
        "total_debts": total_debts,
        "phase_sales": phase_sales
    }


# ==================== Health Check ====================

@app.get("/")
def root():
    return {"message": "Real Estate Management API", "status": "running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

