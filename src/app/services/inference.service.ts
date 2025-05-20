import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

@Injectable({
  providedIn: 'root'
})
export class InferenceService {
  private model: mobilenet.MobileNet | null = null;

  async loadModel() {
    try {
      this.model = await mobilenet.load();
      console.log('Modelo MobileNet cargado correctamente');
    } catch (error) {
      console.error('Error al cargar el modelo:', error);
      throw error;
    }
  }

  async preprocessImage(imageDataUrl: string): Promise<tf.Tensor3D> {
    try {
      const img = new Image();
      img.src = imageDataUrl;
      await img.decode();
      return tf.tidy(() => {
        const tensor = tf.browser.fromPixels(img)
          .resizeNearestNeighbor([224, 224])
          .toFloat()
          .div(tf.scalar(255)) as tf.Tensor3D; // Tipo Tensor3D, sin expandDims
        console.log('Tensor shape:', tensor.shape); // Debería ser [224, 224, 3]
        return tensor;
      });
    } catch (error) {
      console.error('Error al preprocesar la imagen:', error);
      throw error;
    }
  }

  async predict(tensor: tf.Tensor3D): Promise<any[]> {
    try {
      if (!this.model) throw new Error('Modelo no cargado');
      const predictions = await this.model.classify(tensor);
      console.log('Predicciones:', predictions);
      return predictions;
    } catch (error) {
      console.error('Error al realizar la predicción:', error);
      throw error;
    }
  }

  async predictWebcamFrame(webcam: any): Promise<any[]> {
    try {
      const img = await webcam.capture();
      const tensor = tf.tidy(() => {
        return img
          .resizeNearestNeighbor([224, 224])
          .toFloat()
          .div(tf.scalar(255)) as tf.Tensor3D; // Tipo Tensor3D, sin expandDims
      });
      img.dispose();
      return await this.predict(tensor);
    } catch (error) {
      console.error('Error al procesar el frame de la webcam:', error);
      throw error;
    }
  }

  dispose() {
    tf.engine().startScope();
    tf.engine().endScope();
  }
}