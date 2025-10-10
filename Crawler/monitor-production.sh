#!/bin/bash
# Production Crawl Progress Monitor
# Usage: bash monitor-production.sh [log-file]

LOG_FILE="${1:-logs/production-night-1.log}"

echo "========================================="
echo "🕷️  Production Crawl Monitor"
echo "========================================="
echo ""

# Check if log file exists
if [ ! -f "$LOG_FILE" ]; then
    echo "❌ Log file not found: $LOG_FILE"
    exit 1
fi

# Check if crawl is running
if ps aux | grep -q "[n]ode dist/main.js"; then
    echo "✅ Crawler is RUNNING"
else
    echo "⚠️  Crawler is NOT running"
fi

echo ""
echo "--- Latest Progress (Last 5 Updates) ---"
grep "📊 Progress Update" -A 4 "$LOG_FILE" | tail -25

echo ""
echo "--- Success/Failure Statistics ---"
SUCCESSFUL=$(grep -c "✅ Extracted" "$LOG_FILE")
FAILED=$(grep -c "❌ Failed\|❌ BLOCKED\|❌ Error" "$LOG_FILE")
BLOCKED_403=$(grep -c "❌ BLOCKED: 403" "$LOG_FILE")
TIMEOUTS=$(grep -c "Timeout.*exceeded" "$LOG_FILE")
HTTP_520=$(grep -c "HTTP Status: 520" "$LOG_FILE")

echo "✅ Successful extractions: $SUCCESSFUL"
echo "❌ Total failures: $FAILED"
echo "🚫 403 Blocking errors: $BLOCKED_403"
echo "⏱️  Timeout errors: $TIMEOUTS"
echo "🔴 HTTP 520 errors: $HTTP_520"

if [ $SUCCESSFUL -gt 0 ] && [ $FAILED -gt 0 ]; then
    TOTAL=$((SUCCESSFUL + FAILED))
    SUCCESS_RATE=$((SUCCESSFUL * 100 / TOTAL))
    echo "📊 Success rate: $SUCCESS_RATE% ($SUCCESSFUL/$TOTAL)"
fi

echo ""
echo "--- Latest Successful Extraction ---"
grep "✅ Extracted" "$LOG_FILE" | tail -1
grep "Rooms:" "$LOG_FILE" | tail -1

echo ""
echo "--- Data Quality Check (Rooms Values) ---"
grep "Rooms:" "$LOG_FILE" | tail -10

echo ""
echo "--- Latest Errors (if any) ---"
grep "❌" "$LOG_FILE" | tail -5

echo ""
echo "--- Performance Metrics ---"
grep "📈 Rate:" "$LOG_FILE" | tail -1

echo ""
echo "========================================="
echo "To watch live updates:"
echo "  tail -f $LOG_FILE | grep 'Progress Update\\|Extracted\\|Failed'"
echo ""
echo "To run this monitor again:"
echo "  bash monitor-production.sh $LOG_FILE"
echo "========================================="
