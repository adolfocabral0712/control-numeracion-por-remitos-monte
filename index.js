export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/datos") {
      return obtenerDatos(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};


async function obtenerDatos(request, env) {
  if (request.method !== "GET") {
    return respuestaJson(
      {
        error: "Método no permitido.",
      },
      405
    );
  }

  if (!env.CONTROL_REMITOS_JSON_URL) {
    return respuestaJson(
      {
        error:
          "No existe el Secret CONTROL_REMITOS_JSON_URL.",
      },
      500
    );
  }

  try {
    const respuestaOrigen = await fetch(
      env.CONTROL_REMITOS_JSON_URL,
      {
        method: "GET",

        headers: {
          Accept: "application/json",
          "User-Agent":
            "Control-Remitos-Origen/1.0",
        },

        cf: {
          cacheEverything: false,
          cacheTtl: 0,
        },
      }
    );

    if (!respuestaOrigen.ok) {
      return respuestaJson(
        {
          error:
            "No fue posible obtener el JSON de origen.",
          estado_origen: respuestaOrigen.status,
        },
        502
      );
    }

    const texto = await respuestaOrigen.text();

    try {
      JSON.parse(texto);
    } catch {
      return respuestaJson(
        {
          error:
            "La fuente no devolvió un JSON válido.",
        },
        502
      );
    }

    return new Response(texto, {
      status: 200,

      headers: {
        "Content-Type":
          "application/json; charset=UTF-8",

        "Cache-Control":
          "no-store, no-cache, must-revalidate",

        Pragma: "no-cache",

        Expires: "0",

        "X-Content-Type-Options": "nosniff",
      },
    });

  } catch (error) {
    console.error(
      "Error obteniendo el JSON:",
      error
    );

    return respuestaJson(
      {
        error:
          "Ocurrió un error al consultar la fuente de datos.",
      },
      500
    );
  }
}


function respuestaJson(contenido, estado = 200) {
  return new Response(
    JSON.stringify(contenido),
    {
      status: estado,

      headers: {
        "Content-Type":
          "application/json; charset=UTF-8",

        "Cache-Control":
          "no-store, no-cache, must-revalidate",

        "X-Content-Type-Options": "nosniff",
      },
    }
  );
}
