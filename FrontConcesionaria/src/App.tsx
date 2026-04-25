import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import VehiculosPage from './pages/vehiculos/VehiculosPage';
import VehiculoFormPage from './pages/vehiculos/VehiculoFormPage';
import VehiculoDetallePage from './pages/vehiculos/VehiculoDetallePage';
import ClientesPage from './pages/clientes/ClientesPage';
import ClienteDetallePage from './pages/clientes/ClienteDetallePage';
import VentasPage from './pages/ventas/VentasPage';
import PresupuestosPage from './pages/presupuestos/PresupuestosPage';
import ConcesionariasPage from './pages/concesionarias/ConcesionariasPage';
import SucursalesPage from './pages/sucursales/SucursalesPage';
import UsuariosPage from './pages/usuarios/UsuariosPage';
import ProveedoresPage from './pages/proveedores/ProveedoresPage';
import ProveedorDetallePage from './pages/proveedores/ProveedorDetallePage';
import IngresosPage from './pages/ingresos/IngresosPage';
import MovimientosPage from './pages/movimientos/MovimientosPage';
import ReservasPage from './pages/reservas/ReservasPage';
import ReservaDetallePage from './pages/reservas/ReservaDetallePage';
import GastosPage from './pages/gastos/GastosPage';
import GastosFijosPage from './pages/gastos-fijos/GastosFijosPage';
import FinanciacionesPage from './pages/financiaciones/FinanciacionesPage';
import FinanciacionExternaPage from './pages/solicitudes/FinanciacionExternaPage';
import PostventaPage from './pages/postventa/PostventaPage';
import AuditoriaPage from './pages/auditoria/AuditoriaPage';
import BillingPage from './pages/billing/BillingPage';
import ConfiguracionPage from './pages/configuracion/ConfiguracionPage';

function App() {
  return (
    <BrowserRouter>
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

            {/* Otros (Placeholders) */}
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
    </BrowserRouter>
  );
}

export default App;
