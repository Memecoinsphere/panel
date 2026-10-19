/**
 * Hidden Control Panel — client-only UI.
 * Toggle states persist in localStorage for cosmetic effect only:
 * they do NOT affect the real device, OS, USB, sensors, Wi-Fi, clipboard, or notifications.
 */
(function () {
  "use strict";

  // ===== PASSCODE (change here) =====
  // Default secret for Aurélien's panel. Edit this const to change the unlock code.
  const PASSCODE = "6767";
  // ==================================

  const STORAGE_KEY = "hcp-toggles-v1";

  const DEFAULTS = {
    usbCRestricted: true,
    nativeDebugging: false,
    sensorsPermission: true,
    hideSensitiveNotifs: true,
    randomizeMac: true,
    clipboardAutoClear: true,
    showLayoutBounds: false,
    forceDarkMode: false,
    verboseLogging: false,
  };

  const lockScreen = document.getElementById("lock-screen");
  const panelScreen = document.getElementById("panel-screen");
  const passcodeInput = document.getElementById("passcode");
  const passcodeError = document.getElementById("passcode-error");
  const lockBtn = document.getElementById("lock-btn");

  function loadToggles() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULTS };
      return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch (_) {
      return { ...DEFAULTS };
    }
  }

  function saveToggles(state) {
    // Cosmetic-only: values are never sent anywhere and do not control hardware/OS.
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {
      /* ignore quota / private mode */
    }
  }

  function applyTogglesToUI(state) {
    document.querySelectorAll('input[type="checkbox"][data-key]').forEach((el) => {
      const key = el.getAttribute("data-key");
      if (key in state) el.checked = !!state[key];
    });
  }

  function readTogglesFromUI() {
    const state = { ...DEFAULTS };
    document.querySelectorAll('input[type="checkbox"][data-key]').forEach((el) => {
      const key = el.getAttribute("data-key");
      state[key] = !!el.checked;
    });
    return state;
  }

  function showPanel() {
    lockScreen.hidden = true;
    panelScreen.hidden = false;
    passcodeInput.value = "";
    passcodeError.hidden = true;
    applyTogglesToUI(loadToggles());
  }

  function showLock() {
    panelScreen.hidden = true;
    lockScreen.hidden = false;
    passcodeInput.value = "";
    passcodeError.hidden = true;
    // Defer focus so iOS keyboard behaves after unlock animation
    setTimeout(() => passcodeInput.focus(), 50);
  }

  function tryUnlock(value) {
    if (value === PASSCODE) {
      showPanel();
      return;
    }
    if (value.length >= PASSCODE.length) {
      passcodeError.hidden = false;
      passcodeInput.classList.remove("shake");
      // force reflow for restart
      void passcodeInput.offsetWidth;
      passcodeInput.classList.add("shake");
      passcodeInput.value = "";
    } else {
      passcodeError.hidden = true;
    }
  }

  passcodeInput.addEventListener("input", () => {
    // Keep digits only
    const digits = passcodeInput.value.replace(/\D/g, "");
    if (digits !== passcodeInput.value) passcodeInput.value = digits;
    tryUnlock(passcodeInput.value);
  });

  passcodeInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      tryUnlock(passcodeInput.value);
    }
  });

  document.querySelectorAll('input[type="checkbox"][data-key]').forEach((el) => {
    el.addEventListener("change", () => {
      saveToggles(readTogglesFromUI());
    });
  });

  lockBtn.addEventListener("click", () => {
    saveToggles(readTogglesFromUI());
    showLock();
  });

  // Start locked
  showLock();

  // PWA service worker (same-origin, app shell only)
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {
        /* offline / file:// — ignore */
      });
    });
  }
})();
