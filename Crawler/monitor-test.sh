#!/bin/bash
# Monitor 100-property test progress
# Usage: bash monitor-test.sh

echo "========================================="
echo "100-Property Test Progress Monitor"
echo "========================================="
echo ""

# Check if test is running
if ps aux | grep -q "[n]ode dist/main.js"; then
    echo "✅ Test is RUNNING"
else
    echo "⚠️  Test is NOT running"
    exit 1
fi

echo ""
echo "--- Latest Progress Stats ---"
tail -20 test-100-properties.log | grep "Progress Update" -A 4 | tail -5

echo ""
echo "--- Rooms Values (Data Quality) ---"
grep "Rooms:" test-100-properties.log | tail -10

echo ""
echo "--- Success/Failure Count ---"
echo "Successful: $(grep -c "✅ Extracted" test-100-properties.log)"
echo "Failed: $(grep -c "❌ Failed" test-100-properties.log)"
echo "HTTP 520 errors: $(grep -c "HTTP Status: 520" test-100-properties.log)"
echo "Retries attempted: $(grep -c "🔄 Retry attempt" test-100-properties.log)"

echo ""
echo "--- Performance ---"
grep "📈 Rate:" test-100-properties.log | tail -1

echo ""
echo "--- Estimated Completion ---"
PROPS_DONE=$(grep "Properties:" test-100-properties.log | tail -1 | grep -oP '\d+ found' | grep -oP '\d+')
PROPS_TOTAL=100
if [ -n "$PROPS_DONE" ]; then
    REMAINING=$((PROPS_TOTAL - PROPS_DONE))
    # Assuming ~0.5 properties/min with production delays
    MINS_LEFT=$((REMAINING * 2))
    HOURS_LEFT=$((MINS_LEFT / 60))
    echo "Properties completed: $PROPS_DONE/$PROPS_TOTAL"
    echo "Estimated time remaining: ~$HOURS_LEFT hours"
else
    echo "Unable to calculate"
fi

echo ""
echo "========================================="
echo "To watch live: tail -f test-100-properties.log | grep 'Progress Update'"
echo "========================================="
