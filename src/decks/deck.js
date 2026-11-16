// Scale each 1280 x 720 slide to the window. Code Apache-2.0.
(() => { const set = () => document.documentElement.style.setProperty('--k', Math.min(1, (window.innerWidth - 32) / 1280).toFixed(4)); set(); window.addEventListener('resize', set); })();
