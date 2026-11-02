const Stripe = require('stripe');

// Inicializar Stripe (Reemplazar con la clave secreta de prueba 'sk_test_...')
// Por seguridad, en producción debe leerse de process.env.STRIPE_SECRET_KEY
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key_for_sandbox');

/**
 * Verifica el estado de suscripción de un cliente en Stripe.
 * @param {string} customerId - El ID del cliente en Stripe (ej. cus_Nxyz...)
 * @returns {object} Objeto con el estado de la suscripción
 */
async function verifySubscriptionStatus(customerId) {
    try {
        console.log(`💳 Consultando estado de suscripción en Stripe para: ${customerId}`);
        
        // Obtenemos las suscripciones del cliente
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'all', // Queremos ver todos los estados para informar al usuario
            limit: 1,      // Asumimos 1 suscripción activa por cliente
        });

        if (subscriptions.data.length === 0) {
            console.log("⚠️ No se encontraron suscripciones para este cliente.");
            return {
                valid: false,
                status: 'none',
                message: "No hay ninguna suscripción asociada."
            };
        }

        const sub = subscriptions.data[0];
        const status = sub.status; // puede ser: active, past_due, canceled, incomplete...

        console.log(`✅ Suscripción encontrada. Estado actual: [${status.toUpperCase()}]`);

        // Talk-me v70 Sovereign solo permite acceso si está activa o en trial
        const isValid = (status === 'active' || status === 'trialing');

        return {
            valid: isValid,
            status: status,
            current_period_end: new Date(sub.current_period_end * 1000), // Convertir Unix a fecha
            subscription_id: sub.id
        };

    } catch (error) {
        console.error("❌ Error de comunicación con Stripe API:", error.message);
        // Retornamos un error elegante
        return {
            valid: false,
            status: 'error',
            message: "Fallo en la pasarela de pagos. Verifique su conexión."
        };
    }
}

// Ejecutar prueba si se llama directamente
if (require.main === module) {
    (async () => {
        // ID de cliente simulado para prueba
        const mockCustomerId = 'cus_mock_123456789';
        
        // Si no hay clave real de Stripe, la librería lanzará error de autenticación (esto es esperado)
        console.log("🛠️  Modo Sandbox - Stripe Validator");
        const result = await verifySubscriptionStatus(mockCustomerId);
        
        console.log("\nResultado de la validación:");
        console.dir(result);
    })();
}

module.exports = { verifySubscriptionStatus };
