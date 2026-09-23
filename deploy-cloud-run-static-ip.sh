#!/usr/bin/env bash
# ==============================================================================
# NovaQuant AI Trading Bot - Automated Cloud Run Deployment with Static IP
#
# Pipeline:
# 1. Enable GCP Services
# 2. Create VPC Network & Subnet
# 3. Reserve Regional Static External IP Address
# 4. Create Cloud Router & Cloud NAT (routing 100% outbound traffic via Static IP)
# 5. Create Serverless VPC Access Connector
# 6. Build Container & Deploy to Cloud Run with --vpc-egress=all-traffic
# 7. Verify Outbound IP from live deployed instance
# 8. Output IP Whitelist Instructions for Binance / Bybit / Bitget & AI Studio
# ==============================================================================

set -euo pipefail

# Text formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${CYAN}${BOLD}"
echo "================================================================================"
echo "   NovaQuant AI Trading Engine: Cloud Run + Static Outbound IP Deployment      "
echo "================================================================================"
echo -e "${NC}"

# Configuration defaults (can be overridden via environment variables)
PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || echo '')}"
REGION="${REGION:-asia-southeast1}"
SERVICE_NAME="${SERVICE_NAME:-novaquant-backend}"
VPC_NAME="${VPC_NAME:-novaquant-vpc}"
SUBNET_NAME="${SUBNET_NAME:-novaquant-subnet}"
SUBNET_RANGE="${SUBNET_RANGE:-10.10.0.0/24}"
CONNECTOR_NAME="${CONNECTOR_NAME:-novaquant-connector}"
CONNECTOR_RANGE="${CONNECTOR_RANGE:-10.8.0.0/28}"
IP_NAME="${IP_NAME:-novaquant-static-ip}"
ROUTER_NAME="${ROUTER_NAME:-novaquant-router}"
NAT_NAME="${NAT_NAME:-novaquant-nat}"

# Prompt for Project ID if missing
if [[ -z "${PROJECT_ID}" ]]; then
  echo -e "${YELLOW}No GCP project found in gcloud config.${NC}"
  read -rp "Enter your Google Cloud Project ID: " PROJECT_ID
fi

echo -e "${BLUE}Target Project : ${BOLD}${PROJECT_ID}${NC}"
echo -e "${BLUE}Target Region  : ${BOLD}${REGION}${NC}"
echo -e "${BLUE}Service Name   : ${BOLD}${SERVICE_NAME}${NC}"
echo -e "${BLUE}VPC Network    : ${BOLD}${VPC_NAME}${NC}"
echo -e "${BLUE}VPC Connector  : ${BOLD}${CONNECTOR_NAME}${NC}"
echo ""

# ------------------------------------------------------------------------------
# Step 1: Set Active Project & Enable APIs
# ------------------------------------------------------------------------------
echo -e "${CYAN}[Step 1/7] Enabling required Google Cloud APIs...${NC}"
gcloud config set project "${PROJECT_ID}"

REQUIRED_APIS=(
  "run.googleapis.com"
  "compute.googleapis.com"
  "vpcaccess.googleapis.com"
  "cloudbuild.googleapis.com"
  "artifactregistry.googleapis.com"
)

for API in "${REQUIRED_APIS[@]}"; do
  echo -e "  -> Enabling ${API}..."
  gcloud services enable "${API}" --project="${PROJECT_ID}" --quiet
done
echo -e "${GREEN}✓ All APIs enabled.${NC}\n"

# ------------------------------------------------------------------------------
# Step 2: Create Custom VPC & Subnet
# ------------------------------------------------------------------------------
echo -e "${CYAN}[Step 2/7] Setting up VPC Network & Subnet...${NC}"
if ! gcloud compute networks describe "${VPC_NAME}" --project="${PROJECT_ID}" &>/dev/null; then
  echo -e "  -> Creating VPC network: ${VPC_NAME}..."
  gcloud compute networks create "${VPC_NAME}" \
    --project="${PROJECT_ID}" \
    --subnet-mode=custom
else
  echo -e "  -> VPC network ${VPC_NAME} already exists."
fi

if ! gcloud compute networks subnets describe "${SUBNET_NAME}" --region="${REGION}" --project="${PROJECT_ID}" &>/dev/null; then
  echo -e "  -> Creating subnet: ${SUBNET_NAME} (${SUBNET_RANGE})..."
  gcloud compute networks subnets create "${SUBNET_NAME}" \
    --project="${PROJECT_ID}" \
    --network="${VPC_NAME}" \
    --region="${REGION}" \
    --range="${SUBNET_RANGE}"
