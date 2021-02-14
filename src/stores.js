import { writable } from "svelte/store";
import axios from "axios";

export const proyectos = writable([]);

export const modelos = writable([]);

export const viviendas = writable([]);

export const opciones = writable([]);

export const atributos = writable([]);

export const opcionesByAtributo = writable({});

export const categorias = writable({
  diversion: false,
  seguridad: false,
  confort: false,
  eficiencia: false,
});

export function getAtributos() {
  axios.get("https://enl4yiidhnuij8n.m.pipedream.net").then((res) => {
    atributos.set(res.data);
  });
}

export function getProyectos() {
  axios.get("https://en57ds8aebutpuq.m.pipedream.net").then((res) => {
    proyectos.set(res.data);
    getModelos();
  });
}

export function getModelos() {
  axios.get("https://enw9gnpjz0b6y3s.m.pipedream.net").then((res) => {
    modelos.set(res.data);
    debugger;
    getOpciones(res.data[0].fields.Nombre);
  });
}

export function getOpciones(vivienda) {
  axios
    .get(`https://enombb1z99rtf6o.m.pipedream.net?vivienda=${vivienda}`)
    .then((res) => {
      opciones.set(res.data);

      let byAtr = {};
      res.data.map((o) => {
        let atr = o.fields.atributo_nombre;
        if (!byAtr[atr]) {
          byAtr[o.fields.atributo_nombre] = [o];
        } else {
          byAtr[o.fields.atributo_nombre].push(o);
        }
      });
      console.log(byAtr);
      opcionesByAtributo.set(byAtr);
    });
}

getAtributos();
getProyectos();
