# Argentina Energía — Mapa de carga EV

Sitio estático (sin backend). Datos en vivo desde OpenChargeMap.

## 1. Poner tu API key
Editá `app.js`, línea 2:
```js
const OCM_KEY = "TU_API_KEY_ACA";
```
Pegá la key que te dio openchargemap.org (My Account > API Keys).

## 2. Probar local
```bash
cd ev-map
python3 -m http.server 8000
```
Abrí `http://localhost:8000`.

## 3. Deploy pisando el dominio actual
Si `argentinaenergia.com` ya apunta a un repo de Netlify/GitHub Pages:

```bash
cd ev-map
git init
git add .
git commit -m "rebuild: red de carga EV"
git remote add origin <URL-del-mismo-repo-conectado-al-dominio>
git push -f origin main
```

El DNS no cambia — el dominio sigue apuntando al mismo hosting, solo cambia el contenido del repo. Nadie nota nada, el sitio amanece siendo otra cosa.

Si preferís repo nuevo: creá el repo, conectalo en Netlify, y movés el dominio custom desde el panel de Netlify (Domain settings) del sitio viejo al nuevo.

## 4. Notas
- `maxresults=4000` en `app.js` cubre de sobra los ~200 puntos actuales en Argentina.
- Sin key, la API igual responde pero con rate limit bajo — para producción usá la key.
- Los clusters, filtros de potencia/operador/provincia y buscador son 100% client-side, no hay build step.
