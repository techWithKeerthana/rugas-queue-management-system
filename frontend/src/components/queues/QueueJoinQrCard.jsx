import { QRCodeSVG } from "qrcode.react";

export default function QueueJoinQrCard({ queueId, queueName }) {
  const joinUrl = new URL(`/join/${queueId}`, window.location.origin).toString();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Customer join QR</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Share this code so customers can join {queueName} without logging in.
          </p>
          <p className="mt-2 break-all text-xs text-slate-500 dark:text-slate-500">{joinUrl}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
          <QRCodeSVG value={joinUrl} size={160} includeMargin level="M" />
        </div>
      </div>
    </section>
  );
}
