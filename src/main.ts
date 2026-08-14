import './style.css'
import { getAiDefinition } from './core/ai-catalog'
import { buildDigitalLink, parseDigitalLink } from './core/digital-link'
import { generationInputToDigitalLinkData } from './core/generation-input'
import { detectInputFormat } from './core/input-format'
import { downloadQrAsset, generateQrAssets, type QrAssets, type QrErrorCorrection } from './core/qr'
import type { DigitalLinkError, DigitalLinkParseResult, GenerationInput } from './core/types'
import { detectLocale, translate, type Locale } from './i18n'
import type { BrowserScanner, CameraSession } from './scanning/browser-scanner'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('Application root is missing.')
const root = app

let locale = detectLocale()
let assets: QrAssets | undefined
let cameraSession: CameraSession | undefined
let scannerPromise: Promise<BrowserScanner> | undefined
const t = (key: Parameters<typeof translate>[1]) => translate(locale, key)

function render(): void {
  cameraSession?.stop()
  cameraSession = undefined
  root.innerHTML = `<main class="app-shell"><header class="app-header"><div><p class="eyebrow">${t('version')}</p><h1>${t('appName')}</h1><p>${t('tagline')}</p></div><label class="language"><span>${t('language')}</span><select id="language"><option value="es">ES</option><option value="en">EN</option></select></label></header><nav class="tabs" role="tablist" aria-label="${t('appName')}"><button type="button" role="tab" id="tab-generate" aria-selected="true" aria-controls="panel-generate">${t('generate')}</button><button type="button" role="tab" id="tab-analyze" aria-selected="false" aria-controls="panel-analyze">${t('analyze')}</button><button type="button" role="tab" id="tab-scan" aria-selected="false" aria-controls="panel-scan">${t('scan')}</button></nav><section id="panel-generate" role="tabpanel" aria-labelledby="tab-generate"><form id="generate-form" class="workspace" novalidate><div class="form-grid">${field('domain', t('domain'), 'url', 'https://example.org', true, 'wide')}${field('gtin', aiLabel('01'), 'text', '', true)}${field('lot', aiLabel('10'))}${field('variant', aiLabel('22'))}${field('serial', aiLabel('21'))}${field('productionDate', aiLabel('11'), 'date')}${field('packagingDate', aiLabel('13'), 'date')}${field('bestBeforeDate', aiLabel('15'), 'date')}${field('sellByDate', aiLabel('16'), 'date')}${field('expirationDate', aiLabel('17'), 'date')}${field('netWeightKg', aiLabel('3103'), 'text', '1.250')}${field('price', aiLabel('3922'), 'text', '12.99')}${field('pricePerKg', aiLabel('8005'), 'text', '8.99')}<label>${t('correction')}<select name="errorCorrection"><option>M</option><option>L</option><option>Q</option><option>H</option></select></label>${field('margin', t('margin'), 'number', '4', true)}${field('scale', t('scale'), 'number', '6', true)}</div><button class="primary-action" type="submit">${t('createQr')}</button></form><section id="generate-result" class="result" aria-live="polite"></section></section><section id="panel-analyze" role="tabpanel" aria-labelledby="tab-analyze" hidden><form id="analyze-form" class="workspace compact"><label>${t('input')}<textarea id="analyze-input" rows="5" required></textarea></label><button class="primary-action" type="submit">${t('analyzeInput')}</button></form><section id="analyze-result" class="result" aria-live="polite"></section></section><section id="panel-scan" role="tabpanel" aria-labelledby="tab-scan" hidden><div class="workspace compact"><label>${t('scannerInput')}<input id="scan-input" autocomplete="off"><span class="field-help">${t('scannerHint')}</span></label><p class="notice">${t('scanUnavailable')}</p></div><section id="scan-result" class="result" aria-live="polite"></section></section></main>`
  document.querySelector<HTMLSelectElement>('#language')!.value = locale
  bindInteractions()
}

