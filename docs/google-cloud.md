# Google Cloud Deployment (Prebaked Template Flow)

This runbook describes the production GCP flow implemented in `@workspace/openclaw`:

- One VM per user
- VM created from a prebuilt instance template
- Startup script only writes per-user OpenClaw config and starts the gateway via systemd
- OpenClaw runs natively (no Docker); no package install/bootstrap at runtime

## 1) Prerequisites

- GCP project with billing enabled
- Compute Engine API enabled
- `gcloud` CLI installed

```bash
gcloud auth login
gcloud config set project <PROJECT_ID>
gcloud services enable compute.googleapis.com
```

### Authentication

The GCP provider uses explicit auth via `google-auth-library`. Credentials are read from:

- **Local dev:** run once:  
  `gcloud auth application-default login`  
  `gcloud auth application-default set-quota-project <PROJECT_ID>`

- **Vercel / serverless (no filesystem):** base64-encode the service account JSON and set `GCP_CREDENTIALS`:

  ```bash
  base64 -i openclaw-deploy-key.json | tr -d '\n'
  ```

  Paste the output into the env var (Vercel → Settings → Environment Variables). Mark as sensitive.

- **Running on GCP (Cloud Run, GKE, etc.):** attach a service account to the workload; no env vars needed.

## 2) Build the prebaked golden image

Create a temporary builder VM:

```bash
gcloud compute instances create openclaw-image-builder \
  --project=<PROJECT_ID> \
  --zone=us-central1-a \
  --machine-type=e2-small \
  --boot-disk-size=20GB \
  --image-family=debian-12 \
  --image-project=debian-cloud
```

SSH into it:

```bash
gcloud compute ssh openclaw-image-builder --project=<PROJECT_ID> --zone=us-central1-a
```

Install OpenClaw via the official installer (no Docker):

```bash
sudo apt-get update
sudo apt-get install -y curl ca-certificates
curl -fsSL https://openclaw.ai/install.sh | sudo bash -s -- --no-onboard
```

Verify OpenClaw is installed:

```bash
openclaw --version
```

Stop builder and create custom image family:

```bash
gcloud compute instances stop openclaw-image-builder \
  --project=<PROJECT_ID> --zone=us-central1-a

gcloud compute images create openclaw-gateway-2026-02-28 \
  --project=<PROJECT_ID> \
  --source-disk=openclaw-image-builder \
  --source-disk-zone=us-central1-a \
  --family=openclaw-gateway
```

## 3) Create instance template from the image family

```bash
gcloud compute instance-templates create openclaw-gateway-template \
  --project=<PROJECT_ID> \
  --machine-type=e2-small \
  --network=default \
  --tags=openclaw-gateway \
  --image-family=openclaw-gateway \
  --image-project=<PROJECT_ID> \
  --boot-disk-size=20GB
```

Adjust network/subnetwork/service-account flags as needed.

## 4) Configure app environment

In `apps/web/.env.local`, set:

```bash
GCP_PROJECT_ID="<PROJECT_ID>"
GCP_ZONE="us-central1-a"
GCP_INSTANCE_TEMPLATE_NAME="openclaw-gateway-template"
GCP_OPENCLAW_STATE_DIR="/var/lib/openclaw"
# Optional: enables https://<id>.<domain-suffix> (requires HTTPS routing setup)
GCP_INSTANCE_DOMAIN_SUFFIX="openclaw.your-domain.com"
```

Important:

- If using wildcard DNS for URLs, also set `GCP_INSTANCE_DOMAIN_SUFFIX` and `GCP_URL_SCHEME`.

### CLI execution (pairing approve, devices list, etc.)

CLI commands use **OS Login** with the same service account as `GCP_CREDENTIALS`. No extra keys needed.

