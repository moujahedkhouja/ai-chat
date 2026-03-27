import { Component, EventEmitter, Input, Output } from '@angular/core';
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
  @Input() imageChangedEvent: Event | null = null;
  @Output() cropped = new EventEmitter<Blob>();
  @Output() cancelled = new EventEmitter<void>();

  croppedImage: Blob | null = null;
  loading = true;

  imageCropped(event: ImageCroppedEvent) {
    if (event.blob) {
      this.croppedImage = event.blob;
    }
  }

  imageLoaded(image: LoadedImage) {
    this.loading = false;
  }

  cropperReady() {
    // cropper ready
  }

  loadImageFailed() {
    // show message
  }

  onSave() {
    if (this.croppedImage) {
      this.cropped.emit(this.croppedImage);
    }
  }

  onCancel() {
    this.cancelled.emit();
  }
}
