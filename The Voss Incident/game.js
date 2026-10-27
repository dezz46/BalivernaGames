// GAME SETUP — update these values and the act details for each new game.
// Use a new storageKey for a new game, so old saved progress doesn't carry over.
const gameConfig = {
  gameName: "THE VOSS INCIDENT",
  storageKey: "the-voss-incident-game-v1",
  logo: "assets/logo.png",
  titleTop: "Find your way",
  titleBottom: "out.",
  intro: "Enter your answer to unlock the next act.",
  finishLineOne: "ALL CHALLENGES COMPLETE",
  finishLineTwo: "You figured it out.",
  finishLineThree: "Dr. Voss was right after all. The cure seems to be working, and there may still be time to save everyone.",
  moreGamesText: "Ready for another challenge?",
  moreGamesButton: "EXPLORE MORE GAMES",
  moreGamesUrl: "https://example.com/games"
};

// Keep the same fields for every act. Answers can be one string or an array of accepted answers.
// Add or replace each act's clue, answer, hint, and transparent PNG path here.
const gameActs = [
  { title: "The Stopped Clock", clue: "The hands have stopped at midnight. What do you call the device that measures time?", answer: "CLOCK", hint: "Look at the object mentioned in the clue, not the time on its hands.", art: "assets/act-01.png" },
  { title: "The Safe", clue: "A four-digit code is scratched into the desk: 4172. Enter the number to open the safe.", answer: "4172", hint: "The code is already written down. Check the desk carefully.", art: "assets/act-02.png" },
  { title: "The Painted Door", clue: "A note says: “Look for the color of leaves in spring.” Enter the color.", answer: "GREEN", hint: "Think of the usual color of fresh leaves.", art: "assets/act-03.png" },
  { title: "The Constellation", clue: "A note reads: 'The hunter watches from above.' Name the constellation.", answer: "ORION", hint: "Look for the famous constellation named after a hunter in Greek mythology.", art: "assets/act-04.png" },
  { title: "The Final Note", clue: "A note reads TWENTY-THREE. Enter the number in digits.", answer: ["23", "TWENTY-THREE", "TWENTY THREE"], hint: "Write the words as numerals.", art: "assets/act-05.png" },
  { title: "The Exit", clue: "Six acts brought you here. Enter the number of acts to unlock the door.", answer: "6", hint: "Count the acts in this game.", art: "assets/act-06.png" }
];

const actsRoot = document.querySelector("#acts");
const startScreen = document.querySelector("#start-screen");
const gameScreen = document.querySelector("#game-screen");
const timerDisplay = document.querySelector("#timer");
const hintDialog = document.querySelector("#hint-dialog");
const hintCopy = document.querySelector("#hint-copy");
const storageKey = `room-escape:${gameConfig.storageKey}`;
const resetParams = new URLSearchParams(location.search);
if (resetParams.has("res") || resetParams.get("reset") === "1") {
  try { localStorage.removeItem(storageKey); } catch {}
  location.replace(location.pathname);
}
let startedAt = null;
let completedAt = null;
let timerInterval = null;
const solved = new Set();
let viewIndex = 0;

try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
  if (saved && Number.isFinite(saved.startedAt)) {
    startedAt = saved.startedAt;
    completedAt = Number.isFinite(saved.completedAt) ? saved.completedAt : null;
    const solvedCount = Math.max(0, Math.min(gameActs.length, Number(saved.solvedCount) || 0));
    for (let i = 0; i < solvedCount; i++) solved.add(i);
    viewIndex = solvedCount;
  }
} catch {
  // The game still works for this visit if browser storage is unavailable.
}

function saveGame() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ startedAt, completedAt, solvedCount: solved.size }));
  } catch {
    // The timer will continue in this tab if browser storage is unavailable.
  }
}

