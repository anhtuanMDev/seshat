# Lore Web Page (Knowledge Graph) Context & Architecture

This document provides a comprehensive summary of the **Lore Web Page** (`LoreWebPage.tsx`) feature in Seshat. It serves as the primary visualizer for world-building, transforming raw database entities into an interactive, chronological node-graph.

## 1. Feature Overview
The Lore Web Page is an interactive, force-directed knowledge graph built on top of `@xyflow/react` (React Flow) and `dagre` (for automated Directed Acyclic Graph layouts). 

Its primary purpose is to allow writers and world-builders to visualize how entities (Characters, Nations, Treasures, Events) connect to each other. The standout feature is its **Time Slider**, which allows the user to scrub back and forth through the timeline to watch relationships dynamically form, evolve, or break as time passes.

## 2. UI & Node Styling Definitions
Entities are represented as distinct nodes on the canvas. Their shapes, colors, and styling correspond to their entity type:

* **Nations**: Rendered with green borders, bold text, and a standard rectangular shape.
* **Characters**: Rendered as pill/circle shapes with rounded borders (`borderRadius: 20`). Their color matches their assigned character color theme.
* **Events**: Rendered with blue dashed borders. They serve as timeline anchors (`T{time}: {title}`).
* **Treasures**: Rendered as orange hexagons using CSS `clipPath` polygons. 

## 3. The Chronological "Time Travel" Engine (Core Logic)
The graph is not static; it is heavily tied to the `events` timeline. 

**How the Time Slider Works:**
1. **Initialization:** The page calculates the maximum `time` value across all existing events (`maxEventTime`).
2. **Scrubbing:** A range slider bounds between `0` and `maxEventTime`. When scrubbed, it updates `currentTime`.
3. **Optimization:** Because recalculating the entire graph on every mouse move is expensive, the slider uses React's `useDeferredValue(currentTime)`. This ensures the UI slider remains perfectly smooth at 60fps, while the heavy graph diffing happens in the background.

**Time-Gated Edge Filtering:**
* **Events:** Any event node where `event.time > deferredTime` is stripped from the graph. It essentially "hasn't happened yet."
* **Relationships:** Character relationships have a localized `timeline` array. The graph filters this array to find the *latest* entry where `time <= deferredTime`. 
  * If no timeline entry exists yet, the relationship edge is hidden.
  * If an entry exists, the edge label dynamically updates to reflect their feelings at that specific point in time (e.g., "Friends" at T5, but updating to "Bitter Rivals" at T10).
  * Edges involving extreme emotions ("love", "hate", "rival") are automatically animated (dotted/moving lines) on the canvas.

## 4. Data Handling & Layout Pipeline
To ensure the graph doesn't render as a messy, overlapping web, the page uses a two-pass layout system:

1. **Pass 1 - Base Layout Generation (`baseLayoutPositions`)**
   * The code aggregates *all* possible nodes and *all* possible edges across time.
   * It passes this massive array into `dagre.graphlib.Graph()`.
   * `dagre` calculates a stable Left-to-Right (`rankdir: "LR"`) layout matrix, pushing connected nodes near each other and preventing line overlapping.
   * This master map of `x/y` coordinates is memoized.

2. **Pass 2 - Time-Filtered Rendering (`initialElements`)**
   * When the user scrubs the timeline, nodes and edges are dynamically filtered out.
   * However, the remaining nodes *retain their exact coordinates from Pass 1*. 
   * **Why this is critical:** If we recalculated the layout on every slider tick, nodes would violently jump around the screen as other nodes disappeared. By using a stable "Base Layout," nodes stay perfectly still, and connections simply fade in and out as time progresses.

## 5. Expected Behaviors & Interactions
* **Fullscreen Mode:** Users can expand the graph to fill the entire viewport via the "Fullscreen" toggle.
* **Interactive Canvas:** Users can pan, zoom, and drag nodes around manually. The `ReactFlow` `<Background />` provides a dotted grid.
* **Creator Edges:** If a Treasure's `creator` text roughly matches a Character's name, the graph automatically extrapolates this and draws a "Created" edge between the character and the treasure.
* **Nation Edges:** Nation connections map directly to other Nations based on text-matching relations.

## Summary
The Lore Web Page is a read-only, chronological map. It acts as the ultimate truth of the world state at any given `T`. To modify the graph, the user must go back to the standard database/editor interfaces to add events, modify character timelines, or create artifacts.
