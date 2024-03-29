import { parseString } from "xml2js";

export async function GET(_params, _request) {
  const url =
    "https://infocar.dgt.es/datex2/v3/miterd/EnergyInfrastructureTablePublication/electrolineras.xml";

  const res = await fetch(url, {
    headers: {
      "cache-control": "no-cache",
    },
  });

  if (!res.ok) {
    return new Response(
      JSON.stringify({ error: "Error al obtener las electrolineras" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "cache-control": "no-cache",
        },
      }
    );
  }

  const data = await res.text();

  return await new Promise((resolve, _reject) => {
    parseString(data, (err, result) => {
      if (err) {
        return resolve(
          new Response(JSON.stringify({ error: "Error al parsear el XML" }), {
            status: 500,
            headers: {
              "Content-Type": "application/json",
            },
          })
        );
      }

      const electrolineras =
        result["d2:payload"]["egi:energyInfrastructureTable"][0][
          "egi:energyInfrastructureSite"
        ].map(formatElectrolinera);

      return resolve(
        new Response(JSON.stringify(electrolineras), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        })
      );
    });
  });
}

export function formatElectrolinera(electrolinera) {
  /**
   * @type {electrolinera} electrolineraFormateada
   */
  const electrolineraFormateada = {
    id: electrolinera["$"]["id"],
    nombre: electrolinera["fac:name"][0]["com:values"][0]["com:value"][0]["_"],
    horario: electrolinera["fac:operatingHours"][0]["fac:label"][0],
    lugar: electrolinera["egi:typeOfSite"],
    direccion: {
      codigoPostal:
        electrolinera["fac:locationReference"][0][
          "loc:_locationReferenceExtension"
        ][0]["loc:facilityLocation"][0]["locx:address"][0]["locx:postcode"][0],
    },
    coordenadas: {
      latitud:
        electrolinera["fac:locationReference"][0][
          "loc:coordinatesForDisplay"
        ][0]["loc:latitude"][0],
      longitud:
        electrolinera["fac:locationReference"][0][
          "loc:coordinatesForDisplay"
        ][0]["loc:longitude"][0],
    },
    operador:
      electrolinera["fac:operator"][0]["fac:name"][0]["com:values"][0][
        "com:value"
      ][0]["_"],
    activacion:
      electrolinera["egi:energyInfrastructureStation"][0][
        "egi:authenticationAndIdentificationMethods"
      ],
    cargadores: [],
  };

  const localidad =
    electrolinera["fac:locationReference"][0][
      "loc:_locationReferenceExtension"
    ][0]["loc:facilityLocation"][0]["locx:address"][0]["locx:addressLine"][1][
      "locx:text"
    ][0]["com:values"][0]["com:value"][0]["_"];
  if (localidad === undefined) {
    electrolineraFormateada.direccion.localidad = "Desconocido";
  } else {
    electrolineraFormateada.direccion.localidad = localidad
      .split(":")[1]
      .trim();
  }

  const provincia =
    electrolinera["fac:locationReference"][0][
      "loc:_locationReferenceExtension"
    ][0]["loc:facilityLocation"][0]["locx:address"][0]["locx:addressLine"][2][
      "locx:text"
    ][0]["com:values"][0]["com:value"][0]["_"];
  if (provincia === undefined) {
    electrolineraFormateada.direccion.provincia = "Desconocido";
  } else {
    electrolineraFormateada.direccion.provincia = provincia
      .split(":")[1]
      .trim();
  }

  const calle =
    electrolinera["fac:locationReference"][0][
      "loc:_locationReferenceExtension"
    ][0]["loc:facilityLocation"][0]["locx:address"][0]["locx:addressLine"][0][
      "locx:text"
    ][0]["com:values"][0]["com:value"][0]["_"];
  if (calle === undefined) {
    electrolineraFormateada.direccion.calle = "Desconocido";
  }
  {
    electrolineraFormateada.direccion.calle = calle.split(":")[1].trim();
  }

  const comunidadAutonoma =
    electrolinera["fac:locationReference"][0][
      "loc:_locationReferenceExtension"
    ][0]["loc:facilityLocation"][0]["locx:address"][0]["locx:addressLine"][3][
      "locx:text"
    ][0]["com:values"][0]["com:value"][0]["_"];
  if (comunidadAutonoma === undefined) {
    electrolineraFormateada.direccion.comunidadAutonoma = "Desconocido";
  } else {
    electrolineraFormateada.direccion.comunidadAutonoma = comunidadAutonoma
      .split(":")[1]
      .trim();
  }

  // Formatear el lugar de la electrolinera
  if (electrolinera["egi:typeOfSite"] === undefined) {
    electrolineraFormateada.lugar = "Desconocido";
  } else {
    switch (electrolinera["egi:typeOfSite"][0]) {
      case "onstreet":
        electrolineraFormateada.lugar = "En la calle";
        break;
      case "openSpace":
        electrolineraFormateada.lugar = "Parking público";
        break;
      default:
        electrolineraFormateada.lugar = electrolinera["egi:typeOfSite"][0]; // Dejar el valor original mientras no conozcamos todos los tipos
        break;
    }
  }

  // Una electrolinera puede tener varios cargadores
  for (let cargador of electrolinera["egi:energyInfrastructureStation"][0][
    "egi:refillPoint"
  ]) {
    /**
     * @type {cargador} objetoCargador
     * */
    let objetoCargador = {
      id: cargador["$"]["id"],
      nombre: cargador["fac:name"][0]["com:values"][0]["com:value"][0]["_"],
      conectores: [],
    };

    // Un cargador puede tener varios conectores
    for (let conector of cargador["egi:connector"]) {
      /**
       * @type {conector} objetoConector
       */
      let objetoConector = {
        tipo: conector["egi:connectorType"][0],
        formato: conector["egi:connectorFormat"][0],
        potencia: conector["egi:maxPowerAtSocket"][0],
        amperaje: conector["egi:maximumCurrent"]
          ? conector["egi:maximumCurrent"][0]
          : "Desconocido",
        voltaje: conector["egi:voltage"]
          ? conector["egi:voltage"][0]
          : "Desconocido",
      };

      // Formatear el tipo de cable del conector
      switch (conector["egi:connectorType"][0]) {
        case "iec62196T2":
          objetoConector.tipo = "Tipo 2";
          break;
        case "iec62196T2COMBO":
          objetoConector.tipo = "CCS";
          break;
        case "chademo":
          objetoConector.tipo = "CHAdeMO";
          break;
        default:
          objetoConector.tipo = conector["egi:connectorType"][0]; // Dejar el valor original mientras no conozcamos todos los tipos de cables de recarga
          break;
      }

      // Formatear el formato del conector
      switch (conector["egi:connectorFormat"][0]) {
        case "cableMode3":
          objetoConector.formato = "Cable";
          break;
        case "socket":
          objetoConector.formato = "Conector";
          break;
        default:
          objetoConector.formato = conector["egi:connectorFormat"][0]; // Dejar el valor original mientras no conozcamos todos los formatos de conectores
          break;
      }

      // Formatear la potencia del conector
      objetoConector.potencia =
        parseInt(conector["egi:maxPowerAtSocket"][0]) / 1000 + "kW";

      //Meter el objeto conector en el array de conectores
      objetoCargador.conectores.push(objetoConector);
    }

    //Meter el objeto cargador en el array de cargadores
    electrolineraFormateada.cargadores.push(objetoCargador);
  }

  // Devolver la electrolinera formateada
  return electrolineraFormateada;
}

/**
 * @typedef {import('../../js/ts/electrolineras_jsdoc.js').electrolinera} electrolinera
 * @typedef {import('../../js/ts/electrolineras_jsdoc.js').conector} conector
 * @typedef {import('../../js/ts/electrolineras_jsdoc.js').cargador} cargador
 */
