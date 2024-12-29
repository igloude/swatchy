function extractColorsFromPage() {
    const elements = document.querySelectorAll("*");
    const colors = new Set();
  
    elements.forEach((el) => {
      const styles = getComputedStyle(el);
  
      // Extract colors
      ["color", "backgroundColor", "borderColor"].forEach((prop) => {
        const color = styles[prop];
        if (color && isValidColor(color)) {
          colors.add(color);
        }
      });
    });
  
    return Array.from(colors);
  }
  
  function isValidColor(color) {
    // Ensure it's not transparent or default browser values
    return color && color !== "transparent" && color !== "rgba(0, 0, 0, 0)";
  }
  
  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "extractColors") {
      const colors = extractColorsFromPage();
      sendResponse({ colors });
    }
  });
  