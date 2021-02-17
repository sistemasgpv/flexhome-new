<script>
  export let opcione;
</script>

<div class="opcione">
  <img
    class="opcione-img"
    src={opcione.fields.Render[0].thumbnails.large.url}
    alt=""
  />
  <div class="opcione-title">{opcione.fields.opción_nombre}</div>
  <div class="opcione-description">{opcione.fields.descripción}</div>
  <div class="opcione-price">${opcione.fields.precio}</div>
  <div class="opcione-plus-btn">+</div>
</div>

<style>
</style>
