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
        },
      }
    );
  }

  const data = await res.text();

  return new Response(data, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
