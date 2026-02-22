# VPS Deployment Setup Guide

This guide explains the simple deployment architecture for `/api/assistants/create`:
- one fixed VPS configured in env,
- OpenClaw deployed in Docker on that VPS,
- one OpenClaw instance per user (re-deploy updates the same user instance).

## Required Environment Variables

Set these in your root `.env`.

| Variable | Description | Example |
| --- | --- | --- |
| `VPS_HOST` | Public IP/DNS of your VPS | `203.0.113.10` |
| `VPS_SSH_PORT` | SSH port | `22` |
| `VPS_USER` | SSH user | `root` |
| `VPS_PRIVATE_KEY` | Private key content for SSH auth | `-----BEGIN OPENSSH PRIVATE KEY-----\n...` |
| `VPS_PRIVATE_KEY_PASSPHRASE` | Passphrase for encrypted key (optional) | `secret` |
| `VPS_DEPLOY_ROOT` | Root directory for OpenClaw files on VPS | `/opt/openclaw` |
| `VPS_PORT_RANGE_START` | Start of gateway port range | `19000` |
| `VPS_PORT_RANGE_END` | End of gateway port range | `19999` |

## Example `.env`

```env
VPS_HOST=203.0.113.10
VPS_SSH_PORT=22
VPS_USER=root
VPS_PRIVATE_KEY=-----BEGIN OPENSSH PRIVATE KEY-----\n...\n-----END OPENSSH PRIVATE KEY-----
VPS_PRIVATE_KEY_PASSPHRASE=your-key-passphrase
VPS_DEPLOY_ROOT=/opt/openclaw
VPS_PORT_RANGE_START=19000
VPS_PORT_RANGE_END=19999
```

## Notes

1. User isolation:
- each user has their own root under `<VPS_DEPLOY_ROOT>/users/<user-scope>`.
- different users do not share state.

2. Per-user sharing:
- user instances share config/workspace/state for that user.
- same user redeploys update the same compose project.

3. Port allocation:
- deploy uses a VPS-level lock and allocates a free port inside your configured range.

## Preflight Check

```bash
ssh -p <VPS_SSH_PORT> <VPS_USER>@<VPS_HOST> "echo ok && docker --version && docker compose version"
```
