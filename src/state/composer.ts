'use client'

// Editor state for the shader composer.
//
// Holds a `ShaderChain` of `Node` instances plus the currently-selected node
// id. Every mutation produces a new `ShaderChain` reference so React re-renders
// observe the change.

import { useMemo } from 'react'
import { create } from 'zustand'
import { ShaderChain } from '@/shaders/core/chain'
import { type Node } from '@/shaders/core/node'
import { getNodeClass } from '@/shaders/core/registry'
import type { BlendMode, SerializedChain } from '@/shaders/core/types'

interface ComposerState {
  chain: ShaderChain
  selectedNodeId: string | null
}

interface ComposerStore extends ComposerState {
  addNode: (typeId: string) => void
  removeNode: (id: string) => void
  reorderNodes: (orderedIds: string[]) => void
  selectNode: (id: string | null) => void
  /** Update a single field on a node's config. */
  updateConfig: (nodeId: string, key: string, value: unknown) => void
  /** Update a single field on a node's inputs (image inputs etc.). */
  updateInput: (nodeId: string, key: string, value: unknown) => void
  toggleNode: (id: string) => void
  updateBlendMode: (id: string, blendMode: BlendMode) => void
  updateOpacity: (id: string, opacity: number) => void
  /** Replace the entire chain (e.g. when loading a preset). */
  loadChain: (chain: ShaderChain) => void
  /** Hydrate from JSON. */
  loadJson: (json: SerializedChain) => void
}

// Force a new chain reference so subscribers re-render.
function snapshot(chain: ShaderChain): ShaderChain {
  const next = new ShaderChain([...chain.nodes])
  return next
}

export const useComposerStore = create<ComposerStore>((set) => ({
  chain: new ShaderChain(),
  selectedNodeId: null,

  addNode: (typeId) =>
    set((state) => {
      const cls = getNodeClass(typeId)
      if (!cls) return state
      const node = new cls()
      const next = new ShaderChain([...state.chain.nodes, node])
      return { chain: next, selectedNodeId: node.id }
    }),

  removeNode: (id) =>
    set((state) => {
      const next = new ShaderChain(state.chain.nodes.filter((n) => n.id !== id))
      return {
        chain: next,
        selectedNodeId:
          state.selectedNodeId === id
            ? next.nodes[next.nodes.length - 1]?.id ?? null
            : state.selectedNodeId,
      }
    }),

  reorderNodes: (orderedIds) =>
    set((state) => {
      const byId = new Map(state.chain.nodes.map((n) => [n.id, n]))
      const reordered = orderedIds
        .map((id) => byId.get(id))
        .filter((n): n is Node => Boolean(n))
      return { chain: new ShaderChain(reordered) }
    }),

  selectNode: (id) => set({ selectedNodeId: id }),

  updateConfig: (nodeId, key, value) =>
    set((state) => {
      const node = state.chain.nodes.find((n) => n.id === nodeId)
      if (!node) return state
      ;(node.config as Record<string, unknown>)[key] = value
      return { chain: snapshot(state.chain) }
    }),

  updateInput: (nodeId, key, value) =>
    set((state) => {
      const node = state.chain.nodes.find((n) => n.id === nodeId)
      if (!node) return state
      ;(node.inputs as Record<string, unknown>)[key] = value
      return { chain: snapshot(state.chain) }
    }),

  toggleNode: (id) =>
    set((state) => {
      const node = state.chain.nodes.find((n) => n.id === id)
      if (node) node.enabled = !node.enabled
      return { chain: snapshot(state.chain) }
    }),

  updateBlendMode: (id, blendMode) =>
    set((state) => {
      const node = state.chain.nodes.find((n) => n.id === id)
      if (node) node.blendMode = blendMode
      return { chain: snapshot(state.chain) }
    }),

  updateOpacity: (id, opacity) =>
    set((state) => {
      const node = state.chain.nodes.find((n) => n.id === id)
      if (node) node.opacity = opacity
      return { chain: snapshot(state.chain) }
    }),

  loadChain: (chain) => set({ chain, selectedNodeId: chain.nodes[0]?.id ?? null }),

  loadJson: (json) =>
    set(() => {
      const c = ShaderChain.fromJSON(json)
      return { chain: c, selectedNodeId: c.nodes[0]?.id ?? null }
    }),
}))

interface ComposerHookValue extends ComposerState {
  addNode: ComposerStore['addNode']
  removeNode: ComposerStore['removeNode']
  reorderNodes: ComposerStore['reorderNodes']
  selectNode: ComposerStore['selectNode']
  updateConfig: ComposerStore['updateConfig']
  updateInput: ComposerStore['updateInput']
  toggleNode: ComposerStore['toggleNode']
  updateBlendMode: ComposerStore['updateBlendMode']
  updateOpacity: ComposerStore['updateOpacity']
  loadChain: ComposerStore['loadChain']
  loadJson: ComposerStore['loadJson']
  getSelectedNode: () => Node | null
}

export function useComposer(): ComposerHookValue {
  const chain = useComposerStore((s) => s.chain)
  const selectedNodeId = useComposerStore((s) => s.selectedNodeId)
  const addNode = useComposerStore((s) => s.addNode)
  const removeNode = useComposerStore((s) => s.removeNode)
  const reorderNodes = useComposerStore((s) => s.reorderNodes)
  const selectNode = useComposerStore((s) => s.selectNode)
  const updateConfig = useComposerStore((s) => s.updateConfig)
  const updateInput = useComposerStore((s) => s.updateInput)
  const toggleNode = useComposerStore((s) => s.toggleNode)
  const updateBlendMode = useComposerStore((s) => s.updateBlendMode)
  const updateOpacity = useComposerStore((s) => s.updateOpacity)
  const loadChain = useComposerStore((s) => s.loadChain)
  const loadJson = useComposerStore((s) => s.loadJson)

  return useMemo(
    () => ({
      chain,
      selectedNodeId,
      addNode,
      removeNode,
      reorderNodes,
      selectNode,
      updateConfig,
      updateInput,
      toggleNode,
      updateBlendMode,
      updateOpacity,
      loadChain,
      loadJson,
      getSelectedNode: () =>
        chain.nodes.find((n) => n.id === selectedNodeId) ?? null,
    }),
    [
      chain,
      selectedNodeId,
      addNode,
      removeNode,
      reorderNodes,
      selectNode,
      updateConfig,
      updateInput,
      toggleNode,
      updateBlendMode,
      updateOpacity,
      loadChain,
      loadJson,
    ],
  )
}
