import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CameraService } from '../services/camera.service';
import { InferenceService } from '../services/inference.service';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
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
  @ViewChild('video', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas', { static: false }) canvasElement!: ElementRef<HTMLCanvasElement>;
  imageDataUrl: string | null = null;
  predictions: cocoSsd.DetectedObject[] | null = null;
  isWebcamActive: boolean = false;
  private animationFrameId: number | null = null;

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
      const img = await this.inferenceService.preprocessImage(this.imageDataUrl);
      this.predictions = await this.inferenceService.predict(img);
      this.isWebcamActive = false; // Hide video when capturing image
    } catch (error) {
      console.error('Error al capturar o procesar la imagen:', error);
    }
  }

  async startWebcam() {
    try {
      const videoElement = this.videoElement.nativeElement;
      await this.cameraService.setupWebcam(videoElement);
      this.isWebcamActive = true;
      this.processWebcam();
    } catch (error) {
      console.error('Error al iniciar la webcam:', error);
    }
  }

  async stopWebcam() {
    try {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      await this.cameraService.stopWebcam();
      this.isWebcamActive = false;
      this.predictions = null;
      const canvas = this.canvasElement.nativeElement;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    } catch (error) {
      console.error('Error al detener la webcam:', error);
    }
  }

  private async processWebcam() {
    if (!this.isWebcamActive) return;
    try {
      const video = this.videoElement.nativeElement;
      const canvas = this.canvasElement.nativeElement;
      this.predictions = await this.inferenceService.predictWebcamFrame(video, canvas);
      this.animationFrameId = requestAnimationFrame(() => this.processWebcam());
    } catch (error) {
      console.error('Error al procesar el frame de la webcam:', error);
      this.stopWebcam();
    }
  }

  async toggleWebcam() {
    if (this.isWebcamActive) {
      await this.stopWebcam();
    } else {
      await this.startWebcam();
    }
  }
  

  ngOnDestroy() {
    this.stopWebcam();
    this.inferenceService.dispose();
  }
}