#!/usr/bin/env zx
/* global $, fs, argv, echo, chalk */

await $`npm run lint && npx svelte-package`
const packed = await $`npx vite build -c vite.dist.config.js`

// Prepare `/dist`
const pkg = await fs.readJson('package.json')
pkg.scripts = undefined
await fs.writeJson('dist/package.json', pkg, { spaces: 2 })
await fs.copy('README.md', 'dist/README.md')
await fs.copy('LICENSE', 'dist/LICENSE')
await fs.copy('dist/dist/index.umd.js', 'dist/dist/index.umd.cjs')
await $`cd dist && npx publint`

if (argv.packageOnly) process.exit()

await $`npx vite build`

// Calculate stats
const sizes = packed
  .toString()
  .split('\n')
  .find((i) => i.includes('index.umd.js'))
  .split(' ')
  .filter((i) => !isNaN(parseFloat(i)))
const cloc = JSON.parse(await $`npx --yes cloc src/lib --json`).SUM.code.toString()

// Write stats into `/build`
const shields = (label, message, color = 'blue') => ({
  schemaVersion: 1,
  label,
  message,
  color
})
await fs.writeJson('build/_min.json', shields('minified', `${sizes[0]} kB`))
await fs.writeJson('build/_gzip.json', shields('gzipped', `${sizes[1]} kB`))
await fs.writeJson('build/_loc.json', shields('lines of code', cloc, 'green'))

echo`
Build complete! [${chalk.green(cloc)}/${chalk.gray(sizes[0])}/${chalk.blue(sizes[1])}]

To deploy the demo, run:
$ npx gh-pages -d build -t -f

To publish into npm, run:
$ cd dist && npm publish --access public
`
