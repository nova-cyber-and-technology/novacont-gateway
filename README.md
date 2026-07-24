<div align="center">

# Nova Gateway

**A Discord bot that brings NovaCont escrow into your server.**

Start an escrow with a slash command. Cross-chain reputation. Base and TON in one place.

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Discord.js](https://img.shields.io/badge/discord.js-v14-5865F2.svg)](https://discord.js.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg)](https://www.typescriptlang.org)

[NovaCont](https://github.com/nova-cyber-and-technology/novacont) · [NovaCont Lite](https://github.com/nova-cyber-and-technology/novacont-lite) · [Documentation](https://novacont.gitbook.io/nova-docs) · [Discord](https://discord.gg/novacont)

</div>

---

## What It Does

Freelancers and clients already find each other in Discord servers. What they don't have is a way to work together safely without one side trusting the other first.

Nova Gateway closes that gap. A member runs `/escrow @provider 500 BASE "logo design"`, and the bot generates a pre-filled link to the NovaCont web app with the terms already encoded. The provider clicks, connects their wallet, and the agreement goes on-chain. Funds sit in a smart contract until the work is approved.

The bot also tracks what happens after: completed deals, disputes, volume, unique counterparties. That history becomes a reputation score that spans both chains, so someone with a track record on TON carries it into their first Base agreement.

**The bot never touches the blockchain.** It builds links; the web apps handle wallets and transactions. No private keys, no signing, no custody, anywhere in this codebase.

---

## Features

**Escrow**
- `/escrow` creates a pre-filled agreement link for either NovaCont (Base) or NovaCont Lite (TON)
- Both parties must have linked a wallet for the chosen chain first, the bot checks before generating the link
- Self-escrow is blocked

**Reputation**
- Cross-chain scoring from completed deals, volume, unique counterparties, account age, and completion rate
- Disputes carry a penalty
- Six tiers: Verified, Trusted, Expert, Elite, Legend, Super Nova
- Tiers map to Discord roles automatically

**Profiles and verification**
- `/linkwallet` connects a TON or Base address to a Discord account
- New members start Unverified and gain the Verified role once a wallet is linked
- `/profile` shows stats and tier; `/leaderboard` ranks the server

**Server management**
- Support ticket system with dedicated channels
- Audit logging for wallet links, role changes, and ticket activity
- Dynamic voice channels: join a generator channel, get a temporary personal one
- Daily analytics snapshots

**Localization**
- English, Turkish, German, French, Spanish

---

## Architecture

```
Discord user
     │  /escrow
     ▼
┌─────────────────┐     builds link      ┌──────────────────────┐
│  Nova Gateway   │─────────────────────>│  NovaCont web app     │
│  (this bot)     │                       │  or NovaCont Lite     │
└────────┬────────┘                       └──────────┬───────────┘
         │                                            │ user signs
         │                                            ▼
         │        webhook: escrow created        ┌─────────┐
         │<───────────────────────────────────── │  Chain  │
         ▼                                        └─────────┘
   Stats → Reputation → Discord roles
```

The bot's two jobs are **outbound link generation** and **inbound event processing**. It never signs a transaction or holds a key.

Events arrive at `POST /api/webhook/ton` and `POST /api/webhook/base`, authenticated with a shared secret. `StatsCollector` routes them to the right provider, stats get updated, `ReputationEngine` recalculates, and roles are adjusted if a tier changed.

---

## Project Structure

```
src/
  index.ts              Entry point, wires everything together
  commands/             Slash commands (general/ and admin/)
  managers/             One responsibility each, see below
  providers/            TonProvider and BaseProvider, chain-specific event handling
  api/server.ts         Express server for inbound webhooks
  config/               Environment configuration
  database/             Prisma client
prisma/
  schema.prisma         User, UserStats, AuditLog, Ticket, AnalyticsSnapshot
```

Managers are deliberately narrow. `ReputationEngine` only calculates scores and never fetches chain data; `StatsCollector` only aggregates and delegates scoring; `DeepLinkBuilder` only builds URLs. This makes each piece testable and replaceable on its own.

---

## Setup

**Requirements:** Node.js 18+, a Discord application with a bot token.

```bash
git clone https://github.com/nova-cyber-and-technology/nova-gateway.git
cd nova-gateway
npm install

cp .env.example .env
# Fill in DISCORD_TOKEN and GUILD_ID at minimum

npm run db:generate
npm run db:push

npm run dev
```

**Discord permissions the bot needs:** Manage Roles, Manage Channels, Send Messages, Embed Links, Read Message History, Connect, Move Members.

**Gateway intents:** Guilds, Guild Members, Guild Messages, Guild Voice States. Guild Members is privileged, enable it in the Developer Portal under Bot → Privileged Gateway Intents.

Slash commands register to the guild in `GUILD_ID` on startup. Guild-scoped commands appear immediately; global registration takes up to an hour, which is why this bot uses guild scope.

---

## Configuration

Every setting comes from environment variables, see [`.env.example`](./.env.example) for the full list with comments.

Only `DISCORD_TOKEN` and `GUILD_ID` are strictly required. Channel and voice IDs are optional, leave them blank to disable the corresponding feature. `WEBHOOK_SECRET` is required if you're wiring up the webhook endpoints.

The database is SQLite by default, which is fine for a single server. Prisma makes switching to Postgres a one-line change in `schema.prisma` if you outgrow it.

---

## Using It With Your Own Escrow

`NOVACONT_URL` and `NOVACONT_LITE_URL` are environment variables, so you can point them anywhere. The bot doesn't hardcode NovaCont as the destination.

That said, the link formats in `DeepLinkBuilder` match what the NovaCont apps expect: query parameters like `provider`, `price`, `acceptDays`, `deliveryDays`. If you point this at a different escrow platform, you'll need to adjust that builder to match its URL scheme.

---

## Security Notes

- **No keys, no signing, no custody.** The bot generates links; users sign transactions in their own wallets on the web apps.
- **Webhook endpoints require a shared secret.** `WEBHOOK_SECRET` is checked against the `x-api-key` header on every request. Use a long random value and rotate it if it leaks.
- **`/api/wallet/link` has no authentication.** It's designed to be called by the NovaCont web apps after a wallet connection. If you expose this bot's API server publicly, put it behind something, otherwise anyone who knows a Discord ID can link an arbitrary wallet to it.
- **Never commit your `.env` or the SQLite database.** Both are gitignored; keep them that way. The database holds Discord IDs and wallet addresses.

Found a security issue in this bot? Email security@novatechnology.app rather than opening a public Issue.

---

## Known Limitations

- **SQLite under concurrency.** Fine for one server. If you're running this across many large guilds, migrate to Postgres before the write contention finds you.
- **Turkish translations are missing diacritics.** The `tr` locale currently uses ASCII approximations. Fixing this is a good first contribution.
- **No test suite.** The reputation formula in particular would benefit from regression tests, since changing the weights silently reshuffles every user's tier.
- **Admin commands assume NovaCont's server structure.** `/setuproles` and the analytics commands are built around how our own Discord is organized. They're included for completeness, but you'll likely want to adapt them.

---

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## License

MIT, see [LICENSE](./LICENSE).

The escrow protocols this bot connects to are licensed differently: [NovaCont](https://github.com/nova-cyber-and-technology/novacont) and [NovaCont Lite](https://github.com/nova-cyber-and-technology/novacont-lite) are source-available under PolyForm Shield 1.0.0. The bot is MIT because it's a tool for reaching those protocols, not the protocol itself, and making it easy to run and adapt serves that purpose better than restricting it would.

---

## Contact

| Purpose | Channel |
|---|---|
| Questions and support | support@novatechnology.app |
| Security reports | security@novatechnology.app |
| Community | [Discord](https://discord.gg/novacont) |

<div align="center">

**NOVA Cyber & Technology**
*Building Secure, Digital Futures.*

</div>
