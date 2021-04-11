<script>
  import { menuState, categorias } from "./stores.js";
  import Opciones from "./Opciones.svelte";

  export let atributo;

  let disabled;
  let isOpen;
  let isEmpty;

  $: {
    isOpen = $menuState[atributo.fields.Nombre] && !disabled;
  }

  $: {
    isEmpty = !atributo || atributo.opciones.length == 0;
  }

  $: {
    if (isEmpty) {
      disabled = true;
    } else if ($categorias.all) {
      disabled = false;
    } else if (atributo.fields.Categoría) {
      //check if at least 1 category of the attribute is switched on in $categories
      disabled = atributo.fields.Categoría.some((cat) => !$categorias[cat]);
    } else {
      disabled = true;
    }
  }
</script>

<div
  id={atributo.name}
  class="atributo-title"
  class:disabled
  on:click={() => {
    if (disabled) return;
    $menuState[atributo.fields.Nombre] = !$menuState[atributo.fields.Nombre];
  }}
>
  {atributo.fields.Nombre}
</div>
<Opciones opciones={atributo.opciones} {isOpen} />

<style>
</style>
