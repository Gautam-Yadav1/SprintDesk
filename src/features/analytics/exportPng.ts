/**
 * Bonus feature: export the analytics view as a PNG, with no extra dependency.
 *
 * Recharts renders SVG, so each chart is serialised, rasterised through an
 * `Image`, and composed onto a canvas. HTML legends are not part of the SVG, so
 * they are redrawn from the `data-legend-*` attributes `ChartLegend` emits.
 */

export interface ExportTheme {
  surface: string
  text: string
  muted: string
  grid: string
}

interface Panel {
  title: string
  image: HTMLImageElement
  width: number
  height: number
  legend: { label: string; color: string; value?: string; share?: string }[]
}

const PADDING = 32
const HEADER_HEIGHT = 76
const CELL_WIDTH = 560
const CELL_GAP = 24
const TITLE_HEIGHT = 26
const LEGEND_LINE = 20

function loadSvg(svg: SVGSVGElement, width: number, height: number): Promise<HTMLImageElement> {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))

  const source = new XMLSerializer().serializeToString(clone)
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`

  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Chart could not be rasterised'))
    image.src = url
  })
}

function readLegend(figure: HTMLElement): Panel['legend'] {
  return Array.from(figure.querySelectorAll<HTMLElement>('[data-legend-item]')).map((item) => ({
    label: item.dataset.legendItem ?? '',
    color: item.dataset.legendColor ?? '#888888',
    value: item.dataset.legendValue,
    share: item.dataset.legendShare,
  }))
}

async function collectPanels(root: HTMLElement): Promise<Panel[]> {
  const figures = Array.from(root.querySelectorAll<HTMLElement>('[data-chart-export]'))
  const panels: Panel[] = []

  for (const figure of figures) {
    const svg = figure.querySelector('svg')
    if (!svg) continue

    const box = svg.getBoundingClientRect()
    const width = Math.max(1, Math.round(box.width))
    const height = Math.max(1, Math.round(box.height))
    panels.push({
      title: figure.dataset.chartExport ?? '',
      image: await loadSvg(svg as SVGSVGElement, width, height),
      width,
      height,
      legend: readLegend(figure),
    })
  }

  return panels
}

/** Renders every `[data-chart-export]` figure inside `root` into one PNG download. */
export async function exportAnalyticsPng(
  root: HTMLElement,
  theme: ExportTheme,
  filename: string,
): Promise<void> {
  const panels = await collectPanels(root)
  if (panels.length === 0) throw new Error('There are no charts to export')

  const columns = panels.length > 1 ? 2 : 1
  const rows = Math.ceil(panels.length / columns)
  const cellHeights: number[] = []
  for (let row = 0; row < rows; row += 1) {
    const inRow = panels.slice(row * columns, row * columns + columns)
    cellHeights.push(
      Math.max(
        ...inRow.map((panel) => {
          const scale = Math.min(1, (CELL_WIDTH - 24) / panel.width)
          return (
            TITLE_HEIGHT +
            panel.height * scale +
            (panel.legend.length > 0 ? LEGEND_LINE * panel.legend.length + 8 : 0)
          )
        }),
      ),
    )
  }

  const width = PADDING * 2 + CELL_WIDTH * columns + CELL_GAP * (columns - 1)
  const height =
    PADDING * 2 +
    HEADER_HEIGHT +
    cellHeights.reduce((sum, cell) => sum + cell, 0) +
    CELL_GAP * (rows - 1)

  const ratio = Math.min(2, window.devicePixelRatio || 1)
  const canvas = document.createElement('canvas')
  canvas.width = width * ratio
  canvas.height = height * ratio

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is not available in this browser')
  context.scale(ratio, ratio)

  context.fillStyle = theme.surface
  context.fillRect(0, 0, width, height)

  const font = 'system-ui, -apple-system, "Segoe UI", sans-serif'
  context.fillStyle = theme.text
  context.font = `600 22px ${font}`
  context.fillText('SprintDesk analytics', PADDING, PADDING + 22)
  context.fillStyle = theme.muted
  context.font = `13px ${font}`
  context.fillText(
    `Exported ${new Date().toLocaleString('en-GB')}`,
    PADDING,
    PADDING + 44,
  )
  context.strokeStyle = theme.grid
  context.beginPath()
  context.moveTo(PADDING, PADDING + HEADER_HEIGHT - 16)
  context.lineTo(width - PADDING, PADDING + HEADER_HEIGHT - 16)
  context.stroke()

  let offsetY = PADDING + HEADER_HEIGHT
  panels.forEach((panel, index) => {
    const column = index % columns
    const row = Math.floor(index / columns)
    if (column === 0 && row > 0) offsetY += cellHeights[row - 1]! + CELL_GAP

    const x = PADDING + column * (CELL_WIDTH + CELL_GAP)
    context.fillStyle = theme.text
    context.font = `600 14px ${font}`
    context.fillText(panel.title, x, offsetY + 16)

    const scale = Math.min(1, (CELL_WIDTH - 24) / panel.width)
    context.drawImage(
      panel.image,
      x,
      offsetY + TITLE_HEIGHT,
      panel.width * scale,
      panel.height * scale,
    )

    let legendY = offsetY + TITLE_HEIGHT + panel.height * scale + 16
    context.font = `12px ${font}`
    for (const item of panel.legend) {
      context.fillStyle = item.color
      context.fillRect(x, legendY - 8, 9, 9)
      context.fillStyle = theme.muted
      const value = item.value ? `  ${item.value}${item.share ? ` (${item.share})` : ''}` : ''
      context.fillText(`${item.label}${value}`, x + 16, legendY)
      legendY += LEGEND_LINE
    }
  })

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('The export could not be encoded')

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'

  // The anchor has to be in the document for Chrome to honour `download`, and
  // the object URL has to stay alive until the browser has finished writing the
  // file — revoking it straight after the click cancels the download mid-flight.
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
