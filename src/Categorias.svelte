<script>
  import { categorias } from "./stores.js";
</script>

<div class="categorias-title">Categoias</div>
<div class="categorias">
  {#each Object.keys($categorias) as categoria}
    <div
      class="switch"
      on:click={() => {
        $categorias[categoria] = !$categorias[categoria];
      }}
    >
      <div class="switch-bg" class:switch-bg-on={$categorias[categoria]}>
        <div
          class="switch-thumb"
          class:switch-thumb-on={$categorias[categoria]}
        />
      </div>
      <div class="switch-title">
        {categoria}
      </div>
    </div>
  {/each}
</div>

<style>
</style>
