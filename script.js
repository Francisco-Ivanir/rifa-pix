const grid = document.getElementById("grid");
const price = 0.80;
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
const buyerName = document.getElementById("buyerName");
const buyerPhone = document.getElementById("buyerPhone");

/* =========================
   HISTÓRICO POR WHATSAPP
========================= */

function getHistory() {
  return JSON.parse(localStorage.getItem("raffleHistory")) || {};
}

function saveHistory(history) {
  localStorage.setItem("raffleHistory", JSON.stringify(history));
}

function initPhoneHistory(phone) {
  const history = getHistory();

  if (!history[phone]) {
    history[phone] = {
      paidCount: 0,
      expiredCount: 0
    };
    saveHistory(history);
  }
}

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

for (let i = 01; i < 101; i++) {
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

  let phone = "";

  // tenta pegar do input
  const buyerPhone = document.getElementById("buyerPhone");

if (buyerPhone && buyerPhone.value.trim()) {
    phone = buyerPhone.value.replace(/\D/g, "");
  }

  // fallback: localStorage (pós reload)
  if (!phone) {
    phone = localStorage.getItem("currentBuyerPhone") || "";
  }

  // 🔒 BLOQUEIO: pendência ativa
  if (phone.length >= 10) {
    const pending = getPendingByPhone(phone);
    if (pending) {
      alert(
        "⚠️ Você possui uma reserva pendente.\n\n" +
        "Finalize o pagamento ou aguarde expirar."
      );
      return;
    }
  }

  // quantidade já usada
  let already = 0;
  if (phone.length >= 10) {
    already = countNumbersByPhone(phone);
  }

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
  const savedPhone = localStorage.getItem("currentBuyerPhone");
  if (savedPhone && buyerPhone) {
  buyerPhone.value = savedPhone;
  }
  
}

