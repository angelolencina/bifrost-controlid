var Service = require('node-windows').Service;

var svc = new Service({
  name:'deskbee-bifrost-integração',
  description: 'Integração com a plataforma deskbee',
  script: 'C:\\ProgramData\\Bifrost\\server.js'
});

svc.on('uninstall',function(){
  console.log('Service deskbee-bifrost-integração uninstalled .');
  console.log('The service deskbee-bifrost-integração exists: ', svc.exists);
});

svc.uninstall();
