document.addEventListener("DOMContentLoaded", () => {
    const logContainer = document.getElementById("player-log-container");

    window.addLog = function(message, type = "info") {
        if (!logContainer) return;

        const li = document.createElement("li");
        li.textContent = message;
        li.className = `log-entry opacity-90 transition-opacity duration-500 hover:opacity-100 
                        ${type === "warning" ? "text-amber-400" : ""} 
                        ${type === "error" ? "text-red-400" : ""} 
                        ${type === "success" ? "text-emerald-400" : ""}`;
        
        logContainer.prepend(li);

        // Limite à 100 lignes
        while (logContainer.children.length > 100) {
        logContainer.removeChild(logContainer.lastChild);
        }
    };
});