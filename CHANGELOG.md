# Changelog

## 0.2.0

- Add global `--lens-focus-depth` (with `@property` + transition). Open dropdowns raise it via `:has(.…is-open)`; JS multiplies background target depth by the live computed value while focus-plane overlays (open menus) keep their base depth.
- Options: `focusDepthAnimMs`, `isFocusPlaneTarget`, `isOverlayElevating`.
- Keep floating menu panels `position: fixed` when the box fringe class is applied.

## 0.1.0

- Initial release: CSS primitives for `data-lens-border` edges and `.chromatic-fringe-box`, plus `initChromaticFringe()`.
