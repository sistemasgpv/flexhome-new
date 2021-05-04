<script>
  import Categorias from "./Categorias.svelte";
  import Atributos from "./Atributos.svelte";
  import SelectModelo from "./SelectModelo.svelte";
  import Form from "./Form.svelte";
  import Cart from "./Cart.svelte";
  import Header from "./Header.svelte";
  import { onMount } from "svelte";
  import axios from "axios";

  let showForm = false;

  //get css link from webflow and append (so we wont have to copy paste every webflow publish)
  //remove before build
  onMount(() => {
    if (document.location.hostname == "localhost") {
      axios
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

<div class="main-app">
  {#if showForm}
    <Form
      on:closeForm={() => {
        showForm = false;
      }}
    />
  {:else}
    <div class="col-left">
      <Header />
      <Categorias />
      <Atributos />
    </div>
    <div class="col-right">
      <SelectModelo
        on:showForm={() => {
          showForm = true;
        }}
      />
      <Cart />
    </div>
  {/if}
</div>
