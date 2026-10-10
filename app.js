// NODE 3 — price board estimator + counter form
(function () {
  "use strict";
  var BASE = { small: 10, medium: 25, large: 60 };
  var KIND = { "1": "Everyday", "1.4": "Heavy-duty", "1.8": "Specialty" };
  var SIZE = { small: "S", medium: "M", large: "L" };
  var size = "small";

  function $(id) { return document.getElementById(id); }

  function update() {
    var qty = Math.max(1, parseInt($("estQty").value, 10) || 1);
    var mult = parseFloat($("estMat").value);
    var total = BASE[size] * mult * qty;
    if ($("estRush").checked) total *= 1.5;
    if (qty >= 5) total *= 0.9;
    $("estTotal").textContent = "$" + Math.round(total);
    $("estNote").textContent = SIZE[size] + " · " + KIND[String(mult)] + " · ×" + qty +
      " — 5+ pieces knock 10% off, confirmed in person.";
  }

  document.querySelectorAll(".chalk").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll(".chalk").forEach(function (x) { x.classList.remove("is-on"); });
      b.classList.add("is-on");
      size = b.getAttribute("data-size");
      update();
    });
  });
  ["estMat", "estQty", "estRush"].forEach(function (id) {
    $(id).addEventListener("input", update);
    $(id).addEventListener("change", update);
  });
  update();

  $("orderForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var form = e.target, msg = $("formMsg"), btn = $("sendBtn");
    if (!form.checkValidity()) {
      msg.textContent = "Almost — just fill in your name, contact, and what you need.";
      msg.className = "form-msg err";
      form.reportValidity();
      return;
    }
    btn.disabled = true;
    btn.textContent = "Passing it over…";
    var d = Object.fromEntries(new FormData(form).entries());
    var subject = encodeURIComponent("Print request — " + d.name);
    var body = encodeURIComponent(
      "Name: " + d.name + "\nContact: " + d.contact +
      "\nBoard estimate: " + $("estTotal").textContent +
      "\n\nWhat they need:\n" + d.what
    );
    setTimeout(function () {
      msg.textContent = "Got it — your email app should open with everything filled in. We reply same day, usually within hours.";
      msg.className = "form-msg ok";
      window.location.href = "mailto:hello@node3prints.com?subject=" + subject + "&body=" + body;
      form.reset();
      update();
      btn.disabled = false;
      btn.textContent = "Hand it over the counter →";
    }, 450);
  });

  var toggle = $("navToggle"), nav = $("shopnav");
  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  nav.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { nav.classList.remove("open"); });
  });
  $("year").textContent = new Date().getFullYear();
})();
