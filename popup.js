// --- ICONS ---
const PLAY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>`;
const PAUSE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/></svg>`;
const PREV_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-left-icon lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>`;
const NEXT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right-icon lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>`;

// --- STREAM DATA ---
const STREAMS = [
  { title: 'lofi hip hop radio 📚 beats to relax/study to', videoId: 'jfKfPfyJRdk' },
  { title: 'summer lofi radio ☀️ chill beats for sunny days', videoId: 'SXySxLgCV-8' },
  { title: 'jazz lofi radio 🎷 beats to chill/study to', videoId: 'HuFYqnbVbzY' },
  { title: 'asian lofi radio ⛩️ beats to relax/study to', videoId: 'Na0w3Mz46GA' },
  { title: 'synthwave radio 🌌 beats to chill/game to', videoId: '4xDzrJKXOOY' },
  { title: 'lofi hip hop radio - beats to study/relax to 🐾', videoId: '7NOSDKb0HlU' },
  { title: '🔴 Video Game Lofi & Chill Beats 🎮 24/7 Radio', videoId: 'GluJS2IAe_s' },
  { title: 'Coffee Shop Radio ☕ - 24/7 Chill Lo-Fi & Jazzy Beats', videoId: 'UI5NKkW8acM' },
  { title: 'Calming Lofi Rain 🌧️ Chill Beats for Focus, Study & Sleep', videoId: 'vYIYIVmOo3Q' },
  { title: 'Chillhop Radio - jazzy & lofi hip hop beats 🐾', videoId: '5yx6BWlEVcY' },
  { title: 'medieval lofi radio 🏰 - beats to scribe manuscripts to', videoId: 'IxPANmjPaek' },
  { title: 'dark ambient radio 🌃 music to escape/dream to', videoId: 'S_MOd40zlYU' }
];

const STREAMS_PER_PAGE = 3;
let currentPage = 1;

let workTime, breakTime, longBreakTime, remaining, sessionCount, currentPhase, lastPlayedVideoId;
let isPaused = true;
let isMusicPlaying = false;
let timerId = null;

let useLongBreaksForever = false;

// --- DOM ELEMENTS ---
const suggestionsContainer = document.getElementById('suggestions');
const pageIndicator = document.getElementById('pageIndicator');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const nowPlayingLabel = document.getElementById('nowPlayingLabel');
const nowPlayingTitle = document.getElementById('nowPlayingTitle');
const musicPlayPauseBtn = document.getElementById('musicPlayPauseBtn');
const timerDisplay = document.getElementById('timer');
const playPauseBtn = document.getElementById('playPauseBtn');
const resetBtn = document.getElementById('resetBtn');
const skipBtn = document.getElementById('skipBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const focusInput = document.getElementById('focusInput');
const shortBreakInput = document.getElementById('shortBreakInput');
const longBreakInput = document.getElementById('longBreakInput');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const focusTab = document.getElementById('focusTab');
const shortBreakTab = document.getElementById('shortBreakTab');
const longBreakTab = document.getElementById('longBreakTab');
const roundIndicatorsContainer = document.getElementById('roundIndicators');

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  for (let i = 0; i < 4; i++) {
    const indicator = document.createElement('div');
    indicator.className = 'round-indicator';
    roundIndicatorsContainer.appendChild(indicator);
  }

  if (Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      console.log('Notification permission:', permission);
    });
  }

  chrome.storage.local.get([
    'autoStart', 'dingEnabled', 'workTime', 'breakTime', 'longBreakTime', 'remaining', 'currentPhase', 'isPaused',
    'endTime', 'lastPlayedVideoId', 'sessionCount', 'isMusicPlaying'
  ], (data) => {
    document.getElementById('autoStartToggle').checked = data.autoStart ?? true;
    document.getElementById('dingToggle').checked = data.dingEnabled ?? true;
    workTime = data.workTime ?? 25 * 60;
    breakTime = data.breakTime ?? 5 * 60;
    longBreakTime = data.longBreakTime ?? 15 * 60;
    sessionCount = data.sessionCount ?? 0;
    currentPhase = data.currentPhase ?? 'focus';
    isPaused = data.isPaused ?? true;
    isMusicPlaying = data.isMusicPlaying ?? false;
    lastPlayedVideoId = data.lastPlayedVideoId || STREAMS[0].videoId;

    focusInput.value = workTime / 60;
    shortBreakInput.value = breakTime / 60;
    longBreakInput.value = longBreakTime / 60;

    if (data.endTime && !isPaused) {
      const timeDiff = Math.round((data.endTime - Date.now()) / 1000);
      remaining = Math.max(0, timeDiff);
    } else {
      remaining = data.remaining ?? workTime;
    }

    updateDisplay(remaining);
    updateNowPlaying();
    renderSuggestions();
    updatePageIndicator();
    updatePhaseTabsUI();

    playPauseBtn.innerHTML = isPaused ? PLAY_ICON : PAUSE_ICON;
    prevPageBtn.innerHTML = PREV_ICON;
    nextPageBtn.innerHTML = NEXT_ICON;
    updateMusicButton();

    if (!isPaused) playTimer();
  });

  playPauseBtn.addEventListener('click', () => isPaused ? playTimer() : pauseTimer());
  musicPlayPauseBtn.addEventListener('click', toggleMusic);
  resetBtn.addEventListener('click', resetTimer);
  skipBtn.addEventListener('click', () => switchPhase(false));
  settingsBtn.addEventListener('click', () => settingsPanel.classList.remove('hidden'));
  saveSettingsBtn.addEventListener('click', saveSettings);
  settingsPanel.addEventListener('click', (e) => e.target === settingsPanel && settingsPanel.classList.add('hidden'));

  prevPageBtn.addEventListener('click', () => changePage(-1));
  nextPageBtn.addEventListener('click', () => changePage(1));

  focusTab.addEventListener('click', () => selectPhase('focus', true));
  shortBreakTab.addEventListener('click', () => selectPhase('shortBreak', true));
  longBreakTab.addEventListener('click', () => selectPhase('longBreak', true));
});

