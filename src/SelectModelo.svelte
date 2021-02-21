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
    <div class="mi-casa-select">
      <div class="mi-casa-select-img" />
      <div>
        <div class="select-cat">Proyect</div>
        <div class="mi-casa-select-title">
          {$currentSelection.proyect.fields.Nombre}
        </div>
      </div>
    </div>
  {/if}

  {#if $currentSelection.modelo}
    <div class="mi-casa-select">
      <div class="mi-casa-select-img" />
      <div>
        <div class="select-cat">Modelo</div>
        <div class="mi-casa-select-title">
          Model: {$currentSelection.modelo.fields.Nombre}
        </div>
      </div>
    </div>
  {/if}
</div>

{#if showSelect || ($opciones && $opciones.length == 0)}
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
              getOpciones(modelo.fields.Nombre);
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
</style>
