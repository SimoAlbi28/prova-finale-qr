const listContainer = document.getElementById("macchinari-list");
const reader = document.getElementById("reader");
const startBtn = document.getElementById("start-scan");
const stopBtn = document.getElementById("stop-scan");
const searchInput = document.getElementById("search-input");
const showAllBtn = document.getElementById("show-all-btn");

let searchFilter = "";
let savedMacchinari = JSON.parse(localStorage.getItem("macchinari") || "{}");
let html5QrCode;
let copiaNoteActive = false;
let notaInModifica = null;

// --- MODAL PERSONALIZZATO PER CONFERME ---
function mostraModalConferma(messaggio, onConferma, onAnnulla) {
  let oldModal = document.getElementById("custom-confirm-modal");
  if (oldModal) oldModal.remove();

  const overlay = document.createElement("div");
  overlay.id = "custom-confirm-modal";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "10000";

  const box = document.createElement("div");
  box.style.backgroundColor = "#fff";
  box.style.padding = "20px";
  box.style.borderRadius = "8px";
  box.style.width = "320px";
  box.style.maxWidth = "90%";
  box.style.textAlign = "center";
  box.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
  box.style.fontFamily = "Segoe UI, Tahoma, Geneva, Verdana, sans-serif";

  const msg = document.createElement("p");
  msg.style.marginBottom = "20px";
  msg.style.whiteSpace = "pre-wrap";
  msg.textContent = messaggio;
  box.appendChild(msg);

  const btnContainer = document.createElement("div");
  btnContainer.style.display = "flex";
  btnContainer.style.justifyContent = "center";
  btnContainer.style.gap = "15px";

  const btnAnnulla = document.createElement("button");
  btnAnnulla.textContent = "Annulla";
  btnAnnulla.style.padding = "8px 16px";
  btnAnnulla.style.border = "none";
  btnAnnulla.style.backgroundColor = "#f44336";
  btnAnnulla.style.color = "white";
  btnAnnulla.style.borderRadius = "4px";
  btnAnnulla.style.cursor = "pointer";
  btnAnnulla.onclick = () => {
    document.body.removeChild(overlay);
    if (onAnnulla) onAnnulla();
  };

  const btnConferma = document.createElement("button");
  btnConferma.textContent = "Conferma";
  btnConferma.style.padding = "8px 16px";
  btnConferma.style.border = "none";
  btnConferma.style.backgroundColor = "#4CAF50";
  btnConferma.style.color = "white";
  btnConferma.style.borderRadius = "4px";
  btnConferma.style.cursor = "pointer";
  btnConferma.onclick = () => {
    document.body.removeChild(overlay);
    if (onConferma) onConferma();
  };

  btnContainer.appendChild(btnAnnulla);
  btnContainer.appendChild(btnConferma);
  box.appendChild(btnContainer);
  overlay.appendChild(box);

  document.body.appendChild(overlay);
}
// --- FINE MODAL ---

function createLineSeparator() {
  const line = document.createElement("div");
  line.className = "line-separator";
  return line;
}

function formatData(d) {
  const [yyyy, mm, dd] = d.split("-");
  return `${dd}/${mm}/${yyyy.slice(2)}`;
}

function creaAreaCopiaNote(macchinarioBox, id, note) {
  const oldArea = macchinarioBox.querySelector(".copia-note-area");
  if (oldArea) oldArea.remove();

  const area = document.createElement("div");
  area.className = "copia-note-area";
  area.style.marginTop = "10px";
  area.style.textAlign = "center";

  const btnCopiaNote = document.createElement("button");
  btnCopiaNote.textContent = "📋 Copia";
  btnCopiaNote.className = "btn-copia-note";

  const selezioneDiv = document.createElement("div");
  selezioneDiv.style.display = "none";
  selezioneDiv.style.marginTop = "10px";

  const btnSelezionaTutte = document.createElement("button");
  btnSelezionaTutte.textContent = "✔️ Tutte";
  btnSelezionaTutte.className = "btn-seleziona-tutte";

  const btnDeselezionaTutte = document.createElement("button");
  btnDeselezionaTutte.textContent = "❌ Tutte";
  btnDeselezionaTutte.className = "btn-deseleziona-tutte";

  const btnIndietro = document.createElement("button");
  btnIndietro.textContent = "🔙 Indietro";
  btnIndietro.className = "btn-indietro";

  const btnCopiaSelezionate = document.createElement("button");
  btnCopiaSelezionate.textContent = "📋 Copia";
  btnCopiaSelezionate.className = "btn-copia-selezionate";

  const btnContainer = document.createElement("div");
  btnContainer.style.marginTop = "8px";
  btnContainer.style.display = "flex";
  btnContainer.style.justifyContent = "center";
  btnContainer.style.flexWrap = "wrap";
  btnContainer.style.gap = "6px";

  btnContainer.appendChild(btnSelezionaTutte);
  btnContainer.appendChild(btnDeselezionaTutte);
  btnContainer.appendChild(btnIndietro);
  btnContainer.appendChild(btnCopiaSelezionate);

  selezioneDiv.appendChild(btnContainer);
  area.appendChild(btnCopiaNote);
  area.appendChild(selezioneDiv);
  macchinarioBox.appendChild(area);

  function updateNoteButtonsAndCheckboxes(showCheckboxes) {
    const liNotes = macchinarioBox.querySelectorAll(".note-list li");
    liNotes.forEach((li, i) => {
      const checkbox = li.querySelector("input[type=checkbox]");
      const btns = li.querySelector(".btns-note");
      if (checkbox) checkbox.style.display = showCheckboxes ? "inline-block" : "none";
      if (btns) btns.style.display = showCheckboxes ? "none" : "flex";
    });
  }

  btnCopiaNote.addEventListener("click", () => {
    btnCopiaNote.style.display = "none";
    selezioneDiv.style.display = "block";
    updateNoteButtonsAndCheckboxes(true);
  });

  btnIndietro.addEventListener("click", () => {
    selezioneDiv.style.display = "none";
    btnCopiaNote.style.display = "inline-block";
    updateNoteButtonsAndCheckboxes(false);
  });

  btnSelezionaTutte.addEventListener("click", () => {
    macchinarioBox.querySelectorAll(".note-list input[type=checkbox]").forEach(cb => cb.checked = true);
  });

  btnDeselezionaTutte.addEventListener("click", () => {
    macchinarioBox.querySelectorAll(".note-list input[type=checkbox]").forEach(cb => cb.checked = false);
  });

  btnCopiaSelezionate.addEventListener("click", () => {
    const checkboxes = macchinarioBox.querySelectorAll(".note-list input[type=checkbox]:checked");
    const checkedIndexes = Array.from(checkboxes).map(cb => parseInt(cb.value));

    if (checkedIndexes.length === 0) {
      alert("Seleziona almeno una nota da copiare.");
      return;
    }

    const nomeMacchinario = savedMacchinari[id].nome;

    const testoDaCopiare = `${nomeMacchinario.toUpperCase()}\n\n` + 
      checkedIndexes.map(i => {
        const n = note[i];
        return `- [${formatData(n.data)}]: ${n.desc};`;
      }).join("\n");


    navigator.clipboard.writeText(testoDaCopiare).then(() => {
      alert("✅ Note copiate!");
      selezioneDiv.style.display = "none";
      btnCopiaNote.style.display = "inline-block";
      updateNoteButtonsAndCheckboxes(false);
    }).catch(() => {
      alert("Errore nella copia degli appunti.");
    });
  });
}

