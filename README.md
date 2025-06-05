# ide_taller

## Reconocimiento de voz

El proyecto utiliza la API de Google Cloud Speech para transcribir audio en
español e inglés. En `utils/projectUtils.js` se configuran opciones avanzadas
como `useEnhanced`, `model: "latest_long"` y `enableAutomaticPunctuation` para
mejorar la precisión. Para que el reconocimiento funcione, asegúrate de que la
variable de entorno `GOOGLE_APPLICATION_CREDENTIALS` apunte a tu archivo de
credenciales de Google Cloud.
