import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import * as tf from '@tensorflow/tfjs';

@Injectable({
  providedIn: 'root'
})
export class CameraService {
  webcam: any;
  webcamStream: MediaStream;

  async takePicture(): Promise<string> {
    const image = await Camera.getPhoto({
      quality: 80,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera
    });
    return image.dataUrl || "";
  }

  async setupWebcam(videoElement: HTMLVideoElement, facingMode: 'user' | 'environment' = 'environment'): Promise<MediaStream> {
    if (this.webcam) {
      this.webcam.stop();
      this.webcam = null;
    }
  
    const constraints = {
      video: {
        facingMode: facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
        aspectRatio: 16 / 9
      }
    };
  
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = stream;
    await videoElement.play();
  
    // Guardar referencia del stream para detenerlo después
    this.webcamStream = stream;
  
    return stream;
  }

  async stopWebcam() {
    if (this.webcam) {
      this.webcam.stop();
    }
  }
}