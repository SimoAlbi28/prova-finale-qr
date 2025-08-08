const listContainer = document.getElementById("macchinari-list");
const reader = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");
const stopBtn = document.getElementById("stop-scan");
const searchInput = document.getElementById("search-input");
const showAllBtn = document.getElementById("show-all-btn");
const folderSelect = document.getElementById("folder-select"); // selezione cartella, devi aggiungerlo in HTML
const createFolderBtn = document.getElementById("create-folder"); // bottone crea cartella, devi aggiungerlo in HTML

let searchFilter = "";
let currentFolder = "Tutte"; // cartella selezionata, "Tutte" = nessun filtro

// Carica macchinari e cartelle da localStorage
let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");
let savedCartelle = JSON.parse(localStorage.getItem("cartelle") || "[]");

// Inizializza html5QrCode (per scansione)
let html5QrCode;
let copiaNoteActive = false;
let notaInModifica = null;

// --------- GESTIONE CARTELLE ---------

function salvaCartelle() {
  localStorage.setItem("cartelle", JSON.stringify(savedCartelle));
}

function aggiungiCartella(nome) {
  nome = nome.trim();
  if (!nome) return false;
  if (savedCartelle.includes(nome)) return false;
  savedCartelle.push(nome);
  salvaCartelle();
  aggiornaSelectCartelle();
  return true;
}

function eliminaCartella(nome) {
  // Rimuovi cartella e sposta macchinari in "Senza Cartella"
  savedCartelle = savedCartelle.filter(c => c !== nome);

  for (const id in savedMacchinari) {
    if (savedMacchinari[id].cartella === nome) {
      savedMacchinari[id].cartella = "Senza Cartella";
    }
  }

  salvaCartelle();
  salvaMacchinari();
  aggiornaSelectCartelle();
  renderMacchinari();
}

function aggiornaSelectCartelle() {
  if (!folderSelect) return;

  // Prima salva la cartella corrente (se esiste)
  let oldFolder = currentFolder;

  folderSelect.innerHTML = "";
  // Aggiungo "Tutte" e "Senza Cartella" come opzioni fisse
  const tutteOpt = document.createElement("option");
  tutteOpt.value = "Tutte";
  tutteOpt.textContent = "🗂️ Tutte";
  folderSelect.appendChild(tutteOpt);

  const senzaOpt = document.createElement("option");
  senzaOpt.value = "Senza Cartella";
  senzaOpt.textContent = "📂 Senza Cartella";
  folderSelect.appendChild(senzaOpt);

  savedCartelle.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    folderSelect.appendChild(opt);
  });

  // Ripristina selezione precedente se possibile
  if (savedCartelle.includes(oldFolder) || oldFolder === "Tutte" || oldFolder === "Senza Cartella") {
    folderSelect.value = oldFolder;
    currentFolder = oldFolder;
  } else {
    folderSelect.value = "Tutte";
    currentFolder = "Tutte";
  }
}

// --------- FUNZIONI MACCHINARI ---------

function salvaMacchinari() {
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
}

function salvaMacchinario(id, nome, cartella = "Senza Cartella") {
  if (!savedMacchinari[id]) {
    savedMacchinari[id] = { nome, note: [], expanded: true, cartella };
  } else {
    savedMacchinari[id].nome = nome;
    savedMacchinari[id].cartella = cartella;
  }
  salvaMacchinari();
}

