/* Headless screenshot helper: drives Edge/Chrome over the DevTools protocol
   using only Node's built-in http and a hand-rolled WebSocket client. */

const { spawn } = require("child_process");
const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const os = require("os");

const BROWSER = process.argv[2];
const URL_TO_OPEN = process.argv[3] || "http://127.0.0.1:8173/";
const OUT_DIR = process.argv[4] || path.join(__dirname, "..", "shots");
const PROFILE = path.join(os.tmpdir(), "hornet-shot-profile-" + Date.now());
const PORT = 9333;

const shots = [
  { name: "01-top", width: 1440, height: 950, scroll: 0 },
  { name: "02-about", width: 1440, height: 950, selector: "#about" },
  { name: "03-gallery", width: 1440, height: 950, selector: "#gallery" },
  { name: "04-game", width: 1440, height: 950, selector: "#game" },
  { name: "05-commissions", width: 1440, height: 950, selector: "#commissions" },
  { name: "06-contact", width: 1440, height: 950, selector: "#contact" },
  { name: "07-mobile", width: 430, height: 900, scroll: 0 }
];

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    }).on("error", reject);
  });
}

function waitForEndpoint(retries) {
  return getJson("http://127.0.0.1:" + PORT + "/json/version").catch((error) => {
    if (retries <= 0) {
      throw error;
    }
    return new Promise((resolve) => setTimeout(resolve, 400)).then(() => waitForEndpoint(retries - 1));
  });
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const target = new URL(wsUrl);
    const key = crypto.randomBytes(16).toString("base64");
    const request = http.request({
      hostname: target.hostname,
      port: target.port,
      path: target.pathname + target.search,
      headers: {
        Connection: "Upgrade",
        Upgrade: "websocket",
        "Sec-WebSocket-Key": key,
        "Sec-WebSocket-Version": "13"
      }
    });

    request.on("upgrade", (res, socket) => {
      socket.setNoDelay(true);
      resolve(makeClient(socket));
    });
    request.on("error", reject);
    request.end();
  });
}

