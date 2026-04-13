import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ComparisonsComponent } from './comparisons.component';
import { ComparisonSessionsComponent } from './sessions/comparison-sessions.component';

@NgModule({
  declarations: [ComparisonsComponent, ComparisonSessionsComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([
      { path: '', component: ComparisonsComponent },
      { path: 'sessions', component: ComparisonSessionsComponent },
    ]),
  ],
})
export class ComparisonsModule {}
