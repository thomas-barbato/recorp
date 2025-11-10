document.addEventListener("DOMContentLoaded", () => {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("fade-in-up-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll(".fade-in-up").forEach(el => observer.observe(el));
});

document.addEventListener('DOMContentLoaded', () => {
    // Activation PC-only pour le TOOLTIP: min-width 1024
    // Note: pour tester avec l'inspecteur, on utilise uniquement la largeur
    // En production, vous pouvez ajouter: && window.matchMedia('(pointer: fine)').matches
    const isDesktop = window.innerWidth >= 1024;

    // Créer le tooltip DOM unique (desktop seulement)
    let tooltip = null;
    if (isDesktop) {
        tooltip = document.createElement('div');
        tooltip.className = 'skill-tooltip';
        tooltip.innerHTML = `
            <div class="tt-title"></div>
            <div class="tt-meta"></div>
            <div class="tt-body"></div>
        `;
        document.body.appendChild(tooltip);
    }

    let activeExpanded = null; // référence à la div .skill-expanded ouverte

    // Gestion de position du tooltip (éviter qu'il sorte de l'écran)
    function positionTooltip(x, y) {
        if (!tooltip) return;
        const pad = 12;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const ttRect = tooltip.getBoundingClientRect();
        let left = x + 12;
        let top = y + 12;

        // Si dépasse à droite, reculer
        if (left + ttRect.width + pad > vw) left = x - ttRect.width - 12;
        if (left < pad) left = pad;

        // Si dépasse en bas, afficher au-dessus
        if (top + ttRect.height + pad > vh) top = y - ttRect.height - 12;
        if (top < pad) top = pad;

        tooltip.style.left = `${Math.round(left)}px`;
        tooltip.style.top = `${Math.round(top)}px`;
    }

    // Construire contenu du tooltip
    function fillTooltipFrom(elem) {
        if (!tooltip) return;
        const title = elem.dataset.skillName || '';
        const level = elem.dataset.skillLevel || '';
        const progress = elem.dataset.skillProgress || '';
        const desc = elem.dataset.skillDescription || '';
        const effects = elem.dataset.skillEffects || '';
        const expertise = elem.dataset.skillExpertise || '';

        tooltip.querySelector('.tt-title').textContent = title;
        tooltip.querySelector('.tt-meta').textContent = `Lv ${level} • ${progress}%`;
        // Compose body with minimal HTML
        const body = [];
        if (desc) body.push(`<div><strong>Description:</strong> ${desc}</div>`);
        if (effects) body.push(`<div style="margin-top:6px"><strong>Effects:</strong> ${effects}</div>`);
        if (expertise) body.push(`<div style="margin-top:6px"><strong>Expertise:</strong> ${expertise}</div>`);
        tooltip.querySelector('.tt-body').innerHTML = body.join('');
    }

    // show/hide helpers
    function showTooltip(x, y, elem) {
        if (!tooltip) return;
        fillTooltipFrom(elem);
        tooltip.classList.add('visible');
        positionTooltip(x, y);
        tooltip.style.transform = 'translateY(0) scale(1)';
        tooltip.style.opacity = '1';
    }
    
    function hideTooltip() {
        if (!tooltip) return;
        tooltip.classList.remove('visible');
        tooltip.style.opacity = '0';
    }

    // Click handler: toggle inline expanded div under this skill's progress bar
    function toggleExpanded(elem) {
        // close previous if different
        if (activeExpanded && activeExpanded._owner !== elem) {
            activeExpanded.remove();
            activeExpanded = null;
        }
        // If already open under this elem -> close
        if (activeExpanded && activeExpanded._owner === elem) {
            activeExpanded.remove();
            activeExpanded = null;
            return;
        }
        // Create new expanded node
        const desc = elem.dataset.skillDescription || '';
        const effects = elem.dataset.skillEffects || '';
        const expertise = elem.dataset.skillExpertise || '';

        const container = document.createElement('div');
        container.className = 'skill-expanded bg-emerald-950/60 p-1';
        container._owner = elem;
        container.innerHTML = `
            <div style="font-weight:700; color:#A8FFDB; margin-bottom:6px;">${elem.dataset.skillName || ''} – Lv ${elem.dataset.skillLevel || ''}</div>
            ${ desc ? `<div style="margin-bottom:8px;"><strong>Description:</strong> ${desc}</div>` : '' }
            ${ effects ? `<div style="margin-bottom:6px;"><strong>Effects:</strong> ${effects}</div>` : '' }
            ${ expertise ? `<div><strong>Expertise:</strong> ${expertise}</div>` : '' }
        `;
        
        // Insert after the progress bar
        let insertAfter = null;
        for (const child of elem.children) {
            if (child.classList && child.className.indexOf('rounded-full') !== -1) {
                insertAfter = child;
            }
        }
        
        if (insertAfter) {
            insertAfter.insertAdjacentElement('afterend', container);
            activeExpanded = container;
            // Scroll the skills container
            const skillsContainer = document.querySelector('#character-modal .lg\\:w-3\\/4');
            if (skillsContainer) {
                const rect = container.getBoundingClientRect();
                const parentRect = skillsContainer.getBoundingClientRect();
                if (rect.bottom > parentRect.bottom) {
                    skillsContainer.scrollBy({ top: rect.bottom - parentRect.bottom + 12, behavior: 'smooth' });
                }
            }
        } else {
            elem.appendChild(container);
            activeExpanded = container;
        }
    }

    // Attach handlers on every skill-item
    document.querySelectorAll('#character-modal .skill-item').forEach(elem => {
        if (isDesktop) {
            // DESKTOP: Hover tooltip uniquement
            let hoverTimeout = null;
            
            elem.addEventListener('mouseenter', (ev) => {
                if (hoverTimeout) clearTimeout(hoverTimeout);
                hoverTimeout = setTimeout(() => {
                    showTooltip(ev.clientX, ev.clientY, elem);
                }, 120);
            });
            
            elem.addEventListener('mousemove', (ev) => {
                if (tooltip && tooltip.classList.contains('visible')) {
                    positionTooltip(ev.clientX, ev.clientY);
                }
            });
            
            elem.addEventListener('mouseleave', () => {
                if (hoverTimeout) { clearTimeout(hoverTimeout); hoverTimeout = null; }
                hideTooltip();
            });
        } else {
            // MOBILE: Click toggle inline expanded detail
            elem.addEventListener('click', (e) => {
                e.preventDefault();
                toggleExpanded(elem);
            });
        }
    });

    // Close tooltip / expanded if modal closes or ESC pressed
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Esc') {
            hideTooltip();
            if (activeExpanded) { activeExpanded.remove(); activeExpanded = null; }
        }
    });

    // Observe modal hide
    const modal = document.getElementById('character-modal');
    const mo = new MutationObserver((mutations) => {
        for (const m of mutations) {
            if (m.attributeName === 'class') {
                if (!modal.classList.contains('hidden')) return;
                hideTooltip();
                if (activeExpanded) { activeExpanded.remove(); activeExpanded = null; }
            }
        }
    });

    if (modal) mo.observe(modal, { attributes: true });
});