import { getUrl } from "..";
import { escapeShell } from "../../../utils";

import { env } from "./env";

export const getProvisionRouteScript = (instanceId: string) => {
  const instanceHost = new URL(getUrl(instanceId)).host;

  return `
INSTANCE_HOSTNAME=${escapeShell(instanceHost)}
CADDY_ROUTES_DIR=${escapeShell(env.VPS_CADDY_ROUTES_DIR)}
CADDY_CONFIG_PATH=${escapeShell(env.VPS_CADDY_CONFIG_PATH)}

mkdir -p "$CADDY_ROUTES_DIR"
ROUTE_FILE="$CADDY_ROUTES_DIR/$INSTANCE_HOSTNAME.caddy"
ROUTES_IMPORT="import $CADDY_ROUTES_DIR/*.caddy"

cat > "$ROUTE_FILE" <<EOF
$INSTANCE_HOSTNAME {
  header {
    Strict-Transport-Security "max-age=31536000; includeSubDomains"
  }

  reverse_proxy 127.0.0.1:$PORT
}
EOF

chmod 644 "$ROUTE_FILE"

if ! grep -Fq "$ROUTES_IMPORT" "$CADDY_CONFIG_PATH"; then
  printf "\n%s\n" "$ROUTES_IMPORT" >> "$CADDY_CONFIG_PATH"
fi

caddy validate --config "$CADDY_CONFIG_PATH"
caddy reload --config "$CADDY_CONFIG_PATH"
`;
};
