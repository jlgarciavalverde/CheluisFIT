# CheluisFIT Deployment

## Backend publico

La ruta recomendada para el APK de prueba es Render Free para la API y Supabase Free para Postgres.

1. Crea un proyecto Postgres en Supabase y copia la connection string.
2. En Render, crea un Blueprint desde el repo:
   `https://dashboard.render.com/blueprint/new?repo=https://github.com/jlgarciavalverde/CheluisFIT`
3. Rellena las variables marcadas como secretas:
   - `DATABASE_URL`: connection string de Supabase.
   - `JWT_SECRET`: secreto largo y aleatorio.
   - `CORS_ORIGIN`: opcional para app nativa; rellénalo si luego publicas web.
4. Cuando Render termine, comprueba:
   `curl https://cheluisfit-api.onrender.com/api/health`
5. Aplica Prisma y carga ejercicios usando la misma `DATABASE_URL` pública:
   `npm run db:push`
   `npm run db:seed:exercises`

## APK preview

El perfil `preview` de EAS genera un `.apk` instalable y apunta a:
`https://cheluisfit-api.onrender.com/api`

1. Inicia sesion en Expo:
   `cd mobile && npx eas-cli login`
2. Vincula el proyecto si EAS lo pide:
   `npx eas-cli build:configure`
3. Genera el APK:
   `npm run build:android:preview`

Antes de generar el APK, ejecuta:

```bash
cd mobile
npm run doctor
npm run typecheck

cd ../backend
npm run build
npm run test -- --run
```
