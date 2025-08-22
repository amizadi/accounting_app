from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from models import Sale, SaleCreate, SaleItem, User
from database import get_database
from routers.auth import get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[Sale])
async def get_sales(current_user: User = Depends(get_current_active_user)):
    """Get all sales"""
    db = get_database()
    return list(db.sales.values())

@router.post("/", response_model=Sale)
async def create_sale(
    sale: SaleCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new sale"""
    db = get_database()
    
    # Validate inventory items and calculate total
    sale_items = []
    total_amount = 0
    
    for item in sale.items:
        inventory_item = db.inventory.get(item.inventory_item_id)
        if not inventory_item:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Inventory item with ID {item.inventory_item_id} not found"
            )
        
        if inventory_item.quantity_in_stock < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for {inventory_item.name}. Available: {inventory_item.quantity_in_stock}"
            )
        
        sale_item = SaleItem(
            id=len(sale_items) + 1,
            inventory_item_id=item.inventory_item_id,
            inventory_item_name=inventory_item.name,
            quantity=item.quantity,
            unit_price=item.unit_price
        )
        sale_items.append(sale_item)
        total_amount += item.quantity * item.unit_price
    
    # Create sale
    sale_id = db.get_next_sale_id()
    new_sale = Sale(
        id=sale_id,
        customer_name=sale.customer_name,
        customer_email=sale.customer_email,
        items=sale_items,
        total_amount=total_amount,
        created_by=current_user.id,
        created_at=datetime.now(),
        notes=sale.notes
    )
    
    # Update inventory quantities
    for item in sale.items:
        inventory_item = db.inventory[item.inventory_item_id]
        inventory_item.quantity_in_stock -= item.quantity
        inventory_item.updated_at = datetime.now()
    
    db.sales[sale_id] = new_sale
    return new_sale

@router.get("/{sale_id}", response_model=Sale)
async def get_sale(
    sale_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific sale"""
    db = get_database()
    sale = db.sales.get(sale_id)
    
    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sale not found"
        )
    
    return sale

@router.delete("/{sale_id}")
async def delete_sale(
    sale_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Delete a sale (manager only)"""
    if current_user.role != "manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can delete sales"
        )
    
    db = get_database()
    sale = db.sales.get(sale_id)
    
    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sale not found"
        )
    
    # Restore inventory quantities
    for item in sale.items:
        if item.inventory_item_id in db.inventory:
            inventory_item = db.inventory[item.inventory_item_id]
            inventory_item.quantity_in_stock += item.quantity
            inventory_item.updated_at = datetime.now()
    
    del db.sales[sale_id]
    return {"message": "Sale deleted successfully"}
