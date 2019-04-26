
import retrieveCart from './queries/retrieveCart.gql'
import addProductToCart from './queries/addProductToCart.gql'
import removeProductFromCart from './queries/removeProductFromCart.gql'
import CartUpdate from './queries/subscribeCartUpdate.gql'
import addCartToCustomer from './queries/addCartToCustomer.gql'
import registerAddress from './queries/registerAddress.gql'

let cartSubscriptionObserver

export const state = () => ({
  id: null,
  status: '',
  lineItems: [],
  totalPrice: 0,
  shippingPrice: 0,
  email: '',
  shippingAddress: {},
  billingAddress: {}
})

export const mutations = {
  updateCheckout (state, payload) {
    Object.assign(state, payload)
  },

  addCheckoutID (state, payload) {
    state.id = payload
  },

  setShipping (st, { address }) {
    st.shippingAddress = address
  },

  setBilling (st, { email, address }) {
    st.email = email
    st.billingAddress = address
    st.shippingAddress = address
  },

  emptyCart (st) {
    st.lineItems = []
    st.totalPrice = 0
    st.shippingPrice = 0
  }
}

export const actions = {
  async updateShippingAddress ({ commit, state }, address) {
    await this.app.apolloProvider.defaultClient.mutate({
      mutation: registerAddress,
      variables: {
        addressType: 'SHIPPING',
        email: state.email,
        address
      }
    })

    commit('setShipping', { address })
  },

  async registerBillingAddress ({ commit, rootState }, { email, address }) {
    await this.app.apolloProvider.defaultClient.mutate({
      mutation: registerAddress,
      variables: {
        addressType: 'BILLING_AND_SHIPPING',
        email,
        address
      }
    })

    await this.app.apolloProvider.defaultClient.mutate({
      mutation: addCartToCustomer,
      variables: {
        email,
        id: rootState.checkout.id
      }
    })

    commit('setBilling', { email, address })
  },

  async addProductToCart ({ commit, state, dispatch }, payload) {
    let variables = { lineItem: payload }
    const cartId = state.id
    if (cartId) variables.id = cartId

    const reply = await this.app.apolloProvider.defaultClient.mutate({
      mutation: addProductToCart,
      variables
    })

    const order = reply.data.addItemToCart
    commit('updateCheckout', order)

    dispatch('subscribeToCart', order.id)

    // Put arbitrary 5 years of expiry dates.
    // Not setting expiry date does not keep cookie across browser closing
    const expiryDate = new Date(new Date().setFullYear(new Date().getFullYear() + 5))

    if (!this.app.$cookies.get('shopCheckoutID')) {
      this.app.$cookies.set('shopCheckoutID', order.id, { expires: expiryDate })
    }

    commit('addCheckoutID', order.id)
  },

  async removeProductFromCart ({ commit, state }, payload) {
    // Remove item from cart implies we have a cart
    let variables = { lineItem: payload }
    variables.id = state.id

    const reply = await this.app.apolloProvider.defaultClient.mutate({
      mutation: removeProductFromCart,
      variables
    })

    const order = reply.data.removeItemFromCart
    commit('updateCheckout', order)
  },

  subscribeToCart ({ commit }, payload) {
    if (!cartSubscriptionObserver) {
      let variables = { id: payload }
      const cartSubscriptionObservable = this.app.apolloProvider.defaultClient.subscribe({
        query: CartUpdate,
        variables
      })

      cartSubscriptionObserver = cartSubscriptionObservable.subscribe({
        next (reply) {
          const order = reply.data.updateOrder
          commit('updateCheckout', order)
        },
        error (error) {
          console.log(error)
        }
      })
    }
  },

  unsubscribeFromCart () {
    if (cartSubscriptionObserver) {
      cartSubscriptionObserver.unsubscribe()
      cartSubscriptionObserver = null
    }
  },

  async init ({ commit, dispatch }) {
    const cartId = this.app.$cookies.get('shopCheckoutID')

    if (!cartId) return

    const serverCheckout = await this.app.apolloProvider.defaultClient.query({
      query: retrieveCart,
      variables: { id: cartId }
    })

    const order = serverCheckout.data.order

    commit('updateCheckout', order)
    dispatch('subscribeToCart', order.id)
  }
}

export default {
  namespaced: true,

  state,
  mutations,
  actions
}
