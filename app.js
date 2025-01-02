const express = require('express');
const morgan = require('morgan');
const os = require('os');
const { S3Client } = require('@aws-sdk/client-s3');
const AWS = require('@aws-sdk/client-s3');

const app = express();
const port = process.env.PORT || 3000;

// Configuration EJS
app.set('view engine', 'ejs');
app.set('views', './views');

// Middleware
app.use(morgan('combined'));
app.use(express.json());

// Middleware pour passer os à toutes les vues
app.use((req, res, next) => {
    res.locals.os = os;
    next();
});

// Add this function to fetch EC2 metadata
async function getEC2Metadata() {
    try {
        const metadata = new AWS.MetadataService();
        const [instanceId, availabilityZone] = await Promise.all([
            new Promise((resolve, reject) => {
                metadata.request('/latest/meta-data/instance-id', (err, data) => {
                    if (err) resolve('N/A');
                    else resolve(data);
                });
            }),
            new Promise((resolve, reject) => {
                metadata.request('/latest/meta-data/placement/availability-zone', (err, data) => {
                    if (err) resolve('N/A');
                    else resolve(data);
                });
            })
        ]);
        return { instanceId, availabilityZone };
    } catch (error) {
        return { instanceId: 'Non-EC2 Environment', availabilityZone: 'Non-EC2 Environment' };
    }
}

// Routes principales
app.get('/', async (req, res) => {
    try {
        const { instanceId, availabilityZone } = await getEC2Metadata();
        const data = {
            title: 'Dashboard AWS',
            message: 'Bienvenue au AWS Scaling!',
            instance: os.hostname(),
            instanceId: instanceId,
            availabilityZone: availabilityZone,
            timestamp: new Date().toISOString()
        };
        res.render('index', data);
    } catch (error) {
        res.render('error', { error });
    }
});

app.get('/health', async (req, res) => {
    try {
        // Fonction pour calculer l'utilisation CPU
        const getCpuUsage = () => {
            const cpus = os.cpus();
            const cpuUsage = cpus.map(cpu => {
                const total = Object.values(cpu.times).reduce((acc, tv) => acc + tv, 0);
                const idle = cpu.times.idle;
                return ((total - idle) / total) * 100;
            });
            return (cpuUsage.reduce((acc, usage) => acc + usage, 0) / cpus.length).toFixed(2);
        };

        const healthData = {
            title: 'État du Système',
            status: 'healthy',
            uptime: process.uptime(),
            memory: {
                total: os.totalmem(),
                free: os.freemem(),
                usage: `${((1 - os.freemem() / os.totalmem()) * 100).toFixed(2)}%`
            },
            cpu: {
                usage: `${getCpuUsage()}%`,
                cores: os.cpus().length
            }
        };
        res.render('health', healthData);
    } catch (error) {
        res.render('error', { error });
    }
});


app.get('/health-check', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

app.get('/load-test', async (req, res) => {
    res.render('load', { title: 'Test de Charge' });
});

app.post('/execute-load', async (req, res) => {
    try {
        const duration = req.body.duration || 5000; // Durée en millisecondes
        const start = Date.now();
        
        // Création d'une vraie charge CPU
        await new Promise(resolve => {
            const endTime = Date.now() + parseInt(duration);
            while (Date.now() < endTime) {
                // Calculs mathématiques intensifs
                for(let i = 0; i < 1000; i++) {
                    Math.sqrt(Math.random() * 10000);
                    Math.sin(Math.random() * 360);
                    Math.cos(Math.random() * 360);
                    Math.pow(Math.random() * 100, 2);
                }
            }
            resolve();
        });

        // Ajout d'informations système dans la réponse
        const usedMemory = process.memoryUsage();
        
        res.json({
            success: true,
            message: 'Test de charge terminé',
            duration: `${Date.now() - start}ms`,
            timestamp: new Date().toISOString(),
            systemInfo: {
                memory: {
                    heapUsed: Math.round(usedMemory.heapUsed / 1024 / 1024) + ' MB',
                    heapTotal: Math.round(usedMemory.heapTotal / 1024 / 1024) + ' MB',
                },
                platform: process.platform,
                cpuArchitecture: process.arch,
                nodeVersion: process.version
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

app.get('/system-info', async (req, res) => {
    try {
        const { instanceId, availabilityZone } = await getEC2Metadata();
        const systemInfo = {
            title: 'Informations Système',
            hostname: os.hostname(),
            platform: os.platform(),
            instanceId: instanceId,
            availabilityZone: availabilityZone,
            cpus: {
                count: os.cpus().length,
                model: os.cpus()[0].model,
                speed: `${os.cpus()[0].speed} MHz`
            },
            memory: {
                total: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
                free: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`
            },
            uptime: `${(os.uptime() / 3600).toFixed(2)} hours`,
            network: os.networkInterfaces()
        };
        res.render('system', systemInfo);
    } catch (error) {
        res.render('error', { error });
    }
});

app.listen(3000, '0.0.0.0', () => {
    console.log('Server running on port 3000');
});