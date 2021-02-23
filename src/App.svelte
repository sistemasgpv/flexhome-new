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
    <SelectModelo />
    <Cart />
  </div>
</div>

<style>
</style>
