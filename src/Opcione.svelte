<script>
  import { createEventDispatcher } from "svelte";
  import { cart } from "./stores.js";

  const dispatch = createEventDispatcher();
  export let opcione;
</script>

<div
  class="opcione"
  on:click={() => {
    $cart.atributo_nombre = opcione;
  }}
>
  <img
    on:loaded={dispatch("calcHeight")}
    class="opcione-img"
    src={opcione.fields.Render[0].thumbnails.large.url}
    alt=""
  />
  <div class="opcione-title">{opcione.fields.opción_nombre}</div>
  <div class="opcione-description">{opcione.fields.descripción}</div>
  <div class="opcione-price">${opcione.fields.precio}</div>
  <div class="opcione-plus-btn">+</div>
</div>

<style>
</style>
