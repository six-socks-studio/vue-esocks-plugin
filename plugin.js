/* eslint-disable */
import cartStore from './cart/store'
import { DollarEsocksCart } from './cart/dollar_esocks_cart'

const install = (Vue) => {
  if (install.installed) return
  install.installed = true

  // Lazy creation (configurable is needed because of Nuxt SSR)
  Object.defineProperty(Vue.prototype, '$esocksCart', {
    get () {
      if (!this.$_esocksCart) {
        this.$_esocksCart = new DollarEsocksCart(this)
      }
      return this.$_esocksCart
    },
    configurable: true,
  })
}

const plugin = class EsocksPlugin {
  constructor({store}) {
    this.store = store
    store.registerModule('checkout', cartStore)
  }
}

plugin.install = install

export default plugin
