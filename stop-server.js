const { exec } = require('child_process');

// Fonction pour trouver et arrêter le processus
function stopServer() {
    // Pour Linux/Mac
    if (process.platform !== 'win32') {
        exec("ps aux | grep '[n]ode app.js' | awk '{print $2}'", (error, pid) => {
            if (error) {
                console.error('Erreur lors de la recherche du processus:', error);
                return;
            }

            if (!pid) {
                console.log("Aucun serveur Node.js (app.js) n'est en cours d'exécution.");
                return;
            }

            exec(`kill ${pid}`, (killError) => {
                if (killError) {
                    console.error('Erreur lors de l\'arrêt du serveur:', killError);
                    return;
                }
                console.log(`Serveur (PID: ${pid.trim()}) arrêté avec succès!`);
            });
        });
    } 
    // Pour Windows
    else {
        exec('taskkill /F /IM node.exe', (error) => {
            if (error) {
                console.error('Erreur lors de l\'arrêt du serveur:', error);
                return;
            }
            console.log('Serveur arrêté avec succès!');
        });
    }
}

stopServer(); 