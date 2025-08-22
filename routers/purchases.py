from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from models import Purchase, PurchaseCreate, PurchaseItem, User
from database import get_database
from routers.auth import get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[Purchase])
async def get_purchases(current_user: User = Depends(get_current_active_user)):
    """Get all purchases"""
    db = get_database()
    return list(db.purchases.values())

@router.post("/", response_model=Purchase)
async def create_purchase(
    purchase: PurchaseCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new purchase"""
    db = get_database()
    
    # Validate inventory items and calculate total
    purchase_items = []
    total_amount = 0
    
    for item in purchase.items:
        inventory_item = db.inventory.get(item.inventory_item_id)
        if not inventory_item:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Inventory item with ID {item.inventory_item_id} not found"
            )
        
        purchase_item = PurchaseItem(
            id=len(purchase_items) + 1,
            inventory_item_id=item.inventory_item_id,
            inventory_item_name=inventory_item.name,
            quantity=item.quantity,
            unit_cost=item.unit_cost
        )
        purchase_items.append(purchase_item)
        total_amount += item.quantity * item.unit_cost
    
    # Create purchase
    purchase_id = db.get_next_purchase_id()
    new_purchase = Purchase(
        id=purchase_id,
        supplier_name=purchase.supplier_name,
        supplier_email=purchase.supplier_email,
        items=purchase_items,
        total_amount=total_amount,
        created_by=current_user.id,
        created_at=datetime.now(),
        notes=purchase.notes
    )
    
    # Update inventory quantities
    for item in purchase.items:
        inventory_item = db.inventory[item.inventory_item_id]
        inventory_item.quantity_in_stock += item.quantity
        inventory_item.updated_at = datetime.now()
    
    db.purchases[purchase_id] = new_purchase
    return new_purchase

@router.get("/{purchase_id}", response_model=Purchase)
async def get_purchase(
    purchase_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific purchase"""
    db = get_database()
    purchase = db.purchases.get(purchase_id)
    
    if not purchase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase not found"
        )
    
    return purchase

@router.delete("/{purchase_id}")
async def delete_purchase(
    purchase_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Delete a purchase (manager only)"""
    if current_user.role != "manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can delete purchases"
        )
    
    db = get_database()
    purchase = db.purchases.get(purchase_id)
    
    if not purchase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase not found"
        )
    
    # Reduce inventory quantities
    for item in purchase.items:
        if item.inventory_item_id in db.inventory:
            inventory_item = db.inventory[item.inventory_item_id]
            inventory_item.quantity_in_stock -= item.quantity
            inventory_item.updated_at = datetime.now()
    
    del db.purchases[purchase_id]
    return {"message": "Purchase deleted successfully"}
