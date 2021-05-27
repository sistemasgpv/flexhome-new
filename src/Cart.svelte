<script>
  import { cart, showAttribute } from "./stores.js";
  import SideItem from "./SideItem.svelte";
  import { onMount } from "svelte";

  let open = false;

  let list;

  $: console.log($cart);
</script>

<div class="cart sticky">
  <div class="list" class:closed={!open} bind:this={list}>
    <div class="select-section-title">Resumen</div>
    {#each $cart as item}
      <div class="select-item clickable">
        <SideItem
          imgUrl={item.fields.imágenPrincipal[0].thumbnails.large.url}
          title={item.fields.opción_nombre}
          cat={item.fields.atributo_nombre}
          price={item.fields.precio}
          on:click={() => {
            showAttribute(item.fields.atributo_nombre);
          }}
        />
      </div>
    {/each}
  </div>
  <div
    class="arrow-btn"
    on:click={() => {
      open = !open;
      list.scrollTop = 0;
    }}
  >
    {#if open}
      ↑
    {:else}
      ↓
    {/if}
  </div>
</div>
