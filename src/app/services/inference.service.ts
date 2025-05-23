import { Injectable } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

@Injectable({
  providedIn: 'root'
})
export class InferenceService {
  private model: cocoSsd.ObjectDetection | null = null;

  async loadModel() {
    try {
      this.model = await cocoSsd.load();
      console.log('Modelo COCO-SSD cargado correctamente');
    } catch (error) {
      console.error('Error al cargar el modelo:', error);
      throw error;
    }
  }

  async preprocessImage(imageDataUrl: string): Promise<HTMLImageElement> {
    try {
      const img = new Image();
      img.src = imageDataUrl;
      await img.decode();
      return img;
    } catch (error) {
      console.error('Error al preprocesar la imagen:', error);
      throw error;
    }
  }

  async predict(image: HTMLImageElement): Promise<cocoSsd.DetectedObject[]> {
    try {
      if (!this.model) throw new Error('Modelo no cargado');
      const predictions = await this.model.detect(image);
      console.log('Predicciones COCO-SSD:', predictions);
      return predictions;
    } catch (error) {
      console.error('Error al realizar la predicción:', error);
      throw error;
    }
  }

  async predictWebcamFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement): Promise<cocoSsd.DetectedObject[]> {
    try {
      if (!this.model) throw new Error('Modelo no cargado');
      const predictions = await this.model.detect(video);
      console.log('Predicciones en frame de webcam:', predictions);
      // Draw predictions on the canvas
      this.drawPredictions(predictions, video, canvas);
      return predictions;
    } catch (error) {
      console.error('Error al procesar el frame de la webcam:', error);
      throw error;
    }
  }

  private drawPredictions(predictions: cocoSsd.DetectedObject[], video: HTMLVideoElement, canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas size to video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw bounding boxes and labels
    predictions.forEach(prediction => {
      const [x, y, width, height] = prediction.bbox;
      const label = `${prediction.class} (${(prediction.score * 100).toFixed(2)}%)`;

      // Draw bounding box
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      // Draw label background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      const textWidth = ctx.measureText(label).width;
      ctx.fillRect(x, y - 20, textWidth + 10, 20);

      // Draw label text
      ctx.font = '14px Arial';
      ctx.fillStyle = '#00ff88';
      ctx.fillText(label, x + 5, y - 5);
    });
  }

  dispose() {
    tf.engine().startScope();
    tf.engine().endScope();
  }
}