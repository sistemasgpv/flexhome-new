<script>
  import { cart } from "./stores.js";
  import { createEventDispatcher } from "svelte";
  import SideItem from "./SideItem.svelte";
  const dispatch = createEventDispatcher();
  import { formatCurrency } from "./utils.js";

  $: total = Object.keys($cart).reduce((acc, item) => {
    return acc + $cart[item].fields.precio;
  }, 0);

  $: totalFormatted = formatCurrency(total);
</script>

<div class="select-section-title">Mis Atributos</div>

<div>
  {#each Object.keys($cart) as item}
    <SideItem
      imgUrl={$cart[item].fields.Render[0].thumbnails.small.url}
      title={$cart[item].fields.opción_nombre}
      cat={$cart[item].fields.atributo_nombre}
      price={$cart[item].fields.precio}
      removable={true}
      on:remove={() => {
        cart.update((c) => {
          delete c[item];
          return c;
        });
      }}
    />
  {/each}
</div>

<div class="cart-sum">
  <div class="cart-total">Total</div>
  <div class="cart-sum-num">{totalFormatted}</div>
  <div
    class="listo-btn"
    on:click={() => {
      dispatch("showListo");
    }}
  >
    Listo →
  </div>
</div>
