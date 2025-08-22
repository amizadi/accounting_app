from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    STAFF = "staff"
    MANAGER = "manager"

class TransactionType(str, Enum):
    SALE = "sale"
    PURCHASE = "purchase"
    EXPENSE = "expense"
    INCOME = "income"

# User Models
class UserBase(BaseModel):
    username: str
    email: str
    full_name: str
    role: UserRole

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# Inventory Models
class InventoryItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    sku: str
    unit_price: float
    quantity_in_stock: int
    reorder_level: int
    category: str

    @validator('unit_price')
    def price_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Unit price must be positive')
        return v

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItem(InventoryItemBase):
    id: int
    created_at: datetime
    updated_at: datetime

# Sales Models
class SaleItemBase(BaseModel):
    inventory_item_id: int
    quantity: int
    unit_price: float

class SaleBase(BaseModel):
    customer_name: str
    customer_email: Optional[str] = None
    items: List[SaleItemBase]
    notes: Optional[str] = None

class SaleCreate(SaleBase):
    pass

class SaleItem(SaleItemBase):
    id: int
    inventory_item_name: str

class Sale(BaseModel):
    id: int
    customer_name: str
    customer_email: Optional[str] = None
    items: List[SaleItem]
    total_amount: float
    created_by: int
    created_at: datetime
    notes: Optional[str] = None

# Purchase Models
class PurchaseItemBase(BaseModel):
    inventory_item_id: int
    quantity: int
    unit_cost: float

class PurchaseBase(BaseModel):
    supplier_name: str
    supplier_email: Optional[str] = None
    items: List[PurchaseItemBase]
    notes: Optional[str] = None

class PurchaseCreate(PurchaseBase):
    pass

class PurchaseItem(PurchaseItemBase):
    id: int
    inventory_item_name: str

class Purchase(BaseModel):
    id: int
    supplier_name: str
    supplier_email: Optional[str] = None
    items: List[PurchaseItem]
    total_amount: float
    created_by: int
    created_at: datetime
    notes: Optional[str] = None

# Payroll Models
class PayrollEntryBase(BaseModel):
    employee_name: str
    employee_id: str
    base_salary: float
    overtime_hours: float = 0
    overtime_rate: float = 0
    bonus: float = 0
    deductions: float = 0
    pay_period_start: datetime
    pay_period_end: datetime

class PayrollEntryCreate(PayrollEntryBase):
    pass

class PayrollEntry(PayrollEntryBase):
    id: int
    gross_pay: float
    net_pay: float
    created_by: int
    created_at: datetime

# Report Models
class FinancialSummary(BaseModel):
    total_revenue: float
    total_expenses: float
    net_income: float
    period_start: datetime
    period_end: datetime

class InventoryReport(BaseModel):
    total_items: int
    total_value: float
    low_stock_items: List[InventoryItem]

class SalesReport(BaseModel):
    total_sales: int
    total_revenue: float
    period_start: datetime
    period_end: datetime
    top_selling_items: List[dict]
