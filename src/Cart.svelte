<script>
  import { cart } from "./stores.js";
  import { createEventDispatcher } from "svelte";
  import SideItem from "./SideItem.svelte";
  const dispatch = createEventDispatcher();
  import { formatCurrency } from "./utils.js";

  $: total = $cart.reduce((acc, item) => {
    return acc + item.fields.precio;
  }, 0);

  $: totalFormatted = formatCurrency(total);
</script>

<div class="select-section-title">Mis Atributos</div>

<div>
  {#each $cart as item}
    <SideItem
      imgUrl={item.fields.Render[0].thumbnails.small.url}
      title={item.fields.opción_nombre}
      cat={item.fields.atributo_nombre}
      price={item.fields.precio}
    />
  {/each}
</div>

<div class="cart-sum">
  <div class="cart-total">Total</div>
  <div class="cart-sum-num">{totalFormatted}</div>
</div>
