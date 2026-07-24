# Contributing to Nova Gateway

Thanks for your interest in contributing.

Nova Gateway is a Discord bot that connects communities to the NovaCont escrow protocols. It's MIT licensed and built to be run and adapted by anyone, so contributions that make it more useful outside our own server are especially welcome.

---

## Ways to Contribute

- Bug fixes
- New slash commands
- Translations (see below, this is the easiest place to start)
- Support for additional escrow platforms in `DeepLinkBuilder`
- Tests, particularly around the reputation formula
- Documentation

---

## Before You Start

- Read the [README](./README.md), especially Known Limitations. Some rough edges are known and listed there.
- Search existing Issues before opening a new one.
- For anything that changes the reputation formula, the database schema, or the webhook contract, open an Issue first. Those three touch data that already exists in running deployments, so the approach is worth discussing before the code.

---

## Development Setup

Requires Node.js 18+ and a Discord application with a bot token. Create a separate test bot and test server rather than developing against a live one.

```bash
git clone https://github.com/nova-cyber-and-technology/nova-gateway.git
cd nova-gateway
npm install

cp .env.example .env
# Fill in DISCORD_TOKEN and GUILD_ID for your test bot and test server

npm run db:generate
npm run db:push
npm run dev
```

`npm run db:studio` opens Prisma Studio if you want to inspect the database directly.

---

## Project Layout

```
src/
  index.ts        Wires everything together
  commands/       Slash commands
  managers/       One responsibility each
  providers/      Chain-specific event handling
  api/server.ts   Webhook endpoints
  config/         Environment configuration
```

The manager separation is deliberate and worth preserving. `ReputationEngine` calculates scores and does nothing else; `StatsCollector` aggregates and delegates; `DeepLinkBuilder` builds URLs and never touches the database. If a change would give a manager a second responsibility, it probably belongs in a new one.

---

## Adding a Command

Commands live in `src/commands/general/` or `src/commands/admin/` and implement the `Command` interface. Add yours to the array in `src/commands/index.ts` and it registers automatically on the next start.

Handle failure cases explicitly, users will run commands in states you didn't plan for. `escrow.ts` is a reasonable model: it checks for self-escrow and for a missing wallet before doing any work, and returns a clear message for each.

---

## Translations

`TranslationManager` currently covers English, Turkish, German, French, and Spanish. Adding a language means adding an entry to each key in the dictionary.

**If you speak Turkish:** the `tr` translations currently use ASCII approximations rather than proper Turkish characters (`Hosgeldiniz` instead of `Hoşgeldiniz`). Discord handles Unicode fine, this is just a transcription issue. Fixing it is a genuinely useful first PR.

---

## Commit Messages

```
feat: add /dispute command
fix: correct reputation tier boundary
docs: clarify webhook authentication
refactor: extract role assignment from StatsCollector
i18n: fix Turkish diacritics
```

Avoid vague messages like `update`, `fix`, `changes`.

---

## Code Standards

- TypeScript strict mode. Avoid `any`, `AuthManager.verifyUser` currently takes `client: any` and that's a wart, not a pattern to follow.
- Keep functions focused and readable.
- Comment non-obvious behavior; skip the obvious.
- Match the style of the file you're editing.

---

## Database Changes

Schema changes need care because deployments have existing data.

- Edit `prisma/schema.prisma`, then `npm run db:generate` and `npm run db:push`.
- Adding a nullable column or a new model is usually safe.
- Renaming or removing a column, or changing a type, is not. If your change does that, say so clearly in the PR and describe what an existing deployment should do about it.

Never commit a `.db` file. They hold Discord IDs and wallet addresses and are gitignored for that reason.

---

## Reputation Changes

The scoring weights in `ReputationEngine` deserve special mention: changing them silently reshuffles every user's tier on the next recalculation. Someone who was Elite yesterday can be Expert today with no visible cause.

If you're proposing a weight change, open an Issue first, explain the reasoning, and describe the effect on existing users. This is the one part of the codebase where a well-meaning improvement can quietly break something people care about.

---

## Security

- Never commit tokens, secrets, or `.env` files.
- The bot deliberately holds no private keys and signs no transactions. Don't add that capability, the entire security posture depends on the bot being unable to move funds.
- Webhook endpoints are authenticated with `WEBHOOK_SECRET`. New endpoints that accept external input need the same treatment.
- Note in the PR if your change affects what data is stored or who can access it.

For vulnerabilities, email security@novatechnology.app rather than opening a public Issue.

---

## Pull Requests

Before submitting:

- The project builds (`npm run build`).
- You've run the bot locally and exercised the change.
- The PR describes what changed and how you verified it.
- No unrelated changes are bundled in.
- No `.env` or database files are included.

---

## Testing

There's no test suite yet. The reputation formula and the state transitions in the providers are the two places where tests would help most, so contributions there are welcome even without an existing framework to slot into.

Until then, describe your manual verification in the PR.

---

## License

MIT. By contributing, you agree your contribution is licensed under the same terms.

Note that the escrow protocols this bot connects to ([NovaCont](https://github.com/nova-cyber-and-technology/novacont), [NovaCont Lite](https://github.com/nova-cyber-and-technology/novacont-lite)) are licensed differently, under PolyForm Shield 1.0.0. That difference is deliberate: the bot is a tool for reaching those protocols and benefits from being freely usable and adaptable.

---

Thanks for helping build Nova Gateway.
