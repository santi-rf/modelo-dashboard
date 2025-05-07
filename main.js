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

// Función para cargar los archivos JSON directamente desde GitHub
async function cargarArchivosJson() {
  try {
    const archivosJson = {};

    // URL de los archivos JSON alojados en GitHub
    const respuestaAtmosfericos = await fetch('https://raw.githubusercontent.com/tu-usuario/tu-repositorio/main/data/atmosfericos.json');
    const respuestaOceanicos = await fetch('https://raw.githubusercontent.com/tu-usuario/tu-repositorio/main/data/oceanicos.json');
    const respuestaDerrames = await fetch('https://raw.githubusercontent.com/tu-usuario/tu-repositorio/main/data/derrames.json');

    // Esperar a que todas las respuestas se resuelvan
    const datosAtmosfericos = await respuestaAtmosfericos.json();
    const datosOceanicos = await respuestaOceanicos.json();
    const datosDerrames = await respuestaDerrames.json();

    archivosJson.atmosfericos = datosAtmosfericos;
    archivosJson.oceanicos = datosOceanicos;
    archivosJson.derrames = datosDerrames;

    return archivosJson;
  } catch (error) {
    console.error("Error al cargar los archivos JSON:", error);
    throw new Error("No se pudieron cargar los archivos JSON");
  }
}

// Función para cargar los modelos en la interfaz
async function cargarModelos(categoria, contenedorId, archivosJson) {
  try {
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

// Inicializar la página cargando los datos JSON y mostrando los modelos
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

// Esperar a que el DOM se cargue completamente antes de inicializar
document.addEventListener("DOMContentLoaded", inicializar);
