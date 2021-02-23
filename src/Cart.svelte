<script>
  import { cart } from "./stores.js";
  import SideItem from "./SideItem.svelte";

  $: console.log($cart);

  $: total = Object.keys($cart).reduce((acc, item) => {
    return acc + $cart[item].fields.precio;
  }, 0);
</script>

<div class="select-section-title">Mis Atributos</div>

<div>
  {#each Object.keys($cart) as item}
    <SideItem
      imgUrl={$cart[item].fields.Render[0].thumbnails.small.url}
      title={$cart[item].fields.opción_nombre}
      cat={$cart[item].fields.atributo_nombre}
      price={$cart[item].fields.precio}
    />
  {/each}
</div>

<div class="cart-sum">
  <div class="cart-total">Total</div>
  <div class="cart-sum-num">{total}</div>
  <div class="listo-btn">Listo →</div>
</div>
