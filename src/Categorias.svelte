<script>
  import { categorias } from "./stores.js";
  import IoIosClose from "svelte-icons/io/IoIosClose.svelte";

  function switchClicked(categoria) {
    $categorias[categoria] = !$categorias[categoria];
    if (categoria != "all") {
      //if user turned all categories (execpt for all) off we switch all on, otherwise switch all off
      $categorias.all = !Object.keys($categorias).some((cat) =>
        cat != "all" ? $categorias[cat] : false
      );
    }
  }
</script>

<div class="categorias-title">Categorias</div>
<div class="categorias">
  {#each Object.keys($categorias) as categoria}
    <div
      class="switch"
      class:switch-off={!$categorias[categoria]}
      on:click={() => {
        switchClicked(categoria);
      }}
    >
      <div class="switch-title">
        {categoria}
      </div>
      {#if $categorias[categoria]}
        <div class="switch-x">X</div>
      {/if}
    </div>
  {/each}
</div>

<style>
</style>
