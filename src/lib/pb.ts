import PocketBase from 'pocketbase';

// 1. Instancia
export const pb = new PocketBase('https://a1-pocketbase.adwebcrm.com');

// 2. Desactivar autocancelación (Vital para Astro SSR)
pb.autoCancellation(false);

// 3. Cargar el token: intentar import.meta.env primero, luego process.env (para producción Node)
const token = import.meta.env.POCKETBASE_TOKEN || (typeof process !== 'undefined' ? process.env.POCKETBASE_TOKEN : undefined);

// 4. Si existe el token, lo aplicamos al authStore
if (token) {
    pb.authStore.save(token, null);
    console.log('[PB] Token cargado correctamente');
} else {
    console.warn('[PB] POCKETBASE_TOKEN no encontrado. Verificar variables de entorno.');
    console.warn('[PB] import.meta.env keys:', Object.keys(import.meta.env));
}
