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

  // let loadingModelos = true;
  let loadingOpciones = false;

  $: loading = $proyectos.length == 0 || $modelos.length == 0;

  $: console.log($currentSelection.proyect);

  opciones.subscribe((ops) => {
    if (ops.length > 0) loadingOpciones = false;
  });
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
      imgUrl={$currentSelection.proyect.fields.imágenThumbnail[0].url}
      cat={"Proyect"}
      title={$currentSelection.proyect.fields.Nombre}
      price={""}
    />
  {/if}

  {#if $currentSelection.modelo}
    <SideItem
      imgUrl={$currentSelection.modelo.fields.imágenThumbnail[0].url}
      cat={"Modelo"}
      title={$currentSelection.modelo.fields.Nombre}
      price={""}
      removable={false}
    />
  {/if}
</div>

<!-- Overlay modal-->
{#if showSelect || loading || loadingOpciones}
  <div
    class="select-modal"
    on:click={() => {
      if (!loadingOpciones) showSelect = false;
    }}
    transition:fade={{ duration: 150 }}
  >
    {#if loadingOpciones || loading}
      <div class="loading">loading</div>
    {:else}
      <div class="select-modal-bg">
        <div class="modal-title">Select Project</div>
        <div class="select-proyectos">
          {#each $proyectos as proyect}
            <div
              class="select-proyect"
              class:selected={proyect == $currentSelection.proyect}
            >
              <img
                class="proyect-img"
                src={proyect.fields.imágenThumbnail[0].url}
                alt=""
              />

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
                loadingOpciones = true;
              }}
            >
              <img
                class="modelo-img"
                src={modelo.fields.imágenThumbnail[0].url}
                alt=""
              />
              <div class="modelo-title">
                {modelo.fields.Nombre}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
{/if}
