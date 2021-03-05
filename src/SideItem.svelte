<script>
  import { formatCurrency } from "./utils.js";

  export let imgUrl;
  export let cat;
  export let title;
  export let price;
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
  </div>
</div>
