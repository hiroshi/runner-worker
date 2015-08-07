// Firebase Javascript Client
var readline = require('readline')
var Firebase = require('firebase')

if (process.argv.length < 3) {
  console.log("usage: node runner.js <firebaseUrl> [env1=val1, env2=val2, ...]")
  console.log("  For authentication, set FIREBASE_TOKEN environment variable.")
  process.exit()
}
var queueUrl = process.argv[2]
var env = {}
process.argv.slice(3).map(function (keyVal) {
  var m = keyVal.match(/^([^=]+)=?(.*)$/)
  env[m[1]] = m[2] || true
})

var queueRef = new Firebase(queueUrl)
var start = function () {
  if (process.FIREBASE_TOKEN) {
    queueRef.auth(process.FIREBASE_TOKEN, function (error, result) {
      if (error) {
        console.log("Authentication Failed!", error);
      }
    })
    delete env.FIREBASE_TOKEN
  }
  var bufferRef = queueRef.child('buffers').push(null)
  var taskRef = queueRef.child('tasks').push({bufferUrl: bufferRef.toString(), env: env}, function (err) {
    console.log("RUNNER: task pushed: env: " + JSON.stringify(env))
  })
  taskRef.on("value", function (snap) {
    var val = snap.val()
    if (val == null) {
      setTimeout(function () { process.exit() }, 300)
      // bufferRef.child("log").on("value", function (snap) {
      //   if (snap.val() == null) {
      //     process.exit()
      //   }
      // })
    } else {
      if (val._state == 'error') {
        console.log("RUNNER: Worker Error: " + val._error_details.error)
        if (val._error_details.error_stack) {
          console.log(val._error_details.error_stack)
        }
        process.exit()
      }
    }
  })
  bufferRef.child("log").on("child_added", function (snap) {
    process.stdout.write(snap.val())
    snap.ref().remove()
  })
}

if (process.env.FIREBASE_TOKEN) {
  queueRef.authWithCustomToken(process.env.FIREBASE_TOKEN, function (error, result) {
    if (error) {
      console.log("Authentication Failed!", error);
    } else {
      console.log("Authentication succeeded!", result);
      start()
    }
  })
  delete env.FIREBASE_TOKEN
} else {
  start()
}
