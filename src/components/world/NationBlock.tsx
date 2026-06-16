import { S } from "../../lib/utils";
import { Field, Sel, EntryBlock, GhostButton } from "../ui";
import { NAT_TYPES } from "../../lib/constants";
import { NationConnectionBlock } from "./NationConnectionBlock";
import type { BlockProps } from "./types";
import type { NationConnection } from "../../lib/types";

interface NationBlockProps extends BlockProps {
  connections: NationConnection[];
  onAddConnection: () => void;
  onDelConnection: (connId: string) => void;
}

export function NationBlock({ control, index, onDelete, connections, onAddConnection, onDelConnection }: NationBlockProps) {
  return (
    <EntryBlock color="var(--color-dark)" onDelete={onDelete}>
      <div style={S.grid3} className="seshat-grid3">
        <Field label="Name" name={`nations.${index}.name` as const} control={control} placeholder="The Iron Dominion…" />
        <Sel label="Type" name={`nations.${index}.type` as const} control={control} opts={NAT_TYPES} />
        <Field label="Capital" name={`nations.${index}.capital` as const} control={control} placeholder="Ashveil…" />
      </div>
      <div style={S.grid2} className="seshat-grid2">
        <Field label="Ruler / governing power" name={`nations.${index}.ruler` as const} control={control} placeholder="Emperor Kael the Blind…" />
        <Field label="Population / scale" name={`nations.${index}.population` as const} control={control} placeholder="12 million, mostly agrarian…" />
      </div>
      <Field label="Geography" name={`nations.${index}.geography` as const} control={control} placeholder="Frozen tundra split by the Ashen River…" />
      <div style={S.grid2} className="seshat-grid2">
        <Field label="Culture & customs" name={`nations.${index}.culture` as const} control={control} multi rows={2} placeholder="Warrior-scholars. Death rites, honor debts…" />
        <Field label="Military power" name={`nations.${index}.military` as const} control={control} multi rows={2} placeholder="50,000 standing army. Elite Grave Knights…" />
      </div>
      <div style={S.grid2} className="seshat-grid2">
        <Field label="Economy & resources" name={`nations.${index}.economy` as const} control={control} placeholder="Exports void iron, imports grain…" />
        <Field label="Period active" name={`nations.${index}.periodActive` as const} control={control} placeholder="T0–T12, Year 120–340…" />
      </div>

      <hr style={S.rule} />
      <p style={styles.diplomacyHeader}>
        Diplomacy & Alliances
      </p>
      <Field label="Alliance logic / diplomatic landscape" name={`nations.${index}.allianceLogic` as const} control={control} multi rows={2} placeholder="Who holds power? What treaties define the region?" />
      <div style={styles.connectionsHeaderRow}>
        <p style={styles.connectionsCountText}>Connections ({connections.length})</p>
        <GhostButton onClick={onAddConnection}>+ add connection</GhostButton>
      </div>
      {connections.map((conn: NationConnection, ci: number) => (
        <NationConnectionBlock
          key={conn.id}
          control={control}
          nationIndex={index}
          connIndex={ci}
          onDelete={() => onDelConnection(conn.id)}
        />
      ))}
      {!connections.length && <p style={styles.noConnectionsText}>No connections yet.</p>}

      <hr style={S.rule} />
      <Field label="Hidden secrets" name={`nations.${index}.secrets` as const} control={control} multi rows={2} placeholder="The emperor is already dead. The throne is controlled by…" />
      <Field label="Lore & history" name={`nations.${index}.lore` as const} control={control} multi rows={3} placeholder="Founded 400 years ago after the Collapse…" />
    </EntryBlock>
  );
}

const styles = {
  diplomacyHeader: {
    ...S.h2,
    display: "flex",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  connectionsHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  connectionsCountText: {
    ...S.dim,
    margin: 0,
  },
  noConnectionsText: {
    ...S.dim,
    fontStyle: "italic",
  },
} satisfies Record<string, React.CSSProperties>;
