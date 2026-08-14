import { BrowserMultiFormatReader } from '@zxing/browser'
import type { ScanResult } from '../core/types'

export interface CameraSession {
  stop(): void
}

export class BrowserScanner {
  async decodeImage(file: File): Promise<ScanResult> {
    const detector = getBarcodeDetector()
    if (detector) {
      try {
        const bitmap = await createImageBitmap(file)
        try {
          const results = await detector.detect(bitmap)
          if (results.length > 0) return toScanResult(results[0].rawValue, results[0].format, 'image')
        } finally { bitmap.close() }
      } catch { /* Fall through to bundled ZXing. */ }
    }

    const imageUrl = URL.createObjectURL(file)
    try {
      const result = await new BrowserMultiFormatReader().decodeFromImageUrl(imageUrl)
      return toScanResult(result.getText(), result.getBarcodeFormat().toString(), 'image')
    } finally {
      URL.revokeObjectURL(imageUrl)
    }
  }

  async startCamera(video: HTMLVideoElement, onResult: (result: ScanResult) => void): Promise<CameraSession> {
    const detector = getBarcodeDetector()
    if (detector) return this.startNativeCamera(video, detector, onResult)

    const reader = new BrowserMultiFormatReader()
    const controls = await reader.decodeFromConstraints(
      { video: { facingMode: { ideal: 'environment' } }, audio: false },
      video,
      (result) => {
        if (result) onResult(toScanResult(result.getText(), result.getBarcodeFormat().toString(), 'camera'))
      },
    )
    return { stop: () => controls.stop() }
  }

  private async startNativeCamera(
    video: HTMLVideoElement,
    detector: BarcodeDetectorLike,
    onResult: (result: ScanResult) => void,
  ): Promise<CameraSession> {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
    video.srcObject = stream
    await video.play()
    let active = true
    let pending = false

    const scanFrame = (): void => {
      if (!active) return
      if (!pending && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        pending = true
        void detector.detect(video).then((results) => {
          if (results.length > 0) onResult(toScanResult(results[0].rawValue, results[0].format, 'camera'))
        }).catch(() => undefined).finally(() => { pending = false })
      }
      requestAnimationFrame(scanFrame)
    }
    requestAnimationFrame(scanFrame)

    return {
      stop: () => {
        active = false
        stream.getTracks().forEach((track) => track.stop())
        video.srcObject = null
      },
    }
  }
}

interface DetectedBarcode {
  readonly rawValue: string
  readonly format: string
}

interface BarcodeDetectorLike {
  detect(source: ImageBitmap | HTMLVideoElement): Promise<DetectedBarcode[]>
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorLike
}

function getBarcodeDetector(): BarcodeDetectorLike | undefined {
  const constructor = (globalThis as typeof globalThis & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector
  return constructor ? new constructor({ formats: ['qr_code', 'data_matrix', 'code_128', 'ean_13', 'ean_8'] }) : undefined
}

function toScanResult(value: string, format: string, source: ScanResult['source']): ScanResult {
  if (!value) throw new Error('The code did not contain a readable value.')
  return { value, format, source }
}