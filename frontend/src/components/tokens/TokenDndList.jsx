import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import TokenRow from "./TokenRow";

export default function TokenDndList({ tokens, onReorder, onCancel, onUndo, onComplete, disableReorder = false }) {
  const waitingTokens = tokens.filter((token) => token.status === "waiting").sort((a, b) => a.position - b.position);
  const staticTokens = tokens.filter((token) => token.status !== "waiting");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const onDragEnd = (event) => {
    if (disableReorder) {
      return;
    }

    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = waitingTokens.findIndex((token) => token._id === active.id);
    const newIndex = waitingTokens.findIndex((token) => token._id === over.id);
    const moved = arrayMove(waitingTokens, oldIndex, newIndex);
    onReorder(moved.map((token) => token._id));
  };

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={waitingTokens.map((token) => token._id)} strategy={verticalListSortingStrategy}>
          {waitingTokens.map((token) => (
            <TokenRow
              key={token._id}
              token={token}
              onCancel={onCancel}
              onUndo={onUndo}
              onComplete={onComplete}
              isDragDisabled={disableReorder}
            />
          ))}
        </SortableContext>
      </DndContext>

      {staticTokens.map((token) => (
        <TokenRow
          key={token._id}
          token={token}
          onCancel={onCancel}
          onUndo={onUndo}
          onComplete={onComplete}
          isDragDisabled
        />
      ))}
    </div>
  );
}
