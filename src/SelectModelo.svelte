<script>
  import {
    modelos,
    proyectos,
    currentSelection,
    opciones,
    getOpciones,
  } from "./stores.js";

  let showSelect = true;

  $: console.log($opciones);
</script>

<div class="mi-casa">
  <div class="mi-casa-title">Mi Casa</div>
  {#if $currentSelection.proyect}
    <div class="mi-casa-proyect">
      <div class="mi-casa-proyect-img" />
      <div class="mi-casa-proyect-title">
        Proyect: {$currentSelection.proyect.fields.Nombre}
      </div>
    </div>
  {/if}
</div>

{#if showSelect || $opciones.length == 0}
  <div
    class="select-modal"
    on:click={() => {
      showSelect = false;
    }}
  >
    <div class="select-modal-bg">
      <div class="select-proyectos">
        {#each $proyectos as proyect}
          <div
            class="select-proyect"
            class:selected={proyect == $currentSelection.proyect}
          >
            <div class="proyect-img">
              {proyect.fields.Nombre} - Image
            </div>
            <div class="proyect-title">
              {proyect.fields.Nombre}
            </div>
          </div>
        {/each}
      </div>

      <div class="select-modelos">
        {#each $modelos as modelo}
          <div
            class="select-modelo"
            class:selected={modelo == $currentSelection.modelo}
            on:click|stopPropagation={() => {
              $currentSelection.modelo = modelo;
              getOpciones(modelo.fields.Nomre);
              showSelect = false;
            }}
          >
            <div class="modelo-img">
              {modelo.fields.Nombre} - Image
            </div>
            <div class="modelo-title">
              {modelo.fields.Nombre}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  .select-modal {
    width: 100vw;
    height: 100vh;
    position: fixed;
    background: #00000087;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .select-modal-bg {
    background: white;
    border-radius: 10px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .select-proyectos,
  .select-modelos {
    display: flex;
  }

  .select-modelo,
  .select-proyect {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: white;
    border-radius: 10px;
    overflow: hidden;
    margin: 10px;
    box-shadow: 0 5px 10px -8px;
  }

  .proyect-img,
  .modelo-img {
    background: lightgrey;
    padding: 10px;
    width: 140px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .selected {
    border: 4px solid #6caaff;
  }
</style>
