const estados = {
  running: "Ejecutándose",
  stopped: "Detenido",
  updating: "Actualizando",
};

const iconosModo = {
  Pronóstico: "fas fa-cloud-sun",
  Hindcast: "fas fa-cloud-moon",
};

const iconosCategoria = {
  atmosfericos: "fas fa-cloud-sun",
  oceanicos: "fas fa-water",
  derrames: "fas fa-oil-can",
};

async function cargarModelos(categoria, contenedorId, archivosJson) {
  try {
    // Los archivos JSON serán proporcionados a través de un input de tipo file
    const modeloData = archivosJson[categoria]; // acceder a los modelos correspondientes

    if (!modeloData) {
      throw new Error(`No se encontraron datos para la categoría: ${categoria}`);
    }

    const contenedor = document.getElementById(contenedorId);

    modeloData.forEach((modelo) => {
      const card = document.createElement("div");
      card.className = "col-md-4";
      card.innerHTML = `
        <div class="card p-3">
          <h5 class="card-title">${modelo.nombre}</h5>
          <p><i class="fas fa-clock"></i> Última actualización: ${modelo.actualizacion}</p>
          <p><i class="fas fa-circle status-${modelo.estado}"></i> Estado: <span class="status-${modelo.estado}">${estados[modelo.estado]}</span></p>
          <p><i class="${iconosCategoria[categoria]}"></i> Modo: <strong>${modelo.modo}</strong></p>
        </div>
      `;
      contenedor.appendChild(card);
    });
  } catch (error) {
    console.error(`Error cargando modelos de la categoría '${categoria}':`, error);
    const contenedor = document.getElementById(contenedorId);
    contenedor.innerHTML = `<div class="col-12 text-danger">Error al cargar datos de ${categoria}</div>`;
  }
}

async function inicializar() {
  const archivosJson = await cargarArchivosJson();

  await Promise.all([
    cargarModelos("atmosfericos", "atmosfericos", archivosJson),
    cargarModelos("oceanicos", "oceanicos", archivosJson),
    cargarModelos("derrames", "derrames", archivosJson),
  ]);

  // Mapa Leaflet
  const map = L.map("map").setView([19.43, -99.13], 5);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  const zonas = [
    { name: "CROCO", coords: [18.5, -95], color: "blue" },
    { name: "ADCIRC", coords: [20.5, -97], color: "purple" },
    { name: "WW3", coords: [19.5, -94], color: "green" },
  ];

  zonas.forEach((z) => {
    L.circle(z.coords, {
      color: z.color,
      fillColor: z.color,
      fillOpacity: 0.4,
      radius: 200000,
    }).addTo(map).bindPopup(z.name);
  });
}

function cargarArchivosJson() {
  return new Promise((resolve, reject) => {
    const inputElement = document.createElement("input");
    inputElement.type = "file";
    inputElement.accept = ".json";
    inputElement.multiple = true;
    inputElement.addEventListener("change", (event) => {
      const archivos = event.target.files;
      if (!archivos.length) {
        reject("No se seleccionaron archivos.");
        return;
      }

      const archivosJson = {};
      let archivosCargados = 0;

      Array.from(archivos).forEach((archivo) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            const categoria = archivo.name.replace(".json", ""); // Nombre del archivo como clave de categoría
            archivosJson[categoria] = data;
            archivosCargados += 1;

            if (archivosCargados === archivos.length) {
              resolve(archivosJson);
            }
          } catch (error) {
            reject("Error al leer el archivo JSON.");
          }
        };
        reader.readAsText(archivo);
      });
    });

    inputElement.click();
  });
}

document.addEventListener("DOMContentLoaded", inicializar);
