var Service = require('node-windows').Service;

var svc = new Service({
  name:'Desko-SecureId',
  description: 'Desko IdSecure Gateway as Windows Service',
  script: 'C:\\ProgramData\\Bifrost\\server.js'
});

svc.on('uninstall',function(){
  console.log('Service Desko-SecureId is uninstalled .');
  console.log('The service exists: ', svc.exists);
});

svc.uninstall();