function renderMacchinari(highlightId = null) {
  listContainer.innerHTML = "";

  const filtered = Object.entries(savedMacchinari).filter(([_, data]) =>
    data.nome.toLowerCase().startsWith(searchFilter.toLowerCase())
  );

  const sorted = filtered.sort((a, b) =>
    a[1].nome.localeCompare(b[1].nome)
  );

  sorted.forEach(([id, data]) => {
    const expanded = data.expanded;

    const box = document.createElement("div");
    box.className = "macchinario";
    box.setAttribute("data-id", id);
    box.innerHTML = `
      <h3>${data.nome}</h3>
      <div class="nome-e-btn">
        <button class="toggle-btn" onclick="toggleDettagli('${id}')">
          ${expanded ? "🔽" : "🔼"}
        </button>
      </div>
    `;

    if (expanded) {
      box.appendChild(createLineSeparator());

      // Qui invertito: prima inserimento note poi lista note

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
        <div style="text-align:center; margin-top:10px;">
          <button class="btn-green" onclick="aggiungiNota('${id}')">Conferma</button>
        </div>
      `;

      box.appendChild(noteForm);

      box.appendChild(createLineSeparator());

      // Lista note e area copia note solo se ci sono note
      if (data.note && data.note.length > 0) {
        const noteTitle = document.createElement("h4");
        noteTitle.textContent = "Note";
        noteTitle.className = "titolo-note";
        box.appendChild(noteTitle);

        const noteList = document.createElement("ul");
        noteList.className = "note-list";

        const notesSorted = (data.note || []).sort((a, b) =>
          b.data.localeCompare(a.data)
        );

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

function salvaMacchinario(id, nome) {
  if (!savedMacchinari[id]) {
    savedMacchinari[id] = { nome, note: [], expanded: true };
  } else {
    savedMacchinari[id].nome = nome;
  }
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
}

function toggleDettagli(id) {
  savedMacchinari[id].expanded = !savedMacchinari[id].expanded;
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
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
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

function eliminaMacchinario(id) {
  const nome = savedMacchinari[id].nome;
  mostraModalConferma(
    `Sei sicuro di voler eliminare "${nome}"?`,
    () => {
      delete savedMacchinari[id];
      localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
      renderMacchinari();
    },
    () => {
      // Annullato: niente
    }
  );
}

function aggiungiNota(id) {
  const data = document.getElementById(`data-${id}`).value;
  const desc = document.getElementById(`desc-${id}`).value.trim();
  if (!data || !desc) return;

  if (notaInModifica && notaInModifica.id === id) {
    // MODIFICA
    savedMacchinari[id].note[notaInModifica.index] = { data, desc };
    notaInModifica = null;
  } else {
    // AGGIUNGI NUOVA
    savedMacchinari[id].note = savedMacchinari[id].note || [];
    savedMacchinari[id].note.push({ data, desc });
  }

  document.getElementById(`data-${id}`).value = "";
  document.getElementById(`desc-${id}`).value = "";
  localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
  renderMacchinari();
}

function modificaNota(id, index) {
  const dataInput = document.getElementById(`data-${id}`);
  const descInput = document.getElementById(`desc-${id}`);
  const nota = savedMacchinari[id].note[index];

  // Se stai già modificando questa stessa nota → svuota e annulla
  if (notaInModifica && notaInModifica.id === id && notaInModifica.index === index) {
    dataInput.value = "";
    descInput.value = "";
    notaInModifica = null;
  } else {
    // Altrimenti avvia modifica
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
      localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));
      renderMacchinari();
    },
    () => {
      // Annullato: niente
    }
  );
}

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
            salvaMacchinario(qrCodeMessage, nome);
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
  salvaMacchinario(id, nome);
  renderMacchinari(id);
}

document.getElementById("create-macchinario").addEventListener("click", creaMacchinarioManuale);

Object.values(savedMacchinari).forEach(macch => macch.expanded = false);
localStorage.setItem("macchinari", JSON.stringify(savedMacchinari));

renderMacchinari();
