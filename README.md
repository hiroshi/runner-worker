runner-worker
=============

- A runner pushs a task with pairs of env to a queue.
- A worker pops the task and execute a command, specified at start time, with the env.
- A runner and a worker can be anywhare with internet connection.
- Implemented with node.js as a simple wrapper of [Firebase Queue](https://github.com/firebase/firebase-queue).


## Example

Start a worker.

```
$ (cd worker && npm install)
$ node worker/worker.js https://runner-worker.firebaseio-demo.com/queue printenv hello
WORKER: waiting a runner pushed a task...
# you may see some warning about index...
```

You can see your worker's presence on https://runner-worker.firebaseio-demo.com/queue.

Then, start a runner.

```
$ (cd runner && npm install)
$ node runner/runner.js https://runner-worker.firebaseio-demo.com/queue hello=world
RUNNER: task pushed: env: {"hello":"world"}
RUNNER: waitning a worker process the task...
WORKER: start command: printenv,hello

world

WORKER: command completed.
```

Back to the terminal which the worker is running. You will see same output of runner.


## What is it good for?

- E.g. Workers on Mac or Windows host in a LAN. Runner on a hosted CI


## Security

- See [Firebase queue security](https://github.com/firebase/firebase-queue#queue-security)

## Caveates

- FirebaseQueue may set task timeout 5 minutes by default. If you need more longer time, say 1h, you need to set `{"timeout": 3600000, "in_progress_state": "in_progress"}` to `$queue_url/specs/default`.
