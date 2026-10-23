/* finance.js — pure calculation and validation functions. No page (DOM) code lives here. */
const TOLERANCE = 0.5; // figures are whole numbers, so anything above 0.5 is a real difference

// ---------- Profit and loss ----------
function calcGrossProfit(revenue, cogs)  { return revenue - cogs; }
function calcEbitda(grossProfit, opex)   { return grossProfit - opex; }
function calcEbit(ebitda, da)            { return ebitda - da; }
function calcPbt(ebit, financeCosts)    { return ebit - financeCosts; }
function calcNetProfit(pbt, tax)         { return pbt - tax; }

// ---------- Balance sheet ----------
function calcTotalAssets(b)      { return b.cash + b.receivables + b.inventory + b.otherCurrentAssets + b.ppe; }
function calcTotalLiabilities(b) { return b.payables + b.borrowings + b.otherLiabilities; }
function calcTotalEquity(b)      { return b.shareCapital + b.retainedEarnings; }
// Operating assets minus operating liabilities (everything except cash, PPE and borrowings)
function calcWorkingCapital(b) {
  return (b.receivables + b.inventory + b.otherCurrentAssets) - (b.payables + b.otherLiabilities);
}

// ---------- Cash flow (indirect method) ----------
// An INCREASE in working capital ties up cash, so it is subtracted.
function calcOperatingCashFlow(netProfit, da, workingCapitalIncrease) { return netProfit + da - workingCapitalIncrease; }
// Capex = rise in PPE + depreciation (assumes no disposals). Cash spent is negative.
function calcInvestingCashFlow(ppeNow, ppePrev, da) { return -((ppeNow - ppePrev) + da); }
// Borrowing more or issuing shares brings cash in (assumes no dividends).
function calcFinancingCashFlow(prev, now) {
  return (now.borrowings - prev.borrowings) + (now.shareCapital - prev.shareCapital);
}

// ---------- Ratios ----------
function ratioPercent(part, whole) { return whole === 0 ? NaN : (part / whole) * 100; }
function ratioDays(balance, flow)  { return flow === 0 ? NaN : (balance / flow) * 365; }

// ---------- Build all three statements from the raw data ----------
function buildStatements(data) {
  const pl = [], bs = [], cf = [];
  data.years.forEach((year, i) => {
    const p = {};
    ["revenue", "cogs", "opex", "da", "financeCosts", "tax"].forEach(k => p[k] = data.pl[k][i]);
    p.grossProfit = calcGrossProfit(p.revenue, p.cogs);
    p.ebitda      = calcEbitda(p.grossProfit, p.opex);
    p.ebit        = calcEbit(p.ebitda, p.da);
    p.pbt         = calcPbt(p.ebit, p.financeCosts);
    p.netProfit   = calcNetProfit(p.pbt, p.tax);
    pl.push(p);

    const b = {};
    Object.keys(data.bs).forEach(k => b[k] = data.bs[k][i]);
    b.totalAssets      = calcTotalAssets(b);
    b.totalLiabilities = calcTotalLiabilities(b);
    b.totalEquity      = calcTotalEquity(b);
    b.totalLE          = b.totalLiabilities + b.totalEquity;
    bs.push(b);
  });

  data.years.forEach((year, i) => {
    const prev = i === 0 ? data.opening : bs[i - 1];
    const wcIncrease = calcWorkingCapital(bs[i]) - calcWorkingCapital(prev);
    const c = { netProfit: pl[i].netProfit, da: pl[i].da, workingCapital: -wcIncrease };
    c.operating = calcOperatingCashFlow(c.netProfit, c.da, wcIncrease);
    c.investing = calcInvestingCashFlow(bs[i].ppe, prev.ppe, pl[i].da);
    c.financing = calcFinancingCashFlow(prev, bs[i]);
    c.netChange = c.operating + c.investing + c.financing;
    c.opening   = i === 0 ? data.opening.cash : cf[i - 1].closing; // chained from last year's calculated closing
    c.closing   = c.opening + c.netChange;
    cf.push(c);
  });
  return { years: data.years, pl, bs, cf };
}

// ---------- Validation: reports problems, never changes the figures ----------
function validateStatements(S, data) {
  const checks = [];
  S.years.forEach((year, i) => {
    const b = S.bs[i], c = S.cf[i], prevRE = i === 0 ? data.opening.retainedEarnings : S.bs[i - 1].retainedEarnings;

    const gap = b.totalAssets - b.totalLE;
    checks.push({ year, name: "Total assets = total liabilities + equity", ok: Math.abs(gap) < TOLERANCE,
      detail: `${formatNumber(b.totalAssets)} vs ${formatNumber(b.totalLiabilities)} + ${formatNumber(b.totalEquity)} = ${formatNumber(b.totalLE)} (difference ${formatNumber(gap)})` });

    const cashGap = c.closing - b.cash;
    checks.push({ year, name: "Opening cash + net cash movement = closing cash on the balance sheet", ok: Math.abs(cashGap) < TOLERANCE,
      detail: `${formatNumber(c.opening)} + ${formatNumber(c.netChange)} = ${formatNumber(c.closing)} vs balance sheet cash ${formatNumber(b.cash)} (difference ${formatNumber(cashGap)})` });

    const reGap = b.retainedEarnings - (prevRE + S.pl[i].netProfit);
    checks.push({ year, name: "Retained earnings = last year's retained earnings + net profit (no dividends)", ok: Math.abs(reGap) < TOLERANCE,
      detail: `${formatNumber(prevRE)} + ${formatNumber(S.pl[i].netProfit)} = ${formatNumber(prevRE + S.pl[i].netProfit)} vs reported ${formatNumber(b.retainedEarnings)} (difference ${formatNumber(reGap)})` });
  });
  return checks;
}

// ---------- Formatting: 1,234 and (1,234) for negatives, as in published accounts ----------
function formatNumber(n) {
  if (!Number.isFinite(n)) return "n/a";
  const s = Math.abs(Math.round(n)).toLocaleString("en-GB");
  return n < 0 ? `(${s})` : s;
}
function formatPercent(n, dp = 1) { return Number.isFinite(n) ? n.toFixed(dp) + "%" : "n/a"; }
function formatDays(n)            { return Number.isFinite(n) ? n.toFixed(0) + " days" : "n/a"; }
