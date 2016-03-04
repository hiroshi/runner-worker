var spawn = require('child_process').spawn
var Queue = require('firebase-queue'),
    Firebase = require('firebase')

if (process.argv.length < 4) {
  console.log("usage: node worker.js firebaseUrl command [arg1, arg2, ...]")
  console.log("  For authentication, set FIREBASE_TOKEN environment variable.")
  process.exit()
}
var queueUrl = process.argv[2]
var cmdArgs = process.argv.slice(3)

var queueRef = new Firebase(queueUrl)
var start = function () {
  // presence of worker
  queueRef.root().child('.info/connected').on('value', function(snapshot) {
    if (snapshot.val()) {
      var workerRef = queueRef.child("workers").push({hostname: require('os').hostname()})
      workerRef.onDisconnect().remove();
    }
  })
  console.log("WORKER: waiting a runner pushed a task...")
  var queue = new Queue(queueRef, function (data, progress, resolve, reject) {
    // Read and process task data
    var bufferRef = new Firebase(data.bufferUrl)
    var log = function (msg) {
      bufferRef.child('log').push(msg.toString())
      process.stdout.write(msg.toString())
    }
    log("WORKER: start command: " + cmdArgs + "\n\n")
    var env = Object.create(process.env)
    for (var name in data.env) {
      env[name] = data.env[name]
    }
    var cmd
    if (os.platform() === 'win32') {
      cmd = spawn(process.env.comspec, ['/c'].concat(cmdArgs), { env: env })
    } else {
      cmd = spawn(cmdArgs[0], cmdArgs.slice(1), { env: env })
    }
    cmd.stdout.on('data', log)
    cmd.stderr.on('data', log)
    cmd.on('error', function (err) { reject(err) })
    cmd.on('close', function (code) {
      if (code === 0) {
        log("\nWORKER: command completed.\n\n")
        resolve()
      } else {
        log("\nWORKER: command failed.\n\n")
        reject("exit code: " + code)
      }
      console.log("WORKER: waiting a runner pushed another task...")
    })
  })
  // graceful shutdown
  process.on('SIGINT', function () {
    console.log('WORKER: Starting queue shutdown...');
    queue.shutdown().then(function () {
      console.log('WORKER: Finished queue shutdown.');
      process.exit(1)
    });
  })
}

if (process.env.FIREBASE_TOKEN) {
  queueRef.authWithCustomToken(process.env.FIREBASE_TOKEN, function (error, result) {
    if (error) {
      console.log("WORKER: Authentication Failed:", error)
    } else {
      console.log("WORKER: Authentication succeeded!")
      start()
    }
  })
  delete process.env.FIREBASE_TOKEN
} else {
  start()
}