STREAMS.forEach(stream => {
  const img = new Image();
  img.src = `https://i.ytimg.com/vi/${stream.videoId}/mqdefault.jpg`;
});

// --- PAGINATION ---
function changePage(direction) {
  const totalPages = Math.ceil(STREAMS.length / STREAMS_PER_PAGE);
  currentPage = Math.min(Math.max(1, currentPage + direction), totalPages);
  renderSuggestions();
  updatePageIndicator();
}

function updatePageIndicator() {
  const totalPages = Math.ceil(STREAMS.length / STREAMS_PER_PAGE);
  pageIndicator.textContent = `${currentPage} / ${totalPages}`;
}

// --- VIDEO SUGGESTIONS ---
function renderSuggestions() {
  suggestionsContainer.innerHTML = '';
  const start = (currentPage - 1) * STREAMS_PER_PAGE;
  const end = start + STREAMS_PER_PAGE;
  STREAMS.slice(start, end).forEach(stream => {
    const div = document.createElement('div');
    div.className = 'suggestion-item';
    div.classList.toggle('now-playing', stream.videoId === lastPlayedVideoId);
    div.innerHTML = `
      <div class="thumbnail-wrapper">
        <img src="https://i.ytimg.com/vi/${stream.videoId}/mqdefault.jpg" alt="${stream.title}">
      </div>
      <p>${stream.title}</p>
    `;
    div.addEventListener('click', () => loadVideo(stream.videoId));
    suggestionsContainer.appendChild(div);
  });
}

// --- MUSIC CONTROL ---
function loadVideo(videoId) {
  lastPlayedVideoId = videoId;
  chrome.storage.local.set({ lastPlayedVideoId });
  updateNowPlaying();
  if (isMusicPlaying) playMusic();
  renderSuggestions();
}

function playMusic() {
  isMusicPlaying = true;
  chrome.runtime.sendMessage({ action: 'play', videoId: lastPlayedVideoId });
  updateMusicButton();
  chrome.storage.local.set({ isMusicPlaying });
}

function pauseMusic() {
  isMusicPlaying = false;
  chrome.runtime.sendMessage({ action: 'pause' });
  updateMusicButton();
  chrome.storage.local.set({ isMusicPlaying });
}

function toggleMusic() {
  isMusicPlaying ? pauseMusic() : playMusic();
}

function updateMusicButton() {
  musicPlayPauseBtn.innerHTML = isMusicPlaying ? PAUSE_ICON : PLAY_ICON;
}

