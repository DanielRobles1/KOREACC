import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CerKeyUploadComponent } from './cer-key-upload/cer-key-upload.component';
import { SelectorPeriodoModalComponent } from './components/selector-periodo-modal/selector-periodo-modal.component';

@NgModule({
  declarations: [CerKeyUploadComponent, SelectorPeriodoModalComponent],
  imports: [CommonModule, FormsModule, RouterModule],
  exports: [CommonModule, FormsModule, RouterModule, CerKeyUploadComponent, SelectorPeriodoModalComponent],
})
export class SharedModule {}
