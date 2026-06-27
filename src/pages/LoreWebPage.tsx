import { useMemo, useState, useEffect, useDeferredValue } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from "@xyflow/react";
import type { Edge, Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  useCharacters,
  useEvents,
  useNations,
  useTreasures,
} from "../hooks/useWorldStore";
import dagre from "dagre";
import { useAnimateIn } from "../hooks/useAnimateIn";
import { S } from "../lib/utils";
import { EMPTY_ARR } from "../lib/constants";

// Helper to safely and consistently resolve text references between entities
const normalizeName = (name: string) => name ? name.normalize("NFC").trim().toLowerCase() : "";
const resolveEntityByName = <T extends { name: string }>(entities: T[], name: string): T | undefined => {
  const normalized = normalizeName(name);
  if (!normalized) return undefined;
  return entities.find((e) => normalizeName(e.name) === normalized);
};

// Helper to layout the graph
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  // A rankdir of 'LR' or 'TB'
  dagreGraph.setGraph({ rankdir: "LR", ranksep: 200, nodesep: 50 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 150, height: 50 });
  });

  // Cycle breaking logic (DFS) to prevent dagre from throwing on world-building cycles
  const adjacency = new Map<string, string[]>();
  nodes.forEach(n => adjacency.set(n.id, []));
  edges.forEach(edge => adjacency.get(edge.source)?.push(edge.target));

  const visiting = new Set<string>();
  const visited = new Set<string>();
  
  const dfs = (nodeId: string) => {
    visiting.add(nodeId);
    const neighbors = adjacency.get(nodeId) || [];
    for (const target of neighbors) {
      if (visiting.has(target)) {
        console.warn(`[LoreWebPage] Cycle detected: dropping layout edge ${nodeId} -> ${target}`);
      } else {
        dagreGraph.setEdge(nodeId, target);
        if (!visited.has(target)) dfs(target);
      }
    }
    visiting.delete(nodeId);
    visited.add(nodeId);
  };

  nodes.forEach(n => {
    if (!visited.has(n.id)) dfs(n.id);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = Position.Left;
    node.sourcePosition = Position.Right;
    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - 75,
      y: nodeWithPosition.y - 25,
    };
    return node;
  });

  return { nodes, edges };
};


