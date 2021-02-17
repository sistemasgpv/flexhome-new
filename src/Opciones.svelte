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
    console.log(isOpen, opcionesDiv);
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
</style>