1. Enable [OS Login](https://cloud.google.com/compute/docs/oslogin) on the project (or it is enabled per-instance via `enable-oslogin` metadata).
2. Grant the service account `roles/compute.osAdminLogin` so it can SSH to VMs.
3. Enable the [OS Login API](https://console.cloud.google.com/apis/library/oslogin.googleapis.com).

## 5) Deployment behavior

When user clicks submit:

1. API calls GCP provider
2. Provider computes deterministic instance name from user id
3. Provider creates VM from `sourceInstanceTemplate`
4. Provider overrides `startup-script` metadata only
5. VM startup script:
   - writes `openclaw.json` (including API keys in config `env` block) to `${GCP_OPENCLAW_STATE_DIR}` (default `/var/lib/openclaw`)
   - runs `openclaw gateway` in background via nohup
6. Provider returns tokenized URL data to API (`id`, `token`)

## 6) Update process for new OpenClaw version

When upgrading OpenClaw:

1. Build new golden image: SSH into builder VM and run `curl -fsSL https://openclaw.ai/install.sh | sudo bash -s -- --no-onboard` (or reinstall)
2. Stop builder, create new disk image, update image family (`openclaw-gateway`)
3. Recreate instance template to use new image

## 7) Verify and troubleshoot

List VMs:

```bash
gcloud compute instances list --project=<PROJECT_ID>
```

Check serial output for startup script:

```bash
gcloud compute instances get-serial-port-output <INSTANCE_NAME> \
  --project=<PROJECT_ID> \
  --zone=us-central1-a
```

SSH and verify gateway:

```bash
gcloud compute ssh <INSTANCE_NAME> --project=<PROJECT_ID> --zone=us-central1-a
pgrep -af "openclaw gateway"
```

## 8) One-Time Managed Ingress Setup (GCP LB + Cloud Run Proxy)

This section configures a single managed ingress path for all instances:

- `https://<id>.<domain>` from one wildcard DNS record
- Global external HTTPS load balancer
- Cloud Run proxy backend
- Google-managed wildcard certificate via Certificate Manager DNS authorization

After this is set up once, new instances do **not** need DNS or load balancer changes.

### Prerequisites

- Required APIs:
  - `compute.googleapis.com`
  - `run.googleapis.com`
  - `certificatemanager.googleapis.com`
  - `cloudbuild.googleapis.com`
  - `artifactregistry.googleapis.com`
- Required IAM roles on the target project:
  - `roles/run.admin`
  - `roles/iam.serviceAccountUser`
  - `roles/compute.loadBalancerAdmin`
  - `roles/compute.networkAdmin`
  - `roles/certificatemanager.editor`
  - For production, prefer narrower/custom IAM roles instead of broad owner-style roles.
- Inputs you need:
  - `PROJECT_ID`
  - `REGION`
  - `ZONE`
  - `DOMAIN`
  - `SERVICE_NAME`
  - `PREFIX`
  - `NETWORK`
  - `SUBNET`

### Set variables once

```bash
export PROJECT_ID="<your-gcp-project-id>"
export REGION="us-central1"
export ZONE="us-central1-a"
export DOMAIN="example.com"
export SERVICE_NAME="openclaw-ingress-proxy"
export PREFIX="openclaw"
export NETWORK="default"
export SUBNET="default"
```

For production, use a dedicated custom VPC and subnet instead of `default`.

### 8.1 Enable required APIs

```bash
gcloud config set project "$PROJECT_ID"

gcloud services enable \
  compute.googleapis.com \
  run.googleapis.com \
  certificatemanager.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com
```

### 8.2 Deploy Cloud Run proxy (internal-and-cloud-load-balancing ingress)

```bash
gcloud iam service-accounts create "${PREFIX}-run-proxy-sa" \
  --display-name="OpenClaw ingress proxy runtime" || true

RUNTIME_SA="${PREFIX}-run-proxy-sa@${PROJECT_ID}.iam.gserviceaccount.com"

mkdir -p /tmp/openclaw-ingress-proxy
cd /tmp/openclaw-ingress-proxy

cat > package.json <<'EOF'
{
  "name": "openclaw-ingress-proxy",
  "private": true,
  "type": "module",
  "dependencies": {
    "http-proxy": "^1.18.1"
  }
}
EOF

cat > server.js <<'EOF'
import http from "node:http";
import httpProxy from "http-proxy";

const PROJECT_ID = process.env.PROJECT_ID;
const ZONE = process.env.ZONE;
const proxy = httpProxy.createProxyServer({ ws: true });

const toInstanceId = (hostHeader = "") => hostHeader.split(".")[0];

const server = http.createServer((req, res) => {
  const host = req.headers.host ?? "";
  const instanceId = toInstanceId(host);

  if (!instanceId || !PROJECT_ID || !ZONE) {
    res.writeHead(502);
    res.end("Bad gateway");
    return;
  }

  const target = `http://${instanceId}.${ZONE}.c.${PROJECT_ID}.internal:18789`;
  proxy.web(req, res, { target });
});

server.on("upgrade", (req, socket, head) => {
  const host = req.headers.host ?? "";
  const instanceId = toInstanceId(host);
  const target = `ws://${instanceId}.${ZONE}.c.${PROJECT_ID}.internal:18789`;
  proxy.ws(req, socket, head, { target });
});

server.listen(process.env.PORT || 8080);
EOF

cat > Dockerfile <<'EOF'
FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js ./
CMD ["node", "server.js"]
EOF

