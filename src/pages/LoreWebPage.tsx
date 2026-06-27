import type { Edge, Node } from "@xyflow/react";
import {
  Background,
  Controls,
  MarkerType,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { memo, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Tooltip } from "@mui/material";
import type {
  Character,
  Event,
  Nation,
  Treasure,
  Technique,
  Monster,
  Chapter,
  Foreshadow,
} from "../lib/types";
import { useAnimateIn } from "../hooks/useAnimateIn";
import { appStore } from "../store/appStore";
import { useSelector } from "@legendapp/state/react";
import { EMPTY_ARR } from "../lib/constants";
import { resolveStatusAt } from "../lib/resolveStatus";
import { S } from "../lib/utils";

// Helper to safely and consistently resolve text references between entities
const normalizeName = (name: string) =>
  name ? name.normalize("NFC").trim().toLowerCase() : "";

const resolveEntityByName = <T extends { name: string }>(
  entities: T[],
  name: string,
): T | undefined => {
  const normalized = normalizeName(name);
  if (!normalized) return undefined;
  return entities.find((e) => normalizeName(e.name) === normalized);
};

const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction = "TB",
) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 172;
  const nodeHeight = 36;
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  // Cycle breaking logic (DFS) to prevent dagre from throwing on world-building cycles
  const adjacency = new Map<string, string[]>();
  nodes.forEach((n) => adjacency.set(n.id, []));
  edges.forEach((edge) => adjacency.get(edge.source)?.push(edge.target));

  const visiting = new Set<string>();
  const visited = new Set<string>();

  const dfs = (nodeId: string) => {
    visiting.add(nodeId);
    const neighbors = adjacency.get(nodeId) || [];
    for (const target of neighbors) {
      if (visiting.has(target)) {
        console.warn(
          `[LoreWebPage] Cycle detected: dropping layout edge ${nodeId} -> ${target}`,
        );
      } else {
        dagreGraph.setEdge(nodeId, target);
        if (!visited.has(target)) dfs(target);
      }
    }
    visiting.delete(nodeId);
    visited.add(nodeId);
  };

  nodes.forEach((n) => {
    if (!visited.has(n.id)) dfs(n.id);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = Position.Top;
    node.sourcePosition = Position.Bottom;
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
  });

  return { nodes, edges };
};

