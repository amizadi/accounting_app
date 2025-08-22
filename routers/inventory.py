from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from models import InventoryItem, InventoryItemCreate, User
from database import get_database
from routers.auth import get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[InventoryItem])
async def get_inventory(current_user: User = Depends(get_current_active_user)):
    """Get all inventory items"""
    db = get_database()
    return list(db.inventory.values())

@router.post("/", response_model=InventoryItem)
async def create_inventory_item(
    item: InventoryItemCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new inventory item"""
    db = get_database()
    
    # Check if SKU already exists
    for existing_item in db.inventory.values():
        if existing_item.sku == item.sku:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SKU already exists"
            )
    
    item_id = db.get_next_inventory_id()
    now = datetime.now()
    
    inventory_item = InventoryItem(
        id=item_id,
        name=item.name,
        description=item.description,
        sku=item.sku,
        unit_price=item.unit_price,
        quantity_in_stock=item.quantity_in_stock,
        reorder_level=item.reorder_level,
        category=item.category,
        created_at=now,
        updated_at=now
    )
    
    db.inventory[item_id] = inventory_item
    return inventory_item

@router.get("/{item_id}", response_model=InventoryItem)
async def get_inventory_item(
    item_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific inventory item"""
    db = get_database()
    item = db.inventory.get(item_id)
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found"
        )
    
    return item

@router.put("/{item_id}", response_model=InventoryItem)
async def update_inventory_item(
    item_id: int,
    item_update: InventoryItemCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Update an inventory item"""
    db = get_database()
    existing_item = db.inventory.get(item_id)
    
    if not existing_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found"
        )
    
    # Check if SKU already exists for a different item
    for other_item in db.inventory.values():
        if other_item.id != item_id and other_item.sku == item_update.sku:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SKU already exists"
            )
    
    updated_item = InventoryItem(
        id=item_id,
        name=item_update.name,
        description=item_update.description,
        sku=item_update.sku,
        unit_price=item_update.unit_price,
        quantity_in_stock=item_update.quantity_in_stock,
        reorder_level=item_update.reorder_level,
        category=item_update.category,
        created_at=existing_item.created_at,
        updated_at=datetime.now()
    )
    
    db.inventory[item_id] = updated_item
    return updated_item

@router.delete("/{item_id}")
async def delete_inventory_item(
    item_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Delete an inventory item"""
    if current_user.role != "manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can delete inventory items"
        )
    
    db = get_database()
    if item_id not in db.inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found"
        )
    
    del db.inventory[item_id]
    return {"message": "Inventory item deleted successfully"}

@router.get("/low-stock/items", response_model=List[InventoryItem])
async def get_low_stock_items(current_user: User = Depends(get_current_active_user)):
    """Get items that are at or below reorder level"""
    db = get_database()
    low_stock_items = []
    
    for item in db.inventory.values():
        if item.quantity_in_stock <= item.reorder_level:
            low_stock_items.append(item)
    
    return low_stock_items
