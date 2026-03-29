const { spawn } = require('child_process');
const cp = spawn('npx', ['wrangler', 'deploy']);

cp.stdout.on('data', (data) => {
  const str = data.toString();
  console.log(str);
  if (str.includes('Would you like to continue')) {
    cp.stdin.write('y\n');
  }
  if (str.includes('Are you sure you want to deploy')) {
    cp.stdin.write('y\n');
  }
});

cp.stderr.on('data', (data) => {
  console.error(data.toString());
});

cp.on('close', (code) => {
  console.log(child process exited with code );
});
