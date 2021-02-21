<script>
  import Categorias from "./Categorias.svelte";
  import Atributos from "./Atributos.svelte";
  import SelectModelo from "./SelectModelo.svelte";
  import { onMount } from "svelte";

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
  </div>
</div>

<style>
</style>
