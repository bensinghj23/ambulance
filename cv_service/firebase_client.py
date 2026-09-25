# Firebase Firestore Publisher Client
import firebase_admin
from firebase_admin import credentials, firestore
import datetime

class FirebasePublisher:
    def __init__(self, cred_path=None):
        try:
            if cred_path:
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
            else:
                firebase_admin.initialize_app()
            self.db = firestore.client()
            print("[FirebaseClient] Firestore initialized")
        except Exception as e:
            print(f"[FirebaseClient] Note: Firestore fallback mode ({e})")
            self.db = None

    def publish_cv_analysis(self, intersection_id, analysis_data):
        if not self.db:
            print(f"[FirebaseClient Mock] cvAnalysis for {intersection_id}: {analysis_data}")
            return

        doc_ref = self.db.collection("cvAnalysis").document(intersection_id)
        doc_ref.set({
            **analysis_data,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }, merge=True)
