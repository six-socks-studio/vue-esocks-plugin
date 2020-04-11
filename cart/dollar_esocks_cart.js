export class DollarEsocksCart {
  constructor (vm) {
    this.vm = vm
    this.store.dispatch('checkout/init')
  }

  get store () {
    return this.vm.$store
  }

  addProductToCart (payload) {
    this.store.dispatch('checkout/addProductToCart', payload)
  }

  removeProductFromCart (payload) {
    this.store.dispatch('checkout/removeProductFromCart', payload)
  }

  emptyCart (payload) {
    this.store.dispatch('checkout/emptyCart', payload)
  }

  updateShippingAddress (payload) {
    this.store.dispatch('checkout/updateShippingAddress', payload)
  }

  registerBillingAddress (payload) {
    this.store.dispatch('checkout/registerBillingAddress', payload)
  }

  verifyCoupon (payload) {
    this.store.dispatch('checkout/registerBillingAddress', payload)
  }

  state () {
    return this.store.state.checkout
  }
}
