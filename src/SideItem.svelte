<script>
  export let imgUrl;
  export let cat;
  export let title;
  export let price;
</script>

<div class="select-item">
  <div
    class="select-img"
    style="background: {imgUrl ? 'url({imgUrl})' : 'grey'}"
  />
  <div>
    <div class="select-cat">{cat ? cat : ""}</div>
    <div class="select-title">
      {title ? title : ""}
    </div>
    <div class="select-price">
      {price ? price : ""}
    </div>
  </div>
</div>
