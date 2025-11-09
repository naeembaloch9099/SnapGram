#!/bin/bash
# Get local IP address and create .env.local file
# Run this from the FrontEnd directory to auto-configure

# Try to get the local IP address
LOCAL_IP=$(ifconfig | grep -E "inet " | grep -v "127.0.0.1" | awk '{print $2}' | head -1)

if [ -z "$LOCAL_IP" ]; then
    # Fallback for some systems
    LOCAL_IP=$(ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v "127.0.0.1" | head -1)
fi

if [ -n "$LOCAL_IP" ]; then
    echo "Found your local IP: $LOCAL_IP"
    echo "Creating .env.local with VITE_API_URL=http://$LOCAL_IP:4000/api"
    
    cat > .env.local << EOF
# Auto-generated local environment
VITE_API_URL=http://$LOCAL_IP:4000/api
EOF
    
    echo "✓ Created .env.local"
    echo ""
    echo "Access your app from:"
    echo "  - Localhost: http://localhost:5173"
    echo "  - Local Network: http://$LOCAL_IP:5173"
    echo "  - Mobile/Other Device: http://$LOCAL_IP:5173"
else
    echo "Could not find local IP address"
    echo "Please manually set VITE_API_URL in .env.local"
fi