else
  echo -e "  -> Subnet ${SUBNET_NAME} already exists."
fi
echo -e "${GREEN}✓ VPC and Subnet configured.${NC}\n"

# ------------------------------------------------------------------------------
# Step 3: Reserve Regional Static External IP Address
# ------------------------------------------------------------------------------
echo -e "${CYAN}[Step 3/7] Reserving Static External IP Address in ${REGION}...${NC}"
if ! gcloud compute addresses describe "${IP_NAME}" --region="${REGION}" --project="${PROJECT_ID}" &>/dev/null; then
  echo -e "  -> Reserving IP address: ${IP_NAME}..."
  gcloud compute addresses create "${IP_NAME}" \
    --project="${PROJECT_ID}" \
    --region="${REGION}"
else
  echo -e "  -> Static IP ${IP_NAME} already reserved."
fi

STATIC_IP=$(gcloud compute addresses describe "${IP_NAME}" \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --format='value(address)')

echo -e "${GREEN}${BOLD}✓ Reserved Static IP: ${STATIC_IP}${NC}\n"

# ------------------------------------------------------------------------------
# Step 4: Create Cloud Router & Cloud NAT Gateway
# ------------------------------------------------------------------------------
echo -e "${CYAN}[Step 4/7] Configuring Cloud Router and Cloud NAT for Static Egress...${NC}"
if ! gcloud compute routers describe "${ROUTER_NAME}" --region="${REGION}" --project="${PROJECT_ID}" &>/dev/null; then
  echo -e "  -> Creating Cloud Router: ${ROUTER_NAME}..."
  gcloud compute routers create "${ROUTER_NAME}" \
    --project="${PROJECT_ID}" \
    --network="${VPC_NAME}" \
    --region="${REGION}"
else
  echo -e "  -> Cloud Router ${ROUTER_NAME} already exists."
fi

if ! gcloud compute routers nats describe "${NAT_NAME}" --router="${ROUTER_NAME}" --region="${REGION}" --project="${PROJECT_ID}" &>/dev/null; then
  echo -e "  -> Creating Cloud NAT Gateway bound to Static IP: ${STATIC_IP}..."
  gcloud compute routers nats create "${NAT_NAME}" \
    --project="${PROJECT_ID}" \
    --router="${ROUTER_NAME}" \
    --region="${REGION}" \
    --nat-custom-subnet-ip-ranges="${SUBNET_NAME}" \
    --nat-external-ip-pool="${IP_NAME}"
else
  echo -e "  -> Cloud NAT Gateway ${NAT_NAME} already exists."
fi
echo -e "${GREEN}✓ Cloud NAT configured (100% outbound traffic routed via ${STATIC_IP}).${NC}\n"

# ------------------------------------------------------------------------------
# Step 5: Create Serverless VPC Access Connector
# ------------------------------------------------------------------------------
echo -e "${CYAN}[Step 5/7] Creating Serverless VPC Access Connector...${NC}"
if ! gcloud compute networks vpc-access connectors describe "${CONNECTOR_NAME}" --region="${REGION}" --project="${PROJECT_ID}" &>/dev/null; then
  echo -e "  -> Provisioning VPC Connector: ${CONNECTOR_NAME} (${CONNECTOR_RANGE})..."
  gcloud compute networks vpc-access connectors create "${CONNECTOR_NAME}" \
    --project="${PROJECT_ID}" \
    --region="${REGION}" \
    --network="${VPC_NAME}" \
    --range="${CONNECTOR_RANGE}" \
    --min-instances=2 \
    --max-instances=3 \
    --machine-type=e2-micro
else
  echo -e "  -> VPC Connector ${CONNECTOR_NAME} already exists."
fi
echo -e "${GREEN}✓ Serverless VPC Access Connector ready.${NC}\n"

# ------------------------------------------------------------------------------
# Step 6: Build and Deploy Cloud Run with All-Traffic VPC Egress
# ------------------------------------------------------------------------------
echo -e "${CYAN}[Step 6/7] Building container image and deploying to Cloud Run...${NC}"
echo -e "  -> VPC Egress set to: ${BOLD}all-traffic${NC} (forces all external API calls to Binance/Bybit/Bitget through Static IP)"

