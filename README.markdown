# TFM: Comparativa de Librerías para Procesamiento de Imágenes en Tiempo Real con Ionic/Angular

Nombre: Xavier Alejandro Granda Paz
Master: Desarrollo de Software para Dispositivos Móviles
Universidad de Alicante

## Descripción
Este proyecto, desarrollado como Trabajo Fin de Máster (TFM), implementa una aplicación híbrida basada en **Ionic y Angular** para procesar imágenes y video en tiempo real utilizando la cámara de dispositivos móviles y de escritorio. El objetivo principal es realizar una comparativa de librerías de machine learning, con un enfoque en **TensorFlow.js** y su modelo preentrenado **MobileNet**, evaluando su rendimiento, facilidad de integración y precisión para tareas de clasificación de imágenes en aplicaciones híbridas.

El proyecto incluye:
- Captura de imágenes y video en tiempo real usando el plugin **Capacitor Camera**.
- Procesamiento de imágenes con TensorFlow.js y MobileNet para clasificación de objetos.
- Evaluación de métricas como latencia, consumo de memoria y precisión en navegadores y dispositivos móviles.
- Comparativa con otras librerías de machine learning (por ejemplo, ONNX.js, MediaPipe) en términos de usabilidad, compatibilidad y rendimiento.

## Tecnologías Utilizadas
- **Ionic 7**: Framework para desarrollo de aplicaciones híbridas.
- **Angular 18**: Framework frontend para la estructura de la aplicación.
- **Capacitor**: Plugin para acceder a funcionalidades nativas como la cámara.
- **TensorFlow.js**: Librería de machine learning para procesamiento de imágenes en el navegador y dispositivos móviles.
- **MobileNet**: Modelo preentrenado para clasificación de imágenes.
- **Git**: Control de versiones, con el repositorio alojado en GitHub.

## Instalación
### Prerrequisitos
- Node.js (versión 18 o superior)
- Ionic CLI: `npm install -g @ionic/cli`
- Git: [Descargar](https://git-scm.com/downloads)

### Pasos
1. Clona el repositorio:
   ```bash
   git clone https://github.com/xagranda99/tfm_tfjs.git
   cd tfm-tfjs
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. (Opcional) Si usas un modelo personalizado, coloca los archivos `model.json` y `.bin` en `src/assets/model/`.
4. Ejecuta la aplicación en el navegador:
   ```bash
   ionic serve
   ```
5. Para probar en dispositivos móviles:
   ```bash
   ionic cap add android
   ionic cap run android --livereload
   ```
   O para iOS:
   ```bash
   ionic cap add ios
   ionic cap run ios
   ```

## Uso
1. **Captura de Imágenes**: Usa el botón "Capturar Imagen" para tomar una foto con la cámara y clasificar el objeto usando MobileNet.
2. **Video en Tiempo Real**: Haz clic en "Iniciar Video" para procesar frames de video en tiempo real y mostrar las predicciones.
3. **Resultados**: Las predicciones (clases y probabilidades) se muestran en una lista en la interfaz.

## Estructura del Proyecto
```
tfm-tfjs/
├── src/
│   ├── app/
│   │   ├── services/
│   │   │   ├── camera.service.ts  # Gestión de la cámara con Capacitor
│   │   │   ├── inference.service.ts  # Procesamiento con TensorFlow.js y MobileNet
│   │   ├── home/
│   │   │   ├── home.page.ts  # Componente principal
│   │   │   ├── home.page.html  # Interfaz de usuario
│   │   │   ├── home.page.scss  # Estilos
│   ├── assets/
│   │   ├── model/  # Archivos de modelo personalizado (opcional)
├── .gitignore  # Excluye node_modules, dist, etc.
├── package.json  # Dependencias y scripts
```

## Comparativa de Librerías
El TFM evalúa **TensorFlow.js** frente a otras librerías de machine learning para aplicaciones híbridas:
- **TensorFlow.js**: 
  - Pros: Fácil integración en navegadores, soporte para modelos preentrenados como MobileNet, buena documentación.
  - Contras: Mayor consumo de recursos en dispositivos de baja potencia, requiere optimización para tiempo real.
- **ONNX.js** (ejemplo, reemplazar con librería usada):
  - Pros: Buena optimización para modelos ONNX, menor latencia en ciertos casos.
  - Contras: Menor soporte para modelos preentrenados, curva de aprendizaje más pronunciada.
- **MediaPipe** (ejemplo, reemplazar con librería usada):
  - Pros: Optimizado para dispositivos móviles, baja latencia.
  - Contras: Menor flexibilidad para modelos personalizados.
- **Métricas Evaluadas**:
  - Latencia de inferencia (FPS en video en tiempo real).
  - Consumo de memoria (gestión con `tf.tidy`).
  - Precisión de clasificación (comparada con ImageNet para MobileNet).
  - Facilidad de integración en Ionic/Angular.

## Resultados
- TensorFlow.js con MobileNet logra una clasificación precisa para objetos comunes en condiciones óptimas, con una latencia de ~100ms por frame en navegadores modernos.
- [Añadir resultados específicos de la comparativa, e.g., comparación con ONNX.js o MediaPipe].
- Limitaciones: La precisión depende de la calidad de la imagen y las condiciones de iluminación.

## Contribuciones
1. Clona el repositorio y crea una rama:
   ```bash
   git checkout -b mi-rama
   ```
2. Realiza cambios y haz un commit:
   ```bash
   git add .
   git commit -m "Descripción de los cambios"
   ```
3. Sube los cambios y crea un pull request:
   ```bash
   git push origin mi-rama
   ```

## Licencia
MIT License