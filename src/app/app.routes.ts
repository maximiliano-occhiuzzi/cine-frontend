import { Routes } from '@angular/router';
import { CarteleraComponent } from './pages/cartelera/cartelera.component';
import { CandyComponent } from './pages/candy/candy.component';
import { MapaAsientosComponent } from './pages/mapa-asientos/mapa-asientos.component';
import { LoginComponent } from './pages/login/login.component';
import { RegistroComponent } from './pages/registro/registro.component';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { HistorialComponent } from './pages/historial/historial.component';
import { AdminPeliculasComponent } from './pages/admin-peliculas/admin-peliculas.component';
import { AdminConfiteriaComponent } from './pages/admin-confiteria/admin-confiteria.component';
import { AdminSalasComponent } from './pages/admin-salas/admin-salas.component';
import { AdminFuncionesComponent } from './pages/admin-funciones/admin-funciones.component';
import { AdminUsuariosComponent } from './pages/admin-usuarios/admin-usuarios.component';
import { AdminVentasComponent } from './pages/admin-ventas/admin-ventas.component';
import { adminGuard } from './core/guards/admin.guard';
import { gestionGuard } from './core/guards/gestion.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'cartelera', pathMatch: 'full' },
  { path: 'cartelera', component: CarteleraComponent },
  { path: 'candy', component: CandyComponent },
  { path: 'mapa-asientos/:salaId', component: MapaAsientosComponent },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  // Comprar y ver "Mis compras" necesitan sesion iniciada -antes se podia
  // entrar por URL directa sin loguearse (ver nota en authGuard).
  { path: 'checkout', component: CheckoutComponent, canActivate: [authGuard] },
  { path: 'historial', component: HistorialComponent, canActivate: [authGuard] },
  { path: 'admin/peliculas', component: AdminPeliculasComponent, canActivate: [adminGuard] },
  { path: 'admin/confiteria', component: AdminConfiteriaComponent, canActivate: [adminGuard] },
  { path: 'admin/salas', component: AdminSalasComponent, canActivate: [adminGuard] },
  { path: 'admin/funciones', component: AdminFuncionesComponent, canActivate: [adminGuard] },
  { path: 'admin/usuarios', component: AdminUsuariosComponent, canActivate: [adminGuard] },
  // ADMIN y EMPLEADO (ver nota en gestionGuard) — igual que el back,
  // que deja /ventas/** en hasAnyRole("ADMIN","EMPLEADO").
  { path: 'admin/ventas', component: AdminVentasComponent, canActivate: [gestionGuard] },
  { path: '**', redirectTo: 'cartelera' }
];
