<script>
  import { formatCurrency } from "./utils.js";
  import { cart } from "./stores.js";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let imgUrl;
  export let cat;
  export let title;
  export let price;
  export let removable;
</script>

<div class="select-item">
  <div
    class="select-img"
    style="background: {imgUrl
      ? 'url(' + imgUrl + ')'
      : 'grey'}; background-size:cover"
  />
  <div>
    <div class="select-cat">{cat}</div>
    <div class="select-title">
      {title ? title : ""}
    </div>
    <div class="select-price">
      {Number.isInteger(price) ? formatCurrency(price) : ""}
    </div>
    {#if removable}
      <div
        class="remove-item-icon"
        on:click={() => {
          dispatch("remove", title);
        }}
      >
        X
      </div>
    {/if}
  </div>
</div>
