import { sendAdminAlert } from './telegram';

const FE_URL = process.env.FE_URL || 'https://foodshare777.web.app';
const BE_URL = process.env.BE_URL || 'https://api.et3am.com';
const CHECK_INTERVAL = process.env.HEALTH_CHECK_INTERVAL ? parseInt(process.env.HEALTH_CHECK_INTERVAL) : 60000;

interface ServiceStatus {
  name: string;
  url: string;
  lastUp: boolean;
  lastCheck: number;
  consecutiveFailures: number;
}

const services: ServiceStatus[] = [
  { name: 'Frontend', url: FE_URL, lastUp: true, lastCheck: 0, consecutiveFailures: 0 },
  { name: 'Backend', url: `${BE_URL}/api/health`, lastUp: true, lastCheck: 0, consecutiveFailures: 0 },
];

async function checkService(service: ServiceStatus): Promise<boolean> {
  try {
    const response = await fetch(service.url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function runHealthCheck() {
  console.log('[monitor] Running service health check...');
  
  for (const service of services) {
    const isUp = await checkService(service);
    const wasUp = service.lastUp;
    
    service.lastCheck = Date.now();
    service.lastUp = isUp;
    
    if (isUp && !wasUp) {
      console.log(`[monitor] ${service.name} is BACK UP`);
      await sendAdminAlert(service.name, 'UP', `Service recovered after ${service.consecutiveFailures} failures`);
      service.consecutiveFailures = 0;
    } else if (!isUp && wasUp) {
      console.log(`[monitor] ${service.name} is DOWN!`);
      service.consecutiveFailures = 1;
      await sendAdminAlert(service.name, 'DOWN', `Service not responding at ${service.url}`);
    } else if (!isUp) {
      service.consecutiveFailures++;
      if (service.consecutiveFailures === 5 || service.consecutiveFailures === 10 || service.consecutiveFailures % 15 === 0) {
        console.log(`[monitor] ${service.name} still DOWN (${service.consecutiveFailures} consecutive failures)`);
        await sendAdminAlert(service.name, 'DOWN', `Still down after ${service.consecutiveFailures} checks. URL: ${service.url}`);
      }
    }
  }
}

export function startMonitoring() {
  console.log(`[monitor] Starting service monitoring (interval: ${CHECK_INTERVAL}ms)`);
  console.log(`[monitor] Monitoring: ${services.map(s => `${s.name}: ${s.url}`).join(', ')}`);
  
  runHealthCheck();
  
  setInterval(runHealthCheck, CHECK_INTERVAL);
}