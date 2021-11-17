var Service = require('node-windows').Service;

var svc = new Service({
  name:'Desko Idsecure',
  description: 'Desko ControlId as Windows Service',
  script: 'C:\\Program Files\\desko-controlid\\server.js'
});

svc.on('install',function(){
  svc.start();
});

svc.install();