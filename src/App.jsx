// src/App.jsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LayoutPublico from './components/LayoutPublico';
import Acompanhar from './pages/Acompanhar';
import ComoFunciona from './pages/ComoFunciona';
import DenunciaEnviada from './pages/DenunciaEnviada';
import Inicio from './pages/Inicio';
import NaoEncontrada from './pages/NaoEncontrada';
import NovaDenuncia from './pages/NovaDenuncia';
import Transparencia from './pages/Transparencia';

// A área da ouvidoria é carregada à parte: quem denuncia não baixa o
// código de login nem o do painel.
const LoginOuvidoria = lazy(() => import('./pages/ouvidoria/LoginOuvidoria'));
const LayoutOuvidoria = lazy(() => import('./pages/ouvidoria/LayoutOuvidoria'));
const PainelOuvidoria = lazy(() => import('./pages/ouvidoria/PainelOuvidoria'));
const DetalheDenuncia = lazy(() => import('./pages/ouvidoria/DetalheDenuncia'));
const GerenciarMudancas = lazy(() => import('./pages/ouvidoria/GerenciarMudancas'));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<p className="carregando">Carregando…</p>}>
        <Routes>
          <Route element={<LayoutPublico />}>
            <Route index element={<Inicio />} />
            <Route path="como-funciona" element={<ComoFunciona />} />
            <Route path="denunciar" element={<NovaDenuncia />} />
            <Route path="denuncia/enviada" element={<DenunciaEnviada />} />
            <Route path="acompanhar" element={<Acompanhar />} />
            <Route path="transparencia" element={<Transparencia />} />
            <Route path="*" element={<NaoEncontrada />} />
          </Route>

          <Route path="ouvidoria/login" element={<LoginOuvidoria />} />
          {/* Só ouvidores entram: LayoutOuvidoria redireciona os demais */}
          <Route path="ouvidoria" element={<LayoutOuvidoria />}>
            <Route index element={<PainelOuvidoria />} />
            <Route path="denuncias/:protocolo" element={<DetalheDenuncia />} />
            <Route path="mudancas" element={<GerenciarMudancas />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
