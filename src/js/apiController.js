

export async function getElectrolineras() {
  const res = await fetch("/api/electrolineras", {
    headers: {
      "cache-control": "no-cache",
    },
  });

  if (!res.ok) {
    throw new Error("Error al obtener las electrolineras");
  }

  return await res.json();

}
