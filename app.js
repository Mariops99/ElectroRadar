const express = require('express');
const https = require('https');
const parseString = require('xml2js').parseString;

const url = 'https://infocar.dgt.es/datex2/v3/miterd/EnergyInfrastructureTablePublication/electrolineras.xml';

https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    parseString(data, (err, result) => {
      if (err) {
        console.error(err);
      } else {
        const listadoElectrolineras = result['d2:payload']['egi:energyInfrastructureTable'][0];
        for (let electrolinera of listadoElectrolineras['egi:energyInfrastructureSite']) {
          console.log(formatElectrolinera(electrolinera));
        }
      }
    });
  });
}).on('error', (err) => {
  console.error(err);
});


function formatElectrolinera(electrolinera) {
  const electrolineraFormateada = {
    id: electrolinera['$']['id'],
    nombre: electrolinera['fac:name'][0]['com:values'][0]['com:value'][0]['_'],
    horario: electrolinera['fac:operatingHours'][0]['fac:label'],
    lugar: electrolinera['egi:typeOfSite'],
    direccion: {
      calle: electrolinera['fac:locationReference'][0]['loc:_locationReferenceExtension'][0]['loc:facilityLocation'][0]['locx:address'][0]['locx:addressLine'][0]['locx:text'][0]['com:values'][0]['com:value'][0]['_'],
      codigoPostal: electrolinera['fac:locationReference'][0]['loc:_locationReferenceExtension'][0]['loc:facilityLocation'][0]['locx:address'][0]['locx:postcode'][0],
      localidad: electrolinera['fac:locationReference'][0]['loc:_locationReferenceExtension'][0]['loc:facilityLocation'][0]['locx:address'][0]['locx:addressLine'][1]['locx:text'][0]['com:values'][0]['com:value'][0]['_'],
      provincia: electrolinera['fac:locationReference'][0]['loc:_locationReferenceExtension'][0]['loc:facilityLocation'][0]['locx:address'][0]['locx:addressLine'][2]['locx:text'][0]['com:values'][0]['com:value'][0]['_'],
      comunidadAutonoma: electrolinera['fac:locationReference'][0]['loc:_locationReferenceExtension'][0]['loc:facilityLocation'][0]['locx:address'][0]['locx:addressLine'][3]['locx:text'][0]['com:values'][0]['com:value'][0]['_']
    },
    coordenadas: {
      latitud: electrolinera['fac:locationReference'][0]['loc:coordinatesForDisplay'][0]['loc:latitude'][0],
      longitud: electrolinera['fac:locationReference'][0]['loc:coordinatesForDisplay'][0]['loc:longitude'][0]
    },
    operador: electrolinera['fac:operator'][0]['fac:name'][0]['com:values'][0]['com:value'][0]['_'],
    activacion: electrolinera['egi:energyInfrastructureStation'][0]['egi:authenticationAndIdentificationMethods'],
    cargadores: []
  }

  //Me gustaría modificar los datos de la dirección (localidad, provincia, comunidad autónoma) ya que el string muestra Municipio: y el municipio que sea. Quitar el Municipio: y dejar solo el nombre del municipio.

  // Formatear el lugar de la electrolinera
  switch(electrolinera['egi:typeOfSite']) {
    case 'onstreet':
      electrolineraFormateada.lugar = 'En la calle';
      break;
    default:
      electrolineraFormateada.lugar = 'Desconocido';
      break;
  }

  for (let cargador of electrolinera['egi:energyInfrastructureStation'][0]['egi:refillPoint']) {
    objetoCargador = {
        id: cargador['$']['id'],
        nombre: cargador['fac:name'][0]['com:values'][0]['com:value'][0]['_'],
        conectores: []
    }
    
    for(let conector of cargador['egi:connector']) {
      objetoConector = {
        tipo: conector['egi:connectorType'][0],
        potencia: conector['egi:maxPowerAtSocket'][0],
        amperaje: conector['egi:maximumCurrent'],
        voltaje: conector['egi:voltage'],
        formato: conector['egi:connectorFormat'][0],
      }

      // Formatear el tipo de conector
      switch (conector['egi:connectorType'][0]) {
        case 'iec62196T2':
          objetoConector['tipo'] = 'Tipo 2';
          break;
        case 'iec62196T2COMBO':
          objetoConector['tipo'] = 'CCS';
          break;
        case 'chademo':
          objetoConector['tipo'] = 'CHAdeMO';
          break;
        default:
          objetoConector['tipo'] = conector['egi:connectorType'][0]; // Dejar el valor original mientras no conozcamos todos los tipos
          break;
      }

      // Formatear el formato del conector
      switch (conector['egi:connectorFormat'][0]) {
        case 'cableMode3':
          objetoConector['formato'] = 'Cable';
          break;
        case 'socket':
          objetoConector['formato'] = 'Conector';
          break;
        default:
          objetoConector['formato'] = 'Desconocido';
          break;
      }

      // Formatear la potencia del conector
      objetoConector['potencia'] = parseInt(conector['egi:maxPowerAtSocket'][0]) / 1000 + 'kW';

      objetoCargador['conectores'].push(objetoConector);
      }
      electrolineraFormateada['cargadores'].push(objetoCargador);
  }
  return electrolineraFormateada;
}