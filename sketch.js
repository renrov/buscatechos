// Juego de Ciudad y Sonidos - version mejorada

let columnas = 10;
let filas = 10;
let tamañoTile = 60;
let techos = [];
let texturasTechos = [];
let texturasObjetos = [];
let tileClickeado = null;
let tileHover = null;
let tiempoInicioAnimacion = 0;
const duracionAnimacion = 150;

// Controles
let probabilidadObjeto = 0.35;
let tamañoTileActual = 60;
let volumenActual = 0.5;

// Sonido
let sintetizador;
let tiempoAtaque = 0.05;
let tiempoRelease = 0.2;
let ratioSustain = 0.5;
let tiempoDecay = 0.1;

// Grabación
let grabando = false;
let clicsGrabados = [];
let indiceReproduccion = 0;
let tiempoInicioReproduccion = 0;

// Textura por defecto
let texturaRespaldo;

// Categorías de techos
const categoriasColoresTechos = {
  0: 'calido',
  1: 'frio',
  2: 'neutral',
  3: 'calido',
  4: 'frio',
  5: 'calido'
};

let frecuenciasPorCategoria;

const estilo = {
  fondo: ['#E6F7FF', '#B3E0FF'],
  sombras: 'rgba(0,0,0,0.1)',
  bordeTile: 'rgba(0,0,0,0.07)',
  bordeHover: '#ff9900',
  fondoPanel: 'rgba(255,255,255,0.9)',
  boton: {
    normal: '#4CAF50',
    hover: '#45a049',
    activo: '#3e8e41'
  },
  botonGrabar: {
    normal: '#f44336',
    hover: '#d32f2f',
    activo: '#b71c1c'
  }
};

function preload() {
  texturaRespaldo = createGraphics(60, 60);
  texturaRespaldo.background(220);
  texturaRespaldo.fill(180);
  texturaRespaldo.rect(15, 15, 30, 30, 4);

  const archivosTechos = [
    'assets/techo_rojo_oscuro.png',
    'assets/techo_verde_musgo.png',
    'assets/techo_gris_pizarra.png',
    'assets/techo_marron_terracota.png',
    'assets/techo_azul_brillante.png',
    'assets/techo_amarillo_claro.png'
  ];

  archivosTechos.forEach((archivo, i) => {
    texturasTechos[i] = loadImage(archivo,
      () => {},
      () => {
        console.log('No se cargó ' + archivo);
        texturasTechos[i] = texturaRespaldo;
      });
  });

  const archivosObjetos = [
    'assets/tanque_agua.png',
    'assets/maceta_flor.png',
    'assets/antena_parabolica.png',
    'assets/panel_solar.png',
    'assets/ventilacion.png'
  ];

  archivosObjetos.forEach((archivo, i) => {
    texturasObjetos[i] = loadImage(archivo,
      () => {},
      () => {
        console.log('No se cargó ' + archivo);
        texturasObjetos[i] = texturaRespaldo;
      });
  });
}

function setup() {
  createCanvas(columnas * tamañoTile + 200, filas * tamañoTile + 80);
  pixelDensity(2);
  noStroke();

  frecuenciasPorCategoria = {
    'calido': [midiToFreq(60), midiToFreq(62), midiToFreq(64)],
    'frio': [midiToFreq(67), midiToFreq(69), midiToFreq(71)],
    'neutral': [midiToFreq(65), midiToFreq(58), midiToFreq(70)]
  };

  sintetizador = new p5.Oscillator('sine');
  sintetizador.amp(0);
  sintetizador.freq(440);
  sintetizador.start();

  configurarInterfaz();
  crearOverlayAyuda();
  inicializarCiudad();
}