gcloud run deploy "$SERVICE_NAME" \
  --source=. \
  --region="$REGION" \
  --allow-unauthenticated \
  --ingress=internal-and-cloud-load-balancing \
  --network="$NETWORK" \
  --subnet="$SUBNET" \
  --vpc-egress=private-ranges-only \
  --service-account="$RUNTIME_SA" \
  --set-env-vars="PROJECT_ID=$PROJECT_ID,ZONE=$ZONE"

# Hardening: disable direct run.app access so traffic only arrives via LB/custom domains.
gcloud run services update "$SERVICE_NAME" \
  --region="$REGION" \
  --no-default-url
```

### 8.3 Create serverless NEG and backend service

```bash
NEG_NAME="${PREFIX}-run-neg"
BACKEND_NAME="${PREFIX}-backend"

gcloud compute network-endpoint-groups create "$NEG_NAME" \
  --region="$REGION" \
  --network-endpoint-type=serverless \
  --cloud-run-service="$SERVICE_NAME"

gcloud compute backend-services create "$BACKEND_NAME" \
  --global \
  --enable-logging \
  --logging-sample-rate=1.0 \
  --load-balancing-scheme=EXTERNAL_MANAGED

gcloud compute backend-services add-backend "$BACKEND_NAME" \
  --global \
  --network-endpoint-group="$NEG_NAME" \
  --network-endpoint-group-region="$REGION"
```

### 8.4 Create URL map for wildcard host routing

```bash
URL_MAP_NAME="${PREFIX}-url-map"

gcloud compute url-maps create "$URL_MAP_NAME" \
  --default-service="$BACKEND_NAME"

gcloud compute url-maps add-path-matcher "$URL_MAP_NAME" \
  --path-matcher-name="${PREFIX}-matcher" \
  --new-hosts="*.${DOMAIN},${DOMAIN}" \
  --default-service="$BACKEND_NAME"
```

### 8.5 Reserve global static IP

```bash
LB_IP_NAME="${PREFIX}-lb-ip"

gcloud compute addresses create "$LB_IP_NAME" --global

LB_IP=$(gcloud compute addresses describe "$LB_IP_NAME" \
  --global \
  --format="value(address)")

echo "LB_IP=$LB_IP"
```

### 8.6 Create Certificate Manager DNS authorization and wildcard cert

```bash
DNS_AUTH_NAME="${PREFIX}-dns-auth"
CERT_NAME="${PREFIX}-wildcard-cert"
CERT_MAP_NAME="${PREFIX}-cert-map"

gcloud certificate-manager dns-authorizations create "$DNS_AUTH_NAME" \
  --domain="$DOMAIN"

gcloud certificate-manager certificates create "$CERT_NAME" \
  --domains="*.${DOMAIN},${DOMAIN}" \
  --dns-authorizations="$DNS_AUTH_NAME"

gcloud certificate-manager maps create "$CERT_MAP_NAME"

gcloud certificate-manager maps entries create "${PREFIX}-wildcard-entry" \
  --map="$CERT_MAP_NAME" \
  --hostname="*.${DOMAIN}" \
  --certificates="$CERT_NAME"

gcloud certificate-manager maps entries create "${PREFIX}-apex-entry" \
  --map="$CERT_MAP_NAME" \
  --hostname="${DOMAIN}" \
  --certificates="$CERT_NAME"
```

### 8.7 Create HTTPS proxy and forwarding rule

```bash
HTTPS_PROXY_NAME="${PREFIX}-https-proxy"
FR_NAME="${PREFIX}-https-fr"

gcloud compute target-https-proxies create "$HTTPS_PROXY_NAME" \
  --url-map="$URL_MAP_NAME" \
  --certificate-map="projects/${PROJECT_ID}/locations/global/certificateMaps/${CERT_MAP_NAME}"

gcloud compute forwarding-rules create "$FR_NAME" \
  --global \
  --load-balancing-scheme=EXTERNAL_MANAGED \
  --address="$LB_IP_NAME" \
  --target-https-proxy="$HTTPS_PROXY_NAME" \
  --ports=443
```

### 8.7.1 Enforce modern TLS policy (recommended)

```bash
SSL_POLICY_NAME="${PREFIX}-ssl-policy"

gcloud compute ssl-policies create "$SSL_POLICY_NAME" \
  --profile=MODERN \
  --min-tls-version=1.2

gcloud compute target-https-proxies update "$HTTPS_PROXY_NAME" \
  --ssl-policy="$SSL_POLICY_NAME"
```

### 8.7.2 Attach Cloud Armor policy (recommended)

Create/choose a Cloud Armor security policy, then attach it:

```bash
gcloud compute backend-services update "$BACKEND_NAME" \
  --global \
  --security-policy="<your-cloud-armor-policy-name>"
