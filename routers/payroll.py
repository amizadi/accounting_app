from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from models import PayrollEntry, PayrollEntryCreate, User
from database import get_database
from routers.auth import get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[PayrollEntry])
async def get_payroll_entries(current_user: User = Depends(get_current_active_user)):
    """Get all payroll entries"""
    db = get_database()
    return list(db.payroll.values())

@router.post("/", response_model=PayrollEntry)
async def create_payroll_entry(
    payroll: PayrollEntryCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new payroll entry"""
    if current_user.role != "manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can create payroll entries"
        )
    
    db = get_database()
    
    # Calculate gross and net pay
    overtime_pay = payroll.overtime_hours * payroll.overtime_rate
    gross_pay = payroll.base_salary + overtime_pay + payroll.bonus
    net_pay = gross_pay - payroll.deductions
    
    payroll_id = db.get_next_payroll_id()
    payroll_entry = PayrollEntry(
        id=payroll_id,
        employee_name=payroll.employee_name,
        employee_id=payroll.employee_id,
        base_salary=payroll.base_salary,
        overtime_hours=payroll.overtime_hours,
        overtime_rate=payroll.overtime_rate,
        bonus=payroll.bonus,
        deductions=payroll.deductions,
        pay_period_start=payroll.pay_period_start,
        pay_period_end=payroll.pay_period_end,
        gross_pay=gross_pay,
        net_pay=net_pay,
        created_by=current_user.id,
        created_at=datetime.now()
    )
    
    db.payroll[payroll_id] = payroll_entry
    return payroll_entry

@router.get("/{payroll_id}", response_model=PayrollEntry)
async def get_payroll_entry(
    payroll_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific payroll entry"""
    db = get_database()
    payroll_entry = db.payroll.get(payroll_id)
    
    if not payroll_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payroll entry not found"
        )
    
    return payroll_entry

@router.put("/{payroll_id}", response_model=PayrollEntry)
async def update_payroll_entry(
    payroll_id: int,
    payroll_update: PayrollEntryCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Update a payroll entry"""
    if current_user.role != "manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can update payroll entries"
        )
    
    db = get_database()
    existing_entry = db.payroll.get(payroll_id)
    
    if not existing_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payroll entry not found"
        )
    
    # Calculate gross and net pay
    overtime_pay = payroll_update.overtime_hours * payroll_update.overtime_rate
    gross_pay = payroll_update.base_salary + overtime_pay + payroll_update.bonus
    net_pay = gross_pay - payroll_update.deductions
    
    updated_entry = PayrollEntry(
        id=payroll_id,
        employee_name=payroll_update.employee_name,
        employee_id=payroll_update.employee_id,
        base_salary=payroll_update.base_salary,
        overtime_hours=payroll_update.overtime_hours,
        overtime_rate=payroll_update.overtime_rate,
        bonus=payroll_update.bonus,
        deductions=payroll_update.deductions,
        pay_period_start=payroll_update.pay_period_start,
        pay_period_end=payroll_update.pay_period_end,
        gross_pay=gross_pay,
        net_pay=net_pay,
        created_by=existing_entry.created_by,
        created_at=existing_entry.created_at
    )
    
    db.payroll[payroll_id] = updated_entry
    return updated_entry

@router.delete("/{payroll_id}")
async def delete_payroll_entry(
    payroll_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Delete a payroll entry (manager only)"""
    if current_user.role != "manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can delete payroll entries"
        )
    
    db = get_database()
    if payroll_id not in db.payroll:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payroll entry not found"
        )
    
    del db.payroll[payroll_id]
    return {"message": "Payroll entry deleted successfully"}
