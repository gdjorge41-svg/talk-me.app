import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Users, CreditCard, Clock, AlertTriangle, ShieldCheck, Globe, Key, BarChart2, Coins, Star, Download, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './index.css';

// Configuración de API
// TODO: Cambiar a la URL real de tu Aruba cuando lo subas
const API_URL = 'https://www.talk-me.app/talkme_api.php'; 
const API_KEY = 'HERMES_CADUCEUS_V70_ELITE_PRO';

function App() {
  const [data, setData] = useState({
    kpis: { users: 0, active_licenses: 0, total_sales: 0, total_usage_mins: 0 },
    licenses: [],
    locations: [],
    unlicensed_users: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartPeriod, setChartPeriod] = useState('mensual');
  const [chartOffset, setChartOffset] = useState(0);
  const [customDateRange, setCustomDateRange] = useState(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 29);
    return {
      start: thirtyDaysAgo.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    };
  });
  const [chartMetric, setChartMetric] = useState('ventas');
  const [telemetryPage, setTelemetryPage] = useState(1);
  const [licensePage, setLicensePage] = useState(1);
  const [unlicensedPage, setUnlicensedPage] = useState(1);
  const [invoicePage, setInvoicePage] = useState(1);
  const [activeTab, setActiveTab] = useState('telemetry');
  const [invoices, setInvoices] = useState([]);
  const itemsPerPage = 10;

  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);

  const handleSort = (field) => {
    if (sortField !== field) {
      setSortField(field);
      setSortDirection('desc');
    } else {
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else {
        setSortField(null);
        setSortDirection(null);
      }
    }
    setTelemetryPage(1);
  };

  const renderHeader = (label, field, extraStyles = {}, extraTitle = null) => {
    const isSorted = sortField === field;
    const icon = isSorted ? (sortDirection === 'desc' ? ' ↓' : ' ↑') : '';
    return (
      <th 
        className="sortable" 
        onClick={() => handleSort(field)} 
        style={extraStyles} 
        title={extraTitle || undefined}
      >
        {label}{icon}
      </th>
    );
  };

  // Helper para obtener el texto del periodo activo mostrado al usuario
  const getPeriodLabel = () => {
    const now = new Date();
    if (chartPeriod === 'diario') {
      const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + chartOffset);
      if (chartOffset === 0) return 'Hoy (' + target.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) + ')';
      if (chartOffset === -1) return 'Ayer (' + target.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) + ')';
      return target.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    } else if (chartPeriod === 'semanal') {
      const currentMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7) + (chartOffset * 7));
      const currentSunday = new Date(currentMonday.getFullYear(), currentMonday.getMonth(), currentMonday.getDate() + 6);
      if (chartOffset === 0) return `Esta semana (${currentMonday.getDate()} ${currentMonday.toLocaleString('es-ES', { month: 'short' })} - ${currentSunday.getDate()} ${currentSunday.toLocaleString('es-ES', { month: 'short' })})`;
      if (chartOffset === -1) return `Semana pasada (${currentMonday.getDate()} ${currentMonday.toLocaleString('es-ES', { month: 'short' })} - ${currentSunday.getDate()} ${currentSunday.toLocaleString('es-ES', { month: 'short' })})`;
      return `${currentMonday.getDate()} ${currentMonday.toLocaleString('es-ES', { month: 'short' })} - ${currentSunday.getDate()} ${currentSunday.toLocaleString('es-ES', { month: 'short' })}`;
    } else if (chartPeriod === 'mensual') {
      const target = new Date(now.getFullYear(), now.getMonth() + chartOffset, 1);
      const monthName = target.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
      return monthName.charAt(0).toUpperCase() + monthName.slice(1);
    } else if (chartPeriod === 'anual') {
      const targetYear = now.getFullYear() + chartOffset;
      return `Año ${targetYear}`;
    } else if (chartPeriod === 'personalizado') {
      return `${customDateRange.start} al ${customDateRange.end}`;
    }
    return '';
  };

  const processChartData = () => {
    const isVentas = chartMetric === 'ventas';
    const items = isVentas ? (data.licenses || []) : (data.sessions || []);
    const now = new Date();
    const grouped = {};
    let result = [];

    if (chartPeriod === 'diario') {
      // Día objetivo seguro
      const targetDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + chartOffset);
      const startOfDay = new Date(targetDay.getFullYear(), targetDay.getMonth(), targetDay.getDate(), 0, 0, 0, 0).getTime();
      const endOfDay = new Date(targetDay.getFullYear(), targetDay.getMonth(), targetDay.getDate(), 23, 59, 59, 999).getTime();

      // Inicializar las 24 horas
      for (let h = 0; h < 24; h++) {
        const hourStr = `${h.toString().padStart(2, '0')}:00`;
        grouped[hourStr] = 0;
      }

      items.forEach(item => {
        if (!item || !item.created_at) return;
        const date = new Date(item.created_at);
        const time = date.getTime();
        if (isNaN(time)) return;

        if (time >= startOfDay && time <= endOfDay) {
          const hourStr = `${date.getHours().toString().padStart(2, '0')}:00`;
          if (grouped[hourStr] !== undefined) {
            grouped[hourStr] += 1;
          }
        }
      });

      result = Object.keys(grouped).map(k => ({ name: k, [chartMetric]: grouped[k] }));

    } else if (chartPeriod === 'semanal') {
      // Semana de Lunes a Domingo según chartOffset
      const mondayOffset = ((now.getDay() + 6) % 7);
      const targetMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset + (chartOffset * 7), 0, 0, 0, 0);
      const targetSunday = new Date(targetMonday.getFullYear(), targetMonday.getMonth(), targetMonday.getDate() + 6, 23, 59, 59, 999);
      const startOfPeriod = targetMonday.getTime();
      const endOfPeriod = targetSunday.getTime();

      // Días ordenados de Lunes a Domingo con su fecha real
      const weekDays = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(targetMonday.getFullYear(), targetMonday.getMonth(), targetMonday.getDate() + i);
        const dayLabel = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
        weekDays.push({ key: d.toDateString(), label: dayLabel });
        grouped[d.toDateString()] = 0;
      }

      items.forEach(item => {
        if (!item || !item.created_at) return;
        const date = new Date(item.created_at);
        const time = date.getTime();
        if (isNaN(time)) return;

        if (time >= startOfPeriod && time <= endOfPeriod) {
          const dateKey = date.toDateString();
          if (grouped[dateKey] !== undefined) {
            grouped[dateKey] += 1;
          }
        }
      });

      result = weekDays.map(wd => ({ name: wd.label, [chartMetric]: grouped[wd.key] || 0 }));

    } else if (chartPeriod === 'mensual') {
      // Mes objetivo seguro (1er día del mes para evitar desbordes de 31 a 28)
      const targetMonthDate = new Date(now.getFullYear(), now.getMonth() + chartOffset, 1);
      const targetYear = targetMonthDate.getFullYear();
      const targetMonth = targetMonthDate.getMonth();
      const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
      const monthShort = targetMonthDate.toLocaleString('es-ES', { month: 'short' });

      for (let d = 1; d <= daysInTargetMonth; d++) {
        const dayStr = `${d} ${monthShort}`;
        grouped[dayStr] = 0;
      }

      items.forEach(item => {
        if (!item || !item.created_at) return;
        const date = new Date(item.created_at);
        if (isNaN(date.getTime())) return;

        if (date.getMonth() === targetMonth && date.getFullYear() === targetYear) {
          const dayStr = `${date.getDate()} ${monthShort}`;
          if (grouped[dayStr] !== undefined) {
            grouped[dayStr] += 1;
          }
        }
      });

      result = Object.keys(grouped).map(k => ({ name: k, [chartMetric]: grouped[k] }));

    } else if (chartPeriod === 'anual') {
      const targetYear = now.getFullYear() + chartOffset;
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      months.forEach(m => {
        grouped[m] = 0;
      });

      items.forEach(item => {
        if (!item || !item.created_at) return;
        const date = new Date(item.created_at);
        if (isNaN(date.getTime())) return;

        if (date.getFullYear() === targetYear) {
          const monthName = months[date.getMonth()];
          if (grouped[monthName] !== undefined) {
            grouped[monthName] += 1;
          }
        }
      });

      result = months.map(m => ({ name: m, [chartMetric]: grouped[m] || 0 }));

    } else if (chartPeriod === 'personalizado') {
      // Rango personalizado libre con defensa Ley de Murphy
      const rawStart = new Date(`${customDateRange.start}T00:00:00`);
      const rawEnd = new Date(`${customDateRange.end}T23:59:59.999`);

      const validStart = !isNaN(rawStart.getTime()) ? rawStart : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0);
      const validEnd = !isNaN(rawEnd.getTime()) ? rawEnd : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      const [startRange, endRange] = validStart.getTime() <= validEnd.getTime() 
        ? [validStart, validEnd] 
        : [validEnd, validStart];

      const diffDays = Math.max(1, Math.round((endRange.getTime() - startRange.getTime()) / (1000 * 60 * 60 * 24)));

      if (diffDays <= 62) {
        // Agrupación por DÍA
        const curr = new Date(startRange.getFullYear(), startRange.getMonth(), startRange.getDate());
        const daysMap = [];
        while (curr.getTime() <= endRange.getTime()) {
          const key = curr.toDateString();
          const label = curr.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
          daysMap.push({ key, label });
          grouped[key] = 0;
          curr.setDate(curr.getDate() + 1);
        }

        items.forEach(item => {
          if (!item || !item.created_at) return;
          const date = new Date(item.created_at);
          const time = date.getTime();
          if (isNaN(time)) return;
          if (time >= startRange.getTime() && time <= endRange.getTime()) {
            const key = date.toDateString();
            if (grouped[key] !== undefined) {
              grouped[key] += 1;
            }
          }
        });

        result = daysMap.map(d => ({ name: d.label, [chartMetric]: grouped[d.key] || 0 }));
      } else {
        // Rango mayor a 2 meses: Agrupación por MES para evitar saturar el eje X (Ley de Murphy M4)
        const curr = new Date(startRange.getFullYear(), startRange.getMonth(), 1);
        const monthsMap = [];
        while (curr.getTime() <= endRange.getTime()) {
          const key = `${curr.getFullYear()}-${curr.getMonth()}`;
          const label = curr.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
          monthsMap.push({ key, label });
          grouped[key] = 0;
          curr.setMonth(curr.getMonth() + 1);
        }

        items.forEach(item => {
          if (!item || !item.created_at) return;
          const date = new Date(item.created_at);
          const time = date.getTime();
          if (isNaN(time)) return;
          if (time >= startRange.getTime() && time <= endRange.getTime()) {
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            if (grouped[key] !== undefined) {
              grouped[key] += 1;
            }
          }
        });

        result = monthsMap.map(m => ({ name: m.label, [chartMetric]: grouped[m.key] || 0 }));
      }
    }

    return result;
  };

  const fetchMetrics = async () => {
    try {
      // Intentamos con la URL de producción si la local falla, pero por ahora usamos la definida
      const res = await axios.post(`${API_URL}?action=admin_metrics`, {}, {
        headers: { 'X-API-KEY': API_KEY },
        timeout: 10000 // 10 segundos de límite para evitar peticiones colgadas
      });
      if (res.data.success) {
        setData(res.data);
        setError(''); // ¡Limpiamos el mensaje de error si la conexión se ha recuperado con éxito!
      } else {
        setError(res.data.error || 'Error desconocido');
      }

      // Obtener lista de facturas
      const resInv = await axios.post(`${API_URL}?action=admin_list_invoices`, {}, {
        headers: { 'X-API-KEY': API_KEY },
        timeout: 10000
      });
      if (resInv.data.success) {
        setInvoices(resInv.data.invoices || []);
      }
    } catch (e) {
      setError('Error de conexión con la API de administración. ¿Está el servidor PHP encendido?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // Refrescar cada 30 segundos
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRevoke = async (licenseKey) => {
    if (!window.confirm(`⚠️ ¿ESTÁS SEGURO? Vas a revocar la licencia ${licenseKey}. El cliente perderá el acceso inmediatamente.`)) {
      return;
    }
    
    try {
      const res = await axios.post(`${API_URL}?action=admin_revoke_license`, { license_key: licenseKey }, {
        headers: { 'X-API-KEY': API_KEY }
      });
      
      if (res.data.success) {
        alert('✅ Licencia revocada con éxito.');
        fetchMetrics(); // Refrescar tabla
      } else {
        alert('❌ Error: ' + res.data.error);
      }
    } catch (e) {
      alert('❌ Error de red al intentar revocar.');
    }
  };

  const handleRestore = async (licenseKey) => {
    if (!window.confirm(`🔄 ¿Quieres reactivar la licencia ${licenseKey}? El cliente recuperará el acceso.`)) {
      return;
    }
    
    try {
      const res = await axios.post(`${API_URL}?action=admin_restore_license`, { license_key: licenseKey }, {
        headers: { 'X-API-KEY': API_KEY }
      });
      
      if (res.data.success) {
        alert('✅ Licencia reactivada con éxito.');
        fetchMetrics();
      } else {
        alert('❌ Error: ' + res.data.error);
      }
    } catch (e) {
      alert('❌ Error de red al intentar restaurar.');
    }
  };

  const handleUpdatePayment = async (licenseKey, currentPaid, totalPrice) => {
    const input = window.prompt(
      `💳 Corregir pago para licencia ${licenseKey}\n` +
      `Total del plan: ${totalPrice} €\n` +
      `Actualmente registrado: ${parseFloat(currentPaid).toFixed(2)} €\n\n` +
      `Introduce el importe correcto ya pagado (ej: 60.44 para la primera cuota Enterprise):`,
      parseFloat(currentPaid).toFixed(2)
    );
    if (input === null) return;
    const newAmount = parseFloat(input);
    if (isNaN(newAmount) || newAmount < 0) {
      alert('❌ Importe no válido.');
      return;
    }
    try {
      const res = await axios.post(`${API_URL}?action=admin_update_payment`, {
        license_key: licenseKey,
        total_paid: newAmount
      }, { headers: { 'X-API-KEY': API_KEY } });
      if (res.data.success) {
        alert(`✅ Pago actualizado a ${newAmount.toFixed(2)} € correctamente.`);
        fetchMetrics();
      } else {
        alert('❌ Error: ' + res.data.error);
      }
    } catch (e) {
      alert('❌ Error de red al actualizar pago.');
    }
  };

  // Base de datos de alta velocidad con coordenadas precargadas (0 ms de latencia)
  const STATIC_GEO = {
    // Ciudades España
    'vitoria': { coords: [42.8467, -2.6716], city: 'Vitoria-Gasteiz', region: 'País Vasco', country: 'España' },
    'gasteiz': { coords: [42.8467, -2.6716], city: 'Vitoria-Gasteiz', region: 'País Vasco', country: 'España' },
    'alava': { coords: [42.8467, -2.6716], city: 'Vitoria-Gasteiz', region: 'País Vasco', country: 'España' },
    'bilbao': { coords: [43.2630, -2.9350], city: 'Bilbao', region: 'País Vasco', country: 'España' },
    'vizcaya': { coords: [43.2630, -2.9350], city: 'Bilbao', region: 'País Vasco', country: 'España' },
    'bizkaia': { coords: [43.2630, -2.9350], city: 'Bilbao', region: 'País Vasco', country: 'España' },
    'san sebastian': { coords: [43.3183, -1.9812], city: 'Donostia-San Sebastián', region: 'País Vasco', country: 'España' },
    'donostia': { coords: [43.3183, -1.9812], city: 'Donostia-San Sebastián', region: 'País Vasco', country: 'España' },
    'guipuzcoa': { coords: [43.3183, -1.9812], city: 'Donostia-San Sebastián', region: 'País Vasco', country: 'España' },
    'gipuzkoa': { coords: [43.3183, -1.9812], city: 'Donostia-San Sebastián', region: 'País Vasco', country: 'España' },
    'madrid': { coords: [40.4168, -3.7038], city: 'Madrid', region: 'Comunidad de Madrid', country: 'España' },
    'barcelona': { coords: [41.3851, 2.1734], city: 'Barcelona', region: 'Cataluña', country: 'España' },
    'valencia': { coords: [39.4699, -0.3774], city: 'Valencia', region: 'Comunidad Valenciana', country: 'España' },
    'sevilla': { coords: [37.3891, -5.9845], city: 'Sevilla', region: 'Andalucía', country: 'España' },
    'malaga': { coords: [36.7213, -4.4214], city: 'Málaga', region: 'Andalucía', country: 'España' },
    'zaragoza': { coords: [41.6488, -0.8891], city: 'Zaragoza', region: 'Aragón', country: 'España' },
    'palma': { coords: [39.5696, 2.6502], city: 'Palma de Mallorca', region: 'Islas Baleares', country: 'España' },
    'mallorca': { coords: [39.5696, 2.6502], city: 'Palma de Mallorca', region: 'Islas Baleares', country: 'España' },
    'las palmas': { coords: [28.1235, -15.4363], city: 'Las Palmas', region: 'Canarias', country: 'España' },
    'tenerife': { coords: [28.4636, -16.2518], city: 'Santa Cruz de Tenerife', region: 'Canarias', country: 'España' },
    'alicante': { coords: [38.3452, -0.4810], city: 'Alicante', region: 'Comunidad Valenciana', country: 'España' },
    'cordoba': { coords: [37.8882, -4.7794], city: 'Córdoba', region: 'Andalucía', country: 'España' },
    'valladolid': { coords: [41.6523, -4.7245], city: 'Valladolid', region: 'Castilla y León', country: 'España' },
    'vigo': { coords: [42.2406, -8.7207], city: 'Vigo', region: 'Galicia', country: 'España' },
    'coruña': { coords: [43.3623, -8.4115], city: 'A Coruña', region: 'Galicia', country: 'España' },
    'oviedo': { coords: [43.3619, -5.8494], city: 'Oviedo', region: 'Asturias', country: 'España' },
    'gijon': { coords: [43.5322, -5.6611], city: 'Gijón', region: 'Asturias', country: 'España' },
    'santander': { coords: [43.4623, -3.8099], city: 'Santander', region: 'Cantabria', country: 'España' },
    'pamplona': { coords: [42.8125, -1.6458], city: 'Pamplona', region: 'Navarra', country: 'España' },
    'logroño': { coords: [42.4650, -2.4456], city: 'Logroño', region: 'La Rioja', country: 'España' },
    'murcia': { coords: [37.9922, -1.1307], city: 'Murcia', region: 'Región de Murcia', country: 'España' },
    'toledo': { coords: [39.8628, -4.0273], city: 'Toledo', region: 'Castilla-La Mancha', country: 'España' },
    'burgos': { coords: [42.3439, -3.6969], city: 'Burgos', region: 'Castilla y León', country: 'España' },
    'salamanca': { coords: [40.9701, -5.6635], city: 'Salamanca', region: 'Castilla y León', country: 'España' },
    'granada': { coords: [37.1773, -3.5986], city: 'Granada', region: 'Andalucía', country: 'España' },

    // Internacionales
    'mexico': { coords: [19.4326, -99.1332], city: 'Ciudad de México', region: 'CDMX', country: 'México' },
    'guadalajara': { coords: [20.6597, -103.3496], city: 'Guadalajara', region: 'Jalisco', country: 'México' },
    'monterrey': { coords: [25.6866, -100.3161], city: 'Monterrey', region: 'Nuevo León', country: 'México' },
    'bogota': { coords: [4.7110, -74.0721], city: 'Bogotá', region: 'Cundinamarca', country: 'Colombia' },
    'medellin': { coords: [6.2442, -75.5812], city: 'Medellín', region: 'Antioquia', country: 'Colombia' },
    'cali': { coords: [3.4516, -76.5320], city: 'Cali', region: 'Valle del Cauca', country: 'Colombia' },
    'buenos aires': { coords: [-34.6037, -58.3816], city: 'Buenos Aires', region: 'Buenos Aires', country: 'Argentina' },
    'cordoba, argentina': { coords: [-31.4201, -64.1888], city: 'Córdoba', region: 'Córdoba', country: 'Argentina' },
    'santiago': { coords: [-33.4489, -70.6693], city: 'Santiago', region: 'Región Metropolitana', country: 'Chile' },
    'lima': { coords: [-12.0464, -77.0428], city: 'Lima', region: 'Lima', country: 'Perú' },
    'quito': { coords: [-0.1807, -78.4678], city: 'Quito', region: 'Pichincha', country: 'Ecuador' },
    'caracas': { coords: [10.4806, -66.9036], city: 'Caracas', region: 'Distrito Capital', country: 'Venezuela' },
    'miami': { coords: [25.7617, -80.1918], city: 'Miami', region: 'Florida', country: 'Estados Unidos' },
    'new york': { coords: [40.7128, -74.0060], city: 'Nueva York', region: 'New York', country: 'Estados Unidos' },
    'los angeles': { coords: [34.0522, -118.2437], city: 'Los Ángeles', region: 'California', country: 'Estados Unidos' },
    'london': { coords: [51.5074, -0.1278], city: 'Londres', region: 'Inglaterra', country: 'Reino Unido' },
    'paris': { coords: [48.8566, 2.3522], city: 'París', region: 'Île-de-France', country: 'Francia' },
    'berlin': { coords: [52.5200, 13.4050], city: 'Berlín', region: 'Berlín', country: 'Alemania' },
    'rome': { coords: [41.9028, 12.4964], city: 'Roma', region: 'Lazio', country: 'Italia' },
    'tokyo': { coords: [35.6762, 139.6503], city: 'Tokio', region: 'Kantō', country: 'Japón' },

    // Fallbacks de Países
    'spain': { coords: [40.4637, -3.7492], city: 'España', region: 'España', country: 'España' },
    'españa': { coords: [40.4637, -3.7492], city: 'España', region: 'España', country: 'España' },
    'es': { coords: [40.4637, -3.7492], city: 'España', region: 'España', country: 'España' },
    'colombia': { coords: [4.5709, -74.2973], city: 'Colombia', region: 'Colombia', country: 'Colombia' },
    'co': { coords: [4.5709, -74.2973], city: 'Colombia', region: 'Colombia', country: 'Colombia' },
    'united states': { coords: [37.0902, -95.7129], city: 'Estados Unidos', region: 'EE.UU.', country: 'Estados Unidos' },
    'us': { coords: [37.0902, -95.7129], city: 'Estados Unidos', region: 'EE.UU.', country: 'Estados Unidos' },
    'usa': { coords: [37.0902, -95.7129], city: 'Estados Unidos', region: 'EE.UU.', country: 'Estados Unidos' }
  };

  // Caché de geolocalizaciones dinámicas
  const [dynamicGeoCache, setDynamicGeoCache] = useState(() => {
    try {
      const saved = localStorage.getItem('talkme_geo_cache');
      return saved ? JSON.parse(saved) : {};
    } catch(e) {
      return {};
    }
  });

  // Estado del nivel de zoom actual del mapa
  const [mapZoom, setMapZoom] = useState(2);

  // Geocodificación automática abierta e infinita (OSM Nominatim) para ciudades no registradas
  useEffect(() => {
    if (!data.locations || data.locations.length === 0) return;
    const missing = data.locations.filter(loc => {
      if (!loc || typeof loc !== 'string' || loc.trim() === '-' || loc.trim() === '') return false;
      const lower = loc.toLowerCase().trim();
      const inStatic = Object.keys(STATIC_GEO).some(k => lower.includes(k));
      const inDynamic = !!dynamicGeoCache[lower];
      return !inStatic && !inDynamic;
    });

    if (missing.length === 0) return;

    // Procesar ciudades desconocidas de forma secuencial y respetuosa
    const geocodeMissing = async () => {
      const newCache = { ...dynamicGeoCache };
      let updated = false;
      for (const loc of Array.from(new Set(missing))) {
        try {
          const lower = loc.toLowerCase().trim();
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(loc)}&limit=1`, {
            headers: { 'Accept-Language': 'es' }
          });
          const json = await res.json();
          if (json && json.length > 0) {
            const item = json[0];
            const parts = (item.display_name || loc).split(',').map(s => s.trim());
            const city = parts[0] || loc;
            const country = parts[parts.length - 1] || 'Global';
            const region = parts.length > 2 ? parts[parts.length - 2] : country;
            newCache[lower] = {
              coords: [parseFloat(item.lat), parseFloat(item.lon)],
              city: city,
              region: region,
              country: country
            };
            updated = true;
          }
        } catch (err) {
          console.warn('Geocodificación offline fallback para:', loc);
        }
      }
      if (updated) {
        setDynamicGeoCache(newCache);
        try {
          localStorage.setItem('talkme_geo_cache', JSON.stringify(newCache));
        } catch(e) {}
      }
    };

    geocodeMissing();
  }, [data.locations]);

  // Resolución de geoinformación completa
  const resolveGeoInfo = (locationStr) => {
    if (!locationStr || typeof locationStr !== 'string' || locationStr.trim() === '-' || locationStr.trim() === '') {
      return { coords: [40.4168, -3.7038], label: 'Desconocido', city: 'Desconocido', region: 'Global', country: 'Global' };
    }
    const clean = locationStr.toLowerCase().trim();

    // 1. Comprobar caché dinámica
    if (dynamicGeoCache[clean]) {
      return { ...dynamicGeoCache[clean], label: locationStr };
    }

    // 2. Comprobar base estática
    for (const [key, val] of Object.entries(STATIC_GEO)) {
      if (clean.includes(key)) {
        return { ...val, label: locationStr };
      }
    }

    // 3. Fallback determinista (Ley de Murphy: nunca rompe el render)
    let hash = 0;
    for (let i = 0; i < clean.length; i++) hash = clean.charCodeAt(i) + ((hash << 5) - hash);
    const lat = 40.0 + ((hash % 100) / 10);
    const lng = -3.0 + (((hash >> 3) % 100) / 10);
    return { coords: [lat, lng], label: locationStr, city: locationStr, region: 'Región Global', country: 'Global' };
  };

  const getCoordinates = (locationName) => {
    return resolveGeoInfo(locationName).coords;
  };

  if (loading) return (
    <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', margin: 0 }}>
      <svg className="infinity-loader" viewBox="0 0 100 50" width="160" height="80" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur1" />
            <feGaussianBlur stdDeviation="3.5" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path className="infinity-path" d="M 50 25 C 10 65, 10 -15, 50 25 C 90 65, 90 -15, 50 25" fill="none" stroke="url(#neonGradient)" strokeWidth="2.5" strokeLinecap="round" filter="url(#neonGlow)" />
      </svg>
    </div>
  );

  return (
    <div className="dashboard-container">
      <header className="header">
        <h1>
          <span className="logo-talk">Talk</span><span className="logo-sep">-</span><span className="logo-me">me</span>
          <span style={{fontWeight: 300, opacity: 0.5, marginLeft: '10px'}}>dashboard</span>
        </h1>
        <div className="status-badge">
          <div className="status-dot" style={{ background: error ? 'var(--danger)' : '#4CAF50', boxShadow: `0 0 8px ${error ? 'var(--danger)' : '#4CAF50'}` }}></div>
          Conectado a Aruba DB
        </div>
      </header>

      <div className="kpi-grid">
        <div className="glass-panel kpi-card">
          <h3><Coins size={18} /> Ingresos Totales</h3>
          <div className="value">
            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(data.kpis.total_sales_eur || 0)}
          </div>
        </div>
        <div className="glass-panel kpi-card">
          <h3><Star size={18} /> Ventas Totales</h3>
          <div className="value">{data.kpis.total_sales}</div>
        </div>
        <div className="glass-panel kpi-card">
          <h3><ShieldCheck size={18} /> Licencias Activas</h3>
          <div className="value">{data.kpis.active_licenses}</div>
        </div>
        <div className="glass-panel kpi-card">
          <h3><Users size={18} /> Usuarios Reg.</h3>
          <div className="value">{data.kpis.users}</div>
        </div>
        <div className="glass-panel kpi-card">
          <h3><Clock size={18} /> Minutos de Uso</h3>
          <div className="value">{data.kpis.total_usage_mins}</div>
        </div>
      </div>

      {/* Selector de Pestañas */}
      <div className="tabs-container" style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('telemetry')}
          style={{
            background: activeTab === 'telemetry' ? 'rgba(123, 104, 238, 0.25)' : 'rgba(255,255,255,0.02)',
            color: activeTab === 'telemetry' ? 'white' : 'rgba(255,255,255,0.6)',
            border: activeTab === 'telemetry' ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.05)',
            padding: '10px 20px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.3s ease'
          }}
        >
          📈 Telemetría y Licencias
        </button>
        <button 
          onClick={() => setActiveTab('invoices')}
          style={{
            background: activeTab === 'invoices' ? 'rgba(123, 104, 238, 0.25)' : 'rgba(255,255,255,0.02)',
            color: activeTab === 'invoices' ? 'white' : 'rgba(255,255,255,0.6)',
            border: activeTab === 'invoices' ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.05)',
            padding: '10px 20px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.3s ease'
          }}
        >
          📄 Facturas Emitidas
        </button>
      </div>

      {activeTab === 'telemetry' && (
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem', marginBottom: '2rem'}}>
          <div className="glass-panel chart-section">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <h2 className="section-title" style={{margin: 0}}><BarChart2 size={22} /> 
                  {chartMetric === 'ventas' ? 'Evolución de Ventas' : 'Evolución de Sesiones'}
                </h2>
                <div style={{display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '2px', border: '1px solid rgba(255,255,255,0.05)'}}>
                  <button
                    onClick={() => setChartMetric('ventas')}
                    style={{
                      background: chartMetric === 'ventas' ? 'rgba(123, 104, 238, 0.2)' : 'transparent',
                      color: chartMetric === 'ventas' ? 'white' : 'rgba(255,255,255,0.5)',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 600,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Ventas
                  </button>
                  <button
                    onClick={() => setChartMetric('sesiones')}
                    style={{
                      background: chartMetric === 'sesiones' ? 'rgba(123, 104, 238, 0.2)' : 'transparent',
                      color: chartMetric === 'sesiones' ? 'white' : 'rgba(255,255,255,0.5)',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 600,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Sesiones
                  </button>
                </div>
              </div>
              <div style={{display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px'}}>
                {/* Controles de Navegación de Periodo (‹ Anterior / Siguiente › / Hoy) */}
                {chartPeriod !== 'personalizado' ? (
                  <div style={{display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '2px 4px', border: '1px solid rgba(255,255,255,0.06)', gap: '4px'}}>
                    <button
                      onClick={() => setChartOffset(prev => prev - 1)}
                      title="Periodo anterior"
                      style={{
                        background: 'transparent',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <span 
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: chartOffset === 0 ? 'var(--accent)' : '#fff',
                        padding: '2px 8px',
                        minWidth: '110px',
                        textAlign: 'center',
                        userSelect: 'none'
                      }}
                    >
                      {getPeriodLabel()}
                    </span>

                    <button
                      onClick={() => setChartOffset(prev => Math.min(0, prev + 1))}
                      disabled={chartOffset >= 0}
                      title={chartOffset >= 0 ? 'Ya estás en el periodo actual' : 'Periodo siguiente'}
                      style={{
                        background: 'transparent',
                        color: chartOffset >= 0 ? 'rgba(255,255,255,0.2)' : 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: chartOffset >= 0 ? 'not-allowed' : 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <ChevronRight size={16} />
                    </button>

                    {chartOffset !== 0 && (
                      <button
                        onClick={() => setChartOffset(0)}
                        style={{
                          background: 'rgba(123, 104, 238, 0.2)',
                          color: 'var(--accent)',
                          border: '1px solid rgba(123, 104, 238, 0.4)',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          marginLeft: '2px',
                          transition: 'all 0.2s ease'
                        }}
                        title="Volver al periodo actual"
                      >
                        Actual
                      </button>
                    )}
                  </div>
                ) : (
                  /* Modo Rango Personalizado: Selectores Desde / Hasta */
                  <div style={{display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)'}}>
                    <Calendar size={14} style={{color: 'var(--accent)', opacity: 0.8}} />
                    <input 
                      type="date" 
                      value={customDateRange.start}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        padding: '3px 6px',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{fontSize: '11px', opacity: 0.5}}>-</span>
                    <input 
                      type="date" 
                      value={customDateRange.end}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        padding: '3px 6px',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                )}

                {/* Dropdown de Granularidad / Modo */}
                <select 
                  value={chartPeriod} 
                  onChange={(e) => {
                    setChartPeriod(e.target.value);
                    setChartOffset(0); // Reiniciar offset de navegación al cambiar periodo para evitar estados inconsistentes
                  }}
                  style={{background: 'var(--panel-bg)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600}}
                >
                  <option value="diario">Diario</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensual">Mensual</option>
                  <option value="anual">Anual</option>
                  <option value="personalizado">Personalizado...</option>
                </select>
              </div>
            </div>
            <div style={{ width: '100%', height: 300, marginTop: '20px', minWidth: 0, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={processChartData()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartMetric === 'ventas' ? 'var(--accent-secondary)' : 'var(--accent)'} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={chartMetric === 'ventas' ? 'var(--accent-secondary)' : 'var(--accent)'} stopOpacity={0}/>
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 12}} tickMargin={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.4)" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{background: 'rgba(21, 21, 34, 0.9)', border: '1px solid var(--panel-border)', borderRadius: '12px', backdropFilter: 'blur(8px)'}}
                    itemStyle={{color: chartMetric === 'ventas' ? 'var(--accent-secondary)' : 'var(--accent)', fontWeight: 'bold'}}
                  />
                  <Bar dataKey={chartMetric} fill="url(#colorMetric)" radius={[4, 4, 0, 0]} barSize={40} />
                  <Line type="monotone" dataKey={chartMetric} stroke="#fff" strokeWidth={3} filter="url(#glow)" dot={false} activeDot={{r: 6, fill: chartMetric === 'ventas' ? 'var(--accent-secondary)' : 'var(--accent)'}} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel map-section" style={{marginBottom: 0, display: 'flex', flexDirection: 'column'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem'}}>
              <h2 className="section-title" style={{margin: 0}}><Globe size={22} /> Monitor de Actividad Global</h2>
              <span style={{fontSize: '0.75rem', color: 'var(--accent)', background: 'rgba(102, 252, 241, 0.1)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(102, 252, 241, 0.2)'}}>
                {mapZoom <= 3 ? '🌍 Vista País / Global' : mapZoom <= 6 ? '🗺️ Vista Región' : '🏙️ Vista Ciudad / Local'}
              </span>
            </div>
            <div className="map-container" style={{flex: 1, minHeight: '300px'}}>
              <MapContainer center={[35, 0]} zoom={2} minZoom={1} maxZoom={18} style={{ height: '100%', width: '100%' }}>
                {/* Listener reactivo de eventos de zoom */}
                {React.createElement(() => {
                  useMapEvents({
                    zoomend: (e) => {
                      setMapZoom(e.target.getZoom());
                    }
                  });
                  return null;
                })}

                {/* Capa OSM 100% gratuita y sin API Key */}
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {/* Agrupación dinámica (Clustering) según nivel de zoom */}
                {(() => {
                  const clusters = {};
                  (data.locations || []).forEach(loc => {
                    const info = resolveGeoInfo(loc);
                    if (!info || !info.coords) return;

                    // Determinamos la clave de agrupación según el zoom
                    let clusterKey = '';
                    let clusterName = '';
                    let coords = info.coords;

                    if (mapZoom <= 3) {
                      // Zoom Mundial: Agrupar por País
                      clusterKey = `country_${info.country || 'Global'}`;
                      clusterName = info.country || 'Global';
                    } else if (mapZoom <= 6) {
                      // Zoom Regional: Agrupar por Comunidad / Región
                      clusterKey = `reg_${info.country}_${info.region || info.city}`;
                      clusterName = `${info.region || info.city}, ${info.country}`;
                    } else {
                      // Zoom Local: Agrupar por Ciudad exacta
                      clusterKey = `city_${info.city}_${coords[0]}_${coords[1]}`;
                      clusterName = `${info.city}, ${info.country}`;
                    }

                    if (!clusters[clusterKey]) {
                      clusters[clusterKey] = {
                        coords: coords,
                        displayName: clusterName,
                        cities: new Set(),
                        count: 0
                      };
                    }
                    clusters[clusterKey].count++;
                    clusters[clusterKey].cities.add(info.city || loc);
                  });

                  return Object.values(clusters).map((hotspot, idx) => {
                    const size = Math.min(54, Math.max(26, 20 + (hotspot.count * 3)));
                    const html = `<div class="hotspot-marker" style="width: ${size}px; height: ${size}px; font-size: ${size < 32 ? '11px' : '13px'};">${hotspot.count}</div>`;

                    return (
                      <Marker 
                        key={idx} 
                        position={hotspot.coords}
                        icon={new L.divIcon({
                          className: '',
                          html: html,
                          iconSize: [size, size],
                          iconAnchor: [size/2, size/2]
                        })}
                      >
                        <Popup>
                          <div style={{color: '#fff', fontSize: '0.85rem', lineHeight: '1.4'}}>
                            <div style={{fontWeight: 700, color: 'var(--accent-secondary)', marginBottom: '4px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px'}}>
                              📍 {hotspot.displayName}
                            </div>
                            <div style={{fontSize: '0.8rem', opacity: 0.9, marginBottom: '4px'}}>
                              <strong>Ciudades/Zonas:</strong> {Array.from(hotspot.cities).join(', ')}
                            </div>
                            <div style={{background: 'rgba(255, 107, 53, 0.15)', border: '1px solid rgba(255, 107, 53, 0.3)', borderRadius: '6px', padding: '2px 6px', color: '#ff8a50', display: 'inline-block', fontWeight: 600}}>
                              🔥 {hotspot.count} {hotspot.count === 1 ? 'sesión' : 'sesiones'}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  });
                })()}
              </MapContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'telemetry' && (
        <div className="glass-panel table-section">
          <h2 className="section-title"><Activity size={22} /> Historial de Sesiones (Telemetría)</h2>
          <div className="table-scroll-container">
            <table className="data-table" style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead style={{position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'var(--panel-bg)', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'}}>
                <tr>
                  {renderHeader('Conteo', 'conteo')}
                  {renderHeader('Fecha', 'fecha')}
                  {renderHeader('Usuario', 'usuario')}
                  {renderHeader('Min.', 'minutos')}
                  {renderHeader('Usr.', 'usuarios')}
                  {renderHeader('Subusr.', 'subusuarios')}
                  {renderHeader('Msgs', 'mensajes')}
                  {renderHeader('Txt', 'txt', {}, 'Mensajes de texto escritos')}
                  {renderHeader('Voz', 'voz', {}, 'Mensajes de voz reconocidos')}
                  {renderHeader('Fotos', 'fotos')}
                  {renderHeader('Filtros', 'filtros')}
                  {renderHeader('Triggers', 'triggers')}
                  {renderHeader('Hermes', 'hermes')}
                  {renderHeader('Traducciones', 'traduccion')}
                  {renderHeader('Idiomas', 'idiomas')}
                  {renderHeader('Ubic.', 'ubicacion')}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  if (!data.sessions || data.sessions.length === 0) {
                    return <tr><td colSpan="16" style={{textAlign: 'center', opacity: 0.5}}>No hay sesiones registradas.</td></tr>;
                  }
                  
                  // Calcular conteo de sesiones por usuario
                  const userCounts = {};
                  // Como las sesiones vienen en DESC (más recientes primero), las invertimos para contar cronológicamente
                  const reversedSessions = [...data.sessions].reverse().map(ses => {
                    if (!userCounts[ses.email]) userCounts[ses.email] = 0;
                    userCounts[ses.email]++;
                    return { ...ses, sessionIndex: userCounts[ses.email] };
                  });
   
                  // Preprocesar campos de cada sesión para ordenación consistente y retrocompatibilidad
                  const enrichedSessions = reversedSessions.map(ses => {
                    let sData = {};
                    try { sData = JSON.parse(ses.session_data || '{}'); } catch(e) {}
   
                    const usersConnected    = ses.users_connected    ?? sData.users_connected    ?? 0;
                    const subusersConnected = ses.subusers_connected  ?? sData.subusers_connected  ?? 0;
                    const filtersUsed       = ses.filters_used        ?? sData.filters_used        ?? 0;
                    const hermesMsgCount    = ses.hermes_msg_count    ?? sData.hermes_msg_count    ?? 0;
                    const photosTaken       = ses.photos_taken        ?? sData.photos_taken        ?? sData.photos_sent ?? 0;
                    const textMsgCount      = ses.text_msg_count      ?? sData.text_msg_count      ?? 0;
                    const audioMsgCount     = ses.audio_msg_count     ?? sData.audio_msg_count     ?? 0;
                    const location          = ses.location            ?? sData.location            ?? '-';
                    
                    const rawLangs          = ses.languages            ?? sData.languages           ?? [];
                    const langList = Array.isArray(rawLangs)
                      ? rawLangs
                      : (typeof rawLangs === 'string' && rawLangs.length > 0 ? rawLangs.split(',').map(l => l.trim()) : []);
   
                    const rawTrans          = ses.translations_used   ?? sData.translations_used   ?? [];
                    const transList = Array.isArray(rawTrans)
                      ? rawTrans
                      : (typeof rawTrans === 'string' && rawTrans.length > 0 ? rawTrans.split(',').map(l => l.trim()) : []);
   
                    return {
                      ...ses,
                      usersConnected,
                      subusersConnected,
                      filtersUsed,
                      hermesMsgCount,
                      photosTaken,
                      textMsgCount,
                      audioMsgCount,
                      location,
                      langList,
                      transList,
                      translationsCount: transList.length,
                      languagesCount: langList.length
                    };
                  });
                  
                  // Ordenar
                  let sortedSessions = [...enrichedSessions].reverse(); // Por defecto: más reciente primero (cronológico invertido)
                  
                  if (sortField && sortDirection) {
                    sortedSessions.sort((a, b) => {
                      let valA, valB;
                      switch (sortField) {
                        case 'conteo':
                          valA = a.sessionIndex;
                          valB = b.sessionIndex;
                          break;
                        case 'fecha':
                          valA = new Date(a.created_at).getTime();
                          valB = new Date(b.created_at).getTime();
                          break;
                        case 'usuario':
                          valA = ((a.first_name || '') + ' ' + (a.email || '')).toLowerCase();
                          valB = ((b.first_name || '') + ' ' + (b.email || '')).toLowerCase();
                          break;
                        case 'minutos':
                          valA = a.duration_mins || 0;
                          valB = b.duration_mins || 0;
                          break;
                        case 'usuarios':
                          valA = a.usersConnected;
                          valB = b.usersConnected;
                          break;
                        case 'subusuarios':
                          valA = a.subusersConnected;
                          valB = b.subusersConnected;
                          break;
                        case 'filtros':
                          valA = a.filtersUsed;
                          valB = b.filtersUsed;
                          break;
                        case 'mensajes':
                          valA = a.msg_count || 0;
                          valB = b.msg_count || 0;
                          break;
                        case 'triggers':
                          valA = a.trigger_count || 0;
                          valB = b.trigger_count || 0;
                          break;
                        case 'hermes':
                          valA = a.hermesMsgCount;
                          valB = b.hermesMsgCount;
                          break;
                        case 'fotos':
                          valA = a.photosTaken;
                          valB = b.photosTaken;
                          break;
                        case 'txt':
                          valA = a.textMsgCount;
                          valB = b.textMsgCount;
                          break;
                        case 'voz':
                          valA = a.audioMsgCount;
                          valB = b.audioMsgCount;
                          break;
                        case 'traduccion':
                          valA = a.translationsCount;
                          valB = b.translationsCount;
                          break;
                        case 'idiomas':
                          valA = a.languagesCount;
                          valB = b.languagesCount;
                          break;
                        case 'ubicacion':
                          valA = (a.location || '').toLowerCase();
                          valB = (b.location || '').toLowerCase();
                          break;
                        default:
                          valA = 0;
                          valB = 0;
                      }
   
                      if (typeof valA === 'string' && typeof valB === 'string') {
                        return sortDirection === 'asc' 
                          ? valA.localeCompare(valB) 
                          : valB.localeCompare(valA);
                      } else {
                        return sortDirection === 'asc' 
                          ? (valA > valB ? 1 : valA < valB ? -1 : 0) 
                          : (valB > valA ? 1 : valB < valA ? -1 : 0);
                      }
                    });
                  }
   
                  // Paginación
                  const startIdx = (telemetryPage - 1) * itemsPerPage;
                  const paginatedSessions = sortedSessions.slice(startIdx, startIdx + itemsPerPage);
   
                  // Calcular máximos globales para la lógica del semáforo (heatmap)
                  const maxDuration = Math.max(...data.sessions.map(s => s.duration_mins || 0), 1);
                  const maxUsers = Math.max(...data.sessions.map(s => s.users_connected || 0), 1);
                  const maxSubusers = Math.max(...data.sessions.map(s => s.subusers_connected || 0), 1);
                  const maxFilters = Math.max(...data.sessions.map(s => s.filters_used || 0), 1);
                  const maxMsgs = Math.max(...data.sessions.map(s => s.msg_count || 0), 1);
                  const maxTriggers = Math.max(...data.sessions.map(s => s.trigger_count || 0), 1);
                  const maxHermes = Math.max(...data.sessions.map(s => {
                    let sD = {};
                    try { sD = JSON.parse(s.session_data || '{}'); } catch(e) {}
                    return s.hermes_msg_count ?? sD.hermes_msg_count ?? 0;
                  }), 1);
                  const maxPhotos = Math.max(...data.sessions.map(s => {
                    let sD = {};
                    try { sD = JSON.parse(s.session_data || '{}'); } catch(e) {}
                    return s.photos_taken ?? sD.photos_taken ?? sD.photos_sent ?? 0;
                  }), 1);
                  const maxTextMsgs = Math.max(...data.sessions.map(s => s.text_msg_count || 0), 1);
                  const maxAudioMsgs = Math.max(...data.sessions.map(s => s.audio_msg_count || 0), 1);
   
                  // Calcular ranking de usuarios por cantidad total de sesiones
                  const totalSessionsPerUser = {};
                  data.sessions.forEach(s => {
                    totalSessionsPerUser[s.email] = (totalSessionsPerUser[s.email] || 0) + 1;
                  });
                  const sortedUsers = Object.entries(totalSessionsPerUser)
                    .sort((a, b) => b[1] - a[1]);
                  const goldUser = sortedUsers[0] ? sortedUsers[0][0] : null;
                  const silverUser = sortedUsers[1] ? sortedUsers[1][0] : null;
                  const bronzeUser = sortedUsers[2] ? sortedUsers[2][0] : null;
   
                  const getHeatmapColor = (value, maxVal) => {
                    if (!maxVal) return 'rgba(255, 255, 255, 0.85)';
                    const ratio = Math.min(1, value / maxVal);
                    const hue = Math.round(120 - (ratio * 120));
                    return `hsl(${hue}, 55%, 75%)`;
                  };
   
                  return paginatedSessions.map((ses) => {
                    const {
                      usersConnected,
                      subusersConnected,
                      filtersUsed,
                      hermesMsgCount,
                      photosTaken,
                      textMsgCount,
                      audioMsgCount,
                      location,
                      langList,
                      transList
                    } = ses;
   
                    // Determinación de color de conteo (Ranking) - Tonos Pastel Metálicos
                    let conteoColor = 'rgba(255, 255, 255, 0.85)';
                    let conteoWeight = '600';
                    let medal = '';
                    if (ses.email === goldUser) {
                      conteoColor = '#F5D061'; // Oro Pastel
                      conteoWeight = '800';
                      medal = '🥇 ';
                    } else if (ses.email === silverUser) {
                      conteoColor = '#CBD5E1'; // Plata Pastel (Slate-300)
                      conteoWeight = '800';
                      medal = '🥈 ';
                    } else if (ses.email === bronzeUser) {
                      conteoColor = '#DDB892'; // Bronce Pastel (Terracotta)
                      conteoWeight = '800';
                      medal = '🥉 ';
                    }
   
                    return (
                      <tr key={ses.id}>
                        <td style={{ color: conteoColor, fontWeight: conteoWeight, fontSize: '0.85rem' }}>
                          {medal}{ses.sessionIndex}ª
                        </td>
                        <td style={{opacity: 0.8, fontSize: '0.8rem', whiteSpace: 'nowrap'}}>{new Date(ses.created_at).toLocaleString()}</td>
                        <td style={{whiteSpace: 'nowrap'}}>
                          <strong>{ses.first_name || '-'}</strong><br/>
                          <span style={{fontSize: '0.75rem', opacity: 0.7}}>{ses.email}</span>
                        </td>
                        <td style={{ color: getHeatmapColor(ses.duration_mins, maxDuration) }}>
                          <Clock size={12} style={{display:'inline', marginRight:'2px'}}/> {ses.duration_mins}m
                        </td>
                        <td style={{textAlign: 'center', color: getHeatmapColor(usersConnected, maxUsers) }}>{usersConnected}</td>
                        <td style={{textAlign: 'center', color: getHeatmapColor(subusersConnected, maxSubusers) }}>{subusersConnected}</td>
                        <td style={{textAlign: 'center', color: getHeatmapColor(ses.msg_count || 0, maxMsgs), fontWeight: 600}}>{ses.msg_count || 0}</td>
                        <td style={{textAlign: 'center', color: getHeatmapColor(textMsgCount, maxTextMsgs), fontWeight: 600}}>{textMsgCount}</td>
                        <td style={{textAlign: 'center', color: getHeatmapColor(audioMsgCount, maxAudioMsgs)}}>{audioMsgCount}</td>
                        <td style={{textAlign: 'center', color: getHeatmapColor(photosTaken, maxPhotos)}}>{photosTaken}</td>
                        <td style={{textAlign: 'center', color: getHeatmapColor(filtersUsed, maxFilters) }}>{filtersUsed}</td>
                        <td style={{textAlign: 'center', color: getHeatmapColor(ses.trigger_count || 0, maxTriggers)}}>{ses.trigger_count || 0}</td>
                        <td style={{textAlign: 'center', color: getHeatmapColor(hermesMsgCount, maxHermes), fontWeight: 700}}>{hermesMsgCount}</td>
                        <td style={{textAlign: 'left'}}>
                          {transList.length > 0
                            ? transList.map((t, i) => (
                                <span key={i} style={{border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', borderRadius: '4px', padding: '0px 5px', fontSize: '0.75rem', marginRight: '3px', display: 'inline-block'}}>{t}</span>
                              ))
                            : <span style={{opacity: 0.3}}>-</span>}
                        </td>
                        <td style={{textAlign: 'left'}}>
                          {langList.length > 0
                            ? langList.map((l, i) => (
                                <span key={i} style={{background: 'rgba(108,92,231,0.2)', color: '#c4b5fd', borderRadius: '4px', padding: '1px 6px', fontSize: '0.75rem', marginRight: '3px', display: 'inline-block'}}>{l}</span>
                              ))
                            : <span style={{opacity: 0.3}}>-</span>}
                        </td>
                        <td style={{fontSize: '0.8rem', opacity: 0.9, whiteSpace: 'nowrap'}}>{location}</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
          {data.sessions && data.sessions.length > itemsPerPage && (
            <div style={{display: 'flex', justifyContent: 'center', marginTop: '1rem', gap: '1rem', alignItems: 'center'}}>
              <button 
                disabled={telemetryPage === 1} 
                onClick={() => setTelemetryPage(p => p - 1)}
                style={{background: 'var(--panel-border)', color: 'white', padding: '5px 15px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', cursor: telemetryPage === 1 ? 'not-allowed' : 'pointer', opacity: telemetryPage === 1 ? 0.5 : 1}}
              >Anterior</button>
              <span style={{fontSize: '0.9rem', color: 'var(--text-main)'}}>Página {telemetryPage} de {Math.ceil(data.sessions.length / itemsPerPage)}</span>
              <button 
                disabled={telemetryPage === Math.ceil(data.sessions.length / itemsPerPage)} 
                onClick={() => setTelemetryPage(p => p + 1)}
                style={{background: 'var(--panel-border)', color: 'white', padding: '5px 15px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', cursor: telemetryPage === Math.ceil(data.sessions.length / itemsPerPage) ? 'not-allowed' : 'pointer', opacity: telemetryPage === Math.ceil(data.sessions.length / itemsPerPage) ? 0.5 : 1}}
              >Siguiente</button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'telemetry' && (
        <div className="glass-panel table-section">
          <h2 className="section-title">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path d="M10.65 10.5A4.5 4.5 0 0 0 1.5 12a4.5 4.5 0 0 0 9.15 1.5H16v3.5h2.5V13.5H21v3.5h2V10.5H10.65zM6 13.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" fill="currentColor" />
            </svg>
            Control Central de Licencias (DRM)
          </h2>
          <div className="table-scroll-container">
            <table className="data-table" style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead style={{position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'var(--panel-bg)', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'}}>
                <tr>
                  <th>Email Cliente</th>
                  <th>Nombre / Cía</th>
                  <th>País</th>
                  <th>Teléfono</th>
                  <th>Clave Licencia</th>
                  <th>Versión</th>
                  <th>Tipo</th>
                  <th>Modalidad</th>
                  <th>Progreso</th>
                  <th>Hardware</th>
                  <th>Cambios PC</th>
                  <th>Fecha Reg.</th>
                  <th>Hora Reg.</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {data.licenses.slice((licensePage - 1) * itemsPerPage, licensePage * itemsPerPage).map((lic) => (
                  <tr key={lic.id}>
                    <td><strong>{lic.email}</strong></td>
                    <td>
                      <strong>{lic.first_name || '-'} {lic.last_name || ''}</strong>
                      {lic.company_name && <div style={{fontSize: '0.75rem', opacity: 0.6}}>{lic.company_name}</div>}
                    </td>
                    <td style={{fontSize: '0.85rem'}}>
                      {lic.country ? `📍 ${lic.country}` : '-'}
                    </td>
                    <td style={{fontSize: '0.85rem', whiteSpace: 'nowrap'}}>
                      {lic.phone ? `📞 ${lic.phone}` : '-'}
                    </td>
                    <td style={{fontFamily: 'monospace', letterSpacing: '1px'}}>{lic.license_key}</td>
                    <td>
                      <span style={{background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-block'}}>
                        v{lic.license_version || 1}
                      </span>
                    </td>
                    <td>
                      {lic.status === 'trial' || lic.payment_mode === 'Trial' ? (
                        <span style={{background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-block'}}>
                          Trial
                        </span>
                      ) : parseInt(lic.device_limit || 1) === 5 ? (
                        <span style={{background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-block'}}>
                          Enterprise
                        </span>
                      ) : (
                        <span style={{background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-block'}}>
                          Freelance
                        </span>
                      )}
                    </td>
                    <td>
                      {lic.status === 'trial' || lic.payment_mode === 'Trial' ? (
                        <span style={{color: '#fbbf24', fontWeight: 'bold', fontSize: '0.8rem'}}>Trial</span>
                      ) : lic.payment_mode === 'rent_to_own' ? (
                        <span style={{color: '#ff9f43', fontWeight: 'bold', fontSize: '0.8rem'}}>Rent-to-Own</span>
                      ) : (
                        <span style={{color: '#10b981', fontWeight: 'bold', fontSize: '0.8rem'}}>Pago Único</span>
                      )}
                    </td>
                    <td>
                      {lic.payment_mode === 'rent_to_own' ? (
                        <div>
                          <div style={{fontSize: '0.75rem', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px'}}>
                            <span style={{color: parseFloat(lic.total_paid || 0) === 0 ? '#f87171' : 'inherit'}}>
                              {parseFloat(lic.total_paid || 0).toFixed(2)} / {parseFloat(lic.total_price || 0).toFixed(2)} €
                            </span>
                            <span style={{color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.7rem'}}>
                              ({lic.rto_payments_count || 0}/14)
                            </span>
                            <button
                              onClick={() => handleUpdatePayment(lic.license_key, lic.total_paid || 0, lic.total_price || 0)}
                              title="Corregir importe pagado"
                              style={{background: 'rgba(255,159,67,0.15)', border: '1px solid rgba(255,159,67,0.4)', color: '#ff9f43', borderRadius: '4px', padding: '1px 5px', fontSize: '0.65rem', cursor: 'pointer', lineHeight: 1}}
                            >✏️</button>
                          </div>
                          <div style={{background: 'rgba(255, 255, 255, 0.05)', height: '5px', borderRadius: '3px', width: '80px', overflow: 'hidden'}}>
                            <div style={{
                              background: '#ff9f43',
                              width: `${Math.min(100, (parseFloat(lic.total_paid || 0) / parseFloat(lic.total_price || 1)) * 100)}%`,
                              height: '100%'
                            }}></div>
                          </div>
                        </div>
                      ) : lic.status === 'trial' ? (
                        (() => {
                          // Verificación defensiva de hardware vinculado (Ley de Murphy)
                          const hasHardware = lic.hw_fingerprints && String(lic.hw_fingerprints).trim() !== '';
                          const activeBindings = parseInt(lic.active_bindings || 0);

                          // Si no hay máquina vinculada, el periodo de prueba aún no ha comenzado o está bloqueado por DRM previo
                          if (!hasHardware || activeBindings === 0) {
                            return (
                              <span style={{
                                background: 'rgba(245, 158, 11, 0.15)',
                                color: '#fbbf24',
                                border: '1px solid rgba(245, 158, 11, 0.35)',
                                borderRadius: '4px',
                                padding: '2px 8px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap'
                              }}>
                                ⏳ Pendiente de Activación
                              </span>
                            );
                          }

                          // Si ya existe hardware vinculado, se calcula y visualiza el consumo real
                          const expiry = lic.expires_at ? new Date(lic.expires_at) : null;
                          if (expiry && !isNaN(expiry.getTime())) {
                            const diffMs = expiry.getTime() - Date.now();
                            const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                            const percent = Math.min(100, Math.max(0, Math.round((daysLeft / 30) * 100)));
                            const color = daysLeft <= 5 ? '#f87171' : (daysLeft <= 15 ? '#fbbf24' : '#34d399');
                            return (
                              <div>
                                 <div style={{fontSize: '0.75rem', marginBottom: '2px', color: color, fontWeight: 'bold'}}>
                                   {daysLeft} días restan
                                 </div>
                                 <div style={{background: 'rgba(255, 255, 255, 0.05)', height: '5px', borderRadius: '3px', width: '80px', overflow: 'hidden'}}>
                                   <div style={{
                                     background: color,
                                     width: `${percent}%`,
                                     height: '100%'
                                   }}></div>
                                 </div>
                              </div>
                            );
                          }
                          return <span style={{fontSize: '0.8rem', color: '#f87171'}}>Sin fecha exp.</span>;
                        })()
                      ) : (
                        <span style={{fontSize: '0.8rem', opacity: 0.6}}>Perpetua</span>
                      )}
                    </td>
                    <td>
                      {parseInt(lic.device_limit || 1) > 1 ? (
                        (() => {
                          const count = parseInt(lic.active_bindings || 0);
                          const limit = parseInt(lic.device_limit || 5);
                          return (
                            <span 
                              style={{
                                background: count > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                color: count > 0 ? '#10B981' : 'rgba(255, 255, 255, 0.4)',
                                border: `1px solid ${count > 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                                borderRadius: '20px',
                                padding: '3px 10px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'help'
                              }}
                              title={lic.hw_fingerprints ? lic.hw_fingerprints.split(',').join('\n') : 'Ningún equipo vinculado'}
                            >
                              🖥️ {count} / {limit}
                            </span>
                          );
                        })()
                      ) : (
                        lic.hw_fingerprints ? (
                          <span style={{fontSize: '0.8rem', color: 'var(--accent)'}} title={lic.hw_fingerprints}>
                            {lic.hw_fingerprints.substring(0, 10)}...
                          </span>
                        ) : (
                          <span style={{fontSize: '0.8rem', opacity: 0.5}}>No Vinculado</span>
                        )
                      )}
                    </td>
                    <td style={{
                      textAlign: 'center',
                      color: lic.unlink_count > 3 ? '#EF4444' : 'rgba(255, 255, 255, 0.8)',
                      fontWeight: lic.unlink_count > 3 ? 'bold' : 'normal',
                      fontSize: '0.85rem'
                    }}>
                      {lic.unlink_count || 0}
                    </td>
                    <td style={{fontSize: '0.85rem'}}>
                      {(() => {
                        if (!lic.created_at) return '-';
                        const d = new Date(lic.created_at);
                        return isNaN(d.getTime()) ? '-' : d.toLocaleDateString();
                      })()}
                    </td>
                    <td style={{fontSize: '0.85rem'}}>
                      {(() => {
                        if (!lic.created_at) return '-';
                        const d = new Date(lic.created_at);
                        return isNaN(d.getTime()) ? '-' : d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'});
                      })()}
                    </td>
                    <td>
                      {lic.status !== 'active' && lic.status !== 'trial' ? (
                        <span className="badge revoked" style={{display: 'inline-block', padding: '2px 6px', fontSize: '0.75rem', fontWeight: 'bold'}}>
                          REVOCADA
                        </span>
                      ) : (
                        (() => {
                          const status = lic.status === 'trial' ? 'trial' : (lic.subscription_status || 'active');
                          let color = '#fff';
                          let bg = 'rgba(255,255,255,0.1)';
                          if (status === 'active') { bg = 'rgba(16, 185, 129, 0.2)'; color = '#10b981'; }
                          else if (status === 'trial') { bg = 'rgba(59, 130, 246, 0.2)'; color = '#60a5fa'; }
                          else if (status === 'past_due') { bg = 'rgba(239, 68, 68, 0.2)'; color = '#f87171'; }
                          else if (status === 'canceled') { bg = 'rgba(156, 163, 175, 0.2)'; color = '#9ca3af'; }
                          else if (status === 'complete') { bg = 'rgba(168, 85, 247, 0.2)'; color = '#c084fc'; }
                          
                          return (
                            <span style={{background: bg, color: color, borderRadius: '4px', padding: '2px 6px', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-block', textTransform: 'uppercase'}}>
                              {status}
                            </span>
                          );
                        })()
                      )}
                    </td>
                    <td>
                      {lic.status === 'active' || lic.status === 'trial' ? (
                        <button 
                          className="btn-danger" 
                          onClick={() => handleRevoke(lic.license_key)}
                          style={{padding: '4px 8px', fontSize: '0.8rem'}}
                        >
                          <AlertTriangle size={14} style={{display:'inline', marginBottom:'-2px', marginRight:'4px'}}/>
                          Revocar
                        </button>
                      ) : (
                        <button 
                          className="btn-success" 
                          onClick={() => handleRestore(lic.license_key)}
                          style={{padding: '4px 8px', fontSize: '0.8rem', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                        >
                          <ShieldCheck size={14} style={{display:'inline', marginBottom:'-2px', marginRight:'4px'}}/>
                          Restaurar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {data.licenses.length === 0 && (
                  <tr><td colSpan="15" style={{textAlign: 'center', opacity: 0.5}}>No hay licencias en la base de datos.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {data.licenses && data.licenses.length > itemsPerPage && (
            <div style={{display: 'flex', justifyContent: 'center', marginTop: '1rem', gap: '1rem', alignItems: 'center'}}>
              <button 
                disabled={licensePage === 1} 
                onClick={() => setLicensePage(p => p - 1)}
                style={{background: 'var(--panel-border)', color: 'white', padding: '5px 15px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', cursor: licensePage === 1 ? 'not-allowed' : 'pointer', opacity: licensePage === 1 ? 0.5 : 1}}
              >Anterior</button>
              <span style={{fontSize: '0.9rem', color: 'var(--text-main)'}}>Página {licensePage} de {Math.ceil(data.licenses.length / itemsPerPage)}</span>
              <button 
                disabled={licensePage === Math.ceil(data.licenses.length / itemsPerPage)} 
                onClick={() => setLicensePage(p => p + 1)}
                style={{background: 'var(--panel-border)', color: 'white', padding: '5px 15px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', cursor: licensePage === Math.ceil(data.licenses.length / itemsPerPage) ? 'not-allowed' : 'pointer', opacity: licensePage === Math.ceil(data.licenses.length / itemsPerPage) ? 0.5 : 1}}
              >Siguiente</button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'telemetry' && (
        <div className="glass-panel table-section" style={{marginTop: '2rem'}}>
          <h2 className="section-title">
            <Users size={22} />
            Leads / Oportunidades — Sin Licencia Activa + Cuentas Eliminadas
          </h2>

          {/* Leyenda */}
          <div style={{display: 'flex', gap: '16px', marginBottom: '1rem', flexWrap: 'wrap'}}>
            <span style={{display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)'}}>
              <span style={{background: 'rgba(123,104,238,0.15)', border: '1px solid rgba(123,104,238,0.4)', borderRadius: '4px', padding: '2px 8px', color: '#a78bfa', fontWeight: 700, fontSize: '0.72rem'}}>LEAD</span>
              Registrado sin licencia activa
            </span>
            <span style={{display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)'}}>
              <span style={{background: 'rgba(255,51,102,0.15)', border: '1px solid rgba(255,51,102,0.4)', borderRadius: '4px', padding: '2px 8px', color: '#f366', fontWeight: 700, fontSize: '0.72rem'}}>ELIMINADO</span>
              Eliminó su cuenta voluntariamente
            </span>
          </div>

          <div className="table-scroll-container">
            <table className="data-table" style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead style={{position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'var(--panel-bg)', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'}}>
                <tr>
                  <th>Tipo</th>
                  <th>Email</th>
                  <th>Nombre</th>
                  <th>Compañía</th>
                  <th>País</th>
                  <th>Teléfono</th>
                  <th>📅 Alta</th>
                  <th>🗑️ Baja</th>
                  <th>⏱️ Duración</th>
                  <th>🌐 IP Eliminación</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {(data.unlicensed_users || []).slice((unlicensedPage - 1) * itemsPerPage, unlicensedPage * itemsPerPage).map((user) => {
                  const isDeleted = user.user_type === 'deleted';
                  const rowStyle = isDeleted
                    ? { background: 'rgba(255, 51, 102, 0.04)', borderLeft: '2px solid rgba(255,51,102,0.3)' }
                    : {};
                  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-ES', {day:'2-digit', month:'short', year:'numeric'}) : '-';
                  return (
                    <tr key={`${user.user_type}-${user.id}`} style={rowStyle}>
                      <td>
                        {isDeleted ? (
                          <span style={{background: 'rgba(255,51,102,0.15)', border: '1px solid rgba(255,51,102,0.4)', borderRadius: '4px', padding: '2px 8px', color: '#f366', fontWeight: 700, fontSize: '0.72rem', whiteSpace: 'nowrap'}}>ELIMINADO</span>
                        ) : (
                          <span style={{background: 'rgba(123,104,238,0.15)', border: '1px solid rgba(123,104,238,0.4)', borderRadius: '4px', padding: '2px 8px', color: '#a78bfa', fontWeight: 700, fontSize: '0.72rem', whiteSpace: 'nowrap'}}>LEAD</span>
                        )}
                      </td>
                      <td><strong style={{fontSize: '0.82rem'}}>{user.email}</strong></td>
                      <td style={{whiteSpace: 'nowrap'}}>{user.first_name || '-'} {user.last_name || ''}</td>
                      <td>{user.company_name || '-'}</td>
                      <td>
                        {user.country ? (
                          <a href={`https://www.google.com/maps/search/?api=1&query=${user.country}`} target="_blank" rel="noreferrer" style={{color: 'var(--accent)', textDecoration: 'none'}}>📍 {user.country}</a>
                        ) : '-'}
                      </td>
                      <td style={{whiteSpace: 'nowrap'}}>{user.phone ? `📞 ${user.phone}` : '-'}</td>
                      <td style={{fontSize: '0.8rem', whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.6)'}}>{fmtDate(user.signup_date)}</td>
                      <td style={{fontSize: '0.8rem', whiteSpace: 'nowrap', color: isDeleted ? '#f366' : 'rgba(255,255,255,0.25)'}}>
                        {isDeleted ? fmtDate(user.deleted_at) : '—'}
                      </td>
                      <td style={{fontSize: '0.8rem', whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.6)'}}>
                        {user.account_duration_days !== null && user.account_duration_days !== undefined
                          ? `${user.account_duration_days} días`
                          : '—'}
                      </td>
                      <td style={{fontSize: '0.75rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.45)'}}>
                        {user.deletion_ip || '—'}
                      </td>
                      <td>
                        <a
                          href={`mailto:${user.email}?subject=${isDeleted ? 'Te%20echamos%20de%20menos%20en%20Talk-Me' : 'Feedback%20sobre%20Talk-Me'}&body=Hola%20${encodeURIComponent(user.first_name || '')},%20${isDeleted ? 'vimos%20que%20eliminaste%20tu%20cuenta%20en%20Talk-Me%20y%20queremos%20saber%20c%C3%B3mo%20podemos%20mejorar.' : 'vimos%20que%20te%20registraste%20en%20Talk-Me...'}`}
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.78rem',
                            background: isDeleted ? 'rgba(255,51,102,0.1)' : 'rgba(123, 104, 238, 0.1)',
                            color: isDeleted ? '#f366' : 'var(--accent)',
                            border: `1px solid ${isDeleted ? 'rgba(255,51,102,0.35)' : 'var(--panel-border)'}`,
                            borderRadius: '4px',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {isDeleted ? '💔 Reconectar' : '✉️ Contactar'}
                        </a>
                      </td>
                    </tr>
                  );
                })}
                {(!data.unlicensed_users || data.unlicensed_users.length === 0) && (
                  <tr><td colSpan="11" style={{textAlign: 'center', opacity: 0.5, padding: '2rem'}}>No hay leads ni cuentas eliminadas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {data.unlicensed_users && data.unlicensed_users.length > itemsPerPage && (
            <div style={{display: 'flex', justifyContent: 'center', marginTop: '1rem', gap: '1rem', alignItems: 'center'}}>
              <button
                disabled={unlicensedPage === 1}
                onClick={() => setUnlicensedPage(p => p - 1)}
                style={{background: 'var(--panel-border)', color: 'white', padding: '5px 15px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', cursor: unlicensedPage === 1 ? 'not-allowed' : 'pointer', opacity: unlicensedPage === 1 ? 0.5 : 1}}
              >Anterior</button>
              <span style={{fontSize: '0.9rem', color: 'var(--text-main)'}}>Página {unlicensedPage} de {Math.ceil(data.unlicensed_users.length / itemsPerPage)}</span>
              <button
                disabled={unlicensedPage === Math.ceil(data.unlicensed_users.length / itemsPerPage)}
                onClick={() => setUnlicensedPage(p => p + 1)}
                style={{background: 'var(--panel-border)', color: 'white', padding: '5px 15px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', cursor: unlicensedPage === Math.ceil(data.unlicensed_users.length / itemsPerPage) ? 'not-allowed' : 'pointer', opacity: unlicensedPage === Math.ceil(data.unlicensed_users.length / itemsPerPage) ? 0.5 : 1}}
              >Siguiente</button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'invoices' && (() => {
        const getStripeFee = (amount) => {
          if (amount <= 0) return 0;
          return (amount * 0.015) + 0.25;
        };

        const totalGross = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
        const totalTaxes = invoices.reduce((sum, inv) => {
          const tax = inv.tax_amount !== undefined && inv.tax_amount !== null ? Number(inv.tax_amount) : (inv.total_amount - (inv.total_amount / 1.21));
          return sum + tax;
        }, 0);
        const totalStripeFees = invoices.reduce((sum, inv) => sum + getStripeFee(Number(inv.total_amount)), 0);
        const totalNet = totalGross - totalTaxes - totalStripeFees;

        const getBillingChartData = () => {
          const groups = {};
          invoices.forEach(inv => {
            const date = new Date(inv.created_at);
            const key = date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
            
            const tax = inv.tax_amount !== undefined && inv.tax_amount !== null ? Number(inv.tax_amount) : (inv.total_amount - (inv.total_amount / 1.21));
            const stripeFee = getStripeFee(Number(inv.total_amount));
            const total = Number(inv.total_amount);
            const net = total - tax - stripeFee;
            
            if (!groups[key]) {
              groups[key] = { name: key, Bruto: 0, IVA: 0, Stripe: 0, Neto: 0 };
            }
            groups[key].Bruto += total;
            groups[key].IVA += tax;
            groups[key].Stripe += stripeFee;
            groups[key].Neto += net;
          });
          
          return Object.values(groups).reverse();
        };

        const chartData = getBillingChartData();

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            {/* KPI Cards Grid */}
            <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              <div className="metric-card glass-panel" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
                <div className="metric-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="metric-title" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7 }}>Ingresos Brutos</span>
                  <span className="metric-icon" style={{ background: 'rgba(123, 104, 238, 0.1)', color: 'var(--accent)', padding: '8px', borderRadius: '8px' }}><Coins size={18} /></span>
                </div>
                <h3 className="metric-value" style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '12px', marginBottom: '4px' }}>
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalGross)}
                </h3>
                <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.5 }}>Total acumulado facturado</p>
              </div>
              
              <div className="metric-card glass-panel" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
                <div className="metric-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="metric-title" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7 }}>Impuestos (IVA)</span>
                  <span className="metric-icon" style={{ background: 'rgba(255, 107, 53, 0.1)', color: '#ff6b35', padding: '8px', borderRadius: '8px' }}><CreditCard size={18} /></span>
                </div>
                <h3 className="metric-value" style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '12px', marginBottom: '4px', color: '#ff6b35' }}>
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalTaxes)}
                </h3>
                <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.5 }}>Total IVA recaudado (21%)</p>
              </div>

              <div className="metric-card glass-panel" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
                <div className="metric-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="metric-title" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7 }}>Tasas Stripe</span>
                  <span className="metric-icon" style={{ background: 'rgba(99, 91, 255, 0.1)', color: '#635bff', padding: '8px', borderRadius: '8px' }}>💳</span>
                </div>
                <h3 className="metric-value" style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '12px', marginBottom: '4px', color: '#635bff' }}>
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalStripeFees)}
                </h3>
                <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.5 }}>Comisiones Stripe estimadas</p>
              </div>

              <div className="metric-card glass-panel" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
                <div className="metric-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="metric-title" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7 }}>Beneficio Neto</span>
                  <span className="metric-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '8px', borderRadius: '8px' }}><Star size={18} /></span>
                </div>
                <h3 className="metric-value" style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '12px', marginBottom: '4px', color: '#10B981' }}>
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalNet)}
                </h3>
                <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.5 }}>Importe limpio ingresado a cuenta</p>
              </div>
            </div>

            {/* Billing Graph Card */}
            {chartData.length > 0 && (
              <div className="glass-panel" style={{ padding: '20px' }}>
                <h3 className="section-title" style={{ margin: '0 0 20px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart2 size={20} /> Evolución Financiera de Ventas y Beneficios
                </h3>
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorBruto" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorNeto" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 11}} tickMargin={10} axisLine={false} tickLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.4)" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 11}} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{background: 'rgba(21, 21, 34, 0.95)', border: '1px solid var(--panel-border)', borderRadius: '12px', backdropFilter: 'blur(8px)'}}
                        itemStyle={{fontWeight: 'bold'}}
                        formatter={(value, name) => [new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value), name]}
                      />
                      <Bar dataKey="Bruto" name="Ingresos Brutos" fill="url(#colorBruto)" radius={[4, 4, 0, 0]} barSize={25} />
                      <Bar dataKey="Neto" name="Beneficio Neto" fill="url(#colorNeto)" radius={[4, 4, 0, 0]} barSize={25} />
                      <Line type="monotone" dataKey="Neto" name="Tendencia Neta" stroke="#10B981" strokeWidth={3} dot={true} activeDot={{r: 6}} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Invoices Table Section */}
            <div className="glass-panel table-section" style={{ margin: 0 }}>
              <h2 className="section-title">
                <CreditCard size={22} style={{ marginRight: '8px' }} />
                Registro de Facturación Histórica
              </h2>
              <div className="table-scroll-container">
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'var(--panel-bg)', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                    <tr>
                      <th>Nº Factura</th>
                      <th>Cliente (Email)</th>
                      <th>Nombre / Razón Social</th>
                      <th>NIF/CIF</th>
                      <th>Dirección Fiscal</th>
                      <th>Importe Financiero</th>
                      <th>Fecha Generación</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.slice((invoicePage - 1) * itemsPerPage, invoicePage * itemsPerPage).map((inv) => {
                      const taxVal = inv.tax_amount !== undefined && inv.tax_amount !== null ? Number(inv.tax_amount) : (inv.total_amount - (inv.total_amount / 1.21));
                      const feeVal = getStripeFee(Number(inv.total_amount));
                      const netVal = Number(inv.total_amount) - taxVal - feeVal;

                      const fullName = [inv.first_name, inv.last_name].filter(Boolean).join(' ');
                      const companyOrName = inv.company_name || fullName || 'Cliente Enterprise';

                      return (
                        <tr key={inv.secure_token}>
                          <td><strong style={{ fontSize: '0.85rem' }}>{inv.invoice_number}</strong></td>
                          <td><strong>{inv.email}</strong></td>
                          <td>
                            <div style={{ fontWeight: '600' }}>{companyOrName}</div>
                            {fullName && companyOrName !== fullName && (
                              <div style={{ fontSize: '0.75rem', opacity: 0.75, color: '#b2a8ff' }}>
                                👤 {fullName}
                              </div>
                            )}
                          </td>
                          <td style={{ fontFamily: 'monospace' }}>{inv.tax_id || 'No provisto'}</td>
                          <td>
                            <div style={{ fontSize: '0.75rem', opacity: 0.85, lineHeight: '1.35', color: 'rgba(255,255,255,0.85)' }} title={inv.billing_address}>
                              📍 {(() => {
                                const addr = inv.billing_address || 'Dirección no provista';
                                const country = inv.country ? inv.country.toUpperCase() : '';
                                if (country && !addr.toUpperCase().includes(country)) {
                                  return `${addr}, ${country}`;
                                }
                                return addr;
                              })()}
                            </div>
                          </td>
                          <td style={{ verticalAlign: 'middle' }}>
                            <div style={{ fontWeight: 'bold', color: 'white', fontSize: '0.95rem' }}>
                              {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(inv.total_amount)}
                            </div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '3px', display: 'flex', flexDirection: 'column', gap: '1px', lineHeight: '1.2' }}>
                              <span style={{ color: '#ff6b35' }}>
                                IVA: -{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(taxVal)}
                              </span>
                              <span style={{ color: '#635bff' }}>
                                Stripe: -{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(feeVal)}
                              </span>
                              <span style={{ color: '#10B981', fontWeight: '700' }}>
                                Neto: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(netVal)}
                              </span>
                            </div>
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>
                            {new Date(inv.created_at).toLocaleDateString()} {new Date(inv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td>
                            <button
                              className="btn-success"
                              onClick={() => window.open(`${API_URL}?action=download_invoice&token=${inv.secure_token}&api_key=${API_KEY}`, '_blank')}
                              style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#10B981', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '600', transition: 'all 0.2s ease' }}
                            >
                              <Download size={14} /> Descargar PDF
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {invoices.length === 0 && (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>
                          No se han emitido facturas en el sistema.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {invoices.length > itemsPerPage && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', gap: '1rem', alignItems: 'center' }}>
                  <button 
                    disabled={invoicePage === 1} 
                    onClick={() => setInvoicePage(p => p - 1)}
                    style={{ background: 'var(--panel-border)', color: 'white', padding: '5px 15px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', cursor: invoicePage === 1 ? 'not-allowed' : 'pointer', opacity: invoicePage === 1 ? 0.5 : 1 }}
                  >
                    Anterior
                  </button>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    Página {invoicePage} de {Math.ceil(invoices.length / itemsPerPage)}
                  </span>
                  <button 
                    disabled={invoicePage === Math.ceil(invoices.length / itemsPerPage)} 
                    onClick={() => setInvoicePage(p => p + 1)}
                    style={{ background: 'var(--panel-border)', color: 'white', padding: '5px 15px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', cursor: invoicePage === Math.ceil(invoices.length / itemsPerPage) ? 'not-allowed' : 'pointer', opacity: invoicePage === Math.ceil(invoices.length / itemsPerPage) ? 0.5 : 1 }}
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default App;
