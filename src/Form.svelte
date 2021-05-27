<script>
  import { currentSelection, cart } from "./stores.js";
  import { createEventDispatcher } from "svelte";
  // import { fade } from "svelte/transition";

  const dispatch = createEventDispatcher();

  // $: total = Object.keys($cart).reduce((acc, item) => {
  //   return acc + $cart[item].fields.precio;
  // }, 0);
</script>

<div class="form">
  <div class="form-left">
    <div class="form-header">Tu hogar perfecto está casi listo.</div>
    <div class="form-text">
      Calcula el costo de la casa de tus sueños respondiendo a preguntas
      simples.
    </div>
    <button
      class="form-close-btn"
      on:click={() => {
        dispatch("closeForm");
      }}>‹ Back</button
    >
  </div>

  <div class="form-right">
    <div class="form-bg">
      <div class="form-top-inputs">
        <div>
          <label class="input-label" for="nombre">Nombre</label>
          <input
            type="text"
            class="form-input"
            maxlength="256"
            name="Nombre"
            data-name="Nombre"
            placeholder="Tu Nombre*"
            id="nombre"
            required="required"
          />
        </div>

        <!-- Apellido -->
        <div>
          <label class="input-label" for="Apellido">Apellido</label>
          <input
            type="text"
            class="form-input"
            maxlength="256"
            name="Apellido"
            data-name="Apellido"
            placeholder="Tu Apellido"
            id="Apellido"
            required="required"
          />
        </div>
      </div>

      <!-- Email -->
      <label class="input-label" for="email">Email</label>
      <input
        type="email"
        class="form-input"
        maxlength="256"
        name="Email"
        data-name="Email"
        placeholder="Tu email*"
        id="email"
        required="required"
      />

      <!-- Dudas -->
      <label class="input-label" for="Dudas">Dudas</label>
      <textarea
        type="text"
        class="form-textarea"
        maxlength="256"
        name="Dudas"
        data-name="Dudas"
        placeholder="Me gustaría ver esta funcionalidad en la app."
        id="Dudas"
      />
      <!-- hidden inputs-->
      {#each $cart as atributo, index}
        <input
          id="atributo-{index}"
          name={atributo.fields.atributo_nombre}
          type="hidden"
          value={atributo.fields.opción_nombre}
        />
      {/each}

      <input
        type="submit"
        value="Enviar"
        data-wait="Por favor, espera..."
        class="form-submit-btn"
      />
    </div>
  </div>
</div>

<style>
</style>
