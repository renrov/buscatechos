// --- Configuración base ---
let columnas = 10;
let filas = 10;
let tamañoTile = 60;
let techos = [];
let texturasTechos = [];
let texturasObjetos = [];
let tileClickeado = null;
let tiempoInicioAnimacion = 0;
const duracionAnimacion = 150;

// Parámetros de control
let probabilidadObjeto = 0.35;
let tamañoTileActual = 60;
let mostrarGrid = true;

// Grabación de clics (para repetir movimientos si pinta)
let grabando = false;
let clicsGrabados = [];
let indiceReproduccion = 0;
let tiempoInicioReproduccion = 0;

// Textura de respaldo si falla la carga
let texturaRespaldo;

// Div para la leyenda abajo
let leyendaDiv;

function preload() {
  // Textura genérica para fallback
  texturaRespaldo = createGraphics(60, 60);
  texturaRespaldo.background(220);
  texturaRespaldo.fill(180);
  texturaRespaldo.rect(15, 15, 30, 30, 4);

  // Cargar techos
  const archivosTechos = [
    'assets/techo_rojo_oscuro.png',
    'assets/techo_verde_musgo.png',
    'assets/techo_gris_pizarra.png',
    'assets/techo_marron_terracota.png',
    'assets/techo_azul_brillante.png',
    'assets/techo_amarillo_claro.png'
  ];

  archivosTechos.forEach((archivo, i) => {
    texturasTechos[i] = loadImage(
      archivo,
      img => {},
      () => {
        console.log(`Che, no se cargó ${archivo}`);
        texturasTechos[i] = texturaRespaldo;
      }
    );
  });

  // Cargar objetos para los techos
  const archivosObjetos = [
    'assets/tanque_agua.png',
    'assets/maceta_flor.png',
    'assets/antena_parabolica.png',
    'assets/panel_solar.png',
    'assets/ventilacion.png'
  ];

  archivosObjetos.forEach((archivo, i) => {
    texturasObjetos[i] = loadImage(
      archivo,
      img => {},
      () => {
        console.log(`Che, no se cargó ${archivo}`);
        texturasObjetos[i] = texturaRespaldo;
      }
    );
  });
}

function setup() {
  createCanvas(columnas * tamañoTile, filas * tamañoTile);
  pixelDensity(2);
  noStroke();

  inicializarCiudad();
  crearLeyenda();
}

function draw() {
  if (tamañoTile !== tamañoTileActual) {
    tamañoTile = tamañoTileActual;
    resizeCanvas(columnas * tamañoTile, filas * tamañoTile);
  }

  dibujarFondo();
  manejarReproduccion();
  dibujarCiudad();
}

// Leyenda abajo con estilo argento
function crearLeyenda() {
  leyendaDiv = createDiv(
    'Hacé clic en los techos para cambiarles el color. ' +
    'Si dejás apretado Shift al hacer clic, no se agrega nada.'
  )
    .style('position', 'absolute')
    .style('bottom', '10px')
    .style('left', '10px')
    .style('background', 'rgba(255,255,255,0.9)')
    .style('padding', '6px 8px')
    .style('border-radius', '4px')
    .style('font-size', '12px')
    .style('color', '#333');
}

// Fondo con degrade
function dibujarFondo() {
  push();
  for (let y = 0; y <= height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(color('#E6F7FF'), color('#B3E0FF'), inter);
    stroke(c);
    line(0, y, width, y);
  }
  noStroke();
  pop();
}

// Manejar "macro" de grabación/reproducción
function manejarReproduccion() {
  if (!grabando && indiceReproduccion < clicsGrabados.length) {
    let clic = clicsGrabados[indiceReproduccion];
    if (millis() - tiempoInicioReproduccion >= clic.tiempoOffset) {
      simularClic(clic.x, clic.y);
      indiceReproduccion++;
    }
  }
}

function simularClic(x, y) {
  actualizarTile(x, y);
}

