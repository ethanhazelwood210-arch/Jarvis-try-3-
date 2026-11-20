(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const views = ["dashboard", "assistant", "tools", "settings"];
  let recognition = null;
  let timerSeconds = 25 * 60;
  let timerInterval = null;
  let toastTimeout = null;

  function toast(message) {
    const el = $("toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => el.classList.remove("show"), 2600);
  }

  function navigate(view) {
    if (!views.includes(view)) return;
    views.forEach(name => {
      $(name + "View").classList.toggle("active", name === view);
      document.querySelector(`[data-view="${name}"]`).classList.toggle("active", name === view);
    });
    $("pageName").textContent = view.toUpperCase();
    $("sidebar").classList.remove("open");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.querySelectorAll("[data-view]").forEach(button => {
    button.addEventListener("click", () => navigate(button.dataset.view));
  });
  $("menuToggle").addEventListener("click", () => $("sidebar").classList.toggle("open"));
  $("heroStart").addEventListener("click", () => navigate("assistant"));
  $("profileButton").addEventListener("click", () => toast("Profile settings are not configured in this local demo."));

  function updateClock() {
    const now = new Date();
    $("clock").textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    $("timeStat").textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    $("datePill").textContent = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }).toUpperCase();
  }
  updateClock();
  setInterval(updateClock, 1000);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  $("voiceStat").textContent = SpeechRecognition ? "AVAILABLE" : "UNAVAILABLE";
  $("connectionText").textContent = "Interface ready";

  function addMessage(text, who = "assistant") {
    const wrapper = document.createElement("div");
    wrapper.className = `message ${who === "user" ? "user-message" : "assistant-message"}`;
    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = who === "user" ? "U" : "J";
    const body = document.createElement("div");
    const name = document.createElement("span");
    name.className = "message-name";
    name.textContent = who === "user" ? "YOU" : "JARVIS";
    const p = document.createElement("p");
    p.textContent = text;
    const time = document.createElement("small");
    time.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    body.append(name, p, time);
    wrapper.append(avatar, body);
    $("messages").append(wrapper);
    $("messages").scrollTop = $("messages").scrollHeight;
  }

  function speak(text) {
    if (!$("speechToggle").checked || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 0.95;
    window.speechSynthesis.speak(utterance);
  }

  function safeCalculate(expression) {
    const cleaned = expression.replace(/\s+/g, "");
    if (!cleaned || !/^[0-9+\-*/().%]+$/.test(cleaned)) throw new Error("Use numbers and basic operators only.");
    // Parse arithmetic without eval or Function.
    const tokens = cleaned.match(/\d+(?:\.\d+)?|[()+\-*/%]/g);
    if (!tokens || tokens.join("") !== cleaned) throw new Error("Invalid expression.");
    let index = 0;
    function primary() {
      const token = tokens[index++];
      if (token === "+") return primary();
      if (token === "-") return -primary();
      if (token === "(") {
        const value = sum();
        if (tokens[index++] !== ")") throw new Error("Missing closing bracket.");
        return value;
      }
      const n = Number(token);
      if (!Number.isFinite(n)) throw new Error("Invalid number.");
      return n;
    }
    function product() {
      let value = primary();
      while (["*", "/", "%"].includes(tokens[index])) {
        const op = tokens[index++];
        const rhs = primary();
        if ((op === "/" || op === "%") && rhs === 0) throw new Error("Cannot divide by zero.");
        value = op === "*" ? value * rhs : op === "/" ? value / rhs : value % rhs;
      }
      return value;
    }
    function sum() {
      let value = product();
      while (tokens[index] === "+" || tokens[index] === "-") {
        const op = tokens[index++];
        const rhs = product();
        value = op === "+" ? value + rhs : value - rhs;
      }
      return value;
    }
    const result = sum();
    if (index !== tokens.length || !Number.isFinite(result)) throw new Error("Invalid calculation.");
    return Number(result.toFixed(8)).toString();
  }

  function handleCommand(raw) {
    const command = raw.trim();
    const lower = command.toLowerCase();
    let response;
    if (!command) return;
    if (/\b(hello|hi|hey)\b/.test(lower)) response = "Hello. I'm ready when you are.";
    else if (lower.includes("time") || lower.includes("date")) response = `It is ${new Date().toLocaleString()}.`;
    else if (lower === "help" || lower.includes("what can you do")) response = "I can tell the time and date, open dashboard sections, calculate basic arithmetic, save notes, start a focus timer, and explain available demo commands.";
    else if (lower.includes("open") && lower.includes("tool")) { navigate("tools"); response = "Opening quick tools."; }
    else if (lower.includes("open") && lower.includes("setting")) { navigate("settings"); response = "Opening settings."; }
    else if (lower.includes("open") && lower.includes("dashboard")) { navigate("dashboard"); response = "Opening dashboard."; }
    else if (lower.includes("open") && (lower.includes("assistant") || lower.includes("console"))) { navigate("assistant"); response = "You're already in the assistant console."; }
    else if (lower.startsWith("calculate ") || lower.startsWith("what is ")) {
      const expression = command.replace(/^(calculate|what is)\s+/i, "").replace(/[?=]$/, "");
      try { response = `${expression} = ${safeCalculate(expression)}`; }
      catch (error) { response = error.message; }
    }
    else if (lower.includes("start") && lower.includes("timer")) { navigate("tools"); startTimer(); response = "Starting the 25-minute focus timer."; }
    else if (lower.includes("joke")) response = "Why did the developer go broke? Because they used up all their cache.";
    else response = "I don't have a built-in command for that yet. Try “help”, “what time is it”, “open tools”, or “calculate 12 * 4”.";
    addMessage(command, "user");
    addMessage(response, "assistant");
    speak(response);
  }

  $("chatForm").addEventListener("submit", event => {
    event.preventDefault();
    const value = $("chatInput").value;
    if (!value.trim()) return;
    $("chatInput").value = "";
    handleCommand(value);
  });
  document.querySelectorAll("[data-prompt]").forEach(button => button.addEventListener("click", () => handleCommand(button.dataset.prompt)));
  $("clearChat").addEventListener("click", () => {
    $("messages").replaceChildren();
    addMessage("Conversation cleared. What would you like to do?", "assistant");
  });

  function startVoice() {
    if (!SpeechRecognition) {
      toast("Voice recognition is not supported in this browser. Try a recent version of Chrome.");
      return;
    }
    if (recognition) { recognition.stop(); return; }
    recognition = new SpeechRecognition();
    recognition.lang = navigator.language || "en-GB";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => { $("micButton").classList.add("recording"); toast("Listening…"); };
    recognition.onresult = event => {
      const transcript = event.results[0][0].transcript;
      $("chatInput").value = transcript;
      handleCommand(transcript);
    };
    recognition.onerror = event => toast(`Voice input: ${event.error}`);
    recognition.onend = () => { recognition = null; $("micButton").classList.remove("recording"); };
    try { recognition.start(); } catch { toast("Could not start voice recognition."); }
  }
  $("micButton").addEventListener("click", startVoice);
  $("micPermissionInfo").addEventListener("click", () => toast(SpeechRecognition ? "Speech recognition is supported. Your browser may ask for microphone access when you start voice input." : "Speech recognition is not supported by this browser."));

  document.querySelectorAll("[data-action]").forEach(button => button.addEventListener("click", () => {
    const action = button.dataset.action;
    if (action === "time") { navigate("assistant"); handleCommand("What time is it?"); }
    if (action === "calculator") navigate("tools");
    if (action === "notes") { navigate("tools"); $("noteInput").focus(); }
    if (action === "help") { navigate("assistant"); handleCommand("Help"); }
  }));

  $("calculateButton").addEventListener("click", () => {
    try { $("calcResult").textContent = `Result: ${safeCalculate($("calcInput").value)}`; }
    catch (error) { $("calcResult").textContent = error.message; }
  });
  $("calcInput").addEventListener("keydown", event => { if (event.key === "Enter") $("calculateButton").click(); });

  $("noteInput").value = localStorage.getItem("jarvis-note") || "";
  $("saveNote").addEventListener("click", () => {
    localStorage.setItem("jarvis-note", $("noteInput").value);
    $("noteStatus").textContent = "Note saved on this device in this browser.";
    toast("Note saved.");
  });
  $("clearNote").addEventListener("click", () => {
    $("noteInput").value = "";
    localStorage.removeItem("jarvis-note");
    $("noteStatus").textContent = "Note cleared.";
  });

  function renderTimer() {
    const minutes = Math.floor(timerSeconds / 60).toString().padStart(2, "0");
    const seconds = (timerSeconds % 60).toString().padStart(2, "0");
    $("timerDisplay").textContent = `${minutes}:${seconds}`;
  }
  function startTimer() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
      timerSeconds = Math.max(0, timerSeconds - 1);
      renderTimer();
      if (timerSeconds === 0) {
        clearInterval(timerInterval); timerInterval = null;
        toast("Focus session complete.");
        if ("Notification" in window && Notification.permission === "granted") new Notification("JARVIS", { body: "Your focus session is complete." });
      }
    }, 1000);
    $("timerStart").textContent = "Pause";
  }
  $("timerStart").addEventListener("click", () => {
    if (timerInterval) {
      clearInterval(timerInterval); timerInterval = null; $("timerStart").textContent = "Resume";
    } else startTimer();
  });
  $("timerReset").addEventListener("click", () => {
    clearInterval(timerInterval); timerInterval = null; timerSeconds = 25 * 60;
    renderTimer(); $("timerStart").textContent = "Start";
  });
  renderTimer();

  $("speechToggle").addEventListener("change", event => {
    if (!event.target.checked && "speechSynthesis" in window) window.speechSynthesis.cancel();
  });
  $("compactToggle").addEventListener("change", event => document.body.classList.toggle("compact", event.target.checked));
  $("enableNotifications").addEventListener("click", async () => {
    if (!("Notification" in window)) return toast("Notifications are not supported here.");
    if (!window.isSecureContext) return toast("Notifications require HTTPS or localhost.");
    const permission = await Notification.requestPermission();
    toast(permission === "granted" ? "Notifications enabled." : "Notification permission not granted.");
    if (permission === "granted") new Notification("JARVIS", { body: "Notifications are enabled." });
  });
  $("clearData").addEventListener("click", () => {
    if (!confirm("Clear the note saved by this JARVIS demo?")) return;
    localStorage.removeItem("jarvis-note");
    $("noteInput").value = "";
    $("noteStatus").textContent = "Local note data cleared.";
    toast("Local data cleared.");
  });

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }
})();
