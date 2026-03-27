import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { DiscrepanciesComponent } from './discrepancies.component';

@NgModule({
  declarations: [DiscrepanciesComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: DiscrepanciesComponent }]),
  ],
})
export class DiscrepanciesModule {}
