#!/bin/bash

# Production startup script for Centa Returns API

# Set environment
export FLASK_ENV=production
export FLASK_DEBUG=False

# Activate virtual environment (if using one)
# source venv/bin/activate

# Run database migrations
echo "Running database migrations..."
flask db upgrade

# Start the application with Gunicorn
echo "Starting Centa Returns API with Gunicorn..."
gunicorn -c gunicorn.conf.py app:app
