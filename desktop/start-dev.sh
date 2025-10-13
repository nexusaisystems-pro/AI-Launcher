#!/bin/bash

# GameHub Launcher - Desktop Development Start Script

echo "🚀 Starting GameHub Launcher Desktop..."

# Check if backend is running
if ! lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Backend not running. Starting backend server..."
    npm run dev &
    BACKEND_PID=$!
    echo "   Backend started (PID: $BACKEND_PID)"
    
    # Wait for backend to be ready
    echo "   Waiting for backend..."
    sleep 3
else
    echo "✓  Backend already running on port 5000"
fi

# Start Electron
echo "🖥️  Launching Electron..."
NODE_ENV=development electron .

# Cleanup on exit
if [ ! -z "$BACKEND_PID" ]; then
    echo "🛑 Stopping backend server..."
    kill $BACKEND_PID 2>/dev/null
fi

echo "✨ Desktop app closed"
