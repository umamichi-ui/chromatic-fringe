# Changelog

## 0.4.0

- Fix `effectiveLensDepth()` to match documented optics:
  `d_eff = d + |d - F| - |d - F0|` (was a ratio approximation in 0.3.0).
- Move page-control hover / press depth dampening into package CSS via
  `--lens-interaction-scale` (`@property`) and `--chromatic-fringe-interaction-*` tokens.
- Floating overlays get `.chromatic-fringe-box--overlay` (fixed position + no interaction dampening).
- Slightly subtler ghost intensity (high-frequency pointer tracking); touch lerp default `0.18`.

## 0.3.0

- Unified equivalent depth for every target:
  `d_eff = d + |d - F| - |d - F0|` where `F` is `--lens-focus-depth` and `F0` is `--lens-focus-depth-rest` (default `1`).
  When `F = F0`, `d_eff = d` (previous rest-state behavior).
- Removed focus-plane exemption / `isFocusPlaneTarget` — overlays are not special-cased; aligning `depths.dropdown` with `--lens-focus-depth-overlay` places the menu near focus by depth numbers alone.
- Export `effectiveLensDepth()`.

## 0.2.0

- Add global `--lens-focus-depth` (with `@property` + transition). Open dropdowns raise it via `:has(.…is-open)`; JS multiplies background target depth by the live computed value while focus-plane overlays (open menus) keep their base depth.
- Options: `focusDepthAnimMs`, `isFocusPlaneTarget`, `isOverlayElevating`.
- Keep floating menu panels `position: fixed` when the box fringe class is applied.

## 0.1.0

- Initial release: CSS primitives for `data-lens-border` edges and `.chromatic-fringe-box`, plus `initChromaticFringe()`.
