var Service = require('node-windows').Service;

var svc = new Service({
  name:'Desko-SecureId',
  description: 'Desko IdSecure Gateway as Windows Service',
  script: 'E:\\inventsys\\bifrost-controlid\\build\\server.js'
});

svc.on('uninstall',function(){
  console.log('Service Desko-SecureId is uninstalled .');
  console.log('The service exists: ', svc.exists);
});

svc.uninstall();
