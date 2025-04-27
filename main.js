function mostrarSeccion(id) {
    // Ocultar todas las secciones
    document.querySelectorAll('.seccion').forEach(sec => {
        sec.style.display = 'none';
    });
    // Mostrar la sección seleccionada
    document.getElementById(id).style.display = 'block';

    if (id === 'teoria') {
        mostrarPreguntaFV();  // Llamar función de preguntas F/V
    }
}

function mostrarPreguntaFV() {
    const pregunta = "¿Toda ecuación de la forma y' + p(x)y = q(x) es una ED lineal de primer orden?";
    const respuestaCorrecta = true; // Verdadero

    // Crear botones de respuesta F/V
    const div = document.getElementById('pregunta-fv');
    div.innerHTML = `
        <p><strong>Pregunta Falso/Verdadero:</strong></p>
        <p>${pregunta}</p>
        <button onclick="evaluarFV(true, ${respuestaCorrecta})">Verdadero</button>
        <button onclick="evaluarFV(false, ${respuestaCorrecta})">Falso</button>
        <div id="retro-fv"></div>
    `;
}

function evaluarFV(respuestaUsuario, respuestaCorrecta) {
    const div = document.getElementById('retro-fv');
    if (respuestaUsuario === respuestaCorrecta) {
        div.innerHTML = "<p style='color:green;'>¡Correcto!</p>";
    } else {
        div.innerHTML = "<p style='color:red;'>Incorrecto. Revisa la definición de ED lineales de primer orden.</p>";
    }
}

function mostrarTipoED() {
    // Mostrar opciones para que el estudiante elija el tipo de ED
    const div = document.getElementById('tipo-ed');
    div.innerHTML = `
        <p><strong>Elige el tipo de ED para resolver:</strong></p>
        <button onclick="generarED('tipo1')">y' + ay = b</button>
        <button onclick="generarED('tipo2')">y' + ay = e^(bx) (b ≠ -a)</button>
    `;
}

function generarED(tipo) {
    let a = Math.floor(Math.random() * 5) + 1; // Coeficiente aleatorio de 1 a 5
    let b = Math.floor(Math.random() * 5) + 1; // Coeficiente aleatorio de 1 a 5
    let ed = '';
    let metodo = '';
    
    if (tipo === 'tipo1') {
        ed = `y' + ${a}y = ${b}`;
        metodo = 'Resuelve la ecuación y\' + ay = b usando el factor integrante. La solución es: y(x) = (b/a) + C * e^(-ax).';
    } else if (tipo === 'tipo2') {
        // Para este tipo, aseguramos que b ≠ -a
        while (b === -a) {
            b = Math.floor(Math.random() * 5) + 1; // Reintentar si b = -a
        }
        ed = `y' + ${a}y = e^(${b}x)`;
        metodo = 'Resuelve la ecuación y\' + ay = e^(bx) usando el factor integrante. La solución es: y(x) = (e^(bx)/(a - b)) + C * e^(-ax).';
    }

    // Mostrar la ED generada
    document.getElementById('ed-generada').innerHTML = `
        <p><strong>Resuelve la siguiente ED:</strong> ${ed}</p>
        <p><em>${metodo}</em></p>
        <button onclick="resolverED('${a}', '${b}', tipo)">Ver solución paso a paso</button>
    `;
}

function resolverED(a, b, tipo) {
    let solucion = '';
    
    if (tipo === 'tipo1') {
        solucion = `La solución general de la ED y' + ${a}y = ${b} es: y(x) = ${b}/${a} + C * e^(-${a}x)`;
    } else if (tipo === 'tipo2') {
        solucion = `La solución general de la ED y' + ${a}y = e^(${b}x) es: y(x) = (e^(${b}x)/(a - ${b})) + C * e^(-${a}x)`;
    }

    document.getElementById('ed-generada').innerHTML = `
        <p><strong>Solución:</strong> ${solucion}</p>
        <button onclick="generarED('tipo1')">Generar ED tipo 1</button>
        <button onclick="generarED('tipo2')">Generar ED tipo 2</button>
    `;
}
