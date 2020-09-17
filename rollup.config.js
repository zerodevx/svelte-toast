import svelte from 'rollup-plugin-svelte'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import livereload from 'rollup-plugin-livereload'
import { terser } from 'rollup-plugin-terser'

const production = !process.env.ROLLUP_WATCH

function serve () {
  let server
  function toExit () {
    if (server) server.kill(0)
  }
  return {
    writeBundle () {
      if (server) return
      server = require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
        stdio: ['ignore', 'inherit', 'inherit'],
        shell: true
      })
      process.on('SIGTERM', toExit)
      process.on('exit', toExit)
    }
  }
}

export default {
  input: 'docs/main.js',
  output: {
    sourcemap: true,
    format: 'iife',
    name: 'app',
    file: 'docs/build/bundle.js'
  },
  plugins: [
    svelte({
      dev: !production,
      css: true
    }),
    resolve(),
    commonjs(),
    !production && serve(),
    !production && livereload('docs'),
    production && terser()
  ],
  watch: {
    clearScreen: false
  }
}
