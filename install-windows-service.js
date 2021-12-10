var Service = require('node-windows').Service;

var svc = new Service({
  name:'Desko-SecureId',
  description: 'Desko IdSecure Gateway',
  script: 'C:\\Program Files\\desko-secureid\\server.js'
});

svc.on('install',function(){
  console.log('Install');
  svc.start();
});

svc.install();