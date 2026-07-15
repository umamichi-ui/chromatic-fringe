# @umamichi-ui/chromatic-fringe

> 以下内容为 Composer 生成，未经过人工检查，请谨慎对待

Pointer-driven **chromatic fringe** on borders: red/cyan ghost edges whose offset follows a focus point (mouse immediate; touch / coarse pointer eased). Inspired by lens chromatic aberration; kept optically light for Umamichi UI hairlines and control boxes.

## Install

```bash
npm install @umamichi-ui/chromatic-fringe
```

Local development:

```json
"@umamichi-ui/chromatic-fringe": "file:../umamichi-ui/chromatic-fringe"
```

## Usage

```js
import '@umamichi-ui/chromatic-fringe';
import { initChromaticFringe } from '@umamichi-ui/chromatic-fringe/init';

initChromaticFringe({
  buttonSelector: '.outline-button, .primary-button, .secondary-button',
  dropdownSelector: '.dropdown-menu-panel.is-open',
  skipClosest: '.app-topbar',
  depths: { button: 0.65, dropdown: 1.35 },
});
```

### Focus depth (`--lens-focus-depth`)

Global camera focus `F` on `html` (registered with `@property`, transitions by default). Rest / page plane is `--lens-focus-depth-rest` (`F0`, default `1`). While an open floating menu is present, `F` eases to `--lens-focus-depth-overlay` (default `1.35`).

Every target with surface depth `d` uses the same equivalent depth:

```text
d_eff = d + |d - F| - |d - F0|
```

When `F = F0`, this collapses to `d_eff = d`. No per-object “focus plane” flag: place a surface near focus by giving it `d ≈ F` (e.g. dropdown depth `1.35` matching the overlay focus).

### Marked edges

| Attribute | Effect |
|---|---|
| `data-lens-border="bottom"` | Bottom hairline + fringe (`overflow-x: clip`) |
| `data-lens-border="right"` | Right seam + fringe (`overflow-x/y: clip`) |
| `data-lens-depth="0.9"` | Surface depth `d` (optional) |

Line color: `--chromatic-fringe-line` (falls back to `--site-header-border`, then `--site-border`).

### Box fringe

JS adds `.chromatic-fringe-box` to matched buttons / open dropdowns. Optional fade of an existing gray border via `.chromatic-fringe-box--fade-border` and `--chromatic-fringe-border`. Floating menu panels keep `position: fixed`.

Ghost colors: `--chromatic-fringe-red`, `--chromatic-fringe-cyan`.

Respects `prefers-reduced-motion: reduce`.

## License

MIT.
