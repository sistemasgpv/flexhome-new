<script>
  import { viviendas } from "./stores.js";
  import Categorias from "./Categorias.svelte";
</script>

<main>
  <div class="col-left">
    <Categorias />
  </div>
  <div class="col-right" />
</main>

<style>
  main {
    width: 100%;
    background: white;
    display: grid;
    grid-template-columns: 3fr 1fr;
    grid-template-rows: 1fr;
    gap: 0px 0px;
    grid-template-areas: ". .";
  }

  .col-left {
    background: orange;
  }

  .col-right {
    background: green;
  }
</style>
