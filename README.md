# Recepción de mercancía · Enjoy Videogames

Webapp para el móvil para contar la mercancía que llega a la tienda. Pueden contar varias personas a la vez y, al terminar, genera el mensaje de WhatsApp (con el formato de siempre) y el Excel con la columna «Nº pedido».

- **Página:** HTML, CSS y JavaScript sin compilación. Se publica en GitHub Pages.
- **Base de datos:** el **mismo proyecto de Supabase que el control de garantías** (`supabase/schema.sql`). Usa los mismos usuarios.

## Cómo se usa

1. Entra con tu correo y contraseña (los mismos de garantías).
2. **Nueva recepción**, o únete a una que esté «En curso».
3. Toca la sección (GPU NVIDIA, Portátiles, Componentes…) y elige **Marca → Gama → Referencia → producto**. Si no aparece, usa el buscador o «Añadir tal cual».
4. Cuenta con **−1 / +1 / +5** (en Extras se puede contar en kg). Cada conteo queda a nombre de quien lo hizo. Un producto que llega a 0 desaparece y **Deshacer** lo recupera.
5. **Resumen y enviar**: **Copiar para WhatsApp** y **Descargar Excel**. Después, **Cerrar recepción**.

Las recepciones se pueden eliminar con la ✕ de la lista. Eso borra también sus productos y conteos.

## Puesta en marcha

1. **Base de datos:** en Supabase, abre **SQL Editor**, pega todo `supabase/schema.sql` y ejecútalo una vez. Crea 3 tablas nuevas (`recepciones`, `recepcion_lineas` y `recepcion_conteos`), activa el tiempo real y no toca las tablas de garantías.
2. **Conexión:** `config.js` tiene la URL y la clave pública del proyecto. Es el mismo archivo que en garantías. Nunca pongas ahí la clave `service_role` / `secret`.
3. **Publicar:** en GitHub, **Settings > Pages**, elige **Deploy from a branch**, rama `main` y carpeta `/ (root)`.

En el plan gratis, el repositorio y la página son públicos. No hay datos de la tienda en el repositorio: viven en Supabase, detrás del inicio de sesión. La tarea «Mantener Supabase activo» del repositorio de garantías también mantiene vivo este proyecto, porque es el mismo.

## Actualizar el catálogo

El catálogo (`catalogo.json`) sale del CSV de productos de WooCommerce:

1. Exporta el CSV con las columnas `id, nombre, sku, gtin, mpn, stock, estado_stock, estado, tipo, categorias` y guárdalo como `data/catalogo.csv`. La carpeta `data/` no se sube a Git.
2. Ejecuta el script con `node scripts/build_catalog.mjs`. Las reglas de Marca, Gama y Referencia están en `scripts/facets.mjs`.
3. Sube el `catalogo.json` nuevo.
