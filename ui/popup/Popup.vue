<template>
  <div class="popup-container">
    <nav>
      <h1>Swatchy</h1>
      <button
        @click="colors = []"
        v-if="colors.length"
      >
        Reset
      </button>
      <a
        href="../options/options.html"
        target="_blank"
      >
        Options
      </a>
    </nav>
    <button
      id="generatePalette"
      @click="generatePalette"
      v-if="!colors.length"
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
import Color from "colorjs.io";

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
  const color = new Color(rgb);
  return color.toString({ format: "hex" });
}

function rgbToHsl(rgb) {
  const color = new Color(rgb);
  return color.toString({ format: "hsl" });
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
