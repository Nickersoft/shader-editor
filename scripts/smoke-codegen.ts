// Phase 2 smoke test. Exercises the chain → codegen path with a simple
// GeneratorNode (Circle) followed by an EffectNode (Glow). Validates pass
// splitting, fragment emission, uniform collection, and serialization
// round-trip.
//
// Run with: bun scripts/smoke-codegen.ts

import '@/shaders'

import { chain, ShaderChain } from '@/shaders/core/chain'
import Circle from '@/shaders/shapes/circle'
import Glow from '@/shaders/stylize/glow'
import { generate } from '@/lib/codegen'

function section(title: string) {
  console.log(`\n=== ${title} ===`)
}

const c = new Circle()
console.log('Circle config:', c.config)
console.log('Circle inputs:', c.inputs)
console.log('Circle blendMode:', c.blendMode, 'opacity:', c.opacity)

const g = new Glow()
console.log('\nGlow config keys:', Object.keys(g.config))
console.log('Glow inputs:', g.inputs)

const myChain = chain().pipe(c).pipe(g)
console.log('\nChain length:', myChain.nodes.length)
console.log('Enabled:', myChain.enabled.map((n) => n.typeId))

section('Pass split')
const result = generate(myChain, 'SmokeShader')
console.log('Pass count:', result.passes.length)
result.passes.forEach((p, i) => {
  console.log(`  Pass ${i}: mode=${p.mode ?? 'normal'} readsPrev=${p.readsPrevPass} nodes=[${p.nodeIds.join(', ')}]`)
})

section('Uniforms')
result.uniforms.forEach((u) =>
  console.log(`  ${u.name}  ${u.type}${u.arrayLength ? `[${u.arrayLength}]` : ''}  (${u.layerName}.${u.originalName})`),
)
console.log(`  ${result.uniforms.length} total`)

section('Vertex shader')
console.log(result.vertexShader.split('\n').slice(0, 8).join('\n'))

section('Pass 0 fragment (first 30 lines)')
console.log(result.passes[0].fragmentShader.split('\n').slice(0, 30).join('\n'))

section('Pass 1 fragment (first 18 lines)')
console.log(result.passes[1].fragmentShader.split('\n').slice(0, 18).join('\n'))

section('Pass 2 fragment first 18 + last 10 lines')
const p2 = result.passes[2]?.fragmentShader.split('\n') ?? []
console.log(p2.slice(0, 18).join('\n'))
console.log('  ...')
console.log(p2.slice(-10).join('\n'))

section('Serialization round-trip')
const json = myChain.toJSON()
console.log('Serialized:', JSON.stringify(json, null, 2).slice(0, 500), '...')
const restored = ShaderChain.fromJSON(json)
console.log('Restored chain length:', restored.nodes.length)
console.log('Restored types:', restored.nodes.map((n) => n.typeId))
console.log('Configs equal?', JSON.stringify(restored.nodes[0].config) === JSON.stringify(myChain.nodes[0].config))