function makeClient(socket) {
  let buffer = Buffer.alloc(0);
  let nextId = 1;
  const pending = new Map();
  const listeners = [];

  socket.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);

    while (buffer.length >= 2) {
      const first = buffer[0];
      const second = buffer[1];
      const masked = (second & 0x80) !== 0;
      let length = second & 0x7f;
      let offset = 2;

      if (length === 126) {
        if (buffer.length < 4) return;
        length = buffer.readUInt16BE(2);
        offset = 4;
      } else if (length === 127) {
        if (buffer.length < 10) return;
        length = Number(buffer.readBigUInt64BE(2));
        offset = 10;
      }

      let maskKey = null;
      if (masked) {
        if (buffer.length < offset + 4) return;
        maskKey = buffer.slice(offset, offset + 4);
        offset += 4;
      }

      if (buffer.length < offset + length) return;

      let payload = buffer.slice(offset, offset + length);
      if (masked) {
        const copy = Buffer.alloc(payload.length);
        for (let i = 0; i < payload.length; i += 1) {
          copy[i] = payload[i] ^ maskKey[i % 4];
        }
        payload = copy;
      }

      buffer = buffer.slice(offset + length);

      const opcode = first & 0x0f;
      if (opcode === 0x1) {
        const message = JSON.parse(payload.toString("utf8"));
        if (message.id && pending.has(message.id)) {
          const entry = pending.get(message.id);
          pending.delete(message.id);
          if (message.error) {
            entry.reject(new Error(JSON.stringify(message.error)));
          } else {
            entry.resolve(message.result);
          }
        } else {
          listeners.forEach((listener) => listener(message));
        }
      }
    }
  });

  function send(method, params) {
    const id = nextId++;
    const payload = JSON.stringify({ id, method, params: params || {} });
    const body = Buffer.from(payload, "utf8");
    const mask = crypto.randomBytes(4);
    const header = [];

    header.push(0x81);
    if (body.length < 126) {
      header.push(0x80 | body.length);
    } else if (body.length < 65536) {
      header.push(0x80 | 126, (body.length >> 8) & 0xff, body.length & 0xff);
    } else {
      header.push(0x80 | 127, 0, 0, 0, 0, (body.length >>> 24) & 0xff, (body.length >>> 16) & 0xff, (body.length >>> 8) & 0xff, body.length & 0xff);
    }
    header.push(...mask);

    const masked = Buffer.alloc(body.length);
    for (let i = 0; i < body.length; i += 1) {
      masked[i] = body[i] ^ mask[i % 4];
    }

    socket.write(Buffer.concat([Buffer.from(header), masked]));
    return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
  }

  return { send, on: (listener) => listeners.push(listener), close: () => socket.end() };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const child = spawn(BROWSER, [
    "--headless=new",
    "--remote-debugging-port=" + PORT,
    "--user-data-dir=" + PROFILE,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "about:blank"
  ], { detached: true, stdio: "ignore" });
  child.unref();

  try {
    await waitForEndpoint(30);
    const pages = await getJson("http://127.0.0.1:" + PORT + "/json/list");
    const page = pages.find((item) => item.type === "page") || pages[0];
    const client = await connect(page.webSocketDebuggerUrl);

    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 950,
      deviceScaleFactor: 1,
      mobile: false
    });

    const logs = [];
    client.on((message) => {
      if (message.method === "Runtime.consoleAPICalled") {
        logs.push("console." + message.params.type + ": " + message.params.args.map((a) => a.value || a.description || "").join(" "));
      }
      if (message.method === "Runtime.exceptionThrown") {
        logs.push("EXCEPTION: " + (message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text));
      }
      if (message.method === "Log.entryAdded") {
        logs.push("log." + message.params.entry.level + ": " + message.params.entry.text);
      }
    });
    await client.send("Log.enable");

    await client.send("Page.navigate", { url: URL_TO_OPEN });
    await sleep(5200);

    // The site scrolls smoothly on purpose; the screenshot harness wants instant
    // jumps and settled animations, so it neutralises both for its own run.
    await client.send("Runtime.evaluate", {
      expression: `(() => {
        document.documentElement.style.scrollBehavior = 'auto';
        const style = document.createElement('style');
        style.id = 'harness-style';
        style.textContent = '.hole__slot img{animation-fill-mode:forwards !important}';
        document.head.appendChild(style);
        return true;
      })()`,
      returnByValue: true
    });
    await sleep(400);

    const title = await client.send("Runtime.evaluate", { expression: "document.title", returnByValue: true });
    console.log("title:", title.result.value);

    const bootReport = await client.send("Runtime.evaluate", {
      expression: `(() => ({
        navListenersReady: Boolean(document.querySelector('[data-filter="pokemon"]')),
        revealVisible: document.querySelectorAll('.reveal.is-visible').length,
        revealTotal: document.querySelectorAll('.reveal').length,
        stickers: document.querySelectorAll('#bgStickers span').length,
        stars: document.querySelectorAll('#bgStars span').length,
        preloaderHidden: document.querySelector('#preloader').hasAttribute('hidden')
      }))()`,
      returnByValue: true
    });
    console.log("boot report:", JSON.stringify(bootReport.result.value));

    const themeReset = await client.send("Runtime.evaluate", {
      expression: "localStorage.setItem('hornet-theme','day'); location.reload();",
      returnByValue: true
    });
    void themeReset;
    await sleep(4200);
    const dayCheck = await client.send("Runtime.evaluate", {
      expression: "document.documentElement.getAttribute('data-theme')",
      returnByValue: true
    });
    console.log("theme for screenshots:", dayCheck.result.value);

    for (const shot of shots) {
      await client.send("Emulation.setDeviceMetricsOverride", {
        width: shot.width,
        height: shot.height,
        deviceScaleFactor: 1,
        mobile: Boolean(shot.name === "07-mobile")
      });
      await sleep(500);

      if (shot.selector) {
        await client.send("Runtime.evaluate", {
          expression: "document.querySelector('" + shot.selector + "').scrollIntoView({block:'start', behavior:'instant'}); window.scrollBy(0, -40);"
        });
      } else {
        await client.send("Runtime.evaluate", { expression: "window.scrollTo(0, " + shot.scroll + ");" });
      }
      await sleep(1500);

      const scrollCheck = await client.send("Runtime.evaluate", {
        expression: "Math.round(window.scrollY) + '/' + (document.documentElement.scrollHeight - window.innerHeight)",
        returnByValue: true
      });

      const data = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      fs.writeFileSync(path.join(OUT_DIR, shot.name + ".png"), Buffer.from(data.data, "base64"));
      console.log("saved", shot.name + ".png (scroll " + scrollCheck.result.value + ")");
    }

    const scrollDiag = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const before = window.scrollY;
        window.scrollTo(0, 5000);
        const after = window.scrollY;
        return {
          viewport: window.innerWidth + 'x' + window.innerHeight,
          bodyOverflow: getComputedStyle(document.body).overflow,
          bodyClasses: document.body.className,
          htmlOverflow: getComputedStyle(document.documentElement).overflow,
          docHeight: document.documentElement.scrollHeight,
          before: before,
          after: after,
          scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior
        };
      })()`,
      returnByValue: true
    });
    console.log("scroll diagnostic:", JSON.stringify(scrollDiag.result.value));

    // Interact with the minigame: start it, let some starters pop up, then click a few.
    await client.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false });
    await sleep(400);
    await client.send("Runtime.evaluate", {
      expression: "document.querySelector('#game').scrollIntoView({block:'start', behavior:'instant'}); window.scrollBy(0,-40);"
    });
    await sleep(1200);
    console.log("scroll right after jump:", (await client.send("Runtime.evaluate", { expression: "Math.round(window.scrollY) + ' gameTop=' + Math.round(document.querySelector('#game').getBoundingClientRect().top)", returnByValue: true })).result.value);
    console.log("scroll after scrolling to game:", (await client.send("Runtime.evaluate", { expression: "Math.round(window.scrollY)", returnByValue: true })).result.value);

    await client.send("Runtime.evaluate", { expression: "document.querySelector('#gameStartBtn').click();" });
    await sleep(1200);
    console.log("scroll after start click:", (await client.send("Runtime.evaluate", { expression: "Math.round(window.scrollY)", returnByValue: true })).result.value);

    const scrollSpy = await client.send("Runtime.evaluate", {
      expression: `(() => {
        window.__scrollLog = [];
        window.addEventListener('scroll', () => { window.__scrollLog.push(Math.round(window.scrollY)); }, { passive: true });
        return 'watching';
      })()`,
      returnByValue: true
    });
    void scrollSpy;

    // Whack whatever is up right now, then keep whacking for a few seconds.
    const whackScript = `(() => {
      let clicked = 0;
      [...document.querySelectorAll('.hole')].forEach((hole) => {
        const data = hole.__sprite;
        if (data && performance.now() - data.upAt > 420) {
          hole.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
          clicked += 1;
        }
      });
      return clicked;
    })()`;

    let totalClicks = 0;
    for (let round = 0; round < 14; round += 1) {
      const result = await client.send("Runtime.evaluate", { expression: whackScript, returnByValue: true });
      totalClicks += result.result.value || 0;
      await sleep(420);
    }
    console.log("total whacks landed:", totalClicks);

    const clickReport = await client.send("Runtime.evaluate", {
      expression: `(() => ({
        score: document.querySelector('#hudScore').textContent,
        combo: document.querySelector('#hudCombo').textContent,
        time: document.querySelector('#hudTime').textContent
      }))()`,
      returnByValue: true
    });
    console.log("hud after whacking:", JSON.stringify(clickReport.result.value));

    await sleep(2600);
    const beforeShot = await client.send("Runtime.evaluate", {
      expression: "Math.round(window.scrollY) + ' | gameTop=' + Math.round(document.querySelector('#game').getBoundingClientRect().top) + ' | scrollLog=' + JSON.stringify((window.__scrollLog || []).slice(0, 12)) + ' | stuckClass=' + document.querySelector('#topbar').className",
      returnByValue: true
    });
    console.log("scroll before game screenshot:", beforeShot.result.value);

    const boardReport = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const holes = [...document.querySelectorAll('.hole')];
        const holeBox = holes[0].getBoundingClientRect();
        const slotBox = holes[0].querySelector('.hole__slot').getBoundingClientRect();
        const bushBox = holes[0].querySelector('.hole__bush').getBoundingClientRect();
        const sprites = holes.map((hole, index) => {
          const img = hole.querySelector('.hole__slot img');
          if (!img) return null;
          const hb = hole.getBoundingClientRect();
          const ib = img.getBoundingClientRect();
          return {
            hole: index + 1,
            sprite: Math.round(ib.width) + 'x' + Math.round(ib.height),
            overflowX: Math.round(Math.max(0, hb.left - ib.left) + Math.max(0, ib.right - hb.right)),
            pokesAboveHole: Math.round(Math.max(0, hb.top - ib.top)),
            baseAtBushTop: Math.round(ib.bottom - (hb.top + hb.height * 0.62))
          };
        }).filter(Boolean);
        return {
          hole: Math.round(holeBox.width) + 'x' + Math.round(holeBox.height),
          slot: Math.round(slotBox.width) + 'x' + Math.round(slotBox.height),
          slotBottomFromHoleTop: Math.round(slotBox.bottom - holeBox.top),
          bushTopFromHoleTop: Math.round(bushBox.top - holeBox.top),
          sprites: sprites
        };
      })()`,
      returnByValue: true
    });
    console.log("board report:", JSON.stringify(boardReport.result.value));

    const midShot = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    fs.writeFileSync(path.join(OUT_DIR, "08-game-playing.png"), Buffer.from(midShot.data, "base64"));
    console.log("saved 08-game-playing.png");

    const stateReport = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const holes = [...document.querySelectorAll('.hole')];
        return {
          score: document.querySelector('#hudScore').textContent,
          combo: document.querySelector('#hudCombo').textContent,
          time: document.querySelector('#hudTime').textContent,
          spritesInDom: document.querySelectorAll('.hole__slot img').length,
          fxNodes: document.querySelectorAll('#gameFx > *').length,
          activeHoles: holes.filter((h) => h.__sprite).length
        };
      })()`,
      returnByValue: true
    });
    console.log("game state after 4s:", JSON.stringify(stateReport.result.value));

    const startFit = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const overlay = document.querySelector('#gameStart');
        const card = overlay.querySelector('.overlay-card');
        const box = overlay.getBoundingClientRect();
        const cardBox = card.getBoundingClientRect();
        const buttons = overlay.querySelector('.btn').getBoundingClientRect();
        return {
          stage: Math.round(document.querySelector('.game__stage').getBoundingClientRect().height),
          overlayTop: Math.round(box.top),
          overlayBottom: Math.round(box.bottom),
          overlayHeight: Math.round(box.height),
          cardTop: Math.round(cardBox.top),
          cardBottom: Math.round(cardBox.bottom),
          cardHeight: Math.round(cardBox.height),
          startButtonVisible: buttons.bottom <= box.bottom + 1
        };
      })()`,
      returnByValue: true
    });
    console.log("start overlay fit:", JSON.stringify(startFit.result.value));

    await client.send("Runtime.evaluate", { expression: "window.scrollTo(0, 5880);" });
    await sleep(400);
    const startShot = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    fs.writeFileSync(path.join(OUT_DIR, "15-start-overlay.png"), Buffer.from(startShot.data, "base64"));
    console.log("saved 15-start-overlay.png");

    // Let the round run out and check the results card.
    await client.send("Runtime.evaluate", { expression: "window.scrollTo(0, 5880);" });
    await sleep(500);
    let overShot = null;
    for (let wait = 0; wait < 20; wait += 1) {
      await sleep(2500);
      const over = await client.send("Runtime.evaluate", {
        expression: "document.querySelector('#gameOver').classList.contains('game__overlay--active')",
        returnByValue: true
      });
      const timeLeft = await client.send("Runtime.evaluate", {
        expression: "document.querySelector('#hudTime').textContent",
        returnByValue: true
      });
      if (over.result.value) {
        console.log("round finished with", timeLeft.result.value, "s on the clock");
        break;
      }
    }
    const resultReport = await client.send("Runtime.evaluate", {
      expression: `(() => ({
        rank: document.querySelector('#resultRank').textContent,
        title: document.querySelector('#resultTitle').textContent,
        score: document.querySelector('#resultScore').textContent,
        combo: document.querySelector('#resultCombo').textContent,
        accuracy: document.querySelector('#resultAccuracy').textContent,
        best: document.querySelector('#resultBest').textContent,
        verdict: document.querySelector('#resultVerdict').textContent,
        storedBest: localStorage.getItem('hornet-scramble-best')
      }))()`,
      returnByValue: true
    });
    console.log("results card:", JSON.stringify(resultReport.result.value));

    const fitReport = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const overlay = document.querySelector('#gameOver');
        const card = overlay.querySelector('.overlay-card');
        const rank = document.querySelector('#resultRank');
        const overlayBox = overlay.getBoundingClientRect();
        const cardBox = card.getBoundingClientRect();
        const rankBox = rank.getBoundingClientRect();
        const buttons = overlay.querySelector('.overlay-card__buttons').getBoundingClientRect();
        return {
          stageHeight: Math.round(document.querySelector('.game__stage').getBoundingClientRect().height),
          overlayHeight: Math.round(overlayBox.height),
          overlayScrollHeight: overlay.scrollHeight,
          cardHeight: Math.round(cardBox.height),
          rankTopInside: Math.round(rankBox.top - overlayBox.top),
          rankVisible: rankBox.top >= overlayBox.top - 1,
          buttonsBottomInside: Math.round(buttons.bottom - overlayBox.top),
          buttonsVisible: buttons.bottom <= overlayBox.bottom + 1
        };
      })()`,
      returnByValue: true
    });
    console.log("overlay fit:", JSON.stringify(fitReport.result.value));
    overShot = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    fs.writeFileSync(path.join(OUT_DIR, "14-game-over.png"), Buffer.from(overShot.data, "base64"));
    console.log("saved 14-game-over.png");

    const again = await client.send("Runtime.evaluate", {
      expression: "document.querySelector('#gameAgainBtn').click(); 'restarted'",
      returnByValue: true
    });
    void again;
    await sleep(1200);
    const restarted = await client.send("Runtime.evaluate", {
      expression: "document.querySelector('#hudTime').textContent + 's / score ' + document.querySelector('#hudScore').textContent",
      returnByValue: true
    });
    console.log("after play again:", restarted.result.value);

    // Lightbox check
    const lightboxReport = await client.send("Runtime.evaluate", {
      expression: `(() => {
        document.querySelector('#lightboxClose').click();
        const card = document.querySelector('.card');
        card.click();
        return true;
      })()`,
      returnByValue: true
    });
    await sleep(2200);
    const lightboxState = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const box = document.querySelector('#lightbox');
        return {
          open: !box.hidden,
          title: document.querySelector('#lightboxTitle').textContent,
          index: document.querySelector('#lightboxIndex').textContent,
          imgSrc: document.querySelector('#lightboxImage').getAttribute('src'),
          loaded: document.querySelector('#lightboxImage').classList.contains('is-loaded')
        };
      })()`,
      returnByValue: true
    });
    console.log("lightbox:", JSON.stringify(lightboxState.result.value));
    const lightShot = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    fs.writeFileSync(path.join(OUT_DIR, "09-lightbox.png"), Buffer.from(lightShot.data, "base64"));
    console.log("saved 09-lightbox.png");

    await client.send("Runtime.evaluate", { expression: "document.querySelector('#lightboxClose').click();" });
    await sleep(400);

    // Filter + theme + night mode checks
    const miscReport = await client.send("Runtime.evaluate", {
      expression: `(() => {
        document.querySelector('[data-filter="pokemon"]').click();
        const visible = [...document.querySelectorAll('.card')].filter((c) => !c.classList.contains('is-hidden')).length;
        document.querySelector('[data-filter="all"]').click();
        document.querySelector('#themeToggle').click();
        const theme = document.documentElement.getAttribute('data-theme');

        const orderBefore = [...document.querySelectorAll('.card')].map((c) => c.getAttribute('data-title')).join('|');
        document.querySelector('#shuffleGallery').click();
        const orderAfter = [...document.querySelectorAll('.card')].map((c) => c.getAttribute('data-title')).join('|');

        document.querySelector('#navToggle').click();
        const navOpen = document.querySelector('#nav').classList.contains('is-open');
        const navExpanded = document.querySelector('#navToggle').getAttribute('aria-expanded');

        document.querySelector('#gamePause').click();
        const paused = document.querySelector('#gamePaused').classList.contains('game__overlay--active');

        return {
          pokemonVisible: visible,
          theme: theme,
          shuffleChangedOrder: orderBefore !== orderAfter,
          navOpen: navOpen,
          navExpanded: navExpanded,
          pauseOverlay: paused
        };
      })()`,
      returnByValue: true
    });
    console.log("interactions:", JSON.stringify(miscReport.result.value));

    // Confetti: click the real button and count the pieces that are on screen.
    const confettiReport = await client.send("Runtime.evaluate", {
      expression: `(() => {
        document.querySelector('#contact').scrollIntoView({block:'center', behavior:'instant'});
        document.querySelector('#confettiBtn').click();
        const layer = document.querySelector('#confettiLayer');
        const pieces = [...layer.querySelectorAll('i')];
        const onScreen = pieces.filter((piece) => {
          const box = piece.getBoundingClientRect();
          return box.bottom > 0 && box.top < window.innerHeight && box.width > 0;
        }).length;
        return {
          pieces: pieces.length,
          onScreen: onScreen,
          layerPosition: getComputedStyle(layer).position,
          layerHeight: Math.round(layer.getBoundingClientRect().height),
          firstPieceTop: pieces.length ? Math.round(pieces[0].getBoundingClientRect().top) : null
        };
      })()`,
      returnByValue: true
    });
    console.log("confetti immediately:", JSON.stringify(confettiReport.result.value));
    await sleep(1400);
    const confettiLater = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const pieces = [...document.querySelectorAll('#confettiLayer i')];
        const onScreen = pieces.filter((piece) => {
          const box = piece.getBoundingClientRect();
          return box.bottom > 0 && box.top < window.innerHeight && box.width > 0;
        }).length;
        return { onScreenAfter1400ms: onScreen };
      })()`,
      returnByValue: true
    });
    console.log("confetti after 1.4s:", JSON.stringify(confettiLater.result.value));

    // Audio: turn sound on, then confirm a live Web Audio context can run.
    const audioReport = await client.send("Runtime.evaluate", {
      expression: `(() => {
        document.querySelector('#soundToggle').click();
        const Ctor = window.AudioContext || window.webkitAudioContext;
        const probe = new Ctor();
        const state = probe.state;
        probe.close();
        return {
          enabled: window.audio.enabled,
          ariaPressed: document.querySelector('#soundToggle').getAttribute('aria-pressed'),
          stored: localStorage.getItem('hornet-sound'),
          freshContextState: state
        };
      })()`,
      returnByValue: true
    });
    console.log("audio:", JSON.stringify(audioReport.result.value));

    await client.send("Runtime.evaluate", { expression: "window.scrollTo(0,0);" });
    await sleep(1200);
    const nightShot = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    fs.writeFileSync(path.join(OUT_DIR, "10-night-home.png"), Buffer.from(nightShot.data, "base64"));
    console.log("saved 10-night-home.png");

    await client.send("Runtime.evaluate", {
      expression: "document.querySelector('#gallery').scrollIntoView({block:'start'}); window.scrollBy(0,-40);"
    });
    await sleep(1000);
    const nightGallery = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    fs.writeFileSync(path.join(OUT_DIR, "11-night-gallery.png"), Buffer.from(nightGallery.data, "base64"));
    console.log("saved 11-night-gallery.png");

    // Mobile pass: check the game board and overlay on a phone-sized viewport.
    await client.send("Emulation.setDeviceMetricsOverride", { width: 414, height: 896, deviceScaleFactor: 2, mobile: true });
    await sleep(900);
    await client.send("Runtime.evaluate", {
      expression: "document.querySelector('#game').scrollIntoView({block:'start', behavior:'instant'});"
    });
    await sleep(900);
    const mobileGame = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    fs.writeFileSync(path.join(OUT_DIR, "18-mobile-game.png"), Buffer.from(mobileGame.data, "base64"));
    console.log("saved 18-mobile-game.png");

    const mobileFit = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const overlay = document.querySelector('#gameStart');
        const box = overlay.getBoundingClientRect();
        const card = overlay.querySelector('.overlay-card').getBoundingClientRect();
        const hole = document.querySelector('.hole').getBoundingClientRect();
        return {
          viewport: window.innerWidth + 'x' + window.innerHeight,
          hole: Math.round(hole.width) + 'x' + Math.round(hole.height),
          overlayHeight: Math.round(box.height),
          cardHeight: Math.round(card.height),
          cardTopInside: Math.round(card.top - box.top),
          scrollable: overlay.scrollHeight > overlay.clientHeight
        };
      })()`,
      returnByValue: true
    });
    console.log("mobile fit:", JSON.stringify(mobileFit.result.value));

    // Full page height report
    const metrics = await client.send("Runtime.evaluate", {
      expression: `(() => ({
        docHeight: document.documentElement.scrollHeight,
        cards: document.querySelectorAll('.card').length,
        brokenImages: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.getAttribute('src'))
      }))()`,
      returnByValue: true
    });
    console.log("page metrics:", JSON.stringify(metrics.result.value));

    console.log("--- browser logs ---");
    console.log(logs.length ? logs.join("\n") : "(none)");
  } catch (error) {
    console.error("screenshot run failed:", error.message);
    process.exitCode = 1;
  } finally {
    try {
      await getJson("http://127.0.0.1:" + PORT + "/json/close/" + (await getJson("http://127.0.0.1:" + PORT + "/json/list"))[0].id);
    } catch (error) {
      /* browser already gone */
    }
    spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  }
})();