function field(name: string, label: string, type = 'text', value = '', required = false, className = ''): string {
  return `<label class="${className}">${label}<input name="${name}" type="${type}" value="${value}" ${required ? 'required' : ''}></label>`
}

function aiLabel(ai: string): string {
  const definition = getAiDefinition(ai)
  return definition ? `AI ${ai} - ${definition.name[locale]}` : `AI ${ai}`
}

function bindInteractions(): void {
  document.querySelector<HTMLSelectElement>('#language')!.addEventListener('change', (event) => {
    locale = (event.currentTarget as HTMLSelectElement).value as Locale
    render()
  })
  document.querySelectorAll<HTMLButtonElement>('[role="tab"]').forEach((tab) => tab.addEventListener('click', () => selectTab(tab)))
  document.querySelector<HTMLFormElement>('#generate-form')!.addEventListener('submit', generate)
  document.querySelector<HTMLFormElement>('#analyze-form')!.addEventListener('submit', analyze)
  const scanInput = document.querySelector<HTMLInputElement>('#scan-input')!
  scanInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      showAnalysis((event.currentTarget as HTMLInputElement).value, '#scan-result')
    }
  })
  scanInput.addEventListener('paste', () => window.setTimeout(() => showAnalysis(scanInput.value, '#scan-result'), 0))
  addScanControls(scanInput)
}

function addScanControls(scanInput: HTMLInputElement): void {
  const container = scanInput.closest<HTMLElement>('.workspace')!
  const controls = document.createElement('div')
  controls.className = 'scan-controls'
  const imageInput = document.createElement('input')
  imageInput.type = 'file'
  imageInput.accept = 'image/*'
  imageInput.setAttribute('aria-label', t('loadImage'))
  const cameraButton = document.createElement('button')
  cameraButton.type = 'button'
  cameraButton.textContent = t('startCamera')
  const video = document.createElement('video')
  video.className = 'camera-preview'
  video.muted = true
  video.playsInline = true
  video.hidden = true
  imageInput.addEventListener('change', () => {
    const file = imageInput.files?.[0]
    if (!file) return
    void getScanner().then((scanner) => scanner.decodeImage(file)).then((result) => showAnalysis(result.value, '#scan-result')).catch(() => showScanError(t('imageError')))
  })
  cameraButton.addEventListener('click', () => {
    if (cameraSession) {
      cameraSession.stop()
      cameraSession = undefined
      video.hidden = true
      cameraButton.textContent = t('startCamera')
      return
    }
    void getScanner().then((scanner) => scanner.startCamera(video, (result) => showAnalysis(result.value, '#scan-result'))).then((session) => {
      cameraSession = session
      video.hidden = false
      cameraButton.textContent = t('stopCamera')
    }).catch(() => showScanError(t('cameraError')))
  })
  controls.append(imageInput, cameraButton, video)
  container.append(controls)
}

function showScanError(text: string): void {
  document.querySelector<HTMLElement>('#scan-result')!.replaceChildren(message('error', text))
}

function getScanner(): Promise<BrowserScanner> {
  scannerPromise ??= import('./scanning/browser-scanner').then(({ BrowserScanner }) => new BrowserScanner())
  return scannerPromise
}

function selectTab(selected: HTMLButtonElement): void {
  document.querySelectorAll<HTMLButtonElement>('[role="tab"]').forEach((tab) => {
    const active = tab === selected
    tab.setAttribute('aria-selected', String(active))
    document.querySelector<HTMLElement>(`#${tab.getAttribute('aria-controls')}`)!.hidden = !active
  })
}

