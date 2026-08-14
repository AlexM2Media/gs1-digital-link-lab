import { unzlibSync } from 'fflate'
import { describe, expect, it } from 'vitest'

import { generateQrAssets } from './qr'

const options = {
  value: 'https://example.org/01/08456789000007/10/LOT-42?17=270131',
  errorCorrection: 'M' as const,
  margin: 4,
  scale: 3,
}

describe('QR exports', () => {
  it('generates an opaque RGB PNG using only black and white pixels', () => {
    const png = generateQrAssets(options).png.bytes
    expect([...png.slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10])

    const ihdrLength = readUint32BigEndian(png, 8)
    expect(new TextDecoder().decode(png.slice(12, 16))).toBe('IHDR')
    expect(png[25]).toBe(2)

    const idatStart = 8 + 12 + ihdrLength
    const idatLength = readUint32BigEndian(png, idatStart)
    const rgb = unzlibSync(png.slice(idatStart + 8, idatStart + 8 + idatLength))
    const colorBytes = rgb.filter((_, offset) => offset % (generateQrAssets(options).size * 3 + 1) !== 0)
    expect([...new Set(colorBytes)]).toEqual(expect.arrayContaining([0, 255]))
    expect([...new Set(colorBytes)].every((color) => color === 0 || color === 255)).toBe(true)
  })

  it('generates a 1-bit BMP with a black and white palette', () => {
    const bmp = generateQrAssets(options).bmp.bytes
    expect(new TextDecoder().decode(bmp.slice(0, 2))).toBe('BM')
    expect(readUint16LittleEndian(bmp, 28)).toBe(1)
    expect([...bmp.slice(54, 62)]).toEqual([0, 0, 0, 0, 255, 255, 255, 0])
  })

  it('generates an SVG with a white background and black foreground', () => {
    const svg = generateQrAssets(options).svg.content
    expect(svg).toContain('fill="#FFFFFF"')
    expect(svg).toContain('fill="#000000"')
    expect(svg).not.toContain('opacity')
  })
})

function readUint16LittleEndian(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer).getUint16(offset, true)
}

function readUint32BigEndian(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer).getUint32(offset)
}