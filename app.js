/* app.js — the interface. It reads data and calculations from the other files and draws the page. */
(function () {
  const SECTIONS = ["home", "learn", "connect", "analyse", "practise"];
  const $ = id => document.getElementById(id);

  // ----- App state -----
  let simulateError = false;   // when true, a deliberately wrong copy of the data is used (to test validation)
  let S, checks;               // calculated statements and validation results
  const state = { stmt: "pl", item: null, quiz: { i: 0, score: 0, picked: null, done: false } };

  function rebuild() {
    let data = DATA;
    if (simulateError) {            // copy the data, then add 100 to FY2024 cash. The original is untouched.
      data = JSON.parse(JSON.stringify(DATA));
      data.bs.cash[data.bs.cash.length - 1] += 100;
    }
    S = buildStatements(data);
    checks = validateStatements(S, data);
  }

  // ----- Shared pieces -----
  function bannerHtml() {
    const failed = checks.filter(c => !c.ok);
    if (!failed.length) {
      return `<div class="banner ok" role="status"><strong>All ${checks.length} accounting checks passed.</strong> The balance sheet balances and cash reconciles in every year. <a href="#connect">See the checks</a></div>`;
    }
    return `<div class="banner bad" role="alert"><strong>Validation error: ${failed.length} of ${checks.length} checks failed.</strong>
      <ul>${failed.map(c => `<li>${c.year}: ${c.name}. ${c.detail}</li>`).join("")}</ul>
      The figures are shown exactly as supplied and have not been adjusted.</div>`;
  }

  // ----- Learn -----
  function renderLearn() {
    $("learn-tabs").innerHTML = Object.keys(STATEMENTS).map(key =>
      `<a href="#learn/${key}" class="tab" ${key === state.stmt ? 'aria-current="page"' : ""}>${STATEMENTS[key].short}</a>`).join("");
    $("learn-banner").innerHTML = bannerHtml();
    $("learn-table").innerHTML = tableHtml(state.stmt);
    showExplanation(state.item);
  }

  function tableHtml(key) {
    const st = STATEMENTS[key];
    let h = `<table class="fin"><caption>${st.title}<span>${st.caption}. ${DATA.periodNote}. Select a line item to learn about it.</span></caption>
      <thead><tr><th scope="col">Line item</th>${S.years.map(y => `<th scope="col" class="num">${y}</th>`).join("")}</tr></thead><tbody>`;
    st.rows.forEach(r => {
      if (r.kind === "heading") { h += `<tr class="group"><th scope="colgroup" colspan="${S.years.length + 1}">${r.label}</th></tr>`; return; }
      const pressed = r.id === state.item;
      h += `<tr class="${r.kind === "total" ? "total" : ""}"><th scope="row"><button type="button" class="item" data-id="${r.id}" aria-pressed="${pressed}">${r.label}</button></th>`;
      S[key].forEach(year => { const v = r.neg ? -year[r.key] : year[r.key]; h += `<td class="num${v < 0 ? " negative" : ""}">${formatNumber(v)}</td>`; });
      h += "</tr>";
    });
    return h + "</tbody></table>";
  }

  function showExplanation(id) {
    const panel = $("explain");
    const e = id && EXPLAIN[id];
    if (!e) { panel.innerHTML = `<h2>Line item explanation</h2><p>Select any line item in the table to see what it means, how it is calculated, an example from this company and why it matters.</p>`; return; }
    panel.innerHTML = `<h2>${e.title}</h2><p>${e.what}</p>
      ${e.formula ? `<p class="formula"><b>Formula</b>${e.formula}</p>` : ""}
      <h3>Example</h3><p>${e.example(S)}</p><h3>Why it matters</h3><p>${e.why}</p>
      <p class="muted">Fictional figures, $ thousands.</p>`;
  }

  // ----- Connect -----
  function renderConnect() {
    const p = lastOf(S, "pl"), b = lastOf(S, "bs"), c = lastOf(S, "cf"), y = lastYear(S);
    const links = [
      ["P&L to Balance Sheet", `${y} net profit of ${k(p.netProfit)} is added to retained earnings, taking it to ${k(b.retainedEarnings)}.`],
      ["P&L to Cash Flow", `Net profit of ${k(c.netProfit)} is the starting point of operating cash flow, with ${k(c.da)} of depreciation added back.`],
      ["Balance Sheet to Cash Flow", `Changes in receivables, inventory, payables, property and borrowings explain the working capital, investing and financing cash flows.`],
      ["Cash Flow to Balance Sheet", `Closing cash of ${k(c.closing)} should equal balance sheet cash of ${k(b.cash)}.`]
    ];
    const rows = checks.map(ch => `<tr><td>${ch.year}</td><td>${ch.name}</td>
      <td class="${ch.ok ? "pass" : "fail"}">${ch.ok ? "Pass" : "Fail"}</td><td>${ch.detail}</td></tr>`).join("");
    $("connect-body").innerHTML = `
      <p class="lead">The three statements are one story told three ways. Each link below uses the latest year of the fictional data.</p>
      <div class="links">${links.map(l => `<div class="link-card"><h2>${l[0]}</h2><p>${l[1]}</p></div>`).join("")}</div>
      <h2>Accounting checks</h2>${bannerHtml()}
      <div class="table-wrap"><table class="fin checks"><caption>Validation results<span>Every check is recalculated from the data each time the page loads.</span></caption>
        <thead><tr><th scope="col">Year</th><th scope="col">Check</th><th scope="col">Result</th><th scope="col">Working</th></tr></thead><tbody>${rows}</tbody></table></div>
      <h2>Assumptions behind the cash flow</h2><ul>${DATA.assumptions.map(a => `<li>${a}</li>`).join("")}</ul>
      <h2>Test the validation</h2>
      <p>This button adds $100k to FY2024 cash in a temporary copy of the data. The checks should fail and report it. The statements are not forced to balance.</p>
      <button type="button" class="btn" id="toggle-error" aria-pressed="${simulateError}">${simulateError ? "Restore the original data" : "Introduce a deliberate error"}</button>`;
  }

  // ----- Analyse -----
  function renderAnalyse() {
    const rows = [
      ["Gross margin", "Gross profit ÷ Revenue", (p) => formatPercent(ratioPercent(p.grossProfit, p.revenue))],
      ["EBITDA margin", "EBITDA ÷ Revenue", (p) => formatPercent(ratioPercent(p.ebitda, p.revenue))],
      ["Net margin", "Net profit ÷ Revenue", (p) => formatPercent(ratioPercent(p.netProfit, p.revenue))],
      ["Return on equity", "Net profit ÷ Closing equity", (p, b) => formatPercent(ratioPercent(p.netProfit, b.totalEquity))],
      ["Debt-to-equity", "Borrowings ÷ Total equity", (p, b) => (b.borrowings / b.totalEquity).toFixed(2) + "x"],
      ["Receivable days", "Receivables ÷ Revenue × 365", (p, b) => formatDays(ratioDays(b.receivables, p.revenue))],
      ["Inventory days", "Inventory ÷ COGS × 365", (p, b) => formatDays(ratioDays(b.inventory, p.cogs))],
      ["Cash conversion", "Operating cash flow ÷ Net profit", (p, b, c) => formatPercent(ratioPercent(c.operating, p.netProfit), 0)]
    ];
    $("analyse-body").innerHTML = `<p class="lead">Ratios turn the statements into comparisons you can track over time. Trends matter more than any single number.</p>
      <div class="table-wrap"><table class="fin"><caption>Key ratios<span>Calculated from the fictional statements. Ratios are not in $.</span></caption>
      <thead><tr><th scope="col">Ratio</th><th scope="col">Formula</th>${S.years.map(y => `<th scope="col" class="num">${y}</th>`).join("")}</tr></thead><tbody>
      ${rows.map(r => `<tr><th scope="row">${r[0]}</th><td>${r[1]}</td>${S.years.map((y, i) => `<td class="num">${r[2](S.pl[i], S.bs[i], S.cf[i])}</td>`).join("")}</tr>`).join("")}
      </tbody></table></div>
      <h2>What to notice</h2><ul>
        <li>Margins are stable or improving while revenue grows, which suggests growth is not being bought with discounts.</li>
        <li>Receivable and inventory days are broadly steady, so working capital grows in line with sales.</li>
        <li>Operating cash flow is above net profit because depreciation is added back, but growth in working capital absorbs some of it.</li>
        <li>Debt-to-equity falls because borrowings are repaid while equity builds from retained profit.</li></ul>`;
  }

  // ----- Practise (knowledge check) -----
  function renderPractise() {
    const quiz = buildQuiz(S), q = state.quiz, el = $("practise-body");
    if (q.done) {
      el.innerHTML = `<p class="lead">You scored <strong>${q.score} out of ${quiz.length}</strong>.</p><button type="button" class="btn" data-act="restart">Try again</button>`;
      return;
    }
    const item = quiz[q.i], answered = q.picked !== null;
    el.innerHTML = `<p class="muted">Question ${q.i + 1} of ${quiz.length}</p>
      <fieldset><legend>${item.q}</legend>
      ${item.options.map((o, n) => `<label class="opt ${answered ? (n === item.answer ? "right" : n === q.picked ? "wrong" : "") : ""}">
        <input type="radio" name="opt" value="${n}" ${answered ? "disabled" : ""} ${q.picked === n ? "checked" : ""}> <span>${o}</span></label>`).join("")}
      </fieldset>
      ${answered ? `<p class="feedback ${q.picked === item.answer ? "pass" : "fail"}" role="status"><strong>${q.picked === item.answer ? "Correct." : "Not quite."}</strong> ${item.why}</p>
        <button type="button" class="btn" data-act="next">${q.i + 1 < quiz.length ? "Next question" : "See your score"}</button>`
      : `<button type="button" class="btn" data-act="check">Check answer</button><p id="quiz-msg" class="muted" role="status"></p>`}`;
  }

  function handlePractiseClick(e) {
    const act = e.target.dataset && e.target.dataset.act, q = state.quiz, quiz = buildQuiz(S);
    if (act === "check") {
      const chosen = document.querySelector('input[name="opt"]:checked');
      if (!chosen) { $("quiz-msg").textContent = "Choose an answer first."; return; }
      q.picked = Number(chosen.value);
      if (q.picked === quiz[q.i].answer) q.score++;
    } else if (act === "next") {
      q.picked = null; q.i++; if (q.i >= quiz.length) q.done = true;
    } else if (act === "restart") {
      state.quiz = { i: 0, score: 0, picked: null, done: false };
    } else return;
    renderPractise();
    const focusEl = document.querySelector("#practise-body .feedback, #practise-body legend, #practise-body .lead");
    if (focusEl) { focusEl.setAttribute("tabindex", "-1"); focusEl.focus(); }
  }

  // ----- Routing: the URL hash (#learn/bs) decides what is shown -----
  function route() {
    const [name, arg] = location.hash.replace("#", "").split("/");
    const section = SECTIONS.includes(name) ? name : "home";
    SECTIONS.forEach(s => { $(s).hidden = s !== section; });
    document.querySelectorAll("[data-nav]").forEach(a => {
      if (a.dataset.nav === section) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    if (section === "learn") { if (STATEMENTS[arg] && arg !== state.stmt) { state.stmt = arg; state.item = null; } renderLearn(); }
    if (section === "connect") renderConnect();
    if (section === "analyse") renderAnalyse();
    if (section === "practise") renderPractise();
    const heading = $(section).querySelector("h1");
    document.title = (section === "home" ? "" : heading.textContent + " | ") + "Financial Statements Lab";
    window.scrollTo(0, 0);
    heading.focus({ preventScroll: true });
  }

  // ----- Events -----
  document.addEventListener("click", e => {
    const itemBtn = e.target.closest("button.item");
    if (itemBtn) {
      state.item = itemBtn.dataset.id;
      document.querySelectorAll("button.item").forEach(b => b.setAttribute("aria-pressed", b === itemBtn));
      showExplanation(state.item);
      if (window.matchMedia("(max-width: 860px)").matches) $("explain").scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    if (e.target.id === "toggle-error") { simulateError = !simulateError; rebuild(); renderConnect(); $("toggle-error").focus(); }
  });
  $("practise-body").addEventListener("click", handlePractiseClick);
  window.addEventListener("hashchange", route);

  rebuild();
  route();
})();