```

### 8.7.3 Restrict gateway port 18789 to Cloud Run egress only (recommended)

```bash
PROXY_EGRESS_CIDR=$(gcloud compute networks subnets describe "$SUBNET" \
  --region="$REGION" \
  --format="value(ipCidrRange)")

gcloud compute firewall-rules create "${PREFIX}-allow-proxy-to-gateway" \
  --network="$NETWORK" \
  --priority=900 \
  --direction=INGRESS \
  --action=ALLOW \
  --rules=tcp:18789 \
  --source-ranges="$PROXY_EGRESS_CIDR" \
  --target-tags="openclaw-gateway"

gcloud compute firewall-rules create "${PREFIX}-deny-public-gateway" \
  --network="$NETWORK" \
  --priority=1000 \
  --direction=INGRESS \
  --action=DENY \
  --rules=tcp:18789 \
  --source-ranges="0.0.0.0/0" \
  --target-tags="openclaw-gateway"
```

If you use IPv6 externally, also add equivalent IPv6 deny rules.

### 8.8 DNS records to add (outside GCP)

```bash
echo "Create wildcard A record:"
echo "*.${DOMAIN} A ${LB_IP}"

echo "Create DNS authorization CNAME record:"
gcloud certificate-manager dns-authorizations describe "$DNS_AUTH_NAME" \
  --format="value(dnsResourceRecord.name,dnsResourceRecord.type,dnsResourceRecord.data)"
```

The Certificate Manager DNS authorization record is typically an
`_acme-challenge.<domain>` CNAME. This is required for certificate issuance.
Example shape:

- Name: `_acme-challenge.openclaw.turbostarter.dev`
- Type: `CNAME`
- Value: `<token>.authorize.certificatemanager.goog.`

Make sure there are no conflicting records at that same DNS name
(for example `TXT`, `A`, or another `CNAME`).

This setup is one-time. You do not create DNS records per instance.

### 8.9 Post-DNS verification

Certificate status:

```bash
gcloud certificate-manager certificates describe "$CERT_NAME" \
  --format="yaml(managed.state,managed.domains)"
```

Forwarding rule and IP:

```bash
gcloud compute forwarding-rules describe "$FR_NAME" \
  --global \
  --format="yaml(IPAddress,target)"
```

Smoke test with an existing instance id:

```bash
export INSTANCE_ID="<existing-instance-id>"
curl -I --resolve "${INSTANCE_ID}.${DOMAIN}:443:${LB_IP}" \
  "https://${INSTANCE_ID}.${DOMAIN}/"
```

### 8.10 App config reminder

In `apps/web/.env.local`, set:

```bash
GCP_INSTANCE_DOMAIN_SUFFIX="${DOMAIN}"
```

URL generation already uses this value when returning instance links.

### 8.11 Troubleshooting

- **Certificate stuck in provisioning**
  - Verify both wildcard `A` and Certificate Manager authorization `CNAME` are present and propagated.
  - If certificate status shows `CNAME_MISMATCH`, compare expected vs actual:
    ```bash
    AUTH_NAME=$(gcloud certificate-manager dns-authorizations describe "$DNS_AUTH_NAME" --format="value(dnsResourceRecord.name)")
    AUTH_DATA=$(gcloud certificate-manager dns-authorizations describe "$DNS_AUTH_NAME" --format="value(dnsResourceRecord.data)")
    echo "Expected: $AUTH_NAME CNAME $AUTH_DATA"
    dig +short "$AUTH_NAME" CNAME @8.8.8.8
    ```
  - If using Cloudflare, keep the `_acme-challenge` CNAME record as DNS-only (not proxied).
- **502 from the load balancer**
  - Check Cloud Run logs and confirm proxy can reach `http://<id>.<zone>.c.<project>.internal:18789`.
- **Bypass via `run.app` URL**
  - Ensure the default Cloud Run URL is disabled:
    ```bash
    gcloud run services update "$SERVICE_NAME" --region="$REGION" --no-default-url
    ```
- **Host not resolving**
  - Confirm `*.${DOMAIN}` points to the load balancer global IP.
- **VM internal DNS mismatch**
  - Confirm the instance name used in URL is valid and resolves as `<id>.<zone>.c.<project>.internal`.

## 9) Security recommendations

- Restrict network access at VPC firewall/load balancer level (managed outside app env)
- Use dedicated service accounts with least privilege
- Prefer HTTPS + managed certificates if exposing directly over internet

Reference: [OpenClaw GCP guide](https://docs.openclaw.ai/install/gcp)
