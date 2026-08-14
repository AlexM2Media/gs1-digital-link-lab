import { zlibSync } from 'fflate'
import qrcode from 'qrcode-generator'

export type QrErrorCorrection = 'L' | 'M' | 'Q' | 'H'

export interface QrGenerationOptions {
  readonly value: string
  readonly errorCorrection: QrErrorCorrection
  readonly margin: number
  readonly scale: number
}

export interface QrBinaryAsset {
  readonly mimeType: 'image/png' | 'image/bmp'
  readonly extension: 'png' | 'bmp'
  readonly bytes: Uint8Array
}

export interface QrSvgAsset {
  readonly mimeType: 'image/svg+xml'
  readonly extension: 'svg'
  readonly content: string
}

export interface QrAssets {
  readonly png: QrBinaryAsset
  readonly bmp: QrBinaryAsset
  readonly svg: QrSvgAsset
  readonly size: number
}

type QrMatrix = readonly (readonly boolean[])[]

export function generateQrAssets(options: QrGenerationOptions): QrAssets {
  validateOptions(options)
  const matrix = createQrMatrix(options.value, options.errorCorrection)
  const pixels = renderPixels(matrix, options.margin, options.scale)

  return {
    png: { mimeType: 'image/png', extension: 'png', bytes: encodePng(pixels) },
    bmp: { mimeType: 'image/bmp', extension: 'bmp', bytes: encodeMonochromeBmp(pixels) },
    svg: { mimeType: 'image/svg+xml', extension: 'svg', content: encodeSvg(matrix, options.margin, options.scale) },
    size: pixels.length,
  }
}

