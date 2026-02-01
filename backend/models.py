from sqlalchemy import Column, Integer, Float, String, Date, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()


class House(Base):
    __tablename__ = "houses"
    
    id = Column(Integer, primary_key=True, index=True)
    house_number = Column(Integer, unique=True, nullable=False, index=True)
    block_number = Column(Integer, nullable=False)
    total_area = Column(Float, nullable=False)
    building_area = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    down_payment = Column(Float, default=0)
    loan_amount = Column(Float, default=0)
    phase = Column(Integer, nullable=False, default=1)
    outlook = Column(Float, nullable=True)
    additional_specs = Column(Text, nullable=True)
    status = Column(String, default='available')
    floors = Column(Integer, nullable=True)
    building_material = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    receipts = relationship("Receipt", back_populates="house")
    contracts = relationship("Contract", back_populates="house")
    resales = relationship("Resale", back_populates="house")


class Receipt(Base):
    __tablename__ = "receipts"
    
    id = Column(Integer, primary_key=True, index=True)
    receipt_number = Column(Integer, unique=True, nullable=False, index=True)
    receipt_date = Column(Date, nullable=False)
    buyer_name = Column(String, nullable=False)
    mobile_number = Column(String, nullable=False)
    unit_number = Column(Integer, nullable=False)
    block_number = Column(Integer, nullable=False)
    unit_area = Column(Float, nullable=False)
    amount_received = Column(Float, nullable=False)
    remaining_amount = Column(Float, nullable=False)
    due_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    house_id = Column(Integer, ForeignKey("houses.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    house = relationship("House", back_populates="receipts")


class Contract(Base):
    __tablename__ = "contracts"
    
    id = Column(Integer, primary_key=True, index=True)
    sale_date = Column(Date, nullable=False)
    house_number = Column(Integer, nullable=False)
    block_number = Column(Integer, nullable=False)
    area = Column(Float, nullable=False)
    floors = Column(Integer, nullable=False)
    buyer_name = Column(String, nullable=False)
    mobile_number = Column(String, nullable=False)
    sale_type = Column(String, nullable=False)
    total_amount = Column(Float, nullable=False)
    down_payment = Column(Float, nullable=False)
    loan_amount = Column(Float, nullable=False)
    amount_paid = Column(Float, nullable=False)
    contract_date = Column(Date, nullable=False)
    contract_number = Column(Integer, unique=True, nullable=False, index=True)
    buyer_signature = Column(String, default='بالانتظار')
    investor_signature = Column(String, default='بالانتظار')
    contract_receipt = Column(String, default='بالانتظار')
    next_payment_due_date = Column(Date, nullable=True)
    house_id = Column(Integer, ForeignKey("houses.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    house = relationship("House", back_populates="contracts")
    payments = relationship("Payment", back_populates="contract")


class Resale(Base):
    __tablename__ = "resale"
    
    id = Column(Integer, primary_key=True, index=True)
    house_id = Column(Integer, ForeignKey("houses.id"), nullable=False)
    source = Column(String, nullable=False)
    mobile_number = Column(String, nullable=False)
    contact_date = Column(Date, nullable=False)
    remaining_amount = Column(Float, nullable=True)
    floors = Column(Integer, nullable=True)
    building_material = Column(String, nullable=True)
    additional_specs = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    house = relationship("House", back_populates="resales")


class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)
    payment_date = Column(Date, nullable=False)
    amount = Column(Float, nullable=False)
    payment_type = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    next_payment_due_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    contract = relationship("Contract", back_populates="payments")

