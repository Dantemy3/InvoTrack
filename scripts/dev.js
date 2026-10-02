import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const serverRoot = fileURLToPath(new URL('../server/', import.meta.url))
const viteEntry = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))

// Usar Node directamente permite iniciar ambos procesos también en Windows.
const processes = [
  spawn(process.execPath, ['--watch', 'src/index.js'], { cwd: serverRoot, stdio: 'inherit' }),
  spawn(process.execPath, [viteEntry, ...process.argv.slice(2)], { cwd: root, stdio: 'inherit' }),
]

let stopping = false
function stop(code = 0) {
  if (stopping) return
  stopping = true
  for (const child of processes) child.kill()
  process.exitCode = code
}

for (const child of processes) {
  child.on('error', (error) => {
    console.error(error.message)
    stop(1)
  })
  child.on('exit', (code) => stop(code ?? 1))
}
process.on('SIGINT', () => stop())
process.on('SIGTERM', () => stop())
