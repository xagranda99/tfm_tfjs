import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CameraService } from '../services/camera.service';
import { InferenceService } from '../services/inference.service';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
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
  currentFacingMode: 'user' | 'environment' = 'environment';

  private previousPredictions: cocoSsd.DetectedObject[] = [];
  private readonly SMOOTHING_ALPHA = 0.1;
  private readonly CONFIDENCE_THRESHOLD = 0.5;
  private readonly MAX_BBOX_DISTANCE = 50;

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

  async pickImageFromGallery() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });
      this.imageDataUrl = image.dataUrl || null;

      if (this.imageDataUrl) {
        const img = await this.inferenceService.preprocessImage(this.imageDataUrl);
        this.predictions = await this.inferenceService.predict(img);

        const canvas = this.canvasElement.nativeElement;
        this.inferenceService.drawPredictionsOnImage(this.predictions, img, canvas);
      }

      this.isWebcamActive = false;
    } catch (error) {
      console.error('Error al seleccionar imagen de galería:', error);
    }
  }

  async startWebcam() {
    try {
      const videoElement = this.videoElement.nativeElement;
      await this.cameraService.setupWebcam(videoElement, this.currentFacingMode);
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
      if (this.cameraService.webcamStream) {
        this.cameraService.webcamStream.getTracks().forEach(track => track.stop());
        this.cameraService.webcamStream = null;
      }
      this.isWebcamActive = false;
      this.predictions = null;
      const canvas = this.canvasElement.nativeElement;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    } catch (error) {
      console.error('Error al detener la webcam:', error);
    }
  }

  async processWebcam() {
    if (!this.isWebcamActive) return;
    try {
      const video = this.videoElement.nativeElement;
      const canvas = this.canvasElement.nativeElement;
  
      const rawPredictions = await this.inferenceService.predictWebcamFrame(video, canvas);
      this.predictions = this.smoothPredictions(rawPredictions);
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

  async toggleCamera() {
    this.currentFacingMode = this.currentFacingMode === 'environment' ? 'user' : 'environment';
    await this.stopWebcam();
    await this.startWebcam();
  }

  async captureImage() {
    const video = this.videoElement.nativeElement;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const overlayCanvas = this.canvasElement.nativeElement;
    ctx.drawImage(overlayCanvas, 0, 0, canvas.width, canvas.height);

    const combinedImage = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = combinedImage;
    link.download = `captura_${Date.now()}.png`;
    link.click();

    this.imageDataUrl = combinedImage;
    this.isWebcamActive = false;
  }


private distanceBetweenBoxes(bbox1: [number, number, number, number], bbox2: [number, number, number, number]): number {
  const center1 = [bbox1[0] + bbox1[2] / 2, bbox1[1] + bbox1[3] / 2];
  const center2 = [bbox2[0] + bbox2[2] / 2, bbox2[1] + bbox2[3] / 2];
  return Math.hypot(center1[0] - center2[0], center1[1] - center2[1]);
}

private smoothPredictions(newPredictions: cocoSsd.DetectedObject[]): cocoSsd.DetectedObject[] {
  if (!this.previousPredictions.length) {
    this.previousPredictions = newPredictions.filter(p => p.score >= this.CONFIDENCE_THRESHOLD);
    return this.previousPredictions;
  }

  const smoothedPredictions: cocoSsd.DetectedObject[] = [];

  for (const newPred of newPredictions) {
    if (newPred.score < this.CONFIDENCE_THRESHOLD) continue;

    // Buscar predicción previa similar (misma clase y bbox cerca)
    const matchedPrev = this.previousPredictions.find(prev =>
      prev.class === newPred.class &&
      this.distanceBetweenBoxes(prev.bbox, newPred.bbox) < this.MAX_BBOX_DISTANCE
    );

    if (matchedPrev) {
      // Suavizar bbox
      const smoothBbox = newPred.bbox.map((coord, i) =>
        this.SMOOTHING_ALPHA * coord + (1 - this.SMOOTHING_ALPHA) * matchedPrev.bbox[i]
      ) as [number, number, number, number];

      // Suavizar score
      const smoothScore = this.SMOOTHING_ALPHA * newPred.score + (1 - this.SMOOTHING_ALPHA) * matchedPrev.score;

      smoothedPredictions.push({
        ...newPred,
        bbox: smoothBbox,
        score: smoothScore
      });
    } else {
      // No hay match previo, usamos la nueva predicción directamente
      smoothedPredictions.push(newPred);
    }
  }

  // Actualizamos el buffer para la siguiente iteración
  this.previousPredictions = smoothedPredictions;
  return smoothedPredictions;
}


  ngOnDestroy() {
    this.stopWebcam();
    this.inferenceService.dispose();
  }
}
