"""Résolution des adresses des microservices via Eureka (équivalent de lb:// / Feign)."""
import logging
import random

import py_eureka_client.eureka_client as eureka_client

log = logging.getLogger("recommandation.discovery")


def resolve_service_url(app_name: str, fallback: str) -> str:
    """URL d'une instance UP du service dans Eureka, sinon l'URL de secours."""
    try:
        app = eureka_client.get_client().applications.get_application(app_name.upper())
        instances = app.up_instances
        if instances:
            inst = random.choice(instances)  # répartition simple entre instances
            url = f"http://{inst.ipAddr}:{inst.port.port}"
            log.info("%s résolu via Eureka : %s", app_name.upper(), url)
            return url
    except Exception as exc:
        log.warning("Résolution Eureka impossible pour %s (%s)", app_name, exc)
    return fallback