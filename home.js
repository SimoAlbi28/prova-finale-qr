const foldersList = document.getElementById("folders-list");
const btnAddFolder = document.getElementById("btn-add-folder");

let folders = JSON.parse(localStorage.getItem("folders") || "{}");

// Ordina cartelle per anno decrescente
function ordinaCartelle() {
  return Object.entries(folders).sort((a, b) => {
    const annoA = parseInt(a[0]); // id = anno
    const annoB = parseInt(b[0]);
    return annoB - annoA;
  });
}

// Render cartelle
function renderFolders() {
  foldersList.innerHTML = "";
  const foldersOrdinati = ordinaCartelle();

  foldersOrdinati.forEach(([id, folder]) => {
    const folderDiv = document.createElement("div");
    folderDiv.className = "folder";
    folderDiv.dataset.id = id;

    folderDiv.innerHTML = `
      <img src="img/folder-icon.jpg" alt="Icona cartella" class="folder-icon" />
      <h2>${folder.nome}</h2>
      <div class="year">${folder.anno}</div>
      <div class="btns">
        <button title="Rinomina" class="btn-rename">✏️</button>
        <button title="Elimina" class="btn-delete">🗑️</button>
        <button title="Copia tutto" class="btn-copy">📋</button>
      </div>
    `;

    folderDiv.querySelector(".btn-rename").onclick = (e) => {
      e.stopPropagation();
      rinominaCartella(id);
    };

    folderDiv.querySelector(".btn-delete").onclick = (e) => {
      e.stopPropagation();
      eliminaCartella(id);
    };

    folderDiv.querySelector(".btn-copy").onclick = (e) => {
      e.stopPropagation();
      copiaTuttoCartella(id);
    };

    folderDiv.onclick = () => {
      window.location.href = `index.html?id=${encodeURIComponent(id)}`;
    };

    foldersList.appendChild(folderDiv);
  });
}

// Aggiungi cartella (id = anno)
btnAddFolder.onclick = () => {
  const anno = prompt("Inserire nome cartella (Anno):")?.trim();
  if (!anno || !/^\d{4}$/.test(anno)) {
    alert("Anno non valido. Usa 4 cifre, es: 2023");
    return;
  }

  if (folders.hasOwnProperty(anno)) {
    alert("Esiste già una cartella con questo anno.");
    return;
  }

  const nome = `Cartella ${anno}`;
  const id = anno; // id = anno

  folders[id] = { nome, anno, macchinari: {} };
  salvaCartelle();
  renderFolders();
};

function rinominaCartella(id) {
  const nuovoNome = prompt("Nuovo nome cartella:", folders[id].nome)?.trim();
  if (!nuovoNome) return;

  // Controllo se esiste nome uguale in un'altra cartella
  if (Object.entries(folders).some(([key, f]) => f.nome === nuovoNome && key !== id)) {
    alert("Nome già esistente.");
    return;
  }

  folders[id].nome = nuovoNome;
  salvaCartelle();
  renderFolders();
}

function eliminaCartella(id) {
  if (confirm(`Sei sicuro di eliminare la cartella "${folders[id].nome}"?`)) {
    delete folders[id];
    salvaCartelle();
    renderFolders();
  }
}

function copiaTuttoCartella(id) {
  const folder = folders[id];
  if (!folder) return;

  let testo = `${folder.nome.toUpperCase()}\n\n`; // Solo nome cartella

  const macchinari = folder.macchinari || {};

  function formatData(data) {
    const [yyyy, mm, dd] = data.split("-");
    return `${dd}/${mm}/${yyyy}`;
  }

  if (Object.keys(macchinari).length === 0) {
    testo += "(Cartella vuota !)\n";
  } else {
    Object.values(macchinari).forEach((macchinario, i) => {
      if (i > 0) testo += "\n"; // Riga vuota sopra per staccare manutenzioni
      testo += `• ${macchinario.nome}\n`; // Pallino per nome manutenzione
      if (macchinario.note && macchinario.note.length) {
        macchinario.note.forEach(n => {
          testo += `  - [${formatData(n.data)}]: ${n.desc}\n`; // Trattino per note
        });
      }
    });
  }

  navigator.clipboard.writeText(testo)
    .then(() => alert("📋 Contenuto copiato negli appunti!"))
    .catch(() => alert("Errore durante la copia negli appunti."));
}

function salvaCartelle() {
  localStorage.setItem("folders", JSON.stringify(folders));
}

// Primo render
renderFolders();
