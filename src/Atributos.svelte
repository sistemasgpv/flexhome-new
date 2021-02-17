<script>
  import { atributos } from "./stores.js";
  import Atributo from "./Atributo.svelte";
</script>

<div class="opciones-container">
  {#each $atributos as atributo}
    <Atributo {atributo} />
  {/each}
</div>

<style>
</style>
