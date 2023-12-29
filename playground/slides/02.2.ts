import { Palette } from "./types";

// We can define new palettes
const palette: Palette = {
  // @ts-ignore
  magenta: [255, 0, 255],
  green: "#00ff00",
  // @ts-ignore
  orange: [255, 165, 0]
};

// But TS doesn't remember that `.green` is actually a string!
// @ts-ignore
const green = palette.green.toUpperCase();
