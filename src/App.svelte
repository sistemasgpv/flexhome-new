<script>
  import Categorias from "./Categorias.svelte";
  import Atributos from "./Atributos.svelte";
  import SelectModelo from "./SelectModelo.svelte";
  import Listo from "./Listo.svelte";
  import Cart from "./Cart.svelte";

  let showListo = false;
</script>

<div class="main-app">
  <div class="col-left">
    <Categorias />
    <Atributos />
  </div>
  <div class="col-right">
    <div class="col-right-sticky">
      <SelectModelo />
      <Cart
        on:showListo={() => {
          debugger;
          showListo = true;
        }}
      />
    </div>
  </div>
</div>

{#if showListo}
  <Listo
    on:closeListo={() => {
      showListo = false;
    }}
  />
{/if}

<style>
</style>
