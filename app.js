// NODE 3 — price board estimator, counter form + custom file upload
(function () {
  "use strict";

  /* >>> CHANGE THIS to the inbox that should receive custom print files <<< */
  var SHOP_EMAIL = "hello@node3prints.com";

  var BASE = { small: 10, medium: 25, large: 60 };
  var KIND = { "1": "Everyday", "1.4": "Heavy-duty", "1.8": "Specialty" };
  var SIZE = { small: "S", medium: "M", large: "L" };
  var size = "small";

  function $(id) { return document.getElementById(id); }

  /* ---------- price board estimator ---------- */
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

  /* ---------- simple quote request (no files) ---------- */
  $("orderForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var form = e.target, msg = $("formMsg"), btn = $("sendBtn");
    if (!form.checkValidity()) {
      msg.textContent = "Almost — just fill in your name, email, and what you need.";
      msg.className = "form-msg err";
      form.reportValidity();
      return;
    }
    btn.disabled = true;
    btn.textContent = "Passing it over…";
    var d = Object.fromEntries(new FormData(form).entries());
    var subject = encodeURIComponent("Print request — " + d.name);
    var body = encodeURIComponent(
      "Name: " + d.name + "\nEmail: " + d.contact +
      "\nBoard estimate: " + $("estTotal").textContent +
      "\n\nWhat they need:\n" + d.what
    );
    setTimeout(function () {
      msg.textContent = "Got it — your email app should open with everything filled in. We reply within 1 business day.";
      msg.className = "form-msg ok";
      window.location.href = "mailto:" + SHOP_EMAIL + "?subject=" + subject + "&body=" + body;
      form.reset();
      update();
      btn.disabled = false;
      btn.textContent = "Request this print →";
    }, 450);
  });

  /* ---------- custom file upload → lands in the shop inbox ---------- */
  var MAX_FILES = 5, MAX_MB = 20;
  var OK_EXT = [".stl", ".obj", ".3mf", ".step", ".stp", ".jpg", ".jpeg", ".png"];
  var picked = [];
  var dz = $("dropzone"), fi = $("fileInput"), fl = $("fileList");

  dz.addEventListener("click", function (e) {
    if (!e.target.closest("button")) fi.click();
  });
  ["dragover", "dragenter"].forEach(function (ev) {
    dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add("over"); });
  });
  ["dragleave", "drop"].forEach(function (ev) {
    dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove("over"); });
  });
  dz.addEventListener("drop", function (e) { addFiles(e.dataTransfer.files); });
  fi.addEventListener("change", function () { addFiles(fi.files); fi.value = ""; });

  function extOf(name) {
    var i = name.lastIndexOf(".");
    return i < 0 ? "" : name.slice(i).toLowerCase();
  }
  function addFiles(files) {
    var msg = $("customMsg");
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      if (OK_EXT.indexOf(extOf(f.name)) < 0) {
        fail("“" + f.name + "” isn't a file type we take — STL, OBJ, 3MF, STEP, JPG or PNG please.");
        return;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        fail("“" + f.name + "” is over " + MAX_MB + " MB — email it to us instead and mention this form.");
        return;
      }
      if (picked.length >= MAX_FILES) { fail("Five files max — bundle the rest in a note below."); return; }
      picked.push(f);
    }
    msg.textContent = "";
    msg.className = "form-msg";
    paint();
  }
  function paint() {
    fl.innerHTML = "";
    picked.forEach(function (f, i) {
      var li = document.createElement("li");
      var mb = (f.size / 1024 / 1024).toFixed(1);
      li.innerHTML = "<span></span><small>" + mb + " MB</small>";
      li.firstChild.textContent = f.name;
      var rm = document.createElement("button");
      rm.type = "button";
      rm.textContent = "Remove";
      rm.addEventListener("click", function (e) { e.stopPropagation(); picked.splice(i, 1); paint(); });
      li.appendChild(rm);
      fl.appendChild(li);
    });
  }
  function fail(t) {
    var msg = $("customMsg");
    msg.textContent = t;
    msg.className = "form-msg err";
  }

  $("customForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var form = e.target, msg = $("customMsg"), btn = $("customBtn");
    if (!form.checkValidity()) {
      fail("Almost — your name, email, and a short description, plus at least one file.");
      form.reportValidity();
      return;
    }
    if (!picked.length) { fail("Attach at least one file — that's the whole point of this form."); return; }
    btn.disabled = true;
    btn.textContent = "Sending your files…";

    var fd = new FormData();
    fd.append("_subject", "New custom print — " + form.elements["name"].value);
    fd.append("_template", "table");
    fd.append("_captcha", "false");
    fd.append("name", form.elements["name"].value);
    fd.append("email", form.elements["email"].value);
    fd.append("details", form.elements["details"].value);
    fd.append("material", form.elements["material"].value);
    fd.append("quantity", form.elements["quantity"].value);
    picked.forEach(function (f) { fd.append("attachment", f, f.name); });

    fetch("https://formsubmit.co/ajax/" + encodeURIComponent(SHOP_EMAIL), {
      method: "POST",
      body: fd,
      headers: { "Accept": "application/json" }
    }).then(function (r) {
      if (!r.ok) throw new Error("send failed");
      return r.json();
    }).then(function () {
      msg.textContent = "Files received — thank you! We reply within 1 business day with a price and a printability check. (First-time senders: watch your inbox for a one-click activation note.)";
      msg.className = "form-msg ok";
      form.reset();
      picked = [];
      paint();
      btn.disabled = false;
      btn.textContent = "Send files for review →";
      document.getElementById("custom").scrollIntoView({ behavior: "smooth" });
    }).catch(function () {
      // Fallback: open email with everything prefilled, customer attaches files by hand
      var d = Object.fromEntries(new FormData(form).entries());
      var subject = encodeURIComponent("Custom print — " + d.name + " (" + picked.length + " files to attach)");
      var body = encodeURIComponent(
        "Name: " + d.name + "\nEmail: " + d.email +
        "\nMaterial: " + d.material + "\nQuantity: " + d.quantity +
        "\n\nDetails:\n" + d.details +
        "\n\n(Files: " + picked.map(function (f) { return f.name; }).join(", ") + " — please attach them to this email before sending.)"
      );
      msg.innerHTML = "";
      msg.appendChild(document.createTextNode("Direct send hiccuped — your email app will open instead. "));
      var a = document.createElement("a");
      a.href = "mailto:" + SHOP_EMAIL + "?subject=" + subject + "&body=" + body;
      a.textContent = "Click here if it doesn't open, then attach your files.";
      msg.appendChild(a);
      msg.className = "form-msg err";
      window.location.href = a.href;
      btn.disabled = false;
      btn.textContent = "Send files for review →";
    });
  });

  /* ---------- nav + year ---------- */
  /* ---------- nav shadow + scroll reveals + live machine ticker ---------- */
  var head = document.querySelector(".shophead");
  addEventListener("scroll", function () {
    head.classList.toggle("scrolled", scrollY > 12);
  }, { passive: true });

  var reveal = document.querySelectorAll(".workcard,.pin,.machine,.note,.chalkboard,.orderform,.dropzone,.custom-fields,.hours");
  reveal.forEach(function (el) { el.classList.add("rv"); });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    reveal.forEach(function (el) { io.observe(el); });
  } else {
    reveal.forEach(function (el) { el.classList.add("in"); });
  }

  // machine progress inches forward while you watch
  (function () {
    var pct = 64, bar = $("mBar"), label = $("mPct");
    if (!bar || !label) return;
    setInterval(function () {
      pct = pct >= 97 ? 64 : pct + 1;
      bar.style.width = pct + "%";
      var mins = Math.max(5, Math.round((100 - pct) * 2.2));
      var h = Math.floor(mins / 60), m = mins % 60;
      label.textContent = pct + "% · about " + (h ? h + "h " + m + "m" : m + "m") + " left";
    }, 4000);
  })();

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
