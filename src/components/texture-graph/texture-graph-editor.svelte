<script lang="ts">
	import {
		SvelteFlow,
		Background,
		Controls,
		MiniMap,
		type Node as XYNode,
		type Edge as XYEdge,
		type NodeTypes,
		type EdgeTypes,
		type Connection
	} from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';

	import X from '@lucide/svelte/icons/x';
	import Plus from '@lucide/svelte/icons/plus';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Frame from '@lucide/svelte/icons/frame';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	import { composer } from '@/lib/state/composer.svelte';
	import { ProceduralField } from '@/shaders/textures/procedural-field.svelte';
	import { canCoerce, getPrimitive, listPrimitives, type PinSpec } from '@/shaders/node-graph';

	import GraphPrimitiveNode from './graph-primitive-node.svelte';
	import GraphRerouteNode from './graph-reroute-node.svelte';
	import GraphFrameNode from './graph-frame-node.svelte';
	import GraphGroupInputNode from './graph-group-input-node.svelte';
	import GraphEdge from './graph-edge.svelte';
	import GraphPalette from './graph-palette.svelte';
	import GraphShortcuts from './graph-shortcuts.svelte';

	// Category palette mirrored from graph-primitive-node.svelte — kept in sync
	// so the minimap reads as the same color system as the canvas. Worth a
	// short duplicate to keep the node component self-contained instead of
	// spawning a shared module for one constant.
	const CATEGORY_COLOR: Record<string, string> = {
		input: '#0ea5e9',
		texture: '#f59e0b',
		color: '#ec4899',
		vector: '#8b5cf6',
		converter: '#10b981',
		group: '#94a3b8'
	};

	const nodeTypes: NodeTypes = {
		primitive: GraphPrimitiveNode,
		reroute: GraphRerouteNode,
		frame: GraphFrameNode,
		'group-input': GraphGroupInputNode
	};
	const edgeTypes: EdgeTypes = { reconnectable: GraphEdge };

	let layer = $derived.by(() => {
		const id = composer.editingTextureLayerId;
		if (!id) return null;
		return composer.scene.findLayer(id) ?? null;
	});

	let proceduralField = $derived.by(() => {
		const src = layer?.source;
		return src instanceof ProceduralField ? src : null;
	});

	// The NodeGraph currently visible in the editor — root by default, or the
	// nested subGraph of whichever group node the user has tabbed into. All
	// derivations below read from this, and the composer's edit methods are
	// already retargeted through `activeGraphFor`, so mutations land in the
	// right place automatically.
	let activeGraph = $derived.by(() => {
		const layerId = composer.editingTextureLayerId;
		if (!layerId) return null;
		return composer.activeGraphFor(layerId);
	});

	let breadcrumb = $derived(composer.graphBreadcrumb());

	let nodes = $derived.by<XYNode[]>(() => {
		const graph = activeGraph;
		if (!graph) return [];
		// Frames first so xyflow's stable-ordered render places them under the
		// primitive nodes; the explicit zIndex pulls them all the way to the
		// back so primitives never appear under a frame's translucent body.
		const frameNodes: XYNode[] = (graph.frames ?? []).map((f) => ({
			id: f.id,
			type: 'frame',
			position: f.position,
			data: { frameId: f.id, label: f.label, color: f.color },
			width: f.size.width,
			height: f.size.height,
			selectable: true,
			draggable: true,
			deletable: true,
			zIndex: -1
		}));
		// Precompute the wired-input set per node so each primitive node can
		// branch its pin row between an inline editor (unwired) and a passive
		// label (wired) without scanning all edges itself.
		const wiredByTarget = new Map<string, Set<string>>();
		for (const e of graph.edges) {
			let set = wiredByTarget.get(e.toNodeId);
			if (!set) {
				set = new Set();
				wiredByTarget.set(e.toNodeId, set);
			}
			set.add(e.toPin);
		}
		const primitiveNodes: XYNode[] = graph.nodes.map((n) => ({
			id: n.id,
			type:
				n.typeId === 'reroute'
					? 'reroute'
					: n.typeId === 'group-input'
						? 'group-input'
						: 'primitive',
			position: n.position,
			data: {
				nodeId: n.id,
				typeId: n.typeId,
				config: n.config,
				pinValues: n.pinValues,
				wiredInputIds: wiredByTarget.get(n.id) ?? new Set<string>()
			},
			draggable: true,
			deletable: n.typeId !== 'group-input' && n.typeId !== 'group-output'
		}));
		return [...frameNodes, ...primitiveNodes];
	});

	// Tracks which edge the user is currently re-routing. While set, that edge
	// is rendered hidden so only xyflow's connection-line preview shows — the
	// effect is that the actual wire follows the cursor instead of leaving a
	// stale copy in place next to a ghost preview.
	let reconnectingEdgeId = $state<string | null>(null);

	// Hover focus — when the cursor is over a node, edges that don't touch it
	// fade to ~25% so the user can trace a node's connections through tangled
	// crossings. Cleared on pointerleave.
	let hoveredNodeId = $state<string | null>(null);

	let edges = $derived.by<XYEdge[]>(() => {
		const graph = activeGraph;
		if (!graph) return [];
		const dragging = reconnectingEdgeId;
		const hovered = hoveredNodeId;
		return graph.edges.map((e) => {
			const id = `${e.fromNodeId}.${e.fromPin}->${e.toNodeId}.${e.toPin}`;
			const incident = !hovered || e.fromNodeId === hovered || e.toNodeId === hovered;
			const opacity = hovered && !incident ? 0.18 : 1;
			const stroke = hovered && incident ? '#a5b4fc' : '#818cf8';
			const width = hovered && incident ? 2.5 : 2;
			return {
				id,
				type: 'reconnectable',
				source: e.fromNodeId,
				sourceHandle: e.fromPin,
				target: e.toNodeId,
				targetHandle: e.toPin,
				animated: false,
				selectable: true,
				deletable: true,
				hidden: id === dragging,
				style: `stroke: ${stroke}; stroke-width: ${width}; opacity: ${opacity}; transition: opacity 120ms ease, stroke 120ms ease, stroke-width 120ms ease;`
			};
		});
	});

	function handleNodePointerEnter({ node }: { node: XYNode }) {
		// Frames have no edges incident; treating them as a hover target would
		// fade every wire to 18%. Skip them outright.
		if (node.type === 'frame') return;
		hoveredNodeId = node.id;
	}
	function handleNodePointerLeave() {
		hoveredNodeId = null;
	}

	let paletteOpen = $state(false);

	function handleClose() {
		composer.closeTextureEditor();
	}

	function handleTidy() {
		const layerId = composer.editingTextureLayerId;
		if (!layerId) return;
		composer.relayoutGraph(layerId);
	}

	function handlePick(typeId: string) {
		const layerId = composer.editingTextureLayerId;
		if (!layerId) return;
		// Drop new nodes near canvas centre; the user will reposition.
		composer.addGraphNode(layerId, typeId, { x: 240, y: 180 });
		paletteOpen = false;
	}

	// Pin-spec lookup used by both the live drag validator (xyflow's
	// `isValidConnection`) and the post-drop guard in `handleConnect`. Two
	// layers of defense: the validator gives a visual cue while the user
	// drags, and the guard makes sure a mismatched edge can't slip in via a
	// future programmatic source either. The full PinSpec — including
	// subtype — is needed so the coercion check distinguishes colour vs.
	// vector vec3 inputs.
	function pinSpecOf(nodeId: string, pinId: string, side: 'input' | 'output'): PinSpec | null {
		const graph = activeGraph;
		if (!graph) return null;
		const node = graph.nodes.find((n) => n.id === nodeId);
		if (!node) return null;
		const prim = getPrimitive(node.typeId);
		if (!prim) return null;
		const pins = side === 'input' ? prim.inputs(node.config) : prim.outputs(node.config);
		return pins.find((p) => p.id === pinId) ?? null;
	}

	// xyflow types the `isValidConnection` callback's input as `Edge |
	// Connection`, so we accept the loose shape here and pluck the four
	// fields we actually need.
	function connectionTypesMatch(c: {
		source?: string | null;
		target?: string | null;
		sourceHandle?: string | null;
		targetHandle?: string | null;
	}): boolean {
		if (!c.source || !c.target || !c.sourceHandle || !c.targetHandle) return false;
		const graph = activeGraph;
		if (!graph) return false;
		// Reroutes are typeless until something is wired through them; the
		// composer's coerceRerouteTypes helper sets the right pinType when the
		// edge lands. Skip the strict check on either end if it's a reroute (we
		// only relax the source side when the reroute is genuinely free).
		const sourceNode = graph.nodes.find((n) => n.id === c.source);
		const targetNode = graph.nodes.find((n) => n.id === c.target);
		if (targetNode?.typeId === 'reroute') return true;
		if (sourceNode?.typeId === 'reroute') {
			const hasIncoming = graph.edges.some((e) => e.toNodeId === sourceNode.id);
			if (!hasIncoming) return true;
		}
		const a = pinSpecOf(c.source, c.sourceHandle, 'output');
		const b = pinSpecOf(c.target, c.targetHandle, 'input');
		if (!a || !b) return false;
		return canCoerce(a, b);
	}

	function handleConnect(connection: Connection) {
		const layerId = composer.editingTextureLayerId;
		if (!layerId) return;
		const { source, target, sourceHandle, targetHandle } = connection;
		if (!source || !target || !sourceHandle || !targetHandle) return;
		if (!connectionTypesMatch(connection)) return;
		composer.connectGraphEdge(layerId, {
			fromNodeId: source,
			fromPin: sourceHandle,
			toNodeId: target,
			toPin: targetHandle
		});
	}

	// Edge reconnection: grabbing an edge endpoint lets the user re-route the
	// wire to a different pin, or drop it off into empty space to delete it.
	// `reconnectSucceeded` tracks whether `onreconnect` fired during the drag —
	// if not, the user dropped into space and we treat that as a disconnect.
	let reconnectSucceeded = $state(true);

	function handleReconnectStart(_event: unknown, edge: XYEdge) {
		reconnectSucceeded = false;
		reconnectingEdgeId = edge.id;
	}

	function handleReconnect(oldEdge: XYEdge, connection: Connection) {
		const layerId = composer.editingTextureLayerId;
		if (!layerId) return;
		const { source, target, sourceHandle, targetHandle } = connection;
		if (!source || !target || !sourceHandle || !targetHandle) return;
		if (!connectionTypesMatch(connection)) return;
		reconnectSucceeded = true;
		// Remove the old wire first; the connect helper would otherwise replace
		// only the inbound-edge at the new target pin and leave the original
		// edge in place when the user re-aimed the source end.
		if (oldEdge.target && oldEdge.targetHandle) {
			composer.disconnectGraphEdge(layerId, {
				toNodeId: oldEdge.target,
				toPin: oldEdge.targetHandle
			});
		}
		composer.connectGraphEdge(layerId, {
			fromNodeId: source,
			fromPin: sourceHandle,
			toNodeId: target,
			toPin: targetHandle
		});
	}

	function handleReconnectEnd(
		_event: MouseEvent | TouchEvent,
		edge: XYEdge,
		_handleType: 'source' | 'target',
		_state: unknown
	) {
		if (!reconnectSucceeded) {
			const layerId = composer.editingTextureLayerId;
			if (layerId && edge.target && edge.targetHandle) {
				composer.disconnectGraphEdge(layerId, {
					toNodeId: edge.target,
					toPin: edge.targetHandle
				});
			}
		}
		reconnectSucceeded = true;
		reconnectingEdgeId = null;
	}

	function handleDelete({ nodes: dNodes, edges: dEdges }: { nodes: XYNode[]; edges: XYEdge[] }) {
		const layerId = composer.editingTextureLayerId;
		if (!layerId) return;
		for (const e of dEdges) {
			if (!e.target || !e.targetHandle) continue;
			composer.disconnectGraphEdge(layerId, {
				toNodeId: e.target,
				toPin: e.targetHandle
			});
		}
		for (const n of dNodes) {
			if (n.type === 'frame') composer.removeFrame(layerId, n.id);
			else composer.removeGraphNode(layerId, n.id);
		}
	}

	// Blender-style frame containment: when the user grabs a frame, every node
	// (and nested frame) whose center lies inside the frame's bbox at drag
	// start is captured and slides with the frame. Membership is purely spatial
	// — there's no formal parenting relationship, so dropping a node into a
	// frame later or sliding it out doesn't require any explicit action.
	let frameDragState = $state<{
		frameId: string;
		frameStartPos: { x: number; y: number };
		nodeStartPositions: Map<string, { x: number; y: number }>;
		frameStartPositions: Map<string, { x: number; y: number }>;
	} | null>(null);

	// Approximate node footprint for center-in-bbox tests. Real DOM widths vary
	// by primitive, but the user can resize the frame after the fact if a node
	// straddles the boundary.
	const NODE_W_EST = 200;
	const NODE_H_EST = 110;

	function captureFrameContents(frameId: string) {
		const graph = activeGraph;
		if (!graph) return null;
		const frame = graph.frames?.find((f) => f.id === frameId);
		if (!frame) return null;
		const x1 = frame.position.x;
		const y1 = frame.position.y;
		const x2 = x1 + frame.size.width;
		const y2 = y1 + frame.size.height;

		const nodeStartPositions = new Map<string, { x: number; y: number }>();
		for (const node of graph.nodes) {
			const cx = node.position.x + NODE_W_EST / 2;
			const cy = node.position.y + NODE_H_EST / 2;
			if (cx >= x1 && cx <= x2 && cy >= y1 && cy <= y2) {
				nodeStartPositions.set(node.id, { ...node.position });
			}
		}

		// Recursively gather nested frames so dragging an outer frame carries
		// any inner frames *and their members*, even if a member node sits just
		// outside the outer frame's bbox.
		const frameStartPositions = new Map<string, { x: number; y: number }>();
		const visit = (fid: string) => {
			const f = graph.frames?.find((g) => g.id === fid);
			if (!f) return;
			const fx1 = f.position.x;
			const fy1 = f.position.y;
			const fx2 = fx1 + f.size.width;
			const fy2 = fy1 + f.size.height;
			for (const other of graph.frames ?? []) {
				if (other.id === fid) continue;
				if (frameStartPositions.has(other.id)) continue;
				const ocx = other.position.x + other.size.width / 2;
				const ocy = other.position.y + other.size.height / 2;
				if (ocx >= fx1 && ocx <= fx2 && ocy >= fy1 && ocy <= fy2) {
					frameStartPositions.set(other.id, { ...other.position });
					// Pull every node inside the nested frame into the outer
					// drag set as well — they need to move even if the outer
					// frame's bbox doesn't fully contain them.
					const inner = captureFrameContents(other.id);
					if (inner) {
						for (const [nid, pos] of inner.nodeStartPositions) {
							if (!nodeStartPositions.has(nid)) nodeStartPositions.set(nid, pos);
						}
					}
					visit(other.id);
				}
			}
		};
		visit(frameId);

		return {
			frameStartPos: { ...frame.position },
			nodeStartPositions,
			frameStartPositions,
		};
	}

	function handleNodeDragStart({ targetNode, nodes: dragged }: { targetNode: XYNode | null; nodes: XYNode[] }) {
		if (!targetNode || targetNode.type !== 'frame') {
			frameDragState = null;
			return;
		}
		const captured = captureFrameContents(targetNode.id);
		if (!captured) {
			frameDragState = null;
			return;
		}
		// If the user multi-selected the frame plus some of its members, xyflow
		// already drags those members on its own — exclude them from our delta
		// pass so they don't move twice.
		for (const n of dragged) {
			if (n.id === targetNode.id) continue;
			captured.nodeStartPositions.delete(n.id);
			captured.frameStartPositions.delete(n.id);
		}
		frameDragState = {
			frameId: targetNode.id,
			frameStartPos: captured.frameStartPos,
			nodeStartPositions: captured.nodeStartPositions,
			frameStartPositions: captured.frameStartPositions,
		};
	}

	function handleNodeDrag({ targetNode }: { targetNode: XYNode | null }) {
		const state = frameDragState;
		if (!state || !targetNode || targetNode.id !== state.frameId) return;
		const layerId = composer.editingTextureLayerId;
		if (!layerId) return;
		const dx = targetNode.position.x - state.frameStartPos.x;
		const dy = targetNode.position.y - state.frameStartPos.y;
		// Mirror xyflow's live drag position back into composer state. Without
		// this, every child write below triggers a $derived recompute that hands
		// xyflow a stale frame position, snapping the visual frame back to its
		// pre-drag spot while the children march on.
		composer.setFramePosition(layerId, targetNode.id, {
			x: targetNode.position.x,
			y: targetNode.position.y,
		});
		for (const [nodeId, start] of state.nodeStartPositions) {
			composer.setGraphNodePosition(layerId, nodeId, { x: start.x + dx, y: start.y + dy });
		}
		for (const [frameId, start] of state.frameStartPositions) {
			composer.setFramePosition(layerId, frameId, { x: start.x + dx, y: start.y + dy });
		}
	}

	function handleNodeDragStop({ targetNode }: { targetNode: XYNode | null }) {
		const layerId = composer.editingTextureLayerId;
		if (!layerId || !targetNode) {
			frameDragState = null;
			return;
		}
		const pos = { x: targetNode.position.x, y: targetNode.position.y };
		if (targetNode.type === 'frame') {
			composer.setFramePosition(layerId, targetNode.id, pos);
			// Final sync — onnodedrag has been keeping members in lockstep, but
			// take one more pass with the committed end position to dodge any
			// rounding from intermediate frames.
			handleNodeDrag({ targetNode });
		} else {
			composer.setGraphNodePosition(layerId, targetNode.id, pos);
		}
		frameDragState = null;
	}

	// Filled in by GraphShortcuts (which sits inside SvelteFlow context).
	let viewportCenter: (() => { x: number; y: number }) | undefined = $state();

	function handleAddFrame() {
		const layerId = composer.editingTextureLayerId;
		if (!layerId) return;
		const size = { width: 320, height: 220 };
		const c = viewportCenter?.() ?? { x: 200, y: 140 };
		composer.addFrame(layerId, {
			position: { x: c.x - size.width / 2, y: c.y - size.height / 2 },
			size,
		});
	}

	function handleDuplicate(selected: XYNode[]) {
		const layerId = composer.editingTextureLayerId;
		if (!layerId) return;
		for (const n of selected) {
			if (n.type === 'frame') continue;
			composer.duplicateGraphNode(layerId, n.id);
		}
	}

	let primitives = $derived(
		listPrimitives()
			.filter((p) => p.typeId !== 'group-input' && p.typeId !== 'group-output')
			.sort((a, b) => a.name.localeCompare(b.name))
	);
