<script>
  import Categorias from "./Categorias.svelte";
  import Atributos from "./Atributos.svelte";
  import SelectModelo from "./SelectModelo.svelte";
  import { onMount } from "svelte";
  import Cart from "./Cart.svelte";

  onMount(() => {
    console.log(5);
  });
</script>

<div class="main-app">
  <div class="col-left">
    <Categorias />
    <Atributos />
  </div>
  <div class="col-right">
    <div class="col-right-sticky">
      <SelectModelo />
      <Cart />
    </div>
  </div>
</div>

<style>
  .col-right-sticky {
    position: sticky;
    top: 0;
  }
</style>
