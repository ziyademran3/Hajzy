var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// ../node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// ../node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
if (!("__unenv__" in performance)) {
  const proto = Performance.prototype;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key !== "constructor" && !(key in performance)) {
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc) {
        Object.defineProperty(performance, key, desc);
      }
    }
  }
}
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// ../node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// ../node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// ../node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// ../node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// ../node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// ../node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// ../node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// ../node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// ../node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// ../node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// ../node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// ../node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert: assert2,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime3,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// ../node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// api/[[path]].js
import { connect } from "cloudflare:sockets";
var json = /* @__PURE__ */ __name((data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS"
  }
}), "json");
var isValidEmail = /* @__PURE__ */ __name((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), "isValidEmail");
var toBase64 = /* @__PURE__ */ __name((value) => btoa(typeof value === "string" ? value : String.fromCharCode(...value)), "toBase64");
var toBase64Url = /* @__PURE__ */ __name((value) => toBase64(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""), "toBase64Url");
var fromBase64Url = /* @__PURE__ */ __name((value) => {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}, "fromBase64Url");
var utf8 = /* @__PURE__ */ __name((text) => new TextEncoder().encode(text), "utf8");
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", utf8(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: 1e5 },
    key,
    256
  );
  return `pbkdf2:100000:${toBase64Url(salt)}:${toBase64Url(new Uint8Array(bits))}`;
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, stored) {
  if (!stored || !stored.startsWith("pbkdf2:")) return false;
  const [, iterationText, salt, expected] = stored.split(":");
  const key = await crypto.subtle.importKey("raw", utf8(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: fromBase64Url(salt), iterations: Number(iterationText) },
    key,
    256
  );
  return toBase64Url(new Uint8Array(bits)) === expected;
}
__name(verifyPassword, "verifyPassword");
async function signJwt(payload, secret) {
  const header = toBase64Url(utf8(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = toBase64Url(utf8(JSON.stringify(payload)));
  const data = `${header}.${body}`;
  const key = await crypto.subtle.importKey("raw", utf8(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, utf8(data));
  return `${data}.${toBase64Url(new Uint8Array(signature))}`;
}
__name(signJwt, "signJwt");
async function verifyJwt(token, secret) {
  const [header, body, signature] = String(token || "").split(".");
  if (!header || !body || !signature) throw new Error("invalid");
  const data = `${header}.${body}`;
  const key = await crypto.subtle.importKey("raw", utf8(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const valid = await crypto.subtle.verify("HMAC", key, fromBase64Url(signature), utf8(data));
  if (!valid) throw new Error("invalid");
  const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body)));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1e3)) throw new Error("expired");
  return payload;
}
__name(verifyJwt, "verifyJwt");
function authStore(env2) {
  const kv = env2.HAJZY_AUTH;
  if (!kv) return null;
  return {
    async getByEmail(email) {
      const raw = await kv.get(`email:${email}`);
      return raw ? JSON.parse(raw) : null;
    },
    async getById(id) {
      const raw = await kv.get(`id:${id}`);
      return raw ? JSON.parse(raw) : null;
    },
    async getByResetToken(token) {
      const raw = await kv.get(`reset:${token}`);
      if (!raw) return null;
      const record = JSON.parse(raw);
      if (new Date(record.expiresAt) <= /* @__PURE__ */ new Date()) {
        await kv.delete(`reset:${token}`);
        return null;
      }
      return this.getById(record.userId);
    },
    async getByVerificationToken(token) {
      const userId = await kv.get(`verify:${token}`);
      return userId ? this.getById(userId) : null;
    },
    async save(user) {
      await kv.put(`id:${user.id}`, JSON.stringify(user));
      await kv.put(`email:${user.email}`, JSON.stringify(user));
      return user;
    },
    async setResetToken(user, token, expiresAt) {
      await kv.put(`reset:${token}`, JSON.stringify({ userId: user.id, expiresAt }), { expirationTtl: 60 * 30 });
    },
    async clearResetToken(token) {
      await kv.delete(`reset:${token}`);
    },
    async setVerificationToken(userId, token) {
      await kv.put(`verify:${token}`, userId);
    },
    async clearVerificationToken(token) {
      await kv.delete(`verify:${token}`);
    }
  };
}
__name(authStore, "authStore");
async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
__name(readBody, "readBody");
function bearer(request) {
  const header = request.headers.get("Authorization") || "";
  const parts = header.split(" ");
  return parts.length === 2 ? parts[1] : parts[0];
}
__name(bearer, "bearer");
function resetEmailHtml(resetLink) {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<body style="margin:0;padding:0;background:#f1f5f9;font-family:sans-serif;color:#1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:40px 15px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;background:#fff;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr><td align="center" style="background:linear-gradient(135deg,#064e3b,#0d9488);padding:36px 20px;">
          <h1 style="margin:0;color:#fff;font-size:24px;">Hajzy | \u062D\u062C\u0632\u064A</h1>
        </td></tr>
        <tr><td style="padding:36px 30px;text-align:right;direction:rtl;">
          <h2 style="margin:0 0 14px;font-size:20px;">\u0637\u0644\u0628 \u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631</h2>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#475569;">\u0627\u0636\u063A\u0637 \u0639\u0644\u0649 \u0627\u0644\u0632\u0631 \u0623\u062F\u0646\u0627\u0647 \u0644\u0627\u062E\u062A\u064A\u0627\u0631 \u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631 \u062C\u062F\u064A\u062F\u0629:</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#0d9488,#059669);color:#fff;text-decoration:none;font-weight:700;padding:14px 34px;border-radius:14px;">\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u0622\u0646</a>
          </div>
          <p style="font-size:12px;color:#94a3b8;word-break:break-all;direction:ltr;text-align:left;">${resetLink}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
__name(resetEmailHtml, "resetEmailHtml");
function verificationEmailHtml(name, verificationLink) {
  const safeName = String(name || "\u0636\u064A\u0641\u0646\u0627 \u0627\u0644\u0639\u0632\u064A\u0632").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:40px 15px;background:#f1f5f9;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#fff;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 12px 36px rgba(15,23,42,.08);">
        <tr><td align="center" style="background:linear-gradient(135deg,#064e3b,#0d9488);padding:34px 20px;">
          <div style="width:54px;height:54px;line-height:54px;border-radius:16px;background:#fff;color:#0d9488;font-size:27px;font-weight:900;margin:0 auto 12px;">H</div>
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;">Hajzy | \u062D\u062C\u0632\u064A</h1>
          <p style="margin:7px 0 0;color:#a7f3d0;font-size:13px;">\u0623\u0647\u0644\u064B\u0627 \u0628\u0643 \u0641\u064A \u0645\u062C\u062A\u0645\u0639 \u062D\u062C\u0632\u064A</p>
        </td></tr>
        <tr><td style="padding:36px 30px;text-align:right;direction:rtl;">
          <h2 style="margin:0 0 14px;font-size:22px;color:#0f172a;">\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A</h2>
          <p style="margin:0 0 14px;font-size:15px;line-height:1.8;color:#475569;">\u0645\u0631\u062D\u0628\u064B\u0627 ${safeName}\u060C</p>
          <p style="margin:0;font-size:15px;line-height:1.8;color:#475569;">\u0634\u0643\u0631\u064B\u0627 \u0644\u0627\u0646\u0636\u0645\u0627\u0645\u0643 \u0625\u0644\u0649 Hajzy. \u0623\u0643\u0651\u062F \u0628\u0631\u064A\u062F\u0643 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0644\u062A\u0641\u0639\u064A\u0644 \u062D\u0633\u0627\u0628\u0643 \u0648\u0627\u0644\u0627\u0633\u062A\u0641\u0627\u062F\u0629 \u0645\u0646 \u062C\u0645\u064A\u0639 \u062E\u062F\u0645\u0627\u062A\u0646\u0627.</p>
          <div style="text-align:center;margin:32px 0 24px;">
            <a href="${verificationLink}" style="display:inline-block;background:linear-gradient(135deg,#0d9488,#059669);color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 34px;border-radius:14px;box-shadow:0 8px 20px rgba(13,148,136,.28);">\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A</a>
          </div>
          <div style="padding:14px 16px;border-radius:12px;background:#f0fdfa;color:#0f766e;font-size:13px;line-height:1.7;">\u0625\u0630\u0627 \u0644\u0645 \u062A\u0646\u0634\u0626 \u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628\u060C \u064A\u0645\u0643\u0646\u0643 \u062A\u062C\u0627\u0647\u0644 \u0647\u0630\u0647 \u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0628\u0623\u0645\u0627\u0646.</div>
          <p style="margin:22px 0 0;font-size:11px;line-height:1.6;color:#94a3b8;word-break:break-all;direction:ltr;text-align:left;">\u0625\u0630\u0627 \u0644\u0645 \u064A\u0639\u0645\u0644 \u0627\u0644\u0632\u0631\u060C \u0627\u0646\u0633\u062E \u0627\u0644\u0631\u0627\u0628\u0637 \u0627\u0644\u062A\u0627\u0644\u064A \u0648\u0627\u0641\u062A\u062D\u0647 \u0641\u064A \u0627\u0644\u0645\u062A\u0635\u0641\u062D:<br>${verificationLink}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
__name(verificationEmailHtml, "verificationEmailHtml");
async function readSmtp(reader, decoder, leftover) {
  let buffer = leftover;
  while (true) {
    const lines = buffer.split(/\r?\n/);
    if (lines.length > 1) {
      const line = lines.shift();
      return { line, leftover: lines.join("\n") };
    }
    const { value, done } = await reader.read();
    if (done) return { line: buffer, leftover: "" };
    buffer += decoder.decode(value, { stream: true });
  }
}
__name(readSmtp, "readSmtp");
async function sendViaGmailSmtp({ user, pass, to, subject, html }) {
  const socket = connect(
    { hostname: "smtp.gmail.com", port: 465 },
    { secureTransport: "on" }
  );
  const writer = socket.writable.getWriter();
  const reader = socket.readable.getReader();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let leftover = "";
  const send2 = /* @__PURE__ */ __name(async (command) => {
    await writer.write(encoder.encode(`${command}\r
`));
  }, "send");
  const recv = /* @__PURE__ */ __name(async () => {
    const next = await readSmtp(reader, decoder, leftover);
    leftover = next.leftover;
    return next.line;
  }, "recv");
  const expect = /* @__PURE__ */ __name(async (prefix) => {
    let line = await recv();
    while (line && line[3] === "-") line = await recv();
    if (!line.startsWith(prefix)) throw new Error(line || "SMTP handshake failed");
    return line;
  }, "expect");
  try {
    await expect("220");
    await send2("EHLO hajzy.pages.dev");
    await expect("250");
    await send2("AUTH LOGIN");
    await expect("334");
    await send2(btoa(user));
    await expect("334");
    await send2(btoa(pass));
    await expect("235");
    await send2(`MAIL FROM:<${user}>`);
    await expect("250");
    await send2(`RCPT TO:<${to}>`);
    await expect("250");
    await send2("DATA");
    await expect("354");
    const encodedSubject = `=?UTF-8?B?${btoa(String.fromCharCode(...new TextEncoder().encode(subject)))}?=`;
    const payload = [
      `From: Hajzy <${user}>`,
      `To: ${to}`,
      `Subject: ${encodedSubject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=UTF-8",
      "",
      html,
      "."
    ].join("\r\n");
    await writer.write(encoder.encode(`${payload}\r
`));
    await expect("250");
    await send2("QUIT");
    return { ok: true };
  } finally {
    try {
      await writer.close();
    } catch {
    }
    try {
      reader.releaseLock();
    } catch {
    }
  }
}
__name(sendViaGmailSmtp, "sendViaGmailSmtp");
async function sendEmail(env2, { to, subject, html }) {
  const gmailUser = env2.GMAIL_USER?.trim();
  const gmailPass = env2.GMAIL_APP_PASSWORD?.trim().replace(/\s+/g, "");
  let gmailError = null;
  if (gmailUser && gmailPass) {
    try {
      await sendViaGmailSmtp({ user: gmailUser, pass: gmailPass, to, subject, html });
      return { ok: true };
    } catch (error3) {
      gmailError = error3.message || String(error3);
      console.error("Gmail SMTP error:", gmailError);
    }
  }
  if (env2.RESEND_API_KEY) {
    const from = env2.RESEND_FROM?.trim();
    if (!from) return { ok: false, message: "RESEND_FROM is not configured with a verified sender address." };
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env2.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { ok: false, message: payload.message || "Failed to send email via Resend." };
    }
    return { ok: true };
  }
  if (gmailError) return { ok: false, message: `Gmail could not send the reset email: ${gmailError}` };
  return { ok: false, message: "Email service is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD, or configure Resend." };
}
__name(sendEmail, "sendEmail");
async function paymobRequest(path, body, secretKey) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2e4);
  try {
    const response = await fetch(`https://accept.paymob.com${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...secretKey ? { Authorization: `Token ${secretKey}` } : {}
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.message || payload.detail || `Paymob returned ${response.status}`);
    }
    return payload;
  } catch (error3) {
    if (error3?.name === "AbortError") throw new Error("Timed out while contacting Paymob.");
    throw error3;
  } finally {
    clearTimeout(timeout);
  }
}
__name(paymobRequest, "paymobRequest");
async function createPaymobCheckout(env2, { amount, currency, title: title2, user }) {
  const secretKey = env2.PAYMOB_SECRET_KEY?.trim();
  const publicKey = env2.PAYMOB_PUBLIC_KEY?.trim();
  const integrationId = env2.PAYMOB_INTEGRATION_ID?.trim();
  if (!secretKey || !publicKey || !integrationId) {
    throw new Error("Paymob is not configured. Set PAYMOB_SECRET_KEY, PAYMOB_PUBLIC_KEY, and PAYMOB_INTEGRATION_ID.");
  }
  const amountCents = Math.round(Number(amount) * 100);
  if (!Number.isSafeInteger(amountCents) || amountCents < 100) {
    throw new Error("Payment amount must be at least 1 EGP.");
  }
  const reference = `hajzy-${crypto.randomUUID()}`;
  const [firstName, ...rest] = String(user.fullName || "Hajzy Customer").trim().split(/\s+/);
  const intention = await paymobRequest("/v1/intention/", {
    amount: amountCents,
    currency: currency || "EGP",
    payment_methods: [Number(integrationId)],
    items: [{ name: title2 || "Hajzy booking", amount: amountCents, description: title2 || "Hajzy booking", quantity: 1 }],
    special_reference: reference,
    expiration: 3600,
    billing_data: {
      apartment: "NA",
      email: user.email,
      floor: "NA",
      first_name: firstName || "Customer",
      street: "NA",
      building: "NA",
      phone_number: user.phone || "+201000000000",
      shipping_method: "NA",
      postal_code: "NA",
      city: "Cairo",
      country: "EG",
      last_name: rest.join(" ") || "Customer",
      state: "Cairo"
    }
  }, secretKey);
  if (!intention.client_secret) throw new Error("Paymob did not return a checkout client secret.");
  return {
    provider: "paymob",
    reference,
    orderId: intention.intention_order_id || intention.id,
    redirectUrl: `https://accept.paymob.com/unifiedcheckout/?publicKey=${encodeURIComponent(publicKey)}&clientSecret=${encodeURIComponent(intention.client_secret)}`,
    title: title2
  };
}
__name(createPaymobCheckout, "createPaymobCheckout");
function publicUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    emailVerified: Boolean(user.emailVerified),
    avatar_url: user.avatarUrl || null
  };
}
__name(publicUser, "publicUser");
async function onRequest(context2) {
  const { request, env: env2 } = context2;
  if (request.method === "OPTIONS") return json({ ok: true });
  const requestUrl = new URL(request.url);
  const path = requestUrl.pathname.replace(/\/+$/, "") || "/";
  const db = authStore(env2);
  const jwtSecret = env2.JWT_SECRET || "dev-secret-change-me";
  const appUrl = (env2.APP_URL || requestUrl.origin).replace(/\/$/, "");
  try {
    if (path === "/api/health" && request.method === "GET") {
      return json({
        ok: true,
        mode: db ? "kv" : "unconfigured",
        emailConfigured: Boolean(env2.GMAIL_USER && env2.GMAIL_APP_PASSWORD || env2.RESEND_API_KEY),
        message: "API is healthy (Cloudflare Pages)."
      });
    }
    if (!db) {
      return json({ message: "Auth store is not configured. Bind HAJZY_AUTH KV." }, 500);
    }
    if (path === "/api/auth/register" && request.method === "POST") {
      const { fullName, email, password } = await readBody(request);
      if (!fullName || !email || !password) return json({ message: "fullName, email and password are required." }, 400);
      if (!isValidEmail(email)) return json({ message: "Please provide a valid email address." }, 400);
      if (password.length < 8) return json({ message: "Password must be at least 8 characters long." }, 400);
      const normalizedEmail = email.trim().toLowerCase();
      if (await db.getByEmail(normalizedEmail)) return json({ message: "An account with this email already exists." }, 409);
      const user = {
        id: crypto.randomUUID(),
        fullName: fullName.trim(),
        email: normalizedEmail,
        passwordHash: await hashPassword(password),
        emailVerified: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      const verificationToken = [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, "0")).join("");
      await db.save(user);
      await db.setVerificationToken(user.id, verificationToken);
      await sendEmail(env2, {
        to: normalizedEmail,
        subject: "\u062A\u0623\u0643\u064A\u062F \u0628\u0631\u064A\u062F\u0643 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A | Hajzy",
        html: verificationEmailHtml(user.fullName, `${appUrl}/verify-email?token=${verificationToken}`)
      });
      return json({ message: "User registered successfully. Please verify your email address.", user: publicUser(user) }, 201);
    }
    if (path === "/api/auth/login" && request.method === "POST") {
      const { email, password } = await readBody(request);
      if (!email || !password) return json({ message: "Email and password are required." }, 400);
      const user = await db.getByEmail(String(email).trim().toLowerCase());
      if (!user || !await verifyPassword(password, user.passwordHash)) {
        return json({ message: "Invalid email or password." }, 401);
      }
      const token = await signJwt(
        { userId: user.id, email: user.email, fullName: user.fullName, exp: Math.floor(Date.now() / 1e3) + 7 * 24 * 60 * 60 },
        jwtSecret
      );
      return json({ message: "Login successful.", token, user: publicUser(user) });
    }
    if (path === "/api/auth/forgot-password" && request.method === "POST") {
      const { email } = await readBody(request);
      if (!email || !isValidEmail(email)) return json({ message: "Please provide a valid email address." }, 400);
      const normalizedEmail = email.trim().toLowerCase();
      const user = await db.getByEmail(normalizedEmail);
      if (!user) {
        return json({
          ok: false,
          emailSent: false,
          message: "\u0647\u0630\u0627 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u063A\u064A\u0631 \u0645\u0633\u062C\u0644. \u0623\u0646\u0634\u0626 \u062D\u0633\u0627\u0628\u064B\u0627 \u062C\u062F\u064A\u062F\u064B\u0627 \u0623\u0648 \u0627\u0633\u062A\u062E\u062F\u0645 \u0628\u0631\u064A\u062F\u064B\u0627 \u0645\u0633\u062C\u0644\u0627\u064B."
        }, 404);
      }
      const resetToken = [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, "0")).join("");
      const expiresAt = new Date(Date.now() + 30 * 60 * 1e3).toISOString();
      await db.setResetToken(user, resetToken, expiresAt);
      const resetLink = `${appUrl}/reset-password?token=${resetToken}`;
      const emailResult = await sendEmail(env2, {
        to: normalizedEmail,
        subject: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 | Hajzy Password Reset",
        html: resetEmailHtml(resetLink)
      });
      if (!emailResult.ok) {
        console.error(`Password reset email failed for ${normalizedEmail}:`, emailResult.message);
        return json({
          ok: false,
          emailSent: false,
          message: "\u062A\u0639\u0630\u0631 \u0625\u0631\u0633\u0627\u0644 \u0631\u0633\u0627\u0644\u0629 \u0627\u0644\u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u062D\u0627\u0644\u064A\u0627\u064B. \u062A\u062D\u0642\u0642 \u0645\u0646 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0628\u0631\u064A\u062F \u0641\u064A \u0627\u0644\u062E\u0627\u062F\u0645 \u062B\u0645 \u0623\u0639\u062F \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629."
        }, 503);
      }
      return json({
        ok: true,
        emailSent: true,
        message: "\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0631\u0627\u0628\u0637 \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0625\u0644\u0649 \u0628\u0631\u064A\u062F\u0643 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0628\u0646\u062C\u0627\u062D."
      });
    }
    if (path === "/api/auth/reset-password" && request.method === "POST") {
      const { token, newPassword } = await readBody(request);
      if (!token || !newPassword) return json({ message: "Token and new password are required." }, 400);
      if (newPassword.length < 8) return json({ message: "New password must be at least 8 characters long." }, 400);
      const user = await db.getByResetToken(token);
      if (!user) return json({ message: "Invalid or expired password reset token." }, 400);
      user.passwordHash = await hashPassword(newPassword);
      await db.save(user);
      await db.clearResetToken(token);
      return json({ message: "Password reset successfully." });
    }
    if (path === "/api/auth/verify-email" && request.method === "POST") {
      const { token } = await readBody(request);
      if (!token) return json({ message: "Verification token is required." }, 400);
      const user = await db.getByVerificationToken(token);
      if (!user) return json({ message: "Invalid or expired verification token." }, 400);
      user.emailVerified = true;
      await db.save(user);
      await db.clearVerificationToken(token);
      return json({ message: "Email verified successfully." });
    }
    if (path === "/api/payments/paymob/session" && request.method === "POST") {
      let payload;
      try {
        payload = await verifyJwt(bearer(request), jwtSecret);
      } catch {
        return json({ message: "Please sign in before starting a payment." }, 401);
      }
      const user = await db.getById(payload.userId);
      if (!user) return json({ message: "User not found." }, 404);
      const { amount, currency, propertyTitle, paymentMethod } = await readBody(request);
      if (String(currency || "EGP").toUpperCase() !== "EGP") {
        return json({ message: "Paymob checkout currently supports EGP only." }, 400);
      }
      if (paymentMethod && paymentMethod !== "card") {
        return json({ message: "This Paymob integration is configured for card payments only." }, 400);
      }
      try {
        const session = await createPaymobCheckout(env2, {
          amount,
          currency: "EGP",
          title: String(propertyTitle || "Hajzy booking").slice(0, 120),
          user
        });
        return json(session, 201);
      } catch (error3) {
        console.error("Paymob session creation failed:", error3.message || String(error3));
        return json({ message: "\u062A\u0639\u0630\u0631 \u062A\u062C\u0647\u064A\u0632 \u062C\u0644\u0633\u0629 \u0627\u0644\u062F\u0641\u0639. \u062A\u062D\u0642\u0642 \u0645\u0646 \u0625\u0639\u062F\u0627\u062F\u0627\u062A Paymob \u062B\u0645 \u0623\u0639\u062F \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629." }, 502);
      }
    }
    const needsAuth = path === "/api/auth/me" || path === "/api/auth/change-password";
    if (needsAuth) {
      let payload;
      try {
        payload = await verifyJwt(bearer(request), jwtSecret);
      } catch {
        return json({ message: "Invalid or expired token." }, 401);
      }
      const user = await db.getById(payload.userId);
      if (!user) return json({ message: "User not found." }, 404);
      if (path === "/api/auth/me" && request.method === "GET") {
        return json({ user: publicUser(user) });
      }
      if (path === "/api/auth/me" && request.method === "PATCH") {
        const { fullName, email, avatar_url } = await readBody(request);
        if (fullName) user.fullName = String(fullName).trim();
        if (avatar_url) user.avatarUrl = String(avatar_url).trim();
        if (email) {
          if (!isValidEmail(email)) return json({ message: "Please provide a valid email address." }, 400);
          const normalized = String(email).trim().toLowerCase();
          const existing = await db.getByEmail(normalized);
          if (existing && existing.id !== user.id) return json({ message: "Another account with this email already exists." }, 409);
          user.email = normalized;
        }
        await db.save(user);
        return json({ message: "Profile updated successfully.", user: publicUser(user) });
      }
      if (path === "/api/auth/change-password" && request.method === "POST") {
        const { currentPassword, newPassword } = await readBody(request);
        if (!currentPassword || !newPassword) return json({ message: "currentPassword and newPassword are required." }, 400);
        if (newPassword.length < 8) return json({ message: "New password must be at least 8 characters long." }, 400);
        if (!await verifyPassword(currentPassword, user.passwordHash)) {
          return json({ message: "Current password is incorrect." }, 401);
        }
        user.passwordHash = await hashPassword(newPassword);
        await db.save(user);
        return json({ message: "Password changed successfully." });
      }
    }
    return json({ message: "Not found." }, 404);
  } catch (error3) {
    console.error("Pages API error:", error3);
    return json({ message: "Unable to process the request right now.", error: error3.message }, 500);
  }
}
__name(onRequest, "onRequest");

// ../.wrangler/tmp/pages-QlRqwu/functionsRoutes-0.4359722362431181.mjs
var routes = [
  {
    routePath: "/api/:path*",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  }
];

// ../node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count3 = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count3--;
          if (count3 === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count3++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count3)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env2, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context2 = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env: env2,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context2);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env2["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error3) {
      if (isFailOpen) {
        const response = await env2["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error3;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};
