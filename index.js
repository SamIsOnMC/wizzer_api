//@author WizzerStudios on Github
//CC 2021 
//Allowed:
//:: Editing
//Disallowed
//:: Redistributing
//:: Claiming as yours 

//Importing stuff
var http = require('http');
const { exec } = require("child_process");
var url = require('url');
var https = require('https');
const fs = require('fs');

//Console log
console.log("Wizzer API booted.")

//Create API / HTTP Server
http.createServer(function (req, res) {
  req.addListener('data', (data) => {
    console.log(data)
  });
  var q = url.parse(req.url, true).query;

  //Check if password is correctly given.
  if(q.password == "Password"){
    //Switch to the action.
    switch(q.action){
      //If action is undefined:
      case undefined:
        return res.end("Action not given.");
        break;
      //Get Logs is coming soon.
      case "getlogs":
        if(q.sname == undefined) res.end("No server name given.");
        try {
          const data = fs.readFileSync('serverfiles/' + q.sname + '/logs/latest.log', 'utf8');
          return res.end(data);
        } catch (err) {
          console.error(err)
          return res.end("Error occured! Server does not exist or isn't available.");    
        }
      //Start the server using the bash screen command.
      case "stop":
       //If no server name is given, end the connection.
       if(q.sname == undefined) return res.end("Server name not specified.");
       //If server exists, run the screen command.
       if (fs.existsSync('./servers/' + q.sname + '.json')) {
         //Check if a screen session with the same name is already running.
         exec('screen -S ' + q.sname + ' -Q select . ; echo $?',
         (error, stdout, stderror) => {
         if (error) {
           console.error("Error: ", error);
           return;
         }
         var out = stdout;
         if(out.includes('0')){
          exec('screen -p 0 -S minecraft-server -X eval `stuff "say TEST MESSAGE..."\\015`', (error, stdout, stderror) => {
            return res.end("Server stopped!"); //It says it stopped and crashes here !!!
          });
         } else {
          return res.end('Server already stopped!');
         }});
       } else {
        return res.end("Server does not exist!");
       }
       break;
      case "start":
        //If no server name is given, end the connection.
        if(q.sname == undefined) return res.end("Server name not specified.");
        //If server exists, run the screen command.
        if (fs.existsSync('./servers/' + q.sname + '.json')) {
          //Check if a screen session with the same name is already running.
          exec('screen -S ' + q.sname + ' -Q select . ; echo $?',
          (error, stdout, stderror) => {
          if (error) {
            console.error("Error: ", error);
          }
          var out = stdout;
          if(out.includes('1')){
            exec('screen -S ' + q.sname + ' -dm bash /home/mcserver/api/serverfiles/' + q.sname + '/start.sh', (error, stdout, stderror) => {
              console.log(stdout)
              return res.end("Server started!");
            });
          } else {
            return res.end('Server already started!');
          }});
          break;
        } else {
          return res.end("Server does not exist!");
        }
      //Create server action.
      case "createServer":
        //If no game is given, end connection.
        if(q.game == undefined) return res.end("Game not given");
        //Switch to the game chosen.
        switch(q.game){
          //Minecraft
          case "minecraft":
            if(q.sname == undefined) return res.end("Server name not given."); // No server name given, end connection.
            if(q.port == undefined) return res.end("Port not given."); // No port given, end connection.
            if(q.ram == undefined) return res.end("Please give ram in gigabytes."); // No ram given, end connection.
            if(q.software == undefined) return res.end("Server software not given."); // Server software not given, end connection.
            if(q.version == undefined) return res.end("Server version not given."); // Version not given, end connection.
            //Check if server already exists:
            var path = './servers/' + q.sname + '.json';
            if (fs.existsSync(path)) {
              res.end("Server Exists.");
              return;
            }
            ram = Number(q.ram);
            ram *= 1024;
            let server = { 
              name: q.sname,
              port: q.port, 
              game: 'Minecraft',
              ram: Number(ram),
              software: q.software,
              version: q.version
            };
            let data = JSON.stringify(server, null, 2);
            fs.mkdir('./serverfiles/' + q.sname, (err) => {
                if (err) {
                  console.log(err)
                }
            });
            fs.writeFile('/home/mcserver/api/serverfiles/' + q.sname + '/eula.txt', 'eula=true', function (err) {
              if (err) return res.end(err);
              if(err) console.log(err);
            });
            fs.writeFile('/home/mcserver/api/serverfiles/' + q.sname + '/start.sh', '#!/bin/bash\ncd /home/mcserver/api/serverfiles/' + q.sname + '\njava -Xmx' + Number(ram) + 'M ' + '-Xms' + Number(ram) + 'M -jar /home/mcserver/api/serverfiles/' + q.sname + '/server.jar -nogui', function (err) {
              if (err) return res.end(err);
              if(err) console.log(err);
            });
            exec('chmod +x /home/mcserver/api/serverfiles/' + q.sname + '/start.sh');
            fs.writeFile('/home/mcserver/api/serverfiles/' + q.sname + '/server.properties', 'port=' + q.port, function (err) {
              if (err) return res.end(err);
              if(err) console.log(err);
            });
            try{
                https.get("https://serverjars.com/api/fetchJar/" + q.software + "/" + q.version, function(response) { response.pipe(fs.createWriteStream("serverfiles/" + q.sname + '/server.jar'))});
            } catch(err){
              return res.end("Failed!");
            }
            fs.writeFile("servers/" + q.sname + ".json", data, (err) => {});
            res.write("Server Software: " + q.software);
            res.write("\nRam: " + Number(ram));
            res.write("\nServer name: " + q.sname);
            res.write("\nGame: Minecraft");
            res.write("\nPort: " + q.port);
            return res.end("\nVersion " + q.version);

        }
    }
  }
}).listen(8080);