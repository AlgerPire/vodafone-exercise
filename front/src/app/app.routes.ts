import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './core/auth.guard';
import { CustomerDetailPage } from './pages/admin/customer-detail';
import { CustomerListPage } from './pages/admin/customer-list';
import { AccountPage } from './pages/account/account';
import { CallbackPage } from './pages/callback/callback';
import { LoginPage } from './pages/login/login';
import { RegisterPage } from './pages/register/register';
import { SignedOutPage } from './pages/signed-out/signed-out';
import { VerifyEmailPage } from './pages/verify-email/verify-email';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'register', component: RegisterPage },
  { path: 'verify-email', component: VerifyEmailPage },
  { path: 'login', component: LoginPage },
  { path: 'callback', component: CallbackPage },
  { path: 'signed-out', component: SignedOutPage },
  { path: 'account', component: AccountPage, canActivate: [authGuard] },
  {
    path: 'admin/customers',
    component: CustomerListPage,
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'admin/customers/:id',
    component: CustomerDetailPage,
    canActivate: [authGuard, adminGuard],
  },
  { path: '**', redirectTo: 'login' },
];
