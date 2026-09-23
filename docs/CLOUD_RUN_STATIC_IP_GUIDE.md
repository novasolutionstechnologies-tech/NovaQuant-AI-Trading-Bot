# NovaQuant AI Trading Bot: Cloud Run Backend with Static IP Guide

This guide walks you through deploying the **NovaQuant backend** to Google Cloud Run, provisioning a **dedicated Static Outbound IP**, whitelisting that IP in **Binance, Bybit, and Bitget**, and connecting your **AI Studio frontend** to the backend.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Google Cloud Architecture                          │
│                                                                             │
│  ┌───────────────────────┐                                                  │
│  │ AI Studio Frontend    │ (Browser / Preview / Shared App)                 │
│  └───────────┬───────────┘                                                  │
│              │ HTTPS / WSS API & Live Ticker Streams                        │
│              ▼                                                              │
│  ┌───────────────────────┐                                                  │
│  │ Google Cloud Run      │ (NovaQuant Engine: Express + AI Consensus)       │
│  │ Service               │                                                  │
│  └───────────┬───────────┘                                                  │
│              │ VPC Egress: "ALL_TRAFFIC"                                    │
│              ▼                                                              │
│  ┌───────────────────────┐                                                  │
│  │ Serverless VPC Access │ (10.8.0.0/28)                                    │
│  │ Connector             │                                                  │
│  └───────────┬───────────┘                                                  │
│              ▼                                                              │
│  ┌───────────────────────┐                                                  │
│  │ Custom VPC & Subnet   │ (10.10.0.0/24)                                   │
│  └───────────┬───────────┘                                                  │
│              ▼                                                              │
│  ┌───────────────────────┐                                                  │
│  │ Cloud Router & NAT    │ ──── Bound to Dedicated Static Regional IP       │
│  └───────────┬───────────┘      [e.g., 34.126.154.21]                       │
└──────────────┼──────────────────────────────────────────────────────────────┘
               │
               │ Outgoing orders strictly routed from Static IP
               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Cryptocurrency Exchange APIs                          │
│                                                                             │
│  ┌─────────────────────┐   ┌─────────────────────┐   ┌───────────────────┐  │
│  │ Binance API         │   │ Bybit API           │   │ Bitget API        │  │
│  │ Whitelist: Static IP│   │ Whitelist: Static IP│   │ Whitelist: Static │  │
│  └─────────────────────┘   └─────────────────────┘   └───────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Option 1: Automated 1-Command Deployment (Recommended)

Run the included automated deployment script:

```bash
chmod +x ./deploy-cloud-run-static-ip.sh
./deploy-cloud-run-static-ip.sh
```

The script automatically:
1. Enables required Google Cloud APIs (`run`, `compute`, `vpcaccess`, `cloudbuild`).
2. Creates the VPC network (`novaquant-vpc`) and subnet (`novaquant-subnet`).
3. Reserves a Regional Static External IP address (`novaquant-static-ip`).
4. Configures a Cloud Router and Cloud NAT using that Static IP for 100% of egress traffic.
5. Deploys the container to Cloud Run with `--vpc-egress=all-traffic`.
6. Verifies that the deployed instance's live outbound IP matches the reserved static IP.
7. Displays your static IP and exchange whitelisting steps.

---

## 🛠️ Option 2: Step-by-Step Manual `gcloud` Commands

If you prefer executing commands individually:

### 1. Set Environment Variables
```bash
PROJECT_ID="your-gcp-project-id"
REGION="asia-southeast1" # or your preferred region
gcloud config set project $PROJECT_ID
```

### 2. Enable Required APIs
```bash
gcloud services enable \
  run.googleapis.com \
  compute.googleapis.com \
  vpcaccess.googleapis.com \
  cloudbuild.googleapis.com
```

### 3. Create Custom VPC and Subnet
```bash
gcloud compute networks create novaquant-vpc --subnet-mode=custom

gcloud compute networks subnets create novaquant-subnet \
  --network=novaquant-vpc \
  --region=$REGION \
  --range=10.10.0.0/24
```

