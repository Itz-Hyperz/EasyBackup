// Basic Imports
const config = require("./config.json");
const express = require("express");
const app = express();
const chalk = require('chalk');
const fs = require('node:fs');
const utils = require('hyperz-utils')

// Backend Initialization
const backend = require('./backend.js');
backend.init(app);

// Routing
app.get('', async function(req, res) {
    let uploads = JSON.parse(fs.readFileSync(`./uploads.json`));
    res.render('index.ejs', { uploads: uploads.reverse() });
});

app.post('/backup', async function(req, res) {
    res.set('Access-Control-Allow-Origin', '*');
    if(!req.headers.secret) return res.type('json').send(JSON.stringify({"success": false,"info": "No secret was provided in post request headers."}, null, 4) + '\n');
    let blacklists = JSON.parse(fs.readFileSync(`./blacklisted.json`));
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if(blacklists.filter(a => a.address == clientIp).length >= 3) {
        return res.type('json').send(JSON.stringify({"success": false,"info": "Your IP has been blacklisted from making requests to EasyBackup. If this was a mistake, reset it via the blacklisted.json file."}, null, 4) + '\n');
    } else {
        if(req.headers.secret !== config.apiSecret) {
            blacklists.push({ address: clientIp, time: await utils.fetchTime('EST', 'MM-DD-YYYY hh:mm:ss A') });
            let blacklistsString = JSON.stringify(blacklists, null, 4) + '\n';
            fs.writeFileSync('./blacklisted.json', blacklistsString);
            return res.type('json').send(JSON.stringify({"success": false,"info": `Secret does not match the secret provided in the EasyBackup config file. You have ${3 - blacklists.filter(a => a.address == clientIp).length} chance(s) left...`}, null, 4) + '\n');
        };  
    };
    if(!req.files[0]) return res.type('json').send(JSON.stringify({"success": false,"info": "No file was provided in the post request."}, null, 4) + '\n');
    let time = await utils.fetchTime('EST', 'MM-DD-YYYY hh:mm:ss A');
    let fileNames = [];
    for(let file of req.files) {
        fileNames.push(file.originalname);
        fs.writeFile(`./uploads/${file.originalname}`, file.buffer, { flag: 'wx' }, (error) => {
            if (error) return res.type('json').send(JSON.stringify({"success": false,"info": "Error writing file: " + error.message}, null, 4) + '\n');
        });
    };
    let uploads = JSON.parse(fs.readFileSync(`./uploads.json`));
    uploads.push({
        "time": time,
        "files": fileNames
    });
    uploads = JSON.stringify(uploads, null, 4) + '\n';
    fs.writeFileSync(`./uploads.json`, uploads);
    console.log(`----------------------\nFiles Uploaded Successfully - ${time}`)
    return res.type('json').send(JSON.stringify({"success": true,"info": "Backup success!"}, null, 4) + '\n');
});

// MAKE SURE THIS IS LAST FOR 404 PAGE REDIRECT
app.get('*', function(req, res){
    res.render('404.ejs');
});

// Server Initialization
app.listen(config.port)
console.log(chalk.blue('EasyBackup Started on Port ' + config.port));

// Rejection Handler
process.on('unhandledRejection', (err) => { 
    if(config.debugMode) console.log(chalk.red(err));
});
