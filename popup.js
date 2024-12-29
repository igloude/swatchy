document.getElementById("generatePalette").addEventListener("click", () => {
    // Send a message to the content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          files: ["content.js"]
        },
        () => {
          chrome.tabs.sendMessage(tabs[0].id, { action: "extractColors" }, (response) => {
            if (response && response.colors) {
              displayColors(response.colors);
            }
          });
        }
      );
    });
  });
  
  function displayColors(colors) {
    const palette = document.getElementById("palette");
    palette.innerHTML = ""; // Clear any existing colors
    colors.forEach((color) => {
      const colorBox = document.createElement("div");
      colorBox.className = "color-box";
      colorBox.style.backgroundColor = color;
      palette.appendChild(colorBox);
    });
  }
