import { createFileRoute } from '@tanstack/react-router'
import { ShaderEditor } from '@/components/shader-composer/shader-editor'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return <ShaderEditor />
}
