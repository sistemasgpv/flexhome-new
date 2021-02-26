<script>
  import {
    modelos,
    proyectos,
    currentSelection,
    opciones,
    getOpciones,
  } from "./stores.js";

  import { fade } from "svelte/transition";

  import SideItem from "./SideItem.svelte";

  let showSelect = true;
</script>

<div class="mi-casa">
  <div
    class="editar"
    on:click={() => {
      showSelect = true;
    }}
  >
    Editar
  </div>
  <div class="select-section-title">Mi Casa</div>
  {#if $currentSelection.proyect}
    <SideItem
      imgUrl={""}
      cat={"Proyect"}
      title={$currentSelection.proyect.fields.Nombre}
      price={""}
    />
  {/if}

  {#if $currentSelection.modelo}
    <SideItem
      imgUrl={""}
      cat={"Modelo"}
      title={$currentSelection.modelo.fields.Nombre}
      price={""}
    />
  {/if}
</div>

<!-- Overlay modal-->
{#if showSelect || ($opciones && $opciones.length == 0)}
  <div
    class="select-modal"
    on:click={() => {
      showSelect = false;
    }}
    transition:fade={{ duration: 150 }}
  >
    <div class="select-modal-bg">
      <div class="modal-title">Select Project</div>
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

      <div class="modal-title">Select Model</div>
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

<!-- Overlay modal-->
<style>
</style>
