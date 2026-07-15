export type ChromaticFringeEdge = 'bottom' | 'right' | null;

export type ChromaticFringeOptions = {
	/** Selector for page controls that receive box fringe. */
	buttonSelector?: string;
	/** Selector for open floating menus (default: dropdown / download-format `.is-open` panels). */
	dropdownSelector?: string;
	/** If an element matches `closest(skipClosest)`, box fringe is skipped. */
	skipClosest?: string;
	/** When true (default), open dropdowns get border fade class. */
	fadeDropdownBorder?: boolean;
	/** Among button matches, these also get border fade (e.g. `.outline-button`). */
	fadeBorderSelector?: string;
	depths?: {
		dropdown?: number;
		button?: number;
		default?: number;
	};
	maxOffsetPx?: number;
	refDiagonalFraction?: number;
	touchEase?: number;
	/**
	 * How long to keep re-sampling after overlay open/close while
	 * `--lens-focus-depth` CSS-transitions (default 320).
	 */
	focusDepthAnimMs?: number;
	/** Extra `document.documentElement` attributes that should re-scan. */
	rootAttributeFilter?: string[];
	/** Gate for `[data-lens-border]` targets (return false to skip). */
	isMarkedTargetActive?: (element: HTMLElement) => boolean;
	/** When true, ignore `aria-hidden` on that marked element. */
	markedIgnoreAriaHidden?: (element: HTMLElement) => boolean;
	/**
	 * Targets on the current focus plane (do not multiply by `--lens-focus-depth`).
	 * Open dropdown panels are treated as focus-plane by default.
	 */
	isFocusPlaneTarget?: (element: HTMLElement) => boolean;
	/**
	 * Extra elevated-overlay detection beyond matching `dropdownSelector`
	 * (e.g. mobile menu open). Used to keep RAF alive for depth easing.
	 */
	isOverlayElevating?: () => boolean;
};

export declare function initChromaticFringe(options?: ChromaticFringeOptions): void;
