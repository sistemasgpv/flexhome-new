<script>
  import Categorias from "./Categorias.svelte";
  import Atributos from "./Atributos.svelte";
  import SelectModelo from "./SelectModelo.svelte";
  import Listo from "./Listo.svelte";
  import Cart from "./Cart.svelte";
  import { onMount } from "svelte";
  import axios from "axios";
  let showListo = false;

  //get css link from webflow and append (so we wont have to copy paste every webflow publish)
  //remove before build
  onMount(() => {
    debugger;
    if (document.location.hostname == "localhost") {
      axios.get("https://flexhome-3be182.webflow.io/").then((res) => {
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

<div class="main-app">
  <div class="col-left">
    <Categorias />
    <Atributos />
  </div>
  <div class="col-right">
    <div class="col-right-sticky">
      <SelectModelo />
      <Cart
        on:showListo={() => {
          debugger;
          showListo = true;
        }}
      />
    </div>
  </div>
</div>

{#if showListo}
  <Listo
    on:closeListo={() => {
      showListo = false;
    }}
  />
{/if}

<style>
</style>
