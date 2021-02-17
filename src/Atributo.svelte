<script>
  import { opcionesByAtributo, menuState, categorias } from "./stores.js";
  import Opciones from "./Opciones.svelte";

  export let atributo;

  $: console.log(atributo);

  let isDisabled;
  let isOpen;

  $: {
    if ($categorias.all) {
      isDisabled = false;
    } else if (atributo.fields.Categoría) {
      isDisabled = atributo.fields.Categoría.some((cat) => !$categorias[cat]);
    } else {
      isDisabled = true;
    }

    if (isDisabled) {
      $menuState[atributo.fields.Nombre] = false;
    }
  }

  $: {
    isOpen = $menuState[atributo.fields.Nombre];
  }
</script>

<div
  class="atributo-title"
  class:isDisabled
  on:click={() => {
    console.log("clicked");
    if (isDisabled) return;
    $menuState[atributo.fields.Nombre] = !$menuState[atributo.fields.Nombre];
  }}
>
  {atributo.fields.Nombre}
</div>
<Opciones opciones={$opcionesByAtributo[atributo.fields.Nombre]} {isOpen} />

<style>
  .atributo-title {
    background: green;
  }
  .isDisabled {
    background: red;
  }
</style>