function generate(event: SubmitEvent): void {
  event.preventDefault()
  const form = event.currentTarget as HTMLFormElement
  if (!form.reportValidity()) return
  const values = Object.fromEntries(new FormData(form)) as Record<string, string>
  const input: GenerationInput = {
    domain: values.domain, gtin: values.gtin, lot: values.lot, serial: values.serial, variant: values.variant,
    productionDate: values.productionDate, packagingDate: values.packagingDate, bestBeforeDate: values.bestBeforeDate,
    sellByDate: values.sellByDate, expirationDate: values.expirationDate, netWeightKg: values.netWeightKg,
    price: values.price, pricePerKg: values.pricePerKg,
  }
  const dataResult = generationInputToDigitalLinkData(input)
  if (!dataResult.data) return showErrors('#generate-result', dataResult.errors)
  const generated = buildDigitalLink(dataResult.data, input.domain)
  if (!generated.uri) return showErrors('#generate-result', generated.errors)
  assets = generateQrAssets({ value: generated.uri, errorCorrection: values.errorCorrection as QrErrorCorrection, margin: Number(values.margin), scale: Number(values.scale) })
  document.querySelector<HTMLElement>('#generate-result')!.replaceChildren(message('success', generated.uri), qrPreview(assets.svg.content), downloadButtons())
}

function analyze(event: SubmitEvent): void {
  event.preventDefault()
  showAnalysis(document.querySelector<HTMLTextAreaElement>('#analyze-input')!.value, '#analyze-result')
}

function showAnalysis(input: string, selector: string): void {
  const target = document.querySelector<HTMLElement>(selector)!
  const detected = detectInputFormat(input)
  if (detected.format === 'invalid') return target.replaceChildren(message('error', t('invalidInput')))
  if (detected.format !== 'digital-link') return target.replaceChildren(message('notice', `${t('detectedFormat')}: ${detected.format}. ${t('notDigitalLink')}`))
  target.replaceChildren(analysisResult(parseDigitalLink(detected.normalizedInput), detected.format))
}

function analysisResult(result: DigitalLinkParseResult, format: string): HTMLElement {
  if (!result.ok || !result.data) return errorList(result.errors)
  const container = document.createElement('div')
  container.className = 'analysis-output'
  container.append(message('notice', `${t('detectedFormat')}: ${format}`), message('success', `${t('normalizedUri')}: ${result.normalizedUri ?? ''}`))
  const heading = document.createElement('h2')
  heading.textContent = t('aiFields')
  container.append(heading)
  const list = document.createElement('dl')
  for (const item of [result.data.primaryIdentifier, ...result.data.qualifiers, ...result.data.attributes]) {
    const term = document.createElement('dt')
    const definition = getAiDefinition(item.ai)
    term.textContent = definition ? `AI ${item.ai} - ${definition.name[locale]}` : `AI ${item.ai}`
    const value = document.createElement('dd')
    value.textContent = item.value
    list.append(term, value)
  }
  container.append(list)
  return container
}

function showErrors(selector: string, errors: readonly DigitalLinkError[]): void {
  document.querySelector<HTMLElement>(selector)!.replaceChildren(errorList(errors))
}

function errorList(errors: readonly DigitalLinkError[]): HTMLElement {
  const list = document.createElement('ul')
  list.className = 'error-list'
  for (const error of errors) { const item = document.createElement('li'); item.textContent = error.message; list.append(item) }
  return list
}

function message(kind: 'success' | 'error' | 'notice', content: string): HTMLElement {
  const element = document.createElement('p')
  element.className = `message ${kind}`
  element.textContent = content
  return element
}

function qrPreview(svg: string): HTMLElement {
  const image = document.createElement('img')
  image.className = 'qr-preview'
  image.alt = 'GS1 Digital Link QR'
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  return image
}

function downloadButtons(): HTMLElement {
  const group = document.createElement('div')
  group.className = 'downloads'
  for (const [key, asset] of Object.entries({ png: assets?.png, bmp: assets?.bmp, svg: assets?.svg })) {
    if (!asset) continue
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = t(`download${key[0].toUpperCase()}${key.slice(1)}` as 'downloadPng' | 'downloadBmp' | 'downloadSvg')
    button.addEventListener('click', () => downloadQrAsset(asset, 'gs1-digital-link'))
    group.append(button)
  }
  return group
}

render()