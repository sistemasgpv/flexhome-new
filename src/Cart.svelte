<script>
  import { cart, showAttribute } from "./stores.js";
  import SideItem from "./SideItem.svelte";

  let open = true;

  let list;
</script>

<div class="cart">
  <div class="sticky">
    <div>
      <div class="list" class:closed={!open} bind:this={list}>
        <div class="select-section-title">Resumen</div>
        {#each $cart as item}
          <div class="select-item clickable">
            <SideItem
              imgUrl={item.fields?.rendersAltaDefinición?.[0]?.thumbnails?.small
                ?.url}
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
  </div>
</div>
