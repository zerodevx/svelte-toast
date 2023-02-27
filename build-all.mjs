#!/usr/bin/env zx

await $`npm run lint`
await $`npm run check`
await $`npm run build`
await $`npx svelte-package`
const out = await $`npx vite build -c vite.dist.config.js`

// Calculate stats
const sizes = out.stdout
  .split('\n')
  .find((i) => i.includes('index.umd.cjs'))
  .split(' ')
  .filter((i) => !isNaN(parseFloat(i)))
const cloc = JSON.parse(await $`npx cloc src/lib --json`).SUM.code.toString()

// Write stats into `/build`
const shields = { schemaVersion: 1, color: 'blue' }
await fs.writeJson('build/_min.json', { ...shields, label: 'minified', message: `${sizes[0]} kB` })
await fs.writeJson('build/_gzip.json', { ...shields, label: 'gzipped', message: `${sizes[1]} kB` })
await fs.writeJson('build/_loc.json', { ...shields, label: 'lines of code', message: cloc })

// Prepare `/dist`
const pkg = await fs.readJson('package.json')
pkg.scripts = undefined
await fs.writeJson('dist/package.json', pkg, { spaces: 2 })
await fs.copy('README.md', 'dist/README.md')
await fs.copy('LICENSE', 'dist/LICENSE')
await $`cd dist && npx publint`

echo`
To deploy the demo, run:
$ npx gh-pages -d build -t -f

To publish into npm, run:
$ cd dist && npm publish --access public
`
