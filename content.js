// Injected on demand by the popup via chrome.scripting.executeScript({ files }).
// The value of the last expression is returned to the caller as the injection
// result, so there is no need for message passing or a persistent listener.
function extractColors() {
  const COLOR_RE = /rgba?\([\d.,\s]+\)/g;
  const THRESHOLD = 50; // max euclidean distance (0-441) to treat two colors as equal
  const COLOR_PROPS = ["color", "backgroundColor", "borderColor"];

  function parse(color) {
    const parts = color.match(/[\d.]+/g);
    if (!parts || parts.length < 3) return null;
    return {
      r: +parts[0],
      g: +parts[1],
      b: +parts[2],
      a: parts.length > 3 ? +parts[3] : 1,
    };
  }

  // Composite semi-transparent colors over a white background so that visually
  // similar colors (regardless of their alpha) can be compared fairly.
  function blendWithWhite({ r, g, b, a }) {
    return {
      r: r * a + 255 * (1 - a),
      g: g * a + 255 * (1 - a),
      b: b * a + 255 * (1 - a),
    };
  }

  function roughlyEqual(c1, c2) {
    const a = blendWithWhite(c1);
    const b = blendWithWhite(c2);
    return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b) <= THRESHOLD;
  }

  function toCss({ r, g, b, a }) {
    return a === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  const unique = []; // parsed color objects kept so far

  for (const el of document.querySelectorAll("*")) {
    const styles = getComputedStyle(el);

    for (const prop of COLOR_PROPS) {
      // A single property (e.g. borderColor) can hold several colors at once,
      // like "rgb(1, 2, 3) rgb(4, 5, 6)". Match each complete color separately.
      const matches = String(styles[prop]).match(COLOR_RE);
      if (!matches) continue;

      for (const match of matches) {
        const color = parse(match);
        if (!color || color.a === 0) continue; // skip fully transparent
        if (unique.some((c) => roughlyEqual(c, color))) continue;
        unique.push(color);
      }
    }
  }

  return unique.map(toCss);
}

extractColors();