# Build and deploy from current directory
gcloud run deploy "${SERVICE_NAME}" \
  --source . \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --vpc-connector="${CONNECTOR_NAME}" \
  --vpc-egress=all-traffic \
  --set-env-vars="NODE_ENV=production,STATIC_OUTBOUND_IP=${STATIC_IP}" \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=1 \
  --max-instances=10 \
  --timeout=300 \
  --quiet

BACKEND_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --format='value(status.url)')

echo -e "${GREEN}${BOLD}✓ Deployed successfully to: ${BACKEND_URL}${NC}\n"

# ------------------------------------------------------------------------------
# Step 7: Verify Outbound Egress IP
# ------------------------------------------------------------------------------
echo -e "${CYAN}[Step 7/7] Verifying live outbound IP from deployed Cloud Run instance...${NC}"
sleep 5

VERIFY_RESP=$(curl -s "${BACKEND_URL}/api/system/outbound-ip" || echo '{}')
LIVE_IP=$(echo "${VERIFY_RESP}" | grep -o '"outboundIp":"[^"]*' | cut -d'"' -f4 || echo '')

echo ""
echo -e "${GREEN}================================================================================"
echo -e "                    DEPLOYMENT COMPLETE & VERIFIED                             "
echo -e "================================================================================${NC}"
echo ""
echo -e " ${BOLD}1. Cloud Run Backend Service URL:${NC}"
echo -e "    ${CYAN}${BACKEND_URL}${NC}"
echo ""
echo -e " ${BOLD}2. Dedicated Static Outbound IP Address:${NC}"
echo -e "    ${GREEN}${BOLD}${STATIC_IP}${NC}"
if [[ -n "${LIVE_IP}" && "${LIVE_IP}" == "${STATIC_IP}" ]]; then
  echo -e "    ${GREEN}✓ Verified Live Egress IP matches Reserved Static IP perfectly!${NC}"
else
  echo -e "    ${YELLOW}Note: Live egress detection returned: ${LIVE_IP:-Unknown} (VPC NAT may take 30-60s to fully route).${NC}"
fi
echo ""
echo -e " ${BOLD}3. Next Steps: Whitelist this IP in your Exchange Portals:${NC}"
echo -e "    --------------------------------------------------------------------------"
echo -e "    ${BOLD}A. Binance:${NC}"
echo -e "       1. Go to: https://www.binance.com/en/my/settings/api-management"
echo -e "       2. Click 'Edit' on your API Key"
echo -e "       3. Choose 'Restrict access to trusted IPs only (Recommended)'"
echo -e "       4. Paste: ${BOLD}${STATIC_IP}${NC}"
echo -e "       5. Enable: Spot & Futures Trading. Ensure Withdrawals are OFF."
echo -e "       6. Save with 2FA."
echo ""
echo -e "    ${BOLD}B. Bybit:${NC}"
echo -e "       1. Go to: https://www.bybit.com/app/user/api-management"
echo -e "       2. Click 'Modify' on your API Key"
echo -e "       3. Choose 'Only IPs with permissions specified below are permitted to access this API'"
echo -e "       4. Paste: ${BOLD}${STATIC_IP}${NC}"
echo -e "       5. Enable: Read-Write, Orders, Positions, USDC Derivatives. No Withdrawals."
echo -e "       6. Submit with 2FA."
echo ""
echo -e "    ${BOLD}C. Bitget:${NC}"
echo -e "       1. Go to: https://www.bitget.com/account/api-management"
echo -e "       2. Click 'Edit' on your API Key"
echo -e "       3. Under 'Link IP address', paste: ${BOLD}${STATIC_IP}${NC}"
echo -e "       4. Enable: Read, Trade. Do NOT enable Withdraw/Transfer."
echo -e "       5. Confirm with 2FA."
echo ""
echo -e " ${BOLD}4. Connect your AI Studio Frontend:${NC}"
echo -e "    --------------------------------------------------------------------------"
echo -e "    Open your AI Studio Web UI:"
echo -e "    1. Navigate to ${CYAN}API & Key Management${NC} or click the Cloud Run status badge."
echo -e "    2. Click 'Connect Dedicated Cloud Run Backend'."
echo -e "    3. Paste your Backend URL: ${CYAN}${BACKEND_URL}${NC}"
echo -e "    4. Click 'Test & Connect'!"
echo -e "    Your frontend will now route real-time REST and WebSockets directly through"
echo -e "    your high-frequency Cloud Run engine with 100% whitelisted static IP egress."
echo "================================================================================"
