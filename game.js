// Loader for the Cell Machine game bundle.
// The editable source remains in outputs/cell-machine/game.js in the Codex workspace.
(() => {
  const bundleFiles = [
    "game-bundle-00.js",
    "game-bundle-01.js",
    "game-bundle-02.js",
    "game-bundle-03.js",
    "game-bundle-04.js"
  ];

  window.__cellMachineBundleChunks = [];

  const showError = (message) => {
    const pre = document.createElement("pre");
    pre.style.cssText = "white-space:pre-wrap;margin:24px;padding:16px;border:1px solid #d33;background:#fff4f4;color:#711;font:14px/1.45 system-ui,sans-serif";
    pre.textContent = message;
    document.body.prepend(pre);
  };

  const loadScript = (src) => new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.appendChild(script);
  });

  const decodeBase64 = (text) => {
    const binary = atob(text);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  const boot = async () => {
    if (!("DecompressionStream" in window)) {
      throw new Error("This browser cannot decompress the game bundle. Please use a recent Chrome, Edge, Firefox, or Safari.");
    }

    for (const file of bundleFiles) {
      await loadScript(file);
    }

    const compressed = decodeBase64(window.__cellMachineBundleChunks.join(""));
    const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip"));
    const source = await new Response(stream).text();
    (0, eval)(source);
  };

  boot().catch((error) => {
    console.error(error);
    showError(`Cell Machine failed to start.\n\n${error.message}`);
  });
})();
