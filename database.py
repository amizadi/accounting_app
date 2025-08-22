from datetime import datetime
from typing import Dict, List, Optional
from models import User, InventoryItem, Sale, Purchase, PayrollEntry, UserRole
from auth import get_password_hash

# In-memory database
class InMemoryDB:
    def __init__(self):
        self.users: Dict[int, User] = {}
        self.inventory: Dict[int, InventoryItem] = {}
        self.sales: Dict[int, Sale] = {}
        self.purchases: Dict[int, Purchase] = {}
        self.payroll: Dict[int, PayrollEntry] = {}
        
        # Counters for auto-incrementing IDs
        self.user_counter = 1
        self.inventory_counter = 1
        self.sale_counter = 1
        self.purchase_counter = 1
        self.payroll_counter = 1
    
    def get_next_user_id(self) -> int:
        self.user_counter += 1
        return self.user_counter - 1
    
    def get_next_inventory_id(self) -> int:
        self.inventory_counter += 1
        return self.inventory_counter - 1
    
    def get_next_sale_id(self) -> int:
        self.sale_counter += 1
        return self.sale_counter - 1
    
    def get_next_purchase_id(self) -> int:
        self.purchase_counter += 1
        return self.purchase_counter - 1
    
    def get_next_payroll_id(self) -> int:
        self.payroll_counter += 1
        return self.payroll_counter - 1

# Global database instance
db = InMemoryDB()

def initialize_database():
    """Initialize the database with default admin user"""
    # Create default admin user
    admin_user = User(
        id=db.get_next_user_id(),
        username="admin",
        email="admin@company.com",
        full_name="System Administrator",
        role=UserRole.MANAGER,
        is_active=True,
        created_at=datetime.now()
    )
    
    # Store user with hashed password
    db.users[admin_user.id] = admin_user
    # Store password separately (in production, this would be in the user record)
    if not hasattr(db, 'user_passwords'):
        db.user_passwords = {}
    db.user_passwords[admin_user.username] = get_password_hash("admin123")
    
    print(f"Database initialized with admin user: {admin_user.username}")

def get_database():
    """Get the database instance"""
    return db

# User database functions
def get_user_by_username(username: str) -> Optional[User]:
    """Get user by username"""
    for user in db.users.values():
        if user.username == username:
            return user
    return None

def get_user_by_id(user_id: int) -> Optional[User]:
    """Get user by ID"""
    return db.users.get(user_id)

def create_user(user_data: dict) -> User:
    """Create a new user"""
    user_id = db.get_next_user_id()
    user = User(
        id=user_id,
        username=user_data["username"],
        email=user_data["email"],
        full_name=user_data["full_name"],
        role=user_data["role"],
        is_active=True,
        created_at=datetime.now()
    )
    
    db.users[user_id] = user
    if not hasattr(db, 'user_passwords'):
        db.user_passwords = {}
    db.user_passwords[user.username] = get_password_hash(user_data["password"])
    
    return user

def verify_user_password(username: str, password: str) -> bool:
    """Verify user password"""
    if not hasattr(db, 'user_passwords'):
        return False
    
    hashed_password = db.user_passwords.get(username)
    if not hashed_password:
        return False
    
    from auth import verify_password
    return verify_password(password, hashed_password)
