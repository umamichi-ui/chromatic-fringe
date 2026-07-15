const INIT_KEY = '__umamichiChromaticFringeInit';

const BOX_CLASS = 'chromatic-fringe-box';
const FADE_BORDER_CLASS = 'chromatic-fringe-box--fade-border';

const DEFAULT_DROPDOWN_SELECTOR =
	'.dropdown-menu-panel.is-open, .download-format-menu-panel.is-open';
const DEFAULT_DEPTHS = {
	dropdown: 1.35,
	button: 0.65,
	default: 1,
};
const DEFAULT_MAX_OFFSET_PX = 1.75;
const DEFAULT_REF_DIAGONAL_FRACTION = 0.35;
const DEFAULT_TOUCH_EASE = 0.14;
const SETTLE_EPS_SQ = 0.25;
/** Keep re-applying while CSS `--lens-focus-depth` transitions. */
const DEFAULT_FOCUS_DEPTH_ANIM_MS = 320;
/** Rest / page-plane focus (matches CSS `--lens-focus-depth-rest`). */
const DEFAULT_FOCUS_DEPTH_REST = 1;

function clearLensVars(element) {
	element.style.removeProperty('--lens-ox');
	element.style.removeProperty('--lens-oy');
	element.style.removeProperty('--lens-main-a');
	element.style.removeProperty('--lens-ghost-a');
}

function isUsableLensElement(element, options) {
	if (element.hidden) {
		return false;
	}

	if (!options?.ignoreAriaHidden && element.getAttribute('aria-hidden') === 'true') {
		return false;
	}

	return element.getClientRects().length > 0;
}

function parseLensEdge(value) {
	if (value === 'bottom' || value === 'right') {
		return value;
	}

	return null;
}

function ensureBoxClasses(element, options) {
	element.classList.add(BOX_CLASS);

	if (options?.fadeBorder) {
		element.classList.add(FADE_BORDER_CLASS);
	}
}

function readCssNumber(name, fallback) {
	const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
	const value = Number(raw);

	return Number.isFinite(value) && value > 0 ? value : fallback;
}

/**
 * Equivalent lens depth from surface depth `d` and camera focus `F`.
 *
 * Optical reading: fringe scales with absolute defocus from the focus plane.
 * Relative to a rest focus `F0` (page plane), the change in defocus is
 * `|d - F| - |d - F0|`. Adding the element's rest fringe `d` gives:
 *
 *   d_eff(d, F) = d + |d - F| - |d - F0|
 *
 * Special case: when `F === F0` (default closed UI), `d_eff === d`.
 *
 * @param {number} surfaceDepth
 * @param {number} focusDepth
 * @param {number} restFocusDepth
 */
export function effectiveLensDepth(surfaceDepth, focusDepth, restFocusDepth = DEFAULT_FOCUS_DEPTH_REST) {
	const d = surfaceDepth;
	const F = focusDepth;
	const F0 = restFocusDepth;
	const value = d + Math.abs(d - F) - Math.abs(d - F0);

	return value > 0 ? value : 0;
}

/**
 * Pointer-driven chromatic fringe on opt-in borders.
 * @param {import('./init.d.ts').ChromaticFringeOptions} [options]
 */
