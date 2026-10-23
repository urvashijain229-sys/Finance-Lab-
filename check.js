/* Run with:  node tests/check.js
   Loads the same data, finance and content files the browser uses and checks the accounting logic. */
const fs = require("fs"), vm = require("vm"), path = require("path");
const ctx = vm.createContext({ console });
["data", "finance", "content"].forEach(f =>
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js", f + ".js"), "utf8") + "\n", ctx, { filename: f }));
const run = code => vm.runInContext(code, ctx);

let failures = 0;
function test(name, condition) { console.log((condition ? "PASS  " : "FAIL  ") + name); if (!condition) failures++; }

// 1. The original dataset passes every validation check
const S = run("buildStatements(DATA)");
const checks = run("validateStatements(buildStatements(DATA), DATA)");
test("original data: all validation checks pass (" + checks.length + " checks)", checks.every(c => c.ok));
test("balance sheet balances in every year", S.bs.every(b => b.totalAssets === b.totalLE));
test("opening + net change = closing = balance sheet cash", S.cf.every((c, i) => c.opening + c.netChange === c.closing && c.closing === S.bs[i].cash));
test("opening cash FY2023 = closing cash FY2022", S.cf[1].opening === S.cf[0].closing);

// 2. Known hand-calculated values
test("FY2024 net profit = 1,380", S.pl[2].netProfit === 1380);
test("FY2024 operating cash flow = 1,810", S.cf[2].operating === 1810);
test("FY2024 closing cash = 1,985", S.cf[2].closing === 1985);

// 3. A broken dataset must FAIL validation and must not be silently corrected
const broken = run(`(function(){ const d = JSON.parse(JSON.stringify(DATA)); d.bs.cash[2] += 100; return d; })()`);
const brokenS = run("(d => buildStatements(d))")(broken);
const brokenChecks = run("(function(s,d){ return validateStatements(s,d); })")(brokenS, broken);
test("deliberate error is detected", brokenChecks.some(c => !c.ok));
test("balance check fails on the broken data", brokenChecks.some(c => !c.ok && c.name.startsWith("Total assets")));
test("cash check fails on the broken data", brokenChecks.some(c => !c.ok && c.name.startsWith("Opening cash")));
test("broken figure is left as supplied (cash still 2,085)", brokenS.bs[2].cash === 2085);

// 4. Every clickable row has an explanation with the required parts, and examples run
const STATEMENTS = run("STATEMENTS"), EXPLAIN = run("EXPLAIN");
let missing = [], badExample = [];
Object.values(STATEMENTS).forEach(st => st.rows.forEach(r => {
  if (r.kind === "heading") return;
  const e = EXPLAIN[r.id];
  if (!e || !e.what || !e.why || typeof e.example !== "function") { missing.push(r.id); return; }
  try { if (!/\S/.test(e.example(S)) || /NaN|undefined/.test(e.example(S))) badExample.push(r.id); } catch (err) { badExample.push(r.id); }
}));
test("every line item has an explanation (missing: " + (missing.join(", ") || "none") + ")", missing.length === 0);
test("every example renders cleanly (problems: " + (badExample.join(", ") || "none") + ")", badExample.length === 0);

// 5. Quiz data is well formed
const quiz = run("buildQuiz")(S);
test("quiz has questions with a valid correct answer", quiz.length >= 1 && quiz.every(q => q.answer >= 0 && q.answer < q.options.length));

console.log(failures ? `\n${failures} test(s) FAILED` : "\nAll tests passed");
process.exit(failures ? 1 : 0);
