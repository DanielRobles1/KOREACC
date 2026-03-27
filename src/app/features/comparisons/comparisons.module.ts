import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ComparisonsComponent } from './comparisons.component';

@NgModule({
  declarations: [ComparisonsComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([{ path: '', component: ComparisonsComponent }]),
  ],
})
export class ComparisonsModule {}
