# Brightloop Subscriptions

A subscription management system with an Odoo-style interface. It covers products and variants, recurring plans, quotation templates, subscriptions, automatic recurring invoicing, discounts, taxes, payments, a customer portal and revenue reporting.

Built with **Next.js 15 (App Router, server actions)**, **React 19**, **Tailwind CSS v4**, shadcn-style components on Radix, **Prisma** and **SQLite**.

## Getting started

Requirements: Node.js 20+.

```bash
npm install
cp .env.example .env
npm run setup      # creates the SQLite database and loads demo data
npm run dev        # http://localhost:3000
```

`npm run db:reset` wipes the database and reseeds it. `SEED_LARGE=1 npm run db:seed` adds 3,000 extra subscriptions for performance testing.

### Demo accounts

| Role     | Email                     | Password      |
| -------- | ------------------------- | ------------- |
| Admin    | admin@brightloop.test     | Admin@1234    |
| Internal | staff@brightloop.test     | Staff@1234    |
| Internal | sales@brightloop.test     | Sales@1234    |
| Portal   | customer@brightloop.test  | Customer@123  |

### Email

Password reset and portal invitation emails are sent over SMTP when `SMTP_HOST` is set. When it isn't, the email is printed to the server console. In development, the reset link is also shown on the page.

## Features

- **Authentication.** Sign up with a unique email and log in. Passwords must be more than 8 characters with upper case, lower case and a special character. Password reset works by emailed link, using hashed one-time tokens.
- **Roles.**
  - *Admin*: full access, including configuration and staff management.
  - *Internal*: day-to-day work on customers, subscriptions, invoices and payments, with read-only configuration.
  - *Portal*: customers see only their own subscriptions and invoices.
  - Only admins can create staff users.
- **Products.** Type, sales and cost price, taxes, notes, and attribute-based variants with price extras (for example Brand: Odoo +₹560).
- **Recurring plans.** Price, billing period (daily, weekly, monthly or yearly, with an interval), minimum quantity, start and end dates, and auto-close, closable, pausable and renewable options.
- **Quotation templates.** A plan, product lines and a validity period. Applying a template fills in a subscription.
- **Subscriptions.** Draft → Quotation → Confirmed → Active → Closed, plus pause/resume, renewal (linked records), reset to draft and an activity log (chatter). Each subscription previews its next invoice.
- **Invoices.** Generated automatically from subscriptions, one per billing period. A unique `(subscription, period)` key prevents double billing, and catch-up billing prevents skipped periods. Taxes come from admin-defined rules. Invoices go Draft → Confirmed → Paid and can be confirmed, cancelled, sent, printed or exported to PDF.
- **Discounts.** Admin only. Fixed or percentage, with minimum purchase or quantity, a date window, a usage limit, and product or subscription scope. They are applied automatically on the next invoice.
- **Payments.** Method, amount, date and note recorded against an invoice. Paid and outstanding amounts are always visible. Portal customers can pay online (simulated).
- **Reports.** Dashboard with MRR/ARR, active subscriptions, revenue invoiced vs collected, overdue invoices, MRR by plan and top customers, filterable by period and plan.

## Project structure

```
prisma/              schema and seed data
src/
  actions/           server actions (one file per domain)
  app/
    (auth)/          login, signup, password reset
    (backend)/       staff application (subscriptions, invoices, config, reports…)
    my/              customer portal
  components/
    odoo/            control panel, status bar, chatter, list views, order lines…
    ui/              shadcn-style primitives
  lib/
    billing.ts       invoice generation, billing run, payments
    pricing.ts       pure pricing maths (periods, discounts, taxes)
    auth/            sessions (JWT cookie), password policy, guards
    reports.ts       dashboard aggregates
  middleware.ts      route protection and role redirects
```

### Billing engine

`runBilling()` (the **Run Billing** button under Invoicing) does three things:

1. Starts confirmed subscriptions whose start date has arrived.
2. Generates an invoice for every period that is due, catching up any missed periods.
3. Closes subscriptions whose plan auto-closes at the expiration date.

It is idempotent, so running it twice never creates duplicate invoices. Cancelling an invoice releases its period so it can be billed again.

## Scripts

| Script              | Purpose                               |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Start the dev server                  |
| `npm run build`     | Generate the Prisma client and build  |
| `npm run start`     | Serve the production build            |
| `npm run typecheck` | Type-check the project                |
| `npm run setup`     | Create the database and seed it       |
| `npm run db:reset`  | Reset the database and reseed it      |