function closeModal() {
  modal.style.display = "none";
const warning = document.getElementById("limitWarning");
if (warning) warning.style.display = "none";
const counter = document.getElementById("limitCounter");
if (counter) counter.style.display = "none";
const timerBox = document.getElementById("paymentTimer");
if (timerBox) timerBox.style.display = "none";

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

function openPixHelp() {
  document.getElementById("pixHelpModal").style.display = "flex";
}

function closePixHelp() {
  document.getElementById("pixHelpModal").style.display = "none";
}

function countNumbersByPhone(phone) {
  return raffleData.filter(item =>
    item.phone === phone &&
    (item.status === "pending" || item.status === "paid")
  ).length;
}

function hasPendingByPhone(phone) {
  return raffleData.some(item =>
    item.phone === phone && item.status === "pending"
  );
}

function getPendingByPhone(phone) {
  return raffleData.find(
    item => item.phone === phone && item.status === "pending"
  );
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

function getRemainingTimeByPhone(phone) {
  const now = Date.now();

  const pendings = raffleData.filter(item =>
    item.phone === phone && item.status === "pending"
  );

  if (!pendings.length) return 0;

  // pega o MAIS ANTIGO
  const first = pendings.reduce((a, b) =>
    a.time < b.time ? a : b
  );

  return PENDING_TIME - (now - first.time);
}

 function confirmBuyer() {
  const buyerName = document.getElementById("buyerName");
  const buyerPhone = document.getElementById("buyerPhone");

  const name = buyerName ? buyerName.value.trim() : "";
  const phoneRaw = buyerPhone ? buyerPhone.value.trim() : "";
  const phone = phoneRaw.replace(/\D/g, "");

  if (!name) {
    alert("👤 Informe seu nome.");
    buyerName.focus();
    return;
  }

  if (phone.length < 10 || phone.length > 11) {
    alert("📱 Informe um WhatsApp válido (DDD + número).");
    buyerPhone.focus();
    return;
  }

  localStorage.setItem("currentBuyerPhone", phone);

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

  localStorage.setItem(
    "pendingTotal",
    totalValue.toFixed(2).replace(".", ",")
  );

  markAsPending(name, phone, chosenNumbers);
  sendToWhatsApp(name, phone, chosenNumbers, totalValue);

  buyerForm.style.display = "none";
  paymentArea.style.display = "block";

  const timerBox = document.getElementById("paymentTimer");
  const timerText = document.getElementById("paymentTime");

  timerBox.style.display = "block";

  const timerInterval = setInterval(() => {
    const remaining = getRemainingTimeByPhone(phone);

    if (remaining <= 0) {
      clearInterval(timerInterval);
      alert("⏰ Sua reserva expirou.");
      closeModal();
      return;
    }

    timerText.innerText = formatTime(remaining);
  }, 1000);
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

ℹ️ Sobre o Pix:
O pagamento é intermediado por uma instituição financeira regulamentada.
Por isso, o recebedor pode aparecer como empresa e com identificador numérico.
Isso é normal e seu pagamento será validado corretamente.

(uso interno)
Confirmar pagamento:
${confirmLink}`;

  window.open(
    `https://wa.me/${ownerWhatsApp}?text=${encodeURIComponent(msg)}`,
    "_blank"
  );

}

function sendReminder(index) {
  const item = raffleData[index];
  if (!item || item.status !== "pending") return;

  if (item.reminderSent) {
    alert("🔔 Lembrete já enviado para este cliente.");
    return;
  }

  const remaining =
    PENDING_TIME - (Date.now() - item.time);

  const time = formatTime(remaining);

  const msg =
`Olá, ${item.name}! 👋

Seus números (${item.number}) ainda estão reservados 🎟️

⏳ Tempo restante: ${time}

Caso ainda queira participar, é só finalizar o pagamento via Pix.

Qualquer dúvida estou à disposição 😉`;

let phone = item.phone;

// garante código do país
if (!phone.startsWith("55")) {
  phone = "55" + phone;
}

window.open(
  `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
  "_blank"
);


  item.reminderSent = true;
  saveData();
  renderPanel();
}


/* =========================
   PENDENTE / PAGO
========================= */
function openPendingPayment() {
  const phone = localStorage.getItem("currentBuyerPhone") || "";
  if (phone.length < 10) return;

  const pending = getPendingByPhone(phone);
  if (!pending) return;

  // abre modal SEM exigir selected[]
  modal.style.display = "flex";

  buyerForm.style.display = "none";
  paymentArea.style.display = "block";

  const timerBox = document.getElementById("paymentTimer");
  const timerText = document.getElementById("paymentTime");

  if (timerBox && timerText) {
    timerBox.style.display = "block";

    timerText.innerText = formatTime(
      PENDING_TIME - (Date.now() - pending.time)
    );
  }
}

function markAsPending(name, phone, numbersArray) {
  numbersArray.forEach(n => {
    raffleData.push({
    number: n,
    name,
    phone,
    status: "pending",
    time: Date.now(),
    reminderSent: false
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
// 📊 histórico de pagamento
initPhoneHistory(raffleData[i].phone);
const history = getHistory();
history[raffleData[i].phone].paidCount += 1;
saveHistory(history);

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
function renderReport() {
  const sold = raffleData.filter(i => i.status === "paid").length;
  const pending = raffleData.filter(i => i.status === "pending").length;

  const totalValue = sold * price;

  return `
    <div style="
      background:#f1f8e9;
      border-radius:10px;
      padding:12px;
      margin-bottom:15px;
      font-size:14px;
    ">
      <strong>📊 Relatório da Rifa</strong><br>
      ✔ Vendidos: <strong>${sold}</strong><br>
      ⏳ Pendentes: <strong>${pending}</strong><br>
      💰 Total vendido: <strong>R$ ${totalValue.toFixed(2).replace(".", ",")}</strong>
    </div>
  `;
}


function renderPanel() {
  panel.innerHTML = renderReport();

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
        ? `
        <br>
        <button onclick="markAsPaid(${i})">Confirmar</button>
        ${
        !item.reminderSent
        ? `<br><button
        style="margin-top:8px;"
        onclick="sendReminder(${i})"
        >
        🔔 Enviar lembrete
        </button>
        `
        : `<br><small>🔔 Lembrete enviado</small>`
        }
        `
        : ""
        }
        ${
        (() => {
        const history = getHistory()[item.phone];
        if (!history) return "";
        
        return `
        <div style="margin-top:6px; font-size:12px; opacity:.85">
        📊 Histórico:
        ✔ Pagou: ${history.paidCount}
        ⏳ Expirou: ${history.expiredCount}
        </div>
        `;
        })()
        }
        
      </div>
    `;
  });
}

function exportPaidReport() {
  if (!adminUnlocked) {
    alert("Acesso negado.");
    return;
  }

  const paid = raffleData.filter(item => item.status === "paid");

  if (!paid.length) {
    alert("Nenhum número pago ainda.");
    return;
  }

  let text = "🎟️ RELATÓRIO DA RIFA\n\n";
  text += "✅ NÚMEROS PAGOS\n\n";

  paid.forEach(item => {
    text += `${item.number} - ${item.name}\n`;
  });

  text += `\nTotal de vendidos: ${paid.length}`;

  const url =
    `https://wa.me/${ownerWhatsApp}?text=` +
    encodeURIComponent(text);

  window.open(url, "_blank");
}

function updatePendingBanner() {
  const alertBox = document.getElementById("pendingAlert");
  if (!alertBox) return;

  // não mostrar se o modal estiver aberto
  if (modal.style.display === "flex") {
    alertBox.style.display = "none";
    return;
  }

  const phone = localStorage.getItem("currentBuyerPhone");
  if (!phone) {
    alertBox.style.display = "none";
    return;
  }

  const pending = getPendingByPhone(phone);
  if (!pending) {
    alertBox.style.display = "none";
    return;
  }

  const remaining =
    PENDING_TIME - (Date.now() - pending.time);

  document.getElementById("pendingTime").innerText =
    `⏳ ${formatTime(remaining)}`;

  alertBox.style.display = "block";

  // clique leva direto ao pagamento
  alertBox.onclick = () => {
  modal.style.display = "flex";
  buyerForm.style.display = "none";
  paymentArea.style.display = "block";

  const savedTotal = localStorage.getItem("pendingTotal");
  if (savedTotal) {
    modalTotal.innerText = savedTotal;
  }
};

}