function renderMacchinari(highlightId = null) {
  listContainer.innerHTML = "";

  // Filtro per ricerca
  const filtered = Object.entries(savedMacchinari).filter(([_, data]) => {
    // filtro nome
    if (!data.nome.toLowerCase().startsWith(searchFilter.toLowerCase())) return false;
    // filtro cartella
    if (currentFolder === "Tutte") return true;
    if (currentFolder === "Senza Cartella") return !data.cartella || data.cartella === "Senza Cartella";
    return data.cartella === currentFolder;
  });

  const sorted = filtered.sort((a, b) => a[1].nome.localeCompare(b[1].nome));

  sorted.forEach(([id, data]) => {
    const expanded = data.expanded;

    const box = document.createElement("div");
    box.className = "macchinario";
    box.setAttribute("data-id", id);
    box.innerHTML = `
      <h3>${data.nome} <small style="font-weight:normal; font-size:0.7em; color:#666;">[${data.cartella || "Senza Cartella"}]</small></h3>
      <div class="nome-e-btn">
        <button class="toggle-btn" onclick="toggleDettagli('${id}')">
          ${expanded ? "🔽" : "🔼"}
        </button>
      </div>
    `;

    if (expanded) {
      box.appendChild(createLineSeparator());

      // Inserimento note
      const insertNoteTitle = document.createElement("h4");
      insertNoteTitle.textContent = "Inserimento Note";
      insertNoteTitle.className = "titolo-note";
      box.appendChild(insertNoteTitle);

      const noteForm = document.createElement("div");
      noteForm.className = "note-form";
      noteForm.innerHTML = `
        <label>Data:</label>
        <input type="date" id="data-${id}">
        <label>Descrizione (max 300):</label>
        <input type="text" id="desc-${id}" maxlength="300">
        <label>Cartella:</label>
        <select id="cartella-${id}">
          ${generaOpzioniCartelle(data.cartella)}
        </select>
        <div style="text-align:center; margin-top:10px;">
          <button class="btn-green" onclick="aggiungiNota('${id}')">Conferma</button>
        </div>
      `;

      box.appendChild(noteForm);
      box.appendChild(createLineSeparator());

      if (data.note && data.note.length > 0) {
        const noteTitle = document.createElement("h4");
        noteTitle.textContent = "Note";
        noteTitle.className = "titolo-note";
        box.appendChild(noteTitle);

        const noteList = document.createElement("ul");
        noteList.className = "note-list";

        const notesSorted = (data.note || []).sort((a, b) => b.data.localeCompare(a.data));

        notesSorted.forEach((nota, index) => {
          const li = document.createElement("li");
          li.style.display = "flex";
          li.style.alignItems = "center";
          li.style.justifyContent = "space-between";
          li.style.gap = "10px";

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.className = "checkbox-copia-note";
          checkbox.value = index;
          checkbox.style.display = copiaNoteActive ? "inline-block" : "none";

          const testoNota = document.createElement("div");
          testoNota.style.flex = "1";
          testoNota.innerHTML = `<span class="nota-data">${formatData(nota.data)}</span><br><span class="nota-desc">${nota.desc}</span>`;

          const btns = document.createElement("div");
          btns.className = "btns-note";
          btns.innerHTML = `
            <button class="btn-blue" onclick="modificaNota('${id}', ${index})">✏️</button>
            <button class="btn-red" onclick="eliminaNota('${id}', ${index})">🗑️</button>
          `;
          btns.style.display = copiaNoteActive ? "none" : "flex";

          li.appendChild(checkbox);
          li.appendChild(testoNota);
          li.appendChild(btns);

          noteList.appendChild(li);
        });

        box.appendChild(noteList);

        creaAreaCopiaNote(box, id, notesSorted);

        box.appendChild(createLineSeparator());
      }

      const btnsContainer = document.createElement("div");
      btnsContainer.className = "btns-macchinario";
      btnsContainer.innerHTML = `
        <button id="btn-rin" class="btn-blue" onclick="rinominaMacchinario('${id}')">✏️ Rinomina</button>
        <button id="btn-chiudi" class="btn-orange" onclick="toggleDettagli('${id}')">❌ Chiudi</button>
        <button class="btn-red" onclick="eliminaMacchinario('${id}')">🗑️ Elimina</button>
      `;

      box.appendChild(btnsContainer);
    }

    listContainer.appendChild(box);
  });

  if (highlightId) {
    const highlightBox = document.querySelector(`.macchinario[data-id="${highlightId}"]`);
    if (highlightBox) {
      highlightBox.classList.add("highlight");
      setTimeout(() => {
        highlightBox.classList.remove("highlight");
      }, 2500);
      highlightBox.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
}

function generaOpzioniCartelle(selezionata) {
  let options = `<option value="Senza Cartella"${selezionata === "Senza Cartella" ? " selected" : ""}>📂 Senza Cartella</option>`;
  savedCartelle.forEach(c => {
    options += `<option value="${c}"${selezionata === c ? " selected" : ""}>${c}</option>`;
  });
  return options;
}

// Tutte le tue funzioni macchinari (rinomina, elimina, toggleDettagli, ecc) restano uguali tranne salvaMacchinario che ora supporta cartella

function toggleDettagli(id) {
  savedMacchinari[id].expanded = !savedMacchinari[id].expanded;
  salvaMacchinari();
  renderMacchinari();
}

function rinominaMacchinario(id) {
  const nuovoNome = prompt("Nuovo nome:", savedMacchinari[id].nome)?.trim().toUpperCase();
  if (!nuovoNome) return;

  const esisteGia = Object.values(savedMacchinari).some(
    m => m.nome.toUpperCase() === nuovoNome && m !== savedMacchinari[id]
  );

  if (esisteGia) {
    alert("⚠️ Nome già esistente.");
    return;
  }

  savedMacchinari[id].nome = nuovoNome;
  salvaMacchinari();
  renderMacchinari();
}

function eliminaMacchinario(id) {
  const nome = savedMacchinari[id].nome;
  mostraModalConferma(
    `Sei sicuro di voler eliminare "${nome}"?`,
    () => {
      delete savedMacchinari[id];
      salvaMacchinari();
      renderMacchinari();
    },
    () => { }
  );
}

function aggiungiNota(id) {
  const data = document.getElementById(`data-${id}`).value;
  const desc = document.getElementById(`desc-${id}`).value.trim();
  const cartella = document.getElementById(`cartella-${id}`).value || "Senza Cartella";
  if (!data || !desc) return;

  if (notaInModifica && notaInModifica.id === id) {
    savedMacchinari[id].note[notaInModifica.index] = { data, desc };
    notaInModifica = null;
  } else {
    savedMacchinari[id].note = savedMacchinari[id].note || [];
    savedMacchinari[id].note.push({ data, desc });
  }

  // Aggiorna anche la cartella del macchinario se cambiata qui
  if (savedMacchinari[id].cartella !== cartella) {
    savedMacchinari[id].cartella = cartella;
  }

  document.getElementById(`data-${id}`).value = "";
  document.getElementById(`desc-${id}`).value = "";
  salvaMacchinari();
  renderMacchinari();
}

function modificaNota(id, index) {
  const dataInput = document.getElementById(`data-${id}`);
  const descInput = document.getElementById(`desc-${id}`);
  const nota = savedMacchinari[id].note[index];

  if (notaInModifica && notaInModifica.id === id && notaInModifica.index === index) {
    dataInput.value = "";
    descInput.value = "";
    notaInModifica = null;
  } else {
    dataInput.value = nota.data;
    descInput.value = nota.desc;
    notaInModifica = { id, index };
  }
}

function eliminaNota(id, index) {
  const nota = savedMacchinari[id].note[index];
  const parole = nota.desc.trim().split(/\s+/);
  const descBreve = parole.length > 10 ? parole.slice(0, 10).join(" ") + "..." : nota.desc;

  mostraModalConferma(
    `Vuoi davvero eliminare la nota del ${formatData(nota.data)}?\n\n"${descBreve}"`,
    () => {
      savedMacchinari[id].note.splice(index, 1);
      salvaMacchinari();
      renderMacchinari();
    },
    () => { }
  );
}

// Scansione QR e gestione macchinari rimane invariata
function startScan() {
  reader.classList.remove("hidden");
  startBtn.disabled = true;
  stopBtn.disabled = false;

  html5QrCode = new Html5Qrcode("reader");

  html5QrCode.start(
    { facingMode: { exact: "environment" } },
    { fps: 10, qrbox: 250 },
    (qrCodeMessage) => {
      html5QrCode.stop().then(() => {
        reader.classList.add("hidden");
        startBtn.disabled = false;
        stopBtn.disabled = true;
      });

      if (!savedMacchinari[qrCodeMessage]) {
        function chiediNome() {
          const nome = prompt("Nome:")?.trim().toUpperCase();
          if (!nome) return;

          const esisteGia = Object.values(savedMacchinari).some(
            m => m.nome.toUpperCase() === nome
          );

          if (esisteGia) {
            alert("⚠️ Nome già esistente. Inserisci un nome diverso.");
            chiediNome();
          } else {
            // Default cartella "Senza Cartella"
            salvaMacchinario(qrCodeMessage, nome, "Senza Cartella");
            renderMacchinari(qrCodeMessage);
          }
        }
        chiediNome();
      } else {
        savedMacchinari[qrCodeMessage].expanded = true;
        renderMacchinari(qrCodeMessage);
      }
    }
  ).catch((err) => {
    alert("Errore nell'avvio della fotocamera: " + err);
    startBtn.disabled = false;
    stopBtn.disabled = true;
  });
}

function stopScan() {
  if (html5QrCode) {
    html5QrCode.stop().then(() => {
      reader.classList.add("hidden");
      startBtn.disabled = false;
      stopBtn.disabled = true;
    });
  }
}

startBtn.addEventListener("click", startScan);
stopBtn.addEventListener("click", stopScan);

searchInput.addEventListener("input", () => {
  searchFilter = searchInput.value.trim();
  renderMacchinari();
});

showAllBtn.addEventListener("click", () => {
  searchFilter = "";
  searchInput.value = "";
  renderMacchinari();
});

if (folderSelect) {
  folderSelect.addEventListener("change", () => {
    currentFolder = folderSelect.value;
    renderMacchinari();
  });
}

if (createFolderBtn) {
  createFolderBtn.addEventListener("click", () => {
    const nomeCartella = prompt("Nome nuova cartella:")?.trim();
    if (!nomeCartella) return alert("Nome non valido");
    if (!aggiungiCartella(nomeCartella)) {
      alert("Cartella già esistente o nome non valido.");
    } else {
      alert(`Cartella "${nomeCartella}" aggiunta.`);
      renderMacchinari();
    }
  });
}

function creaMacchinarioManuale() {
  const nome = prompt("Inserire nome:")?.trim().toUpperCase();
  if (!nome) return;

  const esisteGia = Object.values(savedMacchinari).some(
    m => m.nome.toUpperCase() === nome
  );

  if (esisteGia) {
    alert("⚠️ Nome già esistente. Inserisci un nome diverso.");
    return;
  }

  const id = "custom-" + Math.random().toString(36).substr(2, 9);
  // Salva in cartella "Senza Cartella"
  salvaMacchinario(id, nome, "Senza Cartella");
  renderMacchinari(id);
}

document.getElementById("create-macchinario").addEventListener("click", creaMacchinarioManuale);

// Inizializza cartelle se non esistono
if (!savedCartelle.includes("Senza Cartella")) {
  savedCartelle.push("Senza Cartella");
  salvaCartelle();
}

Object.values(savedMacchinari).forEach(macch => macch.expanded = false);
salvaMacchinari();

aggiornaSelectCartelle();
renderMacchinari();
