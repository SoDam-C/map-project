/**
 * 复合区域 ID 工具
 *
 * 格式：{ISO3}:{localId}
 * - 中国：CHN:110000（省）、CHN:110105（区县）、CHN:110105001（乡镇）
 * - 美国：USA:USA.1_1（州）、USA:USA.1_1.2_1（县）
 * - 日本：JPN:JPN.1_1（都道府县）
 */

/** 解析复合区域 ID */
export function parseRegionCode(code: string): { country: string; localId: string } {
  const idx = code.indexOf(':');
  if (idx === -1) {
    // 旧版裸 adcode，默认中国
    return { country: 'CHN', localId: code };
  }
  return { country: code.slice(0, idx), localId: code.slice(idx + 1) };
}

/** 构建复合区域 ID */
export function buildRegionCode(country: string, localId: string): string {
  return `${country}:${localId}`;
}

/** 从复合 ID 提取国家 ISO3 */
export function getCountry(code: string): string {
  return parseRegionCode(code).country;
}

/** 是否为旧版裸 adcode（不含冒号） */
export function isLegacyCode(code: string): boolean {
  return !code.includes(':');
}

/**
 * 从 GADM GID 提取父级 GID
 *
 * GID 格式：ISO3.L1_L1.L2_L2.L3_L3...
 * 每个段用 . 分隔，段内用 _ 分隔级别序号和内部编号
 *
 * 例：
 *   NLD.1.1_1 → NLD.1_1（去掉最后段，给剩余末段补 _1）
 *   JPN.1.2_1 → JPN.1_1
 *   USA.1.1.1_1 → USA.1.1_1
 *   JPN.3_1 → null（ADM1 级别，父级是国家本身，不返回 GID）
 */
export function getGadmParentGid(gid: string): string | null {
  const lastDot = gid.lastIndexOf('.');
  if (lastDot === -1) return null;

  const prefix = gid.slice(0, lastDot);
  // 如果 prefix 中没有 .，说明去掉最后段后只剩 ISO3.N
  // 检查 N 部分是否是纯数字（ADM1 的 GID 是 ISO3.N_1）
  const afterFirstDot = prefix.includes('.') ? '' : prefix.slice(prefix.indexOf('.') + 1);
  if (!prefix.includes('.')) {
    // prefix 形如 "NLD.1" → ADM2 的父级是 ADM1: "NLD.1_1"
    // 但如果是纯数字，说明原 GID 是 ADM1（如 JPN.3_1），父级是国家
    const numPart = prefix.slice(prefix.indexOf('.') + 1);
    if (/^\d+$/.test(numPart)) {
      return prefix + '_1';
    }
    return null;
  }

  // prefix 形如 "USA.1.1" → 父级是 "USA.1.1_1"
  return prefix + '_1';
}
