var Service = require('node-windows').Service;
var wincmd = require('node-windows');

var svc = new Service({
  name:'Desko-SecureId',
  description: 'Desko IdSecure Gateway',
  script: 'E:\\inventsys\\bifrost-controlid\\build\\server.js'

});

wincmd.isAdminUser(function(isAdmin){
  if (isAdmin) {
    console.log('The user has administrative privileges.');
  } else {
    console.log('NOT AN ADMIN');
  }
});


svc.on('install',function(){
  console.log('Desko-SecureId Installed');
  svc.start();
});




svc.install();
