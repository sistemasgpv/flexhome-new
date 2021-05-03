<script>
  import Categorias from "./Categorias.svelte";
  import Atributos from "./Atributos.svelte";
  import SelectModelo from "./SelectModelo.svelte";
  import Listo from "./Listo.svelte";
  import Cart from "./Cart.svelte";
  import Header from "./Header.svelte";
  import { onMount, tick } from "svelte";
  import axios from "axios";

  let showListo = false;
  let showPopup = false;

  //get css link from webflow and append (so we wont have to copy paste every webflow publish)
  //remove before build
  onMount(() => {
    if (document.location.hostname == "localhost") {
      axios
        // .get("https://flexhome-3be182-54afb1aac50df92cd0c3f9a.webflow.io/") //flexhome live
        // .get("https://flexhome-3be182.webflow.io/") //my webflow project
        .get("https://www.flexhome.mx/app-v2") //my webflow project
        .then((res) => {
          let cssUrl = res.data.match(/https:.*\.css/gm);

          var link = document.createElement("link");
          link.href = cssUrl;
          link.type = "text/css";
          link.rel = "stylesheet";
          link.media = "screen,print";

          document.getElementsByTagName("head")[0].appendChild(link);
        });
    }
  });
</script>

<div class="app-container">
  <div class="main-app">
    {#if showPopup}
      <div class="popup">Under Maintenance</div>
    {:else}
      <div class="col-left">
        <Header />
        <Categorias />
        <Atributos />
      </div>
      <div class="col-right">
        <SelectModelo />
        <Cart
          on:showListo={() => {
            showListo = true;
          }}
        />
      </div>
    {/if}
  </div>

  {#if showListo}
    <Listo
      on:closeListo={() => {
        showListo = false;
      }}
    />
  {/if}
</div>

<style>
  .popup {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30px;
  }
</style>
