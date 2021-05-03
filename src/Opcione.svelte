<script>
  import { createEventDispatcher } from "svelte";
  import { cart } from "./stores.js";
  import { formatCurrency } from "./utils.js";

  const dispatch = createEventDispatcher();
  export let opcione;

  $: formattedPrecio = formatCurrency(opcione.fields.precio);

  $: cartIdx = $cart.findIndex((item) => {
    return attName == item.fields.atributo_nombre;
  });

  $: attName = opcione.fields.atributo_nombre;

  $: selected =
    cartIdx >= 0 &&
    $cart[cartIdx].fields.opción_nombre == opcione.fields.opción_nombre;

  function setCartItem() {
    //find atributo index
    $cart[cartIdx] = opcione;
  }

  $: console.log(opcione);
</script>

<div class="opcione" class:selected on:click={setCartItem}>
  <img
    on:load={() => {
      dispatch("img-loaded");
    }}
    class="opcione-img"
    src={opcione?.fields?.rendersAltaDefinición?.[0]?.thumbnails?.large?.url}
    alt=""
  />
  <div class="opcione-title">{opcione.fields.opción_nombre}</div>
  <div class="opcione-description">{opcione.fields.descripción}</div>
  <div class="opcione-price">{formattedPrecio}</div>
  <a href={opcione.fields.webflowURL} target="_blank">
    <div class="ver-mas">Ver más →</div>
  </a>
</div>

<style>
</style>
