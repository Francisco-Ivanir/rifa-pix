const grid = document.getElementById("grid");
const price = 0.75;
const ownerWhatsApp = "5521982034341";
const MAX_PER_PHONE = 5;

const ADMIN_PASSWORD = "1234";
let adminUnlocked = false;
const PENDING_TIME = 30 * 60 * 1000; // 30 minutos

let selected = [];
let raffleData = [];

const panel = document.getElementById("panel");
const adminBtn = document.getElementById("adminBtn");
const modal = document.getElementById("modal");
const buyerForm = document.getElementById("buyerForm");
const paymentArea = document.getElementById("paymentArea");
const count = document.getElementById("count");
const total = document.getElementById("total");
const modalTotal = document.getElementById("modalTotal");

/* =========================
   SALVAR / CARREGAR
========================= */

function saveData() {
  localStorage.setItem("raffleData", JSON.stringify(raffleData));
}


function loadData() {
  const data = localStorage.getItem("raffleData");

  if (data) {
    raffleData = JSON.parse(data);

    raffleData.forEach(item => {
      const el = document.querySelector(`[data-number="${item.number}"]`);
      if (!el) return;

      el.classList.add(item.status);
      el.onclick = null;
    });
  }

  // 🔒 controle do painel
  adminUnlocked = localStorage.getItem("adminUnlocked") === "true";

  panel.style.display = adminUnlocked ? "block" : "none";
  adminBtn.style.display = adminUnlocked ? "none" : "block";

  renderPanel();
}

/* =========================
   CRIA A GRADE
========================= */

for (let i = 0; i < 100; i++) {
  const n = i.toString().padStart(2, "0");
  const el = document.createElement("div");

  el.className = "number";
  el.innerText = n;
  el.dataset.number = n;
  el.onclick = () => toggle(el, n);

  grid.appendChild(el);
}

/* =========================
   SELEÇÃO
========================= */

function toggle(el, n) {
  if (raffleData.find(item => item.number === n)) return;

  // WhatsApp digitado (se existir)
  const phoneRaw = buyerPhone ? buyerPhone.value.trim() : "";
  const phone = phoneRaw.replace(/\D/g, "");

  // quantidade já usada por esse WhatsApp
  let already = 0;
  if (phone.length >= 10) {
    already = countNumbersByPhone(phone);
  }

  // bloqueio antecipado
  if (!selected.includes(n)) {
    if (already + selected.length >= MAX_PER_PHONE) {
      alert(
        `⚠️ Limite atingido.\n` +
        `Máximo de ${MAX_PER_PHONE} números por WhatsApp.`
      );
      return;
    }
  }

  // seleção normal
  if (selected.includes(n)) {
    selected = selected.filter(x => x !== n);
    el.classList.remove("selected");
  } else {
    selected.push(n);
    el.classList.add("selected");
  }

  updateCart();
}

const phoneInput = document.getElementById("buyerPhone");
if (phoneInput) {
  const phone = phoneInput.value.replace(/\D/g, "");
  if (phone.length >= 10) {
    updateLimitCounter(phone);
  }
}


function updateCart() {
  count.innerText = selected.length;
  total.innerText =
    (selected.length * price).toFixed(2).replace(".", ",");
}

/* =========================
   MODAL
========================= */

function openModal() {
  if (!selected.length) {
    alert("Selecione ao menos um número.");
    return;
  }

  modalTotal.innerText =
    (selected.length * price).toFixed(2).replace(".", ",");
const phoneInput = document.getElementById("buyerPhone");
if (phoneInput) {
  const phone = phoneInput.value.replace(/\D/g, "");
  if (phone.length >= 10) {
    updateLimitCounter(phone);
  }
}

  modal.style.display = "flex";
}

function closeModal() {
  modal.style.display = "none";
const warning = document.getElementById("limitWarning");
if (warning) warning.style.display = "none";
const counter = document.getElementById("limitCounter");
if (counter) counter.style.display = "none";

}

