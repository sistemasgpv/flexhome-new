import { writable } from "svelte/store";
import axios from "axios";

export const viviendas = writable([]);

export const opciones = writable(null);

export const atributos = writable([]);

export const categorias = writable({
  diversion: false,
  seguridad: false,
  confort: false,
  eficiencia: false,
});

export function getViviendas() {
  axios.get("https://en57ds8aebutpuq.m.pipedream.net").then((res) => {
    viviendas.set(res.data);
    let v = res.data[0].fields.Nombre;
    getOpciones(v);
  });
}

export function getOpciones(vivienda) {
  axios
    .get(`https://enombb1z99rtf6o.m.pipedream.net?vivienda=${vivienda}`)
    .then((res) => {
      opciones.set(res.data);
    });
}

getViviendas();
