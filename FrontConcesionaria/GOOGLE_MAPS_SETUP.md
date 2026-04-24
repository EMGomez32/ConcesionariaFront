# Configuración de Google Maps API

## 🚀 Inicio Rápido

El selector de ubicación en el formulario de Proveedores usa Google Maps. Para que funcione completamente, necesitas una API Key gratuita de Google.

### Pasos para obtener la API Key:

1. **Ve a Google Cloud Console**
   - 🔗 https://console.cloud.google.com/

2. **Crea o selecciona un proyecto**
   - Click en el selector de proyectos (arriba)
   - "Nuevo proyecto" → Dale un nombre (ej: "Concesionaria")

3. **Habilita las APIs necesarias**
   - Menú → APIs y servicios → Biblioteca
   - Busca y habilita estas 3 APIs:
     - ✅ **Maps JavaScript API**
     - ✅ **Geocoding API**
     - ✅ **Places API**

4. **Crea una credencial (API Key)**
   - APIs y servicios → Credenciales
   - "Crear credenciales" → "Clave de API"
   - 📋 **Copia la API Key generada**

5. **Configura restricciones (IMPORTANTE para seguridad)**
   - Click en la API Key recién creada
   - **Restricciones de aplicación:**
     - Selecciona "Referentes HTTP (sitios web)"
     - Agrega tus dominios:
       ```
       http://localhost:5173/*
       http://localhost:3000/*
       tu-dominio.com/*
       ```
   - **Restricciones de API:**
     - Selecciona solo las APIs que habilitaste
   - Guarda los cambios

6. **Agrega la API Key al proyecto**
   
   Edita el archivo `.env` en la carpeta FrontConcesionaria:
   
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api
   VITE_GOOGLE_MAPS_API_KEY=TU_API_KEY_AQUI
   ```

7. **Reinicia el servidor de desarrollo**
   
   ```bash
   cd FrontConcesionaria
   npm run dev
   ```

## ✨ Funcionalidades del Selector

- ✅ Haz clic en el mapa para marcar una ubicación
- ✅ Arrastra el marcador para ajustar la posición
- ✅ Obtén tu ubicación actual con el botón "Mi Ubicación"
- ✅ La dirección se obtiene automáticamente mediante geocodificación inversa
- ✅ Guarda las coordenadas y la dirección completa

## Límites de uso gratuito

Google Maps ofrece un crédito mensual gratuito de **$200 USD** que incluye:
- **28,000** cargas de mapas estáticos
- **28,000** sesiones de mapas dinámicos
- **40,000** llamadas al Geocoding API

Para la mayoría de aplicaciones pequeñas y medianas, esto es suficiente y no tendrás costos.

## Solución de problemas

### El mapa no carga:
- Verifica que la API Key esté correctamente configurada en el archivo `.env`
- Asegúrate de haber habilitado las APIs necesarias en Google Cloud Console
- Revisa la consola del navegador para ver mensajes de error específicos
- Verifica que las restricciones de dominio incluyan tu localhost

### Error de permisos:
- Si ves errores 403, verifica que hayas habilitado las APIs en Google Cloud Console
- Revisa que las restricciones de la API Key permitan tu dominio

### Error de geolocalización:
- El navegador debe tener permisos de ubicación habilitados
- Solo funciona en conexiones HTTPS (excepto localhost)

## Alternativas sin API Key (Para desarrollo)

Si prefieres no usar Google Maps durante el desarrollo, puedes:
1. Dejar el campo `VITE_GOOGLE_MAPS_API_KEY` vacío (tendrá marca de agua y límites)
2. Usar OpenStreetMap con Leaflet (requiere instalar dependencias adicionales)

---

**Nota**: Es importante mantener tu API Key segura. No la compartas públicamente y configura restricciones apropiadas en Google Cloud Console.
