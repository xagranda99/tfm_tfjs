import { Component, OnInit, OnDestroy } from '@angular/core';
import { CameraService } from '../services/camera.service';
import { InferenceService } from '../services/inference.service';
import * as tf from '@tensorflow/tfjs';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]

})
export class HomePage implements OnInit, OnDestroy {
  imageDataUrl: string | null = null;
  predictions: { className: string; probability: number }[] | null = null;
  private webcamInterval: any;

  constructor(
    private cameraService: CameraService,
    private inferenceService: InferenceService
  ) {}

  async ngOnInit() {
    try {
      await this.inferenceService.loadModel();
    } catch (error) {
      console.error('Error al inicializar el modelo:', error);
    }
  }

  async takePicture() {
    try {
      this.imageDataUrl = await this.cameraService.takePicture();
      const tensor = await this.inferenceService.preprocessImage(this.imageDataUrl);
      this.predictions = await this.inferenceService.predict(tensor);
      tensor.dispose();
    } catch (error) {
      console.error('Error al capturar o procesar la imagen:', error);
    }
  }

  async startWebcam() {
    try {
      const videoElement = document.getElementById('video') as HTMLVideoElement;
      const canvas = document.getElementById('canvas') as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');

      const webcam = await this.cameraService.setupWebcam(videoElement);
      videoElement.style.display = 'block';

      this.webcamInterval = setInterval(async () => {
        tf.engine().startScope();
        const predictions = await this.inferenceService.predictWebcamFrame(webcam);
        this.predictions = predictions;

        const img = await webcam.capture();
        ctx?.drawImage(img.toHTMLImageElement(), 0, 0, 224, 224);
        img.dispose();
        tf.engine().endScope();
      }, 100);
    } catch (error) {
      console.error('Error al iniciar la webcam:', error);
    }
  }

  async stopWebcam() {
    try {
      clearInterval(this.webcamInterval);
      await this.cameraService.stopWebcam();
      const videoElement = document.getElementById('video') as HTMLVideoElement;
      videoElement.style.display = 'none';
    } catch (error) {
      console.error('Error al detener la webcam:', error);
    }
  }

  ngOnDestroy() {
    this.stopWebcam();
    this.inferenceService.dispose();
  }
}