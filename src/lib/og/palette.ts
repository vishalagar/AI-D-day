/** Light-theme tokens from globals.css. Satori can't read CSS variables. */
export const OG = {
  paper: "#ece0c6",
  panel: "#f8f1e1",
  ink: "#1b1510",
  inkDim: "#6b5d4c",
  alert: "#e03a10",
  pop: "#ff2d78",
  grid: "rgba(27, 21, 16, 0.07)",
  size: { width: 1200, height: 630 },
} as const;

export const OG_BACKGROUND = {
  backgroundColor: OG.paper,
  backgroundImage: `linear-gradient(${OG.grid} 1px, transparent 1px), linear-gradient(90deg, ${OG.grid} 1px, transparent 1px)`,
  backgroundSize: "32px 32px",
} as const;