// Dibuja toda la ciudad
function dibujarCiudad() {
  for (let x = 0; x < columnas; x++) {
    for (let y = 0; y < filas; y++) {
      let posX = x * tamañoTile;
      let posY = y * tamañoTile;
      let tamañoAnim = calcularAnimacion(x, y);
      let offset = (tamañoTile - tamañoAnim) / 2;

      dibujarSombra(posX, posY);
      image(techos[x][y].textura, posX + offset, posY + offset, tamañoAnim, tamañoAnim);
      dibujarObjeto(x, y, posX, posY, tamañoAnim);
      dibujarBorde(posX + offset, posY + offset, tamañoAnim);
      if (mostrarGrid) dibujarGrid(posX + offset, posY + offset, tamañoAnim);
    }
  }
}

// Animación al hacer clic
function calcularAnimacion(x, y) {
  if (!tileClickeado || tileClickeado.x !== x || tileClickeado.y !== y) return tamañoTile;

  let tiempoTranscurrido = millis() - tiempoInicioAnimacion;
  if (tiempoTranscurrido > duracionAnimacion) {
    tileClickeado = null;
    return tamañoTile;
  }

  let progreso = map(tiempoTranscurrido, 0, duracionAnimacion, 0, 1);
  return progreso < 0.5
    ? lerp(tamañoTile, tamañoTile * 1.1, progreso * 2)
    : lerp(tamañoTile * 1.1, tamañoTile, (progreso - 0.5) * 2);
}

// Grid tenue
function dibujarGrid(x, y, tamaño) {
  push();
  stroke('rgba(0,0,0,0.1)');
  noFill();
  rect(x, y, tamaño, tamaño);
  pop();
}

// Sombra bajo los techos
function dibujarSombra(x, y) {
  push();
  fill('rgba(0, 0, 0, 0.1)');
  rect(x + 5, y + 5, tamañoTile, tamañoTile, 8);
  pop();
}

// Objeto encima del techo
function dibujarObjeto(x, y, baseX, baseY, tamañoAnim) {
  if (techos[x][y].objeto) {
    let tamañoObj = tamañoAnim * 0.4;
    push();
    imageMode(CENTER);
    image(
      techos[x][y].objeto.textura,
      baseX + tamañoAnim / 2,
      baseY + tamañoAnim / 2,
      tamañoObj,
      tamañoObj
    );
    imageMode(CORNER);
    pop();
  }
}

// Borde redondeado
function dibujarBorde(x, y, tamaño) {
  push();
  stroke('rgba(0, 0, 0, 0.07)');
  strokeWeight(1);
  noFill();
  rect(x, y, tamaño, tamaño, 8);
  noStroke();
  pop();
}

// Interacción con el mouse
function mousePressed() {
  if (mouseX < columnas * tamañoTile && mouseX >= 0 && mouseY >= 0) {
    let x = floor(mouseX / tamañoTile);
    let y = floor(mouseY / tamañoTile);

    if (x >= 0 && x < columnas && y >= 0 && y < filas) {
      manejarClic(x, y);

      if (grabando) {
        clicsGrabados.push({
          x: x,
          y: y,
          tiempoOffset: millis() - tiempoInicioReproduccion
        });
      }
    }
  }
}

// Manejo del clic: cambio de textura y objeto
function manejarClic(x, y) {
  actualizarTile(x, y);
}

function actualizarTile(x, y) {
  let texturaVieja = techos[x][y].textura;
  let texturaNueva = random(
    texturasTechos.filter(t => t !== texturaVieja)
  ) || random(texturasTechos);

  techos[x][y].textura = texturaNueva;
  tileClickeado = { x, y };
  tiempoInicioAnimacion = millis();

  if (keyIsDown(SHIFT)) {
    techos[x][y].objeto = null;
  } else {
    techos[x][y].objeto =
      random() < probabilidadObjeto
        ? { tipo: 'imagen', textura: random(texturasObjetos) }
        : null;
  }
}

// Inicializa la ciudad
function inicializarCiudad() {
  tamañoTile = tamañoTileActual;
  resizeCanvas(columnas * tamañoTile, filas * tamañoTile);

  techos = [];
  for (let x = 0; x < columnas; x++) {
    techos[x] = [];
    for (let y = 0; y < filas; y++) {
      techos[x][y] = {
        textura: random(texturasTechos),
        objeto:
          random() < probabilidadObjeto
            ? { tipo: 'imagen', textura: random(texturasObjetos) }
            : null
      };
    }
  }
}
