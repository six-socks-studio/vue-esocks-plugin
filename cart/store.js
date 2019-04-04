
import retrieveCart from './queries/retrieveCart.gql'
import addProductToCart from './queries/addProductToCart.gql'
import removeProductFromCart from './queries/removeProductFromCart.gql'
import CartUpdate from './queries/subscribeCartUpdate.gql'

let cartSubscriptionObserver;

export const state = () => ({
  id: null,
  status: '',
  lineItems: [],
  totalPrice: 0,
  shippingPrice: 0
})

export const mutations = {
  updateCheckout(state, payload) {
    Object.assign(state, payload)
  },
  addCheckoutID(state, payload) {
    state.id = payload
  },
}

export const actions = {
  async addProductToCart({ commit, state, dispatch }, payload) {
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
    this.app.$cookies.set('shopCheckoutID', order.id, {expires: expiryDate})
    commit('addCheckoutID', order.id)
  },

  async removeProductFromCart({ commit, state }, payload) {
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

  subscribeToCart({commit}, payload){
    if (!cartSubscriptionObserver) {
      let variables = { id: payload }
      const cartSubscriptionObservable = this.app.apolloProvider.defaultClient.subscribe({
        query: CartUpdate,
        variables
      });

      cartSubscriptionObserver = cartSubscriptionObservable.subscribe({
        next(reply){
          const order = reply.data.updateOrder
          commit('updateCheckout', order)
        },
        error(error){
          console.log(error);
        }
      });
    }
  },

  unsubscribeFromCart(){
    if (cartSubscriptionObserver) {
      cartSubscriptionObserver.unsubscribe();
      cartSubscriptionObserver = null;
    }
  },

  async init({ commit, dispatch }, cartId) {
    const serverCheckout = await this.app.apolloProvider.defaultClient.query({
      query: retrieveCart,
      variables: {id: cartId}
    })
    const order = serverCheckout.data.order
    commit('updateCheckout', order)

    dispatch('subscribeToCart', order.id)
  },

  async serverInit({commit, dispatch}, {app}) {
    const shopCheckoutID = app.$cookies.get("shopCheckoutID")
    if (shopCheckoutID) {
      const serverCheckout = await app.apolloProvider.defaultClient.query({
        query: retrieveCart,
        variables: {id: shopCheckoutID}
      })
      const order = serverCheckout.data.order
      commit('updateCheckout', order)

      dispatch('subscribeToCart', order.id)
    }
  }
}

export default {
  namespaced: true,

  state,
  mutations,
  actions
}
