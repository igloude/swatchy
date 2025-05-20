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

function colorsRoughlyEqual(color1, color2, threshold = 50) {
  try {
    const c1 = new Color(color1);
    const c2 = new Color(color2);

    // Convert to LCH for better perceptual comparison
    const lch1 = c1.to("lch");
    const lch2 = c2.to("lch");

    // Calculate perceptual distance using deltaE
    const distance = c1.deltaE(c2, "2000");

    return distance <= threshold;
  } catch (e) {
    return false;
  }
}

function convertRgbaToRgb(color) {
  try {
    const c = new Color(color);
    if (c.alpha < 1) {
      // Blend with white background
      const white = new Color("white");
      const blended = c.blend(white, { space: "srgb" });
      return blended.toString({ format: "rgb" });
    }
    return color;
  } catch (e) {
    return color;
  }
}

function getColorScore(color) {
  try {
    const c = new Color(color);
    const lch = c.to("lch");

    // Get lightness (0-100)
    const lightness = lch.l;

    // Get chroma (saturation)
    const chroma = lch.c;

    // Get hue (0-360)
    const hue = lch.h || 0;

    // Consider it grayscale if chroma is very low
    if (chroma < 5) {
      return lightness; // Return lightness value for grayscale sorting
    }

    // For colored pixels, return 2000 + hue for sorting by hue
    return 2000 + hue;
  } catch (e) {
    return 0;
  }
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

    // Sort colors by grayscale first, then by hue
    uniqueColors.sort((a, b) => getColorScore(a) - getColorScore(b));

    console.log(uniqueColors);

    sendResponse({ colors: uniqueColors });
  }
});
