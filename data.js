/* data.js — the fictional dataset. Only INPUT figures live here.
   Totals, profits and cash flows are calculated in finance.js, so they can never be typed in wrongly. */
const DATA = {
  company: "Northfield Goods Ltd (fictional)",
  units: "$ thousands",
  periodNote: "Financial years ended 31 December",
  years: ["FY2022", "FY2023", "FY2024"],

  // Balance sheet at the START of FY2022 (i.e. the end of FY2021). Needed to work out FY2022 movements.
  opening: {
    cash: 800, receivables: 1500, inventory: 1800, otherCurrentAssets: 300, ppe: 4000,
    payables: 1300, borrowings: 3000, otherLiabilities: 400,
    shareCapital: 2000, retainedEarnings: 1700
  },

  // Profit and loss inputs (costs entered as positive numbers). One value per year.
  pl: {
    revenue:      [12000, 13800, 15600],
    cogs:         [ 7200,  8280,  9360],
    opex:         [ 2700,  3000,  3400],
    da:           [  600,   660,   720],
    financeCosts: [  240,   260,   280],
    tax:          [  315,   400,   460]
  },

  // Balance sheet at the END of each year.
  bs: {
    cash:               [1305, 1575, 1985],
    receivables:        [1700, 1950, 2200],
    inventory:          [2000, 2250, 2500],
    otherCurrentAssets: [ 320,  340,  360],
    ppe:                [4400, 4840, 5320],
    payables:           [1450, 1650, 1850],
    borrowings:         [3200, 3000, 2800],
    otherLiabilities:   [ 430,  460,  490],
    shareCapital:       [2000, 2000, 2000],
    retainedEarnings:   [2645, 3845, 5225]
  },

  // Assumptions under which the cash flow statement is built and validated.
  assumptions: [
    "No dividends are paid and no new shares are issued.",
    "No fixed assets are sold; capital spending equals the rise in property and equipment plus depreciation.",
    "Tax and interest are paid in cash in the year they are expensed.",
    "Depreciation and amortisation is the only non-cash expense."
  ]
};