function copyPix() {
  const text = document.getElementById("pix").value;

  navigator.clipboard.writeText(text).then(() => {
    alert("✅ Código Pix copiado!");
  }).catch(() => {
    alert("❌ Não foi possível copiar.");
  });
}

/* =========================
   CONFIRMAÇÃO
========================= */

function maskWhatsApp(input) {
  let value = input.value.replace(/\D/g, "");

  if (value.length > 11) {
    value = value.slice(0, 11);
  }

  if (value.length > 6) {
    input.value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
  } else if (value.length > 2) {
    input.value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
  } else if (value.length > 0) {
    input.value = `(${value}`;
  }
}


function countNumbersByPhone(phone) {
  return raffleData.filter(item =>
    item.phone === phone &&
    (item.status === "pending" || item.status === "paid")
  ).length;
}

function updateLimitWarning(phone) {
  const warning = document.getElementById("limitWarning");
  if (!warning) return;

  const already = countNumbersByPhone(phone);
  const remaining = MAX_PER_PHONE - already;

  if (remaining <= 0) {
    warning.style.display = "none";
    return;
  }

  warning.innerText =
    `⚠️ Você pode escolher mais ${remaining} número(s).`;

  warning.style.display = "block";
}

function updateLimitCounter(phone) {
  const counter = document.getElementById("limitCounter");
  if (!counter) return;

  const already = countNumbersByPhone(phone);
  const totalSelected = selected.length;

  counter.innerText =
    `📊 Você selecionou ${already + totalSelected} de ${MAX_PER_PHONE} números`;

  counter.style.display = "block";
}


function confirmBuyer() {
  const name = buyerName.value.trim();
  const phoneRaw = buyerPhone.value.trim();
  const phone = phoneRaw.replace(/\D/g, "");

  if (phone.length < 10 || phone.length > 11) {
    alert("📱 Informe um WhatsApp válido (DDD + número).");
    buyerPhone.focus();
    return;
  }

  const alreadyTaken = countNumbersByPhone(phone);
  const tryingToTake = selected.length;

  if (alreadyTaken + tryingToTake > MAX_PER_PHONE) {
    alert(
      `❌ Limite excedido.\n\n` +
      `Você já possui ${alreadyTaken} número(s).\n` +
      `Máximo permitido: ${MAX_PER_PHONE}.`
    );
    return;
  }

  const chosenNumbers = [...selected];
  const totalValue = chosenNumbers.length * price;

  markAsPending(name, phone, chosenNumbers);
  sendToWhatsApp(name, phone, chosenNumbers, totalValue);

  buyerForm.style.display = "none";
  paymentArea.style.display = "block";
}


/* =========================
   WHATSAPP
========================= */

function sendToWhatsApp(name, phone, numbersArray, totalValue) {
  const numbers = numbersArray.join(", ");
  const total = totalValue.toFixed(2).replace(".", ",");

  const confirmLink =
    window.location.origin +
    window.location.pathname +
    "?confirm=" +
    numbersArray.join(",");

  const msg =
`🎟️ Rifa Pix de R$ 50

👤 Nome: ${name}
📱 WhatsApp: ${phone}
🔢 Números: ${numbers}

💰 Total: R$ ${total}

Pagamento via Pix em aberto.

(uso interno)
Confirmar pagamento:
${confirmLink}`;

  window.open(
    `https://wa.me/${ownerWhatsApp}?text=${encodeURIComponent(msg)}`,
    "_blank"
  );
}



/* =========================
   PENDENTE / PAGO
========================= */

function markAsPending(name, phone, numbersArray) {
  numbersArray.forEach(n => {
    raffleData.push({
  number: n,
  name,
  phone,
  status: "pending",
  time: Date.now()
});


    const el = document.querySelector(`[data-number="${n}"]`);
    if (el) {
      el.classList.remove("selected");
      el.classList.add("pending");
      el.onclick = null;
    }
  });

  selected = [];
  saveData();
  updateCart();
  renderPanel();
}


function markAsPaid(i) {
  raffleData[i].status = "paid";

  const el = document.querySelector(
    `[data-number="${raffleData[i].number}"]`
  );

  el.classList.remove("pending");
  el.classList.add("paid");

  saveData();
  renderPanel();
}

