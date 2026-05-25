/* ═══════════════════════════════════════════════
   MOODIFY AI — Frontend Application Logic
   ═══════════════════════════════════════════════ */

const API_BASE = "http://localhost:8000";

// ── State ────────────────────────────────────────
let sessionId = null;
let messageCount = 0;
let currentAudio = null;
let currentPreviewTrack = null;

const MOOD_EMOJIS = {
  melancholic: "🌧️", euphoric: "✨", serene: "🌊", dreamy: "🌙",
  mellow: "🍵", introspective: "🔍", "pump-up": "🔥", "feel-good": "😊",
  angsty: "⚡", intense: "🎸", focused: "🎯", balanced: "⚖️",
  "chill-happy": "🌻", somber: "🖤", lonely: "🕯️",
  happy: "😊", sad: "😢", anxious: "😰", calm: "😌",
  excited: "🤩", tired: "😴", nostalgic: "🌅", restless: "😤",
};

// ── Screen Management ────────────────────────────
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  const el = document.getElementById(id);
  el.classList.remove("hidden");
  // Re-trigger animation
  el.style.animation = "none";
  el.offsetHeight; // reflow
  el.style.animation = "";
}

// ── Session Start ────────────────────────────────
async function startSession() {
  const btn = document.getElementById("btn-start");
  btn.disabled = true;
  btn.innerHTML = `<span>Starting...</span>`;

  try {
    const res = await fetch(`${API_BASE}/api/session/new`, { method: "POST" });
    const data = await res.json();
    sessionId = data.session_id;

    showScreen("screen-chat");

    // Display opening message
    appendMessage("assistant", data.message);
    updateProgress(5);

  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = `<span>Start the vibe check</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
    showError("Could not connect to Moodify server. Make sure the backend is running on port 8000.");
  }
}

// ── Send Message ─────────────────────────────────
async function sendMessage() {
  const input = document.getElementById("chat-input");
  const text = input.value.trim();
  if (!text || !sessionId) return;

  const sendBtn = document.getElementById("send-btn");
  sendBtn.disabled = true;
  input.value = "";
  autoResize(input);

  messageCount++;
  appendMessage("user", text);
  updateProgress(Math.min(90, messageCount * 12));

  // Typing indicator
  const typingId = showTyping();

  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        message: text,
        history: [],
      }),
    });

    const data = await res.json();
    removeTyping(typingId);

    if (data.is_complete && data.mood_profile) {
      appendMessage("assistant", data.reply);
      updateProgress(100);
      setTimeout(() => transitionToAnalysis(data.mood_profile), 1200);
    } else {
      appendMessage("assistant", data.reply);
    }

  } catch (err) {
    removeTyping(typingId);
    appendMessage("assistant", "Hmm, something went wrong on my end. Mind trying that again?");
  }

  sendBtn.disabled = false;
  input.focus();
}

// ── Transition to Analysis ────────────────────────
async function transitionToAnalysis(moodProfile) {
  showScreen("screen-analysis");
  animateAnalysisSteps(async () => {
    await loadResults(moodProfile);
  });
}

async function animateAnalysisSteps(callback) {
  const steps = [
    { stepEl: document.getElementById("step-1"), delay: 800 },
    { stepEl: document.getElementById("step-2"), delay: 1600 },
    { stepEl: document.getElementById("step-3"), delay: 2400 },
  ];

  for (let i = 0; i < steps.length; i++) {
    await sleep(steps[i].delay - (i > 0 ? steps[i - 1].delay : 0));
    const dot = steps[i].stepEl.querySelector(".step-dot");
    if (i > 0) {
      const prevDot = steps[i - 1].stepEl.querySelector(".step-dot");
      prevDot.classList.remove("active");
      prevDot.classList.add("done");
      steps[i - 1].stepEl.classList.remove("active");
    }
    dot.classList.add("active");
    steps[i].stepEl.classList.add("active");
  }

  await sleep(900);
  if (callback) await callback();
}

// ── Load Results ─────────────────────────────────
async function loadResults(moodProfile) {
  showScreen("screen-results");
  renderMoodCard(moodProfile);

  // Fetch Spotify recommendations
  try {
    const res = await fetch(`${API_BASE}/api/recommendations/${sessionId}?limit=20`);
    const data = await res.json();

    document.getElementById("playlist-title").textContent = data.playlist_title || "Your Playlist";
    document.getElementById("playlist-desc").textContent = data.playlist_description || "";

    if (data.tracks && data.tracks.length > 0) {
      renderTracks(data.tracks);
      document.getElementById("no-spotify-msg").classList.add("hidden");
    } else {
      showNoSpotify(moodProfile);
    }
  } catch {
    showNoSpotify(moodProfile);
  }
}

// ── Render Mood Card ──────────────────────────────
function renderMoodCard(profile) {
  const primaryMood = profile.primary_mood || "balanced";
  const secondaryMood = profile.secondary_mood || "";
  const emoji = MOOD_EMOJIS[primaryMood.toLowerCase()] || MOOD_EMOJIS[secondaryMood.toLowerCase()] || "🎵";

  document.getElementById("result-emoji").textContent = emoji;
  document.getElementById("result-primary-mood").textContent = primaryMood;
  document.getElementById("result-secondary-mood").textContent = secondaryMood;
  document.getElementById("result-summary").textContent = profile.emotional_state_summary || "";
  document.getElementById("vibe-value").textContent = profile.recommended_vibe || primaryMood;

  // Metrics
  const energy = Math.max(0, Math.min(10, parseInt(profile.energy_level) || 5));
  const stress  = Math.max(0, Math.min(10, parseInt(profile.stress_level) || 5));

  requestAnimationFrame(() => {
    document.getElementById("metric-energy").style.width = `${energy * 10}%`;
    document.getElementById("metric-stress").style.width  = `${stress * 10}%`;
    document.getElementById("metric-energy-val").textContent = `${energy}/10`;
    document.getElementById("metric-stress-val").textContent  = `${stress}/10`;
  });

  // Tags: genres + activity + sentiment
  const tags = document.getElementById("mood-tags");
  tags.innerHTML = "";
  const tagItems = [
    ...(profile.preferred_genres || []).slice(0, 3),
    profile.activity || "",
    profile.sentiment || "",
    profile.preferred_tempo || "",
  ].filter(Boolean);

  tagItems.forEach(tag => {
    const el = document.createElement("span");
    el.className = "mood-tag";
    el.textContent = tag;
    tags.appendChild(el);
  });
}

// ── Render Tracks ─────────────────────────────────
function renderTracks(tracks) {
  const grid = document.getElementById("tracks-grid");
  grid.innerHTML = "";

  tracks.forEach((track, idx) => {
    const card = document.createElement("div");
    card.className = "track-card";
    card.style.animationDelay = `${idx * 60}ms`;

    const imgHtml = track.image_url
      ? `<img class="track-image" src="${track.image_url}" alt="${escHtml(track.name)}" loading="lazy"/>`
      : `<div class="track-image-placeholder">🎵</div>`;

    const durationSec = Math.round((track.duration_ms || 0) / 1000);
    const mins = Math.floor(durationSec / 60);
    const secs = (durationSec % 60).toString().padStart(2, "0");

    card.innerHTML = `
      ${imgHtml}
      <a class="track-spotify-link" href="${track.external_url}" target="_blank" rel="noopener" title="Open in Spotify">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.434-5.305-1.76-8.786-.963-.335.077-.67-.133-.746-.469-.077-.336.132-.67.469-.746 3.809-.87 7.077-.496 9.713 1.115.293.18.386.563.207.856zm1.223-2.723c-.226.367-.706.482-1.072.257-2.687-1.652-6.785-2.131-9.965-1.166-.413.127-.848-.104-.974-.517-.127-.413.104-.848.517-.974 3.632-1.102 8.147-.568 11.238 1.328.366.226.48.707.256 1.072zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71c-.493.15-1.016-.129-1.166-.623-.149-.495.13-1.016.624-1.166 3.532-1.073 9.404-.866 13.115 1.337.445.264.59.838.327 1.282-.264.443-.838.59-1.283.326z"/>
        </svg>
      </a>
      <div class="track-info">
        <div class="track-name" title="${escHtml(track.name)}">${escHtml(track.name)}</div>
        <div class="track-artist" title="${escHtml(track.artist)}">${escHtml(track.artist)}</div>
        <div class="track-actions">
          ${track.preview_url
            ? `<button class="track-play" onclick="playPreview(event,'${escHtml(track.preview_url)}','${escHtml(track.name)}','${escHtml(track.artist)}')" title="Preview">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
               </button>`
            : `<button class="track-play" style="opacity:0.35;cursor:default" title="No preview">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
               </button>`
          }
          <span class="track-popularity">${mins}:${secs}</span>
        </div>
      </div>`;

    grid.appendChild(card);
  });
}

// ── Audio Preview ─────────────────────────────────
function playPreview(event, url, name, artist) {
  event.stopPropagation();
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (currentPreviewTrack === url) {
    currentPreviewTrack = null;
    hidePreviewBar();
    return;
  }
  currentPreviewTrack = url;
  currentAudio = new Audio(url);
  currentAudio.volume = 0.7;
  currentAudio.play();
  currentAudio.onended = hidePreviewBar;
  showPreviewBar(name, artist);
}

function showPreviewBar(name, artist) {
  let bar = document.getElementById("preview-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "preview-bar";
    bar.className = "preview-bar";
    bar.innerHTML = `
      <div class="preview-equalizer">
        <div class="eq-bar"></div><div class="eq-bar"></div>
        <div class="eq-bar"></div><div class="eq-bar"></div>
      </div>
      <div>
        <div class="preview-track-name" id="preview-name"></div>
        <div class="preview-artist" id="preview-artist"></div>
      </div>
      <button class="preview-stop" onclick="stopPreview()" title="Stop">
        <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
      </button>`;
    document.body.appendChild(bar);
  }
  bar.classList.remove("hidden");
  document.getElementById("preview-name").textContent = name;
  document.getElementById("preview-artist").textContent = artist;
}

function hidePreviewBar() {
  const bar = document.getElementById("preview-bar");
  if (bar) bar.classList.add("hidden");
  currentPreviewTrack = null;
}

function stopPreview() {
  if (currentAudio) { currentAudio.pause(); currentAudio = null; }
  hidePreviewBar();
}

// ── No Spotify Fallback ───────────────────────────
function showNoSpotify(profile) {
  document.getElementById("tracks-grid").innerHTML = "";
  const noSpotify = document.getElementById("no-spotify-msg");
  noSpotify.classList.remove("hidden");

  document.getElementById("playlist-title").textContent = "Your Mood Profile";
  document.getElementById("playlist-desc").textContent = "Configure Spotify credentials to get song recommendations.";

  const preview = document.getElementById("mood-json-preview");
  preview.textContent = JSON.stringify(profile, null, 2);
}

// ── Utility: Append Message ───────────────────────
function appendMessage(role, content) {
  const container = document.getElementById("messages-inner");
  const msg = document.createElement("div");
  msg.className = `message ${role}`;

  const initial = role === "assistant" ? "M" : "U";
  msg.innerHTML = `
    <div class="msg-avatar">${initial}</div>
    <div class="msg-bubble">${escHtml(content)}</div>`;

  container.appendChild(msg);
  scrollToBottom();
}

// ── Typing Indicator ──────────────────────────────
function showTyping() {
  const id = "typing-" + Date.now();
  const container = document.getElementById("messages-inner");
  const el = document.createElement("div");
  el.className = "message assistant";
  el.id = id;
  el.innerHTML = `
    <div class="msg-avatar">M</div>
    <div class="msg-bubble">
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>`;
  container.appendChild(el);
  scrollToBottom();
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// ── Progress Bar ──────────────────────────────────
function updateProgress(pct) {
  document.getElementById("progress-fill").style.width = `${pct}%`;
}

// ── Restart ───────────────────────────────────────
function restartSession() {
  sessionId = null;
  messageCount = 0;
  if (currentAudio) { currentAudio.pause(); currentAudio = null; }
  hidePreviewBar();
  document.getElementById("messages-inner").innerHTML = "";
  document.getElementById("tracks-grid").innerHTML = `
    <div class="tracks-loading">
      <div class="tracks-spinner"></div>
      <p>Loading tracks from Spotify...</p>
    </div>`;
  document.getElementById("no-spotify-msg").classList.add("hidden");
  showScreen("screen-landing");
  const btn = document.getElementById("btn-start");
  btn.disabled = false;
  btn.innerHTML = `<span>Start the vibe check</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
}

// ── Keyboard Handler ──────────────────────────────
function handleKeyDown(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

// ── Auto-resize Textarea ──────────────────────────
function autoResize(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 160) + "px";
}

// ── Scroll to Bottom ──────────────────────────────
function scrollToBottom() {
  const container = document.getElementById("messages-container");
  if (container) {
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 50);
  }
}

// ── Error Toast ───────────────────────────────────
function showError(msg) {
  const toast = document.createElement("div");
  toast.style.cssText = `
    position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
    background:#1a0000;border:1px solid rgba(239,68,68,0.4);
    color:#fca5a5;padding:12px 24px;border-radius:50px;
    font-size:.875rem;z-index:999;animation:fadeIn .3s ease;`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ── Helpers ───────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