function updateTimer() {
  if (!startedAt) return;
  const elapsedSeconds = Math.max(0, Math.floor(((completedAt || Date.now()) - startedAt) / 1000));
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  const pad = value => String(value).padStart(2, "0");
  timerDisplay.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function runTimer() {
  updateTimer();
  if (!completedAt && !timerInterval) timerInterval = setInterval(updateTimer, 1000);
}

document.querySelector(".brand").addEventListener("click", event => {
  event.preventDefault();
  viewIndex = 0;
  renderActs();
  actsRoot.scrollIntoView({ behavior: "smooth", block: "center" });
});
document.querySelector("#start-button").addEventListener("click", () => {
  if (!startedAt) {
    startedAt = Date.now();
    saveGame();
  }
  startScreen.hidden = true;
  gameScreen.hidden = false;
  renderActs();
  runTimer();
});

document.querySelector("#hint-button").addEventListener("click", () => hintDialog.showModal());
document.querySelector("#close-hint").addEventListener("click", () => hintDialog.close());
document.querySelector("#reveal-hint").addEventListener("click", () => {
  hintCopy.textContent = gameActs[solved.size]?.hint || "No hint is available for this act yet.";
  hintCopy.classList.add("revealed");
  hintCopy.hidden = false;
  document.querySelector("#reveal-hint").hidden = true;
  document.querySelector("#close-hint").textContent = "CLOSE";
});
hintDialog.addEventListener("close", () => {
  hintCopy.textContent = "";
  hintCopy.hidden = true;
  hintCopy.classList.remove("revealed");
  document.querySelector("#reveal-hint").hidden = false;
  document.querySelector("#close-hint").textContent = "MAYBE LATER";
});

document.title = `${gameConfig.gameName} — Escape Game`;
document.querySelector("#brand-name").textContent = gameConfig.gameName;
document.querySelector("#hero-title").innerHTML = `${gameConfig.titleTop}<br><em>${gameConfig.titleBottom}</em>`;
document.querySelector(".intro-copy").textContent = gameConfig.intro;
const logo = document.querySelector("#brand-logo");
logo.src = gameConfig.logo;
logo.addEventListener("load", () => {
  logo.classList.add("visible");
  document.querySelector("#brand-fallback").hidden = true;
});
logo.addEventListener("error", () => logo.classList.remove("visible"));

function renderActs() {
  const currentIndex = viewIndex;
  const sceneArt = document.querySelector("#scene-art");
  const artImage = document.querySelector("#act-art");
  if (currentIndex >= gameActs.length) {
    actsRoot.innerHTML = `<section class="complete show" aria-live="polite">
      <div class="escape-graphic" aria-hidden="true">
        <svg viewBox="0 0 180 140" role="presentation">
          <defs><radialGradient id="finish-glow"><stop stop-color="#c4f36a" stop-opacity=".48"/><stop offset="1" stop-color="#c4f36a" stop-opacity="0"/></radialGradient></defs>
          <circle class="finish-halo" cx="90" cy="72" r="68" fill="url(#finish-glow)"/>
          <path class="finish-rays" d="M90 7v11M35 24l8 8M145 24l-8 8M20 70h12M148 70h12"/>
          <rect x="45" y="18" width="90" height="108" rx="2" class="door-frame"/>
          <rect x="55" y="27" width="70" height="91" class="door-light"/>
          <g class="door-leaf"><rect x="55" y="27" width="70" height="91" rx="1"/><circle cx="111" cy="74" r="2.5"/></g>
          <g class="finish-sparkles"><circle cx="37" cy="51" r="2"/><circle cx="142" cy="43" r="2.5"/><circle cx="137" cy="98" r="1.8"/><circle cx="43" cy="101" r="1.5"/></g>
        </svg>
      </div>
      <p class="eyebrow">${gameConfig.finishLineOne}</p><h2>${gameConfig.finishLineTwo}</h2>
      <p class="finish-line-three">${gameConfig.finishLineThree}</p>
    </section>
    <section class="more-games"><p>${gameConfig.moreGamesText}</p><a href="${gameConfig.moreGamesUrl}" target="_blank" rel="noopener">${gameConfig.moreGamesButton}<span aria-hidden="true"> ↗</span></a></section>`;
    sceneArt.hidden = true;
  } else {
    const act = gameActs[currentIndex];
    const isSolved = solved.has(currentIndex);
    const answerContent = isSolved
      ? `<button class="continue-button" type="button" id="return-current">RETURN TO CURRENT ACT</button>`
      : `<form class="answer-row" data-act="${currentIndex}"><input aria-label="Answer for act ${currentIndex + 1}" autocomplete="off" autocapitalize="characters" placeholder="TYPE YOUR ANSWER"><button type="submit">CHECK</button></form><p class="feedback" aria-live="polite"></p>`;
    actsRoot.innerHTML = `<article class="act active" id="act-${currentIndex + 1}" aria-label="Act ${currentIndex + 1} of ${gameActs.length}">
      <div class="act-head"><span class="act-number">ACT 0${currentIndex + 1}</span><span class="act-status">${isSolved ? "SOLVED" : "UNLOCKED"}</span></div>
      <h2>${act.title}</h2><p class="clue">${act.clue}</p>${answerContent}
    </article>`;
    if (isSolved) {
      actsRoot.querySelector("#return-current").addEventListener("click", () => {
        viewIndex = solved.size;
        renderActs();
        actsRoot.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    } else {
      actsRoot.querySelector(".answer-row").addEventListener("submit", checkAnswer);
    }
    sceneArt.hidden = false;
    artImage.hidden = !act.art;
    if (act.art) artImage.src = act.art;
  }
  updateProgress();
}
function checkAnswer(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const index = Number(form.dataset.act);
  const field = form.querySelector("input");
  const feedback = form.nextElementSibling;
  const clean = value => value.trim().replace(/\s+/g, " ").toLocaleUpperCase();
  const acceptedAnswers = Array.isArray(gameActs[index].answer) ? gameActs[index].answer : [gameActs[index].answer];
  if (acceptedAnswers.some(answer => clean(field.value) === clean(answer))) {
    solved.add(index);
    viewIndex = solved.size;
    if (solved.size === gameActs.length) completedAt = Date.now();
    saveGame();
    renderActs();
    runTimer();
    if (solved.size < gameActs.length) {
      actsRoot.scrollIntoView({ behavior: "smooth", block: "center" });
      const nextInput = actsRoot.querySelector("input");
      if (nextInput) setTimeout(() => nextInput.focus({ preventScroll: true }), 300);
    }
  } else {
    feedback.textContent = "That doesn't fit. Take another look at the clue.";
    field.select();
  }
}

function updateProgress() {
  const count = solved.size;
  const isSolved = count === gameActs.length;
  const status = document.querySelector("#game-status");
  status.classList.toggle("solved", isSolved);
  status.classList.toggle("in-progress", !isSolved);
  document.querySelector("#game-status-text").textContent = isSolved ? "SOLVED GAME" : "GAME IN PROGRESS";
  document.querySelector("#hint-button").hidden = count === gameActs.length;
  document.querySelector("#progress-label").textContent = count === gameActs.length ? "ESCAPED" : `ACT ${count + 1} OF ${gameActs.length}`;
  document.querySelector("#progress-count").textContent = `${count} / ${gameActs.length} SOLVED`;
  document.querySelector("#progress-fill").style.width = `${count / gameActs.length * 100}%`;
}

if (startedAt) {
  startScreen.hidden = true;
  gameScreen.hidden = false;
  renderActs();
  runTimer();
}