function generateTextReport() {
  const history = JSON.parse(localStorage.getItem("raffleHistory")) || {};

  let sold = raffleData.filter(i => i.status === "paid").length;
  let pending = raffleData.filter(i => i.status === "pending").length;

  let text = `📊 RELATÓRIO DA RIFA\n\n`;
  text += `✔ Vendidos: ${sold}\n`;
  text += `⏳ Pendentes: ${pending}\n\n`;
  text += `📱 Histórico por WhatsApp:\n`;

  if (Object.keys(history).length === 0) {
    text += "- Nenhum histórico ainda.";
  } else {
    Object.entries(history).forEach(([phone, data]) => {
      text += `- ${phone} → ✔ Pagou: ${data.paidCount} | ⏳ Expirou: ${data.expiredCount}\n`;
    });
  }

  return text;
}

function exportReport() {
  const report = generateTextReport();

  navigator.clipboard.writeText(report).then(() => {
    alert("📋 Relatório copiado!\n\nCole no WhatsApp ou onde quiser.");
  }).catch(() => {
    alert("❌ Não foi possível copiar o relatório.");
  });
}

/* =========================
   INIT
========================= */
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

function updatePendingAlerts() {
  const phoneInput = document.getElementById("buyerPhone");
  if (!phoneInput) return;

  const phone = phoneInput.value.replace(/\D/g, "");
  if (phone.length < 10) return;

  const pending = getPendingByPhone(phone);

  const alertBox = document.getElementById("pendingAlert");
  const modalAlert = document.getElementById("pendingModalAlert");

  if (!pending) {
    alertBox.style.display = "none";
    modalAlert.style.display = "none";
    return;
  }

  const remaining =
    PENDING_TIME - (Date.now() - pending.time);

  const time = formatTime(remaining);

  const msg = `
    ⚠️ Você possui uma reserva pendente
    <span>⏳ ${time}</span>
    Finalize o pagamento para liberar novos números.
  `;

  alertBox.innerHTML = msg;
  // modalAlert.innerHTML = msg;

  alertBox.style.display = "block";
  // modalAlert.style.display = "block";
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
        <strong>${item.number}</strong>
        <div style="font-size:11px; margin-top:2px">
        ⏳ ${formatTime(remaining)}
        </div>
        `;
        
      }

      return;
    }

    // ✅ Expirou agora
    item.status = "expired";
    changed = true;
    
    // 📊 histórico de expiração
    initPhoneHistory(item.phone);
    const history = getHistory();
    history[item.phone].expiredCount += 1;
    saveHistory(history);
    

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

function sanitizeRaffleData() {
  const now = Date.now();

  raffleData = raffleData.filter(item => {
    if (item.status !== "pending") return true;

    // sem tempo → inválido
    if (!item.time) return false;

    // expirado → remove
    if (now - item.time > PENDING_TIME) return false;

    return true;
  });

  saveData();
}

function recoverPendingForCurrentBuyer() {
  const phone = localStorage.getItem("currentBuyerPhone");
  if (!phone) return;

  const pending = raffleData.find(
    item => item.status === "pending" && item.phone === phone
  );

  if (pending) {
    openPendingPayment(); // ✅ função correta já existe no seu código
  }
        }
     

// ===============================
// 🚀 INICIALIZAÇÃO FINAL DO SISTEMA
// ===============================

window.addEventListener("load", () => {
  try {
    // 1) Corrige qualquer lixo/sujeira no raffleData
    if (typeof sanitizeRaffleData === "function") {
      sanitizeRaffleData();
    }

    // 2) Carrega dados salvos
    if (typeof loadData === "function") {
      loadData();
    }

    // 3) Atualiza painel admin
    if (typeof renderPanel === "function") {
      renderPanel();
    }

    // 4) Atualiza aviso de pendência na grade (se existir)
    if (typeof updatePendingBanner === "function") {
      updatePendingBanner();
    }

    // 5) Se tiver pendência ativa salva, tenta recuperar
    if (typeof recoverPendingForCurrentBuyer === "function") {
      recoverPendingForCurrentBuyer();
    }

    // 6) Inicia verificação de expiração (cronômetros)
    if (typeof checkExpiredPendings === "function") {
      checkExpiredPendings();
      setInterval(checkExpiredPendings, 1000);
    }

  } catch (err) {
    console.error("❌ Erro ao iniciar sistema:", err);
  }
});
     
