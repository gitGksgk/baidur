  function defaultEval(code, context, file, cb) {
    let result, script, wrappedErr;
    let err = null;
    let wrappedCmd = false;
    let awaitPromise = false;
    const input = code;

    if (/^\s*{/.test(code) && /}\s*$/.test(code)) {
      // It's confusing for `{ a : 1 }` to be interpreted as a block
      // statement rather than an object literal.  So, we first try
      // to wrap it in parentheses, so that it will be interpreted as
      // an expression.  Note that if the above condition changes,
      // lib/internal/repl/utils.js needs to be changed to match.
      code = `(${code.trim()})\n`;
      wrappedCmd = true;
    }

    if (experimentalREPLAwait && code.includes('await')) {
      if (processTopLevelAwait === undefined) {
        ({ processTopLevelAwait } = require('internal/repl/await'));
      }

      const potentialWrappedCode = processTopLevelAwait(code);
      if (potentialWrappedCode !== null) {
        code = potentialWrappedCode;
        wrappedCmd = true;
        awaitPromise = true;
      }
    }

    // First, create the Script object to check the syntax
    if (code === '\n')
      return cb(null);

    while (true) {
      try {
        if (!/^\s*$/.test(code) &&
            self.replMode === exports.REPL_MODE_STRICT) {
          // "void 0" keeps the repl from returning "use strict" as the result
          // value for statements and declarations that don't return a value.
          code = `'use strict'; void 0;\n${code}`;
        }
        script = vm.createScript(code, {
          filename: file,
          displayErrors: true
        });
      } catch (e) {
        debug('parse error %j', code, e);
        if (wrappedCmd) {
          // Unwrap and try again
          wrappedCmd = false;
          awaitPromise = false;
          code = input;
          wrappedErr = e;
          continue;
        }
        // Preserve original error for wrapped command
        const error = wrappedErr || e;
        if (isRecoverableError(error, code))
          err = new Recoverable(error);
        else
          err = error;
      }
      break;
    }

    // This will set the values from `savedRegExMatches` to corresponding
    // predefined RegExp properties `RegExp.$1`, `RegExp.$2` ... `RegExp.$9`
    regExMatcher.test(savedRegExMatches.join(sep));

    let finished = false;
    function finishExecution(err, result) {
      if (finished) return;
      finished = true;

      // After executing the current expression, store the values of RegExp
      // predefined properties back in `savedRegExMatches`
      for (var idx = 1; idx < savedRegExMatches.length; idx += 1) {
        savedRegExMatches[idx] = RegExp[`$${idx}`];
      }

      cb(err, result);
    }

    if (!err) {
      // Unset raw mode during evaluation so that Ctrl+C raises a signal.
      let previouslyInRawMode;
      if (self.breakEvalOnSigint) {
        // Start the SIGINT watchdog before entering raw mode so that a very
        // quick Ctrl+C doesn't lead to aborting the process completely.
        if (!startSigintWatchdog())
          throw new ERR_CANNOT_WATCH_SIGINT();
        previouslyInRawMode = self._setRawMode(false);
      }

      try {
        try {
          const scriptOptions = {
            displayErrors: false,
            breakOnSigint: self.breakEvalOnSigint
          };

          if (self.useGlobal) {
            result = script.runInThisContext(scriptOptions);
          } else {
            result = script.runInContext(context, scriptOptions);
          }
        } finally {
          if (self.breakEvalOnSigint) {
            // Reset terminal mode to its previous value.
            self._setRawMode(previouslyInRawMode);

            // Returns true if there were pending SIGINTs *after* the script
            // has terminated without being interrupted itself.
            if (stopSigintWatchdog()) {
              self.emit('SIGINT');
            }
          }
        }
      } catch (e) {
        err = e;

        if (process.domain) {
          debug('not recoverable, send to domain');
          process.domain.emit('error', err);
          process.domain.exit();
          return;
        }
      }

      if (awaitPromise && !err) {
        let sigintListener;
        pause();
        let promise = result;
        if (self.breakEvalOnSigint) {
          const interrupt = new Promise((resolve, reject) => {
            sigintListener = () => {
              const tmp = Error.stackTraceLimit;
              Error.stackTraceLimit = 0;
              const err = new ERR_SCRIPT_EXECUTION_INTERRUPTED();
              Error.stackTraceLimit = tmp;
              reject(err);
            };
            prioritizedSigintQueue.add(sigintListener);
          });
          promise = Promise.race([promise, interrupt]);
        }

        promise.then((result) => {
          finishExecution(null, result);
        }, (err) => {
          if (err && process.domain) {
            debug('not recoverable, send to domain');
            process.domain.emit('error', err);
            process.domain.exit();
            return;
          }
          finishExecution(err);
        }).finally(() => {
          // Remove prioritized SIGINT listener if it was not called.
          prioritizedSigintQueue.delete(sigintListener);
          unpause();
        });
      }
    }

    if (!awaitPromise || err) {
      finishExecution(err, result);
    }
  }
