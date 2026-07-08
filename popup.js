const generateButton = document.getElementById("generatePalette");
const palette = document.getElementById("palette");

generateButton.addEventListener("click", async () => {
  showMessage("Scanning page…");

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    showMessage("No active tab found.");
    return;
  }

  let results;
  try {
    results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
  } catch {
    // Injection is blocked on restricted pages (chrome://, the Web Store, etc.)
    showMessage("Can't read colors from this page.");
    return;
  }

  const colors = results?.[0]?.result ?? [];
  if (colors.length === 0) {
    showMessage("No colors found on this page.");
    return;
  }

  displayColors(colors);
});

function showMessage(text) {
  palette.innerHTML = "";
  const message = document.createElement("p");
  message.className = "message";
  message.textContent = text;
  palette.appendChild(message);
}

function rgbToHex(rgb) {
  const match = rgb.match(/\d+/g);
  if (!match || match.length < 3) return rgb;

  const [r, g, b] = match.map(Number);
  const toHex = (n) => n.toString(16).padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(rgb) {
  const match = rgb.match(/\d+/g);
  if (!match || match.length < 3) return rgb;

  let [r, g, b] = match.map(Number);
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h;
  let s;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lightness = Math.round(l * 100);

  return `hsl(${h}, ${s}%, ${lightness}%)`;
}

function displayColors(colors) {
  palette.innerHTML = "";

  colors.forEach((color) => {
    const container = document.createElement("div");
    container.className = "color-box-container";

    const preview = document.createElement("div");
    preview.className = "color-preview";
    preview.style.backgroundColor = color;
    container.appendChild(preview);

    const buttons = document.createElement("div");
    buttons.className = "button-container";

    const formats = [
      { name: "HEX", value: () => rgbToHex(color) },
      { name: "RGB", value: () => color },
      { name: "HSL", value: () => rgbToHsl(color) },
    ];

    formats.forEach((format) => {
      const button = document.createElement("button");
      button.textContent = format.name;
      button.className = "copy-button";
      button.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(format.value());
          button.textContent = "Copied!";
        } catch {
          button.textContent = "Failed";
        }
        setTimeout(() => {
          button.textContent = format.name;
        }, 1000);
      });
      buttons.appendChild(button);
    });

    container.appendChild(buttons);
    palette.appendChild(container);
  });
}
