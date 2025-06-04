import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CameraService } from '../services/camera.service';
import { InferenceService } from '../services/inference.service';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Media } from '@capacitor-community/media';

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

  isCapturedImage = false;
  capturedImageDataUrl: string | null = null;

  private previousPredictions: cocoSsd.DetectedObject[] = [];
  private readonly SMOOTHING_ALPHA = 0.1;
  private readonly CONFIDENCE_THRESHOLD = 0.5;
  private readonly MAX_BBOX_DISTANCE = 50;

  constructor(
    private cameraService: CameraService,
    private inferenceService: InferenceService
  ) { }

  async ngOnInit() {
    try {
      await this.inferenceService.loadModel();
    } catch (error) {
      console.error('Error al inicializar el modelo:', error);
    }
  }

  async ngAfterViewInit() {
    this.resetCaptureState()
    await this.startWebcam()
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
        const img = new Image();
        img.src = this.imageDataUrl;
        await new Promise((resolve) => {
          img.onload = () => resolve(true);
        });

        const canvas = this.canvasElement.nativeElement;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        const predictions = await this.inferenceService.predict(img);
        this.predictions = predictions;

        this.inferenceService.drawPredictionsOnImage(predictions, img, canvas);

        // Ahora obtenemos la imagen resultante con las predicciones
        this.capturedImageDataUrl = canvas.toDataURL('image/png');
        this.isCapturedImage = true;
        this.isWebcamActive = false;

        // Opcional: limpia la imagen "original"
        this.imageDataUrl = null;
      }

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
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const overlayCanvas = this.canvasElement.nativeElement;
    ctx.drawImage(overlayCanvas, 0, 0, canvas.width, canvas.height);
    this.capturedImageDataUrl = canvas.toDataURL('image/png');
    this.isCapturedImage = true;
    await this.stopWebcam();
  }

  async saveCapturedImage() {
    if (!this.capturedImageDataUrl) return;

    try {
      const base64Data = this.capturedImageDataUrl.replace('data:image/png;base64,', '');
      const fileName = `captura_${Date.now()}.png`;
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Data,
        recursive: true,
      });

      await Media.savePhoto({
        path: savedFile.uri
      });

      this.resetCaptureState();
      await this.startWebcam();

    } catch (error) {
      console.error('Error guardando imagen en galería:', error);
    }
  }


  async discardCapturedImage() {
    this.resetCaptureState();
    await this.startWebcam();
  }

  private resetCaptureState() {
    this.isCapturedImage = false;
    this.capturedImageDataUrl = null;
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
      const matchedPrev = this.previousPredictions.find(prev =>
        prev.class === newPred.class &&
        this.distanceBetweenBoxes(prev.bbox, newPred.bbox) < this.MAX_BBOX_DISTANCE
      );

      if (matchedPrev) {
        const smoothBbox = newPred.bbox.map((coord, i) =>
          this.SMOOTHING_ALPHA * coord + (1 - this.SMOOTHING_ALPHA) * matchedPrev.bbox[i]
        ) as [number, number, number, number];
        const smoothScore = this.SMOOTHING_ALPHA * newPred.score + (1 - this.SMOOTHING_ALPHA) * matchedPrev.score;
        smoothedPredictions.push({
          ...newPred,
          bbox: smoothBbox,
          score: smoothScore
        });
      } else {
        smoothedPredictions.push(newPred);
      }
    }
    this.previousPredictions = smoothedPredictions;
    return smoothedPredictions;
  }


  ngOnDestroy() {
    this.stopWebcam();
    this.inferenceService.dispose();
  }
}
