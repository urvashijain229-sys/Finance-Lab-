# Financial Statements Lab

*Learn the statements. Connect the numbers. Understand the business.*

A static web app for learning financial statement analysis. It uses HTML, CSS and vanilla JavaScript only: no backend, no paid APIs, no AI API, no build step.

**All company data is fictional and illustrative.** Northfield Goods Ltd does not exist, and no figure is real company data.

## Project structure

```
index.html          Page structure: home, Learn, Connect, Analyse, Practise
css/styles.css      Navy / off-white / muted teal design
js/data.js          Fictional input figures and cash flow assumptions
js/finance.js       Pure calculation + validation functions (no page code)
js/content.js       Statement layouts, line-item explanations, quiz questions
js/app.js           Draws the page, handles clicks, navigation and the quiz
tests/check.js      Node script that checks the accounting logic
```

Reading order for learning: `data.js` → `finance.js` → `content.js` → `app.js`.

## How the numbers work

- `data.js` holds **inputs only**: revenue, costs, balance sheet items and an opening balance sheet.
- `finance.js` calculates gross profit, EBITDA, EBIT, totals, and the whole cash flow statement (indirect method).
- Cash flow is **derived** from the P&L and balance sheet movements, so the validation is a real test, not a copy.
- Validation never edits figures. If a check fails, the page shows an error and the numbers stay as supplied.

Assumptions (also shown on the Connect page): no dividends, no share issues, no asset sales, tax and interest paid in cash, and D&A is the only non-cash expense.

## Preview locally

No install is needed. Either:

1. Double-click `index.html`, or
2. Serve it (recommended):
   ```bash
   cd financial-statements-lab
   python3 -m http.server 8000
   # open http://localhost:8000
   ```

## Run the logic tests (optional, needs Node.js)

```bash
node tests/check.js
```

## Deploy to GitHub and Vercel

1. Create a repository and push:
   ```bash
   git init
   git add .
   git commit -m "Financial Statements Lab v0.1"
   git branch -M main
   git remote add origin https://github.com/<your-username>/financial-statements-lab.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com), sign in with GitHub and choose **Add New… → Project**.
3. Import the repository.
4. Set **Framework Preset** to **Other**. Leave Build Command and Output Directory empty (the root folder is served as-is).
5. Click **Deploy**. Every later `git push` redeploys automatically.

Alternatively, with the CLI: `npm i -g vercel`, then run `vercel` in the project folder.

## Test the features yourself

| Feature | How to test | Expected result |
|---|---|---|
| Navigation | Click Learn, Connect, Analyse, Practise and the site title. Use the browser back button. | Each section appears, the current link is highlighted, back/forward work. |
| Home cards | Click the P&L, Balance Sheet and Cash Flow cards. | Learn opens on the matching statement. |
| Statement switching | In Learn, click the three tabs. | The table, title and units change. |
| Explanations | Click any underlined line item. | The right panel shows meaning, formula, example and why it matters. |
| Keyboard use | Press Tab to reach a line item, then Enter or Space. | Same as clicking, with a visible focus ring. |
| Knowledge check | Practise: choose an answer, press Check answer. Try pressing it with nothing selected. | A prompt appears with no selection. Feedback and explanation appear after answering. A score appears at the end. |
| Balance validation | Learn or Connect. | Green banner: all 9 checks pass. |
| Failed validation | Connect → **Introduce a deliberate error**. | Red alert: balance and cash checks fail for FY2024. The cash figure is shown as supplied, not corrected. |
| Your own data | In `js/data.js`, change one figure (for example `retainedEarnings`) and reload. | A red error appears. Revert the change to clear it. |

## Next steps

- Add a second fictional company and a company selector.
- Let users enter their own figures in a form.
- Add more ratios and charts.
- Add a glossary page.
