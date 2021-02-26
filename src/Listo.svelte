<script>
  import { cart, showAttribute } from "./stores.js";
  import { createEventDispatcher } from "svelte";
  import { formatCurrency } from "./utils.js";
  import { fade } from "svelte/transition";

  const dispatch = createEventDispatcher();

  $: total = Object.keys($cart).reduce((acc, item) => {
    return acc + $cart[item].fields.precio;
  }, 0);
</script>

<div
  class="listo"
  on:click={() => {
    dispatch("closeListo");
  }}
  transition:fade={{ duration: 150 }}
>
  <div class="listo-bg" on:click|stopPropagation>
    <div class="listo-title">COSTO ESTIMADO DE ATRIBUTOS</div>
    <div class="listo-total">{formatCurrency(total)}</div>
    {#if Object.keys($cart).length > 0}
      <div class="listo-items">
        {#each Object.keys($cart) as item, idx}
          <div
            class="listo-item"
            on:click={() => {
              showAttribute(item);
              dispatch("closeListo");
            }}
          >
            <div class="listo-item-atributo">
              {`${idx}.${item}:`}
            </div>
            <div class="listo-item-nombre">
              {`${$cart[item].fields.opción_nombre}`}
            </div>
            <div class="listo-item-precio">
              {formatCurrency($cart[item].fields.precio)}
            </div>
          </div>
        {/each}
      </div>
    {/if}
    <div
      class="listo-close-btn"
      on:click={() => {
        dispatch("closeListo");
      }}
    >
      ← Back
    </div>
  </div>
</div>

<style>
</style>
