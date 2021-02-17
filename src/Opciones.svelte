<script>
  import Opcione from "./Opcione.svelte";
  import { onMount, tick } from "svelte";

  export let opciones = [];
  export let isOpen = false;

  let opcionesDiv;
  let maxHeight = 0;

  onMount(async () => {
    await tick();
    maxHeight = opcionesDiv.scrollHeight;
  });

  $: {
    if (opcionesDiv) {
      opcionesDiv.style.maxHeight = isOpen ? maxHeight + "px" : "0px";
    }
  }
</script>

<div class="opciones" bind:this={opcionesDiv}>
  {#each opciones as opcione}
    <Opcione {opcione} />
  {/each}
</div>

<style>
  .opciones {
    max-height: 0px;
    overflow: hidden;
    transition: max-height 0.3s ease-out;
    margin-top: 30px;
    padding-top: 0;
  }
</style>