</script>

<svelte:window
	on:keydown={(e) => {
		if (!proceduralField) return;
		if (e.key === 'Escape') {
			if (paletteOpen) paletteOpen = false;
			else handleClose();
		}
	}}
/>

{#if proceduralField && layer}
	<section
		class="w-full h-full bg-neutral-950 flex flex-col"
		aria-label="Node graph editor"
	>
		<header
			class="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-neutral-900 shrink-0"
		>
			<div class="flex items-center gap-3 min-w-0">
				<span
					class="size-4 rounded-[4px] shrink-0"
					style:background-color={proceduralField.meta.color}
					aria-hidden="true"
				></span>
				<div class="flex flex-col min-w-0">
					<p class="text-[14px] font-medium text-white truncate">{layer.name}</p>
					<p class="text-[12px] text-white/50">Node graph</p>
				</div>
			</div>
			<div class="flex items-center gap-1">
				<button
					class="inline-flex items-center gap-1.5 px-2 py-1 text-[12px] text-white/70 hover:text-white rounded-md hover:bg-white/5"
					onclick={handleAddFrame}
					title="Add a frame to group related nodes"
				>
					<Frame class="size-3.5" />
					Frame
				</button>
				<button
					class="inline-flex items-center gap-1.5 px-2 py-1 text-[12px] text-white/70 hover:text-white rounded-md hover:bg-white/5"
					onclick={handleTidy}
					title="Re-arrange nodes into tidy columns"
				>
					<Sparkles class="size-3.5" />
					Tidy
				</button>
				<button
					class="p-1.5 text-white/70 hover:text-white rounded-md hover:bg-white/5"
					onclick={handleClose}
					aria-label="Close node graph editor"
					title="Close (Esc)"
				>
					<X class="size-4" />
				</button>
			</div>
		</header>

		{#if breadcrumb.length > 1}
			<nav
				class="flex items-center gap-1 px-4 py-1.5 border-b border-white/10 bg-neutral-900/60 shrink-0 text-[12px]"
				aria-label="Group navigation"
			>
				{#each breadcrumb as crumb, i (crumb.depth)}
					{#if i > 0}
						<ChevronRight class="size-3 text-white/30" aria-hidden="true" />
					{/if}
					{#if i === breadcrumb.length - 1}
						<span class="text-white/90">{crumb.label}</span>
					{:else}
						<button
							class="text-white/50 hover:text-white rounded px-1 py-0.5 hover:bg-white/5"
							onclick={() => composer.navigateGraphToDepth(crumb.depth)}
						>
							{crumb.label}
						</button>
					{/if}
				{/each}
				<span class="ml-auto text-white/30 text-[11px]">Shift+Tab to exit</span>
			</nav>
		{/if}

		<div class="flex-1 relative min-h-0">
			<SvelteFlow
				{nodes}
				{edges}
				{nodeTypes}
				{edgeTypes}
				nodesDraggable
				nodesConnectable
				elementsSelectable
				onconnect={handleConnect}
				onreconnectstart={handleReconnectStart}
				onreconnect={handleReconnect}
				onreconnectend={handleReconnectEnd}
				ondelete={handleDelete}
				onnodedragstart={handleNodeDragStart}
				onnodedrag={handleNodeDrag}
				onnodedragstop={handleNodeDragStop}
				onnodepointerenter={handleNodePointerEnter}
				onnodepointerleave={handleNodePointerLeave}
				isValidConnection={connectionTypesMatch}
				fitView
				fitViewOptions={{ padding: 0.25 }}
				connectionRadius={32}
				connectionLineStyle="stroke: #818cf8; stroke-width: 2;"
				proOptions={{ hideAttribution: true }}
			>
				<Background patternColor="rgba(255,255,255,0.08)" gap={24} />
				<Controls showLock={false} />
				<MiniMap
					pannable
					zoomable
					maskColor="rgba(0,0,0,0.6)"
					nodeColor={(n) => {
						const data = n.data as { typeId?: string } | undefined;
						if (!data?.typeId) return '#666';
						const prim = getPrimitive(data.typeId);
						const cat = prim?.category;
						if (cat && CATEGORY_COLOR[cat]) return CATEGORY_COLOR[cat];
						return prim?.color ?? '#818cf8';
					}}
				/>
				<GraphShortcuts onDuplicate={handleDuplicate} bind:flowToScreenCenter={viewportCenter} />
			</SvelteFlow>

			<div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
				{#if paletteOpen}
					<GraphPalette
						{primitives}
						onPick={handlePick}
						onClose={() => (paletteOpen = false)}
					/>
				{/if}
				<button
					class="rounded-full inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-white bg-neutral-800/95 border border-white/15 shadow-2xl backdrop-blur-md hover:bg-neutral-700/95 transition"
					onclick={() => (paletteOpen = !paletteOpen)}
					aria-expanded={paletteOpen}
				>
					<Plus class="size-4" />
					Add node
				</button>
			</div>
		</div>
	</section>
{/if}

<style>
	:global(.svelte-flow) {
		background: transparent;
	}
	:global(.svelte-flow__edge-path) {
		stroke: rgba(255, 255, 255, 0.4);
		stroke-width: 1.5;
	}
	:global(.svelte-flow__handle) {
		background: rgba(255, 255, 255, 0.55);
		border: 2px solid var(--surface-base, #0b0b10);
		width: 12px;
		height: 12px;
	}
	/* Extend the hit area without growing the visible dot — clicking slightly
	   off-pin no longer grabs the node body instead. */
	:global(.svelte-flow__handle)::after {
		content: '';
		position: absolute;
		inset: -8px;
		border-radius: 50%;
	}
	/* The reconnect anchors at edge endpoints are EdgeLabel divs — give them a
	   crosshair cursor so users can see they're grabbable, and pull them above
	   the edge path so the hit area lands on top of the bezier. */
	:global(.svelte-flow__edgeupdater) {
		cursor: crosshair;
	}
	:global(.svelte-flow__controls) {
		background: rgb(38, 38, 38);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		overflow: hidden;
	}
	:global(.svelte-flow__controls-button) {
		background: transparent;
		border-color: rgba(255, 255, 255, 0.08);
		color: rgba(255, 255, 255, 0.7);
	}
	:global(.svelte-flow__controls-button:hover) {
		background: rgba(255, 255, 255, 0.05);
		color: white;
	}
	:global(.svelte-flow__controls-button svg) {
		fill: currentColor;
	}
</style>