const EntityInspector = memo(
  ({
    spotlightNodeId,
    renderedNodes,
    characters,
    events,
    nations,
    treasures,
    techniques,
    monsters,
    chapters,
    bookId,
    deferredTime,
  }: {
    spotlightNodeId: string;
    renderedNodes: Node[];
    characters: Character[];
    events: Event[];
    nations: Nation[];
    treasures: Treasure[];
    techniques: Technique[];
    monsters: Monster[];
    chapters: Chapter[];
    bookId?: string;
    deferredTime: number;
  }) => {
    const navigate = useNavigate();
    if (!spotlightNodeId) return null;
    const node = renderedNodes.find((n) => n.id === spotlightNodeId);
    if (!node) return null;

    let badgeText = "Node";
    let badgeColor = "var(--border)";
    let title = node.data.label as string;
    let buttonText = "";
    let buttonLink = "";
    const fields: Array<{ label: string; value: React.ReactNode }> = [];

    if (spotlightNodeId.startsWith("char_")) {
      badgeText = "Character";
      const charId = spotlightNodeId.replace("char_", "");
      const char = characters.find((c) => c.id === charId);
      if (char) {
        badgeColor = char.color || "var(--color-primary)";
        title = char.name;
        buttonText = "Open character →";
        buttonLink = `/book/${bookId}/characters`;

        const status = resolveStatusAt(char, events, undefined, deferredTime);
        if (status) {
          fields.push({
            label: "Status",
            value: status.physicalState || "Unknown",
          });
        }

        const rels = (char.relationships || []).map((r) => {
          const target = characters.find((c) => c.id === r.withId);
          const relEvents =
            r.timeline?.filter((t) => t.time <= deferredTime) || [];
          const latestRel =
            relEvents.length > 0 ? relEvents[relEvents.length - 1] : null;
          return `${target ? target.name : "Unknown"}: ${latestRel ? latestRel.dynamic : r.feel}`;
        });
        if (rels.length > 0) {
          fields.push({ label: "Relationships", value: rels.join(", ") });
        }
      }
    } else if (spotlightNodeId.startsWith("nation_")) {
      badgeText = "Nation";
      badgeColor = "var(--color-blue)";
      const natId = spotlightNodeId.replace("nation_", "");
      const nat = nations.find((n) => n.id === natId);
      if (nat) {
        title = nat.name;
        buttonText = "Open world →";
        buttonLink = `/book/${bookId}/world`;
        if (nat.periodActive)
          fields.push({ label: "Active", value: nat.periodActive });
        const conns = (nat.connections || []).map(
          (c) => `${c.withNation} (${c.relation})`,
        );
        if (conns.length > 0)
          fields.push({ label: "Connections", value: conns.join(", ") });
      }
    } else if (spotlightNodeId.startsWith("event_")) {
      badgeText = "Event";
      badgeColor = "var(--text-secondary)";
      const evId = spotlightNodeId.replace("event_", "");
      const ev = events.find((e) => e.id === evId);
      if (ev) {
        title = ev.title;
        buttonText = "Open event →";
        buttonLink = `/book/${bookId}/events`;
        fields.push({ label: "Time", value: `T${ev.time}` });
        if (ev.description)
          fields.push({ label: "Description", value: ev.description });

        const involved = characters
          .filter((c) => Object.keys(c.attributes || {}).includes(evId))
          .map((c) => c.name);
        if (involved.length > 0)
          fields.push({ label: "Involved", value: involved.join(", ") });
      }
    } else if (spotlightNodeId.startsWith("tr_")) {
      badgeText = "Treasure";
      badgeColor = "var(--color-orange)";
      const trId = spotlightNodeId.replace("tr_", "");
      const tr = treasures.find((t) => t.id === trId);
      if (tr) {
        title = tr.name;
        buttonText = "Open world →";
        buttonLink = `/book/${bookId}/world`;
        if (tr.creator) fields.push({ label: "Creator", value: tr.creator });
        if (tr.description)
          fields.push({
            label: "Description",
            value:
              tr.description.substring(0, 100) +
              (tr.description.length > 100 ? "..." : ""),
          });
      }
    } else if (spotlightNodeId.startsWith("tech_")) {
      badgeText = "Technique";
      badgeColor = "var(--color-purple)";
      const techId = spotlightNodeId.replace("tech_", "");
      const tech = techniques.find((t) => t.id === techId);
      if (tech) {
        title = tech.name;
        if (tech.description)
          fields.push({
            label: "Description",
            value:
              tech.description.substring(0, 100) +
              (tech.description.length > 100 ? "..." : ""),
          });
        const usableBy = tech.usableBy || [];
        if (usableBy.length > 0)
          fields.push({ label: "Users", value: usableBy.join(", ") });
      }
    } else if (spotlightNodeId.startsWith("mon_")) {
      badgeText = "Monster";
      badgeColor = "#e74c3c";
      const monId = spotlightNodeId.replace("mon_", "");
      const mon = monsters.find((m) => m.id === monId);
      if (mon) {
        title = mon.name;
        const region = mon.habitat || mon.region;
        if (region) fields.push({ label: "Habitat", value: region });
        if (mon.description)
          fields.push({
            label: "Description",
            value: (mon.description as string).substring(0, 100) + "...",
          });
      }
    } else if (spotlightNodeId.startsWith("ch_")) {
      badgeText = "Chapter";
      badgeColor = "var(--border)";
      const chId = spotlightNodeId.replace("ch_", "");
      const ch = chapters.find((c) => c.id === chId);
      if (ch) {
        title = ch.title;
        buttonText = "Open chapter →";
        buttonLink = `/book/${bookId}/chapters/${ch.id}`;
        fields.push({ label: "Chapter", value: `${ch.order}` });
      }
    } else if (spotlightNodeId.startsWith("ghost_")) {
      badgeText = "Missing Reference";
      badgeColor = "var(--color-danger)";
      fields.push({
        label: "Error",
        value:
          "This entity was referenced by text but does not exist in the database.",
      });
      buttonText = "Fix this →";
      buttonLink = spotlightNodeId.includes("_char_")
        ? `/book/${bookId}/characters`
        : `/book/${bookId}/world`;
    }

    return (
      <div
        style={{
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          overflowY: "auto",
          flex: 1,
        }}
      >
        <div>
          <div
            style={{
              display: "inline-block",
              background: badgeColor,
              color: "#fff",
              padding: "2px 6px",
              borderRadius: 4,
              fontSize: 10,
              fontWeight: "bold",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            {badgeText}
          </div>
          <h3 style={{ margin: 0, fontSize: 18, color: "var(--text-primary)" }}>
            {title}
          </h3>
        </div>

        {fields.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              background: "var(--bg-main)",
              padding: 16,
              borderRadius: 8,
              border: "1px solid var(--border)",
            }}
          >
            {fields.map((f, i) => (
              <div
                key={i}
                style={{ display: "flex", flexDirection: "column", gap: 4 }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-secondary)",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                  }}
                >
                  {f.label}
                </span>
                <span style={{ fontSize: 14, color: "var(--text-primary)" }}>
                  {f.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {buttonLink && (
          <button
            onClick={() => navigate(buttonLink)}
            style={{
              ...S.ghost,
              marginTop: "auto",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              padding: "10px",
              width: "100%",
              borderRadius: 6,
            }}
          >
            {buttonText}
          </button>
        )}
      </div>
    );
  },
);

export default function LoreWebPage() {
  const { bookId } = useParams();
  const {
    characters,
    events,
    nations,
    treasures,
    techniques,
    monsters,
    chapters,
    foreshadows,
  } = useSelector(() => {
    const books = appStore.books.get() || [];
    const idx = books.findIndex((b) => b && b.id === bookId);
    if (idx < 0)
      return {
        characters: EMPTY_ARR as Character[],
        events: EMPTY_ARR as Event[],
        nations: EMPTY_ARR as Nation[],
        treasures: EMPTY_ARR as Treasure[],
        techniques: EMPTY_ARR as Technique[],
        monsters: EMPTY_ARR as Monster[],
        chapters: EMPTY_ARR as Chapter[],
        foreshadows: EMPTY_ARR as Foreshadow[],
      };
    const b = books[idx];
    return {
      characters: (b.characters || EMPTY_ARR) as Character[],
      events: (b.events || EMPTY_ARR) as Event[],
      nations: (b.nations || EMPTY_ARR) as Nation[],
      treasures: (b.treasures || EMPTY_ARR) as Treasure[],
      techniques: (b.techniques || EMPTY_ARR) as Technique[],
      monsters: (b.monsters || EMPTY_ARR) as Monster[],
      chapters: (b.chapters || EMPTY_ARR) as Chapter[],
      foreshadows: (b.foreshadows || EMPTY_ARR) as Foreshadow[],
    };
  });

  const ref = useAnimateIn();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [spotlightNodeId, setSpotlightNodeId] = useState<string | null>(null);

  // Visibility toggles
  const [showChars, setShowChars] = useState(true);
  const [showNations, setShowNations] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [showTreasures, setShowTreasures] = useState(true);
  const [showTechniques, setShowTechniques] = useState(true);
  const [showMonsters, setShowMonsters] = useState(true);
  const [showChapters, setShowChapters] = useState(true);
  const [showForeshadows, setShowForeshadows] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");

  const maxEventTime = useMemo(
    () => Math.max(10, ...events.map((e) => e.time || 0)),
    [events],
  );

  const [currentTime, setCurrentTime] = useState(maxEventTime);
  const deferredTime = useDeferredValue(currentTime);

  const baseLayoutPositions = useMemo(() => {
    const rawNodes: Node[] = [];
    const rawEdges: Edge[] = [];
    const seenGhosts = new Set<string>();

    nations.forEach((n) => {
      rawNodes.push({
        id: `nation_${n.id}`,
        position: { x: 0, y: 0 },
        data: { label: "" },
      });
      n.connections?.forEach((conn) => {
        const targetNation = resolveEntityByName(nations, conn.withNation);
        if (targetNation) {
          rawEdges.push({
            id: `e_nat_${n.id}_${targetNation.id}`,
            source: `nation_${n.id}`,
            target: `nation_${targetNation.id}`,
          });
        } else if (conn.withNation) {
          const ghostId = `ghost_nat_${conn.withNation.replace(/\\s+/g, "_")}`;
          if (!seenGhosts.has(ghostId)) {
            seenGhosts.add(ghostId);
            rawNodes.push({
              id: ghostId,
              position: { x: 0, y: 0 },
              data: { label: "" },
            });
          }
          rawEdges.push({
            id: `e_nat_${n.id}_${ghostId}`,
            source: `nation_${n.id}`,
            target: ghostId,
          });
        }
      });
    });

    characters.forEach((c) => {
      rawNodes.push({
        id: `char_${c.id}`,
        position: { x: 0, y: 0 },
        data: { label: "" },
      });
      c.relationships?.forEach((r) => {
        rawEdges.push({
          id: `e_char_${c.id}_${r.withId}`,
          source: `char_${c.id}`,
          target: `char_${r.withId}`,
        });
      });
      Object.keys(c.attributes || {}).forEach((eventId) => {
        rawEdges.push({
          id: `e_ev_${c.id}_${eventId}`,
          source: `char_${c.id}`,
          target: `event_${eventId}`,
        });
      });
    });

    events.forEach((e) => {
      rawNodes.push({
        id: `event_${e.id}`,
        position: { x: 0, y: 0 },
        data: { label: "" },
      });
      (e.chapters || []).forEach((chId) => {
        rawEdges.push({
          id: `e_ev_ch_${e.id}_${chId}`,
          source: `event_${e.id}`,
          target: `ch_${chId}`,
        });
      });
    });

    treasures.forEach((t) => {
      rawNodes.push({
        id: `tr_${t.id}`,
        position: { x: 0, y: 0 },
        data: { label: "" },
      });
      if (t.creator) {
        const creatorChar = resolveEntityByName(characters, t.creator);
        if (creatorChar) {
          rawEdges.push({
            id: `e_tr_${t.id}_${creatorChar.id}`,
            source: `char_${creatorChar.id}`,
            target: `tr_${t.id}`,
          });
        } else {
          const ghostId = `ghost_char_${t.creator.replace(/\\s+/g, "_")}`;
          if (!seenGhosts.has(ghostId)) {
            seenGhosts.add(ghostId);
            rawNodes.push({
              id: ghostId,
              position: { x: 0, y: 0 },
              data: { label: "" },
            });
          }
          rawEdges.push({
            id: `e_tr_${t.id}_${ghostId}`,
            source: ghostId,
            target: `tr_${t.id}`,
          });
        }
      }
    });

    techniques.forEach((t) => {
      rawNodes.push({
        id: `tech_${t.id}`,
        position: { x: 0, y: 0 },
        data: { label: "" },
      });
      const usableBy = t.usableBy || [];
      usableBy.forEach((charName: string) => {
        const char = resolveEntityByName(characters, charName);
        if (char) {
          rawEdges.push({
            id: `e_tech_char_${t.id}_${char.id}`,
            source: `tech_${t.id}`,
            target: `char_${char.id}`,
          });
        }
      });
      const unlockedAt = t.unlockedAt || t.firstUsedAt;
      if (unlockedAt) {
        rawEdges.push({
          id: `e_tech_ev_${t.id}_${unlockedAt}`,
          source: `tech_${t.id}`,
          target: `event_${unlockedAt}`,
        });
      }
    });

    monsters.forEach((m) => {
      rawNodes.push({
        id: `mon_${m.id}`,
        position: { x: 0, y: 0 },
        data: { label: "" },
      });
      const regionName = m.habitat || m.region;
      if (regionName) {
        const nation = resolveEntityByName(nations, regionName);
        if (nation) {
          rawEdges.push({
            id: `e_mon_nat_${m.id}_${nation.id}`,
            source: `mon_${m.id}`,
            target: `nation_${nation.id}`,
          });
        }
      }
    });

    chapters.forEach((ch) => {
      rawNodes.push({
        id: `ch_${ch.id}`,
        position: { x: 0, y: 0 },
        data: { label: "" },
      });
    });

    const sortedChaps = [...chapters].sort((a, b) => a.order - b.order);
    for (let i = 0; i < sortedChaps.length - 1; i++) {
      rawEdges.push({
        id: `e_ch_seq_${sortedChaps[i].id}_${sortedChaps[i + 1].id}`,
        source: `ch_${sortedChaps[i].id}`,
        target: `ch_${sortedChaps[i + 1].id}`,
      });
    }

    foreshadows.forEach((f) => {
      if (f.plantChapterId && f.payoffChapterId) {
        rawEdges.push({
          id: `e_fs_${f.id}`,
          source: `ch_${f.plantChapterId}`,
          target: `ch_${f.payoffChapterId}`,
        });
      }
    });

    const layouted = getLayoutedElements(rawNodes, rawEdges);
    const posMap = new Map<
      string,
      {
        x: number;
        y: number;
        sourcePosition?: Position;
        targetPosition?: Position;
      }
    >();
    layouted.nodes.forEach((n) => {
      posMap.set(n.id, {
        x: n.position.x,
        y: n.position.y,
        sourcePosition: n.sourcePosition,
        targetPosition: n.targetPosition,
      });
    });
    return posMap;
  }, [
    characters,
    events,
    nations,
    treasures,
    techniques,
    monsters,
    chapters,
    foreshadows,
  ]);

  const initialElements = useMemo(() => {
    const rawNodes: Node[] = [];
    const rawEdges: Edge[] = [];
    const seenGhosts = new Set<string>();

    const applyPos = (id: string) => {
      const p = baseLayoutPositions.get(id);
      return {
        position: p ? { x: p.x, y: p.y } : { x: 0, y: 0 },
        sourcePosition: p?.sourcePosition,
        targetPosition: p?.targetPosition,
      };
    };

    nations.forEach((n) => {
      rawNodes.push({
        id: `nation_${n.id}`,
        data: { label: n.name },
        ...applyPos(`nation_${n.id}`),
        style: {
          background: "var(--bg-main)",
          color: "var(--color-blue)",
          border: "2px solid var(--color-blue)",
          borderRadius: 20,
          fontWeight: "bold",
        },
      });
      n.connections?.forEach((conn) => {
        const targetNation = resolveEntityByName(nations, conn.withNation);
        if (targetNation) {
          rawEdges.push({
            id: `e_nat_${n.id}_${targetNation.id}`,
            source: `nation_${n.id}`,
            target: `nation_${targetNation.id}`,
            label: conn.relation || "",
            animated: true,
            style: { stroke: "var(--color-green)", strokeWidth: 1.5 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "var(--color-green)",
            },
          });
        } else if (conn.withNation) {
          const ghostId = `ghost_nat_${conn.withNation.replace(/\\s+/g, "_")}`;
          if (!seenGhosts.has(ghostId)) {
            seenGhosts.add(ghostId);
            rawNodes.push({
              id: ghostId,
              data: { label: conn.withNation },
              ...applyPos(ghostId),
              style: {
                background: "var(--bg-main)",
                color: "var(--color-danger)",
                border: "2px dashed var(--color-danger)",
                borderRadius: 8,
                fontWeight: "bold",
              },
            });
          }
          rawEdges.push({
            id: `e_nat_${n.id}_${ghostId}`,
            source: `nation_${n.id}`,
            target: ghostId,
            label: conn.relation || "",
            animated: true,
            style: {
              stroke: "var(--color-danger)",
              strokeWidth: 1.5,
              strokeDasharray: "4 4",
            },
          });
        }
      });
    });

    characters.forEach((c) => {
      rawNodes.push({
        id: `char_${c.id}`,
        data: { label: c.name },
        ...applyPos(`char_${c.id}`),
        style: {
          background: "var(--bg-main)",
          color: c.color || "var(--text-primary)",
          border: `2px solid ${c.color || "var(--border)"}`,
          borderRadius: 20,
          fontWeight: "bold",
        },
      });

      c.relationships?.forEach((r) => {
        const relEvents =
          r.timeline?.filter((t) => t.time <= deferredTime) || [];
        const latestRel =
          relEvents.length > 0 ? relEvents[relEvents.length - 1] : null;
        let dynamicLabel = latestRel ? latestRel.dynamic : r.feel;
        if (!dynamicLabel) dynamicLabel = "";

        rawEdges.push({
          id: `e_char_${c.id}_${r.withId}`,
          source: `char_${c.id}`,
          target: `char_${r.withId}`,
          label: dynamicLabel,
          animated:
            dynamicLabel.toLowerCase().includes("love") ||
            dynamicLabel.toLowerCase().includes("hate") ||
            dynamicLabel.toLowerCase().includes("rival"),
          style: { stroke: c.color || "var(--border)", strokeWidth: 1.5 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: c.color || "var(--border)",
          },
        });
      });

      Object.keys(c.attributes || {}).forEach((eventId) => {
        const ev = events.find((e) => e.id === eventId);
        if (ev && (ev.time || 0) <= deferredTime) {
          rawEdges.push({
            id: `e_ev_${c.id}_${eventId}`,
            source: `char_${c.id}`,
            target: `event_${eventId}`,
            style: {
              stroke: "var(--border)",
              strokeWidth: 1,
              strokeDasharray: "2 2",
              opacity: 0.5,
            },
          });
        }
      });
    });

    events.forEach((e) => {
      if ((e.time || 0) <= deferredTime) {
        rawNodes.push({
          id: `event_${e.id}`,
          data: { label: e.title },
          ...applyPos(`event_${e.id}`),
          style: {
            background: "var(--bg-panel)",
            color: "var(--text-primary)",
            border: "1px dashed var(--border)",
            borderRadius: 0,
            fontSize: 11,
            padding: "4px 8px",
          },
        });

        (e.chapters || []).forEach((chId) => {
          const ch = chapters.find((c) => c.id === chId);
          if (ch) {
            rawEdges.push({
              id: `e_ev_ch_${e.id}_${chId}`,
              source: `event_${e.id}`,
              target: `ch_${chId}`,
              label: "",
              style: {
                stroke: "var(--border)",
                strokeWidth: 1,
                strokeDasharray: "3 3",
                opacity: 0.4,
              },
            });
          }
        });
      }
    });

    treasures.forEach((t) => {
      rawNodes.push({
        id: `tr_${t.id}`,
        data: { label: t.name },
        ...applyPos(`tr_${t.id}`),
        style: {
          background: "var(--bg-main)",
          color: "var(--color-orange)",
          border: "2px solid var(--color-orange)",
          borderRadius: 4,
          fontWeight: "bold",
        },
      });
      if (t.creator) {
        const creatorChar = resolveEntityByName(characters, t.creator);
        if (creatorChar) {
          rawEdges.push({
            id: `e_tr_${t.id}_${creatorChar.id}`,
            source: `char_${creatorChar.id}`,
            target: `tr_${t.id}`,
            label: "Created",
            style: { stroke: "var(--color-orange)", strokeWidth: 1.5 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "var(--color-orange)",
            },
          });
        } else {
          const ghostId = `ghost_char_${t.creator.replace(/\\s+/g, "_")}`;
          if (!seenGhosts.has(ghostId)) {
            seenGhosts.add(ghostId);
            rawNodes.push({
              id: ghostId,
              data: { label: t.creator },
              ...applyPos(ghostId),
              style: {
                background: "var(--bg-main)",
                color: "var(--color-danger)",
                border: "2px dashed var(--color-danger)",
                borderRadius: 20,
                fontWeight: "bold",
              },
            });
          }
          rawEdges.push({
            id: `e_tr_${t.id}_${ghostId}`,
            source: ghostId,
            target: `tr_${t.id}`,
            label: "Created",
            style: {
              stroke: "var(--color-danger)",
              strokeWidth: 1.5,
              strokeDasharray: "4 4",
            },
          });
        }
      }
    });

    techniques.forEach((t) => {
      rawNodes.push({
        id: `tech_${t.id}`,
        data: { label: t.name },
        ...applyPos(`tech_${t.id}`),
        style: {
          background: "var(--bg-main)",
          color: "var(--color-purple)",
          border: "2px solid var(--color-purple)",
          fontWeight: "bold",
          padding: "8px 4px",
          clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
        },
      });
      const usableBy = t.usableBy || [];
      usableBy.forEach((charName: string) => {
        const char = resolveEntityByName(characters, charName);
        if (char) {
          rawEdges.push({
            id: `e_tech_char_${t.id}_${char.id}`,
            source: `tech_${t.id}`,
            target: `char_${char.id}`,
            label: "can use",
            style: { stroke: "var(--color-purple)", strokeWidth: 1.5 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "var(--color-purple)",
            },
          });
        }
      });
      const unlockedAt = t.unlockedAt || t.firstUsedAt;
      if (unlockedAt) {
        const ev = events.find((e) => e.id === unlockedAt);
        if (ev && (ev.time || 0) <= deferredTime) {
          rawEdges.push({
            id: `e_tech_ev_${t.id}_${unlockedAt}`,
            source: `tech_${t.id}`,
            target: `event_${unlockedAt}`,
            label: "unlocked at",
            style: {
              stroke: "var(--color-purple)",
              strokeWidth: 1,
              strokeDasharray: "2 2",
              opacity: 0.8,
            },
          });
        }
      }
    });

    monsters.forEach((m) => {
      rawNodes.push({
        id: `mon_${m.id}`,
        data: { label: m.name },
        ...applyPos(`mon_${m.id}`),
        style: {
          background: "var(--bg-main)",
          color: "#e74c3c",
          border: "2px solid #e74c3c",
          fontWeight: "bold",
          clipPath:
            "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
        },
      });
      const regionName = m.habitat || m.region;
      if (regionName) {
        const nation = resolveEntityByName(nations, regionName);
        if (nation) {
          rawEdges.push({
            id: `e_mon_nat_${m.id}_${nation.id}`,
            source: `mon_${m.id}`,
            target: `nation_${nation.id}`,
            label: "inhabits",
            style: { stroke: "#e74c3c", strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#e74c3c" },
          });
        }
      }
    });

    chapters.forEach((ch) => {
      rawNodes.push({
        id: `ch_${ch.id}`,
        data: { label: `Ch.${ch.order}: ${ch.title}`.substring(0, 20) },
        ...applyPos(`ch_${ch.id}`),
        style: {
          background: "var(--bg-panel)",
          color: "var(--text-primary)",
          border: "1px solid var(--border)",
          fontSize: 11,
          padding: "4px 8px",
        },
      });
    });

    const sortedChaps = [...chapters].sort((a, b) => a.order - b.order);
    for (let i = 0; i < sortedChaps.length - 1; i++) {
      rawEdges.push({
        id: `e_ch_seq_${sortedChaps[i].id}_${sortedChaps[i + 1].id}`,
        source: `ch_${sortedChaps[i].id}`,
        target: `ch_${sortedChaps[i + 1].id}`,
        style: { stroke: "var(--border)", strokeWidth: 1 },
      });
    }

    foreshadows.forEach((f) => {
      if (f.plantChapterId && f.payoffChapterId) {
        rawEdges.push({
          id: `e_fs_${f.id}`,
          source: `ch_${f.plantChapterId}`,
          target: `ch_${f.payoffChapterId}`,
          label: (f.description || "Foreshadow").substring(0, 15),
          style: {
            stroke: "#f39c12",
            strokeWidth: 1.5,
            strokeDasharray: "6 3",
          },
          data: { isForeshadow: true },
        });
      }
    });

    return { nodes: rawNodes, edges: rawEdges };
  }, [
    characters,
    events,
    nations,
    treasures,
    techniques,
    monsters,
    chapters,
    foreshadows,
    deferredTime,
    baseLayoutPositions,
  ]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialElements.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialElements.edges);

  useEffect(() => {
    setNodes(initialElements.nodes);
    setEdges(initialElements.edges);
  }, [initialElements, setNodes, setEdges]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      ref.current?.requestFullscreen().catch((err) => console.warn(err));
    } else {
      document.exitFullscreen();
    }
  };

  const renderedNodes = useMemo(() => {
    const activeNodes = nodes.filter((n) => {
      if (n.id.startsWith("char_") && !showChars) return false;
      if (n.id.startsWith("nation_") && !showNations) return false;
      if (n.id.startsWith("event_") && !showEvents) return false;
      if (n.id.startsWith("tr_") && !showTreasures) return false;
      if (n.id.startsWith("tech_") && !showTechniques) return false;
      if (n.id.startsWith("mon_") && !showMonsters) return false;
      if (n.id.startsWith("ch_") && !showChapters) return false;
      return true;
    });

    const isSpotlightActive = !!spotlightNodeId;
    const isSearchActive = !!searchQuery;
    const searchLower = searchQuery.toLowerCase();

    const connectedNodeIds = new Set<string>();
    if (isSpotlightActive) {
      connectedNodeIds.add(spotlightNodeId!);
      edges.forEach((e) => {
        if (e.source === spotlightNodeId) connectedNodeIds.add(e.target);
        if (e.target === spotlightNodeId) connectedNodeIds.add(e.source);
      });
    }

    return activeNodes.map((n) => {
      let opacity = 1;
      const matchesSpotlight = isSpotlightActive
        ? connectedNodeIds.has(n.id)
        : true;
      const matchesSearch = isSearchActive
        ? ((n.data.label as string) || "").toLowerCase().includes(searchLower)
        : true;

      if (isSpotlightActive && isSearchActive) {
        opacity = matchesSpotlight && matchesSearch ? 1 : 0.08;
      } else if (isSpotlightActive) {
        opacity = matchesSpotlight ? 1 : 0.15;
      } else if (isSearchActive) {
        opacity = matchesSearch ? 1 : 0.08;
      }

      return {
        ...n,
        style: {
          ...n.style,
          opacity,
          transition: "opacity 0.2s ease",
        },
      };
    });
  }, [
    nodes,
    edges,
    spotlightNodeId,
    searchQuery,
    showChars,
    showNations,
    showEvents,
    showTreasures,
    showTechniques,
    showMonsters,
    showChapters,
  ]);

  const renderedEdges = useMemo(() => {
    const activeNodeIds = new Set(renderedNodes.map((n) => n.id));
    const activeEdges = edges
      .filter((e) => activeNodeIds.has(e.source) && activeNodeIds.has(e.target))
      .filter((e) => {
        if (!showForeshadows && e.data?.isForeshadow) return false;
        return true;
      });

    if (!spotlightNodeId) return activeEdges;
    return activeEdges.map((e) => ({
      ...e,
      style: {
        ...e.style,
        opacity:
          e.source === spotlightNodeId || e.target === spotlightNodeId
            ? 1
            : 0.05,
        transition: "opacity 0.2s ease",
      },
    }));
  }, [edges, renderedNodes, spotlightNodeId, showForeshadows]);

  const ghostNodes = useMemo(
    () => initialElements.nodes.filter((n) => n.id.startsWith("ghost_")),
    [initialElements.nodes],
  );

  return (
    <div
      ref={ref}
      className="seshat-page-container"
      style={{
        display: "flex",
        flexDirection: "row",
        overflow: "hidden",
        height: "100%",
        padding: 0,
        gap: 0,
        background: "var(--bg-main)",
      }}
    >
      <div
        style={{
          flex: 1,
          position: "relative",
          height: "100%",
          background: "var(--bg-main)",
        }}
      >
        <ReactFlow
          nodes={renderedNodes}
          edges={renderedEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={(_, node) => setSpotlightNodeId(node.id)}
          onPaneClick={() => setSpotlightNodeId(null)}
          fitView
          attributionPosition="bottom-right"
        >
          <Controls />
          <Background color="var(--border)" gap={16} />
        </ReactFlow>

        <button
          onClick={toggleFullscreen}
          style={{
            ...S.ghost,
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 10,
            background: "var(--bg-panel)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "8px 12px",
            color: "var(--text-primary)",
            fontWeight: "bold",
            fontSize: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </button>
      </div>

      <div
        style={{
          width: 320,
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-panel)",
          borderLeft: "1px solid var(--border)",
          zIndex: 10,
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <h2 style={{ ...S.h2, margin: 0, fontSize: 16 }}>Inspector</h2>
          {initialElements.nodes.length > 150 && (
            <span
              style={{
                color: "#ffbd2e",
                fontSize: 10,
                fontWeight: "bold",
                background: "rgba(255, 189, 46, 0.1)",
                padding: "2px 6px",
                borderRadius: 12,
              }}
            >
              ⚠️ Lag Warning
            </span>
          )}
        </div>

        <div
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <input
            type="text"
            placeholder="Search entities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "var(--bg-main)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        {spotlightNodeId ? (
          <EntityInspector
            spotlightNodeId={spotlightNodeId}
            renderedNodes={renderedNodes}
            characters={characters}
            events={events}
            nations={nations}
            treasures={treasures}
            techniques={techniques}
            monsters={monsters}
            chapters={chapters}
            bookId={bookId}
            deferredTime={deferredTime}
          />
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              overflowY: "auto",
            }}
          >
            <div
              style={{
                padding: 20,
                borderBottom: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: "bold",
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                  }}
                >
                  Timeline
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: "bold",
                    color: "var(--color-primary)",
                    fontFamily: "monospace",
                  }}
                >
                  T{currentTime}
                </span>
              </div>

              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: 24,
                  marginTop: 4,
                }}
              >
                <input
                  type="range"
                  min={0}
                  max={maxEventTime}
                  value={currentTime}
                  onChange={(e) => setCurrentTime(parseInt(e.target.value))}
                  style={{
                    width: "100%",
                    position: "absolute",
                    top: 4,
                    zIndex: 2,
                    margin: 0,
                    cursor: "pointer",
                    accentColor: "var(--color-primary)",
                  }}
                  title="Slide to see relationships evolve over time"
                />
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                >
                  {events.map((e) => (
                    <Tooltip
                      key={`tick_${e.id}`}
                      title={e.title}
                      placement="top"
                      arrow
                    >
                      <div
                        style={{
                          position: "absolute",
                          left: `${((e.time || 0) / maxEventTime) * 100}%`,
                          width: 4, // widened slightly for easier hovering
                          height: 12,
                          background: "var(--border)",
                          top: 6,
                          transform: "translateX(-50%)",
                          pointerEvents: "auto",
                          cursor: "pointer",
                        }}
                        onClick={() => setCurrentTime(e.time || 0)}
                      />
                    </Tooltip>
                  ))}
                </div>
              </div>

              {events
                .filter((e) => Math.abs((e.time || 0) - currentTime) < 0.1)
                .map((e) => (
                  <div
                    key={`banner_${e.id}`}
                    style={{
                      background: "var(--color-primary)",
                      color: "#fff",
                      padding: "4px 8px",
                      fontSize: 12,
                      borderRadius: 4,
                      marginTop: 4,
                      textAlign: "center",
                      fontWeight: "bold",
                    }}
                  >
                    T{e.time} — {e.title}
                  </div>
                ))}
            </div>

            <div
              style={{
                padding: 20,
                borderBottom: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: "bold",
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                }}
              >
                Visibility Toggles
              </span>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                {[
                  {
                    label: "Characters",
                    state: showChars,
                    setter: setShowChars,
                  },
                  {
                    label: "Nations",
                    state: showNations,
                    setter: setShowNations,
                  },
                  { label: "Events", state: showEvents, setter: setShowEvents },
                  {
                    label: "Treasures",
                    state: showTreasures,
                    setter: setShowTreasures,
                  },
                  {
                    label: "Techniques",
                    state: showTechniques,
                    setter: setShowTechniques,
                  },
                  {
                    label: "Monsters",
                    state: showMonsters,
                    setter: setShowMonsters,
                  },
                  {
                    label: "Chapters",
                    state: showChapters,
                    setter: setShowChapters,
                  },
                  {
                    label: "Foreshadows",
                    state: showForeshadows,
                    setter: setShowForeshadows,
                  },
                ].map((t) => (
                  <label
                    key={t.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      fontSize: 13,
                      color: "var(--text-primary)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={t.state}
                      onChange={(e) => t.setter(e.target.checked)}
                    />{" "}
                    {t.label}
                  </label>
                ))}
              </div>
            </div>

            {ghostNodes.length > 0 && (
              <div
                style={{
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: "bold",
                    color: "var(--color-danger)",
                    textTransform: "uppercase",
                  }}
                >
                  ⚠️ {ghostNodes.length} Anomal
                  {ghostNodes.length !== 1 ? "ies" : "y"}
                </span>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  {ghostNodes.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setSpotlightNodeId(g.id)}
                      style={{
                        ...S.ghost,
                        textAlign: "left",
                        fontSize: 12,
                        padding: "8px 12px",
                        color: "var(--text-primary)",
                        background: "rgba(255, 42, 95, 0.05)",
                        border: "1px dashed var(--color-danger)",
                        borderRadius: 6,
                      }}
                    >
                      {g.data.label as string}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showForeshadows && foreshadows.length > 0 && (
              <div
                style={{
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: "bold",
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                  }}
                >
                  Foreshadow Threads
                </span>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  {foreshadows.map((f) => {
                    const plantCh = chapters.find(
                      (c) => c.id === f.plantChapterId,
                    );
                    const payoffCh = chapters.find(
                      (c) => c.id === f.payoffChapterId,
                    );

                    let badgeColor = "var(--color-orange)";
                    if (f.status === "Payoffed")
                      badgeColor = "var(--color-green)";
                    else if (f.status === "Abandoned")
                      badgeColor = "var(--color-danger)";

                    return (
                      <div
                        key={f.id}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                          background: "var(--bg-main)",
                          padding: 12,
                          borderRadius: 6,
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: "bold",
                              color: "var(--text-primary)",
                            }}
                          >
                            {f.description || "Thread"}
                          </span>
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: "bold",
                              textTransform: "uppercase",
                              background: badgeColor,
                              color: "#fff",
                              padding: "2px 6px",
                              borderRadius: 10,
                            }}
                          >
                            {f.status}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--text-secondary)",
                          }}
                        >
                          {plantCh ? `Ch.${plantCh.order}` : "?"} →{" "}
                          {payoffCh ? `Ch.${payoffCh.order}` : "?"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
