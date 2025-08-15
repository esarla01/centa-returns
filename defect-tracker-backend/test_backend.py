#!/usr/bin/env python3

try:
    print("Testing backend imports...")
    from app import app
    print("✅ Backend imports successfully!")
    
    print("Testing database connection...")
    with app.app_context():
        from models import db
        db.engine.execute("SELECT 1")
        print("✅ Database connection successful!")
        
    print("✅ Backend is ready to run!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
