/**
 * The SprintDesk lockup: the pinned index card and the handwritten wordmark.
 *
 * Inlined rather than loaded through `<img src="…svg">` on purpose. An SVG used
 * as an image is its own isolated document, so it cannot reach the Caveat face
 * the page has already loaded — the wordmark would silently fall back to the
 * browser's default cursive. Inline, it uses the same font and the same theme
 * tokens as everything else, so the mark follows the light/dark ramp instead of
 * carrying baked-in hexes.
 *
 * Decorative here: every caller wraps it in a link that carries the label.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 72" className={className} aria-hidden="true" focusable="false">
      <g transform="translate(6,10) rotate(-6 26 26)">
        <rect
          x="2"
          y="2"
          width="48"
          height="48"
          rx="2"
          fill="var(--card)"
          stroke="var(--card-line)"
          strokeWidth="1.5"
        />
        <rect x="14" y="-6" width="16" height="12" fill="var(--red)" />
        <line
          x1="10"
          y1="26"
          x2="42"
          y2="26"
          stroke="var(--card-line)"
          strokeWidth="2"
          strokeDasharray="3 3"
        />
        <line
          x1="10"
          y1="34"
          x2="34"
          y2="34"
          stroke="var(--card-line)"
          strokeWidth="2"
          strokeDasharray="3 3"
        />
        <circle cx="22" cy="10" r="3.2" fill="var(--red)" />
      </g>

      {/* `textLength` pins the wordmark's width, so the lockup does not reflow
          between the fallback face and Caveat arriving. */}
      <text
        x="66"
        y="46"
        className="font-display"
        fontSize="44"
        fontWeight="700"
        fill="var(--red)"
        textLength="190"
        lengthAdjust="spacingAndGlyphs"
      >
        SprintDesk
      </text>
    </svg>
  )
}
