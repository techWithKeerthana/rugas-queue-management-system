import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { formatSeconds } from "../../utils/format";
import { useServiceTimer } from "../../hooks/useServiceTimer";

const statusClasses = {
  waiting: "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200",
  serving: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200",
  cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200",
};

export default function TokenRow({ token, onCancel, onUndo, onComplete, isDragDisabled }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: token._id,
    disabled: isDragDisabled,
  });

  const servingSeconds = useServiceTimer(token.status === "serving" ? token.servedAt : null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="surface-panel grid grid-cols-12 items-center gap-2 p-3"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        disabled={isDragDisabled}
        className="col-span-1 flex items-center justify-center text-soft disabled:opacity-30"
      >
        <GripVertical size={18} />
      </button>
      <div className="col-span-4">
        <p className="font-semibold text-slate-900 dark:text-slate-100">#{token.tokenNumber} {token.personName}</p>
        <p className="text-xs uppercase tracking-wide text-soft">{token.priority}</p>
      </div>
      <div className="col-span-2">
        <span className={`status-chip ${statusClasses[token.status]}`}>
          {token.status}
        </span>
      </div>
      <div className="col-span-2 text-sm text-muted">
        {token.status === "serving" ? `Serving: ${formatSeconds(servingSeconds)}` : `Est: ${formatSeconds(token.estimatedWaitSeconds)}`}
      </div>
      <div className="col-span-3 flex justify-end gap-2">
        {token.status === "serving" ? (
          <button type="button" onClick={() => onComplete(token)} className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-500">
            Complete
          </button>
        ) : null}
        {(token.status === "waiting" || token.status === "serving") ? (
          <button type="button" onClick={() => onCancel(token)} className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-rose-500">
            Cancel
          </button>
        ) : null}
        {token.actionSnapshot ? (
          <button type="button" onClick={() => onUndo(token)} className="btn-secondary px-2.5 py-1 text-xs">
            Undo
          </button>
        ) : null}
      </div>
    </div>
  );
}