export function downloadQrAsset(asset: QrBinaryAsset | QrSvgAsset, filename: string): void {
  const blob = 'bytes' in asset
    ? new Blob([Uint8Array.from(asset.bytes).buffer], { type: asset.mimeType })
    : new Blob([asset.content], { type: asset.mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${filename}.${asset.extension}`
  anchor.click()
  URL.revokeObjectURL(url)
}

function validateOptions(options: QrGenerationOptions): void {
  if (options.value.length === 0) {
    throw new RangeError('A QR code requires a value.')
  }
  if (!Number.isInteger(options.margin) || options.margin < 0) {
    throw new RangeError('The QR margin must be a non-negative integer.')
  }
  if (!Number.isInteger(options.scale) || options.scale < 1) {
    throw new RangeError('The QR scale must be an integer greater than zero.')
  }
}

function createQrMatrix(value: string, errorCorrection: QrErrorCorrection): QrMatrix {
  const code = qrcode(0, errorCorrection)
  code.addData(value, 'Byte')
  code.make()

  const moduleCount = code.getModuleCount()
  return Array.from({ length: moduleCount }, (_, row) =>
    Array.from({ length: moduleCount }, (_, column) => code.isDark(row, column)),
  )
}

function renderPixels(matrix: QrMatrix, margin: number, scale: number): QrMatrix {
  const moduleCount = matrix.length
  const modulesWithMargin = moduleCount + margin * 2
  const pixels = Array.from({ length: modulesWithMargin * scale }, () =>
    Array<boolean>(modulesWithMargin * scale).fill(false),
  )

  for (let row = 0; row < moduleCount; row += 1) {
    for (let column = 0; column < moduleCount; column += 1) {
      if (!matrix[row][column]) {
        continue
      }
      paintModule(pixels, row + margin, column + margin, scale)
    }
  }

  return pixels
}

function paintModule(pixels: boolean[][], row: number, column: number, scale: number): void {
  for (let vertical = 0; vertical < scale; vertical += 1) {
    for (let horizontal = 0; horizontal < scale; horizontal += 1) {
      pixels[row * scale + vertical][column * scale + horizontal] = true
    }
  }
}

function encodePng(pixels: QrMatrix): Uint8Array {
  const size = pixels.length
  const raw = new Uint8Array(size * (size * 3 + 1))
  let offset = 0

  for (const row of pixels) {
    raw[offset] = 0
    offset += 1
    for (const isDark of row) {
      const color = isDark ? 0 : 255
      raw[offset] = color
      raw[offset + 1] = color
      raw[offset + 2] = color
      offset += 3
    }
  }

  const header = new Uint8Array(13)
  writeUint32BigEndian(header, 0, size)
  writeUint32BigEndian(header, 4, size)
  header[8] = 8
  header[9] = 2

  return joinBytes([
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', zlibSync(raw)),
    pngChunk('IEND', new Uint8Array()),
  ])
}

function encodeMonochromeBmp(pixels: QrMatrix): Uint8Array {
  const size = pixels.length
  const bytesPerRow = Math.ceil(size / 8)
  const paddedBytesPerRow = Math.ceil(bytesPerRow / 4) * 4
  const pixelDataSize = paddedBytesPerRow * size
  const pixelOffset = 62
  const bytes = new Uint8Array(pixelOffset + pixelDataSize)

  bytes.set([0x42, 0x4d])
  writeUint32LittleEndian(bytes, 2, bytes.length)
  writeUint32LittleEndian(bytes, 10, pixelOffset)
  writeUint32LittleEndian(bytes, 14, 40)
  writeUint32LittleEndian(bytes, 18, size)
  writeUint32LittleEndian(bytes, 22, size)
  writeUint16LittleEndian(bytes, 26, 1)
  writeUint16LittleEndian(bytes, 28, 1)
  writeUint32LittleEndian(bytes, 34, pixelDataSize)
  writeUint32LittleEndian(bytes, 46, 2)
  bytes.set([0, 0, 0, 0, 255, 255, 255, 0], 54)

  for (let row = 0; row < size; row += 1) {
    const offset = pixelOffset + (size - 1 - row) * paddedBytesPerRow
    bytes.fill(0xff, offset, offset + paddedBytesPerRow)
    for (let column = 0; column < size; column += 1) {
      if (pixels[row][column]) {
        bytes[offset + Math.floor(column / 8)] &= ~(1 << (7 - (column % 8)))
      }
    }
  }

  return bytes
}

function encodeSvg(matrix: QrMatrix, margin: number, scale: number): string {
  const size = (matrix.length + margin * 2) * scale
  const commands: string[] = []

  for (let row = 0; row < matrix.length; row += 1) {
    for (let column = 0; column < matrix.length; column += 1) {
      if (matrix[row][column]) {
        commands.push(`M${(column + margin) * scale} ${(row + margin) * scale}h${scale}v${scale}h-${scale}z`)
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="100%" height="100%" fill="#FFFFFF"/><path fill="#000000" d="${commands.join('')}"/></svg>`
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type)
  const chunk = new Uint8Array(12 + data.length)
  writeUint32BigEndian(chunk, 0, data.length)
  chunk.set(typeBytes, 4)
  chunk.set(data, 8)
  writeUint32BigEndian(chunk, 8 + data.length, crc32(joinBytes([typeBytes, data])))
  return chunk
}

function crc32(bytes: Uint8Array): number {
  let value = 0xffffffff
  for (const byte of bytes) {
    value ^= byte
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0)
    }
  }
  return (value ^ 0xffffffff) >>> 0
}

function joinBytes(chunks: readonly Uint8Array[]): Uint8Array {
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0)
  const output = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) {
    output.set(chunk, offset)
    offset += chunk.length
  }
  return output
}

function writeUint16LittleEndian(bytes: Uint8Array, offset: number, value: number): void {
  new DataView(bytes.buffer).setUint16(offset, value, true)
}

function writeUint32LittleEndian(bytes: Uint8Array, offset: number, value: number): void {
  new DataView(bytes.buffer).setUint32(offset, value, true)
}

function writeUint32BigEndian(bytes: Uint8Array, offset: number, value: number): void {
  new DataView(bytes.buffer).setUint32(offset, value)
}