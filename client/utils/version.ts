/**
 * 语义化版本比较
 * 返回：>0 表示 a 更新；<0 表示 a 更旧；0 表示相同
 * 兼容 "1.2.3" / "1.2" / "2.0.0-rc.1"（忽略预发布后缀）
 */
export function compareVersion(a: string, b: string): number {
  const parse = (v: string) =>
    v
      .split('-')[0]
      .split('.')
      .map((n) => parseInt(n, 10) || 0);
  const pa = parse(a);
  const pb = parse(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