function updateNowPlaying() {
  const currentStream = STREAMS.find(stream => stream.videoId === lastPlayedVideoId);
  if (currentStream) {
    nowPlayingLabel.textContent = 'Now Playing:';
    nowPlayingTitle.textContent = currentStream.title;
  } else {
    nowPlayingLabel.textContent = '';
    nowPlayingTitle.textContent = '';
  }
}

// --- TIMER FUNCTIONS ---
function updateDisplay(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  timerDisplay.textContent = `${minutes}:${secs}`;
}

function playTimer() {
  if (remaining <= 0) return;
  isPaused = false;
  playPauseBtn.innerHTML = PAUSE_ICON;
  if (!isMusicPlaying) playMusic();

  const endTime = Date.now() + remaining * 1000;
  chrome.storage.local.set({ isPaused, endTime, currentPhase });

  timerId = setInterval(() => {
    remaining--;
    updateDisplay(remaining);
    if (remaining <= 0) {
      clearInterval(timerId);
      switchPhase(true);
    }
  }, 1000);
}

function pauseTimer() {
  isPaused = true;
  playPauseBtn.innerHTML = PLAY_ICON;
  clearInterval(timerId);
  chrome.storage.local.set({ isPaused, remaining });
  chrome.storage.local.remove('endTime');
}

function resetTimer() {
  sessionCount = 0;
  useLongBreaksForever = false;
  chrome.storage.local.set({ sessionCount });
  updateRoundIndicators();
  selectPhase('focus', true);
}

// Phase switching
function updatePhaseTabsUI() {
  focusTab.classList.toggle('active', currentPhase === 'focus');
  shortBreakTab.classList.toggle('active', currentPhase === 'shortBreak');
  longBreakTab.classList.toggle('active', currentPhase === 'longBreak');
}

function selectPhase(phase, isManual = false) {
  pauseTimer();
  currentPhase = phase;
  switch (phase) {
    case 'focus': remaining = workTime; break;
    case 'shortBreak': remaining = breakTime; break;
    case 'longBreak': remaining = longBreakTime; break;
  }
  chrome.storage.local.set({ remaining, currentPhase });
  updateDisplay(remaining);
  updatePhaseTabsUI();
}

function updateRoundIndicators() {
  const indicators = document.querySelectorAll('.round-indicator');
  const fillCount = sessionCount >= 4 ? 4 : sessionCount;
  indicators.forEach((indicator, index) => {
    indicator.classList.toggle('filled', index < fillCount);
  });
}

function showPhaseNotification(phase) {
  let title, message;
  switch (phase) {
    case 'focus':
      title = 'Focus Time';
      message = 'Let’s get back to work!';
      break;
    case 'shortBreak':
      title = 'Short Break';
      message = 'Take a quick rest.';
      break;
    case 'longBreak':
      title = 'Long Break';
      message = 'Time for a longer break!';
      break;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, { body: message, icon: 'icon128.png' });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(title, { body: message, icon: 'icon128.png' });
      }
    });
  }
}

function switchPhase() {
  chrome.storage.local.get(['autoStart', 'dingEnabled'], ({ autoStart = true, dingEnabled = true }) => {
    if (dingEnabled) {
      const ding = document.getElementById('dingSound');
      if (ding) {
        ding.currentTime = 0;
        ding.play();
      }
    }

    let nextPhase;
    if (currentPhase === 'focus') {
      sessionCount++;
      chrome.storage.local.set({ sessionCount });
      updateRoundIndicators();
      if (sessionCount % 4 === 0) {
        useLongBreaksForever = true;
      }
      nextPhase = useLongBreaksForever ? 'longBreak'
        : (sessionCount % 4 === 0 ? 'longBreak' : 'shortBreak');
    } else {
      nextPhase = 'focus';
    }

    selectPhase(nextPhase);
    if (autoStart) playTimer();
    showPhaseNotification(nextPhase);
  });
}

function saveSettings() {
  workTime = parseInt(focusInput.value, 10) * 60;
  breakTime = parseInt(shortBreakInput.value, 10) * 60;
  longBreakTime = parseInt(longBreakInput.value, 10) * 60;

  const autoStart = document.getElementById('autoStartToggle').checked;
  const dingEnabled = document.getElementById('dingToggle').checked;

  chrome.storage.local.set({
    workTime,
    breakTime,
    longBreakTime,
    autoStart,
    dingEnabled
  }, () => {
    settingsPanel.classList.add('hidden');
    if (isPaused) selectPhase(currentPhase);
  });
}
