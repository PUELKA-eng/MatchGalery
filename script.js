/* ======================================
 * JUEGO: DESCUBRE LA IMAGEN 5 x 5
 * ====================================== */

const tablero = document.getElementById("tablero");
const selectorImagen = document.getElementById("selectorImagen");
const operacionTexto = document.getElementById("operacion");
const respuestaInput = document.getElementById("respuesta");
const mensaje = document.getElementById("mensaje");
const progreso = document.getElementById("progreso");
const comprobarBtn = document.getElementById("comprobar");
const nuevoJuegoBtn = document.getElementById("nuevoJuego");
const modoAleatorio = document.getElementById("modoAleatorio");

const TAMANO = 5;
const TOTAL_CUADROS = TAMANO * TAMANO;

let imagenURL = null;
let cuadros = [];
let cuadroSeleccionado = null;
let respuestaCorrecta = null;
let juegoTerminado = false;

// Proporción de la imagen original.
let proporcionImagen = 1;


/* ======================================
 * CREAR EL TABLERO
 * ====================================== */

function crearTablero() {
    tablero.innerHTML = "";
    cuadros = [];
    cuadroSeleccionado = null;
    respuestaCorrecta = null;
    juegoTerminado = false;

    // Adaptar la proporción del tablero a la imagen.
    tablero.style.aspectRatio = `${proporcionImagen}`;
    tablero.style.gridTemplateColumns =
        `repeat(${TAMANO}, minmax(0, 1fr))`;
    tablero.style.gridTemplateRows =
        `repeat(${TAMANO}, minmax(0, 1fr))`;

    for (let i = 0; i < TOTAL_CUADROS; i++) {
        const cuadro = document.createElement("button");

        cuadro.type = "button";
        cuadro.className = "cuadro bloqueado";
        cuadro.setAttribute("aria-label", `Cuadro ${i + 1}`);

        cuadro.addEventListener("click", function () {
            seleccionarCuadro(i);
        });

        tablero.appendChild(cuadro);

        // Cada cuadro recibe su propia operación.
        cuadros.push({
            elemento: cuadro,
            descubierto: false,
            operacion: crearOperacion()
        });
    }

    operacionTexto.textContent = "---";
    respuestaInput.value = "";

    mensaje.textContent = imagenURL
        ? "Toca un cuadro para comenzar."
        : "Elige una imagen de tu galería.";

    actualizarProgreso();

    // NUEVO: seleccionar un cuadro si el modo está activado.
    if (modoAleatorio.checked && imagenURL) {
        seleccionarCuadroAleatorio();
    }
}


/* ======================================
 * ELEGIR CUALQUIER IMAGEN
 * ====================================== */

selectorImagen.addEventListener("change", function (evento) {
    const archivo = evento.target.files[0];

    if (!archivo) {
        return;
    }

    if (!archivo.type.startsWith("image/")) {
        mensaje.textContent =
            "Selecciona un archivo de imagen válido.";
        selectorImagen.value = "";
        return;
    }

    const lector = new FileReader();

    lector.onload = function (e) {
        const imagen = new Image();

        imagen.onload = function () {
            // Conservar la imagen completa y original.
            proporcionImagen =
                imagen.naturalWidth / imagen.naturalHeight;

            imagenURL = e.target.result;

            crearTablero();

            mensaje.textContent =
                "¡Imagen cargada! Toca un cuadro para comenzar.";
        };

        imagen.onerror = function () {
            mensaje.textContent =
                "No se pudo procesar la imagen.";
        };

        imagen.src = e.target.result;
    };

    lector.onerror = function () {
        mensaje.textContent =
            "No se pudo abrir la imagen. Inténtalo otra vez.";
    };

    lector.readAsDataURL(archivo);
});


/* ======================================
 * NUEVO: SELECCIONAR CUADRO ALEATORIO
 * ====================================== */

function seleccionarCuadroAleatorio() {
    if (juegoTerminado || !imagenURL || !modoAleatorio.checked) {
        return;
    }

    const disponibles = cuadros
        .map((cuadro, indice) => ({ cuadro, indice }))
        .filter(item => !item.cuadro.descubierto);

    if (disponibles.length === 0) {
        return;
    }

    const elegido = disponibles[
        numeroAleatorio(0, disponibles.length - 1)
    ];

    seleccionarCuadro(elegido.indice);
}


/* ======================================
 * SELECCIONAR UN CUADRO
 * ====================================== */

function seleccionarCuadro(indice) {
    if (juegoTerminado) {
        return;
    }

    // NUEVO: impedir cambiar de cuadro mientras se resuelve
    // el cuadro actual en el modo aleatorio.
    if (modoAleatorio.checked && cuadroSeleccionado !== null) {
        return;
    }

    if (!imagenURL) {
        mensaje.textContent = "Primero elige una imagen.";
        return;
    }

    const cuadro = cuadros[indice];

    if (cuadro.descubierto) {
        mensaje.textContent = "Ese cuadro ya está descubierto.";
        return;
    }

    cuadroSeleccionado = indice;

    cuadros.forEach(function (c) {
        c.elemento.classList.remove("seleccionado");
    });

    cuadro.elemento.classList.add("seleccionado");

    // Recuperar la operación guardada en este cuadro.
    const operacion = cuadro.operacion;

    operacionTexto.textContent = operacion.texto;
    respuestaCorrecta = operacion.respuesta;

    respuestaInput.value = "";

    mensaje.textContent =
        "Resuelve la operación para descubrir el cuadro.";

    respuestaInput.focus();
}


