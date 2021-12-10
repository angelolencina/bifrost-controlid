var Service = require('node-windows').Service;

var svc = new Service({
  name:'Desko-SecureId',
  description: 'Desko IdSecure Gateway as Windows Service',
  script: 'C:\\Program Files\\desko-secureid\\server.js'
});

svc.on('uninstall',function(){
  console.log('Uninstall complete.');
  console.log('The service exists: ', svc.exists);
});

svc.uninstall();