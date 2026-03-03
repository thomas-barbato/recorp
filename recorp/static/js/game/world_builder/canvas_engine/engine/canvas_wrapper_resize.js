import { getMapLayoutProfile } from "./map_layout_profile.js";

export function resizeCanvasWrapper() {
    const wrapper = document.getElementById("canvas-wrapper");
    if (!wrapper) return;

    const { wrapperWidthPx, wrapperHeightPx } = getMapLayoutProfile({
        viewportWidth: window.innerWidth,
        tileSize: 32,
    });

    // #canvas-wrapper has right/bottom borders (Tailwind border-r/b).
    // With border-box sizing, width/height must include borders so that
    // the inner content area stays exactly aligned with tile counts.
    const styles = window.getComputedStyle(wrapper);
    const borderX = (parseFloat(styles.borderLeftWidth) || 0) + (parseFloat(styles.borderRightWidth) || 0);
    const borderY = (parseFloat(styles.borderTopWidth) || 0) + (parseFloat(styles.borderBottomWidth) || 0);

    const targetWidth = wrapperWidthPx + borderX;
    const targetHeight = wrapperHeightPx + borderY;

    wrapper.style.width = `${targetWidth}px`;
    wrapper.style.height = `${targetHeight}px`;

    wrapper.style.maxWidth = `${targetWidth}px`;
    wrapper.style.maxHeight = `${targetHeight}px`;

    wrapper.style.marginLeft = "auto";
    wrapper.style.marginRight = "auto";
}
