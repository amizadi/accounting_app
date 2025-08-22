from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from models import User, UserCreate, UserRole
from database import get_database, create_user, get_user_by_username
from routers.auth import get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[User])
async def get_users(current_user: User = Depends(get_current_active_user)):
    """Get all users (manager only)"""
    if current_user.role != "manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can view all users"
        )
    
    db = get_database()
    return list(db.users.values())

@router.post("/", response_model=User)
async def create_new_user(
    user_data: UserCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new user (manager only)"""
    if current_user.role != "manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can create new users"
        )
    
    # Check if username already exists
    existing_user = get_user_by_username(user_data.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # Create user
    user = create_user({
        "username": user_data.username,
        "email": user_data.email,
        "full_name": user_data.full_name,
        "role": user_data.role,
        "password": user_data.password
    })
    
    return user

@router.get("/{user_id}", response_model=User)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific user"""
    if current_user.role != "manager" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only view your own profile or all profiles as manager"
        )
    
    db = get_database()
    user = db.users.get(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

@router.put("/{user_id}/deactivate")
async def deactivate_user(
    user_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Deactivate a user (manager only)"""
    if current_user.role != "manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can deactivate users"
        )
    
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )
    
    db = get_database()
    user = db.users.get(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = False
    return {"message": "User deactivated successfully"}

@router.put("/{user_id}/activate")
async def activate_user(
    user_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Activate a user (manager only)"""
    if current_user.role != "manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can activate users"
        )
    
    db = get_database()
    user = db.users.get(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = True
    return {"message": "User activated successfully"}
