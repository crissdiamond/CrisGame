export class ToastView {
    _getContainer() {
        let c = document.getElementById('toast-container');
        if (!c) {
            c = document.createElement('div');
            c.id = 'toast-container';
            c.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:10000;display:flex;flex-direction:column;gap:12px;';
            document.body.appendChild(c);
        }
        return c;
    }

    showToast(message, type = 'success') {
        const container = this._getContainer();
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;

        toast.style.background = 'rgba(15, 23, 42, 0.9)';
        toast.style.backdropFilter = 'blur(8px)';
        toast.style.border = '1px solid rgba(255, 255, 255, 0.08)';
        toast.style.color = 'var(--text-primary)';
        toast.style.padding = '0.75rem 1.25rem';
        toast.style.borderRadius = '8px';
        toast.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.5)';
        toast.style.fontSize = '0.85rem';
        toast.style.fontFamily = 'var(--font-sans)';
        toast.style.fontWeight = '600';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.gap = '10px';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(15px)';
        toast.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';

        let icon = '🎉';
        if (type === 'success') {
            toast.style.borderLeft = '4px solid var(--accent-green)';
            icon = '💾';
        } else if (type === 'hazard' || type === 'error') {
            toast.style.borderLeft = '4px solid var(--accent-red)';
            icon = '⚠️';
        } else if (type === 'info') {
            toast.style.borderLeft = '4px solid var(--accent-cyan)';
            icon = 'ℹ️';
        }

        toast.innerHTML = `<span style="font-size:1.1rem;display:flex;align-items:center;">${icon}</span> <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => { toast.style.opacity = '1'; toast.style.transform = 'translateY(0)'; }, 20);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-15px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    showBoostToast(nodeLabel, durationMyr, multiplier) {
        const container = this._getContainer();
        const toast = document.createElement('div');
        toast.style.cssText = `
            background: linear-gradient(135deg, rgba(20,20,45,0.97), rgba(10,10,30,0.97));
            border: 1px solid rgba(250,204,21,0.5);
            border-left: 4px solid #facc15;
            color: var(--text-primary);
            padding: 14px 18px;
            border-radius: 10px;
            box-shadow: 0 10px 30px -5px rgba(0,0,0,0.6), 0 0 20px rgba(250,204,21,0.1);
            font-family: var(--font-sans);
            min-width: 320px;
            max-width: 420px;
            opacity: 0;
            transform: translateY(15px);
            transition: all 0.35s cubic-bezier(0.16,1,0.3,1);
        `;
        toast.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;">
                <span style="font-size:1.5rem;line-height:1;">⚡</span>
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:700;font-size:0.88rem;color:#facc15;letter-spacing:0.06em;margin-bottom:3px;">EVOLUTION BOOST ACTIVE</div>
                    <div style="font-size:0.82rem;color:rgba(255,255,255,0.85);">
                        <strong>${nodeLabel}</strong>: ×${multiplier} growth rate for <strong>${durationMyr} Myr</strong>
                    </div>
                    <div style="font-size:0.75rem;color:rgba(255,255,255,0.45);margin-top:4px;">Select node in Evolution Tree to track remaining time.</div>
                </div>
            </div>
        `;
        container.appendChild(toast);

        setTimeout(() => { toast.style.opacity = '1'; toast.style.transform = 'translateY(0)'; }, 20);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-15px)';
            setTimeout(() => toast.remove(), 350);
        }, 5000);
    }
}
