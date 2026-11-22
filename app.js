/* app.js — English Advanced Grammar Quiz */

const TOTAL_QUESTIONS = 20;
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

// ── State ────────────────────────────────────────────────────
let questions = [];   // full pool loaded from JSON
let session   = [];   // 20 randomly selected questions
let current   = 0;    // 0-based index into session
let score     = 0;
let answered  = false;

// ── DOM refs ─────────────────────────────────────────────────
const pages = {
  welcome:  document.getElementById('page-welcome'),
  question: document.getElementById('page-question'),
  done:     document.getElementById('page-done'),
};

const qCounter    = document.getElementById('q-counter');
const qScore      = document.getElementById('q-score');
const progressBar = document.getElementById('progress-bar');
const qTopic      = document.getElementById('q-topic');
const qText       = document.getElementById('q-text');
const optionsEl   = document.getElementById('options-container');
const feedbackArea = document.getElementById('feedback-area');
const feedbackBox  = document.getElementById('feedback-box');
const btnNext      = document.getElementById('btn-next');

// ── Page helpers ─────────────────────────────────────────────
function showPage(name) {
  Object.values(pages).forEach(p => p.classList.remove('active'));
  pages[name].classList.add('active');
}

// ── Load questions ───────────────────────────────────────────
async function loadQuestions() {
  const res  = await fetch('questions.json');
  questions  = await res.json();
}

// ── Fisher-Yates shuffle ──────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Start session ─────────────────────────────────────────────
function startSession() {
  session  = shuffle(questions).slice(0, TOTAL_QUESTIONS);
  current  = 0;
  score    = 0;
  answered = false;
  showPage('question');
  renderQuestion();
}

// ── Render question ───────────────────────────────────────────
function renderQuestion() {
  answered = false;
  feedbackArea.classList.add('hidden');

  const q   = session[current];
  const num = current + 1;

  // header
  qCounter.textContent = `Question ${num} / ${TOTAL_QUESTIONS}`;
  qScore.textContent   = `Score: ${score}`;
  progressBar.style.width = `${(num - 1) / TOTAL_QUESTIONS * 100}%`;
  qTopic.textContent   = q.topic;

  // question text
  qText.textContent = q.question;

  // options
  optionsEl.innerHTML = '';
  const opts = shuffle(q.options);   // randomise option order each time

  opts.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = `
      <span class="option-letter">${LETTERS[i]}</span>
      <span class="option-text">${opt}</span>
    `;
    btn.addEventListener('click', () => handleAnswer(opt, btn, opts));
    optionsEl.appendChild(btn);
  });
}

// ── Handle answer ─────────────────────────────────────────────
function handleAnswer(chosen, clickedBtn, opts) {
  if (answered) return;
  answered = true;

  const q       = session[current];
  const correct = q.correct_answer;
  const isRight = chosen === correct;

  if (isRight) score++;

  // mark all buttons
  const allBtns = optionsEl.querySelectorAll('.option-btn');
  allBtns.forEach((btn, i) => {
    btn.disabled = true;
    if (opts[i] === correct)      btn.classList.add('correct');
    else if (opts[i] === chosen)  btn.classList.add('wrong');
  });

  // feedback bar
  feedbackBox.className = 'feedback-box ' + (isRight ? 'ok' : 'bad');
  if (isRight) {
    feedbackBox.textContent = '✓ Correct!';
  } else {
    feedbackBox.textContent = `✗ Incorrect — the correct answer is: "${correct}"`;
  }

  btnNext.textContent = current < TOTAL_QUESTIONS - 1 ? 'Next →' : 'See Results';
  feedbackArea.classList.remove('hidden');
}

// ── Next question / finish ────────────────────────────────────
btnNext.addEventListener('click', () => {
  current++;
  if (current < TOTAL_QUESTIONS) {
    renderQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    showCompletion();
  }
});

// ── Completion page ───────────────────────────────────────────
function showCompletion() {
  const pct = score / TOTAL_QUESTIONS;

  let emoji, msg;
  if (pct === 1)        { emoji = '🏆'; msg = 'Perfect score! Outstanding performance!'; }
  else if (pct >= 0.9)  { emoji = '🎉'; msg = 'Excellent! You\'re nearly flawless!'; }
  else if (pct >= 0.75) { emoji = '👏'; msg = 'Great job! Solid command of English grammar.'; }
  else if (pct >= 0.5)  { emoji = '📚'; msg = 'Good effort — keep practising to improve!'; }
  else                  { emoji = '💪'; msg = 'Don\'t give up — review the topics and try again!'; }

  document.getElementById('done-emoji').textContent   = emoji;
  document.getElementById('done-score-num').textContent = score;
  document.getElementById('done-msg').textContent     = msg;

  const wrong = TOTAL_QUESTIONS - score;
  document.getElementById('done-breakdown').innerHTML =
    `<span class="ok">✓ Correct: ${score}</span><br>` +
    `<span class="bad">✗ Incorrect: ${wrong}</span><br>` +
    `Percentage: ${Math.round(pct * 100)}%`;

  // update progress bar to 100 %
  progressBar.style.width = '100%';

  showPage('done');
}

// ── Restart ───────────────────────────────────────────────────
document.getElementById('btn-restart').addEventListener('click', startSession);

// ── Boot ─────────────────────────────────────────────────────
document.getElementById('btn-start').addEventListener('click', startSession);

loadQuestions().catch(err => {
  document.body.innerHTML =
    `<div style="padding:2rem;color:red;font-family:sans-serif;">
       <strong>Error loading questions:</strong> ${err.message}<br>
       Make sure <code>questions.json</code> is in the same folder as <code>index.html</code>.
     </div>`;
});
