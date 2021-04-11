<script>
  import { cart, showAttribute } from "./stores.js";
  import SideItem from "./SideItem.svelte";
  import { formatCurrency } from "./utils.js";

  $: total = $cart.reduce((acc, item) => {
    return acc + item.fields.precio;
  }, 0);

  $: totalFormatted = formatCurrency(total);
</script>

<div class="select-section-title">Mis Atributos</div>

<div>
  {#each $cart as item}
    <div class="select-item clickable">
      <SideItem
        imgUrl={item.fields.Render[0].thumbnails.small.url}
        title={item.fields.opción_nombre}
        cat={item.fields.atributo_nombre}
        price={item.fields.precio}
        on:click={() => {
          showAttribute(item.fields.atributo_nombre);
        }}
      />
    </div>
  {/each}
</div>

<div class="cart-sum">
  <div class="cart-total">Total</div>
  <div class="cart-sum-num">{totalFormatted}</div>
</div>
