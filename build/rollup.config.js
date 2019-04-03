import babel from 'rollup-plugin-babel'
import graphql from 'rollup-plugin-graphql'

export default {
  input: 'plugin.js',
  output: {
    file: 'dist/bundle.js',
    format: 'umd',
    name: 'esocksCart',
  },
  plugins: [
    babel({
      exclude: 'node_modules/**',
    }),
    graphql(),
  ]
}
