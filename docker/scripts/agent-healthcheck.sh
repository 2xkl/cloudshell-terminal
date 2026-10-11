#!/bin/bash

# RHEL Build Agent Healthcheck Script

BACKEND_URL="${BACKEND_URL:-http://backend:4000}"
AGENT_NAME="${AGENT_NAME:-unknown}"

check_backend() {
    curl -s -o /dev/null -w "%{http_code}" "${BACKEND_URL}/health" | grep -q "200"
}

report_status() {
    local status=$1
    curl -s -X POST "${BACKEND_URL}/api/agents/status" \
        -H "Content-Type: application/json" \
        -d "{\"agent\": \"${AGENT_NAME}\", \"status\": \"${status}\"}"
}

main() {
    if check_backend; then
        report_status "healthy"
        exit 0
    else
        report_status "unhealthy"
        exit 1
    fi
}

main
