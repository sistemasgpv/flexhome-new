<script>
  import { cart } from "./stores.js";
  import SideItem from "./SideItem.svelte";

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
  });

  $: console.log($cart);

  $: total = Object.keys($cart).reduce((acc, item) => {
    return acc + $cart[item].fields.precio;
  }, 0);

  $: totalFormatted = formatter.format(total);
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
  <div class="cart-sum-num">{totalFormatted}</div>
  <div class="listo-btn">Listo →</div>
</div>
