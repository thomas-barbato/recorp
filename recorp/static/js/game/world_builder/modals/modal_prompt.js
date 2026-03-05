(() => {
    const promptQueue = [];
    let promptInFlight = false;

    function t(text) {
        if (typeof gettext === "function") return gettext(text);
        return text;
    }

    function getPrimaryActionEvent() {
        return typeof window.action_listener_touch_click === "string"
            ? window.action_listener_touch_click
            : "click";
    }

    function getPromptHost() {
        return document.body || document.documentElement || null;
    }

    function bindButtonAction(button, callback) {
        if (!button || typeof callback !== "function") return;
        const primaryEvent = getPrimaryActionEvent();
        button.addEventListener(primaryEvent, (event) => {
            event.preventDefault();
            event.stopPropagation();
            callback();
        }, { passive: false });

        if (primaryEvent !== "click") {
            button.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                callback();
            });
        }
    }

    function showPrompt(options = {}) {
        const variant = options.variant === "alert" ? "alert" : "confirm";
        const fallbackText = variant === "alert" ? t("Action required.") : t("Confirm this action?");
        const message = String(options.message || fallbackText);
        const confirmLabel = String(options.confirmLabel || (variant === "alert" ? t("OK") : t("Confirm")));
        const cancelLabel = String(options.cancelLabel || t("Cancel"));
        const host = getPromptHost();

        if (!host) {
            if (variant === "alert") {
                window.alert(message);
                return Promise.resolve(true);
            }
            return Promise.resolve(window.confirm(message));
        }

        return new Promise((resolve) => {
            const layer = document.createElement("div");
            layer.className = "ui-choice-modal-layer";

            const panel = document.createElement("section");
            panel.className = "ui-choice-modal-panel";
            panel.setAttribute("role", "dialog");
            panel.setAttribute("aria-modal", "false");
            panel.tabIndex = -1;

            const text = document.createElement("p");
            text.className = "ui-choice-modal-text";
            text.textContent = message;

            const actions = document.createElement("div");
            actions.className = "ui-choice-modal-actions";

            const confirmButton = document.createElement("button");
            confirmButton.type = "button";
            confirmButton.className = "ui-choice-modal-btn ui-choice-modal-btn--confirm";
            confirmButton.textContent = confirmLabel;

            let cancelButton = null;
            if (variant === "confirm") {
                cancelButton = document.createElement("button");
                cancelButton.type = "button";
                cancelButton.className = "ui-choice-modal-btn ui-choice-modal-btn--cancel";
                cancelButton.textContent = cancelLabel;
                actions.append(cancelButton, confirmButton);
            } else {
                actions.appendChild(confirmButton);
            }

            panel.append(text, actions);
            layer.appendChild(panel);
            host.appendChild(layer);

            let done = false;
            const finish = (value) => {
                if (done) return;
                done = true;
                document.removeEventListener("keydown", onKeyDown, true);
                panel.classList.remove("is-visible");
                window.setTimeout(() => {
                    layer.remove();
                    resolve(Boolean(value));
                }, 120);
            };

            const onKeyDown = (event) => {
                if (!layer.isConnected) return;
                if (event.key === "Escape") {
                    event.preventDefault();
                    finish(variant === "alert");
                }
            };

            bindButtonAction(confirmButton, () => finish(true));
            if (cancelButton) {
                bindButtonAction(cancelButton, () => finish(false));
            }

            document.addEventListener("keydown", onKeyDown, true);
            window.requestAnimationFrame(() => {
                panel.classList.add("is-visible");
                (cancelButton || confirmButton).focus();
            });
        });
    }

    function enqueuePrompt(options = {}) {
        return new Promise((resolve) => {
            promptQueue.push({ options, resolve });
            if (promptInFlight) return;

            const runNext = () => {
                const next = promptQueue.shift();
                if (!next) {
                    promptInFlight = false;
                    return;
                }
                promptInFlight = true;
                showPrompt(next.options)
                    .then((result) => {
                        next.resolve(result);
                    })
                    .finally(() => {
                        runNext();
                    });
            };

            runNext();
        });
    }

    function confirmPrompt(message, options = {}) {
        return enqueuePrompt({ ...options, variant: "confirm", message });
    }

    function alertPrompt(message, options = {}) {
        return enqueuePrompt({ ...options, variant: "alert", message });
    }

    window.uiConfirm = confirmPrompt;
    window.uiAlert = alertPrompt;
    window.uiPrompt = {
        confirm: confirmPrompt,
        alert: alertPrompt,
    };
})();
