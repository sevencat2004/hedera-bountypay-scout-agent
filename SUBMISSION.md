# Hedera AI Bounty Submission Draft

## Project Title

BountyPay Scout Agent

## Project Description

BountyPay Scout Agent is a Hedera Agent Kit + MCP/x402 agent that turns GitHub bounty screening into payment-triggered execution. It helps developers avoid low-probability bounty work by checking assignment state, comment crowding, visible `/attempt` markers, open PR overlap, repository health, payout wording, and known noisy bounty pools before they start implementation.

The project demonstrates the Week 3 theme with two entry points:

- MCP-style stdio tools for requesting a Hedera payment intent and running a paid deep scan.
- An x402-style HTTP server that returns `402 Payment Required` until a payment proof is supplied.

For local demo safety, `X-PAYMENT: demo-paid` triggers analysis without moving funds. Hedera account settings are exposed through environment variables and runtime status, but the demo intentionally does not move user funds automatically.

## Repository URL

TBD after GitHub repository creation.

## Demo URL

TBD after GitHub repository creation. The README contains the full demo flow and commands.

## Hedera Tool Feedback Link

TBD. Feedback draft is available via:

```bash
npm run dev -- feedback
```

## Wallet Address

Needs user-provided Hedera wallet address, usually in the `0.0.xxxxxx` account ID format.

## Required Personal Fields

Needs user-provided:

- Full name
- Email
- Country/Region

## Notes for Submitter

Do not share wallet seed phrases, private keys, or recovery phrases. The submission form only needs the public wallet/account address.
