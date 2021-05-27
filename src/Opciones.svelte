<script>
  import { tick } from "svelte";
  import Opcione from "./Opcione.svelte";

  export let opciones = [];
  export let isOpen = false;
  export let open = false;

  $: {
    open = isOpen && opciones.length > 0;
  }
  let opcionesDiv;
  let maxHeight = 0;

  let opcionesLoaded = 0;

  async function calcHeight() {
    await tick();
    maxHeight = opcionesDiv.scrollHeight;
  }

  function opcioneLoaded() {
    opcionesLoaded++;

    if (opcionesLoaded >= opciones.length) {
      calcHeight();
    }
  }

  $: {
    if (opcionesDiv) {
      opcionesDiv.style.maxHeight = open ? maxHeight + "px" : "0px";
    }
  }
</script>

<div class="opciones" bind:this={opcionesDiv} class:open>
  {#if opciones}
    {#each opciones as opcione}
      <Opcione {opcione} on:img-loaded={opcioneLoaded} />
    {/each}
  {/if}
</div>

<style>
</style>
