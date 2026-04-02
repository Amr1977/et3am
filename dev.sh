#!/bin/bash
echo "Starting Et3am Development Servers..."
echo ""
echo "Backend running on http://localhost:3001"
echo "Frontend running on http://localhost:5173"
echo ""

# Run both in background
(cd backend && npm run dev) &
(cd frontend && npm run dev) &

# Wait for both to finish
wait
