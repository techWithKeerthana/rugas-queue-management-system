import { QRCodeSVG } from "qrcode.react";

export default function QueueJoinQrCard({ queueId, queueName }) {
  const joinUrl = new URL(`/join/${queueId}`, window.location.origin).toString();

  return (
    <section className="surface-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="heading-display text-lg font-black">Customer join QR</h3>
          <p className="mt-1 text-sm text-muted">
            Share this code so customers can join {queueName} without logging in.
          </p>
          <p className="mt-2 break-all rounded-lg bg-brand-50 px-2 py-1 text-xs text-brand-700 dark:bg-brand-900/30 dark:text-brand-200">{joinUrl}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-soft dark:border-slate-700 dark:bg-slate-950">
          <QRCodeSVG value={joinUrl} size={160} includeMargin level="M" />
        </div>
      </div>
    </section>
  );
}