function configurarInterfaz() {
  let panel = createDiv('')
    .style('position','absolute')
    .style('left',(columnas * tamañoTile + 10)+'px')
    .style('top','10px')
    .style('background',estilo.fondoPanel)
    .style('padding','12px')
    .style('border-radius','8px')
    .style('box-shadow','0 2px 6px rgba(0,0,0,0.15)')
    .style('width','180px')
    .style('font-family','Roboto, sans-serif')
    .style('font-size','13px');

  createElement('h2','Opciones').parent(panel)
    .style('margin','0 0 8px 0')
    .style('font-size','16px');

  // sliders
  crearSlider(panel,'Tamaño tiles',30,100,tamañoTileActual,5,v=>tamañoTileActual=v);
  crearSlider(panel,'Prob. objeto',0,100,probabilidadObjeto*100,5,v=>probabilidadObjeto=v/100);
  crearSlider(panel,'Volumen',0,100,volumenActual*100,5,v=>volumenActual=v/100);

  createElement('h3','Envolvente').parent(panel)
    .style('margin','10px 0 4px 0')
    .style('font-size','14px');

  crearSlider(panel,'Ataque',0,500,tiempoAtaque*1000,10,v=>tiempoAtaque=v/1000);
  crearSlider(panel,'Decay',0,500,tiempoDecay*1000,10,v=>tiempoDecay=v/1000);
  crearSlider(panel,'Sustain',0,100,ratioSustain*100,5,v=>ratioSustain=v/100);
  crearSlider(panel,'Release',0,1000,tiempoRelease*1000,10,v=>tiempoRelease=v/1000);

  let contenedorBotones = createDiv('').parent(panel).style('margin-top','10px');

  const estilizarBoton = (btn,grabar=false)=>{
    let colores = grabar?estilo.botonGrabar:estilo.boton;
    btn.style('background',colores.normal)
       .style('color','white')
       .style('border','none')
       .style('padding','6px 10px')
       .style('border-radius','4px')
       .style('margin','2px')
       .style('cursor','pointer');
    btn.mouseOver(()=>btn.style('background',colores.hover));
    btn.mouseOut(()=>btn.style('background',colores.normal));
    btn.mousePressed(()=>btn.style('background',colores.activo));
  };

  let btnReiniciar = createButton('Reiniciar').parent(contenedorBotones);
  btnReiniciar.mousePressed(inicializarCiudad);
  estilizarBoton(btnReiniciar);

  let btnGrabar = createButton('Grabar').parent(contenedorBotones);
  btnGrabar.mousePressed(()=>{
    toggleGrabacion();
    btnGrabar.html(grabando?'Parar':'Grabar');
    estilizarBoton(btnGrabar,true);
  });
  estilizarBoton(btnGrabar,true);

  let btnReproducir = createButton('Play').parent(contenedorBotones);
  btnReproducir.mousePressed(reproducirClics);
  estilizarBoton(btnReproducir);
}

function crearSlider(parent,titulo,min,max,valor,paso,callback){
  let label = createDiv(titulo).parent(parent).style('margin-top','6px');
  let slider = createSlider(min,max,valor,paso).parent(parent).style('width','100%');
  slider.input(()=>callback(slider.value()));
  return slider;
}

function crearOverlayAyuda(){
  let overlay = createDiv('<strong>Ayuda:</strong> clic en los techos para cambiar la textura. Doble clic elimina el objeto.').style('position','absolute').style('bottom','10px').style('left','10px').style('background','rgba(255,255,255,0.8)').style('padding','6px 10px').style('border-radius','4px').style('font-size','12px');
}

function draw() {
  if(tamañoTile !== tamañoTileActual){
    tamañoTile = tamañoTileActual;
    resizeCanvas(columnas*tamañoTile + 200, filas*tamañoTile + 80);
  }

  dibujarFondo();
  manejarReproduccion();
  actualizarHover();
  dibujarCiudad();
}

function dibujarFondo(){
  for(let y=0;y<=height;y++){
    let inter = map(y,0,height,0,1);
    let c = lerpColor(color(estilo.fondo[0]),color(estilo.fondo[1]),inter);
    stroke(c);
    line(0,y,width,y);
  }
  noStroke();
}

function manejarReproduccion(){
  if(!grabando && indiceReproduccion < clicsGrabados.length){
    let clic = clicsGrabados[indiceReproduccion];
    if(millis() - tiempoInicioReproduccion >= clic.tiempoOffset){
      simularClic(clic.x,clic.y);
      indiceReproduccion++;
    }
  }
}

function actualizarHover(){
  if(mouseX < columnas*tamañoTile && mouseY < filas*tamañoTile){
    tileHover = {x:floor(mouseX/tamañoTile), y:floor(mouseY/tamañoTile)};
  } else {
    tileHover = null;
  }
}

function simularClic(x,y){
  let texturaVieja = techos[x][y].textura;
  let texturaNueva = random(texturasTechos.filter(t=>t!==texturaVieja)) || random(texturasTechos);

  techos[x][y].textura = texturaNueva;
  tileClickeado = {x,y};
  tiempoInicioAnimacion = millis();
  reproducirSonido(texturaNueva);

  if(random() < probabilidadObjeto){
    techos[x][y].objeto = {tipo:'imagen',textura:random(texturasObjetos)};
  } else {
    techos[x][y].objeto = null;
  }
}