/* =========================
   PAINEL
========================= */

function renderPanel() {
  panel.innerHTML = "";

  raffleData.forEach((item, i) => {
    let timer = "";

    if (item.status === "pending") {
      const remaining =
        PENDING_TIME - (Date.now() - item.time);
      timer = `<br>⏳ Expira em: ${formatTime(remaining)}`;
    }

    panel.innerHTML += `
      <div class="number ${item.status}">
        Nº ${item.number}<br>
        ${item.name}<br>
        ${item.phone}<br>
        ${item.status.toUpperCase()}
        ${timer}
        ${
          item.status === "pending"
            ? `<br><button onclick="markAsPaid(${i})">Confirmar</button>`
            : ""
        }
      </div>
    `;
  });
}


/* =========================
   INIT
========================= */

loadData();
confirmFromUrl();

checkExpiredPendings();
setInterval(() => {
  checkExpiredPendings();
  renderPanel();
}, 1000);


function openAdmin() {
  const pass = prompt("Digite a senha do administrador:");
  if (pass === ADMIN_PASSWORD) {
    adminUnlocked = true;
    panel.style.display = "block";
    adminBtn.style.display = "none";
  } else {
    alert("Senha incorreta.");
  }
}

function resetRaffle() {
  if (!adminUnlocked) {
    alert("Acesso negado.");
    return;
  }

  const confirm1 = confirm(
    "⚠️ ATENÇÃO!\nIsso apagará TODOS os dados da rifa.\nDeseja continuar?"
  );

  if (!confirm1) return;

  const confirm2 = prompt(
    "Digite RESETAR para confirmar a limpeza total:"
  );

  if (confirm2 !== "RESETAR") {
    alert("Reset cancelado.");
    return;
  }

  // Limpa dados
  raffleData = [];
  selected = [];

  localStorage.removeItem("raffleData");
  localStorage.removeItem("adminUnlocked");

  // Limpa visual
  document.querySelectorAll(".number").forEach(el => {
    el.classList.remove("pending", "paid", "selected");
    el.onclick = () => toggle(el, el.dataset.number);
  });

  panel.innerHTML = "";
  panel.style.display = "none";
  adminBtn.style.display = "block";
  adminUnlocked = false;

  alert("✅ Rifa resetada com sucesso.");
}

function checkExpiredPendings() {
  const now = Date.now();
  let changed = false;

  raffleData.forEach(item => {
    if (item.status !== "pending") return;

    const remaining = PENDING_TIME - (now - item.time);

    // ⛔ Ainda NÃO expirou
    if (remaining > 0) {
      const el = document.querySelector(
        `[data-number="${item.number}"]`
      );

      if (el) {
        el.innerHTML = `
          ${item.number}<br>
          <small>⏳ ${formatTime(remaining)}</small>
        `;
      }

      return;
    }

    // ✅ Expirou agora
    item.status = "expired";
    changed = true;

    const el = document.querySelector(
      `[data-number="${item.number}"]`
    );

    if (el) {
      el.classList.remove("pending");
      el.innerHTML = item.number;
      el.onclick = () => toggle(el, item.number);
    }
  });

  // 🧹 Remove expirados somente depois
  if (changed) {
    raffleData = raffleData.filter(
      item => item.status !== "expired"
    );
    saveData();
    renderPanel();
  }
}


function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function confirmFromUrl() {
  if (!adminUnlocked) return;

  const params = new URLSearchParams(window.location.search);
  const confirm = params.get("confirm");

  if (!confirm) return;

  const numbers = confirm.split(",");

  numbers.forEach(num => {
    const item = raffleData.find(
      x => x.number === num && x.status === "pending"
    );

    if (item) {
      item.status = "paid";

      const el = document.querySelector(
        `[data-number="${num}"]`
      );

      if (el) {
        el.classList.remove("pending");
        el.classList.add("paid");
      }
    }
  });

  saveData();
  renderPanel();

  // limpa URL
  window.history.replaceState({}, document.title, window.location.pathname);
}

