export class LogView {
    constructor(container) {
        this.container = container;
    }

    logEvent(title, desc, type = 'system', meta = null, timestamp = null) {
        if (!this.container) return;
        const entry = document.createElement('div');
        const tierClass = meta && meta.tier ? ` tier-${meta.tier.toLowerCase()}` : '';
        entry.className = `log-entry ${type}${tierClass}`;

        const tierPrefix = meta && meta.tier
            ? `[${meta.tier}${typeof meta.tokens === 'number' ? ` +${meta.tokens}T` : ''}] `
            : '';
        const ts = timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        entry.innerHTML = `<span>[${ts}]</span> <strong>${tierPrefix}${title}:</strong> ${desc}`;

        this.container.appendChild(entry);
        this.container.scrollTop = this.container.scrollHeight;
    }

    clearLog() {
        if (this.container) this.container.innerHTML = '';
    }
}