function dibujarCiudad(){
  for(let x=0;x<columnas;x++){
    for(let y=0;y<filas;y++){
      let posX = x*tamañoTile;
      let posY = y*tamañoTile;
      let tamañoAnim = calcularAnimacion(x,y);
      let offset = (tamañoTile - tamañoAnim)/2;
      dibujarSombra(posX,posY);
      image(techos[x][y].textura,posX+offset,posY+offset,tamañoAnim,tamañoAnim);
      dibujarObjeto(x,y,posX,posY,tamañoAnim);
      dibujarBorde(posX+offset,posY+offset,tamañoAnim,x,y);
    }
  }
}

function calcularAnimacion(x,y){
  if(!tileClickeado || tileClickeado.x!==x || tileClickeado.y!==y) return tamañoTile;
  let tiempo = millis() - tiempoInicioAnimacion;
  if(tiempo > duracionAnimacion){
    tileClickeado = null;
    return tamañoTile;
  }
  let p = map(tiempo,0,duracionAnimacion,0,1);
  return p < 0.5 ? lerp(tamañoTile,tamañoTile*1.1,p*2) : lerp(tamañoTile*1.1,tamañoTile,(p-0.5)*2);
}

function dibujarSombra(x,y){
  fill(estilo.sombras);
  rect(x+5,y+5,tamañoTile,tamañoTile,8);
}

function dibujarObjeto(x,y,baseX,baseY,tamañoAnim){
  if(techos[x][y].objeto){
    let tamañoObj = tamañoAnim*0.4;
    push();
    imageMode(CENTER);
    image(techos[x][y].objeto.textura,baseX+tamañoAnim/2,baseY+tamañoAnim/2,tamañoObj,tamañoObj);
    imageMode(CORNER);
    pop();
  }
}

function dibujarBorde(x,y,tamaño,gridX,gridY){
  if(tileHover && tileHover.x===gridX && tileHover.y===gridY){
    stroke(estilo.bordeHover);
    strokeWeight(2);
  } else {
    stroke(estilo.bordeTile);
    strokeWeight(1);
  }
  noFill();
  rect(x,y,tamaño,tamaño,8);
  noStroke();
}

function mousePressed(){
  if(mouseX < columnas*tamañoTile){
    let x = floor(mouseX/tamañoTile);
    let y = floor(mouseY/tamañoTile);
    if(x>=0 && x<columnas && y>=0 && y<filas){
      manejarClic(x,y);
      if(grabando){
        clicsGrabados.push({x,y,tiempoOffset:millis()-tiempoInicioReproduccion});
      }
    }
  }
}

function doubleClicked(){
  if(mouseX < columnas*tamañoTile){
    let x=floor(mouseX/tamañoTile); 
    let y=floor(mouseY/tamañoTile);
    if(x>=0 && x<columnas && y>=0 && y<filas){
      techos[x][y].objeto = null;
    }
  }
}

function manejarClic(x,y){
  let texturaVieja = techos[x][y].textura;
  let texturaNueva = random(texturasTechos.filter(t=>t!==texturaVieja)) || random(texturasTechos);
  techos[x][y].textura = texturaNueva;
  tileClickeado = {x,y};
  tiempoInicioAnimacion = millis();
  reproducirSonido(texturaNueva);
  techos[x][y].objeto = random()<probabilidadObjeto ? {tipo:'imagen',textura:random(texturasObjetos)} : techos[x][y].objeto;
}

function reproducirSonido(textura){
  let i = texturasTechos.indexOf(textura);
  if(i === -1) return;
  let categoria = categoriasColoresTechos[i];
  let freqs = frecuenciasPorCategoria[categoria];
  if(freqs && freqs.length>0){
    let f = random(freqs);
    sintetizador.freq(f,0.01);
    let env = new p5.Envelope();
    env.setADSR(tiempoAtaque,tiempoDecay,ratioSustain,tiempoRelease);
    env.play(sintetizador,0,volumenActual);
  }
}

function inicializarCiudad(){
  tamañoTile = tamañoTileActual;
  resizeCanvas(columnas*tamañoTile + 200, filas*tamañoTile + 80);

  techos = [];
  for(let x=0;x<columnas;x++){
    techos[x] = [];
    for(let y=0;y<filas;y++){
      techos[x][y] = {
        textura: random(texturasTechos),
        objeto: random()<probabilidadObjeto ? {tipo:'imagen',textura:random(texturasObjetos)} : null
      };
    }
  }
}

function toggleGrabacion(){
  grabando=!grabando;
  if(grabando){
    clicsGrabados=[];
    tiempoInicioReproduccion = millis();
  }
}

function reproducirClics(){
  if(clicsGrabados.length>0){
    indiceReproduccion=0;
    tiempoInicioReproduccion=millis();
  }
}