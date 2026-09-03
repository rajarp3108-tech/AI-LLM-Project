// Small, dependency-free markdown renderer tuned for AI Copilot's
// structured analytical output (headings, bold labels, bullet/numbered
// lists, simple field-name -> value tables, and paragraphs). Intentionally
// does not pull in a full markdown library to keep the frontend lean.

function renderInline(text, keyBase) {
  // Handle **bold**, *italic*, and `code` spans without a full parser.
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={`${keyBase}-${i}`}>{part.slice(2, -2)}</strong>;
    }
    if (/^`[^`]+`$/.test(part)) {
      return <code key={`${keyBase}-${i}`} className="inline-code">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function isFieldLine(line) {
  // "Field name -> value" or "Field name: value" style extraction lines.
  return /^[-*]?\s*[A-Za-z0-9][^:>]{1,60}(->|→|:)\s+\S/.test(line) && !/^https?:\/\//i.test(line);
}

function splitField(line) {
  const clean = line.replace(/^[-*]\s*/, '');
  const m = clean.match(/^(.{1,80}?)\s*(->|→|:)\s*(.+)$/);
  if (!m) return null;
  return { label: m[1].trim(), value: m[3].trim() };
}

export default function Markdown({ text }) {
  const raw = String(text || '');
  const lines = raw.split('\n');
  const blocks = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    // Headings: "## Title", "Title:" on its own short line followed by content, or ALL CAPS labels
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      blocks.push(<h3 key={key++} className="md-heading">{renderInline(headingMatch[2], key)}</h3>);
      i++; continue;
    }

    // A short line ending in ':' with nothing else on it, acting as a section label
    if (/^[A-Z][A-Za-z0-9 &/'\-]{2,60}:$/.test(line.trim()) && line.trim().length < 64) {
      blocks.push(<h4 key={key++} className="md-subheading">{line.trim().replace(/:$/, '')}</h4>);
      i++; continue;
    }

    // Consecutive field-extraction lines -> render as a definition table
    if (isFieldLine(line)) {
      const rows = [];
      while (i < lines.length && isFieldLine(lines[i])) {
        const f = splitField(lines[i]);
        if (f) rows.push(f);
        i++;
      }
      if (rows.length) {
        blocks.push(
          <table className="md-field-table" key={key++}>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>
                  <td className="md-field-label">{renderInline(r.label, `${key}-${ri}l`)}</td>
                  <td className="md-field-value">{renderInline(r.value, `${key}-${ri}v`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
        continue;
      }
    }

    // Bulleted list
    if (/^\s*[-*•]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*•]\s+/, ''));
        i++;
      }
      blocks.push(
        <ul className="md-list" key={key++}>
          {items.map((it, ii) => <li key={ii}>{renderInline(it, `${key}-${ii}`)}</li>)}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ''));
        i++;
      }
      blocks.push(
        <ol className="md-list" key={key++}>
          {items.map((it, ii) => <li key={ii}>{renderInline(it, `${key}-${ii}`)}</li>)}
        </ol>
      );
      continue;
    }

    // Default: paragraph — collect contiguous non-empty, non-special lines
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,4})\s+/.test(lines[i]) &&
      !/^\s*[-*•]\s+/.test(lines[i]) &&
      !/^\s*\d+[.)]\s+/.test(lines[i]) &&
      !isFieldLine(lines[i]) &&
      !(/^[A-Z][A-Za-z0-9 &/'\-]{2,60}:$/.test(lines[i].trim()) && lines[i].trim().length < 64)
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length) {
      blocks.push(<p className="md-paragraph" key={key++}>{renderInline(paraLines.join(' '), key)}</p>);
    } else {
      i++;
    }
  }

  return <div className="md-content">{blocks}</div>;
}
