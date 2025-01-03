function extractColorsFromPage() {
  const elements = document.querySelectorAll("*");
  const colors = new Set();

  elements.forEach((el) => {
    const styles = getComputedStyle(el);
    const colorProps = [
      styles.color,
      styles.backgroundColor,
      styles.borderColor,
    ];

    colorProps.forEach((color) => {
      if (color && color !== "transparent" && color !== "rgba(0, 0, 0, 0)") {
        colors.add(color);
      }
    });
  });

  return Array.from(colors);
}

function hexToRgb(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join(""); // expand shorthand (e.g., #f00 -> #ff0000)
  }
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return { r, g, b };
}

function parseRgb(color) {
  const match = color.match(/[\d.]+/g);
  if (match) {
    return {
      r: parseInt(match[0]),
      g: parseInt(match[1]),
      b: parseInt(match[2]),
      a: match.length > 3 ? parseFloat(match[3]) : 1,
    };
  }
  return null;
}

function colorsRoughlyEqual(color1, color2, threshold = 50) {
  let rgb1, rgb2;

  if (color1.startsWith("#")) {
    rgb1 = hexToRgb(color1);
    rgb1.a = 1; // Hex colors are always fully opaque
  } else if (color1.startsWith("rgb")) {
    rgb1 = parseRgb(color1);
  }

  if (color2.startsWith("#")) {
    rgb2 = hexToRgb(color2);
    rgb2.a = 1; // Hex colors are always fully opaque
  } else if (color2.startsWith("rgb")) {
    rgb2 = parseRgb(color2);
  }

  if (!rgb1 || !rgb2) return false;

  // If alpha channels are significantly different, colors are not equal
  if (Math.abs(rgb1.a - rgb2.a) > 0.1) return false;

  // For semi-transparent colors, blend with white background
  function blendWithBackground(color) {
    return {
      r: color.r * color.a + 255 * (1 - color.a),
      g: color.g * color.a + 255 * (1 - color.a),
      b: color.b * color.a + 255 * (1 - color.a),
    };
  }

  const blended1 = blendWithBackground(rgb1);
  const blended2 = blendWithBackground(rgb2);

  // euclidean distance on blended colors
  const distance = Math.sqrt(
    Math.pow(blended1.r - blended2.r, 2) +
      Math.pow(blended1.g - blended2.g, 2) +
      Math.pow(blended1.b - blended2.b, 2)
  );

  // check if the distance is within the threshold
  return distance <= threshold;
}

function convertRgbaToRgb(color) {
  if (color.startsWith("rgba")) {
    return color.replace("rgba", "rgb").replace(/,\s*[\d.]+\s*\)/, ")");
  }
  return color;
}

// listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "extractColors") {
    const pageColors = extractColorsFromPage();
    const uniqueColors = [];

    // Process colors one at a time to avoid batching
    for (const color of pageColors) {
      // sometimes we get multiple colors in one string, like "rgb(235, 235, 235) rgb(32, 33, 36) rgb(32, 33, 36)"
      // ensure we only process one color at a time by splitting on spaces after an end parenthesis
      const colors = color.split(") ");
      for (const c of colors) {
        const rgbColor = convertRgbaToRgb(c);
        if (
          !uniqueColors.some((existingColor) =>
            colorsRoughlyEqual(rgbColor, existingColor)
          )
        ) {
          console.log("adding", rgbColor);
          uniqueColors.push(rgbColor);
        }
      }
    }

    console.log(uniqueColors);

    sendResponse({ colors: uniqueColors });
  }
});
