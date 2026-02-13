import PocketBase from 'pocketbase';

// 1. Instancia
export const pb = new PocketBase('https://a1-pocketbase.adwebcrm.com');

// 2. Desactivar autocancelación (Vital para Astro SSR)
pb.autoCancellation(false);

// 3. Cargar el token desde el archivo .env
const token = import.meta.env.POCKETBASE_TOKEN;

// 4. Si existe el token, lo aplicamos al authStore
if (token) {
    pb.authStore.save(token, null);
    console.log('🔑 Token de PocketBase cargado correctamente');
} else {
    console.warn('⚠️ No se encontró POCKETBASE_TOKEN en el archivo .env');
}
