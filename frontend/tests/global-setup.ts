import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function killPort5173(): Promise<void> {
  try {
    if (process.platform === 'win32') {
      const { stdout } = await execAsync('netstat -ano | findstr :5173 | findstr LISTENING');
      const match = stdout.match(/LISTENING\s+(\d+)/);
      if (match) {
        const pid = match[1];
        console.log(`🧹 Killing process ${pid} on port 5173`);
        await execAsync(`taskkill /F /PID ${pid}`);
      }
    }
  } catch (e) {
    console.log('✅ Port 5173 already free');
  }
}

export default async function globalSetup(): Promise<void> {
  console.log('\n========================================');
  console.log('🚀 Starting E2E Test Suite');
  console.log('========================================');
  
  console.log('\n🧹 Pre-test cleanup:');
  await killPort5173();
  
  console.log('✅ Cleanup complete\n');
}

export async function globalTeardown(): Promise<void> {
  console.log('\n========================================');
  console.log('🧹 Post-test cleanup');
  console.log('========================================');
  
  await killPort5173();
  
  console.log('✅ Teardown complete\n');
}
