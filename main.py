from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from routers.auth import router as auth_router
from routers.inventory import router as inventory_router
from routers.sales import router as sales_router
from routers.purchases import router as purchases_router
from routers.payroll import router as payroll_router
from routers.reports import router as reports_router
from routers.users import router as users_router
from database import initialize_database

# Initialize FastAPI app
app = FastAPI(
    title="Accounting Management System",
    description="Comprehensive accounting web application for small businesses",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize in-memory database
initialize_database()

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(inventory_router, prefix="/api/inventory", tags=["Inventory"])
app.include_router(sales_router, prefix="/api/sales", tags=["Sales"])
app.include_router(purchases_router, prefix="/api/purchases", tags=["Purchases"])
app.include_router(payroll_router, prefix="/api/payroll", tags=["Payroll"])
app.include_router(reports_router, prefix="/api/reports", tags=["Reports"])
app.include_router(users_router, prefix="/api/users", tags=["Users"])

# Serve static files
app.mount("/", StaticFiles(directory="static", html=True), name="static")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Accounting Management System is running"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
