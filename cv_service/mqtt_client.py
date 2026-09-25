# MQTT Publisher & Listener Client
import json
import paho.mqtt.client as mqtt

class MQTTBridge:
    def __init__(self, broker="localhost", port=1883):
        self.broker = broker
        self.port = port
        self.client = mqtt.Client()
        self.client.on_connect = self._on_connect
        self.connected = False

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            print(f"[MQTTBridge] Connected to MQTT broker at {self.broker}:{self.port}")
            self.connected = True
        else:
            print(f"[MQTTBridge] Failed to connect, return code {rc}")

    def start(self):
        try:
            self.client.connect(self.broker, self.port, 60)
            self.client.loop_start()
        except Exception as e:
            print(f"[MQTTBridge] Note: MQTT broker unavailable ({e}). Running mock MQTT mode.")

    def publish_cv_analysis(self, intersection_id, payload):
        topic = f"cv/intersection/{intersection_id}/analysis"
        if self.connected:
            self.client.publish(topic, json.dumps(payload))
        else:
            print(f"[MQTT Mock Publish] {topic}: {payload}")
