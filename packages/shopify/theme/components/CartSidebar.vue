<template>
  <div id="cart">
    <SfSidebar
      :visible="isCartSidebarOpen"
      :button="false"
      title="My Cart"
      @close="toggleCartSidebar"
      class="sidebar sf-sidebar--right"
    >
      <template #title>
        <div class="heading__wrapper">
          <SfHeading :level="3" title="My cart" class="sf-heading--left"/>
          <button data-cy="cart-sidebar-button_toggle-cart" class="heading__close-button" aria-label="Cart sidebar close button" @click="toggleCartSidebar">
            <SfIcon icon="cross" size="14px" color="gray-primary"/>
          </button>
        </div>
      </template>
      <transition name="fade" mode="out-in">
        <div v-if="totalItems" class="my-cart" key="my-cart">
          <div class="my-cart__total-items">Total items: <strong>{{ totalItems }}</strong></div>
          <div class="collected-product-list">
            <SfCollectedProduct
              data-cy="collected-product-cart-sidebar"
              v-for="product in products"
              :key="cartGetters.getItemSku(product)"
              :image="cartGetters.getItemImage(product)"
              :title="cartGetters.getItemName(product)"
              :regular-price="cartGetters.getFormattedPrice(cartGetters.getItemPrice(product).regular)"
              :special-price="cartGetters.getFormattedPrice(cartGetters.getItemPrice(product).special)"
              :stock="99999"
              image-width="180"
              image-height="200"
              :qty="cartGetters.getItemQty(product)"
              @input="updateQuantity(product, $event)"
              @click:remove="removeFromCart(product)"
              class="collected-product"
            >
              <template #configuration>
                <div class="collected-product__properties">
                  <SfProperty v-for="(attributeVal, attributeName) in cartGetters.getItemAttributes(product)" :key="attributeVal" :name="attributeName" :value="attributeVal"/>

                </div>
              </template>
              <!-- <template #actions>
                <SfButton data-cy="cart-sidebar-btn_save-later" class="sf-button--text desktop-only">Save for later</SfButton>
              </template> -->
            </SfCollectedProduct>
          </div>
          <div class="sidebar-bottom">
          <SfProperty class="sf-property--full-width my-cart__total-price">
            <template #name>
              <span class="my-cart__total-price-label">Total price:</span>
            </template>
            <template #value>
              <SfPrice :regular="cartGetters.getFormattedPrice(totals.subtotal)" />
            </template>
          </SfProperty>
          <!-- <nuxt-link :to="`/checkout/${isAuthenticated ? 'shipping' : 'personal-details'}`">
            <SfButton data-cy="cart-sidebar-btn_checkout" @click="toggleCartSidebar" class="sf-button--full-width color-secondary">Go to checkout</SfButton>
          </nuxt-link> -->
          <a :href="checkoutUrl">
            <SfButton data-cy="cart-sidebar-btn_checkout" @click="toggleCartSidebar" class="sf-button--full-width color-secondary">Go to checkout</SfButton>
          </a>
          </div>
        </div>
        <div v-else class="empty-cart" key="empty-cart">
          <div class="empty-cart__banner">
            <img src="@storefront-ui/shared/icons/empty_cart.svg" alt class="empty-cart__icon" />
            <h3 class="empty-cart__label">Your bag is empty</h3>
            <p class="empty-cart__description">
              Looks like you haven’t added any items to the bag yet. Start
              shopping to fill it in.
            </p>
          </div>
          <SfButton data-cy="cart-sidebar-btn_start-shopping" class="sf-button--full-width color-secondary">Start shopping</SfButton>
        </div>
      </transition>
    </SfSidebar>
  </div>
</template>
<script>
import {
  SfSidebar,
  SfHeading,
  SfButton,
  SfIcon,
  SfProperty,
  SfPrice,
  SfCollectedProduct
} from '@storefront-ui/vue';
import { computed } from '@vue/composition-api';
import { useCart, useUser, cartGetters } from '@vue-storefront/shopify';
import { onSSR } from '@vue-storefront/core';
import uiState from '~/assets/ui-state';

const { isCartSidebarOpen, toggleCartSidebar } = uiState;

export default {
  name: 'Cart',
  components: {
    SfSidebar,
    SfButton,
    SfHeading,
    SfIcon,
    SfProperty,
    SfPrice,
    SfCollectedProduct
  },
  setup() {
    const { cart, removeFromCart, updateQuantity, loadCart } = useCart();
    const { isAuthenticated } = useUser();
    const products = computed(() => cartGetters.getItems(cart.value));
    const totals = computed(() => cartGetters.getTotals(cart.value));
    const totalItems = computed(() => cartGetters.getTotalItems(cart.value));
    const checkoutUrl = computed(() => cartGetters.getCheckoutUrl(cart.value));

    onSSR(async () => {
      await loadCart();
    });

    return {
      isAuthenticated,
      products,
      removeFromCart,
      updateQuantity,
      isCartSidebarOpen,
      toggleCartSidebar,
      totals,
      totalItems,
      cartGetters,
      checkoutUrl
    };
  }
};
</script>

<style lang="scss" scoped>
@import "~@storefront-ui/vue/styles";

.sidebar {
  --sidebar-top-padding: var(--spacer-lg) var(--spacer-base) 0 var(--spacer-base);
  --sidebar-content-padding: var(--spacer-lg) var(--spacer-base);
}

.my-cart {
  flex: 1;
  display: flex;
  flex-direction: column;
  &__total-items {
    font: var(--font-normal) var(--font-xl) / 1.6 var(--font-family-secondary);
    color: var(--c-dark-variant);
    margin: 0;
  }
  &__total-price {
    --property-name-font-size: var(--font-xl);
    --price-font-size: var(--font-xl);
    margin: 0 0 var(--spacer-xl) 0;

    &-label {
      font: var(--font-normal) var(--font-xl) / 1.6 var(--font-family-secondary);
      color: var(--c-dark-variant);
    }
  }
}
.empty-cart {
  display: flex;
  flex: 1;
  flex-direction: column;
  &__banner {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }
  &__label,
  &__description {
    text-align: center;
  }
  &__label {
    margin: var(--spacer-2xl) 0 0 0;
    font: var(--font-normal) var(--font-lg) / 1.6 var(--font-family-secondary);
  }
  &__description {
    margin: var(--spacer-xl) 0 0 0;
    font: var(--font-light) var(--font-base) / 1.6 var(--font-family-primary);
  }
  &__icon {
    width: 18.125rem;
    height: 12.3125rem;
    margin-left: 60%;
    @include for-desktop {
      margin-left: 50%;
    }
  }
}
.heading {
  &__wrapper {
    --heading-title-color: var(--c-dark-variant);
    --heading-title-font-weight: var(--font-normal);
    display: flex;
    justify-content: space-between;
  }
  &__close-button {
    background: none;
    border: none;
  }
}

.sidebar-bottom {
  margin: auto 0 0 0;
}

.collected-product {
  margin: var(--spacer-base) 0;

  &__properties {
    margin: var(--spacer-sm) 0 0 0;
  }

}
</style>
