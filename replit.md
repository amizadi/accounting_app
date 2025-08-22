# Accounting Management System

## Overview

This is a comprehensive web-based accounting management system designed for small businesses. The application provides complete business management functionality including inventory tracking, sales processing, purchase management, payroll administration, financial reporting, and user management. It features a FastAPI backend with an in-memory database and a responsive frontend built with vanilla JavaScript and Tailwind CSS.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Architecture
- **Framework**: FastAPI with Python, providing a RESTful API architecture
- **Authentication**: JWT-based authentication system using PyJWT and Passlib for password hashing
- **Data Storage**: In-memory database implementation using Python dictionaries for rapid prototyping and development
- **API Structure**: Modular router-based organization with separate modules for auth, inventory, sales, purchases, payroll, reports, and users
- **Security**: Role-based access control with staff and manager roles, CORS middleware for cross-origin requests

### Frontend Architecture
- **Framework**: Vanilla JavaScript with modular component architecture
- **Styling**: Tailwind CSS for responsive design and UI components
- **State Management**: Global application state management through window objects
- **Authentication Flow**: Token-based authentication with automatic token validation and refresh handling
- **Module Organization**: Separate JavaScript modules for each business function (inventory, sales, purchases, payroll, reports, users)

### Data Models
- **Users**: Role-based user system with staff and manager permissions
- **Inventory**: Complete item management with SKU tracking, stock levels, and reorder points
- **Sales**: Transaction processing with line items and automatic inventory updates
- **Purchases**: Supplier transaction tracking with inventory replenishment
- **Payroll**: Employee compensation management with overtime, bonuses, and deductions
- **Reporting**: Financial summaries and business intelligence dashboards

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication with configurable expiration times
- **Password Security**: Bcrypt hashing for secure password storage
- **Role-Based Permissions**: Manager-only access for sensitive operations like user management and payroll
- **Token Validation**: Automatic token verification on protected endpoints

### API Design
- **RESTful Endpoints**: Standard HTTP methods for CRUD operations
- **Response Models**: Pydantic models for request/response validation
- **Error Handling**: Structured HTTP exception handling with appropriate status codes
- **CORS Support**: Cross-origin request handling for development and production

## External Dependencies

### Python Backend Dependencies
- **FastAPI**: Web framework for building APIs
- **Uvicorn**: ASGI server for running the FastAPI application
- **PyJWT**: JWT token creation and validation
- **Passlib**: Password hashing and verification utilities
- **Pydantic**: Data validation and serialization through type hints

### Frontend Dependencies
- **Axios**: HTTP client for API communication
- **Tailwind CSS**: Utility-first CSS framework via CDN
- **Feather Icons**: Icon library for UI elements
- **Font Awesome**: Additional icon resources

### Development Considerations
- **Database Migration Path**: Current in-memory storage designed for easy migration to persistent databases (PostgreSQL, MySQL, SQLite)
- **Static File Serving**: FastAPI serves static frontend files directly
- **CORS Configuration**: Configured for development with permissive settings (should be restricted in production)
- **Default Credentials**: Admin user (username: admin, password: admin123) created on initialization