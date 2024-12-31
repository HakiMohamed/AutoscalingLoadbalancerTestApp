#!/bin/bash

# Trouver le PID du processus Node.js qui exécute app.js
PID=$(ps aux | grep '[n]ode app.js' | awk '{print $2}')

if [ -z "$PID" ]; then
    echo "Aucun serveur Node.js (app.js) n'est en cours d'exécution."
else
    echo "Arrêt du serveur Node.js (PID: $PID)..."
    kill $PID
    
    # Vérifier si le processus a été arrêté
    sleep 2
    if ps -p $PID > /dev/null; then
        echo "Le serveur ne répond pas, tentative d'arrêt forcé..."
        kill -9 $PID
    else
        echo "Serveur arrêté avec succès!"
    fi
fi 