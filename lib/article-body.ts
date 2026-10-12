/** Convert editor HTML to readable text; callers render the result as React
 * text nodes, so uploaded markup is never executed or inserted into the DOM. */
export function articleBodyText(body?: string): string {
  if (!body) return "";
  if (!/<\/?[a-z][^>]*>/i.test(body)) return body;

  const entities: Record<string, string> = {
    amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
    ndash: "–", mdash: "—", hellip: "…", lsquo: "‘", rsquo: "’",
    ldquo: "“", rdquo: "”", bull: "•", copy: "©", reg: "®",
  };

  return body
    .replace(/<(script|style|iframe|object)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<img\b[^>]*\balt=["']([^"']*)["'][^>]*>/gi, "$1")
    .replace(/<br\b[^>]*>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "\n- ")
    .replace(/<\/li\s*>/gi, "")
    .replace(/<\/(?:p|div|h[1-6]|blockquote|ul|ol|pre)\s*>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, name: string) => {
      if (!name.startsWith("#")) return entities[name.toLowerCase()] ?? entity;
      const hex = name[1].toLowerCase() === "x";
      const code = Number.parseInt(name.slice(hex ? 2 : 1), hex ? 16 : 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
    })
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
