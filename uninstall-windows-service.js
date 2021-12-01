var Service = require('node-windows').Service;

var svc = new Service({
  name:'Desko IdSecure',
  description: 'Desko IdSecure Gateway as Windows Service',
  script: 'C:\\Program Files\\desko-idsecure\\server.js'
});

svc.on('uninstall',function(){
  console.log('Uninstall complete.');
  console.log('The service exists: ', svc.exists);
});

svc.uninstall();