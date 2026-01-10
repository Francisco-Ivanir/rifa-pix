const grid = document.getElementById("grid");
const price = 0.75;
const ownerWhatsApp = "5521982034341";
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

  if (selected.includes(n)) {
    selected = selected.filter(x => x !== n);
    el.classList.remove("selected");
  } else {
    selected.push(n);
    el.classList.add("selected");
  }

  updateCart();
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

  modal.style.display = "flex";
}

function closeModal() {
  modal.style.display = "none";
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

function confirmBuyer() {
  const name = buyerName.value.trim();
  const phone = buyerPhone.value.trim();

  if (!phone) {
    document.getElementById("formError").style.display = "block";
    return;
  }

  // 🔒 cria cópia segura dos dados
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

  raffleData = raffleData.filter(item => {
    if (item.status !== "pending") return true;

    if (now - item.time > PENDING_TIME) {
      // libera número
      const el = document.querySelector(
        `[data-number="${item.number}"]`
      );

      if (el) {
  el.classList.remove("pending");
  el.innerHTML = item.number;
  el.onclick = () => toggle(el, item.number);
}

      changed = true;
      return false; // remove do array
    }
if (item.status === "pending") {
  const el = document.querySelector(
    `[data-number="${item.number}"]`
  );

  if (el) {
    const remaining =
      PENDING_TIME - (now - item.time);

    el.innerHTML = `
      ${item.number}<br>
      <small>⏳ ${formatTime(remaining)}</small>
    `;
  }
}

    return true;
  });

  if (changed) {
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


