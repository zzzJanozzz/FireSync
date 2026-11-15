# Publicar FireSync en Cloudflare Pages con el dominio firesync.space

La app es estática: Cloudflare solo tiene que servir la carpeta `web/`. No hay build ni servidor.

| Dato | Valor |
|---|---|
| Carpeta a publicar | `web` |
| Comando de build | ninguno (dejar vacío) |
| Archivos | unos 9.100, 370 MB (límite de Cloudflare Pages: 20.000 archivos) |
| Archivo más grande | unos 2,7 MB (límite: 25 MiB) |
| Headers y caché | `web/_headers` (ya incluido) |

## Estado al 15 de noviembre de 2026

| Paso | Estado |
|---|---|
| Proyecto de Cloudflare Pages `firesync` | Creado |
| Sitio publicado | En vivo en https://firesync.pages.dev (subido con `wrangler pages deploy web`) |
| Dominios `firesync.space` y `www.firesync.space` en el proyecto | Registrados, esperando el DNS |
| Dominio agregado a Cloudflare (zona) | **Pendiente**: hay que hacerlo desde el panel (sección 2, pasos 2 y 3) |
| Nameservers en Spaceship | **Pendiente**: hoy son `launch1.spaceship.net` y `launch2.spaceship.net` (sección 2, paso 4) |

Para volver a publicar después de un cambio:

```bash
npx wrangler@3 pages deploy web --project-name firesync --branch main
```

GitHub Pages se sigue actualizando solo con cada `git push`. Cloudflare Pages no: el proyecto se creó por subida directa, así que hay que correr el comando de arriba (o conectar el repositorio desde el panel).

## 1. Crear el proyecto en Cloudflare Pages

Hay dos caminos. El primero es el recomendado porque cada `git push` vuelve a publicar solo.

### Opción A: conectar el repositorio de GitHub (recomendada)

1. Entrar a https://dash.cloudflare.com → **Workers & Pages** → **Create** → pestaña **Pages** → **Connect to Git**.
2. Autorizar GitHub y elegir `zzzJanozzz/FireSync`.
3. Configuración del build:
   - *Production branch*: `main`
   - *Framework preset*: **None**
   - *Build command*: vacío
   - *Build output directory*: `web`
4. **Save and Deploy**. Queda publicado en `https://firesync.pages.dev` (o el nombre que Cloudflare asigne).

### Opción B: subirlo a mano desde esta laptop

```bash
npx wrangler@3 login
```

```bash
npx wrangler@3 pages deploy web --project-name firesync
```

`wrangler.toml` en la raíz ya indica `pages_build_output_dir = "web"`.

## 2. Comprar y conectar firesync.space (Spaceship)

1. Comprar `firesync.space` en https://www.spaceship.com.
2. En Cloudflare: **Websites** → **Add a domain** → escribir `firesync.space` → plan **Free**.
3. Cloudflare muestra **dos nameservers** (por ejemplo `xxx.ns.cloudflare.com` y `yyy.ns.cloudflare.com`). Copiarlos.
4. En Spaceship: **Domain Manager** → `firesync.space` → **Nameservers** → **Custom nameservers** → pegar los dos de Cloudflare → guardar.
5. Esperar a que Cloudflare marque el dominio como **Active** (suele tardar entre 5 minutos y 2 horas; Cloudflare manda un email).
6. En el proyecto de Pages: **Custom domains** → **Set up a custom domain** → `firesync.space` → confirmar. Repetir con `www.firesync.space`. Cloudflare crea los registros DNS y el certificado SSL solo.
7. Para que `www` redirija al dominio principal: **Rules** → **Redirect Rules** → plantilla *Redirect from WWW to root*.

## 3. Ajustes recomendados en Cloudflare (dominio firesync.space)

| Dónde | Ajuste | Por qué |
|---|---|---|
| SSL/TLS → Overview | **Full (strict)** | HTTPS de punta a punta |
| SSL/TLS → Edge Certificates | **Always Use HTTPS** activado | Evita la versión http |
| Speed → Optimization | **Brotli** activado (viene por defecto) | Los JSON de datos bajan entre 70 y 85 % |
| Caching → Configuration | *Browser Cache TTL*: **Respect Existing Headers** | Usa los tiempos de `web/_headers` |
| Security → Bots | Dejar **Bot Fight Mode** apagado | Puede bloquear a jueces que entren con VPN o redes corporativas |

## 4. Antes de entregar

- Cambiar los enlaces de `README.md` y `docs/SUBMISSION.md` a `https://firesync.space` y dejar GitHub Pages como espejo de respaldo.
- **Dominio nuevo = riesgo de bloqueo.** Los filtros corporativos (FortiGuard, Cisco Umbrella, Palo Alto, Zscaler) suelen bloquear dominios recién registrados durante días. Pedir la categoría hoy mismo:
  - FortiGuard: https://www.fortiguard.com/webfilter (categoría *Education* o *Information Technology*)
  - Cisco Talos: https://talosintelligence.com/reputation_center
  - Palo Alto: https://urlfiltering.paloaltonetworks.com
  - Zscaler: https://sitereview.zscaler.com
- En la página de entrega de Space Apps poner **las dos URLs**: `https://firesync.space` y `https://zzzjanozzz.github.io/FireSync/`.
- Probar el sitio desde el celular con datos móviles (otra red, sin caché).
