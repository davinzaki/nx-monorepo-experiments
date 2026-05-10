import { Route } from '@angular/router';
import { authGuard } from '@aras-pro/shared/auth';

export const appRoutes: Route[] = [
  { path: '', redirectTo: 'leads', pathMatch: 'full' },
  {
    path: 'leads',
    // canActivate: [authGuard],
    loadComponent: () =>
      import('@aras-pro/sfa/feature-leads').then((m) => m.LeadsPageComponent),
  },
];
