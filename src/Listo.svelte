<script>
  import { cart } from "./stores.js";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  $: total = Object.keys($cart).reduce((acc, item) => {
    return acc + $cart[item].fields.precio;
  }, 0);
</script>

<div class="listo-bg">
  <div class="listo-title">COSTO ESTIMADO DE ATRIBUTOS</div>
  <div class="listo-total">{total}</div>
  <div class="listo-items">
    {#each Object.keys($cart) as item, idx}
      <div class="listo-item">
        <div class="listo-item-atributo">
          {`${idx}.${item}:`}
        </div>
        <div class="listo-item-nombre">
          {`${$cart[item].fields.opción_nombre}`}
        </div>
        <div class="listo-item-precio">
          ${`${$cart[item].fields.precio}`}
        </div>
      </div>
    {/each}
  </div>
  <div
    class="listo-close-btn"
    on:click={() => {
      dispatch("closeListo");
    }}
  >
    ← Back
  </div>
</div>

<style>
</style>
