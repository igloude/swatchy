function hexToRgb(hex) {
    hex = hex.replace("#", "");
    if (hex.length === 3) {
        hex = hex.split("").map((char) => char + char).join(""); // expand shorthand (e.g., #f00 -> #ff0000)
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return { r, g, b };
}

function extractColorsFromPage() {
    const elements = document.querySelectorAll("*");
    const colors = new Set();

    elements.forEach((el) => {
        const styles = getComputedStyle(el);

        ["color", "backgroundColor", "borderColor"].forEach((prop) => {
            const color = styles[prop];
            if (color && color !== "transparent" && color !== "rgba(0, 0, 0, 0)") {
                colors.add(color);
            }
        });
    });

    return Array.from(colors);
}

function colorsRoughlyEqual(hex1, hex2, threshold = 20) {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);

    // euclidean distance
    const distance = Math.sqrt(
        Math.pow(rgb1.r - rgb2.r, 2) +
        Math.pow(rgb1.g - rgb2.g, 2) +
        Math.pow(rgb1.b - rgb2.b, 2)
    );

    // check if the distance is within the threshold
    return distance <= threshold;
}

// listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "extractColors") {
        const colors = extractColorsFromPage();
        sendResponse({ colors });
    }
});
