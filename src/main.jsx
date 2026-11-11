import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    console.error('ELITE CONTROL render error:', error);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', padding: '32px 20px', background: '#f7f4f7', color: '#30263a', fontFamily: 'system-ui, sans-serif' }}>
          <h1 style={{ color: '#8b2348' }}>ELITE CONTROL encontró un error</h1>
          <p>La aplicación sí abrió, pero ocurrió un error al mostrar la pantalla.</p>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e5dce7' }}>{String(this.state.error?.message || this.state.error)}</pre>
          <p>Envía esta pantalla a soporte para corregirlo.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </React.StrictMode>,
  );
} else {
  document.body.innerHTML = '<p style="padding:24px;font-family:system-ui">No se encontró el contenedor de ELITE CONTROL (#root).</p>';
}
