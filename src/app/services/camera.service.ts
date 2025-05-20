import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import * as tf from '@tensorflow/tfjs';

@Injectable({
  providedIn: 'root'
})
export class CameraService {
  webcam: any;

  async takePicture(): Promise<string> {
    const image = await Camera.getPhoto({
      quality: 80,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera
    });
    return image.dataUrl || "";
  }

  async setupWebcam(videoElement: HTMLVideoElement): Promise<any> {
    this.webcam = await tf.data.webcam(videoElement);
    return this.webcam;
  }

  async stopWebcam() {
    if (this.webcam) {
      this.webcam.stop();
    }
  }
}