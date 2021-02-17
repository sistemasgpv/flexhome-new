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
  .opcione {
    width: 279px;
    background: white;
    box-shadow: 0px 0px 25px 0px #0000001a;
    border-radius: 10px;
    padding: 5px;
    display: flex;
    flex-direction: column;
  }

  .opcione-img {
    border-radius: 7.5px;
  }

  .opcione-title {
    margin-top: 11px;
    font-size: 14px;
    font-style: normal;
    font-weight: 700;
    line-height: 16px;
    letter-spacing: 0em;
    text-align: left;
  }
</style>
