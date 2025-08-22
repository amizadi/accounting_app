from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime, timedelta
from models import FinancialSummary, InventoryReport, SalesReport, User, InventoryItem
from database import get_database
from routers.auth import get_current_active_user

router = APIRouter()

@router.get("/financial-summary", response_model=FinancialSummary)
async def get_financial_summary(
    start_date: str = None,
    end_date: str = None,
    current_user: User = Depends(get_current_active_user)
):
    """Get financial summary report"""
    db = get_database()
    
    # Default to current month if no dates provided
    if not start_date or not end_date:
        now = datetime.now()
        start_date = now.replace(day=1).isoformat()
        end_date = now.isoformat()
    
    start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00').replace('+00:00', ''))
    end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00').replace('+00:00', ''))
    
    total_revenue = 0
    total_expenses = 0
    
    # Calculate revenue from sales
    for sale in db.sales.values():
        if start_dt <= sale.created_at <= end_dt:
            total_revenue += sale.total_amount
    
    # Calculate expenses from purchases and payroll
    for purchase in db.purchases.values():
        if start_dt <= purchase.created_at <= end_dt:
            total_expenses += purchase.total_amount
    
    for payroll_entry in db.payroll.values():
        if start_dt <= payroll_entry.created_at <= end_dt:
            total_expenses += payroll_entry.gross_pay
    
    net_income = total_revenue - total_expenses
    
    return FinancialSummary(
        total_revenue=total_revenue,
        total_expenses=total_expenses,
        net_income=net_income,
        period_start=start_dt,
        period_end=end_dt
    )

@router.get("/inventory-report", response_model=InventoryReport)
async def get_inventory_report(current_user: User = Depends(get_current_active_user)):
    """Get inventory report"""
    db = get_database()
    
    total_items = len(db.inventory)
    total_value = 0
    low_stock_items = []
    
    for item in db.inventory.values():
        total_value += item.quantity_in_stock * item.unit_price
        if item.quantity_in_stock <= item.reorder_level:
            low_stock_items.append(item)
    
    return InventoryReport(
        total_items=total_items,
        total_value=total_value,
        low_stock_items=low_stock_items
    )

@router.get("/sales-report", response_model=SalesReport)
async def get_sales_report(
    start_date: str = None,
    end_date: str = None,
    current_user: User = Depends(get_current_active_user)
):
    """Get sales report"""
    db = get_database()
    
    # Default to current month if no dates provided
    if not start_date or not end_date:
        now = datetime.now()
        start_date = now.replace(day=1).isoformat()
        end_date = now.isoformat()
    
    start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00').replace('+00:00', ''))
    end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00').replace('+00:00', ''))
    
    sales_in_period = []
    total_revenue = 0
    item_sales = {}
    
    for sale in db.sales.values():
        if start_dt <= sale.created_at <= end_dt:
            sales_in_period.append(sale)
            total_revenue += sale.total_amount
            
            # Track item sales for top selling items
            for item in sale.items:
                if item.inventory_item_name not in item_sales:
                    item_sales[item.inventory_item_name] = 0
                item_sales[item.inventory_item_name] += item.quantity
    
    # Get top 5 selling items
    top_selling_items = sorted(
        [{"item": name, "quantity_sold": qty} for name, qty in item_sales.items()],
        key=lambda x: x["quantity_sold"],
        reverse=True
    )[:5]
    
    return SalesReport(
        total_sales=len(sales_in_period),
        total_revenue=total_revenue,
        period_start=start_dt,
        period_end=end_dt,
        top_selling_items=top_selling_items
    )

@router.get("/dashboard-stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_active_user)):
    """Get dashboard statistics"""
    db = get_database()
    
    # Current month stats
    now = datetime.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    monthly_sales = 0
    monthly_revenue = 0
    for sale in db.sales.values():
        if sale.created_at >= month_start:
            monthly_sales += 1
            monthly_revenue += sale.total_amount
    
    monthly_expenses = 0
    for purchase in db.purchases.values():
        if purchase.created_at >= month_start:
            monthly_expenses += purchase.total_amount
    
    for payroll_entry in db.payroll.values():
        if payroll_entry.created_at >= month_start:
            monthly_expenses += payroll_entry.gross_pay
    
    # Inventory stats
    total_inventory_value = sum(
        item.quantity_in_stock * item.unit_price 
        for item in db.inventory.values()
    )
    
    low_stock_count = sum(
        1 for item in db.inventory.values() 
        if item.quantity_in_stock <= item.reorder_level
    )
    
    return {
        "monthly_sales": monthly_sales,
        "monthly_revenue": monthly_revenue,
        "monthly_expenses": monthly_expenses,
        "monthly_profit": monthly_revenue - monthly_expenses,
        "total_inventory_items": len(db.inventory),
        "total_inventory_value": total_inventory_value,
        "low_stock_items": low_stock_count,
        "total_employees": len(set(entry.employee_id for entry in db.payroll.values()))
    }
