<script>
  import { categorias } from "./stores.js";

  function switchClicked(categoria) {
    $categorias[categoria] = !$categorias[categoria];
    if (categoria != "all") {
      //if user turned all categories off we switch all on, otherwise switch off all
      $categorias.all = !Object.keys($categorias).some(
        (cat) => $categorias[cat]
      );
    }
  }
</script>

<div class="categorias-title">Categoias</div>
<div class="categorias">
  {#each Object.keys($categorias) as categoria}
    <div
      class="switch"
      on:click={() => {
        switchClicked(categoria);
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
