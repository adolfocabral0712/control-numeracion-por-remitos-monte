export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/datos") {
      return obtenerJsonExterno(
        request,
        env.CONTROL_REMITOS_JSON_URL,
        "CONTROL_REMITOS_JSON_URL",
        "Control-Remitos-Origen/1.0"
      );
    }

    if (url.pathname === "/api/fas-remitos") {
      return obtenerJsonExterno(
        request,
        env.FAS_REMITOS_API_URL,
        "FAS_REMITOS_API_URL",
        "Control-Remitos-Forestal/1.0"
      );
    }

    return env.ASSETS.fetch(request);
  },
};

async function obtenerJsonExterno(
  request,
  enlace,
  nombreSecret,
  agente
) {
  if (request.method !== "GET") {
    return respuestaJson(
      {
        error: "Método no permitido.",
      },
      405
    );
  }

  if (!enlace) {
    return respuestaJson(
      {
        error: `No existe el Secret ${nombreSecret}.`,
      },
      500
    );
  }

  try {
    const origen = await fetch(enlace, {
      method: "GET",

      headers: {
        Accept: "application/json",
        "User-Agent": agente,
      },

      cf: {
        cacheEverything: false,
        cacheTtl: 0,
      },
    });

    if (!origen.ok) {
      return respuestaJson(
        {
          error:
            "No fue posible obtener la fuente de datos.",

          estado_origen: origen.status,
        },
        502
      );
    }

    const texto = await origen.text();

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
      `Error consultando ${nombreSecret}:`,
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
