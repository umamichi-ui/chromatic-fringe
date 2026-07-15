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
	/** Extra `document.documentElement` attributes that should re-scan. */
	rootAttributeFilter?: string[];
	/** Gate for `[data-lens-border]` targets (return false to skip). */
	isMarkedTargetActive?: (element: HTMLElement) => boolean;
	/** When true, ignore `aria-hidden` on that marked element. */
	markedIgnoreAriaHidden?: (element: HTMLElement) => boolean;
};

export declare function initChromaticFringe(options?: ChromaticFringeOptions): void;
