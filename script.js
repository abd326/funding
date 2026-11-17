/* ============================================================
   KERYNTH CAPITAL — FRONTEND CONFIGURATION
   Edit this object before publishing. Payment and contact details only.
   ============================================================ */
const CONFIG = {
  brand: "Kerynth Capital",
  payments: {
    paypalEmail: "abd4704224@outlook.com", // Add the verified business PayPal receiving email.
    usdtTrc20Address: "TDQt76mgxpqX8AnwfADM1qEkMDz1RdzCDS" // Add the verified USDT wallet address on TRON (TRC20) only.
  },
  contact: {
    supportEmail: "support@capital.com", // Add the monitored support inbox.
    whatsappNumber: "487956821", // International format, digits only; e.g. 15551234567.
    telegramUsername: "kernythCapital0" // Telegram handle without @.
  },
  pricing: {
    currency: "USD",
    usdtDiscountPercent: 44.4444444444,
    accounts: [2000, 5000, 10000, 25000, 100000],
    original: {
      onePhase: { 2000: 45, 5000: 89, 10000: 159, 25000: 299, 100000: 899 },
      twoPhase: { 2000: 35, 5000: 69, 10000: 129, 25000: 249, 100000: 749 },
      instant: { 2000: 67.5, 5000: 133.5, 10000: 238.5, 25000: 448.5, 100000: 1348.5 }
    }
  },
  /*
    Proposed initial programme conditions. Confirm the calculation
    methodology and operational policies before publishing.
    dailyDrawdown / maxDrawdown are percentages of account size here;
    this configuration does NOT define the daily reset or static/trailing
    calculation model. See the rules page for the required policy decisions.
  */
  rules: {
    onePhase: {
      label: "Standard · One Phase", profitTarget: "10%", dailyDrawdown: "4%",
      maxDrawdown: "8%", minDays: "3", maxPeriod: "Unlimited", leverage: "Up to 1:100",
      weekend: "Pending final policy approval", news: "Pending final policy approval",
      ea: "Pending final policy approval", consistency: "No separate consistency metric configured in this draft."
    },
    twoPhase: {
      label: "Standard · Two Phase", profitTarget: "8% (Phase 1) / 5% (Phase 2)",
      dailyDrawdown: "5%", maxDrawdown: "10%", minDays: "3 per phase", maxPeriod: "Unlimited",
      leverage: "Up to 1:100", weekend: "Pending final policy approval",
      news: "Pending final policy approval", ea: "Pending final policy approval",
      consistency: "No separate consistency metric configured in this draft."
    },
    instant: {
      label: "Instant Funding", profitTarget: "No evaluation target", dailyDrawdown: "3%",
      maxDrawdown: "6%", minDays: "No minimum", maxPeriod: "Unlimited", leverage: "Up to 1:50",
      weekend: "Pending final policy approval", news: "Pending final policy approval",
      ea: "Pending final policy approval", consistency: "No separate consistency metric configured in this draft."
    }
  }
};

