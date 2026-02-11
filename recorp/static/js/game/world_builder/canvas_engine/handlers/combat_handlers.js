export function handleCombatEvents(message) {


    console.log("Received combat events:", message);

    const events = message.events;

    if (!Array.isArray(events)) {
        console.warn("[Combat] Invalid events payload:", events);
        return;
    }

    events.forEach(ev => {

        console.log("⚔️ Combat event:", ev);

        switch (ev.type) {

            case "ATTACK_HIT":
                renderAttackHit(ev.payload);
                break;

            case "ATTACK_MISS":
                renderAttackMiss(ev.payload);
                break;

            case "ATTACK_EVADED":
                renderAttackEvaded(ev.payload);
                break;

            default:
                console.warn("[Combat] Unknown event:", ev);
        }
    });
}

function renderAttackHit(payload) {

    const {
        source,
        target,
        damage_type,
        damage_to_shield,
        damage_to_hull,
        is_counter
    } = payload;

    const label = is_counter ? "Riposte" : "Attaque";

    const msg = `${label} ${damage_type} : `
        + `${damage_to_shield} shield / `
        + `${damage_to_hull} hull`;

    console.log(msg);

    // Préparation animations futures
    window.playCombatAnimation?.({
        type: "HIT",
        source,
        target,
        damage_type,
        is_counter
    });

    window.addCombatLog?.(msg);
}

function renderAttackMiss(payload) {

    const label = payload.is_counter ? "Riposte" : "Attaque";
    const msg = `${label} ratée`;

    console.log(msg);

    window.playCombatAnimation?.({
        type: "MISS",
        ...payload
    });

    window.addCombatLog?.(msg);
}

function renderAttackEvaded(payload) {

    const label = payload.is_counter ? "Riposte" : "Attaque";
    const msg = `${label} esquivée`;

    console.log(msg);

    window.playCombatAnimation?.({
        type: "EVADE",
        ...payload
    });

    window.addCombatLog?.(msg);
}