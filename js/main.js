// main.js

import config from 'guiasED/js/config/config1.js';
import * as math from 'mathjs'; // Asegúrate que mathjs esté cargado correctamente

const DEFAULT_TEST_POINTS = [0, 0.5, 1, 1.5, 2, Math.PI/4, Math.PI/2];
const DEFAULT_TOLERANCE = 1e-4;

class EDExamen {
  constructor(config) {
    this.config = config;
    this.questions = config.questions || [];
    this.score = 0;
    this.mathJaxRetryCount = 0;
    this.isMobile = /Mobi|Android/i.test(navigator.userAgent);
    this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }

  start() {
    this.generateExam();
    this.setupEventListeners();
    this.applyMobileStyles();
  }

  generateExam() {
    const container = document.getElementById('quiz-container');
    if (!container) return this.showError(new Error('No se encontró el contenedor principal.'));
    
    container.innerHTML = '';
    this.questions.forEach((q, idx) => {
      const questionEl = document.createElement('div');
      questionEl.className = 'question';
      questionEl.dataset.index = idx;
      questionEl.innerHTML = `
        <div class="question-text mathjax">${q.text}</div>
        ${q.inputType === 'text'
          ? `<input type="text" class="answer-input" />`
          : `<select class="answer-input">
              ${(q.options || []).map(opt => `<option value="${opt}">${opt}</option>`).join('')}
            </select>`}
        <div class="feedback hidden"></div>
      `;
      container.appendChild(questionEl);
    });

    document.getElementById('submit-exam').classList.remove('hidden');
    this.safeRenderMathJax([container]);
  }

  evaluateExam() {
    const container = document.getElementById('quiz-container');
    if (!container) return;

    const questionEls = container.querySelectorAll('.question');
    this.score = 0;

    questionEls.forEach((questionEl, idx) => {
      const userInput = questionEl.querySelector('.answer-input')?.value ?? '';
      const question = this.questions[idx];
      const result = this.evaluateSolution(userInput, question.solution, question.params || {});

      if (result.isValid) this.score++;

      this.showFeedback(questionEl, result.isValid, question.solution, question.steps);
    });

    document.getElementById('submit-exam').classList.add('hidden');
    if (this.config.grading.allowRetry) {
      document.getElementById('retry-exam')?.classList.remove('hidden');
    }
    this.showFinalResult();
  }

  evaluateSolution(userInput, expectedSolution, params) {
    try {
      if (!userInput || userInput.trim().length < 2) {
        throw new Error("Expresión demasiado corta");
      }

      userInput = userInput.trim().replace(/^['"]|['"]$/g, '');
      const scope = { ...params };
      let maxError = 0;
      let validPoints = 0;

      const points = this.config.testPoints || DEFAULT_TEST_POINTS;
      const tolerance = this.config.tolerance || DEFAULT_TOLERANCE;

      for (const x of points) {
        try {
          scope.x = x;
          const userVal = math.evaluate(userInput, scope);
          const expectedVal = math.evaluate(expectedSolution, scope);

          if (!isFinite(userVal) || !isFinite(expectedVal)) continue;

          const error = Math.abs(userVal - expectedVal) / (1 + Math.abs(expectedVal));
          maxError = Math.max(maxError, error);
          validPoints++;
        } catch (e) {
          continue;
        }
      }

      if (validPoints === 0) throw new Error("No se pudo evaluar en ningún punto");
      if (validPoints < points.length * 0.6) throw new Error("Solo se evaluó en algunos puntos");

      return {
        isValid: maxError < tolerance,
        error: maxError < tolerance ? null : `Error máximo: ${maxError.toExponential(2)}`,
        maxError,
        pointsTested: validPoints
      };
    } catch (e) {
      return {
        isValid: false,
        error: e.message,
        pointsTested: 0
      };
    }
  }

  showFeedback(questionEl, isCorrect, correctSolution = '', steps = []) {
    const feedbackEl = questionEl.querySelector('.feedback');
    if (!feedbackEl) return;

    feedbackEl.innerHTML = isCorrect
      ? '✅ ¡Correcto!'
      : `❌ Incorrecto. ${correctSolution ? `<br>Solución esperada: <span class="mathjax">${correctSolution}</span>` : ''}
          ${steps.length ? this.renderSolutionSteps(steps) : ''}`;
    feedbackEl.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
    feedbackEl.classList.remove('hidden');

    this.safeRenderMathJax([feedbackEl]);
  }

  renderSolutionSteps(steps) {
    if (!steps.length) return '';
    return `
      <div class="solution-steps">
        <strong>Pasos de solución:</strong>
        ${steps.map(step => `<div class="mathjax">${step}</div>`).join('')}
      </div>
    `;
  }

  showFinalResult() {
    const resultEl = document.getElementById('exam-result');
    if (!resultEl) return;

    const percentage = (this.score / this.questions.length * 100).toFixed(1);
    resultEl.innerHTML = `
      <h2>Resultado Final</h2>
      <p>Obtuviste <strong>${this.score} de ${this.questions.length}</strong> (${percentage}%)</p>
      ${this.score >= this.questions.length * (this.config.grading.passingScore || 0.7)
        ? '<p class="pass">¡Aprobado!</p>'
        : '<p class="fail">Inténtalo nuevamente.</p>'}
    `;
    resultEl.classList.remove('hidden');
    this.safeRenderMathJax([resultEl]);
  }

  safeRenderMathJax(elements = []) {
    if (!window.MathJax) {
      if (this.mathJaxRetryCount < 5) {
        setTimeout(() => {
          this.mathJaxRetryCount++;
          this.safeRenderMathJax(elements);
        }, 500);
      }
      return;
    }

    if (this.isSafari) {
      document.querySelectorAll('.mathjax').forEach(el => {
        el.style.display = 'inline-block';
      });
    }

    MathJax.typesetPromise(elements).catch(e => console.error("MathJax render error:", e));
  }

  applyMobileStyles() {
    if (!this.isMobile) return;

    const style = document.createElement('style');
    style.textContent = `
      .question {
        padding: 12px;
        margin: 10px 0;
      }
      .answer-input {
        font-size: 16px;
        padding: 8px;
        width: 95%;
      }
      button {
        font-size: 16px;
        padding: 10px;
        margin-top: 8px;
      }
      .mathjax {
        font-size: 1.1em;
      }
    `;
    document.head.appendChild(style);
  }

  setupEventListeners() {
    document.getElementById('submit-exam')?.addEventListener('click', () => this.evaluateExam());
    document.getElementById('retry-exam')?.addEventListener('click', () => {
      this.generateExam();
      document.getElementById('submit-exam').classList.remove('hidden');
      document.getElementById('retry-exam').classList.add('hidden');
    });
    document.getElementById('new-exam')?.addEventListener('click', () => {
      this.generateExam();
      document.getElementById('submit-exam').classList.remove('hidden');
      document.getElementById('retry-exam').classList.add('hidden');
    });
  }

  showError(error) {
    const container = document.getElementById('quiz-container') || document.body;
    container.innerHTML = `
      <div class="error">
        <h2>Error al cargar el examen</h2>
        <p>${error.message}</p>
        <button onclick="window.location.reload()">Recargar</button>
      </div>
    `;
  }
}

const examen = new EDExamen(config);
window.addEventListener('DOMContentLoaded', () => examen.start());

export default EDExamen;
