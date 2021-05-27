import { writable, derived } from "svelte/store";
import axios from "axios";
import { get } from "svelte/store";

export const proyectos = writable([]);

export const modelos = writable([]);

export const viviendas = writable([]);

export const opciones = writable([]);

export const atributos = writable([]);

export const menuState = writable({}); //atrributes open or closed

export const selection = writable({});

export const categorias = writable({});

export const cart = writable([]);

export const loadingOpciones = writable(false);

export function showAttribute(atr) {
  menuState.update((ms) => {
    ms[atr] = true;
    return ms;
  });

  //scroll into view
  document
    .getElementById(atr)
    .scrollIntoView({ behavior: "smooth", block: "start" });
}

//proyect and modelo selection
export const currentSelection = writable({
  proyect: null,
  modelo: null,
});

function getCategoriasFromAtributos() {
  let cat = {
    all: true,
  };
  get(atributos).forEach((atr) => {
    if (atr.fields.Categoría) {
      atr.fields.Categoría.forEach((catName) => {
        cat[catName] = false;
      });
    }
  });
  categorias.set(cat);
}

export function getAtributos() {
  let ms = {}; //menu state

  axios.get("https://enl4yiidhnuij8n.m.pipedream.net").then((res) => {
    res.data.forEach((att) => {
      att.opciones = [];
      //open all attrbutes by default
      ms[att.fields.Nombre] = true;
    });
    menuState.set(ms);

    res.data.sort((a, b) => {
      return +a.fields.Prioridad - +b.fields.Prioridad;
    });
    atributos.set(res.data);

    getCategoriasFromAtributos();
  });
}

export function getProyectos() {
  axios.get("https://en57ds8aebutpuq.m.pipedream.net").then((res) => {
    proyectos.set(res.data);
    // auto select first project
    if (!get(currentSelection).proyect) {
      currentSelection.update((cs) => {
        cs.proyect = res.data[0];
        return cs;
      });
    }
  });
}

export function getModelos() {
  axios.get("https://enw9gnpjz0b6y3s.m.pipedream.net").then((res) => {
    modelos.set(res.data);
  });
}

export function getOpciones(vivienda) {
  let atts = get(atributos);

  //clear opciones from atributos
  atts.forEach((att) => (att.opciones = []));

  loadingOpciones.set(true);
  axios
    .get(`https://enombb1z99rtf6o.m.pipedream.net?vivienda=${vivienda}`)
    .then((res) => {
      res.data.sort((a, b) => {
        return a.fields.orden - b.fields.orden;
      });

      //put opciones in each atributo
      res.data.forEach((opcione) => {
        let attName = opcione.fields.atributo_nombre;
        atts
          .find((att) => {
            return att.fields.Nombre == attName;
          })
          .opciones.push(opcione);
      });

      //put first option in each atriuto in cart
      let c = [];
      atts.forEach((att) => {
        c.push(att.opciones[0]);
      });
      cart.set(c);

      atributos.set(atts);
      loadingOpciones.set(false);
    });
}

getProyectos();
getAtributos();
getModelos();
