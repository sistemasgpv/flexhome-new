<script>
  import { tick } from "svelte";
  import Opcione from "./Opcione.svelte";
  import { modelos } from "./stores.js";

  export let opciones = [];
  export let isOpen = false;

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
      opcionesDiv.style.maxHeight = isOpen ? maxHeight + "px" : "0px";
    }
  }
</script>

<div class="opciones" bind:this={opcionesDiv}>
  {#each opciones as opcione}
    <Opcione {opcione} on:img-loaded={opcioneLoaded} />
  {/each}
</div>

<style>
</style>
