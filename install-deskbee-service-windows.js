var Service = require('node-windows').Service
var wincmd = require('node-windows')

var svc = new Service({
  name: 'deskbee-bifrost-integração',
  description: 'Integração com a plataforma deskbee',
  script: 'C:\\ProgramData\\Bifrost\\server.js',
})

wincmd.isAdminUser(function (isAdmin) {
  if (isAdmin) {
    console.log('The user has administrative privileges.')
  } else {
    console.log('NOT AN ADMIN')
  }
})

svc.on('install', function () {
  console.log('bifrost deskbee installed')
  svc.start()
})

svc.install()
