export const pdfFixture = (text = '', pageCount = 1) => {
  const characters = [...new Set([...text])]
  const codes = new Map(characters.map((character, index) => [character, index + 32]))
  const codepoints = [...text].map((character) => codes.get(character).toString(16).padStart(2, '0')).join('')
  const cmap = `/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<20> <FF>\nendcodespacerange\n${characters.length} beginbfchar\n${characters.map((character) => { const code = codes.get(character).toString(16).padStart(2, '0'); const unicode = character.codePointAt(0).toString(16).padStart(4, '0'); return `<${code}> <${unicode}>` }).join('\n')}\nendbfchar\nendcmap\nCMapName currentdict /CMap defineresource pop\nend\nend`
  const stream = `BT /F1 12 Tf 20 100 Td <${codepoints}> Tj ET`
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${Array.from({ length: pageCount }, () => '3 0 R').join(' ')}] /Count ${pageCount} >>`,
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /ToUnicode 6 0 R >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    `<< /Length ${Buffer.byteLength(cmap)} >>\nstream\n${cmap}\nendstream`,
  ]
  let output = '%PDF-1.4\n'
  const offsets = [0]
  for (let index = 0; index < objects.length; index += 1) { offsets.push(Buffer.byteLength(output)); output += `${index + 1} 0 obj\n${objects[index]}\nendobj\n` }
  const xref = Buffer.byteLength(output)
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return Buffer.from(output, 'binary')
}
