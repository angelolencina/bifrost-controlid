import * as nodewindows from 'node-windows'
var Service = nodewindows.Service
var wincmd = nodewindows

var svc = new Service({
  name: 'deskbee-bifrost-integração',
  description: 'Integração com a plataforma deskbee',
  script: 'C:\\ProgramData\\Bifrost\\server.js',
  wait: 2,
  grow: .5,
})

wincmd.isAdminUser(function (isAdmin) {
  if (isAdmin) {
    console.log('The user has administrative privileges.')
  } else {
    console.log('NOT AN ADMIN')
  }
})

svc.on('install', function () {
  console.log('deskbee bifrost installed')
  svc.start()
})

svc.install()
