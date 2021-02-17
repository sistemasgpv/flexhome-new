<script>
  import { tick } from "svelte";
  import Opcione from "./Opcione.svelte";

  export let opciones = [];
  export let isOpen = false;

  let opcionesDiv;
  let maxHeight = 0;

  async function calcHeight() {
    await tick();
    maxHeight = opcionesDiv.scrollHeight;
  }

  $: {
    if (opcionesDiv) {
      opcionesDiv.style.maxHeight = isOpen ? maxHeight + "px" : "0px";
    }
  }
</script>

<div class="opciones" bind:this={opcionesDiv}>
  {#each opciones as opcione}
    <Opcione {opcione} on:calcHeight={calcHeight} />
  {/each}
</div>

<style>
</style>
