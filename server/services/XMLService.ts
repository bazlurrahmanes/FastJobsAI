/**
 * XMLService: High-performance, RFC-compliant XML 1.0 generation and validation
 */

export class XMLService {
  /**
   * Escape standard XML special characters
   */
  public static escape(str: unknown): string {
    if (str === null || str === undefined) return '';
    const text = String(str);
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // strip invalid XML control chars
  }

  /**
   * Wrap content in CDATA block safely
   */
  public static cdata(str: unknown): string {
    if (str === null || str === undefined) return '<![CDATA[]]>';
    const text = String(str).replace(/]]>/g, ']]]]><![CDATA[>');
    return `<![CDATA[${text}]]>`;
  }

  /**
   * Standard XML 1.0 UTF-8 Header
   */
  public static header(): string {
    return '<?xml version="1.0" encoding="UTF-8"?>';
  }

  /**
   * Format object or tags into XML nodes
   */
  public static createNode(tag: string, content: string | number | null | undefined, isCdata = false): string {
    if (content === null || content === undefined || content === '') {
      return `<${tag}/>`;
    }
    const val = isCdata ? this.cdata(content) : this.escape(content);
    return `<${tag}>${val}</${tag}>`;
  }

  /**
   * Basic XML Well-Formedness & Tag Balance Validator
   */
  public static validateXML(xmlString: string): { valid: boolean; error?: string; line?: number } {
    if (!xmlString || typeof xmlString !== 'string') {
      return { valid: false, error: 'Empty or non-string XML payload' };
    }

    if (!xmlString.trim().startsWith('<?xml')) {
      return { valid: false, error: 'Missing <?xml ... ?> declaration header' };
    }

    // Match tags
    const tagRegex = /<(\/)?([a-zA-Z0-9_\-:]+)(?:\s+[^>]*)?(\/)?>/g;
    const stack: string[] = [];
    let match: RegExpExecArray | null;

    // Strip CDATA and comments for tag verification
    const cleaned = xmlString
      .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '')
      .replace(/<!--[\s\S]*?-->/g, '');

    while ((match = tagRegex.exec(cleaned)) !== null) {
      const isClosing = Boolean(match[1]);
      const tagName = match[2];
      const isSelfClosing = Boolean(match[3]);

      if (isSelfClosing) {
        continue;
      }

      if (!isClosing) {
        stack.push(tagName);
      } else {
        const last = stack.pop();
        if (last !== tagName) {
          const charIndex = match.index;
          const line = xmlString.substring(0, charIndex).split('\n').length;
          return {
            valid: false,
            error: `Mismatched closing tag: expected </${last || 'NONE'}> but found </${tagName}>`,
            line
          };
        }
      }
    }

    if (stack.length > 0) {
      return {
        valid: false,
        error: `Unclosed tags remaining: ${stack.join(', ')}`
      };
    }

    return { valid: true };
  }
}
