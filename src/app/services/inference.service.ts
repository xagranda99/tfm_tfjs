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
  
    const margin = 5; // margen en píxeles para que la caja sea más pequeña
  
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    predictions.forEach(prediction => {
      let [x, y, width, height] = prediction.bbox;
      if (x < margin) {
        width -= (margin - x);
        x = margin;
      }
      if (y < margin) {
        height -= (margin - y);
        y = margin;
      }
      if (x + width > canvas.width - margin) {
        width = canvas.width - margin - x;
      }
      if (y + height > canvas.height - margin) {
        height = canvas.height - margin - y;
      }
  
      width = width * 0.9;
      height = height * 0.9;
  
      if (width <= 0 || height <= 0) return;
  
      const label = `${prediction.class} (${(prediction.score * 100).toFixed(2)}%)`;
  
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
  
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      const textWidth = ctx.measureText(label).width;
      ctx.fillRect(x, y - 20, textWidth + 10, 20);
  
      ctx.font = '14px Arial';
      ctx.fillStyle = '#00ff88';
      ctx.fillText(label, x + 5, y - 5);
    });
  }

  drawPredictionsOnImage(predictions: cocoSsd.DetectedObject[], image: HTMLImageElement, canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
  
    const margin = 5;
    canvas.width = image.width;
    canvas.height = image.height;
  
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, image.width, image.height);

    predictions.forEach(prediction => {
      let [x, y, width, height] = prediction.bbox;
      if (x < margin) {
        width -= (margin - x);
        x = margin;
      }
      if (y < margin) {
        height -= (margin - y);
        y = margin;
      }
      if (x + width > canvas.width - margin) {
        width = canvas.width - margin - x;
      }
      if (y + height > canvas.height - margin) {
        height = canvas.height - margin - y;
      }
  
      width = width * 0.9;
      height = height * 0.9;
  
      if (width <= 0 || height <= 0) return;
  
      const label = `${prediction.class} (${(prediction.score * 100).toFixed(2)}%)`;
  
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, width, height);
  
      ctx.font = '35px Arial';
      ctx.textBaseline = 'top';
      const textWidth = ctx.measureText(label).width;
      const textHeight = 20;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(x, y - textHeight - 4, textWidth + 12, textHeight + 7);
  
      ctx.fillStyle = '#00ff88';
      ctx.fillText(label, x + 5, y - textHeight - 15);
    });
  }
  
  dispose() {
    tf.engine().startScope();
    tf.engine().endScope();
  }
}