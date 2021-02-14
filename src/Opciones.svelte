<script>
  import { atributos, opcionesByAtributo } from "./stores.js";
</script>

<div class="opciones-container">
  {#each $atributos as atributo}
    <div class="atributo-title">
      {atributo.fields.Nombre}
      {#each Object.keys($opcionesByAtributo) as opcione}
        {opcione}
      {/each}
    </div>
    <div class="opciones" />
  {/each}
</div>

<style>
  /* your styles go here */
</style>