const state = {
  category: "standard",
  phase: "one",
  selectedPlan: null,
  paymentMethod: "",
  order: null,
  currentPage: "home"
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = value => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
const safeText = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
const getPlanKey = () => state.category === "instant" ? "instant" : state.phase === "one" ? "onePhase" : "twoPhase";
const getPlanLabel = () => state.category === "instant" ? "Instant Funding" : state.phase === "one" ? "Standard One Phase" : "Standard Two Phase";
const originalPrice = (key, size) => CONFIG.pricing.original[key][size];
const discountPrice = price => Math.round(price * (1 - CONFIG.pricing.usdtDiscountPercent / 100) * 100) / 100;
const discountPercent = price => Math.round((1 - discountPrice(price) / price) * 10000) / 100;
const toast = message => {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2600);
};
function navigate(page) {
  const known = ["home","challenges","rules","about","faq","contact","checkout","payment","submit","confirmation","legal"];
  if (!known.includes(page)) page = "home";
  state.currentPage = page;
  $$(".page").forEach(el => el.classList.toggle("active", el.id === `page-${page}`));
  $$(".main-nav a[data-page]").forEach(a => a.classList.toggle("active", a.dataset.page === page));
  $("#mainNav").classList.remove("open");
  $("#mobileMenu").setAttribute("aria-expanded", "false");
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (page === "challenges") renderPricing();
  if (page === "checkout") renderCheckout();
  if (page === "payment") renderPayment();
  if (page === "submit") renderSubmission();
}
function routeFromHash() {
  const hash = location.hash.replace(/^#/, "");
  if (hash.startsWith("legal/")) { renderLegal(hash.split("/")[1]); navigate("legal"); return; }
  navigate(hash || "home");
}
function planObject(category = state.category, phase = state.phase, size) {
  const key = category === "instant" ? "instant" : phase === "one" ? "onePhase" : "twoPhase";
  const amount = originalPrice(key, size);
  return {
    key, category, phase, size, label: category === "instant" ? "Instant Funding" : phase === "one" ? "Standard One Phase" : "Standard Two Phase",
    original: amount, discounted: discountPrice(amount), discount: discountPercent(amount),
    rules: CONFIG.rules[key]
  };
}
function renderPricing() {
  const instant = state.category === "instant";
  $("#phaseSwitch").style.display = instant ? "none" : "flex";
  $("#pricingTitle").textContent = instant ? "Instant funding" : state.phase === "one" ? "One phase challenge" : "Two phase challenge";
  $("#pricingDescription").textContent = instant
    ? "Direct programme access without a traditional evaluation profit target."
    : state.phase === "one" ? "A single evaluation stage with a defined profit objective and risk limits."
    : "Two evaluation stages designed around separate profit objectives and shared risk parameters.";
  $("#pricingGrid").innerHTML = CONFIG.pricing.accounts.map((size, index) => {
    const plan = planObject(state.category, state.phase, size);
    return `<article class="price-card ${index === 2 ? "featured" : ""}">
      ${index === 2 ? '<span class="popular-tag">MID-SIZE OPTION</span>' : ""}
      <span class="account-label">ACCOUNT SIZE</span><h3>${money(size)}</h3>
      <div class="price-original">${money(plan.original)}</div>
      <div class="price-final">${money(plan.discounted)} <small>USDT</small></div>
      <span class="discount-pill">SAVE ${plan.discount}% · TRC20</span>
      <div class="price-method">PayPal: ${money(plan.original)}<br>USDT TRC20: ${money(plan.discounted)}</div>
      <button class="btn btn-ghost" data-plan-size="${size}">View plan details <span>↗</span></button>
    </article>`;
  }).join("");
  $$(".tab-switch button").forEach(button => {
    const active = button.dataset.category === state.category;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  $$(".phase-switch button").forEach(button => button.classList.toggle("active", button.dataset.phase === state.phase));
}
function openPlan(size) {
  state.selectedPlan = planObject(state.category, state.phase, Number(size));
  const p = state.selectedPlan, r = p.rules;
  const fields = [
    ["Account size", money(p.size)], ["Challenge type", p.label], ["Profit target", r.profitTarget],
    ["Daily drawdown", r.dailyDrawdown], ["Maximum drawdown", r.maxDrawdown],
    ["Minimum trading days", r.minDays], ["Maximum trading period", r.maxPeriod],
    ["Leverage", r.leverage], ["Weekend holding", r.weekend], ["News trading", r.news],
    ["EA & strategy rules", r.ea], ["Consistency requirements", r.consistency]
  ];
  $("#modalContent").innerHTML = `<div class="modal-kicker">PROGRAMME DETAILS · PROPOSED TERMS</div>
    <h2 id="modalTitle">${safeText(p.label)}</h2><p class="modal-sub">${money(p.size)} account programme · Review all conditions before purchase.</p>
    <div class="modal-price-row"><div><small>Original fee · PayPal</small><strong>${money(p.original)}</strong></div><div style="text-align:right"><small>Discounted fee · USDT TRC20</small><strong>${money(p.discounted)}</strong></div></div>
    <div class="modal-rule-grid">${fields.map(([label,value]) => `<div class="modal-rule"><small>${safeText(label.toUpperCase())}</small><strong>${safeText(value)}</strong></div>`).join("")}</div>
    <p class="modal-footnote">Proposed conditions only. Drawdown reference equity/balance, reset time, static/trailing model, weekend/news windows and strategy restrictions must be formally defined and approved by the firm before launch.</p>
    <button class="btn btn-primary" id="modalContinue">Continue to payment <span>↗</span></button>`;
  $("#planModal").classList.add("open");
  $("#planModal").setAttribute("aria-hidden", "false");
}
function closeModal() {
  $("#planModal").classList.remove("open");
  $("#planModal").setAttribute("aria-hidden", "true");
}
function renderOrderSummary(plan, method = "") {
  const final = method === "usdt" ? plan.discounted : plan.original;
  return `<div class="order-summary"><div class="section-kicker">ORDER SUMMARY</div><h2>${safeText(plan.label)}</h2>
    <div class="order-line"><span>Account size</span><strong>${money(plan.size)}</strong></div>
    <div class="order-line"><span>Programme</span><strong>${safeText(plan.label)}</strong></div>
    <div class="order-line"><span>Original price</span><strong>${money(plan.original)}</strong></div>
    <div class="order-line"><span>USDT discount</span><strong>${method === "usdt" ? `−${money(plan.original - plan.discounted)} (${plan.discount}%)` : "Only on USDT TRC20"}</strong></div>
    <div class="order-total"><span>Amount payable</span><strong>${money(final)}</strong></div>
    <p class="micro-note">Fees are programme charges. The website does not hold funds or verify a transfer.</p></div>`;
}
function renderCheckout() {
  if (!state.selectedPlan) { navigate("challenges"); return; }
  const plan = state.selectedPlan;
  const paypalReady = Boolean(CONFIG.payments.paypalEmail.trim());
  const usdtReady = Boolean(CONFIG.payments.usdtTrc20Address.trim());
  $("#checkoutContent").innerHTML = `<div class="checkout-columns"><div class="checkout-panel"><div class="section-kicker">PAYMENT METHOD</div><h2>Choose how to pay.</h2>
    <label class="payment-option ${state.paymentMethod === "paypal" ? "selected" : ""} ${!paypalReady ? "disabled" : ""}">
      <input type="radio" name="payment" value="paypal" ${state.paymentMethod === "paypal" ? "checked" : ""} ${!paypalReady ? "disabled" : ""}>
      <span><strong>PayPal</strong><small>Full original price · USD</small></span>
    </label>
    <label class="payment-option ${state.paymentMethod === "usdt" ? "selected" : ""} ${!usdtReady ? "disabled" : ""}">
      <input type="radio" name="payment" value="usdt" ${state.paymentMethod === "usdt" ? "checked" : ""} ${!usdtReady ? "disabled" : ""}>
      <span><strong>USDT TRC20</strong><small>Discounted price · TRON network only</small></span>
    </label>
    ${(!paypalReady || !usdtReady) ? `<div class="config-alert">Payment configuration required: ${!paypalReady ? "PayPal email is missing. " : ""}${!usdtReady ? "USDT TRC20 wallet address is missing." : ""} The unavailable method cannot be selected until the owner adds its verified details in script.js.</div>` : ""}
    <div class="payment-warning">Only send funds after verifying the recipient and amount. Payment references are reviewed manually; submission is not payment verification.</div>
    <button class="btn btn-primary" id="goPayment" ${!state.paymentMethod || (state.paymentMethod === "paypal" && !paypalReady) || (state.paymentMethod === "usdt" && !usdtReady) ? "disabled" : ""}>Continue <span>↗</span></button>
    <button class="btn btn-ghost" id="backPlans" style="margin-left:8px">Back to programmes</button></div>${renderOrderSummary(plan, state.paymentMethod)}</div>`;
}
function renderPayment() {
  if (!state.selectedPlan || !state.paymentMethod) { navigate("checkout"); return; }
  const p = state.selectedPlan, method = state.paymentMethod;
  const amount = method === "usdt" ? p.discounted : p.original;
  const recipient = method === "usdt" ? CONFIG.payments.usdtTrc20Address : CONFIG.payments.paypalEmail;
  const methodName = method === "usdt" ? "USDT TRC20" : "PayPal";
  $("#paymentContent").innerHTML = `<div class="payment-panel"><div class="section-kicker">${safeText(methodName)} PAYMENT</div><h2>Payment instructions</h2>
    <p>Selected programme: <strong>${safeText(p.label)} · ${money(p.size)}</strong></p>
    <div class="payment-amount">${money(amount)} <small style="font-size:13px;color:#91a49a">${method === "usdt" ? "USDT" : "USD"}</small></div>
    ${method === "usdt" ? `<p>Network: <strong style="color:var(--green)">TRON (TRC20) only</strong>. Do not send using ERC20, BEP20 or another network.</p>` : `<p>Send the exact USD amount to the business PayPal email below using your preferred PayPal payment method.</p>`}
    <div class="copy-row"><div class="copy-value" id="recipientValue">${safeText(recipient)}</div><button class="copy-btn" id="copyRecipient">Copy ${method === "usdt" ? "address" : "email"}</button></div>
    ${method === "usdt" ? `<div class="config-alert">Confirm the wallet address and TRC20 network independently before sending. A QR code is not shown because no verified QR payload has been configured.</div>` : `<div class="config-alert">PayPal payment is not processed by this website. Keep your transaction receipt and reference for submission.</div>`}
    <button class="btn btn-primary" id="paymentSent">I have completed payment <span>↗</span></button>
    <button class="btn btn-ghost" id="paymentBack" style="margin-left:8px">Back</button></div>`;
}
function renderSubmission() {
  if (!state.selectedPlan || !state.paymentMethod) { navigate("checkout"); return; }
  const p = state.selectedPlan, isUsdt = state.paymentMethod === "usdt";
  const amount = isUsdt ? p.discounted : p.original;
  $("#submitContent").innerHTML = `<div class="submission-panel"><div class="section-kicker">TRANSACTION DETAILS</div><h2>Submit your payment reference.</h2>
    <p class="sub-intro">Submit your transaction reference for review. This website does not send emails or automatically verify payments.</p>
    <div class="order-line"><span>Programme</span><strong>${safeText(p.label)} · ${money(p.size)}</strong></div>
    <div class="order-line"><span>Payment method</span><strong>${isUsdt ? "USDT TRC20" : "PayPal"}</strong></div>
    <div class="order-line"><span>Amount submitted</span><strong>${money(amount)} ${isUsdt ? "USDT" : "USD"}</strong></div>
    <form class="submission-form" id="paymentSubmissionForm">
      <label>Full name<input name="fullName" required autocomplete="name" maxlength="100" placeholder="Your full name"></label>
      <label>Email address<input name="email" type="email" required autocomplete="email" maxlength="160" placeholder="you@example.com"></label>
      <label>${isUsdt ? "USDT transaction hash / transaction ID" : "PayPal transaction ID"}<input name="transactionRef" required maxlength="180" placeholder="${isUsdt ? "Paste your TRC20 transaction hash" : "Enter your PayPal transaction ID"}"></label>
      <label>Additional information (optional)<textarea name="notes" rows="4" maxlength="1000" placeholder="Anything the review team should know"></textarea></label>
      <button class="btn btn-primary" type="submit">Submit for review <span>↗</span></button>
    </form>
    <p class="form-hint" id="submitStatus">Your transaction remains unverified until the firm independently confirms receipt.</p>
  </div>`;
}
function makeOrderId() {
  const bytes = new Uint8Array(8);
  if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i=0;i<bytes.length;i++) bytes[i] = Math.floor(Math.random()*256);
  return "KRY-" + [...bytes].map(v => v.toString(16).padStart(2,"0")).join("").toUpperCase();
}
function saveLocalOrder(order) {
  try {
    const orders = JSON.parse(localStorage.getItem("kerynth_orders") || "[]");
    orders.push(order);
    localStorage.setItem("kerynth_orders", JSON.stringify(orders.slice(-20)));
    localStorage.setItem("kerynth_latest_order", JSON.stringify(order));
  } catch (error) { console.warn("Local order storage unavailable:", error); }
}
function renderConfirmation(order) {
  const details = [
    ["Order ID", order.orderId], ["Customer", order.customerName], ["Customer email", order.customerEmail],
    ["Account size", money(order.accountSize)], ["Challenge type", order.challengeType],
    ["Selected plan", order.plan], ["Original price", money(order.originalPrice)],
    ["Discount", order.discountAmount > 0 ? `${money(order.discountAmount)} (${order.discountPercent}%)` : "None"],
    ["Payment method", order.paymentMethod], ["Transaction reference", order.transactionReference],
    ["Submitted amount", `${money(order.amount)} ${order.currency}`], ["Submission date", order.submittedAt]
  ];
  $("#confirmationContent").innerHTML = `<div class="confirmation-icon">⌛</div><div class="section-kicker">ORDER SUBMISSION RECEIVED</div><h1>Payment Under Review</h1>
    <p>Your payment details have been submitted successfully. Our team will review your transaction and process your order accordingly.</p>
    <div class="order-id-box"><small>YOUR UNIQUE ORDER ID</small><strong>${safeText(order.orderId)}</strong></div>
    <div class="confirmation-details">${details.map(([k,v]) => `<div class="order-line"><span>${safeText(k)}</span><strong>${safeText(v)}</strong></div>`).join("")}</div>
    <p class="confirmation-note">This is a submission acknowledgement only. Your payment has NOT been verified and no funded account has been activated. Keep your Order ID for follow-up.</p>
    <a href="#home" class="btn btn-primary">Return to home <span>↗</span></a>`;
}
function renderLegal(type) {
  const content = {
    risk: ["Risk disclosure", `<h2>Trading risk</h2><p>Trading in foreign exchange, CFDs, futures, digital assets and other leveraged financial instruments involves substantial risk and may not be suitable for all participants. Leverage can magnify losses. You may lose some or all of the funds paid for a programme and may not qualify for access to a subsequent account.</p><p>Past performance, simulated results and hypothetical examples do not guarantee future outcomes. Nothing on this website is investment advice, a recommendation, or a promise of profit, funding or payout.</p><h2>Programme and simulation disclosure</h2><p>The precise legal and operational nature of any trading programme must be described by the operating entity in its final customer agreement. Do not assume that a displayed account size represents cash deposited into an account in the customer's name.</p><h2>Jurisdiction and eligibility</h2><p>Access may be restricted by location, age, sanctions, local law or the firm's final eligibility policy. Obtain independent professional advice where appropriate.</p>`],
    terms: ["Terms & conditions", `<h2>Draft status</h2><p>This is draft website copy and is not a complete binding customer agreement. Before launch, the operating entity must publish its legal name, jurisdiction, eligibility rules, service description, fees, refund/cancellation terms, programme rules, dispute process and governing law.</p><h2>Programme selection</h2><p>Programme descriptions and prices are subject to final approval. A payment reference submission is not acceptance of an order, confirmation of payment or activation of an account. The firm must independently verify receipt and determine eligibility.</p><h2>Prohibited use</h2><p>Users must provide accurate information and must not misuse the website, submit fraudulent payment references, attempt unauthorised access or interfere with its operation. Final restrictions and consequences must be stated in the approved customer agreement.</p><h2>Contact and changes</h2><p>Replace this draft with legally reviewed terms for the actual operating business and jurisdictions before accepting orders.</p>`],
    privacy: ["Privacy policy", `<h2>Information submitted</h2><p>This website may collect a customer's name, email address, payment reference and optional notes when the customer submits an order. These details are intended for the owner to review the payment submission and follow up through appropriate channels.</p><h2>Storage and transmission</h2><p>Order submission details are stored only in the customer's browser localStorage. Browser storage is not a secure or permanent order database and the website does not transmit orders to a server.</p><h2>Email</h2><p>This website does not send order notification emails, customer emails or automatic emails of any kind.</p><h2>Retention and rights</h2><p>The operating entity must define its data controller identity, lawful basis, retention periods, processors, cross-border transfers, security controls and applicable privacy rights before launch. Replace this draft with a reviewed privacy notice.</p>`]
  }[type] || ["Important information", "<p>Legal information will be published here.</p>"];
  $("#legalTitle").innerHTML = safeText(content[0]) + " <em>for every trader.</em>";
  $("#legalContent").innerHTML = content[1];
}
function renderContactDetails() {
  const items = [
    ["✉","SUPPORT EMAIL",CONFIG.contact.supportEmail],
    ["◉","WHATSAPP",CONFIG.contact.whatsappNumber ? `+${CONFIG.contact.whatsappNumber}` : ""],
    ["➤","TELEGRAM",CONFIG.contact.telegramUsername ? `@${CONFIG.contact.telegramUsername.replace(/^@/,"")}` : ""]
  ];
  $("#contactDetails").innerHTML = items.map(([icon,label,value]) => `<div class="contact-item"><span>${icon}</span><div><small>${label}</small><strong>${value ? safeText(value) : "Not configured"}</strong></div></div>`).join("");
}
function bindEvents() {
  document.addEventListener("click", event => {
    const link = event.target.closest('a[href^="#"]');
    if (link) {
      const href = link.getAttribute("href");
      if (href.startsWith("#legal/")) { event.preventDefault(); history.pushState(null,"",href); renderLegal(href.split("/")[1]); navigate("legal"); return; }
      if (href.length > 1) { event.preventDefault(); history.pushState(null,"",href); routeFromHash(); return; }
    }
    const planButton = event.target.closest("[data-plan-size]");
    if (planButton) openPlan(planButton.dataset.planSize);
  });
  $("#mobileMenu").addEventListener("click", () => {
    const open = $("#mainNav").classList.toggle("open");
    $("#mobileMenu").setAttribute("aria-expanded", String(open));
  });
  $("#modalClose").addEventListener("click", closeModal);
  $("#planModal").addEventListener("click", event => { if (event.target === $("#planModal")) closeModal(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape") closeModal(); });
  $("#modalContent").addEventListener("click", event => {
    if (event.target.closest("#modalContinue")) { closeModal(); state.paymentMethod = ""; location.hash = "checkout"; }
  });
  $(".tab-switch").addEventListener("click", event => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    state.category = button.dataset.category;
    renderPricing();
  });
  $(".phase-switch").addEventListener("click", event => {
    const button = event.target.closest("[data-phase]");
    if (!button) return;
    state.phase = button.dataset.phase;
    renderPricing();
  });
  $("#checkoutContent").addEventListener("change", event => {
    if (event.target.name === "payment") { state.paymentMethod = event.target.value; renderCheckout(); }
  });
  $("#checkoutContent").addEventListener("click", event => {
    if (event.target.closest("#goPayment")) location.hash = "payment";
    if (event.target.closest("#backPlans")) location.hash = "challenges";
  });
  $("#paymentContent").addEventListener("click", async event => {
    if (event.target.closest("#copyRecipient")) {
      const text = $("#recipientValue").textContent;
      try { await navigator.clipboard.writeText(text); toast("Copied to clipboard"); }
      catch { toast("Copy unavailable — select and copy the text"); }
    }
    if (event.target.closest("#paymentSent")) location.hash = "submit";
    if (event.target.closest("#paymentBack")) location.hash = "checkout";
  });
  $("#submitContent").addEventListener("submit", event => {
    if (event.target.id !== "paymentSubmissionForm") return;
    event.preventDefault();
    const form = event.target;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const p = state.selectedPlan, usdt = state.paymentMethod === "usdt";
    const order = {
      orderId: makeOrderId(),
      customerName: String(data.get("fullName")).trim(),
      customerEmail: String(data.get("email")).trim(),
      accountSize: p.size,
      challengeType: p.category === "instant" ? "Instant Funding" : "Standard Challenge",
      plan: p.label,
      originalPrice: p.original,
      discountAmount: usdt ? Math.round((p.original - p.discounted) * 100) / 100 : 0,
      discountPercent: usdt ? p.discount : 0,
      amount: usdt ? p.discounted : p.original,
      currency: usdt ? "USDT" : "USD",
      paymentMethod: usdt ? "USDT TRC20" : "PayPal",
      transactionReference: String(data.get("transactionRef")).trim(),
      additionalInformation: String(data.get("notes") || "").trim(),
      submittedAt: new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
      paymentStatus: "Under review — not verified"
    };
    saveLocalOrder(order);
    state.order = order;
    try { localStorage.setItem("kerynth_latest_order", JSON.stringify(order)); } catch {}
    renderConfirmation(order);
    location.hash = "confirmation";
  });
  $("#contactForm").addEventListener("submit", event => {
    event.preventDefault();
    if (!event.target.reportValidity()) return;
    $("#contactFormHint").textContent = "No email has been sent. Please use the configured support contact details shown on this page.";
    toast("No email sent");
  });
  window.addEventListener("hashchange", routeFromHash);
  window.addEventListener("popstate", routeFromHash);
}
function init() {
  $("#year").textContent = new Date().getFullYear();
  renderPricing();
  renderContactDetails();
  bindEvents();
  routeFromHash();
}
document.addEventListener("DOMContentLoaded", init);
