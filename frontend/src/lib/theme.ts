/** hex 转 rgb 分量 */
export function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

/** 从主题色派生各场景所需的样式值 */
export interface AccentColors {
  bg: string;
  text: string;
  pillBg: string;
  pillHover: string;
}

export function accentFrom(hex: string): AccentColors {
  const { r, g, b } = hexToRgb(hex);
  return {
    bg: hex,
    text: hex,
    pillBg: `rgba(${r},${g},${b},0.1)`,
    pillHover: `rgba(${r},${g},${b},0.2)`,
  };
}
