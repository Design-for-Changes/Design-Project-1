// -z preserves Unicode, spaces, tabs, and newlines in student filenames.
export function parseTree(raw) {
  return raw.split('\0').filter(Boolean).map(line => {
    const split = line.indexOf('\t');
    const [, type, blob, size] = line.slice(0, split).trim().split(/\s+/);
    return { type, blob, size: Number(size), path: line.slice(split + 1) };
  });
}
