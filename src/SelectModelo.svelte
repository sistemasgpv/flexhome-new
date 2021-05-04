<script>
  import {
    modelos,
    proyectos,
    currentSelection,
    getOpciones,
    loadingOpciones,
    cart,
  } from "./stores.js";

  import { createEventDispatcher, onMount } from "svelte";

  import { formatCurrency } from "./utils.js";

  import { fade } from "svelte/transition";

  import SideItem from "./SideItem.svelte";

  const dispatch = createEventDispatcher();

  let showSelect = false;

  $: total = $cart.reduce((acc, item) => {
    return acc + item.fields.precio;
  }, 0);

  $: loading =
    $loadingOpciones || $proyectos.length == 0 || $modelos.length == 0;

  $: totalFormatted = formatCurrency(total);

  onMount(() => {
    if ($proyectos.length == 0 || $modelos.length == 0) {
      showSelect = true;
    }
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
  <div class="select-section-title">Mi casa</div>
  {#if $currentSelection.proyect}
    <SideItem
      imgUrl={$currentSelection?.proyect?.fields?.imágenThumbnail?.[1]?.url}
      cat={"Proyect"}
      title={$currentSelection.proyect.fields.Nombre}
      price={""}
    />
  {/if}

  {#if $currentSelection.modelo}
    <SideItem
      imgUrl={$currentSelection?.modelo?.fields?.imágenThumbnail?.[1]?.url}
      cat={"Modelo"}
      title={$currentSelection.modelo.fields.Nombre}
      price={""}
    />
  {/if}

  <div class="divider" />

  <div class="cart-sum">
    <div class="cart-total">Total</div>
    <div class="cart-sum-num">{totalFormatted}</div>
  </div>
  <div class="listo-btn-container">
    <div
      class="listo-btn"
      on:click={() => {
        dispatch("showForm");
      }}
    >
      Listo →
    </div>
  </div>
</div>

<!-- Overlay modal-->
{#if loading || showSelect}
  <div
    class="select-modal"
    on:click={() => {
      if (!loading) showSelect = false;
    }}
    transition:fade={{ duration: 150 }}
  >
    {#if loading}
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
                src={proyect?.fields?.imágenThumbnail?.[1]?.url}
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
              }}
            >
              <img
                class="modelo-img"
                src={modelo?.fields?.imágenThumbnail?.[1]?.url}
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
