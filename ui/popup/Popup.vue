<template>
  <div class="popup-container">
    <h1>Swatchy Popup</h1>
    <button
      id="generatePalette"
      @click="generatePalette"
    >
      Generate Palette
    </button>
    <div id="palette">
      <div
        v-for="color in colors"
        :key="color"
        class="color-box-container"
      >
        <div
          class="color-preview"
          :style="{ backgroundColor: color }"
        ></div>
        <div class="button-container">
          <button
            v-for="format in getColorFormats(color)"
            :key="format.type"
            class="copy-button"
            @click="copyColor(format)"
            :ref="(el) => (format.buttonRef = el)"
          >
            {{ format.displayValue }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const colors = ref([]);

function generatePalette() {
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
              colors.value = response.colors;
            }
          }
        );
      }
    );
  });
}

function rgbToHex(rgb) {
  const match = rgb.match(/\d+/g);
  if (!match) return rgb;

  const [r, g, b] = match.map(Number);

  const toHex = (n) => {
    const hex = n.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(rgb) {
  const match = rgb.match(/\d+/g);
  if (!match) return rgb;

  let [r, g, b] = match.map(Number);

  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
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

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `hsl(${h}, ${s}%, ${l}%)`;
}

function getColorFormats(color) {
  return [
    { type: "HEX", value: rgbToHex(color), displayValue: rgbToHex(color) },
    { type: "RGB", value: color, displayValue: color },
    { type: "HSL", value: rgbToHsl(color), displayValue: rgbToHsl(color) },
  ];
}

function copyColor(format) {
  navigator.clipboard.writeText(format.value);
  const originalText = format.displayValue;
  format.displayValue = "Copied!";
  setTimeout(() => {
    format.displayValue = originalText;
  }, 1000);
}
</script>

<style>
.popup-container {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 10px;
  width: 500px;
}

h1 {
  font-size: 16px;
  margin-bottom: 10px;
}

#generatePalette {
  display: block;
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: none;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  border-radius: 4px;
}

#palette {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.color-box-container {
  display: flex;
  gap: 12px;
}

.button-container {
  display: flex;
  flex-direction: row;
  gap: 8px;
  width: 100%;
}

.button-container:not(:last-child) {
  margin-bottom: 8px;
  border-bottom: 1px solid #ddd;
}

.color-preview {
  width: 50px;
  height: 50px;
  border-radius: 4px;
}

.copy-button {
  width: 100%;
  padding: 4px;
  border: none;
  background-color: #f0f0f0;
  color: black;
  cursor: pointer;
  border-radius: 4px;
}

.copy-button:hover {
  background-color: #e0e0e0;
}
</style>
