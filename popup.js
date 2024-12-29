document.getElementById("generatePalette").addEventListener("click", () => {
  // Send a message to the content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        files: ["content.js"],
      },
      () => {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "extractColors" },
          (response) => {
            if (response && response.colors) {
              displayColors(response.colors);
            }
          }
        );
      }
    );
  });
});

function rgbToHex(rgb) {
  // Extract RGB values using regex
  const match = rgb.match(/\d+/g);
  if (!match) return rgb;

  const [r, g, b] = match.map(Number);

  // Convert each component to hex and pad with zeros if needed
  const toHex = (n) => {
    const hex = n.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(rgb) {
  // Extract RGB values using regex
  const match = rgb.match(/\d+/g);
  if (!match) return rgb;

  let [r, g, b] = match.map(Number);

  // Convert RGB to [0,1] range
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

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
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  // Convert to degrees and percentages
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `hsl(${h}, ${s}%, ${l}%)`;
}

function displayColors(colors) {
  const palette = document.getElementById("palette");
  palette.innerHTML = ""; // Clear any existing colors

  colors.forEach((color) => {
    const colorBox = document.createElement("div");
    colorBox.className = "color-box-container";

    // Create the color preview square
    const colorPreview = document.createElement("div");
    colorPreview.className = "color-preview";
    colorPreview.style.backgroundColor = color;
    colorBox.appendChild(colorPreview);

    // Create button container
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "button-container";

    // Create copy buttons for different formats
    const formats = [
      { type: "HEX", value: rgbToHex(color) },
      { type: "RGB", value: color },
      { type: "HSL", value: rgbToHsl(color) },
    ];

    formats.forEach((format) => {
      const button = document.createElement("button");
      button.textContent = format.value;
      button.className = "copy-button";
      button.addEventListener("click", () => {
        navigator.clipboard.writeText(format.value);
        button.textContent = "Copied!";
        setTimeout(() => {
          button.textContent = format.value;
        }, 1000);
      });
      buttonContainer.appendChild(button);
    });

    colorBox.appendChild(buttonContainer);
    palette.appendChild(colorBox);
  });
}