### 4. Reserve Static External IP
```bash
gcloud compute addresses create novaquant-static-ip --region=$REGION

STATIC_IP=$(gcloud compute addresses describe novaquant-static-ip --region=$REGION --format='value(address)')
echo "Your Static IP is: $STATIC_IP"
```

### 5. Create Cloud Router & Cloud NAT
```bash
# Router
gcloud compute routers create novaquant-router \
  --network=novaquant-vpc \
  --region=$REGION

# NAT Gateway (forces all egress to use your static IP)
gcloud compute routers nats create novaquant-nat \
  --router=novaquant-router \
  --region=$REGION \
  --nat-custom-subnet-ip-ranges=novaquant-subnet \
  --nat-external-ip-pool=novaquant-static-ip
```

### 6. Create Serverless VPC Access Connector
```bash
gcloud compute networks vpc-access connectors create novaquant-connector \
  --region=$REGION \
  --network=novaquant-vpc \
  --range=10.8.0.0/28 \
  --min-instances=2 \
  --max-instances=3 \
  --machine-type=e2-micro
```

### 7. Deploy to Cloud Run with All-Traffic Egress
```bash
gcloud run deploy novaquant-backend \
  --source . \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --vpc-connector=novaquant-connector \
  --vpc-egress=all-traffic \
  --set-env-vars="NODE_ENV=production,STATIC_OUTBOUND_IP=$STATIC_IP" \
  --memory=1Gi \
  --cpu=1
```

---

## 🔒 Exchange IP Whitelisting Instructions

### 🟡 Binance
1. Log in to [Binance API Management](https://www.binance.com/en/my/settings/api-management).
2. Locate or create your API Key, then click **Edit Restrictions**.
3. Under **IP Access Restriction**, select:
   👉 **Restrict access to trusted IPs only (Recommended)**
4. Paste your Static IP: `34.xxx.xxx.xxx` (or comma-separated if multiple).
5. Ensure:
   - ✅ **Enable Reading** (Checked)
   - ✅ **Enable Spot & Margin Trading** (Checked)
   - ✅ **Enable Futures** (Checked, if trading derivatives)
   - ❌ **Enable Withdrawals** (STRICTLY UNCHECKED for institutional security)
6. Click **Save** and complete 2FA verification.

### 🟠 Bybit
1. Log in to [Bybit API Management](https://www.bybit.com/app/user/api-management).
2. Click **Create New Key** or **Modify** existing key.
3. Select API Key usage: **System-generated API Keys** (API Transaction).
4. Under **IP Access Restriction**, select:
   👉 **Only IPs with permissions specified below are permitted to access this API**
5. Enter your Static IP.
6. Under API Key Permissions:
   - Permission: **Read-Write**
   - Check **Orders**, **Positions**, **USDC Derivatives**
   - ❌ **Do NOT enable Withdrawals**
7. Submit and confirm with 2FA.

### 🔵 Bitget
1. Log in to [Bitget API Keys Management](https://www.bitget.com/account/api-management).
2. Click **Create API Key** or **Edit**.
3. Under **Link IP address (strongly recommended)**:
   👉 Enter your Static IP.
4. Permissions:
   - Check **Read**, **Trade**.
   - ❌ **Do NOT check Transfer or Withdraw**.
5. Save with SMS/Email and Google Authenticator verification.

---

## 🔗 Connecting AI Studio Frontend to Backend

In the AI Studio Web Interface:

1. Click on the **Backend Connection** indicator in the top navbar or navigate to **API & Key Management**.
2. Open the **Cloud Run & Static IP Setup** modal.
3. Enter your deployed Cloud Run URL (e.g., `https://novaquant-backend-xxxxxx.asia-southeast1.run.app`).
4. Click **Test & Connect**:
   - The UI runs a latency check, confirms CORS compatibility, and verifies that the backend responds.
   - The frontend persists the connection in `localStorage` and automatically switches WebSocket streaming (`/ws`) to your Cloud Run container.
5. All live trading orders, AI consensus calculations, and ticker broadcasts will now run with your dedicated static IP!
