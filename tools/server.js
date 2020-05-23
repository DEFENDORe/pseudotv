import { exec } from 'child_process';

// Launch or restart the Node.js server
function runServer() {
    exec("cd web && ls", (err, stdout) => {
        console.warn(err);
        console.warn(stdout);
    })
}

runServer();