<script>
  import Categorias from "./Categorias.svelte";
  import Atributos from "./Atributos.svelte";
  import { onMount } from "svelte";

  onMount(() => {
    console.log(4);
  });
</script>

<div class="main-app">
  <div class="col-left">
    <Categorias />
    <Atributos />
  </div>
  <div class="col-right" />
</div>

<style>
</style>
