import { useCallback, useMemo, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Edge,
  Node,
  MarkerType,
} from "@xyflow/react";
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

// Helper to layout the graph
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  // A rankdir of 'LR' or 'TB'
  dagreGraph.setGraph({ rankdir: "LR", ranksep: 200, nodesep: 50 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 150, height: 50 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = "left" as any;
    node.sourcePosition = "right" as any;
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
  const { bookId } = useParams();
  const characters = useCharacters() || [];
  const events = useEvents() || [];
  const nations = useNations() || [];
  const treasures = useTreasures() || [];
  const ref = useAnimateIn();

  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const maxEventTime = useMemo(() => events.length > 0 ? Math.max(...events.map(e => e.time)) : 10, [events]);
  const [currentTime, setCurrentTime] = useState(maxEventTime);

  // Keep slider updated if new events are added
  useEffect(() => {
    if (currentTime > maxEventTime) setCurrentTime(maxEventTime);
  }, [maxEventTime, currentTime]);

  const initialElements = useMemo(() => {
    const rawNodes: Node[] = [];
    const rawEdges: Edge[] = [];

    // NATIONS
    nations.forEach((n) => {
      rawNodes.push({
        id: `nation_${n.id}`,
        data: { label: n.name },
        position: { x: 0, y: 0 },
        style: {
          background: "var(--bg-panel)",
          color: "var(--color-green)",
          border: "2px solid var(--color-green)",
          borderRadius: 8,
          fontWeight: "bold",
        },
      });

      // Nation connections
      n.connections?.forEach((conn) => {
        rawEdges.push({
          id: `e_nat_${n.id}_${conn.withNation}`,
          source: `nation_${n.id}`,
          target: `nation_${conn.withNation}`,
          label: conn.relation,
          animated: true,
          style: { stroke: "var(--color-green)", strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "var(--color-green)" },
        });
      });
    });

    // CHARACTERS
    characters.forEach((c) => {
      rawNodes.push({
        id: `char_${c.id}`,
        data: { label: c.name },
        position: { x: 0, y: 0 },
        style: {
          background: "var(--bg-panel)",
          color: c.color || "var(--color-purple)",
          border: `2px solid ${c.color || "var(--color-purple)"}`,
          borderRadius: 20, // circle-ish
          fontWeight: "bold",
        },
      });

      // Relationships
      c.relationships?.forEach((r) => {
        // Find the latest timeline entry that is <= currentTime
        const validEntries = (r.timeline || []).filter(t => t.time <= currentTime).sort((a, b) => b.time - a.time);
        
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
          animated: dynamicLabel.toLowerCase().includes("love") || dynamicLabel.toLowerCase().includes("hate") || dynamicLabel.toLowerCase().includes("rival"),
          style: { stroke: c.color || "var(--color-purple)", strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: c.color || "var(--color-purple)" },
        });
      });

      // Events character participated in
      Object.keys(c.attributes || {}).forEach((eventId) => {
        const ev = events.find(e => e.id === eventId);
        if (ev && ev.time <= currentTime) {
          rawEdges.push({
            id: `e_ev_${c.id}_${eventId}`,
            source: `char_${c.id}`,
            target: `event_${eventId}`,
            style: { stroke: "var(--border)", strokeWidth: 1, opacity: 0.5 },
          });
        }
      });
    });

    // EVENTS (Only events <= currentTime)
    events.filter(e => e.time <= currentTime).forEach((e) => {
      rawNodes.push({
        id: `event_${e.id}`,
        data: { label: `T${e.time}: ${e.title}` },
        position: { x: 0, y: 0 },
        style: {
          background: "var(--bg-panel)",
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
        position: { x: 0, y: 0 },
        style: {
          background: "var(--bg-panel)",
          color: "var(--color-orange)",
          border: "2px solid var(--color-orange)",
          borderRadius: 4,
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)", // Hexagon
          fontWeight: "bold",
          padding: "10px 5px",
        },
      });

      if (t.creator) {
        // If creator matches a character name (rough mapping)
        const creatorChar = characters.find(c => c.name.toLowerCase() === t.creator.toLowerCase());
        if (creatorChar) {
          rawEdges.push({
            id: `e_tr_${t.id}_${creatorChar.id}`,
            source: `char_${creatorChar.id}`,
            target: `tr_${t.id}`,
            label: "Created",
            style: { stroke: "var(--color-orange)", strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "var(--color-orange)" },
          });
        }
      }
    });

    return getLayoutedElements(rawNodes, rawEdges);
  }, [characters, events, nations, treasures, currentTime]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialElements.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialElements.edges);

  // Sync nodes when time changes
  useEffect(() => {
    setNodes(initialElements.nodes);
    setEdges(initialElements.edges);
  }, [initialElements, setNodes, setEdges]);

  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", height: isFullscreen ? "100vh" : "80vh", position: isFullscreen ? "fixed" : "relative", inset: 0, zIndex: isFullscreen ? 100 : 1, background: "var(--bg-body)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isFullscreen ? 0 : 20, padding: isFullscreen ? "10px 20px" : 0 }}>
        <h2 style={{ ...S.h2, margin: 0 }}>Lore & Relationship Web</h2>
        
        <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, maxWidth: 400, marginLeft: 40 }}>
          <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: "bold" }}>T{currentTime}</span>
          <input 
            type="range" 
            min={0} 
            max={maxEventTime} 
            value={currentTime} 
            onChange={(e) => setCurrentTime(parseInt(e.target.value))} 
            style={{ flex: 1, cursor: "pointer", accentColor: "var(--color-purple)" }}
            title="Slide to see relationships evolve over time"
          />
        </div>

        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          style={{ ...S.ghost, color: "var(--text-secondary)" }}
        >
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </button>
      </div>

      <div style={{ flex: 1, border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", background: "var(--bg-panel)" }}>
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
