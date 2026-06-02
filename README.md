# BountyPay Scout Agent

A Hedera Agent Kit + MCP/x402 bounty intelligence agent that gates deep GitHub bounty analysis behind payment-triggered execution.

This project was built for the Hedera AI Agent Bounty Week 3 theme: MCP or x402 Agent.

## Problem

Open-source bounty hunters waste time on issues that look valuable but are already assigned, crowded with duplicate PRs, stale, sandbox-only, or unclear about payout. BountyPay Scout analyzes a GitHub bounty issue before a developer starts work and returns a practical decision:

- `START`: strong candidate, continue to source reconnaissance.
- `INSPECT`: possible candidate, manually inspect before claiming.
- `SKIP`: poor payout probability or high competition risk.

## What It Does

Given a GitHub issue URL, the agent checks:

- Issue state and assignee.
- Clear USD bounty amount signals.
- Comment crowding.
- Visible `/attempt` markers.
- Visible reward history.
- Repository health and archived status.
- Known noisy bounty pools.
- Open PRs that appear linked or topically overlapping.

The deep scan is payment-triggered:

- The HTTP demo returns an x402-style `402 Payment Required` response if no payment proof is supplied.
- The MCP tool returns a Hedera payment intent before allowing deep analysis.
- Local demo mode accepts `X-PAYMENT: demo-paid`.

No automatic GitHub comments, bounty claims, forks, or PRs are created.

## Safety

This demo does not move funds automatically.

- It can run without Hedera credentials.
- It never asks for a private key in normal demo mode.
- It exposes the intended Hedera payment destination and memo.
- Real testnet credentials can be configured later for expanded Hedera Agent Kit functionality.

## Requirements

- Node.js 20+
- npm
- Optional: `GITHUB_TOKEN` for higher GitHub API rate limits.
- Optional: Hedera testnet account details for live Hedera Agent Kit status.

## Setup

```bash
npm install
cp .env.example .env
```

For GitHub API rate limits:

```bash
export GITHUB_TOKEN=github_pat_xxx
```

Windows PowerShell:

```powershell
setx GITHUB_TOKEN "github_pat_xxx"
```

## Run CLI Analysis

```bash
npm run dev -- analyze https://github.com/gyroflow/gyroflow/issues/742
```

Example output:

```json
{
  "decision": "SKIP",
  "summary": "Skip for now: score -102; no clear USD amount; crowded comment thread; 12 related open PR(s) detected."
}
```

## Run x402-Style HTTP Demo

Start the server:

```bash
npm run serve
```

Request without payment proof:

```bash
curl -i -X POST http://localhost:8787/analyze \
  -H "Content-Type: application/json" \
  -d "{\"issueUrl\":\"https://github.com/gyroflow/gyroflow/issues/742\"}"
```

The server returns HTTP 402 with a Hedera payment intent.

Request with local demo payment proof:

```bash
curl -X POST http://localhost:8787/analyze \
  -H "Content-Type: application/json" \
  -H "X-PAYMENT: demo-paid" \
  -d "{\"issueUrl\":\"https://github.com/gyroflow/gyroflow/issues/742\"}"
```

## Run MCP Server

```bash
npm run mcp
```

Available MCP-style tools:

- `request_payment_intent`
- `analyze_bounty_issue`
- `hedera_status`
- `hedera_feedback_draft`

For local demo analysis, call `analyze_bounty_issue` with:

```json
{
  "issueUrl": "https://github.com/gyroflow/gyroflow/issues/742",
  "paymentProof": "demo-paid"
}
```

## Hedera Agent Kit

The project imports the current Hedera Agent Kit package, `@hashgraph/hedera-agent-kit`, plus the official MCP toolkit package, `@hashgraph/hedera-agent-kit-mcp`, and reports runtime status through:

```bash
npm run dev -- status
```

Set these variables to enable live testnet status:

```bash
HEDERA_NETWORK=testnet
HEDERA_ACCOUNT_ID=0.0.xxxxxx
HEDERA_PRIVATE_KEY=...
```

The current submission keeps live fund movement disabled by design. This is a safety choice for a bounty demo.

## Feedback Draft

Feedback submitted to the official Hedera Agent Kit repository:

```text
https://github.com/hashgraph/hedera-agent-kit-js/issues/892
```

Generate the local feedback text:

```bash
npm run dev -- feedback
```

## Verification Run

Commands run during local verification:

```bash
npm install --registry=https://registry.npmjs.org
npm run test
npm run build
npm run dev -- analyze https://github.com/gyroflow/gyroflow/issues/742
npm run serve
```

The HTTP demo was verified with:

- No `X-PAYMENT` header: returns HTTP 402 payment intent.
- `X-PAYMENT: demo-paid`: returns paid deep analysis.

## Submission Summary

Project title:

```text
BountyPay Scout Agent
```

Short description:

```text
A Hedera Agent Kit + MCP/x402 agent that turns bounty screening into payment-triggered execution, helping developers avoid crowded or low-payout GitHub bounty work.
```

Built with:

- Hedera Agent Kit JS package.
- MCP-style stdio tools.
- x402-style payment-required HTTP flow.
- GitHub REST API.
