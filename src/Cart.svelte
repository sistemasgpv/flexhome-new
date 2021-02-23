<script>
  import { cart } from "./stores.js";
  import SideItem from "./SideItem.svelte";

  $: console.log($cart);
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