export function initChromaticFringe(options = {}) {
	if (typeof window === 'undefined') {
		return;
	}

	if (window[INIT_KEY]) {
		return;
	}

	window[INIT_KEY] = true;

	const buttonSelector = options.buttonSelector?.trim() || '';
	const dropdownSelector = options.dropdownSelector?.trim() || DEFAULT_DROPDOWN_SELECTOR;
	const skipClosest = options.skipClosest?.trim() || '';
	const fadeDropdownBorder = options.fadeDropdownBorder !== false;
	const fadeBorderSelector = options.fadeBorderSelector?.trim() || '';
	const depths = {
		dropdown: options.depths?.dropdown ?? DEFAULT_DEPTHS.dropdown,
		button: options.depths?.button ?? DEFAULT_DEPTHS.button,
		default: options.depths?.default ?? DEFAULT_DEPTHS.default,
	};
	const maxOffsetPx = options.maxOffsetPx ?? DEFAULT_MAX_OFFSET_PX;
	const refDiagonalFraction = options.refDiagonalFraction ?? DEFAULT_REF_DIAGONAL_FRACTION;
	const touchEase = options.touchEase ?? DEFAULT_TOUCH_EASE;
	const focusDepthAnimMs = options.focusDepthAnimMs ?? DEFAULT_FOCUS_DEPTH_ANIM_MS;
	const rootAttributeFilter = options.rootAttributeFilter ?? [];
	const isMarkedTargetActive = options.isMarkedTargetActive;
	const markedIgnoreAriaHidden = options.markedIgnoreAriaHidden;
	const isOverlayElevating = options.isOverlayElevating;

	const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
	const coarsePointerQuery = window.matchMedia('(pointer: coarse)');

	let focusX = window.innerWidth / 2;
	let focusY = window.innerHeight / 2;
	let targetX = focusX;
	let targetY = focusY;
	let useEasing = false;
	let rafId = 0;
	let focusDepthAnimUntil = 0;
	let overlayElevating = false;

	const collectTargets = () => {
		const targets = [];
		const seen = new Set();

		const push = (element, depth, edge, usable) => {
			if (seen.has(element) || !isUsableLensElement(element, usable)) {
				return;
			}

			seen.add(element);
			targets.push({ element, depth, edge });
		};

		for (const element of document.querySelectorAll('[data-lens-border]')) {
			if (!(element instanceof HTMLElement)) {
				continue;
			}

			if (isMarkedTargetActive && !isMarkedTargetActive(element)) {
				continue;
			}

			const depthRaw = element.dataset.lensDepth;
			const depth = depthRaw ? Number(depthRaw) : depths.default;
			const ignoreAriaHidden = Boolean(markedIgnoreAriaHidden?.(element));

			push(
				element,
				Number.isFinite(depth) && depth > 0 ? depth : depths.default,
				parseLensEdge(element.dataset.lensBorder),
				ignoreAriaHidden ? { ignoreAriaHidden: true } : undefined,
			);
		}

		for (const element of document.querySelectorAll(dropdownSelector)) {
			if (!(element instanceof HTMLElement)) {
				continue;
			}

			ensureBoxClasses(element, { fadeBorder: fadeDropdownBorder });
			push(element, depths.dropdown, null);
		}

		if (buttonSelector) {
			for (const element of document.querySelectorAll(buttonSelector)) {
				if (!(element instanceof HTMLElement)) {
					continue;
				}

				if (skipClosest && element.closest(skipClosest)) {
					continue;
				}

				const fadeBorder = Boolean(
					fadeBorderSelector && element.matches(fadeBorderSelector),
				);
				ensureBoxClasses(element, { fadeBorder });
				push(element, depths.button, null);
			}
		}

		return targets;
	};

	const clearAllTargets = () => {
		for (const element of document.querySelectorAll('[data-lens-border]')) {
			if (element instanceof HTMLElement) {
				clearLensVars(element);
			}
		}

		for (const element of document.querySelectorAll(`.${BOX_CLASS}`)) {
			if (element instanceof HTMLElement) {
				clearLensVars(element);
			}
		}
	};

	const detectOverlayElevating = () => {
		if (isOverlayElevating) {
			return Boolean(isOverlayElevating());
		}

		return Boolean(document.querySelector(dropdownSelector));
	};

	const noteFocusDepthAnimation = () => {
		if (reducedMotionQuery.matches) {
			focusDepthAnimUntil = 0;
			return;
		}

		focusDepthAnimUntil = performance.now() + focusDepthAnimMs;
	};

	const syncOverlayElevation = () => {
		const next = detectOverlayElevating();

		if (next !== overlayElevating) {
			overlayElevating = next;
			noteFocusDepthAnimation();
		}
	};

	const applyLensVars = (targets) => {
		const ref = Math.hypot(window.innerWidth, window.innerHeight) * refDiagonalFraction;
		const focusDepth = readCssNumber('--lens-focus-depth', DEFAULT_FOCUS_DEPTH_REST);
		const restFocusDepth = readCssNumber('--lens-focus-depth-rest', DEFAULT_FOCUS_DEPTH_REST);

		for (const { element, depth, edge } of targets) {
			const effectiveDepth = effectiveLensDepth(depth, focusDepth, restFocusDepth);
			const rect = element.getBoundingClientRect();
			const cx = edge === 'right' ? rect.right : rect.left + rect.width / 2;
			const cy = edge === 'bottom' ? rect.bottom : rect.top + rect.height / 2;
			const vx = cx - focusX;
			const vy = cy - focusY;
			const dist = Math.hypot(vx, vy);
			const strength = Math.min(ref > 0 ? dist / ref : 0, 1) * effectiveDepth;
			const offset = strength * maxOffsetPx;
			const nx = dist > 0 ? vx / dist : 0;
			const ny = dist > 0 ? vy / dist : 0;
			const t = Math.min(strength, 1);

			element.style.setProperty('--lens-ox', `${nx * offset}px`);
			element.style.setProperty('--lens-oy', `${ny * offset}px`);
			element.style.setProperty('--lens-main-a', String(1 - t * 0.55));
			element.style.setProperty('--lens-ghost-a', String(t * 0.4));
		}
	};

	const schedule = () => {
		if (rafId !== 0 || document.visibilityState === 'hidden') {
			return;
		}

		rafId = window.requestAnimationFrame(tick);
	};

	const tick = () => {
		rafId = 0;

		if (useEasing) {
			focusX += (targetX - focusX) * touchEase;
			focusY += (targetY - focusY) * touchEase;
		} else {
			focusX = targetX;
			focusY = targetY;
		}

		if (reducedMotionQuery.matches) {
			clearAllTargets();
			return;
		}

		syncOverlayElevation();

		const targets = collectTargets();

		if (targets.length === 0) {
			return;
		}

		applyLensVars(targets);

		const settlingPointer =
			useEasing &&
			(() => {
				const dx = targetX - focusX;
				const dy = targetY - focusY;
				return dx * dx + dy * dy > SETTLE_EPS_SQ;
			})();
		const settlingFocusDepth = performance.now() < focusDepthAnimUntil;

		if (settlingPointer || settlingFocusDepth) {
			schedule();
		}
	};

	const setPointerTarget = (event) => {
		targetX = event.clientX;
		targetY = event.clientY;
		useEasing = event.pointerType === 'touch' || coarsePointerQuery.matches;

		if (!useEasing) {
			focusX = targetX;
			focusY = targetY;
		}

		schedule();
	};

	window.addEventListener('pointermove', setPointerTarget, { passive: true });
	window.addEventListener('pointerdown', setPointerTarget, { passive: true });

	window.addEventListener(
		'resize',
		() => {
			schedule();
		},
		{ passive: true },
	);

	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'hidden' && rafId !== 0) {
			window.cancelAnimationFrame(rafId);
			rafId = 0;
			return;
		}

		if (document.visibilityState === 'visible') {
			schedule();
		}
	});

	reducedMotionQuery.addEventListener('change', () => {
		if (reducedMotionQuery.matches) {
			clearAllTargets();
			return;
		}

		schedule();
	});

	document.documentElement.addEventListener('transitionrun', (event) => {
		if (event.propertyName === '--lens-focus-depth') {
			noteFocusDepthAnimation();
			schedule();
		}
	});

	const observer = new MutationObserver(() => {
		schedule();
	});

	observer.observe(document.body, {
		subtree: true,
		childList: true,
		attributes: true,
		attributeFilter: ['class', 'data-lens-border', 'data-lens-depth', 'hidden', 'aria-hidden'],
	});

	if (rootAttributeFilter.length > 0) {
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: rootAttributeFilter,
		});
	}

	overlayElevating = detectOverlayElevating();
	schedule();
}
