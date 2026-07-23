import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { formatSeconds } from "../../utils/format";
import { useServiceTimer } from "../../hooks/useServiceTimer";

const statusClasses = {
  waiting: "bg-sky-100 text-sky-800",
  serving: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
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
      className="grid grid-cols-12 items-center gap-2 rounded-xl border border-slate-200 bg-white p-3"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        disabled={isDragDisabled}
        className="col-span-1 flex items-center justify-center text-slate-400 disabled:opacity-30"
      >
        <GripVertical size={18} />
      </button>
      <div className="col-span-4">
        <p className="font-semibold text-slate-900">#{token.tokenNumber} {token.personName}</p>
        <p className="text-xs uppercase tracking-wide text-slate-500">{token.priority}</p>
      </div>
      <div className="col-span-2">
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClasses[token.status]}`}>
          {token.status}
        </span>
      </div>
      <div className="col-span-2 text-sm text-slate-600">
        {token.status === "serving" ? `Serving: ${formatSeconds(servingSeconds)}` : `Est: ${formatSeconds(token.estimatedWaitSeconds)}`}
      </div>
      <div className="col-span-3 flex justify-end gap-2">
        {token.status === "serving" ? (
          <button type="button" onClick={() => onComplete(token)} className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">
            Complete
          </button>
        ) : null}
        {(token.status === "waiting" || token.status === "serving") ? (
          <button type="button" onClick={() => onCancel(token)} className="rounded-md bg-rose-600 px-2 py-1 text-xs font-semibold text-white">
            Cancel
          </button>
        ) : null}
        {token.actionSnapshot ? (
          <button type="button" onClick={() => onUndo(token)} className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700">
            Undo
          </button>
        ) : null}
      </div>
    </div>
  );
}
