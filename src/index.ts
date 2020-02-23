
import { ExecException } from 'child_process';
import * as os from 'os';

export interface Ifaces {
    [index: string]: os.NetworkInterfaceInfo[];
}
var _getMacAddress;
export class MacAddress {

    public constructor () {
        switch (os.platform()) {

            case 'win32':
                _getMacAddress = require('./lib/windows').window;
                break;

            case 'linux':
                _getMacAddress = require('./lib/linux').linux;
                break;

            case 'darwin':
            case 'sunos':
            case 'freebsd':
                _getMacAddress = require('./lib/unix').unix;
                break;

            default:
                console.warn("node-macaddress: Unknown os.platform(), defaulting to 'unix'.");
                _getMacAddress = require('./lib/unix').unix;
                break;

        }

        this.parallel = this.parallel.bind(this);
        this.networkInterfaces = this.networkInterfaces.bind(this);
        this.allCallback = this.allCallback.bind(this);
        this.oneCallBack = this.oneCallBack.bind(this);
        this.allAsync = this.allAsync.bind(this);
        this.oneAsync = this.oneAsync.bind(this);
    }

    public allAsync (): Promise<Ifaces> {
        return new Promise((resolve, reject) => {
            return this.allCallback((err, res: Ifaces) =>{
                if (err) {
                    return reject(err);
                }

                return resolve(res);
            })
        })
    }

    public oneAsync (iface: string): Promise<Ifaces> {
        return new Promise((resolve, reject) => {
            return this.oneCallBack(iface, (err, res) => {
                if (err) {
                    return reject(err)
                }

                return resolve(res);
            })
        })
    }

    private parallel(tasks: CallableFunction[], done: CallableFunction) {
        var results = [];
        var errs = [];
        var length = 0;
        var doneLength = 0;
        function doneIt(ix, err, result) {
            if (err) {
                errs[ix] = err;
            } else {
                results[ix] = result;
            }
            doneLength += 1;
            if (doneLength >= length) {
                done(errs.length > 0 ? errs : errs, results);
            }
        }
        Object.keys(tasks).forEach(function (key: string) {
            length += 1;
            var task: CallableFunction = tasks[key];
            (process.nextTick || global.setImmediate || global.setTimeout)(function () {
                task(doneIt.bind(null, key)(key), 1);
            });
        });
    }

    public networkInterfaces(): os.NetworkInterfaceInfo {
        var allAddresses = {};

        try {
            var ifaces: Ifaces = os.networkInterfaces();
        } catch (e) {
            // At October 2016 WSL does not support os.networkInterfaces() and throws
            // Return empty object as if no interfaces were found
            // https://github.com/Microsoft/BashOnWindows/issues/468
            if (e.syscall === 'uv_interface_addresses') {
                return (allAddresses) as os.NetworkInterfaceInfo;
            } else {
                throw e;
            };
        };


        Object.keys(ifaces).forEach(function (iface) {
            var addresses:any = {};
            var hasAddresses = false;
            ifaces[iface].forEach(function (address: os.NetworkInterfaceInfo) {
                if (!address.internal) {
                    addresses[(address.family || "").toLowerCase()] = address.address;
                    hasAddresses = true;
                    if (address.mac) {
                        addresses.mac = address.mac;
                    }
                }
            });
            if (hasAddresses) {
                allAddresses[iface] = addresses;
            }
        });

        return (allAddresses) as os.NetworkInterfaceInfo;
    };
    public allCallback(callback: CallableFunction) {

        var ifaces: os.NetworkInterfaceInfo = this.networkInterfaces();
        var resolve ={};

        Object.keys(ifaces).forEach(function (iface) {
            if (!ifaces[iface].mac) {
                resolve[iface] = _getMacAddress.bind(null, iface);
            }
        });

        if (Object.keys(resolve).length === 0) {
            if (typeof callback === 'function') {
                process.nextTick(function () {
                    callback(null, ifaces);
                });
            }
            return ifaces;
        }

        this.parallel((resolve) as CallableFunction[], function (err, result) {
            Object.keys(result).forEach(function (iface) {
                ifaces[iface].mac = result[iface];
            });
            if (typeof callback === 'function') {
                callback(null, ifaces);
            }
        });
        return null;
    };

    public oneCallBack (iface: string, callback: (err: ExecException | null, res)=>void) {
        if (typeof iface === 'function') {
            callback = iface;

            var ifaces = this.networkInterfaces();
            var alleged = ['eth0', 'eth1', 'en0', 'en1'];
            iface = Object.keys(ifaces)[0];
            for (var i = 0; i < alleged.length; i++) {
                if (ifaces[alleged[i]]) {
                    iface = alleged[i];
                    break;
                }
            }
            if (!ifaces[iface]) {
                if (typeof callback === 'function') {
                    process.nextTick(function () {
                        callback(new Error("no interfaces found"), null);
                    });
                }
                return null;
            }
            if (ifaces[iface].mac) {
                if (typeof callback === 'function') {
                    process.nextTick(function () {
                        callback(null, ifaces[iface].mac);
                    });
                }
                return ifaces[iface].mac;
            }
        }
        if (typeof callback === 'function') {
            _getMacAddress(iface, callback);
        }

        return null;
    };
}
