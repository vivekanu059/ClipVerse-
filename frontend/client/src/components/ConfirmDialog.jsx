import React, { useEffect } from 'react';

function ConfirmDialog({ open, title, body, confirmLabel = 'Confirm', onConfirm, onCancel }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === 'Escape' && onCancel();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onCancel]);

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-[fade_.15s_ease-out]" onClick={onCancel} />
            <div className="relative w-full max-w-sm rounded-2xl bg-[#16161b] ring-1 ring-white/10 p-6 shadow-2xl animate-[pop_.18s_ease-out]">
                <h2 id="dlg-title" className="text-lg font-semibold text-white">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{body}</p>
                <div className="mt-6 flex justify-end gap-2">
                    <button autoFocus onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400">Cancel</button>
                    <button onClick={onConfirm} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300">{confirmLabel}</button>
                </div>
            </div>
            <style>{`@keyframes fade{from{opacity:0}}@keyframes pop{from{opacity:0;transform:translateY(8px) scale(.97)}}@media (prefers-reduced-motion:reduce){*{animation:none!important}}`}</style>
        </div>
    );
}
export default ConfirmDialog;