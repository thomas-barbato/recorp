(() => {
    const OPEN_CLASSES = ["scale-100", "opacity-100"];
    const CLOSED_CLASSES = ["scale-90", "opacity-0"];
    const DEFAULT_DURATION_MS = 300;
    const bodyLockOwners = new Set();

    function toModalElement(modalOrId) {
        if (!modalOrId) return null;
        if (typeof modalOrId === "string") {
            return document.getElementById(modalOrId);
        }
        return modalOrId;
    }

    function getPanelElement(modal, panel) {
        if (!modal) return null;
        if (panel && typeof panel === "string") {
            return modal.querySelector(panel);
        }
        if (panel && panel.nodeType === 1) {
            return panel;
        }
        return modal.querySelector(".modal-animated-panel")
            || modal.querySelector("[data-modal-content]")
            || modal.firstElementChild
            || null;
    }

    function lockBody(ownerKey) {
        if (!document.body || !ownerKey) return;
        bodyLockOwners.add(ownerKey);
        document.body.style.overflow = "hidden";
    }

    function unlockBody(ownerKey) {
        if (!document.body || !ownerKey) return;
        bodyLockOwners.delete(ownerKey);
        if (bodyLockOwners.size === 0) {
            document.body.style.overflow = "";
        }
    }

    function ensurePanelAnimationSetup(panel, durationMs) {
        if (!panel) return;
        panel.classList.add("modal-animated-panel", "transform", "transition-all", "ease-out");
        panel.style.transitionDuration = `${Math.max(0, Number(durationMs) || DEFAULT_DURATION_MS)}ms`;

        const hasScaleClass = panel.classList.contains("scale-90") || panel.classList.contains("scale-100");
        const hasOpacityClass = panel.classList.contains("opacity-0") || panel.classList.contains("opacity-100");

        if (!hasScaleClass) panel.classList.add("scale-90");
        if (!hasOpacityClass) panel.classList.add("opacity-0");
    }

    function stopEvent(event) {
        if (!event) return;
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") {
            event.stopImmediatePropagation();
        }
    }

    function bindActionEvent(element, callback) {
        if (!element || typeof callback !== "function") return;

        const primaryEvent = typeof window.action_listener_touch_click === "string"
            ? window.action_listener_touch_click
            : "click";

        element.addEventListener(primaryEvent, callback, true);

        if (primaryEvent !== "click") {
            element.addEventListener("click", callback, true);
        }
    }

    function open(modalOrId, options = {}) {
        const modal = toModalElement(modalOrId);
        if (!modal) return false;

        const durationMs = Number(options.durationMs) || DEFAULT_DURATION_MS;
        const panel = getPanelElement(modal, options.panel);
        ensurePanelAnimationSetup(panel, durationMs);

        if (modal.__modalAnimatorTimer) {
            window.clearTimeout(modal.__modalAnimatorTimer);
            modal.__modalAnimatorTimer = null;
        }

        const lockKey = options.bodyLockKey || modal.id || "__modal_animator_default";
        modal.__modalAnimatorLockKey = lockKey;
        if (options.lockBody !== false) {
            lockBody(lockKey);
        }

        modal.classList.remove("hidden");
        modal.setAttribute("aria-hidden", "false");

        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                if (!panel || !panel.isConnected) return;
                panel.classList.remove(...CLOSED_CLASSES);
                panel.classList.add(...OPEN_CLASSES);
            });
        });

        return true;
    }

    function close(modalOrId, options = {}) {
        const modal = toModalElement(modalOrId);
        if (!modal) return Promise.resolve(false);

        const durationMs = Number(options.durationMs) || DEFAULT_DURATION_MS;
        const panel = getPanelElement(modal, options.panel);
        ensurePanelAnimationSetup(panel, durationMs);

        if (panel) {
            panel.classList.remove(...OPEN_CLASSES);
            panel.classList.add(...CLOSED_CLASSES);
        }

        const lockKey = options.bodyLockKey || modal.__modalAnimatorLockKey || modal.id || "__modal_animator_default";

        if (modal.__modalAnimatorTimer) {
            window.clearTimeout(modal.__modalAnimatorTimer);
            modal.__modalAnimatorTimer = null;
        }

        return new Promise((resolve) => {
            modal.__modalAnimatorTimer = window.setTimeout(() => {
                modal.__modalAnimatorTimer = null;
                modal.setAttribute("aria-hidden", "true");
                if (options.removeOnClose) {
                    modal.remove();
                } else {
                    modal.classList.add("hidden");
                }

                if (options.unlockBody !== false) {
                    unlockBody(lockKey);
                }

                if (typeof options.onAfterClose === "function") {
                    options.onAfterClose();
                }

                resolve(true);
            }, durationMs);
        });
    }

    function bindFlowbiteLikeModal(modal) {
        if (!modal || modal.dataset.modalAnimatorBound === "1") return;
        if (modal.dataset.modalAnimatorFlowbite !== "true") return;
        if (!modal.id) return;

        const modalId = modal.id;
        modal.dataset.modalAnimatorBound = "1";

        const openSelector = [
            `[data-modal-target="${modalId}"]`,
            `[data-modal-toggle="${modalId}"]`,
            `[data-modal-show="${modalId}"]`,
        ].join(",");

        document.querySelectorAll(openSelector).forEach((trigger) => {
            bindActionEvent(trigger, (event) => {
                stopEvent(event);
                const shouldToggle = trigger.hasAttribute("data-modal-toggle");
                if (shouldToggle && !modal.classList.contains("hidden")) {
                    close(modal);
                    return;
                }
                open(modal);
            });
        });

        document.querySelectorAll(`[data-modal-hide="${modalId}"]`).forEach((trigger) => {
            bindActionEvent(trigger, (event) => {
                stopEvent(event);
                close(modal);
            });
        });

        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                close(modal);
            }
        });
    }

    function bindAllFlowbiteLikeModals() {
        document.querySelectorAll('[data-modal-animator-flowbite="true"]').forEach((modal) => {
            bindFlowbiteLikeModal(modal);
        });
    }

    function bindEscapeCloseForFlowbiteLikeModals() {
        if (document.body?.dataset?.modalAnimatorEscBound === "1") return;
        if (document.body) {
            document.body.dataset.modalAnimatorEscBound = "1";
        }

        document.addEventListener("keydown", (event) => {
            if (event.key !== "Escape") return;

            const visibleModals = Array.from(
                document.querySelectorAll('[data-modal-animator-flowbite="true"]')
            ).filter((modal) => !modal.classList.contains("hidden"));

            const topModal = visibleModals[visibleModals.length - 1];
            if (!topModal) return;

            event.preventDefault();
            close(topModal);
        });
    }

    function init() {
        bindAllFlowbiteLikeModals();
        bindEscapeCloseForFlowbiteLikeModals();
    }

    window.ModalAnimator = {
        open,
        close,
        bindFlowbiteLikeModal,
        bindAllFlowbiteLikeModals,
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
