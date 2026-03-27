import { Component, output, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageCropperComponent, ImageCroppedEvent, LoadedImage } from 'ngx-image-cropper';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-image-cropper-dialog',
  standalone: true,
  imports: [CommonModule, ImageCropperComponent, TranslateModule],
  templateUrl: './image-cropper-dialog.component.html',
  styleUrl: './image-cropper-dialog.component.scss'
})
export class ImageCropperDialogComponent {
  imageChangedEvent = input<Event | null>(null);
  cropped = output<Blob>();
  cancelled = output<void>();

  croppedImage = signal<Blob | null>(null);
  loading = signal(true);

  imageCropped(event: ImageCroppedEvent) {
    if (event.blob) {
      this.croppedImage.set(event.blob);
    }
  }

  imageLoaded(image: LoadedImage) {
    this.loading.set(false);
  }

  cropperReady() {
    // cropper ready
  }

  loadImageFailed() {
    // show message
  }

  onSave() {
    const blob = this.croppedImage();
    if (blob) {
      this.cropped.emit(blob);
    }
  }

  onCancel() {
    this.cancelled.emit();
  }
}
