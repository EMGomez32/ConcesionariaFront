import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import PageLoader from './components/ui/PageLoader';

// Login: eager (es la entrada antes de auth)
import LoginPage from './pages/auth/LoginPage';

// Resto de pages: lazy — un chunk por feature
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const VehiculosPage = lazy(() => import('./pages/vehiculos/VehiculosPage'));
const VehiculoFormPage = lazy(() => import('./pages/vehiculos/VehiculoFormPage'));
const VehiculoDetallePage = lazy(() => import('./pages/vehiculos/VehiculoDetallePage'));
const ClientesPage = lazy(() => import('./pages/clientes/ClientesPage'));
const ClienteDetallePage = lazy(() => import('./pages/clientes/ClienteDetallePage'));
const VentasPage = lazy(() => import('./pages/ventas/VentasPage'));
const PresupuestosPage = lazy(() => import('./pages/presupuestos/PresupuestosPage'));
const ConcesionariasPage = lazy(() => import('./pages/concesionarias/ConcesionariasPage'));
const SucursalesPage = lazy(() => import('./pages/sucursales/SucursalesPage'));
const UsuariosPage = lazy(() => import('./pages/usuarios/UsuariosPage'));
const ProveedoresPage = lazy(() => import('./pages/proveedores/ProveedoresPage'));
const ProveedorDetallePage = lazy(() => import('./pages/proveedores/ProveedorDetallePage'));
const IngresosPage = lazy(() => import('./pages/ingresos/IngresosPage'));
const MovimientosPage = lazy(() => import('./pages/movimientos/MovimientosPage'));
const ReservasPage = lazy(() => import('./pages/reservas/ReservasPage'));
const ReservaDetallePage = lazy(() => import('./pages/reservas/ReservaDetallePage'));
const GastosPage = lazy(() => import('./pages/gastos/GastosPage'));
const GastosFijosPage = lazy(() => import('./pages/gastos-fijos/GastosFijosPage'));
const FinanciacionesPage = lazy(() => import('./pages/financiaciones/FinanciacionesPage'));
const FinanciacionExternaPage = lazy(() => import('./pages/solicitudes/FinanciacionExternaPage'));
const PostventaPage = lazy(() => import('./pages/postventa/PostventaPage'));
const AuditoriaPage = lazy(() => import('./pages/auditoria/AuditoriaPage'));
const BillingPage = lazy(() => import('./pages/billing/BillingPage'));
const ConfiguracionPage = lazy(() => import('./pages/configuracion/ConfiguracionPage'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />

              {/* Admin (Super Admin) */}
              <Route path="/concesionarias" element={<ConcesionariasPage />} />

              {/* Vehículos */}
              <Route path="/vehiculos" element={<VehiculosPage />} />
              <Route path="/vehiculos/nuevo" element={<VehiculoFormPage />} />
              <Route path="/vehiculos/:id/editar" element={<VehiculoFormPage />} />
              <Route path="/vehiculos/:id" element={<VehiculoDetallePage />} />

              {/* Clientes */}
              <Route path="/clientes" element={<ClientesPage />} />
              <Route path="/clientes/:id" element={<ClienteDetallePage />} />

              {/* Operaciones */}
              <Route path="/presupuestos" element={<PresupuestosPage />} />
              <Route path="/ventas" element={<VentasPage />} />

              {/* Empresa y Usuarios */}
              <Route path="/sucursales" element={<SucursalesPage />} />
              <Route path="/usuarios" element={<UsuariosPage />} />

              {/* Proveedores */}
              <Route path="/proveedores" element={<ProveedoresPage />} />
              <Route path="/proveedores/:id" element={<ProveedorDetallePage />} />

              {/* Ingresos y Movimientos */}
              <Route path="/ingresos" element={<IngresosPage />} />
              <Route path="/movimientos" element={<MovimientosPage />} />

              {/* Reservas */}
              <Route path="/reservas" element={<ReservasPage />} />
              <Route path="/reservas/:id" element={<ReservaDetallePage />} />

              {/* Gastos de vehículos */}
              <Route path="/gastos" element={<GastosPage />} />

              {/* Gastos fijos operativos */}
              <Route path="/gastos-fijos" element={<GastosFijosPage />} />

              {/* Otros */}
              <Route path="/financiaciones" element={<FinanciacionesPage />} />
              <Route path="/solicitudes" element={<FinanciacionExternaPage />} />
              <Route path="/postventa" element={<PostventaPage />} />
              <Route path="/auditoria" element={<AuditoriaPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/configuracion" element={<ConfiguracionPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