/* ======================================
 * CREAR UNA OPERACIÓN MATEMÁTICA
 * ====================================== */

function crearOperacion() {
    const tipos = ["+", "-", "×", "÷"];
    const tipo = tipos[numeroAleatorio(0, tipos.length - 1)];

    let a;
    let b;
    let resultado;

    if (tipo === "+") {
        a = numeroAleatorio(1, 99);
        b = numeroAleatorio(1, 99);

        resultado = a + b;

    } else if (tipo === "-") {
        a = numeroAleatorio(1, 99);
        b = numeroAleatorio(1, a);

        resultado = a - b;

    } else if (tipo === "×") {
        a = numeroAleatorio(1, 12);
        b = numeroAleatorio(1, 12);

        resultado = a * b;

    } else {
        // División exacta con divisores del 2 al 12.
        b = numeroAleatorio(2, 12);
        resultado = numeroAleatorio(1, 12);
        a = b * resultado;
    }

    return {
        texto: `${a} ${tipo} ${b} = ?`,
        respuesta: resultado
    };
}


/* ======================================
 * COMPROBAR LA RESPUESTA
 * ====================================== */

function comprobarRespuesta() {
    if (juegoTerminado) {
        return;
    }

    if (!imagenURL) {
        mensaje.textContent = "Primero elige una imagen.";
        return;
    }

    if (cuadroSeleccionado === null) {
        mensaje.textContent = "Primero toca un cuadro bloqueado.";
        return;
    }

    const texto = respuestaInput.value.trim();

    if (texto === "") {
        mensaje.textContent = "Escribe tu respuesta.";
        respuestaInput.focus();
        return;
    }

    const respuestaUsuario = Number(texto);

    if (!Number.isFinite(respuestaUsuario)) {
        mensaje.textContent = "Introduce un número válido.";
        return;
    }

    if (respuestaUsuario === respuestaCorrecta) {
        // Revelar el cuadro correspondiente.
        descubrirCuadro(cuadroSeleccionado);

        cuadroSeleccionado = null;
        respuestaCorrecta = null;

        operacionTexto.textContent = "---";
        respuestaInput.value = "";

        actualizarProgreso();

        const completado = cuadros.every(function (c) {
            return c.descubierto;
        });

        if (completado) {
            juegoTerminado = true;

            mensaje.textContent =
                "¡Felicidades! Has descubierto toda la imagen.";

            operacionTexto.textContent = "🎉";

        } else if (modoAleatorio.checked) {
            // NUEVO: al acertar, seleccionar otro cuadro aleatorio.
            seleccionarCuadroAleatorio();

        } else {
            mensaje.textContent =
                "¡Correcto! Has descubierto un cuadro.";
        }

    } else {
        // La operación se conserva para volver a intentarlo.
        mensaje.textContent = "Incorrecto. Inténtalo de nuevo.";
        respuestaInput.select();
    }
}


/* ======================================
 * MOSTRAR LA PARTE DE LA IMAGEN
 * ====================================== */

function descubrirCuadro(indice) {
    const cuadro = cuadros[indice];
    const elemento = cuadro.elemento;

    const fila = Math.floor(indice / TAMANO);
    const columna = indice % TAMANO;

    cuadro.descubierto = true;

    elemento.classList.remove("bloqueado", "seleccionado");

    elemento.style.backgroundImage = `url("${imagenURL}")`;
    elemento.style.backgroundRepeat = "no-repeat";

    // Ajustar el fondo para mostrar la parte correspondiente.
    elemento.style.backgroundSize =
        `${TAMANO * 100}% ${TAMANO * 100}%`;

    const x = (columna / (TAMANO - 1)) * 100;
    const y = (fila / (TAMANO - 1)) * 100;

    elemento.style.backgroundPosition = `${x}% ${y}%`;
    elemento.disabled = true;
}


/* ======================================
 * ACTUALIZAR EL CONTADOR
 * ====================================== */

function actualizarProgreso() {
    const descubiertos = cuadros.filter(function (c) {
        return c.descubierto;
    }).length;

    progreso.textContent =
        `Cuadros descubiertos: ${descubiertos}/${TOTAL_CUADROS}`;
}


/* ======================================
 * GENERAR NÚMEROS ALEATORIOS
 * ====================================== */

function numeroAleatorio(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


/* ======================================
 * BOTÓN COMPROBAR Y TECLA ENTER
 * ====================================== */

comprobarBtn.addEventListener("click", comprobarRespuesta);

respuestaInput.addEventListener("keydown", function (evento) {
    if (evento.key === "Enter") {
        evento.preventDefault();
        comprobarRespuesta();
    }
});


/* ======================================
 * NUEVO: ACTIVAR O DESACTIVAR MODO ALEATORIO
 * ====================================== */

modoAleatorio.addEventListener("change", function () {
    if (modoAleatorio.checked) {
        seleccionarCuadroAleatorio();
    }
});


/* ======================================
 * NUEVO JUEGO
 * ====================================== */

nuevoJuegoBtn.addEventListener("click", function () {
    // Crea 25 cuadros nuevos con operaciones nuevas.
    // La imagen seleccionada se conserva.
    crearTablero();
});


/* ======================================
 * INICIAR EL JUEGO
 * ====================================== */

crearTablero();