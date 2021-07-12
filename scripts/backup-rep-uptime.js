const { exec } = require("child_process");

const dayMs = 86400000;

const backupUptimeJson = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    const yyyy = today.getFullYear();

    const todayString = mm + '/' + dd + '/' + yyyy;
    console.log(`Committing Representative Uptime Backup for date: ${todayString}`);

    exec(`git add src/database/rep-uptime/* && git commit -m "[AUTO]: Backup Rep Uptime for ${todayString}" & git push `,
        (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
    });
}

backupUptimeJson();
setInterval(() => {
    backupUptimeJson();
}, dayMs)