export default function LoreWebPage() {
  const characters = useCharacters() || EMPTY_ARR;
  const events = useEvents() || EMPTY_ARR;
  const nations = useNations() || EMPTY_ARR;
  const treasures = useTreasures() || EMPTY_ARR;
  const ref = useAnimateIn();

  const [isFullscreen, setIsFullscreen] = useState(false);

  const maxEventTime = useMemo(
    () => (events.length > 0 ? Math.max(...events.map((e) => e.time)) : 10),
    [events],
  );

  const [currentTimeRaw, setCurrentTimeRaw] = useState(maxEventTime);
  const currentTime = Math.min(currentTimeRaw, maxEventTime);
  const deferredTime = useDeferredValue(currentTime);
  const setCurrentTime = setCurrentTimeRaw;

  const baseLayoutPositions = useMemo(() => {
    const rawNodes: Node[] = [];
    const rawEdges: Edge[] = [];
    const seenGhosts = new Set<string>();

    nations.forEach((n) => {
      rawNodes.push({ id: `nation_${n.id}`, position: { x: 0, y: 0 }, data: { label: "" } });
      n.connections?.forEach((conn) => {
        const targetNation = resolveEntityByName(nations, conn.withNation);
        if (targetNation) {
          rawEdges.push({ id: `e_nat_${n.id}_${targetNation.id}`, source: `nation_${n.id}`, target: `nation_${targetNation.id}` });
        } else if (conn.withNation) {
          const ghostId = `ghost_nat_${conn.withNation.replace(/\s+/g, '_')}`;
          if (!seenGhosts.has(ghostId)) {
            seenGhosts.add(ghostId);
            rawNodes.push({ id: ghostId, position: { x: 0, y: 0 }, data: { label: "" } });
          }
          rawEdges.push({ id: `e_nat_${n.id}_${ghostId}`, source: `nation_${n.id}`, target: ghostId });
        }
      });
    });

    characters.forEach((c) => {
      rawNodes.push({ id: `char_${c.id}`, position: { x: 0, y: 0 }, data: { label: "" } });
      c.relationships?.forEach((r) => {
        rawEdges.push({ id: `e_char_${c.id}_${r.withId}`, source: `char_${c.id}`, target: `char_${r.withId}` });
      });
      Object.keys(c.attributes || {}).forEach((eventId) => {
        rawEdges.push({ id: `e_ev_${c.id}_${eventId}`, source: `char_${c.id}`, target: `event_${eventId}` });
      });
    });

    events.forEach((e) => {
      rawNodes.push({ id: `event_${e.id}`, position: { x: 0, y: 0 }, data: { label: "" } });
    });

    treasures.forEach((t) => {
      rawNodes.push({ id: `tr_${t.id}`, position: { x: 0, y: 0 }, data: { label: "" } });
      if (t.creator) {
        const creatorChar = resolveEntityByName(characters, t.creator);
        if (creatorChar) {
          rawEdges.push({ id: `e_tr_${t.id}_${creatorChar.id}`, source: `char_${creatorChar.id}`, target: `tr_${t.id}` });
        } else {
          const ghostId = `ghost_char_${t.creator.replace(/\s+/g, '_')}`;
          if (!seenGhosts.has(ghostId)) {
            seenGhosts.add(ghostId);
            rawNodes.push({ id: ghostId, position: { x: 0, y: 0 }, data: { label: "" } });
          }
          rawEdges.push({ id: `e_tr_${t.id}_${ghostId}`, source: ghostId, target: `tr_${t.id}` });
        }
      }
    });

    const layouted = getLayoutedElements(rawNodes, rawEdges);
    const posMap = new Map<string, { x: number; y: number; sourcePosition?: Position; targetPosition?: Position }>();
    layouted.nodes.forEach((n) => {
      posMap.set(n.id, { x: n.position.x, y: n.position.y, sourcePosition: n.sourcePosition, targetPosition: n.targetPosition });
    });
    return posMap;
  }, [characters, events, nations, treasures]);

  const initialElements = useMemo(() => {
    const rawNodes: Node[] = [];
    const rawEdges: Edge[] = [];
    const seenGhosts = new Set<string>();

    const applyPos = (id: string) => {
      const pos = baseLayoutPositions.get(id);
      return {
        position: pos ? { x: pos.x, y: pos.y } : { x: 0, y: 0 },
        sourcePosition: pos?.sourcePosition || Position.Right,
        targetPosition: pos?.targetPosition || Position.Left,
      };
    };

    // Note: We intentionally DO NOT break cycles here. The DFS cycle-breaker in
    // getLayoutedElements protects dagre from throwing a fatal error during layout,
    // but we still want cyclical relationships (e.g. Nation A <-> Nation B) to
    // render visibly on the React Flow canvas.
    
    // NATIONS
    nations.forEach((n) => {
      rawNodes.push({
        id: `nation_${n.id}`,
        data: { label: n.name },
        ...applyPos(`nation_${n.id}`),
        style: {
          background: "var(--bg-main)",
          color: "var(--color-green)",
          border: "2px solid var(--color-green)",
          borderRadius: 8,
          fontWeight: "bold",
        },
      });

      // Nation connections
      n.connections?.forEach((conn) => {
        const targetNation = resolveEntityByName(nations, conn.withNation);
        if (targetNation) {
          rawEdges.push({
            id: `e_nat_${n.id}_${targetNation.id}`,
            source: `nation_${n.id}`,
            target: `nation_${targetNation.id}`,
            label: conn.relation,
            animated: true,
            style: { stroke: "var(--color-green)", strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "var(--color-green)" },
          });
        } else if (conn.withNation) {
          const ghostId = `ghost_nat_${conn.withNation.replace(/\s+/g, '_')}`;
          if (!seenGhosts.has(ghostId)) {
            seenGhosts.add(ghostId);
            rawNodes.push({
              id: ghostId,
              data: { label: `? ${conn.withNation}` },
              ...applyPos(ghostId),
              style: {
                background: "var(--bg-main)",
                color: "#ff2a5f",
                border: "2px dashed #ff2a5f",
                borderRadius: 8,
                fontWeight: "bold",
              }
            });
          }
          rawEdges.push({
            id: `e_nat_${n.id}_${ghostId}`,
            source: `nation_${n.id}`,
            target: ghostId,
            label: conn.relation,
            animated: true,
            style: { stroke: "#ff2a5f", strokeWidth: 1.5, strokeDasharray: "4 4" },
          });
        }
      });
    });

    // CHARACTERS
    characters.forEach((c) => {
      rawNodes.push({
        id: `char_${c.id}`,
        data: { label: c.name },
        ...applyPos(`char_${c.id}`),
        style: {
          background: "var(--bg-main)",
          color: c.color || "var(--color-primary)",
          border: `2px solid ${c.color || "var(--color-primary)"}`,
          borderRadius: 20, // circle-ish
          fontWeight: "bold",
        },
      });

      // Relationships
      c.relationships?.forEach((r) => {
        // Find the latest timeline entry that is <= deferredTime
        const validEntries = (r.timeline || [])
          .filter((t) => t.time <= deferredTime)
          .sort((a, b) => b.time - a.time);

        let dynamicLabel = r.feel || "Connected";
        if (validEntries.length > 0) {
          dynamicLabel = validEntries[0].dynamic;
        } else if (r.timeline?.length > 0) {
          return; // Relationship hasn't formed yet at this point in time
        }

        rawEdges.push({
          id: `e_char_${c.id}_${r.withId}`,
          source: `char_${c.id}`,
          target: `char_${r.withId}`,
          label: dynamicLabel,
          animated:
            dynamicLabel.toLowerCase().includes("love") ||
            dynamicLabel.toLowerCase().includes("hate") ||
            dynamicLabel.toLowerCase().includes("rival"),
          style: { stroke: c.color || "var(--color-primary)", strokeWidth: 1.5 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: c.color || "var(--color-primary)",
          },
        });
      });

      // Events character participated in
      Object.keys(c.attributes || {}).forEach((eventId) => {
        const ev = events.find((e) => e.id === eventId);
        if (ev && ev.time <= deferredTime) {
          rawEdges.push({
            id: `e_ev_${c.id}_${eventId}`,
            source: `char_${c.id}`,
            target: `event_${eventId}`,
            style: { stroke: "var(--border)", strokeWidth: 1, opacity: 0.5 },
          });
        }
      });
    });

    // EVENTS (Only events <= deferredTime)
    events
      .filter((e) => e.time <= deferredTime)
      .forEach((e) => {
        rawNodes.push({
          id: `event_${e.id}`,
          data: { label: `T${e.time}: ${e.title}` },
          ...applyPos(`event_${e.id}`),
          style: {
            background: "var(--bg-main)",
            color: "var(--color-blue)",
            border: "1px dashed var(--color-blue)",
            borderRadius: 4,
            fontSize: 12,
          },
        });
      });

    // TREASURES
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
          clipPath:
            "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)", // Hexagon
          fontWeight: "bold",
          padding: "10px 5px",
        },
      });

      if (t.creator) {
        // If creator matches a character name (rough mapping)
        const creatorChar = resolveEntityByName(characters, t.creator);
        if (creatorChar) {
          rawEdges.push({
            id: `e_tr_${t.id}_${creatorChar.id}`,
            source: `char_${creatorChar.id}`,
            target: `tr_${t.id}`,
            label: "Created",
            style: { stroke: "var(--color-orange)", strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "var(--color-orange)" },
          });
        } else {
          const ghostId = `ghost_char_${t.creator.replace(/\s+/g, '_')}`;
          if (!seenGhosts.has(ghostId)) {
            seenGhosts.add(ghostId);
            rawNodes.push({
              id: ghostId,
              data: { label: `? ${t.creator}` },
              ...applyPos(ghostId),
              style: {
                background: "var(--bg-main)",
                color: "#ff2a5f",
                border: "2px dashed #ff2a5f",
                borderRadius: 20,
                fontWeight: "bold",
              }
            });
          }
          rawEdges.push({
            id: `e_tr_${t.id}_${ghostId}`,
            source: ghostId,
            target: `tr_${t.id}`,
            label: "Created",
            style: { stroke: "#ff2a5f", strokeWidth: 1.5, strokeDasharray: "4 4" },
          });
        }
      }
    });

    return { nodes: rawNodes, edges: rawEdges };
  }, [characters, events, nations, treasures, deferredTime, baseLayoutPositions]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialElements.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialElements.edges);

  // Sync nodes when time changes
  useEffect(() => {
    setNodes(initialElements.nodes);
    setEdges(initialElements.edges);
  }, [initialElements, setNodes, setEdges]);

  return (
    <div ref={ref} className="seshat-page-container">
      <div
        className="seshat-flex-between"
        style={{
          marginBottom: isFullscreen ? 0 : "var(--space-5)",
          padding: isFullscreen ? "10px 20px" : 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <h2 style={styles.title}>Lore & Relationship Web</h2>
          {initialElements.nodes.length > 150 && (
            <span style={{ color: "#ffbd2e", fontSize: 12, fontWeight: "bold", background: "rgba(255, 189, 46, 0.1)", padding: "2px 8px", borderRadius: 12 }}>
              ⚠️ Large Graph (Layout may lag)
            </span>
          )}
        </div>

        <div className="seshat-flex-align" style={styles.sliderContainer}>
          <span style={styles.sliderLabel}>
            T{currentTime}
          </span>
          <input
            type="range"
            min={0}
            max={maxEventTime}
            value={currentTime}
            onChange={(e) => setCurrentTime(parseInt(e.target.value))}
            style={styles.sliderInput}
            title="Slide to see relationships evolve over time"
          />
        </div>

        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          style={styles.fullscreenBtn}
        >
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </button>
      </div>

      <div style={styles.flowContainer}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          attributionPosition="bottom-right"
        >
          <Controls />
          <Background color="var(--border)" gap={16} />
        </ReactFlow>
      </div>
    </div>
  );
}

const styles = {
  title: {
    ...S.h2,
    margin: 0,
  },
  sliderContainer: {
    gap: "var(--space-4)",
    flex: 1,
    maxWidth: 400,
    marginLeft: 40,
  },
  sliderLabel: {
    fontSize: 12,
    color: "var(--text-secondary)",
    fontWeight: "bold",
  },
  sliderInput: {
    flex: 1,
    cursor: "pointer",
    accentColor: "var(--color-primary)",
  },
  fullscreenBtn: {
    ...S.ghost,
    color: "var(--text-secondary)",
  },
  flowContainer: {
    flex: 1,
    border: "1px solid var(--border)",
    borderRadius: 8,
    overflow: "hidden",
    background: "var(--bg-main)",
  },
} satisfies Record<string, React.CSSProperties>;
