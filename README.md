# Playwright + TypeScript Test Automation Framework

A small, production-style test automation framework built with **Playwright** and **TypeScript**.
It tests a demo web shop (included in this repo) at two levels, **UI** and **API**, and runs in **GitHub Actions** on every push and pull request.

## What it shows

| Area | How |
|---|---|
| **Page Object Model** | One class per page in [`pages/`](pages), so tests read like user stories and locators live in one place |
| **Custom fixtures** | [`fixtures/test-fixtures.ts`](fixtures/test-fixtures.ts): ready-to-use page objects, a `loggedInPage` that logs in through the API (faster and more stable than the UI), and an authenticated API client |
| **Stable locators** | `data-test` attributes via `getByTestId`, never CSS chains or text that changes |
| **UI tests** | Login (valid, locked, invalid, redirect, logout), cart (badge, out-of-stock, totals and tax, remove), checkout (happy path, field validation, whitespace input) |
| **API tests** | Auth (200/400/401/403, token required), products (schema/shape checks, 404), cart and orders (totals and tax math, quantity validation, stock limits, empty cart, session isolation) |
| **Data-driven tests** | Invalid logins, missing checkout fields and bad quantities are each one test definition run over a data table |
| **CI/CD** | [GitHub Actions](.github/workflows/playwright.yml): install, type-check, run all tests, upload the HTML report as an artifact |
| **Debugging** | Screenshots on failure, trace on retry, HTML report |

**36 tests, about 7 seconds locally.** All tests also passed 5 times in a row (`--repeat-each=5`, 180/180) to check for flakiness.

## Project structure

```
app/                 Demo shop under test (plain Node.js, no dependencies)
  server.js          JSON API: /api/login, /api/products, /api/cart, /api/orders
  public/            Login, products, cart and checkout pages
pages/               Page Objects
fixtures/            Custom Playwright fixtures and test data
tests/
  ui/                Browser tests (Chromium)
  api/               API tests (no browser)
playwright.config.ts Two projects (ui, api); starts the demo shop automatically
```

## Run it

```bash
npm install
npx playwright install chromium
npm test              # all tests
npm run test:ui       # UI tests only
npm run test:api      # API tests only
npm run report        # open the HTML report
```

If Playwright's own Chromium can't be installed on your OS (for example macOS 13), run the UI tests in your installed Google Chrome instead: `PW_CHANNEL=chrome npm test`.

Playwright starts the demo shop on `http://localhost:3000` before the tests and stops it afterwards. To look at the shop yourself: `npm start`, then log in as `standard_user` / `secret_sauce`.

## Design notes

- **Why test the API and the UI separately?** API tests are fast and pin down business rules (totals, tax, stock, validation). UI tests cover what a user actually sees. Each layer does what it is best at, so the suite stays fast and failures point to the right place.
- **Why log in through the API in UI tests?** Only the login tests need the login form. Everywhere else, logging in via the API saves time and removes a common source of flaky failures.
- **Test isolation:** every test gets its own session and cart, so tests run in parallel without affecting each other.

## Author

Anton Tsykunov, Senior QA Automation Engineer / SDET (Playwright, TypeScript, API testing, CI/CD, AI-assisted QA).
