<script>
  import {
    modelos,
    proyectos,
    currentSelection,
    getOpciones,
    loadingOpciones,
    cart,
  } from "./stores.js";

  import { LottiePlayer } from "@lottiefiles/svelte-lottie-player";

  import { createEventDispatcher, onMount, tick } from "svelte";

  import { formatCurrency } from "./utils.js";

  import { fade } from "svelte/transition";

  import SideItem from "./SideItem.svelte";

  const dispatch = createEventDispatcher();

  let showSelect = true;

  let pageLoading = true;

  $: total = $cart.reduce((acc, item) => {
    return acc + item.fields.precio;
  }, 0);

  $: loading =
    $loadingOpciones ||
    $proyectos.length == 0 ||
    $modelos.length == 0 ||
    pageLoading;

  $: totalFormatted = formatCurrency(total);

  onMount(() => {
    if ($proyectos.length == 0 || $modelos.length == 0) {
      showSelect = true;
    }

    if (document.readyState != "complete") {
      window.addEventListener("load", async () => {
        pageLoading = false;
      });
    } else {
      pageLoading = false;
    }
  });

  $: console.log($currentSelection);
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
{#if loading || showSelect || !$currentSelection.proyect || !$currentSelection.modelo}
  <div
    class="select-modal"
    on:click={() => {
      if (!loading) showSelect = false;
    }}
    transition:fade={{ duration: 150 }}
  >
    {#if loading}
      <div class="loading">
        <LottiePlayer
          src="https://uploads-ssl.webflow.com/608c5f50fdfe54234b3648a3/6097918e403c478fc98a89ac_lottieflow-loading-08-000000-easey.json"
          autoplay={true}
          loop={true}
          controls={false}
          renderer="svg"
          background="transparent"
          height={50}
          width={50}
          controlsLayout={[]}
        />
      </div>
    {:else}
      <div class="select-modal-bg" on:click|stopPropagation>
        <div class="modal-instruction">
          <span class="blue-text">Selecciona</span> tu hogar preferido
        </div>
        <div class="modal-title">Proyectos</div>
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

        <div class="modal-title">Modelos</div>
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
