// Basic Imports
const config = require("./config.json");
const chalk = require('chalk');
const ms = require('ms');
const FormData = require('form-data');
const fs = require('node:fs');
const utils = require('hyperz-utils');
const axios = require('axios');
const { spawn } = require("child_process");

setInterval(async function() {
    let form = new FormData();
    config.sql.databases.forEach(async function(database) {
        const writeStream = fs.createWriteStream(`./backups/${database}.sql`)
        const mysqldump = spawn('mysqldump', [
            '-u', config.sql.user,
            '-p' + config.sql.password,
            database,
        ]);
        mysqldump.stdout.pipe(writeStream).on('finish', async function () {
            console.log(chalk.yellow(`Backup Saved: ${database} - ${await utils.fetchTime('EST', 'MM-DD-YYYY hh:mm A')}`))
        }).on('error', function (err) {
            console.log(err)
        });
        setTimeout(function() {
            let file = fs.readFileSync(`./backups/${database}.sql`);
            form.append(`file${database}`, file, `${database}.sql`);
        }, 1500);
    });
    setTimeout(async function() {
        let request = await axios.post(config.requestURL, form, {
            headers: {
                'secret': config.apiSecret
            }
        });
        if(!request.data.success) return console.log(chalk.red(`ERROR:\n\n${request.data.info}`));
    }, 3000);
    console.log('-------------------------------------')
}, ms(config.timeInterval));

console.log(chalk.blue('EasyBackup Program Started!'));

// Rejection Handler
process.on('unhandledRejection', (err) => { 
    if(config.debugMode) console.log(chalk.red(err));
});
