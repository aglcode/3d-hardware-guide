// Loads every lesson and checks its circuit: real holes and pins, no shorts,
// no shared sockets, no floating legs, every declared connection present.
import { createServer } from 'vite'

const server = await createServer({
  configFile: false,
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
})

let failed = false
try {
  const { ALL_LESSONS } = await server.ssrLoadModule('/src/data/lessons.ts')
  const { checkBench } = await server.ssrLoadModule('/src/lib/nets.ts')
  const { resolvePoint } = await server.ssrLoadModule('/src/lib/geometry.ts')

  const ids = ALL_LESSONS.map((lesson) => lesson.id)
  if (new Set(ids).size !== ids.length) {
    console.error('Two lessons share an id')
    failed = true
  }

  for (const lesson of ALL_LESSONS) {
    const problems = checkBench(lesson.id, lesson.bench)
    const refs = [
      ...lesson.callouts.map((c) => c.at),
      ...lesson.wiring.flatMap((w) => (w.at ? [w.at] : [])),
    ]
    for (const ref of refs) {
      try {
        resolvePoint(lesson.bench, ref)
      } catch (error) {
        problems.push(`${lesson.id}: ${error.message}`)
      }
    }
    const slots = lesson.callouts.map((c) => c.slot)
    if (new Set(slots).size !== slots.length) problems.push(`${lesson.id}: two callouts share a slot`)

    // Run the simulation for a while, so a wrong code line reference fails here and not on screen.
    const ctx = { t: 0, input: () => 0, print: () => {}, mem: {} }
    for (let i = 0; i < 400; i++) {
      ctx.t = i / 20
      try {
        lesson.tick(ctx)
      } catch (error) {
        problems.push(`${lesson.id}: ${error.message}`)
        break
      }
    }

    for (const problem of problems) console.error(problem)
    if (problems.length) failed = true
    else console.log(`ok  ${lesson.id}`)
  }
} finally {
  await server.close()
}

process.exit(failed ? 1 : 0)
