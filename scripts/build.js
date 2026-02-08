import dotenv from 'dotenv';
import { NodeSSH } from 'node-ssh';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), './scripts/.env.local') });

const { SSH_HOST, SSH_PORT, SSH_USER, SSH_PASSWORD, FRONTEND_DIR } =
  process.env;

const ssh = new NodeSSH();

await ssh.connect({
  host: SSH_HOST,
  port: SSH_PORT,
  username: SSH_USER,
  password: SSH_PASSWORD,
});

const pullChanges = async () => {
  const result = await ssh.execCommand(`cd ${FRONTEND_DIR} && git pull`);
  console.log(result.stdout);
  if (result.code !== 0) throw new Error('Failed to pull changes');
};

const installDependencies = async () => {
  const result = await ssh.execCommand(`cd ${FRONTEND_DIR} && pnpm install --frozen-lockfile`);
  console.log(result.stdout);
  if (result.code !== 0) throw new Error('Failed to install dependencies');
};

const build = async () => {
  const result = await ssh.execCommand(`cd ${FRONTEND_DIR} && pnpm build`);
  console.log(result.stdout);
  if (result.code !== 0) throw new Error('Failed to build');
};

const restartService = async () => {
  const result = await ssh.execCommand(`pm2 restart ycoj-ui`);
  console.log(result.stdout);
  if (result.code !== 0) throw new Error('Failed to restart service');
};

const steps = [pullChanges, installDependencies, build, restartService];

for (const step of steps) {
  console.time(step.name);
  await step();
  console.timeEnd(step.name);
}

console.log('Build completed');
ssh.dispose();
