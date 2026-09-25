/* ============================================================
   MQTT Service — IoT communication abstraction.
   For MVP, defaults to SIMULATION / DISCONNECTED.
   ============================================================ */

const MQTT_BROKER = 'ws://localhost:9001'
let mqttStatus = 'DISCONNECTED' // SIMULATION, CONNECTED, DISCONNECTED, ERROR
let mqttClient = null

export function getMqttStatus() {
  if (mqttStatus === 'DISCONNECTED') return 'DISCONNECTED'
  return mqttStatus
}

export function setMqttStatus(status) {
  mqttStatus = status
}

/**
 * Initialize MQTT connection.
 */
export function initMqtt() {
  // Check if we should attempt connection
  const useMqtt = localStorage.getItem('useMqtt') === 'true'
  if (!useMqtt) {
    mqttStatus = 'DISCONNECTED' // Be honest: we are not connected.
    return
  }

  try {
    // We would initialize actual MQTT.js client here
    // For now, if someone forces it on but we don't have the lib, we stay disconnected
    mqttStatus = 'ERROR'
  } catch (e) {
    mqttStatus = 'ERROR'
  }
}

/**
 * Publish message to MQTT broker.
 */
export function publishMqtt(topic, payload) {
  if (mqttStatus !== 'CONNECTED') return false
  
  if (mqttClient) {
    try {
      mqttClient.publish(topic, JSON.stringify(payload))
      return true
    } catch (e) {
      console.warn('MQTT publish failed:', e)
      return false
    }
  }
  return false
}

export function subscribeMqtt(topic, callback) {
  if (mqttStatus !== 'CONNECTED') return () => {}
  
  if (mqttClient) {
    try {
      mqttClient.subscribe(topic)
      const handler = (t, msg) => {
        if (t === topic) {
          try {
            callback(JSON.parse(msg.toString()))
          } catch (e) {
            console.warn('MQTT payload parse error:', e)
          }
        }
      }
      mqttClient.on('message', handler)
      return () => {
        mqttClient.unsubscribe(topic)
        // Note: full cleanup would require removing the specific listener
      }
    } catch (e) {
      console.warn('MQTT subscribe failed:', e)
    }
  }
  return () => {}
}
