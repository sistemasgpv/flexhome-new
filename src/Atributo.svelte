<script>
  import { opcionesByAtributo, menuState, categorias } from "./stores.js";
  import Opciones from "./Opciones.svelte";

  export let atributo;

  let disabled;
  let isOpen;

  $: {
    if ($categorias.all) {
      disabled = false;
    } else if (atributo.fields.Categoría) {
      disabled = atributo.fields.Categoría.some((cat) => !$categorias[cat]);
    } else {
      disabled = true;
    }

    if (disabled) {
      $menuState[atributo.fields.Nombre] = false;
    }
  }

  $: {
    isOpen = $menuState[atributo.fields.Nombre];
  }
</script>

<div
  class="atributo-title"
  class:disabled
  on:click={() => {
    if (disabled) return;
    $menuState[atributo.fields.Nombre] = !$menuState[atributo.fields.Nombre];
  }}
>
  {atributo.fields.Nombre}
</div>
<Opciones opciones={$opcionesByAtributo[atributo.fields.Nombre]} {isOpen} />

<style>
</style>
