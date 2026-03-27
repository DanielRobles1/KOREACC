import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule),
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
  },
  {
    path: 'cfdis',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/cfdis/cfdis.module').then(m => m.CfdisModule),
  },
  {
    path: 'comparisons',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/comparisons/comparisons.module').then(m => m.ComparisonsModule),
  },
  {
    path: 'discrepancies',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/discrepancies/discrepancies.module').then(m => m.DiscrepanciesModule),
  },
  { path: '**', redirectTo: '/login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
