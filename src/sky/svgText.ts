// Catalog labels are interpolated into SVG markup, so encode XML metacharacters
// before assigning the resulting string to an SVG innerHTML sink.
export function escapeSvgText(value: string): string {
  return value.replace(/[&<>"']/g, character => {
    switch (character) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return character;
    }
  });
}
